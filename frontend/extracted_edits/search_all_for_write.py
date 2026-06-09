import json
import os
import subprocess

# Run find command to get all transcript paths
print("Finding transcripts...")
res = subprocess.run(["find", "/Users/paulpolsulintaboon/.gemini/antigravity/brain/", "-name", "transcript.jsonl"], capture_output=True, text=True)
transcripts = [line.strip() for line in res.stdout.split("\n") if line.strip()]

print(f"Found {len(transcripts)} transcripts. Scanning for App.tsx write_to_file calls with >100KB size...")

for tr in transcripts:
    if not os.path.exists(tr):
        continue
    folder = tr.split("/")[-4] # Get the conversation ID
    try:
        # Check size of transcript first to avoid reading huge files if not necessary
        tr_size = os.path.getsize(tr)
        if tr_size == 0:
            continue
        
        with open(tr, "r", encoding="utf-8", errors="ignore") as f:
            for line in f:
                # Fast check to see if App.tsx and write_to_file are in the line
                if "App.tsx" in line and "write_to_file" in line:
                    try:
                        data = json.loads(line)
                        step = data.get("step_index")
                        tc_list = data.get("tool_calls", [])
                        for tc in tc_list:
                            name = tc.get("name")
                            args = tc.get("args") or tc.get("arguments") or {}
                            tf = args.get("TargetFile") or ""
                            if "App.tsx" in tf and name == "write_to_file":
                                code = args.get("CodeContent", "")
                                if len(code) > 100000:
                                    print(f"MATCH! Folder: {folder}, Step: {step}, Code length: {len(code)}")
                                    out_path = f"scratch/recovered_full_App_{folder}_step_{step}.tsx"
                                    with open(out_path, "w", encoding="utf-8") as out_f:
                                        out_f.write(code)
                                    print(f"  Wrote code to {out_path}")
                    except Exception as e:
                        pass
    except Exception as e:
        print(f"Error reading {tr}: {e}")

print("Done scanning!")
