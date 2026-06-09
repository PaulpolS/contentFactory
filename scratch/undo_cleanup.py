import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if idx == 5985:
            try:
                data = json.loads(line)
                # Output the full diff content to scratch/step_5985_diff.txt
                with open("scratch/step_5985_diff.txt", "w", encoding="utf-8") as out:
                    out.write(data.get("content", ""))
                print("Saved full diff to scratch/step_5985_diff.txt")
            except Exception as e:
                print("Error:", e)
