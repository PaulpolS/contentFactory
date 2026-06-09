import os
import json

edits_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/extracted_edits"

if os.path.exists(edits_dir):
    print("Listing extracted edits:")
    for file in os.listdir(edits_dir):
        path = os.path.join(edits_dir, file)
        if os.path.isfile(path):
            try:
                size = os.path.getsize(path)
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                # Check if it mentions App.tsx
                has_app = "App.tsx" in content
                # Search if it contains CodeContent or ReplacementContent with high length
                print(f"File: {file}, Size: {size} bytes, Mentions App.tsx: {has_app}")
            except Exception as e:
                print(f"Error on {file}: {e}")
else:
    print("Directory does not exist")
