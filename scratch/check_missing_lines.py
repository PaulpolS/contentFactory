import os

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_tsx_lines.txt"

lines_present = set()
if os.path.exists(path):
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.split(":", 1)
            if len(parts) == 2:
                try:
                    num = int(parts[0])
                    lines_present.add(num)
                except ValueError:
                    pass

max_line = 5762
missing = []
for i in range(2680, max_line + 1):
    if i not in lines_present:
        missing.append(i)

print(f"Total lines in range 2680-{max_line}: {max_line - 2680 + 1}")
print(f"Missing lines: {len(missing)}")

# Print missing ranges
ranges = []
start = None
for i in range(2680, max_line + 2):
    if i in missing:
        if start is None:
            start = i
    else:
        if start is not None:
            ranges.append((start, i - 1))
            start = None

print(f"Missing ranges: {ranges}")
