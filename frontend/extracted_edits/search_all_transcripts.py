import json
import os

folders = [
    "59119761-b490-421b-b15d-46f12f5c4158",
    "19aed406-df08-4966-b539-2983abe8026d",
    "247e75b9-4826-40df-8e90-5fa35311e2ea"
]

for folder in folders:
    transcript_path = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}/.system_generated/logs/transcript.jsonl"
    if os.path.exists(transcript_path):
        print(f"Scanning folder {folder}...")
        with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                if "App.tsx" in line:
                    try:
                        data = json.loads(line)
                        step = data.get("step_index")
                        typ = data.get("type")
                        
                        # Check tool calls
                        tc_list = data.get("tool_calls", [])
                        for tc in tc_list:
                            name = tc.get("name")
                            args = tc.get("args") or tc.get("arguments") or {}
                            tf = args.get("TargetFile") or args.get("AbsolutePath") or ""
                            if "App.tsx" in tf:
                                if name == "write_to_file" and "CodeContent" in args:
                                    print(f"  Step {step}: write_to_file to App.tsx, size={len(args['CodeContent'])}")
                                elif name == "replace_file_content" and "ReplacementContent" in args:
                                    print(f"  Step {step}: replace_file_content, start={args.get('StartLine')}, end={args.get('EndLine')}, size={len(args['ReplacementContent'])}")
                                elif name == "view_file":
                                    print(f"  Step {step}: view_file, start={args.get('StartLine')}, end={args.get('EndLine')}")
                                    
                        # Check code action output
                        if typ == "CODE_ACTION" or typ == "SYSTEM":
                            content = data.get("content", "")
                            if "Showing lines" in content and "App.tsx" in content:
                                parts = content.split("Showing lines")
                                if len(parts) > 1:
                                    line_info = parts[1].split("\n")[0]
                                    print(f"  Step {step}: Output contains {line_info}")
                    except Exception as e:
                        pass
    else:
        print(f"Transcript not found in folder {folder}")
