import os
import shutil

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
print(f"Scanning {brain_dir} for App.tsx files...")

found_files = []
for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if "App" in file and file.endswith(".tsx"):
            path = os.path.join(root, file)
            size = os.path.getsize(path)
            mtime = os.path.getmtime(path)
            found_files.append((path, size, mtime))

print(f"Found {len(found_files)} files:")
# Sort by mtime descending (newest first)
found_files.sort(key=lambda x: x[2], reverse=True)
for idx, (path, size, mtime) in enumerate(found_files):
    print(f"  [{idx}] Path: {path}")
    print(f"      Size: {size} bytes | Mtime: {mtime}")
    
    # If the size is large and not in our current conversation, save a copy of it
    if size > 250000 and "e9655d99-64e7-4443-b6dc-945f61748186" not in path:
        dest = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/found_App_{idx}.tsx"
        shutil.copy(path, dest)
        print(f"      ---> Copied to {dest}")
