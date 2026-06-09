import os

scratch_dir = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch"
files = [f for f in os.listdir(scratch_dir) if f.endswith(".tsx")]

print("Scanning backups for Canvas tab block...")
for f in files:
    path = os.path.join(scratch_dir, f)
    with open(path, "r", encoding="utf-8", errors="ignore") as file_obj:
        content = file_obj.read()
    
    # Search for activeTab === 'canvas' && (
    pos = content.find("activeTab === 'canvas' && (")
    if pos == -1:
        pos = content.find("activeTab === 'canvas'&&")
    if pos != -1:
        # Check if the block has the credit check corruption
        sub = content[pos:pos+1500]
        has_corruption = "setIsCheckingCredits" in sub or "setIsCheckingCredits" in content[pos:pos+500]
        print(f"- {f}: has_canvas=True, has_credit_check_corruption={has_corruption}")
        # Print a small snippet of the canvas block
        snippet = content[pos:pos+400]
        print("  Snippet:")
        for line in snippet.splitlines()[:12]:
            print(f"    {line}")
    else:
        print(f"- {f}: has_canvas=False")
