def print_lines(filename, start, end):
    with open(filename, "r") as f:
        for line in f:
            m = re.match(r'^(\d+): (.*)', line.strip())
            if m:
                ln = int(m.group(1))
                if start <= ln <= end:
                    print(line.strip())

import re
print("=== 247e75b9 lines 2670 to 2730 ===")
print_lines("scratch/lines_247e75b9.txt", 2670, 2730)

print("\n=== 92117323 lines 2670 to 2730 ===")
print_lines("scratch/lines_92117323.txt", 2670, 2730)
