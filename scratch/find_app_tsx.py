import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            # Check type of step
            step_type = data.get("type", "")
            # Check if it contains App.tsx in content or tool calls
            content = data.get("content", "")
            
            # Let's inspect VIEW_FILE outputs that contain App.tsx
            if step_type == "VIEW_FILE" and "App.tsx" in content:
                print(f"Line {line_num}: VIEW_FILE has content of size {len(content)}")
                # Print a bit of content to identify what lines were viewed
                print(f"  Snippet: {content[:200]} ... {content[-200:]}")
            
            # Also check tool_calls to see if any arguments contain App.tsx
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name", "")
                args = tc.get("args", {})
                target = args.get("TargetFile", "")
                if "App.tsx" in target:
                    print(f"Line {line_num}: Tool {name} has TargetFile: {target}")
                    if "ReplacementContent" in args:
                        print(f"  ReplacementContent size: {len(args['ReplacementContent'])}")
        except Exception as e:
            pass
