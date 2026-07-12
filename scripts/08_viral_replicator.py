#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Spec 08: AI Viral Replicator Scraper
Processes an uploaded CSV file of viral/successful posts, analyzes key themes,
searches for similar but unique success stories on the web, extracts OG details
(including links and preview images), translates/scores using OpenRouter AI,
and persists results to the SQLite vault under 'replicator' source type.
"""

import os
import sys
import sqlite3
import json
import time
import argparse
import hashlib
import logging
import re
from urllib.parse import urlparse, parse_qs, unquote
import requests

# Resolve vault root dynamically
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
vault_root = os.path.join(parent_dir, "content_vault")

sys.path.append(current_dir)
try:
    from vault_init import VaultSystemInitializer, VaultCredentialManager
except ImportError:
    print("[ERROR] Could not import vault_init.py.")
    sys.exit(1)

def setup_logger():
    logger = logging.getLogger("ViralReplicator")
    logger.setLevel(logging.DEBUG)
    if logger.hasHandlers():
        logger.handlers.clear()
        
    formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    return logger

logger = setup_logger()

# ผู้ให้บริการ AI ด้านข้อความ (ตั้งจาก --llm-provider): openrouter หรือ kie
LLM_PROVIDER = "openrouter"

def call_openrouter(api_key, model, prompt):
    """Hits OpenRouter or Kie.ai chat completions using prompt-driven AI logic."""
    if LLM_PROVIDER == "kie":
        # Kie.ai ใช้ endpoint แยกตามโมเดล และไม่มี vendor prefix
        model = model.split("/")[-1]
        url = f"https://api.kie.ai/{model}/v1/chat/completions"
    else:
        url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "HTTP-Referer": "https://github.com/ContentFactory",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.3
    }
    
    res = requests.post(url, json=payload, headers=headers, timeout=20)
    if res.status_code == 401 or res.status_code == 403:
        raise PermissionError(f"OpenRouter unauthorized: {res.text}")
    if res.status_code != 200:
        raise Exception(f"OpenRouter returned HTTP {res.status_code}: {res.text}")
        
    data = res.json()
    content = data["choices"][0]["message"]["content"].strip()
    
    # Clean potential markdown wrapping if returned
    if content.startswith("```"):
        lines = content.split("\n")
        if lines[0].startswith("```json") or lines[0].startswith("```"):
            content = "\n".join(lines[1:-1]).strip()
            
    return content

def generate_search_queries(api_key, posts_samples):
    """Asks AI to analyze themes in CSV posts and generate DuckDuckGo search queries."""
    samples_str = "\n---\n".join([f"Post: {p}" for p in posts_samples[:10]])
    
    prompt = f"""
You are an expert content researcher. Below are some examples of highly-shared success stories and viral posts from a CSV file:
{samples_str}

Analyze their core themes (e.g. overcoming bankruptcies, startup founders, unique business models, life transformations).
Generate a JSON array of 3 to 5 Google search queries (can be in English or Thai) that would help find similar but distinct success stories or entrepreneurship articles. 
CRITICAL: Exclude any names of the specific people, brands, or companies mentioned in the examples above so that we find new, unique stories. For example, do not include "Steve Jobs" or "KFC" if they are in the samples.

