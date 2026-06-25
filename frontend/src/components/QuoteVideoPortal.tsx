import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles, Download, FileVideo, Folder, FolderOpen, Music, AlertCircle,
  RefreshCw, Type, Maximize2, Play, Pause, Square, Eye, EyeOff, Save, Brain as BrainIcon,
  LayoutTemplate, Image as ImageIcon, Star, Trash2, Shuffle, Wand2, FileText, ChevronDown,
} from 'lucide-react';

import type { CanvasElement, CanvasTemplate, CategoryId, QuoteCategoryConfig, Brain } from './quote/types';
import { BUILT_IN_TEMPLATES, getTemplateById } from './quote/templates';
import { getRecipesForCategory, getRecipeById, type ContentRecipe } from './quote/recipes';
import { CATEGORIES, getCategory, loadCategoryConfig, saveCategoryConfig, loadBrains, saveBrains } from './quote/categories';
import { renderOverlay, preloadLogo } from './quote/overlayRenderer';
import { useQuoteRender } from './quote/useQuoteRender';

const DEFAULT_AI_MODEL = 'google/gemini-2.5-flash';
const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

// ── helpers สีกล่อง ──
const parseRgba = (colorStr: string) => {
  if (!colorStr) return { hex: '#000000', opacity: 55 };
  if (colorStr.startsWith('#')) return { hex: colorStr, opacity: 100 };
  const m = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (m) {
    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    return { hex: '#' + toHex(+m[1]) + toHex(+m[2]) + toHex(+m[3]), opacity: Math.round((m[4] ? +m[4] : 1) * 100) };
  }
  return { hex: '#000000', opacity: 55 };
};
const toRgba = (hex: string, opacity: number) => {
  const c = hex.replace('#', '');
  return `rgba(${parseInt(c.slice(0, 2), 16) || 0}, ${parseInt(c.slice(2, 4), 16) || 0}, ${parseInt(c.slice(4, 6), 16) || 0}, ${opacity / 100})`;
};

const FILTER_OPTIONS = [
  { value: 'none', label: 'ปกติ (ต้นฉบับ)' },
  { value: 'dark', label: 'ย้อมดำเงา (Dark)' },
  { value: 'vintage', label: 'วินเทจส้มคลาสสิก' },
  { value: 'warm', label: 'โทนอุ่น (Warm)' },
  { value: 'cool', label: 'ฟ้าเท่ไซเบอร์ (Cool)' },
];

// แทนเนื้อหาลงบล็อกข้อความตามลำดับ (header/title คงเดิม)
function applyContentToElements(elements: CanvasElement[], contentStr: string, headlineMode: boolean): CanvasElement[] {
  if (!contentStr.trim()) return elements;
  const blocks = contentStr.split(/\n---\n|\n\n\n|\\n\\n\\n/).map(b => b.trim().replace(/\\n/g, '\n')).filter(Boolean);
  const blockEls = elements.filter(e => e.type === 'text-block');
  return elements.map((el) => {
    if (headlineMode && el.id === 'title_main') return { ...el, text: blocks[0] || el.text };
    if (el.type === 'text-block') {
      const idx = blockEls.indexOf(el);
      const target = headlineMode ? idx + 1 : idx;
      if (target >= 0 && target < blocks.length) return { ...el, text: blocks[target] };
    }
    return el;
  });
}

// แสดงค่าตัวเลขในช่อง input — ถ้าไม่ใช่ตัวเลข (ลบทิ้งหมด) ให้เป็นค่าว่าง เพื่อให้พิมพ์ใหม่ได้สะดวก
const numOrEmpty = (n: number): number | '' => (Number.isFinite(n) ? n : '');

// รูปแบบกล่อง footer ให้เลือก (เด่นต่างกัน)
const FOOTER_STYLES: { id: string; label: string; props: Partial<CanvasElement> }[] = [
  { id: 'gold', label: '🏆 แถบทอง', props: { color: '#1a1200', bold: true, bgBox: true, bgBoxGradient: { from: '#FFE69A', to: '#D99A1C' }, bgBoxRadius: 16 } },
  { id: 'red', label: '🔴 แดงโปรโมชั่น', props: { color: '#FFFFFF', bold: true, bgBox: true, bgBoxColor: 'rgba(220,38,38,0.95)', bgBoxRadius: 16 } },
  { id: 'pill', label: '⚪ ป้ายขาว', props: { color: '#0f172a', bold: true, bgBox: true, bgBoxColor: 'rgba(255,255,255,0.95)', bgBoxRadius: 34 } },
  { id: 'bar', label: '⬛ แถบดำโปร่ง', props: { color: '#FFFFFF', bold: false, bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 12 } },
  { id: 'plain', label: '✨ ตัวอักษรล้วน', props: { color: '#FFFFFF', bold: true, bgBox: false, bgBoxRadius: 0 } },
];

// องค์ประกอบ footer (เครดิต/โปรโมชั่น) วางล่างสุดของคลิป — ปรับขนาด+สไตล์ได้
const footerElement = (text: string, fontSize: number, styleId: string): CanvasElement => {
  const fs = Number.isFinite(fontSize) ? Math.min(70, Math.max(16, fontSize)) : 34;
  const preset = (FOOTER_STYLES.find(s => s.id === styleId) || FOOTER_STYLES[0]).props;
  const padY = Math.round(fs * 0.42);
  const boxHpct = ((fs * 1.35 + padY * 2) / 1920) * 100;
  const y = Math.max(60, 98.5 - boxHpct);   // ยึดล่างสุดเสมอ ไม่ว่าฟอนต์ใหญ่แค่ไหน
  return {
    id: 'footer_credit', type: 'title', x: 4, y, width: 92, text,
    fontSize: fs, color: '#FFFFFF', bold: false, textAlign: 'center',
    bgBox: true, bgBoxColor: 'rgba(0,0,0,0.5)', bgBoxRadius: 14, bgBoxPaddingX: 28, bgBoxPaddingY: padY, bgBoxMode: 'fit',
    ...preset,
  } as CanvasElement;
};

// ใส่ป้าย (A/B/C/D, 1/2/3/4, A/B/AB/O) + สีป้าย ลงช่อง badge_i ของเทมเพลต icon_list_4 ตามสูตร
function applyBadges(els: CanvasElement[], badges?: string[], colors?: string[]): CanvasElement[] {
  if (!badges && !colors) return els;
  return els.map(el => {
    const m = el.id.match(/^badge_(\d+)$/);
    if (!m) return el;
    const i = +m[1];
    const patch: Partial<CanvasElement> = {};
    if (badges && badges[i] != null) patch.text = badges[i];
    if (colors && colors[i] != null) patch.bgBoxColor = colors[i];
    return Object.keys(patch).length ? { ...el, ...patch } : el;
  });
}

// ตั้งขนาดฟอนต์ให้ทุกช่องเนื้อหา (text-block) — ใช้เป็นทั้งขนาดจริงและเพดานของ auto-fit
function applyFontToBlocks(els: CanvasElement[], size: number): CanvasElement[] {
  return els.map(el => el.type === 'text-block' ? { ...el, fontSize: size, autoFitMax: size } : el);
}

// ใส่สีพื้นการ์ดต่อช่อง block_i (เช่น สีมงคลประจำวันเกิด)
function applyCellColors(els: CanvasElement[], colors?: string[]): CanvasElement[] {
  if (!colors) return els;
  return els.map(el => {
    const m = el.id.match(/^block_(\d+)$/);
    return m && el.type === 'text-block' && colors[+m[1]] != null
      ? { ...el, bgBoxColor: colors[+m[1]], bgBoxGradient: undefined }
      : el;
  });
}

// พรีเซ็ตขนาดฟอนต์ให้เลือก
const FONT_PRESETS = [
  { label: 'เล็ก', v: 32 },
  { label: 'กลาง', v: 44 },
  { label: 'ใหญ่', v: 54 },
  { label: 'ใหญ่มาก', v: 64 },
];

// คำนวณ "ความยาวตัวอักษรที่พอดีกล่อง" จากเทมเพลต + ขนาดฟอนต์ที่เลือก → เอาไปบอก AI
function charBudgetFor(tpl: CanvasTemplate, fontSize: number, hasLabel: boolean): { maxChars: number; perLine: number; lines: number } | null {
  const block = tpl.elements.find(e => e.type === 'text-block');
  if (!block || !block.boxHeight) return null;
  const W = tpl.canvasWidth, H = tpl.canvasHeight;
  const innerW = (block.width / 100) * W - (block.bgBox ? block.bgBoxPaddingX * 2 : 0);
  const innerH = (block.boxHeight / 100) * H - (block.bgBox ? block.bgBoxPaddingY * 2 : 0);
  const perLine = Math.max(4, Math.floor(innerW / (fontSize * 0.54)));   // ฟอนต์ไทย ~0.54 ของ px ต่อ 1 ตัว
  const linesFit = Math.max(1, Math.round(innerH / (fontSize * 1.3)));    // ปัดให้ใช้พื้นที่เต็มกล่อง
  const usableLines = Math.max(1, linesFit - (hasLabel ? 1 : 0));        // เผื่อบรรทัดชื่อ/ป้าย
  return { maxChars: perLine * usableLines, perLine, lines: usableLines };
}

