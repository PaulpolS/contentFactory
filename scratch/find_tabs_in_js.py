import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/js_end.js"

if os.path.exists(js_path):
    with open(js_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    tabs = ["discovery", "vault", "canvas", "prompt-generator", "vertical-video", "quote-video", "avatar-video", "podcast-clip", "dropbox-csv", "tracking", "settings"]
    for tab in tabs:
        idx = 0
        while True:
            idx = content.find(tab, idx)
            if idx == -1:
                break
            # Print context
            start = max(0, idx - 100)
            end = min(len(content), idx + 250)
            print(f"Tab '{tab}' found at position {idx}:")
            print(f"  {repr(content[start:end])}\n")
            idx += len(tab)
else:
    print("js_end.js not found")
