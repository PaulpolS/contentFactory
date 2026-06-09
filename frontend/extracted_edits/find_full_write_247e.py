import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    print("Transcript found! Scanning for writes...")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            if "App.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    tc_list = data.get("tool_calls", [])
                    for tc in tc_list:
                        name = tc.get("name")
                        args = tc.get("args") or tc.get("arguments") or {}
                        tf = args.get("TargetFile") or args.get("AbsolutePath") or ""
                        if "App.tsx" in tf:
                            if name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                                print(f"Step {step}: {name}, keys: {list(args.keys())}")
                                if "CodeContent" in args:
                                    print(f"  CodeContent length: {len(args['CodeContent'])}")
                                if "ReplacementContent" in args:
                                    print(f"  ReplacementContent length: {len(args['ReplacementContent'])}")
                except Exception as e:
                    pass
else:
    print("Transcript not found")
