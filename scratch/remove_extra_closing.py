with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

# Line 2049 is lines[2048]. Let's print lines[2046:2052] to make sure
print("Target lines before removal:")
for idx in range(2045, 2052):
    print(f"L{idx+1}: {lines[idx].rstrip()}")

# Let's delete lines[2048] (which is line 2049) if it contains ")}"
if ")}" in lines[2048]:
    print("Found ')}' at line 2049, removing...")
    del lines[2048]
    
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Successfully removed line 2049!")
else:
    print("')} not found at line 2049!")
