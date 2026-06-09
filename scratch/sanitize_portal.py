import os

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "rb") as f:
    data = f.read()

# Clean null bytes (which makes TypeScript think the file is binary)
clean_data = data.replace(b'\x00', b'')

# Convert to string safely using UTF-8
text = clean_data.decode("utf-8", errors="replace")

# Let's replace the corrupted regex at line 1631 (or similar)
old_regex = "const parts = cleanText.split(/[\\s,???+/);"
new_regex = "const parts = cleanText.split(/[\\s,，。]+/);"
if old_regex in text:
    print("Found old regex pattern, replacing...")
    text = text.replace(old_regex, new_regex)
else:
    # Try a looser replace in case whitespace varies
    text = text.replace("split(/[\\s,???+/)", "split(/[\\s,，。]+/)", 1)

# Let's fix the two corrupted addLog calls around lines 2146 and 2153
# Line 2146:
old_log_1 = 'addLog(`??? ?่พบ?ล์?สีย??พล?ระกอบ?โฟล?ดอร? "${bgmPath}" โปรดตรวจสอบว่ามี?ล? .mp3 หรือ .wav หรือ??, \'error\');'
new_log_1 = 'addLog(`⚠️ ไม่พบไฟล์เสียงเพลงประกอบในโฟลเดอร์ "${bgmPath}" โปรดตรวจสอบว่ามีไฟล์ .mp3 หรือ .wav หรือไม่`, \'error\');'

if old_log_1 in text:
    print("Found old log 1, replacing...")
    text = text.replace(old_log_1, new_log_1)
else:
    # Try substring match
    lines = text.split('\n')
    for idx, line in enumerate(lines):
        if 'ไม่พบ' in line and 'bgmPath' in line and 'error' in line and 'addLog' in line:
            print(f"Loosely matching line {idx+1} for log 1...")
            lines[idx] = '      if (foundFiles.length === 0) {\n        addLog(`⚠️ ไม่พบไฟล์เสียงเพลงประกอบในโฟลเดอร์ "${bgmPath}" โปรดตรวจสอบว่ามีไฟล์ .mp3 หรือ .wav หรือไม่`, \'error\');'
    text = '\n'.join(lines)

# Line 2153:
old_log_2 = 'addLog(`? สุ่ม?้?พล?ระกอ?: "...${chosenBgm.slice(-35)}" จากทั้?ม? ${foundFiles.length} ?พล?, \'success\');'
new_log_2 = 'addLog(`🎲 สุ่มได้เพลงประกอบ: "...${chosenBgm.slice(-35)}" จากทั้งหมด ${foundFiles.length} เพลง`, \'success\');'

if old_log_2 in text:
    print("Found old log 2, replacing...")
    text = text.replace(old_log_2, new_log_2)
else:
    lines = text.split('\n')
    for idx, line in enumerate(lines):
        if 'chosenBgm.slice' in line and 'success' in line and 'addLog' in line:
            print(f"Loosely matching line {idx+1} for log 2...")
            lines[idx] = '      addLog(`🎲 สุ่มได้เพลงประกอบ: "...${chosenBgm.slice(-35)}" จากทั้งหมด ${foundFiles.length} เพลง`, \'success\');'
    text = '\n'.join(lines)

# Write clean UTF-8 data back
with open(file_path, "w", encoding="utf-8") as f:
    f.write(text)

print("Sanitization complete.")
