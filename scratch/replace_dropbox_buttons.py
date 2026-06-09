import os

app_path = "frontend/src/App.tsx"

if os.path.exists(app_path):
    with open(app_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Find and replace all onClick={async () => { ... dropboxToken ... setIsUploadingDropbox(false); }}
    occurrences = []
    start = 0
    while True:
        pos = content.find("onClick={async () => {", start)
        if pos == -1:
            break
        # Find the next setIsUploadingDropbox(false);
        end_pos = content.find("setIsUploadingDropbox(false);", pos)
        if end_pos != -1:
            end_brace = content.find("}}", end_pos)
            if end_brace != -1:
                block = content[pos:end_brace+2]
                if "dropboxToken" in block:
                    occurrences.append((pos, end_brace+2, block))
        start = pos + 1
        
    print(f"Found {len(occurrences)} occurrences")
    
    # Replace in reverse order so indices remain correct
    new_content = content
    for start_idx, end_idx, block in reversed(occurrences):
        new_content = new_content[:start_idx] + "onClick={handleUploadAndExportCSV}" + new_content[end_idx:]
        
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Replacement done successfully!")
else:
    print(f"File not found: {app_path}")
