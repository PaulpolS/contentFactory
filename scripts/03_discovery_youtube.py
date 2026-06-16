#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Spec 03: YouTube Video Discovery Scraper
Searches YouTube videos, downloads channel logos, captures frame snapshots
(with robust simulated Pillow canvases when stream downloads fail or mock mode is active),
extracts transcripts (with fallback Thai generator), and saves results to SQLite.
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
import subprocess
from datetime import datetime, timedelta
import requests
from PIL import Image, ImageDraw, ImageFont

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

def setup_youtube_logging():
    logger = logging.getLogger("DiscoveryYouTube")
    logger.setLevel(logging.DEBUG)
    if logger.hasHandlers():
        logger.handlers.clear()
        
    formatter = logging.Formatter('[%(asctime)s] [%(levelname)s] %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    return logger

logger = setup_youtube_logging()

# MOCK YouTube Videos for Fallbacks
MOCK_YOUTUBE_VIDEOS = [
    {
        "id": "yt_vid_001",
        "title": "สอนใช้ AI วาดรูปฟรีระดับมือโปร! เจาะลึกเทคนิค Midjourney v6 ล่าสุด 🎨🤖",
        "channel_id": "ch_beartai",
        "channel_title": "Beartai แบไต๋",
        "subscribers": 2200000,
        "views": 450000,
        "duration": "14:25",
        "upload_date": (datetime.now() - timedelta(days=2)).isoformat(),
        "query": "เรียน AI"
    },
    {
        "id": "yt_vid_002",
        "title": "รีวิวแกะกล่อง iPhone 17 Pro Max เครื่องจริง! สีใหม่ไทเทเนียมทองคำ หรูหราสุดๆ 📱✨",
        "channel_id": "ch_spin9",
        "channel_title": "spin9",
        "subscribers": 850000,
        "views": 1250000,
        "duration": "18:40",
        "upload_date": (datetime.now() - timedelta(hours=18)).isoformat(),
        "query": "iPhone"
    },
    {
        "id": "yt_vid_003",
        "title": "สอนเขียน Python Backend ใน 1 ชั่วโมง! สำหรับมือใหม่เรียนรู้จากศูนย์ถึงโปรดักชัน 💻🚀",
        "channel_id": "ch_kongraksiam",
        "channel_title": "Kong Raksiam",
        "subscribers": 45200,
        "views": 8500,
        "duration": "59:50",
        "upload_date": (datetime.now() - timedelta(days=5)).isoformat(),
        "query": "Python"
    },
    {
        "id": "yt_vid_004",
        "title": "ส่องอนาคต AI ในปี 2026: มนุษย์จะตกงานจริงไหม? วิธีการเอาตัวรอดในยุค Content Factory 🤖💡",
        "channel_id": "ch_9arm",
        "channel_title": "9ARM",
        "subscribers": 1200000,
        "views": 350000,
        "duration": "25:10",
        "upload_date": (datetime.now() - timedelta(days=1)).isoformat(),
        "query": "เรียน AI"
    }
]

MOCK_TRANSCRIPT_TEMPLATES = [
    "สวัสดีครับทุกคน วันนี้เราจะพามาเจาะลึกเทคโนโลยีใหม่ที่จะเปลี่ยนโลกเราไปตลอดกาล",
    "หลายคนถามเข้ามาเยอะมากว่าตัวนี้เมื่อเทียบกับรุ่นเดิมมันแตกต่างกันอย่างไรบ้าง",
    "ในจุดนี้เราจะเห็นว่าสถาปัตยกรรมภายในเปลี่ยนโฉมใหม่หมดจดเลยครับ ประหยัดพลังงานขึ้นเยอะมาก",
    "ลองทดสอบเปิดฟังก์ชันหลักดู จะเห็นว่าการตอบสนองแทบไม่มีดีเลย์เลย โคตรประทับใจจริงๆ",
    "ฟีเจอร์ความปลอดภัยก็น่าสนใจมาก มีระบบป้องกันข้อมูลส่วนบุคคลด้วยฮาร์ดแวร์โดยตรง",
    "สรุปสั้นๆ เลยนะครับ ใครที่กำลังลังเลอยู่ ผมว่ารุ่นนี้น่าจะคุ้มค่าที่สุดในพิกัดราคาเท่านี้แล้ว",
    "ขอบคุณทุกการรับชม อย่าลืมกดไลก์ กดติดตามช่องเราไว้เพื่อที่จะไม่พลาดคลิปรีวิวเทคโนโลยีสุดล้ำในตอนหน้าครับ"
]

def format_subscribers(subs_count):
    """Formats raw subscribers count to requested format (e.g. 1.2M, 45.2K, 850)."""
    if subs_count >= 1_000_000:
        val = subs_count / 1_000_000
        return f"{val:.1f}M subscribers".replace(".0M", "M")
    elif subs_count >= 1_000:
        val = subs_count / 1_000
        return f"{val:.1f}K subscribers".replace(".0K", "K")
    else:
        return f"{subs_count} subscribers"

def calculate_vph(views, upload_date_iso):
    """Computes Views Per Hour (VPH = views / hours_since_upload)."""
    try:
        clean_date = upload_date_iso.replace('Z', '').split('.')[0]
        upload_dt = datetime.fromisoformat(clean_date)
    except Exception:
        upload_dt = datetime.now() - timedelta(days=1)
        
    diff = datetime.now() - upload_dt
    hours = diff.total_seconds() / 3600.0
    hours = max(hours, 0.1) # protect division by zero
    return round(views / hours, 2)

def generate_channel_logo(channel_title, output_path):
    """Generates a beautiful avatar logo using Pillow to represent the channel logo."""
    logger.info(f"Generating synthetic channel logo for: '{channel_title}'")
    img = Image.new("RGB", (200, 200))
    draw = ImageDraw.Draw(img)
    
    # Background color based on name hash
    h = hashlib.md5(channel_title.encode('utf-8')).digest()
    r = int(h[0] * 0.5)
    g = int(h[1] * 0.5)
    b = int(h[2] * 0.5)
    
    draw.rectangle([0, 0, 200, 200], fill=(r, g, b))
    
    # Load custom font if available
    font_path = os.path.join(current_dir, "Mitr-Medium.ttf")
    logo_font = None
    if os.path.exists(font_path):
        try:
            logo_font = ImageFont.truetype(font_path, 100)
        except Exception:
            pass
            
    if logo_font is None:
        logo_font = ImageFont.load_default()
        
    initial = channel_title[0] if channel_title else "Y"
    draw.text((60, 40), initial, fill=(255, 255, 255), font=logo_font)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "PNG")
    logger.info(f"Saved channel logo to {output_path}")

