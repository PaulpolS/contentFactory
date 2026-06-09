import re

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "rb") as f:
    binary_data = f.read()

# Let's decode with errors="replace" so we can analyze
text = binary_data.decode("utf-8", errors="replace")

# Let's find all lines containing garbled characters or "\ufffd" (replacement character)
lines = text.splitlines()
garbled_count = 0

print("Garbled or invalid UTF-8 lines found:")
for idx, line in enumerate(lines):
    # Check if line contains replacement char or multiple "犧" or "ｸ"
    if "\ufffd" in line or line.count("犧") > 2 or line.count("ｸ") > 5 or "猶" in line:
        garbled_count += 1
        if garbled_count <= 50:
            print(f"Line {idx+1}: {repr(line)}")

print(f"Total garbled lines: {garbled_count}")
