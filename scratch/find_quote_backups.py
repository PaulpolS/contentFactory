import os

search_dir = "/Users/paulpolsulintaboon/"
found = []
# Limit search to Documents and Desktop to make it fast
target_dirs = ["/Users/paulpolsulintaboon/Documents", "/Users/paulpolsulintaboon/Desktop"]
for t_dir in target_dirs:
    if os.path.exists(t_dir):
        for root, dirs, files in os.walk(t_dir):
            # Skip node_modules or large dirs to be safe
            if "node_modules" in root or ".git" in root or "Library" in root:
                continue
            for file in files:
                if file == "QuoteVideoPortal.tsx":
                    path = os.path.join(root, file)
                    try:
                        size = os.path.getsize(path)
                        found.append((path, size))
                    except:
                        pass

print("Found QuoteVideoPortal.tsx copies:")
for path, size in found:
    print(f"- {path} (Size: {size})")
