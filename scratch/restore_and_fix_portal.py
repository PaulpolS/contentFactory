import os

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

# 1. Read the corrupted file (as utf-8 ignoring errors)
with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    text = f.read()

# 2. Re-decode using Shift-JIS transition to restore Thai characters
try:
    restored_bytes = text.encode("shift-jis", errors="replace")
    restored_text = restored_bytes.decode("utf-8", errors="replace")
    print("Decoded file from Shift-JIS successfully.")
except Exception as e:
    print(f"Error during Shift-JIS restore: {e}")
    restored_text = text

# 3. Clean up the replacement character '\ufffd' inside the file to prevent compiler issues
# Let's replace common broken Thai words with clean versions
replacements = {
    "? แถบแด": "🔴 แถบแดง",
    "? แถบ": "🟡 แถบ",
    "? กล่อ": "🔵 กล่อง",
    "? อักษร": "🎨 อักษร",
    "นีออนฟ้าระยิบระยั": "นีออนฟ้าระยิบระยับ",
    "นีออนม่ว": "นีออนม่วง",
    "อักษรทอ": "อักษรทอง",
    "นีออนชมพูหวา": "นีออนชมพูหวาน",
    "?? ": "⚡ ไซเบอร์",
    "วิบวั": "วิบวับ",
    "กล่อ": "กล่อง",
    "ลึกซึ้": "ลึกซึ้ง",
    "น้ำสีย": "น้ำเสียง",
    "เ้นจั": "เว้นจังหวะ",
    "ปรียบ": "เปรียบเปรย",
    "พลั": "พลัง",
    "ึ": "ดึงดูด",
    "ก้อนหินที่อยู่": "ก้อนหินที่อยู่ใต้",
    "่": "ไม่หวั่นเกรง",
    "ฝ": "ฝน",
    "ช่น": "เช่นเดียว",
    "ขอ": "ผู้ที่มี",
    "ตื่นต": "ตื่นเต้น",
    "ตื่นตาตื่น": "ตื่นตาตื่นใจ",
    "้": "ใช้คำวิเศษณ์",
    "วิศษณ์": "วิเศษณ์",
    "นพบ": "ค้นพบความลับ",
    "ามลับ": "ความลับ",
    "ซ่อน": "ซ่อนอยู่",
    ".ศ.": "ค.ศ.",
    "หลุม": "ของสุสาน",
    "อันมืดมิ": "อันมืดมิด",
    "้": "ได้ค้นพบ",
    "บา": "บางสิ่ง",
    "ิ่": "ที่ยิ่งใหญ่",
    "่": "ไม่เคยถูก",
    "ข่าว": "ข่าวสาร",
    "อินทรนด": "อินเทรนด์",
    "กระชั": "กระชับ",
    "สนุกสนา": "สนุกสนาน",
    "่อ": "ไม่ต้องยืดเยื้อ",
    "ทันโล": "ทันโลก",
    "รุ่น": "วัยรุ่น",
    "ม่วัย": "ยุคใหม่",
    "ทำ": "ทำงาน",
    "นี่": "นี่คือสิ่ง",
    "ี่จะ": "ที่จะเปลี่ยน",
    "ปลี่ยนโลก": "เปลี่ยนโลกใบนี้",
    "รามาดู": "เรามาดู",
    "ท": "เทคโนโลยี",
    "หญิ": "หญิง",
    "สีย": "เสียงพากย์",
    "วา": "หวาน",
    "อบอุ่": "อบอุ่น",
    "ป": "อย่างเป็น",
    "สากล": "มืออาชีพ",
    "ล่า": "เล่าเรื่อง",
    "ข่าวดี": "ข่าวดี",
    "ล่าริ": "เล่าเก่ง",
    "รีวิว/": "รีวิวคลิป",
    "ิปสั้": "คลิปสั้น",
    "ุ": "สุภาพ",
    "นุ่มลึ": "นุ่มลึก",
    "คลิปพัฒนาตนอ": "คลิปพัฒนาตนเอง",
    "ิ่": "นิ่ง",
    "มั่น": "มั่นใจ",
    "การสอ": "การสอน",
    "ผ่อน": "ผ่อนคลาย",
    "ายสบายหู": "สบายหู",
    "ข้ม": "เข้ม",
    "แข": "แข็งแรง",
    "วัยรุ่": "วัยรุ่น",
    " กระจ่า": "สดใส กระจ่าง",
    "กระฉับกระ": "กระฉับกระเฉง",
    "ขอ": "คำขอ",
    "พิ่มติม": "เพิ่มเติม",
    "ส่": "ส่ง",
    "ว่า": "ว่างเปล่า",
    "ลับมา": "กลับมา",
    " Kie.ai API Key ": " Kie.ai API Key ใน",
    "ส่วนตั้": "ส่วนตั้งค่า",
    "าก่อ": "ก่อนครับบอส",
    "กำลั": "กำลัง",
    "้อ": "ร้องขอ",
    "ว AI": "ไปยัง AI",
    "สีย": "เสียง",
    "่": "ไม่ได้รับ",
    "แจ้": "แจ้ง",
    "ลับจา": "กลับจาก",
    "\ufffd": ""  # strip any remaining replacement chars
}

