import json
import os
import re
import subprocess

# 1. Run find command to get all transcript paths
res = subprocess.run(["find", "/Users/paulpolsulintaboon/.gemini/antigravity/brain/", "-name", "transcript.jsonl"], capture_output=True, text=True)
transcripts = [line.strip() for line in res.stdout.split("\n") if line.strip()]

print(f"Found {len(transcripts)} transcripts.")

# Load current App.tsx lines
with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    current_lines = [line.rstrip("\n") for line in f]

all_maps = []

for tr in transcripts:
    if not os.path.exists(tr):
        continue
    folder = tr.split("/")[-4]
    if folder == "e9655d99-64e7-4443-b6dc-945f61748186": # skip current
        continue
        
    line_map = {}
    try:
        with open(tr, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                if "App.tsx" in line and "Showing lines" in line:
                    try:
                        data = json.loads(line)
                        content = data.get("content", "")
                        lines_in_content = content.split("\n")
                        for lc in lines_in_content:
                            m_line = re.match(r'^\s*(\d+):\s(.*)', lc)
                            if m_line:
                                ln_num = int(m_line.group(1))
                                ln_code = m_line.group(2)
                                line_map[ln_num] = ln_code
                    except Exception:
                        pass
    except Exception as e:
        print(f"Error reading {tr}: {e}")
        
    if line_map:
        all_maps.append((folder, line_map))

# Sort all_maps by folder modification time in descending order
def get_mtime(folder):
    p = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}"
    return os.stat(p).st_mtime if os.path.exists(p) else 0

all_maps.sort(key=lambda x: get_mtime(x[0]), reverse=True)

# Helper to check if a line is significant (to prevent false alignment)
def is_significant(code):
    s = code.strip()
    if not s:
        return False
    if len(s) < 15:
        return False
    # Ignore lines that are just closing braces/tags
    if re.match(r'^[\s\}\)\]\<\>\/]*$', s):
        return False
    # Ignore common JSX tags/props boilerplate
    boilerplate = [
        "children:[", "children: (", "children: [", "children: Y.jsx", "className:", "style:", "children:", 
        "</div>", "</Fragment>", ");", "})", "]}", ")}", "const ", "let ", "return ("
    ]
    if any(s.startswith(b) or s == b for b in boilerplate):
        return False
    return True

# Initialize the reconstructed map with lines 1-2681 from the current App.tsx
reconstructed = {}
for i in range(1, 2682):
    reconstructed[i] = current_lines[i-1]

# Fill with ecc_map first (newest reference)
ecc_folder = "eccbdc81-f670-4dae-922b-0be80b80189b"
ecc_map = next((m for f, m in all_maps if f == ecc_folder), {})
for ln in range(2682, 5763):
    if ln in ecc_map:
        reconstructed[ln] = ecc_map[ln]

# Pre-build content indices for significant lines in each map
map_indices = []
for folder, line_map in all_maps:
    indices = {}
    for ln, code in line_map.items():
        if is_significant(code):
            s = code.strip()
            if s not in indices:
                indices[s] = []
            indices[s].append(ln)
    map_indices.append((folder, line_map, indices))

# Helper to find local offset using strict matching of significant lines
def find_local_offset(target_ln, source_map, source_indices, window=50):
    offsets = {}
    for i in range(-window, window + 1):
        test_ln = target_ln + i
        if test_ln <= 0:
            continue
        code = reconstructed.get(test_ln)
        if code and is_significant(code):
            s_code = code.strip()
            if s_code in source_indices:
                for src_ln in source_indices[s_code]:
                    offset = test_ln - src_ln
                    offsets[offset] = offsets.get(offset, 0) + 1
    if offsets:
        sorted_offsets = sorted(offsets.items(), key=lambda x: x[1], reverse=True)
        best_offset, count = sorted_offsets[0]
        if count >= 3: # Need at least 3 matching significant lines in the window
            return best_offset
    return None

# Multiple passes to fill gaps
for pass_num in range(1, 4):
    filled_count = 0
    missing_lines = []
    
    for ln in range(2682, 5763):
        if ln in reconstructed:
            continue
            
        found = False
        for folder, line_map, indices in map_indices:
            offset = find_local_offset(ln, line_map, indices)
            if offset is not None:
                src_ln = ln - offset
                if src_ln in line_map:
                    # Clean escaped strings in content
                    code = line_map[src_ln]
                    # Fix escaped quotes or backticks if any
                    code = code.replace('\\"', '"').replace('\\`', '`').replace('\\\\', '\\')
                    reconstructed[ln] = code
                    filled_count += 1
                    found = True
                    break
        if not found:
            missing_lines.append(ln)
            
    print(f"Pass {pass_num}: filled {filled_count} lines. Remaining missing: {len(missing_lines)}")
    if not missing_lines:
        break

print(f"\nFinal missing lines: {len(missing_lines)}")

# Save final reconstructed file
with open("scratch/reconstructed_App_strict.tsx", "w", encoding="utf-8") as f:
    for ln in sorted(reconstructed.keys()):
        f.write(reconstructed[ln] + "\n")
print("Saved strict reconstructed file to scratch/reconstructed_App_strict.tsx")