Produce a response that is a VALID, parsable JSON array of strings, like this:
[
  "inspiring business success story entrepreneur",
  "ประวัตินักธุรกิจ สู้ชีวิต พันล้าน",
  "turnaround business failure story"
]
Do not include any explanation or markdown tags. Just output the raw JSON string.
"""
    
    models_sequence = [
        "google/gemini-2.5-flash",
        "qwen/qwen-2-7b-instruct:free",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3-8b-instruct:free"
    ]
    
    for model in models_sequence:
        try:
            logger.info(f"Sending request to AI model: {model}...")
            res_content = call_openrouter(api_key, model, prompt)
            queries = json.loads(res_content)
            if isinstance(queries, list) and len(queries) > 0:
                logger.info(f"[SUCCESS] AI generated {len(queries)} success-related search queries:")
                for idx, q in enumerate(queries):
                    logger.info(f"  └─ Query {idx + 1}: '{q}'")
                return queries
        except Exception as e:
            logger.warning(f"Failed query generation using {model}: {e}")
            continue
            
    # Mock fallback queries in case of API failure
    logger.warning("Falling back to default success story search queries due to LLM failures.")
    return [
        "inspiring business success story entrepreneur",
        "ประวัตินักธุรกิจ พลิกชีวิตจากติดลบ",
        "inspiring startup success stories",
        "overcoming bankruptcy business success story"
    ]

def scrape_duckduckgo_results(query):
    """Executes a search query on DuckDuckGo HTML and parses titles, links, and snippets."""
    logger.info(f"Searching DuckDuckGo for: '{query}'")
    url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=12)
        if res.status_code != 200:
            logger.warning(f"DuckDuckGo returned HTTP {res.status_code}")
            return []
            
        # Parse blocks
        blocks = re.findall(r'<div class="links_main[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>', res.text)
        logger.info(f"Found {len(blocks)} search result blocks on page.")
        
        results = []
        for block in blocks:
            # Extract link & title
            a_match = re.search(r'<a rel="nofollow" class="result__a" href="([^"]+)">([\s\S]*?)<\/a>', block)
            if not a_match:
                continue
                
            raw_href = a_match.group(1)
            title = re.sub(r'<[^>]+>', '', a_match.group(2)).strip()
            
            # Extract snippet
            snippet_match = re.search(r'<a class="result__snippet" href="[^"]+">([\s\S]*?)<\/a>', block)
            snippet = re.sub(r'<[^>]+>', '', snippet_match.group(1)).strip() if snippet_match else ""
            
            # Parse actual URL from DuckDuckGo wrapper
            parsed = urlparse(raw_href)
            queries = parse_qs(parsed.query)
            if 'uddg' in queries:
                actual_url = unquote(queries['uddg'][0])
            else:
                if raw_href.startswith('//'):
                    actual_url = 'https:' + raw_href
                else:
                    actual_url = raw_href
                    
            logger.info(f"  ├─ Discovered URL: {actual_url[:75]}... | Title: \"{title[:45]}...\"")
            results.append({
                "title": title,
                "url": actual_url,
                "snippet": snippet
            })
            
        return results
    except Exception as e:
        logger.error(f"Failed DuckDuckGo scraping for '{query}': {e}")
        return []

def extract_meta_tags(url):
    """Fetches a webpage and parses Open Graph meta tags (title, description, image)."""
    logger.info(f"Extracting metadata from: {url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    try:
        res = requests.get(url, headers=headers, timeout=10)
        if res.status_code != 200:
            logger.warning(f"Failed to fetch {url}, HTTP {res.status_code}")
            return None
            
        html = res.text
        
        # Meta tag regex extraction
        def find_meta(pattern_list):
            for pattern in pattern_list:
                match = re.search(pattern, html, re.IGNORECASE)
                if match:
                    return unquote(match.group(1)).strip()
            return None
            
        og_title = find_meta([
            r'property="og:title"\s+content="([^"]+)"',
            r'content="([^"]+)"\s+property="og:title"',
            r'<title[^>]*>([\s\S]*?)<\/title>'
        ])
        
        og_desc = find_meta([
            r'property="og:description"\s+content="([^"]+)"',
            r'content="([^"]+)"\s+property="og:description"',
            r'name="description"\s+content="([^"]+)"',
            r'content="([^"]+)"\s+name="description"'
        ])
        
        og_image = find_meta([
            r'property="og:image"\s+content="([^"]+)"',
            r'content="([^"]+)"\s+property="og:image"',
            r'name="twitter:image"\s+content="([^"]+)"'
        ])
        
        # Strip HTML comments/tags if title matches had them
        if og_title:
            og_title = re.sub(r'<[^>]+>', '', og_title).strip()
            
        logger.info(f"  ├─ Web Scraped Metadata:")
        logger.info(f"  │  ├─ HTTP Status: {res.status_code}")
        logger.info(f"  │  ├─ Title: \"{og_title[:60]}...\"")
        logger.info(f"  │  ├─ Description: \"{(og_desc or '')[:70]}...\"")
        logger.info(f"  │  └─ Cover Image URL: {og_image}")
        
        return {
            "title": og_title or "",
            "description": og_desc or "",
            "image_url": og_image or ""
        }
    except Exception as e:
        logger.error(f"Failed to extract metadata from {url}: {e}")
        return None

def download_image(img_url, file_hash):
    """Downloads an external image to content_vault/downloaded_media and returns its relative path."""
    if not img_url:
        return ""
        
    media_dir = os.path.join(vault_root, "downloaded_media")
    if not os.path.exists(media_dir):
        os.makedirs(media_dir, exist_ok=True)
        
    ext = ".jpg"
    if ".png" in img_url.lower():
        ext = ".png"
    elif ".webp" in img_url.lower():
        ext = ".webp"
        
    filename = f"img_replicator_{file_hash}{ext}"
    local_path = os.path.join(media_dir, filename)
    rel_path = f"downloaded_media/{filename}"
    
    try:
        logger.info(f"Downloading cover image: {img_url} -> {rel_path}")
        res = requests.get(img_url, timeout=10, headers={"User-Agent": "Mozilla/5.0"})
        if res.status_code == 200:
            with open(local_path, "wb") as f:
                f.write(res.content)
            logger.info(f"Cover image download succeeded. File size: {len(res.content)} bytes.")
            return rel_path
    except Exception as e:
        logger.warning(f"Failed to download image {img_url}: {e}")
        
    return ""

def evaluate_and_generate_replicate_story(api_key, original_posts, new_story):
    """Calls OpenRouter to evaluate if the story is a duplicate, rate it, and translate/re-write it in Thai."""
    samples_summary = "\n---\n".join([p[:200] for p in original_posts[:5]])
    
    prompt = f"""
