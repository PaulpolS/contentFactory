import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/dist/assets/index-Drf6c1vB.js"

if os.path.exists(js_path):
    print("JS file exists, searching...")
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    print(f"File size: {len(content)} characters")
    
    # Search for setting section signature
    queries = ["ตั้งค่าพื้นฐาน", "activeLightboxItem", "fetchApprovedItems", "handleUploadAndExportCSV"]
    for q in queries:
        pos = content.find(q)
        if pos != -1:
            print(f"Found '{q}' at character {pos}")
            # Print context
            start = max(0, pos - 150)
            end = min(len(content), pos + 300)
            print(f"Context: {repr(content[start:end])}\n")
        else:
            print(f"'{q}' not found")
else:
    print("JS file not found")