// สูตรเริ่มต้นของหมวด (อันแรกของหมวดนั้น ถ้ามี)
const firstRecipeOf = (cat: CategoryId): ContentRecipe | null => getRecipesForCategory(cat)[0] || null;

export default function QuoteVideoPortal() {
  // ── หมวด + config ──
  const [activeCat, setActiveCat] = useState<CategoryId>(() => (localStorage.getItem('quote_active_category') as CategoryId) || 'ai');
  const [config, setConfig] = useState<QuoteCategoryConfig>(() => loadCategoryConfig((localStorage.getItem('quote_active_category') as CategoryId) || 'ai'));
  const cat = getCategory(activeCat);

  const updateConfig = useCallback((patch: Partial<QuoteCategoryConfig>) => {
    setConfig(prev => {
      const next = { ...prev, ...patch };
      saveCategoryConfig(activeCat, next);
      return next;
    });
  }, [activeCat]);

  // ── สูตรคอนเทนต์ (เลือกสไตล์การเขียน/ทำนาย) ──
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(() => firstRecipeOf(activeCat)?.id || null);
  const [recipeTopics, setRecipeTopics] = useState<string>(() => firstRecipeOf(activeCat)?.topicPool[0] || '');   // textarea: 1 บรรทัด = 1 หัวข้อ = 1 คลิป
  const [advancedLayoutOpen, setAdvancedLayoutOpen] = useState(false);
  const [recipeFontMax, setRecipeFontMax] = useState(44);   // ขนาดฟอนต์ที่ผู้ใช้เลือกสำหรับช่องในสูตร (กริด/การ์ด)
  const activeRecipe = activeRecipeId ? getRecipeById(activeRecipeId) : null;

  // ── เทมเพลต + องค์ประกอบ ──
  const [activeTemplate, setActiveTemplate] = useState<CanvasTemplate>(() => {
    const r = firstRecipeOf(activeCat);
    return (r && getTemplateById(r.templateId)) || getTemplateById(loadCategoryConfig(activeCat).lastTemplateId) || BUILT_IN_TEMPLATES[0];
  });
  const [elements, setElements] = useState<CanvasElement[]>(() => applyBadges(activeTemplate.elements.map(e => ({ ...e })), firstRecipeOf(activeCat)?.badges, firstRecipeOf(activeCat)?.badgeColors));
  const [selectedElId, setSelectedElId] = useState<string | null>(null);

  // ── batch / พรีวิว ──
  const [batchCount, setBatchCount] = useState(1);
  const [batchContents, setBatchContents] = useState<string[]>(['']);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [blockMargin, setBlockMargin] = useState(16);
  const [epStart, setEpStart] = useState(1);

  // ── AI ──
  const [aiGenMode, setAiGenMode] = useState<'series' | 'headlines'>('series');
  const [aiTopic, setAiTopic] = useState('');
  const [aiCustomHeadlines, setAiCustomHeadlines] = useState('');
  const [epEnd, setEpEnd] = useState(5);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGenProgress, setAiGenProgress] = useState(0);
  const [aiGenLog, setAiGenLog] = useState<string[]>([]);

  // ── สมอง ──
  const [brains, setBrains] = useState<Brain[]>(() => loadBrains());
  const [newBrainName, setNewBrainName] = useState('');

  // ── โลโก้ ──
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);
  const [previewClipUrl, setPreviewClipUrl] = useState<string>('');

  // ── render hook + log ──
  const { logs, status, progress, start, pause, resume, stop } = useQuoteRender();
  const [showLog, setShowLog] = useState(true);

  // ── canvas refs ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const logEndRef = useRef<HTMLDivElement>(null);

  // โหลดฟอนต์ไทย
  useEffect(() => {
    const families = ['Prompt', 'Sarabun', 'Kanit', 'Mitr', 'Chakra+Petch', 'IBM+Plex+Sans+Thai', 'Noto+Sans+Thai'];
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}:wght@400;700;900`).join('&')}&display=swap`;
    document.head.appendChild(link);
  }, []);

  // เปลี่ยนหมวด → โหลด config + สูตร/เทมเพลตเริ่มต้นของหมวดนั้น
  const switchCategory = (id: CategoryId) => {
    setActiveCat(id);
    localStorage.setItem('quote_active_category', id);
    const cfg = loadCategoryConfig(id);
    setConfig(cfg);
    setSelectedElId(null);
    setBatchCount(1);
    setBatchContents(['']);
    setPreviewIndex(0);
    const r = firstRecipeOf(id);
    if (r) {
      applyRecipe(r, cfg);
    } else {
      setActiveRecipeId(null);
      setRecipeTopics('');
      const tpl = getTemplateById(cfg.lastTemplateId) || BUILT_IN_TEMPLATES[0];
      setActiveTemplate(tpl);
      setElements(tpl.elements.map(e => ({ ...e })));
    }
  };

  // เลือกสูตร → ตั้งเทมเพลต + ป้าย + หัวข้อเริ่มต้น (cfgOverride ใช้ตอนสลับหมวด)
  const applyRecipe = (r: ContentRecipe, cfgOverride?: QuoteCategoryConfig) => {
    setActiveRecipeId(r.id);
    setRecipeTopics(r.topicPool[0] || '');
    const tpl = getTemplateById(r.templateId);
    if (tpl) {
      setActiveTemplate(tpl);
      let els = applyBadges(tpl.elements.map(e => ({ ...e })), r.badges, r.badgeColors);
      els = applyCellColors(els, r.cellColors);
      if (r.blockCount >= 3) els = applyFontToBlocks(els, recipeFontMax);   // สูตรหลายช่อง → ใช้ฟอนต์ที่เลือก
      setElements(els);
      if (cfgOverride) saveCategoryConfig(r.category, { ...cfgOverride, lastTemplateId: tpl.id });
      else updateConfig({ lastTemplateId: tpl.id });
    }
    setSelectedElId(null);
    setBatchCount(1);
    setBatchContents(['']);
    setPreviewIndex(0);
  };

  // เปลี่ยนขนาดฟอนต์ของช่องทั้งหมด (ทันทีกับเทมเพลตปัจจุบัน)
  const setRecipeFont = (size: number) => {
    setRecipeFontMax(size);
    setElements(prev => applyFontToBlocks(prev, size));
  };

  const selectTemplate = (tpl: CanvasTemplate) => {
    setActiveTemplate(tpl);
    setElements(tpl.elements.map(e => ({ ...e })));
    setSelectedElId(null);
    setBatchCount(1);
    setBatchContents(['']);
    setPreviewIndex(0);
    updateConfig({ lastTemplateId: tpl.id });
  };

  // preload โลโก้
  useEffect(() => {
    let alive = true;
    if (config.logoImage) preloadLogo(config.logoImage).then(img => { if (alive) setLogoImg(img); });
    else setLogoImg(null);
    return () => { alive = false; };
  }, [config.logoImage]);

  // คำนวณ elements สำหรับ EP/พรีวิวที่แสดงอยู่
  const computeFinalEls = useCallback((content: string, idx: number): CanvasElement[] => {
    const headlineMode = activeRecipe ? activeRecipe.hasTitle : aiGenMode === 'headlines';
    const withContent = applyContentToElements(elements, content, headlineMode);
    let finalEls = withContent.map(el => el.id === 'title_ep' ? { ...el, text: headlineMode ? '' : `EP.${epStart + idx}` } : el);
    if (config.footerText && config.footerText.trim()) finalEls = [...finalEls, footerElement(config.footerText.trim(), config.footerFontSize, config.footerStyle)];
    return finalEls;
  }, [elements, aiGenMode, epStart, activeRecipe, config.footerText, config.footerFontSize, config.footerStyle]);

  // วาดพรีวิว
  useEffect(() => {
    if (!canvasRef.current) return;
    const finalEls = computeFinalEls(batchContents[previewIndex] || '', previewIndex);
    renderOverlay(canvasRef.current, activeTemplate, finalEls, {
      colorFilter: config.colorFilter,
      blockMargin,
      logoImg,
      logoPosition: config.logoPosition,
      logoScale: config.logoScale,
    });
  }, [activeTemplate, elements, batchContents, previewIndex, config.colorFilter, config.logoPosition, config.logoScale, blockMargin, logoImg, computeFinalEls]);

  // เลื่อน log อัตโนมัติ
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);

  // ── drag & drop องค์ประกอบ ──
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const tpl = activeTemplate;
    const cx = (e.clientX - rect.left) * (tpl.canvasWidth / rect.width);
    const cy = (e.clientY - rect.top) * (tpl.canvasHeight / rect.height);
    const finalEls = computeFinalEls(batchContents[previewIndex] || '', previewIndex);
    for (let i = finalEls.length - 1; i >= 0; i--) {
      const el = finalEls[i];
      const px = (el.x / 100) * tpl.canvasWidth;
      const py = (el as any)._computedY ?? (el.y / 100) * tpl.canvasHeight;
      const pw = (el.width / 100) * tpl.canvasWidth;
      const ph = (el as any)._renderedH || el.fontSize * 1.5;
      if (cx >= px && cx <= px + pw && cy >= py && cy <= py + ph) {
        setSelectedElId(el.id);
        setIsDragging(true);
        dragOffset.current = { x: cx - px, y: cy - py };
        return;
      }
    }
    setSelectedElId(null);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedElId || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const tpl = activeTemplate;
    const cx = (e.clientX - rect.left) * (tpl.canvasWidth / rect.width);
    const cy = (e.clientY - rect.top) * (tpl.canvasHeight / rect.height);
    const tx = ((cx - dragOffset.current.x) / tpl.canvasWidth) * 100;
    const ty = ((cy - dragOffset.current.y) / tpl.canvasHeight) * 100;
    setElements(prev => prev.map(el => el.id === selectedElId
      ? { ...el, x: Math.max(0, Math.min(100 - el.width, tx)), y: Math.max(0, Math.min(98, ty)) }
      : el));
  };
  const handleMouseUp = () => setIsDragging(false);

  const patchSelected = (patch: Partial<CanvasElement>) =>
    setElements(prev => prev.map(el => el.id === selectedElId ? { ...el, ...patch } : el));
  const selectedEl = elements.find(el => el.id === selectedElId);

  // ── เลือกโฟลเดอร์/ไฟล์ ──
  const pickFolder = async (field: 'footageFolder' | 'outputFolder', prompt: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      if (data.success && data.dir) {
        updateConfig({ [field]: data.dir } as any);
        if (field === 'outputFolder') localStorage.setItem('custom_output_folder', data.dir);
      }
    } catch (e) { console.error(e); }
  };
  const pickBgm = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/pick-file`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: 'เลือกไฟล์เพลงประกอบ (BGM)' }) });
      const data = await res.json();
      if (data.success && data.file) updateConfig({ bgmFile: data.file });
    } catch (e) { console.error(e); }
  };
  const openOutputFolder = async () => {
    if (config.outputFolder) { try { await fetch(`${BACKEND_BASE}/api/open-folder?type=${encodeURIComponent(config.outputFolder)}`); } catch {} }
  };
  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => updateConfig({ logoImage: String(reader.result || '') });
    reader.readAsDataURL(file);
  };
  const onPreviewClipUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewClipUrl(url);
    setTimeout(() => { videoRef.current?.play().catch(() => {}); }, 100);
  };

  // ── batch ──
  const updateBatchCount = (n: number) => {
    if (!Number.isFinite(n)) { setBatchCount(n); return; }   // ปล่อยว่างชั่วคราวระหว่างพิมพ์/ลบ
    const c = Math.max(1, Math.min(50, n));
    setBatchCount(c);
    setBatchContents(prev => Array.from({ length: c }, (_, i) => prev[i] || ''));
    if (previewIndex >= c) setPreviewIndex(c - 1);
  };

  // ── สมอง: บันทึก/ลบ/เลือก ──
  const saveCurrentBrain = () => {
    const name = newBrainName.trim();
    if (!name) { alert('ตั้งชื่อสมองก่อนบันทึก'); return; }
    const brain: Brain = { id: 'b_' + Date.now(), name, systemPrompt: config.customBrainText, category: activeCat };
    const next = [...brains, brain];
    setBrains(next); saveBrains(next);
    updateConfig({ brainId: brain.id });
    setNewBrainName('');
  };
  const deleteBrain = (id: string) => {
    const next = brains.filter(b => b.id !== id);
    setBrains(next); saveBrains(next);
    if (config.brainId === id) updateConfig({ brainId: 'default' });
  };
  const applyBrain = (id: string) => {
    if (id === 'default') { updateConfig({ brainId: 'default', customBrainText: cat.defaultBrain }); return; }
    const b = brains.find(x => x.id === id);
    if (b) updateConfig({ brainId: id, customBrainText: b.systemPrompt });
  };

  // ── AI generate ──
  const generateContentWithAI = async () => {
    const apiKey = localStorage.getItem('openrouter_key')?.trim();
    if (!apiKey) { alert('กรุณากรอกคีย์ OpenRouter ในหน้าตั้งค่าก่อน'); return; }
    const blockCount = elements.filter(el => el.type === 'text-block').length;
    if (blockCount === 0) { alert('เทมเพลตนี้ไม่มีบล็อกข้อความให้เติม'); return; }

    let totalEps = 0; let headlines: string[] = [];
    if (aiGenMode === 'headlines') {
      headlines = aiCustomHeadlines.split('\n').map(l => l.trim()).filter(Boolean);
      if (!headlines.length) { alert('กรอกพาดหัวอย่างน้อย 1 บรรทัด'); return; }
      totalEps = headlines.length;
    } else {
      totalEps = epEnd - epStart + 1;
      if (totalEps < 1 || totalEps > 50) { alert('จำนวน EP ต้องอยู่ระหว่าง 1-50'); return; }
    }

    setIsAiGenerating(true); setAiGenProgress(0); setAiGenLog([]);
    setBatchCount(totalEps);
    setBatchContents(Array.from({ length: totalEps }, (_, i) => batchContents[i] || ''));
    const topicContext = aiTopic.trim() || activeTemplate.name;
    const toneLabel = cat.tones.find(t => t.value === config.tone)?.label || '';

    try {
      for (let i = 0; i < totalEps; i++) {
        const epNum = aiGenMode === 'headlines' ? (i + 1) : (epStart + i);
        setAiGenProgress(i + 1);
        const currentHeadline = aiGenMode === 'headlines' ? headlines[i] : '';
        setAiGenLog(prev => [...prev, aiGenMode === 'headlines'
          ? `🔄 สร้างจากพาดหัว: "${currentHeadline}"`
          : `🔄 สร้างตอน EP.${epNum}...`]);

        const systemContent = `${config.customBrainText}

