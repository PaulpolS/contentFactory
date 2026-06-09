import os
import shutil

history_paths = [
    os.path.expanduser("~/Library/Application Support/Code/User/History"),
    os.path.expanduser("~/Library/Application Support/Code - Insiders/User/History"),
    os.path.expanduser("~/Library/Application Support/Cursor/User/History"),
    os.path.expanduser("~/.config/Code/User/History"),
    os.path.expanduser("~/.config/Cursor/User/History")
]

signature = 'DiscoveryPortal'
found = []

for history_dir in history_paths:
    if os.path.exists(history_dir):
        print(f"Scanning {history_dir} for '{signature}'...")
        for root, dirs, files in os.walk(history_dir):
            for file in files:
                path = os.path.join(root, file)
                try:
                    size = os.path.getsize(path)
                    if size > 50000: # at least 50KB
                        with open(path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        if signature in content and "export default function App" in content:
                            mtime = os.path.getmtime(path)
                            found.append((path, size, mtime, history_dir))
                except Exception as e:
                    pass

print(f"\nScan complete. Found {len(found)} candidates.")
if found:
    # Sort by mtime descending
    found.sort(key=lambda x: x[2], reverse=True)
    for idx, (path, size, mtime, hdir) in enumerate(found[:10]):
        import datetime
        dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
        print(f"- Candidate {idx}: {path} ({size} bytes, modified {dt}) from {hdir}")
        
    # Copy the newest candidate to scratch
    newest_path = found[0][0]
    out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_recovered_history.tsx"
    shutil.copy(newest_path, out_path)
    print(f"Saved newest candidate to {out_path}")
else:
    print("No candidates found.")
