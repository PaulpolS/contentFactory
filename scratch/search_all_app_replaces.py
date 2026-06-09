import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
results = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if "replace_file_content" in line and "App.tsx" in line:
                        try:
                            data = json.loads(line)
                            step = data.get("step_index")
                            tool_calls = data.get("tool_calls", [])
                            for tc in tool_calls:
                                name = tc.get("name")
                                if name == "replace_file_content":
                                    args = tc.get("args") or tc.get("arguments") or {}
                                    tf = args.get("TargetFile") or ""
                                    if tf.endswith("App.tsx"):
                                        rep = args.get("ReplacementContent") or ""
                                        if len(rep) > 50000:
                                            print(f"FOUND large replace_file_content in folder {folder}, step {step}! ReplacementContent len: {len(rep)}")
                                            results.append((folder, step, len(rep), rep))
                        except Exception as e:
                            pass
        except Exception as e:
            pass

if results:
    results.sort(key=lambda x: x[2], reverse=True)
    folder, step, length, code = results[0]
    out_path = "scratch/App_tsx_recovered_large.tsx"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(code)
    print(f"Saved recovered file to {out_path} from folder {folder} step {step} (len: {length})")
else:
    print("No large replace_file_content of App.tsx found in any conversation log.")
