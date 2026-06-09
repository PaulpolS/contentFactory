import os
import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    print("Transcript exists. Searching VIEW_FILE steps...")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                step_type = data.get("type", "")
                if step_type == "VIEW_FILE":
                    content = data.get("content", "")
                    if "App.tsx" in content and len(content) > 10000:
                        print(f"Line {idx}: step {data.get('step_index')}, content len: {len(content)}")
                        # Print first 200 chars
                        print(f"  Snippet: {content[:200]}")
            except Exception as e:
                pass
else:
    print("Not found")
