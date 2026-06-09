import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    for line in lines:
        try:
            data = json.loads(line)
            if data.get("step_index") == 1674:
                print("Found step 1674!")
                print("Keys:", data.keys())
                tool_calls = data.get("tool_calls", [])
                print("Tool calls count:", len(tool_calls))
                for idx, tc in enumerate(tool_calls):
                    print(f"Tool Call {idx} keys: {tc.keys()}")
                    if "args" in tc:
                        print("Found args key instead of arguments!")
                        print(tc["args"].keys())
                    # Dump the whole tc structure
                    print(json.dumps(tc, indent=2)[:1000])
        except Exception as e:
            pass
else:
    print("No transcript")
