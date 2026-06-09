import json
import os
import re

folders = [
    "59119761-b490-421b-b15d-46f12f5c4158",
    "19aed406-df08-4966-b539-2983abe8026d",
    "247e75b9-4826-40df-8e90-5fa35311e2ea",
    "eccbdc81-f670-4dae-922b-0be80b80189b"
]

all_extracted_fragments = []

for folder in folders:
    transcript_path = f"/Users/paulpolsulintaboon/.gemini/antigravity/brain/{folder}/.system_generated/logs/transcript.jsonl"
    if os.path.exists(transcript_path):
        print(f"Scanning folder {folder}...")
        with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
            for idx, line in enumerate(f):
                if "App.tsx" in line:
                    try:
                        data = json.loads(line)
                        step = data.get("step_index")
                        typ = data.get("type")
                        content = data.get("content", "")
                        
                        # We want the content output of view_file, which is in a CODE_ACTION or SYSTEM step,
                        # or the planner response content if it printed something.
                        # Actually, when view_file runs, the output goes into a CODE_ACTION or SYSTEM step
                        # right after the MODEL step.
                        # Let's inspect if the content contains "Showing lines" and "App.tsx".
                        if "Showing lines" in content and "App.tsx" in content:
                            # Extract lines numbers
                            match = re.search(r'Showing lines (\d+) to (\d+)', content)
                            if match:
                                start_line = int(match.group(1))
                                end_line = int(match.group(2))
                                
                                # Let's save this fragment!
                                # Content contains the actual lines of code, usually preceeded by line numbers like "2680: <code_here>"
                                all_extracted_fragments.append({
                                    "folder": folder,
                                    "step": step,
                                    "start": start_line,
                                    "end": end_line,
                                    "content": content
                                })
                                print(f"  Saved step {step} from {folder}: lines {start_line} to {end_line}")
                    except Exception as e:
                        pass
    else:
        print(f"Transcript not found in folder {folder}")

# Let's write them all to a json file
with open("scratch/all_fragments.json", "w", encoding="utf-8") as f:
    json.dump(all_extracted_fragments, f, ensure_ascii=False, indent=2)

print(f"Total fragments saved: {len(all_extracted_fragments)}")
