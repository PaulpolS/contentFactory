import os
import json
import re

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
print(f"Scanning transcripts in {brain_dir} for App.tsx...")

for root, dirs, files in os.walk(brain_dir):
    for file in files:
        if file == "transcript.jsonl":
            path = os.path.join(root, file)
            try:
                # Read the file and search for frontend/src/App.tsx
                # Check file size first
                size = os.path.getsize(path)
                if size > 100000: # only process large transcripts
                    with open(path, "r", encoding="utf-8", errors="ignore") as f:
                        for line_idx, line in enumerate(f, 1):
                            if "frontend/src/App.tsx" in line:
                                # Parse json
                                try:
                                    data = json.loads(line)
                                    step = data.get("step_index")
                                    step_type = data.get("type")
                                    content = data.get("content", "")
                                    # Check if content has "Showing lines" and covers lines > 4000
                                    show_match = re.search(r'Showing lines (\d+) to (\d+)', content)
                                    if show_match:
                                        start = int(show_match.group(1))
                                        end = int(show_match.group(2))
                                        # Let's count how many lines are in this VIEW
                                        if end - start > 500:
                                            folder_id = os.path.basename(os.path.dirname(os.path.dirname(root)))
                                            print(f"Match: {path} | L{line_idx} | Step {step} | viewed {start}-{end} (Folder: {folder_id})")
                                            # Write this content to a separate file
                                            out_f = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/extracted_view_{folder_id}_step_{step}_{start}_{end}.txt"
                                            with open(out_f, "w", encoding="utf-8") as out_w:
                                                out_w.write(content)
                                            print(f"   Saved view to {out_f}")
                                except Exception as e:
                                    pass
            except Exception as e:
                pass
print("Scan complete.")
