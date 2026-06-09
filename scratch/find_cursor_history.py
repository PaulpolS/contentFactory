import os
import glob

search_dirs = [
    "/Users/paulpolsulintaboon/Library/Application Support/Cursor/User/History",
    "/Users/paulpolsulintaboon/Library/Application Support/Code/User/History",
    "/Users/paulpolsulintaboon/Library/Application Support/Code - Insiders/User/History",
]

found = []
for sd in search_dirs:
    if os.path.exists(sd):
        print(f"Scanning: {sd}")
        # Search recursively for files
        for root, dirs, files in os.walk(sd):
            for file in files:
                file_path = os.path.join(root, file)
                try:
                    if os.path.getsize(file_path) > 50000: # >50KB
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        if "activeTab === 'canvas'" in content and "const API_BASE" in content:
                            mtime = os.path.getmtime(file_path)
                            found.append((file_path, mtime, len(content)))
                except:
                    pass
    else:
        print(f"Not found: {sd}")

print(f"Found {len(found)} candidates:")
found.sort(key=lambda x: x[1], reverse=True)
for path, mtime, size in found[:10]:
    import datetime
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S')
    print(f"Path: {path}, Size: {size}, Modified: {dt}")
