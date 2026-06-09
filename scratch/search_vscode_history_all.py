import os

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
signature = 'DiscoveryPortal'
found = []

if os.path.exists(history_dir):
    print(f"Scanning VS Code history in {history_dir}...")
    for root, dirs, files in os.walk(history_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if signature in content:
                    size = os.path.getsize(path)
                    mtime = os.path.getmtime(path)
                    found.append((path, size, mtime))
            except Exception as e:
                pass
    print(f"Scan complete. Found {len(found)} candidates containing '{signature}'.")
    if found:
        found.sort(key=lambda x: x[2], reverse=True)
        for i, (path, size, mtime) in enumerate(found[:20]):
            import datetime
            dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            print(f"- {path} ({size} bytes, modified {dt})")
else:
    print("Not found")
