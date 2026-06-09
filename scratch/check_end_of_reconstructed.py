path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_final.tsx"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    lines = f.readlines()

print(f"Total lines in reconstructed_App_final.tsx: {len(lines)}")
print("Last 100 lines:")
for idx, l in enumerate(lines[-100:], len(lines) - 99):
    print(f"{idx}: {l.strip()}")
