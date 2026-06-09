import os

print("Scanning scratch files for App.tsx data...")
for file in os.listdir("scratch"):
    if file.endswith(".py") and file != "check_prev_write.py":
        try:
            with open(os.path.join("scratch", file), 'r', encoding='utf-8') as f:
                content = f.read()
                if "import React" in content and "canvasImportedItems" in content:
                    print(f"  Found App.tsx content inside: scratch/{file} (len: {len(content)})")
        except Exception as e:
            pass
