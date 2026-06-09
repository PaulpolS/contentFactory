path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/reconstructed_App_tsx_lines.txt"

with open(path, "r", encoding="utf-8") as f:
    for line in f:
        if "orchestrator" in line or "EventSource" in line or "/run/" in line:
            print(line.strip())
