import os
import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
if not os.path.exists(transcript_path):
    print("Transcript not found")
    exit(1)

print("Scanning steps around 746...")
with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
    for line in f:
        try:
            data = json.loads(line)
        except:
            continue
        step = data.get("step_index", -1)
        if 730 <= step <= 760:
            typ = data.get("type", "")
            content = data.get("content", "")
            tool_calls = data.get("tool_calls", [])
            print(f"Step {step} | Type: {typ} | content len: {len(content)} | tool calls: {len(tool_calls)}")
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                print(f"  Tool call: {name} | target: {args.get('TargetFile') or args.get('targetFile')}")
            
            if typ == "VIEW_FILE" and "App.tsx" in content:
                print(f"  VIEW_FILE content snippet (first 150 chars): {content[:150]}")
