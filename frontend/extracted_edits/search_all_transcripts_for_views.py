import json
import os
import re
import subprocess

# Run find command to get all transcript paths
res = subprocess.run(["find", "/Users/paulpolsulintaboon/.gemini/antigravity/brain/", "-name", "transcript.jsonl"], capture_output=True, text=True)
transcripts = [line.strip() for line in res.stdout.split("\n") if line.strip()]

print(f"Found {len(transcripts)} transcripts.")

matches = []

for tr in transcripts:
    if not os.path.exists(tr):
        continue
    folder = tr.split("/")[-4]
    try:
        with open(tr, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                if "App.tsx" in line and "Showing lines" in line:
                    try:
                        data = json.loads(line)
                        content = data.get("content", "")
                        step = data.get("step_index")
                        
                        m = re.search(r'Showing lines (\d+) to (\d+)', content)
                        if m:
                            start = int(m.group(1))
                            end = int(m.group(2))
                            
                            # We are looking for lines between 2680 and 3280
                            overlap_start = max(2680, start)
                            overlap_end = min(3280, end)
                            if overlap_start < overlap_end:
                                matches.append({
                                    "folder": folder,
                                    "step": step,
                                    "start": start,
                                    "end": end,
                                    "overlap": overlap_end - overlap_start
                                })
                    except Exception:
                        pass
    except Exception as e:
        print(f"Error reading {tr}: {e}")

# Sort matches by folder and step
matches.sort(key=lambda x: (x["folder"], x["step"]))
print(f"Total overlapping steps found: {len(matches)}")
for m in matches[:50]: # Print first 50
    print(f"Folder: {m['folder']}, Step: {m['step']}, Lines: {m['start']} to {m['end']}, Overlap: {m['overlap']}")

# Summarize overlaps by folder
summary = {}
for m in matches:
    f = m["folder"]
    summary[f] = summary.get(f, 0) + m["overlap"]
print("\nOverlaps summary by folder:")
for f, total_overlap in sorted(summary.items(), key=lambda x: x[1], reverse=True):
    print(f"  Folder {f}: total overlap = {total_overlap} lines")
