import json
import os
import re

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/all_fragments.json"

if not os.path.exists(filepath):
    print("all_fragments.json does not exist!")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    fragments = json.load(f)

def search_range(start_target, end_target):
    print(f"\n--- Searching for fragments covering lines {start_target} to {end_target} ---")
    matches = []
    for f in fragments:
        start = f.get("start", 0)
        end = f.get("end", 0)
        # Check if the fragment overlaps significantly or fully covers
        if start <= start_target and end >= end_target:
            matches.append(f)
            
    print(f"Found {len(matches)} fragments that fully cover this range.")
    # Print the newest matches (by step or folder size)
    matches.sort(key=lambda x: x.get("step"), reverse=True)
    for m in matches[:3]:
        print(f"  Folder: {m.get('folder')} | Step: {m.get('step')} | Range: {m.get('start')}-{m.get('end')}")
        # Let's extract and show the relevant lines
        content_str = m.get("content", "")
        # Parse the lines
        lines_dict = {}
        preamble_end = content_str.find('Please note that any changes targeting the original code should remove the line number, colon, and leading space.')
        if preamble_end != -1:
            code_start = content_str.find('\n', preamble_end)
            if code_start != -1:
                code_portion = content_str[code_start + 1:]
                for marker in ['The above content shows the entire', 'The above content does NOT show the entire', 'NOTE: The output was truncated']:
                    idx = code_portion.find(marker)
                    if idx != -1:
                        code_portion = code_portion[:idx]
                for raw_line in code_portion.split('\n'):
                    line_match = re.match(r'^(\d+): ?(.*)$', raw_line)
                    if line_match:
                        line_num = int(line_match.group(1))
                        lines_dict[line_num] = line_match.group(2)
                        
        # Print the lines in our target range
        for ln in range(start_target, end_target + 1):
            if ln in lines_dict:
                print(f"    {ln:4d}: {lines_dict[ln]}")
            else:
                print(f"    {ln:4d}: MISSING in parsed lines_dict")

search_range(2725, 2745)
search_range(2785, 2805)
search_range(3800, 3820)
search_range(5055, 5080)
