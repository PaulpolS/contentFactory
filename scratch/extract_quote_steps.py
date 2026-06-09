import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
folder = "7329dad1-f7d4-4220-817c-43133a2c4809"
transcript_path = os.path.join(brain_dir, folder, ".system_generated/logs/transcript.jsonl")

if os.path.exists(transcript_path):
    print("Found current conversation transcript!")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            if "QuoteVideoPortal.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    for tc in data.get("tool_calls", []):
                        name = tc.get("name")
                        args = tc.get("args", {})
                        if "QuoteVideoPortal.tsx" in str(args):
                            print(f"Step {step} has tool call {name} (keys: {list(args.keys())})")
                            # If it's a write or edit tool, let's check its size
                            if name in ("write_to_file", "replace_file_content", "multi_replace_file_content"):
                                content = args.get("CodeContent", "") or args.get("ReplacementContent", "") or str(args.get("ReplacementChunks", ""))
                                print(f"  Content length: {len(content)}")
                except Exception as e:
                    pass
else:
    print("Transcript not found.")
