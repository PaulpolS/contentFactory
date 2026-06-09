import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"

folders = os.listdir(brain_dir)
print(f"Total folders in brain: {len(folders)}")

for f in folders:
    f_path = os.path.join(brain_dir, f)
    if not os.path.isdir(f_path):
        continue
    log_path = os.path.join(f_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(log_path):
        try:
            # Read first and last line of transcript to get step indices
            with open(log_path, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
            if lines:
                first = json.loads(lines[0]).get("step_index")
                last = json.loads(lines[-1]).get("step_index")
                print(f"Folder: {f}, Steps: {first} to {last}, Lines in log: {len(lines)}")
        except Exception as e:
            print(f"Folder: {f}, error: {e}")
