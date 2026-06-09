import os

search_dir = "/Users/paulpolsulintaboon/Documents/GitHub"
found = []

if os.path.exists(search_dir):
    print(f"Scanning directory: {search_dir}")
    for root, dirs, files in os.walk(search_dir):
        if "node_modules" in root or "dist" in root or ".git" in root:
            continue
        for file in files:
            if file == "App.tsx":
                path = os.path.join(root, file)
                try:
                    size = os.path.getsize(path)
                    mtime = os.path.getmtime(path)
                    found.append((path, size, mtime))
                except:
                    pass
else:
    print(f"Directory {search_dir} not found")

print(f"Found {len(found)} candidate files:")
for path, size, mtime in sorted(found, key=lambda x: x[2], reverse=True):
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"- {path} ({size} bytes, modified {dt})")
