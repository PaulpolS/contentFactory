import os
import shutil

cursor_history_dir = os.path.expanduser("~/Library/Application Support/Cursor/User/History")
signature = 'fetchApprovedItems'

if os.path.exists(cursor_history_dir):
    print(f"Scanning Cursor history in {cursor_history_dir} for '{signature}'...")
    found = []
    for root, dirs, files in os.walk(cursor_history_dir):
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size > 10000: # at least 10KB
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if signature in content:
                        mtime = os.path.getmtime(path)
                        found.append((path, size, mtime))
            except Exception as e:
                pass
    print(f"Scan complete. Found {len(found)} candidates.")
    if found:
        # Sort by modification time descending (newest first)
        found.sort(key=lambda x: x[2], reverse=True)
        for i, (path, size, mtime) in enumerate(found[:5]):
            print(f"Candidate {i}: {path} (size: {size} bytes, mtime: {mtime})")
        newest_path = found[0][0]
        out_path = "scratch/App_tsx_recovered_cursor.tsx"
        shutil.copy(newest_path, out_path)
        print(f"Saved newest recovered file to {out_path}")
else:
    print("Cursor history directory not found")
