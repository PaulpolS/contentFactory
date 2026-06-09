import os
import json

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
for f in sorted(os.listdir(scratch_dir)):
    if f.startswith("curr_step_") and f.endswith(".json"):
        path = os.path.join(scratch_dir, f)
        try:
            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)
            print(f"File {f}:")
            print(f"  TargetFile: {data.get('TargetFile')}")
            content = data.get('CodeContent') or data.get('ReplacementContent') or ""
            print(f"  Content snippet: {content[:100]}...")
            print(f"  Content length: {len(content)}")
        except Exception as e:
            pass
