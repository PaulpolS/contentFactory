#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Spec 04: GitHub Discovery and Trending Scraper
Crawles GitHub trending or search results matching 5 modes, scrapes READMEs,
extracts GIF demo links, generates engaging clickbaits and threads using AI
or high-fidelity simulated models, and persists records in SQLite.
"""

import os
import sys
import sqlite3
import json
import time
import argparse
import hashlib
import logging
import random
import re
from datetime import datetime, timedelta
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

def setup_github_logging():
    logger = logging.getLogger("DiscoveryGitHub")
    logger.setLevel(logging.DEBUG)
    if logger.hasHandlers():
        logger.handlers.clear()
        
    formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    return logger

logger = setup_github_logging()

# MOCK GitHub repositories for simulation fallbacks
MOCK_REPOS = [
    {
        "name": "AutoDevStudio",
        "owner": "dev-factory",
        "description": "An autonomous AI software developer that reads specs, resolves dependencies, and writes beautiful React + FastAPI apps.",
        "stars": 12400,
        "forks": 1820,
        "readme": """# AutoDevStudio 🤖💻
Autonomous AI Agent that writes complete software products.

![Demo](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3BvZ2ZiaTBwdWNtNnNzZG9tZmt3OXFvMDd6OHR6bzdzcGtrMmg2ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/3o7TKSjRrfIPjei1fG/giphy.gif)

## Features
- Dynamic spec parsing
- Multimodal canvas rendering
- Self-debugging and linting

