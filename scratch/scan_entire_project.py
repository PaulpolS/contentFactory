import os
import glob

print("Scanning for App.tsx backups...")
paths = [
    "/Users/paulpolsulintaboon/.gemini/antigravity/worktrees",
    "/Users/paulpolsulintaboon/.gemini/antigravity/brain",
    "/Users/paulpolsulintaboon/.gemini/antigravity"
]

for p in paths:
    if os.path.exists(p):
        print("Checking path:", p)
        # Search recursively for files with name App.tsx
        for root, dirs, files in os.walk(p):
            for file in files:
                if "App.tsx" in file:
                    full_path = os.path.join(root, file)
                    print(f"  Found App.tsx at: {full_path} (size: {os.path.getsize(full_path)} bytes)")
