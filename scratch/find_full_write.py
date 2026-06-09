import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
output_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"

if not os.path.exists(transcript_path):
    print("Transcript not found.")
    exit(1)

print("Searching transcript for writes to App.tsx...")
with open(transcript_path, "r", encoding="utf-8", errors="replace") as f:
    for line_idx, line in enumerate(f):
        try:
            data = json.loads(line)
        except:
            continue
            
        step_index = data.get("step_index", -1)
        step_type = data.get("type", "")
        tool_calls = data.get("tool_calls", [])
        
        # If tool_calls is not in root, check in planner response content
        if not tool_calls and "content" in data:
            # Some platforms put tool calls inside the content or in different formats
            pass
            
        for tc in tool_calls:
            # Standard OpenAI function call format
            function_data = tc.get("function", {})
            method = function_data.get("name", "")
            args_str = function_data.get("arguments", "{}")
            
            try:
                if isinstance(args_str, str):
                    args = json.loads(args_str)
                else:
                    args = args_str
            except:
                continue
                
            target_file = args.get("TargetFile", "") or args.get("targetFile", "")
            if target_file and "App.tsx" in target_file:
                print(f"Line {line_idx+1} | Step {step_index} | Method {method}")
                
                code_content = args.get("CodeContent", "") or args.get("codeContent", "")
                replacement = args.get("ReplacementContent", "") or args.get("replacementContent", "")
                
                content = code_content or replacement
                content_len = len(content)
                print(f"  Content length: {content_len}")
                
                if content_len > 10000:
                    out_name = f"app_write_step_{step_index}_{content_len}.tsx"
                    out_path = os.path.join(output_dir, out_name)
                    with open(out_path, "w", encoding="utf-8") as out_f:
                        out_f.write(content)
                    print(f"  Saved to {out_path}")
