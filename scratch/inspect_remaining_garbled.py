import os
import re

target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(target_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Remaining garbled lines:")
count = 0
for idx, line in enumerate(lines):
    if '\ufffd' in line:
        print(f"Line {idx+1}: {line.strip()}")
        count += 1
        if count >= 50:
            break
