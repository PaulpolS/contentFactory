import json
import os

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    print("Log exists, searching for step 1970...")
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get("step_index") == 1970:
                    print(json.dumps(data, indent=2))
                    break
            except:
                pass
else:
    print("Log not found")
