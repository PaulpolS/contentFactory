import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

steps_to_inspect = []
with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        if "App.tsx" in line and "Showing lines 2650 to 2810" in line:
            try:
                data = json.loads(line)
                steps_to_inspect.append(data)
            except Exception:
                pass

print(f"Found {len(steps_to_inspect)} matching steps")
for data in steps_to_inspect:
    step = data.get("step_index")
    content = data.get("content", "")
    print(f"\n================ STEP {step} ================")
    print(f"Content length: {len(content)}")
    print("Content preview:")
    # print around the gap 2670-2710
    lines = content.split("\n")
    for l in lines:
        if any(f"{i}:" in l for i in range(2670, 2715)):
            print(l)
        if "truncated" in l:
            print("--- TRUNCATION MARKER FOUND ---:", l)
