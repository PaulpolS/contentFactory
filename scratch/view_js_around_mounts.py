import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/js_end.js"

if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    start = 111500
    end = 114000
    print(f"Content from {start} to {end}:")
    print(content[start:end])
else:
    print("Not found")
