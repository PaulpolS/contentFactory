import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

if not os.path.exists(transcript_path):
    print("Transcript not found")
    exit(1)

print("Scanning for replace_file_content edits to App.tsx in transcript...")
with open(transcript_path, 'r', encoding='utf-8') as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
        except:
            continue
        
        tool_calls = data.get("tool_calls", [])
        for tc_idx, tc in enumerate(tool_calls):
            if tc.get("name") == "replace_file_content":
                args = tc.get("args", {})
                target = args.get("TargetFile", "")
                if "App.tsx" in target:
                    print(f"Step {idx}, tc {tc_idx}: TargetContent length: {len(args.get('TargetContent', ''))}, ReplacementContent length: {len(args.get('ReplacementContent', ''))}")
                    # Let's save the args to a file so we can inspect
                    with open(f"scratch/step_{idx}_replace.json", "w", encoding="utf-8") as out:
                        json.dump(args, out, indent=2, ensure_ascii=False)
                    print(f"Saved details to scratch/step_{idx}_replace.json")
