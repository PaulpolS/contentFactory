// ═══════════════════════════════════════════════════════════════════
// 🖼️ ตัดต่อรูปคำคม (Quote Image Editor)
// วางข้อความคำคม/เครดิตเพจ ทับบนรูป footage ด้วย Canvas แบบ batch
// - เลือกโฟลเดอร์รูปต้นทาง/ปลายทาง, ใส่คำคมเอง (1 บรรทัด = 1 แคปชั่น)
// - หรือให้ AI เขียนให้ (Kie.ai API จากหน้าตั้งค่า) พร้อมบันทึก "สมอง" ไว้ใช้ซ้ำ
// - Preview ลาก-วาง-ปรับขนาดกล่องได้ด้วยเมาส์ ค่าที่ปรับใช้เรนเดอร์จริงเลย
// ═══════════════════════════════════════════════════════════════════
import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Image as ImageIcon,
  FolderOpen,
  Play,
  Pause,
  Square,
  Plus,
  Trash2,
  Brain,
  Sparkles,
  Save,
  Terminal,
  Type,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  Shuffle,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { getKieKey } from '../lib/llm';

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

// ── ฟอนต์ไทยจาก Google Fonts (โหลดครั้งเดียวตอน mount) ──
const FONT_FAMILIES: { name: string; weights?: string }[] = [
  { name: 'Kanit', weights: '400;700' },
  { name: 'Prompt', weights: '400;700' },
  { name: 'Mitr', weights: '400;700' },
  { name: 'Sarabun', weights: '400;700' },
  { name: 'Bai Jamjuree', weights: '400;700' },
  { name: 'Chakra Petch', weights: '400;700' },
  { name: 'Athiti', weights: '400;700' },
  { name: 'Charm', weights: '400;700' },
  { name: 'Charmonman', weights: '400;700' },
  { name: 'Chonburi' },
  { name: 'Fahkwang', weights: '400;700' },
  { name: 'Itim' },
  { name: 'K2D', weights: '400;700' },
  { name: 'Kodchasan', weights: '400;700' },
  { name: 'Krub', weights: '400;700' },
  { name: 'Mali', weights: '400;700' },
  { name: 'Maitree', weights: '400;700' },
  { name: 'Niramit', weights: '400;700' },
  { name: 'Pattaya' },
  { name: 'Pridi', weights: '400;700' },
  { name: 'Sriracha' },
  { name: 'Srisakdi', weights: '400;700' },
  { name: 'Taviraj', weights: '400;700' },
  { name: 'Thasadith', weights: '400;700' },
  { name: 'Trirong', weights: '400;700' },
  { name: 'IBM Plex Sans Thai', weights: '400;700' },
  { name: 'Noto Sans Thai', weights: '400;700' },
  { name: 'Noto Serif Thai', weights: '400;700' },
];

const FONT_LINK_ID = 'quoteimg-google-fonts';
const ensureFontsLoaded = () => {
  if (document.getElementById(FONT_LINK_ID)) return;
  const families = FONT_FAMILIES
    .map(f => `family=${f.name.replace(/ /g, '+')}${f.weights ? `:wght@${f.weights}` : ''}`)
    .join('&');
  const link = document.createElement('link');
  link.id = FONT_LINK_ID;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  document.head.appendChild(link);
};

// ── เอฟเฟคตัวอักษร ──
const TEXT_EFFECTS: { id: string; label: string }[] = [
  { id: 'none', label: 'ไม่มีเอฟเฟค' },
  { id: 'shadow', label: 'เงานุ่ม (Soft Shadow)' },
  { id: 'shadow-hard', label: 'เงาคมชัด (Hard Shadow)' },
  { id: 'outline', label: 'ขอบดำ (Outline)' },
  { id: 'outline-white', label: 'ขอบขาว (White Outline)' },
  { id: 'outline-shadow', label: 'ขอบดำ + เงา' },
  { id: 'glow-white', label: 'เรืองแสงขาว (Glow)' },
  { id: 'glow-gold', label: 'เรืองแสงทอง (Gold Glow)' },
  { id: 'neon', label: 'นีออน (ตามสีตัวอักษร)' },
  { id: '3d', label: 'นูน 3 มิติ (3D Extrude)' },
  { id: 'letterpress', label: 'จมกระดาษ (Letterpress)' },
  { id: 'gradient-gold', label: 'ไล่สีทอง (Gold Gradient)' },
  { id: 'gradient-fire', label: 'ไล่สีไฟ (Fire Gradient)' },
  { id: 'gradient-ocean', label: 'ไล่สีน้ำทะเล (Ocean Gradient)' },
  { id: 'gradient-pink', label: 'ไล่สีชมพูหวาน (Pink Gradient)' },
];

// ── ชนิดข้อมูลกล่องข้อความ ──
interface QuoteBox {
  id: string;
  kind: 'caption' | 'credit'; // caption = ตัวคำคม (ผูกกับแคปชั่นแต่ละบรรทัด), credit = เครดิตเพจ (ข้อความคงที่)
  text: string;               // ใช้เฉพาะ kind = credit
  xPct: number;               // ตำแหน่ง % ของความกว้างรูป
  yPct: number;               // ตำแหน่ง % ของความสูงรูป
  wPct: number;               // ความกว้างกล่อง % ของความกว้างรูป
  fontSize: number;           // px อิงความกว้างอ้างอิง 1080
  fontFamily: string;
  color: string;
  bold: boolean;
  align: 'left' | 'center' | 'right';
  effect: string;
  lineHeight: number;         // ตัวคูณ เช่น 1.3
  bgEnabled: boolean;
  bgColor: string;
  bgOpacity: number;          // 0-100
  bgRadius: number;           // px อิง 1080
  bgPadding: number;          // px อิง 1080
}

interface BoxRect { id: string; x: number; y: number; w: number; h: number } // px บน canvas

interface QuoteBrain {
  id: string;
  name: string;
  styleDesc: string;
  exampleText: string;
}

interface LogEntry { time: string; msg: string; kind: 'info' | 'ok' | 'warn' | 'err' }

const REF_W = 1080; // ความกว้างอ้างอิงของ fontSize/padding

const AI_MODEL_OPTIONS = [
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (เร็ว/ถูก)' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (ฉลาด)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o mini' },
  { id: 'gpt-4o', label: 'GPT-4o' },
  { id: 'deepseek-chat', label: 'DeepSeek Chat' },
  { id: '__custom__', label: 'กำหนดเอง…' },
];

const uid = () => `box_${Date.now()}_${Math.floor(Math.random() * 9999)}`;

const defaultCaptionBox = (): QuoteBox => ({
  id: uid(), kind: 'caption', text: '',
  xPct: 8, yPct: 38, wPct: 84,
  fontSize: 62, fontFamily: 'Kanit', color: '#FFFFFF', bold: true,
  align: 'center', effect: 'outline-shadow', lineHeight: 1.35,
  bgEnabled: false, bgColor: '#000000', bgOpacity: 45, bgRadius: 24, bgPadding: 28,
});

const defaultCreditBox = (): QuoteBox => ({
  id: uid(), kind: 'credit', text: '@เพจของคุณ',
  xPct: 25, yPct: 88, wPct: 50,
  fontSize: 34, fontFamily: 'Prompt', color: '#FFD700', bold: true,
  align: 'center', effect: 'shadow', lineHeight: 1.2,
  bgEnabled: false, bgColor: '#000000', bgOpacity: 45, bgRadius: 18, bgPadding: 16,
});

// ── ตัดบรรทัดข้อความไทย (ใช้ Intl.Segmenter ถ้ามี) ──
const segmentWords = (text: string): string[] => {
  try {
    const Seg = (Intl as any).Segmenter;
    if (Seg) {
      const seg = new Seg('th', { granularity: 'word' });
      return Array.from(seg.segment(text), (s: any) => s.segment);
    }
  } catch { /* fallback ด้านล่าง */ }
  return text.split('');
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
  const lines: string[] = [];
  for (const hardLine of text.split('\n')) {
    if (!hardLine.trim()) { lines.push(''); continue; }
    const words = segmentWords(hardLine);
    let current = '';
    for (const w of words) {
      const test = current + w;
      if (current && ctx.measureText(test).width > maxWidth) {
        lines.push(current.trimEnd());
        current = w.trimStart();
      } else {
        current = test;
      }
    }
    if (current.trim()) lines.push(current.trimEnd());
  }
  return lines.length ? lines : [''];
};

