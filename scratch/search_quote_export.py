import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
search_str = "export default function QuoteVideoPortal"

results = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f):
                    if search_str in line:
                        data = json.loads(line)
                        step = data.get("step_index")
                        for tc in data.get("tool_calls", []):
                            args = tc.get("args", {})
                            if any(search_str in str(v) for v in args.values()):
                                results.append({
                                    "folder": folder,
                                    "step": step,
                                    "tool": tc.get("name"),
                                    "len": len(str(args))
                                })
        except:
            pass

print("Found writes containing QuoteVideoPortal definition:")
for r in results:
    print(f"Folder: {r['folder']}, Step: {r['step']}, Tool: {r['tool']}, Len: {r['len']}")
