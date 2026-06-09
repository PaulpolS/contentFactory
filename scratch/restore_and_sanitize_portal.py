import os
import shutil

restored_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal_restored.tsx"
scratch_backup_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scratch/VerticalVideoSuitePortal_restored.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

# 1. Read restored file as bytes and decode cleanly to UTF-8
with open(restored_path, "rb") as f:
    raw_bytes = f.read()

# Clean up null bytes and BOM if any
raw_bytes = raw_bytes.replace(b'\x00', b'')
if raw_bytes.startswith(b'\xef\xbb\xbf'):
    raw_bytes = raw_bytes[3:]

code = raw_bytes.decode("utf-8", errors="replace")

# 2. Define the pristine, fully-restored HEADLINE_PRESETS array
clean_headline_presets = """const HEADLINE_PRESETS: HeadlineStylePreset[] = [
  {
    id: 'red-box',
    name: '🔴 แถบแดงคลาสสิก (ยอดฮิต)',
    fontColor: '#ffffff',
    boxColor: '#ef4444',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 8,
    shadowBlur: 12,
    shadowColor: '#000000',
    boxOpacity: 1.0,
    boxEnabled: true,
    outlineWidth: 0,
    outlineColor: '#000000',
    lineSpacing: 10,
  },
  {
    id: 'yellow-box',
    name: '🟡 แถบเหลืองอบอุ่น',
    fontColor: '#000000',
    boxColor: '#eab308',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 12,
    shadowBlur: 12,
    shadowColor: '#000000',
    boxOpacity: 1.0,
    boxEnabled: true,
    outlineWidth: 0,
    outlineColor: '#000000',
    lineSpacing: 10,
  },
  {
    id: 'glass-modern',
    name: '🔵 กล่องโปร่งใสโมเดิร์น',
    fontColor: '#ffffff',
    boxColor: '#1e293b',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 10,
    shadowBlur: 15,
    shadowColor: '#000000',
    boxOpacity: 0.65,
    boxEnabled: true,
    outlineWidth: 1.5,
    outlineColor: '#ffffff',
    lineSpacing: 10,
  },
  {
    id: 'tiktok-outline',
    name: '⚡ อักษรขาวขอบหนา (TikTok)',
    fontColor: '#ffffff',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 0,
    shadowColor: '#000000',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 5,
    outlineColor: '#000000',
    lineSpacing: 8,
  },
  {
    id: 'reels-yellow',
    name: '🎨 อักษรเหลืองขอบดำ (Reels)',
    fontColor: '#facc15',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 0,
    shadowColor: '#000000',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 5,
    outlineColor: '#000000',
    lineSpacing: 8,
  },
  {
    id: 'capcut-red',
    name: '🎨 อักษรแดงขอบดำเข้ม (CapCut)',
    fontColor: '#ff3b30',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 15,
    shadowColor: '#000000',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 5,
    outlineColor: '#000000',
    lineSpacing: 8,
  },
  {
    id: 'neon-cyan',
    name: '🎨 นีออนฟ้าระยิบระยับ (Neon Cyan)',
    fontColor: '#ffffff',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 20,
    shadowColor: '#00f0ff',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 1.5,
    outlineColor: '#00f0ff',
    lineSpacing: 8,
  },
  {
    id: 'neon-purple',
    name: '🎨 นีออนม่วงสว่าง (Neon Purple)',
    fontColor: '#ffffff',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 20,
    shadowColor: '#a855f7',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 1.5,
    outlineColor: '#d8b4fe',
    lineSpacing: 8,
  },
  {
    id: 'luxury-gold',
    name: '🎨 อักษรทองหรูหรา (Gold Luxury)',
    fontColor: '#fef08a',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 25,
    shadowColor: '#d97706',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 1.0,
    outlineColor: '#fbbf24',
    lineSpacing: 8,
  },
  {
    id: 'neon-pink',
    name: '🎨 นีออนชมพูหวาน (Neon Pink)',
    fontColor: '#ffffff',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 20,
    shadowColor: '#db2777',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 2.0,
    outlineColor: '#f472b6',
    lineSpacing: 8,
  },
  {
    id: 'cyberpunk-lime',
    name: '⚡ ไซเบอร์พังก์กล่องเขียวมะนาว',
    fontColor: '#a3e635',
    boxColor: '#000000',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 18,
    paddingY: 10,
    borderRadius: 4,
    shadowBlur: 10,
    shadowColor: '#a3e635',
    boxOpacity: 0.85,
    boxEnabled: true,
    outlineWidth: 0,
    outlineColor: '#000000',
    lineSpacing: 10,
  },
  {
    id: 'sunset-orange',
    name: '🎨 อักษรส้มขอบดำไล่โทน (Sunset Orange)',
    fontColor: '#f97316',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 8,
    shadowColor: '#ea580c',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 4,
    outlineColor: '#000000',
    lineSpacing: 8,
  },
  {
    id: 'sweet-berry',
    name: '🎨 เบอร์รี่วิบวับ (Sweet Berry)',
    fontColor: '#f43f5e',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 15,
    shadowColor: '#fda4af',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 3,
    outlineColor: '#000000',
    lineSpacing: 8,
  },
  {
    id: 'retro-cream',
    name: '🎨 กล่องครีมเรโทร (Retro Cream)',
    fontColor: '#78350f',
    boxColor: '#fef3c7',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 18,
    paddingY: 10,
    borderRadius: 4,
    shadowBlur: 8,
    shadowColor: '#000000',
    boxOpacity: 1.0,
    boxEnabled: true,
    outlineWidth: 0,
    outlineColor: '#000000',
    lineSpacing: 10,
  },
  {
    id: 'laser-green',
    name: '🎨 นีออนเขียวเลเซอร์ (Laser Green)',
    fontColor: '#ffffff',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 22,
    shadowColor: '#22c55e',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 2.0,
    outlineColor: '#22c55e',
    lineSpacing: 8,
  },
  {
    id: '3d-red',
    name: '🎨 สามมิติแดงขอบดำ (3D Red Shadow)',
    fontColor: '#ef4444',
    boxColor: '#000000',
    fontSize: 45,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 0,
    shadowBlur: 12,
    shadowColor: '#000000',
    boxOpacity: 0.0,
    boxEnabled: false,
    outlineWidth: 1.5,
    outlineColor: '#7f1d1d',
    lineSpacing: 6,
  },
  {
    id: 'teal-outline-box',
    name: '🎨 กล่องขาวขอบฟ้าพาสเทล (Teal Box)',
    fontColor: '#ffffff',
    boxColor: '#111827',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 16,
    paddingY: 8,
    borderRadius: 8,
    shadowBlur: 8,
    shadowColor: '#06b6d4',
    boxOpacity: 0.9,
    boxEnabled: true,
    outlineWidth: 2.5,
    outlineColor: '#06b6d4',
    lineSpacing: 10,
  },
  {
    id: 'cyber-yellow',
    name: '🎨 อักษรดำกล่องเหลือง (Cyber Yellow)',
    fontColor: '#000000',
    boxColor: '#facc15',
    fontSize: 40,
    fontName: 'Arial',
    paddingX: 18,
    paddingY: 10,
    borderRadius: 2,
    shadowBlur: 10,
    shadowColor: '#000000',
    boxOpacity: 1.0,
    boxEnabled: true,
    outlineWidth: 0,
    outlineColor: '#000000',
    lineSpacing: 10,
  },
];"""

