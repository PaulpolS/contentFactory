import re
import os

def load_lines(filename):
    line_map = {}
    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            pos = line.find(":")
            if pos != -1:
                try:
                    ln = int(line[:pos])
                    code = line[pos+2:].rstrip("\n")
                    line_map[ln] = code
                except ValueError:
                    pass
    return line_map

# Load current App.tsx lines
with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    current_lines = [line.rstrip("\n") for line in f]
print(f"Current App.tsx has {len(current_lines)} lines.")

# Load other maps
ecc_map = load_lines("scratch/lines_eccbdc81.txt")
v921_map = load_lines("scratch/lines_92117323.txt")
v247_map = load_lines("scratch/lines_247e75b9.txt")

# Initialize the reconstructed map
reconstructed = {}
# Start with lines 1-2681 from the current App.tsx (1-based index)
for i in range(1, 2682):
    reconstructed[i] = current_lines[i-1]

# We want to fill line numbers from 2682 up to 5762
max_target_line = 5762

# Pre-index other maps for quick lookups
def build_indices(line_map):
    content_to_ln = {}
    for ln, code in line_map.items():
        s = code.strip()
        if s and len(s) > 10:
            if s not in content_to_ln:
                content_to_ln[s] = []
            content_to_ln[s].append(ln)
    return content_to_ln

v921_indices = build_indices(v921_map)
v247_indices = build_indices(v247_map)

# Helper function to find local offset around a line number L in target map (ecc_map)
def find_local_offset(target_ln, source_map, source_indices, window=40):
    # Scan a window of lines around target_ln in reconstructed/ecc_map
    offsets = {}
    for i in range(-window, window + 1):
        test_ln = target_ln + i
        if test_ln <= 0:
            continue
        # Get code from target
        code = None
        if test_ln in reconstructed:
            code = reconstructed[test_ln]
        elif test_ln in ecc_map:
            code = ecc_map[test_ln]
            
        if code:
            s_code = code.strip()
            if s_code and len(s_code) > 10:
                if s_code in source_indices:
                    for src_ln in source_indices[s_code]:
                        offset = test_ln - src_ln
                        offsets[offset] = offsets.get(offset, 0) + 1
                        
    if offsets:
        # Get the offset with the maximum count
        sorted_offsets = sorted(offsets.items(), key=lambda x: x[1], reverse=True)
        best_offset, count = sorted_offsets[0]
        if count >= 3: # Must have at least 3 matching lines in the window to be reliable
            return best_offset
    return None

# Now fill lines from 2682 to 5762
filled_ecc = 0
filled_921 = 0
filled_247 = 0
missing_lines = []

for ln in range(2682, max_target_line + 1):
    # 1. Try ecc_map
    if ln in ecc_map:
        reconstructed[ln] = ecc_map[ln]
        filled_ecc += 1
        continue
        
    # 2. Try v921_map
    offset_921 = find_local_offset(ln, v921_map, v921_indices)
    if offset_921 is not None:
        src_ln = ln - offset_921
        if src_ln in v921_map:
            reconstructed[ln] = v921_map[src_ln]
            filled_921 += 1
            continue
            
    # 3. Try v247_map
    offset_247 = find_local_offset(ln, v247_map, v247_indices)
    if offset_247 is not None:
        src_ln = ln - offset_247
        if src_ln in v247_map:
            reconstructed[ln] = v247_map[src_ln]
            filled_247 += 1
            continue
            
    # If not found in either, mark as missing
    missing_lines.append(ln)

print(f"Reconstruction summary:")
print(f"  Lines from current App.tsx: 2681")
print(f"  Lines filled from ecc_map: {filled_ecc}")
print(f"  Lines filled from 92117323: {filled_921}")
print(f"  Lines filled from 247e75b9: {filled_247}")
print(f"  Total missing lines: {len(missing_lines)}")

if missing_lines:
    # Print contiguous ranges of missing lines
    ranges = []
    start_r = None
    for m in missing_lines:
        if start_r is None:
            start_r = m
        elif m != ranges[-1] + 1 if ranges else start_r + 1:
            # wait, let's fix logic
            pass
    # simple print:
    print(f"  Some missing lines: {missing_lines[:50]} ...")

# Write out the reconstructed App.tsx to scratch
with open("scratch/reconstructed_App_raw.tsx", "w", encoding="utf-8") as f:
    for ln in sorted(reconstructed.keys()):
        f.write(reconstructed[ln] + "\n")
print("Saved raw reconstructed file to scratch/reconstructed_App_raw.tsx")
