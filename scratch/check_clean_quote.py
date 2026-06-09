import os

clean_dir = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean"
found = []
for root, dirs, files in os.walk(clean_dir):
    for file in files:
        if "Quote" in file:
            found.append(os.path.join(root, file))

print("Found quote files in clean repo:")
for f in found:
    print("-", f)
