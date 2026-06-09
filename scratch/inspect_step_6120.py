import json
import os

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        
    for idx, line in enumerate(lines):
        try:
            data = json.loads(line)
            step = data.get("step_index")
            if step == 5906:
                print(f"Step 5906: {data.get('content')}")
                if idx + 1 < len(lines):
                    next_data = json.loads(lines[idx + 1])
                    print(f"Step 5907: {next_data.get('content')}")
        except Exception as e:
            pass
else:
    print("Log not found")
