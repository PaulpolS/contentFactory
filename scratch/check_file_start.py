file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "rb") as f:
    start_bytes = f.read(100)

print(f"First 100 bytes: {repr(start_bytes)}")
print(f"Hex: {start_bytes.hex()}")
