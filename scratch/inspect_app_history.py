import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    print(f"Read {len(lines)} lines.")
    for idx, line in enumerate(lines):
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            if step_idx >= 1680:
                tool_calls = data.get("tool_calls", [])
                for tc in tool_calls:
                    name = tc.get("name")
                    args = tc.get("args") or tc.get("arguments") or {}
                    tf = args.get("TargetFile") or args.get("Target") or ""
                    if "App.tsx" in tf or "App.tsx" in str(args):
                        print(f"Step {step_idx}: Tool {name} on App.tsx")
                        if "ReplacementContent" in args:
                            print(f"  ReplacementContent len: {len(args['ReplacementContent'])}")
                        if "CodeContent" in args:
                            print(f"  CodeContent len: {len(args['CodeContent'])}")
                        if "ReplacementChunks" in args:
                            print(f"  Chunks: {len(args['ReplacementChunks'])}")
        except Exception as e:
            pass
else:
    print("No transcript")
