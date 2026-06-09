import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshCw,
  CheckCircle,
  Settings,
  AlertCircle,
  FolderOpen,
  Music,
  Square,
  User,
} from 'lucide-react';

interface AvatarRenderItem {
  name: string;
  status: 'pending' | 'rendering' | 'done' | 'error';
  headlineStatus: 'idle' | 'transcribing' | 'done' | 'error';
  subtitleStatus: 'idle' | 'transcribing' | 'done' | 'error';
  headlines?: string[];
  selectedHeadline?: string;
  subtitles?: any[];
  outputPath?: string;
  errorMessage?: string;
  progressText?: string;
}

const getActiveOpenRouterKey = () => localStorage.getItem('openrouter_key')?.trim() || '';

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

const AVATAR_VERTICAL_KEYS = {
  avatarFolder: 'avatar_vertical_avatar_folder',
  footageFolder: 'avatar_vertical_footage_folder',
  outputFolder: 'avatar_vertical_output_folder',
  bgmFile: 'avatar_vertical_bgm_file',
  bgmVolume: 'avatar_vertical_bgm_volume',
  titleTexts: 'avatar_vertical_title_texts',
  subtitleEnabled: 'avatar_vertical_subtitle_enabled',
  subtitleStyle: 'avatar_vertical_subtitle_style',
  subtitleLanguage: 'avatar_vertical_subtitle_language',
  subtitleModel: 'avatar_vertical_subtitle_model',
  subtitleAiPolish: 'avatar_vertical_subtitle_ai_polish',
  subtitleDensity: 'avatar_vertical_subtitle_density',
  subtitlePosition: 'avatar_vertical_subtitle_position',
  isVerticalAvatar: 'avatar_vertical_is_vertical_avatar',
  useGreenScreenKeying: 'avatar_vertical_use_green_screen_keying',
  headlineAiEnabled: 'avatar_vertical_headline_ai_enabled',
};

const SUBTITLE_STYLES = [
  { id: 'bold-yellow', label: 'เหลืองหนา', previewStyle: { color: '#ffe45c', backgroundColor: 'transparent', textShadow: '0 2px 0 #000, 0 0 8px #000' } },
  { id: 'clean-white', label: 'ขาวขอบดำ', previewStyle: { color: '#ffffff', backgroundColor: 'transparent', textShadow: '0 2px 0 #000, 0 0 8px #000' } },
  { id: 'paper-box', label: 'กล่องกระดาษ', previewStyle: { color: '#111827', backgroundColor: '#f3ddb4', textShadow: 'none' } },
  { id: 'cinema-box', label: 'กล่องดำ', previewStyle: { color: '#ffffff', backgroundColor: 'rgba(0,0,0,0.72)', textShadow: 'none' } },
  { id: 'neon-blue', label: 'นีออนฟ้า', previewStyle: { color: '#7dd3fc', backgroundColor: 'transparent', textShadow: '0 0 10px #0284c7, 0 2px 0 #000' } },
];

const WHISPER_MODELS = [
  { id: 'large-v3', label: 'large-v3 · แม่นสุด' },
  { id: 'large-v3-turbo', label: 'large-v3 turbo · เร็วและดี' },
  { id: 'medium', label: 'medium · สมดุล' },
  { id: 'small', label: 'small · เร็ว' },
];

const SUBTITLE_DENSITIES = [
  { id: 'short', label: 'สั้น', note: '3-5 คำต่อช่วง' },
  { id: 'balanced', label: 'พอดี', note: '5-7 คำต่อช่วง' },
  { id: 'full', label: 'เต็ม', note: 'ตามจังหวะ Whisper' },
];

const SUBTITLE_POSITIONS = [
  { id: 'avatar-low', label: 'ล่าง Avatar', defaultY: 1750 },
  { id: 'avatar-mid', label: 'กลาง Avatar', defaultY: 1490 },
  { id: 'split-line', label: 'เส้นแบ่งภาพ', defaultY: 1090 },
  { id: 'top-low', label: 'ล่าง Footage', defaultY: 995 },
  { id: 'bottom-safe', label: 'ล่างสุด', defaultY: 1848 },
  { id: 'custom', label: 'ปรับเองอิสระ', defaultY: 1750 },
];

const SUBTITLE_STYLE_DEFAULT_SIZES: Record<string, number> = {
  'bold-yellow': 58,
  'clean-white': 56,
  'paper-box': 50,
  'cinema-box': 52,
  'neon-blue': 56,
};

function autoTitleFromFileName(fileName: string) {
  const base = fileName
    .replace(/\.[^.]+$/, '')
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim() || 'Avatar Clip';
  const words = base.split(' ').filter(Boolean);
  const lines: string[] = [];
  let current = '';
  const maxChars = 24;
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current && lines.length < 1) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2).join('\n');
}