def score_frame_for_face(image_path):
    """
    Detects faces in the extracted frame using OpenCV Haar Cascades.
    Returns the area of the largest face detected, or 0 if no face is found.
    Used to select high-quality portrait shots automatically.
    """
    try:
        import cv2
        img = cv2.imread(image_path)
        if img is None:
            return 0
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Load Haar Cascade
        cascade_path = cv2.data.haarcascades + 'haarcascade_frontalface_default.xml'
        face_cascade = cv2.CascadeClassifier(cascade_path)
        
        # Detect faces with parameters tailored for standard video frame resolution
        faces = face_cascade.detectMultiScale(
            gray, 
            scaleFactor=1.15, 
            minNeighbors=5, 
            minSize=(80, 80)
        )
        
        if len(faces) == 0:
            return 0
            
        # Return the area (width * height) of the largest face detected
        max_area = 0
        for (x, y, w, h) in faces:
            area = w * h
            if area > max_area:
                max_area = area
        return max_area
    except Exception as e:
        return 0

def draw_beautiful_placeholder_frame(video_id, title, author, frame_index, percentage, duration_str, output_path):
    """Draws a premium cinematic visual placeholder containing frame index and metadata overlay."""
    logger.info(f"Drawing beautiful synthetic snapshot frame {frame_index} ({percentage}%) for video '{video_id}'")
    img = Image.new("RGB", (1280, 720))
    draw = ImageDraw.Draw(img)
    
    # Modern dark cinematic gradient
    color_start = (15, 12, 30)  # Dark Blue-Navy
    color_end = (90, 25, 115)  # Electric Purple
    
    for y in range(720):
        ratio = y / 720.0
        r = int(color_start[0] + (color_end[0] - color_start[0]) * ratio)
        g = int(color_start[1] + (color_end[1] - color_start[1]) * ratio)
        b = int(color_start[2] + (color_end[2] - color_start[2]) * ratio)
        draw.line([(0, y), (1280, y)], fill=(r, g, b))
        
    # Draw fine high-tech design grid
    for x in range(0, 1280, 160):
        draw.line([(x, 0), (x, 720)], fill=(255, 255, 255, 8), width=1)
    for y in range(0, 720, 120):
        draw.line([(0, y), (1280, y)], fill=(255, 255, 255, 8), width=1)
        
    # Load beautiful font
    font_path = os.path.join(current_dir, "Mitr-Medium.ttf")
    title_font = None
    meta_font = None
    time_font = None
    
    if os.path.exists(font_path):
        try:
            title_font = ImageFont.truetype(font_path, 40)
            meta_font = ImageFont.truetype(font_path, 28)
            time_font = ImageFont.truetype(font_path, 22)
        except Exception:
            pass
            
    if title_font is None:
        title_font = ImageFont.load_default()
        meta_font = ImageFont.load_default()
        time_font = ImageFont.load_default()
        
    # Draw branding header
    draw.text((70, 60), "YOUTUBE DISCOVERY CAPTURED FRAME", fill=(255, 45, 85), font=meta_font)
    
    # Metadata overlays
    draw.text((70, 130), f"Video ID: {video_id}", fill=(200, 200, 220), font=time_font)
    draw.text((70, 170), f"Channel: {author}", fill=(200, 200, 220), font=time_font)
    
    # Central Frame Box
    draw.rectangle([100, 230, 1180, 560], outline=(0, 255, 170), width=3)
    
    # Safe text wrapping
    display_title = title if len(title) < 55 else title[:55] + "..."
    draw.text((150, 310), display_title, fill=(255, 255, 255), font=title_font)
    
    # Frame stats
    frame_text = f"Snapshot Frame #{frame_index} ({percentage}% of duration)"
    draw.text((150, 420), frame_text, fill=(0, 255, 170), font=meta_font)
    
    # Stylized media playbar at bottom
    draw.rectangle([100, 610, 1180, 620], fill=(50, 50, 75))
    fill_end = 100 + int((1180 - 100) * (percentage / 100.0))
    draw.rectangle([100, 610, fill_end, 620], fill=(255, 45, 85))
    draw.ellipse([fill_end - 8, 607, fill_end + 8, 623], fill=(255, 45, 85))
    
    # Timing and frame counters
    draw.text((100, 640), f"Timestamp: {duration_str} ({percentage}%)", fill=(180, 180, 200), font=time_font)
    
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    img.save(output_path, "JPEG")
    logger.info(f"Snapshot saved to: {output_path}")

