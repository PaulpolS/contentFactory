import os
import re

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

# 1. Read files
with open(orig_path, "r", encoding="utf-8") as f:
    orig_lines = f.readlines()

with open(target_path, "r", encoding="utf-8") as f:
    curr_lines = f.readlines()

def get_structure_key(line):
    # Strip all Thai, replacement chars, and question marks
    line = re.sub(r'[\u0e00-\u0e7f\ufffd?]+', '', line)
    line = re.sub(r'\s+', '', line)
    return line

# 2. Build mapping of structure keys
orig_map = {}
for line in orig_lines:
    key = get_structure_key(line)
    if len(key) > 5:
        orig_map[key] = line

# 3. Direct replacement translations using substring patterns
print("Starting smart substring replacements...")
for idx, line in enumerate(curr_lines):
    # Direct structural replacements from original first
    key = get_structure_key(line)
    if '\ufffd' in line or '?' in line:
        has_thai_or_ufffd = any(c in line for c in '\ufffd') or any('\u0e00' <= c <= '\u0e7f' for c in line)
        if has_thai_or_ufffd:
            if key in orig_map:
                curr_lines[idx] = orig_map[key]
                continue
                
    # Substring rule replacements for custom edits in ContentFactory
    if 'systemPrompt ?' in line and 'userPrompt' in line:
        curr_lines[idx] = '              text: systemPrompt ? `${systemPrompt}\\n\\nคำสั่งเพิ่มเติม:\\n${userPrompt}` : userPrompt\n'
    elif 'Google Gemini' in line and 'Response data' in line and 'throw' in line:
        curr_lines[idx] = '      throw new Error(`Google Gemini ส่งผลลัพธ์ว่างกลับมา (Response data: ${JSON.stringify(data)})`);\n'
    elif 'OpenRouter' in line and 'Response data' in line and 'throw' in line:
        curr_lines[idx] = '    throw new Error(`OpenRouter ส่งผลลัพธ์ว่างกลับมา (Response data: ${JSON.stringify(data)})`);\n'
    elif 'Kie.ai API Key' in line and 'throw' in line:
        curr_lines[idx] = "        throw new Error('กรุณาระบุ Kie.ai API Key ในส่วนตั้งค่าก่อน');\n"
    elif 'AI พากย์เสียง' in line and 'voiceId' in line:
        curr_lines[idx] = "      onLog?.(`กำลังร้องขอต่อ AI พากย์เสียง (Model: ${voiceId})...`, 'info');\n"
    elif 'Task ID' in line and 'createData' in line and 'throw' in line:
        curr_lines[idx] = "          throw new Error(`ไม่ได้รับ Task ID แจ้งกลับจาก API: ${JSON.stringify(createData)}`);\n"
    elif 'รอคิวประมวลผล' in line or ('Task ID' in line and 'taskId.substring' in line):
        curr_lines[idx] = "        onLog?.(`รอคิวประมวลผล (Task ID: ${taskId.substring(0,6)}...)`, 'info');\n"
    elif 'ประมวลผลเสียง' in line and 'attempt' in line:
        curr_lines[idx] = "        onLog?.(`กำลังประมวลผลเสียง... (รอ ${attempt * 2.5} วินาที)`, 'info');\n"
    elif 'ระบบแจ้งสถานะสำเร็จแล้ว' in line or 'ลิงก์ไฟล์เสียง' in line:
        curr_lines[idx] = "             throw new Error('ระบบแจ้งสถานะสำเร็จแล้ว แต่แยกหาลิงก์ไฟล์เสียงจากข้อมูลไม่เจอ');\n"
    elif 'สังเคราะห์เสียงพากย์สร้างสมบูรณ์' in line:
        curr_lines[idx] = "           onLog?.(`✅ สังเคราะห์เสียงพากย์สร้างสมบูรณ์!`, 'success');\n"
    elif 'การสร้างเสียงพากย์ล้มเหลว' in line or 'reason' in line and 'throw' in line and 'Kie.ai' in line:
        curr_lines[idx] = "          throw new Error(`การสร้างเสียงพากย์ล้มเหลว: ${reason}`);\n"
    elif 'Timeout 250s' in line:
        curr_lines[idx] = "      throw new Error('หมดเวลารอ (Timeout 250s) การสร้างเสียงพากย์ตอบสนองช้าเกินไป');\n"
    elif 'เกิดข้อผิดพลาด' in line and 'err.message' in line and 'error' in line:
        curr_lines[idx] = "      onLog?.(`❌ เกิดข้อผิดพลาด: ${err.message}`, 'error');\n"
    elif 'เกิดข้อผิดพลาดในการสร้างเสียง' in line or ('setError' in line and 'err.message' in line):
        curr_lines[idx] = "      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างเสียง');\n"
    elif 'เขียนบทความสำเร็จ' in line or ('addLog' in line and 'item.topic' in line and 'success' in line):
        curr_lines[idx] = "          addLog(`✅ เขียนบทความสำเร็จสำหรับ: ${item.topic}`, 'success');\n"
    elif 'เขียนบทความและพาดหัวเสร็จสิ้น' in line or 'บอสสามารถเลือกดูพรีวิว' in line:
        curr_lines[idx] = "    addLog('🎉 เขียนบทความและพาดหัวเสร็จสิ้นทุกรายการแล้ว! บอสสามารถเลือกดูพรีวิวและปรับตำแหน่งแต่ละตอนได้จากกล่องเลือกด้านบนขวาได้เลยครับ', 'success');\n"
    elif 'success' in line and 'prefix' in line and '=' in line:
        curr_lines[idx] = "    if (type === 'success') prefix = '✅ [SUCCESS]';\n"
    elif 'error' in line and 'prefix' in line and '=' in line:
        curr_lines[idx] = "    if (type === 'error') prefix = '❌ [ERROR]';\n"
    elif 'batch' in line and 'prefix' in line and '=' in line:
        curr_lines[idx] = "    if (type === 'batch') prefix = '🚀 [BATCH]';\n"
    elif 'systemPrompt = ' in line and 'Shorts, TikTok, Reels' in line:
        curr_lines[idx] = "      const systemPrompt = 'คุณคือผู้เชี่ยวชาญการสร้างสคริปต์วิดีโอสั้นแนวตั้ง (Shorts, TikTok, Reels) หน้าที่ของคุณคือสร้างสคริปต์การเล่าเรื่องเชิงการตลาดที่มีเอกลักษณ์เฉพาะตัว 5 แบบ ภาษาไทย ส่งกลับมาในรูปแบบ JSON Array เท่านั้น ไม่มีข้อความอื่นนอกจาก JSON โดยแต่ละสไตล์ใน Array ต้องมีฟิลด์: name (ชื่อสไตล์โดนๆ), description (อธิบายการใช้น้ำเสียงและการเว้นจังหวะ), และ example (ตัวอย่างสคริปต์สั้นๆ 1 ประโยค)';\n"
    elif 'userPrompt = ' in line and 'channelConcept' in line:
        curr_lines[idx] = '      const userPrompt = `นี่คือคอนเซปต์ของช่องครับ: "${channelConcept}" ช่วยออกแบบสไตล์การเขียนบทที่เหมาะสมที่สุด 5 รูปแบบให้อ่านแล้วสะกดสายตาที`;\n'
    elif 'โหลดบทความ, เสียงพากย์' in line or 'ไม่ต้องคำนวณซับ' in line:
        curr_lines[idx] = '        addLog(`🎉 โหลดบทความ, เสียงพากย์ และซับไตเติ้ล ของหัวข้อ "${item.topic}" สำเร็จ! (ไม่ต้องคำนวณซับใหม่)`, \'success\');\n'
    elif 'โหลดบทความและไฟล์เสียง' in line or 'กำลังคำนวณซับ' in line:
        curr_lines[idx] = '        addLog(`🎉 โหลดบทความและไฟล์เสียงของหัวข้อ "${item.topic}" จากคลังประวัติสำเร็จ! (กำลังคำนวณซับใหม่)`, \'success\');\n'
    elif 'โหลดเฉพาะบทความ' in line or 'กรุณาสังเคราะห์เสียง' in line:
        curr_lines[idx] = '      addLog(`🎉 โหลดเฉพาะบทความหัวข้อ "${item.topic}" สำเร็จ! (กรุณาสังเคราะห์เสียงเพิ่มเติม)`, \'info\');\n'
    elif 'ลบประวัติการเขียนบท' in line or 'ไม่สามารถกู้คืน' in line:
        curr_lines[idx] = "    if (!confirm('⚠️ คำเตือน: คุณต้องการลบประวัติการเขียนบทและเสียงพากย์ทั้งหมดหรือไม่? (ไม่สามารถกู้คืนได้)')) return;\n"
    elif 'ตัวอย่างการแบ่งบรรทัดพาดหัวที่สวยงาม' in line:
        curr_lines[idx] = '  "ตัวอย่างการแบ่งบรรทัดพาดหัวที่สวยงาม:\\n"\n'
    elif 'AI ส่งผลลัพธ์พาดหัวว่าง' in line:
        curr_lines[idx] = '        throw new Error(`AI ส่งผลลัพธ์พาดหัวว่างกลับมา (Response data: ${JSON.stringify(data)})`);\n'
    elif 'Kie.ai API Key' in line and 'alert' in line:
        curr_lines[idx] = '      alert("⚠️ กรุณาระบุ Kie.ai API Key ในส่วนตั้งค่าก่อนใช้เสียงพรีเมียม");\n'
    elif 'สังเคราะห์เสียงพากย์พรีเมียม' in line and 'selectedVoice' in line:
        curr_lines[idx] = '    addLog(`🎙️ กำลังเรียก Kie.ai (ElevenLabs) สังเคราะห์เสียงพากย์พรีเมียม (Model: ${selectedVoice})...`, \'info\');\n'
    elif 'Voice_stock สำเร็จ' in line:
        curr_lines[idx] = '                  addLog(`✅ บันทึกเสียงพากย์ลง Voice_stock สำเร็จ!`, \'success\');\n'
    elif 'channelConcept, setChannelConcept' in line:
        curr_lines[idx] = "  const [channelConcept, setChannelConcept] = useState('ให้ความรู้จิตวิทยา พัฒนาตนเอง ข้อคิดการดำเนินชีวิต');\n"
    elif 'topic, setTopic' in line:
        curr_lines[idx] = "  const [topic, setTopic] = useState('วิธีเอาชนะความขี้เกียจด้วยกฎ 2 นาที');\n"
    elif 'headline, setHeadline' in line:
        curr_lines[idx] = "  const [headline, setHeadline] = useState('กฎ 2 นาที ชนะความขี้เกียจสะสม');\n"

