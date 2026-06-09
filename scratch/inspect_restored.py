file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal_restored.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines in restored: {len(lines)}")
# Print lines around 1140-1160
for i in range(1135, 1160):
    if i < len(lines):
        print(f"{i+1}: {lines[i].strip()}")
