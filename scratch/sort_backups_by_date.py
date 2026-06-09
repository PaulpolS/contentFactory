import os
import time

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
files = [f for f in os.listdir(scratch_dir) if "App" in f]

candidates = []
for f in files:
    path = os.path.join(scratch_dir, f)
    if os.path.isdir(path):
        continue
    mtime = os.path.getmtime(path)
    size = os.path.getsize(path)
    candidates.append((f, size, mtime))

candidates.sort(key=lambda x: x[2])

print("Backups by date (oldest to newest):")
for f, size, mtime in candidates:
    mtime_str = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(mtime))
    print(f"- {f}: {size} bytes | Date: {mtime_str}")
