import os

in_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_tsx_lines.txt"
out_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_reconstructed_raw.tsx"

if os.path.exists(in_path):
    lines_dict = {}
    with open(in_path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.split(":", 1)
            if len(parts) == 2:
                try:
                    num = int(parts[0].strip())
                    content = parts[1]
                    lines_dict[num] = content
                except ValueError:
                    pass
    
    # Sort by line number
    sorted_keys = sorted(lines_dict.keys())
    print(f"Read {len(lines_dict)} lines. Line number range: {sorted_keys[0]} to {sorted_keys[-1]}")
    
    with open(out_path, "w", encoding="utf-8") as out:
        for k in range(1, sorted_keys[-1] + 1):
            if k in lines_dict:
                out.write(lines_dict[k])
            else:
                out.write(f"// MISSING LINE {k}\n")
    print(f"Saved raw reconstructed code to {out_path}")
else:
    print("reconstructed_App_tsx_lines.txt not found")
