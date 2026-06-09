import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
steps = [742, 746]

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                step = data.get("step_index")
                if step in steps and data.get("type") == "VIEW_FILE":
                    print(f"--- Step {step} ---")
                    print(data.get("content"))
            except:
                pass
else:
    print("Not found")
