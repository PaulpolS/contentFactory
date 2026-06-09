import React, { useState, useEffect, useRef } from 'react';

// Draggable Subtitle Style Interface
interface SubtitleStyle {
  fontName: string;
  fontSize: number;
  marginV: number;
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
    name: '?�� แถบแด�?�?��าสสิ�? (ยอดฮิ�?)',
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
    name: '?�� แถบ�?หลือ�?��อบม�?',
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
    name: '?�� กล่อ�?��ปร่�?�?��โม�?ดิร์�?',
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
    name: '?�� อักษร�?หลือ�?��อบดำ (Reels)',
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
    name: '?�� อักษรแด�?��อบดำ�?�?���?ข้ม (CapCut)',
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
    name: '?�� นีออนฟ้าระยิบระยั�? (Neon Cyan)',
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
    name: '?�� นีออนม่ว�?��ว่า�? (Neon Purple)',
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
    name: '?�� อักษรทอ�?��รูหรา (Gold Luxury)',
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
    name: '?�� นีออนชมพูหวา�? (Neon Pink)',
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
    name: '?�? �?���?บอร์พั�?��์กล่อ�?�?ขียวมะนาว',
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
    name: '?�� อักษรส้มขอบดำ�?��่โท�? (Sunset Orange)',
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
    name: '?�� �?บอร์รี่วิบวั�? (Sweet Berry)',
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
    name: '?�� กล่อ�?�?��ีม�?รโทร (Retro Cream)',
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
    name: '?�� นีออน�?ขียว�?ล�?ซอร�? (Laser Green)',
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
    name: '?�� สามมิติแด�?�?�?��ดำ (3D Red Shadow)',
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
    name: '?�� กล่อ�?��าวขอบฟ้าพาส�?ทล (Teal Box)',
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
    name: '?�� อักษรดำกล่อ�?�?หลือ�? (Cyber Yellow)',
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
    name: 'ปรัชญาโบราณลึกซึ้�?',
    description: '�?ล่าด้วยน้ำ�?สีย�?��ุขุม มีการ�?ว้นจั�?��วะ�?���? �?ปรียบ�?ปรยกับธรรมชาติ มีพลั�?��ึ�?��ูดสติ',
    example: 'ก้อนหินที่อยู่�?��้น้ำ... �?��่�?�?��กลัวพายุฝ�? �?ช่น�?ดียวกับ�?��ขอ�?�?��ที่ผ่านโลกมามา�?...',
  },
  {
    id: 'sci-history',
    name: 'สาร�?��ีประวัติศาสตร์ตื่น�?ต้�?',
    description: 'ตื่นตาตื่น�?�? �?��้�?��วิ�?ศษณ์กระตุ้น�?��ามอยากรู�? �?��นพบ�?��ามลับที่ประวัติศาสตร์ซ่อน�?���?',
    example: 'ปี �?.ศ. 1922 �?��หลุมฝั�?��พอันมืดมิ�?... นักโบราณ�?��ี�?��้�?��นพบบา�?��ิ่�? ที่�?��่�?��รถูก�?ปิดออ�?!',
  },
  {
    id: 'tech-trend',
    name: 'ข่าว�?��ทีสุดล้ำอิน�?ทรนด�?',
    description: '�?ร�?�� กระชั�? สนุกสนา�? �?��่อ�?���?��่ว ทันโล�? �?หมาะสำหรับ�?��รุ่น�?��ม่วัยทำ�?���?',
    example: 'นี่�?��อสิ่�?��ี่จะ�?ปลี่ยนโลก�?��ณ�?��ตลอดกาล! วันนี้�?รามาดู 3 �?ท�?��นโลยีที่โ�?��รโหดกัน�?��ั�?...',
  },
];



const KIEAI_VOICES = [
  { id: 'Rachel', name: 'Rachel (หญิ�? - �?สีย�?��วา�? อบอุ่�? ละมุน�?ป�?��ธรรมชาติมากที่สุ�?)', lang: 'th-TH' },
  { id: 'Adam', name: 'Adam (ชาย - �?สีย�?��ล่อ �?ข้ม น่า�?ชื่อถือ �?ป�?��สากล �?ล่า�?รื่อ�?/ข่าวดี�?ลิศ)', lang: 'th-TH' },
  { id: 'Gigi', name: 'Gigi (หญิ�? - �?สีย�?��่า�?ริ�? สด�?�� มีพลั�? รีวิว/�?��ิปสั้�? TikTok)', lang: 'th-TH' },
  { id: 'Antoni', name: 'Antoni (ชาย - �?สีย�?��ุ�?า�? อบอุ่�? นุ่มลึ�? �?หมาะกับ�?��ิปพัฒนาตน�?อ�?)', lang: 'th-TH' },
  { id: 'Serena', name: 'Serena (หญิ�? - �?สีย�?��ิ่�? สุ�?า�? มั่น�?�? �?หมาะกับการบรรยาย/การสอ�?)', lang: 'th-TH' },
  { id: 'Nicole', name: 'Nicole (หญิ�? - �?สีย�?��ุ่มนวล �?รียบร้อย โทนกระซิบผ่อน�?��ายสบายหู)', lang: 'th-TH' },
  { id: 'Drew', name: 'Drew (ชาย - �?สีย�?�?ข้ม แข�?�?��ร�? วัยรุ่�? ทันสมัย)', lang: 'th-TH' },
  { id: 'Glinda', name: 'Glinda (หญิ�? - �?สีย�?�?�� กระจ่า�? กระฉับกระ�?ฉ�?)', lang: 'th-TH' },
];

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

const wrapText = (text: string, maxCharsPerLine = 22): string => {
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
  
  return resultLines.map(l => l.trim()).filter(Boolean).join('\n');
};


