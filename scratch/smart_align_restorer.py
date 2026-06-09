import os
import re

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    orig_lines = f.readlines()

with open(target_path, "r", encoding="utf-8") as f:
    target_lines = f.readlines()

def clean_sig(line):
    # Remove all Thai, whitespace, punctuation, quotes, backticks, emojis and corrupted characters
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

# Match target lines
restored_count = 0
unmatched_garbled = []

new_target_lines = list(target_lines)

for idx, line in enumerate(target_lines):
    if '\ufffd' in line or '💡' in line or '?' in line:
        has_thai_or_garbled = any(c in line for c in '\ufffd\u0e00\u0e01\u0e02\u0e03\u0e04\u0e05\u0e06\u0e07\u0e08\u0e09\u0e0a\u0e0b\u0e0c\u0e0d\u0e0e\u0e0f\u0e10\u0e11\u0e12\u0e13\u0e14\u0e15\u0e16\u0e17\u0e18\u0e19\u0e1a\u0e1b\u0e1c\u0e1d\u0e1e\u0e1f\u0e20\u0e21\u0e22\u0e23\u0e24\u0e25\u0e26\u0e27\u0e28\u0e29\u0e2a\u0e2b\u0e2c\u0e2d\u0e2e\u0e2f\u0e30\u0e31\u0e32\u0e33\u0e34\u0e35\u0e36\u0e37\u0e38\u0e39\u0e3a\u0e3f\u0e40\u0e41\u0e42\u0e43\u0e44\u0e45\u0e46\u0e47\u0e48\u0e49\u0e4a\u0e4b\u0e4c\u0e4d\u0e4e\u0e4f\u0e50\u0e51\u0e52\u0e53\u0e54\u0e55\u0e56\u0e57\u0e58\u0e59\u0e5a\u0e5b') or '💡' in line
        if has_thai_or_garbled:
            sig = clean_sig(line)
            if len(sig) > 6:
                if sig in orig_map:
                    matches = orig_map[sig]
                    if len(matches) == 1:
                        # Perfect unique structural match!
                        new_target_lines[idx] = matches[0][1]
                        restored_count += 1
                    else:
                        # Multiple matches, choose the one with the closest line index
                        # Find the match that has the smallest index difference
                        best_match = min(matches, key=lambda x: abs(x[0] - idx))
                        new_target_lines[idx] = best_match[1]
                        restored_count += 1
                else:
                    unmatched_garbled.append((idx + 1, line))
            else:
                unmatched_garbled.append((idx + 1, line))

print(f"Unique alignment restored {restored_count} lines!")
print(f"Remaining unmatched lines with potential garbled text: {len(unmatched_garbled)}")
for line_num, content in unmatched_garbled[:30]:
    print(f"Line {line_num}: {content.strip()}")

# Let's save the progress to a temporary file
temp_output = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"
with open(temp_output, "w", encoding="utf-8") as f:
    f.write("".join(new_target_lines))

print("Saved restored lines to VerticalVideoSuitePortal.tsx")