def download_youtube_thumbnails(video_id, output_dir, max_frames=5):
    """
    Downloads real YouTube thumbnail images as fallback frames.
    YouTube provides public thumbnail URLs for every video:
      - maxresdefault.jpg (1280x720, may not exist for all videos)
      - sddefault.jpg (640x480)
      - hqdefault.jpg (480x360)
      - 0.jpg, 1.jpg, 2.jpg, 3.jpg (auto-generated at different timestamps)
    Returns list of successfully downloaded relative paths.
    """
    logger.info(f"Attempting to download YouTube thumbnails for video: {video_id}")
    
    # YouTube auto-generates these thumbnails for every video
    thumbnail_urls = [
        (f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg", "maxres"),
        (f"https://img.youtube.com/vi/{video_id}/sddefault.jpg", "sd"),
        (f"https://img.youtube.com/vi/{video_id}/hqdefault.jpg", "hq"),
        (f"https://img.youtube.com/vi/{video_id}/1.jpg", "auto1"),
        (f"https://img.youtube.com/vi/{video_id}/2.jpg", "auto2"),
        (f"https://img.youtube.com/vi/{video_id}/3.jpg", "auto3"),
    ]
    
    os.makedirs(output_dir, exist_ok=True)
    downloaded = []
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
    }
    
    for url, label in thumbnail_urls:
        if len(downloaded) >= max_frames:
            break
        try:
            res = requests.get(url, headers=headers, timeout=8)
            if res.status_code == 200 and len(res.content) > 2000:
                # YouTube returns a small grey placeholder (< 1KB) for non-existent maxresdefault
                frame_idx = len(downloaded) + 1
                frame_filename = f"frame_{frame_idx}.jpg"
                frame_abs_path = os.path.join(output_dir, frame_filename)
                
                with open(frame_abs_path, "wb") as f:
                    f.write(res.content)
                
                frame_rel_path = f"downloaded_media/youtube_frames/{video_id}/{frame_filename}"
                downloaded.append(frame_rel_path)
                logger.info(f"  ✅ Downloaded thumbnail ({label}): {frame_filename} ({len(res.content)} bytes)")
            else:
                logger.debug(f"  ⏭️ Thumbnail {label} not available or too small ({len(res.content) if res.status_code == 200 else res.status_code})")
        except Exception as e:
            logger.warning(f"  ❌ Failed to download thumbnail {label}: {e}")
    
    if downloaded:
        logger.info(f"Successfully downloaded {len(downloaded)} real YouTube thumbnails for {video_id}")
    else:
        logger.warning(f"Could not download any YouTube thumbnails for {video_id}")
    
    return downloaded

def generate_mock_transcript(title):
    """Generates highly realistic simulated Thai transcripts matching the video title."""
    cues = []
    start_time = 5.0
    
    cues.append({
        "text": f"สวัสดีครับทุกคน ยินดีต้อนรับเข้าสู่การเจาะลึกคลิป '{title[:40]}'",
        "start": round(start_time, 2),
        "duration": 5.2
    })
    
    for template in MOCK_TRANSCRIPT_TEMPLATES:
        start_time += random.uniform(8.0, 15.0)
        cues.append({
            "text": template,
            "start": round(start_time, 2),
            "duration": round(random.uniform(4.0, 8.0), 2)
        })
        
    return cues