const hexToFfmpegColor = (hex: string, opacity: number) => {
  const cleanHex = hex.replace('#', '');
  const alphaHex = Math.round(opacity * 255).toString(16).padStart(2, '0');
  return `#${cleanHex}${alphaHex}`;
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
              text: systemPrompt ? `${systemPrompt}\n\n�?��ขอ�?พิ่ม�?ติม:\n${userPrompt}` : userPrompt
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
      throw new Error(`Google Gemini ส่�?��ลลัพธ์ว่า�?��ลับมา (Response data: ${JSON.stringify(data)})`);
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
      throw new Error(`OpenRouter ส่�?��ลลัพธ์ว่า�?��ลับมา (Response data: ${JSON.stringify(data)})`);
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
        throw new Error('กรุณาระบุ Kie.ai API Key �?��ส่วนตั้�?�?��าก่อ�?');
      }

      onLog?.(`กำลั�?��้อ�?��อ�?��ว AI พากย์�?สีย�? (Model: ${voiceId})...`, 'info');
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
        throw new Error(`�?��่�?��้รั�? Task ID แจ้�?��ลับจา�? API: ${JSON.stringify(createData)}`);
      }

      onLog?.(`รอ�?��วประมวลผล (Task ID: ${taskId.substring(0,6)}...)`, 'info');

      let attempt = 0;
      while (attempt < 100) {
        await new Promise(res => setTimeout(res, 2500));
        
        onLog?.(`กำลั�?��ระมวลผล�?สีย�?... (รอ ${attempt * 2.5} วินาที)`, 'info');

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
             throw new Error('ระบบแจ้�?��ถานะสำ�?ร�?��แล้ว แต่แยกหาลิ�?��์�?��ล์�?สีย�?��ากข้อมูล�?��่�?จอ');
          }
          
          const mockDurationSeconds = Math.max(1, text.length / 4);
          onLog?.(`�? สั�?�?�?��าะห์�?สีย�?��ากย์�?สร�?��สมบูรณ�?!`, 'success');
          return { 
            audioUrl,
            duration: Number(mockDurationSeconds.toFixed(1))
          };

        } else if (state === 'fail' || state === 'failed') {
          const reason = pollData?.data?.failMsg || pollData?.failMsg || 'Task Failed by Kie.ai backend';
          throw new Error(`การสร้า�?�?สีย�?��ากย์ล้ม�?หลว: ${reason}`);
        }
        
        attempt++;
      }

      throw new Error('หมด�?วลารอ (Timeout 250s) การสร้า�?�?สีย�?��ากย์ตอบสนอ�?��้า�?กิน�?�?');

    } catch (err: any) {
      onLog?.(`�? �?กิดข้อผิดพลา�?: ${err.message}`, 'error');
      setError(err.message || '�?กิดข้อผิดพลาด�?��การสร้า�?�?สีย�?');
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

export default function VerticalVideoSuitePortal() {
  const { generateAudio } = useKieTTS();
  // --- States ---
  const [channelConcept, setChannelConcept] = useState('�?��้�?��ามรู้จิตวิทยา พัฒนาตน�?อ�? ข้อ�?��ดการดำ�?นินชีวิ�?');
  const [copyStyles, setCopyStyles] = useState<CopyStyle[]>(() => {
    const saved = localStorage.getItem('auto_video_styles');
    return saved ? JSON.parse(saved) : DEFAULT_STYLES;
  });
  const [selectedStyleId, setSelectedStyleId] = useState<string>(() => {
    const saved = localStorage.getItem('auto_video_styles');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
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
  const [topic, setTopic] = useState('วิธี�?อาชนะ�?��ามขี้�?กียจด้วยก�? 2 นาที');
  const [script, setScript] = useState('');
  const [headline, setHeadline] = useState('ก�? 2 นาที ชนะ�?��ามขี้�?กียจสะสม');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingHeadline, setIsGeneratingHeadline] = useState(false);

  // TTS State
  const [voiceId, setVoiceId] = useState('Adam');
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

  // Subtitle Configuration State
  const [minWords, setMinWords] = useState(2);
  const [maxWords, setMaxWords] = useState(6);
  const [subStyle, setSubStyle] = useState<SubtitleStyle>({
    ...SUBTITLE_PRESETS[0],
    marginV: 120
  });
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

  // UX Highlight and Temporary Inputs Helper States
  const [activeHighlight, setActiveHighlight] = useState<'headline' | 'subtitle' | null>(null);
  const [tempHeadlineYInput, setTempHeadlineYInput] = useState<string | null>(null);
  const [tempSubtitleMarginVInput, setTempSubtitleMarginVInput] = useState<string | null>(null);
  const [showRenderedVideoInPreview, setShowRenderedVideoInPreview] = useState(true);

  // Video Assembly & BGM State
  const [sourceFolder, setSourceFolder] = useState(() => localStorage.getItem('auto_video_source_folder') || '');
  const [outputFolder, setOutputFolder] = useState(() => localStorage.getItem('auto_video_output_folder') || '');
  const [bgmFile, setBgmFile] = useState(() => localStorage.getItem('auto_video_bgm_file') || '');
  const [bgmVolume, setBgmVolume] = useState(0.12);
  const [isAssembling, setIsAssembling] = useState(false);
  const [assembledVideoPath, setAssembledVideoPath] = useState('');

  // Batch Queue & Running Engine
  const [batchTopicInput, setBatchTopicInput] = useState('');
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const [currentBatchIndex, setCurrentBatchIndex] = useState(-1);
  const [batchStatus, setBatchStatus] = useState<'idle' | 'running' | 'paused' | 'stopped'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  
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

  const silentMode = false;
  const silentDuration = 10;



  // Inline Brain Trainer states
  const [inlineBrainName, setInlineBrainName] = useState('');
  const [inlineBrainPasteText, setInlineBrainPasteText] = useState('');
  const [isAnalyzingInlineBrain, setIsAnalyzingInlineBrain] = useState(false);

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
    setAudioDuration(item.duration || silentDuration);
    
    if (item.srtContent) {
      setSrtContent(item.srtContent);
      // Simple parse of first line to show in preview
      const lines = item.srtContent.split('\n');
      const textLineIdx = lines.findIndex(l => l.includes('-->')) + 1;
      const parsedText = textLineIdx > 0 && textLineIdx < lines.length ? lines[textLineIdx] : '';
      setSrtSegments([{ index: 1, start: 0, end: item.duration || silentDuration, text: parsedText || item.script || '' }]);
    } else {
      const dur = item.duration || silentDuration;
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
        if (item.script !== script || item.headline !== headline) {
          item.script = script;
          item.headline = headline;
          
          if (silentMode) {
            const dur = item.duration || silentDuration;
            const newSrt = `1\n${formatTime(0)} --> ${formatTime(dur)}\n${script}\n`;
            item.srtContent = newSrt;
            
            // Sync to active preview states too
            setSrtContent(newSrt);
            setSrtSegments([{ index: 1, start: 0, end: dur, text: script }]);
          }
        }
        return next;
      });
    }
  }, [script, headline, selectedBatchItemIdxForPreview]);

  const handleDraftAllScripts = async () => {
    if (batchItems.length === 0) {
      alert('กรุณากรอกและสร้า�?��ารา�?��ัวข้อ�?ตรียมรันก่อนบอส!');
      return;
    }
    
    setIsDraftingAll(true);
    addLog('�?ริ่มกระบวนการ�?ขียนบท�?��ามและพาดหัวทั้�?��มด�?���?��ว...', 'batch');

    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      if (item.status === 'completed') continue;

      updateItemStatus(i, 'scripting');
      addLog(`[${i+1}/${batchItems.length}] กำลั�?�?จน�?ขียนบท�?��ามหัวข้อ: "${item.topic}"...`, 'info');

      try {
        const scriptResult = await handleGenerateScript(item.topic, selectedStyleId);
        if (scriptResult) {
          const dur = item.duration || silentDuration;
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
          addLog(`�? �?ขียนบท�?��ามสำ�?ร�?��สำหรั�?: ${item.topic}`, 'success');
        } else {
          updateItemStatus(i, 'failed', '�?ขียนบท�?��ามล้ม�?หลว');
        }
      } catch (err: any) {
        updateItemStatus(i, 'failed', err.message || 'Error scripting');
      }
    }

    setIsDraftingAll(false);
    addLog('?�� �?ขียนบท�?��ามและพาดหัว�?สร�?��สิ้นทุกรายการ�?���?��วแล้ว! บอสสามารถ�?ลือกดูพรีวิวและปรับตำแหน่�?��ต่ละตอน�?��้จากกล่อ�?�?ลือกด้านบนขวา�?��้�?ลย�?��ั�?', 'success');
  };

  // Keep ref updated to avoid stale closures in the batch loop
  useEffect(() => {
    batchStatusRef.current = batchStatus;
  }, [batchStatus]);

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
      fetch('/api/get-app-data?key=brains')
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
            fetch('/api/save-app-data', {
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

  // Auto-sync active API Keys from SQLite DB to localStorage on mount for zero-configuration startup
  useEffect(() => {
    const syncApiKeysFromDb = async () => {
      try {
        const res = await fetch('/api/vault/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            data.data.forEach((row: any) => {
              const service = row.service_name;
              const key = row.credential_key?.trim();
              if (key && key !== `MOCK_${service.toUpperCase()}_KEY`) {
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

  // Terminal scroll to bottom
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const addLog = (msg: string, type: 'info' | 'success' | 'error' | 'batch' = 'info') => {
    const time = new Date().toLocaleTimeString();
    let prefix = '[INFO]';
    if (type === 'success') prefix = '�? [SUCCESS]';
    if (type === 'error') prefix = '�? [ERROR]';
    if (type === 'batch') prefix = '?�� [BATCH]';
    setLogs(prev => [...prev, `${time} ${prefix} ${msg}`]);
  };

  // --- Style Proposer (OpenRouter) ---
  const handleGenerateStyles = async () => {
    let apiKey = getActiveOpenRouterKey();
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.startsWith('MOCK_')) {
      try {
        const res = await fetch('/api/vault/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const row = data.data.find((r: any) => r.service_name === 'openrouter');
            if (row && row.credential_key && row.credential_key.trim() !== '' && !row.credential_key.startsWith('MOCK_')) {
              apiKey = row.credential_key.trim();
              localStorage.setItem('openrouter_key', apiKey);
            }
          }
        }
      } catch (err) {}
    }

    if (!apiKey) {
      alert('กรุณาตั้�?�?��า OpenRouter API Key �?��กล่อ�?�?มนูด้านบนก่อน�?��ับบอส!');
      return;
    }

    setIsGeneratingStyles(true);
    addLog('กำลั�?��่�?�?��น�?ซปต์ช่อ�?�?���? AI วิ�?�?��าะห์ส�?��ล์การ�?ขียนบ�?...', 'info');

    try {
      const systemPrompt = '�?��ณ�?��อผู้�?ชี่ยวชาญการสร้า�?���?��ล์วิดีโอสั้นแนวตั้�? (Shorts, TikTok, Reels) หน้าที่ขอ�?�?��ณ�?��อสร้า�?���?��ล์การ�?ล่า�?รื่อ�?�?ชิ�?��ารตลาดที่มี�?อกลักษณ์�?ฉพาะตัว 5 แบ�? �?าษา�?��ย ส่�?��ลับมา�?��รูปแบ�? JSON Array �?ท่านั้�? �?��่มีข้อ�?��ามอื่นนอกจา�? JSON โดยแต่ละส�?��ล์�?�? Array ต้อ�?��ีฟิลด�?: name (ชื่อส�?��ล์โดน�?), description (อธิบายการ�?��้น้ำ�?สีย�?��ละการ�?ว้นจั�?��วะ), และ example (ตัวอย่า�?���?��ิปต์สั้น�? 1 ประโย�?)';
      const userPrompt = `นี่�?��อ�?��น�?ซปต์ขอ�?��่อ�?��ั�?: "${channelConcept}" ช่วยออกแบบส�?��ล์การ�?ขียนบทที่�?หมาะสมที่สุ�? 5 รูปแบบ�?��้อ่านแล้วสะกดสายตา�?��`;
      const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, true);

      // Clean JSON formatting
      const cleanJson = aiResponse.substring(
        aiResponse.indexOf('['),
        aiResponse.lastIndexOf(']') + 1
      );
      const parsed: Array<{ name: string; description: string; example: string }> = JSON.parse(cleanJson);

      const generated: CopyStyle[] = parsed.map((item, index) => ({
        id: `gen-style-${Date.now()}-${index}`,
        name: item.name,
        description: item.description,
        example: item.example
      }));

      setCopyStyles(generated);
      localStorage.setItem('auto_video_styles', JSON.stringify(generated));
      setSelectedStyleId(generated[0].id);
      addLog('สร้า�?���?��ล์การ�?ล่า�?รื่อ�?��ำ�?ร�?�? 5 รูปแบบ�?รียบร้อย!', 'success');

    } catch (e: any) {
      addLog(`�?กิดข้อผิดพลาด�?��การสร้า�?���?��ล�?: ${e.message}`, 'error');
      alert(`ล้ม�?หลว: ${e.message}`);
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
  }) => {
    let savedId = item.id;
    setScriptHistory(prev => {
      const cleanTopic = item.topic || 'กำหนด�?อ�? (Manual Input)';
      
      // Match by ID if provided, otherwise fallback to topic + script matching
      const existingIndex = prev.findIndex(x => 
        (item.id && x.id === item.id) || 
        (!item.id && x.topic === cleanTopic && x.script === item.script)
      );
      
      let updated = [...prev];
      
      if (existingIndex >= 0) {
        savedId = updated[existingIndex].id || item.id || `hist-${Date.now()}`;
        updated[existingIndex] = {
          ...updated[existingIndex],
          ...item,
          id: savedId,
          updatedAt: new Date().toISOString()
        };
      } else {
        savedId = item.id || `hist-${Date.now()}`;
        const newItem = {
          ...item,
          id: savedId,
          topic: cleanTopic,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        updated = [newItem, ...updated];
      }
      
      localStorage.setItem('auto_video_script_history', JSON.stringify(updated));
      return updated;
    });

    if (savedId) {
      setLoadedHistoryId(savedId);
    }
  };

  const handleLoadFromHistory = (item: any) => {
    setLoadedHistoryId(item.id);
    setTopic(item.topic);
    setHeadline(item.headline);
    setScript(item.script);
    if (item.voiceId) {
      setVoiceId(item.voiceId);
    }
    if (item.audioUrl) {
      setAudioUrl(item.audioUrl);
      setAudioDuration(item.duration || 0);
      
      if (item.srtSegments && item.srtSegments.length > 0) {
        setSrtSegments(item.srtSegments);
        setSrtContent(item.srtContent || '');
        addLog(`?�� โหลดบท�?��าม, �?สีย�?��ากย�? และซับ�?���?ติ้ล ขอ�?��ัวข้อ "${item.topic}" สำ�?ร�?�?! (�?��่ต้อ�?�?��นวณซับ�?��ม�?)`, 'success');
      } else {
        triggerAutoSubtiming(item.script, item.duration || 0, item.audioUrl);
        addLog(`?�� โหลดบท�?��ามและ�?��ล์�?สีย�?��อ�?��ัวข้อ "${item.topic}" จาก�?��ั�?��ระวัติสำ�?ร�?�?! (กำลั�?�?��นวณซับ�?��ม�?)`, 'success');
      }
    } else {
      setAudioUrl('');
      setAudioDuration(0);
      setSrtSegments([]);
      setSrtContent('');
      addLog(`?�� โหลด�?ฉพาะบท�?��ามหัวข้อ "${item.topic}" สำ�?ร�?�?! (กรุณาสั�?�?�?��าะห์�?สีย�?�?พิ่ม�?ติม)`, 'info');
    }
  };

  const handleDeleteHistory = (id: string) => {
    if (!confirm('�?��ณแน่�?��หรือ�?��่ที่จะลบรายการประวัตินี�??')) return;
    setScriptHistory(prev => {
      const updated = prev.filter(x => x.id !== id);
      localStorage.setItem('auto_video_script_history', JSON.stringify(updated));
      return updated;
    });
    addLog('ลบรายการประวัติสำ�?ร�?�?', 'info');
  };

  const handleClearAllHistory = () => {
    if (!confirm('�??? �?���?ตือ�?: �?��ณต้อ�?��ารลบประวัติการ�?ขียนบทและ�?สีย�?��ากย์ทั้�?��มดหรือ�?���?? (�?��่สามารถกู้�?��น�?���?)')) return;
    setScriptHistory([]);
    localStorage.removeItem('auto_video_script_history');
    addLog('ล้า�?�?��ั�?��ระวัติทั้�?��มด�?รียบร้อยแล้ว', 'info');
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
      audio.play().catch(e => {
        console.error("Error playing history audio:", e);
        addLog(`? ????????????????: ${e.message}`, 'error');
      });
      audio.onended = () => setPlayingHistoryId(null);
      historyAudioRef.current = audio;
      setPlayingHistoryId(item.id);
    }
  };

  const handleGenerateScript = async (targetTopic: string, styleId: string) => {
    let apiKey = getActiveOpenRouterKey();
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.startsWith('MOCK_')) {
      try {
        const res = await fetch('/api/vault/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const row = data.data.find((r: any) => r.service_name === 'openrouter');
            if (row && row.credential_key && row.credential_key.trim() !== '' && !row.credential_key.startsWith('MOCK_')) {
              apiKey = row.credential_key.trim();
              localStorage.setItem('openrouter_key', apiKey);
            }
          }
        }
      } catch (err) {}
    }

    if (!apiKey) {
      addLog('?????????????????????????? ????????????????????????????', 'error');
      alert('???????: ?????????????????????????? ??????????????????????????????????');
      return null;
    }

    const selectedStyle = copyStyles.find(s => s.id === styleId);
    if (!selectedStyle) {
      if (copyStyles.length > 0) {
        const fallbackStyle = copyStyles[0];
        addLog(`?????????????? "${styleId}" ??????????????????????? "${fallbackStyle.name}" ??????????????`, 'info');
      } else {
        addLog('?????????????????????????? ????????????????????????????', 'error');
        alert('???????: ?????????????????????????? ??????????????????????????????????');
        return null;
      }
    }

    const styleObj = selectedStyle || copyStyles[0];

    addLog(`??????????????????????????????????: "${targetTopic}"...`, 'info');

    // Brain personality inject
    const brain = savedBrains.find(b => b.id === selectedBrainId);
    let brainContext = '';
    if (brain) {
      brainContext = `\n\n[??????????????????????????????????? (Persona & Writing Style of Selected Brain)]:
${brain.content}

**?????????????????????????:** ???????????????????????????????????????? ??????????????????? ????????????????????????????????????????????????????????? Persona ???????????????????????????????????????????????????!`;
    }

    // Series Mode inject
    const epMatch = targetTopic.match(/EP\.?\s*(\d+)/i);
    let seriesContext = '';
    if (epMatch) {
      const epNum = epMatch[1];
      seriesContext = `\n\n[???????????????? (Series Episode Context)]:
- ??????????????????????? "?????? ${epNum}" ???????????????????
- ?????????????????????????????????????? ????????????????? ????????????????????????????? ???????????????????????? ????????????????????????????????????????? ??????????????????????????????????????????????????????!`;
    }

    try {
      const systemPrompt = `?????????????????????????????????????????????? (Shorts/TikTok/Reels) ???????????

?????????????????????? (CRITICAL RULES):
1. ?????????? "???????????????" ????????????? AI ???????????????????
2. ???????????????????????/?????? (???? (????), (???????)) ??????????
3. ???????????????????????????????????? (???? "???????????????:", "??????:") ??????????
4. ???????????????????? ??????? ????????????????????? 3 ?????????
5. ???????????????????????????????????? 30 ??? 45 ??????????????????????? (?????? 100-150 ?????????)

?????????????????? ?????? ?????????????????????????????????????????????????? 1 ??????
* ????????: ?????????????????????????????????????????????????????????????????? ??????????????????????????????? (\\n) ???????????????????????? (???? ????? '??????' ???? '????????' ???????????????????????? ?????????????????????????????????????????????)
* ???????????????????????????????????????:
  "????????????\\n??????????????????????????????!"
  "?? 3 ??????\\n??????????????????????????"

???????????????????????? JSON Object ???????? (????????????????????????????):
{
  "headline": "????????????? ????????????? \\n ????????????????????????",
  "script": "?????????????????????????????? ?????????????? ??????????????????????????"
}${brainContext}${seriesContext}`;

      const userPrompt = `????????????????????: "${targetTopic}" ?????????????????????????: "${styleObj.name}" (${styleObj.description}) ????????????: "${styleObj.example}"`;
      const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, true);

      const cleanJson = aiResponse.substring(
        aiResponse.indexOf('{'),
        aiResponse.lastIndexOf('}') + 1
      );
      const parsed = JSON.parse(cleanJson);
      
      addLog(`???????????????????????????????????????: ${targetTopic}`, 'success');
      return {
        script: parsed.script,
        headline: parsed.headline
      };

    } catch (e: any) {
      addLog(`?????????????????????????????????: ${e.message}`, 'error');
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
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: `�?��ณ�?��อ�?��ี�?อ�?ตอร์�?��ิปสั้นผู้�?ชี่ยวชาญการ�?��ดพาดหัว�?��ิ�? (Headline Banner) �?าษา�?��ย แปะบนแถบหัววิดีโอ�?พื่อหยุดนิ้ว�?��ดู หน้าที่ขอ�?�?��ณ�?��อ�?สนอพาดหัวสั้นกระชั�? (�?��่�?กิ�? 10 �?��) โดน�?�? 1 ประโย�? 
* สำ�?��ญมา�?: �?��ณต้อ�?��่วยแบ่�?��รร�?��อน�?��บรรทัดขอ�?��าดหัว�?��้สวย�?��ม�?ป�?���?���? อย่า�?��ีระดั�? โดย�?��้�?�?��ื่อ�?��มายขึ้นบรรทัด�?��ม�? (\\n) ห้ามหัก�?��ึ่�?�?���?ด�?��ขา�? (�?ช่�? �?��ว่า '�?ศรษฐี' หรือ 'ขี้�?กีย�?' ต้อ�?��ยู่บรรทัด�?ดียวกั�? ห้ามแยกตัวสะกดหรือสระแยกบรรทัดกั�?)
* ตัวอย่า�?��ารแบ่�?��รรทัดพาดหัวที่สวย�?��ม:
  "�?�?���?��ลับโบราณ\\n�?ปลี่ยน�?��ขี้�?กียจ�?ป�?���?ศรษฐี!"
  "ก�? 3 ข้อ\\nที่จะช่วย�?��้�?��ณรวย�?ร�?��ขึ้�?"

ส่�?��ลับมา�?ฉพาะพาดหัวตร�?�? (ที่มี�?�?��ื่อ�?��มาย \\n แบ่�?��รรทัด�?��้�?รียบร้อย) �?��่มี�?��อธิบาย�?���? ทั้�?��ิ้น`
            },
            {
              role: 'user',
              content: `�?��ดพาดหัว�?��ิปจากบทพูดนี�?:\n"${script}"`
            }
          ]
        })
      });
      const data = await response.json();
      if (data?.error) {
        throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      const txt = data?.choices?.[0]?.message?.content?.replace(/["']/g, '')?.trim();
      if (txt) {
        setHeadline(txt);
        addLog(`สร้า�?��าดหัว�?��ม่สำ�?ร�?�?: ${txt}`, 'success');
      } else {
        throw new Error(`AI ส่�?��ลลัพธ์พาดหัวว่า�?��ลับมา (Response data: ${JSON.stringify(data)})`);
      }
    } catch (e: any) {
      addLog(`�?ออ�?ร่อสร้า�?��าดหัว: ${e.message}`, 'error');
    } finally {
      setIsGeneratingHeadline(false);
    }
  };

  // --- Voice Generator (Supports both Mac OS offline and Kie.ai Premium online) ---
  const handleGenerateVoice = async (speechText: string, selectedVoice: string): Promise<{ audioUrl: string; duration: number } | null> => {
    setIsGeneratingVoice(true);

    // Premium Kie.ai voice!
    const apiKey = getActiveKieKey();
    if (!apiKey) {
      addLog('�?บิก�?�?��น�?��่สำ�?ร�?�?! กรุณาระบุ Kie.ai API Key �?��ส่วนตั้�?�?��าก่อน�?��้�?สีย�?��รี�?มียม', 'error');
      alert("�??? กรุณาระบุ Kie.ai API Key �?��ส่วนตั้�?�?��าก่อน�?��้�?สีย�?��รี�?มียม");
      setIsGeneratingVoice(false);
      return null;
    }

    addLog(`?��?? กำลั�?�?รีย�? Kie.ai (ElevenLabs) สั�?�?�?��าะห์�?สีย�?��ากย์พรี�?มียม (Model: ${selectedVoice})...`, 'info');
    try {
      const result = await generateAudio({
        text: speechText,
        apiKey,
        voiceId: selectedVoice,
        stability: 0.5,
        onLog: (msg: string, type: any) => addLog(`[Kie.ai] ${msg}`, type)
      });

      if (result) {
        let finalAudioUrl = result.audioUrl;

        // If it's a remote URL from Kie.ai, download it to Voice_stock
        if (finalAudioUrl.startsWith('http')) {
           addLog(`กำลั�?��ันทึก�?สีย�?��ากย์ล�?�?�?��ื่อ�?...`, 'info');
           try {
              const saveRes = await fetch('/api/save-audio', {
                 method: 'POST',
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
                  addLog(`�? บันทึก�?สีย�?��ากย์ล�? Voice_stock สำ�?ร�?�?!`, 'success');
                  if (saveData.duration) {
                      result.duration = saveData.duration;
                  }
              }
           } catch(e: any) {
              addLog(`�??? ดาวน์โหลด�?��ล์ล้ม�?หลว (�?��้ลิ�?��์ออน�?��น์แท�?): ${e.message}`, 'error');
           }
        }

        return {
          audioUrl: finalAudioUrl,
          duration: result.duration
        };
      } else {
        throw new Error('การสร้า�?�?สีย�?��ากย์ด้วย Kie.ai ล้ม�?หลว');
      }
    } catch (e: any) {
      addLog(`สร้า�?�?สีย�?��ากย์พรี�?มียมล้ม�?หลว: ${e.message}`, 'error');
      return null;
    } finally {
      setIsGeneratingVoice(false);
    }
  };

  // Wrapper for manual audio button
  const triggerManualVoiceGen = async () => {
    if (!script) return alert('กรุณาสร้า�?��รือ�?ขียนบทพูดก่อน�?จน�?สีย�?');
    const result = await handleGenerateVoice(script, voiceId);
    if (result) {
      setAudioUrl(result.audioUrl);
      setAudioDuration(result.duration);
      
      // Save/update this script/voice in history, using loadedHistoryId if available!
      saveToHistory({
        id: loadedHistoryId || undefined,
        topic: topic || 'กำหนด�?อ�? (Manual Input)',
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
      const parts = cleanText.split(/[\s,?��??+/);
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
    let apiKey = getActiveOpenRouterKey();
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.startsWith('MOCK_')) {
      try {
        const res = await fetch('/api/vault/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const row = data.data.find((r: any) => r.service_name === 'openrouter');
            if (row && row.credential_key && row.credential_key.trim() !== '' && !row.credential_key.startsWith('MOCK_')) {
              apiKey = row.credential_key.trim();
              localStorage.setItem('openrouter_key', apiKey);
            }
          }
        }
      } catch (err) {}
    }

    // Layer 1 & 2: Local Whisper STT (if audioUrl is provided)
    if (audioUrl) {
      addLog('กำลั�?��ิ�?�?��าะห์�?สีย�?��ากย์ด้วย�?�?��ื่อ�?��อดรหัส�?สีย�? AI (Local Whisper STT) �?พื่อหาจั�?��วะพูด�?ป๊ะ�?...', 'info');
      try {
        const whisperRes = await fetch('/api/generate-whisper-subtitles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audioUrl, scriptText: cleanText })
        });
        const whisperData = await whisperRes.json();
        if (whisperData.success && Array.isArray(whisperData.segments) && whisperData.segments.length > 0) {
          addLog(`Whisper STT สำ�?ร�?�?! ถอดรหัสตำแหน่�?�?สีย�?��ูด�?���? ${whisperData.segments.length} ท่อน`, 'success');
          
          // Layer 1: Align Polished Script with Whisper Timestamps using Gemini 2.5 Flash
          if (apiKey) {
            addLog('กำลั�?�?���? AI (Gemini 2.5 Flash) �?กลาบท�?��ามที่ถอด�?���? �?��้ตร�?��ับส�?��ิปต์หลักและแมปจั�?��วะ�?วลา�?ป๊ะ�?...', 'info');
            try {
              const alignResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                  model: 'google/gemini-2.5-flash',
                  messages: [
                    {
                      role: 'system',
                      content: `�?��ณ�?��อผู้�?ชี่ยวชาญด้านระบบซับ�?���?ติ้ลและการจัดตำแหน่�?�?�� (Alignment) หน้าที่ขอ�?�?��ณ�?��อ นำส�?��ิปต์ที่ถูกต้อ�? 100% (Polished Script) มาจัดวา�?�?วลา (start, end) โดยอ้า�?��ิ�?��ากข้อมูลจั�?��วะ�?วลา�?สีย�?��ูดที่�?��้จา�? Whisper STT
                      
�?ป้าหมายสำ�?���?:
1. ข้อ�?��าม�?��ซับ�?���?ติ้ลแต่ละท่อ�? ต้อ�?��าจากส�?��ิปต์ที่ถูกต้อ�? (Polished Script) ห้าม�?��้�?��สะกดผิดหรือ�?��ที่�?พี้ยนขอ�? Whisper �?ด�?��ขา�? โดย�?ฉพาะ�?าษา�?��ย (�?ช่�? สระลอย ตัวสะกดผิ�?)
2. แมปจั�?��วะ�?วลา (start, end) แต่ละท่อนจากข้อมูล�?สีย�?��ูดขอ�? Whisper �?��้สอด�?��้อ�?��ันอย่า�?��ม่นยำ
3. แบ่�?��่อน�?��้กระชั�? �?หมาะกับการแสด�?��ับ�?���?ติ้ล�?��ิปแนวตั้�? (12-25 ตัวอักษร)
4. ห้าม�?ปลี่ยน�?��หรือแก้�?���?นื้อหา�?���? �?�? Polished Script ดั้�?�?ดิมแม้แต่�?���?ดียว ต้อ�?��ำข้อ�?��ามทั้�?��มด�?�? Polished Script มา�?รีย�?��่อกัน�?ป�?��ท่อน�? �?��้�?��บถ้ว�? 100%
5. ต้อ�?��ะบุ�?วลา�?ริ่มต้�? (start, end) ขอ�?��ต่ละท่อน�?��หน่วยวินาที (ทศนิยม)
   - ท่อนแรกสุดต้อ�?�?ริ่มต้นที�? start: 0.0
   - ท่อนสุดท้ายต้อ�?��ิ้นสุดที�? end: ${duration}
   - �?วลา�?ริ่มต้นขอ�?��่อน�?���? ต้อ�?�?��่น้อยกว่า�?วลาสิ้นสุดขอ�?��่อนก่อนหน้า (start ขอ�?��่อนที�? n ต้อ�?��ี�?��า�?ท่ากับหรือมากกว่า end ขอ�?��่อนที�? n-1)

ส่�?��ลลัพธ์กลับมา�?��รูปแบ�? JSON Array ขอ�? Object �?ท่านั้�? �?ช่�?:
[
  {"text": "ข้อ�?��ามท่อนแรกสุดจากส�?��ิปต์หลั�?", "start": 0.0, "end": 2.5},
  {"text": "ข้อ�?��ามท่อนถัดมาจากส�?��ิปต์หลั�?", "start": 2.5, "end": 5.1}
]
ห้ามมี�?��อธิบาย มาร์กดาวน�? หรืออักขระพิ�?ศษ�?���? นอก�?หนือจา�? JSON Array ดั�?��ล่าว`
                    },
                    {
                      role: 'user',
                      content: `ข้อมูลอ้า�?��ิ�?:
- Polished Script (ส�?��ิปต์ที่ถูกต้อ�?): "${cleanText}"
- Whisper STT segments (จั�?��วะ�?สีย�?��ูดจริ�?): ${JSON.stringify(whisperData.segments)}
- �?��ามยาว�?��ิป�?สีย�?��ริ�?: ${duration} วินาที`
                    }
                  ]
                })
              });
              const alignData = await alignResponse.json();
              if (alignData?.error) {
                throw new Error(`OpenRouter Error: ${alignData.error.message || JSON.stringify(alignData.error)}`);
              }
              const alignContent = alignData?.choices?.[0]?.message?.content;
              if (alignContent) {
                const cleanJson = alignContent.substring(
                  alignContent.indexOf('['),
                  alignContent.lastIndexOf(']') + 1
                );
                const parsed = JSON.parse(cleanJson);
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
                  if (formatted.length > 0) {
                    formatted[formatted.length - 1].end = duration;
                  }
                  addLog(`[Layer 1] จัดจั�?��วะซับกับ�?สีย�?��บบ�?ฟรมต่อ�?ฟรม (Whisper + Gemini Alignment) สำ�?ร�?��แล้ว!`, 'success');
                  return formatted;
                }
              }
            } catch (alignErr: any) {
              addLog(`การจัดแนวด้วย Gemini ล้ม�?หลว: ${alignErr.message} -> สลับ�?���?��้ผลดิบจา�? Whisper`, 'error');
            }
          }

          // Layer 2: Offline Fallback (Direct Whisper segments)
          addLog('[Layer 2] �?��้ผลลัพธ์จั�?��วะ�?วลาและ�?��พูดโดยตร�?��า�? Whisper STT', 'info');
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
          if (formatted.length > 0) {
            formatted[formatted.length - 1].end = duration;
          }
          return formatted;
        }
      } catch (whisperErr: any) {
        addLog(`�?�?��ื่อ�?��ือ Whisper STT ขัดข้อ�?: ${whisperErr.message} -> สลับ�?���?��้ระบบทำซับดั้�?�?ดิม`, 'error');
      }
    }

    // Layer 3: No-Whisper Fallback (Gemini prediction based on text length/pacing)
    if (apiKey) {
      addLog('กำลั�?��่�?��ทส�?��ิปต์�?���? AI ช่วยวิ�?�?��าะห์แบ่�?��่อนและกำหนดจั�?��วะซั�? (Timestamp) �?��้ตร�?��ับ�?สีย�?��ากย์ธรรมชาติ...', 'info');
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              {
                role: 'system',
                content: `�?��ณ�?��อผู้�?ชี่ยวชาญการตัด�?��และประมาณการจั�?��วะ�?วลา (Timestamp) ขอ�?���?��ิปต์สำหรับทำซับ�?���?ติ้ล�?���?��ิปวิดีโอสั้�?
หน้าที่ขอ�?�?��ณ�?��อแบ่�?���?��ิปต์ที่�?��้มาออก�?ป�?��ท่อนสั้น�? และกำหนด�?วลา�?ริ่มต้�? (start) และ�?วลาสิ้นสุ�? (end) ขอ�?��ต่ละท่อน�?��้สอด�?��้อ�?��ับจั�?��วะการออก�?สีย�?��ามธรรมชาติและ�?��ามยาว�?สีย�?��ากย์ทั้�?��ม�? ${duration} วินาที

กฎที่สำ�?��ญที่สุ�? (MUST FOLLOW RULES):
1. ห้ามตัด�?��ตร�?��ลา�?�?��หรือ�?��ึ่�?�? กลา�?�? �?ด�?��ขา�? (�?ช่�? �?��ว่า "�?��ามพยายาม" ห้ามตัด�?ป�?�? "�?��ามพยา" และ "ยาม")
2. �?��ามยาวแต่ละท่อน�?��รสั้นและกระชั�? �?หมาะกับการแสด�?��ับ�?���?ติ้ล�?���?��ิปสั้นแนวตั้�? (ประมา�? 12 - 25 ตัวอักษร)
3. �?��้แบ่�?��ามจั�?��วะ�?ว้นวรร�?��ละการ�?ว้นจั�?��วะหาย�?�?/พู�? ตาม�?สีย�?��รรมชาติขอ�?��นุษย�?
4. ห้าม�?ปลี่ยน�?��หรือแก้�?���?นื้อหา�?���? �?��ส�?��ิปต์ดั้�?�?ดิมแม้แต่�?���?ดียว ต้อ�?��ำข้อ�?��ามทั้�?��มดจากส�?��ิปต์มา�?รีย�?��่อกัน�?ป�?��ท่อน�? �?��้�?��บถ้ว�? 100%
5. ต้อ�?��ะบุ�?วลา�?ริ่มต้�? (start) และ�?วลาสิ้นสุ�? (end) ขอ�?��ต่ละท่อน�?��หน่วยวินาที (ทศนิยม):
   - ท่อนแรกสุดต้อ�?�?ริ่มต้นที�? start: 0.0
   - ท่อนสุดท้ายต้อ�?��ิ้นสุดที�? end: ${duration} (ตร�?��ับ�?��ามยาว�?��ิป�?สีย�?��ริ�?��อดี)
   - �?วลา�?ริ่มต้นขอ�?��่อน�?���? ต้อ�?�?��่น้อยกว่า�?วลาสิ้นสุดขอ�?��่อนก่อนหน้า (start ขอ�?��่อนที�? n ต้อ�?��ี�?��า�?ท่ากับหรือมากกว่า end ขอ�?��่อนที�? n-1)
   - �?วลาต้อ�?�?พิ่มขึ้นอย่า�?��อด�?��้อ�?��ามลำดับ�?��ามยาวขอ�?��ระโย�?�?มื่อออก�?สีย�?��ริ�?
6. ส่�?��ลลัพธ์กลับมา�?��รูปแบ�? JSON Array ขอ�? Object �?ท่านั้�? �?ช่�?:
[
  {"text": "ข้อ�?��ามท่อนที่หนึ่�?", "start": 0.0, "end": 2.5},
  {"text": "ข้อ�?��ามท่อนที่สอ�?��ี่พูดต่อกั�?", "start": 2.5, "end": 5.1}
]
ห้ามมี�?��อธิบาย มาร์กดาวน�? หรืออักขระพิ�?ศษ�?���? นอก�?หนือจา�? JSON Array ดั�?��ล่าว`
              },
              {
                role: 'user',
                content: `กรุณาประมวลผลส�?��ิปต์นี�? โดยอ้า�?��ิ�?�?��ามยาวรวมทั้�?��ม�? ${duration} วินาที:\n"${cleanText}"`
              }
            ]
          })
        });
        const data = await response.json();
        if (data?.error) {
          throw new Error(`OpenRouter Error: ${data.error.message || JSON.stringify(data.error)}`);
        }
        const aiResponse = data?.choices?.[0]?.message?.content;
        if (!aiResponse) {
          throw new Error(`AI ส่�?��ลลัพธ์ว่า�?��ลับมา (Response data: ${JSON.stringify(data)})`);
        }

        const cleanJson = aiResponse.substring(
          aiResponse.indexOf('['),
          aiResponse.lastIndexOf(']') + 1
        );
        const parsed = JSON.parse(cleanJson);
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

            addLog(`AI �?��นวณ�?��าม�?ร�?��และจั�?��วะซับสำ�?ร�?��แล้ว! �?��้จำนวนทั้�?��ิ้�? ${formatted.length} ท่อน`, 'success');
            return formatted;
          } else if (typeof firstItem === 'string') {
            addLog('AI ส่�?�?พีย�?��าร์�?รย์ข้อ�?��าม�?��่มีข้อมูล�?วลา �? กำลั�?��ลับ�?���?��นวณจั�?��วะสถิติตามสัดส่ว�?...', 'info');
            return calculateProportionalSegments(parsed, duration);
          }
        }
        throw new Error('ผลลัพธ์จา�? AI �?��่�?ป�?��รูปแบบออบ�?จกต์โ�?���?��ร้า�?��้อมูลจั�?��วะ�?วลาที่ถูกต้อ�?');
      } catch (e: any) {
        addLog(`�?��นวณโดย AI ขัดข้อ�?: ${e.message} �? กำลั�?��ลับ�?���?��้ระบบ�?��นวณแบบสถิติสำรอ�? (Fallback)...`, 'error');
      }
    } else {
      addLog('�?��่พ�? API Key สำหรั�? OpenRouter �? กำลั�?��ลับ�?���?��้ระบบ�?��นวณแบบสถิติสำรอ�? (Fallback)...', 'info');
    }

    // Layer 4: Proportional Fallback
    const chunks = segmentTextFallback(cleanText, isThai);
    return calculateProportionalSegments(chunks, duration);
  };

  // --- Subtitles Segment Builder Trigger (Call Unified Async Generator) ---
  const triggerAutoSubtiming = async (text: string, duration: number, audioUrl?: string) => {
    addLog('กำลั�?�?��นวณและ�?กลาจั�?��วะตัดซับ�?���?ติ้ล�?��้ตร�?��ับ�?สีย�?��ากย์แบบอัจฉริยะ...', 'info');
    
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
      addLog(`สร้า�?��ละตัด�?��บรรยาย�?าษา�?��ยสำ�?ร�?�? จำนวนทั้�?��ิ้�? ${segments.length} ท่อ�?!`, 'success');

      // Auto save the computed timed subtitles into the history record
      saveToHistory({
        id: loadedHistoryId || undefined,
        topic: topic || 'กำหนด�?อ�? (Manual Input)',
        headline: headline,
        script: text,
        voiceId: voiceId,
        audioUrl: audioUrl,
        duration: duration,
        srtSegments: segments,
        srtContent: srt
      });
    } catch (e: any) {
      addLog(`ประมวลผลซับ�?���?ติ้ลผิดพลา�?: ${e.message}`, 'error');
    }
  };

  // File Picker Helpers
  const handleSelectFolder = async (kind: 'source' | 'output') => {
    const showManualPrompt = () => {
      const currentPath = kind === 'source' ? sourceFolder : outputFolder;
      const title = kind === 'source' ? 'โฟล�?ดอร์สำหรับ�?ก�?��วิดีโอ�?��ิปดิ�? (Footage)' : 'โฟล�?ดอร์สำหรับบันทึกผลลัพธ�? (Output)';
      const manualDir = window.prompt(
        `[ระบุ�?อ�? �?��่สามารถ�?ปิดหน้าต่า�?�?ลือกขอ�?��ะบ�? macOS อัตโนมัติ�?��้\n\nกรุณาวา�?��รือพิมพ�? Path ขอ�? ${title} ที่นี่โดยตร�?:`,
        currentPath
      );
      if (manualDir !== null) {
        const trimmed = manualDir.trim();
        if (kind === 'source') setSourceFolder(trimmed);
        else setOutputFolder(trimmed);
        addLog(`ระบุโฟล�?ดอร�? ${kind === 'source' ? 'ต้นทา�?' : 'ปลายทา�?'} แบบระบุ�?อ�?��ำ�?ร�?�?: ${trimmed}`, 'success');
      }
    };

    try {
      const res = await fetch('/api/pick-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: kind === 'source' ? '�?ลือกโฟล�?ดอร์�?ก�?��วิดีโอ�?��ิปดิบแนวตั้�?' : '�?ลือกโฟล�?ดอร์ส่�?��อกวิดีโอ' })
      });
      const data = await res.json();
      if (data.success && data.dir) {
        if (kind === 'source') setSourceFolder(data.dir);
        else setOutputFolder(data.dir);
        addLog(`�?ลือกโฟล�?ดอร�? ${kind === 'source' ? 'ต้นทา�?' : 'ปลายทา�?'}: ${data.dir}`, 'success');
      } else {
        if (data.cancelled) {
          addLog('ยก�?ลิกการ�?ลือกโฟล�?ดอร�?', 'info');
        } else {
          showManualPrompt();
        }
      }
    } catch (e: any) {
      addLog(`การ�?ปิดหน้าต่า�? AppleScript �?ลือกโฟล�?ดอร์ล้ม�?หลว: ${e.message}`, 'error');
      showManualPrompt();
    }
  };

  const handleSelectBgm = async () => {
    const showManualPrompt = () => {
      const manualFile = window.prompt(
        `[ระบุ�?อ�? �?��่สามารถ�?ปิดหน้าต่า�?�?ลือก�?��ล์ขอ�?��ะบ�? macOS อัตโนมัติ�?��้\n\nกรุณาวา�?��รือพิมพ�? Path �?ต�?��ขอ�?�?��ล์�?พล�?��ระกอ�? BGM ที่นี่โดยตร�?:`,
        bgmFile || ''
      );
      if (manualFile !== null) {
        const trimmed = manualFile.trim();
        setBgmFile(trimmed);
        addLog(`ระบุ�?��ล์�?พล�?��ระกอบแบบระบุ�?อ�?��ำ�?ร�?�?: ${trimmed}`, 'success');
      }
    };

    try {
      const res = await fetch('/api/pick-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '�?ลือก�?��ล์�?พล�? BGM ประกอบวิดีโอ (�?ช่�? .mp3)' })
      });
      const data = await res.json();
      if (data.success && data.file) {
        setBgmFile(data.file);
        addLog(`�?ลือก�?��ล์�?พล�?��ระกอบสำ�?ร�?�?: ${data.file}`, 'success');
      } else {
        if (data.cancelled) {
          addLog('ยก�?ลิกการ�?ลือก�?��ล�? BGM', 'info');
        } else {
          showManualPrompt();
        }
      }
    } catch (e: any) {
      addLog(`�?��่สามารถ�?ลือก�?��ล�? BGM �?���?: ${e.message}`, 'error');
      showManualPrompt();
    }
  };

  const handleSelectBgmFolder = async () => {
    const showManualPrompt = () => {
      const manualDir = window.prompt(
        `[ระบุ�?อ�? �?��่สามารถ�?ปิดหน้าต่า�?�?ลือกขอ�?��ะบ�? macOS อัตโนมัติ�?��้\n\nกรุณาวา�?��รือพิมพ�? Path ขอ�?��ฟล�?ดอร์�?พล�?��รร�?ล�? BGM ที่นี่โดยตร�?:`,
        bgmFile || ''
      );
      if (manualDir !== null) {
        const trimmed = manualDir.trim();
        setBgmFile(trimmed);
        addLog(`ระบุโฟล�?ดอร์�?พล�?��ระกอ�? BGM แบบระบุ�?อ�?��ำ�?ร�?�?: ${trimmed}`, 'success');
      }
    };

    try {
      const res = await fetch('/api/pick-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: '�?ลือกโฟล�?ดอร์�?ก�?���?��ล์�?พล�?��ระกอ�? BGM' })
      });
      const data = await res.json();
      if (data.success && data.dir) {
        setBgmFile(data.dir);
        addLog(`�?ลือกโฟล�?ดอร์�?พล�?��ระกอ�? BGM สำ�?ร�?�?: ${data.dir}`, 'success');
      } else {
        if (data.cancelled) {
          addLog('ยก�?ลิกการ�?ลือกโฟล�?ดอร�? BGM', 'info');
        } else {
          showManualPrompt();
        }
      }
    } catch (e: any) {
      addLog(`�?��่สามารถ�?ลือกโฟล�?ดอร�? BGM �?���?: ${e.message}`, 'error');
      showManualPrompt();
    }
  };

  const resolveBgmFileRandomly = async (bgmPath: string): Promise<string> => {
    if (!bgmPath) return '';
    addLog(`กำลั�?��รวจสอบและประมวลผล�?พล�? BGM: "${bgmPath}"...`, 'info');
    
    // Command to check if it's a directory and list its audio files
    const escapedPath = bgmPath.replace(/"/g, '\\"');
    const cmd = `if [ -d "${escapedPath}" ]; then find "${escapedPath}" -type f \\( -name "*.mp3" -o -name "*.wav" -o -name "*.m4a" -o -name "*.aac" -o -name "*.ogg" \\); else echo "NOT_DIR"; fi`;
    
    try {
      const res = await fetch('/api/run-bash-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: cmd })
      });
      
      if (!res.ok) {
        addLog('�?��่สามารถตรวจสอบพา�? BGM ผ่านรีโมต�?���? �?��้พาธ�?ดิม', 'info');
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
        addLog('พา�? BGM �?ป�?���?��ล์�?ดี่ยว จะ�?��้�?��ล์นี้โดยตร�?', 'info');
        return bgmPath;
      }
      
      if (foundFiles.length === 0) {
        addLog(`�??? �?��่พบ�?��ล์�?สีย�?�?พล�?��ระกอบ�?��โฟล�?ดอร�? "${bgmPath}" โปรดตรวจสอบว่ามี�?��ล�? .mp3 หรือ .wav หรือ�?���?, 'error');
        return bgmPath;
      }
      
      // Pick random file
      const randomIndex = Math.floor(Math.random() * foundFiles.length);
      const chosenBgm = foundFiles[randomIndex];
      addLog(`?�� สุ่ม�?��้�?พล�?��ระกอ�?: "...${chosenBgm.slice(-35)}" จากทั้�?��ม�? ${foundFiles.length} �?พล�?, 'success');
      return chosenBgm;
      
    } catch (e: any) {
      addLog(`�?กิดข้อผิดพลาดขณะสุ่ม BGM: ${e.message}`, 'error');
      return bgmPath;
    }
  };

  const handleTrainInlineBrain = async () => {
    if (!inlineBrainName.trim()) return alert('กรุณาตั้�?��ื่อสมอ�?�?พจก่อน�?��ับบอส!');
    if (!inlineBrainPasteText.trim()) return alert('กรุณาวา�?��ัวอย่า�?��พสต�?/บท�?��ามส�?��ิปต์ที่ต้อ�?��าร�?��้แกะส�?��ล�?!');
    
    const apiKey = getActiveOpenRouterKey();
    if (!apiKey) {
      alert('กรุณาตั้�?�?��า OpenRouter API Key �?��กล่อ�?�?มนูด้านบนก่อน�?��ับบอส!');
      return;
    }

    setIsAnalyzingInlineBrain(true);
    addLog(`กำลั�?�?ริ่มแกะรหัสลาย�?ซ�?���?าษาสำหรับสมอ�?�?พ�?: "${inlineBrainName}"...`, 'info');

    try {
      const examplesText = inlineBrainPasteText.trim();
      const prompt = `You are an expert AI Prompt Engineer and a native Thai Copywriter. The user will provide reference texts or post examples from a Thai page below.
Your task is to DEEPLY ANALYZE these examples and write a comprehensive "System Prompt" (Role/Act As...) for an LLM so that the LLM can generate high-quality short-video script content in this EXACT SAME style whenever requested.

**CRITICAL RULE FOR THAI COPYWRITING:** The resulting System Prompt MUST strictly instruct the AI to write like a REAL HUMAN. It must prohibit "AI-like" patterns such as being overly polite, too poetic, using cliché transitions (e.g., "อย่า�?�?��ก�?��าม", "ดั�?��ั้�?", "ทว่า"), or summarizing at the end. The tone must be natural, engaging, and directly matched to the provided examples.

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

      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      
      const data = await res.json();
      if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));
      const content = data.choices[0].message.content.trim().replace(/```[a-z]*\n?/g, '').replace(/```/g, '').trim();

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
        fetch('/api/save-app-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key: 'brains', data: updated })
        }).catch(console.error);

        return updated;
      });

      setSelectedBrainId(newBrain.id);
      setInlineBrainName('');
      setInlineBrainPasteText('');
      addLog(`?�� สมอ�?��ุด�?��พู�? "${newBrain.name}" ถูกสร้า�?��ละบันทึกล�?��ะบบสำ�?ร�?��แล้ว! พร้อม�?��้�?��นทันที`, 'success');
      alert(`�? บันทึกสมอ�? "${newBrain.name}" สำ�?ร�?�?!`);

    } catch (e: any) {
      addLog(`ล้ม�?หลว�?��การแกะลาย�?ซ�?���?าษา: ${e.message}`, 'error');
      alert(`ล้ม�?หลว: ${e.message}`);
    } finally {
      setIsAnalyzingInlineBrain(false);
    }
  };

  // Drag and Drop Drag handlers mapping preview frame coordinates directly to 1080x1920 viewport pixels
  // Unified Drag and Drop Handler for the entire simulated mobile viewport canvas
  const handleContainerDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    try {
      e.preventDefault();
    } catch (err) {}
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const clickY = clientY - rect.top; // y coordinate relative to container top (0 to 480)

    // Calculate distances to Headline and Subtitle to select the nearest element to drag
    const headlineDistance = Math.abs(clickY - headlineY);
    const subtitleY = rect.height - subtitleMarginV;
    const subtitleDistance = Math.abs(clickY - subtitleY);

    if (headlineDistance < subtitleDistance) {
      // Headline is closer, drag Headline!
      setActiveHighlight('headline');
      const handleMove = (ev: MouseEvent | TouchEvent) => {
        const moveClientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
        let newY = moveClientY - rect.top;
        newY = Math.max(15, Math.min(rect.height - 120, newY));
        setHeadlineY(Math.round(newY));
      };
      const handleEnd = () => {
        setActiveHighlight(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    } else {
      // Subtitle is closer, drag Subtitle!
      setActiveHighlight('subtitle');
      const handleMove = (ev: MouseEvent | TouchEvent) => {
        const moveClientY = 'touches' in ev ? ev.touches[0].clientY : ev.clientY;
        let newMargin = rect.bottom - moveClientY;
        newMargin = Math.max(15, Math.min(rect.height - 150, newMargin));
        setSubtitleMarginV(Math.round(newMargin));
      };
      const handleEnd = () => {
        setActiveHighlight(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleEnd);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleEnd);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove, { passive: false });
      window.addEventListener('touchend', handleEnd);
    }
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
    overrideBgmFile?: string
  ): Promise<string | null> => {
    if (!sourceFolder || !outputFolder) {
      alert('กรุณา�?ลือกโฟล�?ดอร์ต้นทา�?�?��ิปดิกและโฟล�?ดอร์บันทึกปลายทา�?��่อน�?��ับบอส');
      return null;
    }

    addLog('ขั้นตอนที�? 5: สุ่มหยิบฟุต�?ทจมาต่อ�?��้�?ข้ากับ�?��ามยาว�?��ิป�?สีย�?��ัตโนมัติ...', 'info');

    // 1. Build and concatenate background clips matching exactly the voice duration
    let assembledVoiceoverVideo: string | null = null;
    try {
      const response = await fetch('/api/build-random-clip-assembly', {
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

      if (!response.body) throw new Error('�?��่พบข้อมูลตอบสนอ�?��ารสตรีมฟุต�?ท�?');
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
      addLog(`ขั้นตอนสุ่มประกอบฉากผิดพลา�?: ${e.message}`, 'error');
      return null;
    }

    if (!assembledVoiceoverVideo) {
      addLog('�?��่พบ�?ส้นทา�?��อ�?��ุต�?ทจที่ประกอบ�?สร�?��ชั่ว�?��าว', 'error');
      return null;
    }

    // 2. Mix BGM and overlay subtitles & headliner by calling /api/render-video
    addLog('ขั้นตอนที�? 6: ผสมดนตรี�?��อ BGM, ฝั�?��ับและพาดหัวด้วย Visual Render Coordinates...', 'info');

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

      const res = await fetch('/api/render-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (!res.ok) {
        throw new Error(resData.error || 'การ�?รน�?ดอร์ล้ม�?หลว');
      }

      // Find the compiled path printed in logs or guess final path
      const outLog = resData.logs || '';
      const match = outLog.match(/�? Output �? ([^\n]+)/);
      let finalPath = match ? match[1].trim() : '';

      if (!finalPath) {
        // If not found in match, construct standard output name
        const cleanTopic = targetTopic.replace(/[^a-zA-Z0-9�?-๙]/g, '_');
        finalPath = `${outputFolder}/Render_${cleanTopic}_output.mp4`; // fallback estimation
      }

      // Cleanup the temporary assembled files
      try {
        const delRes = await fetch('/api/delete-assets', {
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
        addLog('กำลั�?��้อน�?��ล์ดนตรีประกอ�? BGM แบบอัจฉริยะ ด้วย�?��า�?��ามดั�?��ี่กำหน�?...', 'info');
        const bgmMixedPath = finalPath.replace('.mp4', '_mixed.mp4');
        
        // Skip voiceover input in amix filter graph if voicePath is empty (Silent Quote Mode)
        let mixCmd = '';
        if (silentMode || !voicePath) {
          mixCmd = `ffmpeg -y -i "${finalPath}" -stream_loop -1 -i "${currentBgm}" -filter_complex "[1:a]volume=${bgmVolume}[bgm]" -map 0:v -map "[bgm]" -c:v copy -c:a aac -b:a 128k -ar 44100 -shortest "${bgmMixedPath}"`;
        } else {
          mixCmd = `ffmpeg -y -i "${finalPath}" -stream_loop -1 -i "${currentBgm}" -filter_complex "[1:a]volume=${bgmVolume}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 128k -ar 44100 "${bgmMixedPath}"`;
        }
        
        const runRes = await fetch('/api/run-bash-script', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ script: mixCmd })
        });
        
        if (!runRes.body) throw new Error('�?��่สามารถ�?ชื่อมต่อระบบประมวลผล BGM �?���?');
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
                  addLog(`�?กิดข้อผิดพลาด�?��การผสม BGM: ${payload.text}`, 'error');
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
            const delRes = await fetch('/api/run-bash-script', {
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
          throw new Error('การประมวลผลผสม BGM ล้ม�?หลว');
        }
      }

      addLog(`สร้า�?��ละ�?รน�?ดอร์วิดีโอแนวตั้�?��ำ�?ร�?���?รียบร้อย! พิกั�?: ${finalPath}`, 'success');
      return finalPath;

    } catch (e: any) {
      addLog(`�?กิดข้อผิดพลาด�?��การประกอบร่า�?��ละฝั�?�?สีย�?��ากย�?: ${e.message}`, 'error');
      return null;
    }
  };

  const triggerManualAssembleAndRender = async () => {
    if (!silentMode && (!audioUrl || !audioDuration)) {
      return alert('กรุณาสร้า�?���?��ิปต์และ�?สีย�?��ากย�? TTS ก่อนประกอบร่า�?��ิดีโอ (หรือ�?ปิด�?��้�?���? Silent Mode)');
    }
    if (!srtContent) return alert('กรุณาสร้า�?��ับ�?���?ติ้ลพาดหัวก่อน�?รน�?ดอร�?');
    
    setIsAssembling(true);
    const activeAudioUrl = silentMode ? '' : audioUrl;
    const activeDuration = silentMode ? silentDuration : audioDuration;
    
    const path = await handleRenderSingleVideo(topic, activeAudioUrl, activeDuration, srtContent, headline);
    if (path) {
      setAssembledVideoPath(path);
      // Construct public serving URL if inside the project output, else serve direct file
      // If it starts with /Users/..., we can map it to view
    }
    setIsAssembling(false);
  };

  // --- Batch Worker Execution Engine (Step-by-Step Loop with Pause/Resume/Stop) ---
  const handleParseBatchInput = () => {
    const list = batchTopicInput
      .split('\n')
      .map(x => x.trim())
      .filter(x => x.length > 0);

    if (list.length === 0) {
      alert('กรุณากรอกหัวข้ออย่า�?��้อย 1 หัวข้อต่อบรรทั�?');
      return;
    }

    const items: BatchItem[] = list.map(t => ({
      topic: t,
      status: 'pending',
    }));

    setBatchItems(items);
    addLog(`�?พิ่มรายการ�?ตรียมรัน�?��วแบบอัตโนมัติ (Batch Queue) สำ�?ร�?�? ${items.length} �?��น�?ทนต�?!`, 'success');
  };

  const executeBatchQueue = async () => {
    if (batchItems.length === 0) {
      alert('กรุณากรอกและสร้า�?��ารา�?��ัวข้อ�?ตรียมรันก่อนบอส!');
      return;
    }

    if (batchStatus === 'running') return;

    setBatchStatus('running');
    addLog('�?ริ่มการทำ�?��นขอ�? Batch Pipeline แบบต่อ�?นื่อ�?��ัตโนมัติ...', 'batch');

    // Find the next pending index
    let startIndex = batchItems.findIndex(item => item.status === 'pending' || item.status === 'failed');
    if (startIndex === -1) {
      // If none, restart from 0
      startIndex = 0;
    }

    for (let i = startIndex; i < batchItems.length; i++) {
      // Check for pause/stop signals
      if (batchStatusRef.current === 'paused') {
        addLog('หยุด�?��วชั่ว�?��าว (Paused) กดปุ่ม�?พื่อดำ�?นินการรัน�?��วต่อ...', 'batch');
        break;
      }
      if (batchStatusRef.current === 'stopped') {
        addLog('ยก�?ลิกการรันชุดวิดีโออัตโนมัติ (Stopped) �?รียบร้อย', 'batch');
        break;
      }

      setCurrentBatchIndex(i);
      updateItemStatus(i, 'scripting');
      const currentItem = batchItems[i];

      addLog(`[${i+1}/${batchItems.length}] �?ริ่มทำ�?��นหัวข้อ: "${currentItem.topic}"`, 'batch');

      // Step 1: AI Script & Style Generation
      let scriptResult = { headline: currentItem.headline || '', script: currentItem.script || '' };
      if (!scriptResult.script || !scriptResult.headline) {
        const generated = await handleGenerateScript(currentItem.topic, selectedStyleId);
        if (!generated) {
          updateItemStatus(i, 'failed', '�?ขียนบท�?��ามล้ม�?หลว');
          continue;
        }
        scriptResult = generated;
        
        saveToHistory({
          topic: currentItem.topic,
          headline: scriptResult.headline,
          script: scriptResult.script
        });

        setBatchItems(prev => {
          const next = [...prev];
          next[i].script = scriptResult.script;
          next[i].headline = scriptResult.headline;
          return next;
        });
      } else {
        addLog(`[INFO] �?��้พาดหัวและบท�?��ามที่�?ตรียม�?��้ล่ว�?��น้าแล้ว: "${scriptResult.headline}"`, 'info');
      }

      // Variables to store parameters for rendering
      let currentItemAudioUrl = '';
      let currentItemDuration = silentDuration;
      let currentItemSrtContent = '';

      if (silentMode) {
        // --- ?�� Silent Quote Mode Bypassing TTS & STT ---
        addLog('โหมด�?�?��ย�? (Silent Quote Mode) - ข้ามขั้นตอนล�?�?สีย�?��ากย�? และ STT �?�?��ื่อน�?��ว �?พื่อประหยั�? API �?��ย์�?สีย�?', 'info');
        
        // Construct single static full-duration quote card subtitles
        const formatTime = (sec: number) => {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.floor((sec % 1) * 1000);
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
        };

        currentItemSrtContent = currentItem.srtContent || `1\n${formatTime(0)} --> ${formatTime(silentDuration)}\n${scriptResult.script}\n`;

        saveToHistory({
          topic: currentItem.topic,
          headline: scriptResult.headline,
          script: scriptResult.script,
          voiceId: 'none',
          audioUrl: '',
          duration: silentDuration,
          srtContent: currentItemSrtContent
        });

        setBatchItems(prev => {
          const next = [...prev];
          next[i].audioUrl = '';
          next[i].duration = silentDuration;
          next[i].srtContent = currentItemSrtContent;
          return next;
        });
      } else {
        // --- ?��?? Regular Voiceover Mode ---
        // Step 2: MacOS TTS Speech Synthesis
        updateItemStatus(i, 'voicing');
        const voiceResult = await handleGenerateVoice(scriptResult.script, voiceId);
        if (!voiceResult) {
          updateItemStatus(i, 'failed', 'สั�?�?�?��าะห์�?สีย�?��ูดผิดพลา�?');
          continue;
        }

        saveToHistory({
          topic: currentItem.topic,
          headline: scriptResult.headline,
          script: scriptResult.script,
          voiceId: voiceId,
          audioUrl: voiceResult.audioUrl,
          duration: voiceResult.duration
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
          srtContent: currentItemSrtContent
        });

        setBatchItems(prev => {
          const next = [...prev];
          next[i].srtContent = currentItemSrtContent;
          return next;
        });
      }

      // Step 4: Assembly & Visual Overlays Rendering
      updateItemStatus(i, 'rendering');
      
      // Resolve BGM randomly for each compile if BGM is set to a directory
      const activeBgm = await resolveBgmFileRandomly(bgmFile);

      const renderPath = await handleRenderSingleVideo(
        currentItem.topic,
        currentItemAudioUrl,
        currentItemDuration,
        currentItemSrtContent,
        scriptResult.headline,
        activeBgm
      );

      if (!renderPath) {
        updateItemStatus(i, 'failed', 'ประกอบร่า�?��ละ�?รน�?ดอร์ล้ม�?หลว');
        continue;
      }

      setBatchItems(prev => {
        const next = [...prev];
        next[i].videoUrl = renderPath;
        next[i].status = 'completed';
        return next;
      });

      addLog(`✨ สำ�?ร�?�?! สร้า�?�?��ิปอัตโนมัติหัวข้อ [${currentItem.topic}] �?รียบร้อย`, 'success');
    }

    if (batchStatusRef.current === 'running') {
      setBatchStatus('idle');
      addLog('?�� ทำ�?��น�?สร�?��สิ้น�?��บถ้วนทุก�?��ว�?��ตารา�?�?รียบร้อยแล้วบอส!', 'success');
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
    addLog('กำลั�?��อหยุดกระบวนการรันแบบชุดชั่ว�?��าว...', 'batch');
  };

  const handleStopBatch = () => {
    setBatchStatus('stopped');
    addLog('กำลั�?��อยก�?ลิก�?��นชุดทั้�?��ม�?...', 'batch');
  };

  const clearCompletedBatch = () => {
    setBatchItems([]);
    setBatchTopicInput('');
    setCurrentBatchIndex(-1);
    setBatchStatus('idle');
    addLog('�?�?��ียร์ตารา�?�?��วและประวัติ�?รียบร้อย', 'info');
  };

  // --- Subtitle Presets Switcher ---
  const applyPreset = (preset: typeof SUBTITLE_PRESETS[0]) => {
    setSubStyle({
      ...preset,
      marginV: subStyle?.marginV || 120
    });
    addLog(`ปรับรูปแบ�? Preset ซับ�?���?ติ้ล: ${preset.name}`, 'info');
  };

  return (
    <div className="p-6 space-y-6 text-white min-h-screen" style={{ backgroundColor: 'var(--bg-main)', fontFamily: 'system-ui' }}>
      
      {/* Sleek Gradient Header */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-purple-900/60 via-indigo-900/40 to-teal-900/40 border border-purple-500/20 backdrop-blur-xl shadow-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            ?�� Automated Vertical Video Suite
          </h1>
          <p className="text-indigo-200/70 text-sm mt-1">
            ระบบปัญญาประดิษฐ์ผลิตวิดีโอสั้นแนวตั้�?��ัตโนมัติ�?��บว�?��ร (ส�?��ิปต์ส�?��ล�? AI · �?สีย�?��ากย�? MacOS · ซับ�?���?ติ้ลอัจฉริยะ · WYSIWYG Editor)
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/40 hover:border-purple-400/50 transition-all">
            <button 
              onClick={() => handleSelectFolder('source')} 
              className={`px-3 py-2 text-xs font-semibold ${sourceFolder ? 'text-teal-300' : 'text-purple-300'} hover:bg-white/5 transition-all`}
              title="กด�?พื่อ�?���? macOS Dialog �?ลือกโฟล�?ดอร�?"
            >
              ?�� {sourceFolder ? `Footage: ...${sourceFolder.slice(-15)}` : '�?ลือกโฟล�?ดอร์ฟุต�?ท�?'}
            </button>
            <button
              onClick={() => {
                const manualDir = window.prompt(`กรอ�?/วา�? Path โฟล�?ดอร์ฟุต�?ทจโดยตร�?:`, sourceFolder);
                if (manualDir !== null) {
                  setSourceFolder(manualDir.trim());
                  addLog(`ระบุโฟล�?ดอร์ต้นทา�?��บบแมนนวล: ${manualDir.trim()}`, 'success');
                }
              }}
              className="px-2 py-2 text-xs border-l border-purple-500/20 text-indigo-300 hover:bg-white/10 transition-all font-bold"
              title="ระบุ Path โฟล�?ดอร์�?อ�?��ดยตร�? (แก้�?���?���?)"
            >
              ✏�?
            </button>
          </div>

          <div className="flex items-center rounded-xl overflow-hidden border border-purple-500/30 bg-purple-950/40 hover:border-purple-400/50 transition-all">
            <button 
              onClick={() => handleSelectFolder('output')} 
              className={`px-3 py-2 text-xs font-semibold ${outputFolder ? 'text-teal-300' : 'text-purple-300'} hover:bg-white/5 transition-all`}
              title="กด�?พื่อ�?���? macOS Dialog �?ลือกโฟล�?ดอร�?"
            >
              ?�� {outputFolder ? `บันทึกที�?: ...${outputFolder.slice(-15)}` : '�?ลือกโฟล�?ดอร์บันทึ�?'}
            </button>
            <button
              onClick={() => {
                const manualDir = window.prompt(`กรอ�?/วา�? Path โฟล�?ดอร์ปลายทา�?��ดยตร�?:`, outputFolder);
                if (manualDir !== null) {
                  setOutputFolder(manualDir.trim());
                  addLog(`ระบุโฟล�?ดอร์ปลายทา�?��บบแมนนวล: ${manualDir.trim()}`, 'success');
                }
              }}
              className="px-2 py-2 text-xs border-l border-purple-500/20 text-indigo-300 hover:bg-white/10 transition-all font-bold"
              title="ระบุ Path โฟล�?ดอร์�?อ�?��ดยตร�? (แก้�?���?���?)"
            >
              ✏�?
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Control Panel vs Right Visual Preview */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN & CENTER COLUMN (2/3 width) - Detailed Control Panels */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Step 1: AI Script & Style Manager */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                <span className="p-1 rounded bg-teal-500/10 text-teal-400">1</span>
                AI Script & Style Manager
              </h2>
              <span className="text-xs text-white/50">วิ�?�?��าะห�? copywriting & �?จนบ�?</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">?�� �?ลือกบุ�?��ิก�?พ�? AI "Brain Profile"</label>
                  <select
                    value={selectedBrainId}
                    onChange={(e) => setSelectedBrainId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-teal-500/20 text-white text-sm outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="none">-- �?��้ส�?��ล์กลา�?��ามหัวข้อ (�?��่มี Brain) --</option>
                    {savedBrains.map(b => (
                      <option key={b.id} value={b.id}>?�? {b.name} ({new Date(b.timestamp).toLocaleDateString('th-TH')})</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-white/40">*ระบบจะ�?ลียนแบบ�?��ามฉลา�? สำนว�? และส�?��ิปต์ส�?��ล์ขอ�?�?พจนี้ที่�?ซฟ�?���?</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold text-white/70">ส�?ปก�?��น�?ซปต์ช่อ�? / อาร์ต�?���?รกชั่�?</label>
                  <textarea
                    value={channelConcept}
                    onChange={(e) => setChannelConcept(e.target.value)}
                    className="w-full h-24 p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-purple-500/80 outline-none resize-none"
                    placeholder="�?ช่�? ช่อ�?�?ล่า�?��ามลับจักรวาล น้ำ�?สีย�?��ื่น�?ต้�? มีจั�?��วะ�?�?��ยบ�?��้ระทึ�?..."
                  />
                  <button
                    onClick={handleGenerateStyles}
                    disabled={isGeneratingStyles}
                    className="w-full py-2.5 bg-gradient-to-r from-teal-500 to-indigo-600 hover:from-teal-400 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all disabled:opacity-40"
                  >
                    {isGeneratingStyles ? '?�� AI กำลั�?��อกแบบส�?��ล์การ�?ขีย�?...' : '✨ �?สนอส�?��ล์�?ล่า�?รื่อ�? 5 รูปแบ�? (OpenRouter)'}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">�?ลือกส�?��ล์การ�?ล่า�?รื่อ�?��ี่ชอ�?</label>
                  <select
                    value={selectedStyleId}
                    onChange={(e) => setSelectedStyleId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none"
                  >
                    {copyStyles.map(s => (
                      <option key={s.id} value={s.id} className="bg-slate-900 text-white">{s.name}</option>
                    ))}
                  </select>
                </div>
                
                {copyStyles.find(s => s.id === selectedStyleId) && (
                  <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-500/20 text-xs space-y-1.5">
                    <p className="text-purple-300 font-bold">?�� {copyStyles.find(s => s.id === selectedStyleId)?.name}</p>
                    <p className="text-white/60">{copyStyles.find(s => s.id === selectedStyleId)?.description}</p>
                    <p className="text-white/40 italic">"ตัวอย่า�?: {copyStyles.find(s => s.id === selectedStyleId)?.example}"</p>
                  </div>
                )}

                {/* Inline Brain Trainer */}
                <div className="p-3 rounded-xl bg-slate-950/40 border border-teal-500/25 text-xs space-y-2 shadow-inner">
                  <p className="font-bold text-teal-400 flex items-center gap-1.5">
                    ?�� ฝั�?��ำนวน�?���?ขียนบ�? / �?ทรนสมอ�? AI (Inline Brain Trainer)
                  </p>
                  <input
                    type="text"
                    value={inlineBrainName}
                    onChange={(e) => setInlineBrainName(e.target.value)}
                    className="w-full p-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white outline-none focus:border-teal-500"
                    placeholder="ชื่อสำนว�? / บุ�?��ิ�? (�?ช่�? นักจิตวิทยาสายโห�?)"
                  />
                  <textarea
                    value={inlineBrainPasteText}
                    onChange={(e) => setInlineBrainPasteText(e.target.value)}
                    className="w-full h-16 p-2 bg-black/60 border border-white/10 rounded-lg text-xs text-white outline-none resize-none focus:border-teal-500"
                    placeholder="วา�?��้อ�?��ามตัวอย่า�? 1-3 โพสต�? �?พื่อ�?���? AI แกะรอยส�?��ล�?..."
                  />
                  <button
                    onClick={handleTrainInlineBrain}
                    disabled={isAnalyzingInlineBrain}
                    className="w-full py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all shadow-md disabled:opacity-50"
                  >
                    {isAnalyzingInlineBrain ? '⏳ AI กำลั�?��อดรหัสลาย�?ซ�?��สำนว�?...' : '?�? �?จน�?นอ�?รตสมอ�?��ุดข้อมูล�?��ม�?'}
                  </button>
                </div>
              </div>
            </div>

            <div className="border-t border-white/10 pt-4 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="md:col-span-3 space-y-1">
                <label className="text-xs font-semibold text-white/70">หัวข้อ�?��น�?ทนต์ตัวอย่า�? (Topic Input)</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-purple-500/80"
                  placeholder="�?ช่�? 3 นิสัยทำลายสมอ�?��อนตื่นนอ�?..."
                />
              </div>
              <button
                onClick={triggerManualScriptGen}
                disabled={isGeneratingScript}
                className="py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl active:scale-95 transition-all disabled:opacity-40"
              >
                {isGeneratingScript ? '✍�? กำลั�?�?ขียนบ�?...' : '?�� สั่�? AI �?ขียนบทพูด�?พียว�?'}
              </button>
            </div>
          </div>

          {/* Script History & Voiceover Library Section */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/10 pb-3 gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-bold text-indigo-400 flex items-center gap-2">
                  <span className="p-1 rounded bg-indigo-500/10 text-indigo-400">?��??</span>
                  �?��ั�?��ระวัติบทและ�?สีย�?��ากย์สำ�?ร�?�? (Script & Voiceover Library)
                </h2>
                <p className="text-xs text-white/50">บทพูดและ�?��ล์�?สีย�?��ี่�?�?��สร้า�? สำรอ�?��้อมูลถาวรบน�?บราว์�?ซอร์�?พื่อประหยัด�?�?��ดิ�? API</p>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={searchHistoryQuery}
                  onChange={(e) => setSearchHistoryQuery(e.target.value)}
                  className="px-3 py-1 text-xs rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-indigo-500 w-full md:w-48 placeholder-white/30"
                  placeholder="?�� �?��นหาหัวข้อ/บทพู�?..."
                />
                {scriptHistory.length > 0 && (
                  <button
                    onClick={handleClearAllHistory}
                    className="px-3 py-1 bg-red-950/40 border border-red-500/30 hover:bg-red-900/40 text-red-300 text-xs font-bold rounded-xl active:scale-95 transition-all whitespace-nowrap"
                  >
                    ?��?? ล้า�?��ระวัติ
                  </button>
                )}
              </div>
            </div>

            {scriptHistory.length === 0 ? (
              <div className="text-center py-8 text-white/40 text-xs border border-dashed border-white/10 rounded-2xl">
                ?�� ยั�?�?��่มีประวัติการ�?ขียนบทหรือสั�?�?�?��าะห์�?สีย�?�?���?��ั�? บันทึกแรกจะถูกบันทึกที่นี่โดยอัตโนมัติ�?มื่อก�? "�?ขียนบ�?" หรือ "�?จน�?สีย�?"
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/20">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 border-b border-white/10 text-indigo-200/80 font-bold font-semibold">
                      <th className="p-3 w-1/4">หัวข้อ�?��น�?ทนต�? / วันที่สร้า�?</th>
                      <th className="p-3 w-1/3">บทพู�? (Speech Script)</th>
                      <th className="p-3 w-1/4">�?��ล์�?สีย�?��ากย์พรี�?มียม (Audio)</th>
                      <th className="p-3 text-center w-1/6">ตัว�?ลือกจัดการ</th>
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
                        const isVoiceGenerated = !!item.audioUrl;
                        const isActive = loadedHistoryId === item.id;
                        return (
                          <tr 
                            key={item.id} 
                            className={`border-b border-white/5 transition-all ${
                              isActive 
                                ? 'bg-indigo-500/10 border-l-2 border-l-indigo-500' 
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <td className="p-3 space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-white text-xs">{item.topic}</p>
                                {isActive && (
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-indigo-500 text-white font-bold text-[9px] animate-pulse">
                                    กำลั�?�?���?
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-white/40">
                                ?�� {item.createdAt ? new Date(item.createdAt).toLocaleString('th-TH') : '�?��่มีข้อมูลวันที�?'}
                              </p>
                              {item.headline && (
                                <span className="inline-block px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 font-semibold text-[10px]">
                                  พาดหัว: {item.headline}
                                </span>
                              )}
                            </td>
                            <td className="p-3">
                              <p className="text-white/70 leading-relaxed text-xs">
                                {isExpanded ? item.script : `${item.script.substring(0, 100)}${item.script.length > 100 ? '...' : ''}`}
                              </p>
                              {item.script.length > 100 && (
                                <button
                                  onClick={() => setExpandedHistoryId(isExpanded ? null : item.id)}
                                  className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold mt-1"
                                >
                                  {isExpanded ? '?�� ย่อบท�?��าม' : '?�� อ่านบท�?��าม�?ต�?��'}
                                </button>
                              )}
                            </td>
                            <td className="p-3">
                              {isVoiceGenerated ? (
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-1.5">
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      ?�� �?จน�?สีย�?��ล้ว
                                    </span>
                                    {item.srtSegments && item.srtSegments.length > 0 && (
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                        ?�� ซับพร้อมแล้ว
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                    <button
                                      onClick={() => handlePlayHistoryAudio(item)}
                                      className={`p-1.5 rounded-full flex items-center justify-center transition-all ${
                                        playingHistoryId === item.id 
                                          ? 'bg-red-500 text-white animate-pulse' 
                                          : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                                      }`}
                                      title={playingHistoryId === item.id ? 'หยุด�?ล่�?' : 'ทดลอ�?��ั�?�?สีย�?'}
                                    >
                                      {playingHistoryId === item.id ? '⏸??' : '▶??'}
                                    </button>
                                    <div className="text-[10px]">
                                      <p className="font-bold text-indigo-300">?�� {item.voiceId || '�?��่ทราบชื่อ'}</p>
                                      <p className="text-white/40">⏱?? {item.duration || 0} วินาที</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleLoadFromHistory(item)}
                                    className="w-full py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-emerald-950/20"
                                  >
                                    ?�� �?��้บ�? + �?สีย�?��ากย์นี้ทันที
                                  </button>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div>
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                      ?�� ยั�?�?��่สร้า�?�?สีย�?
                                    </span>
                                  </div>
                                  <button
                                    onClick={() => handleLoadFromHistory(item)}
                                    className="w-full py-1.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-[10px] font-bold rounded-lg transition-all active:scale-95 shadow-md shadow-amber-950/20"
                                  >
                                    ?�� ดึ�?��ท�?��าม�?��สร้า�?�?สีย�?
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteHistory(item.id)}
                                className="p-1 px-2.5 bg-red-950/20 border border-red-500/10 hover:bg-red-900/40 text-red-400 hover:text-red-300 font-bold rounded-lg transition-all"
                              >
                                �? ล�?
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>



          {/* Step 2 & 3: Review Editor, Headline & Local macOS TTS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 2: Review & Headline Builder */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">2</span>
                    Review & Headline Builder
                  </h3>
                  <button 
                    onClick={handleGenerateHeadlineOnly} 
                    disabled={isGeneratingHeadline || !script}
                    className="text-xs text-purple-400 hover:text-purple-300 font-semibold disabled:opacity-30"
                  >
                    {isGeneratingHeadline ? 'กำลั�?�?���?...' : '?�� AI แนะนำพาดหัว'}
                  </button>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">�?��พาดหัววิดีโอ (Headline Text Overlay)</label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-sm outline-none focus:border-red-500/80 font-bold"
                    placeholder="�?��่พาดหัวดึ�?��ูดสายตา..."
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-white/70">ตรวจทานบทส�?��ิปต์พู�? (Speech Script Editor)</label>
                  <textarea
                    value={script}
                    onChange={(e) => setScript(e.target.value)}
                    className="w-full h-36 p-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm focus:border-purple-500/80 outline-none resize-none font-mono"
                    placeholder="ตัวบท�?��าม�?พียว�? สำหรับ�?��้�?สีย�?��่า�?..."
                  />
                  <p className="text-[10px] text-white/40 italic">*บทพากย์ต้อ�?��ะอา�? �?��่มีข้อ�?��ามว�?�?ล�?��กำกั�? �?พื่อ�?��่�?��้บอทอ่าน�?��แปลก�?</p>
                </div>
              </div>
            </div>

            {/* Step 3: Text-to-Speech (TTS) */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between transition-all duration-300">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">3</span>
                    �?สีย�?��ากย์สั�?�?�?��าะห�? (TTS)
                  </h3>
                  <span className="text-xs text-white/50">พรี�?มียมออน�?��น�? (Kie.ai)</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">�?ลือกนักพากย์�?สีย�?��ั�?�?�?��าะห�? (Thai Voices)</label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-teal-500 transition-colors"
                  >
                    <optgroup label="?�� �?สีย�?�?��ยพรี�?มียมระดับ�?ท�? (Kie.ai / ElevenLabs API)">
                      {KIEAI_VOICES.map(v => (
                        <option key={v.id} value={v.id} className="bg-slate-900 text-white font-semibold">✨ {v.name}</option>
                      ))}
                    </optgroup>
                  </select>
                  
                  <p className="text-[10px] text-amber-300">
                    ?�� �?สีย�?��รี�?มียมจา�? ElevenLabs พูด�?��ย�?��้�?ป�?��ธรรมชาติ หวา�? สมจริ�?��ี่สุ�? (ต้อ�?��าร Kie.ai API Key �?��แท�?��ตั้�?�?��า)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>ลิ�?��์�?��ล์�?สีย�?:</span>
                    <span className="font-mono text-teal-400 truncate max-w-[150px]">{audioUrl || 'ยั�?�?��่มี�?สีย�?'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>�?��ามยาว�?��ล์�?สีย�?:</span>
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
                {isGeneratingVoice ? '?��?? กำลั�?��ันทึก�?สีย�?��ากย�?...' : '?�� �?จน�?สีย�?��ากย์พรี�?มียม (Kie.ai / ElevenLabs)'}
              </button>
            </div>

          </div>

          {/* Step 4 & 5: Subtitling Settings & Video Assembly */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Step 4: Smart Subtitling Presets & Setup */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">4</span>
                  Smart Subtitling Presets
                </h3>
                <span className="text-xs text-white/50">จัดแต่�?��ับ�?���?ติ้ล</span>
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
                    <option value="Impact">Impact (หนาพิ�?ศษ)</option>
                    <option value="Kanit">Kanit (โม�?ดิร์นยอดฮิ�?)</option>
                    <option value="Prompt">Prompt (สะอาด�?รียบหรู)</option>
                    <option value="Mitr">Mitr (กลมมน�?ป�?��มิตร)</option>
                    <option value="Sarabun">Sarabun (สะอาดทา�?��าร)</option>
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
                  <label className="text-[10px] text-white/60">สีหลั�? (Primary)</label>
                  <input
                    type="color"
                    value={subStyle.primaryColor}
                    onChange={(e) => setSubStyle(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/60">สีขอ�? (Outline)</label>
                  <input
                    type="color"
                    value={subStyle.outlineColor}
                    onChange={(e) => setSubStyle(prev => ({ ...prev, outlineColor: e.target.value }))}
                    className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-white/60">ขอบ�?ขตซั�?</label>
                  <select
                    value={subStyle.borderStyle}
                    onChange={(e) => setSubStyle(prev => ({ ...prev, borderStyle: Number(e.target.value) }))}
                    className="w-full h-8 p-1.5 rounded bg-black/40 border border-white/10 text-[10px]"
                  >
                    <option value={1}>ขอบหนา</option>
                    <option value={3}>กล่อ�?��ึ�?</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => triggerAutoSubtiming(script, audioDuration, audioUrl)}
                disabled={!script || !audioDuration}
                className="w-full py-2.5 mt-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-30 shadow-lg shadow-purple-900/30 flex items-center justify-center gap-2"
              >
                ?�� �?��นวณตัดแบ่�?�?��บรรยายตาม�?��ามยาว�?สีย�?��ากย�?
              </button>
            </div>

            {/* Step 5: BGM Overlay & Assembly Controls */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">5</span>
                    Video Assembly & BGM
                  </h3>
                  <span className="text-xs text-white/50">�?พล�?��รร�?ล�?��ละประกอบร่า�?</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-white/70">�?��ล์หรือโฟล�?ดอร์�?พล�?��ระกอ�? BGM (.mp3 / .wav / โฟล�?ดอร�?)</label>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button 
                        onClick={handleSelectBgm} 
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                        title="�?ลือก�?��ล�? MP3 �?ดี่ยว�?พีย�?�?��ล์�?ดียว"
                      >
                        ?�� �?ลือก�?��ล�? BGM
                      </button>
                      <button 
                        onClick={handleSelectBgmFolder} 
                        className="text-xs text-teal-400 hover:text-teal-300 font-semibold"
                        title="�?ลือกโฟล�?ดอร์�?พื่อสุ่มหยิบ�?พล�?��ระกอบแตกต่า�?��ัน�?��้แต่ละ�?��ิป�?�? Batch"
                      >
                        ?��?? สุ่มจากโฟล�?ดอร�?
                      </button>
                      <button 
                        onClick={() => {
                          const manualBgm = window.prompt(`กรอ�?/วา�? Path �?��ล�? BGM หรือโฟล�?ดอร์�?พล�?��รร�?ล�?��ดยตร�?:`, bgmFile || '');
                          if (manualBgm !== null) {
                            setBgmFile(manualBgm.trim());
                            addLog(`ระบุแหล่�? BGM แบบระบุ�?อ�?��ำ�?ร�?�?: ${manualBgm.trim()}`, 'success');
                          }
                        }} 
                        className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
                        title="ระบุ Path �?อ�?��ดยตร�?"
                      >
                        ✏�? ระบุ�?อ�?
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={bgmFile || ''}
                    onChange={(e) => setBgmFile(e.target.value)}
                    placeholder="วา�? Path �?��ล์�?พล�?��ระกอ�? (.mp3) หรือโฟล�?ดอร์�?พล�?�?พื่อ�?ปิดระบ�? BGM Randomizer..."
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500 transition-all font-mono"
                  />
                  {bgmFile && !bgmFile.endsWith('.mp3') && !bgmFile.endsWith('.wav') && !bgmFile.endsWith('.m4a') && (
                    <p className="text-[10px] text-teal-400 italic">?�� �?ปิดโหมดสุ่ม�?พล�? BGM อัตโนมัติจากโฟล�?ดอร์สำ�?ร�?�?!</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>�?��ามดั�?�?พล�? BGM (BGM Volume Mixing)</span>
                    <span className="font-mono text-teal-400 font-bold">{Math.round(bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.02"
                    max="0.4"
                    step="0.01"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <p className="text-[9px] text-white/40">*กำหนดระดับ�?สีย�?�?��้อยู่ระหว่า�? 8% - 15% �?พื่อ�?��่�?��้�?สีย�?��นตรีกลบ�?สีย�?��ูด�?��พากย�?</p>
                </div>

                {/* Color Grading & Cinematic Filters */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    ?�� ฟิล�?ตอร์โทนสีวิดีโอ (Cinematic Color Grading)
                  </label>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500 transition-colors"
                  >
                    <option value="none">ปกติ (Original Colors)</option>
                    <option value="grayscale">?�� ขาว-ดำ �?��าสสิ�? (Grayscale / B&W)</option>
                    <option value="dark">?�� ฟิล์มมืดดราม่า (Dark Cinematic Overlay)</option>
                    <option value="contrast">?�� �?���?��นทราสต์จัดจ้า�? (High Contrast Cinematic)</option>
                    <option value="dark-grayscale">?�� ดำ-�?ทาฟิล์มหม่�? (Dark Grayscale Tone)</option>
                  </select>
                  <p className="text-[9px] text-white/40">*จะพรีวิวสมจริ�? 1:1 �?��ฝั่�?��วา และนำ�?��สั่�? FFmpeg แปล�?�?���?��ล์วิดีโอจริ�?��ัตโนมัติ</p>
                </div>
              </div>

              <button
                onClick={triggerManualAssembleAndRender}
                disabled={isAssembling || !audioUrl || !srtContent}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-40"
              >
                {isAssembling ? '?�� กำลั�?��ัดต่อสุ่มฟุต�?ทจและ�?รน�?ดอร�?...' : '?�� ประกอบฟุต�?ท�? + ซ้อนบีจี�?อ�?�� + �?รน�?ดอร์วิดีโอ�?ดี่ยว'}
              </button>
            </div>

          </div>

          {/* Step 6: Batch Pipeline Workspace & Terminal Logs */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                <span className="p-1 rounded bg-teal-500/10 text-teal-400">6</span>
                Batch Mode Queue Manager
              </h2>
              <span className="text-xs text-white/50">ผลิต�?��ิปจำนวนมากแบบกดปุ่ม�?ดียว</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-semibold text-white/70 block">
                  กรอกหัวข้อที่ต้อ�?��ารผลิ�? (1 หัวข้อต่อ 1 บรรทั�? - รอ�?��ับสู�?��ุ�? 20 หัวข้อพร้อมกั�?)
                </label>
                <textarea
                  value={batchTopicInput}
                  onChange={(e) => setBatchTopicInput(e.target.value)}
                  className="w-full h-32 p-3 rounded-xl bg-black/40 border border-white/10 text-white text-xs focus:border-purple-500/80 outline-none resize-none font-mono"
                  placeholder="�?ช่�?&#10;หัวข้อที�? 1: กฎทอ�?��ห่�?��ารหยุดชะลอวัย&#10;หัวข้อที�? 2: �?��ามลับลับขอ�?��อ�?���?ฟล&#10;หัวข้อที�? 3: จิตวิทยาหลอก�?��้�?��ชอบ�?�? 3 วินาที"
                />
                
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={handleParseBatchInput}
                    disabled={isDraftingAll || batchStatus === 'running'}
                    className="px-4 py-2 bg-indigo-700/60 hover:bg-indigo-600/80 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                  >
                    ?��?? นำ�?ข้าตารา�?��ัวข้อ
                  </button>
                  <button
                    onClick={handleDraftAllScripts}
                    disabled={isDraftingAll || batchStatus === 'running' || batchItems.length === 0}
                    className="px-4 py-2 bg-purple-700/60 hover:bg-purple-600/80 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {isDraftingAll ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        กำลั�?��่า�?��ท�?��าม...
                      </>
                    ) : (
                      '✍�? ร่า�?��ท�?��ามทั้�?��ม�? (Draft All)'
                    )}
                  </button>
                  <button
                    onClick={clearCompletedBatch}
                    disabled={isDraftingAll || batchStatus === 'running'}
                    className="px-4 py-2 bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-red-300 text-xs font-bold rounded-xl transition-all disabled:opacity-40"
                  >
                    ?�� �?�?��ียร์ตารา�?
                  </button>
                </div>
              </div>

              {/* Batch Queue Status Table */}
              <div className="p-3 rounded-xl bg-black/30 border border-white/5 max-h-[190px] overflow-y-auto space-y-1 text-xs">
                <p className="text-white/50 font-bold border-b border-white/10 pb-1 mb-2">?�� รายการวิดีโอ�?���?��ว ({batchItems.length})</p>
                {batchItems.length === 0 ? (
                  <p className="text-center text-white/30 py-8">�?��่มีรายการ�?��น�?ทนต์�?���?��ว�?จาะจ�?��ณะนี�?</p>
                ) : (
                  batchItems.map((item, idx) => {
                    let stClass = 'text-white/60 bg-white/5';
                    if (item.status === 'scripting') stClass = 'text-purple-300 bg-purple-950/40 border border-purple-500/30';
                    if (item.status === 'voicing') stClass = 'text-blue-300 bg-blue-950/40 border border-blue-500/30';
                    if (item.status === 'rendering') stClass = 'text-amber-300 bg-amber-950/40 border border-amber-500/30';
                    if (item.status === 'completed') stClass = 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/30';
                    if (item.status === 'failed') stClass = 'text-red-300 bg-red-950/40 border border-red-500/30';
                    
                    return (
                      <div key={idx} className="flex justify-between items-center p-2 rounded-lg bg-black/20 text-[11px] gap-2">
                        <span className="font-bold text-white/50 truncate max-w-[200px]">{idx+1}. {item.topic}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${stClass}`}>{item.status}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Terminal Live logs */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs text-white/60">
                <span className="flex items-center gap-1.5 font-bold text-teal-400">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                  Live Running Console Log (Terminal Monitor)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={executeBatchQueue}
                    disabled={batchStatus === 'running' || batchItems.length === 0}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg disabled:opacity-40 transition-all"
                  >
                    ▶?? Run Pipeline
                  </button>
                  <button
                    onClick={handlePauseBatch}
                    disabled={batchStatus !== 'running'}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold rounded-lg disabled:opacity-40 transition-all"
                  >
                    ⏸?? Pause
                  </button>
                  <button
                    onClick={handleStopBatch}
                    disabled={batchStatus !== 'running' && batchStatus !== 'paused'}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold rounded-lg disabled:opacity-40 transition-all"
                  >
                    ⏹?? Stop
                  </button>
                </div>
              </div>

              {/* Neo Monospace Logs Box */}
              <div className="h-44 p-3 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1 select-text scrollbar-thin">
                {logs.length === 0 ? (
                  <p className="text-white/30 text-center py-12">�?��่มีล�?��กการรันแสด�?�?��ตอนนี้บอส กดปุ่มรันด้านบน�?พื่อประมวลผล</p>
                ) : (
                  logs.map((log, index) => (
                    <div key={index} className="leading-5 border-l-2 border-emerald-500/20 pl-2">{log}</div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN (1/3 width) - WYSIWYG Visual 9:16 Preview Editor */}
        <div className="xl:col-span-1 space-y-6">
          
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col items-center">
            {/* Google Fonts Preloading for high fidelity typography */}
            <style dangerouslySetInnerHTML={{__html: `
              @import url('https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,300;0,400;0,700;0,900;1,400&family=Mitr:wght@400;700&family=Prompt:ital,wght@0,400;0,700;0,900;1,400&family=Sarabun:ital,wght@0,400;0,700;1,400&display=swap');
            `}} />

            <div className="w-full border-b border-white/10 pb-3 flex justify-between items-center">
              <h2 className="text-lg font-bold text-teal-400 flex items-center gap-2">
                ?�� WYSIWYG 9:16 Editor
              </h2>
              {assembledVideoPath ? (
                <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-teal-400 hover:text-teal-300 select-none bg-teal-500/10 px-2 py-1 rounded-lg border border-teal-500/20">
                  <input
                    type="checkbox"
                    checked={showRenderedVideoInPreview}
                    onChange={(e) => setShowRenderedVideoInPreview(e.target.checked)}
                    className="w-3 h-3 rounded bg-black/40 border border-white/10 text-teal-500 focus:ring-0 cursor-pointer"
                  />
                  <span>แสด�?��ล�?รน�?ดอร�?</span>
                </label>
              ) : (
                <span className="text-xs text-white/50">ลากวา�?��ิกัดแม่นยำ 100%</span>
              )}
            </div>

            {/* Batch Item Inspection Dropdown */}
            {batchItems.length > 0 && (
              <div className="w-full p-3 rounded-xl bg-black/40 border border-white/10 space-y-2 mb-3">
                <label className="text-[11px] font-semibold text-white/60 block">
                  ?�� ตรวจสอบและจัดตำแหน่�?��ามตอน�?��ววิดีโอ (Review Queue):
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
                    <option value="-1">-- �?ลือกตอนที่ต้อ�?��ารสุ่มจัดวา�? --</option>
                    {batchItems.map((item, idx) => (
                      <option key={idx} value={idx}>
                        ตอนที�? {idx + 1}: {item.topic} {item.script ? '✍�? (ร่า�?��ล้ว)' : '⏳ (ยั�?�?��่�?��้ร่า�?)'}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedBatchItemIdxForPreview >= 0 && (
                  <div className="text-[10px] text-teal-300 flex flex-col gap-1 bg-teal-500/10 px-2 py-1.5 rounded border border-teal-500/20">
                    <div className="flex justify-between items-center">
                      <span>?�� พรีวิวและช่อ�?��ก้�?��กำลั�?�?ชื่อมกับตอนที�? {selectedBatchItemIdxForPreview + 1}</span>
                      <button
                        onClick={() => setSelectedBatchItemIdxForPreview(-1)}
                        className="text-white hover:text-red-400 font-bold ml-2"
                      >
                        �? ปิดการ�?ชื่อม
                      </button>
                    </div>
                    <span className="text-[9px] text-teal-400/80 italic">* การย้ายตำแหน่�?��าดหัว/ซั�? หรือพิมพ์แก้�?��บท�?��ามขอ�?��อส�?�? Step 2 จะ�?ซฟล�?��อนที�? {selectedBatchItemIdxForPreview + 1} ทันที</span>
                  </div>
                )}
              </div>
            )}

            {/* Mobile simulated viewport (270px width, 480px height) with full unified drag canvas */}
            <div 
              ref={containerRef}
              onMouseDown={handleContainerDragStart}
              onTouchStart={handleContainerDragStart}
              className="relative border-8 border-slate-950 bg-slate-900 overflow-hidden shadow-2xl select-none group cursor-ns-resize"
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
              
              {/* Visual Rendered Video preview (if compiled and checked) */}
              {assembledVideoPath && showRenderedVideoInPreview && (
                <video 
                  src={`/api/local-stock-image?path=${encodeURIComponent(assembledVideoPath)}`} 
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

              {/* 1. Headline Draggable Overlay (clicks bubble to container) */}
              <div
                style={{
                  top: `${headlineY}px`,
                  fontFamily: (/[\u0E00-\u0E7F]/.test(headline || '') && ['arial', 'helvetica', 'impact', 'courier new', 'sans-serif'].includes(headlineFontName.toLowerCase())) ? 'Kanit' : headlineFontName,
                  fontSize: `${headlineFontSize / 1.5}px`,
                  outline: activeHighlight === 'headline' ? '2px dashed #facc15' : 'none',
                  outlineOffset: '4px',
                  borderRadius: activeHighlight === 'headline' ? '4px' : '0px',
                  backgroundColor: activeHighlight === 'headline' ? 'rgba(250, 204, 21, 0.15)' : 'transparent',
                  boxShadow: activeHighlight === 'headline' ? '0 0 16px rgba(250, 204, 21, 0.4)' : 'none',
                }}
                className="absolute left-1/2 -translate-x-1/2 text-center font-extrabold select-none z-20 w-max max-w-[90%] flex flex-col items-center justify-center min-h-[30px] pointer-events-none"
              >
                {activeHighlight === 'headline' && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-30 uppercase tracking-wider">
                    ↕�? พาดหัว (Headline Y)
                  </span>
                )}
                {(() => {
                  const scaledHlFontSize = Math.round(headlineFontSize * 8 / 3);
                  const maxCharsPerLine = Math.max(12, Math.floor(950 / (scaledHlFontSize * 0.42)));
                  const wrapped = wrapText(headline || 'พาดหัวขอ�?�?��ณตร�?��ี�?', maxCharsPerLine);
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

              {/* 2. Subtitles Draggable Overlay (clicks bubble to container) */}
              <div
                style={{
                  bottom: `${subtitleMarginV}px`,
                  fontFamily: subStyle.fontName,
                  fontSize: `${subStyle.fontSize / 1.5}px`,
                  color: subStyle.primaryColor,
                  textShadow: subStyle.borderStyle === 1 
                    ? `-${subStyle.outlineThickness / 2}px -${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}, ${subStyle.outlineThickness / 2}px -${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}, -${subStyle.outlineThickness / 2}px ${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}, ${subStyle.outlineThickness / 2}px ${subStyle.outlineThickness / 2}px 0 ${subStyle.outlineColor}`
                    : 'none',
                  backgroundColor: subStyle.borderStyle === 3 ? subStyle.outlineColor : (activeHighlight === 'subtitle' ? 'rgba(56, 189, 248, 0.15)' : 'transparent'),
                  padding: subStyle.borderStyle === 3 ? '4px 10px' : '0px',
                  borderRadius: subStyle.borderStyle === 3 ? '6px' : '0px',
                  outline: activeHighlight === 'subtitle' ? '2px dashed #38bdf8' : 'none',
                  outlineOffset: '4px',
                  boxShadow: activeHighlight === 'subtitle' ? '0 0 16px rgba(56, 189, 248, 0.4)' : 'none',
                }}
                className="absolute left-1/2 -translate-x-1/2 text-center font-bold max-w-[90%] break-words select-none z-20 flex flex-col items-center justify-center min-h-[30px] pointer-events-none"
              >
                {activeHighlight === 'subtitle' && (
                  <span className="absolute -top-5 left-1/2 -translate-x-1/2 bg-sky-500 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow whitespace-nowrap z-30 uppercase tracking-wider">
                    ↕�? ซับ�?���?ติ้ล (Subtitle Margin V)
                  </span>
                )}
                {(() => {
                  const rawText = srtSegments.length > 0 ? srtSegments[0].text : 'ซับ�?���?ติ้ลตัวอย่า�?��่อนแร�?';
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
                  �??? ระวั�?��ูกหน้าโปร�?��ล์บั�? (�?กิน�?ซฟโซนบ�?)
                </div>
              )}
              {subtitleMarginV < 45 && (
                <div className="absolute bottom-6 left-0 w-full text-center bg-red-600/90 text-[9px] py-0.5 z-20 animate-pulse text-white">
                  �??? ระวั�?��ูกกล่อ�?��ชร�?/�?��ม�?มนต์บั�? (�?กิน�?ซฟโซนล่า�?)
                </div>
              )}
            </div>

            {/* Realtime pixel coordinate outputs and manual adjusters mapped to FFMPEG rendering engine */}
            <div className="w-full space-y-3 bg-black/40 p-4 rounded-xl border border-white/5 mt-2">
              <div className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-xs font-bold text-white/70">?�� ปรับพิกัดตำแหน่�?��าดหัวและซับ�?���?ติ้ล (Position Tuning)</span>
                <span className="text-[10px] text-white/40">(�?ทียบขนาดจริ�? 1080x1920)</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Headline Y Positioner */}
                <div 
                  className="space-y-1.5"
                  onMouseEnter={() => setActiveHighlight('headline')}
                  onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/60">พิกัดพาดหัว (Y):</span>
                    <span className="font-mono text-teal-400 font-bold">{getRenderCoords().headlineY} px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="450"
                    step="1"
                    value={headlineY}
                    onFocus={() => setActiveHighlight('headline')}
                    onBlur={() => setActiveHighlight(null)}
                    onChange={(e) => {
                      setShowRenderedVideoInPreview(false);
                      setHeadlineY(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/40">ปรับละ�?อีย�?:</span>
                    <input
                      type="number"
                      min="40"
                      max="1800"
                      step="4"
                      value={tempHeadlineYInput !== null ? tempHeadlineYInput : getRenderCoords().headlineY}
                      onFocus={() => setActiveHighlight('headline')}
                      onChange={(e) => {
                        setShowRenderedVideoInPreview(false);
                        const valStr = e.target.value;
                        setTempHeadlineYInput(valStr);
                        const val = Number(valStr);
                        if (!isNaN(val) && val >= 40 && val <= 1800) {
                          setHeadlineY(Math.round(val / 4.0));
                        }
                      }}
                      onBlur={() => {
                        setActiveHighlight(null);
                        setTempHeadlineYInput(null);
                        const val = Math.max(40, Math.min(1800, Number(tempHeadlineYInput || getRenderCoords().headlineY)));
                        setHeadlineY(Math.round(val / 4.0));
                      }}
                      className="w-16 h-5 p-0.5 text-center text-[10px] rounded bg-slate-900 border border-white/10 text-white font-mono"
                    />
                    <span className="text-[9px] text-white/40">px</span>
                  </div>
                </div>

                {/* Subtitle Margin V Positioner */}
                <div 
                  className="space-y-1.5"
                  onMouseEnter={() => setActiveHighlight('subtitle')}
                  onMouseLeave={() => setActiveHighlight(null)}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-[11px] text-white/60">ระยะซับจากล่า�? (Margin V):</span>
                    <span className="font-mono text-teal-400 font-bold">{getRenderCoords().subtitleMarginV} px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="450"
                    step="1"
                    value={subtitleMarginV}
                    onFocus={() => setActiveHighlight('subtitle')}
                    onBlur={() => setActiveHighlight(null)}
                    onChange={(e) => {
                      setShowRenderedVideoInPreview(false);
                      setSubtitleMarginV(Number(e.target.value));
                    }}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-white/40">ปรับละ�?อีย�?:</span>
                    <input
                      type="number"
                      min="40"
                      max="1800"
                      step="4"
                      value={tempSubtitleMarginVInput !== null ? tempSubtitleMarginVInput : getRenderCoords().subtitleMarginV}
                      onFocus={() => setActiveHighlight('subtitle')}
                      onChange={(e) => {
                        setShowRenderedVideoInPreview(false);
                        const valStr = e.target.value;
                        setTempSubtitleMarginVInput(valStr);
                        const val = Number(valStr);
                        if (!isNaN(val) && val >= 40 && val <= 1800) {
                          setSubtitleMarginV(Math.round(val / 4.0));
                        }
                      }}
                      onBlur={() => {
                        setActiveHighlight(null);
                        setTempSubtitleMarginVInput(null);
                        const val = Math.max(40, Math.min(1800, Number(tempSubtitleMarginVInput || getRenderCoords().subtitleMarginV)));
                        setSubtitleMarginV(Math.round(val / 4.0));
                      }}
                      className="w-16 h-5 p-0.5 text-center text-[10px] rounded bg-slate-900 border border-white/10 text-white font-mono"
                    />
                    <span className="text-[9px] text-white/40">px</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Headline styling tools */}
            <div className="w-full space-y-3 pt-3 border-t border-white/10">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-white/70">⚙�? ปรับแต่�?���?��ล์แถบพาดหัวแบบละ�?อีย�? (Manual Tuning)</p>
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
                  <label className="text-[10px] text-white/60">สีกล่อ�?��ื้นหลั�?��าดหัว</label>
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
                    <option value="Impact">Impact (หนาพิ�?ศษ)</option>
                    <option value="Kanit">Kanit (โม�?ดิร์นยอดฮิ�?)</option>
                    <option value="Prompt">Prompt (สะอาด�?รียบหรู)</option>
                    <option value="Mitr">Mitr (กลมมน�?ป�?��มิตร)</option>
                    <option value="Sarabun">Sarabun (สะอาดทา�?��าร)</option>
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
                    ?�� �?ปิด�?��้กล่อ�?��าดหัว
                  </label>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-white/60">
                    <span>โปร่�?�?��กล่อ�? (Opacity)</span>
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
                    <span>�?��ามกว้า�?��ล่อ�? (Padding X)</span>
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
                    <span>�?��ามสู�?��ล่อ�? (Padding Y)</span>
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
                    <span>�?��ามโ�?���?��นขอบกล่อ�? *</span>
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
                    <span>�?��ามฟุ้�?�?�?��ขอ�? (Blur)</span>
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
                    <span>�?��ามหนาขอบตัวอักษร (Stroke)</span>
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
                  <label className="text-[10px] text-white/60">สี�?�?��ฟุ้�? / สีขอบตัวอักษร</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="color"
                      value={headlineShadowColor}
                      onChange={(e) => changeHeadlineShadowColor(e.target.value)}
                      className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                      title="สี�?�?��ฟุ้�? (Shadow Color)"
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
                    <span>↔�? �?��ามห่า�?��ะหว่า�?��รรทัดพาดหัว (Line Spacing)</span>
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

              <span className="text-[9px] text-white/40 block leading-tight mt-1">* หมาย�?หตุ: �?��ามโ�?���?��นขอบกล่อ�?��ะแสด�?��ล�?ฉพาะ�?��ห้อ�?��รีวิวนี�? �?นื่อ�?��ากข้อจำกัดขอ�? FFmpeg/libass ที่แสด�?��ล่อ�?�?บื้อ�?��ลั�?��ัวหนั�?��ือ�?ป�?��สี่�?หลี่ยมมุมฉาก�?���?��ล์วิดีโอสุดท้าย</span>

              {/* Headline Presets Section */}
              <div className="w-full pt-3 border-t border-white/10 space-y-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs font-bold text-white/70">?�� โหลดส�?��ล์สำ�?ร�?��รู�? (Presets)</p>
                  <span className="text-[9px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase">
                    ส�?��ล์ปัจจุบั�?: {(() => {
                      const selectedPreset = HEADLINE_PRESETS.find(x => x.id === headlinePresetId);
                      return selectedPreset 
                        ? (selectedPreset.name.split(' ').slice(1).join(' ') || selectedPreset.name)
                        : 'ปรับแต่�?�?อ�? ⚙�?';
                    })()}
                  </span>
                </div>

                {/* Headline Presets CapCut-Style Grid UI */}
                <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1 pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
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
                    const boxBorder = (p.boxEnabled && p.outlineWidth > 0 && p.id === 'teal-outline-box') ? `1px solid ${p.outlineColor}` : 'none';

                    const match = p.name.match(/^([^\s]+)\s+(.+)$/);
                    const emoji = match ? match[1] : '?��';
                    const nameText = match ? match[2] : p.name;

                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => applyHeadlinePreset(p)}
                        style={{ aspectRatio: '1.25' }}
                        className={`relative flex flex-col items-center justify-between p-2 rounded-xl border transition-all text-center select-none ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300 font-bold shadow-md shadow-indigo-500/10 ring-1 ring-indigo-500/50' 
                            : 'border-white/5 bg-black/30 hover:bg-indigo-950/20 hover:border-indigo-500/20 text-white/80'
                        }`}
                      >
                        {/* Visual Preview "Aa" */}
                        <div className="flex-1 flex items-center justify-center w-full min-h-[36px] overflow-hidden rounded-lg bg-black/20">
                          <div 
                            style={{
                              backgroundColor: boxBg,
                              padding: boxPadding,
                              borderRadius: boxRadius,
                              boxShadow: boxShadow,
                              border: boxBorder,
                            }}
                            className="inline-block transition-all"
                          >
                            <span 
                              style={{
                                color: p.fontColor,
                                fontFamily: p.fontName || 'sans-serif',
                                fontSize: '13px',
                                fontWeight: '900',
                                textShadow: textShadowStyle,
                                lineHeight: 1,
                              }}
                              className="block text-center"
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
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
