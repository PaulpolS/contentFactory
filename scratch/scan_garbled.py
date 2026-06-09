import os

src_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src"
for root, dirs, files in os.walk(src_dir):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css', '.html')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                if '\ufffd' in content:
                    print(f"Found \\ufffd in {file_path} (count: {content.count(chr(65533))})")
            except Exception as e:
                print(f"Error reading {file_path}: {e}")
