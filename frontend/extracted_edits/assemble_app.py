import json
import os
import re

folders = {
    "eccbdc81": "eccbdc81-f670-4dae-922b-0be80b80189b",
    "92117323": "92117323-9727-4a26-a9a1-344766219dc2",
    "23940d18": "23940d18-23ee-4fe2-ae49-7770fa53069d",
    "247e75b9": "247e75b9-4826-40df-8e90-5fa35311e2ea"
}

for name, folder in folders.items():
    tr_path = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}/.system_generated/logs/transcript.jsonl"
    if not os.path.exists(tr_path):
        print(f"Transcript for {name} not found")
        continue
    
    line_map = {}
    with open(tr_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            if "App.tsx" in line and "Showing lines" in line:
                try:
                    data = json.loads(line)
                    content = data.get("content", "")
                    step = data.get("step_index")
                    
                    m = re.search(r'Showing lines (\d+) to (\d+)', content)
                    if m:
                        start = int(m.group(1))
                        end = int(m.group(2))
                        
                        # Extract individual lines "123: code"
                        lines_in_content = content.split("\n")
                        for lc in lines_in_content:
                            m_line = re.match(r'^\s*(\d+):\s(.*)', lc)
                            if m_line:
                                ln_num = int(m_line.group(1))
                                ln_code = m_line.group(2)
                                line_map[ln_num] = ln_code
                except Exception:
                    pass
                    
    print(f"Extracted {len(line_map)} unique lines from {name}")
    if line_map:
        keys = sorted(line_map.keys())
        print(f"  Range: {keys[0]} to {keys[-1]}")
        out_name = f"scratch/lines_{name}.txt"
        with open(out_name, "w", encoding="utf-8") as out_f:
            for k in keys:
                out_f.write(f"{k}: {line_map[k]}\n")
        print(f"  Saved to {out_name}")
