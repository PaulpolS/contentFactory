file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal_restored.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

lines = text.splitlines()
bad_count = 0
for idx, line in enumerate(lines):
    if "\ufffd" in line:
        bad_count += 1
        if bad_count <= 40:
            print(f"Line {idx+1}: {line}")

print(f"Total lines with replacement chars: {bad_count}")
