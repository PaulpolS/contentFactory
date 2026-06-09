import os
import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"
found = []

if os.path.exists(transcript_path):
    print("Transcript exists. Searching for App.tsx writes or views...")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            if "App.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    step_type = data.get("type", "")
                    
                    # We check if it has tool calls writing or viewing App.tsx
                    tool_calls = data.get("tool_calls", [])
                    for tc in tool_calls:
                        name = tc.get("name", "")
                        args = tc.get("args") or tc.get("arguments") or {}
                        tf = args.get("TargetFile") or args.get("Target") or ""
                        if "App.tsx" in tf:
                            cc = args.get("CodeContent") or ""
                            rc = args.get("ReplacementContent") or ""
                            content = cc or rc
                            found.append({
                                "line": idx,
                                "step": step,
                                "type": step_type,
                                "tool": name,
                                "len": len(content)
                            })
                            print(f"Line {idx}: step {step}, type {step_type}, tool {name}, len {len(content)}")
                except Exception as e:
                    pass
else:
    print("Not found")

print(f"Total entries found: {len(found)}")
