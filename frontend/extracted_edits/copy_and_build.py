import os
import shutil
import subprocess

src = "scratch/reconstructed_App_final.tsx"
dst = "frontend/src/App.tsx"

if os.path.exists(src):
    print(f"Copying {src} to {dst}...")
    shutil.copy(src, dst)
    print("Copy completed. Running build test...")
    
    # Run npm run build or vite build inside frontend directory
    res = subprocess.run(["npm", "run", "build"], cwd="frontend", capture_output=True, text=True)
    print(f"Build Exit Code: {res.returncode}")
    if res.returncode != 0:
        print("Build failed with errors:")
        print(res.stderr[:2000]) # Print first 2000 characters of error log
    else:
        print("Build succeeded! The app compiles successfully!")
else:
    print(f"Source file {src} not found")
