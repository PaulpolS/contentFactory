import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if not os.path.exists(transcript_path):
    print("Transcript does not exist!")
    exit(1)

print("Scanning transcript for writes to App.tsx...")

with open(transcript_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            step_type = data.get("type", "")
            
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                
                # Check for write_to_file or replace_file_content to App.tsx
                target_file = args.get("TargetFile", "")
                if not target_file and "TargetFile" in str(args):
                    # args might be a string or we check keys
                    pass
                
                if "App.tsx" in str(args) and name in ["write_to_file", "replace_file_content", "multi_replace_file_content"]:
                    print(f"L{line_num} | Step {step_idx}: Tool {name} called with arguments size {len(str(args))} bytes")
                    # Print keys inside args
                    if isinstance(args, dict):
                        print(f"  Keys: {list(args.keys())}")
                        if "Description" in args:
                            print(f"  Description: {args['Description']}")
                        if name == "replace_file_content":
                            print(f"  Lines: {args.get('StartLine')} to {args.get('EndLine')}")
                            # Print a snippet of TargetContent
                            tc_preview = args.get("TargetContent", "")[:100].replace("\n", "\\n")
                            rc_preview = args.get("ReplacementContent", "")[:100].replace("\n", "\\n")
                            print(f"  TargetContent preview: {tc_preview}")
                            print(f"  ReplacementContent preview: {rc_preview}")
        except Exception as e:
            pass
