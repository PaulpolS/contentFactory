import json
import os
import re

logs = [
    "/Users/paulpolsulintaboon/.gemini/antigravity/brain/59119761-b490-421b-b15d-46f12f5c4158/.system_generated/logs/transcript.jsonl",
    "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"
]

for log_path in logs:
    if not os.path.exists(log_path):
        continue
    print(f"Scanning log: {log_path}")
    with open(log_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f):
            try:
                data = json.loads(line)
                content = data.get("content", "")
                if not content:
                    continue
                if "File Path: `file:///Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx`" in content:
                    matches = re.findall(r"^(\d+):\s", content, re.MULTILINE)
                    if matches:
                        # Convert to ints
                        line_nums = [int(m) for m in matches]
                        print(f"  Step {idx}: view_file response for lines {min(line_nums)}-{max(line_nums)} (count: {len(line_nums)})")
            except Exception as e:
                pass
