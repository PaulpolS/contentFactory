unresolved = ["fe", "ge", "me", "oe", "re", "z", "G", "L"]

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/canvas_tab_readable.js"

with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for component in unresolved:
    print(f"\n================ USAGES OF '{component}' ================")
    count = 0
    for idx, line in enumerate(lines, 1):
        if f"JSX({component}," in line or f"JSXS({component}," in line:
            print(f"Line {idx}: {line.strip()}")
            # print surrounding lines
            start = max(0, idx - 3)
            end = min(len(lines), idx + 4)
            for j in range(start, end):
                print(f"  {j+1}: {lines[j].rstrip()}")
            count += 1
            if count >= 3:
                break
