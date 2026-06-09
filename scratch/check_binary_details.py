path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"

with open(path, "rb") as f:
    content_bytes = f.read()

print(f"File size in bytes: {len(content_bytes)}")
print(f"Number of lines: {len(content_bytes.split(b'\n'))}")

# Check if there are null bytes
null_count = content_bytes.count(b'\x00')
print(f"Null bytes count: {null_count}")

# Print first 200 bytes and last 200 bytes
print("\nFirst 200 bytes:")
print(content_bytes[:200])

print("\nLast 200 bytes:")
print(content_bytes[-200:])
