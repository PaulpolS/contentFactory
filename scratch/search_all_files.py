import os

search_dir = "/Users/paulpolsulintaboon/Documents/GitHub"
signature = 'Cpu className="w-4 h-4 text-slate-900"'

print(f"Scanning {search_dir} for files containing the signature...")
found = []
for root, dirs, files in os.walk(search_dir):
    # Skip node_modules and .git
    if "node_modules" in root or ".git" in root or "dist" in root:
        continue
    for file in files:
        if file.endswith((".tsx", ".ts", ".js", ".bak", ".tmp", ".txt")):
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                    if signature in content:
                        print(f"Found signature in {path} (len: {len(content)})")
                        found.append((path, len(content)))
            except Exception as e:
                pass

print(f"Scan complete. Found {len(found)} files.")
