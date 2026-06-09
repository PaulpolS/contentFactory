import os
import datetime

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
folders = []

if os.path.exists(brain_dir):
    for folder in os.listdir(brain_dir):
        path = os.path.join(brain_dir, folder)
        if os.path.isdir(path):
            transcript = os.path.join(path, ".system_generated/logs/transcript.jsonl")
            size = 0
            mtime = 0
            if os.path.exists(transcript):
                size = os.path.getsize(transcript)
                mtime = os.path.getmtime(transcript)
            folders.append((folder, size, mtime))

# Sort by mtime descending (newest first)
folders.sort(key=lambda x: x[2], reverse=True)
print("Conversations in brain:")
for f, size, mtime in folders:
    dt = datetime.datetime.fromtimestamp(mtime).strftime('%Y-%m-%d %H:%M:%S') if mtime > 0 else "N/A"
    print(f"- {f}: size={size} bytes, modified={dt}")
