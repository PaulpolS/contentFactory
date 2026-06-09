import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
search_str = "QuoteVideoPortal.tsx"

results = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if search_str in line:
                        data = json.loads(line)
                        step = data.get("step_index")
                        for tc in data.get("tool_calls", []):
                            args = tc.get("args", {})
                            tf = args.get("TargetFile", "")
                            if search_str in tf:
                                tool_name = tc.get("name")
                                content = args.get("CodeContent", "") or args.get("ReplacementContent", "") or ""
                                if not content and "ReplacementChunks" in args:
                                    content = str(args["ReplacementChunks"])
                                
                                results.append({
                                    "folder": folder,
                                    "step": step,
                                    "tool": tool_name,
                                    "len": len(content),
                                    "has_garbled": '\ufffd' in content or '犧' in content
                                })
        except:
            pass

# Sort by size descending
results.sort(key=lambda x: x["len"], reverse=True)
print("All QuoteVideoPortal.tsx write/edit operations by size:")
for r in results[:40]:
    print(f"Folder: {r['folder']}, Step: {r['step']}, Tool: {r['tool']}, Len: {r['len']}, Garbled: {r['has_garbled']}")
