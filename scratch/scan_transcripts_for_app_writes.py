import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
print(f"Scanning transcripts in {brain_dir} for App.tsx writes...")

large_writes = []

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript.jsonl":
            path = os.path.join(root, file)
            try:
                with open(path, "r", encoding="utf-8", errors="ignore") as f:
                    for line_idx, line in enumerate(f, 1):
                        # Simple substring checks first for performance
                        if "App.tsx" in line and ("write_to_file" in line or "replace_file_content" in line or "multi_replace_file_content" in line):
                            try:
                                data = json.loads(line)
                                step = data.get("step_index")
                                tool_calls = data.get("tool_calls", [])
                                for tc in tool_calls:
                                    name = tc.get("name")
                                    args = tc.get("args", {})
                                    target = args.get("TargetFile", "") or args.get("targetFile", "")
                                    if "App.tsx" in target:
                                        content = args.get("CodeContent") or args.get("ReplacementContent") or ""
                                        if len(content) > 100000: # large write
                                            folder_id = os.path.basename(os.path.dirname(os.path.dirname(root)))
                                            large_writes.append((path, line_idx, step, folder_id, len(content), content))
                                            print(f"FOUND large write: {path} | L{line_idx} | Step {step} | Folder: {folder_id} | Size: {len(content)}")
                            except:
                                pass
            except Exception as e:
                pass

print(f"Scan complete. Found {len(large_writes)} large writes.")
if large_writes:
    # Sort by size descending
    large_writes.sort(key=lambda x: x[4], reverse=True)
    for idx, (path, line_idx, step, folder_id, size, content) in enumerate(large_writes):
        out_path = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_write_recovered_{idx}_{folder_id}_step_{step}_{size}.tsx"
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Saved to {out_path}")
