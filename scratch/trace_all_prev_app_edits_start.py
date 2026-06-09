import os
import json

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    print("Log exists, tracing first edits on App.tsx...")
    count = 0
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "App.tsx" in line and any(t in line for t in ["replace_file_content", "multi_replace_file_content", "write_to_file"]):
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    tool_calls = data.get("tool_calls", [])
                    for tc in tool_calls:
                        name = tc.get("name")
                        if name in ["replace_file_content", "multi_replace_file_content", "write_to_file"]:
                            args = tc.get("args") or tc.get("arguments") or {}
                            tf = args.get("TargetFile") or args.get("Target") or ""
                            if "App.tsx" in tf:
                                count += 1
                                print(f"Match {count}: Step {step}, Tool {name} on {tf}")
                                if count >= 30:
                                    break
                except:
                    pass
            if count >= 30:
                break
else:
    print("Log not found")
