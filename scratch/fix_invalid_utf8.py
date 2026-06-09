import os

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "rb") as f:
    content = f.read()

# Let's search for the block using a byte query
target_start = b"if (foundFiles.length === 0) {"
idx = content.find(target_start)
if idx != -1:
    print(f"Found target block at byte index {idx}")
    # Let's find the closing brace after the return bgmPath
    target_end = b"return bgmPath;\n      }"
    end_idx = content.find(target_end, idx)
    if end_idx != -1:
        end_idx += len(target_end)
        print(f"Found end block at byte index {end_idx}")
        # Reconstruct the replacement block in clean UTF-8 bytes
        replacement = b"""if (foundFiles.length === 0) {
        addLog(`\xe2\x9a\xa0\xef\xb8\x8f \xe0\xb9\x84\xe0\xb8\xb1\xe0\xb9\x88\xe0\xb8\x9e\xe0\xb8\x9a\xe0\xb9\x84\xe0\xb8\x9d\xe0\xb8\xa5\xe0\xb9\x8c\xe0\xb9\x80\xe0\xb8\xaa\xe0\xb8\xb5\xe0\xb8\xa2\xe0\xb8\x8d\xe0\xb9\x80\xe0\xb8\x9e\xe0\xb8\xa5\xe0\xb8\x8d\xe0\xb8\x9b\xe0\xb8\xa3\xe0\xb8\xb0\xe0\xb8\x8a\xe0\xb8\xad\xe0\xb8\x9a\xe0\xb9\x83\xe0\xb8\x99\xe0\xb9\x82\xe0\xb8\x9d\xe0\xb8\xa5\xe0\xb9\x8c\xe0\xb9\x80\xe0\xb8\x84\xe0\xb8\xa5\xe0\xb8\xad\xe0\xb8\xa3\xe0\xb9\x8c "${bgmPath}" \xe0\xb9\x82\xe0\xb8\x9b\xe0\xb8\xa3\xe0\xb8\x84\xe0\xb8\xb5\xe0\xb8\xa3\xe0\xb8\xa7\xe0\xb8\x8a\xe0\xb8\xaa\xe0\xb8\xad\xe0\xb8\x9a\xe0\xb8\xa7\xe0\xb9\x8c\xe0\xb8\xb2\xe0\xb8\xa1\xe0\xb8\xb5\xe0\xb9\x84\xe0\xb8\x9d\xe0\xb8\xa5\xe0\xb9\x8c .mp3 \xe0\xb8\xab\xe0\xb8\xa3\xe0\xb8\xb7\xe0\xb8\xad .wav \xe0\xb8\xab\xe0\xb8\xa3\xe0\xb8\xb7\xe0\xb8\xad\xe0\xb9\x84\xe0\xb8\xb1\xe0\xb9\x88`, 'error');
        return bgmPath;
      }"""
        
        # Better: let's just write the clean string in python and encode it as utf-8
        clean_text_block = """if (foundFiles.length === 0) {
        addLog(`⚠️ ไม่พบไฟล์เสียงเพลงประกอบในโฟลเดอร์ "${bgmPath}" โปรดตรวจสอบว่ามีไฟล์ .mp3 หรือ .wav หรือไม่`, 'error');
        return bgmPath;
      }"""
        
        replacement = clean_text_block.encode("utf-8")
        
        # Replace
        new_content = content[:idx] + replacement + content[end_idx:]
        
        # Also clean any other invalid UTF-8 bytes in the entire file by decoding with 'ignore' or 'replace' and encoding back to clean UTF-8
        decoded = new_content.decode("utf-8", errors="ignore")
        
        # Let's verify line 1631 regex is completely clean
        decoded = decoded.replace("split(/[\\s,???+/)", "split(/[\\s,，。]+/)", 1)
        
        with open(file_path, "wb") as out_f:
            out_f.write(decoded.encode("utf-8"))
            
        print("Success! Overwrote and cleaned file.")
    else:
        print("Could not find end block")
else:
    print("Could not find start block")
