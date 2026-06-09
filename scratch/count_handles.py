import os

app_path = "frontend/src/App.tsx"

if os.path.exists(app_path):
    with open(app_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Find indices of onClick={handleUploadAndExportCSV}
    idx = 0
    count = 0
    while True:
        idx = content.find("onClick={handleUploadAndExportCSV}", idx)
        if idx == -1:
            break
        count += 1
        print(f"Occurrence {count} at index {idx}")
        # Print surrounding context (100 chars before and after)
        start_context = max(0, idx - 150)
        end_context = min(len(content), idx + 200)
        context = content[start_context:end_context]
        print(f"Context:\n{repr(context)}\n")
        idx += 1
else:
    print("App.tsx not found")
