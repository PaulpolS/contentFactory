import re

with open("scratch/lines_92117323.txt", "r") as f:
    for line in f:
        m = re.match(r'^(\d+): (.*)', line.strip())
        if m:
            ln = int(m.group(1))
            # We print lines in 92117323 from 2100 to 2600 to find the end of the settings panel
            if 2100 <= ln <= 2600:
                print(f"{ln}: {m.group(2)}")
