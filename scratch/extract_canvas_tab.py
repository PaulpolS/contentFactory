import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/js_end.js"

if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    pos = content.find("ตั้งค่าพื้นฐาน")
    if pos != -1:
        print(f"Found at {pos}")
        # Find where e===`settings` starts
        end_pos = content.find("e===`settings`", pos)
        if end_pos != -1:
            print(f"e===`settings` found at {end_pos}")
            # Save the text in between to a file
            out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/canvas_tab_jsx.js"
            with open(out_path, "w", encoding="utf-8") as out:
                out.write(content[pos-500:end_pos+300])
            print(f"Saved to {out_path}")
        else:
            print("e===`settings` not found")
    else:
        print("ตั้งค่าพื้นฐาน not found")
else:
    print("js_end.js not found")
