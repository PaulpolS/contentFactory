import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if os.path.exists(transcript_path):
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    print(f"Read {len(lines)} lines.")
    for idx, line in enumerate(lines):
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                if name in ["replace_file_content", "multi_replace_file_content"]:
                    args = tc.get("args") or tc.get("arguments") or {}
                    tf = args.get("TargetFile") or ""
                    if "App.tsx" in tf:
                        start = args.get("StartLine")
                        end = args.get("EndLine")
                        rep_len = len(args.get("ReplacementContent") or "")
                        chunks = args.get("ReplacementChunks") or []
                        chunks_str = f", chunks: {len(chunks)}" if chunks else ""
                        print(f"Step {step_idx}: {name} line {start}-{end}, len: {rep_len}{chunks_str}")
        except Exception as e:
            pass
else:
    print("No transcript")
