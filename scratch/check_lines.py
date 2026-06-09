import json
import os
import re

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

recovered_lines = {} # line_number (1-indexed) -> line_content

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                step_type = data.get("type", "")
                content = data.get("content", "")
                
                if step_type == "VIEW_FILE" and "App.tsx" in content:
                    # Parse the lines
                    # The format:
                    # Showing lines X to Y
                    # followed by line content in format:
                    # <line_number>: <original_line>
                    # e.g. "123:   const [x, setX] = useState();"
                    lines = content.split("\n")
                    for l in lines:
                        m = re.match(r"^(\d+):\s(.*)$", l)
                        if m:
                            line_num = int(m.group(1))
                            line_content = m.group(2)
                            # Store it
                            recovered_lines[line_num] = line_content
            except Exception as e:
                pass

print(f"Total unique lines recovered: {len(recovered_lines)}")
if recovered_lines:
    max_line = max(recovered_lines.keys())
    print(f"Max line number: {max_line}")
    
    # Check for missing lines
    missing = []
    for i in range(1, max_line + 1):
        if i not in recovered_lines:
            missing.append(i)
    print(f"Number of missing lines: {len(missing)}")
    if len(missing) < 50:
        print(f"Missing lines: {missing}")
    else:
        print(f"First 50 missing lines: {missing[:50]}")
        # Let's print missing ranges
        ranges = []
        start = None
        for i in range(1, max_line + 2):
            if i in missing:
                if start is None:
                    start = i
            else:
                if start is not None:
                    ranges.append((start, i - 1))
                    start = None
        print(f"Missing ranges: {ranges}")
else:
    print("No lines recovered")
