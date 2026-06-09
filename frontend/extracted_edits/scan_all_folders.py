import os
from datetime import datetime

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/"
folders = [f for f in os.listdir(brain_dir) if os.path.isdir(os.path.join(brain_dir, f))]

folder_times = []
for folder in folders:
    p = os.path.join(brain_dir, folder)
    stat = os.stat(p)
    mtime = datetime.fromtimestamp(stat.st_mtime)
    folder_times.append((folder, mtime))

folder_times.sort(key=lambda x: x[1])

print(f"Total folders: {len(folder_times)}")
for folder, mtime in folder_times:
    tr = os.path.join(brain_dir, folder, ".system_generated/logs/transcript.jsonl")
    has_tr = os.path.exists(tr)
    size_str = f"{os.path.getsize(tr)/1024/1024:.2f} MB" if has_tr else "N/A"
    print(f"{mtime.isoformat()} : {folder} (has transcript: {has_tr}, size: {size_str})")
