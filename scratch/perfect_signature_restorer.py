import os
import re

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    orig_text = f.read()

with open(target_path, "r", encoding="utf-8") as f:
    target_text = f.read()

orig_lines = orig_text.splitlines(keepends=True)
target_lines = target_text.splitlines(keepends=True)

def clean_sig(line):
    # Strip all Thai, whitespace, punctuation, quotes, backticks, emojis and question marks
    line = re.sub(r'[\u0e00-\u0e7f\ufffd?💡]+', '', line)
    line = re.sub(r'[^a-zA-Z0-9]', '', line)
    return line

# Build a mapping of signature -> list of (line_index, original_line)
orig_map = {}
for idx, line in enumerate(orig_lines):
    sig = clean_sig(line)
    if len(sig) > 6:
        if sig not in orig_map:
            orig_map[sig] = []
        orig_map[sig].append((idx, line))

# Match all target lines by signature and replace with original lines
restored_count = 0
for idx, line in enumerate(target_lines):
    # Ignore top imports and inline helper functions that are unique to target
    if idx < 765:
        # These are imports, styles, and inline helpers. We keep them clean or restore them separately.
        continue
    
    sig = clean_sig(line)
    if len(sig) > 6:
        if sig in orig_map:
            matches = orig_map[sig]
            if len(matches) == 1:
                # Perfect unique structural match!
                target_lines[idx] = matches[0][1]
                restored_count += 1
            else:
                # Multiple matches, choose closest index
                best_match = min(matches, key=lambda x: abs(x[0] - idx))
                target_lines[idx] = best_match[1]
                restored_count += 1

print(f"Pristine signature restorer aligned and restored {restored_count} lines!")

# Write it back
with open(target_path, "w", encoding="utf-8") as f:
    f.write("".join(target_lines))

print("Successfully wrote restored lines back to VerticalVideoSuitePortal.tsx")
