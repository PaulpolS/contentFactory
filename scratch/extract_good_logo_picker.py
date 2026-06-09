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
                if "savedLogos.map" in content:
                    print(f"Found in Step {idx}:")
                    # Find a block of lines around savedLogos.map
                    lines = content.split("\n")
                    for i, l in enumerate(lines):
                        if "savedLogos.map" in l:
                            # print 30 lines
                            for k in range(max(0, i-5), min(len(lines), i+30)):
                                print(f"  {lines[k]}")
                            break
            except Exception as e:
                pass
