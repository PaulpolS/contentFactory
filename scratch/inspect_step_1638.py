import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            if 1637 <= step_idx <= 1642:
                print(f"--- Step {step_idx} ({data.get('source')}, {data.get('type')}) ---")
                print(json.dumps(data, indent=2)[:2000])
        except Exception as e:
            pass
else:
    print("No transcript")
