import os

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

lines = text.split('\n')
replaced = False
for idx, line in enumerate(lines):
    if 'cleanText.split(' in line and 'parts' in line:
        print(f"Found regex line at {idx+1}: {line}")
        lines[idx] = "      const parts = cleanText.split(/[\\s,，。]+/);"
        replaced = True
        break

if replaced:
    with open(file_path, "w", encoding="utf-8") as f:
        f.write('\n'.join(lines))
    print("Success! Overwrote regex line.")
else:
    print("Could not find the regex line.")
