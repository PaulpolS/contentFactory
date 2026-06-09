import os

brain_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/brain"
if os.path.exists(brain_dir):
    contents = os.listdir(brain_dir)
    print(f"Subdirectories under {brain_dir}:")
    for item in contents:
        full_path = os.path.join(brain_dir, item)
        if os.path.isdir(full_path):
            print(f"Directory: {item}")
        else:
            print(f"File: {item}")
else:
    print(f"Brain dir not found: {brain_dir}")