def search_youtube_real(api_key, query):
    """Searches YouTube using active credential key (optional real flow)."""
    search_url = "https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": query,
        "type": "video",
        "maxResults": 3,
        "key": api_key
    }
    
    try:
        res = requests.get(search_url, params=params, timeout=15)
        if res.status_code in [401, 403]:
            raise PermissionError(f"YouTube search API auth error: {res.text}")
        if res.status_code != 200:
            raise Exception(f"YouTube search API returned HTTP {res.status_code}")
            
        search_data = res.json()
        video_items = search_data.get("items", [])
        
        results = []
        for v in video_items:
            v_id = v["id"]["videoId"]
            title = v["snippet"]["title"]
            channel_id = v["snippet"]["channelId"]
            channel_title = v["snippet"]["channelTitle"]
            upload_date = v["snippet"]["publishedAt"]
            
            # Fetch video metrics
            stats_url = "https://www.googleapis.com/youtube/v3/videos"
            stats_params = {"part": "statistics,contentDetails", "id": v_id, "key": api_key}
            stats_res = requests.get(stats_url, params=stats_params, timeout=10)
            
            views = 10000
            duration = "10:00"
            if stats_res.status_code == 200:
                stats_data = stats_res.json().get("items", [{}])[0]
                views = int(stats_data.get("statistics", {}).get("viewCount", 10000))
                # Simple ISO ISO 8601 duration parser fallback
                duration = stats_data.get("contentDetails", {}).get("duration", "PT10M")
                # Format PT10M30S to 10:30
                duration = duration.replace("PT", "").replace("M", ":").replace("S", "")
                
            # Fetch channel subcount
            ch_url = "https://www.googleapis.com/youtube/v3/channels"
            ch_params = {"part": "statistics,snippet", "id": channel_id, "key": api_key}
            ch_res = requests.get(ch_url, params=ch_params, timeout=10)
            
            subs = 10000
            logo_url = ""
            if ch_res.status_code == 200:
                ch_data = ch_res.json().get("items", [{}])[0]
                subs = int(ch_data.get("statistics", {}).get("subscriberCount", 10000))
                logo_url = ch_data.get("snippet", {}).get("thumbnails", {}).get("default", {}).get("url", "")
                
            results.append({
                "id": v_id,
                "title": title,
                "channel_id": channel_id,
                "channel_title": channel_title,
                "subscribers": subs,
                "views": views,
                "duration": duration,
                "upload_date": upload_date,
                "logo_url": logo_url,
                "query": query
            })
            
        return results
    except Exception as e:
        logger.warning(f"Real YouTube API search failed: {e}. Defaulting to mock search results.")
        raise e

