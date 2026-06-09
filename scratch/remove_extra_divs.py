with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Lines 2630-2636 before edit:")
for idx in range(2629, 2636):
    print(f"L{idx+1}: {lines[idx].rstrip()}")

# Let's replace L2632-2634 (which are lines[2631], lines[2632], lines[2633]) with just a single </div>
# Wait, let's verify if they contain </div>
if "</div>" in lines[2632] and "</div>" in lines[2633]:
    print("Found extra closing divs, replacing with a single one...")
    # Keep lines[2631], delete lines[2632] and lines[2633]
    del lines[2632]
    del lines[2632] # since the next line shifts up
    
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Successfully removed extra closing divs!")
else:
    print("Extra closing divs NOT found at expected lines.")