const hexToRgba = (hex: string, opacityPct: number): string => {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return `rgba(0,0,0,${opacityPct / 100})`;
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${opacityPct / 100})`;
};

const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

// ── วาดข้อความ 1 บรรทัดพร้อมเอฟเฟค ──
const drawLineWithEffect = (
  ctx: CanvasRenderingContext2D, line: string, x: number, y: number,
  effect: string, color: string, fontSizePx: number, scale: number,
  gradTop: number, gradBottom: number,
) => {
  const s = Math.max(0.2, scale);
  ctx.save();
  const makeGradient = (stops: [number, string][]): CanvasGradient => {
    const g = ctx.createLinearGradient(0, gradTop, 0, gradBottom);
    for (const [pos, c] of stops) g.addColorStop(pos, c);
    return g;
  };
  switch (effect) {
    case 'shadow':
      ctx.shadowColor = 'rgba(0,0,0,0.75)';
      ctx.shadowBlur = 14 * s;
      ctx.shadowOffsetY = 4 * s;
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case 'shadow-hard':
      ctx.fillStyle = 'rgba(0,0,0,0.85)';
      ctx.fillText(line, x + 5 * s, y + 5 * s);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case 'outline':
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.12);
      ctx.strokeText(line, x, y);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case 'outline-white':
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.12);
      ctx.strokeText(line, x, y);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case 'outline-shadow':
      ctx.shadowColor = 'rgba(0,0,0,0.65)';
      ctx.shadowBlur = 12 * s;
      ctx.shadowOffsetY = 4 * s;
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.1);
      ctx.strokeText(line, x, y);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case 'glow-white':
      ctx.shadowColor = 'rgba(255,255,255,0.95)';
      ctx.shadowBlur = 22 * s;
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      ctx.fillText(line, x, y);
      break;
    case 'glow-gold':
      ctx.shadowColor = 'rgba(255,200,40,0.95)';
      ctx.shadowBlur = 24 * s;
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      ctx.fillText(line, x, y);
      break;
    case 'neon':
      ctx.shadowColor = color;
      ctx.shadowBlur = 26 * s;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(line, x, y);
      ctx.shadowBlur = 12 * s;
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case '3d': {
      const depth = Math.max(2, Math.round(fontSizePx * 0.07));
      for (let i = depth; i > 0; i--) {
        ctx.fillStyle = `rgba(0,0,0,${0.55 - (i / depth) * 0.25})`;
        ctx.fillText(line, x + i, y + i);
      }
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    }
    case 'letterpress':
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillText(line, x, y + 2 * s);
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
      break;
    case 'gradient-gold':
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(60,30,0,0.85)';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.08);
      ctx.strokeText(line, x, y);
      ctx.fillStyle = makeGradient([[0, '#FFF3B0'], [0.45, '#FFD700'], [1, '#B8860B']]);
      ctx.fillText(line, x, y);
      break;
    case 'gradient-fire':
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(40,0,0,0.85)';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.08);
      ctx.strokeText(line, x, y);
      ctx.fillStyle = makeGradient([[0, '#FFE066'], [0.5, '#FF8C00'], [1, '#E02020']]);
      ctx.fillText(line, x, y);
      break;
    case 'gradient-ocean':
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,10,40,0.85)';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.08);
      ctx.strokeText(line, x, y);
      ctx.fillStyle = makeGradient([[0, '#B0F0FF'], [0.5, '#31A8FF'], [1, '#0050A0']]);
      ctx.fillText(line, x, y);
      break;
    case 'gradient-pink':
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(60,0,30,0.75)';
      ctx.lineWidth = Math.max(2, fontSizePx * 0.08);
      ctx.strokeText(line, x, y);
      ctx.fillStyle = makeGradient([[0, '#FFD6EC'], [0.5, '#FF7EB9'], [1, '#D9376E']]);
      ctx.fillText(line, x, y);
      break;
    default:
      ctx.fillStyle = color;
      ctx.fillText(line, x, y);
  }
  ctx.restore();
};

// ── วาดทุกกล่องทับบนรูป — คืน rect ของแต่ละกล่อง (px) เพื่อใช้ทำ overlay ลากในพรีวิว ──
const drawBoxes = (
  ctx: CanvasRenderingContext2D, W: number, H: number,
  boxes: QuoteBox[], captionText: string,
): BoxRect[] => {
  const scale = W / REF_W;
  const rects: BoxRect[] = [];
  for (const box of boxes) {
    const text = box.kind === 'caption' ? captionText : box.text;
    const fontSizePx = box.fontSize * scale;
    const boxX = (box.xPct / 100) * W;
    const boxY = (box.yPct / 100) * H;
    const boxW = Math.max(20, (box.wPct / 100) * W);
    const pad = box.bgEnabled ? box.bgPadding * scale : 0;
    ctx.save();
    ctx.font = `${box.bold ? 'bold' : 'normal'} ${fontSizePx}px "${box.fontFamily}", sans-serif`;
    ctx.textBaseline = 'alphabetic';
    const lines = wrapText(ctx, text || ' ', Math.max(10, boxW - pad * 2));
    const lineH = fontSizePx * box.lineHeight;
    const textH = lines.length * lineH;
    const totalH = textH + pad * 2;

    if (box.bgEnabled) {
      ctx.save();
      ctx.fillStyle = hexToRgba(box.bgColor, box.bgOpacity);
      roundRectPath(ctx, boxX, boxY, boxW, totalH, box.bgRadius * scale);
      ctx.fill();
      ctx.restore();
    }

    const gradTop = boxY + pad;
    const gradBottom = boxY + pad + textH;
    lines.forEach((line, i) => {
      const lw = ctx.measureText(line).width;
      let tx = boxX + pad;
      if (box.align === 'center') tx = boxX + (boxW - lw) / 2;
      else if (box.align === 'right') tx = boxX + boxW - pad - lw;
      // baseline ≈ 80% ของบรรทัด
      const ty = boxY + pad + i * lineH + lineH * 0.8;
      drawLineWithEffect(ctx, line, tx, ty, box.effect, box.color, fontSizePx, scale, gradTop, gradBottom);
    });
    ctx.restore();
    rects.push({ id: box.id, x: boxX, y: boxY, w: boxW, h: totalH });
  }
  return rects;
};

const nowTime = () => new Date().toLocaleTimeString('th-TH', { hour12: false });
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── สไตล์ปุ่มหลัก (มาร์คสีชัดเจนตามความสำคัญ) ──
const S = {
  card: {
    borderRadius: 16, border: '1px solid #1e293b', background: 'rgba(15,23,42,0.55)',
    padding: 18, marginBottom: 16,
  } as React.CSSProperties,
  cardTitle: {
    fontSize: 14, fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center',
    gap: 8, marginBottom: 12,
  } as React.CSSProperties,
  label: { fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 4 } as React.CSSProperties,
  input: {
    width: '100%', background: '#0f172a', border: '1px solid #334155', borderRadius: 10,
    color: '#e2e8f0', padding: '8px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  } as React.CSSProperties,
  btn: (bg: string, color = '#fff'): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6, background: bg, color,
    border: 'none', borderRadius: 10, padding: '9px 16px', fontSize: 13, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap',
  }),
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(51,65,85,0.5)',
    color: '#cbd5e1', border: '1px solid #334155', borderRadius: 10, padding: '8px 14px',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
  } as React.CSSProperties,
};

export default function QuoteImagePortal() {
  // ── โฟลเดอร์ ──
  const [footageFolder, setFootageFolder] = useState(() => localStorage.getItem('quoteimg_footage') || '');
  const [outputFolder, setOutputFolder] = useState(() => localStorage.getItem('quoteimg_output') || '');
  const [imageFiles, setImageFiles] = useState<string[]>([]);

  // ── แคปชั่น ──
  const [captionsText, setCaptionsText] = useState(() => localStorage.getItem('quoteimg_captions') || '');
  const captions = captionsText.split('\n').map(l => l.trim()).filter(Boolean);

  // ── AI ──
  const [styleDesc, setStyleDesc] = useState(() => localStorage.getItem('quoteimg_style') || '');
  const [exampleText, setExampleText] = useState(() => localStorage.getItem('quoteimg_example') || '');
  const [aiCount, setAiCount] = useState(20);
  const [aiModel, setAiModel] = useState(() => localStorage.getItem('quoteimg_model') || 'gemini-2.5-flash');
  const [customModel, setCustomModel] = useState(() => localStorage.getItem('quoteimg_custom_model') || '');
  const [aiBusy, setAiBusy] = useState(false);
  const [brains, setBrains] = useState<QuoteBrain[]>(() => {
    try { return JSON.parse(localStorage.getItem('quoteimg_brains') || '[]'); } catch { return []; }
  });
  const [brainName, setBrainName] = useState('');
  const [selectedBrainId, setSelectedBrainId] = useState('');

  // ── กล่องข้อความ + เลย์เอาต์ ──
  const [boxes, setBoxes] = useState<QuoteBox[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('quoteimg_boxes') || 'null');
      if (Array.isArray(saved) && saved.length) return saved;
    } catch { /* ใช้ default */ }
    return [defaultCaptionBox(), defaultCreditBox()];
  });
  const [selectedBoxId, setSelectedBoxId] = useState<string>('');
  const selectedBox = boxes.find(b => b.id === selectedBoxId) || null;

  // ── พรีวิว ──
  const [previewImageIdx, setPreviewImageIdx] = useState(0);
  const [previewCaptionIdx, setPreviewCaptionIdx] = useState(0);
  const [previewImg, setPreviewImg] = useState<HTMLImageElement | null>(null);
  const [boxRects, setBoxRects] = useState<BoxRect[]>([]);
  const [canvasSize, setCanvasSize] = useState({ w: 1080, h: 1350 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    boxId: string; mode: 'move' | 'width' | 'font';
    startX: number; startY: number;
    startXPct: number; startYPct: number; startWPct: number; startFontSize: number;
  } | null>(null);

  // ── สถานะรัน batch ──
  const [runState, setRunState] = useState<'idle' | 'running' | 'paused'>('idle');
  const runStateRef = useRef(runState);
  runStateRef.current = runState;
  const stopRef = useRef(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  // ── ตัวเลือกการเรนเดอร์ ──
  const [pickMode, setPickMode] = useState<'random' | 'sequential'>('random');
  const [outFormat, setOutFormat] = useState<'jpg' | 'png'>('jpg');

  // ── Log ──
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogs, setShowLogs] = useState(true);
  const logEndRef = useRef<HTMLDivElement>(null);
  const addLog = useCallback((msg: string, kind: LogEntry['kind'] = 'info') => {
    setLogs(prev => [...prev.slice(-500), { time: nowTime(), msg, kind }]);
  }, []);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // โหลดฟอนต์ Google ครั้งเดียว
  useEffect(() => { ensureFontsLoaded(); }, []);

  // persist ค่าที่สำคัญ
  useEffect(() => { localStorage.setItem('quoteimg_footage', footageFolder); }, [footageFolder]);
  useEffect(() => { localStorage.setItem('quoteimg_output', outputFolder); }, [outputFolder]);
  useEffect(() => { localStorage.setItem('quoteimg_captions', captionsText); }, [captionsText]);
  useEffect(() => { localStorage.setItem('quoteimg_style', styleDesc); }, [styleDesc]);
  useEffect(() => { localStorage.setItem('quoteimg_example', exampleText); }, [exampleText]);
  useEffect(() => { localStorage.setItem('quoteimg_model', aiModel); }, [aiModel]);
  useEffect(() => { localStorage.setItem('quoteimg_custom_model', customModel); }, [customModel]);
  useEffect(() => { localStorage.setItem('quoteimg_boxes', JSON.stringify(boxes)); }, [boxes]);
  useEffect(() => { localStorage.setItem('quoteimg_brains', JSON.stringify(brains)); }, [brains]);

  // ── เลือกโฟลเดอร์ผ่าน dialog ของ macOS ──
  const pickFolder = async (setter: (v: string) => void, prompt: string, label: string) => {
    addLog(`เปิดหน้าต่างเลือกโฟลเดอร์${label}…`);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success && data.path) {
        setter(data.path);
        addLog(`เลือกโฟลเดอร์${label}: ${data.path}`, 'ok');
      } else if (data.cancelled) {
        addLog(`ยกเลิกการเลือกโฟลเดอร์${label}`, 'warn');
      } else {
        addLog(`เลือกโฟลเดอร์${label}ไม่สำเร็จ: ${data.error || 'unknown'}`, 'err');
      }
    } catch (err: any) {
      addLog(`เชื่อมต่อ backend ไม่ได้: ${err.message}`, 'err');
    }
  };

  // ── โหลดรายชื่อรูปในโฟลเดอร์ footage ──
  const refreshImages = useCallback(async (folder: string, silent = false): Promise<string[]> => {
    if (!folder) return [];
    try {
      const res = await fetch(`${BACKEND_BASE}/api/quote-image/list-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder }),
      });
      const data = await res.json();
      if (data.success) {
        setImageFiles(data.files);
        if (!silent) addLog(`พบรูปในโฟลเดอร์ footage ทั้งหมด ${data.files.length} รูป`, data.files.length ? 'ok' : 'warn');
        return data.files;
      }
      if (!silent) addLog(`อ่านโฟลเดอร์รูปไม่ได้: ${data.error}`, 'err');
    } catch (err: any) {
      if (!silent) addLog(`อ่านโฟลเดอร์รูปไม่ได้: ${err.message}`, 'err');
    }
    return [];
  }, [addLog]);

  useEffect(() => { if (footageFolder) refreshImages(footageFolder, true); }, [footageFolder, refreshImages]);

  // ── โหลดรูปพรีวิว ──
  useEffect(() => {
    if (!footageFolder || !imageFiles.length) { setPreviewImg(null); return; }
    const idx = Math.min(previewImageIdx, imageFiles.length - 1);
    const imgPath = `${footageFolder.replace(/\/$/, '')}/${imageFiles[idx]}`;
    const img = new Image();
    img.crossOrigin = 'anonymous'; // กัน canvas tainted ตอน export (รูปมาจาก backend คนละพอร์ต)
    img.onload = () => {
      setPreviewImg(img);
      // canvas พรีวิวจำกัดกว้าง 1080 เพื่อความลื่น (สัดส่วนตามรูปจริง)
      const w = Math.min(1080, img.naturalWidth);
      const h = Math.round(w * (img.naturalHeight / img.naturalWidth));
      setCanvasSize({ w, h });
    };
    img.onerror = () => { setPreviewImg(null); addLog(`โหลดรูปพรีวิวไม่ได้: ${imageFiles[idx]}`, 'err'); };
    img.src = `${BACKEND_BASE}/api/local-stock-image?path=${encodeURIComponent(imgPath)}`;
  }, [footageFolder, imageFiles, previewImageIdx, addLog]);

  // ── วาดพรีวิว ──
  const previewCaption = captions.length
    ? captions[Math.min(previewCaptionIdx, captions.length - 1)]
    : 'ตัวอย่างคำคมจะแสดงตรงนี้ ลองพิมพ์ในช่องด้านซ้ายดูสิ';

  const redrawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const { w, h } = canvasSize;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (previewImg) {
      ctx.drawImage(previewImg, 0, 0, w, h);
    } else {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, '#1e293b');
      g.addColorStop(1, '#0f172a');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#475569';
      ctx.font = `bold ${Math.round(w / 24)}px "Kanit", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('เลือกโฟลเดอร์รูป footage เพื่อดูพรีวิว', w / 2, h / 2);
      ctx.textAlign = 'left';
    }
    const rects = drawBoxes(ctx, w, h, boxes, previewCaption);
    setBoxRects(rects);
  }, [canvasSize, previewImg, boxes, previewCaption]);

  useEffect(() => { redrawPreview(); }, [redrawPreview]);
  // วาดซ้ำเมื่อเว็บฟอนต์โหลดเสร็จ (กันฟอนต์เพี้ยนตอนแรก)
  useEffect(() => {
    let mounted = true;
    (document as any).fonts?.ready?.then(() => { if (mounted) redrawPreview(); });
    return () => { mounted = false; };
  }, [redrawPreview]);

  // ── ลาก / ปรับขนาดกล่องในพรีวิว ──
  const beginDrag = (e: React.MouseEvent, boxId: string, mode: 'move' | 'width' | 'font') => {
    e.preventDefault();
    e.stopPropagation();
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    setSelectedBoxId(boxId);
    dragRef.current = {
      boxId, mode, startX: e.clientX, startY: e.clientY,
      startXPct: box.xPct, startYPct: box.yPct, startWPct: box.wPct, startFontSize: box.fontSize,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      const wrap = previewWrapRef.current;
      if (!drag || !wrap) return;
      const rect = wrap.getBoundingClientRect();
      const dxPct = ((e.clientX - drag.startX) / rect.width) * 100;
      const dyPct = ((e.clientY - drag.startY) / rect.height) * 100;
      setBoxes(prev => prev.map(b => {
        if (b.id !== drag.boxId) return b;
        if (drag.mode === 'move') {
          return {
            ...b,
            xPct: Math.min(98, Math.max(-30, drag.startXPct + dxPct)),
            yPct: Math.min(98, Math.max(-10, drag.startYPct + dyPct)),
          };
        }
        if (drag.mode === 'width') {
          return { ...b, wPct: Math.min(130, Math.max(8, drag.startWPct + dxPct)) };
        }
        // font: ลากลง = ใหญ่ขึ้น
        const factor = 1 + ((e.clientY - drag.startY) / rect.height) * 2;
        return { ...b, fontSize: Math.min(240, Math.max(12, Math.round(drag.startFontSize * factor))) };
      }));
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── จัดการกล่อง ──
  const addBox = (kind: 'caption' | 'credit') => {
    const box = kind === 'caption' ? defaultCaptionBox() : defaultCreditBox();
    // เยื้องตำแหน่งเล็กน้อยกันซ้อนทับกล่องเดิม
    box.yPct = Math.min(90, box.yPct + boxes.filter(b => b.kind === kind).length * 6);
    setBoxes(prev => [...prev, box]);
    setSelectedBoxId(box.id);
    addLog(`เพิ่มกล่อง${kind === 'caption' ? 'แคปชั่น' : 'เครดิตเพจ'}ใหม่`, 'ok');
  };
  const removeBox = (id: string) => {
    setBoxes(prev => prev.filter(b => b.id !== id));
    if (selectedBoxId === id) setSelectedBoxId('');
    addLog('ลบกล่องแล้ว', 'warn');
  };
  const updateSelectedBox = (patch: Partial<QuoteBox>) => {
    if (!selectedBoxId) return;
    setBoxes(prev => prev.map(b => (b.id === selectedBoxId ? { ...b, ...patch } : b)));
  };
  const resetLayout = () => {
    setBoxes([defaultCaptionBox(), defaultCreditBox()]);
    setSelectedBoxId('');
    addLog('รีเซ็ตเลย์เอาต์กลับค่าเริ่มต้นแล้ว', 'warn');
  };

  // ── AI เขียนคำคม (Kie.ai) ──
  const effectiveModel = aiModel === '__custom__' ? customModel.trim() : aiModel;
  const generateWithAI = async (mode: 'replace' | 'append') => {
    const kieKey = getKieKey();
    if (!kieKey) {
      addLog('ไม่พบ Kie.ai API Key — กรุณาใส่ในหน้า ⚙️ ตั้งค่าระบบ ก่อน', 'err');
      return;
    }
    if (!styleDesc.trim() && !exampleText.trim()) {
      addLog('กรุณาเล่าแนวคำคม หรือใส่ตัวอย่างอย่างน้อย 1 อย่าง เพื่อให้ AI เข้าใจสไตล์', 'err');
      return;
    }
    if (!effectiveModel) {
      addLog('กรุณาเลือกหรือพิมพ์ชื่อ AI Model ก่อน', 'err');
      return;
    }
    const count = Math.min(100, Math.max(1, aiCount));
    setAiBusy(true);
    addLog(`🤖 กำลังให้ AI (${effectiveModel}) เขียนคำคม ${count} ข้อ…`);
    try {
      const sys = 'คุณคือนักเขียนคำคมภาษาไทยมืออาชีพสำหรับโพสต์โซเชียล เขียนคำคมสั้น กระชับ กินใจ แชร์ต่อง่าย ห้ามใส่อีโมจิ ห้ามใส่เลขลำดับ ห้ามใส่เครื่องหมายคำพูด ตอบเป็นคำคมอย่างเดียว บรรทัดละ 1 คำคม';
      let userPrompt = `เขียนคำคมภาษาไทยจำนวน ${count} ข้อ ห้ามซ้ำกัน\n`;
      if (styleDesc.trim()) userPrompt += `\nแนว/สไตล์ที่ต้องการ:\n${styleDesc.trim()}\n`;
      if (exampleText.trim()) userPrompt += `\nตัวอย่างคำคมที่ชอบ (เลียนแบบโทนและจังหวะ แต่ห้ามลอกคำเดิม):\n${exampleText.trim()}\n`;
      userPrompt += '\nตอบกลับเป็นคำคมล้วนๆ บรรทัดละ 1 ข้อ ไม่ต้องมีหมายเลขหรือ bullet นำหน้า';
      const res = await fetch(`${BACKEND_BASE}/api/kie-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: kieKey,
          model: effectiveModel,
          payload: {
            model: effectiveModel,
            messages: [
              { role: 'system', content: sys },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.95,
          },
        }),
      });
      const data = await res.json();
      const content: string = data?.choices?.[0]?.message?.content || '';
      if (!content.trim()) {
        const errMsg = data?.error?.message || data?.msg || 'AI ตอบกลับว่างเปล่า';
        throw new Error(errMsg);
      }
      const quotes = content
        .split('\n')
        .map(l => l.replace(/^\s*[\d๐-๙]+[.)]\s*/, '').replace(/^[-•*"']+\s*/, '').replace(/["']+\s*$/, '').trim())
        .filter(l => l.length > 3);
      if (!quotes.length) throw new Error('แยกคำคมจากคำตอบ AI ไม่ได้');
      const finalQuotes = quotes.slice(0, count);
      setCaptionsText(prev =>
        mode === 'replace' || !prev.trim() ? finalQuotes.join('\n') : `${prev.trimEnd()}\n${finalQuotes.join('\n')}`
      );
      addLog(`✅ AI เขียนคำคมสำเร็จ ${finalQuotes.length} ข้อ (${mode === 'replace' ? 'แทนที่ของเดิม' : 'ต่อท้ายของเดิม'})`, 'ok');
    } catch (err: any) {
      addLog(`AI เขียนคำคมไม่สำเร็จ: ${err.message}`, 'err');
    } finally {
      setAiBusy(false);
    }
  };

  // ── สมอง (บันทึกสไตล์ไว้ใช้ซ้ำ) ──
  const saveBrain = () => {
    const name = brainName.trim();
    if (!name) { addLog('กรุณาตั้งชื่อสมองก่อนบันทึก', 'err'); return; }
    if (!styleDesc.trim() && !exampleText.trim()) { addLog('ยังไม่มีเนื้อหาสไตล์ให้บันทึก', 'err'); return; }
    const existing = brains.find(b => b.name === name);
    if (existing) {
      setBrains(prev => prev.map(b => (b.name === name ? { ...b, styleDesc, exampleText } : b)));
      setSelectedBrainId(existing.id);
      addLog(`อัพเดตสมอง "${name}" แล้ว`, 'ok');
    } else {
      const brain: QuoteBrain = { id: `brain_${Date.now()}`, name, styleDesc, exampleText };
      setBrains(prev => [...prev, brain]);
      setSelectedBrainId(brain.id);
      addLog(`บันทึกสมองใหม่ "${name}" แล้ว — เรียกใช้ซ้ำได้ตลอด`, 'ok');
    }
  };
  const loadBrain = (id: string) => {
    setSelectedBrainId(id);
    const brain = brains.find(b => b.id === id);
    if (!brain) return;
    setStyleDesc(brain.styleDesc);
    setExampleText(brain.exampleText);
    setBrainName(brain.name);
    addLog(`โหลดสมอง "${brain.name}" แล้ว`, 'ok');
  };
  const deleteBrain = () => {
    const brain = brains.find(b => b.id === selectedBrainId);
    if (!brain) return;
    setBrains(prev => prev.filter(b => b.id !== selectedBrainId));
    setSelectedBrainId('');
    addLog(`ลบสมอง "${brain.name}" แล้ว`, 'warn');
  };

  // ── โหลดรูปเป็น HTMLImageElement (สำหรับเรนเดอร์จริง) ──
  const loadImage = (imgPath: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // จำเป็นสำหรับ canvas.toDataURL (รูปมาจาก backend คนละพอร์ต)
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`โหลดรูปไม่ได้: ${imgPath}`));
      img.src = `${BACKEND_BASE}/api/local-stock-image?path=${encodeURIComponent(imgPath)}`;
    });

  // ── รัน batch ตัดต่อรูปทั้งหมด ──
  const startRun = async () => {
    if (runState === 'paused') { setRunState('running'); addLog('▶️ ทำงานต่อจากที่พักไว้', 'ok'); return; }
    if (runState === 'running') return;

    // ตรวจความพร้อมทีละข้อ พร้อม log ชัดเจน
    if (!footageFolder) { addLog('ยังไม่ได้เลือกโฟลเดอร์รูป footage', 'err'); return; }
    if (!outputFolder) { addLog('ยังไม่ได้เลือกโฟลเดอร์ปลายทาง', 'err'); return; }
    if (!captions.length) { addLog('ยังไม่มีแคปชั่น — พิมพ์เองหรือกดให้ AI เขียนก่อน', 'err'); return; }
    if (!boxes.some(b => b.kind === 'caption')) { addLog('ต้องมีกล่องแคปชั่นอย่างน้อย 1 กล่อง', 'err'); return; }

    addLog('══════ เริ่มงานตัดต่อรูปคำคม ══════');
    addLog(`ตรวจสอบโฟลเดอร์ footage: ${footageFolder}`);
    const files = await refreshImages(footageFolder);
    if (!files.length) { addLog('ไม่พบไฟล์รูปในโฟลเดอร์ footage', 'err'); return; }
    addLog(`โหมดเลือกรูป: ${pickMode === 'random' ? 'สุ่มไม่ซ้ำ (วนใหม่เมื่อหมด)' : 'เรียงตามลำดับ'} | ฟอร์แมต: ${outFormat.toUpperCase()}`);
    addLog(`แคปชั่นทั้งหมด ${captions.length} ข้อ → จะได้รูปทั้งหมด ${captions.length} รูป`);

    stopRef.current = false;
    setRunState('running');
    setProgress({ done: 0, total: captions.length });

    // เตรียมลำดับรูป
    let pool: string[] = [];
    const nextImage = (i: number): string => {
      if (pickMode === 'sequential') return files[i % files.length];
      if (!pool.length) pool = [...files].sort(() => Math.random() - 0.5);
      return pool.pop()!;
    };

    const stamp = new Date();
    const dateTag = `${stamp.getFullYear()}${String(stamp.getMonth() + 1).padStart(2, '0')}${String(stamp.getDate()).padStart(2, '0')}_${String(stamp.getHours()).padStart(2, '0')}${String(stamp.getMinutes()).padStart(2, '0')}`;
    let okCount = 0;
    let failCount = 0;

    for (let i = 0; i < captions.length; i++) {
      // รอถ้ากดพัก / หยุดถ้ากดหยุด
      while (runStateRef.current === 'paused' && !stopRef.current) await sleep(250);
      if (stopRef.current) { addLog(`⏹ หยุดงานที่รูปที่ ${i + 1}/${captions.length} ตามคำสั่ง`, 'warn'); break; }

      const caption = captions[i];
      const fileName = nextImage(i);
      const imgPath = `${footageFolder.replace(/\/$/, '')}/${fileName}`;
      addLog(`── รูปที่ ${i + 1}/${captions.length} ──`);
      addLog(`แคปชั่น: "${caption.length > 60 ? caption.slice(0, 60) + '…' : caption}"`);
      addLog(`สุ่มได้รูป: ${fileName} → กำลังโหลด…`);
      try {
        const img = await loadImage(imgPath);
        // เรนเดอร์ที่ความละเอียดจริงของรูป (จำกัดด้านยาวสุด 2160px กันไฟล์บวม)
        let W = img.naturalWidth;
        let H = img.naturalHeight;
        const maxDim = Math.max(W, H);
        if (maxDim > 2160) {
          const ratio = 2160 / maxDim;
          W = Math.round(W * ratio);
          H = Math.round(H * ratio);
        }
        addLog(`วาดข้อความทับบน Canvas ขนาด ${W}×${H}px (${boxes.length} กล่อง)…`);
        const canvas = document.createElement('canvas');
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('สร้าง canvas ไม่ได้');
        ctx.drawImage(img, 0, 0, W, H);
        drawBoxes(ctx, W, H, boxes, caption);
        const dataUrl = outFormat === 'png'
          ? canvas.toDataURL('image/png')
          : canvas.toDataURL('image/jpeg', 0.92);
        const outName = `quote_${dateTag}_${String(i + 1).padStart(3, '0')}.${outFormat}`;
        addLog(`กำลังบันทึกไฟล์ ${outName}…`);
        const res = await fetch(`${BACKEND_BASE}/api/quote-image/save`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ outputFolder, fileName: outName, dataUrl }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'บันทึกไฟล์ไม่สำเร็จ');
        okCount++;
        addLog(`✅ เสร็จรูปที่ ${i + 1}: ${data.fileName}`, 'ok');
      } catch (err: any) {
        failCount++;
        addLog(`❌ รูปที่ ${i + 1} ล้มเหลว: ${err.message}`, 'err');
      }
      setProgress({ done: i + 1, total: captions.length });
      await sleep(30); // ให้ UI หายใจ
    }

    setRunState('idle');
    addLog(`══════ จบงาน: สำเร็จ ${okCount} รูป${failCount ? ` | ล้มเหลว ${failCount} รูป` : ''} ══════`, failCount ? 'warn' : 'ok');
    if (okCount > 0) addLog(`ไฟล์ทั้งหมดอยู่ที่: ${outputFolder}`, 'ok');
  };

  const pauseRun = () => {
    if (runState !== 'running') return;
    setRunState('paused');
    addLog('⏸ พักงานชั่วคราว — กด "เริ่ม/ทำต่อ" เพื่อทำงานต่อ', 'warn');
  };
  const stopRun = () => {
    if (runState === 'idle') return;
    stopRef.current = true;
    setRunState('idle');
  };

  // ── overlay กล่องในพรีวิว (แปลง px → %) ──
  const overlayStyle = (r: BoxRect): React.CSSProperties => ({
    position: 'absolute',
    left: `${(r.x / canvasSize.w) * 100}%`,
    top: `${(r.y / canvasSize.h) * 100}%`,
    width: `${(r.w / canvasSize.w) * 100}%`,
    height: `${(r.h / canvasSize.h) * 100}%`,
    cursor: 'move',
    border: r.id === selectedBoxId ? '2px solid #38bdf8' : '1px dashed rgba(148,163,184,0.45)',
    borderRadius: 6,
    boxSizing: 'border-box',
  });

  const logColor = (kind: LogEntry['kind']) =>
    kind === 'ok' ? '#4ade80' : kind === 'err' ? '#f87171' : kind === 'warn' ? '#fbbf24' : '#94a3b8';

  const kieKeyMissing = !getKieKey();

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: 16 }}>
      {/* ── Header ── */}
      <div style={{ ...S.card, border: '1px solid rgba(56,189,248,0.25)', background: 'linear-gradient(135deg, rgba(8,47,73,0.5), rgba(15,23,42,0.5))' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(56,189,248,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🖼️</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 19, fontWeight: 900, color: '#fff' }}>
              ตัดต่อรูปคำคม <span style={{ fontSize: 10, fontWeight: 700, color: '#7dd3fc', background: 'rgba(56,189,248,0.12)', padding: '2px 10px', borderRadius: 999, verticalAlign: 'middle' }}>Batch Canvas</span>
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#94a3b8' }}>
              วางคำคมทับรูป footage ทีละร้อยรูปอัตโนมัติ — จัดเลย์เอาต์ด้วยเมาส์ในพรีวิว แล้วใช้ค่านั้นเรนเดอร์จริงเลย
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 1fr) minmax(420px, 1.1fr)', gap: 16, alignItems: 'start' }}>
        {/* ═══ คอลัมน์ซ้าย: ตั้งค่า ═══ */}
        <div>
          {/* 1. โฟลเดอร์ */}
          <div style={S.card}>
            <h3 style={S.cardTitle}><FolderOpen size={16} color="#38bdf8" /> 1 · โฟลเดอร์รูป footage & ปลายทาง</h3>
            <label style={S.label}>โฟลเดอร์รูป footage (รูปพื้นหลัง)</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <input style={S.input} value={footageFolder} onChange={e => setFootageFolder(e.target.value)} placeholder="/Users/…/รูปfootage" />
              <button style={S.btn('#0284c7')} onClick={() => pickFolder(setFootageFolder, 'เลือกโฟลเดอร์รูป footage', 'รูป footage')}>
                <FolderOpen size={15} /> เลือก
              </button>
            </div>
            <label style={S.label}>โฟลเดอร์ปลายทาง (รูปที่เสร็จแล้ว)</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input style={S.input} value={outputFolder} onChange={e => setOutputFolder(e.target.value)} placeholder="/Users/…/รูปเสร็จแล้ว" />
              <button style={S.btn('#0284c7')} onClick={() => pickFolder(setOutputFolder, 'เลือกโฟลเดอร์ปลายทาง', 'ปลายทาง')}>
                <FolderOpen size={15} /> เลือก
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <button style={S.btnGhost} onClick={() => refreshImages(footageFolder)}>
                <RefreshCw size={13} /> รีเฟรชรายชื่อรูป
              </button>
              <span style={{ fontSize: 11, color: imageFiles.length ? '#4ade80' : '#64748b' }}>
                {imageFiles.length ? `พบ ${imageFiles.length} รูป` : 'ยังไม่พบรูป'}
              </span>
            </div>
          </div>

          {/* 2. แคปชั่น */}
          <div style={S.card}>
            <h3 style={S.cardTitle}><Type size={16} color="#a78bfa" /> 2 · คำคม / แคปชั่น <span style={{ fontSize: 11, fontWeight: 500, color: '#64748b' }}>(1 บรรทัด = 1 รูป)</span></h3>
            <textarea
              style={{ ...S.input, minHeight: 130, resize: 'vertical', lineHeight: 1.6 }}
              value={captionsText}
              onChange={e => setCaptionsText(e.target.value)}
              placeholder={'พิมพ์คำคมเองตรงนี้ บรรทัดละ 1 ข้อ เช่น\nเหนื่อยได้ แต่อย่าหยุดเดิน\nเงินไม่ใช่ทุกอย่าง แต่ทุกอย่างต้องใช้เงิน'}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 11, color: captions.length ? '#4ade80' : '#64748b' }}>ทั้งหมด {captions.length} แคปชั่น = {captions.length} รูป</span>
              {captionsText.trim() && (
                <button style={{ ...S.btnGhost, padding: '4px 10px', fontSize: 11 }} onClick={() => setCaptionsText('')}>
                  <Trash2 size={12} /> ล้างทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* 3. AI เขียนคำคม */}
          <div style={{ ...S.card, border: '1px solid rgba(167,139,250,0.3)' }}>
            <h3 style={S.cardTitle}><Sparkles size={16} color="#a78bfa" /> 3 · ให้ AI เขียนคำคมให้ (Kie.ai)</h3>
            {kieKeyMissing && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.35)', borderRadius: 10, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: '#fca5a5' }}>
                <AlertCircle size={15} /> ไม่พบ Kie.ai API Key — ไปใส่ในหน้า ⚙️ ตั้งค่าระบบ ก่อนถึงจะใช้ AI ได้
              </div>
            )}
            <label style={S.label}>เล่าแนวคำคมที่อยากได้ (เช่น "คำคมให้กำลังใจคนทำงาน โทนอบอุ่น แอบขำนิดๆ")</label>
            <textarea
              style={{ ...S.input, minHeight: 60, resize: 'vertical', marginBottom: 10 }}
              value={styleDesc}
              onChange={e => setStyleDesc(e.target.value)}
              placeholder="อธิบายแนว/สไตล์/กลุ่มเป้าหมายของคำคม…"
            />
            <label style={S.label}>ตัวอย่างคำคมที่ชอบ (ไม่บังคับ — AI จะเลียนแบบโทนนี้)</label>
            <textarea
              style={{ ...S.input, minHeight: 60, resize: 'vertical', marginBottom: 10 }}
              value={exampleText}
              onChange={e => setExampleText(e.target.value)}
              placeholder={'วางตัวอย่างคำคม บรรทัดละ 1 ข้อ'}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
              <div>
                <label style={S.label}>จำนวน (สูงสุด 100)</label>
                <input
                  type="number" min={1} max={100}
                  style={{ ...S.input, width: 90 }}
                  value={aiCount}
                  onChange={e => setAiCount(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                />
              </div>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={S.label}>AI Model (Kie.ai)</label>
                <select style={S.input} value={aiModel} onChange={e => setAiModel(e.target.value)}>
                  {AI_MODEL_OPTIONS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
                </select>
              </div>
              {aiModel === '__custom__' && (
                <div style={{ flex: 1, minWidth: 140 }}>
                  <label style={S.label}>ชื่อ model กำหนดเอง</label>
                  <input style={S.input} value={customModel} onChange={e => setCustomModel(e.target.value)} placeholder="เช่น gemini-2.5-flash" />
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                style={{ ...S.btn('linear-gradient(135deg,#7c3aed,#a855f7)'), opacity: aiBusy ? 0.6 : 1 }}
                disabled={aiBusy}
                onClick={() => generateWithAI('replace')}
              >
                {aiBusy ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />} AI เขียนให้ (แทนที่)
              </button>
              <button
                style={{ ...S.btn('rgba(124,58,237,0.25)', '#c4b5fd'), border: '1px solid rgba(167,139,250,0.4)', opacity: aiBusy ? 0.6 : 1 }}
                disabled={aiBusy}
                onClick={() => generateWithAI('append')}
              >
                <Plus size={15} /> เขียนต่อท้ายของเดิม
              </button>
            </div>

            {/* สมอง */}
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed #334155' }}>
              <h4 style={{ ...S.cardTitle, fontSize: 12, marginBottom: 8 }}><Brain size={14} color="#f472b6" /> สมองที่บันทึกไว้ (ใช้สไตล์ซ้ำได้)</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <select
                  style={{ ...S.input, width: 'auto', flex: 1, minWidth: 140 }}
                  value={selectedBrainId}
                  onChange={e => loadBrain(e.target.value)}
                >
                  <option value="">— เลือกสมองที่บันทึกไว้ —</option>
                  {brains.map(b => <option key={b.id} value={b.id}>🧠 {b.name}</option>)}
                </select>
                {selectedBrainId && (
                  <button style={{ ...S.btnGhost, color: '#f87171', borderColor: 'rgba(248,113,113,0.4)' }} onClick={deleteBrain}>
                    <Trash2 size={13} /> ลบ
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input
                  style={S.input}
                  value={brainName}
                  onChange={e => setBrainName(e.target.value)}
                  placeholder="ตั้งชื่อสมอง เช่น คำคมเทรดเดอร์สายฮา"
                />
                <button style={S.btn('#db2777')} onClick={saveBrain}>
                  <Save size={14} /> บันทึกสมอง
                </button>
              </div>
            </div>
          </div>

          {/* 4. กล่องข้อความ */}
          <div style={S.card}>
            <h3 style={S.cardTitle}><ImageIcon size={16} color="#fbbf24" /> 4 · กล่องข้อความบนรูป</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              <button style={S.btn('#d97706')} onClick={() => addBox('caption')}>
                <Plus size={14} /> เพิ่มกล่องแคปชั่น
              </button>
              <button style={S.btn('#0d9488')} onClick={() => addBox('credit')}>
                <Plus size={14} /> เพิ่มกล่องเครดิตเพจ
              </button>
              <button style={S.btnGhost} onClick={resetLayout}>
                <RefreshCw size={13} /> รีเซ็ตเลย์เอาต์
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {boxes.map(b => (
                <div
                  key={b.id}
                  onClick={() => setSelectedBoxId(b.id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 10, cursor: 'pointer',
                    background: b.id === selectedBoxId ? 'rgba(56,189,248,0.12)' : 'rgba(30,41,59,0.5)',
                    border: b.id === selectedBoxId ? '1px solid rgba(56,189,248,0.5)' : '1px solid #1e293b',
                  }}
                >
                  <span style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 600 }}>
                    {b.kind === 'caption' ? '💬 กล่องแคปชั่น' : '🏷️ กล่องเครดิตเพจ'}
                    <span style={{ color: '#64748b', fontWeight: 400, marginLeft: 8 }}>
                      {b.kind === 'credit' ? (b.text || '(ว่าง)') : `ฟอนต์ ${b.fontFamily} · ${b.fontSize}px`}
                    </span>
                  </span>
                  <button
                    style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 4, display: 'flex' }}
                    onClick={e => { e.stopPropagation(); removeBox(b.id); }}
                    title="ลบกล่องนี้"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {!boxes.length && <span style={{ fontSize: 12, color: '#64748b' }}>ยังไม่มีกล่อง — กดปุ่มด้านบนเพื่อเพิ่ม</span>}
            </div>

            {/* Inspector กล่องที่เลือก */}
            {selectedBox && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px dashed #334155' }}>
                <h4 style={{ ...S.cardTitle, fontSize: 12, marginBottom: 10 }}>
                  ⚙️ ปรับแต่ง: {selectedBox.kind === 'caption' ? '💬 กล่องแคปชั่น' : '🏷️ กล่องเครดิตเพจ'}
                </h4>
                {selectedBox.kind === 'credit' && (
                  <div style={{ marginBottom: 10 }}>
                    <label style={S.label}>ข้อความเครดิตเพจ</label>
                    <input style={S.input} value={selectedBox.text} onChange={e => updateSelectedBox({ text: e.target.value })} placeholder="@ชื่อเพจของคุณ" />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={S.label}>ฟอนต์ ({FONT_FAMILIES.length} แบบ)</label>
                    <select
                      style={{ ...S.input, fontFamily: `"${selectedBox.fontFamily}", sans-serif` }}
                      value={selectedBox.fontFamily}
                      onChange={e => updateSelectedBox({ fontFamily: e.target.value })}
                    >
                      {FONT_FAMILIES.map(f => (
                        <option key={f.name} value={f.name} style={{ fontFamily: `"${f.name}", sans-serif` }}>{f.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={S.label}>เอฟเฟคตัวอักษร</label>
                    <select style={S.input} value={selectedBox.effect} onChange={e => updateSelectedBox({ effect: e.target.value })}>
                      {TEXT_EFFECTS.map(fx => <option key={fx.id} value={fx.id}>{fx.label}</option>)}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div>
                    <label style={S.label}>ขนาดตัวอักษร: {selectedBox.fontSize}px</label>
                    <input type="range" min={14} max={200} value={selectedBox.fontSize} style={{ width: '100%' }}
                      onChange={e => updateSelectedBox({ fontSize: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label style={S.label}>ความกว้างกล่อง: {Math.round(selectedBox.wPct)}%</label>
                    <input type="range" min={10} max={100} value={selectedBox.wPct} style={{ width: '100%' }}
                      onChange={e => updateSelectedBox({ wPct: parseInt(e.target.value) })} />
                  </div>
                  <div>
                    <label style={S.label}>ระยะบรรทัด: {selectedBox.lineHeight.toFixed(2)}</label>
                    <input type="range" min={100} max={220} value={selectedBox.lineHeight * 100} style={{ width: '100%' }}
                      onChange={e => updateSelectedBox({ lineHeight: parseInt(e.target.value) / 100 })} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                  <div>
                    <label style={S.label}>สีตัวอักษร</label>
                    <input type="color" value={selectedBox.color} style={{ width: 46, height: 30, border: 'none', background: 'none', cursor: 'pointer' }}
                      onChange={e => updateSelectedBox({ color: e.target.value })} />
                  </div>
                  <div>
                    <label style={S.label}>ตัวหนา</label>
                    <button
                      style={{ ...S.btnGhost, background: selectedBox.bold ? 'rgba(56,189,248,0.2)' : 'rgba(51,65,85,0.5)', color: selectedBox.bold ? '#7dd3fc' : '#cbd5e1' }}
                      onClick={() => updateSelectedBox({ bold: !selectedBox.bold })}
                    >
                      <Type size={13} /> {selectedBox.bold ? 'หนา' : 'ปกติ'}
                    </button>
                  </div>
                  <div>
                    <label style={S.label}>จัดวาง</label>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button
                          key={a}
                          style={{ ...S.btnGhost, padding: '6px 10px', background: selectedBox.align === a ? 'rgba(56,189,248,0.2)' : 'rgba(51,65,85,0.5)', color: selectedBox.align === a ? '#7dd3fc' : '#cbd5e1' }}
                          onClick={() => updateSelectedBox({ align: a })}
                        >
                          {a === 'left' ? 'ซ้าย' : a === 'center' ? 'กลาง' : 'ขวา'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div>
                    <label style={S.label}>พื้นหลังกล่อง</label>
                    <button
                      style={{ ...S.btnGhost, background: selectedBox.bgEnabled ? 'rgba(56,189,248,0.2)' : 'rgba(51,65,85,0.5)', color: selectedBox.bgEnabled ? '#7dd3fc' : '#cbd5e1' }}
                      onClick={() => updateSelectedBox({ bgEnabled: !selectedBox.bgEnabled })}
                    >
                      {selectedBox.bgEnabled ? 'เปิด' : 'ปิด'}
                    </button>
                  </div>
                  {selectedBox.bgEnabled && (
                    <>
                      <div>
                        <label style={S.label}>สีพื้น</label>
                        <input type="color" value={selectedBox.bgColor} style={{ width: 46, height: 30, border: 'none', background: 'none', cursor: 'pointer' }}
                          onChange={e => updateSelectedBox({ bgColor: e.target.value })} />
                      </div>
                      <div style={{ minWidth: 110 }}>
                        <label style={S.label}>ความทึบ: {selectedBox.bgOpacity}%</label>
                        <input type="range" min={5} max={100} value={selectedBox.bgOpacity} style={{ width: '100%' }}
                          onChange={e => updateSelectedBox({ bgOpacity: parseInt(e.target.value) })} />
                      </div>
                      <div style={{ minWidth: 110 }}>
                        <label style={S.label}>มุมโค้ง: {selectedBox.bgRadius}px</label>
                        <input type="range" min={0} max={80} value={selectedBox.bgRadius} style={{ width: '100%' }}
                          onChange={e => updateSelectedBox({ bgRadius: parseInt(e.target.value) })} />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ คอลัมน์ขวา: พรีวิว + ควบคุมงาน ═══ */}
        <div style={{ position: 'sticky', top: 12 }}>
          {/* พรีวิว */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
              <h3 style={{ ...S.cardTitle, marginBottom: 0 }}><Eye size={16} color="#4ade80" /> Preview <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>ลากกล่องเพื่อย้าย · จุดขวา = กว้าง · จุดมุม = ขนาดอักษร</span></h3>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button style={{ ...S.btnGhost, padding: '5px 8px' }} disabled={!imageFiles.length}
                  onClick={() => setPreviewImageIdx(i => (i - 1 + imageFiles.length) % Math.max(1, imageFiles.length))}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 76, textAlign: 'center' }}>
                  รูป {imageFiles.length ? Math.min(previewImageIdx, imageFiles.length - 1) + 1 : 0}/{imageFiles.length}
                </span>
                <button style={{ ...S.btnGhost, padding: '5px 8px' }} disabled={!imageFiles.length}
                  onClick={() => setPreviewImageIdx(i => (i + 1) % Math.max(1, imageFiles.length))}>
                  <ChevronRight size={14} />
                </button>
                <button style={{ ...S.btnGhost, padding: '5px 8px' }} disabled={!imageFiles.length} title="สุ่มรูปพรีวิว"
                  onClick={() => setPreviewImageIdx(Math.floor(Math.random() * Math.max(1, imageFiles.length)))}>
                  <Shuffle size={14} />
                </button>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button style={{ ...S.btnGhost, padding: '5px 8px' }} disabled={captions.length < 2}
                  onClick={() => setPreviewCaptionIdx(i => (i - 1 + captions.length) % Math.max(1, captions.length))}>
                  <ChevronLeft size={14} />
                </button>
                <span style={{ fontSize: 11, color: '#94a3b8', minWidth: 96, textAlign: 'center' }}>
                  แคปชั่น {captions.length ? Math.min(previewCaptionIdx, captions.length - 1) + 1 : 0}/{captions.length}
                </span>
                <button style={{ ...S.btnGhost, padding: '5px 8px' }} disabled={captions.length < 2}
                  onClick={() => setPreviewCaptionIdx(i => (i + 1) % Math.max(1, captions.length))}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
            <div
              ref={previewWrapRef}
              style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', background: '#020617', userSelect: 'none' }}
              onMouseDown={() => setSelectedBoxId('')}
            >
              <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />
              {boxRects.map(r => (
                <div key={r.id} style={overlayStyle(r)} onMouseDown={e => beginDrag(e, r.id, 'move')}>
                  {/* จุดจับขอบขวา = ปรับความกว้าง */}
                  <div
                    onMouseDown={e => beginDrag(e, r.id, 'width')}
                    style={{ position: 'absolute', right: -6, top: '50%', transform: 'translateY(-50%)', width: 12, height: 12, borderRadius: '50%', background: '#38bdf8', cursor: 'ew-resize', border: '2px solid #0c4a6e' }}
                    title="ลากซ้าย-ขวาเพื่อปรับความกว้างกล่อง"
                  />
                  {/* จุดจับมุมล่างขวา = ปรับขนาดตัวอักษร */}
                  <div
                    onMouseDown={e => beginDrag(e, r.id, 'font')}
                    style={{ position: 'absolute', right: -6, bottom: -6, width: 12, height: 12, borderRadius: 3, background: '#fbbf24', cursor: 'nwse-resize', border: '2px solid #78350f' }}
                    title="ลากขึ้น-ลงเพื่อปรับขนาดตัวอักษร"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 5. ควบคุมงาน */}
          <div style={{ ...S.card, border: '1px solid rgba(74,222,128,0.25)' }}>
            <h3 style={S.cardTitle}><Play size={16} color="#4ade80" /> 5 · เริ่มตัดต่อรูปทั้งหมด</h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 12 }}>
              <div>
                <label style={S.label}>วิธีเลือกรูป</label>
                <select style={S.input} value={pickMode} onChange={e => setPickMode(e.target.value as any)}>
                  <option value="random">🎲 สุ่มไม่ซ้ำ (วนใหม่เมื่อหมด)</option>
                  <option value="sequential">📑 เรียงตามลำดับไฟล์</option>
                </select>
              </div>
              <div>
                <label style={S.label}>ฟอร์แมตไฟล์</label>
                <select style={S.input} value={outFormat} onChange={e => setOutFormat(e.target.value as any)}>
                  <option value="jpg">JPG (ไฟล์เล็ก)</option>
                  <option value="png">PNG (คมชัดสุด)</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                style={{ ...S.btn(runState === 'running' ? 'rgba(74,222,128,0.3)' : 'linear-gradient(135deg,#16a34a,#22c55e)'), fontSize: 14, padding: '11px 22px', opacity: runState === 'running' ? 0.7 : 1 }}
                disabled={runState === 'running'}
                onClick={startRun}
              >
                {runState === 'running'
                  ? <><Loader2 size={16} className="animate-spin" /> กำลังทำงาน…</>
                  : runState === 'paused'
                    ? <><Play size={16} /> ทำต่อ</>
                    : <><Play size={16} /> เริ่มตัดต่อ ({captions.length} รูป)</>}
              </button>
              <button
                style={{ ...S.btn('#d97706'), opacity: runState === 'running' ? 1 : 0.45 }}
                disabled={runState !== 'running'}
                onClick={pauseRun}
              >
                <Pause size={15} /> พัก
              </button>
              <button
                style={{ ...S.btn('#dc2626'), opacity: runState === 'idle' ? 0.45 : 1 }}
                disabled={runState === 'idle'}
                onClick={stopRun}
              >
                <Square size={15} /> หยุด
              </button>
            </div>
            {progress.total > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#94a3b8', marginBottom: 4 }}>
                  <span>ความคืบหน้า</span>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>{progress.done}/{progress.total} รูป</span>
                </div>
                <div style={{ height: 8, borderRadius: 999, background: '#1e293b', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(progress.done / progress.total) * 100}%`, background: 'linear-gradient(90deg,#16a34a,#4ade80)', transition: 'width 0.3s' }} />
                </div>
              </div>
            )}
          </div>

          {/* Log */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showLogs ? 10 : 0 }}>
              <h3 style={{ ...S.cardTitle, marginBottom: 0 }}>
                <Terminal size={16} color="#94a3b8" /> Log การทำงาน
                <span style={{ fontSize: 10, fontWeight: 500, color: '#64748b' }}>({logs.length} รายการ)</span>
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {logs.length > 0 && (
                  <button style={{ ...S.btnGhost, padding: '5px 10px', fontSize: 11 }} onClick={() => setLogs([])}>
                    <Trash2 size={12} /> ล้าง
                  </button>
                )}
                <button style={{ ...S.btnGhost, padding: '5px 10px', fontSize: 11 }} onClick={() => setShowLogs(v => !v)}>
                  {showLogs ? <><EyeOff size={12} /> ซ่อน</> : <><Eye size={12} /> แสดง</>}
                </button>
              </div>
            </div>
            {showLogs && (
              <div style={{ maxHeight: 240, overflowY: 'auto', background: '#020617', borderRadius: 10, padding: '10px 12px', fontFamily: 'ui-monospace, monospace', fontSize: 11.5, lineHeight: 1.7 }}>
                {logs.length === 0 && <span style={{ color: '#475569' }}>ยังไม่มี log — ทุกขั้นตอนจะแสดงตรงนี้อย่างละเอียด</span>}
                {logs.map((l, i) => (
                  <div key={i} style={{ color: logColor(l.kind), wordBreak: 'break-word' }}>
                    <span style={{ color: '#475569' }}>[{l.time}]</span> {l.kind === 'ok' && <CheckCircle2 size={11} style={{ display: 'inline', verticalAlign: -1 }} />}{l.kind === 'err' && <AlertCircle size={11} style={{ display: 'inline', verticalAlign: -1 }} />} {l.msg}
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
