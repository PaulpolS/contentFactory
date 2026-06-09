import re

def load_lines(filename):
    line_map = {}
    with open(filename, "r", encoding="utf-8") as f:
        for line in f:
            # Lines are formatted as "123: code" or "123:  code"
            # Note: the code might have leading whitespace which is crucial
            # Let's split by the first colon
            pos = line.find(":")
            if pos != -1:
                try:
                    ln = int(line[:pos])
                    code = line[pos+2:].rstrip("\n") # Skip colon and space, keep leading indent
                    line_map[ln] = code
                except ValueError:
                    pass
    return line_map

# Load all line maps
ecc_map = load_lines("scratch/lines_eccbdc81.txt")
v921_map = load_lines("scratch/lines_92117323.txt")
v239_map = load_lines("scratch/lines_23940d18.txt")
v247_map = load_lines("scratch/lines_247e75b9.txt")

# Let's build a map from content string to line number in ecc
content_to_ecc = {}
for ln, code in ecc_map.items():
    s_code = code.strip()
    if s_code and len(s_code) > 10: # Only match significant lines
        if s_code not in content_to_ecc:
            content_to_ecc[s_code] = []
        content_to_ecc[s_code].append(ln)

# Find alignment offsets for each of the other maps
def find_offsets(other_map, name):
    offsets = {}
    for ln, code in other_map.items():
        s_code = code.strip()
        if s_code in content_to_ecc:
            for ecc_ln in content_to_ecc[s_code]:
                offset = ecc_ln - ln
                offsets[offset] = offsets.get(offset, 0) + 1
    
    # Filter offsets with high counts
    sorted_offsets = sorted(offsets.items(), key=lambda x: x[1], reverse=True)
    print(f"\nOffsets for {name}:")
    for offset, count in sorted_offsets[:5]:
        print(f"  Offset {offset}: count = {count}")
    return sorted_offsets

find_offsets(v921_map, "92117323")
find_offsets(v239_map, "23940d18")
find_offsets(v247_map, "247e75b9")
