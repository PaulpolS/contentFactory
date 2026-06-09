import os

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
if os.path.exists(orig_path):
    print("YES! Original clean file exists!")
    print("Size:", os.path.getsize(orig_path))
else:
    print("NO, original path does not exist.")
    # Search for AutomatedVideoGeneratorTab.tsx in parent directories
    parent_dir = "/Users/paulpolsulintaboon/Documents/GitHub"
    found = []
    for root, dirs, files in os.walk(parent_dir):
        for file in files:
            if "AutomatedVideoGenerator" in file or "VerticalVideo" in file:
                found.append(os.path.join(root, file))
    print("Found files with similar names:")
    for f in found:
        print("-", f)
