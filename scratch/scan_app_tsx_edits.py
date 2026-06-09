import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
search_str = "App.tsx"

print("Scanning for edits to App.tsx...")
found = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f):
                    if search_str in line and ("write_to_file" in line or "replace_file_content" in line or "multi_replace_file_content" in line):
                        try:
                            data = json.loads(line)
                            for tc in data.get("tool_calls", []):
                                name = tc.get("name")
                                if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                                    args = tc.get("args") or tc.get("arguments") or {}
                                    tf = args.get("TargetFile") or ""
                                    if search_str in tf:
                                        found.append({
                                            "folder": folder,
                                            "step": data.get("step_index"),
                                            "tool": name,
                                            "length": len(str(args))
                                        })
                        except Exception as e:
                            pass
        except Exception as e:
            pass

print(f"Found {len(found)} edit steps:")
for f in sorted(found, key=lambda x: (x['folder'], x['step'])):
    print(f"Folder: {f['folder']}, Step: {f['step']}, Tool: {f['tool']}, ArgLen: {f['length']}")
