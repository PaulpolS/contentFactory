import os
import json
import re

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
lines_dict = {}

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                step = data.get("step_index")
                step_type = data.get("type", "")
                content = data.get("content", "")
                # Only check views before corruption at step 1683
                if step < 1683 and step_type == "VIEW_FILE" and "App.tsx" in content:
                    lines = content.split("\n")
                    for l in lines:
                        m = re.match(r"^(\d+):\s(.*)$", l)
                        if m:
                            l_num = int(m.group(1))
                            l_content = m.group(2)
                            lines_dict[l_num] = l_content
            except Exception as e:
                pass
else:
    print("Not found")

print(f"Total unique lines extracted: {len(lines_dict)}")
if lines_dict:
    # Print the range of lines we have
    sorted_keys = sorted(lines_dict.keys())
    print(f"Range of lines: {sorted_keys[0]} to {sorted_keys[-1]}")
    # Save all to a file
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_tsx_lines.txt", "w", encoding="utf-8") as out:
        for k in sorted_keys:
            out.write(f"{k}: {lines_dict[k]}\n")
    print("Saved to scratch/reconstructed_App_tsx_lines.txt")
