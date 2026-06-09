import os
import json

TRANSCRIPT_PATH = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/.system_generated/logs/transcript.jsonl"
OUT_DIR = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/e9655d99-64e7-4443-b6dc-945f61748186/scratch"

def main():
    if not os.path.exists(TRANSCRIPT_PATH):
        print("Transcript not found.")
        return
        
    print(f"Reading transcript {TRANSCRIPT_PATH}...")
    with open(TRANSCRIPT_PATH, 'r', encoding='utf-8', errors='replace') as f:
        for idx, line in enumerate(f, 1):
            if 'App.tsx' not in line:
                continue
            if 'TAB 3: GRAPHIC CANVAS WORKSPACE' not in line:
                continue
                
            try:
                data = json.loads(line)
            except json.JSONDecodeError:
                continue
                
            step = data.get('step_index')
            typ = data.get('type')
            content = data.get('content', '')
            
            if typ == 'VIEW_FILE' and content:
                print(f"Match VIEW_FILE at step {step}, content len: {len(content)}")
                out_path = os.path.join(OUT_DIR, f"view_step_{step}.tsx")
                with open(out_path, 'w', encoding='utf-8') as out_f:
                    out_f.write(content)
                print(f"  Wrote to {out_path}")

if __name__ == '__main__':
    main()