You are an expert Thai copywriter and viral editor.
We are verifying if this newly found success story article is a good addition to our catalog.
Here are the existing viral posts/topics we already have:
{samples_summary}

Here is the new article details we found:
Title: {new_story['title']}
Description: {new_story['description']}
URL: {new_story['url']}

Tasks:
1. Check if this new story is a DUPLICATE of our existing topics (covers the exact same person/case).
2. Rate the story's news timeliness (news_score, 1-10) and evergreen relevance (evergreen_score, 1-10).
3. Translate and rewrite it into a highly engaging, clickbait-free, viral Thai headline (thai_headline).
4. Write a detailed summary of the success story in Thai (thai_summary) explaining the founder/subject's journey, failure, and how they succeeded (2-3 paragraphs, inspiring tone).
5. Generate 2 to 4 category tags (tags) in English (e.g. ["Business", "Success", "Overcoming Obstacles"]).

Produce a response that is a VALID, parsable JSON object containing EXACTLY this structure:
{{
  "is_duplicate": false, // boolean
  "news_score": 6, // integer 1-10
  "evergreen_score": 9, // integer 1-10
  "thai_headline": "พาดหัวที่จับใจคน...",
  "thai_summary": "พนักงานประจำเงินเดือนน้อย ตัดสินใจสู้ชีวิต...",
  "tags": ["Business", "Startup"]
}}

