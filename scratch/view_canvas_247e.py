path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_merged_247e.tsx"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

canvas_starts = []
for idx, l in enumerate(lines, 1):
    if "activeTab === 'canvas'" in l:
        canvas_starts.append(idx)
        print(f"Canvas tab starts at line {idx}: {l.strip()}")

for start in canvas_starts:
    print(f"\n--- Printing from line {start} ---")
    for j in range(start, min(start + 150, len(lines) + 1)):
        print(f"{j}: {lines[j-1].rstrip()}")
