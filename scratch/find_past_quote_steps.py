import os
import json

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
found = []
for f in os.listdir(scratch_dir):
    if f.endswith(".json") and f.startswith("step_"):
        path = os.path.join(scratch_dir, f)
        try:
            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)
            content_str = str(data)
            if "QuoteVideoPortal.tsx" in content_str:
                found.append(f)
        except:
            pass

print("Found files in scratch referencing QuoteVideoPortal.tsx:")
for f in found:
    print("-", f)