[![Status](https://img.shields.io/badge/status-active-green.svg)](https://github.com/dev-factory/AutoDevStudio)
""",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/png?seed=dev-factory"
    },
    {
        "name": "FastVisionLLM",
        "owner": "vision-labs",
        "description": "Real-time edge vision transformer running at 120 FPS on standard consumer devices.",
        "stars": 8500,
        "forks": 940,
        "readme": """# FastVisionLLM 👁️⚡
Ultra-fast edge vision model for autonomous robotics.

<img src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNmtpZzdidW13NmthbzRoZmtkcWRtM2E5NXo2dDJibzF4N3ZqN2g1ZyZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/26tn33aiTi1jkl6H6/giphy.gif" width="400" />

## Getting Started
`pip install fastvision`
""",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/png?seed=vision-labs"
    },
    {
        "name": "AgentFlow-Orchestrator",
        "owner": "agentic-ops",
        "description": "Visual orchestration builder for complex multi-agent workflows with built-in state management.",
        "stars": 15600,
        "forks": 2300,
        "readme": """# AgentFlow-Orchestrator 🌐🔗
No-code and code-first orchestration for multi-agent systems.

![Interactive Canvas](https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExOTV2c29sZXRiZGgwbms1bm5tNGpxNXIybXFjNGJpdGFoNm44dzBnYiZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/l0IylQy8p59V3Cc8w/giphy.gif)

## Installation
`npm install -g agentflow`
""",
        "avatar_url": "https://api.dicebear.com/7.x/bottts/png?seed=agentic-ops"
    }
]

def extract_gifs_from_readme(readme_text):
    """Scrapes README files and extracts Demo GIF image URLs using Markdown and HTML regex patterns (excluding badges)."""
    gif_urls = []
    if not readme_text:
        return gif_urls
        
    # Pattern 1: Markdown image ![alt](url)
    md_pattern = r'!\[.*?\]\((.*?\.gif\b.*?)\)'
    for url in re.findall(md_pattern, readme_text, re.IGNORECASE):
        # Filter out typical badges
        if not any(badge in url.lower() for badge in ["badge", "shields.io", "github/workflow/status", "travis-ci", "codecov"]):
            gif_urls.append(url.strip())
            
    # Pattern 2: HTML image tag <img src="url"/>
    html_pattern = r'<img\s+[^>]*src=["\']([^"\']+\.gif\b[^"\']*)["\'][^>]*>'
    for url in re.findall(html_pattern, readme_text, re.IGNORECASE):
        if not any(badge in url.lower() for badge in ["badge", "shields.io", "github/workflow/status", "travis-ci", "codecov"]):
            gif_urls.append(url.strip())
            
    return list(set(gif_urls))

def generate_mock_github_thread(repo_name, owner, description, repo_url):
    """Generates realistic simulated clickbaits and thread comments if LLM calls fail."""
    clickbaits = [
        f"🔥 ช็อกวงการซอฟต์แวร์! เปิดตัวสุดยอดโปรเจกต์โอเพนซอร์ส '{repo_name}' ที่จะเปลี่ยนสไตล์การโค้ดของคุณไปตลอดกาล!",
        f"💡 สรุปสั้นๆ ใน 1 นาที! โปรเจกต์ '{repo_name}' ยอดกดดาวพุ่งทะลุทะลวงบน GitHub เพราะมันตอบโจทย์วงการนี้สุดๆ",
        f"🚀 นักพัฒนาห้ามพลาดเด็ดขาด! โคลนด่วน '{repo_name}' ของผู้สร้าง '{owner}' เขียนแอปเร็วขึ้น 10 เท่าตัว!"
    ]
    
    c1 = f"📍 [แนะนำโปรเจกต์ร้อนแรง] มารู้จักกับ {repo_name} พัฒนาโดยผู้ใช้นามว่า {owner}!\n\nนี่คือสุดยอดเครื่องมือที่มีจุดเด่นหลักในเรื่อง '{description}' ออกแบบมาเพื่อให้นำไปประยุกต์ใช้ได้ทันที สตาร์เก็บไว้ด่วน!"
    c2 = f"⚙️ [เบื้องหลังความล้ำคัดมาเน้นๆ] ตัวนี้เลือกใช้สถาปัตยกรรมประสิทธิภาพสูง ออกแบบโครงสร้างสะอาดสะอ้าน ยืดหยุ่น และมีประสิทธิภาพเหนือชั้นกว่าทางเลือกเดิมๆ มากครับ!"
    c3 = f"⚠️ [สรุปกลัวตกขบวน & ลิงก์เก็บพิกัด] ถ้าคุณปล่อยผ่านวันนี้ พรุ่งนี้คุณอาจจะต้องไล่กวดคู่แข่งที่เริ่มใช้ตัวนี้แล้ว แนะนำรีบคลิกดูหน้าหลักและทดสอบใช้งานที่นี่เลยครับ: {repo_url} 🔗⚡"
    
    return clickbaits, [c1, c2, c3]

def run_openrouter_evaluation(api_key, model, repo_name, owner, description, repo_url, llm_provider="openrouter"):
    """Calls OpenRouter or Kie.ai chat completions to generate Thai clickbait titles and thread structure."""
    if llm_provider == "kie":
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
    
    prompt = f"""
    You are an expert tech writer and viral copywriter for Thai tech community pages (like Twitter/X or Facebook threads).
    Analyze this GitHub repository:
    Name: {repo_name}
    Owner: {owner}
    Description: {description}
    URL: {repo_url}

    Produce a response that is a VALID, parsable JSON object EXACTLY containing the following structure:
    {{
      "clickbait_titles": [
        "Thai clickbait alternative 1 (Highly engaging and viral)",
        "Thai clickbait alternative 2",
        "Thai clickbait alternative 3"
      ],
      "thread_comments": [
        "comment_1: Thai introduction to the repo and main benefits (engaging)",
        "comment_2: Thai details explaining tech details, design, or architecture",
        "comment_3: Thai FOMO summary with repository URL: {repo_url}"
      ]
    }}

    Do not include any markdown backticks ```json ... ``` or additional explanations. Return only the JSON string.
    """
    
    payload = {
        "model": model,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5
    }
    
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=20)
        if res.status_code in [401, 403]:
            raise PermissionError(f"OpenRouter unauthorized: {res.text}")
        if res.status_code != 200:
            raise Exception(f"OpenRouter returned HTTP {res.status_code}: {res.text}")
            
        data = res.json()
        content = data["choices"][0]["message"]["content"].strip()
        
        # Clean markdown wrappers
        if content.startswith("```"):
            lines = content.split("\n")
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                content = "\n".join(lines[1:-1]).strip()
                
        eval_obj = json.loads(content)
        clickbait_titles = eval_obj.get("clickbait_titles", [])
        thread_comments = eval_obj.get("thread_comments", [])
        
        if len(clickbait_titles) < 3 or len(thread_comments) < 3:
            raise Exception("Incomplete JSON output fields from AI.")
            
        return clickbait_titles, thread_comments
    except Exception as e:
        logger.warning(f"OpenRouter call failed using model '{model}': {e}")
        raise e

def scrape_github_real(api_key, mode, query=None, limit=5):
    """Hits GitHub Search API using the active token depending on trend mode."""
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "Mozilla/5.0"
    }
    if api_key and not api_key.startswith("MOCK_"):
        headers["Authorization"] = f"Bearer {api_key}"
        
    # Map trend modes to query details
    # trending, fresh, rising, active, helpWanted
    now = datetime.now()
    two_weeks_ago = (now - timedelta(days=14)).strftime("%Y-%m-%d")
    month_ago = (now - timedelta(days=30)).strftime("%Y-%m-%d")
    
    q = f"topic:{query}" if query else "topic:artificial-intelligence"
    sort = "stars"
    order = "desc"
    
    if mode == "trending":
        q = f"created:>{two_weeks_ago} stars:>50"
        if query:
            q += f" {query}"
        sort = "stars"
    elif mode == "fresh":
        q = f"created:>{month_ago} language:python"
        if query:
            q += f" {query}"
        sort = "created"
    elif mode == "rising":
        q = f"stars:>500 forks:>100 pushed:>{two_weeks_ago}"
        if query:
            q += f" {query}"
        sort = "forks"
    elif mode == "active":
        q = f"pushed:>{two_weeks_ago} language:typescript"
        if query:
            q += f" {query}"
        sort = "updated"
    elif mode == "helpWanted":
        q = 'state:open label:"help wanted" label:"good first issue"'
        if query:
            q += f" {query}"
        sort = "updated"
        
    search_url = f"https://api.github.com/search/repositories?q={requests.utils.quote(q)}&sort={sort}&order={order}&per_page={limit}"
    logger.info(f"GitHub Scraper triggering Search: {search_url}")
    
    try:
        res = requests.get(search_url, headers=headers, timeout=15)
        if res.status_code in [401, 403]:
            logger.warning("GitHub authentication failed.")
            raise PermissionError("GitHub API auth error.")
            
        if res.status_code != 200:
            raise Exception(f"GitHub returned HTTP {res.status_code}: {res.text}")
            
        items = res.json().get("items", [])
        processed = []
        
        for item in items:
            repo_full_name = item["full_name"]
            owner = item["owner"]["login"]
            name = item["name"]
            description = item["description"] or "No description provided."
            stars = item["stargazers_count"]
            forks = item["forks_count"]
            repo_url = item["html_url"]
            avatar_url = item["owner"]["avatar_url"]
            
            # Scrape README.md
            readme_url = f"https://raw.githubusercontent.com/{repo_full_name}/main/README.md"
            readme_text = ""
            try:
                readme_res = requests.get(readme_url, timeout=8)
                if readme_res.status_code == 200:
                    readme_text = readme_res.text
                else:
                    # Try master branch
                    readme_url_alt = f"https://raw.githubusercontent.com/{repo_full_name}/master/README.md"
                    readme_res_alt = requests.get(readme_url_alt, timeout=8)
                    if readme_res_alt.status_code == 200:
                        readme_text = readme_res_alt.text
            except Exception:
                pass
                
            processed.append({
                "name": name,
                "owner": owner,
                "description": description,
                "stars": stars,
                "forks": forks,
                "readme": readme_text,
                "avatar_url": avatar_url,
                "repo_url": repo_url
            })
            
        return processed
    except Exception as e:
        logger.warning(f"Real GitHub Scraper execution failed: {e}")
        raise e

def save_github_to_vault(db_path, repo, clickbaits, comments, gif_urls, mode):
    """Saves curated GitHub repository trends to SQLite database under ready_for_design."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    content_id = f"github_{repo['owner']}_{repo['name']}"
    
    # Structure full raw content with clickbaits + threads
    raw_content = f"Repository Name: {repo['owner']}/{repo['name']}\n"
    raw_content += f"Stars: {repo['stars']} | Forks: {repo['forks']}\n\n"
    raw_content += "Clickbait Alternatives:\n" + "\n".join([f" - {cb}" for cb in clickbaits]) + "\n\n"
    raw_content += "Thread comments:\n"
    raw_content += f"Comment 1:\n{comments[0]}\n\nComment 2:\n{comments[1]}\n\nComment 3:\n{comments[2]}\n"
    
    metadata = {
        "repo_name": repo["name"],
        "owner": repo["owner"],
        "stars": repo["stars"],
        "forks": repo["forks"],
        "mode": mode,
        "clickbait_alternatives": clickbaits,
        "thread_comments": comments,
        "gif_urls": gif_urls
    }
    
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO vault_contents (
                id, source_type, title, selected_headline, raw_content, source_url, 
                author_name, author_avatar_url, author_followers, rating_news, rating_evergreen, 
                metadata_json, media_paths_json, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
        """, (
            content_id,
            "github",
            f"{repo['owner']}/{repo['name']}",
            clickbaits[0], # Default selected_headline to clickbait choice 1
            raw_content,
            repo.get("repo_url") or f"https://github.com/{repo['owner']}/{repo['name']}",
            repo["owner"],
            repo["avatar_url"],
            repo["stars"],
            json.dumps(metadata, ensure_ascii=False),
            json.dumps([]), # no physical media files downloaded
            "ready_for_design",
            now,
            now
        ))
        conn.commit()
        logger.info(f"[SUCCESS] Curated repo '{repo['owner']}/{repo['name']}' saved to SQLite Vault.")
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Failed to save repo {content_id} to DB: {e}")
        conn.close()
        return False

def main():
    parser = argparse.ArgumentParser(description="GitHub Discovery Scraper")
    parser.add_argument("--mode", type=str, choices=["trending", "fresh", "rising", "active", "helpWanted"], default="trending",
                        help="Trends discovery mode: trending, fresh, rising, active, helpWanted (default: trending)")
    parser.add_argument("--github_token", "--github-token", dest="github_token", type=str, default=None, help="Directly override GitHub API Token")
    parser.add_argument("--openrouter_key", "--openrouter-key", dest="openrouter_key", type=str, default=None, help="Directly override OpenRouter API Key")
    parser.add_argument("--llm_provider", "--llm-provider", dest="llm_provider", type=str, default="openrouter", help="AI text provider: openrouter or kie")
    parser.add_argument("--query", type=str, default=None, help="Crawl query topic")
    parser.add_argument("--trend_mode", "--trend-mode", dest="trend_mode", type=str, default=None, help="Crawl trend mode")
    parser.add_argument("--limit", type=int, default=5, help="Number of repositories to fetch")
    args, unknown = parser.parse_known_args()
    
    # 1. Initialize DB and dirs
    initializer = VaultSystemInitializer(vault_root)
    initializer.setup_directories()
    
    db_path = initializer.db_path
    cred_mgr = VaultCredentialManager(db_path, logger)
    
    mode = args.trend_mode if args.trend_mode else args.mode
    logger.info(f"=== GitHub Trend Discovery Scraper Started [Mode: {mode.upper()}] ===")
    
    # 2. Get API credentials
    use_mock_github = False
    github_key = None
    
    if args.github_token and args.github_token.strip():
        github_key = args.github_token.strip()
        logger.info("Using GitHub API key provided via command-line arguments override.")
        use_mock_github = github_key.startswith("MOCK_")
    else:
        try:
            github_key = cred_mgr.get_active_key("github")
            if github_key.startswith("MOCK_"):
                logger.warning("Active GitHub key is a MOCK key. Switching to local mock repository crawl.")
                use_mock_github = True
        except Exception as e:
            logger.warning(f"Could not retrieve GitHub key from credential store: {e}. Switching to mock crawl.")
            use_mock_github = True
        
    use_mock_openrouter = False
    openrouter_key = None
    
    if args.openrouter_key and args.openrouter_key.strip():
        openrouter_key = args.openrouter_key.strip()
        logger.info("Using OpenRouter API key provided via command-line arguments override.")
        use_mock_openrouter = openrouter_key.startswith("MOCK_")
    else:
        try:
            openrouter_key = cred_mgr.get_active_key("openrouter")
            if openrouter_key.startswith("MOCK_"):
                logger.warning("Active OpenRouter key is a MOCK key. Switching to mock Thread/Clickbait generation.")
                use_mock_openrouter = True
        except Exception:
            logger.warning("No OpenRouter key found, switching to mock Thread/Clickbait generation.")
            use_mock_openrouter = True
        
    repos = []
    
    # 3. Main Trend Scraping Execution
    if use_mock_github:
        repos = MOCK_REPOS
    else:
        try:
            repos = scrape_github_real(github_key, mode, query=args.query, limit=args.limit)
        except PermissionError as auth_err:
            logger.warning(f"GitHub API auth failure: {auth_err}. Disabling key and falling back to mock repositories.")
            cred_mgr.report_key_error("github", github_key, str(auth_err))
            repos = MOCK_REPOS
        except Exception:
            repos = MOCK_REPOS
            
    logger.info(f"Retrieved {len(repos)} repositories to process.")
    
    llm_provider = (getattr(args, "llm_provider", None) or "openrouter").strip().lower()
    if llm_provider == "kie":
        # Kie.ai ไม่มีโมเดลสำรองสาย :free
        models_sequence = ["google/gemini-2.5-flash"]
    else:
        models_sequence = [
            "google/gemini-2.5-flash",
            "qwen/qwen-2-7b-instruct:free",
            "google/gemma-2-9b-it:free",
            "meta-llama/llama-3-8b-instruct:free"
        ]
    
    # 4. Process each repository
    for repo in repos:
        repo_url = repo.get("repo_url") or f"https://github.com/{repo['owner']}/{repo['name']}"
        logger.info(f"Processing repository: '{repo['owner']}/{repo['name']}'...")
        
        # 4a. Scrape README details and extract demo GIF URLs
        gif_urls = extract_gifs_from_readme(repo["readme"])
        logger.info(f" - Extracted {len(gif_urls)} GIF demo urls from README.")
        for gu in gif_urls:
            logger.info(f"   -> GIF: {gu}")
            
        # 4b. AI generation of Thai Clickbaits and Threads
        clickbaits = None
        comments = None
        
        if use_mock_openrouter:
            clickbaits, comments = generate_mock_github_thread(repo["name"], repo["owner"], repo["description"], repo_url)
        else:
            # Attempt LLM chain fallback sequence
            key_error_occurred = False
            for model in models_sequence:
                try:
                    logger.info(f" - Asking OpenRouter model '{model}' to write Clickbait Threads...")
                    clickbaits, comments = run_openrouter_evaluation(
                        openrouter_key, model, repo["name"], repo["owner"], repo["description"], repo_url,
                        llm_provider=llm_provider
                    )
                    break # Success! Break out of model loop
                except PermissionError as auth_err:
                    logger.warning(f"OpenRouter Auth error with key: {auth_err}. Deactivating key.")
                    cred_mgr.report_key_error("openrouter", openrouter_key, str(auth_err))
                    key_error_occurred = True
                    break # Break out of sequence immediately to fall back
                except Exception as model_err:
                    logger.warning(f"Model '{model}' failed: {model_err}. Trying next fallback...")
                    continue
                    
            if key_error_occurred or not clickbaits:
                logger.warning("All LLM attempts failed. Switched to high quality simulated mock Thai thread generation.")
                clickbaits, comments = generate_mock_github_thread(repo["name"], repo["owner"], repo["description"], repo_url)
                
        # 5. Persist into SQLite ready_for_design status
        save_github_to_vault(db_path, repo, clickbaits, comments, gif_urls, args.mode)
        
    logger.info("=== GitHub Discovery Trend Scraper Completed Successfully ===")

if __name__ == "__main__":
    main()
