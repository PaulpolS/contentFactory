import os

search_dir = "/Users/paulpolsulintaboon/Documents/GitHub"
backups = []
for root, dirs, files in os.walk(search_dir):
    for file in files:
        if file == "VerticalVideoSuitePortal.tsx":
            path = os.path.join(root, file)
            size = os.path.getsize(path)
            # Check if it has replacement characters
            try:
                with open(path, "r", encoding="utf-8") as f:
                    content = f.read()
                has_garbled = '\ufffd' in content or '犧' in content
                backups.append({"path": path, "size": size, "has_garbled": has_garbled})
            except:
                backups.append({"path": path, "size": size, "has_garbled": "unknown"})

print("Found VerticalVideoSuitePortal.tsx files:")
for b in backups:
    print(f"- {b['path']} (Size: {b['size']}, Garbled: {b['has_garbled']})")
