import re

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_backup_strict.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines in App_backup_strict.tsx: {len(lines)}")

tab_matches = []
for idx, line in enumerate(lines, 1):
    if "activeTab ===" in line and "&&" in line:
        tab_matches.append((idx, line.strip()))

print("Found tab matches:")
for idx, text in tab_matches:
    print(f"L{idx}: {text}")
