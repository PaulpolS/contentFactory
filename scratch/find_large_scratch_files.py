import os

scratch_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/scratch"
signature = 'Cpu className="w-4 h-4 text-slate-900"'

if os.path.exists(scratch_dir):
    print("Searching for App.tsx data in Gemini scratch...")
    found = []
    for f in os.listdir(scratch_dir):
        path = os.path.join(scratch_dir, f)
        if os.path.isfile(path):
            try:
                size = os.path.getsize(path)
                with open(path, "r", encoding="utf-8", errors="ignore") as file:
                    content = file.read()
                if signature in content or "canvasBgImage" in content or "fetchApprovedItems" in content:
                    print(f"FOUND MATCH: {f} (size: {size} bytes)")
                    found.append((f, size))
            except Exception as e:
                pass
    print(f"Scan complete. Found {len(found)} matches.")
else:
    print("Gemini scratch dir not found")
