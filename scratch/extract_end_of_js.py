import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/dist/assets/index-Drf6c1vB.js"
out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/js_end.js"

if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    start_pos = 900000
    print(f"File size: {len(content)}. Extracting from {start_pos}...")
    with open(out_path, "w", encoding="utf-8") as out:
        out.write(content[start_pos:])
    print(f"Saved to {out_path}")
else:
    print("JS not found")
