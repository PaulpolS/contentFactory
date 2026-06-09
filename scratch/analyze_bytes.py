file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "rb") as f:
    data = f.read()

# Let's search for "addLog("
idx = data.find(b"addLog('")
while idx != -1:
    # Print the next 100 bytes
    chunk = data[idx:idx+120]
    print(f"Found at {idx}: {repr(chunk)}")
    print(f"Hex: {chunk.hex()}")
    print("-" * 50)
    idx = data.find(b"addLog('", idx + 1)
    if idx > 150000: # just first few
        break
