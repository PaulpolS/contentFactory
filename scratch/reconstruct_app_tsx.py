import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

views = []
with open(transcript_path, 'r', encoding='utf-8') as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            step_type = data.get("type", "")
            content = data.get("content", "")
            
            if step_type == "VIEW_FILE" and "App.tsx" in content:
                # Extract line numbers from content if possible
                # The format is usually "Showing lines X to Y"
                # Let's extract X and Y
                import re
                m = re.search(r"Showing lines (\d+) to (\d+)", content)
                if m:
                    start_line = int(m.group(1))
                    end_line = int(m.group(2))
                    views.append({
                        "line_num": line_num,
                        "step_idx": step_idx,
                        "start_line": start_line,
                        "end_line": end_line,
                        "content": content
                    })
                    print(f"Line {line_num}: Step {step_idx} viewed lines {start_line} to {end_line}")
        except Exception as e:
            pass

print(f"Found {len(views)} views of App.tsx")
