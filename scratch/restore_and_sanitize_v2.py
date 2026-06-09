import os
import re

orig_path = "/Users/paulpolsulintaboon/Documents/GitHub/BulkVideoCreatorApp-Clean/src/components/video/AutomatedVideoGeneratorTab.tsx"
target_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(orig_path, "r", encoding="utf-8") as f:
    orig_text = f.read()

with open(target_path, "r", encoding="utf-8") as f:
    target_text = f.read()

# 1. Clean KIEAI_VOICES, DEFAULT_STYLES, HEADLINE_PRESETS, and inline hooks in target
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
    name: '🟡 แถบเหลืองขอบมน',
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
    name: '🫧 กล่องโปร่งใสโมเดิร์น',
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
    name: '🔥 อักษรแดงขอบดำเข้ม (CapCut)',
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
    name: '🩵 นีออนฟ้าระยิบระยับ (Neon Cyan)',
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
    name: '💜 นีออนม่วงสว่าง (Neon Purple)',
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
    name: '💛 อักษรทองหรูหรา (Gold Luxury)',
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
    name: '💖 นีออนชมพูหวาน (Neon Pink)',
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
    name: '🦖 ไซเบอร์พังก์กล่องเขียวมะนาว',
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
    name: '🍊 อักษรส้มขอบดำไล่โทน (Sunset Orange)',
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
    name: '🍓 เบอร์รี่วิบวับ (Sweet Berry)',
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
    name: '🍦 กล่องครีมเรโทร (Retro Cream)',
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
    name: '🟢 นีออนเขียวเลเซอร์ (Laser Green)',
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
    name: '🔴 สามมิติแดงขอบดำ (3D Red Shadow)',
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
    name: '🩵 กล่องขาวขอบฟ้าพาสเทล (Teal Box)',
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
    name: '🐝 อักษรดำกล่องเหลือง (Cyber Yellow)',
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

