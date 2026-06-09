import os
import json

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    print("Log exists, searching for first view_file of App.tsx...")
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line_idx, line in enumerate(f):
            if "view_file" in line and "App.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    print(f"First view_file at step {step}:")
                    # Check next line for tool result
                    print(json.dumps(data, indent=2)[:500])
                    break
                except:
                    pass
else:
    print("Log not found")
