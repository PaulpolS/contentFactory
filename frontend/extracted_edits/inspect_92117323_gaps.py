import re

with open("scratch/lines_92117323.txt", "r") as f:
    lines = []
    for line in f:
        m = re.match(r'^(\d+): (.*)', line.strip())
        if m:
            lines.append((int(m.group(1)), m.group(2)))

print(f"Total lines in lines_92117323.txt: {len(lines)}")
# Find gaps in the line numbers
keys = [l[0] for l in lines]
gaps = []
start_gap = None
for i in range(keys[0], keys[-1] + 1):
    if i not in keys:
        if start_gap is None:
            start_gap = i
    else:
        if start_gap is not None:
            gaps.append((start_gap, i - 1))
            start_gap = None
if start_gap is not None:
    gaps.append((start_gap, keys[-1]))

print("Gaps in lines_92117323.txt:")
for g in gaps:
    print(f"  Gap: {g[0]} to {g[1]} ({g[1] - g[0] + 1} lines)")
