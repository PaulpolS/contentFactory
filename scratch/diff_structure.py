import os
import re
import difflib

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    orig_lines = f.readlines()

with open(target_path, "r", encoding="utf-8") as f:
    target_lines = f.readlines()

def clean_for_diff(line):
    # Remove whitespace, punctuation, and Thai characters
    line = re.sub(r'[\u0e00-\u0e7f\ufffd?💡]+', '', line)
    return line.strip()

orig_clean = [clean_for_diff(l) for l in orig_lines]
target_clean = [clean_for_diff(l) for l in target_lines]

diff = difflib.unified_diff(orig_clean, target_clean, fromfile='original', tofile='target', lineterm='')

print("Differences in structure (first 100 lines):")
for idx, line in enumerate(diff):
    if idx < 100:
        print(line)
    else:
        break
