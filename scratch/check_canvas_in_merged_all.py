path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_merged_all.tsx"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines in App_tsx_merged_all.tsx: {len(lines)}")
canvas_starts = []
for idx, l in enumerate(lines, 1):
    if "activeTab === 'canvas'" in l:
        canvas_starts.append(idx)
        print(f"Canvas tab starts at line {idx}: {l.strip()}")

if canvas_starts:
    # Print lines around the start of the first canvas tab
    start = canvas_starts[0]
    print(f"\nLines {start} to {start + 150}:")
    for j in range(start, min(start + 150, len(lines) + 1)):
        print(f"  {j}: {lines[j-1].rstrip()}")
