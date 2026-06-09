import json
import os
import re
import subprocess

res = subprocess.run(["find", "/Users/paulpolsulintaboon/.gemini/antigravity/brain/", "-name", "transcript.jsonl"], capture_output=True, text=True)
transcripts = [line.strip() for line in res.stdout.split("\n") if line.strip()]

print(f"Found {len(transcripts)} transcripts. Searching for lines 2681-2699...")

matches = []

for tr in transcripts:
    if not os.path.exists(tr):
        continue
    folder = tr.split("/")[-4]
    try:
        with open(tr, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                if "App.tsx" in line and "Showing lines" in line:
                    m = re.search(r'Showing lines (\d+) to (\d+)', line)
                    if m:
                        start = int(m.group(1))
                        end = int(m.group(2))
                        if start <= 2681 and end >= 2699:
                            matches.append((folder, tr, start, end, line))
                            print(f"Found match: folder={folder}, lines={start} to {end}")
    except Exception as e:
        pass

print(f"Total matches: {len(matches)}")
# Let's inspect the matches and print the exact lines
for folder, tr, start, end, line_content in matches:
    try:
        data = json.loads(line_content)
        content = data.get("content", "")
        # print lines from 2680 to 2700
        print(f"\n--- Code from folder {folder} ---")
        lines = content.split("\n")
        for l in lines:
            m = re.match(r'^\s*(\d+):\s(.*)', l)
            if m:
                ln = int(m.group(1))
                if 2675 <= ln <= 2705:
                    print(f"{ln}: {m.group(2)}")
    except Exception as e:
        print("Error parsing match:", e)
