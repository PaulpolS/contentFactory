import React, { useEffect, useRef, useState } from 'react';
import {
  RefreshCw,
  CheckCircle,
  Settings,
  AlertCircle,
  FolderOpen,
  Music,
  Square,
  User
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
  avatarLayout: 'avatar_vertical_avatar_layout',
  shopeeMode: 'avatar_vertical_shopee_mode',
  shopeeProductFolder: 'avatar_vertical_shopee_product_folder',
  shopeeAvatarFolder: 'avatar_vertical_shopee_avatar_folder',
  shopeeHeadlines: 'avatar_vertical_shopee_headlines',
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

// เลย์เอาต์การแสดง Avatar — ตรงกับ switch ใน backend (/api/render-avatar-vertical-clip)
const AVATAR_LAYOUTS = [
  { id: 'split', label: 'แบ่งบน-ล่าง', icon: '🔲', desc: 'footage ด้านบน + Avatar ด้านล่าง (ของเดิม)' },
  { id: 'bottom-band', label: 'แถบล่าง', icon: '📺', desc: 'footage เต็มจอ + คลิป Avatar แนวนอนวางแถบล่าง' },
  { id: 'circle', label: 'วงกลม Face-cam', icon: '⭕', desc: 'footage เต็มจอ + หน้า Avatar crop วงกลม' },
  { id: 'greenscreen-full', label: 'กรีนสกรีนเต็มจอ', icon: '🟩', desc: 'Avatar เจาะพื้นหลังเขียวซ้อนเต็มจอ' },
];

// ป้ายกำกับสไตล์พาดหัว 3 แบบที่ AI สร้าง (ตรงลำดับกับ generateAiHeadline ใน backend)
const HEADLINE_STYLE_LABELS = ['🧠 สุขุม/ปรัชญา', '🔥 Clickbait', '✅ บอกประโยชน์'];

// ฟอนต์พาดหัว — family name ต้องตรงกับไฟล์ใน public/Font_stock
const HEADLINE_FONTS = [
  { id: 'Prompt', label: 'Prompt (ค่าเริ่มต้น)' },
  { id: 'Kanit', label: 'Kanit' },
  { id: 'Mitr', label: 'Mitr' },
  { id: 'Mali', label: 'Mali' },
  { id: 'Sarabun', label: 'Sarabun' },
  { id: 'Chonburi', label: 'Chonburi' },
  { id: 'Itim', label: 'Itim (ลายมือ)' },
  { id: 'Noto Sans Thai', label: 'Noto Sans Thai' },
];

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

// ── พรีวิวพาดหัวให้ "ตรงกับ output จริง" ──
// มิเรอร์ logic ของ backend (makeTitle → wrapTitleLine(26) → 3 บรรทัด)
// เพื่อให้การตัดบรรทัด + ขนาดฟอนต์ auto ในพรีวิวตรงกับวิดีโอที่เรนเดอร์ออกมา
function segmentGraphemes(str: string): string[] {
  const regex = /[^\u0e30-\u0e39\u0e47-\u0e4c\u0e4d\u0e4e][\u0e30-\u0e39\u0e47-\u0e4c\u0e4d\u0e4e]*/g;
  return str.match(regex) || Array.from(str);
}

function wrapWord(word: string, maxChars: number): string[] {
  const graphemes = segmentGraphemes(word);
  const chunks: string[] = [];
  for (let i = 0; i < graphemes.length; i += maxChars) {
    chunks.push(graphemes.slice(i, i + maxChars).join(''));
  }
  return chunks;
}

function wrapTitleLineForPreview(line: string, maxChars = 26): string[] {
  const words = line.split(' ').filter(Boolean);
  if (words.length === 0) return [];
  const out: string[] = [];
  let current = '';
  for (const word of words) {
    const wordGraphemes = segmentGraphemes(word);
    if (wordGraphemes.length > maxChars) {
      if (current) {
        out.push(current);
        current = '';
      }
      const subWords = wrapWord(word, maxChars);
      for (let i = 0; i < subWords.length - 1; i++) {
        out.push(subWords[i]);
      }
      current = subWords[subWords.length - 1];
    } else {
      const next = current ? `${current} ${word}` : word;
      const nextGraphemes = segmentGraphemes(next);
      if (nextGraphemes.length > maxChars && current) {
        out.push(current);
        current = word;
      } else {
        current = next;
      }
    }
  }
  if (current) out.push(current);
  return out;
}

function wrapHeadlineForPreview(text: string): string {
  const normalized = String(text || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(l => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 3);
  return normalized.flatMap(l => wrapTitleLineForPreview(l, 26)).slice(0, 3).join('\n');
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

// แปลงวินาที → m:ss สำหรับแสดงเวลาในซับ (คืน '' ถ้าไม่มีค่า)
function formatSubTime(sec: any) {
  const n = Number(sec);
  if (!isFinite(n) || n < 0) return '';
  const m = Math.floor(n / 60);
  const s = Math.floor(n % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
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
  const [useGreenScreenKeying, setUseGreenScreenKeying] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.useGreenScreenKeying) === 'true');
  const [headlineAiEnabled, setHeadlineAiEnabled] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.headlineAiEnabled) === 'true');

  // เลย์เอาต์ Avatar (split | bottom-band | circle | greenscreen-full) — map ย้อนหลังจาก flag เดิม
  const [avatarLayout, setAvatarLayout] = useState(() => {
    const saved = localStorage.getItem(AVATAR_VERTICAL_KEYS.avatarLayout);
    if (saved) return saved;
    return localStorage.getItem(AVATAR_VERTICAL_KEYS.isVerticalAvatar) === 'true' ? 'greenscreen-full' : 'split';
  });
  // สไลเดอร์ขนาดต่อเลย์เอาต์
  const [footageRatioPct, setFootageRatioPct] = useState(() => Number(localStorage.getItem('avatar_vertical_footage_ratio_pct') || 54));
  const [avatarScalePct, setAvatarScalePct] = useState(() => Number(localStorage.getItem('avatar_vertical_avatar_scale_pct') || 100));
  const [bandHeightPct, setBandHeightPct] = useState(() => Number(localStorage.getItem('avatar_vertical_band_height_pct') || 32));
  const [bandPosYPct, setBandPosYPct] = useState(() => Number(localStorage.getItem('avatar_vertical_band_pos_y_pct') || 0));
  const [circleDiameterPct, setCircleDiameterPct] = useState(() => Number(localStorage.getItem('avatar_vertical_circle_diameter_pct') || 38));
  const [circlePosXPct, setCirclePosXPct] = useState(() => Number(localStorage.getItem('avatar_vertical_circle_pos_x_pct') || 50));
  const [circlePosYPct, setCirclePosYPct] = useState(() => Number(localStorage.getItem('avatar_vertical_circle_pos_y_pct') || 72));
  // Crop ใบหน้าในวงกลม (ตั้งครั้งเดียวใช้ทุกคลิป): size=ซูม, X/Y=ตำแหน่งใน source frame
  const [circleCropSizePct, setCircleCropSizePct] = useState(() => Number(localStorage.getItem('avatar_vertical_circle_crop_size_pct') || 80));
  const [circleCropXPct, setCircleCropXPct] = useState(() => Number(localStorage.getItem('avatar_vertical_circle_crop_x_pct') || 50));
  const [circleCropYPct, setCircleCropYPct] = useState(() => Number(localStorage.getItem('avatar_vertical_circle_crop_y_pct') || 32));
  // เฟรมตัวอย่างสำหรับเครื่องมือเลือก crop หน้า
  const [cropFrameImage, setCropFrameImage] = useState('');
  const [cropFrameAspect, setCropFrameAspect] = useState(16 / 9); // w/h ของเฟรมต้นฉบับ
  const [isLoadingFrame, setIsLoadingFrame] = useState(false);

  // ── ลายน้ำเครดิต (Watermark) ──
  const [watermarkEnabled, setWatermarkEnabled] = useState(() => localStorage.getItem('avatar_vertical_wm_enabled') === 'true');
  const [watermarkText, setWatermarkText] = useState(() => localStorage.getItem('avatar_vertical_wm_text') || '');
  const [watermarkMode, setWatermarkMode] = useState(() => localStorage.getItem('avatar_vertical_wm_mode') || 'random-corners');
  const [watermarkCorner, setWatermarkCorner] = useState(() => localStorage.getItem('avatar_vertical_wm_corner') || 'bottom-right');
  const [watermarkStyle, setWatermarkStyle] = useState(() => localStorage.getItem('avatar_vertical_wm_style') || 'faint');
  const [watermarkOpacity, setWatermarkOpacity] = useState(() => Number(localStorage.getItem('avatar_vertical_wm_opacity') || 35)); // % (5-100)
  const [watermarkFontSize, setWatermarkFontSize] = useState(() => Number(localStorage.getItem('avatar_vertical_wm_font_size') || 44));
  const [watermarkFont, setWatermarkFont] = useState(() => localStorage.getItem('avatar_vertical_wm_font') || 'Prompt');
  const [watermarkInterval, setWatermarkInterval] = useState(() => Number(localStorage.getItem('avatar_vertical_wm_interval') || 4));

  // โหมด Shopee (จับคู่ footage สินค้า ↔ Avatar เป็นชุด)
  const [shopeeMode, setShopeeMode] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.shopeeMode) === 'true');
  const [shopeeProductFolder, setShopeeProductFolder] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.shopeeProductFolder) || '');
  const [shopeeAvatarFolder, setShopeeAvatarFolder] = useState(() => localStorage.getItem(AVATAR_VERTICAL_KEYS.shopeeAvatarFolder) || '');
  const [shopeePairs, setShopeePairs] = useState<any[]>([]);
  const [shopeeProductOptions, setShopeeProductOptions] = useState<any[]>([]);
  const [shopeeSelected, setShopeeSelected] = useState<string[]>([]);
  const [shopeeHeadlines, setShopeeHeadlines] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(AVATAR_VERTICAL_KEYS.shopeeHeadlines) || '{}'); } catch { return {}; }
  });
  const [shopeeStatus, setShopeeStatus] = useState<Record<string, { status: string; message?: string; outputPath?: string }>>({});
  // สถานะถอดซับแยกขั้นตอน (idle | transcribing | done | error) — แคชไว้เพื่อเรนเดอร์ซ้ำไม่ต้องถอดเสียงใหม่
  const [shopeeSubStatus, setShopeeSubStatus] = useState<Record<string, 'idle' | 'transcribing' | 'done' | 'error'>>({});
  const [isPairing, setIsPairing] = useState(false);
  const [isTranscribingAll, setIsTranscribingAll] = useState(false);

  // ── ฐานข้อมูลสินค้าจริง (ใช้เขียนพาดหัวแทนสคริปต์ตลก) ──
  const [shopeeProductDb, setShopeeProductDb] = useState<Array<{ name: string; link: string; detail: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('avatar_vertical_shopee_product_db') || '[]'); } catch { return []; }
  });
  const [shopeeDbSource, setShopeeDbSource] = useState(() => localStorage.getItem('avatar_vertical_shopee_product_db_source') || '');
  const [shopeeDbSheetUrl, setShopeeDbSheetUrl] = useState(() => localStorage.getItem('avatar_vertical_shopee_db_sheet_url') || 'https://docs.google.com/spreadsheets/d/18sppbH-mkojCxcMhOMz726a8UVwx6jUl-UaXoSHIxi0/edit?gid=337821009');
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [isDbHeadlineAll, setIsDbHeadlineAll] = useState(false);
  // Picker modal เลือกพาดหัวจาก DB ต่อแถว
  const [dbHlOpen, setDbHlOpen] = useState(false);
  const [dbHlTarget, setDbHlTarget] = useState('');
  const [dbHlProductName, setDbHlProductName] = useState('');
  const [dbHlOptions, setDbHlOptions] = useState<string[]>([]);
  const [dbHlLoading, setDbHlLoading] = useState(false);
  const [dbHlError, setDbHlError] = useState('');

  // Interactive AI Headline Modal state
  const [isHeadlineModalOpen, setIsHeadlineModalOpen] = useState(false);
  const [modalAvatarFile, setModalAvatarFile] = useState('');
  const [modalTranscript, setModalTranscript] = useState('');
  const [modalHeadlines, setModalHeadlines] = useState<string[]>([]);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalProgressText, setModalProgressText] = useState('');

  // Popup ดูซับที่ถอดไว้แล้ว (Shopee)
  const [subsViewerOpen, setSubsViewerOpen] = useState(false);
  const [subsViewerTitle, setSubsViewerTitle] = useState('');
  const [subsViewerSegments, setSubsViewerSegments] = useState<any[]>([]);

  // Customizable Hook Headline Banner states
  const [headlineStyle, setHeadlineStyle] = useState(() => localStorage.getItem('avatar_vertical_headline_style') || 'classic-gold');
  const [headlinePadding, setHeadlinePadding] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_padding') || 32));
  const [headlineOpacity, setHeadlineOpacity] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_opacity') || 96));
  const [headlineFontSize, setHeadlineFontSize] = useState(() => {
    const saved = localStorage.getItem('avatar_vertical_headline_font_size');
    return saved !== null ? Number(saved) : 82;
  });
  const [headlineYPosition, setHeadlineYPosition] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_y_position') || 220));
  const [headlineFont, setHeadlineFont] = useState(() => localStorage.getItem('avatar_vertical_headline_font') || 'Prompt');
  // กล่องพาดหัวกำหนดขนาดเอง (0 = อัตโนมัติตามตัวอักษร)
  const [headlineBoxWidth, setHeadlineBoxWidth] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_box_width') || 0));
  const [headlineBoxHeight, setHeadlineBoxHeight] = useState(() => Number(localStorage.getItem('avatar_vertical_headline_box_height') || 0));

  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [avatarFiles, setAvatarFiles] = useState<string[]>([]);
  const [titleTexts, setTitleTexts] = useState<Record<string, string>>(readSavedTitleTexts);
  const [items, setItems] = useState<AvatarRenderItem[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // ── ลากปรับตำแหน่งพาดหัวบนพรีวิว (อ้างอิงกรอบจอ 9:16 = 1920px สูง) ──
  const previewScreenRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingHeadline, setIsDraggingHeadline] = useState(false);
  const startHeadlineDrag = (e: React.PointerEvent) => {
    e.preventDefault();
    const screen = previewScreenRef.current;
    if (!screen) return;
    setIsDraggingHeadline(true);
    // เก็บ offset ระหว่างจุดที่จับกับขอบบนของป้าย เพื่อให้ลากลื่น ไม่กระโดดตอนจับ
    const bannerTop = (e.currentTarget as HTMLElement).getBoundingClientRect().top;
    const grabOffset = e.clientY - bannerTop;
    const moveTo = (clientY: number) => {
      const rect = screen.getBoundingClientRect();
      if (rect.height <= 0) return;
      const ratio = (clientY - grabOffset - rect.top) / rect.height; // 0 (บนสุด) → 1 (ล่างสุด)
      const y = Math.round(ratio * 1920);
      setHeadlineYPosition(Math.max(50, Math.min(1500, y)));         // คุมช่วงเดียวกับสไลเดอร์
    };
    const onMove = (ev: PointerEvent) => moveTo(ev.clientY);
    const onUp = () => {
      setIsDraggingHeadline(false);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // ── ลาก/ปรับขนาด Avatar overlay บนพรีวิว (ตรงกับพิกัดที่ backend ใช้เรนเดอร์) ──
  const [avatarPreviewMode, setAvatarPreviewMode] = useState<'idle' | 'drag' | 'resize'>('idle');
  const clampNum = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(v)));

  // วงกลม Face-cam: ลากย้ายจุดศูนย์กลาง
  const startCircleDrag = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const screen = previewScreenRef.current; if (!screen) return;
    setAvatarPreviewMode('drag');
    const onMove = (ev: PointerEvent) => {
      const rect = screen.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setCirclePosXPct(clampNum(((ev.clientX - rect.left) / rect.width) * 100, 0, 100));
      setCirclePosYPct(clampNum(((ev.clientY - rect.top) / rect.height) * 100, 0, 100));
    };
    const onUp = () => { setAvatarPreviewMode('idle'); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  // วงกลม Face-cam: ลากที่ขอบเพื่อย่อ/ขยาย (เส้นผ่านศูนย์กลาง = 2 × ระยะจากศูนย์กลางถึงเมาส์)
  const startCircleResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const screen = previewScreenRef.current; if (!screen) return;
    setAvatarPreviewMode('resize');
    const rect0 = screen.getBoundingClientRect();
    const cxPx = rect0.left + (circlePosXPct / 100) * rect0.width;
    const cyPx = rect0.top + (circlePosYPct / 100) * rect0.height;
    const onMove = (ev: PointerEvent) => {
      const rect = screen.getBoundingClientRect();
      if (rect.width <= 0) return;
      const distPx = Math.hypot(ev.clientX - cxPx, ev.clientY - cyPx);
      setCircleDiameterPct(clampNum(((distPx * 2) / rect.width) * 100, 18, 70));
    };
    const onUp = () => { setAvatarPreviewMode('idle'); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // แถบล่าง: ลากขึ้น/ลงเพื่อปรับระยะห่างจากขอบล่าง
  const startBandDrag = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const screen = previewScreenRef.current; if (!screen) return;
    setAvatarPreviewMode('drag');
    const onMove = (ev: PointerEvent) => {
      const rect = screen.getBoundingClientRect();
      if (rect.height <= 0) return;
      const centerFromBottomPct = ((rect.bottom - ev.clientY) / rect.height) * 100;
      setBandPosYPct(clampNum(centerFromBottomPct - bandHeightPct / 2, 0, 40));
    };
    const onUp = () => { setAvatarPreviewMode('idle'); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  // แถบล่าง: ลากขอบบนเพื่อปรับความสูง
  const startBandResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const screen = previewScreenRef.current; if (!screen) return;
    setAvatarPreviewMode('resize');
    const onMove = (ev: PointerEvent) => {
      const rect = screen.getBoundingClientRect();
      if (rect.height <= 0) return;
      const bandBottomPx = rect.bottom - (bandPosYPct / 100) * rect.height;
      const heightPx = bandBottomPx - ev.clientY;
      setBandHeightPct(clampNum((heightPx / rect.height) * 100, 15, 60));
    };
    const onUp = () => { setAvatarPreviewMode('idle'); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  // กรีนสกรีน: ลากขอบเพื่อปรับสเกล Avatar (อิงความกว้าง)
  const startGreenscreenResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const screen = previewScreenRef.current; if (!screen) return;
    setAvatarPreviewMode('resize');
    const onMove = (ev: PointerEvent) => {
      const rect = screen.getBoundingClientRect();
      if (rect.width <= 0) return;
      const halfWidthPx = Math.abs(ev.clientX - (rect.left + rect.width / 2));
      setAvatarScalePct(clampNum(((halfWidthPx * 2) / rect.width) * 100, 40, 120));
    };
    const onUp = () => { setAvatarPreviewMode('idle'); window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  // โหลดเฟรมตัวอย่างจากคลิป Avatar ตัวแรก (โหมด Shopee = คู่แรกที่จับได้, โหมดปกติ = ไฟล์แรก)
  const loadCropFrame = async () => {
    let videoPath = '';
    if (shopeeMode) {
      const p = shopeePairs.find((x: any) => x.matched && x.avatarVideoFile) || shopeePairs.find((x: any) => x.avatarVideoFile);
      if (p) videoPath = `${p.avatarVideoDir}/${p.avatarVideoFile}`;
    } else if (avatarFolder && avatarFiles.length > 0) {
      videoPath = `${avatarFolder}/${avatarFiles[0]}`;
    }
    if (!videoPath) { alert('ยังไม่มีคลิป Avatar ให้โหลดเฟรม — เลือกโฟลเดอร์ Avatar ก่อนครับ'); return; }
    setIsLoadingFrame(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/extract-avatar-frame`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoPath }),
      });
      const data = await res.json();
      if (data.success && data.image) {
        setCropFrameImage(data.image);
        if (data.width > 0 && data.height > 0) setCropFrameAspect(data.width / data.height);
        addLog('🖼️ โหลดเฟรมตัวอย่างสำหรับตั้งค่า Crop หน้าแล้ว');
      }
      else addLog(`❌ โหลดเฟรมไม่สำเร็จ: ${data.error || 'unknown'}`);
    } catch (e: any) {
      addLog(`❌ โหลดเฟรมผิดพลาด: ${e.message || e}`);
    } finally { setIsLoadingFrame(false); }
  };

  // ลาก/ย่อขยายวงกลม crop บนเฟรมตัวอย่าง (อ้างอิงกรอบรูปที่แสดง)
  const cropBoxRef = useRef<HTMLDivElement | null>(null);
  // จุดยึดสำหรับเลื่อนจอลงไปยังแถบปุ่มเรนเดอร์ (ใช้ตอนกด "ใช้ค่า Crop นี้")
  const renderActionsRef = useRef<HTMLDivElement | null>(null);
  const goToRenderActions = () => {
    renderActionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const startCropDrag = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const box = cropBoxRef.current; if (!box) return;
    const onMove = (ev: PointerEvent) => {
      const rect = box.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setCircleCropXPct(clampNum(((ev.clientX - rect.left) / rect.width) * 100, 0, 100));
      setCircleCropYPct(clampNum(((ev.clientY - rect.top) / rect.height) * 100, 0, 100));
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };
  const startCropResize = (e: React.PointerEvent) => {
    e.preventDefault(); e.stopPropagation();
    const box = cropBoxRef.current; if (!box) return;
    const rect0 = box.getBoundingClientRect();
    const minSide = Math.min(rect0.width, rect0.height);
    const cxPx = rect0.left + (circleCropXPct / 100) * rect0.width;
    const cyPx = rect0.top + (circleCropYPct / 100) * rect0.height;
    const onMove = (ev: PointerEvent) => {
      const distPx = Math.hypot(ev.clientX - cxPx, ev.clientY - cyPx);
      // distPx = รัศมีของวง → ด้านสี่เหลี่ยม = 2*distPx ; แปลงเป็น % ของด้านสั้น
      setCircleCropSizePct(clampNum(((distPx * 2) / minSide) * 100, 30, 100));
    };
    const onUp = () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

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
  
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.avatarLayout, avatarLayout); }, [avatarLayout]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.useGreenScreenKeying, String(useGreenScreenKeying)); }, [useGreenScreenKeying]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.headlineAiEnabled, String(headlineAiEnabled)); }, [headlineAiEnabled]);
  useEffect(() => { localStorage.setItem('avatar_vertical_footage_ratio_pct', String(footageRatioPct)); }, [footageRatioPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_avatar_scale_pct', String(avatarScalePct)); }, [avatarScalePct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_band_height_pct', String(bandHeightPct)); }, [bandHeightPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_band_pos_y_pct', String(bandPosYPct)); }, [bandPosYPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_circle_diameter_pct', String(circleDiameterPct)); }, [circleDiameterPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_circle_pos_x_pct', String(circlePosXPct)); }, [circlePosXPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_circle_pos_y_pct', String(circlePosYPct)); }, [circlePosYPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_circle_crop_size_pct', String(circleCropSizePct)); }, [circleCropSizePct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_circle_crop_x_pct', String(circleCropXPct)); }, [circleCropXPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_circle_crop_y_pct', String(circleCropYPct)); }, [circleCropYPct]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_enabled', String(watermarkEnabled)); }, [watermarkEnabled]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_text', watermarkText); }, [watermarkText]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_mode', watermarkMode); }, [watermarkMode]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_corner', watermarkCorner); }, [watermarkCorner]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_style', watermarkStyle); }, [watermarkStyle]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_opacity', String(watermarkOpacity)); }, [watermarkOpacity]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_font_size', String(watermarkFontSize)); }, [watermarkFontSize]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_font', watermarkFont); }, [watermarkFont]);
  useEffect(() => { localStorage.setItem('avatar_vertical_wm_interval', String(watermarkInterval)); }, [watermarkInterval]);

  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.shopeeMode, String(shopeeMode)); }, [shopeeMode]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.shopeeProductFolder, shopeeProductFolder); }, [shopeeProductFolder]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.shopeeAvatarFolder, shopeeAvatarFolder); }, [shopeeAvatarFolder]);
  useEffect(() => { localStorage.setItem(AVATAR_VERTICAL_KEYS.shopeeHeadlines, JSON.stringify(shopeeHeadlines)); }, [shopeeHeadlines]);

  useEffect(() => { localStorage.setItem('avatar_vertical_headline_style', headlineStyle); }, [headlineStyle]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_padding', String(headlinePadding)); }, [headlinePadding]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_opacity', String(headlineOpacity)); }, [headlineOpacity]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_font_size', String(headlineFontSize)); }, [headlineFontSize]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_y_position', String(headlineYPosition)); }, [headlineYPosition]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_font', headlineFont); }, [headlineFont]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_box_width', String(headlineBoxWidth)); }, [headlineBoxWidth]);
  useEffect(() => { localStorage.setItem('avatar_vertical_headline_box_height', String(headlineBoxHeight)); }, [headlineBoxHeight]);

  useEffect(() => {
    if (avatarFolder) void refreshAvatarFiles(avatarFolder);
  }, [avatarFolder, outputFolder]);

  useEffect(() => {
    if (shopeeMode && shopeeProductFolder && shopeeAvatarFolder) void refreshShopeePairs(shopeeProductFolder, shopeeAvatarFolder);
  }, [shopeeMode, shopeeProductFolder, shopeeAvatarFolder]);

  // โหลดฐานข้อมูลสินค้าเริ่มต้น (สินค้า Shopee.csv) ครั้งแรกถ้ายังไม่มี
  useEffect(() => {
    if (shopeeProductDb.length === 0) void loadDefaultProductDb(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          avatarLayout,
          isVerticalAvatar: avatarLayout !== 'split',
          useGreenScreenKeying,
          footageRatioPct,
          avatarScalePct,
          bandHeightPct,
          bandPosYPct,
          circleDiameterPct,
          circlePosXPct,
          circlePosYPct,
          circleCropSizePct,
          circleCropXPct,
          circleCropYPct,
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
            yPosition: headlineYPosition,
            font: headlineFont,
            boxWidth: headlineBoxWidth,
            boxHeight: headlineBoxHeight
          },
          watermark: {
            enabled: watermarkEnabled,
            text: watermarkText,
            mode: watermarkMode,
            corner: watermarkCorner,
            style: watermarkStyle,
            opacity: Math.max(5, Math.min(100, watermarkOpacity)) / 100,
            fontSize: watermarkFontSize,
            font: watermarkFont,
            intervalSec: watermarkInterval,
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

  // ── โหมด Shopee: จับคู่โฟลเดอร์ย่อย footage สินค้า ↔ Avatar ──
  const refreshShopeePairs = async (productFolder = shopeeProductFolder, avatarFolderParent = shopeeAvatarFolder) => {
    if (!productFolder || !avatarFolderParent) return;
    setIsPairing(true);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shopee-pair-folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productFolder, avatarFolder: avatarFolderParent }),
      });
      const data = await res.json();
      if (!data.success) {
        addLog(`❌ จับคู่โฟลเดอร์ Shopee ไม่สำเร็จ: ${data.error || 'unknown'}`);
        setShopeePairs([]);
        return;
      }
      const pairs = data.pairs || [];
      setShopeePairs(pairs);
      setShopeeProductOptions(data.productFolders || []);
      // เลือกทุกคู่ที่จับได้โดยอัตโนมัติ
      setShopeeSelected(pairs.filter((p: any) => p.matched).map((p: any) => p.avatarSubfolder));

      // กู้สถานะ "ถอดซับแล้ว" จากแคช เพื่อจะได้ไม่ต้องถอดซ้ำ
      const subsCache = readShopeeSubsCache();
      const subStatusInit: Record<string, 'done'> = {};
      pairs.forEach((p: any) => {
        if (subsCache[p.avatarSubfolderPath] && subsCache[p.avatarSubfolderPath].length > 0) subStatusInit[p.avatarSubfolder] = 'done';
      });
      setShopeeSubStatus(subStatusInit);

      const matchedCount = pairs.filter((p: any) => p.matched).length;
      const cachedCount = Object.keys(subStatusInit).length;
      addLog(`🛒 พบ Avatar ${pairs.length} ชุด, จับคู่สำเร็จ ${matchedCount} ชุด${cachedCount ? ` · ถอดซับไว้แล้ว ${cachedCount} ชุด` : ''}`);
    } catch (e: any) {
      addLog(`❌ จับคู่โฟลเดอร์ Shopee ผิดพลาด: ${e.message || e}`);
    } finally {
      setIsPairing(false);
    }
  };

  const overrideShopeeProduct = (avatarSubfolder: string, productPath: string) => {
    const opt = shopeeProductOptions.find(o => o.path === productPath);
    setShopeePairs(prev => prev.map(p => p.avatarSubfolder === avatarSubfolder ? {
      ...p,
      productSubfolderPath: productPath,
      productSubfolder: opt ? opt.name : '',
      productClipCount: opt ? opt.clipCount : 0,
      matched: !!productPath && !!p.avatarVideoFile,
    } : p));
  };

  // แคชซับ Shopee (key = avatarSubfolderPath) เพื่อให้เรนเดอร์ซ้ำไม่ต้องถอดเสียงใหม่
  const readShopeeSubsCache = (): Record<string, any[]> => {
    try { return JSON.parse(localStorage.getItem('avatar_vertical_shopee_subs_cache') || '{}'); } catch { return {}; }
  };
  const writeShopeeSubsCache = (key: string, segs: any[]) => {
    try { const c = readShopeeSubsCache(); c[key] = segs; localStorage.setItem('avatar_vertical_shopee_subs_cache', JSON.stringify(c)); } catch {}
  };
  const readShopeeHooksCache = (): Record<string, string[]> => {
    try { return JSON.parse(localStorage.getItem('avatar_vertical_shopee_hooks_cache') || '{}'); } catch { return {}; }
  };
  const writeShopeeHooksCache = (key: string, hooks: string[]) => {
    try { const c = readShopeeHooksCache(); c[key] = hooks; localStorage.setItem('avatar_vertical_shopee_hooks_cache', JSON.stringify(c)); } catch {}
  };

  // เปิด popup ดูซับที่ถอดไว้แล้วของคู่นั้น (ดึงจากแคช)
  const openShopeeSubsViewer = (pair: any) => {
    const segs = readShopeeSubsCache()[pair.avatarSubfolderPath] || [];
    setSubsViewerTitle(pair.avatarSubfolder);
    setSubsViewerSegments(segs);
    setSubsViewerOpen(true);
  };

  // ── ฐานข้อมูลสินค้า: parse CSV + โหลด + จับคู่ + เขียนพาดหัวจากข้อมูลจริง ──
  const parseProductCsv = (text: string): Array<{ name: string; link: string; detail: string }> => {
    const rows: string[][] = [];
    let row: string[] = [], field = '', inQ = false;
    const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) { if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
      else { if (c === '"') inQ = true; else if (c === ',') { row.push(field); field = ''; } else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else field += c; }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    const clean = rows.filter(r => r.some(c => c.trim() !== ''));
    if (clean.length === 0) return [];
    const header = clean[0].map(h => h.trim());
    const iName = header.findIndex(h => h.includes('โฟลเดอร์') || h.toLowerCase().includes('name'));
    const iLink = header.findIndex(h => h.toLowerCase().includes('link'));
    const iDetail = header.findIndex(h => h.includes('รายละเอียด') || h.toLowerCase().includes('detail'));
    return clean.slice(1).map(r => ({
      name: (iName >= 0 ? r[iName] : r[0] || '').trim(),
      link: (iLink >= 0 ? r[iLink] : '').trim(),
      detail: (iDetail >= 0 ? r[iDetail] : r[r.length - 1] || '').trim(),
    })).filter(p => p.name);
  };

  const applyProductDb = (products: Array<{ name: string; link: string; detail: string }>, source: string) => {
    setShopeeProductDb(products);
    setShopeeDbSource(source);
    try {
      localStorage.setItem('avatar_vertical_shopee_product_db', JSON.stringify(products));
      localStorage.setItem('avatar_vertical_shopee_product_db_source', source);
    } catch {}
  };

  const loadDefaultProductDb = async (silent = false) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/shopee-product-db`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        applyProductDb(data.products, `ค่าเริ่มต้น: ${pathBasename(data.source) || 'สินค้า Shopee.csv'}`);
        addLog(`🏷️ โหลดฐานข้อมูลสินค้าเริ่มต้น ${data.products.length} รายการ`);
      } else if (!silent) {
        addLog(`⚠️ โหลดฐานข้อมูลสินค้าเริ่มต้นไม่สำเร็จ: ${data.error || 'ไม่พบข้อมูล'}`);
      }
    } catch (e: any) {
      if (!silent) addLog(`❌ โหลดฐานข้อมูลสินค้าไม่สำเร็จ: ${e.message || e}`);
    }
  };

  const loadShopeeDbFromSheet = async () => {
    if (!shopeeDbSheetUrl.trim()) { alert('กรุณาวางลิงก์ Google Sheet ก่อน'); return; }
    setIsLoadingSheet(true);
    try {
      localStorage.setItem('avatar_vertical_shopee_db_sheet_url', shopeeDbSheetUrl);
      const res = await fetch(`${BACKEND_BASE}/api/gsheet-products?url=${encodeURIComponent(shopeeDbSheetUrl)}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        applyProductDb(data.products, `Google Sheet (${data.products.length} รายการ)`);
        addLog(`🔗 ดึงฐานข้อมูลสินค้าจาก Google Sheet สำเร็จ ${data.products.length} รายการ`);
      } else {
        alert(data.error || 'ดึง Google Sheet ไม่สำเร็จ');
        addLog(`❌ ${data.error || 'ดึง Google Sheet ไม่สำเร็จ'}`);
      }
    } catch (e: any) {
      alert(`ดึง Google Sheet ไม่สำเร็จ: ${e.message || e}`);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  const handleUploadProductDb = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      const products = parseProductCsv(text);
      if (products.length === 0) { alert('อ่านไฟล์ CSV ไม่พบข้อมูลสินค้า (ต้องมีคอลัมน์ ชื่อในโฟลเดอร์ / รายละเอียดสินค้า)'); return; }
      applyProductDb(products, file.name);
      addLog(`🏷️ อัพโหลดฐานข้อมูลสินค้า "${file.name}" — ${products.length} รายการ`);
    } catch (e: any) {
      alert(`อ่านไฟล์ไม่สำเร็จ: ${e.message || e}`);
    }
  };

  const numId = (s: string) => (String(s || '').match(/^\s*(\d{1,6})/) || [])[1] || '';
  const findProductForPair = (pair: any) => {
    if (!shopeeProductDb.length) return null;
    const byName = (pair.productSubfolder || '').trim().toLowerCase();
    let hit = byName ? shopeeProductDb.find(p => p.name.trim().toLowerCase() === byName) : undefined;
    if (!hit) {
      const id = numId(pair.productSubfolder) || numId(pair.avatarSubfolder);
      if (id) hit = shopeeProductDb.find(p => numId(p.name) === id);
    }
    return hit || null;
  };

  const fetchDbHeadlines = async (product: { name: string; detail: string }, key: string) => {
    const res = await fetch(`${BACKEND_BASE}/api/shopee-db-headline`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName: product.name, productDetail: product.detail, openRouterKey: key, count: 3 }),
    });
    return res.json();
  };

  const openDbHeadlinePicker = async (pair: any) => {
    const product = findProductForPair(pair);
    setDbHlTarget(pair.avatarSubfolder);
    setDbHlProductName(product?.name || pair.productSubfolder || pair.avatarSubfolder);
    setDbHlOptions([]);
    setDbHlError('');
    setDbHlOpen(true);
    if (!product) { setDbHlError('ไม่พบสินค้านี้ในฐานข้อมูล — อัพโหลด CSV ที่มีสินค้านี้ก่อน'); return; }
    const key = getActiveOpenRouterKey();
    if (!key) { setDbHlError('ยังไม่ได้ตั้งค่า OpenRouter Key (ไปที่หน้า Settings)'); return; }
    setDbHlLoading(true);
    try {
      const data = await fetchDbHeadlines(product, key);
      if (data.success && data.headlines?.length) setDbHlOptions(data.headlines);
      else setDbHlError(data.error || 'AI ไม่ได้ส่งพาดหัวกลับมา');
    } catch (e: any) {
      setDbHlError(e.message || String(e));
    } finally { setDbHlLoading(false); }
  };

  const pickDbHeadline = (headline: string) => {
    if (dbHlTarget) setShopeeHeadlines(prev => ({ ...prev, [dbHlTarget]: headline }));
    setDbHlOpen(false);
    addLog(`🏷️ ใช้พาดหัวจาก DB [${dbHlTarget}]: "${headline}"`);
  };

  const runShopeeDbHeadlineAll = async () => {
    const key = getActiveOpenRouterKey();
    if (!key) return alert('ยังไม่ได้ตั้งค่า OpenRouter Key ในหน้า Settings');
    if (!shopeeProductDb.length) return alert('ยังไม่มีฐานข้อมูลสินค้า — อัพโหลด CSV หรือกดโหลดค่าเริ่มต้นก่อน');
    const targets = shopeePairs.filter(p => shopeeSelected.includes(p.avatarSubfolder) && p.matched && findProductForPair(p));
    if (targets.length === 0) return alert('ไม่มีคู่ที่เลือกและมีข้อมูลในฐานข้อมูลสินค้า');
    setIsDbHeadlineAll(true);
    addLog(`🏷️ เริ่มเขียนพาดหัวจาก DB ${targets.length} คลิป...`);
    for (const p of targets) {
      const product = findProductForPair(p);
      if (!product) continue;
      try {
        const data = await fetchDbHeadlines(product, key);
        if (data.success && data.headlines?.length) {
          setShopeeHeadlines(prev => ({ ...prev, [p.avatarSubfolder]: data.headlines[0] }));
          addLog(`✅ [${p.avatarSubfolder}] "${data.headlines[0]}"${data.headlines.length > 1 ? ` · อีก ${data.headlines.length - 1} แบบ: ${data.headlines.slice(1).join(' | ')}` : ''}`);
        } else {
          addLog(`⚠️ [${p.avatarSubfolder}] ${data.error || 'ไม่ได้พาดหัว'}`);
        }
      } catch (e: any) {
        addLog(`❌ [${p.avatarSubfolder}] ${e.message || e}`);
      }
    }
    setIsDbHeadlineAll(false);
    addLog('🏷️ เขียนพาดหัวจาก DB เสร็จแล้ว');
  };

  // ── ขั้นที่ 1: ถอดซับ (+ คิดพาดหัว AI) ของ Avatar แล้วแคชไว้ ──
  //   fillHeadline=true → เติมพาดหัวสไตล์สุขุมลงช่องด้วย (ปุ่ม "AI ช่วยคิด")
  //   fillHeadline=false → ถอดซับอย่างเดียว เก็บแคชไว้ (ปุ่ม "ถอดซับ")
  const prepareShopeePair = async (pair: any, fillHeadline: boolean) => {
    const openRouterKey = getActiveOpenRouterKey();
    if (!openRouterKey) { alert('กรุณากรอก OpenRouter Key ในการตั้งค่าก่อนใช้งานครับ'); return false; }
    if (!pair.avatarVideoFile) { alert('ไม่พบไฟล์วิดีโอ Avatar ในโฟลเดอร์นี้'); return false; }

    setShopeeSubStatus(prev => ({ ...prev, [pair.avatarSubfolder]: 'transcribing' }));
    if (fillHeadline) setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'ai', message: '🎙️ ถอดซับ + คิดพาดหัว...' } }));
    try {
      const res = await fetch(`${BACKEND_BASE}/api/generate-avatar-headline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatarFolder: pair.avatarVideoDir, avatarFile: pair.avatarVideoFile, openRouterKey }),
      });
      if (!res.ok) throw new Error(`เซิร์ฟเวอร์ตอบกลับผิดปกติ (${res.status})`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('ไม่สนับสนุนการอ่านแบบ Stream');
      const decoder = new TextDecoder();
      let done = false, buffer = '', finalData: any = null;
      while (!done) {
        const { value, done: dr } = await reader.read();
        done = dr;
        if (value) {
          buffer += decoder.decode(value, { stream: !done });
          const parts = buffer.split('\n'); buffer = parts.pop() || '';
          for (const line of parts) {
            const t = line.trim();
            if (!t.startsWith('data: ')) continue;
            try {
              const parsed = JSON.parse(t.slice(6));
              if (parsed.log) addLog(`[${pair.avatarSubfolder}] ${parsed.log}`);
              if (parsed.success) finalData = parsed;
              else if (parsed.success === false && parsed.error) throw new Error(parsed.error);
            } catch {}
          }
        }
      }
      if (finalData && finalData.success) {
        const segments = finalData.segments || [];
        const hooks: string[] = finalData.headlines || [];
        writeShopeeSubsCache(pair.avatarSubfolderPath, segments);
        if (hooks.length > 0) writeShopeeHooksCache(pair.avatarSubfolderPath, hooks);
        setShopeeSubStatus(prev => ({ ...prev, [pair.avatarSubfolder]: 'done' }));
        addLog(`✅ [${pair.avatarSubfolder}] ถอดซับสำเร็จ (${segments.length} ประโยค) — แคชไว้แล้ว`);

        if (fillHeadline && hooks.length > 0) {
          setShopeeHeadlines(prev => ({ ...prev, [pair.avatarSubfolder]: hooks[0] }));
          setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'idle', message: '✅ ถอดซับ + ได้พาดหัว' } }));
          addLog(`💡 [${pair.avatarSubfolder}] พาดหัว AI 3 สไตล์ (ก๊อปแบบอื่นไปวางในช่องได้):`);
          hooks.slice(0, 3).forEach((h, i) => addLog(`    ${HEADLINE_STYLE_LABELS[i] || `แบบ ${i + 1}`}: ${h}`));
        } else {
          setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'idle', message: '✅ ถอดซับเรียบร้อย' } }));
        }
        return true;
      }
      throw new Error('ไม่ได้รับผลลัพธ์จากเซิร์ฟเวอร์');
    } catch (e: any) {
      setShopeeSubStatus(prev => ({ ...prev, [pair.avatarSubfolder]: 'error' }));
      setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'error', message: e.message || String(e) } }));
      addLog(`❌ [${pair.avatarSubfolder}] ถอดซับ/พาดหัวล้มเหลว: ${e.message || e}`);
      return false;
    }
  };

  // ปุ่ม "AI ช่วยคิด" = ถอดซับ + เติมพาดหัว
  const generateShopeeHeadlineAI = (pair: any) => prepareShopeePair(pair, true);

  // ถอดซับทั้งหมดของคู่ที่เลือก (ขั้นที่ 1 แบบ batch)
  const runShopeeTranscribeAll = async () => {
    const openRouterKey = getActiveOpenRouterKey();
    if (!openRouterKey) { alert('กรุณากรอก OpenRouter Key ในการตั้งค่าก่อนใช้งานครับ'); return; }
    const targets = shopeePairs.filter(p => shopeeSelected.includes(p.avatarSubfolder) && p.matched);
    const subsCache = readShopeeSubsCache();
    const pending = targets.filter(p => !(subsCache[p.avatarSubfolderPath] && subsCache[p.avatarSubfolderPath].length > 0) && shopeeSubStatus[p.avatarSubfolder] !== 'done');
    if (pending.length === 0) { addLog('💡 ทุกคู่ที่เลือกถอดซับไว้แล้ว ไม่ต้องทำซ้ำครับ'); return; }
    setIsTranscribingAll(true);
    addLog(`🎙️ [Shopee] เริ่มถอดซับ ${pending.length} คลิป (ขั้นที่ 1)...`);
    for (const p of pending) await prepareShopeePair(p, true);
    setIsTranscribingAll(false);
    addLog('✨ [Shopee] ถอดซับครบแล้ว — ปรับฟอนต์/เลย์เอาต์แล้วกดตัดต่อได้เลย ไม่ต้องถอดซ้ำ');
  };

  const renderOneShopeePair = async (pair: any, controller: AbortController) => {
    const openRouterKey = subtitleAiPolish ? getActiveOpenRouterKey() : '';
    const cachedSubs = readShopeeSubsCache()[pair.avatarSubfolderPath];
    const hasCachedSubs = Array.isArray(cachedSubs) && cachedSubs.length > 0;
    setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'rendering', message: '🎬 กำลังตัดต่อ...' } }));
    addLog(`🎬 [${pair.avatarSubfolder}] เริ่มตัดต่อ (footage: ${pair.productSubfolder})${hasCachedSubs ? ' · ใช้ซับที่ถอดไว้แล้ว' : ''}...`);
    try {
      const res = await fetch(`${BACKEND_BASE}/api/render-avatar-vertical-clip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          avatarFolder: pair.avatarVideoDir,
          avatarFile: pair.avatarVideoFile,
          footageFolder: pair.productSubfolderPath,
          outputFolder,
          outputName: pair.avatarSubfolder, // ตั้งชื่อ output ตามโฟลเดอร์ Avatar เช่น 001_RiceWarmerGlove_script1_output.mp4
          bgmFile,
          bgmVolume: Math.max(0, Math.min(100, bgmVolume)) / 100,
          titleText: shopeeHeadlines[pair.avatarSubfolder] || '',
          avatarLayout,
          isVerticalAvatar: avatarLayout !== 'split',
          useGreenScreenKeying,
          footageRatioPct, avatarScalePct, bandHeightPct, bandPosYPct,
          circleDiameterPct, circlePosXPct, circlePosYPct, circleCropSizePct, circleCropXPct, circleCropYPct,
          headlineAiEnabled,
          subtitle: {
            enabled: subtitleEnabled, style: subtitleStyle, language: subtitleLanguage,
            model: subtitleModel, aiPolish: subtitleAiPolish, openRouterKey,
            openRouterModel: 'google/gemini-2.5-flash', density: subtitleDensity,
            position: subtitlePosition, fontSize: subtitleFontSize, yPosition: subtitleYPosition,
            precomputedSubtitles: hasCachedSubs ? cachedSubs : undefined,
          },
          headlineOptions: {
            style: headlineStyle, padding: headlinePadding, opacity: headlineOpacity,
            fontSize: headlineFontSize, yPosition: headlineYPosition, font: headlineFont,
            boxWidth: headlineBoxWidth, boxHeight: headlineBoxHeight,
          },
          watermark: {
            enabled: watermarkEnabled, text: watermarkText, mode: watermarkMode, corner: watermarkCorner,
            style: watermarkStyle, opacity: Math.max(5, Math.min(100, watermarkOpacity)) / 100,
            fontSize: watermarkFontSize, font: watermarkFont, intervalSec: watermarkInterval,
          },
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`renderer ตอบกลับผิดปกติ (${res.status})`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Stream not supported');
      const decoder = new TextDecoder();
      let done = false, outPath = '', errMsg = '';
      while (!done) {
        const { value, done: dr } = await reader.read();
        done = dr;
        if (!value) continue;
        for (const line of decoder.decode(value, { stream: true }).split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.log) addLog(`[${pair.avatarSubfolder}] ${data.log}`);
            if (data.success) outPath = data.filePath;
            if (data.error) errMsg = data.error;
          } catch {}
        }
      }
      if (outPath) {
        setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'done', message: '✅ สำเร็จ', outputPath: outPath } }));
      } else {
        throw new Error(errMsg || 'ไม่มีผลลัพธ์จาก renderer');
      }
    } catch (e: any) {
      setShopeeStatus(prev => ({ ...prev, [pair.avatarSubfolder]: { status: 'error', message: e.name === 'AbortError' ? 'ถูกหยุด' : (e.message || String(e)) } }));
    }
  };

  const runShopeeRenderAll = async (onlyPending = false) => {
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ Output');
    let targets = shopeePairs.filter(p => shopeeSelected.includes(p.avatarSubfolder) && p.matched);
    if (onlyPending) targets = targets.filter(p => shopeeStatus[p.avatarSubfolder]?.status !== 'done');
    if (targets.length === 0) return alert(onlyPending ? 'ทุกคลิปที่เลือกตัดต่อเสร็จหมดแล้วครับ' : 'ไม่มีคู่ที่จับคู่สำเร็จและถูกเลือกให้ตัดต่อครับ');
    const missingHeadline = targets.filter(p => !(shopeeHeadlines[p.avatarSubfolder] || '').trim());
    if (missingHeadline.length > 0) {
      const ok = confirm(`มี ${missingHeadline.length} คลิปที่ยังไม่ได้ใส่พาดหัว จะดำเนินการต่อโดยใช้พาดหัวจากชื่อไฟล์หรือไม่?`);
      if (!ok) return;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRendering(true);
    setProgress(0);
    addLog(`🚀 [Shopee] เริ่มตัดต่อ ${targets.length} คลิป...`);
    for (let i = 0; i < targets.length; i++) {
      if (controller.signal.aborted) break;
      await renderOneShopeePair(targets[i], controller);
      setProgress(Math.round(((i + 1) / targets.length) * 100));
    }
    setIsRendering(false);
    abortRef.current = null;
    if (!controller.signal.aborted) addLog('✨ [Shopee] ตัดต่อครบทุกคลิปที่เลือกแล้ว');
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
    if (headlineStyle === 'shopee-orange') {
      return { ...styleObj, color: '#ffffff', backgroundColor: `rgba(238, 77, 45, ${opacityValue})`, border: '0.1cqw solid rgba(238,77,45,0.3)' };
    }
    if (headlineStyle === 'mint-green') {
      return { ...styleObj, color: '#0e1a23', backgroundColor: `rgba(20, 184, 166, ${opacityValue})`, border: '0.1cqw solid rgba(20,184,166,0.3)' };
    }
    if (headlineStyle === 'pastel-blue') {
      return { ...styleObj, color: '#11304b', backgroundColor: `rgba(191, 219, 254, ${opacityValue})`, border: '0.1cqw solid rgba(59,130,246,0.2)' };
    }
    if (headlineStyle === 'rich-gold') {
      return { ...styleObj, color: '#0e1a23', backgroundColor: `rgba(224, 176, 68, ${opacityValue})`, border: '0.1cqw solid rgba(180,131,42,0.4)' };
    }
    if (headlineStyle === 'no-box-shadow' || headlineStyle === 'outline-minimal') {
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
        <div className="flex flex-col gap-3 items-stretch">
          <label className="flex items-center gap-3 cursor-pointer select-none rounded-2xl border px-4 py-3 transition-all"
            style={{ borderColor: shopeeMode ? '#ee4d2d' : 'var(--border-color)', backgroundColor: shopeeMode ? 'rgba(238,77,45,0.10)' : 'var(--bg-body)' }}>
            <input
              type="checkbox"
              checked={shopeeMode}
              onChange={e => setShopeeMode(e.target.checked)}
              className="w-5 h-5 cursor-pointer"
              style={{ accentColor: '#ee4d2d' }}
            />
            <div>
              <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                🛒 ใช้ตัดต่อเพื่อ Shopee (โหมดจับคู่สินค้า)
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>จับคู่ footage สินค้ากับ Avatar เป็นชุด แล้วตัดต่อทีละหลายคลิป</div>
            </div>
          </label>
          <div className="rounded-2xl border px-4 py-2.5 text-xs" style={{ borderColor: 'rgba(168,85,247,0.35)', backgroundColor: 'rgba(168,85,247,0.09)', color: 'var(--text-secondary)' }}>
            Output: <span className="font-bold" style={{ color: 'var(--text-primary)' }}>{shopeeMode ? 'พาดหัว + _output.mp4 ต่อ Avatar' : 'ชื่อไฟล์ Avatar + _output.mp4'}</span>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <Settings className="w-5 h-5" style={{ color: '#a855f7' }} />
          ตั้งค่าโฟลเดอร์และเสียง
        </h2>
        {shopeeMode ? (
          <>
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <FolderField
              label="📦 โฟลเดอร์คลิปสินค้า (มีโฟลเดอร์ย่อยต่อสินค้า)"
              value={shopeeProductFolder}
              onPick={() => pickFolder('เลือกโฟลเดอร์หลักของคลิปสินค้า (ข้างในมีโฟลเดอร์ย่อย เช่น 001_RiceWarmerGlove)', setShopeeProductFolder)}
            />
            <FolderField
              label="🧑‍💼 โฟลเดอร์ Avatar (มีโฟลเดอร์ย่อยต่อสคริปต์)"
              value={shopeeAvatarFolder}
              onPick={() => pickFolder('เลือกโฟลเดอร์หลักของ Avatar (ข้างในมีโฟลเดอร์ย่อย เช่น 001_RiceWarmerGlove_script1)', setShopeeAvatarFolder)}
            />
            <FolderField
              label="โฟลเดอร์ Output"
              value={outputFolder}
              onPick={() => pickFolder('เลือกโฟลเดอร์ปลายทางสำหรับคลิป _output', setOutputFolder)}
            />
          </div>

          <div className="mt-4 rounded-2xl border p-4" style={{ borderColor: 'rgba(245,158,11,0.4)', backgroundColor: 'rgba(245,158,11,0.06)' }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                  🏷️ ฐานข้อมูลสินค้า (เขียนพาดหัวจากข้อมูลจริง ไม่อิงสคริปต์)
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                  {shopeeProductDb.length > 0
                    ? <>โหลดแล้ว <b style={{ color: 'var(--text-primary)' }}>{shopeeProductDb.length}</b> รายการ · {shopeeDbSource || 'ไฟล์ที่อัพโหลด'}</>
                    : 'ยังไม่มีข้อมูล — อัพโหลด CSV หรือกดโหลดค่าเริ่มต้น (คอลัมน์: ชื่อในโฟลเดอร์, Link, รายละเอียดสินค้า)'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <label className="px-4 py-2 rounded-xl font-bold text-xs cursor-pointer border flex items-center gap-2" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                  ⬆️ อัพโหลด CSV
                  <input type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0] || null; e.currentTarget.value = ''; void handleUploadProductDb(f); }} />
                </label>
                <button onClick={() => void loadDefaultProductDb(false)} className="px-4 py-2 rounded-xl font-bold text-xs cursor-pointer border" style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-secondary)', borderColor: 'var(--border-color)' }}>
                  🔄 โหลดค่าเริ่มต้นใหม่
                </button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold shrink-0" style={{ color: '#10b981' }}>🔗 Google Sheet:</span>
              <input
                type="text"
                value={shopeeDbSheetUrl}
                onChange={e => setShopeeDbSheetUrl(e.target.value)}
                placeholder="วางลิงก์ Google Sheet (แชร์แบบทุกคนที่มีลิงก์ดูได้)..."
                className="flex-1 min-w-[220px] px-3 py-2 rounded-lg text-[11px] border outline-none"
                style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
              />
              <button
                onClick={() => void loadShopeeDbFromSheet()}
                disabled={isLoadingSheet}
                className="px-4 py-2 rounded-lg font-bold text-xs cursor-pointer disabled:opacity-50"
                style={{ backgroundColor: '#10b981', color: 'white' }}
              >
                {isLoadingSheet ? '⏳ กำลังดึง...' : '🔗 ดึงจาก Sheet'}
              </button>
            </div>
          </div>
          </>
        ) : (
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
        )}

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
          🎬 รูปแบบการแสดง Avatar (Layout) &amp; ขนาด
        </h2>

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
          {AVATAR_LAYOUTS.map(layout => (
            <button
              key={layout.id}
              type="button"
              onClick={() => setAvatarLayout(layout.id)}
              className="rounded-2xl border p-4 text-left transition-all hover:scale-[1.02] flex flex-col gap-1.5 cursor-pointer"
              style={{
                borderColor: avatarLayout === layout.id ? '#a855f7' : 'var(--border-color)',
                backgroundColor: avatarLayout === layout.id ? 'rgba(168,85,247,0.12)' : 'var(--bg-body)',
              }}
            >
              <div className="text-2xl">{layout.icon}</div>
              <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>{layout.label}</div>
              <div className="text-[10px] leading-tight" style={{ color: 'var(--text-secondary)' }}>{layout.desc}</div>
            </button>
          ))}
        </div>

        {/* สไลเดอร์ขนาดตามเลย์เอาต์ที่เลือก */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {avatarLayout === 'split' && (
            <SliderField label="สัดส่วนความสูง footage (ด้านบน)" value={footageRatioPct} unit="%" min={30} max={75} onChange={setFootageRatioPct} hint="ยิ่งมาก footage ยิ่งสูง — ส่วนที่เหลือคือ Avatar ด้านล่าง" />
          )}
          {avatarLayout === 'greenscreen-full' && (
            <>
              <SliderField label="สเกลขนาด Avatar" value={avatarScalePct} unit="%" min={40} max={120} onChange={setAvatarScalePct} hint="ขยาย/ย่อ Avatar ที่เจาะกรีนสกรีน วางชิดล่างกึ่งกลาง" />
              <label className="flex items-center gap-3 p-4 rounded-2xl border cursor-pointer select-none self-start mt-6"
                style={{ borderColor: useGreenScreenKeying ? '#a855f7' : 'var(--border-color)', backgroundColor: useGreenScreenKeying ? 'rgba(168,85,247,0.05)' : 'var(--bg-body)' }}>
                <input type="checkbox" checked={useGreenScreenKeying} onChange={e => setUseGreenScreenKeying(e.target.checked)} className="w-5 h-5" />
                <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>เจาะคีย์กรีนสกรีน (#00FF00)</span>
              </label>
            </>
          )}
          {avatarLayout === 'bottom-band' && (
            <>
              <SliderField label="ความสูงแถบ Avatar" value={bandHeightPct} unit="%" min={15} max={60} onChange={setBandHeightPct} hint="ความสูงของแถบคลิป Avatar แนวนอนด้านล่าง" />
              <SliderField label="ระยะห่างจากขอบล่าง" value={bandPosYPct} unit="%" min={0} max={40} onChange={setBandPosYPct} hint="ดันแถบขึ้นจากขอบล่าง (0 = ชิดขอบล่างสุด)" />
            </>
          )}
          {avatarLayout === 'circle' && (
            <>
              <SliderField label="ขนาดวงกลม (เส้นผ่านศูนย์กลาง)" value={circleDiameterPct} unit="%" min={18} max={70} onChange={setCircleDiameterPct} hint="ขนาดวงบนจอ 9:16 (อิงความกว้างจอ)" />
              <SliderField label="ตำแหน่งวงบนจอ — แนวนอน (X)" value={circlePosXPct} unit="%" min={0} max={100} onChange={setCirclePosXPct} hint="0 = ซ้าย, 50 = กลาง, 100 = ขวา" />
              <SliderField label="ตำแหน่งวงบนจอ — แนวตั้ง (Y)" value={circlePosYPct} unit="%" min={0} max={100} onChange={setCirclePosYPct} hint="0 = บนสุด, 100 = ล่างสุด" />
            </>
          )}

          <label className="flex flex-col gap-2 p-4 rounded-2xl border cursor-pointer select-none transition-all hover:bg-black/5 dark:hover:bg-white/5 self-start" style={{ borderColor: headlineAiEnabled ? '#a855f7' : 'var(--border-color)', backgroundColor: headlineAiEnabled ? 'rgba(168,85,247,0.05)' : 'var(--bg-body)' }}>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={headlineAiEnabled}
                onChange={event => setHeadlineAiEnabled(event.target.checked)}
                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>ใช้ AI เจนพาดหัวอัตโนมัติ (Hook)</span>
            </div>
            <p className="text-xs text-gray-500 pl-8 leading-tight">ส่งสคริปต์ให้ LLM คิดหัวข้อไวรัลให้อัตโนมัติตอนเรนเดอร์ (เมื่อยังไม่ได้กรอกพาดหัวเอง)</p>
          </label>
        </div>

        {avatarLayout === 'circle' && (
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                🎯 ตั้งค่า Crop ใบหน้า (ใช้กับทุกคลิป)
              </div>
              <button
                onClick={loadCropFrame}
                disabled={isLoadingFrame}
                className="self-start px-3 py-1.5 rounded-lg font-bold text-xs border transition-all disabled:opacity-50 cursor-pointer"
                style={{ borderColor: '#a855f7', color: '#a855f7', backgroundColor: 'rgba(168,85,247,0.06)' }}
              >
                {isLoadingFrame ? 'กำลังโหลด...' : (cropFrameImage ? '🔄 โหลดเฟรมใหม่' : '🖼️ โหลดเฟรมตัวอย่าง')}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-5 items-start min-w-0">
              {/* เฟรม + วงกลม crop ลาก/ย่อขยายได้ */}
              <div
                ref={cropBoxRef}
                className="relative rounded-xl border select-none mx-auto"
                style={{ width: 300, maxWidth: '100%', aspectRatio: cropFrameImage ? 'auto' : '16 / 9', backgroundColor: '#000', borderColor: 'var(--border-color)', touchAction: 'none', overflow: 'hidden' }}
              >
                {cropFrameImage ? (
                  <img src={cropFrameImage} alt="avatar frame" className="block w-full h-auto pointer-events-none" />
                ) : (
                  <div className="flex items-center justify-center text-center text-[11px] text-gray-400 p-6" style={{ aspectRatio: '16 / 9' }}>
                    กดปุ่ม "โหลดเฟรมตัวอย่าง" เพื่อดูภาพจริงจากคลิป Avatar แล้วลากวงกลมเลือก crop หน้า
                  </div>
                )}
                {cropFrameImage && (() => {
                  // เส้นผ่านศูนย์กลางวง = size% ของด้านสั้นของเฟรม (ตรงกับ ffmpeg ที่ใช้ min(iw,ih))
                  // landscape (aspect>=1): ด้านสั้น=สูง → ใช้ height% ; portrait: ด้านสั้น=กว้าง → ใช้ width%
                  const isLandscape = cropFrameAspect >= 1;
                  const sizeStyle = isLandscape
                    ? { height: `${circleCropSizePct}%`, width: 'auto' as const, aspectRatio: '1 / 1' }
                    : { width: `${circleCropSizePct}%`, height: 'auto' as const, aspectRatio: '1 / 1' };
                  return (
                    <div
                      onPointerDown={startCropDrag}
                      className="absolute"
                      style={{
                        left: `${circleCropXPct}%`,
                        top: `${circleCropYPct}%`,
                        ...sizeStyle,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '9999px',
                        border: '2px solid #a855f7',
                        boxShadow: '0 0 0 9999px rgba(0,0,0,0.45)',
                        cursor: 'grab',
                        touchAction: 'none',
                      }}
                    >
                      <div onPointerDown={startCropResize} title="ลากเพื่อย่อ/ขยาย" className="absolute" style={{ right: '6%', bottom: '6%', width: 16, height: 16, borderRadius: 9999, background: '#a855f7', border: '2px solid white', cursor: 'nwse-resize', touchAction: 'none' }} />
                    </div>
                  );
                })()}
              </div>

              {/* สไลเดอร์ปรับละเอียด */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 min-w-0">
                <SliderField label="ซูม/ขนาด crop" value={circleCropSizePct} unit="%" min={30} max={100} onChange={setCircleCropSizePct} hint="เล็ก = ซูมเข้าหน้ามาก" />
                <SliderField label="ตำแหน่ง crop — ซ้าย/ขวา" value={circleCropXPct} unit="%" min={0} max={100} onChange={setCircleCropXPct} hint="เลื่อน crop ในเฟรมต้นฉบับ" />
                <SliderField label="ตำแหน่ง crop — บน/ล่าง" value={circleCropYPct} unit="%" min={0} max={100} onChange={setCircleCropYPct} hint="ดันขึ้นเพื่อจับใบหน้า" />
                <div className="sm:col-span-3 text-[10px] text-gray-500 leading-relaxed">
                  💡 ลากวงกลมม่วงบนภาพเพื่อเลือกตำแหน่งหน้า และลากจุดมุมเพื่อย่อ/ขยาย — ค่านี้จะถูกใช้กับ <b>ทุกคลิป</b> เหมือนกัน (เพราะ Avatar นั่งตำแหน่งเดิม) วงกลมที่เห็น = ส่วนที่จะโชว์จริงในคลิป
                </div>
              </div>
            </div>

            {/* ค่า Crop เป็นการตั้งค่าสด (ใช้ตอนเรนเดอร์อัตโนมัติ) — ไม่ต้องเซฟ แค่กดไปต่อ */}
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                ✅ ปรับ Crop พอใจแล้ว? ค่านี้ถูกบันทึกอัตโนมัติและจะใช้ตอนเรนเดอร์ — กดปุ่มเพื่อไปยังขั้นตอนเรนเดอร์ได้เลย
              </p>
              <button
                onClick={goToRenderActions}
                className="self-start sm:self-auto shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow-md transition-all hover:scale-[1.02] cursor-pointer"
                style={{ backgroundColor: '#a855f7' }}
              >
                ✅ ใช้ค่า Crop นี้ — ไปขั้นตอนเรนเดอร์ ↓
              </button>
            </div>
          </div>
        )}
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
            { id: 'shopee-orange', label: 'ส้ม Shopee', text: '#ffffff', bg: '#ee4d2d', desc: 'โทนแบรนด์ Shopee ขายของ' },
            { id: 'mint-green', label: 'เขียวมิ้นต์สดใส', text: '#0e1a23', bg: '#14b8a6', desc: 'สดชื่น สายสุขภาพ/ความงาม' },
            { id: 'pastel-blue', label: 'ฟ้าพาสเทลละมุน', text: '#11304b', bg: '#bfdbfe', desc: 'นุ่มนวล อ่านง่าย สบายตา' },
            { id: 'rich-gold', label: 'ทองหรูพรีเมียม', text: '#0e1a23', bg: '#e0b044', desc: 'ดูแพง สินค้าพรีเมียม' },
            { id: 'no-box-shadow', label: 'ตัวหนังสือขอบดำ (ไม่มีกล่อง)', text: '#ffffff', bg: 'transparent', border: 'rgba(255,255,255,0.3)', desc: 'ฟิลช่องทีวี ขอบหนา' },
            { id: 'outline-minimal', label: 'ขอบบางมินิมอล (ไม่มีกล่อง)', text: '#ffffff', bg: 'transparent', border: 'rgba(255,255,255,0.3)', desc: 'เรียบบางๆ ไม่รบกวนภาพ' },
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
                  textShadow: (style.id === 'no-box-shadow' || style.id === 'outline-minimal') ? '0 1px 0 #000, 0 -1px 0 #000, 1px 0 #000, -1px 0 #000' : 'none'
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
              disabled={headlineStyle === 'no-box-shadow' || headlineStyle === 'outline-minimal'}
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
              disabled={headlineStyle === 'no-box-shadow' || headlineStyle === 'outline-minimal'}
              onChange={event => setHeadlineOpacity(Number(event.target.value))}
              className="w-full disabled:opacity-50"
            />
            <div className="text-[10px] text-gray-500 mt-1">ความทึบของสีกล่อง ยิ่งปรับน้อยจะยิ่งมองทะลุฟุตเทจได้ดี</div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>🔠 ขนาดฟอนต์พาดหัว</span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-purple-500 font-bold">
                  {headlineFontSize === 0 ? 'Auto' : `${headlineFontSize}px`}
                </span>
                <button
                  type="button"
                  onClick={() => setHeadlineFontSize(headlineFontSize === 0 ? 82 : 0)}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all cursor-pointer"
                  style={{
                    borderColor: headlineFontSize === 0 ? '#a855f7' : 'var(--border-color)',
                    backgroundColor: headlineFontSize === 0 ? 'rgba(168,85,247,0.14)' : 'transparent',
                    color: headlineFontSize === 0 ? '#a855f7' : 'var(--text-secondary)',
                  }}
                >
                  Auto
                </button>
              </div>
            </div>
            <input
              type="range"
              min={28}
              max={160}
              step={2}
              value={headlineFontSize === 0 ? 82 : headlineFontSize}
              onChange={event => setHeadlineFontSize(Number(event.target.value))}
              className="w-full cursor-pointer"
            />
            <div className="text-[10px] text-gray-500 mt-1">ลากเพื่อกำหนดขนาดตัวอักษรพาดหัว (กดปุ่ม Auto ให้คำนวณตามความยาวหัวข้อ)</div>
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

        {/* ฟอนต์ + ขนาดกล่องกำหนดเอง */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 pt-5 border-t" style={{ borderColor: 'var(--border-color)' }}>
          <div>
            <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ฟอนต์พาดหัว</div>
            <select
              value={headlineFont}
              onChange={e => setHeadlineFont(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none font-semibold cursor-pointer"
              style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            >
              {HEADLINE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <div className="text-[10px] text-gray-500 mt-1">เลือกฟอนต์สำหรับป้ายพาดหัว (มีให้เลือกหลายแบบ)</div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>ความกว้างกล่อง</span>
              <span className="font-mono text-purple-500 font-bold">{headlineBoxWidth === 0 ? 'อัตโนมัติ' : `${headlineBoxWidth}px`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1080}
              step={20}
              value={headlineBoxWidth}
              onChange={e => setHeadlineBoxWidth(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-[10px] text-gray-500 mt-1">0 = ปรับตามตัวอักษร · ตั้งค่า &gt; 0 เพื่อกำหนดกว้างกล่องเอง (ต้องตั้งความสูงด้วย)</div>
          </div>

          <div>
            <div className="flex justify-between items-center text-sm font-semibold mb-2">
              <span style={{ color: 'var(--text-secondary)' }}>ความสูงกล่อง</span>
              <span className="font-mono text-purple-500 font-bold">{headlineBoxHeight === 0 ? 'อัตโนมัติ' : `${headlineBoxHeight}px`}</span>
            </div>
            <input
              type="range"
              min={0}
              max={600}
              step={10}
              value={headlineBoxHeight}
              onChange={e => setHeadlineBoxHeight(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-[10px] text-gray-500 mt-1">0 = ปรับตามตัวอักษร · ตั้งค่า &gt; 0 เพื่อกำหนดสูงกล่องเอง (วาดกล่องสี่เหลี่ยมขนาดคงที่)</div>
          </div>
        </div>
      </div>

      {/* ── โซนจัดการลายน้ำเครดิต (Watermark) ── */}
      <div className="p-6 rounded-3xl border shadow-sm" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-lg font-bold mb-1 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              💧 ลายน้ำเครดิต (Watermark)
            </h2>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              ใส่เครดิต/ชื่อร้านจาง ๆ บนคลิป เลือกให้สุ่มย้ายมุมไปมา หรือลอยเคลื่อน เพื่อกันก๊อปและสร้างแบรนด์
            </p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer select-none shrink-0">
            <input type="checkbox" checked={watermarkEnabled} onChange={e => setWatermarkEnabled(e.target.checked)} className="w-5 h-5 cursor-pointer" />
            <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>เปิดลายน้ำ</span>
          </label>
        </div>

        {watermarkEnabled && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ข้อความลายน้ำ</label>
                <input
                  type="text"
                  value={watermarkText}
                  onChange={e => setWatermarkText(e.target.value)}
                  placeholder="เช่น @ชื่อร้าน / IG: yourshop"
                  className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
                  style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ฟอนต์</label>
                <select value={watermarkFont} onChange={e => setWatermarkFont(e.target.value)} className="px-4 py-2.5 rounded-xl text-sm border outline-none font-semibold cursor-pointer w-full md:w-44" style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                  {HEADLINE_FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </div>
            </div>

            {/* โหมดการเคลื่อนไหว */}
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>โหมดการแสดง</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'random-corners', icon: '🎲', label: 'สุ่มย้ายมุม', desc: 'กระโดดเปลี่ยนมุมไปมาเรื่อย ๆ' },
                  { id: 'roaming', icon: '🌀', label: 'ลอยเคลื่อน', desc: 'ค่อย ๆ ลอยจากจุดหนึ่งไปอีกจุด' },
                  { id: 'fixed', icon: '📌', label: 'มุมเดียวคงที่', desc: 'ปักไว้มุมเดียวตลอดคลิป' },
                ].map(m => (
                  <button key={m.id} type="button" onClick={() => setWatermarkMode(m.id)}
                    className="rounded-xl border p-3 text-left transition-all hover:scale-[1.01] cursor-pointer"
                    style={{ borderColor: watermarkMode === m.id ? '#a855f7' : 'var(--border-color)', backgroundColor: watermarkMode === m.id ? 'rgba(168,85,247,0.12)' : 'var(--bg-body)' }}>
                    <div className="text-lg">{m.icon}</div>
                    <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>{m.label}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>{m.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {watermarkMode === 'fixed' && (
              <div>
                <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>ตำแหน่งมุม</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'top-left', label: '↖ บนซ้าย' }, { id: 'top', label: '↑ บนกลาง' }, { id: 'top-right', label: '↗ บนขวา' },
                    { id: 'bottom-left', label: '↙ ล่างซ้าย' }, { id: 'bottom', label: '↓ ล่างกลาง' }, { id: 'bottom-right', label: '↘ ล่างขวา' },
                  ].map(c => (
                    <button key={c.id} type="button" onClick={() => setWatermarkCorner(c.id)}
                      className="px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all"
                      style={{ borderColor: watermarkCorner === c.id ? '#a855f7' : 'var(--border-color)', backgroundColor: watermarkCorner === c.id ? 'rgba(168,85,247,0.12)' : 'var(--bg-body)', color: 'var(--text-primary)' }}>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* สไตล์ลายน้ำ */}
            <div>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>สไตล์ลายน้ำ</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { id: 'faint', label: 'จางมินิมอล', sample: { color: 'rgba(255,255,255,0.5)', textShadow: '0 1px 2px #000' } },
                  { id: 'outline', label: 'ขอบดำชัด', sample: { color: '#fff', textShadow: '0 0 2px #000,0 0 2px #000,1px 1px 0 #000' } },
                  { id: 'box', label: 'กล่องจาง', sample: { color: '#fff', backgroundColor: 'rgba(0,0,0,0.45)', padding: '2px 8px', borderRadius: 4 } },
                  { id: 'italic', label: 'ตัวเอียง', sample: { color: 'rgba(255,255,255,0.6)', fontStyle: 'italic', textShadow: '0 1px 2px #000' } },
                ].map(s => (
                  <button key={s.id} type="button" onClick={() => setWatermarkStyle(s.id)}
                    className="rounded-xl border p-3 transition-all hover:scale-[1.01] cursor-pointer flex flex-col items-center gap-2 min-h-[72px] justify-center"
                    style={{ borderColor: watermarkStyle === s.id ? '#a855f7' : 'var(--border-color)', backgroundColor: watermarkStyle === s.id ? 'rgba(168,85,247,0.10)' : 'var(--bg-body)' }}>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
                    <span className="px-1 text-xs font-bold" style={s.sample as React.CSSProperties}>{watermarkText || '@yourshop'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* สไลเดอร์ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <SliderField label="ความจาง (Opacity)" value={watermarkOpacity} unit="%" min={5} max={100} onChange={setWatermarkOpacity} hint="ยิ่งน้อยยิ่งจาง แนะนำ 25-45%" />
              <SliderField label="ขนาดฟอนต์" value={watermarkFontSize} unit="px" min={20} max={120} onChange={setWatermarkFontSize} hint="ลายน้ำควรเล็ก ไม่บังเนื้อหา" />
              {watermarkMode !== 'fixed' && (
                <SliderField label="ความถี่ย้ายตำแหน่ง" value={watermarkInterval} unit=" วิ" min={2} max={12} onChange={setWatermarkInterval} hint="ทุกกี่วินาทีจะย้าย/ลอยไปจุดใหม่" />
              )}
            </div>
          </div>
        )}
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

      {/* จุดยึดเลื่อนจอจากปุ่ม "ใช้ค่า Crop นี้" มายังแถบปุ่มเรนเดอร์ */}
      <div ref={renderActionsRef} className="scroll-mt-4" />

      {shopeeMode && (
        <div className="flex flex-wrap gap-3 items-center justify-between p-4 rounded-2xl border" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => refreshShopeePairs()}
              disabled={!shopeeProductFolder || !shopeeAvatarFolder || isPairing || isRendering}
              className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 border text-xs cursor-pointer"
              style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
            >
              <RefreshCw className={`w-4 h-4 ${isPairing ? 'animate-spin' : ''}`} />
              จับคู่โฟลเดอร์ใหม่
            </button>
            {!isRendering && (
              <button
                onClick={runShopeeTranscribeAll}
                disabled={shopeeSelected.length === 0 || isTranscribingAll || isRendering}
                className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
                style={{ backgroundColor: '#a855f7', color: 'white' }}
              >
                🎙️ {isTranscribingAll ? 'กำลังถอดซับ...' : `ทำซับต่อ (อันที่ยังไม่เสร็จ)`}
              </button>
            )}
            {!isRendering && (
              <button
                onClick={runShopeeDbHeadlineAll}
                disabled={shopeeSelected.length === 0 || isDbHeadlineAll || isRendering || isTranscribingAll || shopeeProductDb.length === 0}
                className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
                style={{ backgroundColor: '#f59e0b', color: 'white' }}
                title="เขียนพาดหัวจากฐานข้อมูลสินค้าจริง สำหรับคลิปที่เลือก"
              >
                🏷️ {isDbHeadlineAll ? 'กำลังเขียนพาดหัว...' : 'พาดหัวจาก DB (ที่เลือก)'}
              </button>
            )}
            {!isRendering ? (
              <>
                <button
                  onClick={() => runShopeeRenderAll(false)}
                  disabled={!outputFolder || shopeeSelected.length === 0 || isRendering || isTranscribingAll}
                  className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
                  style={{ backgroundColor: '#ee4d2d', color: 'white' }}
                >
                  🎬 ตัดต่อใหม่ทั้งหมด ({shopeeSelected.length})
                </button>
                <button
                  onClick={() => runShopeeRenderAll(true)}
                  disabled={!outputFolder || shopeeSelected.length === 0 || isRendering || isTranscribingAll}
                  className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 text-xs shadow-md cursor-pointer"
                  style={{ backgroundColor: '#f59e0b', color: 'white' }}
                >
                  ▶️ ตัดต่อเฉพาะที่ยังไม่เสร็จ
                </button>
              </>
            ) : (
              <button onClick={stopRender} className="px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all text-xs shadow-md bg-red-500 text-white cursor-pointer">
                <Square className="w-4 h-4 animate-pulse" />
                หยุดทำงาน
              </button>
            )}
          </div>
          <div className="flex gap-2">
            {outputFolder && (
              <button onClick={openOutputFolder} className="px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border text-xs cursor-pointer" style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}>
                <FolderOpen className="w-4 h-4" />
                เปิด Output
              </button>
            )}
            {isRendering && (
              <div className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2" style={{ backgroundColor: 'rgba(238,77,45,0.1)', color: '#ee4d2d' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                </span>
                กำลังตัดต่อ {progress}%
              </div>
            )}
          </div>
        </div>
      )}

      {!shopeeMode && (
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
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_0.7fr] gap-6">
        {shopeeMode ? (
        <ShopeePairingCard
          pairs={shopeePairs}
          productOptions={shopeeProductOptions}
          selected={shopeeSelected}
          setSelected={setShopeeSelected}
          headlines={shopeeHeadlines}
          setHeadlines={setShopeeHeadlines}
          statusMap={shopeeStatus}
          subStatusMap={shopeeSubStatus}
          onTranscribe={(pair: any) => prepareShopeePair(pair, false)}
          onAiHeadline={generateShopeeHeadlineAI}
          onRenderOne={(pair: any) => { const c = new AbortController(); abortRef.current = c; setIsRendering(true); renderOneShopeePair(pair, c).finally(() => { setIsRendering(false); abortRef.current = null; }); }}
          onOverrideProduct={overrideShopeeProduct}
          onViewSubs={openShopeeSubsViewer}
          onDbHeadline={openDbHeadlinePicker}
          dbMatchedKeys={new Set(shopeePairs.filter(p => findProductForPair(p)).map(p => p.avatarSubfolder))}
          isBusy={isRendering || isPairing || isTranscribingAll}
        />
        ) : (
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
                                <option key={i} value={h}>{HEADLINE_STYLE_LABELS[i] || `🔥 Hook ${i + 1}`}: {h.substring(0, 32)}...</option>
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
        )}

        <div className="space-y-6 flex flex-col">
          <div className="p-6 rounded-3xl border shadow-sm flex flex-col items-center" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
            <h2 className="text-sm font-bold mb-4 text-purple-500 uppercase tracking-wider flex items-center gap-1.5 w-full">
              <span>📱</span> พรีวิวหน้าจอ 9:16 แบบเรียลไทม์
            </h2>
            
            <div className="relative shadow-2xl overflow-hidden"
              style={{ width: '100%', maxWidth: 320, aspectRatio: '9 / 16', borderRadius: 36, padding: 10, background: '#0a0a0a', border: '6px solid #1c1c20' }}>
              {/* notch */}
              <div className="absolute left-1/2 z-30 flex items-center justify-between"
                style={{ top: 14, transform: 'translateX(-50%)', width: 86, height: 16, background: '#000', borderRadius: 9999, paddingLeft: 12, paddingRight: 12 }}>
                <span style={{ width: 6, height: 6, background: '#27272a', borderRadius: 9999 }} />
                <span style={{ width: 14, height: 6, background: '#27272a', borderRadius: 9999 }} />
              </div>

              <div
                ref={previewScreenRef}
                className="relative overflow-hidden bg-black flex flex-col select-none"
                style={{ width: '100%', height: '100%', borderRadius: 28, containerType: 'inline-size' }}
              >
                {avatarLayout === 'split' && (
                  <div className="absolute inset-0 flex flex-col" style={{ width: '100%', height: '100%' }}>
                    <div className="w-full bg-gradient-to-br from-indigo-950 to-indigo-900 flex flex-col items-center justify-center relative"
                      style={{ height: `${footageRatioPct}%`, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <div className="font-bold text-indigo-300" style={{ opacity: 0.6, fontSize: '3cqw' }}>🎬 B-Roll (วิดีโอประกอบ)</div>
                      <div className="text-indigo-400/50" style={{ marginTop: 4, fontSize: '2.4cqw' }}>footage {footageRatioPct}%</div>
                    </div>
                    <div className="w-full bg-gradient-to-tr from-purple-950 to-purple-900 flex flex-col items-center justify-center relative"
                      style={{ height: `${100 - footageRatioPct}%` }}>
                      <div className="font-bold text-purple-300" style={{ opacity: 0.6, fontSize: '3cqw' }}>👤 Avatar (คลิปพูดหลัก)</div>
                      <div className="text-purple-400/50" style={{ marginTop: 4, fontSize: '2.4cqw' }}>Avatar {100 - footageRatioPct}%</div>
                    </div>
                  </div>
                )}
                {avatarLayout === 'greenscreen-full' && (
                  <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 flex items-center justify-center text-center">
                      <div className="font-bold text-gray-300" style={{ opacity: 0.35, fontSize: '3cqw' }}>🎬 B-Roll Background (เต็มจอ)</div>
                    </div>
                    <div className="absolute left-1/2 bottom-0 flex items-end justify-center"
                      style={{ width: `${avatarScalePct}%`, transform: 'translateX(-50%)', height: '85%', zIndex: 5 }}>
                      <div className={`absolute bottom-0 flex items-center justify-center ${useGreenScreenKeying ? 'bg-green-500/20' : 'bg-purple-950/40'}`}
                        style={{ width: '100%', height: '100%', border: avatarPreviewMode === 'resize' ? '0.4cqw dashed rgba(168,85,247,0.95)' : (useGreenScreenKeying ? '2px solid rgba(34,197,94,0.5)' : '1px solid rgba(168,85,247,0.3)'), borderBottom: 'none', borderTopLeftRadius: '20cqw', borderTopRightRadius: '20cqw' }}>
                        <span className={`font-bold ${useGreenScreenKeying ? 'text-green-400' : 'text-purple-300'}`} style={{ fontSize: '3cqw' }}>{useGreenScreenKeying ? 'Avatar กรีนสกรีน' : 'Avatar Overlay'} · {avatarScalePct}%</span>
                      </div>
                      {/* ที่จับย่อ/ขยายซ้าย-ขวา */}
                      <div onPointerDown={startGreenscreenResize} title="ลากเพื่อย่อ/ขยายขนาด" className="absolute" style={{ left: '-1.4cqw', top: '50%', transform: 'translateY(-50%)', width: '3cqw', height: '3cqw', borderRadius: '9999px', background: '#a855f7', border: '0.3cqw solid white', cursor: 'ew-resize', touchAction: 'none', zIndex: 6 }} />
                      <div onPointerDown={startGreenscreenResize} title="ลากเพื่อย่อ/ขยายขนาด" className="absolute" style={{ right: '-1.4cqw', top: '50%', transform: 'translateY(-50%)', width: '3cqw', height: '3cqw', borderRadius: '9999px', background: '#a855f7', border: '0.3cqw solid white', cursor: 'ew-resize', touchAction: 'none', zIndex: 6 }} />
                    </div>
                  </div>
                )}
                {avatarLayout === 'bottom-band' && (
                  <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 flex items-center justify-center text-center">
                      <div className="font-bold text-gray-300" style={{ opacity: 0.35, fontSize: '3cqw' }}>🎬 footage เต็มจอ</div>
                    </div>
                    <div onPointerDown={startBandDrag} title="ลากขึ้น/ลงเพื่อจัดตำแหน่ง"
                      className="absolute left-1/2 bg-black/70 flex items-center justify-center"
                      style={{ width: '94%', transform: 'translateX(-50%)', height: `${bandHeightPct}%`, bottom: `${bandPosYPct}%`, borderRadius: '2cqw', border: avatarPreviewMode !== 'idle' ? '0.4cqw dashed rgba(168,85,247,0.95)' : '1px solid rgba(255,255,255,0.15)', cursor: avatarPreviewMode === 'drag' ? 'grabbing' : 'grab', touchAction: 'none', zIndex: 5 }}>
                      <span className="font-bold text-white" style={{ fontSize: '3cqw' }}>📺 คลิป Avatar · สูง {bandHeightPct}% · ล่าง {bandPosYPct}%</span>
                      {/* ที่จับปรับความสูง (ขอบบน) */}
                      <div onPointerDown={startBandResize} title="ลากเพื่อปรับความสูงแถบ" className="absolute" style={{ left: '50%', top: '-1.4cqw', transform: 'translateX(-50%)', width: '8cqw', height: '2.6cqw', borderRadius: '9999px', background: '#a855f7', border: '0.3cqw solid white', cursor: 'ns-resize', touchAction: 'none' }} />
                    </div>
                  </div>
                )}
                {avatarLayout === 'circle' && (
                  <div className="absolute inset-0" style={{ width: '100%', height: '100%' }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/60 flex items-center justify-center text-center">
                      <div className="font-bold text-gray-300" style={{ opacity: 0.35, fontSize: '3cqw' }}>🎬 footage เต็มจอ</div>
                    </div>
                    <div onPointerDown={startCircleDrag} title="ลากเพื่อย้ายตำแหน่งวงกลม"
                      className="absolute bg-purple-900/70 flex items-center justify-center text-center"
                      style={{
                        width: `${circleDiameterPct}%`,
                        aspectRatio: '1 / 1',
                        left: `${circlePosXPct}%`,
                        top: `${circlePosYPct}%`,
                        transform: 'translate(-50%, -50%)',
                        borderRadius: '9999px',
                        border: avatarPreviewMode !== 'idle' ? '0.5cqw dashed rgba(168,85,247,0.95)' : '0.4cqw solid rgba(255,255,255,0.85)',
                        cursor: avatarPreviewMode === 'drag' ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        zIndex: 5,
                      }}>
                      <span className="font-bold text-white pointer-events-none" style={{ fontSize: '2.4cqw' }}>⭕ หน้า Avatar<br />{circleDiameterPct}%</span>
                      {/* ที่จับย่อ/ขยาย (มุมล่างขวา) */}
                      <div onPointerDown={startCircleResize} title="ลากเพื่อย่อ/ขยายวงกลม" className="absolute" style={{ right: '4%', bottom: '4%', width: '3.4cqw', height: '3.4cqw', borderRadius: '9999px', background: '#a855f7', border: '0.3cqw solid white', cursor: 'nwse-resize', touchAction: 'none' }} />
                    </div>
                  </div>
                )}

                {(() => {
                  const renderingRow = items.find(q => q.status === 'rendering');
                  const rawText = renderingRow
                    ? (titleTexts[renderingRow.name] || autoTitleFromFileName(renderingRow.name))
                    : (items.length > 0
                        ? (titleTexts[items[0].name] || autoTitleFromFileName(items[0].name))
                        : "พาดหัวดึงดูดความสนใจ\nจะขึ้นแสดงที่นี่");
                  // ตัดบรรทัดแบบเดียวกับ backend → พรีวิวตรงกับวิดีโอจริง (WYSIWYG)
                  const text = wrapHeadlineForPreview(rawText);

                  // ถ้าฟอนต์ auto (0) คำนวณขนาดจากบรรทัดที่ตัดแล้ว (สูตรเดียวกับ backend)
                  let simulatedFontSize = headlineFontSize;
                  if (simulatedFontSize === 0) {
                    const lines = text.split('\n').filter(Boolean);
                    const longestLine = Math.max(...lines.map(line => segmentGraphemes(line).length), 1);
                    simulatedFontSize = Math.max(42, Math.min(82, Math.floor(1500 / longestLine)));
                  }

                  return (
                    <div
                      onPointerDown={startHeadlineDrag}
                      title="ลากเพื่อเลื่อนตำแหน่งพาดหัว"
                      className="absolute left-1/2 text-center z-10"
                      style={{
                        top: `${(headlineYPosition / 1920) * 100}%`,
                        transform: 'translateX(-50%)',
                        width: '92%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: isDraggingHeadline ? 'grabbing' : 'grab',
                        touchAction: 'none',
                        transition: isDraggingHeadline ? 'none' : 'top 0.06s ease',
                      }}
                    >
                      <div
                        className="font-extrabold leading-snug whitespace-pre-line break-words text-center flex items-center justify-center"
                        style={{
                          ...getPreviewBannerStyle(simulatedFontSize),
                          ...(headlineBoxWidth > 0 && headlineBoxHeight > 0 && headlineStyle !== 'no-box-shadow' && headlineStyle !== 'outline-minimal'
                            ? { width: `${(headlineBoxWidth / 1080) * 100}cqw`, height: `${(headlineBoxHeight / 1080) * 100}cqw`, maxWidth: 'none', padding: '0.4cqw' }
                            : { maxWidth: '100%' }),
                          outline: isDraggingHeadline ? '2px dashed rgba(168,85,247,0.9)' : 'none',
                          outlineOffset: '2px',
                        }}
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

                {/* พรีวิวลายน้ำ */}
                {watermarkEnabled && watermarkText.trim() && (() => {
                  const cornerPos: Record<string, { x: number; y: number }> = {
                    'top-left': { x: 18.5, y: 12 }, 'top': { x: 50, y: 13 }, 'top-right': { x: 81.5, y: 12 },
                    'bottom-left': { x: 18.5, y: 88.5 }, 'bottom': { x: 50, y: 87.5 }, 'bottom-right': { x: 81.5, y: 88.5 },
                  };
                  const pos = watermarkMode === 'fixed' ? (cornerPos[watermarkCorner] || cornerPos['bottom-right']) : cornerPos['bottom-right'];
                  const op = Math.max(5, Math.min(100, watermarkOpacity)) / 100;
                  let s: React.CSSProperties = { color: `rgba(255,255,255,${op})`, textShadow: '0 0.2cqw 0.4cqw rgba(0,0,0,0.6)' };
                  if (watermarkStyle === 'outline') s = { color: `rgba(255,255,255,${op})`, textShadow: '0 0 0.3cqw #000,0 0 0.3cqw #000,0.15cqw 0.15cqw 0 #000' };
                  else if (watermarkStyle === 'box') s = { color: `rgba(255,255,255,${Math.min(1, op + 0.2)})`, backgroundColor: `rgba(0,0,0,${op * 0.7})`, padding: '0.3cqw 0.8cqw', borderRadius: '0.6cqw' };
                  else if (watermarkStyle === 'italic') s = { color: `rgba(255,255,255,${op})`, fontStyle: 'italic', textShadow: '0 0.2cqw 0.4cqw rgba(0,0,0,0.6)' };
                  return (
                    <div className="absolute z-[25] pointer-events-none font-bold whitespace-nowrap"
                      style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', fontSize: `${(watermarkFontSize / 1080) * 100}cqw`, ...s }}>
                      {watermarkText}
                      {watermarkMode !== 'fixed' && <span className="ml-1 opacity-70">{watermarkMode === 'roaming' ? '🌀' : '🎲'}</span>}
                    </div>
                  );
                })()}

                {/* badge แสดงค่า Y ขณะลาก */}
                {isDraggingHeadline && (
                  <div className="absolute z-30 font-bold text-white"
                    style={{ top: 8, left: '50%', transform: 'translateX(-50%)', background: 'rgba(139,92,246,0.95)', padding: '4px 10px', borderRadius: 9999, fontSize: '3cqw', boxShadow: '0 4px 12px rgba(0,0,0,0.4)' }}>
                    Y = {headlineYPosition}px
                  </div>
                )}

              </div>
            </div>

            <div className="text-gray-500 mt-3 text-center leading-normal" style={{ fontSize: 11, maxWidth: 260 }}>
              🖱️ <b>ลากพาดหัว</b> และ <b>ลาก/ย่อขยาย Avatar</b> (วงกลม/แถบล่าง/กรีนสกรีน) บนจอได้เลย จุดสีม่วงคือที่จับปรับขนาด — ทุกค่าตรงกับตำแหน่ง/ขนาดในวิดีโอที่เรนเดอร์จริง
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

      {subsViewerOpen && (
        <div
          onClick={() => setSubsViewerOpen(false)}
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: '42rem', maxHeight: '88vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#18181B', border: '1px solid var(--border-glass-bright, #3F3F46)', borderRadius: '1.25rem', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass, #27272A)', background: 'rgba(132,204,22,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.5rem' }}>📝</span>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>ซับที่ถอดไว้แล้ว</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '30rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={subsViewerTitle}>{subsViewerTitle} · {subsViewerSegments.length} ประโยค</p>
                </div>
              </div>
              <button onClick={() => setSubsViewerOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 700, padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.25rem' }}>
              {subsViewerSegments.length === 0 ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>ยังไม่มีซับที่ถอดไว้สำหรับคลิปนี้ — กด "🎙️ ถอดซับ" ก่อนครับ</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  {subsViewerSegments.map((seg, idx) => {
                    const ts = formatSubTime(seg?.start);
                    return (
                      <div key={idx} style={{ display: 'flex', gap: '0.75rem', padding: '0.45rem 0.5rem', borderRadius: '0.5rem', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                        {ts && <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted, #71717A)', flexShrink: 0, width: '3rem', paddingTop: '3px' }}>{ts}</span>}
                        <span style={{ fontSize: '0.92rem', color: 'var(--text-primary)', lineHeight: 1.65 }}>{seg?.text || ''}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-glass, #27272A)', background: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <button
                onClick={() => { void navigator.clipboard?.writeText(subsViewerSegments.map((s: any) => s?.text || '').join('\n')); addLog('📋 ก๊อปซับลงคลิปบอร์ดแล้ว'); }}
                disabled={subsViewerSegments.length === 0}
                style={{ padding: '0.5rem 0.85rem', background: '#16a34a', color: '#fff', fontWeight: 700, fontSize: '0.75rem', borderRadius: '0.6rem', border: 'none', cursor: subsViewerSegments.length === 0 ? 'default' : 'pointer', opacity: subsViewerSegments.length === 0 ? 0.4 : 1 }}
              >📋 ก๊อปข้อความทั้งหมด</button>
              <button onClick={() => setSubsViewerOpen(false)} style={{ padding: '0.5rem 1.1rem', background: 'var(--bg-glass-hover, #27272A)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.75rem', borderRadius: '0.6rem', border: '1px solid var(--border-glass, #27272A)', cursor: 'pointer' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {dbHlOpen && (
        <div onClick={() => setDbHlOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(4px)' }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: '40rem', maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#18181B', border: '1px solid var(--border-glass-bright, #3F3F46)', borderRadius: '1.25rem', boxShadow: '0 25px 60px -12px rgba(0,0,0,0.85)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.5rem', borderBottom: '1px solid var(--border-glass, #27272A)', background: 'rgba(245,158,11,0.10)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                <span style={{ fontSize: '1.5rem' }}>🏷️</span>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>พาดหัวจากฐานข้อมูลสินค้า</h3>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)', maxWidth: '30rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={dbHlProductName}>{dbHlProductName} · เลือกแบบที่ชอบเพื่อใช้เป็นพาดหัว</p>
                </div>
              </div>
              <button onClick={() => setDbHlOpen(false)} style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', fontWeight: 700, padding: '0.25rem', background: 'none', border: 'none', cursor: 'pointer', flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
              {dbHlLoading ? (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>🤖 กำลังเขียนพาดหัวจากข้อมูลสินค้า...</div>
              ) : dbHlError ? (
                <div style={{ padding: '1rem', borderRadius: '0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5', fontSize: '0.85rem' }}>⚠️ {dbHlError}</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {dbHlOptions.map((h, idx) => (
                    <button key={idx} onClick={() => pickDbHeadline(h)}
                      style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', textAlign: 'left', padding: '0.9rem 1rem', borderRadius: '0.85rem', background: '#212124', border: '1px solid var(--border-glass, #27272A)', cursor: 'pointer', color: 'var(--text-primary)' }}>
                      <span style={{ background: 'rgba(245,158,11,0.2)', color: '#f59e0b', borderRadius: '999px', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>{idx + 1}</span>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, lineHeight: 1.5 }}>{h}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div style={{ padding: '0.85rem 1.5rem', borderTop: '1px solid var(--border-glass, #27272A)', background: 'rgba(0,0,0,0.25)', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              {!dbHlLoading && dbHlOptions.length > 0 && (
                <button onClick={() => { const pair = shopeePairs.find(p => p.avatarSubfolder === dbHlTarget); if (pair) void openDbHeadlinePicker(pair); }}
                  style={{ padding: '0.5rem 0.85rem', background: 'transparent', color: '#f59e0b', fontWeight: 700, fontSize: '0.75rem', borderRadius: '0.6rem', border: '1px solid rgba(245,158,11,0.5)', cursor: 'pointer' }}>🔄 เขียนใหม่</button>
              )}
              <button onClick={() => setDbHlOpen(false)} style={{ padding: '0.5rem 1.1rem', background: 'var(--bg-glass-hover, #27272A)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '0.75rem', borderRadius: '0.6rem', border: '1px solid var(--border-glass, #27272A)', cursor: 'pointer' }}>ปิด</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShopeePairingCard({ pairs, productOptions, selected, setSelected, headlines, setHeadlines, statusMap, subStatusMap, onTranscribe, onAiHeadline, onRenderOne, onOverrideProduct, onViewSubs, onDbHeadline, dbMatchedKeys, isBusy }: {
  pairs: any[];
  productOptions: any[];
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  headlines: Record<string, string>;
  setHeadlines: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  statusMap: Record<string, { status: string; message?: string; outputPath?: string }>;
  subStatusMap: Record<string, 'idle' | 'transcribing' | 'done' | 'error'>;
  onTranscribe: (pair: any) => void;
  onAiHeadline: (pair: any) => void;
  onRenderOne: (pair: any) => void;
  onOverrideProduct: (avatarSubfolder: string, productPath: string) => void;
  onViewSubs: (pair: any) => void;
  onDbHeadline: (pair: any) => void;
  dbMatchedKeys: Set<string>;
  isBusy: boolean;
}) {
  const matchedPairs = pairs.filter(p => p.matched);
  return (
    <div className="p-6 rounded-3xl border shadow-sm flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-color)' }}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          🛒 ตารางจับคู่ Shopee ({pairs.length} ชุด · จับคู่ได้ {matchedPairs.length})
        </h2>
        <div className="text-[10px] text-gray-500">จำนวนคลิป = จำนวนโฟลเดอร์ Avatar · ใส่พาดหัวต่อแถวได้เลย</div>
      </div>

      {pairs.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500">
          ยังไม่มีข้อมูล — เลือกโฟลเดอร์คลิปสินค้าและ Avatar ด้านบน ระบบจะจับคู่ให้อัตโนมัติ
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: 'var(--border-color)' }}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800 text-left text-xs">
            <thead style={{ backgroundColor: 'var(--bg-body)' }}>
              <tr>
                <th className="px-3 py-3 font-semibold text-center w-12 text-gray-500">
                  <input
                    type="checkbox"
                    className="rounded cursor-pointer w-4 h-4"
                    style={{ accentColor: '#ee4d2d' }}
                    checked={selected.length === matchedPairs.length && matchedPairs.length > 0}
                    onChange={e => setSelected(e.target.checked ? matchedPairs.map(p => p.avatarSubfolder) : [])}
                  />
                </th>
                <th className="px-4 py-3 font-semibold text-gray-500">คลิป footage (สินค้า)</th>
                <th className="px-4 py-3 font-semibold text-gray-500">clip Avatar (script)</th>
                <th className="px-4 py-3 font-semibold text-gray-500 w-32">ขั้นที่ 1: ถอดซับ</th>
                <th className="px-4 py-3 font-semibold text-gray-500">ข้อความพาดหัว</th>
                <th className="px-3 py-3 font-semibold text-gray-500 text-center w-32">ขั้นที่ 2: เรนเดอร์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800" style={{ backgroundColor: 'var(--bg-card)' }}>
              {pairs.map((pair, idx) => {
                const st = statusMap[pair.avatarSubfolder];
                const subSt = subStatusMap[pair.avatarSubfolder] || 'idle';
                return (
                  <tr key={pair.avatarSubfolder} className={`transition-colors ${!pair.matched ? 'bg-amber-50 dark:bg-amber-950/20' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                    <td className="px-3 py-3 text-center">
                      <div className="flex flex-col items-center gap-1">
                        <input
                          type="checkbox"
                          disabled={!pair.matched}
                          className="rounded cursor-pointer w-4 h-4 disabled:opacity-40"
                          style={{ accentColor: '#ee4d2d' }}
                          checked={selected.includes(pair.avatarSubfolder)}
                          onChange={e => setSelected(prev => e.target.checked ? [...prev, pair.avatarSubfolder] : prev.filter(n => n !== pair.avatarSubfolder))}
                        />
                        <span className="text-[10px] font-mono text-gray-400">{idx + 1}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 min-w-[200px]">
                      {pair.matched ? (
                        <div className="font-bold flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          📦 {pair.productSubfolder}
                          <span className="text-[10px] font-normal text-gray-400">({pair.productClipCount} คลิป)</span>
                        </div>
                      ) : (
                        <div>
                          <div className="text-[11px] font-bold text-amber-600 mb-1">⚠️ จับคู่ไม่ได้ — เลือกเอง</div>
                          <select
                            value={pair.productSubfolderPath || ''}
                            onChange={e => onOverrideProduct(pair.avatarSubfolder, e.target.value)}
                            className="w-full px-2 py-1 rounded-md text-[11px] border outline-none cursor-pointer"
                            style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                          >
                            <option value="">— เลือกโฟลเดอร์สินค้า —</option>
                            {productOptions.map(o => <option key={o.path} value={o.path}>{o.name} ({o.clipCount})</option>)}
                          </select>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[160px]">
                      <div className="font-semibold truncate max-w-[180px]" style={{ color: 'var(--text-primary)' }} title={pair.avatarSubfolder}>
                        🧑‍💼 {pair.avatarSubfolder}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate max-w-[180px]" title={pair.avatarVideoFile}>{pair.avatarVideoFile || 'ไม่พบวิดีโอ!'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {subSt === 'transcribing' ? (
                        <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-purple-100 dark:bg-purple-950/40 text-purple-600 animate-pulse">🎙️ กำลังถอด...</span>
                      ) : subSt === 'done' ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] px-2 py-0.5 rounded font-semibold bg-green-100 dark:bg-green-950/40 text-green-600 w-max">✅ ถอดซับแล้ว</span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => onViewSubs(pair)} className="text-[10px] underline text-gray-400 hover:text-green-600 cursor-pointer">👁️ ดูซับ</button>
                            <button onClick={() => onTranscribe(pair)} disabled={isBusy || !pair.avatarVideoFile} className="text-[10px] underline text-gray-400 hover:text-purple-500 disabled:opacity-40 cursor-pointer">ถอดใหม่</button>
                          </div>
                        </div>
                      ) : subSt === 'error' ? (
                        <button onClick={() => onTranscribe(pair)} disabled={isBusy || !pair.avatarVideoFile} className="px-2.5 py-1 rounded-lg border text-[11px] font-bold text-red-500 disabled:opacity-40 cursor-pointer" style={{ borderColor: 'var(--border-color)' }}>⚠️ ลองใหม่</button>
                      ) : (
                        <button onClick={() => onTranscribe(pair)} disabled={isBusy || !pair.avatarVideoFile} className="px-2.5 py-1.5 rounded-lg border text-[11px] font-bold transition-all hover:bg-purple-500/5 disabled:opacity-40 cursor-pointer" style={{ borderColor: 'var(--border-color)', color: '#a855f7' }}>🎙️ ถอดซับ</button>
                      )}
                    </td>
                    <td className="px-4 py-3 min-w-[220px]">
                      <div className="flex flex-col gap-1.5">
                        <textarea
                          value={headlines[pair.avatarSubfolder] || ''}
                          onChange={e => setHeadlines(prev => ({ ...prev, [pair.avatarSubfolder]: e.target.value }))}
                          rows={2}
                          placeholder="พิมพ์ข้อความพาดหัว..."
                          className="w-full px-2 py-1 rounded-md text-[11px] border outline-none resize-none font-medium leading-tight"
                          style={{ backgroundColor: 'var(--bg-body)', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                        />
                        <div className="flex flex-wrap gap-1.5">
                          <button
                            onClick={() => onDbHeadline(pair)}
                            disabled={isBusy || !dbMatchedKeys.has(pair.avatarSubfolder)}
                            className="px-2 py-1 rounded-md text-[10px] font-bold border transition-all disabled:opacity-50 cursor-pointer"
                            style={{ borderColor: 'rgba(245,158,11,0.5)', color: '#f59e0b' }}
                            title={dbMatchedKeys.has(pair.avatarSubfolder) ? 'เขียนพาดหัวจากข้อมูลสินค้าจริงในฐานข้อมูล' : 'ไม่พบสินค้านี้ในฐานข้อมูล — อัพโหลด CSV ก่อน'}
                          >
                            🏷️ จาก DB
                          </button>
                          <button
                            onClick={() => onAiHeadline(pair)}
                            disabled={isBusy || !pair.avatarVideoFile}
                            className="px-2 py-1 rounded-md text-[10px] font-bold border transition-all hover:bg-purple-500/5 disabled:opacity-50 cursor-pointer"
                            style={{ borderColor: 'var(--border-color)', color: '#a855f7' }}
                            title="ถอดซับ + ให้ AI คิดพาดหัวสไตล์สุขุมให้ (ถอดซับด้วยในตัว)"
                          >
                            💡 AI (+ถอดซับ)
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {st?.status === 'rendering' && <span className="text-[11px] text-indigo-500 font-semibold animate-pulse">🎬 ตัดต่อ...</span>}
                      {st?.status === 'ai' && <span className="text-[11px] text-purple-500 font-semibold animate-pulse">🧠 คิด...</span>}
                      {st?.status === 'done' && <span className="text-[11px] text-green-600 font-semibold">✅ สำเร็จ</span>}
                      {st?.status === 'error' && <span className="text-[11px] text-red-500 font-semibold" title={st.message}>⚠️ ผิดพลาด</span>}
                      {(!st || st.status === 'idle') && (
                        <button
                          onClick={() => onRenderOne(pair)}
                          disabled={isBusy || !pair.matched}
                          className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-600 text-white font-bold text-[10px] disabled:opacity-40 transition-all cursor-pointer"
                        >
                          🎬 ตัดเดี่ยว
                        </button>
                      )}
                      {st?.message && st.status !== 'rendering' && st.status !== 'ai' && (
                        <div className="text-[9px] text-gray-400 mt-1 truncate max-w-[120px]" title={st.message}>{st.message}</div>
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

function SliderField({ label, value, unit, min, max, step = 1, onChange, hint }: {
  label: string; value: number; unit?: string; min: number; max: number; step?: number; onChange: (v: number) => void; hint?: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center text-sm font-semibold mb-2">
        <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-mono text-purple-500 font-bold">{value}{unit || ''}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
      {hint && <div className="text-[10px] text-gray-500 mt-1">{hint}</div>}
    </div>
  );
}
