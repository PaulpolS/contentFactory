import os

search_root = os.path.expanduser("~/Library/Application Support")
if os.path.exists(search_root):
    dirs = [d for d in os.listdir(search_root) if os.path.isdir(os.path.join(search_root, d))]
    print("Directories in Application Support:")
    for d in sorted(dirs):
        print(f"- {d}")
else:
    print("Application Support not found")