clean_inline_functions = """
const getActiveOpenRouterKey = () => localStorage.getItem('openrouter_key')?.trim() || '';
const getActiveKieKey = () => localStorage.getItem('kie_api_key')?.trim() || '';

const callAICompletions = async (apiKey: string, systemPrompt: string, userPrompt: string, forceJson: boolean = false): Promise<string> => {
  if (apiKey.startsWith('AIzaSy')) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload: any = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: systemPrompt ? `${systemPrompt}\\n\\nคำสั่งเพิ่มเติม:\\n${userPrompt}` : userPrompt
            }
          ]
        }
      ]
    };
    if (forceJson) {
      payload.generationConfig = {
        responseMimeType: 'application/json'
      };
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (data?.error) {
      throw new Error(`Google Gemini Error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!txt) {
      throw new Error(`Google Gemini ส่งผลลัพธ์ว่างกลับมา (Response data: ${JSON.stringify(data)})`);
    }
    return txt;
  } else {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages
      })
    });
    const data = await response.json();
    if (data?.error) {
      throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    const txt = data?.choices?.[0]?.message?.content;
    if (!txt) {
      throw new Error(`OpenRouter ส่งผลลัพธ์ว่างกลับมา (Response data: ${JSON.stringify(data)})`);
    }
    return txt;
  }
};

export function useKieTTS() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAudio = async ({ text, voiceId = 'Bob', stability = 0.5, apiKey, onLog }: any) => {
    setIsGenerating(true);
    setError(null);

    try {
      if (!apiKey) {
        throw new Error('กรุณาระบุ Kie.ai API Key ในส่วนตั้งค่าก่อน');
      }

      onLog?.(`กำลังร้องขอต่อ AI พากย์เสียง (Model: ${voiceId})...`, 'info');
      const createRes = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'elevenlabs/text-to-dialogue-v3',
          input: {
            dialogue: [
              {
                text: text,
                voice: voiceId
              }
            ],
            stability: stability
          }
        })
      });

      if (!createRes.ok) throw new Error(`HTTP error! status: ${createRes.status}`);

      const createData = await createRes.json();
      const taskId = createData?.data?.taskId || createData?.taskId;
      
      if (!taskId) {
        throw new Error(`ไม่ได้รับ Task ID แจ้งกลับจาก API: ${JSON.stringify(createData)}`);
      }

      onLog?.(`รอคิวประมวลผล (Task ID: ${taskId.substring(0,6)}...)`, 'info');

      let attempt = 0;
      while (attempt < 100) {
        await new Promise(res => setTimeout(res, 2500));
        
        onLog?.(`กำลังประมวลผลเสียง... (รอ ${attempt * 2.5} วินาที)`, 'info');

        const pollRes = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${taskId}`, {
          method: 'GET',
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        
        const pollData = await pollRes.json();
        const state = pollData?.data?.state?.toLowerCase() || pollData?.state?.toLowerCase();
        
        if (state === 'success' || state === 'completed') {
          const resultJsonStr = pollData?.data?.resultJson || pollData?.resultJson;
          let audioUrl = null;
          
          if (resultJsonStr) {
            try {
              const parsedResult = JSON.parse(resultJsonStr);
              audioUrl = parsedResult.audio_url || parsedResult.url || parsedResult.resultUrls?.[0] || parsedResult.audioUrl;
            } catch(e) {
              console.error("Failed to parse resultJson", e);
            }
          }
          
          if (!audioUrl || typeof audioUrl !== 'string') {
             throw new Error('ระบบแจ้งสถานะสำเร็จแล้ว แต่แยกหาลิงก์ไฟล์เสียงจากข้อมูลไม่เจอ');
          }
          
          const mockDurationSeconds = Math.max(1, text.length / 4);
          onLog?.(`✅ สังเคราะห์เสียงพากย์สร้างสมบูรณ์!`, 'success');
          return { 
            audioUrl,
            duration: Number(mockDurationSeconds.toFixed(1))
          };

        } else if (state === 'fail' || state === 'failed') {
          const reason = pollData?.data?.failMsg || pollData?.failMsg || 'Task Failed by Kie.ai backend';
          throw new Error(`การสร้างเสียงพากย์ล้มเหลว: ${reason}`);
        }
        
        attempt++;
      }

      throw new Error('หมดเวลารอ (Timeout 250s) การสร้างเสียงพากย์ตอบสนองช้าเกินไป');

    } catch (err: any) {
      onLog?.(`❌ เกิดข้อผิดพลาด: ${err.message}`, 'error');
      setError(err.message || 'เกิดข้อผิดพลาดในการสร้างเสียง');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateAudio,
    isGenerating,
    error
  };
}
"""

# Let's perform the first stage of pristine block replacements in target_text
def replace_block(text, start_pattern, end_pattern, replacement):
    start_idx = text.find(start_pattern)
    if start_idx == -1:
        print(f"WARNING: start_pattern {start_pattern} not found")
        return text
    end_idx = text.find(end_pattern, start_idx)
    if end_idx == -1:
        print(f"WARNING: end_pattern {end_pattern} not found")
        return text
    return text[:start_idx] + replacement + text[end_idx + len(end_pattern):]

# 2. Replace KIEAI_VOICES
target_text = replace_block(target_text, "const KIEAI_VOICES = [", "];", clean_kieai_voices)
# 3. Replace DEFAULT_STYLES
target_text = replace_block(target_text, "const DEFAULT_STYLES: CopyStyle[] = [", "];", clean_default_styles)
# 4. Replace HEADLINE_PRESETS
target_text = replace_block(target_text, "const HEADLINE_PRESETS: HeadlineStylePreset[] = [", "];", clean_headline_presets)

# 5. Clean up the inline functions in target
# The inline functions start around getActiveOpenRouterKey and end before export default function VerticalVideoSuitePortal()
start_funcs = "const getActiveOpenRouterKey = "
end_funcs = "export default function VerticalVideoSuitePortal()"

start_idx = target_text.find(start_funcs)
end_idx = target_text.find(end_funcs)

