import os

scratch_dir = "/Users/paulpolsulintaboon/.gemini/antigravity/scratch"
if os.path.exists(scratch_dir):
    print("Files in Gemini scratch directory:")
    for f in os.listdir(scratch_dir):
        path = os.path.join(scratch_dir, f)
        if os.path.isfile(path):
            print(f"  {f} (size: {os.path.getsize(path)} bytes)")
else:
    print("Gemini scratch directory not found")
