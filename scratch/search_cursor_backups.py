import os

backups_dir = os.path.expanduser("~/Library/Application Support/Cursor/Backups")
found = []

if os.path.exists(backups_dir):
    print(f"Scanning Cursor Backups in {backups_dir}...")
    for root, dirs, files in os.walk(backups_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if "DiscoveryPortal" in content and "activeTab === 'canvas'" in content:
                    mtime = os.path.getmtime(path)
                    found.append((path, size, mtime))
            except Exception as e:
                pass
    print(f"Scan complete. Found {len(found)} candidates.")
    for idx, (path, size, mtime) in enumerate(found):
        import datetime
        dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f"- Backup {idx}: {path} ({size} bytes, modified {dt})")
else:
    print("Cursor Backups directory does not exist")
