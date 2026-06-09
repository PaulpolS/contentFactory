path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/QuoteVideoPortal.tsx"

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

print("Variables in QuoteVideoPortal.tsx:")
# Find outputFolder, pick-folder, handleChooseDirectory occurrences
for line in content.splitlines():
    if "outputFolder" in line or "pick-folder" in line or "handleChooseDirectory" in line:
        print(line.strip())
