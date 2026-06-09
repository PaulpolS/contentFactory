import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"

if not os.path.exists(transcript_path):
    print("Transcript does not exist!")
    exit(1)

print("Scanning transcript for replace/multi-replace calls on App.tsx...")

with open(transcript_path, "r", encoding="utf-8") as f:
    for line_num, line in enumerate(f, 1):
        try:
            data = json.loads(line)
            step_idx = data.get("step_index")
            step_type = data.get("type", "")
            
            tool_calls = data.get("tool_calls", [])
            for tc in tool_calls:
                name = tc.get("name")
                args = tc.get("args", {})
                
                target_file = args.get("TargetFile", "")
                if "App.tsx" in target_file and name in ["replace_file_content", "multi_replace_file_content"]:
                    # Print size of ReplacementContent or ReplacementChunks
                    if name == "replace_file_content":
                        rc = args.get("ReplacementContent", "")
                        size = len(rc)
                        if size > 1000:
                            print(f"L{line_num} | Step {step_idx}: replace_file_content with size {size} chars. Instruction: {args.get('Instruction')}")
                            # Save it
                            out_f = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/replace_content_step_{step_idx}_{size}.txt"
                            with open(out_f, "w", encoding="utf-8") as w_f:
                                w_f.write(rc)
                            print(f"   Saved to {out_f}")
                    elif name == "multi_replace_file_content":
                        chunks = args.get("ReplacementChunks", [])
                        print(f"L{line_num} | Step {step_idx}: multi_replace_file_content with {len(chunks)} chunks.")
                        for c_idx, chunk in enumerate(chunks):
                            rc = chunk.get("ReplacementContent", "")
                            size = len(rc)
                            if size > 1000:
                                print(f"  Chunk {c_idx} size: {size} chars")
                                # Save it
                                out_f = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/multi_replace_content_step_{step_idx}_chunk_{c_idx}_{size}.txt"
                                with open(out_f, "w", encoding="utf-8") as w_f:
                                    w_f.write(rc)
                                print(f"     Saved to {out_f}")
        except Exception as e:
            pass