if start_idx != -1 and end_idx != -1:
    target_text = target_text[:start_idx] + clean_inline_functions + "\n" + target_text[end_idx:]
    print("Cleaned inline functions block successfully.")
else:
    print("WARNING: Inline functions block not found")

# 6. Perform structural line-by-line matching for all remaining target lines
target_lines = target_text.splitlines(keepends=True)

def clean_sig(line):
    # Remove all Thai, whitespace, punctuation, quotes, backticks, emojis and corrupted characters
    line = re.sub(r'[\u0e00-\u0e7f\ufffd?💡]+', '', line)
    line = re.sub(r'[^a-zA-Z0-9]', '', line)
    return line

orig_lines = orig_text.splitlines(keepends=True)
orig_map = {}
for idx, line in enumerate(orig_lines):
    sig = clean_sig(line)
    if len(sig) > 6:
        if sig not in orig_map:
            orig_map[sig] = []
        orig_map[sig].append((idx, line))

restored_count = 0
for idx, line in enumerate(target_lines):
    # If the line contains U+FFFD, ?, or 💡 and has a valid signature, let's restore it
    if '\ufffd' in line or '💡' in line or '?' in line:
        has_thai_or_garbled = any(c in line for c in '\ufffd\u0e00\u0e01\u0e02\u0e03\u0e04\u0e05\u0e06\u0e07\u0e08\u0e09\u0e0a\u0e0b\u0e0c\u0e0d\u0e0e\u0e0f\u0e10\u0e11\u0e12\u0e13\u0e14\u0e15\u0e16\u0e17\u0e18\u0e19\u0e1a\u0e1b\u0e1c\u0e1d\u0e1e\u0e1f\u0e20\u0e21\u0e22\u0e23\u0e24\u0e25\u0e26\u0e27\u0e28\u0e29\u0e2a\u0e2b\u0e2c\u0e2d\u0e2e\u0e2f\u0e30\u0e31\u0e32\u0e33\u0e34\u0e35\u0e36\u0e37\u0e38\u0e39\u0e3a\u0e3f\u0e40\u0e41\u0e42\u0e43\u0e44\u0e45\u0e46\u0e47\u0e48\u0e49\u0e4a\u0e4b\u0e4c\u0e4d\u0e4e\u0e4f\u0e50\u0e51\u0e52\u0e53\u0e54\u0e55\u0e56\u0e57\u0e58\u0e59\u0e5a\u0e5b') or '💡' in line
        if has_thai_or_garbled:
            sig = clean_sig(line)
            if len(sig) > 6:
                if sig in orig_map:
                    matches = orig_map[sig]
                    if len(matches) == 1:
                        # Perfect unique structural match!
                        target_lines[idx] = matches[0][1]
                        restored_count += 1
                    else:
                        # Multiple matches, choose closest index
                        best_match = min(matches, key=lambda x: abs(x[0] - idx))
                        target_lines[idx] = best_match[1]
                        restored_count += 1

print(f"Alignment stage 2 restored {restored_count} lines!")

# 7. Apply a custom token cleanup dictionary for any leftover UI strings
final_code = "".join(target_lines)

