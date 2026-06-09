path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_merged_247e.tsx"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines in App_tsx_merged_247e.tsx: {len(lines)}")
for idx, l in enumerate(lines, 1):
    if "activeTab === 'canvas'" in l:
        print(f"Canvas tab starts at line {idx}: {l.strip()}")
        # print next 30 lines
        for j in range(idx, min(idx + 100, len(lines))):
            print(f"  {j}: {lines[j-1].strip()}")
