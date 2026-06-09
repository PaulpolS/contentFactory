import json
import os
import re

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"
steps_to_extract = [6155, 6163, 6165, 6167, 6171]

extracted = {}

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            try:
                data = json.loads(line)
                step = data.get("step_index")
                if step in steps_to_extract:
                    content = data.get("content", "")
                    extracted[step] = content
                    print(f"Extracted step {step}, content length: {len(content)}")
            except Exception:
                pass
                
    # Let's parse each step's content to extract "line_number: code"
    all_lines = {}
    for step in sorted(extracted.keys()):
        content = extracted[step]
        lines = content.split("\n")
        count = 0
        for l in lines:
            m = re.match(r'^\s*(\d+):\s(.*)', l)
            if m:
                ln = int(m.group(1))
                code = m.group(2)
                # Keep latest step for overlapping lines
                all_lines[ln] = code
                count += 1
        print(f"  Step {step} had {count} code lines")
        
    # Write sorted lines to a scratch file
    sorted_keys = sorted(all_lines.keys())
    print(f"Total merged lines from these steps: {len(all_lines)}")
    if sorted_keys:
        print(f"Range: {sorted_keys[0]} to {sorted_keys[-1]}")
        with open("scratch/merged_gap_247e.txt", "w", encoding="utf-8") as out_f:
            for k in sorted_keys:
                out_f.write(f"{k}: {all_lines[k]}\n")
            print("Saved merged lines to scratch/merged_gap_247e.txt")
else:
    print("Transcript not found")