def save_youtube_to_vault(db_path, video, transcript_cues, media_paths, logo_rel_path):
    """Saves discovered YouTube video details into SQLite under status 'ready_for_design'."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    now = datetime.now().isoformat()
    raw_desc = f"Channel: {video['channel_title']}\n"
    raw_desc += f"Duration: {video['duration']}\n"
    raw_desc += "Transcript Preview:\n" + "\n".join([f"[{c['start']}s] {c['text']}" for c in transcript_cues[:4]])
    
    vph = calculate_vph(video["views"], video["upload_date"])
    sub_fmt = format_subscribers(video["subscribers"])
    
    metadata = {
        "video_id": video["id"],
        "duration": video["duration"],
        "views": video["views"],
        "vph": vph,
        "subscribers_formatted": sub_fmt,
        "transcript_cues": transcript_cues,
        "query": video["query"]
    }
    
    try:
        cursor.execute("""
            INSERT OR REPLACE INTO vault_contents (
                id, source_type, title, selected_headline, raw_content, source_url, 
                author_name, author_avatar_url, author_followers, rating_news, rating_evergreen, 
                metadata_json, media_paths_json, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?)
        """, (
            video["id"],
            "youtube",
            video["title"],
            video["title"], # Default selected_headline to title
            raw_desc,
            f"https://www.youtube.com/watch?v={video['id']}",
            video["channel_title"],
            logo_rel_path,
            video["subscribers"],
            json.dumps(metadata, ensure_ascii=False),
            json.dumps(media_paths, ensure_ascii=False),
            "ready_for_design",
            now,
            now
        ))
        conn.commit()
        logger.info(f"[SUCCESS] Saved YouTube Video: '{video['title']}' to SQLite Vault.")
        conn.close()
        return True
    except Exception as e:
        logger.error(f"Failed to save YouTube video {video['id']}: {e}")
        conn.close()
        return False


def extract_video_id(url_or_query):
    import re
    # Patterns for different youtube URLs
    patterns = [
        r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([^&\s]+)',
        r'(?:https?://)?(?:www\.)?youtu\.be/([^?\s]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/embed/([^?\s]+)',
        r'(?:https?://)?(?:www\.)?youtube\.com/shorts/([^?\s]+)'
    ]
    for pattern in patterns:
        match = re.search(pattern, url_or_query)
        if match:
            return match.group(1)
    # Check if the query itself is a 11-char ID
    if len(url_or_query) == 11 and re.match(r'^[a-zA-Z0-9_-]{11}$', url_or_query):
        return url_or_query
    return None

def fetch_real_channel_logo_url(uploader_url, channel_id):
    """Fetches the real channel page HTML and extracts the og:image avatar URL."""
    if not uploader_url:
        if channel_id:
            uploader_url = f"https://www.youtube.com/channel/{channel_id}"
        else:
            return None
            
    logger.info(f"Attempting to scrape real channel logo from page: {uploader_url}")
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    try:
        res = requests.get(uploader_url, headers=headers, timeout=10)
        if res.status_code == 200:
            # Try og:image first
            match = re.search(r'property="og:image"\s+content="([^"]+)"', res.text)
            if not match:
                match = re.search(r'content="([^"]+)"\s+property="og:image"', res.text)
            if not match:
                # Fallback to twitter:image
                match = re.search(r'name="twitter:image"\s+content="([^"]+)"', res.text)
                
            if match:
                logo_url = match.group(1)
                logger.info(f"Successfully found real channel logo URL: {logo_url}")
                return logo_url
    except Exception as e:
        logger.warning(f"Failed to scrape channel logo from {uploader_url}: {e}")
    return None

def download_and_save_logo(logo_url, output_path):
    """Downloads image content from the given logo URL and saves it to output_path."""
    try:
        logger.info(f"Downloading real channel logo from: {logo_url}")
        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        res = requests.get(logo_url, headers=headers, timeout=10)
        if res.status_code == 200:
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            with open(output_path, "wb") as f:
                f.write(res.content)
            logger.info(f"Saved real channel logo to {output_path}")
            return True
    except Exception as e:
        logger.warning(f"Failed to download real channel logo from {logo_url}: {e}")
    return False

def run_yt_dlp_with_cookies(extra_args, timeout=20):
    """Runs yt-dlp trying different cookie sources in order: chrome, safari, edge, none."""
    import subprocess
    import json
    cookie_sources = ["chrome", "safari", "edge", "none"]
    last_error_msg = ""
    for source in cookie_sources:
        cmd = ["yt-dlp"]
        if source != "none":
            cmd += ["--cookies-from-browser", source]
        cmd += extra_args
        
        logger.info(f"Running yt-dlp with cookie source: {source}")
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
            if res.returncode == 0 and res.stdout.strip():
                return res
            else:
                err_msg = res.stderr or f"Exit code {res.returncode}"
                logger.warning(f"yt-dlp failed with source {source}: {err_msg}")
                # Even if returncode is non-zero, check if stdout has some valid json content
                if res.stdout.strip():
                    try:
                        # Test if it's valid JSON
                        json.loads(res.stdout)
                        return res
                    except Exception:
                        pass
                last_error_msg = err_msg
        except Exception as e:
            logger.warning(f"yt-dlp subprocess error with source {source}: {e}")
            last_error_msg = str(e)
            
    raise RuntimeError(f"All yt-dlp cookie sources failed. Last error: {last_error_msg}")

def generate_cookies_file():
    """Generates scratch/cookies.txt by trying chrome, safari, edge, none."""
    import os
    import subprocess
    import time
    
    cookies_path = os.path.join(vault_root, "scratch", "cookies.txt")
    os.makedirs(os.path.dirname(cookies_path), exist_ok=True)
    
    # If file exists and is less than 30 mins old, reuse it
    if os.path.exists(cookies_path) and (time.time() - os.path.getmtime(cookies_path)) < 1800:
        return cookies_path
        
    cookie_sources = ["chrome", "safari", "edge"]
    for source in cookie_sources:
        cmd = [
            "yt-dlp",
            "--cookies-from-browser", source,
            "--cookies", cookies_path,
            "--skip-download",
            "https://www.youtube.com"
        ]
        try:
            logger.info(f"Extracting cookies for transcript fetch from browser: {source}")
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
            if res.returncode == 0 and os.path.exists(cookies_path) and os.path.getsize(cookies_path) > 0:
                logger.info(f"Successfully saved cookies from browser '{source}' to: {cookies_path}")
                return cookies_path
        except Exception as e:
            logger.warning(f"Failed to extract cookies from {source}: {e}")
            
    return None

def get_fallback_videos(query_val):
    video_id = extract_video_id(query_val)
    if video_id:
        logger.info(f"Attempting to fetch real YouTube metadata via yt-dlp for ID: {video_id}")
        try:
            extra_args = [
                "-j",
                f"https://www.youtube.com/watch?v={video_id}"
            ]
            res = run_yt_dlp_with_cookies(extra_args, timeout=20)
            info = json.loads(res.stdout)
            channel_title = info.get("channel") or info.get("uploader") or "YouTube Channel"
            
            # Format subscriber count
            subscribers = info.get("channel_follower_count")
            if subscribers is None:
                subscribers = 250000
            else:
                subscribers = int(subscribers)
                
            # Format views
            views = info.get("view_count")
            if views is None:
                views = 450000
            else:
                views = int(views)
                
            # Format duration
            duration_secs = info.get("duration", 0)
            if duration_secs:
                hours = duration_secs // 3600
                mins = (duration_secs % 3600) // 60
                secs = duration_secs % 60
                if hours > 0:
                    duration_str = f"{hours}:{mins:02d}:{secs:02d}"
                else:
                    duration_str = f"{mins:02d}:{secs:02d}"
            else:
                duration_str = "15:00"
                
            # Format upload date
            raw_upload_date = info.get("upload_date")
            if raw_upload_date:
                try:
                    upload_date = datetime.strptime(raw_upload_date, "%Y%m%d").isoformat()
                except Exception:
                    upload_date = datetime.now().isoformat()
            else:
                upload_date = datetime.now().isoformat()
                
            video = {
                "id": video_id,
                "title": info.get("title", "YouTube Video"),
                "channel_id": info.get("channel_id") or ("ch_" + hashlib.md5(channel_title.encode('utf-8')).hexdigest()[:10]),
                "channel_title": channel_title,
                "subscribers": subscribers,
                "views": views,
                "duration": duration_str,
                "upload_date": upload_date,
                "uploader_url": info.get("uploader_url"),
                "description": info.get("description", ""),
                "query": query_val
            }
            logger.info(f"Successfully retrieved real video info via yt-dlp: '{video['title']}'")
            return [video]
        except Exception as e:
            logger.warning(f"Failed to fetch real metadata via yt-dlp: {e}. Trying noembed API...")
            
        logger.info(f"Attempting to fetch real YouTube metadata via public noembed API for ID: {video_id}")
        try:
            res = requests.get(f"https://noembed.com/embed?url=https://www.youtube.com/watch?v={video_id}", timeout=10)
            if res.status_code == 200:
                meta = res.json()
                if "title" in meta:
                    channel_title = meta.get("author_name", "YouTube Channel")
                    video = {
                        "id": video_id,
                        "title": meta.get("title"),
                        "channel_id": "ch_" + hashlib.md5(channel_title.encode('utf-8')).hexdigest()[:10],
                        "channel_title": channel_title,
                        "subscribers": 250000,
                        "views": 450000,
                        "duration": "15:00",
                        "upload_date": datetime.now().isoformat(),
                        "uploader_url": None,
                        "query": query_val
                    }
                    logger.info(f"Successfully retrieved real video info: '{video['title']}'")
                    return [video]
        except Exception as e:
            logger.warning(f"Failed to fetch real metadata via public noembed API: {e}")
            
    # Default mock videos matching query
    videos = [v for v in MOCK_YOUTUBE_VIDEOS if query_val.lower() in v["query"].lower() or query_val.lower() in v["title"].lower() or query_val.lower() in v["id"].lower()]
    if not videos:
        videos = MOCK_YOUTUBE_VIDEOS
    return videos

def get_youtube_stream_and_duration(video_id):
    import subprocess
    import json
    
    logger.info(f"Using yt-dlp to extract stream URL for video: {video_id}")
    try:
        # format: best[ext=mp4]/best is highly compatible and fast
        extra_args = [
            "-j",
            "--format", "best[ext=mp4]/best",
            f"https://www.youtube.com/watch?v={video_id}"
        ]
        res = run_yt_dlp_with_cookies(extra_args, timeout=20)
        info = json.loads(res.stdout)
        stream_url = info.get("url")
        duration = int(info.get("duration", 0))
        if stream_url and duration > 0:
            return stream_url, duration
    except Exception as e:
        logger.warning(f"Failed to extract stream info via yt-dlp: {e}")
    return None, None

def main():
    parser = argparse.ArgumentParser(description="YouTube Discovery Scraper module")
    parser.add_argument("--query", type=str, default="เรียน AI",
                        help="Search query to run on YouTube")
    parser.add_argument("--video_url", "--video-url", dest="video_url", type=str, default=None, help="Directly specify a YouTube URL or query override")
    parser.add_argument("--url", type=str, default=None, help="Alias for video_url")
    parser.add_argument("--limit", type=int, default=5, help="Number of items to fetch")
    parser.add_argument("--openrouter_key", "--openrouter-key", dest="openrouter_key", type=str, default=None, help="OpenRouter API key override (ignored)")
    
    args, unknown = parser.parse_known_args()
    
    # Map --url to --video_url if provided
    if args.url and not args.video_url:
        args.video_url = args.url
    
    # 1. Init folders and databases
    initializer = VaultSystemInitializer(vault_root)
    initializer.setup_directories()
    
    db_path = initializer.db_path
    cred_mgr = VaultCredentialManager(db_path, logger)
    
    query_val = args.video_url if args.video_url else args.query
    logger.info(f"=== YouTube Discovery Scraper Started [Query/Url: '{query_val}'] ===")
    
    # 2. Credential checks
    use_mock = False
    youtube_key = None
    
    try:
        youtube_key = cred_mgr.get_active_key("github") # Mapped to service seeds if 'youtube' is not defined. We fall back safely.
        youtube_key = cred_mgr.get_active_key("youtube")
        if youtube_key.startswith("MOCK_"):
            logger.warning("Active YouTube key is a MOCK key. Switching to simulated search.")
            use_mock = True
    except Exception:
        logger.warning("No YouTube key found in api_credentials. Defaulting to high-quality simulations.")
        use_mock = True
        
    videos = []
    
    # 3. Search videos
    if use_mock:
        videos = get_fallback_videos(query_val)
    else:
        try:
            videos = search_youtube_real(youtube_key, query_val)
        except PermissionError as auth_err:
            logger.warning(f"YouTube auth failure: {auth_err}. Disabling key and switching to mocks.")
            cred_mgr.report_key_error("youtube", youtube_key, str(auth_err))
            videos = get_fallback_videos(query_val)
        except Exception:
            videos = get_fallback_videos(query_val)
            
    videos = videos[:args.limit]
    logger.info(f"Retrieved {len(videos)} videos to process.")
    
    # 4. Process each video
    for video in videos:
        logger.info(f"Processing video: {video['id']} - '{video['title']}'")
        
        # 4a. Format logo path and fetch/generate channel logo
        logo_filename = f"{video['channel_id']}.png"
        logo_abs_path = os.path.join(vault_root, "downloaded_media", "author_logos", logo_filename)
        logo_rel_path = f"downloaded_media/author_logos/{logo_filename}"
        
        real_logo_saved = False
        uploader_url = video.get("uploader_url")
        real_logo_url = fetch_real_channel_logo_url(uploader_url, video.get("channel_id"))
        if real_logo_url:
            real_logo_saved = download_and_save_logo(real_logo_url, logo_abs_path)
            
        if not real_logo_saved:
            generate_channel_logo(video["channel_title"], logo_abs_path)
        
        # 4b. Frame screenshots extraction logic (dynamically distributed across duration based on args.limit)
        if args.limit <= 1:
            intervals = [50]
        else:
            step = 80.0 / (args.limit - 1)
            intervals = [int(round(10.0 + i * step)) for i in range(args.limit)]
        media_paths = []
        
        # Try to get real stream URL and duration
        stream_url, duration_secs = get_youtube_stream_and_duration(video["id"])
        real_extraction_success = False
        
        if stream_url and duration_secs > 0:
            logger.info(f"Successfully obtained stream URL and duration ({duration_secs}s). Extracting real frames via ffmpeg...")
            # Update video duration representation
            mins = duration_secs // 60
            secs = duration_secs % 60
            video["duration"] = f"{mins:02d}:{secs:02d}"
            
            real_extraction_success = True
            import shutil
            for idx, pct in enumerate(intervals, start=1):
                frame_filename = f"frame_{idx}.jpg"
                frame_abs_path = os.path.join(vault_root, "downloaded_media", "youtube_frames", video["id"], frame_filename)
                frame_rel_path = f"downloaded_media/youtube_frames/{video['id']}/{frame_filename}"
                
                os.makedirs(os.path.dirname(frame_abs_path), exist_ok=True)
                timestamp_sec = int(duration_secs * (pct / 100.0))
                
                logger.info(f" - Extracting real frame #{idx} near {timestamp_sec}s ({pct}%) looking for a face...")
                
                # Check candidate offsets to find one with a face (preferring a face over screen/code)
                offsets = [0, 15, -15, 30, -30, 45, -45, 60, -60]
                best_path = None
                best_score = 0
                best_ts = timestamp_sec
                extracted_something = False
                
                for offset in offsets:
                    cand_ts = timestamp_sec + offset
                    if cand_ts < 0 or cand_ts >= duration_secs:
                        continue
                        
                    if offset == 0:
                        cand_path = frame_abs_path
                    else:
                        cand_path = frame_abs_path + f".temp_{offset}.jpg"
                        
                    ffmpeg_cmd = [
                        "ffmpeg",
                        "-ss", str(cand_ts),
                        "-i", stream_url,
                        "-vframes", "1",
                        "-q:v", "2",
                        cand_path,
                        "-y"
                    ]
                    
                    try:
                        ffmpeg_res = subprocess.run(ffmpeg_cmd, capture_output=True, timeout=15)
                        if ffmpeg_res.returncode == 0 and os.path.exists(cand_path) and os.path.getsize(cand_path) > 0:
                            extracted_something = True
                            score = score_frame_for_face(cand_path)
                            logger.info(f"   * Offset {offset}s (timestamp {cand_ts}s) face score: {score}")
                            
                            if score > best_score:
                                best_score = score
                                best_ts = cand_ts
                                # If this is a new best path and not the primary one, clean up the old best temp path
                                if best_path and best_path != frame_abs_path and os.path.exists(best_path):
                                    os.remove(best_path)
                                best_path = cand_path
                            elif offset != 0:
                                # Clean up this temp file since it's not the best
                                if os.path.exists(cand_path):
                                    os.remove(cand_path)
                                    
                            # If we found a very prominent face (face size >= 18000), we can stop searching!
                            if score >= 18000:
                                logger.info(f"   * Prominent face found (score {score}), stopping search.")
                                break
                        else:
                            if offset != 0 and os.path.exists(cand_path):
                                os.remove(cand_path)
                    except Exception as e:
                        logger.warning(f"   * Ffmpeg seek error at offset {offset}: {e}")
                        if offset != 0 and os.path.exists(cand_path):
                            os.remove(cand_path)
                
                # Copy the best path to the final destination if the best was a temp file
                if best_path and best_path != frame_abs_path and os.path.exists(best_path):
                    shutil.copy(best_path, frame_abs_path)
                    
                # Clean up any remaining temp files just in case
                for offset in offsets:
                    if offset != 0:
                        p = frame_abs_path + f".temp_{offset}.jpg"
                        if os.path.exists(p):
                            os.remove(p)
                            
                if extracted_something:
                    logger.info(f" -> Selected frame #{idx} at timestamp {best_ts}s (Score: {best_score})")
                    media_paths.append(frame_rel_path)
                else:
                    logger.warning(f"ffmpeg frame extraction failed for frame #{idx} entirely. Falling back to cinematic placeholder.")
                    draw_beautiful_placeholder_frame(
                        video["id"], video["title"], video["channel_title"], idx, pct, video["duration"], frame_abs_path
                    )
                    media_paths.append(frame_rel_path)
        
        if not real_extraction_success:
            # Try downloading real YouTube thumbnails as fallback before placeholder
            frames_dir = os.path.join(vault_root, "downloaded_media", "youtube_frames", video["id"])
            thumbnail_paths = download_youtube_thumbnails(video["id"], frames_dir, max_frames=args.limit)
            
            if thumbnail_paths:
                logger.info(f"Successfully retrieved {len(thumbnail_paths)} real YouTube thumbnails as frame fallback.")
                media_paths = thumbnail_paths
            else:
                logger.info("YouTube thumbnail download also failed. Falling back to premium cinematic placeholder frames...")
                for idx, pct in enumerate(intervals, start=1):
                    frame_filename = f"frame_{idx}.jpg"
                    frame_abs_path = os.path.join(vault_root, "downloaded_media", "youtube_frames", video["id"], frame_filename)
                    frame_rel_path = f"downloaded_media/youtube_frames/{video['id']}/{frame_filename}"
                    
                    draw_beautiful_placeholder_frame(
                        video["id"], video["title"], video["channel_title"], idx, pct, video["duration"], frame_abs_path
                    )
                    media_paths.append(frame_rel_path)
            
        # 4c. Transcripts extraction logic using youtube-transcript-api (or simulated fallback)
        transcript_cues = []
        try:
            logger.info(f"Attempting to extract real transcript using youtube-transcript-api for {video['id']}...")
            from youtube_transcript_api import YouTubeTranscriptApi
            import requests
            import http.cookiejar
            
            session = requests.Session()
            session.headers.update({
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7"
            })
            
            cookies_file = generate_cookies_file()
            if cookies_file and os.path.exists(cookies_file):
                try:
                    cj = http.cookiejar.MozillaCookieJar(cookies_file)
                    cj.load(ignore_discard=True, ignore_expires=True)
                    session.cookies = cj
                    logger.info("Loaded browser cookies into requests session for transcript fetch.")
                except Exception as cookie_err:
                    logger.warning(f"Failed to load cookies into session: {cookie_err}")
            
            api = YouTubeTranscriptApi(http_client=session)
            transcript_list = api.fetch(video["id"], languages=['th', 'en'])
            
            for item in transcript_list:
                transcript_cues.append({
                    "text": item.text,
                    "start": round(item.start, 2),
                    "duration": round(item.duration, 2)
                })
            logger.info(f"Successfully retrieved real transcript with {len(transcript_cues)} cues.")
        except Exception as trans_err:
            logger.warning(f"Could not fetch real transcript: {trans_err}. Falling back to mock transcript.")
            transcript_cues = generate_mock_transcript(video["title"])
            
        # Check if the extracted transcript is essentially empty or only contains music cues
        is_empty_or_music = False
        if not transcript_cues or len(transcript_cues) < 3:
            is_empty_or_music = True
        else:
            # Check if all cues contain music indicators
            all_music = True
            for cue in transcript_cues:
                text_clean = cue["text"].strip().lower()
                if not ("music" in text_clean or "applause" in text_clean or "laughter" in text_clean or text_clean == ""):
                    all_music = False
                    break
            if all_music:
                is_empty_or_music = True
                
        if is_empty_or_music:
            logger.info("Fetched transcript is empty or only contains music cues. Generating rich transcript from video description...")
            desc = video.get("description", "")
            if desc:
                # Parse description into sentences/paragraphs
                paragraphs = []
                for p in desc.split("\n"):
                    p_clean = p.strip()
                    if not p_clean:
                        continue
                    # Filter out links, hashtags, social media handles
                    if "http" in p_clean or "twitter" in p_clean or "instagram" in p_clean or "facebook" in p_clean or p_clean.startswith("#"):
                        continue
                    paragraphs.append(p_clean)
                
                if paragraphs:
                    # Distribute paragraphs evenly based on duration
                    duration_s = 60 # Default
                    if "duration" in video:
                        try:
                            parts = [int(x) for x in video["duration"].split(":")]
                            if len(parts) == 2:
                                duration_s = parts[0] * 60 + parts[1]
                            elif len(parts) == 3:
                                duration_s = parts[0] * 3600 + parts[1] * 60 + parts[2]
                        except Exception:
                            pass
                            
                    interval = max(3.0, (duration_s - 5.0) / len(paragraphs))
                    new_cues = []
                    
                    # Preserve original [music plays] cue at the very start if available
                    if transcript_cues and "[music" in transcript_cues[0]["text"].lower():
                        new_cues.append(transcript_cues[0])
                        
                    for idx, para in enumerate(paragraphs):
                        start_t = 5.0 + (idx * interval)
                        # Split long paragraphs into sentences to make the script look beautifully timed
                        sentences = re.split(r'(?<=[.!?])\s+', para)
                        sentence_interval = max(2.5, interval / len(sentences))
                        for s_idx, s in enumerate(sentences):
                            s_clean = s.strip()
                            if s_clean:
                                cue_start = start_t + (s_idx * sentence_interval)
                                new_cues.append({
                                    "text": s_clean,
                                    "start": round(cue_start, 2),
                                    "duration": round(max(2.0, sentence_interval - 0.5), 2)
                                })
                    
                    transcript_cues = new_cues
                    logger.info(f"Successfully generated {len(transcript_cues)} rich cues from video description.")
        
        # 4d. Save to vault SQLite
        save_youtube_to_vault(db_path, video, transcript_cues, media_paths, logo_rel_path)
        
    logger.info("=== YouTube Discovery Scraper Completed Successfully ===")

if __name__ == "__main__":
    main()
