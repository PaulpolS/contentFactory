with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find the old Copywriting panel and delete it.
lines = content.split('\n')
start_idx = -1
end_idx = -1

for idx, line in enumerate(lines):
    if "{canvasSelectedItem?.metadata?.copywriting ? (" in line and start_idx == -1:
        if idx + 1 < len(lines) and 'className="space-y-4 pt-1 animate-fade-in"' in lines[idx+1]:
            start_idx = idx
            print(f"Found old panel start on line {start_idx + 1}")
            break

if start_idx != -1:
    for idx in range(start_idx, len(lines)):
        if ")}" in lines[idx]:
            # Look ahead up to 5 lines for Aspect Ratio comment
            found_aspect = False
            for offset in range(1, 6):
                if idx + offset < len(lines) and "Aspect Ratio" in lines[idx + offset]:
                    found_aspect = True
                    break
            if found_aspect:
                end_idx = idx
                print(f"Found old panel end on line {end_idx + 1}")
                break

if start_idx != -1 and end_idx != -1:
    print(f"Deleting lines {start_idx + 1} to {end_idx + 1}...")
    new_lines = lines[:start_idx] + lines[end_idx+1:]
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
        f.write('\n'.join(new_lines))
    print("Old copywriting panel successfully deleted!")
else:
    print("Could not find start and end of old copywriting panel cleanly.")
