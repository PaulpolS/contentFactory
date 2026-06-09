import re
import difflib

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    orig_text = f.read()

with open(target_path, "r", encoding="utf-8") as f:
    target_text = f.read()

def strip_strings_and_spaces(text):
    text = re.sub(r"'[^']*'", "''", text)
    text = re.sub(r'"[^"]*"', '""', text)
    text = re.sub(r'`[^`]*`', '``', text)
    text = re.sub(r'[\u0e00-\u0e7f\ufffd?💡]+', '', text)
    lines = [l.strip() for l in text.splitlines()]
    return "\n".join([l for l in lines if l])

orig_clean = strip_strings_and_spaces(orig_text).splitlines()
target_clean = strip_strings_and_spaces(target_text).splitlines()

diff = list(difflib.unified_diff(orig_clean, target_clean, fromfile='original', tofile='target', lineterm=''))
print(f"Clean diff lines: {len(diff)}")
# Let's print diff from line 100 to 450
for line in diff[200:450]:
    print(line)
