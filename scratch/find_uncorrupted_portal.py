import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
search_str = "VerticalVideoSuitePortal.tsx"

print("Scanning past conversation transcripts...")
found_steps = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for idx, line in enumerate(f):
                    if search_str in line and ("write_to_file" in line or "replace_file_content" in line or "multi_replace_file_content" in line):
                        # Let's inspect this step
                        try:
                            data = json.loads(line)
                            tool_calls = data.get("tool_calls", [])
                            for tc in tool_calls:
                                args = tc.get("args", {})
                                target_file = args.get("TargetFile", "")
                                if search_str in target_file:
                                    code_content = args.get("CodeContent", "")
                                    repl_content = args.get("ReplacementContent", "")
                                    chunks = args.get("ReplacementChunks", [])
                                    
                                    # Check if the content is clean (no garbled "犧")
                                    is_clean = "犧" not in code_content and "犧" not in repl_content
                                    
                                    found_steps.append({
                                        "folder": folder,
                                        "step_index": data.get("step_index"),
                                        "type": tc.get("name"),
                                        "is_clean": is_clean,
                                        "code_len": len(code_content) or len(repl_content) or len(str(chunks))
                                    })
                        except:
                            pass
        except Exception as e:
            print(f"Error reading {transcript_path}: {e}")

# Print findings sorted by clean first, then size
found_steps.sort(key=lambda x: (x["is_clean"], x["code_len"]), reverse=True)
print(f"Found {len(found_steps)} matching steps:")
for step in found_steps[:30]:
    print(f"Folder: {step['folder']}, Step: {step['step_index']}, Type: {step['type']}, Clean: {step['is_clean']}, Len: {step['code_len']}")
