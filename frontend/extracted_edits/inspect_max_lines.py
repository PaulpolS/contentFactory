import json
import os
import re
import subprocess
from datetime import datetime

# Run find command to get all transcript paths
res = subprocess.run(["find", "/Users/paulpolsulintaboon/.gemini/antigravity/brain/", "-name", "transcript.jsonl"], capture_output=True, text=True)
transcripts = [line.strip() for line in res.stdout.split("\n") if line.strip()]

results = []

for tr in transcripts:
    if not os.path.exists(tr):
        continue
    folder = tr.split("/")[-4]
    stat = os.stat(os.path.dirname(os.path.dirname(tr)))
    mtime = datetime.fromtimestamp(stat.st_mtime)
    
    max_line = 0
    try:
        with open(tr, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "App.tsx" in line:
                    # Find any numbers in view_file start/end or line numbers
                    m = re.findall(r'"StartLine":\s*"*(\d+)"*|Header.*lines\s+\d+\s+to\s+(\d+)|Showing lines\s+\d+\s+to\s+(\d+)', line)
                    for match in m:
                        for val in match:
                            if val:
                                max_line = max(max_line, int(val))
                    # Also search inside content for line numbers like "5800: "
                    # or search for "Showing lines X to Y"
                    m_show = re.search(r'Showing lines \d+ to (\d+)', line)
                    if m_show:
                        max_line = max(max_line, int(m_show.group(1)))
    except Exception as e:
        pass
    
    if max_line > 0:
        results.append((mtime, folder, max_line))

results.sort(key=lambda x: x[0])
print("Chronological Max Line Numbers in App.tsx:")
for mtime, folder, max_line in results:
    print(f"  {mtime.isoformat()} : Folder {folder} -> Max Line = {max_line}")
