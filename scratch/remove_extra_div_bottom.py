with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

print("Lines 3085-3091 before edit:")
for idx in range(3084, 3091):
    print(f"L{idx+1}: {lines[idx].rstrip()}")

# Let's delete line 3088 (which is lines[3087]) if it contains "</div>"
if "</div>" in lines[3087]:
    print("Found extra closing div at line 3088, removing...")
    del lines[3087]
    
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("Successfully removed extra closing div!")
else:
    print("Extra closing div NOT found at line 3088.")