# Replace HEADLINE_PRESETS
start_idx = code.find("const HEADLINE_PRESETS: HeadlineStylePreset[] = [")
end_idx = code.find("];", start_idx)
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + clean_headline_presets + code[end_idx + 2:]
    print("Replaced HEADLINE_PRESETS successfully.")
else:
    print("WARNING: HEADLINE_PRESETS not found!")

# 3. Define the pristine DEFAULT_STYLES array
clean_default_styles = """const DEFAULT_STYLES: CopyStyle[] = [
  {
    id: 'deep-philosophy',
    name: 'ปรัชญาโบราณลึกซึ้ง',
    description: 'เล่าด้วยน้ำเสียงสุขุม มีการเว้นจังหวะคิด เปรียบเปรยกับธรรมชาติ มีพลังดึงดูดสติ',
    example: 'ก้อนหินที่อยู่ใต้ซ่อนน้ำ... ไม่หวั่นเกรงพายุฝน เช่นเดียวกับผู้ที่มีปัญญาที่ผ่านโลกมามาก...',
  },
  {
    id: 'sci-history',
    name: 'สารคดีประวัติศาสตร์ตื่นเต้น',
    description: 'ตื่นตาตื่นใจ ใช้คำวิเศษณ์กระตุ้นความอยากรู้ ค้นพบความลับที่ประวัติศาสตร์ซ่อนอยู่',
    example: 'ปี ค.ศ. 1922 ในหลุมฝังศพอันสุสานอันมืดมิด... นักโบราณคดีได้ค้นพบบางสิ่งที่ยิ่งใหญ่ ที่ไม่เคยถูกเปิดเผย!',
  },
  {
    id: 'tech-trend',
    name: 'ข่าวสารไอทีสุดล้ำอินเทรนด์',
    description: 'อินเทรนด์ กระชับ สนุกสนาน ไม่ต้องยืดเยื้อ ทันโลก เหมาะสำหรับวัยรุ่นยุคใหม่วัยทำงาน',
    example: 'นี่คือสิ่งที่จะเปลี่ยนโลกใบนี้ของคุณตลอดกาล! วันนี้เรามาดู 3 เทคโนโลยีที่โคตรโหดกันครับบอส...',
  },
];"""

