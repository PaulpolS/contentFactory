import shutil
import subprocess

src = "scratch/reconstructed_App_strict.tsx"
dst = "frontend/src/App.tsx"

shutil.copy(src, dst)
print("Copied. Running build...")
res = subprocess.run(["npm", "run", "build"], cwd="frontend", capture_output=True, text=True)
print("=== STDOUT ===")
print(res.stdout)
print("=== STDERR ===")
print(res.stderr[:2000])
