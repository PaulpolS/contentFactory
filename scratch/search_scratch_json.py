import os
import json

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
found = []

for file in os.listdir(scratch_dir):
    if file.endswith(".json"):
        path = os.path.join(scratch_dir, file)
        try:
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
            # Check if App.tsx is in TargetFile, Target or CodeContent or replacement content
            data_str = json.dumps(data)
            if "App.tsx" in data_str:
                print(f"- {file} contains App.tsx!")
                # Print keys and size of CodeContent or chunks
                if "CodeContent" in data:
                    print(f"  CodeContent length: {len(data['CodeContent'])}")
                if "ReplacementContent" in data:
                    print(f"  ReplacementContent length: {len(data['ReplacementContent'])}")
                if "ReplacementChunks" in data:
                    print(f"  Chunks: {len(data['ReplacementChunks'])}")
        except Exception as e:
            pass
