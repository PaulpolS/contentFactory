import os
import json

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
results = []

for folder in os.listdir(brain_dir):
    folder_path = os.path.join(brain_dir, folder)
    if not os.path.isdir(folder_path):
        continue
    
    transcript_path = os.path.join(folder_path, ".system_generated/logs/transcript.jsonl")
    if os.path.exists(transcript_path):
        try:
            with open(transcript_path, "r", encoding="utf-8", errors="ignore") as f:
                for line in f:
                    if "export default App" in line:
                        try:
                            data = json.loads(line)
                            step = data.get("step_index")
                            source = data.get("source")
                            typ = data.get("type")
                            content = data.get("content") or ""
                            # If this is a step containing file content
                            if len(content) > 5000:
                                print(f"FOUND potential App.tsx in folder {folder}, step {step} ({source}, {typ})! Length: {len(content)}")
                                results.append((folder, step, content))
                        except Exception as e:
                            pass
        except Exception as e:
            pass

if results:
    # Save the largest one
    results.sort(key=lambda x: len(x[2]), reverse=True)
    folder, step, content = results[0]
    out_path = "scratch/App_tsx_view_recovered.tsx"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Saved to {out_path} (len: {len(content)})")
else:
    print("No export default App found in step contents.")
