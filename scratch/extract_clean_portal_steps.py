import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
folder = "92117323-9727-4a26-a9a1-344766219dc2"
transcript_path = os.path.join(brain_dir, folder, ".system_generated/logs/transcript.jsonl")

if os.path.exists(transcript_path):
    print("Found transcript!")
    with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
        for idx, line in enumerate(f):
            if "VerticalVideoSuitePortal.tsx" in line:
                try:
                    data = json.loads(line)
                    step = data.get("step_index")
                    for tc in data.get("tool_calls", []):
                        name = tc.get("name")
                        args = tc.get("args", {})
                        if "VerticalVideoSuitePortal.tsx" in str(args):
                            print(f"Step {step} has tool call {name}")
                            # Let's write this step's arguments to scratch to inspect
                            out_path = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/step_{step}_{name}.json"
                            with open(out_path, "w", encoding="utf-8") as out_f:
                                json.dump(args, out_f, indent=2, ensure_ascii=False)
                            print(f"  Saved args to {out_path}")
                except Exception as e:
                    print(f"  Error parsing line: {e}")
else:
    print("Transcript not found.")
