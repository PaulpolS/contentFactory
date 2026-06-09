import shutil
import os
import subprocess

source_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_strict.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"
backup_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/App_backup_before_test.tsx"

# Back up current App.tsx
print("Backing up live App.tsx...")
shutil.copy(target_path, backup_path)

try:
    print("Reading reconstructed_App_strict.tsx...")
    with open(source_path, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    # Slice first 4652 lines (0-indexed 0 to 4652)
    partial_code = lines[:4652]
    
    # Let's append closing tags for:
    # </div> (closes view-container)
    # </main> (closes main-content)
    # </div> (closes app-container)
    # } (closes App component)
    closing_snippet = """
        </div>
      </main>
    </div>
  );
}
"""
    
    full_test_code = "".join(partial_code) + closing_snippet
    
    print("Writing temporary test App.tsx...")
    with open(target_path, "w", encoding="utf-8") as f:
        f.write(full_test_code)
        
    print("Running type checker (npx tsc -p tsconfig.app.json --noEmit)...")
    res = subprocess.run(["npx", "tsc", "-p", "tsconfig.app.json", "--noEmit"], cwd="/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend", capture_output=True, text=True)
    
    print(f"TypeScript Exit Code: {res.returncode}")
    if res.stdout:
        print("Stdout:")
        print(res.stdout)
    if res.stderr:
        print("Stderr:")
        print(res.stderr)
        
finally:
    print("Restoring original App.tsx...")
    shutil.copy(backup_path, target_path)
    if os.path.exists(backup_path):
        os.remove(backup_path)
    print("Cleanup done.")
