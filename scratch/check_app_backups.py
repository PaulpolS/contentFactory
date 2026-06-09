import os
import subprocess

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
backups = [f for f in os.listdir(scratch_dir) if "App" in f]

print("Found backups:")
for b in backups:
    path = os.path.join(scratch_dir, b)
    if os.path.isdir(path):
        continue
    size = os.path.getsize(path)
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
    num_lines = len(lines)
    
    # Check if it has print( or python script content
    has_python = any("print(" in l and "import " in l for l in lines[:100]) or any("apply_final_ux_redesign" in l for l in lines)
    
    # Count tabs
    tabs = []
    for l in lines:
        if "activeTab ===" in l:
            tabs.append(l.strip())
            
    print(f"- {b}: {size} bytes, {num_lines} lines, has_python={has_python}")
    print(f"  Tabs: {len(tabs)}")
    for t in tabs[:5]:
        print(f"    {t}")
