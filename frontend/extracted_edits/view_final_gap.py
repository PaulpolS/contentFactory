with open("scratch/reconstructed_App_final.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("=== Reconstructed lines 3680 to 3710 ===")
for idx, line in enumerate(lines):
    ln = idx + 1
    if 3680 <= ln <= 3710:
        print(f"{ln}: {line.rstrip()}")
