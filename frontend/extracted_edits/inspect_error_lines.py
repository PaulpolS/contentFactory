with open("frontend/src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("=== App.tsx lines 5185 to 5230 ===")
for idx, line in enumerate(lines):
    ln = idx + 1
    if 5185 <= ln <= 5230:
        print(f"{ln}: {line.rstrip()}")
