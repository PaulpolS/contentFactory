orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Original lines 1300 to 1420:")
for idx in range(1250, 1420):
    if idx < len(lines):
        # Only print lines that contain Thai characters
        line = lines[idx]
        has_thai = any('\u0e00' <= c <= '\u0e7f' for c in line)
        if has_thai or 'handleGenerateScript' in line or 'alert' in line or 'addLog' in line:
            print(f"Line {idx+1}: {line.strip()}")