start_idx = code.find("const DEFAULT_STYLES: CopyStyle[] = [")
end_idx = code.find("];", start_idx)
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + clean_default_styles + code[end_idx + 2:]
    print("Replaced DEFAULT_STYLES successfully.")
else:
    print("WARNING: DEFAULT_STYLES not found!")

# 4. Define the pristine KIEAI_VOICES array
clean_kieai_voices = """const KIEAI_VOICES = [
  { id: 'Rachel', name: 'Rachel (หญิง - เสียงหวาน อบอุ่น ละมุนเป็นธรรมชาติมากที่สุด)', lang: 'th-TH' },
  { id: 'Adam', name: 'Adam (ชาย - เสียงหล่อ เข้ม น่าเชื่อถือ เป็นสากล เล่าเรื่อง/ข่าวดีเลิศ)', lang: 'th-TH' },
  { id: 'Gigi', name: 'Gigi (หญิง - เสียงเล่าเก่ง สดใส มีพลัง รีวิว/คลิปสั้น TikTok)', lang: 'th-TH' },
  { id: 'Antoni', name: 'Antoni (ชาย - เสียงสุภาพ อบอุ่น นุ่มลึก เหมาะกับคลิปพัฒนาตนเอง)', lang: 'th-TH' },
  { id: 'Serena', name: 'Serena (หญิง - เสียงนิ่ง สุภาพ มั่นใจ เหมาะกับการบรรยาย/การสอน)', lang: 'th-TH' },
  { id: 'Nicole', name: 'Nicole (หญิง - เสียงนุ่มนวล เรียบร้อย โทนกระซิบผ่อนคลายสบายหู)', lang: 'th-TH' },
  { id: 'Drew', name: 'Drew (ชาย - เสียงเข้ม แข็งแรง วัยรุ่น ทันสมัย)', lang: 'th-TH' },
  { id: 'Glinda', name: 'Glinda (หญิง - เสียงใส กระจ่าง กระฉับกระเฉง)', lang: 'th-TH' },
];"""

start_idx = code.find("const KIEAI_VOICES = [")
end_idx = code.find("];", start_idx)
if start_idx != -1 and end_idx != -1:
    code = code[:start_idx] + clean_kieai_voices + code[end_idx + 2:]
    print("Replaced KIEAI_VOICES successfully.")
else:
    print("WARNING: KIEAI_VOICES not found!")

# 5. Find and replace the broken split regex line
regex_idx = code.find("const parts = cleanText.split(")
if regex_idx != -1:
    end_regex_idx = code.find(");", regex_idx)
    code = code[:regex_idx] + "const parts = cleanText.split(/[\\s,，、。！？!?\\n]+/);" + code[end_regex_idx + 2:]
    print("Fixed split regex literal successfully.")
else:
    print("WARNING: cleanText.split regex not found!")

# 6. EXTREMELY ROBUST BGM LINE REPLACEMENT
lines = code.split('\n')
bgm_error_fixed = False
bgm_success_fixed = False

