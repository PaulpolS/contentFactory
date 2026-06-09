import json
import os
import re

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
if not os.path.exists(log_path):
    print("Transcript not found")
    exit(1)

print(f"Scanning log: {log_path}")

views = []
with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
            content = data.get("content", "")
            step = data.get("step_index", -1)
            typ = data.get("type", "")
            if typ != "VIEW_FILE":
                continue
            if "App.tsx" in content:
                # Find line number prefixes
                matches = re.findall(r"^(\d+):\s", content, re.MULTILINE)
                if matches:
                    line_nums = [int(m) for m in matches]
                    views.append((step, min(line_nums), max(line_nums), len(line_nums), content))
                    print(f"  Step {step}: lines {min(line_nums)}-{max(line_nums)} (count: {len(line_nums)})")
        except Exception as e:
            pass

print(f"Total views found: {len(views)}")
