import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
folders = os.listdir(brain_dir)
results = []

for f in folders:
    f_path = os.path.join(brain_dir, f)
    if not os.path.isdir(f_path):
        continue
    log_path = os.path.join(f_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(log_path):
        try:
            with open(log_path, "r", encoding="utf-8", errors="ignore") as file:
                lines = file.readlines()
            for line_idx, line in enumerate(lines):
                if "replace_file_content" in line and "App.tsx" in line:
                    try:
                        data = json.loads(line)
                        step = data.get("step_index")
                        tool_calls = data.get("tool_calls", [])
                        for tc in tool_calls:
                            if tc.get("name") == "replace_file_content":
                                args = tc.get("args") or tc.get("arguments") or {}
                                tf = args.get("TargetFile") or ""
                                if tf.endswith("App.tsx"):
                                    results.append((f, step, "replace", len(args.get("ReplacementContent") or "")))
                    except Exception as e:
                        pass
                elif "multi_replace_file_content" in line and "App.tsx" in line:
                    try:
                        data = json.loads(line)
                        step = data.get("step_index")
                        tool_calls = data.get("tool_calls", [])
                        for tc in tool_calls:
                            if tc.get("name") == "multi_replace_file_content":
                                args = tc.get("args") or tc.get("arguments") or {}
                                tf = args.get("TargetFile") or ""
                                if tf.endswith("App.tsx"):
                                    results.append((f, step, "multi", len(str(args.get("ReplacementChunks") or []))))
                    except Exception as e:
                        pass
        except Exception as e:
            pass

# Let's get the timeline of conversations and see how many edits occurred in each
print(f"Total edit tool calls on App.tsx across all logs: {len(results)}")
folder_counts = {}
for f, step, typ, size in results:
    folder_counts[f] = folder_counts.get(f, 0) + 1

for f, count in folder_counts.items():
    print(f"Folder: {f}, Edits on App.tsx: {count}")
