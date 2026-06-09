file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"
output_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal_restored.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

try:
    # Attempt to restore by encoding to Shift-JIS and decoding as UTF-8
    restored_bytes = text.encode("shift-jis", errors="replace")
    restored_text = restored_bytes.decode("utf-8", errors="replace")
    
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(restored_text)
    
    print("Restored file successfully saved to VerticalVideoSuitePortal_restored.tsx!")
    
except Exception as e:
    print(f"Error during restore: {e}")
