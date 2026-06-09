import json
import os
import re

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/all_fragments.json"
out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_merged_all.tsx"

if not os.path.exists(filepath):
    print("all_fragments.json does not exist!")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    fragments = json.load(f)

print(f"Loaded {len(fragments)} fragments.")

# We want to group fragments by folder or just merge all based on a global chronological order?
# The transcript folders are separate conversations. Let's see all folders present.
folders = set(f.get("folder") for f in fragments)
print(f"Folders present: {folders}")

# Let's count how many fragments are in each folder
for folder in folders:
    count = sum(1 for f in fragments if f.get("folder") == folder)
    max_step = max(f.get("step") for f in fragments if f.get("folder") == folder)
    print(f"  Folder: {folder} | Count: {count} | Max Step: {max_step}")

# Let's write a parser that extracts lines from the content string
def extract_lines(content_str):
    # Find "Showing lines X to Y"
    show_match = re.search(r'Showing lines (\d+) to (\d+)', content_str)
    if not show_match:
        return None
    
    start_line = int(show_match.group(1))
    end_line = int(show_match.group(2))
    
    # Find the position after the preamble
    preamble_end = content_str.find('Please note that any changes targeting the original code should remove the line number, colon, and leading space.')
    if preamble_end == -1:
        return None
    
    code_start = content_str.find('\n', preamble_end)
    if code_start == -1:
        return None
    
    code_portion = content_str[code_start + 1:]
    
    # Remove trailing messages
    for marker in [
        'The above content shows the entire',
        'The above content does NOT show the entire',
        'NOTE: The output was truncated'
    ]:
        idx = code_portion.find(marker)
        if idx != -1:
            code_portion = code_portion[:idx]
            
    lines_dict = {}
    raw_lines = code_portion.split('\n')
    for raw_line in raw_lines:
        if not raw_line:
            continue
        line_match = re.match(r'^(\d+): ?(.*)$', raw_line)
        if line_match:
            line_num = int(line_match.group(1))
            code = line_match.group(2)
            lines_dict[line_num] = code
            
    return lines_dict

# Let's merge the folders.
# Let's merge fragments from "247e75b9-4826-40df-8e90-5fa35311e2ea" specifically.
target_folder = "247e75b9-4826-40df-8e90-5fa35311e2ea"
out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_merged_247e.tsx"
folder_frags = [f for f in fragments if f.get("folder") == target_folder]
print(f"\nMerging folder: {target_folder} ({len(folder_frags)} fragments)...")

# Sort by step ascending
folder_frags.sort(key=lambda x: x.get("step"))

merged_lines = {}
for f in folder_frags:
    lines = extract_lines(f.get("content", ""))
    if lines:
        for line_num, code in lines.items():
            merged_lines[line_num] = code

if not merged_lines:
    print("No lines merged!")
    exit(1)

sorted_keys = sorted(merged_lines.keys())
print(f"Total merged lines: {len(sorted_keys)}")
print(f"Line range: {sorted_keys[0]} to {sorted_keys[-1]}")

# Find gaps
gaps = []
for i in range(1, len(sorted_keys)):
    if sorted_keys[i] - sorted_keys[i-1] > 1:
        gaps.append((sorted_keys[i-1] + 1, sorted_keys[i] - 1))
        
if gaps:
    print(f"Gaps found: {len(gaps)}")
    for start, end in gaps[:10]:
        print(f"  Missing: {start} to {end} ({end - start + 1} lines)")
    if len(gaps) > 10:
        print("  ...")
else:
    print("NO GAPS FOUND! Complete file recovered!")

# Write output file
with open(out_path, "w", encoding="utf-8") as f:
    # Fill in the file line by line
    max_line = sorted_keys[-1]
    for ln in range(1, max_line + 1):
        if ln in merged_lines:
            f.write(merged_lines[ln] + "\n")
        else:
            f.write(f"// MISSING LINE {ln}\n")
            
print(f"Merged output saved to {out_path}")
