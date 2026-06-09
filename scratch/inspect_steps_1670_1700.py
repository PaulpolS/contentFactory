import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            if 1670 <= step_idx <= 1700:
                print(f"--- Step {step_idx} ({data.get('source')}, {data.get('type')}) ---")
                tool_calls = data.get("tool_calls", [])
                if tool_calls:
                    for tc in tool_calls:
                        print(f"  Tool: {tc.get('name')}")
                        args = tc.get("args") or tc.get("arguments") or {}
                        target = args.get("TargetFile") or args.get("Target") or args.get("CommandLine") or ""
                        print(f"    Target: {target}")
                else:
                    content = data.get("content", "")
                    print(f"  Content: {content[:200]}")
        except Exception as e:
            pass
else:
    print("No transcript")
