import os

history_dir = os.path.expanduser("~/Library/Application Support/Code/User/History")

if not os.path.exists(history_dir):
    print("VS Code history directory not found")
    exit(1)

print("Listing VS Code history files...")
count = 0
large_files = []

for root, dirs, files in os.walk(history_dir):
    for file in files:
        count += 1
        path = os.path.join(root, file)
        try:
            size = os.path.getsize(path)
            if size > 100000:
                large_files.append((path, size))
        except:
            pass

print(f"Total files in history directory: {count}")
print(f"Total large files (>100KB): {len(large_files)}")
for path, size in large_files[:20]:
    print(f"  {path} | Size: {size} bytes")
