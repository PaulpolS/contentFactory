import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/dist/assets/index-Drf6c1vB.js"

if os.path.exists(js_path):
    print("JS file found!")
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    # Let's find '⚙️ ตั้งค่าพื้นฐาน'
    pos = content.find("⚙️ ตั้งค่าพื้นฐาน")
    if pos != -1:
        print(f"Found '⚙️ ตั้งค่าพื้นฐาน' at index {pos}")
        # Let's extract 50,000 characters before and after to cover the Canvas tab
        start = max(0, pos - 2000)
        end = min(len(content), pos + 100000)
        
        snippet = content[start:end]
        print(f"Extracted snippet of size {len(snippet)}")
        
        # Let's write the raw snippet
        with open("scratch/canvas_js_raw.txt", "w", encoding="utf-8") as out_f:
            out_f.write(snippet)
        print("Wrote raw snippet to scratch/canvas_js_raw.txt")
        
        # Let's do a simple formatting: replace commas/semicolons and braces with newlines
        formatted = snippet
        # Replace JSX markers to make it somewhat readable
        # e.g. children:[ -> children:[\n
        formatted = formatted.replace("children:[", "children:[\n")
        formatted = formatted.replace("({", "(\n{")
        formatted = formatted.replace("})", "}\n)")
        formatted = formatted.replace("},", "},\n")
        formatted = formatted.replace("],", "],\n")
        
        with open("scratch/canvas_js_formatted.txt", "w", encoding="utf-8") as out_f:
            out_f.write(formatted)
        print("Wrote formatted snippet to scratch/canvas_js_formatted.txt")
        
    else:
        print("Keyword not found")
else:
    print("JS file not found")
