import json
import os

transcript_path = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
app_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"

if os.path.exists(transcript_path):
    # Read the transcript lines in reverse order to find the last successful edit/write tool call before this step
    with open(transcript_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    print(f"Read {len(lines)} lines of transcript.")
    
    # We want to find the state of App.tsx right after the previous turn's successful compile, 
    # which is before step index that executed python3 scratch/replace_dropbox_buttons.py.
    # The command was run in the current turn.
    
    # Let's inspect the files or write tools in transcript.jsonl.
    # We can search for the last replace_file_content call to App.tsx that completed in the PREVIOUS step.
    # Wait, we can look for "activeLightboxItem" or "handleAutoSelectBgImages" being successfully written.
    # Let's just find lines with "activeLightboxItem" and extract the file contents if they are fully logged,
    # OR we can extract the file from the compaction logs or previous checkpoint.
    # Wait, if App.tsx is too large, the transcript.jsonl might have truncated tool arguments.
    # Let's check if the transcript has the full contents or if we can restore from another method.
    
    # Let's read the transcript step by step and print info.
    for idx in range(len(lines) - 1, -1, -1):
        line = lines[idx]
        try:
            data = json.loads(line)
            # Find replace_file_content calls
            if "tool_calls" in data:
                for tc in data["tool_calls"]:
                    if tc.get("name") == "replace_file_content" and "App.tsx" in str(tc):
                        print(f"Found replace_file_content call at step {data.get('step_index')}")
        except Exception as e:
            pass
else:
    print(f"Transcript not found at {transcript_path}")
