import json
import os

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    print("Log exists, searching...")
    count = 0
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "App.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    tool_calls = data.get("tool_calls", [])
                    for tc in tool_calls:
                        name = tc.get("name")
                        if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                            args = tc.get("args") or tc.get("arguments") or {}
                            tf = args.get("TargetFile") or ""
                            if "App.tsx" in tf:
                                count += 1
                                print(f"Match {count}: Step {step}, Tool {name}")
                except Exception as e:
                    pass
else:
    print("Log not found")
