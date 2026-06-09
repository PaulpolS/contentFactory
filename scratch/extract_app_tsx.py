import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

print("Scanning transcript for edits to App.tsx...")
if not os.path.exists(transcript_path):
    print("Transcript not found at", transcript_path)
    exit(1)

with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        try:
            data = json.loads(line)
        except Exception as e:
            continue
        
        # Check if it is a tool call
        tool_calls = data.get("tool_calls", [])
        for tc in tool_calls:
            args = tc.get("args", {})
            target = args.get("TargetFile", "")
            if "App.tsx" in target:
                print(f"Line {i}: Tool {tc.get('name')} targeting {target}")
                if tc.get("name") == "write_to_file":
                    print("  -> Found write_to_file!")
                elif tc.get("name") == "replace_file_content":
                    print("  -> Found replace_file_content!")
                elif tc.get("name") == "multi_replace_file_content":
                    print("  -> Found multi_replace_file_content!")
