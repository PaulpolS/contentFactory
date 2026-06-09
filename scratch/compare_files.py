import os
import re
import difflib

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    orig_text = f.read()

with open(target_path, "r", encoding="utf-8") as f:
    target_text = f.read()

orig_lines = orig_text.splitlines()
target_lines = target_text.splitlines()

# We want to do a clean diff by ignoring Thai text, whitespace, and replacement characters
def clean_for_diff(line):
    line = re.sub(r'[\u0e00-\u0e7f\ufffd?💡]+', '', line)
    return line.strip()

orig_clean = [clean_for_diff(l) for l in orig_lines]
target_clean = [clean_for_diff(l) for l in target_lines]

diff = list(difflib.unified_diff(orig_clean, target_clean, fromfile='original', tofile='target', lineterm=''))
print(f"Total diff lines: {len(diff)}")
for idx, line in enumerate(diff[:200]):
    print(line)
