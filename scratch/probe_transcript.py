import json
import os

path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
if not os.path.exists(path):
    print("Not found")
    exit()

with open(path, "r", encoding="utf-8", errors="ignore") as f:
    for i, line in enumerate(f):
        if "App.tsx" in line:
            try:
                data = json.loads(line)
                step_idx = data.get("step_index")
                step_type = data.get("type")
                source = data.get("source")
                tcs = data.get("tool_calls", [])
                tc_names = [tc.get('name') for tc in tcs]
                print(f"Line {i+1}: Step {step_idx}, Source {source}, Type {step_type}, Tools {tc_names}, LineLen {len(line)}")
            except Exception as e:
                print(f"Line {i+1}: Parse error {e}")
