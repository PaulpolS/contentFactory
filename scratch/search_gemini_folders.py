import os

search_dir = "/Users/paulpolsulintaboon/.gemini/antigravity"
found = []

print(f"Scanning {search_dir}...")
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file.endswith((".tsx", ".ts", ".js", ".jsx", ".txt", ".json", ".bak")):
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size > 5000: # at least 5KB
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()
                    if "export default function App" in content and "DiscoveryPortal" in content:
                        mtime = os.path.getmtime(path)
                        found.append((path, size, mtime))
            except Exception as e:
                pass

print(f"\nFound {len(found)} candidate files:")
found.sort(key=lambda x: x[2], reverse=True)
for path, size, mtime in found[:20]:
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"- {path} ({size} bytes, modified {dt})")
