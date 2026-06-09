import os

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
signature = 'fetchApprovedItems'

if os.path.exists(history_dir):
    print(f"Scanning VS Code history in {history_dir} for {signature}...")
    found = []
    for root, dirs, files in os.walk(history_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size > 10000: # at least 10KB
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if signature in content:
                        print(f"FOUND match: {path} (size: {size} bytes)")
                        found.append((path, size))
            except Exception as e:
                pass
    print(f"Scan complete. Found {len(found)} candidates.")
    if found:
        found.sort(key=lambda x: os.path.getmtime(x[0]), reverse=True)
        # Filter out the one in the project directory if it's there
        # but User/History only has history files, not project files.
        newest_path = found[0][0]
        out_path = "scratch/App_tsx_recovered_history.tsx"
        import shutil
        shutil.copy(newest_path, out_path)
        print(f"Saved recovered file to {out_path}")
else:
    print("VS Code history directory not found")