for idx, line in enumerate(lines):
    if 'foundFiles.length === 0' in line:
        for offset in range(1, 4):
            if 'addLog(' in lines[idx + offset]:
                lines[idx + offset] = '        addLog(`ไม่พบไฟล์ BGM ในโฟลเดอร์ "${bgmPath}" โปรดตรวจสอบว่ามีไฟล์ .mp3 หรือ .wav`, \'error\');'
                print(f"Fixed BGM error log on line {idx + offset + 1}")
                bgm_error_fixed = True
                break
    if 'chosenBgm = foundFiles[randomIndex];' in line:
        for offset in range(1, 4):
            if 'addLog(' in lines[idx + offset]:
                lines[idx + offset] = '      addLog(`สุ่มได้เพลง BGM ประกอบ: "...${chosenBgm.slice(-35)}" จากทั้งหมด ${foundFiles.length} เพลง`, \'success\');'
                print(f"Fixed BGM success log on line {idx + offset + 1}")
                bgm_success_fixed = True
                break

code = '\n'.join(lines)

if not bgm_error_fixed:
    print("WARNING: Failed to fix BGM error log line!")
if not bgm_success_fixed:
    print("WARNING: Failed to fix BGM success log line!")

# 7. Add fetchOpenRouter helper code
fetch_helper_code = """const fetchOpenRouter = async (url: string, options: any) => {
  const headers = options.headers || {};
  let apiKey = '';
  const authHeader = headers['Authorization'] || headers['authorization'] || '';
  if (authHeader.startsWith('Bearer ')) {
    apiKey = authHeader.substring(7).trim();
  }

  if (apiKey.startsWith('AIzaSy')) {
    // Direct Google Gemini API call instead of OpenRouter
    try {
      const payload = JSON.parse(options.body || '{}');
      const messages = payload.messages || [];
      const systemMessage = messages.find((m: any) => m.role === 'system');
      const userMessages = messages.filter((m: any) => m.role === 'user');
      const userContent = userMessages.map((m: any) => m.content).join('\\n\\n');
      const systemPrompt = systemMessage ? systemMessage.content : '';

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const googlePayload: any = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: systemPrompt ? `${systemPrompt}\\n\\nคำสั่งเพิ่มเติม:\\n${userContent}` : userContent
              }
            ]
          }
        ]
      };
      
      const forceJson = payload.response_format?.type === 'json_object' || 
                        messages.some((m: any) => m.content && m.content.toLowerCase().includes('json'));
      if (forceJson) {
        googlePayload.generationConfig = {
          responseMimeType: 'application/json'
        };
      }

      const response = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(googlePayload)
      });

      const data = await response.json();
      if (data?.error) {
        throw new Error(`Google Gemini Error: ${data.error.message || JSON.stringify(data.error)}`);
      }

      const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!txt) {
        throw new Error(`Google Gemini returned empty candidate content.`);
      }

      return {
        ok: true,
        status: 200,
        json: async () => ({
          choices: [
            {
              message: {
                content: txt
              }
            }
          ]
        })
      };
    } catch (err: any) {
      console.error("fetchOpenRouter fallback to Gemini failed:", err);
      return {
        ok: false,
        status: 500,
        json: async () => ({
          error: {
            message: err.message || "Failed to process direct Gemini request in fetchOpenRouter"
          }
        })
      };
    }
  } else {
    // Normal fetch call to OpenRouter
    return fetch(url, options);
  }
};

"""

# Insert fetchOpenRouter above getActiveOpenRouterKey
target_key = "const getActiveOpenRouterKey = () => localStorage.getItem('openrouter_key')?.trim() || '';"
idx_key = code.find(target_key)
if idx_key != -1:
    code = code[:idx_key] + fetch_helper_code + code[idx_key:]
    print("Injected fetchOpenRouter helper function.")
else:
    print("WARNING: getActiveOpenRouterKey not found for fetchOpenRouter injection!")

# 8. Replace all direct fetch('https://openrouter.ai/api/v1/chat/completions') with fetchOpenRouter
code = code.replace(
    "fetch('https://openrouter.ai/api/v1/chat/completions',",
    "fetchOpenRouter('https://openrouter.ai/api/v1/chat/completions',"
)
print("Replaced all OpenRouter fetch calls with fetchOpenRouter.")

# 9. Write the final sanitized code back to the target file
with open(target_path, "w", encoding="utf-8") as f:
    f.write(code)

print("Successfully restored, sanitized, and updated VerticalVideoSuitePortal.tsx!")

# 10. Clean up VerticalVideoSuitePortal_restored.tsx by moving it to the scratch folder
if os.path.exists(restored_path):
    shutil.move(restored_path, scratch_backup_path)
    print("Moved VerticalVideoSuitePortal_restored.tsx to scratch directory to avoid compilation noise.")
