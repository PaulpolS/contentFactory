import re

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/canvas_tab_readable.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Find JSX(Identifier, ...) and JSXS(Identifier, ...)
# Identifiers can be lowercase string (html elements) or uppercase/variable names
matches = re.findall(r'(?:JSX|JSXS)\(([^,)]+)', content)

unique_components = set(matches)
print("Unique component parameters in JSX/JSXS calls:")
for c in sorted(unique_components):
    c = c.strip()
    print(c)
