import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
folder = "7329dad1-f7d4-4220-817c-43133a2c4809"
transcript_path = os.path.join(brain_dir, folder, ".system_generated/logs/transcript.jsonl")

if os.path.exists(transcript_path):
    print("Extracting current conversation steps for QuoteVideoPortal...")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            if "QuoteVideoPortal.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    for tc in data.get("tool_calls", []):
                        name = tc.get("name")
                        args = tc.get("args", {})
                        if "QuoteVideoPortal.tsx" in str(args):
                            out_path = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/curr_step_{step}_{name}.json"
                            with open(out_path, "w", encoding="utf-8") as out_f:
                                json.dump(args, out_f, indent=2, ensure_ascii=False)
                            print(f"Saved step {step} {name} to {out_path}")
                except Exception as e:
                    pass
else:
    print("Transcript not found.")
