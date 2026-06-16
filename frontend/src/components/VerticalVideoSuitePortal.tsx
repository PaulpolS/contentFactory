import React, { useState, useEffect, useRef } from 'react';

const safeParseJSON = (jsonStr: string): any => {
  let inString = false;
  let cleaned = '';
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr[i];
    if (char === '"' && (i === 0 || jsonStr[i - 1] !== '\\')) {
      inString = !inString;
      cleaned += char;
    } else if (inString) {
      if (char === '\n') {
        cleaned += '\\n';
      } else if (char === '\r') {
        cleaned += '\\r';
      } else if (char === '\t') {
        cleaned += '\\t';
      } else {
        cleaned += char;
      }
    } else {
      cleaned += char;
    }
  }
  return JSON.parse(cleaned);
};
const safeCleanAndParseJSON = (jsonStr: string): any => {
  try {
    const start = jsonStr.indexOf('{');
    const end = jsonStr.lastIndexOf('}');
    if (start !== -1 && end !== -1 && start < end) {
      jsonStr = jsonStr.substring(start, end + 1);
    }
    return safeParseJSON(jsonStr);
  } catch (err) {
    console.error('Failed to clean and parse JSON:', err, 'Original String:', jsonStr);
    throw err;
  }
};
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
              text: systemPrompt ? `${systemPrompt}\n\nคำสั่งเพิ่มเติม:\n${userPrompt}` : userPrompt
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
      throw new Error(`Google Gemini ส่งผลลัพธ์ว่างเปล่า (Response data: ${JSON.stringify(data)})`);
    }
    return txt;
  } else {
    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: userPrompt });

    const models = [
      'google/gemini-2.5-flash',
      'google/gemini-2.5-flash:free',
      'meta-llama/llama-3.1-8b-instruct:free',
      'qwen/qwen3-8b:free'
    ];

    let lastError = null;
    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages
          })
        });
        const data = await response.json();
        if (data?.error) {
          throw new Error(data.error.message || JSON.stringify(data.error));
        }
        const txt = data?.choices?.[0]?.message?.content;
        if (!txt) {
          throw new Error('Empty response');
        }
        return txt;
      } catch (err: any) {
        console.warn(`[AI Completion] Model ${model} failed:`, err);
        lastError = err;
      }
    }
    throw new Error(`OpenRouter Error: ${lastError?.message || String(lastError)}`);
  }
};

export function useKieTTS() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAudio = async ({ text, voiceId = 'Adam', stability = 0.5, apiKey, onLog }: any) => {
    setIsGenerating(true);
    setError(null);

    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [5000, 15000, 30000]; // 5s, 15s, 30s

    try {
      if (!apiKey) {
        throw new Error('กรุณาระบุ Kie.ai API Key ในส่วนตั้งค่าก่อน');
      }

      onLog?.(`กำลังร้องขอต่อ AI เพื่อสังเคราะห์เสียง (Model: ${getVoiceDisplayName(voiceId)})...`, 'info');
      
      let createData: any = null;
      let lastError = '';
      
      for (let retry = 0; retry <= MAX_RETRIES; retry++) {
        try {
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
                    voice_id: voiceId
                  }
                ],
                stability: stability
              }
            })
          });

          if (!createRes.ok) {
            const errBody = await createRes.text();
            lastError = `HTTP ${createRes.status} — ${errBody}`;
            onLog?.(`[Kie.ai] ⚠️ HTTP ${createRes.status} — ${errBody.substring(0, 200)}`, 'warning');
            
            // Retry on rate limit (429) or server error (5xx)
            if ((createRes.status === 429 || createRes.status >= 500) && retry < MAX_RETRIES) {
              const delay = RETRY_DELAYS[retry] || 30000;
              onLog?.(`[Kie.ai] 🔄 Rate limit / Server error — รอ ${delay/1000}s แล้วลองใหม่ (ครั้งที่ ${retry + 1}/${MAX_RETRIES})...`, 'warning');
              await new Promise(res => setTimeout(res, delay));
              continue;
            }
            throw new Error(`HTTP error! status: ${createRes.status}`);
          }

          createData = await createRes.json();
          break; // Success, exit retry loop
        } catch (fetchErr: any) {
          lastError = fetchErr.message;
          if (fetchErr.message?.includes('HTTP error') || retry >= MAX_RETRIES) {
            throw fetchErr;
          }
          // Network error — retry
          const delay = RETRY_DELAYS[retry] || 30000;
          onLog?.(`[Kie.ai] 🔄 Network error — รอ ${delay/1000}s แล้วลองใหม่ (ครั้งที่ ${retry + 1}/${MAX_RETRIES})...`, 'warning');
          await new Promise(res => setTimeout(res, delay));
        }
      }

      if (!createData) {
        throw new Error(`ไม่สามารถเชื่อมต่อ Kie.ai ได้หลังจากลองซ้ำ ${MAX_RETRIES} ครั้ง: ${lastError}`);
      }

      const taskId = createData?.data?.taskId || createData?.taskId;
      
      if (!taskId) {
        throw new Error(`ไม่ได้รับ Task ID แจ้งจาก API: ${JSON.stringify(createData)}`);
      }

      onLog?.(`รอประมวลผล (Task ID: ${taskId.substring(0,6)}...)`, 'info');

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
             throw new Error('ระบบแจ้งสถานะสำเร็จแล้ว แต่ยังคงระบุไฟล์เสียงในข้อมูลไม่เจอ');
          }
          
          const mockDurationSeconds = Math.max(1, text.length / 4);
          onLog?.(`✅ สังเคราะห์เสียงและสร้างไฟล์เสียงเสร็จสมบูรณ์!`, 'success');
          return { 
            audioUrl,
            duration: Number(mockDurationSeconds.toFixed(1))
          };

        } else if (state === 'fail' || state === 'failed') {
          const reason = pollData?.data?.failMsg || pollData?.failMsg || 'Task Failed by Kie.ai backend';
          throw new Error(`การสร้างเสียงล้มเหลว: ${reason}`);
        }
        
        attempt++;
      }

      throw new Error('หมดเวลารอ (Timeout 250s) การตอบกลับช้าเกินไป');

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

// Draggable Subtitle Style Interface
interface SubtitleStyle {
  fontName: string;
  fontSize: number;
  marginV?: number;
  borderStyle: number; // 1=Outline, 3=OpaqueBox
  outlineThickness: number;
  shadowThickness: number;
  primaryColor: string;
  outlineColor: string;
  shadowColor: string;
}

// Preset options for video styling
const SUBTITLE_PRESETS = [
  {
    name: 'Classic White (Outlined)',
    fontName: 'Arial',
    fontSize: 26,
    borderStyle: 1,
    outlineThickness: 3,
    shadowThickness: 0,
    primaryColor: '#ffffff',
    outlineColor: '#000000',
    shadowColor: '#000000',
  },
  {
    name: 'TikTok Yellow (Bold Outline)',
    fontName: 'Arial',
    fontSize: 28,
    borderStyle: 1,
    outlineThickness: 4,
    shadowThickness: 0,
    primaryColor: '#ffff00',
    outlineColor: '#000000',
    shadowColor: '#000000',
  },
  {
    name: 'Netflix Box (Opaque Box)',
    fontName: 'Helvetica',
    fontSize: 24,
    borderStyle: 3,
    outlineThickness: 0,
    shadowThickness: 0,
    primaryColor: '#ffffff',
    outlineColor: '#1a1a1a',
    shadowColor: '#000000',
  },
  {
    name: 'Cyberpunk Purple',
    fontName: 'Arial',
    fontSize: 26,
    borderStyle: 1,
    outlineThickness: 3,
    shadowThickness: 2,
    primaryColor: '#c084fc',
    outlineColor: '#3b0764',
    shadowColor: '#000000',
  },
];

interface HeadlineStylePreset {
  id: string;
  name: string;
  fontColor: string;
  boxColor: string;
  fontSize: number;
  fontName: string;
  paddingX: number;
  paddingY: number;
  borderRadius: number;
  shadowBlur: number;
  shadowColor: string;
  boxOpacity: number;
  boxEnabled: boolean;
  outlineWidth: number;
  outlineColor: string;
  lineSpacing: number;
}

const HEADLINE_PRESETS: HeadlineStylePreset[] = [
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
    name: '🔥 อักษรแดงขอบดำเงาเข้ม (CapCut)',
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
    name: '🌅 อักษรส้มขอบดำไล่โทน (Sunset Orange)',
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
    name: '🪵 กล่องครีมเรโทร (Retro Cream)',
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
    name: '💚 นีออนเขียวเลเซอร์ (Laser Green)',
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
    name: '🧱 สามมิติแดงเงาดำ (3D Red Shadow)',
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
    name: '💎 กล่องขาวขอบฟ้าพาสเทล (Teal Box)',
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
];

interface CopyStyle {
  id: string;
  name: string;
  description: string;
  example: string;
}

const DEFAULT_STYLES: CopyStyle[] = [
  {
    id: 'deep-philosophy',
    name: 'ปรัชญาโบราณลึกซึ้ง',
    description: 'เล่าด้วยน้ำเสียงสุขุม มีการเว้นจังหวะคิด เปรียบเปรยกับธรรมชาติ มีพลังดึงดูดสติ',
    example: 'ก้อนหินที่อยู่ใต้น้ำ... ไม่เคยกลัวพายุฝน เช่นเดียวกับใจของคนที่ผ่านโลกมามาก...',
  },
  {
    id: 'sci-history',
    name: 'สารคดีประวัติศาสตร์ตื่นเต้น',
    description: 'ตื่นตาตื่นใจ ใช้คำวิเศษณ์กระตุ้นความอยากรู้ ค้นพบความลับที่ประวัติศาสตร์ซ่อนไว้',
    example: 'ปี ค.ศ. 1922 ในหลุมฝังศพอันมืดมิด... นักโบราณคดีได้ค้นพบบางสิ่ง ที่ไม่ควรถูกเปิดออก!',
  },
  {
    id: 'tech-trend',
    name: 'ข่าวไอทีสุดล้ำอินเทรนด์',
    description: 'เร็ว กระชับ สนุกสนาน คล่องแคล่ว ทันโลก เหมาะสำหรับคนรุ่นใหม่วัยทำงาน',
    example: 'นี่คือสิ่งที่จะเปลี่ยนโลกคุณไปตลอดกาล! วันนี้เรามาดู 3 เทคโนโลยีที่โคตรโหดกันครับ...',
  },
  {
    id: 'general-knowledge',
    name: 'ความรู้ทั่วไปชวนทึ่ง',
    description: 'เล่าเรื่องจริงชวนอึ้ง วิทยาศาสตร์น่าทึ่ง และเกร็ดความรู้แปลกใหม่รอบตัว ด้วยน้ำเสียงที่กระตุ้นความสงสัย ดึงดูดผู้ฟังให้อยากรู้เฉลย',
    example: 'รู้หรือไม่? จริงๆ แล้วร่างกายของคุณมีทองคำซ่อนอยู่! และกระดูกคนเราก็แข็งแกร่งกว่าคอนกรีตถึง 4 เท่า! มาดู 3 เรื่องจริงสุดทึ่งที่คุณอาจไม่เคยรู้มาก่อน...',
  },
];

// MacOS Native say command voices
const MACOS_VOICES = [
  { id: 'mac_default', name: 'เสียงระบบเริ่มต้นของ macOS (Siri / ตามที่กำหนดใน Accessibility)', lang: 'th-TH' },
  { id: 'mac_Kanya (Enhanced)', name: 'Kanya (Enhanced) (ภาษาไทย - หญิง - คุณภาพสูง)', lang: 'th-TH' },
  { id: 'mac_Narisa (Enhanced)', name: 'Narisa (Enhanced) (ภาษาไทย - หญิง - คุณภาพสูงมาก)', lang: 'th-TH' },
  { id: 'mac_Samantha', name: 'Samantha (English - หญิง - คุณภาพสูง)', lang: 'en-US' },
  { id: 'mac_Daniel', name: 'Daniel (English - ชาย - คุณภาพสูง)', lang: 'en-GB' },
];

const VOICE_NAME_TO_ID: Record<string, string> = {
  'Rachel': '21m00Tcm4TlvDq8ikWAM',
  'Aria': '9BWtsMINqrJLrRacOk9x',
  'Sarah': 'EXAVITQu4vr4xnSDxMaL',
  'Laura': 'FGY2Mi7P5L5L4P2G1J9H',
  'Lily': 'pFZP5JQG7iQjIQuC4Bku',
  'Roger': 'CwhRBWXjGAHq8TQ4Fs17',
  'George': 'JBFqnCBsd6RMkjVDRZzb',
  'Eric': 'cJ0tnMe1xobypO9Xp77S',
  'Chris': 'iP95p4xoKVk53GoZ742B',
  'Brian': 'nPczCjzI2devNBz1zQrb',
  'Daniel': 'onwK4e9ZLuTAKqWW03F9'
};

const KIEAI_VOICES = [
  // สุภาพสตรี (Females)
  { id: '21m00Tcm4TlvDq8ikWAM', name: 'Rachel (หญิง - เสียงนุ่ม สงบ เป็นมืออาชีพ เหมาะกับเล่าเรื่อง/สารคดี)', lang: 'th-TH' },
  { id: '9BWtsMINqrJLrRacOk9x', name: 'Aria (หญิง - เสียงหวาน สดใส ละมุน ยอดนิยมสำหรับคลิปทั่วไป)', lang: 'th-TH' },
  { id: 'EXAVITQu4vr4xnSDxMaL', name: 'Sarah (หญิง - เสียงนุ่มนวล อบอุ่น เป็นกันเอง เหมาะกับคลิปไลฟ์สไตล์)', lang: 'th-TH' },
  { id: 'FGY2Mi7P5L5L4P2G1J9H', name: 'Laura (หญิง - เสียงใส สดใสร่าเริง เหมาะกับคลิปสั้นสนุก)', lang: 'th-TH' },
  { id: 'pFZP5JQG7iQjIQuC4Bku', name: 'Lily (หญิง - เสียงนุ่มนวลเป็นธรรมชาติ เหมาะกับ ASMR/เล่าเรื่องก่อนนอน)', lang: 'th-TH' },

  // สุภาพบุรุษ (Males)
  { id: 'CwhRBWXjGAHq8TQ4Fs17', name: 'Roger (ชาย - เสียงหล่อ เข้ม อบอุ่น เล่าเรื่องประวัติศาสตร์/สารคดีดีเลิศ)', lang: 'th-TH' },
  { id: 'JBFqnCBsd6RMkjVDRZzb', name: 'George (ชาย - เสียงสุภาพ อบอุ่น นุ่มลึก เหมาะกับคลิปพัฒนาตนเอง)', lang: 'th-TH' },
  { id: 'cJ0tnMe1xobypO9Xp77S', name: 'Eric (ชาย - เสียงวัยรุ่น คล่องแคล่ว ทันสมัย เหมาะกับแนวไอที/ข่าวสั้น)', lang: 'th-TH' },
  { id: 'iP95p4xoKVk53GoZ742B', name: 'Chris (ชาย - เสียงกลาง ชัดเจน เป็นมิตร เหมาะกับคลิปสอน/How-to)', lang: 'th-TH' },
  { id: 'nPczCjzI2devNBz1zQrb', name: 'Brian (ชาย - เสียงหนักแน่น ผู้นำ โทนข่าว/สารคดีระดับสากล)', lang: 'th-TH' },
  { id: 'onwK4e9ZLuTAKqWW03F9', name: 'Daniel (ชาย - เสียงเรียบสุขุม เหมาะกับคลิปธุรกิจ/การเงิน)', lang: 'th-TH' },
];

// Set of valid Kie.ai voice IDs for validation
const VALID_KIEAI_VOICE_IDS = new Set(KIEAI_VOICES.map(v => v.id));
const DEFAULT_VOICE_ID = KIEAI_VOICES[0].id; // Rachel

/** Returns a valid voice ID — falls back to DEFAULT_VOICE_ID if invalid */
const resolveValidVoiceId = (id: string | undefined | null): string => {
  if (!id || id === 'none' || id === 'null' || id === 'undefined') return DEFAULT_VOICE_ID;
  // Map old name-based IDs to new alphanumeric IDs
  if (VOICE_NAME_TO_ID[id]) {
    return VOICE_NAME_TO_ID[id];
  }
  // mac_ voices are always valid
  if (id.startsWith('mac_')) return id;
  // Check against known premium voices
  if (VALID_KIEAI_VOICE_IDS.has(id)) return id;
  return DEFAULT_VOICE_ID;
};

/** Get a friendly display name from a voice_id */
const getVoiceDisplayName = (id: string | undefined | null): string => {
  if (!id) return 'Domi';
  if (id.startsWith('mac_')) return `Mac: ${id.split('_')[1] || 'System'}`;
  const resolvedId = VOICE_NAME_TO_ID[id] || id;
  const found = KIEAI_VOICES.find(v => v.id === resolvedId);
  if (found) return found.name.split('(')[0].trim();
  return id.length > 10 ? id.substring(0, 8) + '...' : id;
};

const SCRIPT_LENGTHS = [
  { id: 'short', label: 'สั้น (300-500 ตัวอักษร)', description: 'ความยาว 30-45 วินาที กระชับมาก เน้นความไว', targetChars: 400, timeRange: '30 ถึง 45 วินาที' },
  { id: 'medium', label: 'กลาง (800-1100 ตัวอักษร)', description: 'ความยาว 1-1.5 นาที สรุปประเด็นได้ดีที่สุด', targetChars: 950, timeRange: '60 ถึง 90 วินาที' },
  { id: 'long', label: 'ยาว (1500-1800 ตัวอักษร)', description: 'ความยาว 2-2.5 นาที อภิปรายลึกมีหลักฐานสถิติรองรับ', targetChars: 1650, timeRange: '120 ถึง 150 วินาที' }
];


interface NewsPayload {
  title: string;
  content: string;
  headline: string;
  images: string[];
  sourceUrl: string;
  source: string;
  timestamp: number;
}

interface BatchItem {
  topic: string;
  status: 'pending' | 'scripting' | 'voicing' | 'subtitling' | 'assembling' | 'rendering' | 'completed' | 'failed';
  script?: string;
  headline?: string;
  audioUrl?: string;
  duration?: number;
  srtContent?: string;
  videoUrl?: string;
  error?: string;
  newsPayload?: NewsPayload;
}

const hexToRgba = (hex: string, opacity: number) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

const getVisualLength = (str: string): number => {
  if (!str) return 0;
  // Remove Thai combining characters that stack vertically
  return str.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4C]/g, '').length;
};

const wrapText = (text: string, maxCharsPerLine = 22, maxLines = 0): string => {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const resultLines: string[] = [];
  
  for (const line of lines) {
    if (getVisualLength(line) <= maxCharsPerLine) {
      resultLines.push(line);
      continue;
    }
    
    let tokens: string[] = [];
    try {
      // @ts-ignore
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        // @ts-ignore
        const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(line));
        // @ts-ignore
        tokens = segments.map((seg) => seg.segment);
      } else {
        tokens = line.split(' ');
      }
    } catch (e) {
      tokens = line.split(' ');
    }
    
    let currentLine = '';
    for (const token of tokens) {
      if (token === '\n' || token === '\r') {
        if (currentLine) resultLines.push(currentLine);
        currentLine = '';
        continue;
      }
      
      const currentVisual = getVisualLength(currentLine);
      const tokenVisual = getVisualLength(token);
      
      if (currentVisual + tokenVisual <= maxCharsPerLine) {
        currentLine += token;
      } else {
        if (!currentLine) {
          let tempToken = token;
          while (getVisualLength(tempToken) > maxCharsPerLine) {
            // Find slice point by visual length
            let sliceIdx = 0;
            let accVisual = 0;
            for (let i = 0; i < tempToken.length; i++) {
              const char = tempToken[i];
              const isCombining = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4C]/.test(char);
              if (!isCombining) {
                accVisual++;
              }
              if (accVisual > maxCharsPerLine) {
                sliceIdx = i;
                break;
              }
            }
            if (sliceIdx === 0) sliceIdx = tempToken.length;
            
            resultLines.push(tempToken.substring(0, sliceIdx));
            tempToken = tempToken.substring(sliceIdx);
          }
          currentLine = tempToken;
        } else {
          resultLines.push(currentLine);
          if (token.trim() === '') {
            currentLine = '';
          } else {
            let tempToken = token;
            while (getVisualLength(tempToken) > maxCharsPerLine) {
              let sliceIdx = 0;
              let accVisual = 0;
              for (let i = 0; i < tempToken.length; i++) {
                const char = tempToken[i];
                const isCombining = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4C]/.test(char);
                if (!isCombining) {
                  accVisual++;
                }
                if (accVisual > maxCharsPerLine) {
                  sliceIdx = i;
                  break;
                }
              }
              if (sliceIdx === 0) sliceIdx = tempToken.length;
              
              resultLines.push(tempToken.substring(0, sliceIdx));
              tempToken = tempToken.substring(sliceIdx);
            }
            currentLine = tempToken;
          }
        }
      }
    }
    
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }
  
  let finalLines = resultLines.map(l => l.trim()).filter(Boolean);
  // Enforce max lines limit (e.g., 2 for headlines)
  if (maxLines > 0 && finalLines.length > maxLines) {
    finalLines = finalLines.slice(0, maxLines);
  }
  return finalLines.join('\n');
};


