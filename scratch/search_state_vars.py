import os
import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    print("Transcript exists. Searching for tracking references...")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            if "activeTab === 'tracking'" in line or "activeTab === \"tracking\"" in line:
                print(f"Line {idx}: step {json.loads(line).get('step_index')}")
else:
    print("Not found")
