import os
import json

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")

if not os.path.exists(history_dir):
    print("VS Code history directory not found")
    exit(1)

print(f"Scanning VS Code history in {history_dir}...")
candidates = []

for root, dirs, files in os.walk(history_dir):
    for file in files:
        path = os.path.join(root, file)
        try:
            size = os.path.getsize(path)
            # We want files > 100KB which could be App.tsx
            if size > 150000:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    # Read first 1000 chars to check if it looks like App.tsx or contains specific imports
                    header = f.read(2000)
                    if "DiscoveryPortal" in header or "SettingsPortal" in header or "activeTab" in header:
                        mtime = os.path.getmtime(path)
                        candidates.append((path, size, mtime))
                        print(f"Candidate: {path} | Size: {size} bytes | Mtime: {mtime}")
        except Exception as e:
            pass

print(f"Total candidates: {len(candidates)}")
if candidates:
    candidates.sort(key=lambda x: x[2], reverse=True)
    for idx, (path, size, mtime) in enumerate(candidates[:10]):
        print(f"[{idx}] {path} | Size: {size} bytes | Mtime: {mtime}")
        # Copy to scratch directory
        import shutil
        dest = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/vscode_App_history_{idx}_{size}.tsx"
        shutil.copy(path, dest)
        print(f"  Copied to {dest}")
