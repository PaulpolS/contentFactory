import os
import re

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/dist/assets/index-Drf6c1vB.js"

with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find the canvas tab start. Minified: e==="canvas" or e==='canvas' or e===`canvas`
matches = []
for pattern in [r'e==="canvas"', r"e==='canvas'", r"e===`canvas`"]:
    for m in re.finditer(pattern, content):
        matches.append((m.start(), m.group(0)))

print(f"Canvas tab matches: {matches}")
for pos, pat in matches:
    # Print 200 characters before and 300 after
    start = max(0, pos - 200)
    end = min(len(content), pos + 300)
    print(f"  Pos: {pos} | Context: {content[start:end]!r}\n")
