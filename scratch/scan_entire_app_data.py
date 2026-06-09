import os

app_data_dir = "/Users/paulpolsulintaboon/.gemini/antigravity"
print(f"Scanning {app_data_dir} for any file containing 'fetchApprovedItems'...")

found = []
for root, dirs, files in os.walk(app_data_dir):
    # Skip logs transcript files because we already checked them
    if ".system_generated/logs" in root:
        continue
    for file in files:
        path = os.path.join(root, file)
        try:
            size = os.path.getsize(path)
            if size > 50000: # at least 50KB
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                if "fetchApprovedItems" in content:
                    mtime = os.path.getmtime(path)
                    print(f"FOUND: {path} | Size: {size} bytes | Mtime: {mtime}")
                    found.append((path, size, mtime))
        except:
            pass

print(f"Scan complete. Found {len(found)} candidates.")
if found:
    found.sort(key=lambda x: x[2], reverse=True)
    for idx, (path, size, mtime) in enumerate(found[:5]):
        print(f"[{idx}] {path}")
