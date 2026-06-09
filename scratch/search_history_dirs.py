import os

search_paths = [
    os.path.expanduser("~/Library/Application Support/Code/User/History"),
    os.path.expanduser("~/Library/Application Support/Cursor/User/History"),
    os.path.expanduser("~/.Trash"),
    os.path.expanduser("~/Downloads"),
    os.path.expanduser("~/Documents")
]

print("Searching for backup copies of App.tsx...")
found = []
for base_path in search_paths:
    if not os.path.exists(base_path):
        continue
    print(f"Searching in {base_path}...")
    for root, dirs, files in os.walk(base_path):
        # Limit search depth in large directories
        if len(root.split(os.sep)) - len(base_path.split(os.sep)) > 4:
            continue
        for file in files:
            if "App.tsx" in file or file == "App.tsx":
                path = os.path.join(root, file)
                try:
                    size = os.path.getsize(path)
                    if size > 100000: # We expect App.tsx to be around 300KB
                        print(f"Found match: {path} (size: {size} bytes)")
                        found.append((path, size))
                except Exception as e:
                    pass

print(f"Search complete. Found {len(found)} candidates.")
