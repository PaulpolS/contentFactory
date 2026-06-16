#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import os
import sqlite3
import json
import re

db_path = '/Users/macos/Documents/โปรแกรมทำContent/contentFactory/content_vault/databases/content_pool.db'

if not os.path.exists(db_path):
    print(f"Database not found at: {db_path}")
    exit(1)

def clean_simulated_title(title):
    # 1. Remove github prefixes
    cleaned = re.sub(r'^github_[^_]+_', '', title).replace('_', ' ')
    
    # 2. Remove parenthetical text (e.g. (beginner friendly!), [Updated 2026])
    cleaned = re.sub(r'\s*[\(\[][^\]\)]*[\)\]]', '', cleaned).strip()
    
    # 3. Split by common transition/preposition words
    split_keywords = [
        ' for ', ' with ', ' in ', ' using ', ' on ', ' by '
    ]
    for keyword in split_keywords:
        idx = cleaned.lower().find(keyword)
        if idx != -1:
            cleaned = cleaned[:idx]
            
    # 4. Handle colons and dashes
    if ':' in cleaned:
        parts = cleaned.split(':')
        part1 = parts[0].strip()
        part2 = parts[1].strip()
        if len(part1) > 5 and len(part1) < 30:
            cleaned = part1
        else:
            cleaned = part2
            
    if ' - ' in cleaned:
        cleaned = cleaned.split(' - ')[0].strip()
        
    cleaned = cleaned.strip()
    
    # 5. Keep at most 35 chars
    if len(cleaned) > 35:
        truncated = cleaned[:32]
        last_space = truncated.rfind(' ')
        if last_space > 15:
            cleaned = cleaned[:last_space]
        else:
            cleaned = truncated
            
    return cleaned.strip()

def split_simulated_title(clean_title):
    words = clean_title.split()
    if len(words) <= 1:
        return clean_title, ""
        
    lower_title = clean_title.lower()
    
    # Rule 1: Starts with "how to"
    if lower_title.startswith("how to "):
        part1 = " ".join(words[:2])
        part2 = " ".join(words[2:])
        return part1, part2
    if lower_title.startswith("how to"):
        part1 = " ".join(words[:2])
        part2 = " ".join(words[2:])
        return part1, part2

    # Rule 2: Known tech names or first word >= 5 chars
    first_word = words[0]
    lower_first = first_word.lower()
    tech_names = [
        'chatgpt', 'gpt-5', 'gpt-4', 'gpt', 'claude', 'llama', 
        'python', 'google', 'openai', 'github', 'gohighlevel', 
        'ai', 'midjourney', 'stable'
    ]
    if lower_first in tech_names or len(first_word) >= 5:
        part1 = first_word
        part2 = " ".join(words[1:])
        return part1, part2

    # Rule 3: Default split at approximately half the words
    mid = (len(words) + 1) // 2
    part1 = " ".join(words[:mid])
    part2 = " ".join(words[mid:])
    return part1, part2

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

cursor.execute("SELECT id, title, selected_headline, metadata_json FROM vault_contents")
rows = cursor.fetchall()

updated_count = 0

for row in rows:
    cid, title, sel_headline, meta_json = row
    
    # Check if this headline was truncated with '...' or is a simulated headline that needs recalculating
    is_target = False
    if sel_headline:
        if '...' in sel_headline:
            is_target = True
        elif sel_headline.startswith("ข่าวด่วนที่สุด! เจาะลึกสุดยอด "):
            is_target = True
            
    if is_target:
        # Calculate clean title
        clean_title = clean_simulated_title(title)
        
        if len(clean_title) > 15:
            part1, part2 = split_simulated_title(clean_title)
            new_headline_lines = [
                f"ข่าวด่วนที่สุด! เจาะลึกสุดยอด {part1}",
                part2,
                "เพิ่มประสิทธิภาพ 10 เท่า"
            ]
        else:
            new_headline_lines = [
                f"ข่าวด่วนที่สุด! เจาะลึกสุดยอด {clean_title}",
                "เพิ่มประสิทธิภาพ 10 เท่า",
                ""
            ]
        new_headline = "\n".join(new_headline_lines)
        
        # Only update if the new headline is different from the old one
        if new_headline != sel_headline:
            print(f"\n[FIXING] ID: {cid}")
            print(f"  Original Title: {title}")
            print(f"  Old Headline: {sel_headline.replace(chr(10), ' | ')}")
            print(f"  New Headline: {new_headline.replace(chr(10), ' | ')}")
            
            # Update metadata JSON copywriting structure if present
            meta = {}
            if meta_json:
                try:
                    meta = json.loads(meta_json)
                except Exception:
                    meta = {}
                    
            copywriting = meta.get("copywriting", {})
            if copywriting:
                copywriting["headline_3line"] = new_headline_lines
                copywriting["headline_3line_keywords"] = ["ข่าวด่วนที่สุด", "10 เท่า", ""]
                copywriting["highlight"] = "ข่าวด่วนที่สุด,10 เท่า"
                meta["copywriting"] = copywriting
                
            cursor.execute(
                "UPDATE vault_contents SET selected_headline = ?, metadata_json = ? WHERE id = ?",
                (new_headline, json.dumps(meta, ensure_ascii=False), cid)
            )
            updated_count += 1

conn.commit()
conn.close()

print(f"\n[COMPLETE] Successfully updated {updated_count} truncated database records!")
