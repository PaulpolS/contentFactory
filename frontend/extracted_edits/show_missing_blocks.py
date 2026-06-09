import json
import os
import re

# We want to trace which line ranges are missing.
# Let's load the reconstructed keys from a simplified run of the aligner.
# We will do this by loading the transcripts and running the alignment in memory.
ecc_folder = "eccbdc81-f670-4dae-922b-0be80b80189b"
tr_path = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{ecc_folder}/.system_generated/logs/transcript.jsonl"

ecc_map = {}
if os.path.exists(tr_path):
    with open(tr_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            if "App.tsx" in line and "Showing lines" in line:
                try:
                    data = json.loads(line)
                    content = data.get("content", "")
                    lines_in_content = content.split("\n")
                    for lc in lines_in_content:
                        m_line = re.match(r'^\s*(\d+):\s(.*)', lc)
                        if m_line:
                            ecc_map[int(m_line.group(1))] = m_line.group(2)
                except Exception:
                    pass

# Re-run strict alignment in memory
with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    current_len = len(f.readlines())

reconstructed_keys = set(range(1, 2682))
# Add what's in ecc_map
for ln in range(2682, 5763):
    if ln in ecc_map:
        reconstructed_keys.add(ln)

# Run strict aligner's logic in memory to see what keys got filled
# We will simulate the fill pass
# ... (we can just load the output from the strict script)
# Let's print missing ranges in the reference coord system [1, 5762]
missing = []
for i in range(1, 5763):
    # Actually, in our strict script, we had reconstructed map. Let's see what keys are in reconstructed.
    pass

# Let's just compare scratch/reconstructed_App_strict.tsx with the strict script's results
# We can read the lines in reconstructed_App_strict.tsx, and we want to know what ranges of the expected
# 5762 lines were not filled.
# Let's write a python script to run this.
