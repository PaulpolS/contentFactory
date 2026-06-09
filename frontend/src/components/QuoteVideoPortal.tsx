import React, { useState, useEffect, useRef, useCallback } from 'react';
import JSZip from 'jszip';
import Papa from 'papaparse';
import { 
  Quote, 
  Sparkles, 
  Settings, 
  Download, 
  FileVideo, 
  Plus, 
  Trash2, 
  Check, 
  Folder, 
  FolderOpen, 
  Music, 
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Sliders,
  Type,
  Maximize2
} from 'lucide-react';

const DEFAULT_AI_MODEL = "google/gemini-2.5-flash";

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

const parseRgba = (colorStr: string) => {
  const defaultVal = { hex: '#000000', opacity: 55 };
  if (!colorStr) return defaultVal;
  
  if (colorStr.startsWith('#')) {
    return { hex: colorStr, opacity: 100 };
  }
  
  if (colorStr.startsWith('rgba')) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      const r = parseInt(match[1]);
      const g = parseInt(match[2]);
      const b = parseInt(match[3]);
      const a = match[4] ? parseFloat(match[4]) : 1.0;
      
      const componentToHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };
      
      const hex = '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
      return { hex, opacity: Math.round(a * 100) };
    }
  }
  
  return defaultVal;
};

const toRgba = (hex: string, opacity: number) => {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16) || 0;
  const g = parseInt(cleanHex.substring(2, 4), 16) || 0;
  const b = parseInt(cleanHex.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
};

const FONT_OPTIONS = [
  { value: '"Noto Sans Thai", sans-serif', label: 'Noto Sans Thai' },
  { value: '"Prompt", sans-serif', label: 'Prompt' },
  { value: '"Sarabun", sans-serif', label: 'Sarabun' },
  { value: '"Kanit", sans-serif', label: 'Kanit' },
  { value: '"Mitr", sans-serif', label: 'Mitr' },
  { value: '"Chakra Petch", sans-serif', label: 'Chakra Petch' },
  { value: '"IBM Plex Sans Thai", sans-serif', label: 'IBM Plex Sans Thai' },
  { value: 'Impact, sans-serif', label: 'Impact' },
  { value: 'Arial Black, sans-serif', label: 'Arial Black' },
];

interface CanvasElement {
  id: string;
  type: 'title' | 'text-block';
  x: number;      // % of canvas width
  y: number;      // % of canvas height
  width: number;   // % of canvas width
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  textAlign: 'left' | 'center' | 'right';
  bgBox: boolean;
  bgBoxColor: string;
  bgBoxRadius: number;
  bgBoxPaddingX: number;
  bgBoxPaddingY: number;
  bgBoxMode?: 'full' | 'fit' | 'line';
  textEffect?: 'none' | 'stroke' | 'shadow' | 'neon';
  strokeColor?: string;
  strokeWidth?: number;
  shadowColor?: string;
  shadowBlur?: number;
}

interface CanvasTemplate {
  id: string;
  name: string;
  icon: string;
  desc: string;
  canvasWidth: number;
  canvasHeight: number;
  overlayOpacity: number;
  fontFamily: string;
  elements: CanvasElement[];
}

const BUILT_IN_TEMPLATES: CanvasTemplate[] = [
  {
    id: 'trader_series',
    name: 'ถึงเทรดเดอร์',
    icon: '📈',
    desc: 'สไตล์ ถึงเทรดเดอร์ EP.XX — หัวข้อใหญ่ + กล่องข้อความดำพรีเมียม',
    canvasWidth: 1080,
    canvasHeight: 1920,
    overlayOpacity: 0.45,
    fontFamily: '"Noto Sans Thai", sans-serif',
    elements: [
      {
        id: 'title_main',
        type: 'title',
        x: 5, y: 5,
        width: 90,
        text: 'ถึงเทรดเดอร์',
        fontSize: 90,
        color: '#FFFFFF',
        bold: true,
        textAlign: 'center',
        bgBox: false, bgBoxColor: '', bgBoxRadius: 0, bgBoxPaddingX: 0, bgBoxPaddingY: 0,
      },
      {
        id: 'title_ep',
        type: 'title',
        x: 5, y: 14,
        width: 90,
        text: 'EP.1',
        fontSize: 105,
        color: '#FFD700',
        bold: true,
        textAlign: 'center',
        bgBox: false, bgBoxColor: '', bgBoxRadius: 0, bgBoxPaddingX: 0, bgBoxPaddingY: 0,
      },
      {
        id: 'block_1',
        type: 'text-block',
        x: 5, y: 30,
        width: 90,
        text: 'คนส่วนใหญ่ทนทำงาน 40 ปี\nเพื่อทำให้ฝันของผู้อื่นสำเร็จ\nแต่กลับทนอดทนสร้างฝันตนเอง\nแค่ 5 ปีไม่ได้',
        fontSize: 48,
        color: '#FFFFFF',
        bold: false,
        textAlign: 'center',
        bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 24, bgBoxPaddingY: 18,
      },
      {
        id: 'block_2',
        type: 'text-block',
        x: 5, y: 55,
        width: 90,
        text: 'ถ้าไม่กล้าเผชิญหน้ากับความล้มเหลว\nคุณก็ไม่มีสิทธิ์ได้เห็นความสำเร็จ\nในตลาดที่แฟร์ที่สุดแห่งนี้',
        fontSize: 48,
        color: '#FFFFFF',
        bold: false,
        textAlign: 'center',
        bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 24, bgBoxPaddingY: 18,
      },
      {
        id: 'block_3',
        type: 'text-block',
        x: 5, y: 76,
        width: 90,
        text: 'สุดท้ายมันวัดกันที่ความนิ่ง\nและวินัยในการคุมความเสี่ยง',
        fontSize: 48,
        color: '#FFD700',
        bold: true,
        textAlign: 'center',
        bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 24, bgBoxPaddingY: 18,
      },
    ],
  },
  {
    id: 'quote_card',
    name: 'การ์ดคำคมสั้น',
    icon: '💬',
    desc: 'รูปภาพพื้นหลัง + คำคมกลางจอโดนๆ + บัญชีผู้กล่าว',
    canvasWidth: 1080,
    canvasHeight: 1080,
    overlayOpacity: 0.5,
    fontFamily: '"Prompt", sans-serif',
    elements: [
      {
        id: 'quote_text',
        type: 'text-block',
        x: 8, y: 25,
        width: 84,
        text: '"จงทำงานหนักในความเงียบ\nแล้วปล่อยให้ความสำเร็จ\nเป็นตัวส่งเสียงคำราม"',
        fontSize: 44,
        color: '#FFFFFF',
        bold: true,
        textAlign: 'center',
        bgBox: true, bgBoxColor: 'rgba(0,0,0,0.6)', bgBoxRadius: 24, bgBoxPaddingX: 32, bgBoxPaddingY: 28,
      },
      {
        id: 'quote_author',
        type: 'title',
        x: 10, y: 70,
        width: 80,
        text: '— ความลับเทรดเดอร์',
        fontSize: 32,
        color: '#FFD700',
        bold: false,
        textAlign: 'center',
        bgBox: false, bgBoxColor: '', bgBoxRadius: 0, bgBoxPaddingX: 0, bgBoxPaddingY: 0,
      },
    ],
  },
];

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
  } else {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
  }
  ctx.closePath();
  ctx.fill();
};

function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const rawLine of text.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) { result.push(''); continue; }
    if (ctx.measureText(trimmed).width <= maxWidth) { result.push(trimmed); continue; }
    let cur = '';
    for (const ch of trimmed) {
      const test = cur + ch;
      if (ctx.measureText(test).width <= maxWidth) { cur = test; }
      else { if (cur) result.push(cur); cur = ch; }
    }
    if (cur) result.push(cur);
  }
  return result;
}

const getVideoDuration = (file: File): Promise<number> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      resolve(video.duration || 0);
    };
    video.onerror = () => {
      resolve(0);
    };
    video.src = URL.createObjectURL(file);
  });
};

const sequenceVideos = (videos: { file: File; duration: number; url: string }[], targetDuration: number) => {
  if (videos.length === 0) return [];
  const sequence: { file: File; duration: number; url: string }[] = [];
  let currentTotal = 0;
  let safetyCounter = 0;
  while (currentTotal < targetDuration && safetyCounter < 100) {
    safetyCounter++;
    const randomVideo = videos[Math.floor(Math.random() * videos.length)];
    if (randomVideo.duration <= 0) continue;
    sequence.push(randomVideo);
    currentTotal += randomVideo.duration;
  }
  return sequence;
};

