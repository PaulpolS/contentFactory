file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "rb") as f:
    binary_data = f.read()

# Check for null bytes
null_count = binary_data.count(b'\x00')
print(f"File size: {len(binary_data)} bytes")
print(f"Null bytes count: {null_count}")

# Check if the file starts with UTF-16 BOM or other BOM
if binary_data.startswith(b'\xff\xfe') or binary_data.startswith(b'\xfe\xff'):
    print("File is encoded in UTF-16!")
elif binary_data.startswith(b'\xef\xbb\xbf'):
    print("File starts with UTF-8 BOM")

# Let's clean up any null bytes
if null_count > 0:
    cleaned_data = binary_data.replace(b'\x00', b'')
    with open(file_path, "wb") as f:
        f.write(cleaned_data)
    print("Cleaned up null bytes!")
else:
    print("No null bytes found.")
