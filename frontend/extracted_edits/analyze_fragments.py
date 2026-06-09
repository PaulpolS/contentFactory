import json

with open("scratch/all_fragments.json", "r") as f:
    frags = json.load(f)

print(f"Total fragments: {len(frags)}")

# Look for fragments that cover the gap from 2680 to 3280
matches = []
for fr in frags:
    # Check if the fragment overlaps with [2680, 3280]
    overlap_start = max(2680, fr["start"])
    overlap_end = min(3280, fr["end"])
    if overlap_start < overlap_end:
        matches.append(fr)
        print(f"Overlap: folder={fr['folder']}, step={fr['step']}, lines={fr['start']} to {fr['end']} (overlap size={overlap_end - overlap_start})")

# Let's count by folder
by_folder = {}
for fr in frags:
    by_folder[fr["folder"]] = by_folder.get(fr["folder"], 0) + 1
print("Fragments by folder:", by_folder)
