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
            if 1642 <= step_idx <= 1652:
                print(f"--- Step {step_idx} ({data.get('source')}, {data.get('type')}) ---")
                tool_calls = data.get("tool_calls", [])
                if tool_calls:
                    for tc in tool_calls:
                        print(f"  Tool: {tc.get('name')}")
                        args = tc.get("args") or tc.get("arguments") or {}
                        print(f"    Args: {args.keys()}")
                        # If replace_file_content, print some details
                        if tc.get("name") in ["replace_file_content", "write_to_file"]:
                            print(f"    TargetFile: {args.get('TargetFile') or args.get('Target')}")
                            print(f"    ReplacementContent starts with: {repr(args.get('ReplacementContent', '')[:200])}")
                            print(f"    TargetContent starts with: {repr(args.get('TargetContent', '')[:200])}")
                else:
                    content = data.get("content", "")
                    print(f"  Content: {content[:400]}")
        except Exception as e:
            pass
else:
    print("No transcript")
