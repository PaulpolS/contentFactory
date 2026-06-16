#!/usr/bin/env python3
"""
Re-download YouTube thumbnails for all existing YouTube videos in the vault.
Replaces placeholder frames with real YouTube CDN thumbnails.
"""
import os
import sys
import sqlite3
import json
import requests

# Paths
current_dir = os.path.dirname(os.path.abspath(__file__))
vault_root = os.path.join(os.path.dirname(current_dir), "content_vault")
db_path = os.path.join(vault_root, "databases", "content_pool.db")

def download_youtube_thumbnails(video_id, output_dir, max_frames=5):
    """Downloads real YouTube thumbnail images."""
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
                frame_idx = len(downloaded) + 1
                frame_filename = f"frame_{frame_idx}.jpg"
                frame_abs_path = os.path.join(output_dir, frame_filename)
                
                with open(frame_abs_path, "wb") as f:
                    f.write(res.content)
                
                frame_rel_path = f"downloaded_media/youtube_frames/{video_id}/{frame_filename}"
                downloaded.append(frame_rel_path)
                print(f"  ✅ {label}: {frame_filename} ({len(res.content)} bytes)")
        except Exception as e:
            print(f"  ❌ {label}: {e}")
    
    return downloaded

def is_placeholder_frame(frame_path):
    """Check if a frame file is a Pillow placeholder (contains the text pattern)."""
    try:
        size = os.path.getsize(frame_path)
        # Placeholder frames are typically 15-20KB; real frames are much larger
        # But more reliably: check file size. Real thumbnails from YouTube are > 30KB typically
        if size < 25000:
            return True
        return False
    except:
        return True

def main():
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Get all YouTube videos
    cursor.execute("SELECT id, title, media_paths_json FROM vault_contents WHERE source_type = 'youtube'")
    rows = cursor.fetchall()
    
    print(f"\n🔍 Found {len(rows)} YouTube videos in vault\n")
    
    updated_count = 0
    skipped_count = 0
    failed_count = 0
    
    for vid_id, title, media_json in rows:
        try:
            current_paths = json.loads(media_json or "[]")
        except:
            current_paths = []
        
        # Check if frames are placeholders
        frames_dir = os.path.join(vault_root, "downloaded_media", "youtube_frames", vid_id)
        
        needs_update = False
        if current_paths:
            # Check first frame
            first_frame_path = os.path.join(vault_root, current_paths[0])
            if os.path.exists(first_frame_path) and is_placeholder_frame(first_frame_path):
                needs_update = True
                print(f"\n📹 [{vid_id}] {title[:60]}")
                print(f"   Current frames are placeholders, re-downloading...")
            else:
                skipped_count += 1
                continue
        else:
            needs_update = True
            print(f"\n📹 [{vid_id}] {title[:60]}")
            print(f"   No frames exist, downloading...")
        
        if needs_update:
            new_paths = download_youtube_thumbnails(vid_id, frames_dir, max_frames=5)
            
            if new_paths:
                # Update database
                cursor.execute(
                    "UPDATE vault_contents SET media_paths_json = ?, updated_at = datetime('now') WHERE id = ?",
                    [json.dumps(new_paths, ensure_ascii=False), vid_id]
                )
                conn.commit()
                updated_count += 1
                print(f"   ✅ Updated with {len(new_paths)} real thumbnails")
            else:
                failed_count += 1
                print(f"   ⚠️ Could not download thumbnails, keeping existing frames")
    
    conn.close()
    
    print(f"\n{'='*60}")
    print(f"📊 Summary:")
    print(f"   ✅ Updated: {updated_count} videos")
    print(f"   ⏭️ Skipped (already real): {skipped_count} videos")
    print(f"   ❌ Failed: {failed_count} videos")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    main()
