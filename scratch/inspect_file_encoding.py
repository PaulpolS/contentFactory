file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines read: {len(lines)}")
# Print lines around 1144
for i in range(1135, 1155):
    if i < len(lines):
        print(f"{i+1}: {repr(lines[i])}")
