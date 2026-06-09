import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                if name == "run_command":
                    args = tc.get("args", {})
                    cmd = args.get("CommandLine")
                    print(f"Step {step_idx}: run_command {cmd}")
        except Exception as e:
            pass
else:
    print("No transcript")
