import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        for idx, line in enumerate(f, 1):
            try:
                data = json.loads(line)
                if data.get("step_index") == 1674:
                    print("FOUND step 1674!")
                    tool_calls = data.get("tool_calls", [])
                    for tc in tool_calls:
                        print(f"Tool Name: {tc.get('name')}")
                        args = tc.get("args") or tc.get("arguments") or {}
                        print("Arguments:")
                        for k, v in args.items():
                            if k not in ["ReplacementContent", "TargetContent", "ReplacementChunks"]:
                                print(f"  {k}: {v}")
                            else:
                                print(f"  {k} (length: {len(str(v))})")
                                if isinstance(v, str):
                                    print(f"    Snippet: {v[:200]} ... {v[-200:]}")
            except Exception as e:
                pass
else:
    print("Log not found")
