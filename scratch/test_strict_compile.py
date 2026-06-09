import shutil
import subprocess
import os

app_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"
backup_temp = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_tsx_live_temp.tsx"
candidate_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_strict.tsx"

print("Backing up live App.tsx...")
shutil.copy(app_path, backup_temp)

try:
    print(f"Swapping in {candidate_path}...")
    shutil.copy(candidate_path, app_path)
    
    print("Running npx tsc --noEmit...")
    res = subprocess.run(["npx", "tsc", "--noEmit"], cwd="/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend", capture_output=True, text=True)
    
    print("TypeScript exit code:", res.returncode)
    if res.stdout:
        print("Stdout:\n", res.stdout[:2000])
        if len(res.stdout) > 2000:
            print("... (truncated)")
    if res.stderr:
        print("Stderr:\n", res.stderr)
finally:
    print("Restoring live App.tsx...")
    shutil.copy(backup_temp, app_path)
    if os.path.exists(backup_temp):
        os.remove(backup_temp)
    print("Done.")
