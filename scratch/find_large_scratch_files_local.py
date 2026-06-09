import os

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
for file in os.listdir(scratch_dir):
    path = os.path.join(scratch_dir, file)
    if os.path.isfile(path):
        size = os.path.getsize(path)
        if size > 100000: # 100KB
            print(f"- {file} ({size} bytes)")
