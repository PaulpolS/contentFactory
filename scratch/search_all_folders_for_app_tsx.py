import os

search_root = os.path.expanduser("~/Library/Application Support")
signature = "export default function App"
found = []

print(f"Scanning {search_root} for files containing '{signature}'...")

# Limit walking to specific directories to avoid slow scans
target_dirs = ["Code", "Cursor", "com.apple.sharedfilelist", "vscode", "cursor"]

for d in os.listdir(search_root):
    if not any(t in d.lower() for t in target_dirs):
        continue
    dir_path = os.path.join(search_root, d)
    if os.path.isdir(dir_path):
        print(f"Scanning sub-dir: {dir_path}")
        for root, subdirs, files in os.walk(dir_path):
            for file in files:
                # We look for files containing App or TSX
                if file.endswith(".tsx") or "app" in file.lower() or file.endswith(".json"):
                    path = os.path.join(root, file)
                    try:
                        size = os.path.getsize(path)
                        if 100000 < size < 1000000: # 100KB to 1MB
                            with open(path, "r", encoding="utf-8", errors="ignore") as f:
                                first_lines = f.read(500)
                            if signature in first_lines:
                                mtime = os.path.getmtime(path)
                                found.append((path, size, mtime))
                    except Exception as e:
                        pass

print(f"\nScan complete. Found {len(found)} candidate files.")
if found:
    found.sort(key=lambda x: x[2], reverse=True)
    for idx, (path, size, mtime) in enumerate(found[:10]):
        import datetime
        dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f"- Candidate {idx}: {path} ({size} bytes, modified {dt})")
