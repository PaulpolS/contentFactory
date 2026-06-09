import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

print("Searching transcript for original App.tsx code blocks around canvasSearchFiltered...")
with open(transcript_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        if "canvasSearchFiltered" in line and "checked={" in line:
            print(f"Line {idx} matches!")
            try:
                data = json.loads(line)
                # Print the content of this log step
                print("--- Content ---")
                print(data.get("content", "")[:1000])
                print("--- Tool Calls ---")
                for tc in data.get("tool_calls", []):
                    args = tc.get("args", {})
                    # If there's TargetContent or CodeContent
                    print(f"Tool {tc.get('name')}: TargetFile: {args.get('TargetFile')}")
                    print(f"TargetContent length: {len(args.get('TargetContent', ''))}")
                    print(f"ReplacementContent length: {len(args.get('ReplacementContent', ''))}")
            except Exception as e:
                print("Error loading json:", e)