const hexToFfmpegColor = (hex: string, opacity: number) => {
  const cleanHex = hex.replace('#', '');
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${cleanHex}${alphaHex}`;
};

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

export default function VerticalVideoSuitePortal() {
  const { generateAudio } = useKieTTS();

  // --- OpenRouter Profile States ---
  const [dbProfiles, setDbProfiles] = useState<any[]>([]);
  const [selectedOpenRouterProfileId, setSelectedOpenRouterProfileId] = useState<string>('default');
  const [manualOpenRouterKey, setManualOpenRouterKey] = useState<string>(() => localStorage.getItem('openrouter_key') || '');
  const [openRouterKey, setOpenRouterKey] = useState(() => localStorage.getItem('openrouter_key') || '');

  const getActiveOpenRouterKey = () => openRouterKey?.trim() || '';

  // Auto-sync active API Keys from SQLite DB to localStorage on mount for zero-configuration startup
  useEffect(() => {
    const syncApiKeysFromDb = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/api/vault/credentials`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            // Store active keys for dropdown
            const activeOnly = data.data.filter((p: any) => p.is_active === 1);
            setDbProfiles(activeOnly);

            // Auto-select active openrouter profile
            const activeOR = activeOnly.find((p: any) => p.service_name === 'openrouter');
            if (activeOR) {
              setSelectedOpenRouterProfileId(String(activeOR.id));
              setOpenRouterKey(activeOR.credential_key.trim());
            }

            data.data.forEach((row: any) => {
              const service = row.service_name;
              const key = row.credential_key.trim();
              if (row.is_active === 1 && key && key !== `MOCK_${service.toUpperCase()}_KEY`) {
                if (service === 'openrouter') {
                  localStorage.setItem('openrouter_key', key);
                } else if (service === 'kie') {
                  localStorage.setItem('kie_key', key);
                  localStorage.setItem('kie_api_key', key);
                } else if (service === 'github') {
                  localStorage.setItem('github_token', key);
                } else if (service === 'dropbox') {
                  localStorage.setItem('dropbox_key', key);
                }
              }
            });
          }
        }
      } catch (err) {
        console.warn('Failed to auto-sync SQLite vault credentials:', err);
      }
    };
    syncApiKeysFromDb();
  }, []);

  // Update openRouterKey state when dropdown profile or manual input changes
  useEffect(() => {
    if (selectedOpenRouterProfileId === 'manual') {
      setOpenRouterKey(manualOpenRouterKey);
    } else if (selectedOpenRouterProfileId === 'default') {
      setOpenRouterKey(localStorage.getItem('openrouter_key') || '');
    } else {
      const prof = dbProfiles.find(p => String(p.id) === selectedOpenRouterProfileId);
      if (prof) {
        setOpenRouterKey(prof.credential_key);
      }
    }
  }, [selectedOpenRouterProfileId, dbProfiles, manualOpenRouterKey]);
  // --- States ---
  const [resumingHistoryId, setResumingHistoryId] = useState<string | null>(null);
  const [isResumingAllHistory, setIsResumingAllHistory] = useState(false);
  const [channelConcept, setChannelConcept] = useState('ให้ความรู้จิตวิทยา พัฒนาตนเอง ข้อคิดการดำเนินชีวิต');
  const [copyStyles, setCopyStyles] = useState<CopyStyle[]>(() => {
    const saved = localStorage.getItem('auto_video_styles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3 && parsed.some(s => s.id === 'deep-philosophy')) {
          localStorage.removeItem('auto_video_styles');
          return DEFAULT_STYLES;
        }
        return parsed;
      } catch (e) {
        return DEFAULT_STYLES;
      }
    }
    return DEFAULT_STYLES;
  });
  const [selectedStyleId, setSelectedStyleId] = useState<string>(() => {
    const saved = localStorage.getItem('auto_video_styles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 3 && parsed.some(s => s.id === 'deep-philosophy')) {
          return DEFAULT_STYLES[0].id;
        }
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed[0].id;
        }
      } catch (e) {
        console.error('Error parsing auto_video_styles from localStorage', e);
      }
    }
    return DEFAULT_STYLES[0].id;
  });
  const [isGeneratingStyles, setIsGeneratingStyles] = useState(false);

  // Script & Headline State
  const [topic, setTopic] = useState('วิธีเอาชนะความขี้เกียจด้วยกฎ 2 นาที');
  const [script, setScript] = useState('');
  const [headline, setHeadline] = useState('กฎ 2 นาที ชนะความขี้เกียจสะสม');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);
  const [scriptLength, setScriptLength] = useState<string>(() => {
    return localStorage.getItem('auto_video_script_length') || 'short';
  });
  useEffect(() => {
    localStorage.setItem('auto_video_script_length', scriptLength);
  }, [scriptLength]);

  // TTS State
  const [voiceId, setVoiceId] = useState(KIEAI_VOICES[0].id); // Rachel
  const [audioUrl, setAudioUrl] = useState('');
  const [audioDuration, setAudioDuration] = useState(0);
  const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);

  // Script & Audio History Library
  const [scriptHistory, setScriptHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('auto_video_script_history');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [searchHistoryQuery, setSearchHistoryQuery] = useState('');
  const [playingHistoryId, setPlayingHistoryId] = useState<string | null>(null);
  const historyAudioRef = useRef<HTMLAudioElement | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  const [loadedHistoryId, setLoadedHistoryId] = useState<string | null>(null);
  const [selectedSrtForView, setSelectedSrtForView] = useState<{ topic: string, content: string } | null>(null);
  const [copiedSrt, setCopiedSrt] = useState(false);

  // Subtitle Configuration State
  const [minWords, setMinWords] = useState(2);
  const [maxWords, setMaxWords] = useState(6);
  const [subStyle, setSubStyle] = useState<SubtitleStyle>(SUBTITLE_PRESETS[0]);
  const [srtSegments, setSrtSegments] = useState<Array<{ index: number; text: string; start: number; end: number }>>([]);
  const [srtContent, setSrtContent] = useState('');

  // Headline styling (Red box with white text by default)
  const [headlineFontColor, setHeadlineFontColor] = useState('#ffffff');
  const [headlineBoxColor, setHeadlineBoxColor] = useState('#ef4444');
  const [headlineFontSize, setHeadlineFontSize] = useState(40);
  const [headlineFontName, setHeadlineFontName] = useState('Arial');
  const [headlinePaddingX, setHeadlinePaddingX] = useState(16);
  const [headlinePaddingY, setHeadlinePaddingY] = useState(8);
  const [headlineBorderRadius, setHeadlineBorderRadius] = useState(8);
  const [headlineShadowBlur, setHeadlineShadowBlur] = useState(12);
  const [headlineShadowColor, setHeadlineShadowColor] = useState('#000000');
  const [headlineBoxOpacity, setHeadlineBoxOpacity] = useState(1.0);
  const [headlineBoxEnabled, setHeadlineBoxEnabled] = useState(true);
  const [headlineOutlineWidth, setHeadlineOutlineWidth] = useState(0);
  const [headlineOutlineColor, setHeadlineOutlineColor] = useState('#000000');
  const [headlinePresetId, setHeadlinePresetId] = useState('red-box');
  const [headlineLineSpacing, setHeadlineLineSpacing] = useState(15);

  // WYSIWYG Drag Coordinates (phone model width: 270px, height: 480px)
  const [headlineY, setHeadlineY] = useState(80); // in preview pixels (0 to 480)
  const [subtitleMarginV, setSubtitleMarginV] = useState(60); // in preview pixels from bottom

  // Video Assembly & BGM State
  const [sourceFolder, setSourceFolder] = useState(() => localStorage.getItem('auto_video_source_folder') || '');
  const [outputFolder, setOutputFolder] = useState(() => localStorage.getItem('auto_video_output_folder') || '');
  const [bgmFile, setBgmFile] = useState(() => localStorage.getItem('auto_video_bgm_file') || '');
  const [bgmVolume, setBgmVolume] = useState(0.12);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembledVideoPath, setAssembledVideoPath] = useState('');

  // Refs for hidden native browser file/folder picker inputs
  const sourceFolderInputRef = useRef<HTMLInputElement | null>(null);
  const outputFolderInputRef = useRef<HTMLInputElement | null>(null);
  const bgmFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgmFolderInputRef = useRef<HTMLInputElement | null>(null);

  const handleFolderInputChange = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'source' | 'output' | 'bgmFolder') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const firstFile = files[0];
    const relativePath = firstFile.webkitRelativePath || '';
    const folderName = relativePath.split('/')[0] || '';
    if (!folderName) return;

    addLog(`กำลังตรวจสอบตำแหน่งจริงของโฟลเดอร์ "${folderName}" บนระบบดิสก์...`, 'info');

    const fileSignatures = Array.from(files).slice(0, 3).map(f => ({ name: f.name, size: f.size }));
    try {
      const res = await fetch(`${BACKEND_BASE}/api/find-local-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderName, fileSignatures })
      });
      const data = await res.json();
      if (data.success && data.path) {
        if (kind === 'source') {
          setSourceFolder(data.path);
          addLog(`เลือกโฟลเดอร์ต้นทางสำเร็จ: ${data.path}`, 'success');
        } else if (kind === 'output') {
          setOutputFolder(data.path);
          addLog(`เลือกโฟลเดอร์ปลายทางสำเร็จ: ${data.path}`, 'success');
        } else if (kind === 'bgmFolder') {
          setBgmFile(data.path);
          addLog(`เลือกโฟลเดอร์ BGM สำเร็จ: ${data.path}`, 'success');
        }
      } else {
        addLog(`ไม่พบตำแหน่งบนเครื่อง: ${data.error || ''} - โปรดใช้การกรอกเองด้วยความแม่นยำนะครับบอส`, 'warning');
        const currentPath = kind === 'source' ? sourceFolder : (kind === 'output' ? outputFolder : bgmFile);
        const title = kind === 'source' ? 'คลิปดิบ (Footage)' : (kind === 'output' ? 'บันทึกผลลัพธ์ (Output)' : 'เพลงประกอบ BGM');
        const manualDir = window.prompt(`ระบุ Path เองโดยตรงสำหรับ ${title}:`, currentPath);
        if (manualDir !== null) {
          const trimmed = manualDir.trim();
          if (kind === 'source') setSourceFolder(trimmed);
          else if (kind === 'output') setOutputFolder(trimmed);
          else setBgmFile(trimmed);
        }
      }
    } catch (err: any) {
      addLog(`เกิดข้อผิดพลาดในการตรวจสอบโฟลเดอร์: ${err.message}`, 'error');
    }
    e.target.value = '';
  };

  const handleBgmFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];

    addLog(`กำลังตรวจสอบตำแหน่งจริงของไฟล์ "${file.name}" บนระบบดิสก์...`, 'info');

    try {
      const res = await fetch(`${BACKEND_BASE}/api/find-local-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: file.name, fileSize: file.size })
      });
      const data = await res.json();
      if (data.success && data.path) {
        setBgmFile(data.path);
        addLog(`เลือกไฟล์เพลง BGM สำเร็จ: ${data.path}`, 'success');
      } else {
        addLog(`ไม่พบตำแหน่งบนเครื่อง - โปรดใช้การกรอกเองด้วยความแม่นยำนะครับบอส`, 'warning');
        const manualFile = window.prompt(`กรุณาระบุ Path ไฟล์ BGM เองโดยตรง:`, bgmFile || '');
        if (manualFile !== null) {
          setBgmFile(manualFile.trim());
        }
      }
    } catch (err: any) {
      addLog(`เกิดข้อผิดพลาดในการตรวจสอบไฟล์ BGM: ${err.message}`, 'error');
    }
    e.target.value = '';
  };



  // Batch Queue & Running Engine
  const [batchTopicInput, setBatchTopicInput] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>(() => {
    try {
      const saved = localStorage.getItem('vertical_video_batch_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('vertical_video_batch_items', JSON.stringify(batchItems));
  }, [batchItems]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [isLogExpanded, setIsLogExpanded] = useState(false);
  
  // --- New States for Automated reels Creator Spec ---
  const [colorFilter, setColorFilter] = useState<'none' | 'grayscale' | 'dark' | 'contrast' | 'dark-grayscale'>(() => {
    return (localStorage.getItem('auto_video_color_filter') as any) || 'none';
  });
  useEffect(() => {
    localStorage.setItem('auto_video_color_filter', colorFilter);
  }, [colorFilter]);

  const [savedBrains, setSavedBrains] = useState<any[]>([]);
  const [selectedBrainId, setSelectedBrainId] = useState<string>(() => {
    return localStorage.getItem('auto_video_selected_brain_id') || 'none';
  });
  useEffect(() => {
    localStorage.setItem('auto_video_selected_brain_id', selectedBrainId);
  }, [selectedBrainId]);



  // Inline Brain Trainer states
  const [inlineBrainName, setInlineBrainName] = useState('');
  const [inlineBrainPasteText, setInlineBrainPasteText] = useState('');
  const [isAnalyzingInlineBrain, setIsAnalyzingInlineBrain] = useState(false);

  // ── News-to-Video Mode (NEW) ──
  const [newsMode, setNewsMode] = useState(false);
  const [newsPayload, setNewsPayload] = useState<NewsPayload | null>(null);
  const [newsTargetDuration, setNewsTargetDuration] = useState(60);
  const [newsScript, setNewsScript] = useState('');
  const [newsHeadline, setNewsHeadline] = useState('');
  const [newsLocalImages, setNewsLocalImages] = useState<string[]>([]);
  const [newsStatus, setNewsStatus] = useState<'idle' | 'scripting' | 'downloading' | 'voicing' | 'subtitling' | 'building-slideshow' | 'rendering' | 'done' | 'error'>('idle');
  const [newsStatusLog, setNewsStatusLog] = useState<string[]>([]);
  const [newsResultPath, setNewsResultPath] = useState('');

  // Detect incoming news payload from DiscoveryPortal via localStorage
  useEffect(() => {
    // 1. Single Payload
    const payload = localStorage.getItem('news_to_video_payload');
    if (payload) {
      try {
        const data = JSON.parse(payload) as NewsPayload;
        localStorage.removeItem('news_to_video_payload');
        setNewsPayload(data);
        setNewsMode(true);
        setNewsHeadline(data.headline || data.title);
        setNewsScript('');
        setNewsLocalImages([]);
        setNewsStatus('idle');
        setNewsStatusLog([`📰 โหลดข่าวสำเร็จ: "${data.title.substring(0, 60)}..." (${data.images.length} รูป)`]);
        setNewsResultPath('');
      } catch (e) {
        console.error('Failed to parse news payload:', e);
        localStorage.removeItem('news_to_video_payload');
      }
    }

    // 2. Batch Payloads
    const batchPayloads = localStorage.getItem('batch_news_to_video_payloads');
    if (batchPayloads) {
      try {
        const datas = JSON.parse(batchPayloads) as NewsPayload[];
        localStorage.removeItem('batch_news_to_video_payloads');
        if (datas.length > 0) {
          const newBatchItems: BatchItem[] = datas.map(data => ({
            topic: data.headline || data.title,
            status: 'pending',
            newsPayload: data
          }));
          setBatchItems(prev => [...prev, ...newBatchItems]);
          setNewsMode(false); // We go to batch UI, not single news UI
        }
      } catch (e) {
        console.error('Failed to parse batch news payload:', e);
        localStorage.removeItem('batch_news_to_video_payloads');
      }
    }
  }, []);

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const batchStatusRef = useRef<'idle' | 'running' | 'paused' | 'stopped'>('idle');

  // Pre-drafting and Preview Inspect states for Batch Queue
  const [selectedBatchItemIdxForPreview, setSelectedBatchItemIdxForPreview] = useState<number>(-1);
  const [isDraftingAll, setIsDraftingAll] = useState(false);

  // Helper to format time as SRT format
  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
  };

  const loadBatchItemToPreview = (idx: number) => {
    if (idx < 0 || idx >= batchItems.length) return;
    setSelectedBatchItemIdxForPreview(idx);
    const item = batchItems[idx];
    setTopic(item.topic);
    setScript(item.script || '');
    setHeadline(item.headline || '');
    setAudioUrl(item.audioUrl || '');
    setAudioDuration(item.duration || 0);
    
    if (item.srtContent) {
      setSrtContent(item.srtContent);
      // Simple parse of first line to show in preview
      const lines = item.srtContent.split('\n');
      const textLineIdx = lines.findIndex(l => l.includes('-->')) + 1;
      const parsedText = textLineIdx > 0 && textLineIdx < lines.length ? lines[textLineIdx] : '';
      setSrtSegments([{ index: 1, start: 0, end: item.duration || 0, text: parsedText || item.script || '' }]);
    } else {
      const dur = item.duration || 0;
      const staticSrt = `1\n${formatTime(0)} --> ${formatTime(dur)}\n${item.script || ''}\n`;
      setSrtContent(staticSrt);
      setSrtSegments([{ index: 1, start: 0, end: dur, text: item.script || '' }]);
    }
  };

  // Synchronize script/headline edits back to the selected batch item!
  useEffect(() => {
    if (selectedBatchItemIdxForPreview >= 0 && selectedBatchItemIdxForPreview < batchItems.length) {
      setBatchItems(prev => {
        const next = [...prev];
        const item = next[selectedBatchItemIdxForPreview];
        if (item && (item.script !== script || item.headline !== headline)) {
          item.script = script;
          item.headline = headline;
        }
        return next;
      });
    }
  }, [script, headline, selectedBatchItemIdxForPreview]);

  const handleDraftAllScripts = async () => {
    if (batchItems.length === 0) {
      alert('กรุณากรอกและสร้างตารางหัวข้อเตรียมรันก่อนบอส!');
      return;
    }
    
    setIsDraftingAll(true);
    addLog('เริ่มกระบวนการเขียนบทความและพาดหัวทั้งหมดในคิว...', 'batch');

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (item.status === 'completed') continue;

      updateItemStatus(i, 'scripting');
      addLog(`[${i+1}/${batchItems.length}] กำลังเจนเขียนบทความหัวข้อ: "${item.topic}"...`, 'info');

      try {
        const scriptResult = await handleGenerateScript(item.topic, selectedStyleId);
        if (scriptResult) {
          const dur = item.duration || 0;
          const srt = `1\n${formatTime(0)} --> ${formatTime(dur)}\n${scriptResult.script}\n`;

          setBatchItems(prev => {
            const next = [...prev];
            next[i].script = scriptResult.script;
            next[i].headline = scriptResult.headline;
            next[i].srtContent = srt;
            next[i].duration = dur;
            next[i].status = 'pending'; // revert to pending
            return next;
          });
          addLog(`✅ เขียนบทความสำเร็จสำหรับ: ${item.topic}`, 'success');
        } else {
          updateItemStatus(i, 'failed', 'เขียนบทความล้มเหลว');
        }
      } catch (err: any) {
        updateItemStatus(i, 'failed', err.message || 'Error scripting');
      }
    }

    setIsDraftingAll(false);
    addLog('🏁 เขียนบทความและพาดหัวเสร็จสิ้นทุกรายการในคิวแล้ว! บอสสามารถเลือกดูพรีวิวและปรับตำแหน่งแต่ละตอนได้จากกล่องเลือกด้านบนขวาได้เลยครับ', 'success');
  };

  // Keep ref updated to avoid stale closures in the batch loop
  useEffect(() => {
    batchStatusRef.current = batchStatus;
  }, [batchStatus]);

  // Prevent accidental page reload/close during batch processing
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (batchStatusRef.current === 'running') {
        e.preventDefault();
        e.returnValue = 'กำลังตัดต่ออยู่! ถ้าปิดหน้านี้งานจะหายหมดเลยนะครับบอส';
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Save folder/settings changes
  useEffect(() => {
    if (sourceFolder) localStorage.setItem('auto_video_source_folder', sourceFolder);
  }, [sourceFolder]);
  useEffect(() => {
    if (outputFolder) localStorage.setItem('auto_video_output_folder', outputFolder);
  }, [outputFolder]);
  useEffect(() => {
    if (bgmFile) localStorage.setItem('auto_video_bgm_file', bgmFile);
  }, [bgmFile]);

  // Load Saved Brains from backend / localStorage
  useEffect(() => {
    const loadSavedBrains = () => {
      fetch(`${BACKEND_BASE}/api/get-app-data?key=brains`)
        .then(res => res.json())
        .then((data: any[]) => {
          const localSaved = localStorage.getItem('system_prompts_brain');
          let localData: any[] = [];
          try { if (localSaved) localData = JSON.parse(localSaved); } catch(e) {}
          
          if (data && data.length > 0) {
            setSavedBrains(data);
            localStorage.setItem('system_prompts_brain', JSON.stringify(data));
          } else if (localData.length > 0) {
            setSavedBrains(localData);
            // Save to backend
            fetch(`${BACKEND_BASE}/api/save-app-data`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ key: 'brains', data: localData })
            }).catch(console.error);
          }
        })
        .catch(err => {
          console.error('Failed to load brains from backend in Auto tab', err);
          const saved = localStorage.getItem('system_prompts_brain');
          if (saved) { try { setSavedBrains(JSON.parse(saved)); } catch (e) {} }
        });
    };

    loadSavedBrains();
    // Refresh list on window focus for cross-tab sync
    window.addEventListener('focus', loadSavedBrains);
    return () => window.removeEventListener('focus', loadSavedBrains);
  }, []);

  // Terminal scroll to bottom
  // useEffect(() => {
  //   terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  // }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'batch' | 'warning' = 'info') => {
    const time = new Date().toLocaleTimeString();
    let prefix = '[INFO]';
    if (type === 'success') prefix = '✅ [SUCCESS]';
    if (type === 'error') prefix = '❌ [ERROR]';
    if (type === 'batch') prefix = '🚀 [BATCH]';
    if (type === 'warning') prefix = '⚠️ [WARNING]';
    setLogs(prev => [...prev, `${time} ${prefix} ${msg}`]);
  };

  // --- Style Proposer (OpenRouter) ---
  const handleGenerateStyles = async () => {
    const apiKey = getActiveOpenRouterKey();
    if (!apiKey) {
      alert('กรุณาตั้งค่า OpenRouter API Key ในกล่องเมนูด้านบนก่อนครับบอส!');
      return;
    }

    setIsGeneratingStyles(true);
    addLog('กำลังส่งคอนเซปต์ช่องให้ AI วิเคราะห์สไตล์การเขียนบท...', 'info');

    try {
      const systemPrompt = 'คุณคือผู้เชี่ยวชาญการสร้างสไตล์วิดีโอสั้นแนวตั้ง (Shorts, TikTok, Reels) หน้าที่ของคุณคือสร้างสไตล์การเล่าเรื่องเชิงการตลาดที่มีเอกลักษณ์เฉพาะตัว 5 แบบ ภาษาไทย ส่งกลับมาในรูปแบบ JSON Array เท่านั้น ไม่มีข้อความอื่นนอกจาก JSON โดยแต่ละสไตล์ใน Array ต้องมีฟิลด์: name (ชื่อสไตล์โดนๆ), description (อธิบายการใช้น้ำเสียงและการเว้นจังหวะ), และ example (ตัวอย่างสคริปต์สั้นๆ 1 ประโยค)';
      const userPrompt = `นี่คือคอนเซปต์ของช่องฉัน: "${channelConcept}" ช่วยออกแบบสไตล์การเขียนบทที่เหมาะสมที่สุด 5 รูปแบบให้อ่านแล้วสะกดสายตาคน`;
      
      const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, true);

      // Clean JSON formatting
      const cleanJson = aiResponse.substring(
        aiResponse.indexOf('['),
        aiResponse.lastIndexOf(']') + 1
      );
      const parsed: Array<{ name: string; description: string; example: string }> = safeParseJSON(cleanJson);

      const generated: CopyStyle[] = parsed.map((item, index) => ({
        id: `gen-style-${Date.now()}-${index}`,
        name: item.name,
        description: item.description,
        example: item.example
      }));

      setCopyStyles(generated);
      localStorage.setItem('auto_video_styles', JSON.stringify(generated));
      setSelectedStyleId(generated[0].id);
      addLog('สร้างสไตล์การเล่าเรื่องสำเร็จ 5 รูปแบบเรียบร้อย!', 'success');

    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดในการสร้างสไตล์: ${e.message}`, 'error');
      alert(`ล้มเหลว: ${e.message}`);
    } finally {
      setIsGeneratingStyles(false);
    }
  };

  const applyHeadlinePreset = (preset: HeadlineStylePreset) => {
    setHeadlinePresetId(preset.id);
    setHeadlineFontColor(preset.fontColor);
    setHeadlineBoxColor(preset.boxColor);
    setHeadlineFontSize(preset.fontSize);
    setHeadlineFontName(preset.fontName);
    setHeadlinePaddingX(preset.paddingX);
    setHeadlinePaddingY(preset.paddingY);
    setHeadlineBorderRadius(preset.borderRadius);
    setHeadlineShadowBlur(preset.shadowBlur);
    setHeadlineShadowColor(preset.shadowColor);
    setHeadlineBoxOpacity(preset.boxOpacity);
    setHeadlineBoxEnabled(preset.boxEnabled);
    setHeadlineOutlineWidth(preset.outlineWidth);
    setHeadlineOutlineColor(preset.outlineColor);
    setHeadlineLineSpacing(preset.lineSpacing);
  };

  const changeHeadlineFontColor = (val: string) => {
    setHeadlineFontColor(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineBoxColor = (val: string) => {
    setHeadlineBoxColor(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineFontName = (val: string) => {
    setHeadlineFontName(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineFontSize = (val: number) => {
    setHeadlineFontSize(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlinePaddingX = (val: number) => {
    setHeadlinePaddingX(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlinePaddingY = (val: number) => {
    setHeadlinePaddingY(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineBorderRadius = (val: number) => {
    setHeadlineBorderRadius(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineBoxOpacity = (val: number) => {
    setHeadlineBoxOpacity(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineShadowBlur = (val: number) => {
    setHeadlineShadowBlur(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineShadowColor = (val: string) => {
    setHeadlineShadowColor(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineBoxEnabled = (val: boolean) => {
    setHeadlineBoxEnabled(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineOutlineWidth = (val: number) => {
    setHeadlineOutlineWidth(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineOutlineColor = (val: string) => {
    setHeadlineOutlineColor(val);
    setHeadlinePresetId('custom');
  };
  const changeHeadlineLineSpacing = (val: number) => {
    setHeadlineLineSpacing(val);
    setHeadlinePresetId('custom');
  };

  // --- Script & Voiceover Library Managers ---
  const saveToHistory = (item: {
    id?: string;
    topic: string;
    headline: string;
    script: string;
    voiceId?: string;
    audioUrl?: string;
    duration?: number;
    srtSegments?: any[];
    srtContent?: string;
    videoUrl?: string;
    newsPayload?: NewsPayload;
  }) => {
    let savedId = item.id;
    setScriptHistory(prev => {
      const cleanTopic = item.topic || 'กำหนดเอง (Manual Input)';
      
      // Match by ID if provided, otherwise fallback to topic + script matching
      const existingIndex = prev.findIndex(x => 
        (savedId && x.id === savedId) || 
        (!savedId && x.topic === cleanTopic && x.script === item.script)
      );

      let updated = [...prev];
      if (existingIndex >= 0) {
        // Update existing item
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...item,
          id: updated[existingIndex].id,
          topic: cleanTopic
        };
        addLog('อัปเดตประวัติการเขียนบทและเสียงพากย์เรียบร้อย', 'success');
      } else {
        // Add new item
        const newId = savedId || `history_${Date.now()}`;
        updated.unshift({
          ...item,
          id: newId,
          topic: cleanTopic,
          createdAt: new Date().toISOString()
        });
        addLog('บันทึกบทลงคลังประวัติเรียบร้อย', 'success');
      }

      try {
        localStorage.setItem('auto_video_script_history', JSON.stringify(updated));
      } catch (e: any) {
        if (e.name === 'QuotaExceededError' || e.message?.includes('quota') || e.code === 22) {
          console.warn('LocalStorage quota exceeded. Trimming script history...');
          let success = false;
          while (updated.length > 3 && !success) {
            updated.pop();
            try {
              localStorage.setItem('auto_video_script_history', JSON.stringify(updated));
              success = true;
              addLog('⚠️ พื้นที่จัดเก็บเบราว์เซอร์เต็ม: ลบประวัติเก่าที่สุดออกเพื่อให้ระบบรันต่อได้เรียบร้อยครับ', 'warning');
            } catch (innerErr) {
              // continue trimming
            }
          }
        } else {
          console.error('Failed to save script history:', e);
        }
      }
      return updated;
    });
  };

  const handleDeleteHistory = (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบรายการประวัตินี้?')) return;
    setScriptHistory(prev => {
      const updated = prev.filter(x => x.id !== id);
      localStorage.setItem('auto_video_script_history', JSON.stringify(updated));
      return updated;
    });
    addLog('ลบรายการประวัติสำเร็จ', 'info');
  };

  const handleLoadFromHistory = (item: any) => {
    setLoadedHistoryId(item.id || null);
    setTopic(item.topic || '');
    setHeadline(item.headline || '');
    setScript(item.script || '');
    setAudioUrl(item.audioUrl || '');
    setAudioDuration(item.duration || 0);
    if (item.voiceId) {
      setVoiceId(resolveValidVoiceId(item.voiceId));
    }
    if (item.srtSegments) {
      setSrtSegments(item.srtSegments);
    } else {
      setSrtSegments([]);
    }
    if (item.srtContent) {
      setSrtContent(item.srtContent);
    } else {
      setSrtContent('');
    }
    addLog(`ดึงบทและเสียงพากย์ "${item.topic || 'กำหนดเอง'}" มาเตรียมใช้งานแล้วครับบอส`, 'success');
  };

  const handleClearAllHistory = () => {
    if (!confirm('⚠️ คำเตือน: คุณต้องการลบประวัติการเขียนบทและเสียงพากย์ทั้งหมดหรือไม่? (ไม่สามารถกู้คืนได้)')) return;
    setScriptHistory([]);
    localStorage.removeItem('auto_video_script_history');
    addLog('ล้างคลังประวัติทั้งหมดเรียบร้อยแล้ว', 'info');
  };

  const handlePlayHistoryAudio = (item: any) => {
    if (playingHistoryId === item.id) {
      historyAudioRef.current?.pause();
      setPlayingHistoryId(null);
    } else {
      if (historyAudioRef.current) {
        historyAudioRef.current.pause();
      }
      const audio = new Audio(item.audioUrl);
      audio.play().catch(err => {
        console.error("Error playing history audio:", err);
        addLog(`❌ เล่นเสียงล้มเหลว: ${err.message}`, 'error');
      });
      audio.onended = () => setPlayingHistoryId(null);
      historyAudioRef.current = audio;
      setPlayingHistoryId(item.id);
    }
  };

  // --- Script Generator ---
  const handleGenerateScript = async (targetTopic: string, styleId: string): Promise<{ script: string; headline: string } | null> => {
    const apiKey = getActiveOpenRouterKey();
    if (!apiKey) {
      alert('กรุณาตั้งค่า OpenRouter API Key ก่อนสร้างบทสคริปต์');
      return null;
    }

    let selectedStyle = copyStyles.find(s => s.id === styleId);
    if (!selectedStyle) {
      if (copyStyles.length > 0) {
        selectedStyle = copyStyles[0];
        addLog(`ไม่พบสไตล์รหัส "${styleId}" จึงสลับไปใช้สไตล์แรกคือ "${selectedStyle.name}" เพื่อดำเนินต่อ`, 'info');
      } else {
        addLog(`ไม่พบสไตล์การเขียนบทในระบบ กรุณาสร้างหรือเลือกสไตล์ใหม่`, 'error');
        alert(`ล้มเหลว: ไม่พบสไตล์การเขียนบทในระบบ กรุณาเลือกสไตล์ใหม่อีกครั้งครับบอส`);
        return null;
      }
    }

    addLog(`กำลังเจนนิ่งบทความหัวข้อ: "${targetTopic}"...`, 'info');

    // Brain personality inject
    const brain = savedBrains.find(b => b.id === selectedBrainId);
    let brainContext = '';
    if (brain) {
      brainContext = `\n\n[อัตลักษณ์เพจและสไตล์ของสมองเป้าหมาย (Persona & Writing Style of Selected Brain)]:
${brain.content}

**แนวทางการขยายความ:** โปรดประยุกต์ใช้น้ำเสียง การสะกดคำ การเลือกคลังคำศัพท์ และสไตล์วรรคตอนที่ได้รับวิเคราะห์ข้างต้นนี้อย่างเข้มงวดที่สุดในผลงานของคุณ ให้เหมือนสมองเพจนี้มาพิมพ์เอง!`;
    }

    // Series Mode inject
    const epMatch = targetTopic.match(/EP\.?\s*(\d+)/i);
    let seriesContext = '';
    if (epMatch) {
      const epNum = epMatch[1];
      seriesContext = `\n\n[ข้อมูลชุดซีรีส์ (Series Episode Context)]:
- คอนเทนต์นี้เป็น "ตอนที่ ${epNum}" ของซีรีส์วิดีโอสั้น
- โปรดแต่งเนื้อหาให้มีหัวข้อเข้าชุดกัน มีเอกลักษณ์สอดคล้อง ดึงความสนใจที่สืบเนื่องจากหัวข้อหลัก และสามารถเกริ่นนำหรือลงท้ายเพื่อสร้างความต่อเนื่องเชิงซีรีส์ได้อย่างกระชับธรรมชาติ!`;
    }

    const activeLength = SCRIPT_LENGTHS.find(l => l.id === scriptLength) || SCRIPT_LENGTHS[0];

    try {
      const systemPrompt = `คุณคือคนเขียนบทสคริปต์สำหรับคลิปสั้นแนวตั้ง (Shorts/TikTok/Reels) ที่เก่งที่สุด 

ข้อกำหนดที่สำคัญที่สุด (CRITICAL RULES):
1. ให้เขียนเฉพาะ "บทพูดเพียวๆ" ที่เสียงพากย์ AI จะใช้อ่านได้ทันที
2. ห้ามมีวงเล็บกำกับอารมณ์/ท่าทาง (เช่น (ยิ้ม), (ถอนหายใจ)) โดยเด็ดขาด
3. ห้ามมีคำระบุตัวตนผู้ดำเนินรายการหรือคนพูด (เช่น "ผู้ดำเนินรายการ:", "พิธีกร:") โดยเด็ดขาด
4. เขียนบทให้เป็นคำพูดลื่นไหล สะกดสายตาคนฟังตั้งแต่ 3 วินาทีแรก
5. ความยาวบทสคริปต์พูด: ให้เขียนความยาวระดับ "${activeLength.label}" (${activeLength.description})


นอกจากนี้ช่วยสร้าง "Headline พาดหัวแนวตั้ง" ที่สั้นมากๆ กระชับ แปะบนปก/หัววิดีโอแล้วโคตรน่าดึงดูดมาให้ด้วย 1 ประโยค
* กฎเหล็ก: พาดหัวต้องมีไม่เกิน 2 บรรทัด และไม่เกิน 8 คำ (ห้ามเกิน 2 บรรทัดเด็ดขาด!)
* สำคัญมาก: คุณต้องช่วยแบ่งวรรคตอนคำบรรทัดของพาดหัวให้สวยงามเป็นคำๆ อย่างมีระดับ โดยใช้เครื่องหมายขึ้นบรรทัดใหม่ (\\n) ห้ามหักครึ่งคำเด็ดขาด (เช่น คำว่า 'เศรษฐี' หรือ 'ขี้เกียจ' ต้องอยู่บรรทัดเดียวกัน ห้ามแยกตัวสะกดหรือสระแยกบรรทัดกัน)
* ตัวอย่างพาดหัว 2 บรรทัดที่สวยงาม:
  "เคล็ดลับโบราณ\\nเปลี่ยนขี้เกียจเป็นเศรษฐี!"
  "กฎ 3 ข้อ\\nรวยเร็วขึ้น 10 เท่า"
  "พระเครื่องแตก\\nลางร้ายจริงหรือ?"

ส่งผลลัพธ์กลับมาในรูปแบบ JSON Object นี้เท่านั้น (ห้ามมีคำนำหรือมาร์กดาวน์ใดๆ):
{
  "headline": "พาดหัวสั้นมาก ไม่เกิน 2 บรรทัด\\nแบ่งด้วยเครื่องหมายนี้",
  "script": "บทสคริปต์สำหรับพูดเพียวๆ ไร้วงเล็บ ไร้เครื่องหมายขัดจังหวะการอ่าน"
}${brainContext}${seriesContext}`;

      const userPrompt = `เขียนบทตามหัวข้อ: "${targetTopic}" ด้วยสไตล์การเล่าเรื่องแบบ: "${selectedStyle.name}" (${selectedStyle.description}) ตัวอย่างเช่น: "${selectedStyle.example}"`;

      const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, true);
      if (!aiResponse) throw new Error('AI ส่งบทสคริปต์ว่างกลับมา');

      const cleanJson = aiResponse.substring(
        aiResponse.indexOf('{'),
        aiResponse.lastIndexOf('}') + 1
      );
      const parsed = safeParseJSON(cleanJson);
      
      addLog(`เจนสคริปต์และพาดหัวสำเร็จสำหรับหัวข้อ: ${targetTopic}`, 'success');
      return {
        script: parsed.script,
        headline: parsed.headline
      };

    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดในการสร้างบทสคริปต์: ${e.message}`, 'error');
      return null;
    }
  };

  // Wrapper for manual single generation button
  const triggerManualScriptGen = async () => {
    setIsGeneratingScript(true);
    setIsGeneratingHeadline(true);
    
    // Generate a fresh unique ID for this new script
    const newId = `hist-${Date.now()}`;
    setLoadedHistoryId(newId);
    
    const result = await handleGenerateScript(topic, selectedStyleId);
    if (result) {
      setScript(result.script);
      setHeadline(result.headline);
      saveToHistory({
        id: newId,
        topic: topic,
        headline: result.headline,
        script: result.script
      });
    } else {
      setLoadedHistoryId(null);
    }
    setIsGeneratingScript(false);
    setIsGeneratingHeadline(false);
  };

  // Manual headline generation helper
  const handleGenerateHeadlineOnly = async () => {
    const apiKey = getActiveOpenRouterKey();
    if (!apiKey || !script) return;
    setIsGeneratingHeadline(true);
    try {
      const systemPrompt = `คุณคือครีเอเตอร์คลิปสั้นผู้เชี่ยวชาญการคิดพาดหัวคลิป (Headline Banner) ภาษาไทย แปะบนแถบหัววิดีโอเพื่อหยุดนิ้วคนดู หน้าที่ของคุณคือเสนอพาดหัวสั้นกระชับมากๆ โดนใจ 1 ประโยค
* กฎเหล็ก: พาดหัวต้องมีไม่เกิน 2 บรรทัด และไม่เกิน 8 คำ (ห้ามเกิน 2 บรรทัดเด็ดขาด!)
* ต้องแบ่งบรรทัดด้วย \\n ให้สวยงาม ห้ามหักครึ่งคำเด็ดขาด
* ตัวอย่างพาดหัว 2 บรรทัดที่สวยงาม:
  "เคล็ดลับโบราณ\\nเปลี่ยนขี้เกียจเป็นเศรษฐี!"
  "กฎ 3 ข้อ\\nรวยเร็วขึ้น 10 เท่า"
  "พระเครื่องแตก\\nลางร้ายจริงหรือ?"

ส่งกลับมาเฉพาะพาดหัวตรงๆ (สั้นมาก ไม่เกิน 2 บรรทัด มีเครื่องหมาย \\n แบ่งบรรทัดให้เรียบร้อย) ไม่มีคำอธิบายใดๆ ทั้งสิ้น`;
      
      const userPrompt = `คิดพาดหัวคลิปจากบทพูดนี้:\n"${script}"`;

      const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, false);
      const txt = aiResponse?.replace(/["']/g, '')?.trim();
      if (txt) {
        setHeadline(txt);
        addLog(`สร้างพาดหัวใหม่สำเร็จ: ${txt}`, 'success');
      }
    } catch (e: any) {
      addLog(`เออเร่อสร้างพาดหัว: ${e.message}`, 'error');
    } finally {
      setIsGeneratingHeadline(false);
    }
  };

  // --- Voice Generator (Supports both Mac OS offline and Kie.ai Premium online) ---
  const handleGenerateVoice = async (speechText: string, selectedVoice: string): Promise<{ audioUrl: string; duration: number } | null> => {
    setIsGeneratingVoice(true);

    if (selectedVoice.startsWith('mac_')) {
      const vName = selectedVoice.split('_')[1] || 'Kanya';
      addLog(`กำลังเรียก MacOS เอนจินเสียงพากย์สังเคราะห์ (${vName}) ประมวลผลแบบออฟไลน์บนระบบเครื่อง...`, 'info');

      try {
        const url = `${BACKEND_BASE}/api/mac-tts?text=${encodeURIComponent(speechText)}&voice=${encodeURIComponent(vName)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok || data.error) {
          throw new Error(data.error || 'Mac Native TTS Service Failed');
        }

        addLog(`สังเคราะห์เสียงพากย์ออฟไลน์สำเร็จ! ลิงก์เก็บไฟล์ชั่วคราว: ${data.audioUrl}`, 'success');
        return {
          audioUrl: data.audioUrl,
          duration: data.duration
        };

      } catch (e: any) {
        addLog(`สร้างเสียงพากย์ล้มเหลว: ${e.message}`, 'error');
        return null;
      } finally {
        setIsGeneratingVoice(false);
      }
    } else {
      // Premium Kie.ai voice!
      const apiKey = getActiveKieKey();
      if (!apiKey) {
        addLog('เบิกเงินไม่สำเร็จ! กรุณาระบุ Kie.ai API Key ในส่วนตั้งค่าก่อนใช้เสียงพรีเมียม', 'error');
        alert("⚠️ กรุณาระบุ Kie.ai API Key ในส่วนตั้งค่าก่อนใช้เสียงพรีเมียม");
        setIsGeneratingVoice(false);
        return null;
      }

      addLog(`🎙️ กำลังเรียก Kie.ai (ElevenLabs) สังเคราะห์เสียงพากย์พรีเมียม (Model: ${getVoiceDisplayName(selectedVoice)})...`, 'info');
      try {
        const result = await generateAudio({
          text: speechText,
          apiKey,
          voiceId: selectedVoice,
          stability: 0.5,
          onLog: (msg: string, type?: 'info' | 'success' | 'error' | 'batch' | 'warning') => addLog(`[Kie.ai] ${msg}`, type)
        });

        if (result) {
          let finalAudioUrl = result.audioUrl;

          // If it's a remote URL from Kie.ai, download it to Voice_stock
          if (finalAudioUrl.startsWith('http')) {
             addLog(`กำลังบันทึกเสียงพากย์ลงเครื่อง...`, 'info');
             try {
                const saveRes = await fetch(`${BACKEND_BASE}/api/save-audio`, {
                   method: 'POST',
                   headers: { 'Content-Type': 'application/json' },
                   body: JSON.stringify({ 
                     url: finalAudioUrl, 
                     fileName: `kie-voice-${Date.now()}`, 
                     prompt: speechText.substring(0, 50),
                     folder: 'Voice_stock'
                   })
                });
                const saveData = await saveRes.json();
                if (saveRes.ok && saveData.url) {
                    finalAudioUrl = saveData.url;
                    addLog(`✅ บันทึกเสียงพากย์ลง Voice_stock สำเร็จ!`, 'success');
                    if (saveData.duration) {
                        result.duration = saveData.duration;
                    }
                }
             } catch(e: any) {
                addLog(`⚠️ ดาวน์โหลดไฟล์ล้มเหลว (ใช้ลิงก์ออนไลน์แทน): ${e.message}`, 'error');
             }
          }

          return {
            audioUrl: finalAudioUrl,
            duration: result.duration
          };
        } else {
          throw new Error('การสร้างเสียงพากย์ด้วย Kie.ai ล้มเหลว');
        }
      } catch (e: any) {
        addLog(`สร้างเสียงพากย์พรีเมียมล้มเหลว: ${e.message}`, 'error');
        return null;
      } finally {
        setIsGeneratingVoice(false);
      }
    }
  };

  // Wrapper for manual audio button
  const triggerManualVoiceGen = async () => {
    if (!script) return alert('กรุณาสร้างหรือเขียนบทพูดก่อนเจนเสียง');
    const validVoice = resolveValidVoiceId(voiceId);
    const result = await handleGenerateVoice(script, validVoice);
    if (result) {
      setAudioUrl(result.audioUrl);
      setAudioDuration(result.duration);
      
      // Save/update this script/voice in history, using loadedHistoryId if available!
      saveToHistory({
        id: loadedHistoryId || undefined,
        topic: topic || 'กำหนดเอง (Manual Input)',
        headline: headline,
        script: script,
        voiceId: voiceId,
        audioUrl: result.audioUrl,
        duration: result.duration
      });
      
      // Automatically generate timed subtitle segments upon receiving voice
      triggerAutoSubtiming(script, result.duration, result.audioUrl);
    }
  };

  // --- Helper: Fallback text chunk splitter ---
  const segmentTextFallback = (cleanText: string, isThai: boolean): string[] => {
    let chunks: string[] = [];
    if (isThai) {
      // Split Thai text by common punctuation or natural spaces
      const parts = cleanText.split(/[\s,，。]+/);
      parts.forEach(part => {
        if (part.length <= 25) {
          if (part.trim()) chunks.push(part.trim());
        } else {
          // Subdivide long Thai blocks into beautiful chunks of ~20 characters
          let index = 0;
          while (index < part.length) {
            const sub = part.slice(index, index + 20);
            if (sub.trim()) chunks.push(sub.trim());
            index += 20;
          }
        }
      });
    } else {
      // English proportional space builder based on word limits
      const words = cleanText.split(/\s+/).filter(Boolean);
      let currentChunk: string[] = [];
      words.forEach(word => {
        currentChunk.push(word);
        if (currentChunk.length >= maxWords) {
          chunks.push(currentChunk.join(' '));
          currentChunk = [];
        }
      });
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
      }
    }
    return chunks;
  };

  // --- Helper: Proportional timing calculator ---
  const calculateProportionalSegments = (chunks: string[], totalDuration: number) => {
    const totalChars = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    let accumulatedTime = 0;

    return chunks.map((chunk, index) => {
      const proportion = totalChars > 0 ? chunk.length / totalChars : 0;
      const segDuration = proportion * totalDuration;
      const start = accumulatedTime;
      const end = start + segDuration;
      accumulatedTime = end;

      return {
        index: index + 1,
        text: chunk,
        start,
        end
      };
    });
  };

  // --- AI-Predicted Subtitle & Timestamp Segmenter ---
  const generateSrtSegmentsAsync = async (
    text: string,
    duration: number,
    audioUrl?: string
  ): Promise<Array<{ index: number; text: string; start: number; end: number }>> => {
    const cleanText = text.replace(/\([^)]*\)/g, '').replace(/\[[^\]]*\]/g, '').trim();
    const isThai = /[\u0e00-\u0e7f]/.test(cleanText);
    const apiKey = getActiveOpenRouterKey();

    // Layer 1 & 2: Local Whisper STT (if audioUrl is provided)
    if (audioUrl) {
      addLog('กำลังวิเคราะห์เสียงพากย์ด้วยเครื่องถอดรหัสเสียง AI (Local Whisper STT) เพื่อหาจังหวะพูดเป๊ะๆ...', 'info');
      try {
        const whisperRes = await fetch(`${BACKEND_BASE}/api/generate-whisper-subtitles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl, scriptText: cleanText })
        });
        const whisperData = await whisperRes.json();
        if (whisperData.success && Array.isArray(whisperData.segments) && whisperData.segments.length > 0) {
          addLog(`Whisper STT สำเร็จ! ถอดรหัสตำแหน่งเสียงพูดได้ ${whisperData.segments.length} ท่อน`, 'success');
          
          // Layer 1: Align Polished Script with Whisper Timestamps using Gemini 2.5 Flash
          if (apiKey) {
            addLog('กำลังให้ AI (Gemini 2.5 Flash) เกลาบทความที่ถอดได้ ให้ตรงกับสคริปต์หลักและแมปจังหวะเวลาเป๊ะๆ...', 'info');
            try {
              const systemPrompt = `คุณคือผู้เชี่ยวชาญด้านระบบซับไตเติ้ลและการจัดตำแหน่งคำ (Forced Alignment Expert)
                      
หน้าที่: นำสคริปต์ต้นฉบับ (Polished Script) มาจัดวางเวลา (start, end) โดยอ้างอิงจังหวะเวลาเสียงพูดจริงจาก Whisper STT อย่างเคร่งครัด

กฎเหล็ก:
1. ข้อความต้องมาจาก Polished Script เท่านั้น ห้ามใช้คำจาก Whisper ที่สะกดผิดเด็ดขาด
2. จังหวะเวลา (start/end) ต้องอ้างอิงจาก Whisper segments โดยตรง ห้ามประมาณเอง
   - จับคู่ข้อความจากสคริปต์กับ Whisper segments ที่ตรงกัน แล้วดึงค่า start/end จาก Whisper มาใช้ตรงๆ
   - ถ้า Whisper segment หนึ่งคลุมข้อความหลายท่อน ให้แบ่ง start/end ตามสัดส่วนจำนวนตัวอักษรภายใน segment นั้น
3. แบ่งท่อนสั้นๆ 10-20 ตัวอักษร เหมาะกับคลิปแนวตั้ง
4. ห้ามแก้ไขข้อความใน Polished Script แม้แต่ตัวเดียว ต้องนำมาครบทุกคำ 100%
5. ท่อนแรกต้อง start ตรงกับ Whisper segment แรกที่ตรงกัน (ไม่จำเป็นต้องเป็น 0.0 ถ้าเสียงยังไม่เริ่มพูด)
   ท่อนสุดท้ายต้อง end ตรงกับ Whisper segment สุดท้ายที่ตรงกัน
6. ห้ามมี gap ว่างระหว่างท่อนที่มีเสียงพูดอยู่ — end ของท่อนก่อนต้อง = start ของท่อนถัดไป (ต่อเนื่องกัน)

JSON Array เท่านั้น:
[{"text": "ท่อนแรก", "start": 0.12, "end": 2.5}, {"text": "ท่อนสอง", "start": 2.5, "end": 5.1}]
ห้ามมีคำอธิบาย มาร์กดาวน์ หรืออักขระพิเศษใดๆ`;

              const userPrompt = `จัดวาง Polished Script ลงบน Whisper timestamps:
- Polished Script: "${cleanText}"
- Whisper STT segments: ${JSON.stringify(whisperData.segments)}
- ความยาวเสียงทั้งหมด: ${duration} วินาที`;

              const alignContent = await callAICompletions(apiKey, systemPrompt, userPrompt, true);
              if (alignContent) {
                const cleanJson = alignContent.substring(
                  alignContent.indexOf('['),
                  alignContent.lastIndexOf(']') + 1
                );
                const parsed = safeParseJSON(cleanJson);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  const formatted = parsed.map((item: any, idx: number) => {
                    const start = parseFloat(item.start);
                    const end = parseFloat(item.end);
                    return {
                      index: idx + 1,
                      text: String(item.text).trim(),
                      start: isNaN(start) ? 0 : start,
                      end: isNaN(end) ? duration : end
                    };
                  });
                  // Validate sequence
                  for (let i = 1; i < formatted.length; i++) {
                    if (formatted[i].start < formatted[i - 1].end) {
                      formatted[i].start = formatted[i - 1].end;
                    }
                    if (formatted[i].end < formatted[i].start) {
                      formatted[i].end = formatted[i].start + 0.5;
                    }
                  }
                  // Cap last segment end to not exceed total duration (but don't extend it)
                  if (formatted.length > 0 && formatted[formatted.length - 1].end > duration) {
                    formatted[formatted.length - 1].end = duration;
                  }
                  addLog(`[Layer 1] จัดจังหวะซับกับเสียงแบบเฟรมต่อเฟรม (Whisper + Gemini Alignment) สำเร็จแล้ว!`, 'success');
                  return formatted;
                }
              }
            } catch (alignErr: any) {
              addLog(`การจัดแนวด้วย Gemini ล้มเหลว: ${alignErr.message} -> สลับไปใช้ผลดิบจาก Whisper`, 'warning');
            }
          }

          // Layer 2: Offline Fallback (Direct Whisper segments)
          addLog('[Layer 2] ใช้ผลลัพธ์จังหวะเวลาและคำพูดโดยตรงจาก Whisper STT', 'info');
          const formatted = whisperData.segments.map((item: any, idx: number) => {
            const start = parseFloat(item.start);
            const end = parseFloat(item.end);
            return {
              index: idx + 1,
              text: String(item.text).trim(),
              start: isNaN(start) ? 0 : start,
              end: isNaN(end) ? duration : end
            };
          });
          // Cap last segment end to not exceed total duration (but don't extend it)
          if (formatted.length > 0 && formatted[formatted.length - 1].end > duration) {
            formatted[formatted.length - 1].end = duration;
          }
          return formatted;
        }
      } catch (whisperErr: any) {
        addLog(`เครื่องมือ Whisper STT ขัดข้อง: ${whisperErr.message} -> สลับไปใช้ระบบทำซับดั้งเดิม`, 'warning');
      }
    }

    // Layer 3: No-Whisper Fallback (Gemini prediction based on text length/pacing)
    if (apiKey) {
      addLog('กำลังส่งบทสคริปต์ให้ AI ช่วยวิเคราะห์แบ่งท่อนและกำหนดจังหวะซับ (Timestamp) ให้ตรงกับเสียงพากย์ธรรมชาติ...', 'info');
      try {
        const systemPrompt = `คุณคือผู้เชี่ยวชาญการตัดคำและประมาณการจังหวะเวลา (Timestamp) ของสคริปต์สำหรับทำซับไตเติ้ลในคลิปวิดีโอสั้น
หน้าที่ของคุณคือแบ่งสคริปต์ที่ให้มาออกเป็นท่อนสั้นๆ และกำหนดเวลาเริ่มต้น (start) และเวลาสิ้นสุด (end) ของแต่ละท่อนให้สอดคล้องกับจังหวะการออกเสียงตามธรรมชาติและความยาวเสียงพากย์ทั้งหมด ${duration} วินาที

กฎที่สำคัญที่สุด (MUST FOLLOW RULES):
1. ห้ามตัดคำตรงกลางคำหรือครึ่งๆ กลางๆ เด็ดขาด (เช่น คำว่า "ความพยายาม" ห้ามตัดเป็น "ความพยา" และ "ยาม")
2. ความยาวแต่ละท่อนควรสั้นและกระชับ เหมาะกับการแสดงซับไตเติ้ลในคลิปสั้นแนวตั้ง (ประมาณ 12 - 25 ตัวอักษร)
3. ให้แบ่งตามจังหวะเว้นวรรคและการเว้นจังหวะหายใจ/พูด ตามเสียงธรรมชาติของมนุษย์
4. ห้ามเปลี่ยนคำหรือแก้ไขเนื้อหาใดๆ ในสคริปต์ดั้งเดิมแม้แต่คำเดียว ต้องนำข้อความทั้งหมดจากสคริปต์มาเรียงต่อกันเป็นท่อนๆ ให้ครบถ้วน 100%
5. ต้องระบุเวลาเริ่มต้น (start) และเวลาสิ้นสุด (end) ของแต่ละท่อนในหน่วยวินาที (ทศนิยม):
   - ท่อนแรกสุดต้องเริ่มต้นที่ start: 0.0
   - ท่อนสุดท้ายต้องสิ้นสุดที่ end: ${duration} (ตรงกับความยาวคลิปเสียงจริงพอดี)
   - เวลาเริ่มต้นของท่อนใดๆ ต้องไม่น้อยกว่าเวลาสิ้นสุดของท่อนก่อนหน้า (start ของท่อนที่ n ต้องมีค่าเท่ากับหรือมากกว่า end ของท่อนที่ n-1)
   - เวลาต้องเพิ่มขึ้นอย่างสอดคล้องตามลำดับความยาวของประโยคเมื่อออกเสียงจริง
6. ส่งผลลัพธ์กลับมาในรูปแบบ JSON Array ของ Object เท่านั้น เช่น:
[
  {"text": "ข้อความท่อนที่หนึ่ง", "start": 0.0, "end": 2.5},
  {"text": "ข้อความท่อนที่สองที่พูดต่อกัน", "start": 2.5, "end": 5.1}
]
ห้ามมีคำอธิบาย มาร์กดาวน์ หรืออักขระพิเศษใดๆ นอกเหนือจาก JSON Array ดังกล่าว`;

        const userPrompt = `กรุณาประมวลผลสคริปต์นี้ โดยอ้างอิงความยาวรวมทั้งหมด ${duration} วินาที:\n"${cleanText}"`;

        const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, true);
        if (!aiResponse) throw new Error('AI ส่งผลลัพธ์ว่างกลับมา');

        const cleanJson = aiResponse.substring(
          aiResponse.indexOf('['),
          aiResponse.lastIndexOf(']') + 1
        );
        const parsed = safeParseJSON(cleanJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = parsed[0];
          if (typeof firstItem === 'object' && firstItem !== null && 'text' in firstItem) {
            const formatted = parsed.map((item: any, idx: number) => {
              const start = parseFloat(item.start);
              const end = parseFloat(item.end);
              return {
                index: idx + 1,
                text: String(item.text).trim(),
                start: isNaN(start) ? 0 : start,
                end: isNaN(end) ? duration : end
              };
            });
            
            // Validate sequence order and scale adjustments
            for (let i = 1; i < formatted.length; i++) {
              if (formatted[i].start < formatted[i - 1].end) {
                // Ensure no backwards overlaps
                formatted[i].start = formatted[i - 1].end;
              }
              if (formatted[i].end < formatted[i].start) {
                formatted[i].end = formatted[i].start + 0.5;
              }
            }

            // Adjust final chunk to match exactly total duration
            if (formatted.length > 0) {
              formatted[formatted.length - 1].end = duration;
            }

            addLog(`AI คำนวณความเร็วและจังหวะซับสำเร็จแล้ว! ได้จำนวนทั้งสิ้น ${formatted.length} ท่อน`, 'success');
            return formatted;
          } else if (typeof firstItem === 'string') {
            addLog('AI ส่งเพียงอาร์เรย์ข้อความไม่มีข้อมูลเวลา → กำลังสลับไปคำนวณจังหวะสถิติตามสัดส่วน...', 'warning');
            return calculateProportionalSegments(parsed, duration);
          }
        }
        throw new Error('ผลลัพธ์จาก AI ไม่เป็นรูปแบบออบเจกต์โครงสร้างข้อมูลจังหวะเวลาที่ถูกต้อง');
      } catch (e: any) {
        addLog(`คำนวณโดย AI ขัดข้อง: ${e.message} → กำลังสลับไปใช้ระบบคำนวณแบบสถิติสำรอง (Fallback)...`, 'error');
      }
    } else {
      addLog('ไม่พบ API Key สำหรับ OpenRouter → กำลังสลับไปใช้ระบบคำนวณแบบสถิติสำรอง (Fallback)...', 'warning');
    }

    // Layer 4: Proportional Fallback
    const chunks = segmentTextFallback(cleanText, isThai);
    return calculateProportionalSegments(chunks, duration);
  };

  // --- Subtitles Segment Builder Trigger (Call Unified Async Generator) ---
  const triggerAutoSubtiming = async (text: string, duration: number, audioUrl?: string) => {
    addLog('กำลังคำนวณและเกลาจังหวะตัดซับไตเติ้ลให้ตรงกับเสียงพากย์แบบอัจฉริยะ...', 'info');
    
    try {
      const segments = await generateSrtSegmentsAsync(text, duration, audioUrl);
      setSrtSegments(segments);
      
      const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };

      const srt = segments.map(seg => {
        return `${seg.index}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n`;
      }).join('\n');

      setSrtContent(srt);
      addLog(`สร้างและตัดคำบรรยายภาษาไทยสำเร็จ จำนวนทั้งสิ้น ${segments.length} ท่อน!`, 'success');

      // Auto save the computed timed subtitles into the history record
      saveToHistory({
        id: loadedHistoryId || undefined,
        topic: topic || 'กำหนดเอง (Manual Input)',
        headline: headline,
        script: text,
        voiceId: voiceId,
        audioUrl: audioUrl,
        duration: duration,
        srtSegments: segments,
        srtContent: srt
      });
    } catch (e: any) {
      addLog(`ประมวลผลซับไตเติ้ลผิดพลาด: ${e.message}`, 'error');
    }
  };

  // File Picker Helpers
  const handleSelectFolder = async (kind: 'source' | 'output' | 'bgmFolder') => {
    try {
      const prompt = 
        kind === 'source' ? 'เลือกโฟลเดอร์สำหรับเก็บคลิป Footage' : 
        kind === 'output' ? 'เลือกโฟลเดอร์สำหรับเซฟวิดีโอผลลัพธ์' : 
        'เลือกโฟลเดอร์ BGM สำหรับสุ่มเพลงประกอบ';
      const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.success && data.dir) {
        if (kind === 'source') {
          setSourceFolder(data.dir);
          addLog(`เลือกโฟลเดอร์ต้นทางสำเร็จ: ${data.dir}`, 'success');
        } else if (kind === 'output') {
          setOutputFolder(data.dir);
          addLog(`เลือกโฟลเดอร์ปลายทางสำเร็จ: ${data.dir}`, 'success');
        } else if (kind === 'bgmFolder') {
          setBgmFile(data.dir);
          addLog(`เลือกโฟลเดอร์ BGM สำเร็จ: ${data.dir}`, 'success');
        }
      }
    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดในการเปิดหน้าต่างเลือกโฟลเดอร์: ${e.message}`, 'error');
    }
  };

  const handleSelectBgm = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/pick-file`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'เลือกไฟล์เพลงดนตรีประกอบ BGM' })
      });
      const data = await res.json();
      if (data.success && data.file) {
        setBgmFile(data.file);
        addLog(`เลือกไฟล์เพลง BGM สำเร็จ: ${data.file}`, 'success');
      }
    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดในการเลือกไฟล์เพลง BGM: ${e.message}`, 'error');
    }
  };

  const resolveBgmFileRandomly = async (bgmPath: string): Promise<string> => {
    if (!bgmPath) return '';
    
    // If it's already a single audio file path, return it directly!
    const lower = bgmPath.toLowerCase().trim();
    if (lower.endsWith('.mp3') || lower.endsWith('.wav') || lower.endsWith('.m4a') || lower.endsWith('.aac') || lower.endsWith('.ogg')) {
      return bgmPath;
    }
    
    addLog(`กำลังตรวจสอบและประมวลผลเพลง BGM: "${bgmPath}"...`, 'info');
    
    // Command to check if it's a directory and list its audio files
    const escapedPath = bgmPath.replace(/"/g, '\\"');
    const cmd = `if [ -d "${escapedPath}" ]; then find "${escapedPath}" -type f \\( -name "*.mp3" -o -name "*.wav" -o -name "*.m4a" -o -name "*.aac" -o -name "*.ogg" \\); else echo "NOT_DIR"; fi`;
    
    try {
      const res = await fetch(`${BACKEND_BASE}/api/run-bash-script`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: cmd })
      });
      
      if (!res.ok) {
        addLog('ไม่สามารถตรวจสอบพาธ BGM ผ่านรีโมตได้ ใช้พาธเดิม', 'info');
        return bgmPath;
      }
      
      if (!res.body) return bgmPath;
      
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const foundFiles: string[] = [];
      let isNotDirectory = false;
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const payload = JSON.parse(line.slice(6));
            if (payload.type === 'log') {
              const text = payload.text.trim();
              if (text === 'NOT_DIR') {
                isNotDirectory = true;
              } else if (text && text !== 'NOT_DIR') {
                foundFiles.push(text);
              }
            }
          } catch {}
        }
      }
      
      if (isNotDirectory) {
        addLog('พาธ BGM เป็นไฟล์เดี่ยว จะใช้ไฟล์นี้โดยตรง', 'info');
        return bgmPath;
      }
      
      if (foundFiles.length === 0) {
        addLog(`⚠️ ไม่พบไฟล์เสียงเพลงประกอบในโฟลเดอร์ "${bgmPath}" โปรดตรวจสอบว่ามีไฟล์ .mp3 หรือ .wav หรือไม่`, 'error');
        return bgmPath;
      }
      
      // Pick random file
      const randomIndex = Math.floor(Math.random() * foundFiles.length);
      const chosenBgm = foundFiles[randomIndex];
      addLog(`🎲 สุ่มได้เพลงประกอบ: "...${chosenBgm.slice(-35)}" จากทั้งหมด ${foundFiles.length} เพลง`, 'success');
      return chosenBgm;
      
    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดขณะสุ่ม BGM: ${e.message}`, 'error');
      return bgmPath;
    }
  };

  const handleTrainInlineBrain = async () => {
    if (!inlineBrainName.trim()) return alert('กรุณาตั้งชื่อสมองเพจก่อนครับบอส!');
    if (!inlineBrainPasteText.trim()) return alert('กรุณาวางตัวอย่างโพสต์/บทความสคริปต์ที่ต้องการให้แกะสไตล์!');
    
    const apiKey = getActiveOpenRouterKey();
    if (!apiKey) {
      alert('กรุณาตั้งค่า OpenRouter API Key ในกล่องเมนูด้านบนก่อนครับบอส!');
      return;
    }

    setIsAnalyzingInlineBrain(true);
    addLog(`กำลังเริ่มแกะรหัสลายเซ็นภาษาสำหรับสมองเพจ: "${inlineBrainName}"...`, 'info');

    try {
      const examplesText = inlineBrainPasteText.trim();
      const prompt = `You are an expert AI Prompt Engineer and a native Thai Copywriter. The user will provide reference texts or post examples from a Thai page below.
Your task is to DEEPLY ANALYZE these examples and write a comprehensive "System Prompt" (Role/Act As...) for an LLM so that the LLM can generate high-quality short-video script content in this EXACT SAME style whenever requested.

**CRITICAL RULE FOR THAI COPYWRITING:** The resulting System Prompt MUST strictly instruct the AI to write like a REAL HUMAN. It must prohibit "AI-like" patterns such as being overly polite, too poetic, using cliché transitions (e.g., "อย่างไรก็ตาม", "ดังนั้น", "ทว่า"), or summarizing at the end. The tone must be natural, engaging, and directly matched to the provided examples.

Please strictly use the following structure for your System Prompt output (output in Thai or English is fine, but the instructions to the AI must be crystal clear):
Role: [Define the specific role/persona]
Tone & Voice: [Deep analysis of the tone: e.g., sarcastic, inspiring, casual, professional. How does it sound?]
Vocabulary & Phrasing: [What specific words are used? Are they slang, formal, or emotional? How are sentences structured (short vs long)?]
Post Structure: [Outline the sections of the script/caption. Are there emojis? How are line breaks used?]
Strict Rules (Anti-AI Clichés): [List 3-5 negative constraints. E.g., "Do NOT sound like a robot", "Do NOT use formal concluding sentences"]

REFERENCE TEXTS:
"""
${examplesText}
"""

Instructions for you:
1. Output ONLY the raw System Prompt text.
2. Do not include conversational filler like "Here is the prompt" or "Understood".`;

      let content = '';
      const models = ['google/gemini-2.5-flash', 'google/gemini-2.5-flash:free'];
      let lastError = null;
      for (const model of models) {
        try {
          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model,
              messages: [{ role: 'user', content: prompt }]
            })
          });
          const data = await res.json();
          if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
          const txt = data.choices?.[0]?.message?.content;
          if (txt) {
            content = txt.trim().replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();
            break;
          }
        } catch (err) {
          lastError = err;
        }
      }
      if (!content) throw lastError || new Error('Failed to generate brain content');

      const newBrain = {
        id: Date.now().toString(),
        name: inlineBrainName.trim(),
        content: content,
        timestamp: new Date().toISOString(),
      };

      setSavedBrains(prev => {
        const updated = [...prev];
        const idx = updated.findIndex(b => b.name === newBrain.name);
        if (idx >= 0) updated[idx] = newBrain; else updated.push(newBrain);
        
        // Save to localStorage & Backend
        localStorage.setItem('system_prompts_brain', JSON.stringify(updated));
        fetch(`${BACKEND_BASE}/api/save-app-data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'brains', data: updated })
        }).catch(console.error);

        return updated;
      });

      setSelectedBrainId(newBrain.id);
      setInlineBrainName('');
      setInlineBrainPasteText('');
      addLog(`🎉 สมองชุดคำพูด "${newBrain.name}" ถูกสร้างและบันทึกลงระบบสำเร็จแล้ว! พร้อมใช้งานทันที`, 'success');
      alert(`✅ บันทึกสมอง "${newBrain.name}" สำเร็จ!`);

    } catch (e: any) {
      addLog(`ล้มเหลวในการแกะลายเซ็นภาษา: ${e.message}`, 'error');
      alert(`ล้มเหลว: ${e.message}`);
    } finally {
      setIsAnalyzingInlineBrain(false);
    }
  };

  // Drag and Drop Drag handlers mapping preview frame coordinates directly to 1080x1920 viewport pixels
  const handleHeadlineDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      let newY = clientY - rect.top;
      // boundary limit
      newY = Math.max(15, Math.min(rect.height - 120, newY));
      setHeadlineY(Math.round(newY));
    };
    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  const handleSubtitleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const handleMove = (ev: MouseEvent | TouchEvent) => {
      const clientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
      let newMargin = rect.bottom - clientY;
      // boundary limits from bottom
      newMargin = Math.max(15, Math.min(rect.height - 150, newMargin));
      setSubtitleMarginV(Math.round(newMargin));
    };
    const handleEnd = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  // Convert visual coordinates dynamically to FFMPEG 1080x1920 layout system (Scale multiplier: 4.0x)
  // preview dimensions are: 270x480 -> 1080x1920 (exactly 4x)
  const getRenderCoords = () => {
    return {
      headlineY: Math.round(headlineY * 4.0),
      subtitleMarginV: Math.round(subtitleMarginV * 4.0),
    };
  };

  // --- Trigger Single Video Assembly and Render ---
  const handleRenderSingleVideo = async (
    targetTopic: string,
    voicePath: string,
    duration: number,
    subContent: string,
    hlText: string,
    overrideBgmFile?: string,
    overrideBackgroundVideoPath?: string,
    newsPayload?: NewsPayload
  ): Promise<string | null> => {
    // 1. Build and concatenate background clips matching exactly the voice duration
    let assembledVoiceoverVideo: string | null = overrideBackgroundVideoPath || null;

    // Build news slideshow B-Roll if it has newsPayload and no override video
    if (!assembledVoiceoverVideo && newsPayload && newsPayload.images && newsPayload.images.length > 0) {
      addLog(`🖼️ [Render] กำลังสร้างภาพประกอบข่าว (Slideshow) สำหรับหัวข้อ: "${targetTopic}"...`, 'info');
      try {
        const dlRes = await fetch(`${BACKEND_BASE}/api/news/download-images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            images: newsPayload.images, 
            articleId: `render_${Date.now()}` 
          }),
        });
        const dlData = await dlRes.json();
        if (dlData.success && dlData.localPaths?.length > 0) {
          const slideshowRes = await fetch(`${BACKEND_BASE}/api/news/build-image-slideshow`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imagePaths: dlData.localPaths,
              targetDuration: duration + 1,
              outputPath: `${outputFolder}/.temp_assembly/news_slideshow_render_${Date.now()}.mp4`,
            }),
          });

          if (slideshowRes.body) {
            const reader = slideshowRes.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let slideshowPath = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                try {
                  const payload = JSON.parse(line.slice(6));
                  if (payload.log) addLog(`  [slideshow] ${payload.log}`, 'info');
                  if (payload.success && payload.filePath) slideshowPath = payload.filePath;
                  if (payload.error) throw new Error(payload.error);
                } catch (e: any) {
                  if (e.message && !e.message.includes('JSON')) throw e;
                }
              }
            }
            if (slideshowPath) {
              assembledVoiceoverVideo = slideshowPath;
            }
          }
        }
      } catch (e: any) {
        addLog(`ล้มเหลวในการสร้างภาพข่าว: ${e.message}`, 'error');
        return null;
      }
    }

    if (!assembledVoiceoverVideo) {
      if (newsPayload) {
        alert('❌ ไม่สามารถสร้างวิดีโอสไลด์โชว์ข่าวได้ กรุณาตรวจสอบประวัติการดึงรูปภาพของข่าวดังกล่าวครับบอส');
        return null;
      }

      if (!sourceFolder || !outputFolder) {
        alert('กรุณาเลือกโฟลเดอร์ต้นทางคลิปดิกและโฟลเดอร์บันทึกปลายทางก่อนครับบอส');
        return null;
      }

      addLog('ขั้นตอนที่ 5: สุ่มหยิบฟุตเทจมาต่อให้เข้ากับความยาวคลิปเสียงอัตโนมัติ...', 'info');

      try {
        const response = await fetch(`${BACKEND_BASE}/api/build-random-clip-assembly`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceFolder,
            outputFolder: `${outputFolder}/.temp_assembly`,
            targetSeconds: duration,
            outputCount: 1,
            outputName: `temp_assembled_${Date.now()}`,
            width: 1080,
            height: 1920
          })
        });

        if (!response.body) throw new Error('ไม่พบข้อมูลตอบสนองการสตรีมฟุตเทจ');
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = JSON.parse(line.slice(6));
          if (payload.type === 'log') {
            addLog(`[ffmpeg] ${payload.text}`, 'info');
          } else if (payload.type === 'done' || payload.type === 'plan') {
            if (payload.outputPath) assembledVoiceoverVideo = payload.outputPath;
            if (payload.outputPaths && payload.outputPaths.length > 0) assembledVoiceoverVideo = payload.outputPaths[0];
          } else if (payload.type === 'error') {
            throw new Error(payload.text);
          }
        }
      }
      } catch (e: any) {
        addLog(`ขั้นตอนสุ่มประกอบฉากผิดพลาด: ${e.message}`, 'error');
        return null;
      }
    } // close if(!assembledVoiceoverVideo)

    if (!assembledVoiceoverVideo) {
      addLog('ไม่พบเส้นทางของฟุตเทจที่ประกอบเสร็จชั่วคราว', 'error');
      return null;
    }

    // 2. Mix BGM and overlay subtitles & headliner by calling /api/render-video
    addLog('ขั้นตอนที่ 6: ผสมดนตรีคลอ BGM, ฝังซับและพาดหัวด้วย Visual Render Coordinates...', 'info');

    const renderCoords = getRenderCoords();
    
    // Prepare scene timeline structure for scripts/render.js
    const scenes = [
      {
        imageUrl: assembledVoiceoverVideo,
        audioUrl: voicePath || '',
        duration: duration,
        colorFilter: colorFilter, // inject equivalent FFmpeg filters into B-Roll background
      }
    ];

    try {
      const payload = {
        topic: targetTopic,
        scenes,
        colorFilter: colorFilter, // inject into job configuration as well
        subtitles: subContent,
        subtitleStyle: {
          fontName: subStyle.fontName,
          fontSize: subStyle.fontSize,
          marginV: renderCoords.subtitleMarginV,
          borderStyle: subStyle.borderStyle,
          outlineThickness: subStyle.outlineThickness,
          shadowThickness: subStyle.shadowThickness,
          primaryColor: subStyle.primaryColor,
          outlineColor: subStyle.outlineColor,
          shadowColor: subStyle.shadowColor
        },
        headline: hlText,
        headlineStyle: {
          fontName: headlineFontName,
          fontSize: headlineFontSize,
          fontColor: headlineFontColor,
          boxColor: headlineBoxColor,
          boxOpacity: headlineBoxOpacity,
          y: renderCoords.headlineY,
          paddingX: headlinePaddingX,
          paddingY: headlinePaddingY,
          borderRadius: headlineBorderRadius,
          shadowBlur: headlineShadowBlur,
          shadowColor: headlineShadowColor,
          boxEnabled: headlineBoxEnabled,
          outlineWidth: headlineOutlineWidth,
          outlineColor: headlineOutlineColor,
          lineSpacing: headlineLineSpacing,
        },
        outputPath: outputFolder
      };

      const res = await fetch(`${BACKEND_BASE}/api/render-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || 'การเรนเดอร์ล้มเหลว');
      }

      // Find the compiled path printed in logs or guess final path
      const outLog = resData.logs || '';
      const match = outLog.match(/✅ Output → ([^\n]+)/);
      let finalPath = match ? match[1].trim() : '';

      if (!finalPath) {
        // If not found in match, construct standard output name
        const cleanTopic = targetTopic.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
        finalPath = `${outputFolder}/Render_${cleanTopic}_output.mp4`; // fallback estimation
      }

      // Cleanup the temporary assembled files
      try {
        const delRes = await fetch(`${BACKEND_BASE}/api/delete-assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [assembledVoiceoverVideo] })
        });
        await delRes.json();
      } catch {}

      // Resolve which BGM file to use (randomizer folder picker support)
      const currentBgm = overrideBgmFile !== undefined ? overrideBgmFile : bgmFile;

      // Apply BGM overlay post-processing if BGM is selected
      if (currentBgm && finalPath) {
        addLog('กำลังซ้อนไฟล์ดนตรีประกอบ BGM แบบอัจฉริยะ ด้วยค่าความดังที่กำหนด...', 'info');
        const bgmMixedPath = finalPath.replace('.mp4', '_mixed.mp4');
        
        // Skip voiceover input in amix filter graph if voicePath is empty
        let mixCmd = '';
        if (!voicePath) {
          mixCmd = `ffmpeg -y -i "${finalPath}" -stream_loop -1 -i "${currentBgm}" -filter_complex "[1:a]volume=${bgmVolume}[bgm]" -map 0:v -map "[bgm]" -c:v copy -c:a aac -b:a 128k -ar 44100 -shortest "${bgmMixedPath}"`;
        } else {
          mixCmd = `ffmpeg -y -i "${finalPath}" -stream_loop -1 -i "${currentBgm}" -filter_complex "[1:a]volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -ar 44100 "${bgmMixedPath}"`;
        }
        
        const runRes = await fetch(`${BACKEND_BASE}/api/run-bash-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: mixCmd })
        });
        
        if (!runRes.body) throw new Error('ไม่สามารถเชื่อมต่อระบบประมวลผล BGM ได้');
        const reader = runRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let hasError = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const payload = JSON.parse(line.slice(6));
                if (payload.type === 'log') {
                  addLog(`[BGM Mix] ${payload.text}`, 'info');
                } else if (payload.type === 'error') {
                  hasError = true;
                  addLog(`เกิดข้อผิดพลาดในการผสม BGM: ${payload.text}`, 'error');
                }
              } catch {}
            }
          }
        }
        
        if (runRes.ok && !hasError) {
          // Replace finalPath with mixed path
          try {
            // Delete original unmixed file and rename mixed one to take its place
            const deleteOrig = `rm -f "${finalPath}" && mv "${bgmMixedPath}" "${finalPath}"`;
            const delRes = await fetch(`${BACKEND_BASE}/api/run-bash-script`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ script: deleteOrig })
            });
            if (delRes.body) {
              const delReader = delRes.body.getReader();
              while (true) {
                const { done } = await delReader.read();
                if (done) break;
              }
            }
          } catch {}
        } else {
          throw new Error('การประมวลผลผสม BGM ล้มเหลว');
        }
      }

      addLog(`สร้างและเรนเดอร์วิดีโอแนวตั้งสำเร็จเรียบร้อย! พิกัด: ${finalPath}`, 'success');
      return finalPath;

    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดในการประกอบร่างและฝังเสียงพากย์: ${e.message}`, 'error');
      return null;
    }
  };

  // --- Batch Worker Execution Engine (Step-by-Step Loop with Pause/Resume/Stop) ---
  const handleParseBatchInput = () => {
    const list = batchTopicInput
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0);

    if (list.length === 0) {
      alert('กรุณากรอกหัวข้ออย่างน้อย 1 หัวข้อต่อบรรทัด');
      return;
    }

    const items: BatchItem[] = list.map(t => ({
      topic: t,
      status: 'pending',
    }));

    setBatchItems(items);
    addLog(`เพิ่มรายการเตรียมรันคิวแบบอัตโนมัติ (Batch Queue) สำเร็จ ${items.length} คอนเทนต์!`, 'success');
  };

  const handleAllInOneLaunch = async () => {
    const list = batchTopicInput
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0);

    let itemsToRun = batchItems;

    if (list.length > 0) {
      const parsedItems: BatchItem[] = list.map(t => ({
        topic: t,
        status: 'pending',
      }));
      setBatchItems(parsedItems);
      setBatchTopicInput('');
      itemsToRun = parsedItems;
      addLog(`[ALL-IN-ONE] 📥 นำเข้าหัวข้อใหม่เรียบร้อย เริ่มการประกอบร่างคลิปอัตโนมัติครบวงจรทันที!`, 'success');
    }

    if (itemsToRun.length === 0) {
      alert('⚠️ โปรดระบุหัวข้อในช่องกรอกข้อความ หรือนำเข้าตารางคิวงานเตรียมรันก่อนกดปุ่มนี้ครับบอส');
      return;
    }

    // Dynamic folder validation based on item needs
    const needsSourceFolder = itemsToRun.some(item => !item.newsPayload);
    if (needsSourceFolder && (!sourceFolder || !sourceFolder.trim())) {
      alert('⚠️ โปรดกรอกหรือเลือกโฟลเดอร์ต้นทาง (Footage) ในขั้นตอนที่ 1 ให้เรียบร้อยสำหรับวิดีโอทั่วไปครับบอส');
      return;
    }

    if (!outputFolder || !outputFolder.trim()) {
      alert('⚠️ โปรดกรอกหรือเลือกโฟลเดอร์ผลลัพธ์ (Output) ในขั้นตอนที่ 1 ให้เรียบร้อยก่อนครับบอส');
      return;
    }

    batchStatusRef.current = 'running';
    await executeBatchQueue(itemsToRun);
  };

  const handleGenerateNewsScriptBatch = async (payload: NewsPayload, targetDuration: number): Promise<{ script: string; headline: string } | null> => {
    const targetChars = targetDuration <= 45 ? 400 : targetDuration <= 90 ? 950 : 1650;
    const apiKey = getActiveOpenRouterKey();
    if (!apiKey) throw new Error('กรุณาตั้งค่า OpenRouter API Key');

    const prompt = `เขียน Script สำหรับพากย์คลิปข่าว (เป็นภาษาไทย) จากเนื้อหาข่าวนี้:

หัวข้อ: ${payload.title}
เนื้อหา: ${payload.content?.substring(0, 2000) || 'ไม่มีเนื้อหาเพิ่มเติม'}

ความยาวที่ต้องการ: ประมาณ ${targetChars} ตัวอักษร (${targetDuration} วินาที)

กฎ:
- เขียนเป็นภาษาไทย สไตล์ผู้ประกาศข่าว ชวนติดตาม
- ขึ้นต้นด้วย Hook ที่ดึงความสนใจ
- สรุปประเด็นสำคัญให้ครบ กระชับ
- จบด้วยข้อคิดหรือ Call to Action สั้นๆ
- headline ต้องสั้นมากๆ ไม่เกิน 8 คำ ไม่เกิน 2 บรรทัด (ใช้ \\n แบ่งบรรทัด) เช่น "ข่าวด่วน!\\nมรดกเงินล้านลึกลับ"
- ส่งกลับ JSON: { "script": "...", "headline": "พาดหัวไม่เกิน 2 บรรทัด" }`;

    const aiResponse = await callAICompletions(apiKey, 
      'คุณคือผู้เชี่ยวชาญเขียน Script ข่าวสำหรับวิดีโอสั้น ส่งกลับเฉพาะ JSON ไม่มีข้อความอื่น',
      prompt, true);

    const parsed = safeCleanAndParseJSON(aiResponse);
    if (!parsed || !parsed.script) throw new Error('AI ไม่สามารถเขียน Script ข่าวได้');
    return parsed;
  };

  const executeBatchQueue = async (overrideItems?: BatchItem[]) => {
    const activeItems = overrideItems || batchItems;
    if (activeItems.length === 0) {
      alert('กรุณากรอกและสร้างตารางหัวข้อเตรียมรันก่อนบอส!');
      return;
    }

    if (batchStatus === 'running' && !overrideItems) return;

    setBatchStatus('running');
    batchStatusRef.current = 'running';
    addLog('เริ่มการทำงานของ Batch Pipeline แบบต่อเนื่องอัตโนมัติ...', 'batch');

    // Find the next pending index
    let startIndex = activeItems.findIndex(item => item.status === 'pending' || item.status === 'failed');
    if (startIndex === -1) {
      // If none, restart from 0
      startIndex = 0;
    }

    for (let i = startIndex; i < activeItems.length; i++) {
      // Check for pause/stop signals
      if ((batchStatusRef.current as string) === 'paused') {
        addLog('หยุดคิวชั่วคราว (Paused) กดปุ่มเพื่อดำเนินการรันคิวต่อ...', 'batch');
        break;
      }
      if ((batchStatusRef.current as string) === 'stopped') {
        addLog('ยกเลิกการรันชุดวิดีโออัตโนมัติ (Stopped) เรียบร้อย', 'batch');
        break;
      }

      setCurrentBatchIndex(i);
      updateItemStatus(i, 'scripting');
      const currentItem = activeItems[i];

      addLog(`[${i+1}/${activeItems.length}] เริ่มทำงานหัวข้อ: "${currentItem.topic}"`, 'batch');

      // Step 1: AI Script & Style Generation
      let scriptResult = { headline: currentItem.headline || '', script: currentItem.script || '' };
      if (!scriptResult.script || !scriptResult.headline) {
        let generated: { script: string; headline: string } | null = null;
        
        if (currentItem.newsPayload) {
          addLog(`[${i+1}/${activeItems.length}] 📰 สรุปข่าวหัวข้อ: "${currentItem.topic}"...`, 'info');
          try {
            generated = await handleGenerateNewsScriptBatch(currentItem.newsPayload, newsTargetDuration);
          } catch (e: any) {
            addLog(`ล้มเหลวในการสรุปข่าว: ${e.message}`, 'error');
          }
        } else {
          generated = await handleGenerateScript(currentItem.topic, selectedStyleId);
        }

        if (!generated) {
          updateItemStatus(i, 'failed', 'เขียนบทความล้มเหลว');
          continue;
        }
        scriptResult = generated;
        
        saveToHistory({
          topic: currentItem.topic,
          headline: scriptResult.headline,
          script: scriptResult.script,
          newsPayload: currentItem.newsPayload
        });

        setBatchItems(prev => {
          const next = [...prev];
          next[i].script = scriptResult.script;
          next[i].headline = scriptResult.headline;
          return next;
        });
      } else {
        addLog(`[INFO] ใช้พาดหัวและบทความที่เตรียมไว้ล่วงหน้าแล้ว: "${scriptResult.headline}"`, 'info');
      }

      // Variables to store parameters for rendering
      let currentItemAudioUrl = '';
      let currentItemDuration = 0;
      let currentItemSrtContent = '';

      // --- 🎙️ Regular Voiceover Mode ---
      // Step 2: Speech Synthesis (with retry and fallback)
      updateItemStatus(i, 'voicing');
      const batchVoice = resolveValidVoiceId(voiceId);
      let voiceResult = await handleGenerateVoice(scriptResult.script, batchVoice);
      
      // Retry once with delay if Kie.ai failed (rate limiting protection)
      if (!voiceResult && !batchVoice.startsWith('mac_')) {
        addLog(`[BATCH] ⏳ Kie.ai ล้มเหลว — รอ 10 วินาทีแล้วลองใหม่อีกครั้ง...`, 'warning');
        await new Promise(res => setTimeout(res, 10000));
        voiceResult = await handleGenerateVoice(scriptResult.script, batchVoice);
      }

      // Final fallback: use Mac TTS if Kie.ai still fails
      if (!voiceResult && !batchVoice.startsWith('mac_')) {
        addLog(`[BATCH] 🔄 Kie.ai ยังล้มเหลว — สลับไปใช้ Mac TTS (Kanya) แทนอัตโนมัติ...`, 'warning');
        voiceResult = await handleGenerateVoice(scriptResult.script, 'mac_Kanya');
      }

      if (!voiceResult) {
        updateItemStatus(i, 'failed', 'สังเคราะห์เสียงพูดผิดพลาด');
        continue;
      }

      saveToHistory({
        topic: currentItem.topic,
        headline: scriptResult.headline,
        script: scriptResult.script,
        voiceId: voiceId,
        audioUrl: voiceResult.audioUrl,
        duration: voiceResult.duration,
        newsPayload: currentItem.newsPayload
      });

      currentItemAudioUrl = voiceResult.audioUrl;
      currentItemDuration = voiceResult.duration;

      setBatchItems(prev => {
        const next = [...prev];
        next[i].audioUrl = voiceResult.audioUrl;
        next[i].duration = voiceResult.duration;
        return next;
      });

      // Step 3: Timed Subtitle Construction
      updateItemStatus(i, 'subtitling');
      const srtSegments = await generateSrtSegmentsAsync(scriptResult.script, voiceResult.duration, voiceResult.audioUrl);
      const formatTime = (sec: number) => {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = Math.floor(sec % 60);
        const ms = Math.floor((sec % 1) * 1000);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
      };
      currentItemSrtContent = srtSegments.map(seg => {
        return `${seg.index}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n`;
      }).join('\n');

      saveToHistory({
        topic: currentItem.topic,
        headline: scriptResult.headline,
        script: scriptResult.script,
        voiceId: voiceId,
        audioUrl: voiceResult.audioUrl,
        duration: voiceResult.duration,
        srtSegments: srtSegments,
        srtContent: currentItemSrtContent,
        newsPayload: currentItem.newsPayload
      });

      setBatchItems(prev => {
        const next = [...prev];
        next[i].srtContent = currentItemSrtContent;
        return next;
      });

      // Step 4: Assembly & Visual Overlays Rendering
      updateItemStatus(i, 'assembling');
      
      let backgroundVideoToUse: string | undefined = undefined;

      // 4.5. Generate News Slideshow (if it's a news item)
      if (currentItem.newsPayload && currentItem.newsPayload.images.length > 0) {
        addLog(`🖼️ กำลังสร้างภาพประกอบข่าว (Slideshow) สำหรับหัวข้อ: "${currentItem.topic}"...`, 'info');
        try {
          const dlRes = await fetch(`${BACKEND_BASE}/api/news/download-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              images: currentItem.newsPayload.images, 
              articleId: `batch_${Date.now()}` 
            }),
          });
          const dlData = await dlRes.json();
          if (dlData.success && dlData.localPaths?.length > 0) {
            const slideshowRes = await fetch(`${BACKEND_BASE}/api/news/build-image-slideshow`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                imagePaths: dlData.localPaths,
                targetDuration: currentItemDuration + 1,
                outputPath: `${outputFolder}/.temp_assembly/news_slideshow_batch_${Date.now()}.mp4`,
              }),
            });

            if (slideshowRes.body) {
              const reader = slideshowRes.body.getReader();
              const decoder = new TextDecoder();
              let buffer = '';
              let slideshowPath = '';

              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');
                buffer = lines.pop() ?? '';
                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue;
                  try {
                    const payload = JSON.parse(line.slice(6));
                    if (payload.log) addLog(`  [slideshow] ${payload.log}`, 'info');
                    if (payload.success && payload.filePath) slideshowPath = payload.filePath;
                    if (payload.error) throw new Error(payload.error);
                  } catch (e: any) {
                    if (e.message && !e.message.includes('JSON')) throw e;
                  }
                }
              }
              if (slideshowPath) {
                backgroundVideoToUse = slideshowPath;
              }
            }
          }
        } catch (e: any) {
          addLog(`ล้มเหลวในการสร้างภาพข่าว: ${e.message}`, 'warning');
        }
      }

      updateItemStatus(i, 'rendering');
      
      // Resolve BGM randomly for each compile if BGM is set to a directory
      const activeBgm = await resolveBgmFileRandomly(bgmFile);

      const renderPath = await handleRenderSingleVideo(
        currentItem.topic,
        currentItemAudioUrl,
        currentItemDuration,
        currentItemSrtContent,
        scriptResult.headline,
        activeBgm,
        backgroundVideoToUse
      );

      if (!renderPath) {
        updateItemStatus(i, 'failed', 'ประกอบร่างและเรนเดอร์ล้มเหลว');
        continue;
      }

      setBatchItems(prev => {
        const next = [...prev];
        next[i].videoUrl = renderPath;
        next[i].status = 'completed';
        return next;
      });

      saveToHistory({
        topic: currentItem.topic,
        headline: scriptResult.headline,
        script: scriptResult.script,
        voiceId: voiceId,
        audioUrl: currentItemAudioUrl,
        duration: currentItemDuration,
        srtContent: currentItemSrtContent,
        videoUrl: renderPath,
        newsPayload: currentItem.newsPayload
      });

      addLog(`✨ สำเร็จ! สร้างคลิปอัตโนมัติหัวข้อ [${currentItem.topic}] เรียบร้อย`, 'success');

      // Cooldown between batch items to prevent API rate limiting
      if (i < activeItems.length - 1) {
        addLog(`[BATCH] ⏳ รอ 3 วินาทีก่อนเริ่มตอนถัดไป...`, 'info');
        await new Promise(res => setTimeout(res, 3000));
      }
    }

    if (batchStatusRef.current === 'running') {
      setBatchStatus('idle');
      addLog('🏁 ทำงานเสร็จสิ้นครบถ้วนทุกคิวในตารางเรียบร้อยแล้วบอส!', 'success');
    }
  };



  const updateItemStatus = (
    index: number,
    status: BatchItem['status'],
    error?: string
  ) => {
    setBatchItems(prev => {
      const next = [...prev];
      next[index].status = status;
      if (error) next[index].error = error;
      return next;
    });
  };

  const handlePauseBatch = () => {
    setBatchStatus('paused');
    addLog('กำลังขอหยุดกระบวนการรันแบบชุดชั่วคราว...', 'batch');
  };

  const handleStopBatch = () => {
    setBatchStatus('stopped');
    addLog('กำลังขอยกเลิกงานชุดทั้งหมด...', 'batch');
  };

  const clearCompletedBatch = () => {
    setBatchItems([]);
    setBatchTopicInput('');
    setCurrentBatchIndex(-1);
    setBatchStatus('idle');
    addLog('เคลียร์ตารางคิวและประวัติเรียบร้อย', 'info');
  };

  // ── News-to-Video Pipeline Handler (NEW) ──
  const addNewsLog = (msg: string) => {
    setNewsStatusLog(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);
  };

  const handleNewsToVideo = async () => {
    if (!newsPayload || newsStatus === 'scripting' || newsStatus === 'rendering') return;
    if (!outputFolder) {
      alert('กรุณาเลือกโฟลเดอร์บันทึกผลลัพธ์ (Output Folder) ก่อนครับ');
      return;
    }

    try {
      // Step 1: Generate news script via AI
      setNewsStatus('scripting');
      addNewsLog('📝 กำลังเขียน Script ข่าว...');

      const durationLabel = newsTargetDuration <= 45 ? 'short' : newsTargetDuration <= 90 ? 'medium' : 'long';
      const targetChars = newsTargetDuration <= 45 ? 400 : newsTargetDuration <= 90 ? 950 : 1650;
      
      const apiKey = getActiveOpenRouterKey();
      if (!apiKey) {
        throw new Error('กรุณาตั้งค่า OpenRouter API Key ก่อนครับ');
      }

      const newsScriptPrompt = `เขียน Script สำหรับพากย์คลิปข่าว (เป็นภาษาไทย) จากเนื้อหาข่าวนี้:

หัวข้อ: ${newsPayload.title}
เนื้อหา: ${newsPayload.content?.substring(0, 2000) || 'ไม่มีเนื้อหาเพิ่มเติม'}

ความยาวที่ต้องการ: ประมาณ ${targetChars} ตัวอักษร (${newsTargetDuration} วินาที)

กฎ:
- เขียนเป็นภาษาไทย สไตล์ผู้ประกาศข่าว ชวนติดตาม
- ขึ้นต้นด้วย Hook ที่ดึงความสนใจ
- สรุปประเด็นสำคัญให้ครบ กระชับ
- จบด้วยข้อคิดหรือ Call to Action สั้นๆ
- headline ต้องสั้นมากๆ ไม่เกิน 8 คำ ไม่เกิน 2 บรรทัด (ใช้ \\n แบ่งบรรทัด) เช่น "ข่าวด่วน!\\nมรดกเงินล้านลึกลับ"
- ส่งกลับ JSON: { "script": "...", "headline": "พาดหัวไม่เกิน 2 บรรทัด" }`;

      const aiResponse = await callAICompletions(apiKey, 
        'คุณคือผู้เชี่ยวชาญเขียน Script ข่าวสำหรับวิดีโอสั้น ส่งกลับเฉพาะ JSON ไม่มีข้อความอื่น',
        newsScriptPrompt, true);

      const parsed = safeCleanAndParseJSON(aiResponse);
      if (!parsed || !parsed.script) {
        throw new Error('AI ไม่สามารถเขียน Script ข่าวได้');
      }

      setNewsScript(parsed.script);
      setNewsHeadline(parsed.headline || newsPayload.headline);
      addNewsLog(`✅ เขียน Script สำเร็จ (${parsed.script.length} ตัวอักษร)`);

      // Step 2: Download images
      setNewsStatus('downloading');
      addNewsLog('📥 กำลังดาวน์โหลดรูปข่าว...');

      const dlRes = await fetch(`${BACKEND_BASE}/api/news/download-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: newsPayload.images,
          articleId: `news_${Date.now()}`
        }),
      });
      const dlData = await dlRes.json();
      
      if (!dlData.success || !dlData.localPaths || dlData.localPaths.length === 0) {
        throw new Error('ดาวน์โหลดรูปข่าวล้มเหลว');
      }
      setNewsLocalImages(dlData.localPaths);
      addNewsLog(`✅ ดาวน์โหลดรูปสำเร็จ ${dlData.localPaths.length} รูป`);

      // Step 3: Generate voice
      setNewsStatus('voicing');
      addNewsLog('🎤 กำลังสร้างเสียงพากย์...');

      const voiceResult = await handleGenerateVoice(parsed.script, voiceId);
      if (!voiceResult) {
        throw new Error('สร้างเสียงพากย์ล้มเหลว');
      }
      addNewsLog(`✅ เสียงพากย์สำเร็จ (${voiceResult.duration.toFixed(1)} วินาที)`);

      // Step 4: Generate subtitles
      setNewsStatus('subtitling');
      addNewsLog('📝 กำลังสร้างซับไตเติ้ล...');

      const subtitleSegments = await generateSrtSegmentsAsync(
        parsed.script, voiceResult.duration, voiceResult.audioUrl
      );
      
      // Build SRT content
      let srtText = '';
      if (subtitleSegments && subtitleSegments.length > 0) {
        srtText = subtitleSegments.map((seg: any, i: number) => 
          `${i + 1}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n`
        ).join('\n');
      }
      addNewsLog(`✅ ซับไตเติ้ลสำเร็จ (${subtitleSegments?.length || 0} ช่วง)`);

      // Step 5: Build image slideshow
      setNewsStatus('building-slideshow');
      addNewsLog('🖼️ กำลังสร้าง slideshow จากรูปข่าว...');

      const slideshowRes = await fetch(`${BACKEND_BASE}/api/news/build-image-slideshow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imagePaths: dlData.localPaths,
          targetDuration: voiceResult.duration + 1,
          outputPath: `${outputFolder}/.temp_assembly/news_slideshow_${Date.now()}.mp4`,
        }),
      });

      // Read SSE stream for slideshow progress
      let slideshowPath = '';
      if (slideshowRes.body) {
        const reader = slideshowRes.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.log) addNewsLog(`  [slideshow] ${payload.log}`);
              if (payload.success && payload.filePath) slideshowPath = payload.filePath;
              if (payload.error) throw new Error(payload.error);
            } catch (e: any) {
              if (e.message && !e.message.includes('JSON')) throw e;
            }
          }
        }
      }

      if (!slideshowPath) {
        throw new Error('สร้าง slideshow ล้มเหลว');
      }
      addNewsLog(`✅ สร้าง slideshow สำเร็จ`);

      // Step 6: Render final video (using render-video API)
      setNewsStatus('rendering');
      addNewsLog('🎬 กำลัง render วิดีโอข่าว...');

      const renderCoords = getRenderCoords();
      const renderPayload = {
        topic: parsed.headline || newsPayload.title,
        scenes: [{
          imageUrl: slideshowPath,
          audioUrl: voiceResult.audioUrl,
          duration: voiceResult.duration,
          colorFilter: 'none',
        }],
        subtitles: srtText,
        subtitleStyle: {
          fontName: subStyle.fontName,
          fontSize: subStyle.fontSize,
          marginV: renderCoords.subtitleMarginV,
          borderStyle: subStyle.borderStyle,
          outlineThickness: subStyle.outlineThickness,
          shadowThickness: subStyle.shadowThickness,
          primaryColor: subStyle.primaryColor,
          outlineColor: subStyle.outlineColor,
          shadowColor: subStyle.shadowColor,
        },
        headline: wrapText(parsed.headline || newsPayload.title, 22, 2),
        headlineStyle: {
          fontName: headlineFontName,
          fontSize: headlineFontSize,
          fontColor: headlineFontColor,
          boxColor: headlineBoxColor,
          boxOpacity: headlineBoxOpacity,
          y: renderCoords.headlineY,
          paddingX: headlinePaddingX,
          paddingY: headlinePaddingY,
          borderRadius: headlineBorderRadius,
          shadowBlur: headlineShadowBlur,
          shadowColor: headlineShadowColor,
          boxEnabled: headlineBoxEnabled,
          outlineWidth: headlineOutlineWidth,
          outlineColor: headlineOutlineColor,
          lineSpacing: headlineLineSpacing,
        },
        outputPath: outputFolder,
      };

      const renderRes = await fetch(`${BACKEND_BASE}/api/render-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renderPayload),
      });
      const renderData = await renderRes.json();

      if (!renderRes.ok) {
        throw new Error(renderData.error || 'Render ล้มเหลว');
      }

      const outLog = renderData.logs || '';
      const match = outLog.match(/✅ Output → ([^\n]+)/);
      let finalPath = match ? match[1].trim() : '';
      if (!finalPath) {
        const cleanTitle = (parsed.headline || newsPayload.title).replace(/[^a-zA-Z0-9ก-๙]/g, '_').substring(0, 50);
        finalPath = `${outputFolder}/Render_${cleanTitle}_output.mp4`;
      }

      // BGM overlay if set
      if (bgmFile && finalPath) {
        addNewsLog('🎵 กำลังซ้อน BGM...');
        const bgmMixedPath = finalPath.replace('.mp4', '_mixed.mp4');
        const mixCmd = `ffmpeg -y -i "${finalPath}" -stream_loop -1 -i "${bgmFile}" -filter_complex "[1:a]volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -ar 44100 "${bgmMixedPath}"`;
        const runRes = await fetch(`${BACKEND_BASE}/api/run-bash-script`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: mixCmd }),
        });
        if (runRes.body) {
          const reader = runRes.body.getReader();
          while (true) {
            const { done } = await reader.read();
            if (done) break;
          }
        }
        // Replace with mixed version
        try {
          await fetch(`${BACKEND_BASE}/api/run-bash-script`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ script: `rm -f "${finalPath}" && mv "${bgmMixedPath}" "${finalPath}"` }),
          });
        } catch {}
      }

      // Cleanup slideshow temp file
      try {
        await fetch(`${BACKEND_BASE}/api/delete-assets`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: [slideshowPath] }),
        });
      } catch {}

      setNewsStatus('done');
      setNewsResultPath(finalPath);
      addNewsLog(`🎉 สร้างคลิปข่าวเสร็จสมบูรณ์! → ${finalPath}`);

    } catch (err: any) {
      setNewsStatus('error');
      addNewsLog(`❌ เกิดข้อผิดพลาด: ${err.message || String(err)}`);
    }
  };

  const tryRecoverNewsPayload = async (item: any): Promise<NewsPayload | null> => {
    if (item.newsPayload) return item.newsPayload;
    try {
      addLog(`🔍 [News Recovery] กำลังพยายามกู้คืนภาพประกอบข่าวจากหัวข้อ: "${item.topic}"...`, 'info');
      
      const words = item.topic
        .replace(/[^\u0E00-\u0E7Fa-zA-Z0-9\s-]/g, ' ')
        .split(/\s+/)
        .filter((w: string) => w.length > 2);

      const searchRes = await fetch(`${BACKEND_BASE}/api/vault/contents?source_type=rss`);
      if (searchRes.ok) {
        const rows = await searchRes.json();
        if (Array.isArray(rows)) {
          let bestMatch: any = null;
          let maxOverlap = 0;
          
          for (const row of rows) {
            let overlap = 0;
            const textToSearch = (row.title + ' ' + (row.raw_content || '')).toLowerCase();
            for (const word of words) {
              if (textToSearch.includes(word.toLowerCase())) {
                overlap++;
              }
            }
            
            if (item.topic.includes('คมนาคม') && row.title.includes('คมนาคม')) overlap += 5;
            if (item.topic.includes('มรดก') && (row.title.includes('เมีย') || row.title.includes('เงิน') || row.title.includes('ล้าน') || row.title.includes('กล่อง') || row.title.includes('งานศพ') || row.title.includes('พ่อเฒ่า'))) overlap += 5;

            if (overlap > maxOverlap && overlap >= 2) {
              maxOverlap = overlap;
              bestMatch = row;
            }
          }

          if (bestMatch && bestMatch.source_url) {
            addLog(`📡 [News Recovery] จับคู่ข่าวต้นทางสำเร็จ: "${bestMatch.title}" (คะแนนความสอดคล้อง: ${maxOverlap}) กำลังดึงรูปประกอบใหม่...`, 'info');
            const scrapeRes = await fetch(`${BACKEND_BASE}/api/news/scrape-images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: bestMatch.source_url })
            });
            if (scrapeRes.ok) {
              const data = await scrapeRes.json();
              if (data.success && data.images && data.images.length > 0) {
                addLog(`📸 [News Recovery] กู้คืนรูปประกอบสำเร็จ ${data.images.length} รูป!`, 'success');
                return {
                  title: bestMatch.title,
                  content: bestMatch.raw_content,
                  headline: bestMatch.selected_headline || bestMatch.title,
                  images: data.images,
                  sourceUrl: bestMatch.source_url,
                  source: bestMatch.author_name || 'RSS News',
                  timestamp: Date.now()
                };
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to recover news payload:', err);
    }
    return null;
  };

  const handleSmartHistoryResume = async (item: any, isBatchRun = false): Promise<boolean> => {
    if (resumingHistoryId || (isResumingAllHistory && !isBatchRun)) return false;
    setResumingHistoryId(item.id);
    addLog(`[Smart Run] เริ่มดำเนินการต่อสำหรับหัวข้อ: "${item.topic}"`, 'batch');

    try {
      let currentItem = { ...item };
      if (!currentItem.newsPayload) {
        const recovered = await tryRecoverNewsPayload(currentItem);
        if (recovered) {
          currentItem.newsPayload = recovered;
          saveToHistory(currentItem);
        }
      }
      let updatedScript = currentItem.script || '';
      let updatedHeadline = currentItem.headline || '';
      let updatedAudioUrl = currentItem.audioUrl || '';
      let updatedDuration = currentItem.duration || 0;
      let updatedSrtContent = currentItem.srtContent || '';
      let updatedVideoUrl = currentItem.videoUrl || '';

      // Step 1: AI Script & Style Generation
      if (!updatedScript || !updatedHeadline) {
        addLog(`[Smart Run] ✍️ กำลังเขียนบทและพาดหัวสำหรับหัวข้อ: "${item.topic}"`, 'info');
        const generated = await handleGenerateScript(item.topic, selectedStyleId);
        if (!generated) {
          addLog(`[Smart Run] ❌ การเขียนบทล้มเหลวสำหรับหัวข้อ: "${item.topic}"`, 'error');
          setResumingHistoryId(null);
          return false;
        }
        updatedScript = generated.script;
        updatedHeadline = generated.headline;
        currentItem = {
          ...currentItem,
          script: updatedScript,
          headline: updatedHeadline
        };
        saveToHistory(currentItem);
      }

      // Step 2: Speech Synthesis / Voiceover Mode (with retry + fallback)
      if (!updatedAudioUrl) {
        const activeVoice = resolveValidVoiceId(currentItem.voiceId || voiceId);
        addLog(`[Smart Run] 🎙️ กำลังสร้างเสียงพากย์ด้วยนักพากย์: "${getVoiceDisplayName(activeVoice)}"`, 'info');
        let voiceResult = await handleGenerateVoice(updatedScript, activeVoice);
        
        // Retry once with delay if Kie.ai failed
        if (!voiceResult && !activeVoice.startsWith('mac_')) {
          addLog(`[Smart Run] ⏳ Kie.ai ล้มเหลว — รอ 10 วินาทีแล้วลองใหม่อีกครั้ง...`, 'warning');
          await new Promise(res => setTimeout(res, 10000));
          voiceResult = await handleGenerateVoice(updatedScript, activeVoice);
        }

        // Final fallback: use Mac TTS if Kie.ai still fails
        if (!voiceResult && !activeVoice.startsWith('mac_')) {
          addLog(`[Smart Run] 🔄 Kie.ai ยังล้มเหลว — สลับไปใช้ Mac TTS (Kanya) แทนอัตโนมัติ...`, 'warning');
          voiceResult = await handleGenerateVoice(updatedScript, 'mac_Kanya');
        }

        if (!voiceResult) {
          addLog(`[Smart Run] ❌ การสังเคราะห์เสียงพูดผิดพลาดสำหรับหัวข้อ: "${item.topic}"`, 'error');
          setResumingHistoryId(null);
          return false;
        }
        updatedAudioUrl = voiceResult.audioUrl;
        updatedDuration = voiceResult.duration;
        currentItem = {
          ...currentItem,
          voiceId: activeVoice,
          audioUrl: updatedAudioUrl,
          duration: updatedDuration
        };
        saveToHistory(currentItem);
      }

      // Step 3: Timed Subtitle Construction
      // Always regenerate if SRT looks invalid (single segment, no timing arrows, or too few segments)
      let srtWasRegenerated = false;
      const srtLooksValid = updatedSrtContent && 
        updatedSrtContent.includes('-->') && 
        (updatedSrtContent.match(/-->/g) || []).length >= 3 &&
        updatedSrtContent.split('\n').length > 6;
      
      if (!srtLooksValid) {
        srtWasRegenerated = true;
        if (updatedSrtContent) {
          addLog(`[Smart Run] ⚠️ ซับเก่าที่มีอยู่ไม่ถูกต้อง (${(updatedSrtContent.match(/-->/g) || []).length} segments) → สร้างใหม่`, 'warning');
        }
        addLog(`[Smart Run] 📝 กำลังสร้างคำบรรยาย (Subtitles)...`, 'info');
        const srtSegments = await generateSrtSegmentsAsync(updatedScript, updatedDuration, updatedAudioUrl);
        const formatTime = (sec: number) => {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.floor((sec % 1) * 1000);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
        };
        updatedSrtContent = srtSegments.map(seg => {
          return `${seg.index}\n${formatTime(seg.start)} --> ${formatTime(seg.end)}\n${seg.text}\n`;
        }).join('\n');

        currentItem = {
          ...currentItem,
          srtSegments: srtSegments,
          srtContent: updatedSrtContent
        };
        saveToHistory(currentItem);
        addLog(`[Smart Run] ✅ สร้างซับสำเร็จ ${srtSegments.length} ท่อน`, 'success');
      } else {
        addLog(`[Smart Run] ✅ ใช้ซับเดิมที่ถูกต้อง (${(updatedSrtContent.match(/-->/g) || []).length} segments)`, 'info');
      }

      // Step 4: Assembly & Visual Overlays Rendering
      // Force re-render if subtitles were regenerated (old video had bad subs)
      if (!updatedVideoUrl || srtWasRegenerated) {
        if (srtWasRegenerated && updatedVideoUrl) {
          addLog(`[Smart Run] 🔄 ซับถูกสร้างใหม่ → ต้อง render วิดีโอใหม่เพื่อใช้ซับที่ถูกต้อง`, 'info');
        }
        addLog(`[Smart Run] 🎬 กำลังตัดต่อและเรนเดอร์วิดีโอ (Rendering)...`, 'info');
        const activeBgm = await resolveBgmFileRandomly(bgmFile);
        const renderPath = await handleRenderSingleVideo(
          item.topic,
          updatedAudioUrl,
          updatedDuration,
          updatedSrtContent,
          updatedHeadline,
          activeBgm,
          undefined,
          currentItem.newsPayload
        );

        if (!renderPath) {
          addLog(`[Smart Run] ❌ การตัดต่อและเรนเดอร์ล้มเหลวสำหรับหัวข้อ: "${item.topic}"`, 'error');
          setResumingHistoryId(null);
          return false;
        }

        updatedVideoUrl = renderPath;
        currentItem = {
          ...currentItem,
          videoUrl: updatedVideoUrl
        };
        saveToHistory(currentItem);
      }

      addLog(`✨ [Smart Run] ดำเนินการต่อจนเสร็จสมบูรณ์สำหรับหัวข้อ: "${item.topic}"`, 'success');
      setResumingHistoryId(null);
      return true;
    } catch (err: any) {
      addLog(`❌ [Smart Run Error] เกิดข้อผิดพลาด: ${err.message || err}`, 'error');
      setResumingHistoryId(null);
      return false;
    }
  };

  const handleSmartHistoryResumeAll = async () => {
    if (isResumingAllHistory || resumingHistoryId) return;
    const pendingItems = scriptHistory.filter(x => !x.audioUrl || !x.videoUrl);
    if (pendingItems.length === 0) {
      addLog('[Smart Run All] 🏁 ไม่มีรายการใดที่ยังค้างอยู่ในคลังประวัติ!', 'info');
      return;
    }

    setIsResumingAllHistory(true);
    addLog(`[Smart Run All] 🚀 เริ่มประมวลผลต่อคิวที่ค้างทั้งหมด ${pendingItems.length} รายการแบบต่อเนื่อง...`, 'batch');

    try {
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        addLog(`[Smart Run All] [${i + 1}/${pendingItems.length}] กำลังทำหัวข้อ: "${item.topic}"`, 'batch');
        const success = await handleSmartHistoryResume(item, true);
        if (!success) {
          addLog(`[Smart Run All] ⚠️ ข้ามหัวข้อ "${item.topic}" เนื่องจากพบข้อผิดพลาด`, 'warning');
        }
      }
      addLog('🏁 [Smart Run All] ประมวลผลคิวที่ค้างทั้งหมดเสร็จสิ้นแล้วบอส!', 'success');
    } catch (err: any) {
      addLog(`❌ [Smart Run All Error] เกิดข้อผิดพลาด: ${err.message || err}`, 'error');
    } finally {
      setIsResumingAllHistory(false);
    }
  };

  // --- Subtitle Presets Switcher ---
  const applyPreset = (preset: typeof SUBTITLE_PRESETS[0]) => {
    setSubStyle(preset);
    addLog(`ปรับรูปแบบ Preset ซับไตเติ้ล: ${preset.name}`, 'info');
  };

  // --- Beautiful Sub-Component Renderers ---
  const renderFolderSettings = () => {
    return (
      <div className="p-6 rounded-3xl border border-teal-500/20 bg-slate-900/60 backdrop-blur-md shadow-2xl space-y-4 transition-all duration-300">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">1</span>
            ตั้งค่าตำแหน่งโฟลเดอร์คลิปฟุตเทจ (Footage) และโฟลเดอร์ผลลัพธ์ (Output)
          </h2>
          <span className="text-xs text-amber-300 font-bold">* ต้องทำการเลือกให้เรียบร้อยก่อนเริ่มงานบอส</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-teal-300 flex items-center gap-1">📁 โฟลเดอร์คลิปฟุตเทจต้นทาง (Footage Directory)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectFolder('source')}
                  className="px-3 py-1.5 text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white rounded-lg transition-all active:scale-95"
                >
                  📂 ค้นหาโฟลเดอร์
                </button>
                <button
                  onClick={() => {
                    const manualDir = window.prompt(`ระบุ Path โฟลเดอร์ฟุตเทจโดยตรง:`, sourceFolder);
                    if (manualDir !== null) {
                      setSourceFolder(manualDir.trim());
                      addLog(`ระบุโฟลเดอร์ต้นทางแบบระบุเอง: ${manualDir.trim()}`, 'success');
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-350 rounded-lg font-bold transition-all active:scale-95"
                  title="กรอก Path แมนนวล"
                >
                  ✏️ กรอกเอง
                </button>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 font-mono text-xs text-white/90 truncate border border-white/5" title={sourceFolder}>
              {sourceFolder ? sourceFolder : 'ยังไม่ได้เลือก (โปรดกด ค้นหาโฟลเดอร์ หรือ กรอกเอง)'}
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-white/40">* สุ่มฟุตเทจในโฟลเดอร์นี้มาประกอบร่างตามความยาวคลิปเสียง</span>
              {sourceFolder ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">Ready</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 uppercase" title="จำเป็นสำหรับวิดีโอทั่วไป แต่อัตโนมัติจากข่าวที่มีรูปภาพไม่จำเป็นต้องเลือก">Required (Optional for News)</span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 bg-black/40 p-4 rounded-2xl border border-white/5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-purple-300 flex items-center gap-1">📥 โฟลเดอร์ปลายทางสำหรับเซฟวิดีโอ (Output Directory)</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSelectFolder('output')}
                  className="px-3 py-1.5 text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-all active:scale-95"
                >
                  📂 ค้นหาโฟลเดอร์
                </button>
                <button
                  onClick={() => {
                    const manualDir = window.prompt(`ระบุ Path โฟลเดอร์ปลายทางโดยตรง:`, outputFolder);
                    if (manualDir !== null) {
                      setOutputFolder(manualDir.trim());
                      addLog(`ระบุโฟลเดอร์ปลายทางแบบระบุเอง: ${manualDir.trim()}`, 'success');
                    }
                  }}
                  className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-indigo-350 rounded-lg font-bold transition-all active:scale-95"
                  title="กรอก Path แมนนวล"
                >
                  ✏️ กรอกเอง
                </button>
              </div>
            </div>
            <div className="p-2.5 rounded-lg bg-black/60 font-mono text-xs text-white/90 truncate border border-white/5" title={outputFolder}>
              {outputFolder ? outputFolder : 'ยังไม่ได้เลือก (โปรดกด ค้นหาโฟลเดอร์ หรือ กรอกเอง)'}
            </div>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] text-white/40">* บันทึกคลิปวิดีโอสำเร็จรูปตั้งชื่อไฟล์ตามชื่อพาดหัว</span>
              {outputFolder ? (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 uppercase">Ready</span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 uppercase">Required</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBrainSettings = () => {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">2</span>
            กำหนดลายเซ็นสำนวนและสไตล์เขียนบท (AI Brain Profile & Script Styles)
          </h2>
          <span className="text-xs text-white/50">วิเคราะห์และเกลาบทล่วงหน้า</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/70">🧬 เลือกสมอง AI "Brain Profile"</label>
              <select
                value={selectedBrainId}
                onChange={(e) => setSelectedBrainId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-teal-500/20 text-white text-sm outline-none focus:border-teal-500 transition-colors"
              >
                <option value="none">-- ใช้สไตล์กลางตามหัวข้อ --</option>
                {savedBrains.map(b => (
                  <option key={b.id} value={b.id}>🧠 {b.name} ({new Date(b.timestamp).toLocaleDateString('th-TH')})</option>
                ))}
              </select>
              <p className="text-[10px] text-white/40">*ระบบจะเลียนแบบความฉลาด สำนวน และสคริปต์สไตล์ของเพจนี้ที่เซฟไว้</p>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-white/70">สเปกคอนเซปต์ช่อง / อาร์ตไดเรกชั่น</label>
              <textarea
                value={channelConcept}
                onChange={(e) => setChannelConcept(e.target.value)}
                className="w-full h-24 p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-purple-500/80 outline-none resize-none"
                placeholder="เช่น ช่องเล่าความลับจักรวาล น้ำเสียงตื่นเต้น มีจังหวะเงียบให้ระทึก..."
              />
              <button
                onClick={handleGenerateStyles}
                disabled={isGeneratingStyles}
                className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
              >
                {isGeneratingStyles ? '🔮 AI กำลังออกแบบสไตล์การเขียน...' : '✨ เสนอสไตล์เล่าเรื่อง 5 รูปแบบ (OpenRouter)'}
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white/70">เลือกสไตล์การเล่าเรื่องที่ชอบ</label>
              <select
                value={selectedStyleId}
                onChange={(e) => setSelectedStyleId(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none font-semibold text-indigo-300"
              >
                {copyStyles.map(s => (
                  <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
                ))}
              </select>
            </div>
            
            {copyStyles.find(s => s.id === selectedStyleId) && (
              <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-1.5">
                <p className="text-purple-300 font-bold">🎯 {copyStyles.find(s => s.id === selectedStyleId)?.name}</p>
                <p className="text-white/60">{copyStyles.find(s => s.id === selectedStyleId)?.description}</p>
                <p className="text-white/40 italic">"ตัวอย่าง: {copyStyles.find(s => s.id === selectedStyleId)?.example}"</p>
              </div>
            )}

            <div className="space-y-1 pt-2 border-t border-white/5">
              <label className="text-xs font-semibold text-white/70">📏 ขนาดความยาวสคริปต์ (Script Length)</label>
              <select
                value={scriptLength}
                onChange={(e) => setScriptLength(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none font-semibold text-teal-300 cursor-pointer"
              >
                {SCRIPT_LENGTHS.map(l => (
                  <option key={l.id} value={l.id} className="bg-slate-900 text-white">{l.label}</option>
                ))}
              </select>
              <p className="text-[10px] text-white/40">
                *{SCRIPT_LENGTHS.find(l => l.id === scriptLength)?.description}
              </p>
            </div>

            {/* Inline Brain Trainer */}
            <div className="p-3 rounded-xl bg-slate-950/40 border border-teal-500/25 text-xs space-y-2 shadow-inner">
              <p className="font-bold text-teal-400 flex items-center gap-1.5">
                🔬 ฝังสำนวนคนเขียนบท / เทรนสมอง AI (Inline Brain Trainer)
              </p>
              <input
                type="text"
                value={inlineBrainName}
                onChange={(e) => setInlineBrainName(e.target.value)}
                className="w-full p-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-teal-500"
                placeholder="ชื่อสำนวน / บุคลิก (เช่น นักจิตวิทยาสายโหด)"
              />
              <textarea
                value={inlineBrainPasteText}
                onChange={(e) => setInlineBrainPasteText(e.target.value)}
                className="w-full h-16 p-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white outline-none resize-none focus:border-teal-500"
                placeholder="วางข้อความตัวอย่าง 1-3 โพสต์ เพื่อให้ AI แกะรอยสไตล์..."
              />
              <button
                onClick={handleTrainInlineBrain}
                disabled={isAnalyzingInlineBrain}
                className="w-full py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-md disabled:opacity-50"
              >
                {isAnalyzingInlineBrain ? '⏳ AI กำลังถอดรหัสลายเซ็นสำนวน...' : '🧠 เจนเนอเรตสมองชุดข้อมูลใหม่'}
              </button>
            </div>
          </div>
        </div>

        {/* Manual Single Script Gen (Hidden/Small Helper) */}
        <details className="border-t border-white/10 pt-3 group text-xs text-white/50 cursor-pointer">
          <summary className="hover:text-white transition-colors">⚙️ ตัวประมวลผลเขียนบทความเดี่ยวแบบแมนนวล (Manual Single Generation Helper)</summary>
          <div className="pt-3 grid grid-cols-1 md:grid-cols-4 gap-3 items-end cursor-default">
            <div className="md:col-span-3 space-y-1">
              <label className="text-[11px] font-semibold text-white/70">หัวข้อคอนเทนต์ตัวอย่าง (Topic Input)</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full p-2 bg-black/40 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-purple-500/80"
                placeholder="เช่น 3 นิสัยทำลายสมองตอนตื่นนอน..."
              />
            </div>
            <button
              onClick={triggerManualScriptGen}
              disabled={isGeneratingScript}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl active:scale-95 transition-all disabled:opacity-40"
            >
              {isGeneratingScript ? '✍️ กำลังเขียนบท...' : '📝 สั่ง AI เขียนบทพูดเพียวๆ'}
            </button>
          </div>
        </details>
      </div>
    );
  };

  const renderVoiceSettings = () => {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between transition-all duration-300">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">3</span>
              เลือกนักพากย์เสียงไทยพรีเมียม (Kie.ai Voices)
            </h3>
            <span className="text-xs text-amber-300 font-bold">พรีเมียมออนไลน์</span>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-white/70">รายชื่อนักพากย์พรีเมียมออนไลน์ (Kie.ai Premium Thai)</label>
            <select
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-teal-500 transition-colors font-semibold"
            >
              {KIEAI_VOICES.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white font-semibold font-mono">✨ {v.name}</option>
              ))}
            </select>
            
            <p className="text-[10px] text-amber-300">
              🔥 เสียงพรีเมียมสมจริงระดับมืออาชีพจาก Kie.ai พูดไทยเป็นธรรมชาติ ลื่นไหลไร้รอยต่อ
            </p>
          </div>

          <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
            <div className="flex justify-between text-xs text-white/60">
              <span>ลิงก์ไฟล์เสียง:</span>
              <span className="font-mono text-teal-400 truncate max-w-[150px]">{audioUrl || 'ยังไม่มีเสียง'}</span>
            </div>
            <div className="flex justify-between text-xs text-white/60">
              <span>ความยาวไฟล์เสียง:</span>
              <span className="font-mono text-teal-400">{audioDuration ? `${audioDuration.toFixed(2)} วินาที` : '0.00s'}</span>
            </div>
            {audioUrl && (
              <audio src={audioUrl} controls className="w-full h-8 mt-1 scale-95 origin-left" />
            )}
          </div>
        </div>

        <button
          onClick={triggerManualVoiceGen}
          disabled={isGeneratingVoice || !script}
          className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-40"
        >
          {isGeneratingVoice ? '🎙️ กำลังบันทึกเสียงพากย์...' : '👑 เจนเสียงพากย์พรีเมียม (Kie.ai / ElevenLabs)'}
        </button>
      </div>
    );
  };

  const renderSubtitleSettings = () => {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">4</span>
              เลือก Preset และรูปแบบซับไตเติ้ล (Smart Subtitling Presets)
            </h3>
            <span className="text-xs text-white/50">จัดแต่งซับไตเติ้ล</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pb-2">
            {SUBTITLE_PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => applyPreset(p)}
                className="p-2 text-left text-xs rounded-xl border border-white/10 bg-black/20 hover:bg-purple-950/20 hover:border-purple-500/30 transition-all truncate"
              >
                ⚡ {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">แบบอักษร (Font Family)</label>
              <select
                value={subStyle.fontName}
                onChange={(e) => setSubStyle(prev => ({ ...prev, fontName: e.target.value }))}
                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Impact">Impact (หนาพิเศษ)</option>
                <option value="Kanit">Kanit (โมเดิร์นยอดฮิต)</option>
                <option value="Prompt">Prompt (สะอาดเรียบหรู)</option>
                <option value="Mitr">Mitr (กลมมนเป็นมิตร)</option>
                <option value="Sarabun">Sarabun (สะอาดทางการ)</option>
                <option value="Courier New">Courier New</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">ขนาดอักษร (Font Size)</label>
              <input
                type="number"
                value={subStyle.fontSize}
                onChange={(e) => setSubStyle(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                className="w-full p-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">สีหลัก (Primary)</label>
              <input
                type="color"
                value={subStyle.primaryColor}
                onChange={(e) => setSubStyle(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">สีขอบ (Outline)</label>
              <input
                type="color"
                value={subStyle.outlineColor}
                onChange={(e) => setSubStyle(prev => ({ ...prev, outlineColor: e.target.value }))}
                className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">ขอบเขตซับ</label>
              <select
                value={subStyle.borderStyle}
                onChange={(e) => setSubStyle(prev => ({ ...prev, borderStyle: Number(e.target.value) }))}
                className="w-full h-8 p-1.5 rounded bg-black/40 border border-white/10 text-[10px]"
              >
                <option value={1}>ขอบหนา</option>
                <option value={3}>กล่องทึบ</option>
              </select>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            triggerAutoSubtiming(script, audioDuration, audioUrl);
          }}
          disabled={!script || !audioDuration}
          className="w-full py-2.5 bg-gradient-to-r from-purple-700/60 to-pink-700/60 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-30"
        >
          🔤 คำนวณตัดแบ่งคำบรรยายตามความยาวเสียงพากย์
        </button>
      </div>
    );
  };

  const renderBgmSettings = () => {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">5</span>
              ดนตรีประกอบและฟิลเตอร์สี (BGM Mixing & Cinematic Filters)
            </h3>
            <span className="text-xs text-teal-400 font-semibold">BGM & Tones</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-white/70">ไฟล์หรือโฟลเดอร์เพลงประกอบ BGM (.mp3 / .wav / โฟลเดอร์)</label>
              <div className="flex flex-wrap gap-2 justify-end">
                <button 
                  onClick={handleSelectBgm} 
                  className="text-xs text-indigo-400 hover:text-indigo-305 font-semibold transition-all active:scale-95"
                  title="เลือกไฟล์ MP3 เดี่ยวเพียงไฟล์เดียว"
                >
                  📂 เลือกไฟล์ BGM
                </button>
                <button 
                  onClick={() => handleSelectFolder('bgmFolder')} 
                  className="text-xs text-teal-400 hover:text-teal-305 font-semibold transition-all active:scale-95"
                  title="เลือกโฟลเดอร์เพื่อสุ่มหยิบเพลงประกอบแตกต่างกันให้แต่ละคลิปใน Batch"
                >
                  🗂️ สุ่มจากโฟลเดอร์
                </button>
                <button 
                  onClick={() => {
                    const manualBgm = window.prompt(`กรอก/วาง Path ไฟล์ BGM หรือโฟลเดอร์เพลงบรรเลงโดยตรง:`, bgmFile || '');
                    if (manualBgm !== null) {
                      setBgmFile(manualBgm.trim());
                      addLog(`ระบุแหล่ง BGM แบบระบุเองสำเร็จ: ${manualBgm.trim()}`, 'success');
                    }
                  }} 
                  className="text-xs text-purple-400 hover:text-purple-305 font-semibold transition-all active:scale-95"
                  title="ระบุ Path เองโดยตรง"
                >
                  ✏️ ระบุเอง
                </button>
              </div>
            </div>
            <input
              type="text"
              value={bgmFile || ''}
              onChange={(e) => setBgmFile(e.target.value)}
              placeholder="วาง Path ไฟล์เพลงประกอบ (.mp3) หรือโฟลเดอร์เพลงเพื่อเปิดระบบ BGM Randomizer..."
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500 transition-all font-mono"
            />
            {bgmFile && !bgmFile.endsWith('.mp3') && !bgmFile.endsWith('.wav') && !bgmFile.endsWith('.m4a') && (
              <p className="text-[10px] text-teal-400 italic">🎲 เปิดโหมดสุ่มเพลง BGM อัตโนมัติจากโฟลเดอร์สำเร็จ!</p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/60">
              <span>ความดังเพลง BGM (BGM Volume Mixing)</span>
              <span className="font-mono text-teal-400 font-bold">{Math.round(bgmVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="0.4"
              step="0.01"
              value={bgmVolume}
              onChange={(e) => setBgmVolume(Number(e.target.value))}
              className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <p className="text-[9px] text-white/40">* แนะนำความดังที่ 8% - 15% เพื่อไม่ให้กลบเสียงพากย์หลักครับบอส</p>
          </div>

          {/* Cinematic Color Grading Filter inside BGM */}
          <div className="space-y-2 pt-2 border-t border-white/5">
            <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              🎨 ฟิลเตอร์โทนสีวิดีโอ (Cinematic Color Grading)
            </label>
            <select
              value={colorFilter}
              onChange={(e) => setColorFilter(e.target.value as any)}
              className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
            >
              <option value="none">ปกติ (Original Colors)</option>
              <option value="grayscale">🔘 ขาว-ดำ คลาสสิก (Grayscale / B&W)</option>
              <option value="dark">🌑 ฟิล์มมืดดราม่า (Dark Cinematic Overlay)</option>
              <option value="contrast">🎭 ไฮคอนทราสต์จัดจ้าน (High Contrast Cinematic)</option>
              <option value="dark-grayscale">🖤 ดำ-เทาฟิล์มหม่น (Dark Grayscale Tone)</option>
            </select>
          </div>

          {/* Manual single assembly button under details */}
          <details className="border-t border-white/5 pt-2 group text-[11px] text-white/50 cursor-pointer">
            <summary className="hover:text-white transition-colors">⚙️ ตัวประกอบร่างคลิปเดี่ยวแบบแมนนวล (Manual Fallback)</summary>
            <div className="pt-2 cursor-default">
              <button
                onClick={async () => {
                  if (!script || !srtContent) {
                    return alert('กรุณาสร้างและตรวจสอบบทสคริปต์และจัดทำ SRT ซับไตเติ้ลก่อนประกอบร่างครับบอส');
                  }
                  setIsAssembling(true);
                  addLog('เริ่มขั้นตอนประกอบร่างและเรนเดอร์ภาพเดี่ยว...', 'info');
                  const activeAudioUrl = audioUrl;
                  const activeDuration = audioDuration;
                  const activeBgm = await resolveBgmFileRandomly(bgmFile);

                  const renderPath = await handleRenderSingleVideo(
                    topic || 'Manual_Render',
                    activeAudioUrl,
                    activeDuration,
                    srtContent,
                    headline,
                    activeBgm,
                    undefined,
                    newsPayload || undefined
                  );
                  if (renderPath) {
                    setAssembledVideoPath(renderPath);
                    addLog(`ประกอบร่างและเรนเดอร์วิดีโอเดี่ยวสำเร็จ: ${renderPath}`, 'success');
                  }
                  setIsAssembling(false);
                }}
                disabled={isAssembling || !audioUrl || !srtContent}
                className="w-full py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40"
              >
                {isAssembling ? '🎬 กำลังประกอบฟุตเทจและเรนเดอร์...' : '💥 สั่งประกอบร่างและเรนเดอร์เป็นรายตอนเดี่ยว'}
              </button>
            </div>
          </details>
        </div>
      </div>
    );
  };

  const renderPreviewPanel = () => {
    return (
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col items-center">
        {/* Google Fonts Preloading for high fidelity typography */}
        <style dangerouslySetInnerHTML={{__html: `
          @import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Mitr:wght@400;700&family=Prompt:ital,wght@0,400;0,700;0,900;1,400&family=Sarabun:ital,wght@0,400;0,700;1,400&display=swap');
        `}} />

        <div className="w-full border-b border-white/10 pb-3 flex justify-between items-center">
          <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            🎬 WYSIWYG 9:16 Editor
          </h2>
          <span className="text-xs text-white/50">ลากวางพิกัดแม่นยำ 100%</span>
        </div>

        {/* Batch Item Inspection Dropdown */}
        {batchItems.length > 0 && (
          <div className="w-full p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 mb-3">
            <label className="text-[11px] font-semibold text-white/60 block">
              🔍 ตรวจสอบและจัดตำแหน่งตามตอนคิววิดีโอ (Review Queue):
            </label>
            <div className="flex gap-2">
              <select
                value={selectedBatchItemIdxForPreview}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  if (idx >= 0) {
                    loadBatchItemToPreview(idx);
                  } else {
                    setSelectedBatchItemIdxForPreview(-1);
                  }
                }}
                className="flex-1 p-2 rounded-lg bg-slate-950 text-white text-xs border border-white/10 focus:border-teal-500/80 outline-none"
              >
                <option value="-1">-- เลือกตอนที่ต้องการสุ่มจัดวาง --</option>
                {batchItems.map((item, idx) => (
                  <option key={idx} value={idx}>
                    ตอนที่ {idx + 1}: {item.topic} {item.script ? '✍️ (ร่างแล้ว)' : '⏳ (ยังไม่ได้ร่าง)'}
                  </option>
                ))}
              </select>
            </div>
            {selectedBatchItemIdxForPreview >= 0 && (
              <div className="text-[10px] text-teal-300 flex flex-col gap-1 bg-teal-500/10 px-2 py-1.5 rounded border border-teal-500/20">
                <div className="flex justify-between items-center">
                  <span>💡 พรีวิวและช่องแก้ไขกำลังเชื่อมกับตอนที่ {selectedBatchItemIdxForPreview + 1}</span>
                  <button
                    onClick={() => setSelectedBatchItemIdxForPreview(-1)}
                    className="text-white hover:text-red-400 font-bold ml-2"
                  >
                    ❌ ปิดการเชื่อม
                  </button>
                </div>
                <span className="text-[9px] text-teal-400/80 italic">* การย้ายตำแหน่งพาดหัว/ซับ หรือพิมพ์แก้ไขบทความของบอสใน Step 2 จะเซฟลงตอนที่ {selectedBatchItemIdxForPreview + 1} ทันที</span>
              </div>
            )}
          </div>
        )}

        {/* Mobile simulated viewport (270px width, 480px height) */}
        <div 
          ref={containerRef}
          className="relative border-8 border-slate-950 bg-slate-900 overflow-hidden shadow-2xl select-none group"
          style={{
            width: '270px',
            height: '480px',
            borderRadius: '36px',
            backgroundImage: 'linear-gradient(to bottom, #111827, #312e81)',
            boxShadow: '0 0 25px rgba(124, 58, 237, 0.25)'
          }}
        >
          {/* Camera Notch simulation */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-3 rounded-full bg-slate-950 z-30" />
          
          {/* Visual Rendered Video preview (if compiled) */}
          {assembledVideoPath && (
            <video 
              src={`${BACKEND_BASE}/api/local-stock-image?path=${encodeURIComponent(assembledVideoPath)}`} 
              className="absolute inset-0 w-full h-full object-cover z-0" 
              style={{
                filter: colorFilter === 'grayscale' ? 'grayscale(100%)' :
                        colorFilter === 'dark' ? 'brightness(65%) contrast(115%)' :
                        colorFilter === 'contrast' ? 'contrast(135%) brightness(95%)' :
                        colorFilter === 'dark-grayscale' ? 'grayscale(100%) brightness(65%) contrast(115%)' :
                        'none'
              }}
              autoPlay 
              loop 
              muted 
            />
          )}

          {/* Grid guide overlays */}
          <div className="absolute inset-0 border border-white/10 pointer-events-none z-10 hidden group-hover:block">
            <div className="absolute top-1/3 left-0 w-full border-t border-dashed border-white/20" style={{ height: '1px' }} />
            <div className="absolute top-2/3 left-0 w-full border-t border-dashed border-white/20" style={{ height: '1px' }} />
            <div className="absolute left-1/3 top-0 h-full border-l border-dashed border-white/20" style={{ width: '1px' }} />
            <div className="absolute left-2/3 top-0 h-full border-l border-dashed border-white/20" style={{ width: '1px' }} />
          </div>

          {/* 1. Headline Draggable Overlay */}
          <div
            onMouseDown={handleHeadlineDragStart}
            onTouchStart={handleHeadlineDragStart}
            style={{
              top: `${headlineY}px`,
              fontFamily: headlineFontName,
              fontSize: `${headlineFontSize / 1.5}px`,
            }}
            className="absolute left-1/2 -translate-x-1/2 text-center font-extrabold cursor-ns-resize select-none z-20 transition-all duration-150 w-max max-w-[90%] flex flex-col items-center justify-center min-h-[30px]"
          >
            {(() => {
              const scaledHlFontSize = Math.round(headlineFontSize * 8 / 3);
              const maxCharsPerLine = Math.max(12, Math.floor(950 / (scaledHlFontSize * 0.42)));
              const wrapped = wrapText(headline || 'พาดหัวของคุณตรงนี้', maxCharsPerLine, 2);
              return wrapped.split('\n').map((line, idx) => (
                <span
                  key={idx}
                  style={{
                    color: headlineFontColor,
                    backgroundColor: headlineBoxEnabled ? hexToRgba(headlineBoxColor, headlineBoxOpacity) : 'transparent',
                    padding: headlineBoxEnabled ? `${headlinePaddingY}px ${headlinePaddingX}px` : '0px',
                    borderRadius: headlineBoxEnabled ? `${headlineBorderRadius}px` : '0px',
                    boxShadow: (headlineBoxEnabled && headlineShadowBlur > 0) ? `0 0 ${headlineShadowBlur}px ${headlineShadowColor}` : 'none',
                    textShadow: [
                      headlineOutlineWidth > 0 
                        ? `-${headlineOutlineWidth / 1.5}px -${headlineOutlineWidth / 1.5}px 0 ${headlineOutlineColor}, ${headlineOutlineWidth / 1.5}px -${headlineOutlineWidth / 1.5}px 0 ${headlineOutlineColor}, -${headlineOutlineWidth / 1.5}px ${headlineOutlineWidth / 1.5}px 0 ${headlineOutlineColor}, ${headlineOutlineWidth / 1.5}px ${headlineOutlineWidth / 1.5}px 0 ${headlineOutlineColor}`
                        : '',
                      (!headlineBoxEnabled && headlineShadowBlur > 0)
                        ? `0 0 ${headlineShadowBlur / 1.5}px ${headlineShadowColor}`
                        : ''
                    ].filter(Boolean).join(', ') || 'none',
                    marginTop: idx > 0 ? `${headlineLineSpacing / 1.5}px` : '0px',
                  }}
                  className={`${headlineBoxEnabled ? 'border border-white/15' : ''} inline-block px-1 break-words max-w-full`}
                >
                  {line}
                </span>
              ));
            })()}
          </div>

          {/* 2. Subtitles Draggable Overlay */}
          <div
            onMouseDown={handleSubtitleDragStart}
            onTouchStart={handleSubtitleDragStart}
            style={{
              bottom: `${subtitleMarginV}px`,
              fontFamily: subStyle.fontName,
              fontSize: `${subStyle.fontSize / 1.5}px`,
              color: subStyle.primaryColor,
              textShadow: subStyle.borderStyle === 1 
                ? `-${subStyle.outlineThickness / 2}px -${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}, ${subStyle.outlineThickness / 2}px -${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}, -${subStyle.outlineThickness / 2}px ${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}, ${subStyle.outlineThickness / 2}px ${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}`
                : 'none',
              backgroundColor: subStyle.borderStyle === 3 ? subStyle.outlineColor : 'transparent',
              padding: subStyle.borderStyle === 3 ? '4px 10px' : '0px',
              borderRadius: subStyle.borderStyle === 3 ? '6px' : '0px',
            }}
            className="absolute left-1/2 -translate-x-1/2 text-center font-bold max-w-[90%] break-words cursor-ns-resize select-none z-20 flex flex-col items-center justify-center min-h-[30px]"
          >
            {(() => {
              const rawText = srtSegments.length > 0 ? srtSegments[0].text : 'ซับไตเติ้ลตัวอย่างท่อนแรก';
              const scaledFontSize = Math.round((subStyle.fontSize || 24) * 8 / 3);
              const maxSubChars = Math.max(16, Math.floor(650 / (scaledFontSize * 0.42)));
              const wrapped = wrapText(rawText, maxSubChars);
              return wrapped.split('\n').map((line, idx) => (
                <span key={idx} className="block">{line}</span>
              ));
            })()}
          </div>

          {/* Safe area layout indicator warnings */}
          {headlineY < 40 && (
            <div className="absolute top-8 left-0 w-full text-center bg-red-600/90 text-[9px] py-0.5 z-20 animate-pulse text-white">
              ⚠️ ระวังถูกหน้าโปรไฟล์บัง (เกินเซฟโซนบน)
            </div>
          )}
          {subtitleMarginV < 45 && (
            <div className="absolute bottom-6 left-0 w-full text-center bg-red-600/90 text-[9px] py-0.5 z-20 animate-pulse text-white">
              ⚠️ ระวังถูกกล่องแชร์/คอมเมนต์บัง (เกินเซฟโซนล่าง)
            </div>
          )}
        </div>

        {/* Realtime pixel coordinate outputs mapped to FFMPEG rendering engine */}
        <div className="w-full grid grid-cols-2 gap-3 text-xs bg-black/40 p-3 rounded-xl border border-white/5 mt-2">
          <div className="space-y-1">
            <span className="text-white/40 block">พิกัดพาดหัว (Headline Y):</span>
            <span className="font-mono text-teal-400 font-bold">{getRenderCoords().headlineY} px</span>
            <span className="text-[10px] text-white/30 block">(เทียบกรอบความสูง 1920)</span>
          </div>
          <div className="space-y-1">
            <span className="text-white/40 block">ความสูงซับจากล่าง (Margin V):</span>
            <span className="font-mono text-teal-400 font-bold">{getRenderCoords().subtitleMarginV} px</span>
            <span className="text-[10px] text-white/30 block">(เทียบกรอบความสูง 1920)</span>
          </div>
        </div>

        {/* Custom Headline styling tools */}
        <div className="w-full space-y-3 pt-3 border-t border-white/10">
          <div className="flex justify-between items-center">
            <p className="text-xs font-bold text-white/70">🎨 ปรับแต่งสีและสไตล์แถบพาดหัว</p>
            <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
              สไตล์: {(() => {
                const selectedPreset = HEADLINE_PRESETS.find(x => x.id === headlinePresetId);
                return selectedPreset 
                  ? (selectedPreset.name.split(' ').slice(1).join(' ') || selectedPreset.name)
                  : 'ปรับแต่งเอง ⚙️';
              })()}
            </span>
          </div>

          {/* Headline Presets CapCut-Style Grid UI */}
          <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {HEADLINE_PRESETS.map((p) => {
              const isSelected = headlinePresetId === p.id;
              const stroke = p.outlineWidth / 3.2;
              
              const textShadowStyle = [
                p.outlineWidth > 0 
                  ? `-${stroke}px -${stroke}px 0 ${p.outlineColor}, ${stroke}px -${stroke}px 0 ${p.outlineColor}, -${stroke}px ${stroke}px 0 ${p.outlineColor}, ${stroke}px ${stroke}px 0 ${p.outlineColor}`
                  : '',
                (!p.boxEnabled && p.shadowBlur > 0)
                  ? `0 0 ${p.shadowBlur / 3.2}px ${p.shadowColor}`
                  : ''
              ].filter(Boolean).join(', ') || 'none';

              const boxBg = p.boxEnabled ? hexToRgba(p.boxColor, p.boxOpacity) : 'transparent';
              const boxPadding = p.boxEnabled ? '4px 8px' : '0px';
              const boxRadius = p.boxEnabled ? `${p.borderRadius / 3.2}px` : '0px';
              const boxShadow = (p.boxEnabled && p.shadowBlur > 0) ? `0 0 ${p.shadowBlur / 3.2}px ${p.shadowColor}` : 'none';

              // Split emoji and title
              const match = p.name.match(/^([^\s]+)\s+(.+)$/);
              const emoji = match ? match[1] : '🎨';
              const nameText = match ? match[2] : p.name;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyHeadlinePreset(p)}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center aspect-[4/3.2] select-none ${
                    isSelected 
                      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50' 
                      : 'border-white/10 bg-black/40 hover:bg-slate-800/40 text-white/70 hover:text-white hover:border-white/20'
                  }`}
                >
                  <div className="flex-1 flex items-center justify-center w-full min-h-[30px]">
                    <div 
                      style={{
                        backgroundColor: boxBg,
                        padding: boxPadding,
                        borderRadius: boxRadius,
                        boxShadow: boxShadow,
                      }}
                      className="inline-block scale-95"
                    >
                      <span 
                        style={{
                          color: p.fontColor,
                          fontFamily: p.fontName,
                          fontSize: '11px',
                          textShadow: textShadowStyle,
                          fontWeight: 'bold',
                        }}
                        className="tracking-wide"
                      >
                        Aa
                      </span>
                    </div>
                  </div>

                  {/* Title & Emoji */}
                  <span className="text-[9px] text-white/70 block mt-1 truncate w-full font-medium" title={p.name}>
                    {emoji} {nameText.split(' (')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">สีตัวอักษรพาดหัว</label>
              <input
                type="color"
                value={headlineFontColor}
                onChange={(e) => changeHeadlineFontColor(e.target.value)}
                className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">สีกล่องพื้นหลังพาดหัว</label>
              <input
                type="color"
                value={headlineBoxColor}
                disabled={!headlineBoxEnabled}
                onChange={(e) => changeHeadlineBoxColor(e.target.value)}
                className={`w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer ${!headlineBoxEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">ตัวอักษรพาดหัว (Font)</label>
              <select
                value={headlineFontName}
                onChange={(e) => changeHeadlineFontName(e.target.value)}
                className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Impact">Impact (หนาพิเศษ)</option>
                <option value="Kanit">Kanit (โมเดิร์นยอดฮิต)</option>
                <option value="Prompt">Prompt (สะอาดเรียบหรู)</option>
                <option value="Mitr">Mitr (กลมมนเป็นมิตร)</option>
                <option value="Sarabun">Sarabun (สะอาดทางการ)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">ขนาดอักษรพาดหัว</label>
              <input
                type="number"
                value={headlineFontSize}
                onChange={(e) => changeHeadlineFontSize(Number(e.target.value))}
                className="w-full p-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="headlineBoxEnabled"
                checked={headlineBoxEnabled}
                onChange={(e) => changeHeadlineBoxEnabled(e.target.checked)}
                className="w-4 h-4 rounded bg-black/40 border border-white/10 text-indigo-500 focus:ring-0 cursor-pointer"
              />
              <label htmlFor="headlineBoxEnabled" className="text-xs text-white/70 font-semibold cursor-pointer">
                📦 เปิดใช้กล่องพาดหัว
              </label>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>โปร่งใสกล่อง (Opacity)</span>
                <span className="font-mono text-teal-400 font-bold">{Math.round(headlineBoxOpacity * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                disabled={!headlineBoxEnabled}
                value={headlineBoxOpacity}
                onChange={(e) => changeHeadlineBoxOpacity(Number(e.target.value))}
                className={`w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400 ${!headlineBoxEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>ความกว้างกล่อง (Padding X)</span>
                <span className="font-mono text-teal-400 font-bold">{headlinePaddingX}px</span>
              </div>
              <input
                type="range"
                min="4"
                max="40"
                step="1"
                disabled={!headlineBoxEnabled}
                value={headlinePaddingX}
                onChange={(e) => changeHeadlinePaddingX(Number(e.target.value))}
                className={`w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400 ${!headlineBoxEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>ความสูงกล่อง (Padding Y)</span>
                <span className="font-mono text-teal-400 font-bold">{headlinePaddingY}px</span>
              </div>
              <input
                type="range"
                min="2"
                max="30"
                step="1"
                disabled={!headlineBoxEnabled}
                value={headlinePaddingY}
                onChange={(e) => changeHeadlinePaddingY(Number(e.target.value))}
                className={`w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400 ${!headlineBoxEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>ความโค้งมนขอบกล่อง</span>
                <span className="font-mono text-teal-400 font-bold">{headlineBorderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                disabled={!headlineBoxEnabled}
                value={headlineBorderRadius}
                onChange={(e) => changeHeadlineBorderRadius(Number(e.target.value))}
                className={`w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400 ${!headlineBoxEnabled ? 'opacity-30 cursor-not-allowed' : ''}`}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>ความฟุ้งเงาขอบ (Blur)</span>
                <span className="font-mono text-teal-400 font-bold">{headlineShadowBlur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="1"
                value={headlineShadowBlur}
                onChange={(e) => changeHeadlineShadowBlur(Number(e.target.value))}
                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>ความหนาขอบตัวอักษร (Stroke)</span>
                <span className="font-mono text-teal-400 font-bold">{headlineOutlineWidth}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.5"
                value={headlineOutlineWidth}
                onChange={(e) => changeHeadlineOutlineWidth(Number(e.target.value))}
                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-white/60">สีเงาฟุ้ง / สีขอบตัวอักษร</label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="color"
                  value={headlineShadowColor}
                  onChange={(e) => changeHeadlineShadowColor(e.target.value)}
                  className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                  title="สีเงาฟุ้ง (Shadow Color)"
                />
                <input
                  type="color"
                  value={headlineOutlineColor}
                  disabled={headlineOutlineWidth === 0}
                  onChange={(e) => changeHeadlineOutlineColor(e.target.value)}
                  className={`w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer ${headlineOutlineWidth === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  title="สีขอบตัวอักษร (Stroke Color)"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 col-span-2">
              <div className="flex justify-between text-[10px] text-white/60">
                <span>↔️ ความห่างระหว่างบรรทัดพาดหัว (Line Spacing)</span>
                <span className="font-mono text-teal-400 font-bold">{headlineLineSpacing} px</span>
              </div>
              <input
                type="range"
                min="-30"
                max="60"
                step="1"
                value={headlineLineSpacing}
                onChange={(e) => changeHeadlineLineSpacing(Number(e.target.value))}
                className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryLibrary = () => {
    const uncompletedCount = scriptHistory.filter(x => !x.audioUrl || !x.videoUrl).length;

    return (
      <div className="p-6 rounded-3xl border border-indigo-500/20 bg-slate-900/60 backdrop-blur-md shadow-2xl space-y-4 animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-white/10 pb-3">
          <div>
            <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
              📦 คลังประวัติและสถานะการผลิตวิดีโอสำเร็จรูป ({scriptHistory.length} รายการ)
            </h2>
            <p className="text-xs text-white/50">คลังเก็บประวัติและสถานะไฟล์ที่เคยทำแล้ว สามารถรียูสและเรียกดูงานแต่ละตอนได้ทันทีครับบอส</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <input
              type="text"
              value={searchHistoryQuery}
              onChange={(e) => setSearchHistoryQuery(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 text-xs w-full md:w-48 placeholder-white/35"
              placeholder="🔍 ค้นหาหัวข้อ/บท..."
            />
            {uncompletedCount > 0 && (
              <button
                onClick={handleSmartHistoryResumeAll}
                disabled={isResumingAllHistory || resumingHistoryId !== null}
                className="px-3 py-1 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white text-xs font-bold rounded-lg transition-all active:scale-95 shadow-md whitespace-nowrap"
              >
                {isResumingAllHistory ? '⏳ กำลังรันที่เหลือ...' : `⚡ ทำต่อที่เหลือทั้งหมด (${uncompletedCount})`}
              </button>
            )}
            {scriptHistory.length > 0 && (
              <button
                onClick={handleClearAllHistory}
                className="px-3 py-1 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-300 text-xs font-bold rounded-lg transition-all active:scale-95 whitespace-nowrap"
              >
                🗑️ ล้างประวัติทั้งหมด
              </button>
            )}
          </div>
        </div>

        {scriptHistory.length === 0 ? (
          <div className="text-center py-12 text-white/30 text-xs italic border border-dashed border-white/10 rounded-2xl">
            📭 ยังไม่มีประวัติงานที่ผลิตสำเร็จสะสมในคลังครับบอส
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-white/10 text-indigo-200/80 font-bold">
                  <th className="p-3 w-[20%]">หัวข้อ (Topic)</th>
                  <th className="p-3 w-[20%]">พาดหัว (Headline)</th>
                  <th className="p-3 w-[25%]">บทพูด (Script)</th>
                  <th className="p-3 w-[18%]">เสียงพากย์ (Voiceover)</th>
                  <th className="p-3 w-[17%]">สถานะการตัดต่อ (Editing)</th>
                  <th className="p-3 text-center w-[10%]">จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {scriptHistory
                  .filter(x => {
                    const q = searchHistoryQuery.toLowerCase();
                    return (x.topic || '').toLowerCase().includes(q) || (x.script || '').toLowerCase().includes(q) || (x.headline || '').toLowerCase().includes(q);
                  })
                  .map((item) => {
                    const isExpanded = expandedHistoryId === item.id;
                    const hasHeadline = !!item.headline;
                    const hasScript = !!item.script;
                    const hasVoice = !!item.audioUrl;
                    const hasVideo = !!item.videoUrl;
                    const isActive = loadedHistoryId === item.id;
                    const isResumingThis = resumingHistoryId === item.id;

                    return (
                      <tr 
                        key={item.id} 
                        className={`border-b border-white/5 transition-all ${
                          isResumingThis ? 'bg-teal-500/10 border-l-2 border-l-teal-500 animate-pulse' : (isActive ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' : 'hover:bg-white/5')
                        }`}
                      >
                        {/* 1. หัวข้อ */}
                        <td className="p-3 space-y-1.5">
                          <p className="font-bold text-white text-xs">{item.topic}</p>
                          <p className="text-[10px] text-white/40 font-mono">
                            📅 {item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : ''}
                          </p>
                          {item.newsPayload?.images && item.newsPayload.images.length > 0 && (
                            <div className="mt-1 p-1.5 rounded-lg bg-black/40 border border-white/5 space-y-1">
                              <span className="text-[9px] text-orange-400 font-extrabold flex items-center gap-0.5">
                                📸 รูปข่าวพร้อมใช้ ({item.newsPayload.images.length})
                              </span>
                              <div className="flex gap-1 overflow-x-auto pb-0.5 max-w-[200px] scrollbar-thin">
                                {item.newsPayload.images.map((imgUrl: string, imgIdx: number) => {
                                  const src = imgUrl.startsWith('http') ? imgUrl : `${BACKEND_BASE}${imgUrl}`;
                                  return (
                                    <img 
                                      key={imgIdx}
                                      src={src} 
                                      alt={`scraped-hist-${imgIdx}`}
                                      style={{ width: '28px', height: '28px', objectFit: 'cover' }}
                                      className="rounded border border-white/10 hover:border-teal-400 transition-all cursor-pointer"
                                      onClick={() => window.open(src, '_blank')}
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><rect width="20" height="20" fill="%23222"/></svg>';
                                      }}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </td>

                        {/* 2. พาดหัว */}
                        <td className="p-3">
                          {hasHeadline ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ✅ เขียนแล้ว
                              </span>
                              <p className="text-[11px] text-white/70 italic leading-snug font-medium">"{item.headline}"</p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              ❌ ยังไม่ได้เขียน
                            </span>
                          )}
                        </td>

                        {/* 3. บทพูด */}
                        <td className="p-3 space-y-1">
                          {hasScript ? (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                                ✅ เขียนแล้ว
                              </span>
                              <p className="text-white/70 leading-relaxed text-[11px]">
                                {isExpanded ? item.script : `${item.script.substring(0, 60)}${item.script.length > 60 ? '...' : ''}`}
                              </p>
                              {item.script.length > 60 && (
                                <button
                                  onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1 block"
                                >
                                  {isExpanded ? '🔺 ย่อบท' : '🔹 อ่านบทเต็ม'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              ❌ ยังไม่ได้เขียน
                            </span>
                          )}
                        </td>

                        {/* 4. เสียงพากย์ */}
                        <td className="p-3">
                          {hasVoice ? (
                            <div className="space-y-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ✅ พากย์แล้ว
                              </span>
                              <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5 w-max">
                                <button
                                  onClick={() => handlePlayHistoryAudio(item)}
                                  className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                                    playingHistoryId === item.id ? 'bg-red-500 text-white animate-pulse' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                  }`}
                                  title={playingHistoryId === item.id ? 'หยุดเล่น' : 'ทดลองฟังเสียง'}
                                >
                                  {playingHistoryId === item.id ? '⏸️' : '▶️'}
                                </button>
                                <div className="text-[10px] pr-2">
                                  <p className="font-bold text-indigo-300">🔊 {getVoiceDisplayName(item.voiceId)}</p>
                                  <p className="text-white/40">{item.duration || 0}s</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              ❌ ยังไม่ได้พากย์
                            </span>
                          )}
                        </td>

                        {/* 5. สถานะการตัดต่อ */}
                        <td className="p-3">
                          {hasVideo ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                ✅ ตัดต่อเสร็จแล้ว
                              </span>
                              <p className="text-[10px] text-white/50 truncate max-w-[170px] font-mono" title={item.videoUrl}>
                                📁 {item.videoUrl?.split('/').pop()}
                              </p>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
                              ❌ ยังไม่ได้ตัดต่อ
                            </span>
                          )}
                        </td>

                        {/* 6. จัดการ */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col gap-1.5 items-center justify-center">
                            <button
                              onClick={() => handleLoadFromHistory(item)}
                              disabled={isResumingThis || isResumingAllHistory}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-indigo-950/20 w-full"
                              title="โหลดข้อมูลขึ้นแก้ไขแมนนวล"
                            >
                              📥 โหลดทำงาน
                            </button>
                            {(!item.audioUrl || !item.videoUrl) && (
                              <button
                                onClick={() => handleSmartHistoryResume(item)}
                                disabled={resumingHistoryId !== null || isResumingAllHistory}
                                className="px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-md w-full"
                                title="รันส่วนที่เหลือต่อจนเสร็จสมบูรณ์"
                              >
                                {isResumingThis ? '⏳ กำลังรัน...' : '⚡ รันส่วนที่เหลือ'}
                              </button>
                            )}
                            {item.videoUrl && (
                              <button
                                onClick={async () => {
                                  if (!confirm('ต้องการตัดต่อวิดีโอใหม่สำหรับรายการนี้ใช่หรือไม่?')) return;
                                  setIsAssembling(true);
                                  addLog(`🎬 กำลัง re-render: "${item.topic}"...`, 'info');
                                  const activeBgm = await resolveBgmFileRandomly(bgmFile);
                                  try {
                                    let newsPayloadToUse = item.newsPayload;
                                    if (!newsPayloadToUse) {
                                      newsPayloadToUse = await tryRecoverNewsPayload(item) || undefined;
                                      if (newsPayloadToUse) {
                                        item.newsPayload = newsPayloadToUse;
                                      }
                                    }
                                    const renderPath = await handleRenderSingleVideo(
                                      item.topic,
                                      item.audioUrl || '',
                                      item.duration || 60,
                                      item.srtContent || '',
                                      item.headline || '',
                                      activeBgm,
                                      undefined,
                                      newsPayloadToUse
                                    );
                                    if (renderPath) {
                                      saveToHistory({ ...item, videoUrl: renderPath });
                                      addLog(`✅ Re-render สำเร็จ: ${renderPath}`, 'success');
                                    } else {
                                      addLog(`❌ Re-render ล้มเหลว`, 'error');
                                    }
                                  } finally {
                                    setIsAssembling(false);
                                  }
                                }}
                                disabled={isResumingThis || isResumingAllHistory}
                                className="px-2.5 py-1 bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-md w-full"
                                title="ตัดต่อวิดีโอใหม่ด้วยการตั้งค่าปัจจุบัน"
                              >
                                🔄 ตัดต่อใหม่
                              </button>
                            )}
                            {item.srtContent && (
                              <button
                                onClick={() => {
                                  setSelectedSrtForView({
                                    topic: item.topic || '(ไม่มีหัวข้อ)',
                                    content: item.srtContent || ''
                                  });
                                }}
                                className="px-2.5 py-1 bg-cyan-900/50 hover:bg-cyan-800/50 text-cyan-300 rounded border border-cyan-500/20 font-bold text-[10px] w-full"
                                title="ดูข้อมูลซับไตเติ้ล SRT"
                              >
                                📝 ดูซับ
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteHistory(item.id)}
                              disabled={isResumingThis || isResumingAllHistory}
                              className="px-2.5 py-1 bg-red-950/40 hover:bg-red-900/40 text-red-300 rounded border border-red-500/20 font-bold text-[10px] w-full"
                              title="ลบออกจากคลังประวัติ"
                            >
                              🗑️ ลบประวัติ
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderBatchInputAndControls = () => {
    const getActivePipelineStatus = () => {
      if (isGeneratingScript) return '📝 กำลังเขียนบทสคริปต์ด้วย AI...';
      if (isGeneratingHeadline) return '✍️ กำลังคิดพาดหัวด้วย AI...';
      if (isGeneratingVoice) return '🎙️ กำลังเจนเสียงพากย์ด้วย AI...';
      if (isAssembling) return '🎬 กำลังประกอบฟุตเทจและเรนเดอร์วิดีโอ...';
      if (isDraftingAll) return '⏳ กำลังเจนสคริปต์ทั้งหมดแบบกลุ่มด้วย AI...';
      
      if (batchStatus === 'running' && currentBatchIndex >= 0 && batchItems[currentBatchIndex]) {
        const item = batchItems[currentBatchIndex];
        const stepName = item.status === 'scripting' ? '📝 เขียนบท AI' :
                         item.status === 'voicing' ? '🎙️ เจนเสียง AI' :
                         item.status === 'subtitling' ? '🔤 ทำซับไตเติ้ล' :
                         item.status === 'rendering' ? '🎬 เรนเดอร์วิดีโอ' :
                         '⏳ ประมวลผล';
        return `⚡ [คิวที่ ${currentBatchIndex + 1}/${batchItems.length}] ${stepName}: ${item.topic}...`;
      }
      
      return null;
    };

    return (
      <div className="p-6 rounded-3xl border border-teal-500/20 bg-slate-900/60 backdrop-blur-md shadow-2xl space-y-6 animate-fade-in">
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
            🚀 ระบบรันคิวผลิตวิดีโอชุดแบบต่อเนื่องอัตโนมัติ (Batch Production Engine & Controls)
          </h2>
          <span className="text-xs text-amber-300 font-bold">* ป้อนหัวข้อเพื่อทำวิดีโอครบวงจรทันที</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Column 1: Input text area (4 cols) */}
          <div className="space-y-4 lg:col-span-4 flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/70 block">
                ✍️ ป้อนหัวข้อที่ต้องการผลิต (1 หัวข้อต่อ 1 บรรทัด)
              </label>
              <textarea
                value={batchTopicInput}
                onChange={(e) => setBatchTopicInput(e.target.value)}
                className="w-full h-52 p-3 rounded-xl bg-black/45 border border-white/10 text-white text-xs focus:border-purple-500/80 outline-none resize-none font-mono leading-relaxed"
                placeholder="เช่น&#10;วิธีเอาชนะความขี้เกียจด้วยกฎ 2 นาที&#10;จิตวิทยาคนรวยที่โรงเรียนไม่เคยสอน&#10;3 เคล็ดลับดึงดูดความสำเร็จคนดัง"
              />
              <p className="text-[10px] text-white/40">* สุ่มฟุตเทจ เจนสคริปต์ พากย์เสียง ทำซับ ตัดต่อ และเซฟไฟล์ ครบทุกอย่างอัตโนมัติ</p>
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleParseBatchInput}
                  disabled={isDraftingAll || batchStatus === 'running'}
                  className="px-3 py-2.5 bg-indigo-700/50 hover:bg-indigo-600/70 border border-indigo-500/15 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex-1 active:scale-95"
                >
                  📥 นำเข้าคิวเตรียมรัน
                </button>
                <button
                  onClick={handleDraftAllScripts}
                  disabled={isDraftingAll || batchStatus === 'running' || batchItems.length === 0}
                  className="px-3 py-2.5 bg-purple-700/50 hover:bg-purple-600/70 border border-purple-500/15 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex-1 active:scale-95"
                >
                  {isDraftingAll ? '⏳ กำลังเจน...' : '✍️ สั่ง AI เจนล่วงหน้า'}
                </button>
              </div>

              <button
                onClick={handleAllInOneLaunch}
                disabled={isDraftingAll || batchStatus === 'running'}
                className="w-full py-3 bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 hover:from-teal-400 hover:via-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-40 flex items-center justify-center gap-2 border border-indigo-500/30"
              >
                ⚡ คลิกเดียวทำคลิปครบวงจรทันที (All-in-One Auto Pilot)
              </button>
            </div>
          </div>

          {/* Column 2 & 3 Combined: Stacked Queue items List + Log Panel (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Live Queue items Status */}
            <div className="p-4 rounded-2xl border border-white/10 bg-black/30 flex flex-col justify-between h-[310px] gap-2 shadow-inner">
              <div className="flex justify-between items-center border-b border-white/10 pb-2 shrink-0">
                <span className="text-xs font-bold text-teal-400 block">📋 รายการและขั้นตอนรันคิว ({batchItems.length} ตอน)</span>
                {batchItems.length > 0 && (
                  <button
                    onClick={clearCompletedBatch}
                    className="text-[10px] text-red-400 hover:text-red-300 font-bold"
                  >
                    ** เคลียร์คิว
                  </button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-1.5 scrollbar-thin">
                {batchItems.length === 0 ? (
                  <div className="text-center py-16 text-white/30 text-xs italic">
                    📭 คิวผลิตว่างเปล่า ป้อนหัวข้อซ้ายมือเพื่อนำเข้าเตรียมรันครับบอส!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {batchItems.map((item, idx) => {
                      let stClass = 'text-white/60 bg-white/5';
                      let statusText = 'รอดำเนินการ (Pending)';
                      if (item.status === 'scripting') { stClass = 'text-purple-300 bg-purple-950/40 border border-purple-500/30'; statusText = '📝 กำลังเขียนบท'; }
                      if (item.status === 'voicing') { stClass = 'text-blue-300 bg-blue-950/40 border border-blue-500/30'; statusText = '🎙️ กำลังพากย์เสียง'; }
                      if (item.status === 'subtitling') { stClass = 'text-cyan-300 bg-cyan-950/40 border border-cyan-500/30'; statusText = '🔤 ทำซับไตเติ้ล'; }
                      if (item.status === 'rendering') { stClass = 'text-amber-300 bg-amber-950/40 border border-amber-500/30'; statusText = '🎬 กำลังประกอบ/เรนเดอร์'; }
                      if (item.status === 'completed') { stClass = 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30'; statusText = '✅ เสร็จสมบูรณ์'; }
                      if (item.status === 'failed') { stClass = 'text-red-300 bg-red-950/40 border border-red-500/30'; statusText = `❌ ล้มเหลว (${item.error || ''})`; }

                      return (
                        <div key={idx} className="flex flex-col p-3 rounded-xl bg-slate-900/90 border border-white/5 text-[11px] gap-2 shadow hover:border-teal-500/30 transition-all">
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className="font-bold text-white/95 leading-normal break-words" title={item.topic}>
                                {idx + 1}. {item.topic}
                              </span>
                              {item.newsPayload?.images && item.newsPayload.images.length > 0 && (
                                <span className="text-[9px] text-orange-400 font-extrabold mt-1">
                                  📸 รูปข่าวประกอบ ({item.newsPayload.images.length} รูป)
                                </span>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold shrink-0 ${stClass}`}>{statusText}</span>
                          </div>

                          {/* Attached News Images Preview Box */}
                          {item.newsPayload?.images && item.newsPayload.images.length > 0 && (
                            <div className="p-2 rounded-lg bg-black/45 border border-white/5 space-y-1.5">
                              <div className="text-[8px] text-white/50 flex justify-between items-center font-bold tracking-wider">
                                <span>🖼️ PICTURES ATTACHED</span>
                                <span className="text-teal-400">SLIDESHOW B-ROLL</span>
                              </div>
                              <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-white/10" style={{ width: '100%' }}>
                                {item.newsPayload.images.map((imgUrl: string, imgIdx: number) => {
                                  const src = imgUrl.startsWith('http') ? imgUrl : `${BACKEND_BASE}${imgUrl}`;
                                  return (
                                    <div key={imgIdx} className="relative shrink-0" style={{ width: '36px', height: '36px' }}>
                                      <img 
                                        src={src} 
                                        alt={`scraped-${imgIdx}`}
                                        style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                                        className="rounded-lg border border-white/10 hover:border-teal-400 transition-all cursor-pointer hover:scale-105"
                                        onClick={() => window.open(src, '_blank')}
                                        onError={(e) => {
                                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36"><rect width="36" height="36" fill="%23222"/></svg>';
                                        }}
                                      />
                                      <span className="absolute bottom-0 right-0 bg-black/80 text-[7px] text-white/90 px-1 rounded-tl-md rounded-br-md font-bold">
                                        {imgIdx + 1}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Batch engine control buttons */}
              <div className="flex gap-2 w-full pt-2 border-t border-white/5 shrink-0">
                <button
                  onClick={() => executeBatchQueue()}
                  disabled={batchStatus === 'running' || batchItems.length === 0}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-lg active:scale-95"
                >
                  ▶️ เริ่มรันคิว
                </button>
                <button
                  onClick={handlePauseBatch}
                  disabled={batchStatus !== 'running'}
                  className="px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center active:scale-95"
                  title="พักการทำงานชั่วคราว"
                >
                  ⏸️ พัก
                </button>
                <button
                  onClick={handleStopBatch}
                  disabled={batchStatus !== 'running' && batchStatus !== 'paused'}
                  className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center active:scale-95"
                  title="หยุดคิวรันทั้งหมด"
                >
                  ⏹️ หยุด
                </button>
              </div>
            </div>

            {/* Monospace terminal console monitor log */}
            <div className="p-4 rounded-2xl border border-white/10 bg-black flex flex-col justify-between min-h-[160px] max-h-[200px] gap-2 shadow-inner">
              <div className="flex justify-between items-center border-b border-white/10 pb-1.5 shrink-0">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-teal-400 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full bg-teal-400 ${getActivePipelineStatus() ? 'animate-ping' : ''}`} />
                    📟 Log Console ({logs.length})
                  </span>
                  {/* Flashing Status Text */}
                  {getActivePipelineStatus() && (
                    <span className="text-[10px] text-amber-300 font-extrabold animate-pulse leading-none mt-0.5 select-text truncate max-w-[400px]" title={getActivePipelineStatus() || ''}>
                      {getActivePipelineStatus()}
                    </span>
                  )}
                </div>
                <div className="flex gap-2 items-center shrink-0">
                  {logs.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setLogs([])}
                      className="text-[10px] text-red-400 hover:text-red-300 font-bold px-2 py-0.5 rounded border border-red-500/20 bg-red-500/5 transition-all"
                    >
                      🧹 ล้าง Log
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-2 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px] text-emerald-400 overflow-y-auto space-y-0.5 select-text scrollbar-thin flex-1">
                {logs.length === 0 ? (
                  <div className="text-white/30 text-xs italic py-6 text-center">📟 รอเริ่มระบบ... Logs จะขึ้นเมื่อรันคิวครับบอส</div>
                ) : (
                  logs.map((log, idx) => (
                    <div key={idx} className="whitespace-pre-wrap leading-snug">{log}</div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen" style={{ backgroundColor: 'var(--bg-main)', fontFamily: 'system-ui' }}>
      
      {/* Sleek Gradient Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-teal-900/40 border border-purple-500/20 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            🎬 Automated Vertical Video Suite
          </h1>
          <p className="text-indigo-200/70 text-sm mt-1">
            ระบบปัญญาประดิษฐ์ผลิตวิดีโอสั้นแนวตั้งอัตโนมัติครบวงจร (สคริปต์สไตล์ AI · เสียงพากย์พรีเมียม · ซับไตเติ้ลอัจฉริยะ · WYSIWYG Editor)
          </p>
        </div>

        {/* Real-time OpenRouter Profile Selector */}
        <div className="flex items-center gap-2 flex-wrap bg-slate-950/40 p-2.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <span className="text-[10px] text-purple-300 font-bold uppercase tracking-wider whitespace-nowrap">🔑 OpenRouter Profile:</span>
          <select
            value={selectedOpenRouterProfileId}
            onChange={(e) => {
              setSelectedOpenRouterProfileId(e.target.value);
            }}
            className="bg-slate-900/95 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 cursor-pointer focus:outline-none focus:border-teal-400 min-w-48 font-sans shadow-md"
          >
            <option value="default" className="bg-slate-950 text-white">⚙️ ใช้คีย์หลักเบราว์เซอร์ (Default)</option>
            {dbProfiles.filter(p => p.service_name === 'openrouter').map(p => (
              <option key={p.id} value={String(p.id)} className="bg-slate-950 text-white font-sans">
                👤 {p.key_name} (SQLite)
              </option>
            ))}
            <option value="manual" className="bg-slate-950 text-white">✍️ กรอกคีย์เองแบบแมนนวล...</option>
          </select>

          {selectedOpenRouterProfileId === 'manual' && (
            <input
              type="password"
              placeholder="กรอก sk-or-... เพื่อเปิดใช้งาน AI"
              value={manualOpenRouterKey}
              onChange={(e) => {
                const val = e.target.value;
                setManualOpenRouterKey(val);
                localStorage.setItem('openrouter_key', val);
              }}
              className="bg-slate-900/95 border border-purple-500/30 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-teal-400 w-60 shadow-md"
            />
          )}
        </div>
      </div>

      {/* ── News-to-Video Mode Panel (NEW) ── */}
      {newsMode && newsPayload && (
        <div style={{
          padding: 24,
          borderRadius: 20,
          background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(236,72,153,0.08), rgba(139,92,246,0.08))',
          border: '1px solid rgba(249,115,22,0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Animated glow border */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 3,
            background: 'linear-gradient(90deg, #f97316, #ec4899, #8b5cf6, #06b6d4, #f97316)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s linear infinite',
          }} />
          
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 28 }}>📰</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>โหมดสร้างคลิปข่าว</span>
                  <span style={{
                    background: 'linear-gradient(135deg, #f97316, #ec4899)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 800,
                    padding: '2px 10px',
                    borderRadius: 20,
                    letterSpacing: 1,
                    textTransform: 'uppercase',
                    boxShadow: '0 0 12px rgba(249,115,22,0.4)',
                    animation: 'pulse 2s ease-in-out infinite',
                  }}>✨ NEW</span>
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                  {newsPayload.source && <span style={{ marginRight: 8 }}>📡 {newsPayload.source}</span>}
                  ส่งมาจาก Discovery Portal
                </div>
              </div>
            </div>
            <button
              onClick={() => { setNewsMode(false); setNewsPayload(null); }}
              style={{
                padding: '4px 12px', borderRadius: 8,
                border: '1px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)',
                color: '#f87171', fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
              }}
            >✕ ปิด</button>
          </div>

          {/* News title */}
          <div style={{
            padding: 14, borderRadius: 12,
            background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(100,116,139,0.2)',
            marginBottom: 16,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', lineHeight: 1.5 }}>
              {newsPayload.title}
            </div>
          </div>

          {/* Image thumbnails */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              📸 รูปประกอบข่าว ({newsPayload.images.length} รูป)
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {newsPayload.images.slice(0, 10).map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`news-img-${idx}`}
                  style={{
                    width: 72, height: 72, objectFit: 'cover', borderRadius: 10,
                    border: '2px solid rgba(249,115,22,0.3)',
                    transition: 'transform 0.2s',
                  }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              ))}
            </div>
          </div>

          {/* Settings row */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 16 }}>
            {/* Duration selector */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>⏱️ ความยาวคลิป</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[
                  { label: '30s', value: 30 },
                  { label: '1m', value: 60 },
                  { label: '2m', value: 120 },
                  { label: '3m', value: 180 },
                ].map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setNewsTargetDuration(opt.value)}
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      border: `1px solid ${newsTargetDuration === opt.value ? 'rgba(249,115,22,0.6)' : 'rgba(100,116,139,0.3)'}`,
                      background: newsTargetDuration === opt.value
                        ? 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(236,72,153,0.2))'
                        : 'rgba(15,23,42,0.4)',
                      color: newsTargetDuration === opt.value ? '#fb923c' : '#94a3b8',
                      fontSize: 12, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >{opt.label}</button>
                ))}
              </div>
            </div>

            {/* Voice selector (compact) */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6 }}>🎤 เสียงพากย์</div>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                style={{
                  padding: '6px 10px', borderRadius: 8,
                  border: '1px solid rgba(100,116,139,0.3)',
                  background: 'rgba(15,23,42,0.6)',
                  color: '#e2e8f0', fontSize: 11, fontWeight: 600,
                  maxWidth: 280, cursor: 'pointer',
                }}
              >
                {KIEAI_VOICES.map(v => (
                  <option key={v.id} value={v.id}>{v.name.split('(')[0].trim()}</option>
                ))}
                {MACOS_VOICES.map(v => (
                  <option key={v.id} value={v.id}>🖥️ {v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <button
              onClick={handleNewsToVideo}
              disabled={newsStatus !== 'idle' && newsStatus !== 'done' && newsStatus !== 'error'}
              style={{
                padding: '10px 24px', borderRadius: 12,
                background: (newsStatus === 'idle' || newsStatus === 'done' || newsStatus === 'error')
                  ? 'linear-gradient(135deg, #f97316, #ec4899)'
                  : 'rgba(100,116,139,0.3)',
                color: '#fff', fontSize: 14, fontWeight: 800,
                cursor: (newsStatus === 'idle' || newsStatus === 'done' || newsStatus === 'error') ? 'pointer' : 'not-allowed',
                border: 'none',
                display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 0 20px rgba(249,115,22,0.3)',
                transition: 'all 0.3s',
                opacity: (newsStatus !== 'idle' && newsStatus !== 'done' && newsStatus !== 'error') ? 0.6 : 1,
              }}
            >
              🚀 สร้างคลิปข่าว
              <span style={{
                background: 'rgba(255,255,255,0.2)',
                fontSize: 9, fontWeight: 800,
                padding: '1px 8px', borderRadius: 8,
              }}>✨ NEW</span>
            </button>

            {newsStatus !== 'idle' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 10,
                background: newsStatus === 'done' ? 'rgba(16,185,129,0.1)' : newsStatus === 'error' ? 'rgba(239,68,68,0.1)' : 'rgba(249,115,22,0.1)',
                border: `1px solid ${newsStatus === 'done' ? 'rgba(16,185,129,0.3)' : newsStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(249,115,22,0.3)'}`,
              }}>
                {newsStatus === 'done' ? '✅' : newsStatus === 'error' ? '❌' : '⏳'}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  color: newsStatus === 'done' ? '#34d399' : newsStatus === 'error' ? '#f87171' : '#fb923c',
                }}>
                  {newsStatus === 'scripting' && 'กำลังเขียน Script...'}
                  {newsStatus === 'downloading' && 'กำลังดาวน์โหลดรูป...'}
                  {newsStatus === 'voicing' && 'กำลังสร้างเสียง...'}
                  {newsStatus === 'subtitling' && 'กำลังสร้างซับ...'}
                  {newsStatus === 'building-slideshow' && 'กำลังสร้าง Slideshow...'}
                  {newsStatus === 'rendering' && 'กำลัง Render...'}
                  {newsStatus === 'done' && 'สำเร็จ!'}
                  {newsStatus === 'error' && 'ล้มเหลว'}
                </span>
              </div>
            )}
          </div>

          {/* Progress log */}
          {newsStatusLog.length > 0 && (
            <div style={{
              padding: 10, borderRadius: 10,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(100,116,139,0.15)',
              maxHeight: 160, overflowY: 'auto',
              fontFamily: 'monospace', fontSize: 10, color: '#34d399',
              lineHeight: 1.6,
            }}>
              {newsStatusLog.map((log, idx) => (
                <div key={idx} style={{ whiteSpace: 'pre-wrap' }}>{log}</div>
              ))}
            </div>
          )}

          {/* Result path */}
          {newsResultPath && (
            <div style={{
              marginTop: 12, padding: '8px 14px', borderRadius: 10,
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
              fontSize: 11, color: '#34d399', fontWeight: 600,
              wordBreak: 'break-all',
            }}>
              📂 ไฟล์: {newsResultPath}
            </div>
          )}
        </div>
      )}

      {/* ส่วนที่ 1: การตั้งค่าพื้นฐาน (Basic Settings Dashboard) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* คอลัมน์ด้านซ้ายและกลาง: การตั้งค่าต่างๆ */}
        <div className="xl:col-span-2 space-y-6">
          {renderFolderSettings()}
          {renderBrainSettings()}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderVoiceSettings()}
            {renderSubtitleSettings()}
          </div>
          {renderBgmSettings()}
        </div>

        {/* คอลัมน์ด้านขวา: หน้าจอ WYSIWYG Preview และตัวเลือกการจัดแต่งแถบพาดหัว */}
        <div className="xl:col-span-1 space-y-6">
          {renderPreviewPanel()}
        </div>
      </div>

      {/* ส่วนที่ 2: คลังประวัติงานที่สำเร็จสะสม (Saved Script & Voiceover Library Catalog) */}
      {renderHistoryLibrary()}

      {/* ส่วนที่ 3: ระบบป้อนคิวงานแบบ Batch และหน้าจอ Monitor Logs */}
      {renderBatchInputAndControls()}

      {/* SRT Subtitle Viewer Modal */}
      {selectedSrtForView && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => {
            setSelectedSrtForView(null);
            setCopiedSrt(false);
          }}
        >
          <div 
            className="relative w-full max-w-2xl flex flex-col text-white shadow-2xl p-6 animate-zoom-in"
            style={{
              maxHeight: '85vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '24px',
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(99, 102, 241, 0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xl">📝</span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-indigo-400">
                    ซับไตเติ้ล SRT เต็มรูปแบบ
                  </h3>
                  <p className="text-xs text-white/50 truncate max-w-[450px]" title={selectedSrtForView.topic}>
                    หัวข้อ: {selectedSrtForView.topic}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedSrtForView(null);
                  setCopiedSrt(false);
                }}
                className="p-1 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-all text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Content Area */}
            <div 
              className="flex-1 pr-1 font-mono text-xs text-slate-300 leading-relaxed"
              style={{
                maxHeight: '50vh',
                overflowY: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '16px'
              }}
            >
              <pre className="whitespace-pre-wrap select-all font-mono" style={{ margin: 0 }}>{selectedSrtForView.content}</pre>
            </div>

            {/* Footer / Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/10 mt-4 shrink-0">
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(selectedSrtForView.content);
                    setCopiedSrt(true);
                    setTimeout(() => setCopiedSrt(false), 2000);
                  } catch (err) {
                    console.error('Failed to copy SRT:', err);
                  }
                }}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5 ${
                  copiedSrt
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/20'
                }`}
              >
                {copiedSrt ? '✅ คัดลอกสำเร็จ!' : '📋 คัดลอกซับไตเติ้ลทั้งหมด'}
              </button>
              <button
                onClick={() => {
                  setSelectedSrtForView(null);
                  setCopiedSrt(false);
                }}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-all active:scale-95 border border-white/10"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );

}