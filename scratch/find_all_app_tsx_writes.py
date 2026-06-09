import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if "App.tsx" in line:
                        try:
                            data = json.loads(line)
                            step = data.get("step_index")
                            tool_calls = data.get("tool_calls", [])
                            for tc in tool_calls:
                                name = tc.get("name")
                                args = tc.get("args") or tc.get("arguments") or {}
                                tf = args.get("TargetFile") or args.get("Target") or ""
                                if "App.tsx" in tf or "App.tsx" in str(args):
                                    print(f"Folder: {folder}, Step: {step}, Tool: {name}, Target: {tf}, Args Keys: {list(args.keys())}")
                        except Exception as e:
                            pass
        except Exception as e:
            pass
