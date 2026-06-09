import os
import json

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
if not os.path.exists(transcript_path):
    print("Transcript not found")
    exit(1)

print("Scanning transcript for early App.tsx content...")

with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
    for idx, line in enumerate(f):
        try:
            data = json.loads(line)
        except:
            continue
        
        step_index = data.get("step_index", -1)
        step_type = data.get("type", "")
        
        # We look for a step in the first 100 steps that contains App.tsx or write to App.tsx
        if step_index > 150:
            break
            
        tool_calls = data.get("tool_calls", [])
        for tc in tool_calls:
            name = tc.get("name")
            args = tc.get("args", {})
            target = args.get("TargetFile", "") or args.get("targetFile", "")
            if "App.tsx" in target:
                print(f"Step {step_index} | Type {step_type} | Tool {name} | Target {target}")
                content = args.get("CodeContent") or args.get("ReplacementContent") or ""
                print(f"  Content length: {len(content)}")
                if len(content) > 100000:
                    # Let's save it
                    out_path = f"/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_early_step_{step_index}.tsx"
                    with open(out_path, "w", encoding="utf-8") as out_f:
                        out_f.write(content)
                    print(f"  Saved to {out_path}")
                    
        if step_type == "VIEW_FILE" and "App.tsx" in data.get("content", ""):
            content = data.get("content", "")
            print(f"Step {step_index} | VIEW_FILE App.tsx | Content length: {len(content)}")
