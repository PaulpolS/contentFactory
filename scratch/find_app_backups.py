import os

search_paths = [
    "/Users/paulpolsulintaboon/Documents/GitHub",
    os.path.expanduser("~/Library/Application Support/Code"),
    os.path.expanduser("~/Library/Application Support/Code - Insiders"),
    os.path.expanduser("~/.vscode"),
    os.path.expanduser("~/.cursor"),
    os.path.expanduser("~/Downloads"),
    "/Users/paulpolsulintaboon/.gemini/antigravity"
]

found = []
for search_dir in search_paths:
    if not os.path.exists(search_dir):
        continue
    print(f"Scanning {search_dir}...")
    for root, dirs, files in os.walk(search_dir):
        # Skip some big directories to speed up
        if "node_modules" in root or ".next" in root or "dist" in root or "build" in root or ".git" in root:
            continue
        for file in files:
            if "App" in file and file.endswith(".tsx"):
                path = os.path.join(root, file)
                try:
                    size = os.path.getsize(path)
                    mtime = os.path.getmtime(path)
                    found.append((path, size, mtime))
                except Exception as e:
                    pass

print(f"\nFound {len(found)} App.tsx files:")
# Sort by mtime descending
found.sort(key=lambda x: x[2], reverse=True)
for path, size, mtime in found[:20]:
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"- {path} ({size} bytes, modified {dt})")
