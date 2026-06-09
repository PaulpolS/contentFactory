import json
import os
import re

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"
recovered_lines = {}

if os.path.exists(transcript_path):
    print("Transcript found! Scanning...")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            if "App.tsx" in line:
                try:
                    data = json.loads(line)
                    typ = data.get("type")
                    content = data.get("content", "")
                    
                    if "Showing lines" in content and "App.tsx" in content:
                        match = re.search(r'Showing lines (\d+) to (\d+)', content)
                        if match:
                            start_line = int(match.group(1))
                            end_line = int(match.group(2))
                            
                            # Parse lines of code. They are formatted as "123: code"
                            # Let's split content by newlines
                            lines_in_content = content.split("\n")
                            for lc in lines_in_content:
                                m_line = re.match(r'^\s*(\d+):\s(.*)', lc)
                                if m_line:
                                    ln_num = int(m_line.group(1))
                                    ln_code = m_line.group(2)
                                    # We keep the latest one (higher step/index in file)
                                    recovered_lines[ln_num] = ln_code
                except Exception as e:
                    pass
                    
    # Print statistics of recovered lines
    print(f"Total unique lines recovered: {len(recovered_lines)}")
    if recovered_lines:
        sorted_keys = sorted(recovered_lines.keys())
        print(f"Min line: {sorted_keys[0]}, Max line: {sorted_keys[-1]}")
        
        # Check for gaps
        gaps = []
        start_gap = None
        for i in range(sorted_keys[0], sorted_keys[-1] + 1):
            if i not in recovered_lines:
                if start_gap is None:
                    start_gap = i
            else:
                if start_gap is not None:
                    gaps.append((start_gap, i - 1))
                    start_gap = None
        if start_gap is not None:
            gaps.append((start_gap, sorted_keys[-1]))
            
        print(f"Gaps found: {len(gaps)}")
        for g in gaps:
            print(f"  Gap: {g[0]} to {g[1]} ({g[1] - g[0] + 1} lines)")
            
        # Let's write the recovered lines to a file in order
        with open("scratch/recovered_247e.txt", "w", encoding="utf-8") as out_f:
            for k in sorted_keys:
                out_f.write(f"{k}: {recovered_lines[k]}\n")
            print("Wrote recovered lines to scratch/recovered_247e.txt")
else:
    print("Transcript not found")