Do not include any markdown styling like ```json. Just return the raw JSON object.
"""
    
    models_sequence = [
        "google/gemini-2.5-flash",
        "qwen/qwen-2-7b-instruct:free",
        "google/gemma-2-9b-it:free",
        "meta-llama/llama-3-8b-instruct:free"
    ]
    
    for model in models_sequence:
        try:
            logger.info(f" - Evaluating story with model: {model}")
            res_content = call_openrouter(api_key, model, prompt)
            eval_data = json.loads(res_content)
            if isinstance(eval_data, dict):
                return eval_data
        except Exception as e:
            logger.warning(f"Failed evaluation using {model}: {e}")
            continue
            
    # Mock fallback evaluation
    logger.warning("Using local mock evaluation fallback for story.")
    return {
        "is_duplicate": False,
        "news_score": 7,
        "evergreen_score": 8,
        "thai_headline": f"สู้ชีวิต! เจาะลึกเส้นทางความสำเร็จของ '{new_story['title'][:40]}'",
        "thai_summary": f"ถอดบทเรียนเรื่องราวที่น่าสนใจเกี่ยวกับ '{new_story['title']}'. {new_story['description'][:300]}",
        "tags": ["Business", "Success"]
    }

def save_to_vault(db_path, new_story, evaluation, local_image_path):
    """Saves the approved replicate article to the SQLite database under 'replicator' source type."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime_now_iso = time.strftime('%Y-%m-%dT%H:%M:%S')
    content_id = hashlib.md5(new_story["url"].encode('utf-8')).hexdigest()
    
    # Extract domain name as author name
    domain = urlparse(new_story["url"]).netloc
    if domain.startswith("www."):
        domain = domain[4:]
        
    metadata = {
        "published_date": now,
        "original_title": new_story["title"],
        "tags": evaluation.get("tags", ["Success"])
    }
    
    media_paths = [local_image_path] if local_image_path else []
    
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO vault_contents (
                id, source_type, title, selected_headline, raw_content, source_url, 
                author_name, author_avatar_url, author_followers, rating_news, rating_evergreen, 
                metadata_json, media_paths_json, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?)
        """, (
            content_id,
            "replicator",
            new_story["title"],
            evaluation["thai_headline"],
            evaluation["thai_summary"],
            new_story["url"],
            domain,
            f"https://api.dicebear.com/7.x/initials/png?seed={domain}",
            evaluation.get("news_score", 7),
            evaluation.get("evergreen_score", 8),
            json.dumps(metadata, ensure_ascii=False),
            json.dumps(media_paths, ensure_ascii=False),
            "scraped",  # Set to scraped status so it appears in the replicator panel
            now,
            now
        ))
        conn.commit()
        logger.info(f"[SUCCESS] Saved replicated story: '{evaluation['thai_headline']}' (Source: {domain})")
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Failed to save replicated story {content_id} to DB: {e}")
        conn.close()
        return False

def parse_csv_file(csv_path):
    """Parses the CSV file dynamically, trying to find the column containing content/text."""
    import csv
    if not os.path.exists(csv_path):
        logger.error(f"CSV file not found: {csv_path}")
        return []
        
    try:
        posts = []
        with open(csv_path, mode='r', encoding='utf-8-sig') as f:
            reader = csv.reader(f)
            headers = next(reader, None)
            if not headers:
                return []
                
            # Find the best content column
            content_indices = []
            for idx, h in enumerate(headers):
                h_lower = h.lower()
                if any(k in h_lower for k in ['content', 'text', 'caption', 'body', 'description', 'บทความ', 'โพส', 'รายละเอียด']):
                    content_indices.append(idx)
                    
            rows = list(reader)
            if not rows:
                return []
                
            # Fallback if no specific column matched
            if not content_indices:
                # Find column with the longest average length
                avg_lens = []
                for col_idx in range(len(headers)):
                    lens = []
                    for row in rows:
                        if col_idx < len(row):
                            lens.append(len(row[col_idx]))
                    avg_lens.append((sum(lens) / len(lens) if lens else 0, col_idx))
                avg_lens.sort(reverse=True)
                content_idx = avg_lens[0][1]
            else:
                content_idx = content_indices[0]
                
            logger.info(f"CSV Parsing: Selected column index {content_idx} ('{headers[content_idx]}') for content.")
            logger.info(f"CSV Columns found: {headers}")
            
            for row in rows:
                if content_idx < len(row) and row[content_idx].strip():
                    posts.append(row[content_idx].strip())
                    
            if posts:
                logger.info(f"  ├─ Row 1 Sample Content: \"{posts[0][:100]}...\"")
                if len(posts) > 1:
                    logger.info(f"  └─ Row 2 Sample Content: \"{posts[1][:100]}...\"")
            return posts
    except Exception as e:
        logger.error(f"Error parsing CSV file {csv_path}: {e}")
        return []

def main():
    parser = argparse.ArgumentParser(description="AI Viral Replicator Search")
    parser.add_argument("--csv_path", "--csv-path", dest="csv_path", type=str, required=True,
                        help="Path to the uploaded CSV file containing viral stories")
    parser.add_argument("--limit", type=int, default=5, help="Number of new stories to find and evaluate")
    parser.add_argument("--openrouter_key", "--openrouter-key", dest="openrouter_key", type=str, default=None,
                        help="Directly override OpenRouter API Key")
    parser.add_argument("--llm_provider", "--llm-provider", dest="llm_provider", type=str, default="openrouter",
                        help="AI text provider: openrouter or kie")

    args, unknown = parser.parse_known_args()

    global LLM_PROVIDER
    LLM_PROVIDER = (args.llm_provider or "openrouter").strip().lower()
    
    logger.info("=== AI Viral Replicator Scraper Started ===")
    
    # 1. Initialize DB and credentials
    initializer = VaultSystemInitializer(vault_root)
    initializer.setup_directories()
    db_path = initializer.db_path
    cred_mgr = VaultCredentialManager(db_path, logger)
    
    # 2. Resolve OpenRouter Key
    openrouter_key = None
    use_mock_eval = False
    
    if args.openrouter_key and args.openrouter_key.strip():
        openrouter_key = args.openrouter_key.strip()
        logger.info("Using OpenRouter key override from arguments.")
    else:
        try:
            openrouter_key = cred_mgr.get_active_key("openrouter")
        except Exception as e:
            logger.warning(f"Could not load OpenRouter key from DB: {e}")
            
    if not openrouter_key or openrouter_key.startswith("MOCK_"):
        logger.warning("Active OpenRouter key is missing or simulated. Falling back to local simulated mock AI.")
        use_mock_eval = True
        
    # 3. Parse CSV file
    posts_samples = parse_csv_file(args.csv_path)
    if not posts_samples:
        logger.error("No valid post content extracted from CSV. Exiting.")
        sys.exit(1)
        
    logger.info(f"Successfully loaded {len(posts_samples)} sample posts from CSV.")
    
    # 4. Generate search queries
    search_queries = []
    if use_mock_eval:
        logger.info("Mock Mode: Using fallback search queries.")
        search_queries = [
            "inspiring business success story entrepreneur",
            "ประวัตินักธุรกิจ พลิกชีวิตจากติดลบ",
            "startup founder overcomes obstacles"
        ]
    else:
        search_queries = generate_search_queries(openrouter_key, posts_samples)
        
    # 5. Execute search and process results incrementally (smaller chunks)
    saved_count = 0
    processed_urls = set()
    
    # Pre-load existing replicator URLs to avoid duplication check and save API time
    try:
        conn = sqlite3.connect(db_path)
        c = conn.cursor()
        c.execute("SELECT id, source_url FROM vault_contents")
        for row in c.fetchall():
            # Store hash ID and url if exists
            processed_urls.add(row[0]) # hash ID
            if row[1]:
                processed_urls.add(row[1]) # full URL
        conn.close()
        logger.info(f"Loaded database exclusion list ({len(processed_urls)} items) to prevent redundant scanning.")
    except Exception as e:
        logger.warning(f"Could not load exclusion list: {e}")

    for q_idx, query in enumerate(search_queries):
        if saved_count >= args.limit:
            break
            
        logger.info(f"\n[SYSTEM] 🔍 [คำค้นหาที่ {q_idx + 1}/{len(search_queries)}] เริ่มเสิร์ชคีย์เวิร์ด: '{query}'")
        results = scrape_duckduckgo_results(query)
        if not results:
            logger.info("  └─ ไม่พบผลลัพธ์จากคีย์เวิร์ดนี้")
            continue
            
        logger.info(f"  └─ พบบทความน่าสนใจ {len(results)} รายการ. เริ่มวิเคราะห์ทีละเรื่องแบบ Real-Time:")
        
        for r_idx, item in enumerate(results):
            if saved_count >= args.limit:
                break
                
            url = item["url"]
            url_hash = hashlib.md5(url.encode('utf-8')).hexdigest()
            
            if url in processed_urls or url_hash in processed_urls:
                logger.info(f"  ├─ [{r_idx + 1}/{len(results)}] [ข้าม] ตรวจสอบพบว่าซ้ำในฐานข้อมูลอยู่แล้ว: {url[:60]}...")
                continue
                
            processed_urls.add(url)
            processed_urls.add(url_hash)
            
            logger.info(f"\n[SYSTEM] ⏳ [บทความลำดับที่ {saved_count + 1}/{args.limit}] เริ่มประมวลผล: {url[:80]}")
            
            # Extract meta tags
            meta = extract_meta_tags(url)
            if not meta:
                # Fallback to search result details if web request gets blocked
                meta = {
                    "title": item["title"],
                    "description": item["snippet"],
                    "image_url": ""
                }
                
            # Ensure we have some content
            if not meta["title"]:
                meta["title"] = item["title"]
            if not meta["description"]:
                meta["description"] = item["snippet"]
                
            # Evaluate with LLM
            evaluation = None
            if use_mock_eval:
                evaluation = {
                    "is_duplicate": False,
                    "news_score": 7,
                    "evergreen_score": 8,
                    "thai_headline": f"สู้ชีวิต! เจาะประเด็นความสำเร็จ '{meta['title'][:55]}'",
                    "thai_summary": f"ถอดบทเรียนเรื่องราวที่น่าสนใจเกี่ยวกับ {meta['title']}. {meta['description'][:300]}",
                    "tags": ["Business", "Success"]
                }
            else:
                new_story_data = {
                    "title": meta["title"],
                    "description": meta["description"],
                    "url": url
                }
                try:
                    evaluation = evaluate_and_generate_replicate_story(openrouter_key, posts_samples, new_story_data)
                except Exception as eval_err:
                    logger.warning(f"Evaluation failed: {eval_err}. Using mock fallback.")
                    evaluation = {
                        "is_duplicate": False,
                        "news_score": 6,
                        "evergreen_score": 7,
                        "thai_headline": f"สู้ชีวิต! เรื่องราวความสำเร็จของ '{meta['title'][:40]}'",
                        "thai_summary": f"รายละเอียดความสำเร็จของ {meta['title']}. {meta['description'][:300]}",
                        "tags": ["Success"]
                    }
                    
            # Log AI evaluation results in Thai for user readability
            is_dup = evaluation.get('is_duplicate', False)
            logger.info(f"  │  ├─ [ผลการวิเคราะห์จาก AI]:")
            logger.info(f"  │  │  ├─ ตรวจสอบความซ้ำ: {'❌ ซ้ำซ้อน (ปัดตก)' if is_dup else '✅ ผ่าน (ไม่ซ้ำ)'}")
            logger.info(f"  │  │  ├─ คะแนนกระแสข่าว: {evaluation.get('news_score')}/10")
            logger.info(f"  │  │  ├─ คะแนนความอมตะ: {evaluation.get('evergreen_score')}/10")
            logger.info(f"  │  │  ├─ แปลพาดหัวไทย: \"{evaluation.get('thai_headline')}\"")
            logger.info(f"  │  │  └─ หมวดหมู่: {evaluation.get('tags', [])}")
            
            # Skip duplicates or low quality
            if is_dup:
                logger.warning(f"  │  └─ ปฏิเสธการบันทึก: ตรวจพบตัวละครหรือเนื้อหาซ้ำซ้อน")
                continue
                
            news_score = evaluation.get("news_score", 5)
            evergreen_score = evaluation.get("evergreen_score", 5)
            if news_score < 5 and evergreen_score < 5:
                logger.warning(f"  │  └─ ปฏิเสธการบันทึก: คะแนนความน่าสนใจต่ำเกินไป (ข่าว: {news_score}, อมตะ: {evergreen_score})")
                continue
                
            logger.info(f"  │  └─ 👍 AI อนุมัติบทความนี้! เริ่มกระบวนการดาวน์โหลดและบันทึก...")
                
            # Download image locally
            local_img = ""
            if meta["image_url"]:
                local_img = download_image(meta["image_url"], url_hash)
                
            # Save to SQLite database
            story_to_save = {
                "title": meta["title"],
                "url": url
            }
            success = save_to_vault(db_path, story_to_save, evaluation, local_img)
            if success:
                saved_count += 1
                
            # Sleep to avoid rate limit
            time.sleep(2)
            
        # Avoid hammer between searches
        if saved_count < args.limit:
            time.sleep(2)
            
    logger.info(f"\n=== AI Viral Replicator Scraper Finished. Saved {saved_count} new similar success stories to Vault. ===")

if __name__ == "__main__":
    main()
