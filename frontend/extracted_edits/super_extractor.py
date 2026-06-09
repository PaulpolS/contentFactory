import json
import os
import re

folders = [
    ("2026-05-27T12:58:49", "247e75b9-4826-40df-8e90-5fa35311e2ea"),
    ("2026-05-28T00:27:06", "23940d18-23ee-4fe2-ae49-7770fa53069d"),
    ("2026-05-28T13:12:25", "92117323-9727-4a26-a9a1-344766219dc2"),
    ("2026-05-28T21:55:04", "96eb032d-4753-4fd4-b92d-e17e037aaa69"),
    ("2026-05-28T22:17:13", "6ca425c1-707e-4881-a6da-143a5652c3f0"),
    ("2026-05-28T22:24:30", "9efa7c88-fe1b-435b-8bc2-2cd2d891b774"),
    ("2026-05-29T10:26:14", "d2423ae6-7d71-46ba-9e6e-b7b6cb132742"),
    ("2026-05-30T17:39:15", "a172878b-9f08-4be6-aeff-977c65d312d7"),
    ("2026-05-30T19:45:04", "1cfa0ad4-83a4-417d-8efb-65de53aa6428"),
    ("2026-05-30T20:12:41", "1926d51c-14b3-4456-aeb5-f02f4cdcde33"),
    ("2026-06-03T19:26:26", "eccbdc81-f670-4dae-922b-0be80b80189b")
]

# We want to see which folders contain lines in the range [2680, 3280]
for date, folder in folders:
    tr_path = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(tr_path):
        continue
    
    ranges = []
    with open(tr_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "App.tsx" in line and "Showing lines" in line:
                m = re.search(r'Showing lines (\d+) to (\d+)', line)
                if m:
                    start = int(m.group(1))
                    end = int(m.group(2))
                    # Check if it overlaps with [2680, 3280]
                    if max(2680, start) < min(3280, end):
                        ranges.append((start, end))
                        
    if ranges:
        print(f"Folder {folder} ({date}) has overlaps in range [2680, 3280]:")
        for r in sorted(ranges):
            print(f"  Lines {r[0]} to {r[1]}")