function readSavedTitleTexts(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(AVATAR_VERTICAL_KEYS.titleTexts) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function pathBasename(filePath: string) {
  if (!filePath) return '';
  const parts = filePath.split(/[/\\]/);
  return parts[parts.length - 1];
}

export function AvatarVerticalClipPortal() {
  const [avatarFolder, setAvatarFolder] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.avatarFolder) || '');
  const [footageFolder, setFootageFolder] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.footageFolder) || '');
  const [outputFolder, setOutputFolder] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.outputFolder) || '');
  const [bgmFile, setBgmFile] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.bgmFile) || '');
  const [bgmVolume, setBgmVolume] = useState(() => Number(localStorage.getItem(AVATAR_VERTICAL_KEYS.bgmVolume) || 8));
  const [subtitleEnabled, setSubtitleEnabled] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitleEnabled) !== 'false');
  const [subtitleStyle, setSubtitleStyle] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitleStyle) || 'bold-yellow');
  const [subtitleLanguage, setSubtitleLanguage] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitleLanguage) || 'en');
  const [subtitleModel, setSubtitleModel] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitleModel) || 'large-v3');
  const [subtitleAiPolish, setSubtitleAiPolish] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitleAiPolish) !== 'false');
  const [subtitleDensity, setSubtitleDensity] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitleDensity) || 'short');
  const [subtitlePosition, setSubtitlePosition] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.subtitlePosition) || 'avatar-low');
  const [subtitleFontSize, setSubtitleFontSize] = useState(() => {
    const saved = localStorage.getItem('avatar_vertical_subtitle_font_size');
    return saved !== null ? Number(saved) : 82;
  });
  const [subtitleYPosition, setSubtitleYPosition] = useState(() => Number(localStorage.getItem('avatar_vertical_subtitle_y_position') || 1750));
  
  // New Layout & AI Headline settings state
  const [isVerticalAvatar, setIsVerticalAvatar] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.isVerticalAvatar) === 'true');
  const [useGreenScreenKeying, setUseGreenScreenKeying] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.useGreenScreenKeying) === 'true');
  const [headlineAiEnabled, setHeadlineAiEnabled] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.headlineAiEnabled) === 'true');

  // Interactive AI Headline Modal state
  const [isHeadlineModalOpen, setIsHeadlineModalOpen] = useState(false);
  const [modalAvatarFile, setModalAvatarFile] = useState('');
  const [modalTranscript, setModalTranscript] = useState('');
  const [modalHeadlines, setModalHeadlines] = useState<string[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalProgressText, setModalProgressText] = useState('');

  // Customizable Hook Headline Banner states
  const [headlineStyle, setHeadlineStyle] = useState(() => localStorage.getItem('avatar_vertical_headline_style') || 'classic-gold');
  const [headlinePadding, setHeadlinePadding] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_padding') || 32));
  const [headlineOpacity, setHeadlineOpacity] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_opacity') || 96));
  const [headlineFontSize, setHeadlineFontSize] = useState(() => {
    const saved = localStorage.getItem('avatar_vertical_headline_font_size');
    return saved !== null ? Number(saved) : 82;
  });
  const [headlineYPosition, setHeadlineYPosition] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_y_position') || 220));

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [avatarFiles, setAvatarFiles] = useState<string[]>([]);
  const [titleTexts, setTitleTexts] = useState<Record<string, string>>(readSavedTitleTexts);
  const [items, setItems] = useState<AvatarRenderItem[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.avatarFolder, avatarFolder); }, [avatarFolder]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.footageFolder, footageFolder); }, [footageFolder]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.outputFolder, outputFolder); }, [outputFolder]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.bgmFile, bgmFile); }, [bgmFile]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.bgmVolume, String(bgmVolume)); }, [bgmVolume]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.titleTexts, JSON.stringify(titleTexts)); }, [titleTexts]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitleEnabled, String(subtitleEnabled)); }, [subtitleEnabled]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitleStyle, subtitleStyle); }, [subtitleStyle]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitleLanguage, subtitleLanguage); }, [subtitleLanguage]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitleModel, subtitleModel); }, [subtitleModel]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitleAiPolish, String(subtitleAiPolish)); }, [subtitleAiPolish]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitleDensity, subtitleDensity); }, [subtitleDensity]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.subtitlePosition, subtitlePosition); }, [subtitlePosition]);
  useEffect(() => { localStorage.setItem('avatar_vertical_subtitle_font_size', String(subtitleFontSize)); }, [subtitleFontSize]);
  useEffect(() => { localStorage.setItem('avatar_vertical_subtitle_y_position', String(subtitleYPosition)); }, [subtitleYPosition]);
  
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.isVerticalAvatar, String(isVerticalAvatar)); }, [isVerticalAvatar]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.useGreenScreenKeying, String(useGreenScreenKeying)); }, [useGreenScreenKeying]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.headlineAiEnabled, String(headlineAiEnabled)); }, [headlineAiEnabled]);

  useEffect(() => { localStorage.setItem('avatar_vertical_headline_style', headlineStyle); }, [headlineStyle]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_padding', String(headlinePadding)); }, [headlinePadding]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_opacity', String(headlineOpacity)); }, [headlineOpacity]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_font_size', String(headlineFontSize)); }, [headlineFontSize]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_y_position', String(headlineYPosition)); }, [headlineYPosition]);

  useEffect(() => {
    if (avatarFolder) void refreshAvatarFiles(avatarFolder);
  }, [avatarFolder, outputFolder]);

  const addLog = (text: string) => {
    const stamp = new Date().toLocaleTimeString('th-TH', { hour12: false });
    setLogs(prev => [...prev.slice(-240), `[${stamp}] ${text}`]);
  };

  const pickFolder = async (prompt: string, setter: (value: string) => void, afterPick?: (value: string) => void) => {
    const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (data.success && data.dir) {
      setter(data.dir);
      afterPick?.(data.dir);
    }
  };

  const pickBgmFile = async () => {
    const res = await fetch(`${BACKEND_BASE}/api/pick-file`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'เลือกไฟล์เสียงพื้นหลัง (.mp3 .wav .m4a)' }),
    });
    const data = await res.json();
    if (data.success && data.file) setBgmFile(data.file);
  };

  const readCachedHeadlines = (): Record<string, string[]> => {
    try { return JSON.parse(localStorage.getItem('avatar_vertical_cached_headlines') || '{}'); }
    catch { return {}; }
  };

  const readCachedSubtitles = (): Record<string, any[]> => {
    try { return JSON.parse(localStorage.getItem('avatar_vertical_cached_subtitles') || '{}'); }
    catch { return {}; }
  };

  const refreshAvatarFiles = async (folder = avatarFolder) => {
    if (!folder) return;
    try {
      const res = await fetch(`${BACKEND_BASE}/api/list-folder-videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const data = await res.json();
      const files = Array.isArray(data.files) ? data.files : [];
      setAvatarFiles(files);

      // ดึงรายชื่อไฟล์ในโฟลเดอร์ปลายทาง (Output Folder) เพื่อตรวจสอบไฟล์ที่เรนเดอร์เสร็จแล้ว
      let outputFiles: string[] = [];
      if (outputFolder) {
        try {
          const outRes = await fetch(`${BACKEND_BASE}/api/list-folder-videos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder: outputFolder }),
          });
          if (outRes.ok) {
            const outData = await outRes.json();
            outputFiles = Array.isArray(outData.files) ? outData.files : [];
          }
        } catch (err) {
          console.error('Failed to scan output folder:', err);
        }
      }

      const cachedHeadlines = readCachedHeadlines();
      const cachedSubtitles = readCachedSubtitles();
      const savedTitleTexts = readSavedTitleTexts();

      const cleanFilePart = (value: string) => {
        return String(value || 'avatar')
          .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
          .replace(/\s+/g, '_')
          .replace(/^_+|_+$/g, '')
          .slice(0, 120) || 'avatar';
      };

      setTitleTexts(prev => {
        const next = { ...prev };
        files.forEach((name: string) => {
          if (!next[name]) {
            const fileHeadlines = cachedHeadlines[name] || [];
            next[name] = fileHeadlines[0] || autoTitleFromFileName(name);
          }
        });
        return next;
      });

      setItems(files.map((name: string) => {
        const fileHeadlines = cachedHeadlines[name] || [];
        const fileSubtitles = cachedSubtitles[name] || [];
        const hasHeadlines = fileHeadlines.length > 0;
        const hasSubtitles = fileSubtitles.length > 0;
        const selectedHeadline = savedTitleTexts[name] || fileHeadlines[0] || autoTitleFromFileName(name);

        // คำนวณชื่อไฟล์ผลลัพธ์ที่เป็นไปได้เพื่อจับคู่
        let safeHeadlineName = '';
        if (selectedHeadline) {
          safeHeadlineName = selectedHeadline
            .replace(/[\r\n]+/g, ' ')
            .replace(/[\\/:*?"<>|#%&{}$@=!`']/g, '')
            .replace(/\s+/g, '_')
            .trim()
            .substring(0, 100);
        }
        const baseName = name.replace(/\.[^/.]+$/, "");
        const safeBase = cleanFilePart(baseName);
        const possibleOut1 = safeHeadlineName ? `${safeHeadlineName}_output.mp4`.toLowerCase() : '';
        const possibleOut2 = `${safeBase}_output.mp4`.toLowerCase();

        // ค้นหาไฟล์ที่จับคู่ได้ในโฟลเดอร์ปลายทาง
        const matchedFileName = outputFiles.find(f => {
          const lf = f.toLowerCase();
          return (possibleOut1 && lf === possibleOut1) || lf === possibleOut2;
        });

        const isDone = !!matchedFileName;
        const outPath = matchedFileName ? `${outputFolder}/${matchedFileName}` : undefined;

        return {
          name,
          status: isDone ? ('done' as const) : ('pending' as const),
          headlineStatus: hasHeadlines ? 'done' : 'idle',
          subtitleStatus: hasSubtitles ? 'done' : 'idle',
          headlines: fileHeadlines,
          selectedHeadline,
          subtitles: fileSubtitles,
          outputPath: outPath
        };
      }));

      setSelectedFiles(files);
      addLog(`พบคลิป Avatar ${files.length} ไฟล์ (สแกนโฟลเดอร์ Output เรียบร้อยแล้ว)`);
    } catch (e: any) {
      addLog(`อ่านโฟลเดอร์ Avatar ไม่สำเร็จ: ${e.message || e}`);
    }
  };

  const saveCachedHeadlines = (fileName: string, headlines: string[]) => {
    try {
      const cached = readCachedHeadlines();
      cached[fileName] = headlines;
      localStorage.setItem('avatar_vertical_cached_headlines', JSON.stringify(cached));
    } catch (e) {
      console.error('Failed to save headlines cache:', e);
    }
  };

  const saveCachedSubtitles = (fileName: string, subtitles: any[]) => {
    try {
      const cached = readCachedSubtitles();
      cached[fileName] = subtitles;
      localStorage.setItem('avatar_vertical_cached_subtitles', JSON.stringify(cached));
    } catch (e) {
      console.error('Failed to save subtitles cache:', e);
    }
  };

  const generateHeadlineAndSubForRow = async (fileName: string) => {
    const openRouterKey = getActiveOpenRouterKey();
    if (!openRouterKey) {
      const msg = 'กรุณากรอก OpenRouter Key ในหน้าการตั้งค่าก่อนใช้งานครับ';
      addLog(`⚠️ [${fileName}] ${msg}`);
      alert('กรุณากรอก OpenRouter Key ในการตั้งค่าก่อนใช้งานครับ');
      return;
    }

    setItems(prev => prev.map(item => item.name === fileName ? {
      ...item,
      headlineStatus: 'transcribing',
      subtitleStatus: 'transcribing',
      progressText: '🎬 [1/3] กำลังเตรียมการ...',
      errorMessage: undefined
    } : item));
    
    addLog(`🔄 [${fileName}] เริ่มสกัดเสียงและวิเคราะห์พาดหัว AI ในเบื้องหลัง...`);

    try {
      const res = await fetch(`${BACKEND_BASE}/api/generate-avatar-headline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarFolder,
          avatarFile: fileName,
          openRouterKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('ไม่สนับสนุนการอ่านแบบ Stream');

      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';
      let finalData: any = null;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';
          
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              
              if (parsed.log) {
                addLog(`[${fileName}] ${parsed.log}`);
              }
              
              if (parsed.status) {
                let statusText = '';
                if (parsed.status === 'extracting') {
                  statusText = '🎬 [1/3] กำลังสกัดเสียง...';
                } else if (parsed.status === 'transcribing') {
                  statusText = '🎙️ [2/3] กำลังถอดเสียง...';
                  if (parsed.log) {
                    const lowerLog = parsed.log.toLowerCase();
                    if (lowerLog.includes('loading model')) {
                      statusText = '🎙️ [2/3] 📦 โหลดโมเดล AI... (ครั้งแรกดึงจาก iCloud อาจดีเลย์ 1-2 นาที)';
                    } else if (lowerLog.includes('loaded mtl backend') || lowerLog.includes('ggml_metal_device_init')) {
                      statusText = '🎙️ [2/3] ⚡ เปิดระบบการ์ดจอ Metal GPU...';
                    } else if (lowerLog.includes('load_backend')) {
                      statusText = '🎙️ [2/3] ⚙️ ตั้งค่าคอร์เร่งความเร็ว GPU...';
                    } else if (lowerLog.includes('init_with_params') || lowerLog.includes('backends =')) {
                      statusText = '🎙️ [2/3] 🎙️ เริ่มต้นถอดรหัสและถอดเสียง...';
                    } else {
                      const pctMatch = parsed.log.match(/progress\s*=\s*(\d+)%/i) || parsed.log.match(/(\d+)%/);
                      if (pctMatch) {
                        statusText = `🎙️ [2/3] กำลังถอดเสียง... ${pctMatch[1]}%`;
                      } else {
                        const cleanLog = parsed.log.replace(/^whisper(\.cpp|x| cli)?\s*:\s*/i, '').trim();
                        if (cleanLog && cleanLog.length < 50 && !cleanLog.includes('พบระบบถอดเสียง') && !cleanLog.includes('ถอดเสียงสำเร็จ')) {
                          statusText = `🎙️ [2/3] ${cleanLog}`;
                        }
                      }
                    }
                  }
                } else if (parsed.status === 'generating_headline') {
                  statusText = '💡 [3/3] กำลังคิดพาดหัว AI...';
                } else if (parsed.status === 'done') {
                  statusText = '✅ เสร็จสิ้น!';
                }
                
                if (statusText) {
                  setItems(prev => prev.map(item => item.name === fileName ? {
                    ...item,
                    progressText: statusText
                  } : item));
                }
              }

              if (parsed.success) {
                finalData = parsed;
              } else if (parsed.success === false && parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {}
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6));
          if (parsed.log) addLog(`[${fileName}] ${parsed.log}`);
          if (parsed.success) finalData = parsed;
          else if (parsed.success === false && parsed.error) throw new Error(parsed.error);
        } catch (e) {}
      }

      if (finalData && finalData.success) {
        const headlines = finalData.headlines || [];
        const segments = finalData.segments || [];
        
        saveCachedHeadlines(fileName, headlines);
        saveCachedSubtitles(fileName, segments);
        
        const defaultHeadline = headlines[0] || autoTitleFromFileName(fileName);
        
        setTitleTexts(prev => {
          const next = { ...prev, [fileName]: defaultHeadline };
          localStorage.setItem(AVATAR_VERTICAL_KEYS.titleTexts, JSON.stringify(next));
          return next;
        });

        setItems(prev => prev.map(item => item.name === fileName ? {
          ...item,
          headlineStatus: 'done',
          subtitleStatus: 'done',
          headlines: headlines,
          selectedHeadline: defaultHeadline,
          subtitles: segments,
          progressText: undefined
        } : item));

        addLog(`✅ [${fileName}] แกะเสียงสำเร็จ (ซับ ${segments.length} ประโยค) และได้พาดหัว AI ${headlines.length} แบบ`);
      } else {
        throw new Error('ไม่ได้รับผลลัพธ์การประมวลผลสำเร็จจากเซิร์ฟเวอร์');
      }
    } catch (e: any) {
      const msg = e.message || String(e);
      addLog(`❌ [${fileName}] เกิดข้อผิดพลาด: ${msg}`);
      setItems(prev => prev.map(item => item.name === fileName ? {
        ...item,
        headlineStatus: 'error',
        subtitleStatus: 'error',
        errorMessage: msg,
        progressText: undefined
      } : item));
    }
  };

  const bulkGenerateAll = async () => {
    const openRouterKey = getActiveOpenRouterKey();
    if (!openRouterKey) {
      alert('กรุณากรอก OpenRouter Key ในการตั้งค่าก่อนใช้งานครับ');
      return;
    }

    const pendingItems = items.filter(item => selectedFiles.includes(item.name) && (item.headlineStatus !== 'done' || item.subtitleStatus !== 'done'));
    if (pendingItems.length === 0) {
      addLog(`💡 ทุกไฟล์ที่เลือกมีข้อมูลในแคชอยู่แล้ว ไม่ต้องเจนเพิ่มครับ`);
      alert('ทุกไฟล์ที่เลือกมีข้อมูลในแคชอยู่แล้วครับ!');
      return;
    }

    setIsGeneratingAll(true);
    addLog(`🚀 เริ่มประมวลผล AI & สกัดซับทั้งหมดแบบ Sequential สำหรับไฟล์ที่เลือก (จำนวน ${pendingItems.length} ไฟล์)...`);
    
    for (const item of pendingItems) {
      await generateHeadlineAndSubForRow(item.name);
    }
    
    setIsGeneratingAll(false);
    addLog(`✨ เสร็จสิ้นการประมวลผล AI สำหรับคลิปที่เลือกในคิว`);
  };

  const runRenderForItem = async (index: number, controller: AbortController, queue: AvatarRenderItem[]) => {
    const item = queue[index];
    queue[index] = { ...item, status: 'rendering', errorMessage: undefined };
    setItems([...queue]);
    
    const openRouterKey = subtitleAiPolish ? getActiveOpenRouterKey() : '';
    const cachedSubtitles = readCachedSubtitles();
    const fileSubs = cachedSubtitles[item.name];

    addLog(`🎬 [${item.name}] เริ่มเรนเดอร์วิดีโอ (${index + 1}/${queue.length})...`);
    
    try {
      const res = await fetch(`${BACKEND_BASE}/api/render-avatar-vertical-clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarFolder,
          avatarFile: item.name,
          footageFolder,
          outputFolder,
          bgmFile,
          bgmVolume: Math.max(0, Math.min(100, bgmVolume)) / 100,
          titleText: titleTexts[item.name] || autoTitleFromFileName(item.name),
          isVerticalAvatar,
          useGreenScreenKeying,
          headlineAiEnabled,
          subtitle: {
            enabled: subtitleEnabled,
            style: subtitleStyle,
            language: subtitleLanguage,
            model: subtitleModel,
            aiPolish: subtitleAiPolish,
            openRouterKey,
            openRouterModel: 'google/gemini-2.5-flash',
            density: subtitleDensity,
            position: subtitlePosition,
            fontSize: subtitleFontSize,
            yPosition: subtitleYPosition,
            precomputedSubtitles: fileSubs && fileSubs.length > 0 ? fileSubs : undefined
          },
          headlineOptions: {
            style: headlineStyle,
            padding: headlinePadding,
            opacity: headlineOpacity,
            fontSize: headlineFontSize,
            yPosition: headlineYPosition
          },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'ไม่พบ API renderer ในเซิร์ฟเวอร์ กรุณาตรวจสอบให้แน่ใจว่าเชื่อมต่อกับพอร์ตที่ถูกต้อง'
            : `renderer ตอบกลับผิดปกติ (${res.status})`
        );
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream not supported');

      const decoder = new TextDecoder();
      let done = false;
      let result: AvatarRenderItem = { 
         ...item, 
         status: 'error', 
         errorMessage: 'ไม่มีผลลัพธ์จาก renderer' 
      };

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (!value) continue;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.log) {
              addLog(`[${item.name}] ${data.log}`);
            }
            if (data.success) {
              result = { 
                ...item, 
                status: 'done', 
                outputPath: data.filePath 
              };
            }
            if (data.error) {
              result = { 
                ...item, 
                status: 'error', 
                errorMessage: data.error 
              };
            }
          } catch {}
        }
      }
      queue[index] = result;
    } catch (e: any) {
      queue[index] = {
        ...item,
        status: 'error',
        errorMessage: e.name === 'AbortError' ? 'ถูกหยุดโดยผู้ใช้' : e.message || 'Unknown error',
      };
    }

    setItems([...queue]);
    setProgress(Math.round(((index + 1) / queue.length) * 100));
  };

  const startRender = async (forceReRender = false) => {
    if (!avatarFolder) return alert('กรุณาเลือกโฟลเดอร์คลิป Avatar');
    if (!footageFolder) return alert('กรุณาเลือกโฟลเดอร์ footage');
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทาง');
    if (items.length === 0) return alert('ไม่พบคลิป Avatar ในโฟลเดอร์');

    const selectedItems = items.filter(item => selectedFiles.includes(item.name));
    if (selectedItems.length === 0) {
      return alert('กรุณาเลือกไฟล์ที่จะเรนเดอร์ในตารางอย่างน้อย 1 ไฟล์ครับ');
    }

    // ตรวจสอบว่าทุกไฟล์ที่เลือกทำซับไตเติลเสร็จสิ้นแล้วหรือยัง
    const pendingSubs = selectedItems.filter(item => item.subtitleStatus !== 'done');
    if (pendingSubs.length > 0) {
      const pendingNames = pendingSubs.map(item => item.name).join('\n• ');
      return alert(`⚠️ ไม่สามารถเรนเดอร์ได้เนื่องจากมีไฟล์ที่ยังไม่ได้ทำซับไตเติล/พาดหัวให้เสร็จ:\n\n• ${pendingNames}\n\nกรุณากดปุ่ม "💡 เจนซับ & พาดหัว" ด้านบน หรือ "🚀 ทำครบทุกขั้นตอน" เพื่อทำให้เสร็จสิ้นทั้งหมดก่อนเรนเดอร์ครับ`);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    
    const queue = items.map(item => {
      const isSel = selectedFiles.includes(item.name);
      return { 
        ...item, 
        status: isSel
          ? (forceReRender ? ('pending' as const) : (item.status === 'done' ? 'done' : ('pending' as const)))
          : item.status,
        errorMessage: isSel ? undefined : item.errorMessage 
      };
    });
    
    setItems(queue);
    setIsRendering(true);
    setProgress(0);
    setLogs([]);
    
    const countToRender = queue.filter(q => selectedFiles.includes(q.name) && q.status !== 'done').length;
    addLog(`🚀 เริ่มสร้างคลิปแนวตั้งสำหรับไฟล์ที่เลือกทั้งหมด ${countToRender} ไฟล์...`);

    for (let i = 0; i < queue.length; i++) {
      if (controller.signal.aborted) break;
      if (!selectedFiles.includes(queue[i].name)) continue;
      if (queue[i].status === 'done') {
        addLog(`⏭️ [${queue[i].name}] คลิปเรนเดอร์เสร็จแล้ว ข้ามไปคลิปถัดไป`);
        continue;
      }
      await runRenderForItem(i, controller, queue);
    }

    setIsRendering(false);
    abortRef.current = null;
    if (!controller.signal.aborted) {
      addLog('✨ เสร็จสิ้นการเรนเดอร์ทุกคิวที่เลือก');
    }
  };

  const runAutoBuildAll = async () => {
    if (!avatarFolder) return alert('กรุณาเลือกโฟลเดอร์คลิป Avatar');
    if (!footageFolder) return alert('กรุณาเลือกโฟลเดอร์ footage');
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทาง');
    
    const selectedItems = items.filter(item => selectedFiles.includes(item.name));
    if (selectedItems.length === 0) {
      return alert('กรุณาเลือกไฟล์ในคิวอย่างน้อย 1 ไฟล์ครับ');
    }

    const openRouterKey = getActiveOpenRouterKey();
    const needsStt = selectedItems.some(item => item.headlineStatus !== 'done' || item.subtitleStatus !== 'done');
    if (needsStt && !openRouterKey) {
      return alert('พบไฟล์ที่ยังไม่มีข้อมูลพาดหัว/ซับไตเติล กรุณากรอก OpenRouter Key ในการตั้งค่าก่อนครับ');
    }

    setIsGeneratingAll(true);
    addLog(`🚀 [Pipeline] เริ่มขั้นตอนที่ 1/2: สกัดเสียง & วิเคราะห์พาดหัว AI สำหรับไฟล์ที่เลือก (ทั้งหมด: ${selectedItems.length} ไฟล์, ค้างเจน: ${selectedItems.filter(item => item.headlineStatus !== 'done' || item.subtitleStatus !== 'done').length} ไฟล์)...`);

    for (const item of selectedItems) {
      if (item.headlineStatus !== 'done' || item.subtitleStatus !== 'done') {
        await generateHeadlineAndSubForRow(item.name);
      } else {
        addLog(`⏭️ [${item.name}] มีข้อมูลในแคชอยู่แล้ว ข้ามขั้นตอนการแปลงเสียง Whisper`);
      }
    }

    setIsGeneratingAll(false);
    addLog(`✨ [Pipeline] สกัดเสียง & วิเคราะห์พาดหัวสำเร็จทั้งหมดแล้ว`);
    addLog(`🎬 [Pipeline] เริ่มขั้นตอนที่ 2/2: เรนเดอร์วิดีโอ 9:16 สำหรับไฟล์ที่เลือก...`);

    await startRender(false);
  };

  const renderSingleItem = async (fileName: string) => {
    if (!avatarFolder) return alert('กรุณาเลือกโฟลเดอร์คลิป Avatar');
    if (!footageFolder) return alert('กรุณาเลือกโฟลเดอร์ footage');
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทาง');

    const index = items.findIndex(item => item.name === fileName);
    if (index === -1) return;

    const item = items[index];
    if (item.subtitleStatus !== 'done') {
      return alert(`⚠️ ไม่สามารถเรนเดอร์ไฟล์นี้ได้เนื่องจากยังไม่ได้ทำซับไตเติล/พาดหัว\n\nกรุณากดปุ่ม "💡 คิดพาดหัว & แกะซับ" ในแถวของไฟล์ "${fileName}" ให้เสร็จสิ้นก่อนเรนเดอร์ครับ`);
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setIsRendering(true);
    setProgress(0);

    const queue = [...items];
    await runRenderForItem(index, controller, queue);

    setIsRendering(false);
    abortRef.current = null;
  };

  const clearCacheForItem = (fileName: string) => {
    try {
      const cachedH = readCachedHeadlines();
      delete cachedH[fileName];
      localStorage.setItem('avatar_vertical_cached_headlines', JSON.stringify(cachedH));
    } catch {}

    try {
      const cachedS = readCachedSubtitles();
      delete cachedS[fileName];
      localStorage.setItem('avatar_vertical_cached_subtitles', JSON.stringify(cachedS));
    } catch {}

    setTitleTexts(prev => {
      const next = { ...prev };
      delete next[fileName];
      localStorage.setItem(AVATAR_VERTICAL_KEYS.titleTexts, JSON.stringify(next));
      return next;
    });

    setItems(prev => prev.map(item => item.name === fileName ? {
      ...item,
      status: 'pending',
      headlineStatus: 'idle',
      subtitleStatus: 'idle',
      headlines: [],
      selectedHeadline: autoTitleFromFileName(fileName),
      subtitles: [],
      outputPath: undefined,
      errorMessage: undefined
    } : item));

    addLog(`🧹 ล้างแคชและผลลัพธ์ของไฟล์ ${fileName} เรียบร้อยแล้ว`);
  };

  const clearAllCaches = () => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการล้างแคชคำบรรยายและพาดหัว AI ทั้งหมด?')) return;
    localStorage.removeItem('avatar_vertical_cached_headlines');
    localStorage.removeItem('avatar_vertical_cached_subtitles');
    
    setItems(prev => prev.map(item => ({
      ...item,
      status: 'pending',
      headlineStatus: 'idle',
      subtitleStatus: 'idle',
      headlines: [],
      selectedHeadline: autoTitleFromFileName(item.name),
      subtitles: [],
      outputPath: undefined,
      errorMessage: undefined
    })));

    addLog(`🧹 ล้างข้อมูลแคช AI & ซับไตเติลทั้งหมดเรียบร้อยแล้ว`);
  };

  const stopRender = () => {
    abortRef.current?.abort();
    setIsRendering(false);
    addLog('หยุดงานตามคำสั่งผู้ใช้');
  };

  const openOutputFolder = async () => {
    if (!outputFolder) return;
    await fetch(`${BACKEND_BASE}/api/open-folder?type=${encodeURIComponent(outputFolder)}`);
  };

  const handleGenerateHeadlineInteractive = async (fileName: string) => {
    setModalAvatarFile(fileName);
    setModalTranscript('');
    setModalHeadlines([]);
    setModalError('');
    setModalProgressText('');

    const cachedSubtitles = readCachedSubtitles();
    const cachedHeadlines = readCachedHeadlines();

    if (cachedSubtitles[fileName] && cachedHeadlines[fileName]) {
      setModalTranscript(cachedSubtitles[fileName].map((s: any) => s.text).join(' '));
      setModalHeadlines(cachedHeadlines[fileName]);
      setIsHeadlineModalOpen(true);
      return;
    }

    const openRouterKey = getActiveOpenRouterKey();
    if (!openRouterKey) {
      alert('กรุณากรอก OpenRouter Key ในการตั้งค่าก่อนใช้งานครับ');
      return;
    }
    
    setIsModalLoading(true);
    setModalProgressText('🎬 [1/3] กำลังเตรียมการ...');
    setIsHeadlineModalOpen(true);

    // Also update row status to transcribing in background
    setItems(prev => prev.map(item => item.name === fileName ? {
      ...item,
      headlineStatus: 'transcribing',
      subtitleStatus: 'transcribing',
      progressText: '🎬 [1/3] กำลังเตรียมการ...',
      errorMessage: undefined
    } : item));

    try {
      const res = await fetch(`${BACKEND_BASE}/api/generate-avatar-headline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarFolder,
          avatarFile: fileName,
          openRouterKey,
        }),
      });

      if (!res.ok) {
        throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('ไม่สนับสนุนการอ่านแบบ Stream');

      const decoder = new TextDecoder();
      let done = false;
      let buffer = '';
      let finalData: any = null;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const parts = buffer.split('\n');
          buffer = parts.pop() || '';
          
          for (const line of parts) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              
              if (parsed.log) {
                addLog(`[${fileName}] ${parsed.log}`);
              }
              
              if (parsed.status) {
                let statusText = '';
                if (parsed.status === 'extracting') {
                  statusText = '🎬 [1/3] กำลังสกัดเสียง...';
                } else if (parsed.status === 'transcribing') {
                  statusText = '🎙️ [2/3] กำลังถอดเสียง...';
                  if (parsed.log) {
                    const lowerLog = parsed.log.toLowerCase();
                    if (lowerLog.includes('loading model')) {
                      statusText = '🎙️ [2/3] 📦 โหลดโมเดล AI... (ครั้งแรกดึงจาก iCloud อาจดีเลย์ 1-2 นาที)';
                    } else if (lowerLog.includes('loaded mtl backend') || lowerLog.includes('ggml_metal_device_init')) {
                      statusText = '🎙️ [2/3] ⚡ เปิดระบบการ์ดจอ Metal GPU...';
                    } else if (lowerLog.includes('load_backend')) {
                      statusText = '🎙️ [2/3] ⚙️ ตั้งค่าคอร์เร่งความเร็ว GPU...';
                    } else if (lowerLog.includes('init_with_params') || lowerLog.includes('backends =')) {
                      statusText = '🎙️ [2/3] 🎙️ เริ่มต้นถอดรหัสและถอดเสียง...';
                    } else {
                      const pctMatch = parsed.log.match(/progress\s*=\s*(\d+)%/i) || parsed.log.match(/(\d+)%/);
                      if (pctMatch) {
                        statusText = `🎙️ [2/3] กำลังถอดเสียง... ${pctMatch[1]}%`;
                      } else {
                        const cleanLog = parsed.log.replace(/^whisper(\.cpp|x| cli)?\s*:\s*/i, '').trim();
                        if (cleanLog && cleanLog.length < 50 && !cleanLog.includes('พบระบบถอดเสียง') && !cleanLog.includes('ถอดเสียงสำเร็จ')) {
                          statusText = `🎙️ [2/3] ${cleanLog}`;
                        }
                      }
                    }
                  }
                } else if (parsed.status === 'generating_headline') {
                  statusText = '💡 [3/3] กำลังคิดพาดหัว AI...';
                } else if (parsed.status === 'done') {
                  statusText = '✅ เสร็จสิ้น!';
                }
                
                if (statusText) {
                  setModalProgressText(statusText);
                  setItems(prev => prev.map(item => item.name === fileName ? {
                    ...item,
                    progressText: statusText
                  } : item));
                }
              }

              if (parsed.success) {
                finalData = parsed;
              } else if (parsed.success === false && parsed.error) {
                throw new Error(parsed.error);
              }
            } catch (e) {}
          }
        }
      }

      if (buffer.trim().startsWith('data: ')) {
        try {
          const parsed = JSON.parse(buffer.trim().slice(6));
          if (parsed.log) addLog(`[${fileName}] ${parsed.log}`);
          if (parsed.success) finalData = parsed;
          else if (parsed.success === false && parsed.error) throw new Error(parsed.error);
        } catch (e) {}
      }

      if (finalData && finalData.success) {
        setModalTranscript(finalData.transcript);
        setModalHeadlines(finalData.headlines);
        saveCachedHeadlines(fileName, finalData.headlines);
        saveCachedSubtitles(fileName, finalData.segments);
        
        setItems(prev => prev.map(item => item.name === fileName ? {
          ...item,
          headlineStatus: 'done',
          subtitleStatus: 'done',
          headlines: finalData.headlines,
          subtitles: finalData.segments,
          progressText: undefined
        } : item));
      } else {
        throw new Error('ไม่ได้รับผลลัพธ์การประมวลผลสำเร็จจากเซิร์ฟเวอร์');
      }
    } catch (e: any) {
      setModalError(e.message || String(e));
      setItems(prev => prev.map(item => item.name === fileName ? {
        ...item,
        headlineStatus: 'error',
        subtitleStatus: 'error',
        errorMessage: e.message || String(e),
        progressText: undefined
      } : item));
    } finally {
      setIsModalLoading(false);
    }
  };

  const getPreviewBannerStyle = (simulatedFontSize?: number) => {
    const opacityValue = headlineOpacity / 100;
    const fontSizeVal = simulatedFontSize !== undefined ? simulatedFontSize : (headlineFontSize > 0 ? headlineFontSize : 75);

    const styleObj = {
      color: '#111111',
      backgroundColor: `rgba(243, 221, 180, ${opacityValue})`,
      padding: `${(headlinePadding / 1080) * 100}cqw`,
      fontSize: `${(fontSizeVal / 1080) * 100}cqw`,
      border: '0.1cqw solid rgba(17,24,39,0.15)',
      textShadow: 'none',
      borderRadius: '0.8cqw',
    };

    if (headlineStyle === 'minimal-black') {
      return {
        ...styleObj,
        color: '#ffffff',
        backgroundColor: `rgba(0, 0, 0, ${opacityValue})`,
        border: '0.1cqw solid rgba(255,255,255,0.1)',
      };
    }
    if (headlineStyle === 'modern-white') {
      return {
        ...styleObj,
        color: '#111827',
        backgroundColor: `rgba(255, 255, 255, ${opacityValue})`,
        border: '0.1cqw solid rgba(0,0,0,0.1)',
      };
    }
    if (headlineStyle === 'neon-purple') {
      return {
        ...styleObj,
        color: '#ffffff',
        backgroundColor: `rgba(124, 58, 237, ${opacityValue})`,
        border: '0.1cqw solid rgba(168,85,247,0.3)',
      };
    }
    if (headlineStyle === 'attention-red') {
      return {
        ...styleObj,
        color: '#ffffff',
        backgroundColor: `rgba(239, 68, 68, ${opacityValue})`,
        border: '0.1cqw solid rgba(239,68,68,0.3)',
      };
    }
    if (headlineStyle === 'no-box-shadow') {
      return {
        ...styleObj,
        color: '#ffffff',
        backgroundColor: 'transparent',
        padding: '0px',
        border: 'none',
        textShadow: '0 0.2cqw 0 #000, 0 -0.2cqw 0 #000, 0.2cqw 0 #000, -0.2cqw 0 #000, 0.2cqw 0.2cqw 0 #000, -0.2cqw -0.2cqw 0 #000',
        borderRadius: '0px'
      };
    }
    return styleObj;
  };

  const getPreviewSubtitleStyle = () => {
    const defaultSize = SUBTITLE_STYLE_DEFAULT_SIZES[subtitleStyle] || 56;
    const finalSize = subtitleFontSize > 0 ? subtitleFontSize : defaultSize;

    const base = {
      position: 'absolute' as const,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      textAlign: 'center' as const,
      fontSize: `${(finalSize / 1080) * 100}cqw`,
      fontWeight: 'bold' as const,
      lineHeight: '1.2',
      pointerEvents: 'none' as const,
      transition: 'all 0.1s ease',
      zIndex: 20,
    };

    const bottomPercent = ((1920 - subtitleYPosition) / 1920) * 100;
    const positionStyles = { bottom: `${bottomPercent}%` };

    let visualStyles = {};
    if (subtitleStyle === 'bold-yellow') {
      visualStyles = {
        color: '#ffe45c',
        textShadow: '0 0.25cqw 0 #000, 0 -0.25cqw 0 #000, 0.25cqw 0 #000, -0.25cqw 0 #000, 0.25cqw 0.25cqw 0 #000, -0.25cqw -0.25cqw 0 #000',
      };
    } else if (subtitleStyle === 'clean-white') {
      visualStyles = {
        color: '#ffffff',
        textShadow: '0 0.25cqw 0 #000, 0 -0.25cqw 0 #000, 0.25cqw 0 #000, -0.25cqw 0 #000, 0.25cqw 0.25cqw 0 #000, -0.25cqw -0.25cqw 0 #000',
      };
    } else if (subtitleStyle === 'paper-box') {
      visualStyles = {
        color: '#111827',
        backgroundColor: '#f3ddb4',
        padding: '0.4cqw 0.8cqw',
        borderRadius: '0.4cqw',
        boxShadow: '0 0.2cqw 0.4cqw rgba(0,0,0,0.1)',
        width: 'fit-content',
        maxWidth: '90%',
      };
    } else if (subtitleStyle === 'cinema-box') {
      visualStyles = {
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: '0.4cqw 0.8cqw',
        borderRadius: '0.4cqw',
        boxShadow: '0 0.2cqw 0.4cqw rgba(0,0,0,0.2)',
        width: 'fit-content',
        maxWidth: '90%',
      };
    } else if (subtitleStyle === 'neon-blue') {
      visualStyles = {
        color: '#7dd3fc',
        textShadow: '0 0 1cqw #0284c7, 0 0.25cqw 0 #000, 0.25cqw 0 #000',
      };
    }

    return { ...base, ...positionStyles, ...visualStyles };
  };

  return (
    <div className="space-y-6 min-h-[500px]">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 p-6 rounded-3xl border shadow-xl" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User className="w-8 h-8" style={{ color: '#a855f7' }} />
            Avatar Vertical Clip Maker
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            สุ่ม footage ปิดเสียงไว้ด้านบน ใส่ชื่อจากไฟล์ Avatar แล้ววางคลิป Avatar แนวนอนไว้ด้านล่างเป็นวิดีโอ 9:16
          </p>
        </div>
        <div className="rounded-2xl border px-4 py-3 text-xs" style={{ borderColor: 'rgba(168,85,247,0.35)', backgroundColor: 'rgba(168,85,247,0.09)', color: 'var(--text-secondary)' }}>
          Output: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>ชื่อไฟล์ Avatar + _output.mp4</span>
        </div>
      </div>

      <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Settings className="w-5 h-5" style={{ color: '#a855f7' }} />
          ตั้งค่าโฟลเดอร์และเสียง
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <FolderField
            label="โฟลเดอร์คลิป Avatar"
            value={avatarFolder}
            onPick={() => pickFolder('เลือกโฟลเดอร์คลิป Avatar แนวนอน', setAvatarFolder, refreshAvatarFiles)}
          />
          <FolderField
            label="โฟลเดอร์ footage พื้นหลัง"
            value={footageFolder}
            onPick={() => pickFolder('เลือกโฟลเดอร์ footage สำหรับสุ่มต่อด้านบน', setFootageFolder)}
          />
          <FolderField
            label="โฟลเดอร์ Output"
            value={outputFolder}
            onPick={() => pickFolder('เลือกโฟลเดอร์ปลายทางสำหรับคลิป _output', setOutputFolder)}
          />
        </div>

        <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-5">
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              เสียงพื้นหลัง
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={bgmFile}
                placeholder="ไม่ใส่เสียงพื้นหลัง"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none"
                style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              />
              <button onClick={pickBgmFile} className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all border" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                <Music className="w-4 h-4" />
                เลือก
              </button>
              {bgmFile && (
                <button onClick={() => setBgmFile('')} className="px-4 py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
                  ล้าง
                </button>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>
              ความดังเสียงพื้นหลัง: {bgmVolume}%
            </label>
            <input
              type="range"
              min={0}
              max={60}
              value={bgmVolume}
              onChange={event => setBgmVolume(Number(event.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Settings className="w-5 h-5" style={{ color: '#a855f7' }} />
          ตั้งค่ารูปแบบวิดีโอ & AI Hook Headline
        </h2>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <label className="flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer select-none transition-all hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isVerticalAvatar ? '#a855f7' : 'var(--border-color)', backgroundColor: isVerticalAvatar ? 'rgba(168,85,247,0.05)' : 'var(--bg-body)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isVerticalAvatar}
                onChange={event => {
                  setIsVerticalAvatar(event.target.checked);
                  if (!event.target.checked) setUseGreenScreenKeying(false);
                }}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>วิดีโอแนวตั้งแบบซ้อนทับ (Overlay)</span>
            </div>
            <p className="text-xs text-gray-500 pl-8 leading-tight">สเกลวิดีโอ Avatar และ B-Roll วางซ้อนทับเป็นแบบ 9:16 เต็มจอ แทนรูปแบบแบ่งครึ่ง บน-ล่าง</p>
          </label>

          <label className={`flex flex-col gap-2 p-4 rounded-2xl border select-none transition-all ${!isVerticalAvatar ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-black/5 dark:hover:bg-white/5'}`} style={{ borderColor: useGreenScreenKeying ? '#a855f7' : 'var(--border-color)', backgroundColor: useGreenScreenKeying ? 'rgba(168,85,247,0.05)' : 'var(--bg-body)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                disabled={!isVerticalAvatar}
                checked={useGreenScreenKeying}
                onChange={event => setUseGreenScreenKeying(event.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500 disabled:opacity-50"
              />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>เจาะคีย์กรีนสกรีน (Chroma Key)</span>
            </div>
            <p className="text-xs text-gray-500 pl-8 leading-tight">เจาะลบพื้นหลังสีเขียว #00FF00 ออกจากวิดีโอ Avatar เพื่อโชว์ฟุตเทจ B-Roll ด้านหลัง</p>
          </label>

          <label className="flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer select-none transition-all hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: headlineAiEnabled ? '#a855f7' : 'var(--border-color)', backgroundColor: headlineAiEnabled ? 'rgba(168,85,247,0.05)' : 'var(--bg-body)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={headlineAiEnabled}
                onChange={event => setHeadlineAiEnabled(event.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>ใช้ AI เจนพาดหัวอัตโนมัติ (Hook)</span>
            </div>
            <p className="text-xs text-gray-500 pl-8 leading-tight">ส่งสคริปต์ไปให้ LLM วิเคราะห์และคิดหัวข้อไวรัล (Hook) ดึงดูดความสนใจให้อัตโนมัติในตอนเรนเดอร์</p>
          </label>
        </div>
      </div>

      <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Settings className="w-5 h-5" style={{ color: '#a855f7' }} />
          🎨 ปรับแต่งดีไซน์ป้ายพาดหัว Hook AI
        </h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          เลือกสีพื้นหลัง ขนาดป้าย สไลเดอร์ขอบ และตำแหน่งความสูงของป้ายบนวิดีโอได้แบบยืดหยุ่น (ดูตัวอย่างป้ายพาดหัวแบบเรียลไทม์ได้ทางขวามือ)
        </p>
        
        <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>เลือกสีและดีไซน์ป้าย</div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-5">
          {[
            { id: 'classic-gold', label: 'เหลืองทองคลาสสิก', text: '#111111', bg: '#f3ddb4', desc: 'ยอดนิยมสำหรับคลิปสั้น' },
            { id: 'minimal-black', label: 'ดำมินิมอลโมเดิร์น', text: '#ffffff', bg: '#000000', desc: 'เท่ สุขุม ทันสมัย' },
            { id: 'modern-white', label: 'ขาวสะอาดคลีน', text: '#111827', bg: '#ffffff', border: 'rgba(0,0,0,0.1)', desc: 'เรียบง่าย สบายตา' },
            { id: 'neon-purple', label: 'ม่วงนีออนล้ำๆ', text: '#ffffff', bg: '#7c3aed', desc: 'สะดุดตา สายไอที/การตลาด' },
            { id: 'attention-red', label: 'แดงดึงดูดสายตา', text: '#ffffff', bg: '#ef4444', desc: 'เน้นประกาศ ด่วน สำคัญ!' },
            { id: 'no-box-shadow', label: 'ตัวหนังสือขอบดำ (ไม่มีกล่อง)', text: '#ffffff', bg: 'transparent', border: 'rgba(255,255,255,0.3)', desc: 'ฟิลช่องทีวี ขอบหนา' },
          ].map(style => (
            <button
              key={style.id}
              type="button"
              onClick={() => setHeadlineStyle(style.id)}
              className="rounded-xl border p-3 text-left transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[110px]"
              style={{
                borderColor: headlineStyle === style.id ? '#a855f7' : 'var(--border-color)',
                backgroundColor: headlineStyle === style.id ? 'rgba(168,85,247,0.12)' : 'var(--bg-body)',
              }}
            >
              <div className="text-[11px] font-bold" style={{ color: 'var(--text-primary)' }}>{style.label}</div>
              <div
                className="my-2 rounded px-2 py-1.5 flex items-center justify-center text-center text-[10px] font-extrabold shadow-sm overflow-hidden"
                style={{
                  color: style.text,
                  backgroundColor: style.bg,
                  border: style.border ? `1px solid ${style.border}` : 'none',
                  textShadow: style.id === 'no-box-shadow' ? '0 1px 0 #000, 0 -1px 0 #000, 1px 0 #000, -1px 0 #000' : 'none'
                }}
              >
                หัวข้อตัวอย่าง
              </div>
              <div className="text-[9px] leading-tight" style={{ color: 'var(--text-secondary)' }}>{style.desc}</div>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>ขนาดความหนากล่อง (Padding)</span>
              <span className="font-mono text-purple-500 font-bold">{headlinePadding}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={64}
              value={headlinePadding}
              disabled={headlineStyle === 'no-box-shadow'}
              onChange={event => setHeadlinePadding(Number(event.target.value))}
              className="w-full disabled:opacity-50"
            />
            <div className="text-[10px] text-gray-500 mt-1">ขอบหนารอบๆ ตัวหนังสือ ยิ่งปรับจะยิ่งช่วยให้กล่องหนาขึ้น</div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>ความโปร่งใสของกล่อง</span>
              <span className="font-mono text-purple-500 font-bold">{headlineOpacity}%</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              value={headlineOpacity}
              disabled={headlineStyle === 'no-box-shadow'}
              onChange={event => setHeadlineOpacity(Number(event.target.value))}
              className="w-full disabled:opacity-50"
            />
            <div className="text-[10px] text-gray-500 mt-1">ความทึบของสีกล่อง ยิ่งปรับน้อยจะยิ่งมองทะลุฟุตเทจได้ดี</div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>ขนาดตัวอักษรพาดหัว</span>
              <span className="font-mono text-purple-500 font-bold">
                {headlineFontSize === 0 ? 'Auto (คำนวณตามยาว)' : `${headlineFontSize}px`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={120}
              step={headlineFontSize === 0 ? 30 : 2}
              value={headlineFontSize}
              onChange={event => setHeadlineFontSize(Number(event.target.value))}
              className="w-full"
            />
            <div className="text-[10px] text-gray-500 mt-1">ตั้งค่าขนาดอักษรคงที่ (ปรับเป็น 0 หากต้องการให้ AI ขยายตามความยาวหัวข้อ)</div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>ตำแหน่งความสูงป้าย (Y Position)</span>
              <span className="font-mono text-purple-500 font-bold">{headlineYPosition}px</span>
            </div>
            <input
              type="range"
              min={50}
              max={1500}
              step={10}
              value={headlineYPosition}
              onChange={event => setHeadlineYPosition(Number(event.target.value))}
              className="w-full"
            />
            <div className="text-[10px] text-gray-500 mt-1">ความสูงของป้าย (เช่น 100=บนสุด, 220=ขอบบนหน้าผาก, 1400=ล่างสุด)</div>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-5">
          <div>
            <h2 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Subtitle จาก Whisper</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              ถอดเสียงจากคลิป Avatar ด้วย Whisper แล้ว burn-in ลงคลิป พร้อมให้ AI ช่วยเกลาคำถ้ามี OpenRouter key
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={subtitleEnabled}
              onChange={event => setSubtitleEnabled(event.target.checked)}
              className="w-5 h-5 cursor-pointer"
            />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>เปิด Subtitle</span>
          </label>
        </div>

        {subtitleEnabled && (
          <div className="mt-5 grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-5">
            <label>
              <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Whisper model</span>
              <select
                value={subtitleModel}
                onChange={event => setSubtitleModel(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-semibold cursor-pointer"
                style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                {WHISPER_MODELS.map(model => <option key={model.id} value={model.id}>{model.label}</option>)}
              </select>
            </label>
            <label>
              <span className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ภาษาที่พูด</span>
              <select
                value={subtitleLanguage}
                onChange={event => setSubtitleLanguage(event.target.value)}
                className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-semibold cursor-pointer"
                style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              >
                <option value="en">English</option>
                <option value="th">Thai</option>
                <option value="auto">Auto detect</option>
              </select>
            </label>
            <label className="flex items-center gap-3 pt-8 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subtitleAiPolish}
                onChange={event => setSubtitleAiPolish(event.target.checked)}
                className="w-5 h-5 cursor-pointer"
              />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>AI เกลาคำหลัง Whisper</span>
            </label>
          </div>
        )}

        {subtitleEnabled && (
          <div className="mt-5 grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div>
              <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>ความสั้นของซับ</div>
              <div className="grid grid-cols-3 gap-2">
                {SUBTITLE_DENSITIES.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSubtitleDensity(item.id)}
                    className="rounded-xl border px-3 py-3 text-left transition-all hover:scale-[1.01] cursor-pointer"
                    style={{
                      borderColor: subtitleDensity === item.id ? '#a855f7' : 'var(--border-color)',
                      backgroundColor: subtitleDensity === item.id ? 'rgba(168,85,247,0.14)' : 'var(--bg-body)',
                    }}
                  >
                    <div className="font-black text-sm" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                    <div className="text-[10px] mt-1" style={{ color: 'var(--text-secondary)' }}>{item.note}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ตำแหน่งซับในคลิป</div>
                <select
                  value={subtitlePosition}
                  onChange={event => {
                    const val = event.target.value;
                    setSubtitlePosition(val);
                    const found = SUBTITLE_POSITIONS.find(item => item.id === val);
                    if (found && found.id !== 'custom') {
                      setSubtitleYPosition(found.defaultY);
                    }
                  }}
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-semibold cursor-pointer"
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                >
                  {SUBTITLE_POSITIONS.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center text-xs font-semibold mb-1.5">
                  <span style={{ color: 'var(--text-secondary)' }}>ปรับระดับแนวตั้งซับ (แกน Y)</span>
                  <span className="font-mono text-purple-500 font-bold">{subtitleYPosition}px</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={1880}
                  step={10}
                  value={subtitleYPosition}
                  onChange={event => {
                    const val = Number(event.target.value);
                    setSubtitleYPosition(val);
                    const matchedPreset = SUBTITLE_POSITIONS.find(item => item.defaultY === val && item.id !== 'custom');
                    if (matchedPreset) {
                      setSubtitlePosition(matchedPreset.id);
                    } else {
                      setSubtitlePosition('custom');
                    }
                  }}
                  className="w-full cursor-pointer mt-1"
                />
                <div className="text-[9px] text-gray-500 mt-1">ขยับความสูงละเอียด (0 = บนสุด, 1920 = ล่างสุด)</div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center text-sm font-semibold mb-3">
                <span style={{ color: 'var(--text-secondary)' }}>ปรับขนาดตัวอักษรซับ</span>
                <span className="font-mono text-purple-500 font-bold">
                  {subtitleFontSize === 0 ? 'Default (ตามสไตล์)' : `${subtitleFontSize}px`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={220}
                step={subtitleFontSize === 0 ? 50 : 2}
                value={subtitleFontSize}
                onChange={event => setSubtitleFontSize(Number(event.target.value))}
                className="w-full cursor-pointer"
              />
              <div className="text-[10px] text-gray-500 mt-1">ขนาดซับไตเติล (เลือกเป็น 0 เพื่อใช้ขนาดเริ่มต้นของสไตล์นั้นๆ, แนะนำ 70-95px)</div>
            </div>
          </div>
        )}

        {subtitleEnabled && (
          <div className="mt-5">
            <div className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>เลือกสไตล์ซับ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
              {SUBTITLE_STYLES.map(style => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setSubtitleStyle(style.id)}
                  className="rounded-xl border p-3 text-left transition-all hover:scale-[1.01] cursor-pointer"
                  style={{
                    borderColor: subtitleStyle === style.id ? '#a855f7' : 'var(--border-color)',
                    backgroundColor: subtitleStyle === style.id ? 'rgba(168,85,247,0.14)' : 'var(--bg-body)',
                  }}
                >
                  <div className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>{style.label}</div>
                  <div className="min-h-[58px] rounded-lg px-3 py-2 flex items-center justify-center text-center overflow-hidden" style={style.previewStyle}>
                    <span className="font-black text-sm leading-tight">The mind learns<br />to let go.</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => refreshAvatarFiles()}
            disabled={!avatarFolder || isRendering || isGeneratingAll}
            className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 border text-xs cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรชคิวไฟล์
          </button>
          
          <button
            onClick={bulkGenerateAll}
            disabled={!avatarFolder || isRendering || isGeneratingAll || items.length === 0 || selectedFiles.length === 0}
            className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
            style={{ backgroundColor: '#a855f7', color: 'white' }}
          >
            💡 เจนซับ & พาดหัว ({selectedFiles.length} ไฟล์)
          </button>

          <button
            onClick={runAutoBuildAll}
            disabled={!avatarFolder || !footageFolder || !outputFolder || items.length === 0 || isRendering || isGeneratingAll || selectedFiles.length === 0}
            className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
            style={{ backgroundColor: '#10b981', color: 'white' }}
          >
            🚀 ทำครบทุกขั้นตอน ({selectedFiles.length} ไฟล์)
          </button>

          {!isRendering ? (
            <>
              <button
                onClick={() => startRender(false)}
                disabled={!avatarFolder || !footageFolder || !outputFolder || items.length === 0 || isGeneratingAll || selectedFiles.length === 0}
                className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
                style={{ backgroundColor: '#6366f1', color: 'white' }}
              >
                🎬 เรนเดอร์ / ทำงานต่อ ({selectedFiles.length} ไฟล์, ใช้ Cache)
              </button>
              <button
                onClick={() => startRender(true)}
                disabled={!avatarFolder || !footageFolder || !outputFolder || items.length === 0 || isGeneratingAll || selectedFiles.length === 0}
                className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
              >
                🎬 เรนเดอร์ใหม่ (เขียนทับ)
              </button>
            </>
          ) : (
            <button onClick={stopRender} className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-xs shadow-md bg-red-500 text-white cursor-pointer">
              <Square className="w-4 h-4 animate-pulse" />
              หยุดทำงาน
            </button>
          )}

          <button
            onClick={clearAllCaches}
            disabled={isRendering || isGeneratingAll}
            className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 border text-xs text-red-500 cursor-pointer"
            style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}
          >
            🧹 ล้างแคชทั้งหมด
          </button>
        </div>

        <div className="flex gap-2">
          {outputFolder && (
            <button onClick={openOutputFolder} className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border text-xs cursor-pointer" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
              <FolderOpen className="w-4 h-4" />
              เปิด Output
            </button>
          )}
          {(isRendering || isGeneratingAll) && (
            <div className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(168,85,247,0.1)', color: '#a855f7' }}>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              {isRendering ? `กำลังเรนเดอร์ ${progress}%` : 'กำลังเจนพาดหัวเบื้องหลัง...'}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        <div className="p-6 rounded-3xl border shadow-sm flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              ตารางคิวและสถานะประมวลผล ({items.length} ไฟล์)
            </h2>
            <div className="text-[10px] text-gray-500 dark:text-gray-400">
              * ข้อมูลที่สกัดคำแปล/พาดหัวแล้วจะถูกบันทึกในระบบแคชโดยอัตโนมัติ
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-xs">
              <thead style={{ backgroundColor: 'var(--bg-body)' }}>
                <tr>
                  <th scope="col" className="px-3 py-3 font-semibold text-center w-12 text-gray-500">
                    <input
                      type="checkbox"
                      className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                      checked={selectedFiles.length === items.length && items.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFiles(items.map(item => item.name));
                        } else {
                          setSelectedFiles([]);
                        }
                      }}
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-500">ไฟล์วิดีโอต้นฉบับ</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-500">ขั้นตอนที่ 1: พาดหัว Hook AI</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-500">ขั้นตอนที่ 2: ซับคำแปล</th>
                  <th scope="col" className="px-4 py-3 font-semibold text-gray-500">ขั้นตอนที่ 3: สถานะเรนเดอร์</th>
                  <th scope="col" className="px-3 py-3 font-semibold text-center w-36 text-gray-500">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800" style={{ backgroundColor: 'var(--bg-card)' }}>
                {items.map((item, index) => {
                  const hasCache = item.subtitles && item.subtitles.length > 0;
                  const currentTitle = titleTexts[item.name] || autoTitleFromFileName(item.name);
                  
                  return (
                    <tr key={`${item.name}-${index}`} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                      <td className="px-3 py-4 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <input
                            type="checkbox"
                            className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer w-4 h-4"
                            checked={selectedFiles.includes(item.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFiles(prev => [...prev, item.name]);
                              } else {
                                setSelectedFiles(prev => prev.filter(name => name !== item.name));
                              }
                            }}
                          />
                          <span className="text-[10px] font-mono text-gray-400">{index + 1}</span>
                        </div>
                      </td>

                      <td className="px-4 py-4 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 shrink-0" style={{ color: '#a855f7' }} />
                          <span className="font-bold truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }} title={item.name}>
                            {item.name}
                          </span>
                        </div>
                        {item.outputPath && (
                          <div className="text-[10px] text-green-500 font-semibold truncate max-w-[180px] mt-1" title={item.outputPath}>
                            Output: {pathBasename(item.outputPath)}
                          </div>
                        )}
                        {hasCache && (
                          <button
                            onClick={() => handleGenerateHeadlineInteractive(item.name)}
                            className="mt-1 text-[10px] font-bold text-purple-500 hover:text-purple-600 flex items-center gap-1 transition-all cursor-pointer"
                          >
                            🔍 ดูสคริปต์คำแปล ({item.subtitles?.length || 0} ประโยค)
                          </button>
                        )}
                      </td>

                      <td className="px-4 py-4 min-w-[240px]">
                        {(item.headlineStatus === 'idle' || item.subtitleStatus === 'idle') && (
                          <button
                            onClick={() => generateHeadlineAndSubForRow(item.name)}
                            disabled={isRendering || isGeneratingAll}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold flex items-center gap-1 transition-all hover:bg-purple-500/5 disabled:opacity-50 cursor-pointer"
                            style={{ borderColor: 'var(--border-color)', color: '#a855f7' }}
                          >
                            💡 คิดพาดหัว & แกะซับ
                          </button>
                        )}

                        {item.headlineStatus === 'transcribing' && (
                          <div className="flex flex-col gap-1 text-purple-500">
                            <div className="flex items-center gap-2 font-bold text-[11px]">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                              </span>
                              <span>กำลังประมวลผล AI...</span>
                            </div>
                            {item.progressText && (
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-4 animate-pulse leading-snug">
                                {item.progressText}
                              </div>
                            )}
                          </div>
                        )}

                        {item.headlineStatus === 'done' && (
                          <div className="flex flex-col gap-1.5 w-full">
                            <select
                              value={titleTexts[item.name] || (item.headlines && item.headlines[0]) || ''}
                              onChange={e => {
                                const val = e.target.value;
                                setTitleTexts(prev => ({ ...prev, [item.name]: val }));
                                addLog(`[${item.name}] เลือกพาดหัวใหม่: "${val}"`);
                              }}
                              className="w-full px-2 py-1 rounded-md text-[11px] border outline-none font-semibold cursor-pointer"
                              style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            >
                              {(item.headlines || []).map((h, i) => (
                                <option key={i} value={h}>🔥 Hook {i + 1}: {h.substring(0, 35)}...</option>
                              ))}
                              <option value={autoTitleFromFileName(item.name)}>ดึงจากชื่อไฟล์: {autoTitleFromFileName(item.name).substring(0, 35)}...</option>
                            </select>
                            
                            <textarea
                              value={currentTitle}
                              onChange={e => {
                                const val = e.target.value;
                                setTitleTexts(prev => ({ ...prev, [item.name]: val }));
                              }}
                              rows={2}
                              placeholder="พาดหัววิดีโอ (แก้ไขได้อิสระ)"
                              className="w-full px-2 py-1 rounded-md text-[11px] border outline-none resize-none font-medium leading-tight"
                              style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                            />
                          </div>
                        )}

                        {(item.headlineStatus === 'error' || item.subtitleStatus === 'error') && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-red-500 font-semibold flex items-center gap-1">❌ ผิดพลาด</span>
                            <button
                              onClick={() => generateHeadlineAndSubForRow(item.name)}
                              className="text-[10px] underline text-purple-500 font-bold cursor-pointer"
                            >
                              ลองใหม่
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {item.subtitleStatus === 'idle' && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-gray-150 dark:bg-gray-800 text-gray-500">
                            รอถอดเสียง
                          </span>
                        )}
                        {item.subtitleStatus === 'transcribing' && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-purple-100 dark:bg-purple-950/40 text-purple-600 animate-pulse">
                            กำลังแกะเสียง...
                          </span>
                        )}
                        {item.subtitleStatus === 'done' && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center gap-1 w-max">
                            ✅ พร้อมใช้
                          </span>
                        )}
                        {item.subtitleStatus === 'error' && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-red-100 dark:bg-red-950/40 text-red-600">
                            ล้มเหลว
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        {item.status === 'pending' && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-gray-150 dark:bg-gray-800 text-gray-400">
                            ⏳ รอในคิว
                          </span>
                        )}
                        {item.status === 'rendering' && (
                          <div className="flex flex-col gap-1 w-28">
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500 animate-pulse text-center">
                              🎬 กำลังสร้างวิดีโอ
                            </span>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-1 rounded-full overflow-hidden">
                              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                            </div>
                          </div>
                        )}
                        {item.status === 'done' && (
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-green-100 dark:bg-green-950/40 text-green-600 flex items-center gap-1 w-max">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                            สำเร็จ
                          </span>
                        )}
                        {item.status === 'error' && (
                          <div className="flex flex-col max-w-[150px]">
                            <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-red-100 dark:bg-red-950/40 text-red-600 w-max">
                              ⚠️ ล้มเหลว
                            </span>
                            <span className="text-[9px] text-red-500 truncate mt-1" title={item.errorMessage}>
                              {item.errorMessage}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-4 text-center">
                        <div className="flex gap-1.5 justify-center">
                          <button
                            onClick={() => renderSingleItem(item.name)}
                            disabled={isRendering || isGeneratingAll}
                            className="px-2.5 py-1 rounded bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-[10px] disabled:opacity-50 transition-all cursor-pointer"
                            title="เรนเดอร์เฉพาะไฟล์นี้"
                          >
                            🎬 เรนเดอร์
                          </button>
                          
                          <button
                            onClick={() => clearCacheForItem(item.name)}
                            disabled={isRendering || isGeneratingAll}
                            className="px-2 py-1 rounded border border-gray-200 dark:border-gray-800 hover:bg-red-500 hover:text-white hover:border-red-500 text-gray-500 font-semibold text-[10px] disabled:opacity-50 transition-all cursor-pointer"
                            title="ล้างข้อมูลแคชเฉพาะไฟล์นี้"
                          >
                            🧹 ล้าง
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {avatarFiles.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-sm text-gray-500">
                      ไม่พบไฟล์คลิป Avatar เลย กรุณาเลือกโฟลเดอร์ให้ถูกต้องแล้วกดรีเฟรช
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6 flex flex-col">
          <div className="p-6 rounded-3xl border shadow-sm flex flex-col items-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-bold mb-4 text-purple-500 uppercase tracking-wider flex items-center gap-1.5 w-full">
              <span>📱</span> พรีวิวหน้าจอ 9:16 แบบเรียลไทม์
            </h2>
            
            <div className="relative w-full max-w-[330px] aspect-[9/16] rounded-[36px] p-2.5 bg-gray-900 border-[6px] border-gray-800 shadow-2xl overflow-hidden group">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-4.5 bg-black rounded-full z-30 flex items-center justify-between px-3">
                <div className="w-1.5 h-1.5 bg-gray-800 rounded-full"></div>
                <div className="w-3.5 h-1.5 bg-gray-800 rounded-full"></div>
              </div>
              
              <div 
                className="relative w-full h-full rounded-[28px] overflow-hidden bg-black flex flex-col select-none"
                style={{ containerType: 'inline-size' }}
              >
                {isVerticalAvatar ? (
                  <div className="absolute inset-0 w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 flex items-center justify-center text-center">
                      <div className="opacity-35 text-[10px] font-bold text-gray-300">
                        🎬 B-Roll Background (เต็มจอ)
                      </div>
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 h-[60%] flex items-end justify-center">
                      {useGreenScreenKeying ? (
                        <div className="relative w-full h-full flex items-end justify-center overflow-hidden">
                          <div className="absolute bottom-0 w-[80%] h-[90%] bg-green-500/20 border-t-2 border-x-2 border-green-500/50 rounded-t-full flex items-center justify-center">
                            <span className="text-[11px] font-bold text-green-400 drop-shadow">Chroma Keyed Avatar</span>
                          </div>
                        </div>
                      ) : (
                        <div className="absolute bottom-0 w-full h-full bg-purple-950/40 border-t border-purple-500/30 flex items-center justify-center">
                          <span className="text-[11px] font-bold text-purple-300">Avatar Overlay (เต็มจอ)</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 w-full h-full flex flex-col">
                    <div className="h-[54%] w-full bg-gradient-to-br from-indigo-950 to-indigo-900 flex flex-col items-center justify-center relative border-b border-white/10">
                      <div className="text-[10px] font-bold text-indigo-300 opacity-60">🎬 B-Roll (วิดีโอประกอบ)</div>
                      <div className="text-[8px] text-indigo-400/50 mt-1">ขนาด 1080 x 1040 (54%)</div>
                    </div>
                    <div className="h-[46%] w-full bg-gradient-to-tr from-purple-950 to-purple-900 flex flex-col items-center justify-center relative">
                      <div className="text-[10px] font-bold text-purple-300 opacity-60">👤 Avatar (คลิปพูดหลัก)</div>
                      <div className="text-[8px] text-purple-400/50 mt-1">ขนาด 1080 x 880 (46%)</div>
                    </div>
                  </div>
                )}
                
                {(() => {
                  const renderingRow = items.find(q => q.status === 'rendering');
                  const text = renderingRow 
                    ? (titleTexts[renderingRow.name] || autoTitleFromFileName(renderingRow.name))
                    : (items.length > 0 
                        ? (titleTexts[items[0].name] || autoTitleFromFileName(items[0].name))
                        : "พาดหัวดึงดูดความสนใจ\nจะขึ้นแสดงที่นี่");
                  
                  // Dynamic font size simulation if font size is auto (0)
                  let simulatedFontSize = headlineFontSize;
                  if (simulatedFontSize === 0) {
                    const lines = text.split('\n').filter(Boolean);
                    const longestLine = Math.max(...lines.map(line => Array.from(line).length), 1);
                    simulatedFontSize = Math.max(42, Math.min(82, Math.floor(1500 / longestLine)));
                  }
                  
                  return (
                    <div 
                      className="absolute left-1/2 -translate-x-1/2 w-[90%] text-center pointer-events-none transition-all duration-75 z-10"
                      style={{
                        top: `${(headlineYPosition / 1920) * 100}%`,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}
                    >
                      <div 
                        className="font-extrabold leading-snug whitespace-pre-line break-words max-w-[90%] shadow-lg border text-center flex items-center justify-center"
                        style={getPreviewBannerStyle(simulatedFontSize)}
                      >
                        {text}
                      </div>
                    </div>
                  );
                })()}

                {subtitleEnabled && (
                  <div style={getPreviewSubtitleStyle()}>
                    {subtitleLanguage === 'en' ? '[Simulated Subtitles Here]' : '[คำบรรยายจะขึ้นโชว์ที่นี่]'}
                  </div>
                )}
                
              </div>
            </div>
            
            <div className="text-[10px] text-gray-500 mt-3 text-center leading-normal max-w-[240px]">
              ขยับสไลเดอร์ <b>ตำแหน่ง Y</b> เพื่อเลื่อนตำแหน่งพาดหัวขึ้น-ลงแบบเรียลไทม์
            </div>
          </div>

          <div className="p-6 rounded-3xl border shadow-sm flex flex-col flex-1" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                Log การตัดต่อ
              </h2>
              <button
                onClick={() => setLogs([])}
                className="text-xs font-semibold px-2.5 py-1 rounded-lg border hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer"
                style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}
              >
                ล้าง Log
              </button>
            </div>
            <div className="h-[360px] xl:h-[420px] overflow-y-auto rounded-2xl p-4 font-mono text-[11px] leading-relaxed border" style={{ backgroundColor: '#050816', color: '#38bdf8', borderColor: 'rgba(148,163,184,0.2)' }}>
              {logs.length === 0 ? (
                <div className="opacity-50 text-gray-500">Log การทำงานจะแสดงแบบเรียลไทม์ที่นี่เมื่อสั่งประมวลผล...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap break-words border-b border-white/5 pb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {isHeadlineModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
              <div className="flex items-center gap-2">
                <span className="text-2xl">💡</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-white">AI Headline Generator</h3>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">สแกนเสียงแล้ววิเคราะห์พาดหัว Hook ดึงดูดความสนใจ</p>
                </div>
              </div>
              <button onClick={() => setIsHeadlineModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all text-xl font-bold p-1">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="p-3 bg-gray-50 dark:bg-black/30 rounded-2xl border border-gray-150 dark:border-gray-855">
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-1">ไฟล์วิดีโอปัจจุบัน:</span>
                <span className="text-sm font-semibold truncate block text-gray-700 dark:text-gray-300">{modalAvatarFile}</span>
              </div>

              {isModalLoading && (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-4 border-purple-500/20"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-purple-600 animate-spin"></div>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-800 dark:text-white">กำลังประมวลผลวิดีโอด้วย AI...</h4>
                    {modalProgressText && (
                      <div className="mt-2 text-xs font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/20 px-3.5 py-1.5 rounded-full inline-block animate-pulse border border-purple-100 dark:border-purple-900/30">
                        {modalProgressText}
                      </div>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3.5 max-w-sm mx-auto leading-relaxed">กำลังสกัดเสียง แปลงเสียงพูดภาษาไทย และสร้างพาดหัวดึงดูดความสนใจโดยใช้เวลาประมาณ 10-25 วินาที</p>
                  </div>
                </div>
              )}

              {modalError && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
                  <div className="flex gap-2">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <h4 className="font-bold text-sm text-red-800 dark:text-red-300">เกิดข้อผิดพลาดในการวิเคราะห์</h4>
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">{modalError}</p>
                      <button onClick={() => handleGenerateHeadlineInteractive(modalAvatarFile)} className="mt-3 text-xs font-bold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all cursor-pointer">ลองใหม่อีกครั้ง</button>
                    </div>
                  </div>
                </div>
              )}

              {!isModalLoading && !modalError && modalTranscript && (
                <div className="space-y-5">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">📝 ข้อความถอดรหัสจากวิดีโอ (Transcript):</span>
                    <div className="p-4 bg-gray-50 dark:bg-black/50 border rounded-2xl max-h-36 overflow-y-auto text-xs leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {modalTranscript}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">🔥 คำพาดหัวไวรัลที่แนะนำโดย AI (กดเลือกเพื่อใช้งานได้เลย):</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {modalHeadlines.map((headline, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setTitleTexts(prev => ({ ...prev, [modalAvatarFile]: headline }));
                            setIsHeadlineModalOpen(false);
                            addLog(`เลือกพาดหัว AI สำหรับ ${modalAvatarFile}: "${headline}"`);
                          }}
                          className="flex items-start gap-4 p-4 text-left border rounded-2xl bg-white dark:bg-gray-800 hover:border-purple-500 hover:shadow-lg dark:hover:bg-purple-950/10 transition-all group scale-100 hover:scale-[1.01] cursor-pointer animate-fade-in"
                        >
                          <div className="bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 group-hover:bg-purple-600 group-hover:text-white transition-colors">{idx + 1}</div>
                          <div>
                            <p className="font-extrabold text-sm text-gray-800 dark:text-white leading-snug whitespace-pre-line">{headline}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-black/20 border-t border-gray-100 dark:border-gray-800 flex justify-end">
              <button onClick={() => setIsHeadlineModalOpen(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-750 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold text-xs rounded-xl transition-all cursor-pointer">ยกเลิก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FolderField({ label, value, onPick }: { label: string; value: string; onPick: () => void }) {
  return (
    <div>
      <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={value}
          placeholder="ยังไม่ได้เลือก..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm border outline-none"
          style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
        />
        <button onClick={onPick} className="px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all border cursor-pointer" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
          <FolderOpen className="w-4 h-4" />
          เลือก
        </button>
      </div>
    </div>
  );
}