[โทนการเล่า] ${toneLabel}
[กฎโครงสร้างผลลัพธ์ — สำคัญมาก]
- เขียนเนื้อหาแบ่งเป็น ${blockCount} บล็อก ที่สอดคล้องต่อเนื่องกัน
${aiGenMode === 'headlines' ? `- บล็อกที่ 1 ให้อิงพาดหัวนี้ (ห้ามเปลี่ยนความหมาย): "${currentHeadline}"\n- บล็อกที่เหลือเขียนขยายต่อให้กลมกลืน` : ''}
- แต่ละบรรทัดยาวไม่เกิน ~25 ตัวอักษร ใช้ \\n ตัดบรรทัดให้อ่านง่าย (2-4 บรรทัดต่อบล็อก)
- ห้ามมีคำว่า EP / ตอนที่ / อีโมจิ / แฮชแท็ก ในเนื้อหา
- ตอบกลับเป็น JSON เท่านั้น: {"blocks": ["บล็อก1", "บล็อก2", ...]}
หัวข้อ/บริบท: "${topicContext}" (ตอนที่ ${epNum} จากทั้งหมด ${totalEps})`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: DEFAULT_AI_MODEL,
              messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: aiGenMode === 'headlines'
                  ? `ขยายความต่อจากพาดหัว "${currentHeadline}" ให้ครบ ${blockCount} บล็อก`
                  : `เขียนตอน EP.${epNum} สำหรับ "${topicContext}" ให้ทรงพลังครบ ${blockCount} บล็อก` },
              ],
              response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = await resp.json();
          if (data.error) throw new Error(data.error.message || 'AI error');
          let txt = data.choices?.[0]?.message?.content || '';
          if (txt.includes('```')) txt = txt.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(txt);
          const epBlocks: string[] = parsed.blocks || [];
          const joined = epBlocks.join('\n\n\n');
          setBatchContents(prev => {
            const next = [...prev];
            while (next.length < totalEps) next.push('');
            next[i] = joined;
            return next;
          });
          setAiGenLog(prev => [...prev, `✅ เสร็จ ${aiGenMode === 'headlines' ? `พาดหัว ${i + 1}` : `EP.${epNum}`}`]);
        } catch (err: any) {
          setAiGenLog(prev => [...prev, `❌ ล้มเหลว: ${err.name === 'AbortError' ? 'หมดเวลา (30s)' : err.message}`]);
        }
        await new Promise(r => setTimeout(r, 150));
      }
      setPreviewIndex(0);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด AI: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // ── สุ่มหัวข้อจากคลังของสูตร (กี่คลิปก็หยิบให้ครบ ไม่ซ้ำเท่าที่คลังมี) ──
  // หัวข้อจาก textarea: 1 บรรทัด = 1 หัวข้อ (กรองบรรทัดว่าง)
  const topicLines = (): string[] => recipeTopics.split('\n').map(s => s.trim()).filter(Boolean);

  // เติมหัวข้อสุ่มจากคลังลง textarea (สลับลำดับ)
  const fillRandomTopics = () => {
    if (!activeRecipe) return;
    const pool = [...activeRecipe.topicPool];
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    setRecipeTopics(pool.join('\n'));
  };

  // ── ① เขียนสคริปต์ตามสูตร (เพจที่มีสูตร เช่น ดูดวง) ──
  const generateScriptsWithRecipe = async () => {
    const apiKey = localStorage.getItem('openrouter_key')?.trim();
    if (!apiKey) { alert('กรุณากรอกคีย์ OpenRouter ในหน้าตั้งค่าก่อน'); return; }
    const r = activeRecipe;
    if (!r) return;
    // หลายบรรทัด = 1 คลิปต่อหัวข้อ; ว่าง/บรรทัดเดียว = ใช้จำนวนคลิปด้านล่าง (หัวข้อเดียวซ้ำ)
    const lines = topicLines();
    const safeBatch = Number.isFinite(batchCount) ? batchCount : 1;
    const count = lines.length > 1 ? lines.length : Math.max(1, safeBatch);
    const topics = Array.from({ length: count }, (_, i) => lines.length > 0 ? lines[i % lines.length] : r.name);
    const toneLabel = cat.tones.find(t => t.value === config.tone)?.label || '';

    setIsAiGenerating(true); setAiGenProgress(0); setAiGenLog([]);
    setBatchCount(count);
    setBatchContents(Array.from({ length: count }, (_, i) => batchContents[i] || ''));

    const jsonRule = r.labels
      ? `{"title": "หัวข้อ/พาดหัว", "items": ["เนื้อหาสั้น1", ... รวม ${r.blockCount} อันพอดี เรียงตามลำดับที่สูตรกำหนด]}`
      : r.hasTitle
      ? `{"title": "หัวข้อ/พาดหัว", "blocks": ["บล็อก1", ... รวม ${r.blockCount} บล็อก]}`
      : `{"blocks": ["บล็อก1", ... รวม ${r.blockCount} บล็อก]}`;

    // คำนวณความยาวตัวอักษรที่พอดีกล่องจากขนาดฟอนต์ที่เลือก → บอก AI ให้เขียนพอดี
    const budget = r.blockCount >= 3 ? charBudgetFor(activeTemplate, recipeFontMax, !!r.labels) : null;
    const charNote = budget
      ? `\n[ความยาวพอดีกล่อง — สำคัญมาก] ${r.labels ? 'เนื้อหาแต่ละช่อง (ไม่นับชื่อ)' : 'แต่ละบล็อก'} เขียนให้ยาวเต็มกล่องสวยงาม ~${budget.lines} บรรทัด (ราว ${budget.perLine} ตัว/บรรทัด รวม ~${budget.maxChars} ตัวอักษร) — อย่าเขียนสั้นจนเหลือที่ว่างเยอะ และอย่ายาวจนล้นกล่อง`
      : '';

    try {
      for (let i = 0; i < count; i++) {
        setAiGenProgress(i + 1);
        const topic = topics[i];
        setAiGenLog(prev => [...prev, `🔄 เขียนคลิป ${i + 1}/${count}: "${topic}"`]);

        const systemContent = `${config.customBrainText}

[โทนการเล่า] ${toneLabel}
[สูตรคอนเทนต์] ${r.name}
${r.structure}${charNote}
[กฎผลลัพธ์ — สำคัญมาก]
- ต้องมี blocks ครบ ${r.blockCount} บล็อกพอดี เรียงตามที่สูตรกำหนด
- แต่ละบรรทัดสั้น กระชับ อ่านง่ายบนคลิปแนวตั้ง ใช้ \\n ตัดบรรทัด
- ห้ามใส่อีโมจิ/แฮชแท็ก ยกเว้นที่สูตรระบุไว้ และห้ามใส่เลขข้อ/ตัวอักษรซ้ำกับป้าย (A B C D / 1 2 3 4) ในเนื้อหา
- ตอบกลับเป็น JSON เท่านั้น: ${jsonRule}`;

        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);
          const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: DEFAULT_AI_MODEL,
              messages: [
                { role: 'system', content: systemContent },
                { role: 'user', content: `เขียนคอนเทนต์ตามสูตร "${r.name}" หัวข้อ "${topic}" ให้ครบ ${r.blockCount} บล็อก` },
              ],
              response_format: { type: 'json_object' },
            }),
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = await resp.json();
          if (data.error) throw new Error(data.error.message || 'AI error');
          let txt = data.choices?.[0]?.message?.content || '';
          if (txt.includes('```')) txt = txt.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(txt);
          let blocks: string[];
          if (r.labels) {
            // โหมดป้ายตายตัว: AI ส่งแค่เนื้อหา ระบบเติมชื่อ/ป้ายให้ → ช่องไม่มีทางเลื่อนหรือรวมกัน
            const items: any[] = parsed.items || parsed.blocks || [];
            blocks = r.labels.map((lbl, k) => `${lbl}\n${String(items[k] ?? '').replace(new RegExp('^' + lbl + '\\s*'), '').trim() || '—'}`);
          } else {
            blocks = (parsed.blocks || []).map((b: any) => String(b));
            if (blocks.length > r.blockCount) blocks = blocks.slice(0, r.blockCount);
            while (blocks.length < r.blockCount) blocks.push('');
          }
          const joined = (r.hasTitle ? [String(parsed.title || topic), ...blocks] : blocks).join('\n\n\n');
          setBatchContents(prev => {
            const next = [...prev];
            while (next.length < count) next.push('');
            next[i] = joined;
            return next;
          });
          setAiGenLog(prev => [...prev, `✅ เสร็จคลิป ${i + 1}`]);
        } catch (err: any) {
          setAiGenLog(prev => [...prev, `❌ คลิป ${i + 1} ล้มเหลว: ${err.name === 'AbortError' ? 'หมดเวลา (30s)' : err.message}`]);
        }
        await new Promise(res => setTimeout(res, 150));
      }
      setPreviewIndex(0);
    } catch (err: any) {
      alert('เกิดข้อผิดพลาด AI: ' + err.message);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // โหลดตัวอย่างสำเร็จรูปของสูตร (ดูได้ทันที ไม่ต้องรอ AI) — เติมให้ครบทุกคลิป
  const loadRecipeSample = () => {
    if (!activeRecipe) return;
    const s = activeRecipe.sample;
    const joined = (activeRecipe.hasTitle ? [s.title || '', ...s.blocks] : s.blocks).join('\n\n\n');
    const count = Math.max(1, batchCount);
    setBatchContents(Array.from({ length: count }, () => joined));
    setPreviewIndex(0);
  };

  // ── เรนเดอร์ (สร้าง overlay PNG ทุก EP แล้วส่ง backend) ──
  const triggerRender = async () => {
    if (!config.footageFolder) { alert('กรุณาเลือกโฟลเดอร์ footage (วิดีโอพื้นหลัง) ก่อน'); return; }
    if (!config.outputFolder) { alert('กรุณาเลือกโฟลเดอร์ปลายทาง (Output) ก่อน'); return; }

    const renderCount = Math.max(1, Number.isFinite(batchCount) ? batchCount : 1);
    const items: { overlayPng: string; fileNameBase: string }[] = [];
    for (let i = 0; i < renderCount; i++) {
      const finalEls = computeFinalEls(batchContents[i] || '', i);
      const off = document.createElement('canvas');
      renderOverlay(off, activeTemplate, finalEls, {
        colorFilter: config.colorFilter,
        blockMargin,
        logoImg,
        logoPosition: config.logoPosition,
        logoScale: config.logoScale,
      });
      const overlayPng = off.toDataURL('image/png');
      const fileNameBase = activeTemplate.id === 'trader_series'
        ? `${activeCat}_${activeTemplate.id}_ep${epStart + i}`
        : `${activeCat}_${activeTemplate.id}_${i + 1}`;
      items.push({ overlayPng, fileNameBase });
    }

    start({
      footageFolder: config.footageFolder,
      outputFolder: config.outputFolder,
      bgmFile: config.bgmFile,
      bgmVolume: config.bgmVolume / 100,
      durationSec: Number.isFinite(config.durationSec) ? config.durationSec : 15,
      items,
    });
  };

  const recommendedIds = useMemo(() => new Set(BUILT_IN_TEMPLATES.filter(t => cat.recommendedFamilies.includes(t.family)).map(t => t.id)), [cat]);
  const recipes = useMemo(() => getRecipesForCategory(activeCat), [activeCat]);
  const isRendering = status === 'running' || status === 'paused';

  // ── ป้ายขั้นตอน ──
  const Step = ({ n, title, icon }: { n: number; title: string; icon: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 mb-4">
      <span className={`w-7 h-7 shrink-0 rounded-full bg-gradient-to-br ${cat.accentFrom} ${cat.accentTo} text-white text-sm font-black flex items-center justify-center shadow-lg`}>{n}</span>
      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">{icon}{title}</h3>
    </div>
  );

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto">
      {/* ══ แท็บหมวด ══ */}
      <div className="grid grid-cols-3 gap-3">
        {CATEGORIES.map(c => (
          <button
            key={c.id}
            onClick={() => switchCategory(c.id)}
            className={`relative p-4 rounded-2xl border-2 text-center transition-all cursor-pointer active:scale-[0.98] ${
              activeCat === c.id
                ? `border-transparent bg-gradient-to-br ${c.accentFrom} ${c.accentTo} text-white shadow-xl scale-[1.02]`
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-white'
            }`}
          >
            <div className="text-3xl mb-1">{c.emoji}</div>
            <div className="text-sm font-black">{c.name}</div>
          </button>
        ))}
      </div>

      {/* ══ STEP 1: สไตล์คอนเทนต์ (สูตร) / เทมเพลต ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <Step n={1} title={recipes.length ? 'เลือกสไตล์คอนเทนต์ (สูตรเขียน)' : 'เลือกเทมเพลตการวางข้อความ'} icon={<LayoutTemplate className="w-4 h-4 text-cyan-400" />} />
        {recipes.length > 0 ? (
          <>
            <select
              value={activeRecipeId || ''}
              onChange={e => { const r = recipes.find(x => x.id === e.target.value); if (r) applyRecipe(r); }}
              className="w-full p-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 cursor-pointer h-[40px] focus:border-amber-400 focus:ring-1 focus:ring-amber-500/30 outline-none"
            >
              {recipes.map(r => (
                <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
              ))}
            </select>
            {activeRecipe && (
              <p className="text-[11px] text-slate-500 mt-2 leading-snug">{activeRecipe.hook}</p>
            )}
            <div className="mt-3 border-t border-slate-800 pt-3">
              <button onClick={() => setAdvancedLayoutOpen(o => !o)} className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-cyan-300 cursor-pointer">
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${advancedLayoutOpen ? 'rotate-180' : ''}`} /> ปรับแต่งขั้นสูง — เลือกเลย์เอาต์เอง
              </button>
              {advancedLayoutOpen && (
                <div className="mt-2">
                  <select value={activeTemplate.id} onChange={e => { const tpl = getTemplateById(e.target.value); if (tpl) selectTemplate(tpl); }}
                    className="w-full p-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 cursor-pointer h-[40px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 outline-none">
                    {BUILT_IN_TEMPLATES.map(tpl => <option key={tpl.id} value={tpl.id}>{recommendedIds.has(tpl.id) ? '⭐ ' : ''}{tpl.icon} {tpl.name}</option>)}
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1.5 leading-snug">{activeTemplate.desc} • สูตรจะเลือกเลย์เอาต์ที่เหมาะให้อัตโนมัติ — เปลี่ยนเองได้หากต้องการ</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <select
              value={activeTemplate.id}
              onChange={e => { const tpl = getTemplateById(e.target.value); if (tpl) selectTemplate(tpl); }}
              className="w-full p-2.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-200 cursor-pointer h-[40px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-500/30 outline-none"
            >
              {BUILT_IN_TEMPLATES.map(tpl => (
                <option key={tpl.id} value={tpl.id}>{recommendedIds.has(tpl.id) ? '⭐ ' : ''}{tpl.icon} {tpl.name}</option>
              ))}
            </select>
            <div className="text-[11px] text-slate-500 mt-2 leading-snug flex items-start gap-1.5">
              {recommendedIds.has(activeTemplate.id) && (
                <span className="text-amber-400 shrink-0" title="แนะนำสำหรับหมวดนี้"><Star className="w-3.5 h-3.5 fill-amber-400" /></span>
              )}
              <span>{activeTemplate.desc}</span>
            </div>
          </>
        )}
      </div>

      {/* ══ STEP 2: พื้นหลัง & เสียง (จำค่าต่อหมวด) ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <Step n={2} title="พื้นหลัง วิดีโอ & เสียง (ระบบจำค่าให้แต่ละหมวด)" icon={<ImageIcon className="w-4 h-4 text-amber-400" />} />
        <div className="space-y-3">
          {/* footage folder — ปุ่มสำคัญ สีเด่น */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">🎬 โฟลเดอร์ footage (วิดีโอพื้นหลัง) — จำพาธไว้ถาวร {config.footageFolder && <span className="text-emerald-400">✓ เลือกแล้ว</span>}</label>
            <div className="flex gap-2">
              <input type="text" readOnly value={config.footageFolder} placeholder="ยังไม่ได้เลือกโฟลเดอร์..." title={config.footageFolder}
                className="flex-1 p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono truncate" />
              <button onClick={() => pickFolder('footageFolder', 'เลือกโฟลเดอร์วิดีโอพื้นหลัง (footage)')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0">
                <FolderOpen className="w-4 h-4" /> เลือกโฟลเดอร์
              </button>
            </div>
          </div>

          {/* output folder */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">📁 โฟลเดอร์ปลายทาง (Output) {config.outputFolder && <span className="text-emerald-400">✓ เลือกแล้ว</span>}</label>
            <div className="flex gap-2">
              <input type="text" readOnly value={config.outputFolder} placeholder="ยังไม่ได้เลือก..." title={config.outputFolder}
                className="flex-1 p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono truncate" />
              <button onClick={() => pickFolder('outputFolder', 'เลือกโฟลเดอร์บันทึกผลลัพธ์')}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0">
                <Folder className="w-4 h-4 text-cyan-400" /> เลือก
              </button>
              <button onClick={openOutputFolder}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0">
                <FolderOpen className="w-4 h-4 text-amber-400" /> เปิด
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* BGM */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">🎵 เพลงประกอบ (BGM)</label>
              <div className="flex gap-2">
                <button onClick={pickBgm}
                  className="flex-1 px-3 py-2 bg-slate-950/60 border border-dashed border-slate-700 hover:border-amber-400 text-slate-300 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer truncate active:scale-95">
                  <Music className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="truncate">{config.bgmFile ? config.bgmFile.split('/').pop() : 'เลือกไฟล์เพลง...'}</span>
                </button>
                {config.bgmFile && (
                  <button onClick={() => updateConfig({ bgmFile: '' })} className="px-2 text-rose-500 text-xs cursor-pointer">✕</button>
                )}
              </div>
            </div>
            {/* BGM volume */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">🔊 ความดัง BGM ({config.bgmVolume}%)</label>
              <div className="flex items-center h-[38px] px-3 bg-slate-950/50 border border-slate-800 rounded-lg">
                <input type="range" min={1} max={100} value={config.bgmVolume}
                  onChange={e => updateConfig({ bgmVolume: +e.target.value })}
                  className="w-full accent-amber-400 cursor-pointer" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* duration */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">⏱️ ความยาว (วินาที)</label>
              <input type="number" min={3} max={120} value={numOrEmpty(config.durationSec)}
                onChange={e => updateConfig({ durationSec: e.target.valueAsNumber })}
                onBlur={e => updateConfig({ durationSec: Number.isFinite(e.target.valueAsNumber) ? Math.min(120, Math.max(3, e.target.valueAsNumber)) : 15 })}
                className="w-full p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono text-center" />
            </div>
            {/* color filter */}
            <div className="col-span-2 md:col-span-2">
              <label className="text-[11px] font-bold text-slate-400 block mb-1">🎨 โทนสีย้อมวิดีโอ</label>
              <select value={config.colorFilter} onChange={e => updateConfig({ colorFilter: e.target.value })}
                className="w-full p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 h-[34px]">
                {FILTER_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
              </select>
            </div>
            {/* logo */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">🖼️ โลโก้</label>
              <label className="w-full h-[34px] px-2 bg-slate-950/60 border border-dashed border-slate-700 hover:border-cyan-400 text-slate-400 text-[11px] rounded-lg flex items-center justify-center gap-1 cursor-pointer truncate">
                {config.logoImage ? '✅ มีโลโก้' : 'อัพโหลด'}
                <input type="file" accept="image/*" className="hidden" onChange={onLogoUpload} />
              </label>
            </div>
          </div>
          {config.logoImage && (
            <div className="grid grid-cols-2 gap-3">
              <select value={config.logoPosition} onChange={e => updateConfig({ logoPosition: e.target.value })} className="p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                <option value="top-left">โลโก้: บนซ้าย</option><option value="top-right">โลโก้: บนขวา</option>
                <option value="bottom-left">โลโก้: ล่างซ้าย</option><option value="bottom-right">โลโก้: ล่างขวา</option><option value="center">โลโก้: กลาง</option>
              </select>
              <div className="flex gap-2 items-center">
                <select value={config.logoScale} onChange={e => updateConfig({ logoScale: e.target.value })} className="flex-1 p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
                  <option value="small">ขนาดเล็ก</option><option value="medium">กลาง</option><option value="large">ใหญ่</option>
                </select>
                <button onClick={() => updateConfig({ logoImage: '' })} className="px-2 text-rose-500 text-xs cursor-pointer">ลบโลโก้</button>
              </div>
            </div>
          )}

          {/* ข้อความล่างสุดของคลิป (เครดิตเพจ/โปรโมชั่น) */}
          <div className="pt-1 border-t border-slate-800/70">
            <label className="text-[11px] font-bold text-slate-400 block mb-1 mt-2">✨ ข้อความล่างสุดของคลิป — เครดิตเพจ / โปรโมชั่น (แสดงทุกคลิป)</label>
            <input type="text" value={config.footerText} onChange={e => updateConfig({ footerText: e.target.value })}
              placeholder="เช่น ติดตามเพจ ดูดวงกับหมอต้น • ทักไลน์ @duangdee รับส่วนลด 50%"
              className="w-full p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white outline-none focus:border-amber-400" />
            {config.footerText.trim() ? (
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                    <span>ขนาดตัวอักษร footer</span><span className="text-amber-400 font-mono">{config.footerFontSize}px</span>
                  </div>
                  <input type="range" min={16} max={70} step={1} value={config.footerFontSize}
                    onChange={e => updateConfig({ footerFontSize: +e.target.value })} className="w-full accent-amber-400 cursor-pointer" />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">รูปแบบกล่อง</label>
                  <div className="flex gap-1.5 flex-wrap">
                    {FOOTER_STYLES.map(s => (
                      <button key={s.id} onClick={() => updateConfig({ footerStyle: s.id })}
                        className={`px-2.5 py-1 text-[11px] rounded-lg border cursor-pointer ${config.footerStyle === s.id ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-400'}`}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-slate-500 mt-1">เว้นว่างถ้าไม่ต้องการ • พิมพ์แล้วจะมีตัวเลือกขนาด/รูปแบบกล่อง</p>
            )}
          </div>
        </div>
      </div>

      {/* ══ STEP 3: สมอง + AI ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <Step n={3} title="สมอง AI & สร้างเนื้อหา" icon={<BrainIcon className="w-4 h-4 text-violet-400" />} />

        {/* สมอง */}
        <div className="mb-4 p-3 rounded-xl bg-violet-950/20 border border-violet-800/30 space-y-2">
          <label className="text-[11px] font-bold text-violet-300 block">🧠 สมอง/สไตล์ของหมวดนี้ (แก้ได้ตลอด — ระบบจำให้)</label>
          <textarea rows={3} value={config.customBrainText} onChange={e => updateConfig({ customBrainText: e.target.value, brainId: 'custom' })}
            className="w-full p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white leading-relaxed outline-none focus:border-violet-400" />
          <div className="flex flex-wrap gap-2 items-center">
            <select value={config.brainId} onChange={e => applyBrain(e.target.value)} className="p-1.5 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
              <option value="default">⭐ สมองเริ่มต้นของหมวด</option>
              <option value="custom">✏️ กำลังแก้เอง</option>
              {brains.map(b => <option key={b.id} value={b.id}>🧠 {b.name}</option>)}
            </select>
            <input value={newBrainName} onChange={e => setNewBrainName(e.target.value)} placeholder="ตั้งชื่อสมองเพื่อบันทึก..."
              className="flex-1 min-w-[140px] p-1.5 text-[11px] bg-slate-950/80 border border-slate-800 rounded-lg text-white" />
            <button onClick={saveCurrentBrain} className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer active:scale-95">
              <Save className="w-3.5 h-3.5" /> บันทึกสมอง
            </button>
            {config.brainId !== 'default' && config.brainId !== 'custom' && (
              <button onClick={() => deleteBrain(config.brainId)} className="px-2 py-1.5 text-rose-400 hover:text-rose-300 text-[11px] cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
            )}
          </div>
        </div>

        {activeRecipe ? (
          <>
            {/* หัวข้อ (เลือก/พิมพ์/สุ่ม) + โทน */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              <div className="md:col-span-2">
                <label className="text-[11px] text-slate-400 block mb-1">หัวข้อที่จะเขียน — 1 บรรทัด = 1 คลิป (พิมพ์หลายหัวข้อเพื่อทำทีละหลายคลิป)</label>
                <textarea rows={4} value={recipeTopics} onChange={e => setRecipeTopics(e.target.value)}
                  placeholder={'พิมพ์หัวข้อ บรรทัดละ 1 หัวข้อ เช่น\nนิสัยจริงของ 12 ราศี\nเสน่ห์ของแต่ละราศี\nราศีไหนปากร้ายใจดี'}
                  className="w-full p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white outline-none focus:border-amber-400 leading-relaxed" />
                <div className="flex gap-2 mt-1.5 items-center flex-wrap">
                  <select value="" onChange={e => { if (e.target.value) setRecipeTopics(prev => (prev.trim() ? prev.replace(/\n+$/, '') + '\n' : '') + e.target.value); }}
                    className="p-1.5 text-[11px] bg-slate-950 border border-slate-800 rounded-lg text-slate-300 cursor-pointer">
                    <option value="">+ เพิ่มหัวข้อจากคลัง...</option>
                    {activeRecipe.topicPool.map((t, i) => <option key={i} value={t}>{t}</option>)}
                  </select>
                  <button onClick={fillRandomTopics} className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-300 hover:border-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                    <Shuffle className="w-3.5 h-3.5" /> สุ่มจากคลัง
                  </button>
                  <span className="text-[10px] text-amber-400/90 font-mono">{topicLines().length} หัวข้อ</span>
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">โทนการเล่า</label>
                <select value={config.tone} onChange={e => updateConfig({ tone: e.target.value })} className="w-full p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 h-[42px]">
                  {cat.tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
            </div>

            {/* ขนาดตัวอักษรในช่อง (เฉพาะสูตรหลายช่อง) */}
            {activeRecipe.blockCount >= 3 && (
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <label className="text-[11px] text-slate-400">ขนาดตัวอักษรในช่อง:</label>
                <div className="flex gap-1.5">
                  {FONT_PRESETS.map(p => (
                    <button key={p.v} onClick={() => setRecipeFont(p.v)}
                      className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer ${recipeFontMax === p.v ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-amber-400'}`}>
                      {p.label}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-slate-500">ระบบจะคำนวณความยาวข้อความให้พอดีกล่องตามขนาดนี้ตอนเขียนด้วย AI</span>
              </div>
            )}

            {/* จำนวนคลิป (ใช้เมื่อพิมพ์หัวข้อเดียว/ไม่พิมพ์) */}
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <label className="text-[11px] text-slate-400">จำนวนคลิปที่จะสร้าง:</label>
              <input type="number" min={1} max={50} value={numOrEmpty(batchCount)} disabled={topicLines().length > 1}
                onChange={e => updateBatchCount(e.target.valueAsNumber)}
                onBlur={() => { if (!Number.isFinite(batchCount)) updateBatchCount(1); }}
                className="w-16 p-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-center text-amber-400 font-mono disabled:opacity-40" />
              <span className="text-[11px] text-slate-500">คลิป</span>
              {topicLines().length > 1
                ? <span className="text-[10px] text-amber-400/90">→ จะทำ {topicLines().length} คลิป (1 คลิปต่อ 1 หัวข้อที่พิมพ์ไว้)</span>
                : <span className="text-[10px] text-slate-500">หรือพิมพ์หลายหัวข้อด้านบนเพื่อทำทีละหลายคลิปอัตโนมัติ</span>}
            </div>

            {/* ① เขียนสคริปต์ + ใช้ตัวอย่าง */}
            <div className="flex gap-2">
              <button onClick={generateScriptsWithRecipe} disabled={isAiGenerating}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]">
                {isAiGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> กำลังเขียน {aiGenProgress}/{batchCount}...</> : <><Wand2 className="w-5 h-5 text-yellow-300" /> ① เขียนสคริปต์ด้วย AI</>}
              </button>
              <button onClick={loadRecipeSample} disabled={isAiGenerating} title="ดูตัวอย่างสำเร็จรูปทันที ไม่ต้องรอ AI"
                className="px-4 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50">
                <FileText className="w-4 h-4 text-amber-400" /> ใช้ตัวอย่าง
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-snug">เขียนเสร็จแล้วตรวจ/แก้สคริปต์ได้ที่ขั้นตอนถัดไป (พรีวิว) ก่อนกดเรนเดอร์</p>
          </>
        ) : (
          <>
            {/* AI mode */}
            <div className="flex gap-2 p-0.5 bg-slate-950/60 rounded-lg border border-slate-800 mb-3">
              {(['series', 'headlines'] as const).map(m => (
                <button key={m} onClick={() => setAiGenMode(m)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-md cursor-pointer ${aiGenMode === m ? 'bg-cyan-500/15 border border-cyan-400/30 text-cyan-300' : 'text-slate-400 hover:text-white border border-transparent'}`}>
                  {m === 'series' ? '🧠 เจนซีรีส์อัตโนมัติ' : '✍️ กำหนดพาดหัวเอง'}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
              {aiGenMode === 'series' ? (
                <input value={aiTopic} onChange={e => setAiTopic(e.target.value)} placeholder="หัวข้อหลัก เช่น จิตวิทยาการเทรด, ราศีกับความรัก"
                  className="md:col-span-2 p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white outline-none focus:border-cyan-400" />
              ) : (
                <textarea rows={3} value={aiCustomHeadlines} onChange={e => setAiCustomHeadlines(e.target.value)} placeholder="พิมพ์ 1 พาดหัวต่อ 1 บรรทัด..."
                  className="md:col-span-2 p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white outline-none focus:border-cyan-400 leading-relaxed" />
              )}
              <select value={config.tone} onChange={e => updateConfig({ tone: e.target.value })} className="p-2.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-300 h-[42px]">
                {cat.tones.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>

            {aiGenMode === 'series' && (
              <div className="flex gap-3 items-end mb-3">
                <div><label className="text-[11px] text-slate-400 block mb-1">EP เริ่ม</label>
                  <input type="number" value={numOrEmpty(epStart)} onChange={e => setEpStart(e.target.valueAsNumber)} onBlur={() => { if (!Number.isFinite(epStart)) setEpStart(1); }} className="w-20 p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white text-center font-mono" /></div>
                <div><label className="text-[11px] text-slate-400 block mb-1">EP สิ้นสุด</label>
                  <input type="number" value={numOrEmpty(epEnd)} onChange={e => setEpEnd(e.target.valueAsNumber)} onBlur={() => { if (!Number.isFinite(epEnd)) setEpEnd(5); }} className="w-20 p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white text-center font-mono" /></div>
              </div>
            )}

            {/* ปุ่ม AI เด่น */}
            <button onClick={generateContentWithAI} disabled={isAiGenerating}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]">
              {isAiGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> กำลังเจน {aiGenProgress}...</> : <><Sparkles className="w-5 h-5 text-yellow-300" /> ⚡ เจนเนื้อหาด้วย AI</>}
            </button>
          </>
        )}
        {aiGenLog.length > 0 && (
          <div className="mt-2 p-2.5 bg-black/80 border border-slate-800 rounded-lg font-mono text-[10px] text-cyan-400 max-h-24 overflow-y-auto space-y-0.5">
            {aiGenLog.map((l, i) => <p key={i}>{l}</p>)}
          </div>
        )}
      </div>

      {/* ══ STEP 4: พรีวิว & จัดวาง ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Step n={4} title="พรีวิว & จัดวาง (ลากย้ายได้ — ผลลัพธ์ตรงกับที่เห็น)" icon={<Type className="w-4 h-4 text-cyan-400" />} />
          <div className="flex items-center gap-2">
            {batchCount > 1 && (
              <div className="flex items-center gap-1 bg-slate-950/60 p-0.5 rounded-lg border border-slate-800">
                <button onClick={() => setPreviewIndex(p => Math.max(0, p - 1))} disabled={previewIndex === 0} className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer">◄</button>
                <span className="text-[10px] font-mono text-cyan-400 font-bold px-1">{previewIndex + 1}/{batchCount}</span>
                <button onClick={() => setPreviewIndex(p => Math.min(batchCount - 1, p + 1))} disabled={previewIndex === batchCount - 1} className="px-2 py-0.5 text-[10px] text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer">►</button>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <label className="text-[10px] text-slate-500">จำนวนชุด:</label>
              <input type="number" min={1} max={50} value={numOrEmpty(batchCount)}
                onChange={e => updateBatchCount(e.target.valueAsNumber)}
                onBlur={() => { if (!Number.isFinite(batchCount)) updateBatchCount(1); }}
                className="w-12 p-1 text-[11px] bg-slate-950 border border-slate-800 rounded text-center text-amber-400 font-mono" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start mt-2">
          {/* ซ้าย: ควบคุม */}
          <div className="md:col-span-7 space-y-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 block mb-1">✍️ ข้อความตอนที่แสดงอยู่ (ใช้ '---' หรือเว้น 3 บรรทัดเพื่อแยกบล็อก)</label>
              <textarea rows={5} value={batchContents[previewIndex] || ''}
                onChange={e => setBatchContents(prev => { const n = [...prev]; n[previewIndex] = e.target.value; return n; })}
                className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono leading-relaxed outline-none focus:border-cyan-400" />
            </div>

            {activeTemplate.autoStack && (
              <div>
                <div className="flex justify-between text-[11px] font-bold text-slate-400 mb-1">
                  <span>↕️ ระยะห่างระหว่างบล็อก ({blockMargin}px)</span>
                  <button onClick={() => setBlockMargin(16)} className="text-cyan-400 cursor-pointer">รีเซ็ต</button>
                </div>
                <input type="range" min={0} max={80} value={blockMargin} onChange={e => setBlockMargin(+e.target.value)} className="w-full accent-cyan-400 cursor-pointer" />
              </div>
            )}

            {/* แผงปรับ element ที่เลือก */}
            {selectedEl ? (
              <div className="p-4 border border-slate-800 bg-slate-950/70 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">เลเยอร์: {selectedEl.id}</span>
                </div>
                <input value={selectedEl.text} onChange={e => patchSelected({ text: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg text-white text-sm h-10 px-3 outline-none focus:border-cyan-400" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div><label className="text-[10px] text-slate-500 block mb-1">ขนาด</label>
                    <input type="number" value={selectedEl.fontSize} onChange={e => patchSelected({ fontSize: +e.target.value || 20 })} className="w-full bg-slate-900 border border-slate-800 rounded-lg text-white text-center h-9 font-mono text-sm" /></div>
                  <div><label className="text-[10px] text-slate-500 block mb-1">สี</label>
                    <input type="color" value={selectedEl.color} onChange={e => patchSelected({ color: e.target.value })} className="w-full h-9 rounded-lg cursor-pointer bg-transparent" /></div>
                  <div><label className="text-[10px] text-slate-500 block mb-1">ตัวหนา</label>
                    <button onClick={() => patchSelected({ bold: !selectedEl.bold })} className={`w-full h-9 rounded-lg border font-bold ${selectedEl.bold ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>B</button></div>
                  <div><label className="text-[10px] text-slate-500 block mb-1">จัดแนว</label>
                    <div className="flex h-9 rounded-lg border border-slate-800 bg-slate-900 p-0.5">
                      {(['left', 'center', 'right'] as const).map(a => (
                        <button key={a} onClick={() => patchSelected({ textAlign: a })} className={`flex-1 text-[10px] rounded-md ${selectedEl.textAlign === a ? 'bg-cyan-500/10 text-cyan-300' : 'text-slate-400'}`}>{a === 'left' ? 'ซ้าย' : a === 'center' ? 'กลาง' : 'ขวา'}</button>
                      ))}
                    </div></div>
                </div>
                {/* ขนาดกล่อง: กว้าง + สูง */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>ความกว้างกล่อง</span><span className="text-cyan-400 font-mono">{Math.round(selectedEl.width)}%</span>
                    </div>
                    <input type="range" min={10} max={100} step={1} value={Math.round(selectedEl.width)}
                      onChange={e => patchSelected({ width: Math.max(10, Math.min(100, +e.target.value)) })} className="w-full accent-cyan-400 cursor-pointer" />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-500 mb-1">
                      <span>ความสูงกล่อง</span><span className="text-cyan-400 font-mono">{selectedEl.boxHeight ? Math.round(selectedEl.boxHeight) + '%' : 'อัตโนมัติ'}</span>
                    </div>
                    <input type="range" min={0} max={45} step={1} value={Math.round(selectedEl.boxHeight || 0)}
                      onChange={e => { const v = +e.target.value; patchSelected({ boxHeight: v === 0 ? undefined : v }); }} className="w-full accent-cyan-400 cursor-pointer" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => patchSelected({ width: 92, x: Math.max(0, Math.min(8, selectedEl.x)) })}
                    className="flex-1 py-1.5 text-[11px] rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 cursor-pointer">↔ เต็มความกว้าง</button>
                  <button onClick={() => patchSelected({ boxHeight: undefined })}
                    className="flex-1 py-1.5 text-[11px] rounded-lg border border-slate-800 bg-slate-900 text-slate-300 hover:border-cyan-400 hover:text-cyan-300 cursor-pointer">↕ ความสูงอัตโนมัติ</button>
                </div>

                {/* bgBox */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={selectedEl.bgBox} onChange={e => patchSelected({ bgBox: e.target.checked })} className="w-4 h-4 accent-cyan-500" />
                  กล่องพื้นหลังข้อความ
                </label>
                {selectedEl.bgBox && (() => {
                  const { hex, opacity } = parseRgba(selectedEl.bgBoxColor);
                  return (
                    <div className="space-y-3 pt-1">
                      <div className="flex gap-2">
                        {(['full', 'fit', 'line'] as const).map(mode => (
                          <button key={mode} onClick={() => patchSelected({ bgBoxMode: mode })} className={`flex-1 py-1.5 text-[11px] rounded-lg border ${(selectedEl.bgBoxMode || 'full') === mode ? 'bg-cyan-500/10 border-cyan-400 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                            {mode === 'full' ? 'เต็มกล่อง' : mode === 'fit' ? 'พอดีตัวอักษร' : 'แยกบรรทัด'}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><label className="text-[10px] text-slate-500 block mb-1">สีกล่อง</label>
                          <input type="color" value={hex} onChange={e => patchSelected({ bgBoxColor: toRgba(e.target.value, opacity) })} className="w-full h-9 rounded-lg cursor-pointer bg-transparent" /></div>
                        <div><label className="text-[10px] text-slate-500 block mb-1">ความทึบ {opacity}%</label>
                          <input type="range" min={0} max={100} value={opacity} onChange={e => patchSelected({ bgBoxColor: toRgba(hex, +e.target.value) })} className="w-full accent-cyan-400 mt-2.5" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div><label className="text-[10px] text-slate-500 block mb-1 text-center">มุมโค้ง</label>
                          <input type="number" value={selectedEl.bgBoxRadius} onChange={e => patchSelected({ bgBoxRadius: Math.max(0, +e.target.value || 0) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg text-white text-center h-9 font-mono text-xs" /></div>
                        <div><label className="text-[10px] text-slate-500 block mb-1 text-center">Pad X</label>
                          <input type="number" value={selectedEl.bgBoxPaddingX} onChange={e => patchSelected({ bgBoxPaddingX: Math.max(0, +e.target.value || 0) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg text-white text-center h-9 font-mono text-xs" /></div>
                        <div><label className="text-[10px] text-slate-500 block mb-1 text-center">Pad Y</label>
                          <input type="number" value={selectedEl.bgBoxPaddingY} onChange={e => patchSelected({ bgBoxPaddingY: Math.max(0, +e.target.value || 0) })} className="w-full bg-slate-900 border border-slate-800 rounded-lg text-white text-center h-9 font-mono text-xs" /></div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-800 bg-slate-950/30 rounded-xl text-center text-xs text-slate-500">
                💡 คลิกองค์ประกอบบนพรีวิวด้านขวา เพื่อปรับ ฟอนต์ สี ขนาด และกล่องพื้นหลัง
              </div>
            )}
          </div>

          {/* ขวา: พรีวิว */}
          <div className="md:col-span-5 flex flex-col items-center p-3 border border-slate-800 bg-slate-950/40 rounded-xl space-y-2">
            <div className="w-full flex justify-between items-center pb-1">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1"><Maximize2 className="w-3 h-3 text-cyan-400" /> พรีวิว 9:16</span>
              <label className="text-[9px] text-slate-500 cursor-pointer hover:text-cyan-400">
                + คลิปตัวอย่าง
                <input type="file" accept="video/*" className="hidden" onChange={onPreviewClipUpload} />
              </label>
            </div>
            <div className="w-full flex justify-center">
              <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl" style={{ width: 'min(100%, calc(58vh * 9 / 16))', background: 'linear-gradient(145deg, #3b3a5e 0%, #2a3b52 35%, #1f2a44 70%, #141a2e 100%)' }}>
                {!previewClipUrl && (
                  <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 30% 25%, rgba(168,139,250,0.45), transparent 45%), radial-gradient(circle at 75% 80%, rgba(52,211,153,0.35), transparent 45%)' }} />
                )}
                {previewClipUrl && (
                  <video ref={videoRef} src={previewClipUrl} className="absolute inset-0 w-full h-full object-cover" muted loop playsInline autoPlay />
                )}
                {/* canvas เป็นตัวกำหนดขนาด: กว้าง 100% ของกล่อง, สูง auto ตามอัตราส่วนจริง 1080x1920 → ล็อก 9:16 ไม่ยืด */}
                <canvas ref={canvasRef}
                  className="relative block w-full"
                  style={{ height: 'auto', aspectRatio: '9 / 16', cursor: selectedElId ? (isDragging ? 'grabbing' : 'grab') : 'pointer' }}
                  onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp} />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 text-center leading-relaxed">พื้นหลังจริงจะสุ่มจากโฟลเดอร์ footage ตอนเรนเดอร์ • ตำแหน่ง/สี/โลโก้ ตรงกับที่เห็น</p>
          </div>
        </div>
      </div>

      {/* ══ STEP 5: เรนเดอร์ & Log ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <Step n={5} title="เรนเดอร์ & บันทึกลง Finder" icon={<Download className="w-4 h-4 text-emerald-400" />} />

        {/* ปุ่มเรนเดอร์เด่น */}
        {!isRendering ? (
          <button onClick={triggerRender} disabled={!config.footageFolder || !config.outputFolder}
            className="w-full h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-black text-base shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-[0.99]">
            <FileVideo className="w-6 h-6" /> {activeRecipe ? '②' : '⚡'} เรนเดอร์ทั้งหมด {batchCount > 1 ? `(${batchCount} คลิป)` : ''}
          </button>
        ) : (
          <div className="flex gap-2">
            {status === 'paused' ? (
              <button onClick={resume} className="flex-1 h-14 rounded-xl bg-gradient-to-r from-emerald-600 to-green-500 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
                <Play className="w-6 h-6" /> เรนเดอร์ต่อ
              </button>
            ) : (
              <button onClick={pause} className="flex-1 h-14 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-900 font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
                <Pause className="w-6 h-6" /> พัก
              </button>
            )}
            <button onClick={stop} className="px-8 h-14 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white font-black text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]">
              <Square className="w-5 h-5" /> หยุด
            </button>
          </div>
        )}

        {(!config.footageFolder || !config.outputFolder) && (
          <p className="text-[10px] text-amber-500 flex items-center gap-1 justify-center mt-2">
            <AlertCircle className="w-3.5 h-3.5" /> ต้องเลือกโฟลเดอร์ footage และ Output ก่อน (ขั้นตอนที่ 2)
          </p>
        )}

        {/* progress */}
        {(isRendering || progress.total > 0) && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>ความคืบหน้า</span>
              <span className="font-mono text-cyan-400">{progress.current} / {progress.total}</span>
            </div>
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all" style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }} />
            </div>
          </div>
        )}

        {/* Log console */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${status === 'running' ? 'bg-emerald-400 animate-pulse' : status === 'paused' ? 'bg-amber-400' : status === 'error' ? 'bg-rose-500' : 'bg-slate-600'}`} />
              บันทึกการทำงาน (Log) — {status === 'running' ? 'กำลังทำงาน' : status === 'paused' ? 'พักอยู่' : status === 'done' ? 'เสร็จแล้ว' : status === 'error' ? 'มีข้อผิดพลาด' : 'พร้อม'}
            </span>
            <button onClick={() => setShowLog(s => !s)} className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer">
              {showLog ? <><EyeOff className="w-3.5 h-3.5" /> ซ่อน Log</> : <><Eye className="w-3.5 h-3.5" /> แสดง Log</>}
            </button>
          </div>
          {showLog && (
            <div className="p-3 bg-black border border-slate-800 rounded-lg font-mono text-[10px] text-green-400 space-y-0.5 max-h-56 overflow-y-auto leading-relaxed">
              {logs.length === 0 ? <p className="text-slate-600">— ยังไม่มีบันทึก —</p> : logs.map((l, i) => <p key={i}>{l}</p>)}
              <div ref={logEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
