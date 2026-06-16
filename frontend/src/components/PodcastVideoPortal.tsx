import React, { useState, useRef, useEffect } from 'react';
import {
  Film,
  Settings,
  Play,
  Pause,
  Square,
  Sparkles,
  Image as ImageIcon,
  Terminal,
  FolderOpen,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronRight,
  Music
} from 'lucide-react';

interface AudioFile {
  name: string;
  status: 'pending' | 'analyzing' | 'rendering' | 'done' | 'error' | 'paused';
  thumbStatus: 'pending' | 'generating' | 'done' | 'error' | 'skipped';
  outputPath?: string;
  thumbPath?: string;
  errorMessage?: string;
  thumbErrorMessage?: string;
  duration?: number;
  clipsUsed?: number;
}

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

export default function PodcastVideoPortal() {
  const [sourceFolder, setSourceFolder] = useState('');
  const [audioFolder, setAudioFolder] = useState('');
  const [outputFolder, setOutputFolder] = useState('');
  const [audioFiles, setAudioFiles] = useState<string[]>([]);
  const [outputClips, setOutputClips] = useState<AudioFile[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [renderLog, setRenderLog] = useState('');
  const abortRef = useRef<(() => void) | null>(null);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [enableThumbnail, setEnableThumbnail] = useState(true);
  const [enableAiTitle, setEnableAiTitle] = useState(() => {
    const saved = localStorage.getItem('podcast_enable_ai_title');
    return saved !== null ? saved === 'true' : true;
  });
  const [aiThumbGuidance, setAiThumbGuidance] = useState(() => {
    return localStorage.getItem('podcast_ai_thumb_guidance') || '';
  });
  const [thumbStylePreset, setThumbStylePreset] = useState(() => {
    return localStorage.getItem('podcast_thumb_style_preset') || 'default';
  });
  const [overwriteThumbnail, setOverwriteThumbnail] = useState(false);
  const [thumbPromptTemplate, setThumbPromptTemplate] = useState<string>(
    'Premium clickbait YouTube thumbnail for topic: "{TOPIC}". Left: Large bold high-contrast 3D Thai text headline "{TOPIC}" in glowing gold and vibrant colors with metallic outline. Right: {AI_SUBJECT} under dramatic cinematic studio lighting. Dark luxury background with golden light streaks, sparks, particles, and volumetric rays. Bottom: Modern circular infographic badges with subtle clean Thai text indicators. High contrast, extremely catchy, stunning visual style, 16:9 aspect ratio'
  );

  useEffect(() => {
    localStorage.setItem('podcast_enable_ai_title', String(enableAiTitle));
  }, [enableAiTitle]);

  useEffect(() => {
    localStorage.setItem('podcast_ai_thumb_guidance', aiThumbGuidance);
  }, [aiThumbGuidance]);

  useEffect(() => {
    localStorage.setItem('podcast_thumb_style_preset', thumbStylePreset);
  }, [thumbStylePreset]);

  const [logs, setLogs] = useState<string[]>([]);
  const [enableBgMusic, setEnableBgMusic] = useState(false);
  const [bgMusicPath, setBgMusicPath] = useState('');
  const [bgMusicVolume, setBgMusicVolume] = useState(15);
  const [kieStatus, setKieStatus] = useState<'connected' | 'not_configured'>('not_configured');
  const [showLogs, setShowLogs] = useState(true);

  const checkKieConnection = () => {
    const key = (localStorage.getItem('kie_key') || localStorage.getItem('kie_api_key') || '').trim();
    if (key) {
      setKieStatus('connected');
    } else {
      setKieStatus('not_configured');
    }
  };

  useEffect(() => {
    checkKieConnection();
  }, []);

  const addLog = (message: string) => {
    const time = new Date().toLocaleTimeString('th-TH');
    setLogs((prev) => [...prev, `[${time}] ${message}`]);
    setRenderLog(message);
  };

  const checkFileExists = async (filePath: string): Promise<boolean> => {
    if (!filePath) return false;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/podcastclip-check-exists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath })
      });
      const data = await res.json();
      return data.success ? data.exists : false;
    } catch {
      return false;
    }
  };

  const pickSourceFolder = async () => {
    const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'เลือกโฟลเดอร์ที่มีคลิปวิดีโอ B-Roll/Footage' }),
    });
    const data = await res.json();
    if (data.success) {
      setSourceFolder(data.dir);
      addLog(`โฟลเดอร์คลิปวิดีโอ: ${data.dir}`);
    }
  };

  const pickAudioFolder = async () => {
    const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'เลือกโฟลเดอร์ที่มีไฟล์เสียงพอดแคสต์พากย์ดิบ (.wav .mp3 .m4a)' }),
    });
    const data = await res.json();
    if (data.success) {
      setAudioFolder(data.dir);
      addLog(`โฟลเดอร์ไฟล์เสียง: ${data.dir}`);
      // List audio files
      const listRes = await fetch(`${BACKEND_BASE}/api/podcastclip-list-audio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: data.dir }),
      });
      const listData = await listRes.json();
      const files = listData.files || [];
      setAudioFiles(files);
      addLog(`พบไฟล์เสียง ${files.length} ไฟล์ในโฟลเดอร์`);
      setOutputClips(files.map((name: string): AudioFile => ({
        name,
        status: 'pending',
        thumbStatus: enableThumbnail ? 'pending' : 'skipped',
      })));
    }
  };

  const pickOutputFolder = async () => {
    const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'เลือกโฟลเดอร์ปลายทางที่เก็บคลิปสั้นสำเร็จรูป' }),
    });
    const data = await res.json();
    if (data.success) {
      setOutputFolder(data.dir);
      addLog(`โฟลเดอร์ปลายทาง: ${data.dir}`);
    }
  };

  const pickBgMusicFile = async () => {
    const res = await fetch(`${BACKEND_BASE}/api/pick-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'เลือกไฟล์เพลงประกอบฉากหลัง (.mp3, .wav, .m4a)' }),
    });
    const data = await res.json();
    if (data.success && data.file) {
      setBgMusicPath(data.file);
      addLog(`เลือกเพลงประกอบฉากหลังสำเร็จ: ${data.file}`);
    }
  };

  const getKieKey = (): string => {
    return (localStorage.getItem('kie_key') || localStorage.getItem('kie_api_key') || '').trim();
  };

  const brainstormThumbnailDetails = async (topicName: string): Promise<{ thaiTitle: string; subjectPrompt: string }> => {
    const defaultDetails = {
      thaiTitle: topicName,
      subjectPrompt: 'A prominent ultra-detailed, photorealistic glowing subject related to the topic'
    };

    if (!enableAiTitle) return defaultDetails;

    const orKey = (localStorage.getItem('openrouter_key') || '').trim();
    if (!orKey) {
      addLog(`[AI Brainstorm] ⚠️ ไม่พบ OpenRouter Key ในการตั้งค่าระบบ จึงข้ามการคิดหัวข้ออัจฉริยะ (ใช้ชื่อดั้งเดิม: "${topicName}")`);
      return defaultDetails;
    }

    try {
      addLog(`[AI Brainstorm] 🧠 กำลังใช้ AI (Gemini) คิดพาดหัวดึงดูดใจ และออกแบบแนวภาพตามสไตล์ที่เลือก...`);
      
      let guidancePrompt = "";
      if (aiThumbGuidance.trim()) {
        guidancePrompt = `
CRITICAL USER DESIGN GUIDELINES (Strictly incorporate these style/content guidelines when designing the title and subject):
- User wants: "${aiThumbGuidance.trim()}"
Make sure both the catchy Thai title and the English subject description reflect these guidelines beautifully.`;
      }

      let styleRule = "";
      if (thumbStylePreset === 'financial') {
        styleRule = `
STYLE PRESET: "ช่องการเงิน" (Financial Channel Premium Styles)
You must select ONE of these 5 specific high-performance financial YouTube thumbnail styles at random or based on what fits the topic best, to ensure each generation is highly diverse and visually engaging:
- Style 1 (Gold & Stats Close-up): A portrait of a professional, focused trader (choose a smart, polished Asian or Western trader, completely different face from any standard examples) looking at the camera, next to a clean floating trading account overlay showing positive stats and numbers. Pile of gold bars in the background with bright yellow/neon ambient glow.
- Style 2 (Day 0 vs Day 100 Split): A split-screen comparison thumbnail. Left side: A young focused student or trader in casual black shirt studying charts on a screen in a dark, simple room (labeled "day 0" with bold red text). Right side: A wealthy trader in a premium white shirt sitting in a luxury armchair looking at their phone, next to a safe box overflowing with cash (labeled "day 100" with bold green text).
- Style 3 (1% Billionaire Mindset Cutout): A close-up black-and-white portrait cutout of a successful investor or a famous tech billionaire on one side with a white sticker outline, and a dark blurred luxury modern mansion or high-tech city skyline in the background, with massive bold pink/neon text.
- Style 4 (Buy/Sell Live Trading Buttons): Close-up portrait of a trader sitting in front of a laptop looking confidently at the camera. The background shows a massive blurred trading screen filled with red and green candlestick charts. The foreground features large, bright green "BUY" and red "SELL" buttons.
- Style 5 (Expert Roundtable Podcast Roundtable): A panel of professional diverse investors/guests in a high-end podcast studio having a discussion, with a businessman celebrating with arms raised on a pile of money in the center background, and falling bills in the air.

CRITICAL REQUIREMENT FOR THE PEOPLE/TRADERS:
- Do NOT make the traders or people resemble the specific faces in standard reference images (e.g. do not copy the exact same young Asian man with middle-parted hair).
- Intentionally choose and describe entirely different characters with highly professional looks (e.g., smart female portfolio manager, senior seasoned broker with grey hair, enthusiastic young woman looking at phone, handsome Western trader, etc.). Each cover must feature a fresh, unique, and professional human face to keep the channel looking organic and varied.`;
      } else if (thumbStylePreset === 'channel_ai') {
        styleRule = `
STYLE PRESET: "ช่องAI" (AI Channel Premium Styles)
You must select ONE of these 5 specific high-performance artificial intelligence YouTube thumbnail styles at random or based on what fits the topic best, to ensure each generation is highly diverse and visually engaging:
- Style 1 (AI Holograms & Tech Stats Close-up): A portrait of a professional, focused AI engineer or tech visionary (choose a smart, polished Asian or Western individual, completely different face from any standard examples) looking at the camera, next to a clean floating holographic interface showing complex neural network architectures, data analytics, and code. Glowing cybernetic/neon structures in the background with bright electric blue/neon cyan ambient glow.
- Style 2 (Before vs After AI Automation Split): A split-screen comparison thumbnail. Left side: A stressed young office worker or developer in casual black shirt surrounded by piles of messy paperwork and spreadsheets in a dark, simple room (labeled "day 0" with bold red text). Right side: A relaxed tech entrepreneur in a premium white shirt sitting in a modern smart office looking at their tablet, surrounded by sleek autonomous robotic arms and AI holograms doing all the tasks (labeled "day 100" with bold green text).
- Style 3 (AI Visionary & Future Mindset Cutout): A close-up black-and-white portrait cutout of a visionary AI researcher or a famous tech founder on one side with a white sticker outline, and a dark blurred futuristic smart city or server farm full of glowing mainframe lights in the background, with massive bold pink/neon text.
- Style 4 (AI Prompt Execution Buttons): Close-up portrait of an AI creator or user sitting in front of a high-tech console looking confidently at the camera. The background shows a massive blurred code terminal or glowing prompt window. The foreground features large, bright neon green "RUN AI" and neon orange "STOP" buttons.
- Style 5 (AI Future & Tech Roundtable Podcast): A panel of professional diverse tech experts and futurists in a high-end podcast studio having an intense discussion, with a sleek humanoid robot sitting at the table as a guest, and glowing digital data streams or binary code raining in the background.

CRITICAL REQUIREMENT FOR THE PEOPLE/AI VISIONARIES:
- Do NOT make the engineers or visionaries resemble the specific faces in standard reference images (e.g. do not copy the exact same young Asian man with middle-parted hair).
- Intentionally choose and describe entirely different characters with highly professional/visionary looks (e.g., smart female AI researcher, senior seasoned system architect, enthusiastic young woman wearing futuristic AR glasses looking at holograms, handsome Western tech founder, etc.). Each cover must feature a fresh, unique, and highly capable human face to keep the channel looking organic and varied.`;
      } else {
        styleRule = `
STYLE PRESET: "สไตล์สุ่มหลากหลาย (Dynamic Default)"
Choose ONE of these diverse visual styles/themes at random to ensure each cover looks completely different and unique:
- Theme A (Cyberpunk / Tech): neon glows, holographic elements, tech charts, intense cyber colors.
- Theme B (Premium Luxury / Rich): deep obsidian black backdrop, flowing metallic gold, liquid gold textures, luxury symbols, sharp reflections.
- Theme C (Mysterious / Dark Cinematic): moody atmosphere, volumetric rays of light, dramatic shadows, glowing key elements, smoke or dust particles.
- Theme E (Surreal / Conceptual): metaphorical elements, a glowing floating brain, hourglass of time, floating keys, or glass-morphic structures.`;
      }

      const prompt = `You are a viral YouTube thumbnail designer and clickbait expert. 
Analyze the following topic, then brainstorm:
1. A highly engaging, clickbait, curiosity-inducing, and extremely catchy short Thai headline (2-5 words, maximum 25 characters) to be placed as bold 3D text on the thumbnail. Do NOT copy the topic name literally. Make it dramatic, highly intriguing, or emotional so people cannot scroll past.
2. A unique, visually stunning, photorealistic subject description in English (25-45 words) for an AI image generator (like Stable Diffusion / Midjourney).

Topic Filename: "${topicName}"
${styleRule}
${guidancePrompt}

Return ONLY a valid JSON object in this exact format, with no markdown backticks or extra text:
{
  "thaiTitle": "Catchy Thai Title",
  "subjectPrompt": "Description of the visual subject..."
}`;

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${orKey}`,
          'HTTP-Referer': 'http://localhost:5173',
          'X-Title': 'ContentFactory'
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You brainstorm highly engaging clickbait YouTube thumbnails. Return valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API responded with status ${response.status}`);
      }

      const resData = await response.json();
      const content = resData.choices?.[0]?.message?.content?.trim() || '';
      
      // Clean up potential markdown wrapper code block
      const jsonStr = content.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      if (parsed.thaiTitle && parsed.subjectPrompt) {
        addLog(`[AI Brainstorm] ✅ คิดพาดหัวใหม่สำเร็จ: "${parsed.thaiTitle}"`);
        addLog(`[AI Brainstorm] 🎨 แนวภาพที่ออกแบบ: "${parsed.subjectPrompt}"`);
        return {
          thaiTitle: parsed.thaiTitle,
          subjectPrompt: parsed.subjectPrompt
        };
      }
    } catch (err: any) {
      addLog(`[AI Brainstorm] ❌ ไม่สำเร็จเนื่องจาก: ${err.message || err}. สลับกลับไปใช้ข้อมูลแบบเดิม`);
    }

    return defaultDetails;
  };

  const generateThumbnailViaKie = async (topicName: string, outputPath: string): Promise<boolean> => {
    const apiKey = getKieKey();
    if (!apiKey) throw new Error('ไม่พบ KIE.ai API Key กรุณาตั้งค่าในแท็บ Settings (การตั้งค่า API) มุมขวาบนครับ');

    const aiDetails = await brainstormThumbnailDetails(topicName);

    let prompt = "";
    if (thumbStylePreset === 'financial' || thumbStylePreset === 'channel_ai') {
      prompt = `High-impact YouTube thumbnail, high-contrast, Catchy Clickbait style. Left side: Large bold solid typography of the Thai text headline "${aiDetails.thaiTitle}" in clean vibrant colors (such as solid yellow, bright white, or hot pink) with high-contrast outlines for maximum readability. Right side: ${aiDetails.subjectPrompt}. Clean, professional, extremely high contrast, modern YouTube thumbnail composition with realistic studio lighting, photo-realistic details, 16:9 aspect ratio. No generic watermark, no crowded golden circular infographic badges at the bottom, no forced metallic gold sparkles.`;
    } else {
      prompt = thumbPromptTemplate
        .replace(/{TOPIC}/g, aiDetails.thaiTitle)
        .replace(/{AI_TITLE}/g, aiDetails.thaiTitle)
        .replace(/{AI_SUBJECT}/g, aiDetails.subjectPrompt);
    }

    // 1. Create task
    const kieRes = await fetch(`${BACKEND_BASE}/api/kie-create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey,
        model: 'gpt-image-2-text-to-image',
        input: {
          prompt,
          aspect_ratio: '16:9',
          quality: 'medium',
          num_inference_steps: 20,
          guidance_scale: 7
        }
      })
    });

    const kieData = await kieRes.json();
    if (kieData.code !== 200 || !kieData.data?.taskId) {
      throw new Error(kieData.msg || 'Kie.ai createTask Error');
    }

    const taskId = kieData.data.taskId;
    addLog(`สร้างคิวรูปปกใน Kie.ai สำเร็จ (Task ID: ${taskId}) กำลังรอการเรนเดอร์ภาพจาก AI...`);

    // 2. Poll for result
    const maxPolls = 120;
    for (let i = 0; i < maxPolls; i++) {
      await new Promise(r => setTimeout(r, 5000));

      try {
        const pollRes = await fetch(`${BACKEND_BASE}/api/kie-status?taskId=${taskId}&apiKey=${encodeURIComponent(apiKey)}`);
        const pollData = await pollRes.json();
        const taskData = pollData.data || pollData;
        const state = (taskData.state || taskData.status || '').toLowerCase();

        if (state === 'success' || state === 'completed' || state === 'done') {
          const rawResultJson = taskData.resultJson || taskData.result;
          let imageUrl = '';

          if (typeof rawResultJson === 'string') {
            if (rawResultJson.startsWith('http')) {
              imageUrl = rawResultJson;
            } else {
              try {
                const resultObj = JSON.parse(rawResultJson);
                if (resultObj.resultUrls?.[0]) imageUrl = resultObj.resultUrls[0];
                else if (resultObj.images?.[0]) {
                  const img = resultObj.images[0];
                  imageUrl = typeof img === 'string' ? img : (img.url || img.uri || '');
                }
                else if (resultObj.image_url) imageUrl = resultObj.image_url;
                else if (resultObj.url) imageUrl = resultObj.url;
                else if (resultObj.output_url) imageUrl = resultObj.output_url;
              } catch {}
            }
          }

          if (!imageUrl) throw new Error('ไม่พบ URL ของรูปภาพจาก Kie.ai');

          addLog(`รูปภาพปกพอดแคสต์วาดเสร็จสิ้น! กำลังดาวน์โหลดและบันทึกบันทึกลงในไดรฟ์เครื่อง...`);

          // 3. Save thumbnail to disk
          const saveRes = await fetch(`${BACKEND_BASE}/api/save-thumbnail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageUrl, outputPath })
          });
          const saveData = await saveRes.json();
          if (!saveData.success) throw new Error(saveData.error || 'ไม่สามารถบันทึกรูปปก');
          return true;
        }

        if (state === 'fail' || state === 'failed' || state === 'error') {
          throw new Error('Kie.ai generation failed: ' + (taskData.failMsg || taskData.message || ''));
        }
      } catch (pollErr: any) {
        if (pollErr.message.includes('Kie.ai generation failed')) throw pollErr;
        addLog(`[AI Retry Check] ${pollErr.message}`);
      }
    }

    throw new Error('หมดเวลารอคอยสร้างรูปปก AI (เกิน 10 นาที)');
  };

  const handleGenerateSingleThumbnail = async (idx: number) => {
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทางก่อนสร้างรูปปก');
    const clip = outputClips[idx];
    const audioBaseName = clip.name.replace(/\.[^.]+$/, '');
    const safeName = audioBaseName.replace(/[^ก-๙a-zA-Z0-9_-]/g, '_');
    const expectedThumbPath = `${outputFolder}/${safeName}_output_ปกคลิป.png`;

    addLog(`[รูปปกเดี่ยว] กำลังตรวจสอบภาพปกสำหรับ: ${audioBaseName}`);
    const exists = await checkFileExists(expectedThumbPath);
    if (exists) {
      const confirmForce = window.confirm(`พบรูปปกเดิม "${safeName}_output_ปกคลิป.png" อยู่แล้วในเครื่อง\n\nคุณต้องการเรียก AI วาดรูปปกใหม่เพื่อเขียนทับรูปเดิมใช่หรือไม่?\n(การปรับปรุงไอเดีย/คำแนะนำเพิ่มเติมล่าสุดจะมีผลในรูปภาพใหม่นี้)`);
      if (!confirmForce) {
        addLog(`  ✅ ผู้ใช้ยกเลิกการเขียนทับรูปเดิม: ${safeName}_output_ปกคลิป.png`);
        const updated = [...outputClips];
        updated[idx].thumbStatus = 'done';
        updated[idx].thumbPath = expectedThumbPath;
        setOutputClips(updated);
        return;
      }
      addLog(`  ⚠️ ผู้ใช้ยืนยันคำสั่งเขียนทับรูปเดิม เริ่มสั่ง AI วาดใหม่...`);
    }

    const updated = [...outputClips];
    updated[idx].thumbStatus = 'generating';
    setOutputClips([...updated]);
    addLog(`[รูปปกเดี่ยว] เริ่มทำงาน... กำลังส่งคำสั่งไปยัง Kie.ai เพื่อสร้างปกสำหรับ: ${audioBaseName}`);

    try {
      const success = await generateThumbnailViaKie(audioBaseName, expectedThumbPath);
      const afterGen = [...outputClips];
      if (success) {
        afterGen[idx].thumbStatus = 'done';
        afterGen[idx].thumbPath = expectedThumbPath;
        addLog(`[รูปปกเดี่ยว] ✅ วาดรูปและดาวน์โหลดสำเร็จแล้ว! บันทึกที่: ${safeName}_output_ปกคลิป.png`);
      } else {
        afterGen[idx].thumbStatus = 'error';
        afterGen[idx].thumbErrorMessage = 'วาดรูปปกล้มเหลว';
        addLog(`[รูปปกเดี่ยว] ❌ ล้มเหลว: ไม่สามารถดาวน์โหลดรูปภาพได้`);
      }
      setOutputClips(afterGen);
    } catch (err: any) {
      const afterGen = [...outputClips];
      afterGen[idx].thumbStatus = 'error';
      afterGen[idx].thumbErrorMessage = err.message || 'Error generating';
      addLog(`[รูปปกเดี่ยว] ❌ เกิดข้อผิดพลาด: ${err.message}`);
      setOutputClips(afterGen);
    }
  };

  const generateAllThumbnailsOnly = async () => {
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทางก่อน');
    if (audioFiles.length === 0) return alert('ไม่มีไฟล์เสียงในระบบ');

    setIsRendering(true);
    setProgress(0);
    setLogs([]);
    addLog('🎨 เริ่มสร้างรูปปกพอดแคสต์ทั้งหมดด้วย AI (ข้ามขั้นตอนการตัดต่อวิดีโอ)...');

    const clips = [...outputClips];
    for (let i = 0; i < clips.length; i++) {
      const audioBaseName = clips[i].name.replace(/\.[^.]+$/, '');
      const safeName = audioBaseName.replace(/[^ก-๙a-zA-Z0-9_-]/g, '_');
      const expectedThumbPath = `${outputFolder}/${safeName}_output_ปกคลิป.png`;

      addLog(`[${i + 1}/${clips.length}] ตรวจสอบรูปปกของ: ${audioBaseName}`);
      const exists = !overwriteThumbnail && await checkFileExists(expectedThumbPath);
      if (exists) {
        clips[i].thumbStatus = 'done';
        clips[i].thumbPath = expectedThumbPath;
        setOutputClips([...clips]);
        addLog(`  ✅ พบรูปปกเดิม ข้าม: "${safeName}_output_ปกคลิป.png"`);
        continue;
      }

      clips[i].thumbStatus = 'generating';
      setOutputClips([...clips]);
      addLog(`  🎨 กำลังเรียก AI วาดรูปปกสำหรับไฟล์ลำดับที่ ${i + 1}: ${audioBaseName}`);

      try {
        const success = await generateThumbnailViaKie(audioBaseName, expectedThumbPath);
        if (success) {
          clips[i].thumbStatus = 'done';
          clips[i].thumbPath = expectedThumbPath;
          addLog(`  ✅ วาดรูปปกสำเร็จและบันทึกแล้ว!`);
        } else {
          clips[i].thumbStatus = 'error';
          clips[i].thumbErrorMessage = 'วาดภาพล้มเหลว';
          addLog(`  ❌ วาดรูปปกล้มเหลว`);
        }
      } catch (err: any) {
        clips[i].thumbStatus = 'error';
        clips[i].thumbErrorMessage = err.message || 'Error';
        addLog(`  ❌ ผิดพลาด: ${err.message}`);
      }
      setOutputClips([...clips]);
      setProgress(Math.round(((i + 1) / clips.length) * 100));
    }

    setIsRendering(false);
    addLog('🎉 เสร็จสิ้นขั้นตอนสร้างรูปปก AI ทั้งหมดที่ไม่มีอยู่แล้ว!');
    alert('สร้างรูปปกเสร็จสิ้นทั้งหมด!');
  };

  const startBatchAllJobs = async () => {
    if (!sourceFolder) return alert('กรุณาเลือกโฟลเดอร์คลิปวิดีโอ');
    if (!audioFolder) return alert('กรุณาเลือกโฟลเดอร์ไฟล์เสียง');
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทาง');
    if (audioFiles.length === 0) return alert('ไม่มีไฟล์เสียงในโฟลเดอร์');

    setIsRendering(true);
    setIsPaused(false);
    setProgress(0);
    addLog('⚡ เริ่มระบบทำงานทั้งหมดแบบเก็บตก (Smart Batch: วาดปก AI ก่อน จากนั้นจึงตัดต่อวิดีโอทั้งหมด)...');

    let clips = [...outputClips];
    if (clips.length === 0) {
      clips = audioFiles.map((name): AudioFile => ({
        name,
        status: 'pending',
        thumbStatus: enableThumbnail ? 'pending' : 'skipped',
      }));
      setOutputClips(clips);
    }
    setTotalCount(audioFiles.length);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    // === Phase 1: Generate missing thumbnails first ===
    if (enableThumbnail) {
      for (let i = 0; i < audioFiles.length; i++) {
        if (controller.signal.aborted) break;

        const clip = clips[i];
        if (clip.thumbStatus === 'done' || clip.thumbStatus === 'skipped') continue;

        const audioBaseName = audioFiles[i].replace(/\.[^.]+$/, '');
        const safeName = audioBaseName.replace(/[^ก-๙a-zA-Z0-9_-]/g, '_');
        const expectedThumbPath = `${outputFolder}/${safeName}_output_ปกคลิป.png`;

        addLog(`[${i + 1}/${audioFiles.length}] [Phase 1: สร้างรูปปก AI] ตรวจสอบรูปภาพปกสำหรับ: ${audioBaseName}`);
        const thumbExists = !overwriteThumbnail && await checkFileExists(expectedThumbPath);

        if (thumbExists) {
          addLog(`  ✅ พบรูปปกเดิมอยู่แล้ว: "${safeName}_output_ปกคลิป.png" (ข้ามขั้นตอนการวาดปก)`);
          clips[i].thumbStatus = 'done';
          clips[i].thumbPath = expectedThumbPath;
          setOutputClips([...clips]);
        } else {
          addLog(`  🎨 ไม่พบรูปปกเดิม เริ่มเรียกใช้ Kie.ai AI เพื่อสร้างรูปปก...`);
          clips[i].thumbStatus = 'generating';
          setOutputClips([...clips]);

          try {
            const success = await generateThumbnailViaKie(audioBaseName, expectedThumbPath);
            if (success) {
              clips[i].thumbStatus = 'done';
              clips[i].thumbPath = expectedThumbPath;
              addLog(`  🎨 ✅ สร้างภาพและบันทึกรูปปกสำเร็จแล้ว!`);
            } else {
              clips[i].thumbStatus = 'error';
              clips[i].thumbErrorMessage = 'ไม่สามารถสร้างรูปปกได้';
              addLog(`  🎨 ❌ การดึงภาพปก AI ล้มเหลว`);
            }
          } catch (err: any) {
            clips[i].thumbStatus = 'error';
            clips[i].thumbErrorMessage = err.message || 'Error generating thumbnail';
            addLog(`  🎨 ❌ การสร้างปกล้มเหลว: ${err.message}`);
          }
          setOutputClips([...clips]);
        }
      }
    }

    // === Phase 2: Render missing videos next ===
    for (let i = 0; i < audioFiles.length; i++) {
      if (controller.signal.aborted) break;

      const clip = clips[i];
      if (clip.status === 'done') continue;

      const audioBaseName = audioFiles[i].replace(/\.[^.]+$/, '');
      const safeName = audioBaseName.replace(/[^ก-๙a-zA-Z0-9_-]/g, '_');
      const expectedVideoPath = `${outputFolder}/${safeName}_output.mp4`;

      addLog(`[${i + 1}/${audioFiles.length}] [Phase 2: ตัดต่อวิดีโอ] วิเคราะห์ไฟล์งาน: ${audioFiles[i]}`);
      const videoExists = await checkFileExists(expectedVideoPath);

      if (videoExists) {
        addLog(`  ✅ พบไฟล์วิดีโอเดิมบนเครื่อง: "${safeName}_output.mp4" (ข้ามขั้นตอนการประมวลผลวิดีโอซ้ำ)`);
        clips[i].status = 'done';
        clips[i].outputPath = expectedVideoPath;
        setOutputClips([...clips]);
      } else {
        addLog(`  🎬 ไม่พบวิดีโอเดิม เริ่มต้นเรนเดอร์ตัดต่อด้วยระบบ FFmpeg...`);
        clips[i].status = 'analyzing';
        setOutputClips([...clips]);

        try {
          const res = await fetch(`${BACKEND_BASE}/api/render-podcastclip-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceFolder,
              audioFolder,
              outputFolder,
              audioFile: audioFiles[i],
              bgMusicPath: enableBgMusic ? bgMusicPath : '',
              bgMusicVolume: enableBgMusic ? bgMusicVolume / 100 : 0,
            }),
            signal: controller.signal,
          });

          const reader = res.body?.getReader();
          if (!reader) throw new Error('Stream not supported');

          const decoder = new TextDecoder();
          let done = false;
          let clipResult: AudioFile = { 
            name: audioFiles[i], 
            status: 'error',
            thumbStatus: clip.thumbStatus
          };

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunkStr = decoder.decode(value, { stream: true });
              const lines = chunkStr.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const d = JSON.parse(line.substring(6));
                    if (d.log) addLog(`    [FFmpeg Engine] ${d.log}`);
                    if (d.paused) {
                      setIsPaused(true);
                      clips[i].status = 'paused';
                      setOutputClips([...clips]);
                    }
                    if (d.resumed) {
                      setIsPaused(false);
                      clips[i].status = 'rendering';
                      setOutputClips([...clips]);
                    }
                    if (d.success) {
                      clipResult = {
                        name: audioFiles[i],
                        status: 'done',
                        thumbStatus: clip.thumbStatus,
                        outputPath: d.filePath,
                        duration: d.duration,
                        clipsUsed: d.clipsUsed,
                      };
                    }
                    if (d.error) {
                      clipResult = {
                        name: audioFiles[i],
                        status: 'error',
                        thumbStatus: clip.thumbStatus,
                        errorMessage: d.error,
                      };
                    }
                  } catch { /* skip */ }
                }
              }
            }
          }

          clips[i] = clipResult;
          if (clipResult.status === 'done') {
            addLog(`  ✅ เรนเดอร์วิดีโอสำเร็จเรียบร้อย! (ความยาว ${clipResult.duration?.toFixed(1)} วินาที, ใช้ ${clipResult.clipsUsed} ฟุตเทจ)`);
          } else {
            addLog(`  ❌ ผิดพลาด: ${clipResult.errorMessage}`);
          }
        } catch (e: any) {
          if (e.name === 'AbortError') {
            clips[i] = { 
              name: audioFiles[i], 
              status: 'error', 
              thumbStatus: clip.thumbStatus,
              errorMessage: 'ถูกหยุดโดยผู้ใช้' 
            };
            addLog('  🛑 การประมวลผลถูกสั่งหยุดโดยผู้ใช้');
          } else {
            clips[i] = { 
              name: audioFiles[i], 
              status: 'error', 
              thumbStatus: clip.thumbStatus,
              errorMessage: e.message || 'Unknown error' 
            };
            addLog(`  ❌ ผิดพลาด: ${e.message}`);
          }
        }
        setOutputClips([...clips]);
      }

      setProgress(Math.round(((i + 1) / audioFiles.length) * 100));
    }

    setIsRendering(false);
    setIsPaused(false);
    abortRef.current = null;
    if (!controller.signal.aborted) {
      addLog('🎉 งานเก็บตกรันสำเร็จครบทุกรายการแล้ว!');
      alert('ประมวลผลเสร็จสิ้นทั้งหมด!');
    }
  };

  const startRender = async (forceNoThumbnail: any = false) => {
    if (!sourceFolder) return alert('กรุณาเลือกโฟลเดอร์คลิปวิดีโอ');
    if (!audioFolder) return alert('กรุณาเลือกโฟลเดอร์ไฟล์เสียง');
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทาง');
    if (audioFiles.length === 0) return alert('ไม่มีไฟล์เสียงในโฟลเดอร์');

    const useThumbnail = forceNoThumbnail === true ? false : enableThumbnail;

    setIsRendering(true);
    setIsPaused(false);
    setProgress(0);
    setLogs([]); // Reset logs at start
    if (useThumbnail) {
      addLog('🎬 เริ่มระบบตัดต่อวิดีโอพอดแคสต์ และทำภาพปกอัตโนมัติ (Deduplication Enabled)...');
    } else {
      addLog('🎬 เริ่มระบบตัดต่อวิดีโอพอดแคสต์อย่างเดียว (ไม่ทำปก) (Deduplication Enabled)...');
    }
    setCompletedCount(0);
    setTotalCount(audioFiles.length);

    const clips: AudioFile[] = audioFiles.map((name) => ({
      name,
      status: 'pending' as const,
      thumbStatus: useThumbnail ? 'pending' as const : 'skipped' as const,
    }));
    setOutputClips(clips);

    const controller = new AbortController();
    abortRef.current = () => controller.abort();

    for (let i = 0; i < audioFiles.length; i++) {
      if (controller.signal.aborted) break;

      const audioBaseName = audioFiles[i].replace(/\.[^.]+$/, '');
      const safeName = audioBaseName.replace(/[^ก-๙a-zA-Z0-9_-]/g, '_');
      const expectedVideoPath = `${outputFolder}/${safeName}_output.mp4`;
      const expectedThumbPath = `${outputFolder}/${safeName}_output_ปกคลิป.png`;

      addLog(`[${i + 1}/${audioFiles.length}] วิเคราะห์ไฟล์งาน: ${audioFiles[i]}`);

      // 1. Check if output video already exists
      const videoExists = await checkFileExists(expectedVideoPath);

      let clipResult: AudioFile = {
        name: audioFiles[i],
        status: 'pending',
        thumbStatus: useThumbnail ? 'pending' : 'skipped',
        outputPath: expectedVideoPath
      };

      if (videoExists) {
        addLog(`  ✅ พบไฟล์วิดีโอเดิมบนเครื่อง: "${safeName}_output.mp4" (ข้ามขั้นตอนการประมวลผลวิดีโอซ้ำ)`);
        clipResult.status = 'done';
        clips[i] = clipResult;
        setOutputClips([...clips]);
        setCompletedCount((c) => c + 1);
      } else {
        addLog(`  🎬 ไม่พบวิดีโอเดิม เริ่มต้นเรนเดอร์ตัดต่อด้วยระบบ FFmpeg...`);
        const updated = [...clips];
        updated[i].status = 'analyzing';
        setOutputClips([...updated]);

        try {
          const res = await fetch(`${BACKEND_BASE}/api/render-podcastclip-audio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sourceFolder,
              audioFolder,
              outputFolder,
              audioFile: audioFiles[i],
              bgMusicPath: enableBgMusic ? bgMusicPath : '',
              bgMusicVolume: enableBgMusic ? bgMusicVolume / 100 : 0,
            }),
            signal: controller.signal,
          });

          const reader = res.body?.getReader();
          if (!reader) throw new Error('Stream not supported');

          const decoder = new TextDecoder();
          let done = false;
          clipResult = { 
            name: audioFiles[i], 
            status: 'error',
            thumbStatus: useThumbnail ? 'pending' : 'skipped'
          };

          while (!done) {
            const { value, done: doneReading } = await reader.read();
            done = doneReading;
            if (value) {
              const chunkStr = decoder.decode(value, { stream: true });
              const lines = chunkStr.split('\n');
              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const d = JSON.parse(line.substring(6));
                    if (d.log) addLog(`    [FFmpeg Engine] ${d.log}`);
                    if (d.paused) {
                      setIsPaused(true);
                      clips[i].status = 'paused';
                      setOutputClips([...clips]);
                    }
                    if (d.resumed) {
                      setIsPaused(false);
                      clips[i].status = 'rendering';
                      setOutputClips([...clips]);
                    }
                    if (d.success) {
                      clipResult = {
                        name: audioFiles[i],
                        status: 'done',
                        thumbStatus: useThumbnail ? 'pending' : 'skipped',
                        outputPath: d.filePath,
                        duration: d.duration,
                        clipsUsed: d.clipsUsed,
                      };
                    }
                    if (d.error) {
                      clipResult = {
                        name: audioFiles[i],
                        status: 'error',
                        thumbStatus: useThumbnail ? 'pending' : 'skipped',
                        errorMessage: d.error,
                      };
                    }
                  } catch { /* skip */ }
                }
              }
            }
          }

          clips[i] = clipResult;
          if (clipResult.status === 'done') {
            setCompletedCount((c) => c + 1);
            addLog(`  ✅ เรนเดอร์วิดีโอสำเร็จเรียบร้อย! (ความยาว ${clipResult.duration?.toFixed(1)} วินาที, ใช้ ${clipResult.clipsUsed} ฟุตเทจ)`);
          } else {
            addLog(`  ❌ ผิดพลาด: ${clipResult.errorMessage}`);
          }
        } catch (e: any) {
          if (e.name === 'AbortError') {
            clips[i] = { 
              name: audioFiles[i], 
              status: 'error', 
              thumbStatus: useThumbnail ? 'error' : 'skipped',
              errorMessage: 'ถูกหยุดโดยผู้ใช้' 
            };
            addLog('  🛑 การประมวลผลถูกสั่งหยุดโดยผู้ใช้');
          } else {
            clips[i] = { 
              name: audioFiles[i], 
              status: 'error', 
              thumbStatus: useThumbnail ? 'error' : 'skipped',
              errorMessage: e.message || 'Unknown error' 
            };
            addLog(`  ❌ ผิดพลาด: ${e.message}`);
          }
        }
        setOutputClips([...clips]);
      }

      // 2. AI Thumbnail Process
      if (clipResult.status === 'done' && useThumbnail) {
        addLog(`  🎨 ตรวจสอบรูปภาพปกสำหรับ: ${audioBaseName}`);
        const thumbExists = !overwriteThumbnail && await checkFileExists(expectedThumbPath);

        if (thumbExists) {
          addLog(`  ✅ พบรูปปกเดิมอยู่แล้ว: "${safeName}_output_ปกคลิป.png" (ข้ามขั้นตอนการวาดปก)`);
          clips[i].thumbStatus = 'done';
          clips[i].thumbPath = expectedThumbPath;
          setOutputClips([...clips]);
        } else {
          addLog(`  🎨 ไม่พบรูปปกเดิม เริ่มเรียกใช้ Kie.ai AI เพื่อสร้างรูปปก...`);
          clips[i].thumbStatus = 'generating';
          setOutputClips([...clips]);

          try {
            const success = await generateThumbnailViaKie(audioBaseName, expectedThumbPath);
            if (success) {
              clips[i].thumbStatus = 'done';
              clips[i].thumbPath = expectedThumbPath;
              addLog(`  🎨 ✅ สร้างภาพและบันทึกรูปปกสำเร็จแล้ว!`);
            } else {
              clips[i].thumbStatus = 'error';
              clips[i].thumbErrorMessage = 'ไม่สามารถสร้างรูปปกได้';
              addLog(`  🎨 ❌ การดึงภาพปก AI ล้มเหลว`);
            }
          } catch (err: any) {
            clips[i].thumbStatus = 'error';
            clips[i].thumbErrorMessage = err.message || 'Error generating thumbnail';
            addLog(`  🎨 ❌ การสร้างปกล้มเหลว: ${err.message}`);
          }
          setOutputClips([...clips]);
        }
      }

      setProgress(Math.round(((i + 1) / audioFiles.length) * 100));
    }

    setIsRendering(false);
    setIsPaused(false);
    abortRef.current = null;
    if (!controller.signal.aborted) {
      if (useThumbnail) {
        addLog('🎉 งานเรนเดอร์พอดแคสต์ และวาดรูปปก AI ทั้งหมดเสร็จสิ้นเรียบร้อยแล้ว!');
        alert('สร้างคลิปพอดแคสต์เสร็จสิ้น!');
      } else {
        addLog('🎉 งานเรนเดอร์พอดแคสต์เสร็จสิ้นเรียบร้อยแล้ว! (ตัดคลิปอย่างเดียว)');
        alert('สร้างเฉพาะคลิปวิดีโอเสร็จสิ้น!');
      }
    }
  };

  const handlePause = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/podcastclip-pause`, { method: 'POST' });
      addLog('⏸️ กดปุ่มพักงานชั่วคราว');
    } catch { /* ignore */ }
  };

  const handleResume = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/podcastclip-resume`, { method: 'POST' });
      addLog('▶️ ทำงานต่อ...');
    } catch { /* ignore */ }
  };

  const handleStop = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/podcastclip-stop`, { method: 'POST' });
      addLog('🛑 กดปุ่มยกเลิกงานทั้งหมด');
    } catch { /* ignore */ }
    if (abortRef.current) abortRef.current();
  };

  const openFolder = async () => {
    try {
      await fetch(`${BACKEND_BASE}/api/open-folder?type=${encodeURIComponent(outputFolder)}`);
      addLog(`เปิดโฟลเดอร์ปลายทาง: ${outputFolder}`);
    } catch { /* ignore */ }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative pb-32 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 font-display uppercase tracking-tight flex items-center gap-2">
            <Film className="w-7 h-7 text-cyan-400" />
            สร้างคลิปpodcast
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">
            สุ่มตัดต่อวิดีโอ B-Roll/Footage จากโฟลเดอร์ต้นทาง ยึดตามความยาวไฟล์เสียง พร้อมใส่เสียงลงในคลิปออฟไลน์
          </p>
        </div>
      </div>

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Configurations Box */}
        <div className="lg:col-span-2 bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-xl space-y-6">
          <h3 className="font-bold text-xs text-cyan-400 flex items-center gap-2 uppercase font-mono mb-4">
            <Settings className="w-4 h-4" />
            การตั้งค่าโฟลเดอร์และแหล่งข้อมูล
          </h3>

          <div className="space-y-4">
            {/* Source Video Folder */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">โฟลเดอร์คลิปวิดีโอ (Footage/B-Roll)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={sourceFolder}
                  placeholder="ยังไม่ได้เลือก..."
                  className="flex-1 px-4 py-2.5 bg-slate-900/40 border border-slate-850 rounded-lg text-xs text-white outline-none"
                />
                <button
                  onClick={pickSourceFolder}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  เลือกโฟลเดอร์
                </button>
              </div>
            </div>

            {/* Audio Folder */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">โฟลเดอร์ไฟล์เสียงพากย์ดิบ (.wav .mp3 .m4a)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={audioFolder}
                  placeholder="ยังไม่ได้เลือก..."
                  className="flex-1 px-4 py-2.5 bg-slate-900/40 border border-slate-850 rounded-lg text-xs text-white outline-none"
                />
                <button
                  onClick={pickAudioFolder}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  เลือกโฟลเดอร์
                </button>
              </div>
              {audioFiles.length > 0 && (
                <div className="mt-2 text-[10px] text-cyan-400 font-mono">
                  พบไฟล์พอดแคสต์เสียงทั้งหมด {audioFiles.length} ไฟล์
                </div>
              )}
            </div>

            {/* Output Folder */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2">โฟลเดอร์จัดเก็บคลิปสำเร็จรูปปลายทาง</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={outputFolder}
                  placeholder="ยังไม่ได้เลือก..."
                  className="flex-1 px-4 py-2.5 bg-slate-900/40 border border-slate-850 rounded-lg text-xs text-white outline-none"
                />
                <button
                  onClick={pickOutputFolder}
                  className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                >
                  <FolderOpen className="w-4 h-4" />
                  เลือกโฟลเดอร์
                </button>
              </div>
            </div>

            {/* Background Music Section */}
            <div className="pt-4 border-t border-slate-900/60">
              <div className="flex justify-between items-center mb-3">
                <label className="block text-xs font-bold text-slate-400 flex items-center gap-1.5">
                  <Music className="w-4 h-4 text-pink-400" />
                  🎵 เสียงเพลงประกอบฉากหลัง (Optional)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="toggle-bg-music"
                    type="checkbox"
                    checked={enableBgMusic}
                    onChange={(e) => setEnableBgMusic(e.target.checked)}
                    className="w-3.5 h-3.5 accent-pink-500 cursor-pointer rounded"
                  />
                  <label htmlFor="toggle-bg-music" className="text-xs font-bold text-slate-400 cursor-pointer select-none">
                    เปิดใช้งานเพลงประกอบ
                  </label>
                </div>
              </div>

              {enableBgMusic && (
                <div className="space-y-3 bg-slate-900/10 p-3 rounded-xl border border-slate-850">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={bgMusicPath}
                      placeholder="คลิกเลือกไฟล์เสียงเพลงประกอบ (.mp3, .wav)..."
                      className="flex-1 px-4 py-2.5 bg-slate-900/40 border border-slate-850 rounded-lg text-xs text-white outline-none"
                    />
                    <button
                      onClick={pickBgMusicFile}
                      className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4" />
                      เลือกไฟล์
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1.5">
                      <span>ระดับความดังของเพลงประกอบ (Background Volume)</span>
                      <span className="text-pink-400 font-mono">{bgMusicVolume}%</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-slate-500 font-mono">เบามาก</span>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={bgMusicVolume}
                        onChange={(e) => setBgMusicVolume(parseInt(e.target.value))}
                        className="flex-1 accent-pink-500 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-500 font-mono">ดังปกติ</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                      * แนะนำที่ระดับ 5% - 15% เพื่อความกลมกลืน ไม่เบียดเสียงพากย์หลัก และโปรแกรมจะวนซ้ำเพลงประกอบให้อัตโนมัติหากคลิปยาวกว่าความยาวเพลง
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Thumbnail Panel */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xs text-cyan-400 flex items-center gap-2 uppercase font-mono">
                <ImageIcon className="w-4 h-4 text-teal-400" />
                วาดรูปปก AI (Kie.ai)
              </h3>
              <div className="flex items-center gap-2">
                <input
                  id="toggle-thumbnail"
                  type="checkbox"
                  checked={enableThumbnail}
                  onChange={(e) => {
                    setEnableThumbnail(e.target.checked);
                    setOutputClips(prev => prev.map(c => ({
                      ...c,
                      thumbStatus: e.target.checked ? (c.thumbStatus === 'skipped' ? 'pending' : c.thumbStatus) : 'skipped'
                    })));
                  }}
                  className="w-4 h-4 accent-teal-500 cursor-pointer rounded"
                />
                <label htmlFor="toggle-thumbnail" className="text-xs font-bold text-slate-400 cursor-pointer">
                  เปิดใช้งาน
                </label>
              </div>
            </div>

            {/* Kie API Key Connection Status */}
            <div className="mb-4 p-3 bg-slate-900/20 border border-slate-850 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono">สถานะการเชื่อมต่อ KIE.AI</span>
                <button 
                  onClick={checkKieConnection}
                  className="px-2 py-0.5 text-[9px] font-bold text-cyan-400 border border-cyan-900/30 hover:border-cyan-500/50 bg-slate-950 rounded transition cursor-pointer"
                >
                  ตรวจสอบอีกครั้ง
                </button>
              </div>
              <div className="mt-2 flex items-center gap-1.5">
                {kieStatus === 'connected' ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    เชื่อมต่อ API เรียบร้อย (พร้อมวาดปก)
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-450 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    ยังไม่ได้เชื่อมต่อ API (ต้องการคีย์เพื่อสร้างรูปปก)
                  </span>
                )}
              </div>
            </div>

            {enableThumbnail && (
              <div className="space-y-4">
                {/* AI Clickbait Optimizer Toggle */}
                <div className="flex items-center justify-between p-3 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-indigo-300 flex items-center gap-1 font-sans">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                      ระบบจูนหัวข้อดึงดูดและแนวภาพด้วย AI
                    </span>
                    <span className="text-[10px] text-slate-400 font-sans">
                      คิดหัวข้อ Clickbait ใหม่โดนๆ และเปลี่ยนสไตล์ภาพสุ่มให้หลากหลายไม่ซ้ำกัน (ต้องใส่ OpenRouter Key)
                    </span>
                  </div>
                  <input
                    id="toggle-ai-title"
                    type="checkbox"
                    checked={enableAiTitle}
                    onChange={(e) => setEnableAiTitle(e.target.checked)}
                    className="w-4 h-4 accent-indigo-500 cursor-pointer rounded flex-shrink-0"
                  />
                </div>

                {/* AI Style Preset Selection Dropdown */}
                {enableAiTitle && (
                  <div className="space-y-2 p-3 bg-indigo-950/15 border border-indigo-900/35 rounded-xl text-left">
                    <label className="block text-[11px] font-bold text-indigo-300 font-sans">
                      🎨 สไตล์รูปปก AI (Thumbnail Style Preset)
                    </label>
                    <select
                      value={thumbStylePreset}
                      onChange={(e) => setThumbStylePreset(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-850 rounded-lg text-xs text-white cursor-pointer outline-none focus:border-indigo-500 font-sans font-medium"
                    >
                      <option value="default">สไตล์สุ่มหลากหลาย (Dynamic Default / Random Styles)</option>
                      <option value="financial">ช่องการเงิน (Financial Channel Styles - 5 Sub-themes)</option>
                      <option value="channel_ai">ช่องAI (AI Channel Styles - 5 Sub-themes)</option>
                    </select>
                  </div>
                )}

                {/* AI Guidance Text Input Area */}
                {enableAiTitle && (
                  <div className="space-y-3 p-3 bg-indigo-950/10 border border-indigo-950/30 rounded-xl animate-fade-in text-left">
                    <div className="space-y-2">
                      <label className="block text-[11px] font-bold text-indigo-300 font-sans flex items-center gap-1.5">
                        💡 ไอเดียแนวทาง / คำสั่งเพิ่มเติมให้ AI (Optional)
                      </label>
                      <textarea
                        value={aiThumbGuidance}
                        onChange={(e) => setAiThumbGuidance(e.target.value)}
                        placeholder="เช่น: เน้นธีมการเงินและตลาดหุ้นที่มีความเกี่ยวข้องกับ AI หรือเทคโนโลยีอนาคต ใช้โทนสีไซเบอร์โกลด์และบรรยากาศตื่นเต้น ดึงดูดสายตา..."
                        rows={3}
                        className="w-full p-2.5 bg-slate-950 border border-slate-850 rounded-lg text-xs text-slate-200 placeholder-slate-500 outline-none resize-none focus:border-indigo-500 custom-scrollbar font-sans"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 pt-1 border-t border-indigo-950/20">
                      <input
                        id="toggle-overwrite-thumb"
                        type="checkbox"
                        checked={overwriteThumbnail}
                        onChange={(e) => setOverwriteThumbnail(e.target.checked)}
                        className="w-3.5 h-3.5 accent-indigo-500 cursor-pointer rounded flex-shrink-0"
                      />
                      <label htmlFor="toggle-overwrite-thumb" className="text-[10px] font-bold text-indigo-200 cursor-pointer select-none leading-tight font-sans">
                        เขียนทับรูปปกที่มีอยู่แล้วในเครื่อง (Overwrite / Re-generate)
                      </label>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400 leading-normal">
                    Prompt Template (ใช้ <code className="text-cyan-400 font-mono">{"{TOPIC}"}</code> แทนหัวข้อพอดแคสต์ และ <code className="text-cyan-400 font-mono">{"{AI_SUBJECT}"}</code> แทนแนวรูปภาพจาก AI)
                  </label>
                  <textarea
                    value={thumbPromptTemplate}
                    onChange={(e) => setThumbPromptTemplate(e.target.value)}
                    rows={6}
                    className="w-full p-3 bg-slate-900/30 border border-slate-850 rounded-xl text-xs text-slate-300 leading-relaxed outline-none resize-none focus:border-cyan-500 custom-scrollbar"
                  />
                </div>
              </div>
            )}
          </div>

          {!enableThumbnail && (
            <div className="text-xs text-slate-500 italic p-4 text-center border border-dashed border-slate-850 rounded-xl bg-slate-900/10">
              การวาดภาพปกอัตโนมัติด้วย AI ปิดอยู่ ระบบจะเรนเดอร์เฉพาะไฟล์วิดีโอเท่านั้น
            </div>
          )}
        </div>
      </div>

      {/* Kie Warning Banner */}
      {enableThumbnail && kieStatus !== 'connected' && (
        <div className="mb-6 p-4 bg-rose-950/20 border border-rose-900/30 rounded-2xl text-rose-400 text-xs flex items-start gap-2.5 shadow-lg">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div className="space-y-1">
            <span className="font-bold text-sm block">⚠️ ระบบปกวิดีโอ AI ถูกระงับชั่วคราว</span>
            <p className="leading-relaxed">
              ท่านเปิดใช้งานระบบวาดรูปปก AI แต่ยังไม่ได้ระบุคีย์บริการ KIE.ai API หรือตรวจสอบแล้วไม่มีคีย์ที่ใช้การได้ กรุณาใส่คีย์ในแท็บ <strong>Settings (การตั้งค่า API)</strong> ด้านบนขวาก่อน หรือสลับไป <strong>ปิดการใช้งานวาดรูปปก</strong> ด้านขวามือเพื่อประมวลผลตัดต่อเฉพาะวิดีโออย่างเดียวครับ.
            </p>
          </div>
        </div>
      )}

      {/* Primary Action Buttons */}
      <div className="flex flex-wrap gap-3 items-center mb-8">
        {!isRendering ? (
          <>
            <button
              onClick={startBatchAllJobs}
              disabled={!sourceFolder || !audioFolder || !outputFolder || audioFiles.length === 0 || (enableThumbnail && kieStatus !== 'connected')}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/10 transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0"
              title={enableThumbnail && kieStatus !== 'connected' ? "กรุณาเชื่อมต่อ API Key ในหน้า Settings เพื่อใช้งานการสร้างภาพปก หรือปิดปุ่มวาดรูปปกขวามือ" : "เริ่มสร้างรูปปกทั้งหมดก่อน แล้วจึงรันงานตัดต่อคลิปทั้งหมดตามหลัง"}
            >
              <Sparkles className="w-4 h-4" />
              ⚡ เริ่มทำงานทั้งหมด (Smart Batch)
            </button>
            <button
              onClick={startRender}
              disabled={!sourceFolder || !audioFolder || !outputFolder || audioFiles.length === 0 || (enableThumbnail && kieStatus !== 'connected')}
              className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-teal-400 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title={enableThumbnail && kieStatus !== 'connected' ? "กรุณาเชื่อมต่อ API Key ในหน้า Settings เพื่อใช้งานการสร้างภาพปก หรือปิดปุ่มวาดรูปปกขวามือ" : "สร้างทีละไฟล์ตามลำดับ"}
            >
              <Film className="w-4 h-4 text-teal-500" />
              🎬 สร้างทีละไฟล์ (วิดีโอ + ปก)
            </button>
            <button
              onClick={() => startRender(true)}
              disabled={!sourceFolder || !audioFolder || !outputFolder || audioFiles.length === 0}
              className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-teal-400 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title="สร้างเฉพาะไฟล์คลิปวิดีโอตามลำดับโดยไม่ต้องสร้างรูปปก"
            >
              <Film className="w-4 h-4 text-teal-500" />
              🎬 สร้างเฉพาะวิดีโอทั้งหมด (ตัดคลิปอย่างเดียว)
            </button>
            <button
              onClick={generateAllThumbnailsOnly}
              disabled={!outputFolder || audioFiles.length === 0 || kieStatus !== 'connected'}
              className="px-5 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed text-teal-400 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
              title={kieStatus !== 'connected' ? "กรุณาเชื่อมต่อ API Key ในหน้า Settings เพื่อใช้งานการสร้างภาพปก" : "สร้างเฉพาะรูปปกพอดแคสต์"}
            >
              <ImageIcon className="w-4 h-4 text-teal-500" />
              🎨 สร้างเฉพาะรูปปกทั้งหมด ({audioFiles.length} ไฟล์)
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-2.5 bg-slate-950 border border-slate-850 rounded-xl font-bold text-xs text-white">
              <span className="text-cyan-400 font-mono">{progress}%</span>
              {renderLog && <span className="text-[10px] opacity-75 ml-2 text-slate-350">{renderLog}</span>}
            </div>

            {!isPaused ? (
              <button
                onClick={handlePause}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                พักการทำ
              </button>
            ) : (
              <button
                onClick={handleResume}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4" />
                ทำต่อ
              </button>
            )}

            <button
              onClick={handleStop}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/10 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4" />
              หยุดยกเลิก
            </button>
          </>
        )}

        {!isRendering && outputClips.some((c) => c.status === 'done') && outputFolder && (
          <button
            onClick={openFolder}
            className="px-5 py-3 bg-slate-900 border border-slate-850 hover:bg-slate-800 text-slate-200 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ml-auto"
          >
            <FolderOpen className="w-4 h-4" />
            เปิดโฟลเดอร์ปลายทาง
          </button>
        )}
      </div>

      {/* Terminal Log Console */}
      {logs.length > 0 && (
        <div className="bg-slate-950 border border-slate-900 rounded-2xl overflow-hidden shadow-2xl mb-8">
          <div className="p-3 border-b border-slate-900 bg-slate-950/60 flex justify-between items-center">
            <span className="font-mono text-[10px] font-bold text-cyan-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              CONSOLE LOGS (ประวัติการประมวลผลอย่างละเอียด)
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowLogs(!showLogs)}
                className="px-2.5 py-0.5 text-[9px] text-slate-350 hover:text-white transition cursor-pointer font-bold bg-slate-900 rounded border border-slate-800 flex items-center gap-1"
              >
                {showLogs ? '🙈 ซ่อนประวัติ Log' : '👁️ แสดงประวัติ Log'}
              </button>
              <button 
                onClick={() => setLogs([])}
                className="px-2 py-0.5 text-[9px] text-slate-500 hover:text-white transition cursor-pointer font-bold bg-slate-900 rounded border border-slate-850"
              >
                ล้างประวัติ
              </button>
            </div>
          </div>
          {showLogs && (
            <div className="p-4 max-h-[160px] overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent pr-2 font-mono text-[11px] bg-slate-950">
              {logs.map((log, idx) => (
                <div key={idx} className="text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {log}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Progress Table */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-900 bg-slate-950/60">
          <h3 className="font-bold text-xs text-white flex items-center gap-2 uppercase font-mono">
            <Film className="w-5 h-5 text-cyan-400" />
            ตารางรายการและความคืบหน้าการเรนเดอร์
          </h3>
          <p className="text-[10px] text-slate-500 font-medium mt-1">
            {outputClips.length > 0 
              ? `พบไฟล์พอดแคสต์เสียงพากย์ทั้งหมด ${outputClips.length} รายการ | ตัดต่อเสร็จสิ้น ${completedCount} จาก ${totalCount || outputClips.length} รายการ`
              : 'กรุณาเลือก "โฟลเดอร์ไฟล์เสียง" ในกล่องตั้งค่าเพื่อแสดงตาราง'}
          </p>
        </div>

        {outputClips.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center border-t border-slate-900">
            <Music className="w-16 h-16 mb-4 animate-pulse text-slate-650" />
            <p className="font-bold text-slate-400 text-sm">ยังไม่มีข้อมูลรายการไฟล์งาน</p>
            <p className="text-xs mt-1.5 max-w-md text-slate-500 leading-normal">
              กรุณาคลิกเลือกโฟลเดอร์ที่เก็บเสียงพากย์ดิบด้านบน เพื่อให้นำรายชื่อไฟล์เข้าสู่ตารางทำงานทันทีครับ
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-950/80 border-b border-slate-900 text-slate-450 font-bold uppercase tracking-wider">
                  <th className="py-4 px-4 text-center w-16">ลำดับ</th>
                  <th className="py-4 px-4">ไฟล์เสียงพอดแคสต์</th>
                  <th className="py-4 px-4 text-center w-52">ปกคลิป (AI Thumbnail)</th>
                  <th className="py-4 px-4 text-center w-48">คลิปตัดต่อ (Video Status)</th>
                  <th className="py-4 px-4 text-center w-40">ข้อมูลวิเคราะห์เพิ่มเติม</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900">
                {outputClips.map((clip, idx) => {
                  const isWorking = clip.status === 'rendering' || clip.status === 'analyzing';
                  const isDone = clip.status === 'done' && clip.thumbStatus === 'done';
                  const rowBg = isWorking
                    ? 'bg-cyan-950/10'
                    : isDone
                    ? 'bg-emerald-950/10'
                    : 'bg-transparent';

                  return (
                    <tr 
                      key={idx} 
                      className={`hover:bg-slate-900/40 transition-colors text-slate-200 ${rowBg}`}
                    >
                      {/* Index */}
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                        {idx + 1}
                      </td>

                      {/* Audio Name */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <div className="flex items-center gap-2.5">
                          <Music className={`w-4 h-4 flex-shrink-0 text-cyan-400 ${clip.status === 'rendering' ? 'animate-bounce' : ''}`} />
                          <span className="font-semibold text-slate-300 break-all">
                            {clip.name}
                          </span>
                        </div>
                      </td>

                      {/* Thumbnail Status & Row Actions */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          {clip.thumbStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                              รอคิววาดปก
                            </span>
                          )}
                          {clip.thumbStatus === 'generating' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-950/40 text-blue-400 border border-blue-500/20 animate-pulse">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              AI วาดอยู่...
                            </span>
                          )}
                          {clip.thumbStatus === 'done' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              มีรูปปกแล้ว
                            </span>
                          )}
                          {clip.thumbStatus === 'skipped' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-slate-550 border border-slate-900">
                              ข้ามปก
                            </span>
                          )}
                          {clip.thumbStatus === 'error' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-500/20">
                              <AlertCircle className="w-3 h-3 text-rose-400" />
                              ปกผิดพลาด
                            </span>
                          )}

                           {/* Row Actions */}
                          {(clip.thumbStatus === 'pending' || clip.thumbStatus === 'skipped' || clip.thumbStatus === 'error' || clip.thumbStatus === 'done') && (
                            <button
                              onClick={() => handleGenerateSingleThumbnail(idx)}
                              disabled={isRendering || kieStatus !== 'connected'}
                              className="p-1.5 rounded bg-teal-950/40 hover:bg-teal-900/60 disabled:opacity-30 disabled:cursor-not-allowed text-teal-400 border border-teal-500/20 transition-all cursor-pointer hover:scale-105"
                              title={kieStatus !== 'connected' ? "กรุณาเชื่อมต่อ API Key ในหน้า Settings เพื่อวาดรูปปก" : (clip.thumbStatus === 'done' ? "สั่ง Kie AI วาดรูปปกใหม่อีกครั้ง" : "สั่ง Kie AI วาดรูปปกสำหรับไฟล์เสียงนี้ทันที")}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Video Render Status */}
                      <td className="py-3 px-4 text-center font-mono">
                        {clip.status === 'pending' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-slate-400 border border-slate-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                            รอคิวเรนเดอร์
                          </span>
                        )}
                        {clip.status === 'analyzing' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-950/40 text-purple-400 border border-purple-500/20 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            กำลังวิเคราะห์...
                          </span>
                        )}
                        {clip.status === 'rendering' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/40 text-amber-400 border border-amber-500/20 animate-pulse">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            เรนเดอร์ภาพ...
                          </span>
                        )}
                        {clip.status === 'paused' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-900/20 text-amber-400 border border-amber-500/10">
                            ⏸️ พักงาน
                          </span>
                        )}
                        {clip.status === 'done' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            เสร็จสิ้น
                          </span>
                        )}
                        {clip.status === 'error' && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-500/20">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            เรนเดอร์ล้มเหลว
                          </span>
                        )}
                      </td>

                      {/* Additional Details */}
                      <td className="py-3 px-4 text-center text-[10px] font-mono text-slate-400">
                        {clip.status === 'done' ? (
                          <div className="flex flex-col items-center">
                            {clip.duration ? (
                              <span>
                                {clip.duration.toFixed(1)}s ({clip.clipsUsed ?? 0} B-Roll)
                              </span>
                            ) : (
                              <span>สำเร็จ (ข้ามซ้ำ)</span>
                            )}
                          </div>
                        ) : clip.errorMessage ? (
                          <span className="text-rose-400 max-w-[150px] truncate block" title={clip.errorMessage}>
                            {clip.errorMessage}
                          </span>
                        ) : clip.thumbErrorMessage ? (
                          <span className="text-rose-400 max-w-[150px] truncate block" title={clip.thumbErrorMessage}>
                            {clip.thumbErrorMessage}
                          </span>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
