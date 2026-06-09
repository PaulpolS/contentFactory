import os

search_dir = "/Users/paulpolsulintaboon/.gemini/antigravity"
found = []

if os.path.exists(search_dir):
    print(f"Scanning App Data Directory: {search_dir}")
    for root, dirs, files in os.walk(search_dir):
        # skip logs unless they might have it
        for file in files:
            path = os.path.join(root, file)
            try:
                size = os.path.getsize(path)
                if size > 50000: # at least 50KB
                    if file.endswith((".tsx", ".ts", ".js", ".json", ".txt")):
                        # Check content
                        with open(path, "r", encoding="utf-8", errors="ignore") as f:
                            first_chars = f.read(5000)
                        if "export default function App" in first_chars or "activeTab === 'canvas'" in first_chars:
                            mtime = os.path.getmtime(path)
                            found.append((path, size, mtime))
            except:
                pass
else:
    print("App Data Dir not found")

print(f"Found {len(found)} candidate files:")
found.sort(key=lambda x: x[2], reverse=True)
for path, size, mtime in found[:20]:
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"- {path} ({size} bytes, modified {dt})")