# 5. Fix remaining inline patterns in a loop (using regex search/replace)
code = "".join(curr_lines)

# Fix remaining known small garbled tokens in UI labels or logs
def clean_tokens(text):
    text = text.replace("?ิป", "คลิป")
    text = text.replace("?ขีย", "เขียน")
    text = text.replace("?ลีย", "เปลี่ยน")
    text = text.replace("?ลือ", "เลือก")
    text = text.replace("?ล่า", "เล่า")
    text = text.replace("?สน", "เสนอ")
    text = text.replace("?สีย", "เสียง")
    text = text.replace("?พจ", "เพจ")
    text = text.replace("?ซฟ", "เซฟ")
    text = text.replace("?ก?", "เก็บ")
    text = text.replace("?ปิด", "เปิด")
    text = text.replace("?ล์", "ไฟล์")
    text = text.replace("?ต?", "ตรง")
    text = text.replace("?ช่", "เช่น")
    text = text.replace("?จน", "เจน")
    text = text.replace("?บราว์", "เบราว์")
    text = text.replace("?ล่", "เล่น")
    text = text.replace("?ก้", "แก้")
    text = text.replace("?ส้", "เส้น")
    text = text.replace("?รน", "เรน")
    text = text.replace("?รา", "ตาราง")
    text = text.replace("?ชื่อ", "เชื่อม")
    text = text.replace("?ทีย", "เทียบ")
    text = text.replace("?กิ", "เกิน")
    text = text.replace("?หมา", "เหมาะ")
    text = text.replace("?กลา", "เกลา")
    text = text.replace("?วลา", "เวลา")
    text = text.replace("?ริ่ม", "เริ่ม")
    text = text.replace("?ตือ", "เตือน")
    text = text.replace("?ลพ", "ลัพธ์")
    text = text.replace("?ห่", "แห่ง")
    text = text.replace("?พล", "ไฟล์")
    text = text.replace("?ดีย", "เดียว")
    text = text.replace("?นื่อ", "เนื่อง")
    text = text.replace("?บื้อ", "เบื้อง")
    text = text.replace("?หลี่", "เหลี่ยม")
    text = text.replace("?ตีย", "เตี้ย")
    text = text.replace("?อกล", "เอกล")
    
    # Common words
    text = text.replace("กำลั?", "กำลัง")
    text = text.replace("สร้า?", "สร้าง")
    text = text.replace("ตั้?", "ตั้ง")
    text = text.replace("ทั้?", "ทั้ง")
    text = text.replace("สำ?ร?", "สำเร็จ")
    text = text.replace("ล้ม?หลว", "ล้มเหลว")
    text = text.replace("ข้อ?", "ของ")
    text = text.replace("อย่า?", "อย่าง")
    text = text.replace("อย่า?าร", "อย่างการ")
    text = text.replace("อย่า?ี่", "อย่างที่")
    text = text.replace("อย่า?ม่", "อย่างไม่")
    text = text.replace("อย่า?ล", "อย่างผล")
    text = text.replace("ถัดมาจา?", "ถัดมาจาก")
    text = text.replace("อย่า?ล", "อย่างผล")
    text = text.replace("?บิ", "เบิ")
    text = text.replace("?รียบ", "เรียบ")
    text = text.replace("?กิด", "เกิด")
    text = text.replace("?พล?ระ", "เพลงประกอบ")
    
    text = text.replace("?ลข", "เลข")
    text = text.replace("?ป้า", "เป้า")
    text = text.replace("?ชีย", "เชี่ยว")
    text = text.replace("?พล?", "เพลง")
    text = text.replace("?พล?ระ", "เพลงประกอบ")
    
    # Specific UI phrases
    text = text.replace("? บันทึก", "✅ บันทึก")
    text = text.replace("? ล?", "🗑️ ลบ")
    text = text.replace("?", "💡")
    text = text.replace("?", "📝")
    text = text.replace("✍?", "✍️")
    text = text.replace("⏳", "⏳")
    text = text.replace("?", "⚠️")
    text = text.replace("?", "⚠️")
    text = text.replace("⚙?", "⚙️")
    text = text.replace("🎨", "🎨")
    text = text.replace("⚡", "⚡")
    
    text = text.replace("?ิปดิก", "คลิปดิบ")
    text = text.replace("?ิปดิบ", "คลิปดิบ")
    text = text.replace("?นหา", "ค้นหา")
    text = text.replace("?ั?ระวัติ", "คลังประวัติ")
    text = text.replace("?ามยาว", "ความยาว")
    text = text.replace("?ามลับ", "ความลับ")
    text = text.replace("?ามขี้", "ความขี้")
    text = text.replace("?ามสูง", "ความสูง")
    text = text.replace("?ามกว้าง", "ความกว้าง")
    text = text.replace("?ามโค้ง", "ความโค้ง")
    text = text.replace("?ามฟุ้ง", "ความฟุ้ง")
    text = text.replace("?ามหนา", "ความหนา")
    text = text.replace("?ามห่าง", "ความห่าง")
    text = text.replace("?นวณ", "คำนวณ")
    text = text.replace("?บถ้ว", "ครบถ้วน")
    
    text = text.replace("?ยพรี", "ไทยพรี")
    text = text.replace("?ยเ", "ไทยเ")
    text = text.replace("?ห้อ", "ให้ห้อง")
    text = text.replace("?าษ", "ภาษา")
    text = text.replace("?ำส", "คำส")
    
    # Remove any stray replacement characters or garbage artifacts
    text = text.replace("", "")
    
    return text

code = clean_tokens(code)

# 6. Save back to the file
with open(target_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Saved restored file successfully!")
print("Remaining \\ufffd count:", code.count('\ufffd'))