cleanup_dict = {
    "เลือกก": "เลือก",
    "ไฟล์รร": "ไฟล์บรรเลง",
    "เปิดระบ": "เปิดระบบ",
    "เปิดหน้าต่า": "เปิดหน้าต่าง",
    "เขียนนบท": "เขียนบท",
    "เสียงากย์": "เสียงพากย์",
    "เสียงูด": "เสียงพูด",
    "เสียงนตรี": "เสียงดนตรี",
    "เสียง": "เสียง",
    "กิด": "เกิด",
    "เป้าหมาย": "เป้าหมาย",
    "เป็น": "เป็น",
    "เปลี่": "เปลี่ยน",
    "เลือ": "เลือก",
    "เอร": "เออเร่อ",
    "บถ้ว": "ครบถ้วน",
    "เรียบ": "เรียบ",
    "ล่า": "เล่า",
    "ช่": "เช่น",
    "จั": "จัด",
    "ดน": "โดน",
    "ทีย": "เทียบ",
    "มด": "หมด",
    "ก้": "แก้",
    "รน": "เรน",
    "พื่อ": "เพื่อ",
    "เวลา": "เวลา",
    "พล": "เพลง",
    "ตือ": "เตือน",
    "ลพ": "ลัพธ์",
    "ห่": "แห่ง",
    "นื่อ": "เนื่อง",
    "บื้อ": "เบื้อง",
    "หลี่": "เหลี่ยม",
    "ตีย": "เตี้ย",
    "อกล": "เอกล",
    "นหา": "ค้นหา",
    "ัระวัติ": "คลังประวัติ",
    "ามยาว": "ความยาว",
    "ามลับ": "ความลับ",
    "ามขี้": "ความขี้",
    "ามสูง": "ความสูง",
    "ามกว้าง": "ความกว้าง",
    "ามโค้ง": "ความโค้ง",
    "ามฟุ้ง": "ความฟุ้ง",
    "ามหนา": "ความหนา",
    "ามห่าง": "ความห่าง",
    "นวณ": "คำนวณ",
    "ยพรี": "ไทยพรี",
    "ยเ": "ไทยเ",
    "ห้อ": "ให้ห้อง",
    "าษ": "ภาษา",
    "ำส": "คำส",
    "ทนต": "เทนต์",
    "ระวัติ": "ประวัติ",
    "รา": "ตาราง",
    "รียบร้อย": "เรียบร้อย",
    "ช่น": "เช่น",
    "พจ": "เพจ",
    "ซฟ": "เซฟ",
    "ก": "เก็บ",
    "ปิด": "เปิด",
    "ล์": "ไฟล์",
    "ต": "ตรง",
    "จน": "เจน",
    "บราว์": "เบราว์",
    "ล่": "เล่น",
    "ส้": "เส้น",
    "ชื่อ": "เชื่อม",
    "กิ": "เกิน",
    "หมา": "เหมาะ",
    "กลา": "เกลา",
    "ริ่ม": "เริ่ม",
    "ดีย": "เดียว",
    "าร": "การ",
    "ม": "เม",
    "ร": "เร",
    "ต": "เต",
    "ข": "เข",
    "ส": "เส",
    "พ": "เพ",
    "ซ": "เซ",
    "ก": "เก",
    "ป": "เป",
    "ล": "เล",
    "ิป": "คลิป",
    "ขี": "เขียน",
    "ลี": "เปลี่ยน",
    "ลื": "เลือก",
    "ล่า": "เล่า",
    "ส": "เสียง",
    "พ": "เพจ",
    "ซ": "เซฟ",
    "ก": "เก็บ",
    "ปิ": "เปิด",
    "ล": "ไฟล์",
    "ต": "ตรง",
    "จ": "เจน",
    "บ": "เบราว์",
    "ล": "เล่น",
    "ส": "เส้น",
    "ชื": "เชื่อม",
    "ก": "เกิน",
    "ห": "เหมาะ",
    "ก": "เกลา",
    "ร": "เริ่ม",
    "ด": "เดียว",
    "า": "การ",
    "ม": "เม",
    "ร": "เร",
    "ต": "เต",
    "ข": "เข",
    "ส": "เส",
    "พ": "เพ",
    "ซ": "เซ",
    "ก": "เก",
    "ป": "เป",
    "ล": "เล",
    "ิ": "ค",
    "": ""
}

# Clean stray replacement chars
final_code = final_code.replace("\ufffd", "")
final_code = final_code.replace("💡", "")

for src, dest in cleanup_dict.items():
    final_code = final_code.replace(src, dest)

# Write the final perfect file
with open(target_path, "w", encoding="utf-8") as f:
    f.write(final_code)

print("Saved pristine restored VerticalVideoSuitePortal.tsx!")
