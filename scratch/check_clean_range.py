import os

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_strict.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()[:4652]

curly = 0
paren = 0
for idx, line in enumerate(lines):
    # simple character count (ignoring strings for now, just to get a rough idea)
    curly += line.count('{') - line.count('}')
    paren += line.count('(') - line.count(')')

print(f"Brace balance after 4652 lines: Curly={curly}, Paren={paren}")
