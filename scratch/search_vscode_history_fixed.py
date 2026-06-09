import os
import shutil
import datetime

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")
signature = 'export default function App'
found = []

if os.path.exists(history_dir):
    print(f"Scanning VS Code history in {history_dir}...")
    for root, dirs, files in os.walk(history_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size > 100000: # We want the big App.tsx, which is >100KB
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if signature in content and "DiscoveryPortal" in content:
                        mtime = os.path.getmtime(path)
                        found.append((path, size, mtime))
            except Exception as e:
                pass
    print(f"Scan complete. Found {len(found)} candidates.")
    if found:
        # Sort by modification time descending (newest first)
        found.sort(key=lambda x: x[2], reverse=True)
        for i, (path, size, mtime) in enumerate(found[:10]):
            dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
            print(f"Candidate {i}: {path} (size: {size} bytes, mtime: {dt})")
            
        newest_path = found[0][0]
        out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_recovered_history.tsx"
        shutil.copy(newest_path, out_path)
        print(f"Saved newest recovered file to {out_path}")
    else:
        print("No candidates found.")
else:
    print("VS Code history directory not found")
