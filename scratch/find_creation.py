import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
search_str = "VerticalVideoSuitePortal.tsx"

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
                            if search_str in str(args):
                                # If it's a write or edit tool
                                if tc.get("name") in ("write_to_file", "replace_file_content", "multi_replace_file_content"):
                                    content_len = len(args.get("CodeContent", "")) or len(args.get("ReplacementContent", "")) or len(str(args.get("ReplacementChunks", "")))
                                    # check if it contains garbled character U+FFFD or ? before Thai text
                                    has_garbled = '\ufffd' in str(args)
                                    results.append({
                                        "folder": folder,
                                        "step": step,
                                        "tool": tc.get("name"),
                                        "len": content_len,
                                        "garbled": has_garbled
                                    })
        except:
            pass

results.sort(key=lambda x: (not x["garbled"], x["len"]), reverse=True)
print("Found write/edit tool calls for VerticalVideoSuitePortal.tsx across all histories:")
for r in results[:50]:
    print(f"Folder: {r['folder']}, Step: {r['step']}, Tool: {r['tool']}, Len: {r['len']}, Garbled: {r['garbled']}")
