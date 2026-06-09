import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
found_references = []

if os.path.exists(brain_dir):
    print(f"Scanning brain dir: {brain_dir}")
    for folder in os.listdir(brain_dir):
        folder_path = os.path.join(brain_dir, folder)
        if not os.path.isdir(folder_path):
            continue
        transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
        if os.path.exists(transcript_path):
            try:
                with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_num, line in enumerate(f, 1):
                        if "App.tsx" in line:
                            try:
                                data = json.loads(line)
                                tool_calls = data.get("tool_calls", [])
                                for tc in tool_calls:
                                    name = tc.get("name", "")
                                    args = tc.get("args") or tc.get("arguments") or {}
                                    tf = args.get("TargetFile") or args.get("Target") or ""
                                    if "App.tsx" in tf:
                                        found_references.append((folder, data.get("step_index"), name, list(args.keys())))
                            except Exception as e:
                                pass
            except Exception as e:
                pass
else:
    print("Not found")

print(f"\nFound {len(found_references)} references to App.tsx in tool calls:")
# Print the first 30 references
for ref in found_references[:30]:
    print(f"- Folder: {ref[0]}, Step: {ref[1]}, Tool: {ref[2]}, Keys: {ref[3]}")