export default function QuoteVideoPortal() {
  const [activeTemplate, setActiveTemplate] = useState<CanvasTemplate | null>(null);
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedElId, setSelectedElId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  
  const [bgType, setBgType] = useState<'image' | 'video'>('video');
  const [bgImage, setBgImage] = useState('');
  const [logoImage, setLogoImage] = useState('');
  const [logoPosition, setLogoPosition] = useState('top-right');
  const [logoScale, setLogoScale] = useState('medium');

  // Video Background & Color Filters State
  const [bgVideos, setBgVideos] = useState<{ file: File; duration: number; url: string }[]>([]);
  const [videoDuration, setVideoDuration] = useState<number>(15);
  const [colorFilter, setColorFilter] = useState<string>('dark');
  const [videoSequence, setVideoSequence] = useState<{ file: File; duration: number; url: string }[]>([]);
  const [currentPlayingVideoIdx, setCurrentPlayingVideoIdx] = useState(0);

  // BGM (Background Music) States
  const [bgmFiles, setBgmFiles] = useState<File[]>([]);
  const [bgmVolume, setBgmVolume] = useState<number>((() => {
    const cached = localStorage.getItem('canvas_bgm_volume');
    return cached ? Number(cached) : 15; // default 15%
  }));

  // Batch / Multi-EP state
  const [batchCount, setBatchCount] = useState(1);
  const [batchContents, setBatchContents] = useState<string[]>(['']);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [blockMargin, setBlockMargin] = useState(16);

  // Drag coordinates helpers
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Exporter / FFmpeg Engine States
  const [ffmpegReady, setFfmpegReady] = useState(false);
  const [ffmpegLoading, setFfmpegLoading] = useState(false);
  const ffmpegRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [outputPath, setOutputPath] = useState(() => localStorage.getItem('custom_output_folder') || '/Users/paulpolsulintaboon/Desktop/Done');
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBulkProgress] = useState(0);
  const [batchExportLog, setBatchExportLog] = useState<string[]>([]);

  // AI Content Writer Generator State
  const [aiTopic, setAiTopic] = useState('');
  const [aiTone, setAiTone] = useState<'trader_secrets' | 'general'>('trader_secrets');
  const [epStart, setEpStart] = useState(1);
  const [epEnd, setEpEnd] = useState(5);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGenProgress, setAiGenProgress] = useState(0);
  const [aiGenLog, setAiGenLog] = useState<string[]>([]);
  const [aiGenMode, setAiGenMode] = useState<'series' | 'headlines'>('series');
  const [aiCustomHeadlines, setAiCustomHeadlines] = useState('');

  // Local Google Font Loader
  useEffect(() => {
    const families = ['Prompt', 'Sarabun', 'Kanit', 'Mitr', 'Chakra+Petch', 'IBM+Plex+Sans+Thai', 'Noto+Sans+Thai'];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}:wght@400;700;900`).join('&')}&display=swap`;
    document.head.appendChild(link);
    
    // Auto select first template on mount
    selectTemplate(BUILT_IN_TEMPLATES[0]);
  }, []);

  const selectTemplate = (tpl: CanvasTemplate) => {
    setActiveTemplate(tpl);
    setElements(tpl.elements.map(el => ({ ...el })));
    setSelectedElId(null);
    setBatchCount(1);
    setBatchContents(['']);
    setPreviewIndex(0);
  };

  const updateBatchCount = (count: number) => {
    const c = Math.max(1, Math.min(50, count));
    setBatchCount(c);
    const newContents = Array.from({ length: c }, (_, i) => batchContents[i] || '');
    setBatchContents(newContents);
    if (previewIndex >= c) setPreviewIndex(c - 1);
  };

  const getElementsForBatch = (contentStr: string): CanvasElement[] => {
    if (!contentStr.trim()) return elements;
    const blocks = contentStr.split(/\n---\n|\n\n\n/).map(b => b.trim()).filter(Boolean);

    return elements.map((el) => {
      if (aiGenMode === 'headlines') {
        if (el.id === 'title_main') {
          return { ...el, text: blocks[0] || '' };
        }
        if (el.type === 'text-block') {
          const blockElements = elements.filter(e => e.type === 'text-block');
          const blockIdx = blockElements.indexOf(el);
          const targetIdx = blockIdx + 1; // Shift to skip the headline blocks[0]
          if (targetIdx >= 0 && targetIdx < blocks.length) {
            return { ...el, text: blocks[targetIdx] };
          } else {
            return { ...el, text: '' }; // Hide remaining boxes
          }
        }
      } else {
        if (el.type === 'text-block') {
          const blockElements = elements.filter(e => e.type === 'text-block');
          const blockIdx = blockElements.indexOf(el);
          if (blockIdx >= 0 && blockIdx < blocks.length) {
            return { ...el, text: blocks[blockIdx] };
          }
        }
      }
      return el;
    });
  };

  // WebAssembly FFmpeg Lazy Loader
  const loadFFmpeg = async () => {
    if (ffmpegReady || ffmpegLoading) return;
    setFfmpegLoading(true);
    setBatchExportLog(prev => [...prev, "⏳ กำลังโหลดเวิลด์ไวด์บราวเซอร์เอนจิ้น FFMPEG.wasm เข้าเบราว์เซอร์..."]);
    try {
      const { FFmpeg } = await import('@ffmpeg/ffmpeg');
      const ffmpeg = new FFmpeg();
      ffmpegRef.current = ffmpeg;
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      const { toBlobURL } = await import('@ffmpeg/util');
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });
      setFfmpegReady(true);
      setBatchExportLog(prev => [...prev, "✅ โหลด FFMPEG.wasm สำเร็จ ระบบตัดต่อวิดีโอออฟไลน์พร้อมรันระดับความเร็วสูง!"]);
    } catch (err: any) {
      console.error('Failed to load FFmpeg:', err);
      setBatchExportLog(prev => [...prev, `❌ โหลด FFMPEG ล้มเหลว: ${err.message}`]);
      alert('ไม่สามารถโหลด FFMPEG.wasm ได้: ' + err.message);
    } finally {
      setFfmpegLoading(false);
    }
  };

  useEffect(() => {
    if ((bgVideos.length > 0 || bgmFiles.length > 0) && !ffmpegReady && !ffmpegLoading) {
      loadFFmpeg();
    }
  }, [bgVideos, bgmFiles]);

  const generateSequence = useCallback((videosList = bgVideos, durationTarget = videoDuration) => {
    if (videosList.length === 0) {
      setVideoSequence([]);
      return;
    }
    const seq = sequenceVideos(videosList, durationTarget);
    setVideoSequence(seq);
    setCurrentPlayingVideoIdx(0);
  }, [bgVideos, videoDuration]);

  const handleVideoEnded = () => {
    if (videoSequence.length === 0) return;
    const nextIdx = currentPlayingVideoIdx + 1;
    if (nextIdx < videoSequence.length) {
      setCurrentPlayingVideoIdx(nextIdx);
    } else {
      setCurrentPlayingVideoIdx(0);
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(() => {});
      }
    }
  };

  useEffect(() => {
    if (videoSequence.length > 0 && videoRef.current) {
      const currentVideo = videoSequence[currentPlayingVideoIdx];
      if (currentVideo) {
        videoRef.current.src = currentVideo.url;
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
    }
  }, [currentPlayingVideoIdx, videoSequence]);

  // Video and BGM upload handlers
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/i.test(file.name)
    );
    if (fileArray.length === 0) {
      alert('ไม่พบไฟล์วิดีโอที่รองรับ');
      return;
    }
    setAiGenLog(prev => [...prev, `🎬 กำลังสแกนหาความยาวของวิดีโอ ${fileArray.length} คลิป...`]);
    const loadedVids = await Promise.all(
      fileArray.map(async (file) => {
        const url = URL.createObjectURL(file);
        const duration = await getVideoDuration(file);
        return { file, duration, url };
      })
    );
    setBgVideos(prev => {
      const next = [...prev, ...loadedVids];
      generateSequence(next);
      return next;
    });
    setAiGenLog(prev => [...prev, `✅ โหลดคลิปพื้นหลังสำเร็จ ${fileArray.length} คลิป`]);
    e.target.value = '';
  };

  const handleBgmUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files).filter(file => 
      file.type.startsWith('audio/') || /\.(mp3|wav|m4a|aac)$/i.test(file.name)
    );
    if (fileArray.length === 0) {
      alert('ไม่พบไฟล์เสียงที่รองรับ');
      return;
    }
    setBgmFiles(fileArray);
    localStorage.setItem('canvas_bgm_volume', String(bgmVolume));
    e.target.value = '';
  };

  const applyColorFilter = (ctx: CanvasRenderingContext2D, width: number, height: number, filter: string) => {
    ctx.save();
    if (filter === 'dark') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, width, height);
    } else if (filter === 'vintage') {
      ctx.fillStyle = 'rgba(120, 60, 20, 0.22)';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = 'rgba(255, 230, 180, 0.04)';
      ctx.fillRect(0, 0, width, height);
    } else if (filter === 'warm') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(251, 146, 60, 0.2)');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    } else if (filter === 'cool') {
      const grad = ctx.createLinearGradient(0, 0, 0, height);
      grad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();
  };

  const drawCanvas = useCallback((targetCanvas?: HTMLCanvasElement, overrideElements?: CanvasElement[], transparentBg = false) => {
    const canvas = targetCanvas || canvasRef.current;
    if (!canvas || !activeTemplate) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const tpl = activeTemplate;
    canvas.width = tpl.canvasWidth;
    canvas.height = tpl.canvasHeight;

    if (transparentBg) {
      ctx.clearRect(0, 0, tpl.canvasWidth, tpl.canvasHeight);
    } else {
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, tpl.canvasWidth, tpl.canvasHeight);
    }

    const els = overrideElements || elements;

    // Background Image Mode (Image mode rendering)
    if (!transparentBg && bgType === 'image' && bgImage) {
      const bg = new Image();
      bg.crossOrigin = 'anonymous';
      bg.onload = () => {
        const scale = Math.max(tpl.canvasWidth / bg.width, tpl.canvasHeight / bg.height);
        const w = bg.width * scale;
        const h = bg.height * scale;
        ctx.drawImage(bg, (tpl.canvasWidth - w) / 2, (tpl.canvasHeight - h) / 2, w, h);
        applyColorFilter(ctx, tpl.canvasWidth, tpl.canvasHeight, colorFilter);
        drawElements();
      };
      bg.src = bgImage;
      return;
    } else if (!transparentBg && bgType === 'video') {
      applyColorFilter(ctx, tpl.canvasWidth, tpl.canvasHeight, colorFilter);
    }

    const drawElements = () => {
      let nextBlockY = -1;
      let isFirstBlock = true;

      for (const el of els) {
        const px = (el.x / 100) * tpl.canvasWidth;
        const pw = (el.width / 100) * tpl.canvasWidth;

        // Auto stacking layout calculation
        let py: number;
        if (el.type === 'text-block' && nextBlockY >= 0 && !isFirstBlock) {
          py = nextBlockY + blockMargin;
        } else {
          py = (el.y / 100) * tpl.canvasHeight;
        }
        if (el.type === 'text-block') isFirstBlock = false;

        (el as any)._computedY = py;

        ctx.font = `${el.bold ? 'bold' : 'normal'} ${el.fontSize}px ${tpl.fontFamily}`;
        const lines = wrapTextLines(ctx, el.text, pw - (el.bgBox ? el.bgBoxPaddingX * 2 : 0));
        const lineHeight = el.fontSize * 1.35;
        const totalTextH = lines.length * lineHeight;

        let elementH = totalTextH;
        if (el.bgBox && lines.length > 0) {
          let boxX = px;
          let boxY = py;
          let boxW = pw;
          const boxH = totalTextH + el.bgBoxPaddingY * 2;
          elementH = boxH;

          if (el.bgBoxMode !== 'line') {
            if (el.bgBoxMode === 'fit') {
              let maxLineWidth = 0;
              for (const line of lines) {
                const w = ctx.measureText(line).width;
                if (w > maxLineWidth) maxLineWidth = w;
              }
              boxW = maxLineWidth + el.bgBoxPaddingX * 2;
              if (boxW > pw) boxW = pw;
              const textAreaW = pw - (el.bgBox ? el.bgBoxPaddingX * 2 : 0);
              const textStartX = px + (el.bgBox ? el.bgBoxPaddingX : 0);

              if (el.textAlign === 'center') {
                boxX = textStartX + textAreaW / 2 - boxW / 2;
              } else if (el.textAlign === 'right') {
                boxX = textStartX + textAreaW - boxW + el.bgBoxPaddingX;
              } else {
                boxX = textStartX - el.bgBoxPaddingX;
              }
            }

            ctx.fillStyle = el.bgBoxColor || 'rgba(0,0,0,0.55)';
            drawRoundedRect(ctx, boxX, boxY, boxW, boxH, el.bgBoxRadius || 0);
          }
        }

        (el as any)._renderedH = elementH;
        if (el.type === 'text-block') nextBlockY = py + elementH;

        // Render each line
        const textStartY = py + (el.bgBox ? el.bgBoxPaddingY : 0) + el.fontSize;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (!line) continue;
          const ly = textStartY + i * lineHeight;
          const textAreaW = pw - (el.bgBox ? el.bgBoxPaddingX * 2 : 0);
          const textStartX = px + (el.bgBox ? el.bgBoxPaddingX : 0);

          let drawX: number;
          if (el.textAlign === 'center') {
            ctx.textAlign = 'center';
            drawX = textStartX + textAreaW / 2;
          } else if (el.textAlign === 'right') {
            ctx.textAlign = 'right';
            drawX = textStartX + textAreaW;
          } else {
            ctx.textAlign = 'left';
            drawX = textStartX;
          }

          // If bgBoxMode is 'line', draw a separate background box for this specific line!
          if (el.bgBox && el.bgBoxMode === 'line') {
            const w = ctx.measureText(line).width;
            let lineBoxW = w + el.bgBoxPaddingX * 2;
            if (lineBoxW > pw) lineBoxW = pw;

            let lineBoxX = textStartX;
            if (el.textAlign === 'center') {
              lineBoxX = textStartX + textAreaW / 2 - lineBoxW / 2;
            } else if (el.textAlign === 'right') {
              lineBoxX = textStartX + textAreaW - lineBoxW + el.bgBoxPaddingX;
            } else {
              lineBoxX = textStartX - el.bgBoxPaddingX;
            }

            const lineBoxH = el.fontSize + el.bgBoxPaddingY * 2;
            const lineBoxY = ly - el.fontSize - el.bgBoxPaddingY;

            ctx.fillStyle = el.bgBoxColor || 'rgba(0,0,0,0.55)';
            drawRoundedRect(ctx, lineBoxX, lineBoxY, lineBoxW, lineBoxH, el.bgBoxRadius || 0);
          }

          ctx.fillStyle = el.color;
          ctx.font = `${el.bold ? 'bold' : 'normal'} ${el.fontSize}px ${tpl.fontFamily}`;
          ctx.strokeStyle = 'rgba(0,0,0,0.85)';
          ctx.lineWidth = el.fontSize * 0.08;
          ctx.strokeText(line, drawX, ly);
          ctx.fillText(line, drawX, ly);
        }
      }

      // Draw Watermark Logo
      if (logoImage) {
        const logo = new Image();
        logo.crossOrigin = 'anonymous';
        logo.onload = () => {
          const scaleMap: Record<string, number> = { small: 0.08, medium: 0.12, large: 0.18 };
          const sc = scaleMap[logoScale] || 0.12;
          const lw = tpl.canvasWidth * sc;
          const lh = (logo.height / logo.width) * lw;
          const m = tpl.canvasWidth * 0.03;
          let lx = m, ly = m;
          if (logoPosition === 'top-right') lx = tpl.canvasWidth - lw - m;
          else if (logoPosition === 'bottom-left') ly = tpl.canvasHeight - lh - m;
          else if (logoPosition === 'bottom-right') { lx = tpl.canvasWidth - lw - m; ly = tpl.canvasHeight - lh - m; }
          else if (logoPosition === 'center') { lx = (tpl.canvasWidth - lw) / 2; ly = (tpl.canvasHeight - lh) / 2; }
          ctx.drawImage(logo, lx, ly, lw, lh);
        };
        logo.src = logoImage;
      }
    };

    drawElements();
  }, [activeTemplate, elements, bgImage, logoImage, logoPosition, logoScale, bgType, colorFilter, blockMargin]);

  // Redraw preview canvas whenever elements or visual configurations change
  useEffect(() => {
    const activeContent = batchContents[previewIndex] || '';
    const currentEls = getElementsForBatch(activeContent);
    
    // Auto-update EP Ep number on canvas preview
    const finalEls = currentEls.map(el => {
      if (el.id === 'title_ep') {
        return { ...el, text: aiGenMode === 'headlines' ? '' : `EP.${epStart + previewIndex}` };
      }
      return el;
    });

    drawCanvas(undefined, finalEls);
  }, [previewIndex, batchContents, elements, bgImage, logoImage, logoPosition, logoScale, bgType, colorFilter, blockMargin, drawCanvas, aiGenMode]);

  // Drag and Drop Logic
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !activeTemplate) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const tpl = activeTemplate;
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    // Convert client coordinates back to Canvas coordinates
    const scaleX = tpl.canvasWidth / rect.width;
    const scaleY = tpl.canvasHeight / rect.height;
    const clickX = clientX * scaleX;
    const clickY = clientY * scaleY;

    // Hit-testing layers from top to bottom
    const activeContent = batchContents[previewIndex] || '';
    const currentEls = getElementsForBatch(activeContent);

    for (let i = currentEls.length - 1; i >= 0; i--) {
      const el = currentEls[i];
      const px = (el.x / 100) * tpl.canvasWidth;
      const py = (el as any)._computedY !== undefined ? (el as any)._computedY : (el.y / 100) * tpl.canvasHeight;
      const pw = (el.width / 100) * tpl.canvasWidth;
      const ph = (el as any)._renderedH || el.fontSize * 1.5;

      if (clickX >= px && clickX <= px + pw && clickY >= py && clickY <= py + ph) {
        setSelectedElId(el.id);
        const originalEl = elements.find(x => x.id === el.id);
        if (originalEl) {
          setEditText(originalEl.text);
        }
        setIsDragging(true);
        setDragOffset({
          x: clickX - px,
          y: clickY - py
        });
        return;
      }
    }
    setSelectedElId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElId || !canvasRef.current || !activeTemplate) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const tpl = activeTemplate;
    
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const clickX = clientX * (tpl.canvasWidth / rect.width);
    const clickY = clientY * (tpl.canvasHeight / rect.height);

    // Compute new percentage coordinate
    const targetX = ((clickX - dragOffset.x) / tpl.canvasWidth) * 100;
    const targetY = ((clickY - dragOffset.y) / tpl.canvasHeight) * 100;

    setElements(prev => prev.map(el => {
      if (el.id === selectedElId) {
        return {
          ...el,
          x: Math.max(0, Math.min(100 - el.width, targetX)),
          y: Math.max(0, Math.min(95, targetY))
        };
      }
      return el;
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Output saving using POST `/api/save-video`
  const saveSingleFile = async (blob: Blob, name: string) => {
    let saved = false;
    if (outputPath) {
      try {
        const saveRes = await fetch(`${BACKEND_BASE}/api/save-video?path=${encodeURIComponent(outputPath)}&filename=${encodeURIComponent(name)}`, {
          method: 'POST',
          body: blob
        });
        const saveData = await saveRes.json();
        if (saveRes.ok && saveData.success) {
          saved = true;
          setBatchExportLog(prev => [...prev, `💾 บันทึกสำเร็จลงพาท Finder: ${saveData.filePath}`]);
        }
      } catch (err: any) {
        console.error('Failed to save to local API:', err);
      }
    }

    if (!saved) {
      const link = document.createElement('a');
      link.download = name;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setBatchExportLog(prev => [...prev, `📥 ดาวน์โหลดอัตโนมัติ (Fallback): ${name}`]);
    }
  };

  // Video mixing pipeline via FFmpeg.wasm client-side
  const triggerBulkCreate = async () => {
    setIsBatchProcessing(true);
    setBulkProgress(0);
    setBatchExportLog([]);

    try {
      const isVideoMode = bgType === 'video' && bgVideos.length > 0;
      
      if (isVideoMode) {
        if (!ffmpegReady) {
          alert('ตัวประมวลผลวิดีโอยังไม่พร้อม กรุณารอสักครู่...');
          setIsBatchProcessing(false);
          return;
        }

        const ffmpeg = ffmpegRef.current;
        const { fetchFile } = await import('@ffmpeg/util');

        ffmpeg.on('log', ({ message }: { message: string }) => {
          if (message.includes('frame=') || message.includes('fps=') || message.includes('speed=')) {
            setBatchExportLog(prev => {
              const base = prev.slice(0, -1);
              return [...base, `⚡ Progress: ${message.trim()}`];
            });
          } else {
            setBatchExportLog(prev => [...prev.slice(-30), `⚙️ ${message.trim()}`]);
          }
        });

        for (let i = 0; i < batchCount; i++) {
          setBulkProgress(i + 1);
          setBatchExportLog(prev => [...prev, `📂 -------------------- EP.${epStart + i} / ${epStart + batchCount - 1} --------------------`]);
          
          let hasBgm = bgmFiles.length > 0;
          let bgmName = 'bgm.mp3';
          let epSequence: any[] = [];

          try {
            const content = batchContents[i] || '';
            const batchEls = getElementsForBatch(content);

            const finalEls = batchEls.map(el => {
              if (el.id === 'title_ep') {
                return { ...el, text: aiGenMode === 'headlines' ? '' : `EP.${epStart + i}` };
              }
              return el;
            });

            setBatchExportLog(prev => [...prev, `🎨 1. กำลังเรนเดอร์คำอักษรและบล็อกข้อความโปร่งใส...`]);
            const offscreen = document.createElement('canvas');
            drawCanvas(offscreen, finalEls, true);
            await new Promise(r => setTimeout(r, 250));

            const overlayDataUrl = offscreen.toDataURL('image/png');
            const overlayBase64 = overlayDataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
            const overlayBytes = Uint8Array.from(atob(overlayBase64), c => c.charCodeAt(0));
            await ffmpeg.writeFile('overlay.png', overlayBytes);

            setBatchExportLog(prev => [...prev, `🎬 2. กำลังจัดเรียงคลิปวิดีโอพื้นหลังให้ยาวครบ ${videoDuration} วินาที...`]);
            epSequence = sequenceVideos(bgVideos, videoDuration);
            if (epSequence.length === 0) {
              throw new Error('ไม่พบข้อมูลวิดีโอคลิปดิบที่ใช้งานได้');
            }

            if (hasBgm) {
              const pickedBgm = bgmFiles[Math.floor(Math.random() * bgmFiles.length)];
              setBatchExportLog(prev => [...prev, `🎵 2.5 กำลังโหลดเพลง BGM: ${pickedBgm.name} (Volume ${bgmVolume}%)`]);
              const bgmData = await fetchFile(pickedBgm);
              await ffmpeg.writeFile(bgmName, bgmData);
            }

            const args: string[] = [];
            let filterComplex = '';

            setBatchExportLog(prev => [...prev, `📦 3. ส่งข้อมูลวิดีโอและฟิลเตอร์เข้าเอนจิ้น...`]);
            for (let j = 0; j < epSequence.length; j++) {
              const clip = epSequence[j];
              const clipData = await fetchFile(clip.file);
              const clipName = `vid_${j}.mp4`;
              await ffmpeg.writeFile(clipName, clipData);
              
              args.push('-i', clipName);
              filterComplex += `[${j}:v]scale=1080:1920,setsar=1[v${j}];`;
            }

            args.push('-i', 'overlay.png');
            const overlayIdx = epSequence.length;

            if (hasBgm) {
              args.push('-stream_loop', '-1', '-i', bgmName);
            }

            if (epSequence.length === 1) {
              filterComplex += `[0:v]scale=1080:1920,setsar=1[bg];[bg][${overlayIdx}:v]overlay=0:0:format=auto[outv]`;
            } else {
              const concatInputs = Array.from({ length: epSequence.length }, (_, j) => `[v${j}]`).join('');
              filterComplex += `${concatInputs}concat=n=${epSequence.length}:v=1:a=0[bg];`;
              filterComplex += `[bg][${overlayIdx}:v]overlay=0:0:format=auto[outv]`;
            }

            if (hasBgm) {
              const bgmIdx = epSequence.length + 1;
              filterComplex += `;[${bgmIdx}:a]volume=${bgmVolume / 100}[outa]`;
            }

            args.push('-filter_complex', filterComplex);
            args.push('-map', '[outv]');
            if (hasBgm) {
              args.push('-map', '[outa]');
            }
            args.push('-t', String(videoDuration));

            // FAST DECODE SPEEDUP ARGS
            if (hasBgm) {
              args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'fastdecode', '-sn', '-c:a', 'aac', '-b:a', '128k');
            } else {
              args.push('-c:v', 'libx264', '-preset', 'ultrafast', '-tune', 'fastdecode', '-sn', '-an');
            }
            args.push('-pix_fmt', 'yuv420p');
            args.push('-y', 'output_ep.mp4');

            setBatchExportLog(prev => [...prev, `⚡ 4. เริ่มประมวลผลเรนเดอร์ความเร็วสูงพิเศษ (Ultrafast preset)...`]);
            await ffmpeg.exec(args);

            setBatchExportLog(prev => [...prev, `💾 5. ส่งวิดีโอเข้าส่วนส่งออก Finder...`]);
            const renderedVideo = await ffmpeg.readFile('output_ep.mp4');
            const videoBlob = new Blob([renderedVideo], { type: 'video/mp4' });
            const videoName = `quote_ep_${epStart + i}.mp4`;
            await saveSingleFile(videoBlob, videoName);

          } catch (innerErr: any) {
            console.error(`EP.${epStart + i} failed:`, innerErr);
            setBatchExportLog(prev => [...prev, `❌ EP.${epStart + i} ผิดพลาด: ${innerErr.message}`]);
          } finally {
            // Clean up files in memory FS
            try { await ffmpeg.deleteFile('overlay.png'); } catch (e) {}
            try { await ffmpeg.deleteFile('output_ep.mp4'); } catch (e) {}
            if (hasBgm) {
              try { await ffmpeg.deleteFile(bgmName); } catch (e) {}
            }
            if (epSequence && epSequence.length > 0) {
              for (let j = 0; j < epSequence.length; j++) {
                try { await ffmpeg.deleteFile(`vid_${j}.mp4`); } catch (e) {}
              }
            }
          }
        }
      } else {
        // IMAGE MODE EXPORT (Render image canvas)
        for (let i = 0; i < batchCount; i++) {
          setBulkProgress(i + 1);
          setBatchExportLog(prev => [...prev, `🎨 กำลังเรนเดอร์ภาพที่ #${epStart + i} ...`]);
          const content = batchContents[i] || '';
          const batchEls = getElementsForBatch(content);

          const finalEls = batchEls.map(el => {
            if (el.id === 'title_ep') {
              return { ...el, text: aiGenMode === 'headlines' ? '' : `EP.${epStart + i}` };
            }
            return el;
          });

          const offscreen = document.createElement('canvas');
          drawCanvas(offscreen, finalEls);
          await new Promise(r => setTimeout(r, 200));

          const dataUrl = offscreen.toDataURL('image/png');
          const base64 = dataUrl.replace(/^data:image\/(png|jpeg);base64,/, '');
          const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
          const imageBlob = new Blob([imageBytes], { type: 'image/png' });
          const imageName = `quote_ep_${epStart + i}.png`;
          await saveSingleFile(imageBlob, imageName);
        }
      }
      setBatchExportLog(prev => [...prev, `🎉 สร้างคลิปคำคมแบบชุดรวม ${batchCount} รายการเสร็จสิ้นหมดแล้ว!`]);
      alert(`🎉 ประมวลผลและส่งออกไฟล์คำคมครบถ้วนสำเร็จ!`);
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการรัน Batch: ' + err.message);
    } finally {
      setIsBatchProcessing(false);
    }
  };

  // AI Prompt Mindset Generation
  const generateContentWithAI = async () => {
    const apiKey = localStorage.getItem('openrouter_key')?.trim();
    if (!apiKey) {
      alert('กรุณากรอกคีย์ OpenRouter ในหน้าตั้งค่าก่อนใช้ AI คลีนเนอร์สร้างบทความ');
      return;
    }
    if (!activeTemplate) return;

    const blockIds = elements.filter(el => el.type === 'text-block').map(el => el.id);
    const blockCount = blockIds.length;
    if (blockCount === 0) {
      alert('ไม่พบข้อความตัวหนังสือแบบหลายบรรทัดในเทมเพลตนี้');
      return;
    }

    let totalEps = 0;
    let headlines: string[] = [];

    if (aiGenMode === 'headlines') {
      headlines = aiCustomHeadlines.split('\n').map(line => line.trim()).filter(Boolean);
      if (headlines.length === 0) {
        alert('กรุณากรอกหัวข้อพาดหัวอย่างน้อย 1 หัวข้อ (1 พาดหัวต่อ 1 บรรทัด)');
        return;
      }
      totalEps = headlines.length;
    } else {
      totalEps = epEnd - epStart + 1;
      if (totalEps < 1 || totalEps > 50) {
        alert('จำนวน EP ต้องอยู่ระหว่าง 1-50 เท่านั้น');
        return;
      }
    }

    setIsAiGenerating(true);
    setAiGenProgress(0);
    setAiGenLog([]);

    // Initialize batch count and contents immediately so UI responds and updates in real-time
    setBatchCount(totalEps);
    const initializedContents = Array.from({ length: totalEps }, (_, idx) => batchContents[idx] || '');
    setBatchContents(initializedContents);

    const topicContext = aiTopic.trim() || activeTemplate.name;

    try {
      for (let i = 0; i < totalEps; i++) {
        const epNum = aiGenMode === 'headlines' ? (i + 1) : (epStart + i);
        setAiGenProgress(i + 1);

        let currentHeadline = '';
        if (aiGenMode === 'headlines') {
          currentHeadline = headlines[i];
          setAiGenLog(prev => [...prev, `🔄 [พาดหัว] กำลังเรียก AI สร้างจากหัวข้อ: "${currentHeadline}"...`]);
        } else {
          setAiGenLog(prev => [...prev, `🔄 [ซีรีส์] กำลังเรียก AI สร้างตอนที่ EP.${epNum}...`]);
        }

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout to prevent hanging

          // Define system message based on mode & tone
          let systemContent = '';
          if (aiGenMode === 'headlines') {
            if (aiTone === 'trader_secrets') {
              systemContent = `คุณคือสุดยอดพี่เลี้ยงเทรดเดอร์ในระดับตำนาน (Senior Trader Mentor) มี Mindset และแนวคิดของเศรษฐีนักลงทุนความนิ่งในระดับโลก
พาดหัวหลักบทนี้: "${currentHeadline}"
จำนวนบล็อกข้อความทั้งหมด: ${blockCount} บล็อก

งานของคุณ:
1. สำหรับบล็อกที่ 1 (Hook เปิดพาดหัว): ให้ใช้พาดหัวหลักนี้โดยตรงหรือปรับแต่งวรรคตอนให้สวยงาม (ห้ามเปลี่ยนความหมายเด็ดขาด): "${currentHeadline}" โดยใช้เครื่องหมายขึ้นบรรทัดใหม่ \\n ตัดวรรคให้อ่านง่าย
2. สำหรับบล็อกที่เหลืออีก ${blockCount - 1} บล็อก: ให้คุณเขียนแต่งต่อให้จบความสอดคล้องกันอย่างมีมิติ
   - บล็อกที่ 2 (Deep Truth เผยความต่างของผู้ชนะ): แนะนำระบบความเสี่ยง การฝึกใจ การทำสมาธิ หรือออกกำลังกายเพื่อให้เทรดนิ่ง
   - บล็อกที่ 3 (Action/วินัย ดึงสติ): วาทะเตือนสติเรื่องรอจังหวะนิ่งๆ คุมอารมณ์อยู่รอดระยะยาว
   - บล็อกที่ 4 (หากมี): เขียนบทสรุป/Action Plan สั้นๆ หรือเตือนใจ

ไวยากรณ์และกฎโครงสร้างสำนวน "ความลับเทรดเดอร์":
1. น้ำเสียง (Tone & Voice):
   - เล่าเรื่องดุดัน ตรงไปตรงมา กระตุกความคิด ดึงสติ สัจธรรมจริงจัง ไม่ใช้คำประดิษฐ์ทางการเกินไป
2. ความยาวบรรทัดและการจัดวรรคตอน (สำคัญที่สุด):
   - แต่ละบล็อกเขียนวรรคสั้นๆ (2-4 บรรทัดต่อบล็อก) โดยใช้เครื่องหมายตัดคำขึ้นบรรทัดใหม่ \\n เสมอ
   - แต่ละบรรทัดห้ามมีความยาวเกิน 25 ตัวอักษรเด็ดขาด! เพื่อให้อ่านในกล่องดำแนวนอนแนวนอนได้อย่างลงตัวสูงสุด
   - ห้ามมีคำว่า "EP", "EP.", "ตอนที่", อีโมจิ หรือแฮชแท็กในกล่องข้อความบรรยาย

ส่งข้อมูลกลับในโครงสร้าง JSON Object ด้านล่างนี้เท่านั้น:
{
  "blocks": [
    "พาดหัวหลักที่มีการใช้\\n",
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก2",
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก3",
    ...
  ]
}`;
            } else {
              systemContent = `คุณคือนักเขียนคำคมกระตุ้นความคิดสำหรับโซเชียลมีเดียแนวตั้งภาษาไทย
พาดหัวหลักบทนี้: "${currentHeadline}"
จำนวนบล็อกข้อความทั้งหมด: ${blockCount} บล็อก

งานของคุณ:
1. สำหรับบล็อกที่ 1: ให้ใช้พาดหัวหลักนี้โดยตรงหรือปรับแต่งการแบ่งคำให้อ่านง่ายขึ้น (ห้ามเปลี่ยนความหมายเด็ดขาด): "${currentHeadline}" โดยใช้เครื่องหมายขึ้นบรรทัดใหม่ \\n ตัดวรรคไม่เกิน 25 ตัวอักษรต่อบรรทัด
2. สำหรับบล็อกที่เหลืออีก ${blockCount - 1} บล็อก: ให้เขียนแต่งต่อจากพาดหัวให้จบความสอดคล้องกันอย่างมีมิติ โดยแบ่งเป็นบล็อกละสั้นๆ
3. แต่ละบล็อกใช้ \\n ตัดคำไม่เกิน 25 ตัวอักษรต่อบรรทัด และตอบกลับเป็นโครงสร้าง JSON: {"blocks": ["...", "..."]}`;
            }
          } else {
            // Series Mode prompts
            if (aiTone === 'trader_secrets') {
              systemContent = `คุณคือสุดยอดพี่เลี้ยงเทรดเดอร์ในระดับตำนาน (Senior Trader Mentor) มี Mindset และแนวคิดของเศรษฐีนักลงทุนความนิ่งในระดับโลก
หัวข้อหลักในการเจนซีรีส์บทความชุดนี้: "${topicContext}"
คุณกำลังเขียนบทความตอนปัจจุบันคือตอนที่: EP.${epNum} (จากซีรีส์ ${totalEps} ตอน)
จำนวนบล็อกข้อความในตอนคำคมนี้ทั้งหมด: ${blockCount} บล็อก

งานของคุณ:
1. สำหรับตอน EP.${epNum} นี้ ให้เขียนข้อความคำคมแบ่งย่อยเป็น ${blockCount} บล็อกสลักใจ สอดคล้องและต่อเนื่องกัน
   - บล็อกที่ 1 (Hook เปิดประเด็นชวนคิด): เปิดบทเรียนสำคัญ หรือ คำถามกระตุ้นความอยากรู้ ดึงความสนใจใน 2-3 บรรทัดแรก
   - บล็อกที่ 2 (Deep Truth เผยความจริงที่คนทั่วไปไม่เข้าใจ): แนะนำความสำคัญในระดับจิตใต้สำนึก จิตวิทยาการคุมอารมณ์ การหยุดความโลภ หรือการฝึกออกกำลังกาย สมาธิ เพื่อบ่มวินัยในใจ
   - บล็อกที่ 3 (Action/วินัย ดึงสติ): ชี้หนทางปฏิบัติจริง การหยุดใช้อารมณ์รอจังหวะ และความจริงเรื่องการพ่ายแพ้เพื่อรักษาเงินทุนให้อยู่รอดระยะยาว
   - บล็อกที่ 4 (หากมี): บทสรุป หรือ คติเตือนใจในท้ายตอนสั้นๆ

ไวยากรณ์และกฎโครงสร้างสำนวน "ความลับเทรดเดอร์":
1. น้ำเสียง (Tone & Voice):
   - เล่าเรื่องดุดัน ตรงไปตรงมา กระตุกความคิด ดึงสติ สัจธรรมจริงจัง ไม่ใช้คำประดิษฐ์ทางการเกินไป
2. ความยาวบรรทัดและการจัดวรรคตอน (สำคัญที่สุด):
   - แต่ละบล็อกเขียนวรรคสั้นๆ (2-4 บรรทัดต่อบล็อก) โดยใช้เครื่องหมายตัดคำขึ้นบรรทัดใหม่ \\n เสมอ
   - แต่ละบรรทัดห้ามมีความยาวเกิน 25 ตัวอักษรเด็ดขาด! เพื่อให้อ่านในกล่องดำแนวนอนแนวนอนได้อย่างลงตัวสูงสุด
   - ห้ามมีคำว่า "EP", "EP.", "ตอนที่", อีโมจิ หรือแฮชแท็กในกล่องข้อความบรรยาย

ส่งข้อมูลกลับในโครงสร้าง JSON Object ด้านล่างนี้เท่านั้น:
{
  "blocks": [
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก1",
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก2",
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก3",
    ...
  ]
}`;
            } else {
              systemContent = `คุณคือนักเขียนบทความคำคมกระตุ้นความคิดสร้างสรรค์และทรงพลังทางโซเชียลมีเดีย
หัวข้อหลักในการเจน: "${topicContext}"
ตอนที่: EP.${epNum} จากทั้งหมด ${totalEps} ตอน
จำนวนบล็อกข้อความทั้งหมด: ${blockCount} บล็อก

งานของคุณ:
1. เขียนเนื้อหาคำคมตอน EP.${epNum} สรุปขยี้ลึกเป็นบล็อกจำนวน ${blockCount} บล็อก โดยสอดคล้องกันตลอดตอน
2. แต่ละบล็อกต้องสั้นกระชับ อ่านวรรคตอนง่าย มีมิติชวนให้หยุดอ่านลึกซึ้ง
3. ไวยากรณ์และโครงสร้างข้อความ:
   - บล็อกจะถูกนำไปแสดงในกล่องสีดำแนวนอนซ้อนกันตามลำดับ
   - ห้ามมีความยาวของแต่ละบรรทัดเกิน 25 ตัวอักษร
   - ใช้เครื่องหมายขึ้นบรรทัดใหม่ \\n ตัดวรรคบรรทัดให้อ่านง่าย
   - ห้ามเขียนหัวข้อ 'EP', 'EP.', 'ตอนที่', อีโมจิ หรือแฮชแท็ก
4. ตอบกลับเป็นโครงสร้าง JSON Object ด้านล่างนี้เท่านั้น:
{
  "blocks": [
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก1",
    "บรรทัดที่1\\nบรรทัดที่2 ของบล็อก2",
    ...
  ]
}`;
            }
          }

          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer ' + apiKey,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: DEFAULT_AI_MODEL,
              messages: [
                {
                  role: 'system',
                  content: systemContent
                },
                {
                  role: 'user',
                  content: aiGenMode === 'headlines'
                    ? `กรุณาประดิษฐ์และขยายความต่อจากพาดหัวหลักนี้ให้เสร็จสิ้นสวยงามเป็นจำนวน ${blockCount} บล็อกอย่างกลมกลืนตามกฎเกณฑ์: "${currentHeadline}"`
                    : `เขียนบทเรียนและคำเตือนตอน EP.${epNum} สำหรับหัวข้อ "${topicContext}" ให้ทรงพลังที่สุดจำนวน ${blockCount} บล็อก`
                }
              ],
              response_format: { type: "json_object" }
            }),
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (!resp.ok) {
            throw new Error(`HTTP ${resp.status} - ${resp.statusText}`);
          }

          const aiData = await resp.json();
          if (aiData.error) throw new Error(aiData.error.message || JSON.stringify(aiData.error));
          let aiText = aiData.choices?.[0]?.message?.content || '';

          // Clean markdown backticks if any
          if (aiText.includes('```json')) {
            aiText = aiText.substring(aiText.indexOf('```json') + 7);
            aiText = aiText.substring(0, aiText.lastIndexOf('```'));
          } else if (aiText.includes('```')) {
            aiText = aiText.substring(aiText.indexOf('```') + 3);
            aiText = aiText.substring(0, aiText.lastIndexOf('```'));
          }
          aiText = aiText.trim();

          const parsed = JSON.parse(aiText);
          const epBlocks = parsed.blocks || [];
          const contentJoined = epBlocks.join('\\n\\n\\n'); // Separate text-blocks with triple newlines

          setBatchContents(prev => {
            const next = [...prev];
            // Safe guard length
            while (next.length < totalEps) {
              next.push('');
            }
            next[i] = contentJoined;
            return next;
          });
          setAiGenLog(prev => [...prev, `✅ เสร็จสมบูรณ์ ตอน EP.${epNum}`]);

        } catch (innerErr: any) {
          console.error(`EP.${epNum} generation error:`, innerErr);
          setAiGenLog(prev => [
            ...prev,
            `❌ ล้มเหลว ตอน EP.${epNum}: ${innerErr.name === 'AbortError' ? 'หมดเวลาเชื่อมต่อ (Timeout 25s)' : (innerErr.message || String(innerErr))}`
          ]);
        }

        // Brief delay between calls
        await new Promise(r => setTimeout(r, 200));
      }

      setPreviewIndex(0);
      alert('🎉 ปัญญาประดิษฐ์สรุปบทความคำคมแบบซีรีส์ต่อเนื่องเสร็จสิ้นแล้วครับ!');
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาดในการรันระบบ AI: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Open Destination Folder in Finder
  const handleOpenFolder = async () => {
    try {
      if (outputPath) {
        await fetch(`/api/open-folder?type=${encodeURIComponent(outputPath)}`);
      } else {
        alert('กรุณากรอกหรือเลือกโฟลเดอร์ปลายทางก่อนครับ');
      }
    } catch (error) {
      console.error("Failed to open folder", error);
    }
  };

  const handleChooseDirectory = async () => {
    try {
      const res = await fetch('/api/pick-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'เลือกโฟลเดอร์สำหรับบันทึกวิดีโอคำคม' })
      });
      const data = await res.json();
      if (data.success && data.dir) {
        setOutputPath(data.dir);
        localStorage.setItem('custom_output_folder', data.dir);
      }
    } catch (error) {
      console.error("Failed to pick folder", error);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="space-y-6 w-full">
        {/* Section 1: Template and Background setup */}
        <div className="glass-panel p-5 space-y-4 border border-[var(--border-glass)] rounded-xl bg-slate-900/40">
          <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Sliders className="w-3.5 h-3.5 text-yellow-400" />
            ⚙️ ตั้งค่าโครงร่างพื้นหลังและวัตถุดิบ (Background & Assets)
          </h4>

          <div className="space-y-4">
            {/* Template selector */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono font-bold text-slate-400 block">📐 เทมเพลตต้นแบบสำเร็จรูป</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {BUILT_IN_TEMPLATES.map(tpl => (
                  <button
                    key={tpl.id}
                    onClick={() => selectTemplate(tpl)}
                    className={`p-3 text-xs font-bold rounded-lg border text-left flex items-center gap-3 cursor-pointer transition-all active:scale-[0.98] ${activeTemplate?.id === tpl.id ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300 ring-1 ring-cyan-500/20 shadow-md shadow-cyan-500/5' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:border-slate-700'}`}
                  >
                    <span className="text-xl shrink-0 p-1.5 bg-slate-950/60 rounded-md leading-none">{tpl.icon}</span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm text-slate-200">{tpl.name}</p>
                      <p className="text-[10px] text-slate-500 font-sans font-normal truncate mt-0.5">{tpl.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Aspect Ratio background type & Configs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 block">🖼️ ชนิดมีเดียพื้นหลัง</label>
                <div className="flex gap-2">
                  {(['image', 'video'] as const).map(type => (
                    <button
                      key={type}
                      onClick={() => setBgType(type)}
                      className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg border cursor-pointer uppercase tracking-wider text-center transition-all active:scale-[0.98] ${bgType === type ? 'border-yellow-400 bg-yellow-400/10 text-yellow-300 ring-1 ring-yellow-500/20' : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:text-white hover:border-slate-700'}`}
                    >
                      {type === 'image' ? '📸 รูปภาพนิ่ง' : '🎬 คลิปวิดีโอหมุนเวียน'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conditional render depending on bg type to align height */}
              {bgType === 'image' && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-400 block">📸 ภาพนิ่งคลังพื้นหลัง</label>
                  <input
                    type="text"
                    placeholder="ใส่ลิ้งก์ URL ของรูปภาพ หรือปล่อยว่าง..."
                    value={bgImage}
                    onChange={(e) => setBgImage(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-400 min-h-[38px]"
                  />
                </div>
              )}

              {bgType === 'video' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-slate-400 block">🎬 วิดีโอดิบพื้นหลัง ({bgVideos.length} คลิป)</label>
                    {bgVideos.length > 0 && (
                      <button 
                        onClick={() => { setBgVideos([]); setVideoSequence([]); }}
                        className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                      >
                        [ล้างคลัง]
                      </button>
                    )}
                  </div>
                  <label className="w-full px-3 py-2 text-xs border border-dashed border-slate-700 bg-slate-900/55 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:border-cyan-400 hover:text-white transition-all text-slate-400 min-h-[38px]">
                    <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="truncate">{bgVideos.length > 0 ? `โหลดแล้ว ${bgVideos.length} คลิป` : 'อัพโหลดวิดีโอดิบ'}</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="video/*" 
                      {...{ webkitdirectory: "", directory: "" } as any}
                      className="hidden" 
                      onChange={handleVideoUpload} 
                    />
                  </label>
                </div>
              )}
            </div>
          </div>

          {bgType === 'video' && (
            <div className="space-y-4 pt-3 border-t border-slate-800/60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Background Music BGM Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-mono font-bold text-slate-400 block">🎵 เพลงดนตรีประกอบ BGM</label>
                    {bgmFiles.length > 0 && (
                      <button 
                        onClick={() => setBgmFiles([])} 
                        className="text-[9px] text-rose-500 hover:underline cursor-pointer"
                      >
                        [ล้างเพลง]
                      </button>
                    )}
                  </div>
                  <label className="w-full px-3 py-2 text-xs border border-dashed border-slate-700 bg-slate-900/55 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer hover:border-yellow-400 hover:text-white transition-all text-slate-400 min-h-[38px]">
                    <Music className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                    <span className="truncate">{bgmFiles.length > 0 ? `โหลดเพลงแล้ว ${bgmFiles.length} ไฟล์` : 'อัพโหลดเพลงประกอบ (BGM)'}</span>
                    <input 
                      type="file" 
                      multiple 
                      accept="audio/*" 
                      className="hidden" 
                      onChange={handleBgmUpload} 
                    />
                  </label>
                </div>

                {/* BGM volume controller */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-400 block">🔊 ความดังเสียง BGM ({bgmVolume}%)</label>
                  <div className="flex items-center h-[38px] px-2 bg-slate-950/50 border border-slate-850 rounded-lg">
                    <input
                      type="range"
                      min="1"
                      max="100"
                      value={bgmVolume}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setBgmVolume(val);
                        localStorage.setItem('canvas_bgm_volume', String(val));
                      }}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-400"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Max video length limit */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-400 block">⏱️ ความยาวคลิปเป้าหมาย (วินาที)</label>
                  <input
                    type="number"
                    value={videoDuration}
                    onChange={(e) => {
                      const val = Math.max(3, Number(e.target.value) || 15);
                      setVideoDuration(val);
                      generateSequence(bgVideos, val);
                    }}
                    className="w-full p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono focus:border-cyan-400 text-center"
                  />
                </div>

                {/* Color filter tint selection */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-400 block">🎨 โทนสีย้อมวิดีโอ (Filter)</label>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value)}
                    className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono focus:border-cyan-400 h-[34px]"
                  >
                    <option value="none">Normal (ต้นฉบับ)</option>
                    <option value="dark">Dark overlay (ย้อมดำเงา)</option>
                    <option value="vintage">Vintage (สีส้มเก่าคลาสสิก)</option>
                    <option value="warm">Warm tone (ส้มสาดแสง)</option>
                    <option value="cool">Cool blue (ฟ้าเท่ไซเบอร์)</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: AI Mindset Content Generator */}
        <div className="glass-panel p-5 space-y-4 border border-[var(--border-glass)] rounded-xl bg-slate-900/40">
          <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            🧠 ปัญญาประดิษฐ์สร้างบทคำคมซีรีส์ต่อเนื่อง (AI Copywriting Generator)
          </h4>

          {/* Mode Selector */}
          <div className="flex gap-2 p-0.5 bg-slate-950/60 rounded-lg border border-slate-850">
            <button
              type="button"
              onClick={() => setAiGenMode('series')}
              className={`flex-1 py-1.5 text-[10px] sm:text-xs font-bold font-mono rounded-md transition-all cursor-pointer text-center ${
                aiGenMode === 'series'
                  ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-sm shadow-cyan-500/5'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              🧠 เจนแบบซีรีส์ (Auto Series)
            </button>
            <button
              type="button"
              onClick={() => setAiGenMode('headlines')}
              className={`flex-1 py-1.5 text-[10px] sm:text-xs font-bold font-mono rounded-md transition-all cursor-pointer text-center ${
                aiGenMode === 'headlines'
                  ? 'bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 shadow-sm shadow-cyan-500/5'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              ✍️ กำหนดพาดหัวเอง (Custom Headlines)
            </button>
          </div>

          {aiGenMode === 'series' ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 block">หัวข้อหลักสำหรับเจนซีรีส์</label>
                <input
                  type="text"
                  placeholder="เช่น: จิตวิทยาการเทรด, การเงินคนรุ่นใหม่, นิสัยสร้างคนรวย"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  className="w-full p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-sans focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all h-[38px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 block">สำนวนการเล่า (Tone)</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value as any)}
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono focus:border-cyan-400 h-[38px] outline-none"
                >
                  <option value="trader_secrets">📈 ความลับเทรดเดอร์ (Mentor)</option>
                  <option value="general">✨ มินิมอลสะดุดหู (ทั่วไป)</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 block">
                  รายการพาดหัวพล็อตคำคม (พิมพ์ 1 พาดหัวต่อ 1 บรรทัด - AI จะแต่งเพิ่มอีก {elements.filter(el => el.type === 'text-block').length - 1} ช่องที่เหลือต่อให้สอดคล้องกัน)
                </label>
                <textarea
                  rows={4}
                  placeholder="เช่น:&#10;วินัยคือสะพานเชื่อมระหว่างเป้าหมายและความสำเร็จ&#10;คนชนะตัวจริงเขาไม่พูดเยอะ เขาทำโชว์&#10;ตลาดไม่แคร์ความรู้สึกของคุณ จำข้อนี้ให้ขึ้นใจ"
                  value={aiCustomHeadlines}
                  onChange={(e) => setAiCustomHeadlines(e.target.value)}
                  className="w-full p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-sans focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 block">สำนวนการเล่า (Tone)</label>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value as any)}
                  className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono focus:border-cyan-400 h-[38px] outline-none"
                >
                  <option value="trader_secrets">📈 ความลับเทรดเดอร์ (Mentor)</option>
                  <option value="general">✨ มินิมอลสะดุดหู (ทั่วไป)</option>
                </select>
                
                <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-lg mt-3 text-[10px] text-slate-400 leading-relaxed font-sans">
                  💡 <span className="text-cyan-300 font-bold">โหมดกำหนดพาดหัวเอง:</span> AI จะยึดเอาพาดหัวที่คุณกรอกในแต่ละบรรทัดมาเป็น <span className="text-white font-bold">กล่องบรรทัดที่ 1 (Hook)</span> และจะใช้ปัญญาประดิษฐ์แต่งขยายต่อในช่องที่เหลือให้อย่างสวยงามในระดับมืออาชีพ
                </div>
              </div>
            </div>
          )}

          {aiGenMode === 'series' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
              <div className="grid grid-cols-2 gap-2 sm:col-span-1">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-400 block">เริ่ม (EP Start)</label>
                  <input
                    type="number"
                    value={epStart}
                    onChange={(e) => setEpStart(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono text-center focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none h-[38px]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono font-bold text-slate-400 block">สิ้นสุด (EP End)</label>
                  <input
                    type="number"
                    value={epEnd}
                    onChange={(e) => setEpEnd(Math.max(1, Number(e.target.value) || 5))}
                    className="w-full p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono text-center focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none h-[38px]"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  onClick={generateContentWithAI}
                  disabled={isAiGenerating}
                  className="w-full h-[38px] rounded-lg bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-mono font-bold text-xs shadow flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>กำลังเจนตอน EP.{aiGenProgress}...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                      <span>เจนสคริปต์แบบชุด ({epEnd - epStart + 1} ตอน)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex pt-1">
              <button
                onClick={generateContentWithAI}
                disabled={isAiGenerating}
                className="w-full h-[40px] rounded-lg bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-mono font-bold text-xs shadow flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer transition-all active:scale-[0.98]"
              >
                {isAiGenerating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>กำลังเจนจากพาดหัว: ตอนที่ {aiGenProgress} / {aiCustomHeadlines.split('\n').map(line => line.trim()).filter(Boolean).length}...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                    <span>⚡ เจนสคริปต์สอดคล้องตามรายการพาดหัว ({aiCustomHeadlines.split('\n').map(line => line.trim()).filter(Boolean).length} ตอน) ⚡</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* AI Generation Log terminal */}
          {aiGenLog.length > 0 && (
            <div className="p-3 bg-black/90 border border-slate-850 rounded-lg font-mono text-[10px] text-cyan-400 space-y-1 max-h-28 overflow-y-auto leading-relaxed">
              {aiGenLog.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Merged WYSIWYG 9:16 Editor & Content Controller */}
        <div className="glass-panel p-5 space-y-4 border border-[var(--border-glass)] rounded-xl bg-slate-900/40">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
            <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5">
              <Type className="w-3.5 h-3.5 text-cyan-400" />
              📝 จัดการเนื้อหาตัวหนังสือในบล็อกพรีวิว (WYSIWYG 9:16 Editor & Content Manager)
            </h4>
            
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Preview Index Navigator */}
              {batchCount > 1 && (
                <div className="flex items-center gap-1.5 bg-slate-950/60 p-0.5 rounded-lg border border-slate-850">
                  <button
                    onClick={() => setPreviewIndex(prev => Math.max(0, prev - 1))}
                    disabled={previewIndex === 0}
                    className="px-2 py-0.5 text-[10px] font-bold font-mono text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer bg-slate-900 border border-slate-850 rounded transition-all"
                  >
                    ◄ ก่อนหน้า
                  </button>
                  <span className="text-[10px] font-mono text-cyan-400 font-bold px-1 select-none">
                    EP.{epStart + previewIndex} ({previewIndex + 1}/{batchCount})
                  </span>
                  <button
                    onClick={() => setPreviewIndex(prev => Math.min(batchCount - 1, prev + 1))}
                    disabled={previewIndex === batchCount - 1}
                    className="px-2 py-0.5 text-[10px] font-bold font-mono text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer bg-slate-900 border border-slate-850 rounded transition-all"
                  >
                    ถัดไป ►
                  </button>
                </div>
              )}

              {/* Batch count controller */}
              <div className="flex items-center gap-2">
                <label className="text-[10px] font-mono text-slate-500 uppercase">จำนวนตอนแบบชุด:</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={batchCount}
                  onChange={(e) => updateBatchCount(Number(e.target.value) || 1)}
                  className="w-12 p-1 text-[11px] bg-slate-950 border border-slate-850 rounded text-center text-yellow-400 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Side-by-Side split grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Left Col: Controls (lg:col-span-7) */}
            <div className="md:col-span-7 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono font-bold text-slate-400 block">
                  ✍️ แก้ไขข้อความในตอนพรีวิวที่แสดงอยู่ (ใช้เครื่องหมาย '\n' เพื่อขึ้นบรรทัดใหม่ และ '---' หรือขึ้นบรรทัดใหม่ 3 ครั้ง เพื่อแยกบล็อกข้อความ)
                </label>
                <textarea
                  rows={5}
                  value={batchContents[previewIndex] || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBatchContents(prev => {
                      const next = [...prev];
                      next[previewIndex] = val;
                      return next;
                    });
                  }}
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-850 rounded-lg text-white font-mono focus:border-cyan-400 leading-relaxed outline-none transition-all focus:ring-1 focus:ring-cyan-500/20"
                  placeholder="พิมพ์วรรคบรรยายตรงนี้..."
                />
              </div>

              {/* Spacing between blocks controller */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-mono font-bold text-slate-400">
                  <span>↕️ ระยะห่างระหว่างกล่องข้อความ ({blockMargin} px)</span>
                  <button
                    type="button"
                    onClick={() => setBlockMargin(16)}
                    className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold transition-all cursor-pointer"
                  >
                    รีเซ็ต (16px)
                  </button>
                </div>
                <div className="flex items-center h-[38px] px-3 bg-slate-950/50 border border-slate-850 rounded-lg">
                  <input
                    type="range"
                    min="0"
                    max="80"
                    value={blockMargin}
                    onChange={(e) => setBlockMargin(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 flex-1"
                  />
                </div>
              </div>

              {/* Elements parameters configuration */}
              {selectedElId ? (
                <div className="p-4 border border-slate-850 bg-slate-950/70 rounded-lg grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                  {/* Layer text editing */}
                  <div className="space-y-1.5 col-span-full">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase">ข้อความเลเยอร์ที่เลือก ({selectedElId})</label>
                    <input
                      type="text"
                      value={elements.find(el => el.id === selectedElId)?.text || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setElements(prev => prev.map(el => {
                          if (el.id === selectedElId) return { ...el, text: val };
                          return el;
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg font-sans text-white text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all h-[38px] px-3"
                    />
                  </div>

                  {/* Font Size */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase text-center block">ขนาดตัวหนังสือ</label>
                    <input
                      type="number"
                      value={elements.find(el => el.id === selectedElId)?.fontSize || 40}
                      onChange={(e) => {
                        const val = Number(e.target.value) || 20;
                        setElements(prev => prev.map(el => {
                          if (el.id === selectedElId) return { ...el, fontSize: val };
                          return el;
                        }));
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg font-mono text-white text-center text-sm focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all h-[38px]"
                    />
                  </div>

                  {/* Font Color */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase text-center block">สีตัวหนังสือ</label>
                    <div className="flex gap-2 items-center">
                      <input
                        type="color"
                        value={elements.find(el => el.id === selectedElId)?.color || '#FFFFFF'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setElements(prev => prev.map(el => {
                            if (el.id === selectedElId) return { ...el, color: val };
                            return el;
                          }));
                        }}
                        className="w-10 h-10 rounded-lg bg-transparent border-0 cursor-pointer overflow-hidden shrink-0"
                        style={{ padding: 0 }}
                      />
                      <input
                        type="text"
                        value={elements.find(el => el.id === selectedElId)?.color || '#FFFFFF'}
                        onChange={(e) => {
                          const val = e.target.value;
                          setElements(prev => prev.map(el => {
                            if (el.id === selectedElId) return { ...el, color: val };
                            return el;
                          }));
                        }}
                        className="w-full text-center bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all h-[38px]"
                      />
                    </div>
                  </div>

                  {/* Bold Toggle */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase text-center block">ตัวหนา</label>
                    <button
                      type="button"
                      onClick={() => {
                        setElements(prev => prev.map(el => {
                          if (el.id === selectedElId) return { ...el, bold: !el.bold };
                          return el;
                        }));
                      }}
                      className={`w-full h-[38px] rounded-lg border font-bold text-sm transition-all cursor-pointer ${
                        elements.find(el => el.id === selectedElId)?.bold
                          ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/5'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      B
                    </button>
                  </div>

                  {/* Alignment Group */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono font-bold text-slate-500 uppercase text-center block">การจัดแนว</label>
                    <div className="flex rounded-lg overflow-hidden border border-slate-800 bg-slate-900 p-0.5 h-[38px]">
                      {(['left', 'center', 'right'] as const).map(align => (
                        <button
                          key={align}
                          type="button"
                          onClick={() => {
                            setElements(prev => prev.map(el => {
                              if (el.id === selectedElId) return { ...el, textAlign: align };
                              return el;
                            }));
                          }}
                          className={`flex-1 py-1 px-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            elements.find(el => el.id === selectedElId)?.textAlign === align
                              ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-400/20'
                              : 'text-slate-400 hover:text-white border border-transparent'
                          }`}
                        >
                          {align === 'left' ? 'ซ้าย' : align === 'center' ? 'กลาง' : 'ขวา'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Background Box Settings Panel */}
                  <div className="border-t border-slate-800/80 pt-4 col-span-full space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-mono font-bold text-slate-300 flex items-center gap-2 select-none cursor-pointer">
                        <input
                          type="checkbox"
                          checked={elements.find(el => el.id === selectedElId)?.bgBox || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setElements(prev => prev.map(el => {
                              if (el.id === selectedElId) {
                                return {
                                  ...el,
                                  bgBox: val,
                                  bgBoxColor: el.bgBoxColor || 'rgba(0,0,0,0.55)',
                                  bgBoxRadius: el.bgBoxRadius ?? 20,
                                  bgBoxPaddingX: el.bgBoxPaddingX ?? 24,
                                  bgBoxPaddingY: el.bgBoxPaddingY ?? 18,
                                  bgBoxMode: el.bgBoxMode || 'full'
                                };
                              }
                              return el;
                            }));
                          }}
                          className="w-4 h-4 rounded bg-slate-900 border-slate-800 text-cyan-500 focus:ring-cyan-500 cursor-pointer"
                        />
                        กล่องพื้นหลังข้อความ
                      </label>
                    </div>
                    
                    {/* Render options conditionally if bgBox is enabled */}
                    {elements.find(el => el.id === selectedElId)?.bgBox && (() => {
                      const el = elements.find(e => e.id === selectedElId)!;
                      const { hex, opacity } = parseRgba(el.bgBoxColor || 'rgba(0,0,0,0.55)');
                      
                      return (
                        <div className="space-y-4 pt-3 border-t border-slate-900/60 text-xs">
                          {/* bgBoxMode selector (Full Width) */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">รูปแบบความยาวกล่อง</label>
                            <div className="flex gap-2">
                              {(['full', 'fit', 'line'] as const).map(mode => (
                                <button
                                  key={mode}
                                  type="button"
                                  onClick={() => {
                                    setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxMode: mode };
                                      return e;
                                    }));
                                  }}
                                  className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                                    (el.bgBoxMode || 'full') === mode
                                      ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300'
                                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                                  }`}
                                >
                                  {mode === 'full' ? 'เต็มขอบเขต' : mode === 'fit' ? 'ตามตัวอักษร' : 'แยกบรรทัด'}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Color and Opacity Row */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Color */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">สีพื้นหลัง</label>
                              <div className="flex gap-2 items-center">
                                <input
                                  type="color"
                                  value={hex}
                                  onChange={(e) => {
                                    const val = toRgba(e.target.value, opacity);
                                    setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxColor: val };
                                      return e;
                                    }));
                                  }}
                                  className="w-10 h-10 rounded bg-transparent border-0 cursor-pointer overflow-hidden shrink-0"
                                  style={{ padding: 0 }}
                                />
                                <input
                                  type="text"
                                  value={hex.toUpperCase()}
                                  onChange={(e) => {
                                    const val = toRgba(e.target.value, opacity);
                                    setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxColor: val };
                                      return e;
                                    }));
                                  }}
                                  className="w-full p-2 text-center bg-slate-900 border border-slate-800 rounded-lg font-mono text-xs text-white h-[40px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                                />
                              </div>
                            </div>

                            {/* Opacity */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block">ความทึบ: {opacity}%</label>
                              <div className="flex items-center h-[40px] px-3 bg-slate-900 border border-slate-800 rounded-lg">
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  value={opacity}
                                  onChange={(e) => {
                                    const op = Number(e.target.value);
                                    const val = toRgba(hex, op);
                                    setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxColor: val };
                                      return e;
                                    }));
                                  }}
                                  className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Radius and Paddings (3 Columns) */}
                          <div className="grid grid-cols-3 gap-3">
                            {/* Radius */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block text-center truncate">ขอบมน (Radius)</label>
                              <input
                                type="number"
                                value={el.bgBoxRadius ?? 20}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxRadius: val };
                                      return e;
                                  }));
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-white text-center text-xs h-[38px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                              />
                            </div>

                            {/* Padding X */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block text-center truncate">ขอบซ้าย-ขวา (Pad X)</label>
                              <input
                                type="number"
                                value={el.bgBoxPaddingX ?? 24}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxPaddingX: val };
                                      return e;
                                  }));
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-white text-center text-xs h-[38px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                              />
                            </div>

                            {/* Padding Y */}
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase block text-center truncate">ขอบบน-ล่าง (Pad Y)</label>
                              <input
                                type="number"
                                value={el.bgBoxPaddingY ?? 18}
                                onChange={(e) => {
                                  const val = Math.max(0, Number(e.target.value) || 0);
                                  setElements(prev => prev.map(e => {
                                      if (e.id === selectedElId) return { ...e, bgBoxPaddingY: val };
                                      return e;
                                  }));
                                }}
                                className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg font-mono text-white text-center text-xs h-[38px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/20 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="p-4 border border-dashed border-slate-800 bg-slate-950/30 rounded-xl text-center text-xs text-slate-500 leading-relaxed font-sans mt-2">
                  💡 คลิกเลือกกล่องคำคมหรือองค์ประกอบตัวหนังสือบน <span className="text-cyan-400 font-bold">จอพรีวิวพรีเมียมทางขวา</span> เพื่อเปิดแผงตั้งค่าการปรับแต่งฟอนต์ ขนาด สี และขอบกล่องดำได้ที่นี่ทันทีครับ
                </div>
              )}
            </div>

            {/* Right Col: Live Preview Canvas (lg:col-span-5) */}
            <div className="md:col-span-5 flex flex-col items-center p-4 border border-slate-850 bg-slate-950/40 rounded-xl space-y-3">
              <div className="w-full flex justify-between items-center border-b border-slate-900 pb-2">
                <span className="text-[11px] font-mono font-bold text-slate-300 uppercase flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                  พรีวิวหน้าจอ 9:16
                </span>
                <span className="text-[9px] text-slate-500 font-mono">ลากวางพิกัดได้อิสระ</span>
              </div>

              <div
                ref={containerRef}
                className="flex justify-center bg-black/45 rounded-xl p-3 border border-slate-850/80 w-full relative overflow-hidden shadow-xl"
                style={{ cursor: isDragging ? 'grabbing' : 'default' }}
              >
                <canvas
                  ref={canvasRef}
                  className="max-w-full border border-slate-800 rounded-lg shadow-2xl"
                  style={{ maxHeight: '55vh', cursor: selectedElId ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                />
                <video
                  ref={videoRef}
                  style={{ display: 'none' }}
                  onEnded={handleVideoEnded}
                  muted
                  playsInline
                />
              </div>
              
              <p className="text-[10px] text-slate-500 text-center italic font-mono leading-relaxed">
                💡 คลิกเลือกวัตถุบนจอพรีวิว → ลากย้ายตำแหน่งได้อิสระ → แก้ไขรายละเอียดข้อความ สี และขนาดได้ที่เลเยอร์ด้านซ้าย
              </p>
            </div>
          </div>
        </div>

        {/* Section 4: Export to Finder & Compilation */}
        <div className="glass-panel p-5 space-y-4 border border-[var(--border-glass)] rounded-xl bg-slate-900/40">
          <h4 className="text-xs font-mono font-bold text-white uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            💾 ศูนย์ส่งออกไฟล์คำคมสู่ Finder (Output Configuration)
          </h4>

          {/* Folder Destination selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono font-bold text-slate-400 block">📁 โฟลเดอร์ปลายทางสำหรับบันทึกผลลัพธ์</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={outputPath}
                onChange={(e) => {
                  setOutputPath(e.target.value);
                  localStorage.setItem('custom_output_folder', e.target.value);
                }}
                className="flex-1 p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono"
                placeholder="/Users/paulpolsulintaboon/Desktop/Done"
                style={{ minHeight: '38px' }}
              />
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleChooseDirectory}
                  className="px-4 py-2 bg-slate-850 hover:bg-slate-750 border border-slate-700 text-white font-mono text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all hover:text-cyan-400 active:scale-[0.98]"
                  style={{ minHeight: '38px' }}
                >
                  <Folder className="w-3.5 h-3.5 text-cyan-400" />
                  <span>เลือกโฟลเดอร์</span>
                </button>
                <button
                  onClick={handleOpenFolder}
                  className="px-4 py-2 border border-slate-750 bg-slate-850 hover:bg-slate-800 text-slate-300 font-mono text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all hover:text-yellow-400 active:scale-[0.98]"
                  style={{ minHeight: '38px' }}
                >
                  <FolderOpen className="w-3.5 h-3.5 text-yellow-400" />
                  <span>เปิดโฟลเดอร์</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action compilation trigger */}
          <div className="space-y-3 pt-2">
            <button
              onClick={triggerBulkCreate}
              disabled={isBatchProcessing || (bgType === 'video' && bgVideos.length === 0)}
              className="w-full h-[42px] rounded-xl bg-gradient-to-r from-emerald-700 to-green-600 hover:from-emerald-600 hover:to-green-500 text-white font-mono font-bold text-sm shadow-lg hover:shadow-emerald-500/10 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer transition-all active:scale-[0.99]"
            >
              {isBatchProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>กำลังเรนเดอร์คำคมชุด EP.{batchProgress} / {batchCount}...</span>
                </>
              ) : (
                <>
                  <FileVideo className="w-4 h-4 text-emerald-300 animate-bounce" />
                  <span>⚡ สั่งเรนเดอร์และประมวลผลคำคม ({batchCount} ตอน) แบบชุด ⚡</span>
                </>
              )}
            </button>

            {bgType === 'video' && bgVideos.length === 0 && (
              <p className="text-[10px] text-amber-500 flex items-center gap-1 font-mono justify-center">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                <span>* จำเป็นต้องอัพโหลดไฟล์วิดีโอดิบคลังพื้นหลังด้านบนก่อน จึงจะสามารถคลิกสั่งเรนเดอร์ได้</span>
              </p>
            )}
          </div>

          {/* Compilation log panel */}
          {batchExportLog.length > 0 && (
            <div className="p-4 bg-black border border-slate-850 rounded-lg font-mono text-[10px] text-green-400 space-y-1.5 max-h-48 overflow-y-auto leading-relaxed shadow-inner">
              {batchExportLog.map((log, idx) => (
                <p key={idx}>{log}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
