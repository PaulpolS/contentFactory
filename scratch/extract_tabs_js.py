import os

js_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/dist/assets/index-Drf6c1vB.js"

with open(js_path, "r", encoding="utf-8") as f:
    content = f.read()

# Extract from 1013000 to 1030000
start = 1013000
end = min(len(content), 1030000)

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/lightbox_and_end_compiled.txt", "w", encoding="utf-8") as out:
    out.write(content[start:end])

print(f"Saved compiled lightbox and end section (size {end-start} chars) to scratch/lightbox_and_end_compiled.txt")
