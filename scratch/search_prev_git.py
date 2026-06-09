import os
import json

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    print("Searching log for git commands...")
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "git " in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    tool_calls = data.get("tool_calls", [])
                    for tc in tool_calls:
                        if tc.get("name") == "run_command":
                            args = tc.get("args") or tc.get("arguments") or {}
                            cmd = args.get("CommandLine") or ""
                            if "git" in cmd:
                                print(f"Step {step}: run_command {cmd}")
                except Exception as e:
                    pass
else:
    print("Log not found")
