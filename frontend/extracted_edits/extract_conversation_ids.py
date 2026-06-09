import re
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    
    # Search for UUIDs / brain folder mentions
    matches = re.findall(r'brain/([a-f0-9\-]{36})', content)
    unique_matches = list(set(matches))
    print("Found conversation IDs:", unique_matches)
else:
    print("Transcript not found")
