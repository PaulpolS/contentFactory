import json
import os

log_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/19aed406-df08-4966-b539-2983abe8026d/.system_generated/logs/transcript.jsonl"

if os.path.exists(log_path):
    print("Log exists, searching for step 82...")
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        for line in f:
            try:
                data = json.loads(line)
                if data.get("step_index") == 82:
                    print("FOUND step 82!")
                    tool_calls = data.get("tool_calls", [])
                    for tc in tool_calls:
                        name = tc.get("name")
                        args = tc.get("args") or tc.get("arguments") or {}
                        code = args.get("CodeContent") or ""
                        print(f"Tool {name}, CodeContent length: {len(code)}")
                        # Save it!
                        if code:
                            with open("scratch/App_tsx_step82_original.tsx", "w", encoding="utf-8") as out:
                                out.write(code)
                            print("Saved to scratch/App_tsx_step82_original.tsx")
                    break
            except Exception as e:
                pass
else:
    print("Log not found")
