import json
import os

filepath = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/all_fragments.json"

if not os.path.exists(filepath):
    print("File does not exist!")
    exit(1)

print(f"Loading {filepath} (size: {os.path.getsize(filepath)} bytes)...")
try:
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)
    print(f"Loaded successfully. Type: {type(data)}")
    if isinstance(data, list):
        print(f"List length: {len(data)}")
        if len(data) > 0:
            print("First item preview:")
            first = data[0]
            if isinstance(first, dict):
                for k, v in first.items():
                    val_str = str(v)
                    print(f"  {k}: {val_str[:100]}... (type: {type(v)}, len/size: {len(val_str)})")
    elif isinstance(data, dict):
        print(f"Keys: {list(data.keys())}")
except Exception as e:
    print(f"Error: {e}")