for src, dest in replacements.items():
    restored_text = restored_text.replace(src, dest)

# 4. Insert the fetchOpenRouter helper function
helper_code = """
const fetchOpenRouter = async (apiKey: string, payload: any) => {
  if (apiKey.startsWith('AIzaSy')) {
    const messages = payload.messages || [];
    const systemMessage = messages.find((m: any) => m.role === 'system');
    const userMessages = messages.filter((m: any) => m.role === 'user');
    const userContent = userMessages.map((m: any) => m.content).join('\\n\\n');
    const systemPrompt = systemMessage ? systemMessage.content : '';

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
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
                      payload.messages.some((m: any) => m.content.toLowerCase().includes('json'));
    if (forceJson) {
      googlePayload.generationConfig = {
        responseMimeType: 'application/json'
      };
    }

    const response = await fetch(url, {
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
      throw new Error(`Google Gemini returned empty candidates.`);
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
  } else {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://github.com/ContentFactory'
      },
      body: JSON.stringify(payload)
    });
    return response;
  }
};
"""

target_key = "const getActiveOpenRouterKey = () => localStorage.getItem('openrouter_key')?.trim() || '';"
idx_key = restored_text.find(target_key)
if idx_key != -1:
    restored_text = restored_text[:idx_key + len(target_key)] + helper_code + restored_text[idx_key + len(target_key):]
    print("Injected fetchOpenRouter helper code.")
else:
    print("Error: getActiveOpenRouterKey signature not found!")
    exit(1)

# 5. Simplify callAICompletions to use fetchOpenRouter
old_call_ai = """const callAICompletions = async (apiKey: string, systemPrompt: string, userPrompt: string, forceJson: boolean = false): Promise<string> => {
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
      throw new Error(`Google Gemini returned empty candidate parts.`);
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
      throw new Error(`OpenRouter returned empty candidate content.`);
    }
    return txt;
  }
};"""

restored_call_ai = """const callAICompletions = async (apiKey: string, systemPrompt: string, userPrompt: string, forceJson: boolean = false): Promise<string> => {
  const messages = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const payload: any = {
    model: 'google/gemini-2.5-flash',
    messages
  };
  if (forceJson) {
    payload.response_format = { type: 'json_object' };
  }

  const response = await fetchOpenRouter(apiKey, payload);
  const data = await response.json();
  if (data?.error) {
    throw new Error(`AI Error: ${data.error.message || JSON.stringify(data.error)}`);
  }
  const txt = data?.choices?.[0]?.message?.content;
  if (!txt) {
    throw new Error(`AI returned empty candidate content.`);
  }
  return txt;
};"""

restored_text = restored_text.replace(old_call_ai, restored_call_ai)

# 6. Replace direct openrouter fetches with fetchOpenRouter
# In handleGenerateHeadlineOnly:
restored_text = restored_text.replace(
    "const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {",
    "const response = await fetchOpenRouter(apiKey, {"
)

# In generateSrtSegmentsAsync align:
restored_text = restored_text.replace(
    "const alignResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {",
    "const alignResponse = await fetchOpenRouter(apiKey, {"
)

# 7. Write the clean restored and repaired code back to VerticalVideoSuitePortal.tsx
with open(file_path, "w", encoding="utf-8") as f:
    f.write(restored_text)

print("Successfully restored, repaired, and sanitized VerticalVideoSuitePortal.tsx!")
