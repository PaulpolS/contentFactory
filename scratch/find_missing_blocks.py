import os
import subprocess
import json
import re

res = subprocess.run(["find", "/Users/paulpolsulintaboon/.gemini/antigravity/brain/", "-name", "transcript.jsonl"], capture_output=True, text=True)
transcripts = [line.strip() for line in res.stdout.split("\n") if line.strip()]

with open("frontend/src/App.tsx", "r", encoding="utf-8") as f:
    current_lines = [line.rstrip("\n") for line in f]

all_maps = []
for tr in transcripts:
    if not os.path.exists(tr):
        continue
    folder = tr.split("/")[-4]
    if folder == "e9655d99-64e7-4443-b6dc-945f61748186":
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
        pass
    if line_map:
        all_maps.append((folder, line_map))

def get_mtime(folder):
    p = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}"
    return os.stat(p).st_mtime if os.path.exists(p) else 0

all_maps.sort(key=lambda x: get_mtime(x[0]), reverse=True)

def is_significant(code):
    s = code.strip()
    if not s or len(s) < 15:
        return False
    if re.match(r'^[\s\}\)\]\<\>\/]*$', s):
        return False
    boilerplate = [
        "children:[", "children: (", "children: [", "children: Y.jsx", "className:", "style:", "children:", 
        "</div>", "</Fragment>", ");", "})", "]}", ")}", "const ", "let ", "return ("
    ]
    if any(s.startswith(b) or s == b for b in boilerplate):
        return False
    return True

reconstructed = {}
for i in range(1, 2682):
    reconstructed[i] = current_lines[i-1]

ecc_folder = "eccbdc81-f670-4dae-922b-0be80b80189b"
ecc_map = next((m for f, m in all_maps if f == ecc_folder), {})
for ln in range(2682, 5763):
    if ln in ecc_map:
        reconstructed[ln] = ecc_map[ln]

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
        if count >= 3:
            return best_offset
    return None

for pass_num in range(1, 3):
    for ln in range(2682, 5763):
        if ln in reconstructed:
            continue
        found = False
        for folder, line_map, indices in map_indices:
            offset = find_local_offset(ln, line_map, indices)
            if offset is not None:
                src_ln = ln - offset
                if src_ln in line_map:
                    code = line_map[src_ln]
                    code = code.replace('\\"', '"').replace('\\`', '`').replace('\\\\', '\\')
                    reconstructed[ln] = code
                    found = True
                    break

missing = []
for ln in range(2682, 5763):
    if ln not in reconstructed:
        missing.append(ln)

ranges = []
if missing:
    start = missing[0]
    for i in range(1, len(missing)):
        if missing[i] != missing[i-1] + 1:
            ranges.append((start, missing[i-1]))
            start = missing[i]
    ranges.append((start, missing[-1]))

print(f"Correct missing ranges: {ranges}")
print(f"Total missing: {len(missing)}")
