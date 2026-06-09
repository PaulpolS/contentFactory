import json

path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_step82_original.tsx"

with open(path, "r", encoding="utf-8") as f:
    text = f.read()

print(f"File text length: {len(text)}")
try:
    data = json.loads(text)
    print(f"Successfully loaded JSON! Type: {type(data)}, length: {len(data)}")
    # Save the parsed text to a new file so we can view/use it
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_step82_parsed.tsx", "w", encoding="utf-8") as out:
        out.write(data)
    print("Saved parsed file to scratch/App_tsx_step82_parsed.tsx")
except Exception as e:
    print(f"JSON load failed: {e}")
