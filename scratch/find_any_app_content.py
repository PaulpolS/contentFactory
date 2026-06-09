import os

search_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory"
found = []

for root, dirs, files in os.walk(search_dir):
    # skip node_modules, dist, .next
    if any(p in root for p in ["node_modules", "dist", ".next", ".git"]):
        continue
    for file in files:
        if file.endswith((".tsx", ".ts", ".js", ".jsx", ".txt", ".bak")):
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size > 5000: # at least 5KB
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        first_chars = f.read(2000)
                    if "export default function App" in first_chars or "export default App" in first_chars:
                        mtime = os.path.getmtime(path)
                        found.append((path, size, mtime))
            except Exception as e:
                pass

print(f"Found {len(found)} candidate files:")
for path, size, mtime in sorted(found, key=lambda x: x[2], reverse=True):
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"- {path} ({size} bytes, modified {dt})")
