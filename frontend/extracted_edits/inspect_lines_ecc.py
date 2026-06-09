import re

with open("scratch/lines_eccbdc81.txt", "r") as f:
    for line in f:
        m = re.match(r'^(\d+): (.*)', line.strip())
        if m:
            ln = int(m.group(1))
            if 3270 <= ln <= 3300:
                print(f"{ln}: {m.group(2)}")
