import re

# Read the last 30 lines of current App.tsx (1-based lines 2650 to 2681)
with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r") as f:
    current_lines = f.readlines()
target_anchor = [line.strip() for line in current_lines[-15:] if line.strip()]

print("Target anchors from current App.tsx:")
for a in target_anchor:
    print(f"  {a}")

older_files = [
    "scratch/lines_eccbdc81.txt",
    "scratch/lines_92117323.txt",
    "scratch/lines_23940d18.txt",
    "scratch/lines_247e75b9.txt"
]

for filename in older_files:
    print(f"\nScanning {filename}...")
    with open(filename, "r") as f:
        file_lines = []
        for line in f:
            m = re.match(r'^(\d+): (.*)', line.strip())
            if m:
                file_lines.append((int(m.group(1)), m.group(2).strip()))
                
    # Search for target anchor in file_lines
    # We look for a sequence of matching line contents
    best_match_idx = -1
    best_match_score = 0
    
    for i in range(len(file_lines) - len(target_anchor) + 1):
        score = 0
        for j in range(len(target_anchor)):
            if file_lines[i + j][1] == target_anchor[j]:
                score += 1
        if score > best_match_score:
            best_match_score = score
            best_match_idx = i
            
    if best_match_score >= 5:
        matched_line_num = file_lines[best_match_idx][0]
        offset = 2681 - matched_line_num
        print(f"  MATCH FOUND at line {matched_line_num} in older file (score {best_match_score}/{len(target_anchor)})")
        print(f"  Offset (current - older) = {offset}")
        # Print next 5 lines from older file to see what comes next
        print("  Next 5 lines in older file:")
        for k in range(5):
            idx = best_match_idx + len(target_anchor) + k
            if idx < len(file_lines):
                print(f"    {file_lines[idx][0]}: {file_lines[idx][1]}")
    else:
        print(f"  No match found (best score {best_match_score})")
