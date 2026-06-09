with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/canvas_tab_readable.js", "r", encoding="utf-8") as f:
    content = f.read()

print(f"Total length: {len(content)}")
print("End context:")
print(repr(content[-1500:]))
