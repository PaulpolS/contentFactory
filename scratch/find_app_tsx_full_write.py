import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
search_str = "App.tsx"

print("Scanning for large write_to_file of App.tsx...")
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
                    if "write_to_file" in line and search_str in line:
                        try:
                            data = json.loads(line)
                            for tc in data.get("tool_calls", []):
                                if tc.get("name") == "write_to_file":
                                    args = tc.get("args", {}) or tc.get("arguments", {})
                                    tf = args.get("TargetFile", "")
                                    if search_str in tf:
                                        content = args.get("CodeContent", "")
                                        content_len = len(content)
                                        if content_len > 100000:  # > 100KB
                                            found.append({
                                                "folder": folder,
                                                "step": data.get("step_index"),
                                                "length": content_len,
                                                "content": content
                                            })
                        except Exception as e:
                            pass
        except Exception as e:
            pass

print(f"Found {len(found)} large write_to_file steps:")
for idx, f in enumerate(found):
    print(f"Index: {idx}, Folder: {f['folder']}, Step: {f['step']}, Len: {f['length']}")
    # Write to a file
    out_path = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_found_{f['folder']}_{f['step']}.tsx"
    with open(out_path, "w", encoding="utf-8") as out:
        out.write(f['content'])
    print(f"  Saved to {out_path}")
