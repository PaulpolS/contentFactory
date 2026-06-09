import os

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_final.tsx"

if not os.path.exists(filepath):
    print("File does not exist!")
    exit(1)

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")

# Let's search for occurrences of "if target_card_footer in content:"
for idx, line in enumerate(lines):
    if "target_card_footer" in line:
        print(f"L{idx+1}: {line.strip()}")
        # Let's inspect 10 lines before and 20 lines after
        start = max(0, idx - 10)
        end = min(len(lines), idx + 25)
        print("--- BLOCK ---")
        for i in range(start, end):
            print(f"  {i+1:4d}: {lines[i].rstrip()}")
        print("-" * 40)
