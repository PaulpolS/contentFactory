import subprocess

res = subprocess.run(["npm", "run", "build"], cwd="frontend", capture_output=True, text=True)
print("=== STDOUT ===")
print(res.stdout)
print("=== STDERR ===")
print(res.stderr)
