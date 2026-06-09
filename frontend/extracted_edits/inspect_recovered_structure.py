import re

with open("/Users/paulpolsulintaboon/.gemini/antigravity/brain/e9655d99-64e7-4443-b6dc-945f61748186/scratch/recovered_lines.txt", "r") as f:
    lines = f.readlines()

print(f"Total lines in recovered_lines.txt: {len(lines)}")
for idx, line in enumerate(lines):
    if "===" in line or "Showing lines" in line or "GAP" in line:
        print(f"Line {idx+1}: {line.strip()}")
