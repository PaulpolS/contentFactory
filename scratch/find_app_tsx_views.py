import os
import glob
import json

directory = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/extracted_edits"
files = glob.glob(os.path.join(directory, "*.json"))

print(f"Found {len(files)} JSON files in extracted_edits.")
for f in files:
    try:
        with open(f, 'r', encoding='utf-8') as file:
            data = json.load(file)
            target = data.get("args", {}).get("TargetFile", "")
            if "App.tsx" in target:
                print(f"Found edit targeting App.tsx: {f}")
    except Exception as e:
        print(f"Error reading {f}: {e}")
