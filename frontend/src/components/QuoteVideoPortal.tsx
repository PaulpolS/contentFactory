import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Sparkles, Download, FileVideo, Folder, FolderOpen, Music, AlertCircle,
  RefreshCw, Type, Maximize2, Play, Pause, Square, Eye, EyeOff, Save, Brain as BrainIcon,
  LayoutTemplate, Image as ImageIcon, Star, Trash2,
} from 'lucide-react';

import type { CanvasElement, CanvasTemplate, CategoryId, QuoteCategoryConfig, Brain } from './quote/types';
import { BUILT_IN_TEMPLATES, getTemplateById } from './quote/templates';
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

  // ── เทมเพลต + องค์ประกอบ ──
  const [activeTemplate, setActiveTemplate] = useState<CanvasTemplate>(() => getTemplateById(loadCategoryConfig(activeCat).lastTemplateId) || BUILT_IN_TEMPLATES[0]);
  const [elements, setElements] = useState<CanvasElement[]>(() => activeTemplate.elements.map(e => ({ ...e })));
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

  // เปลี่ยนหมวด → โหลด config + เทมเพลตล่าสุดของหมวดนั้น
  const switchCategory = (id: CategoryId) => {
    setActiveCat(id);
    localStorage.setItem('quote_active_category', id);
    const cfg = loadCategoryConfig(id);
    setConfig(cfg);
    const tpl = getTemplateById(cfg.lastTemplateId) || BUILT_IN_TEMPLATES[0];
    setActiveTemplate(tpl);
    setElements(tpl.elements.map(e => ({ ...e })));
    setSelectedElId(null);
    setBatchCount(1);
    setBatchContents(['']);
    setPreviewIndex(0);
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
    const headlineMode = aiGenMode === 'headlines';
    const withContent = applyContentToElements(elements, content, headlineMode);
    return withContent.map(el => el.id === 'title_ep' ? { ...el, text: headlineMode ? '' : `EP.${epStart + idx}` } : el);
  }, [elements, aiGenMode, epStart]);

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

  // ── เรนเดอร์ (สร้าง overlay PNG ทุก EP แล้วส่ง backend) ──
  const triggerRender = async () => {
    if (!config.footageFolder) { alert('กรุณาเลือกโฟลเดอร์ footage (วิดีโอพื้นหลัง) ก่อน'); return; }
    if (!config.outputFolder) { alert('กรุณาเลือกโฟลเดอร์ปลายทาง (Output) ก่อน'); return; }

    const items: { overlayPng: string; fileNameBase: string }[] = [];
    for (let i = 0; i < batchCount; i++) {
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
      durationSec: config.durationSec,
      items,
    });
  };

  const recommendedIds = useMemo(() => new Set(BUILT_IN_TEMPLATES.filter(t => cat.recommendedFamilies.includes(t.family)).map(t => t.id)), [cat]);
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

      {/* ══ STEP 1: เทมเพลต ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <Step n={1} title="เลือกเทมเพลตการวางข้อความ" icon={<LayoutTemplate className="w-4 h-4 text-cyan-400" />} />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {BUILT_IN_TEMPLATES.map(tpl => (
            <button
              key={tpl.id}
              onClick={() => selectTemplate(tpl)}
              className={`relative p-3 rounded-xl border text-left transition-all cursor-pointer active:scale-[0.98] ${
                activeTemplate.id === tpl.id
                  ? 'border-cyan-400 bg-cyan-400/10 ring-1 ring-cyan-500/30 shadow-lg'
                  : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
              }`}
            >
              {recommendedIds.has(tpl.id) && (
                <span className="absolute top-1.5 right-1.5 text-amber-400" title="แนะนำสำหรับหมวดนี้"><Star className="w-3.5 h-3.5 fill-amber-400" /></span>
              )}
              <div className="text-2xl mb-1">{tpl.icon}</div>
              <div className="text-xs font-bold text-slate-200 leading-tight">{tpl.name}</div>
              <div className="text-[10px] text-slate-500 mt-1 leading-snug line-clamp-2">{tpl.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ══ STEP 2: พื้นหลัง & เสียง (จำค่าต่อหมวด) ══ */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-slate-900/40">
        <Step n={2} title="พื้นหลัง วิดีโอ & เสียง (ระบบจำค่าให้แต่ละหมวด)" icon={<ImageIcon className="w-4 h-4 text-amber-400" />} />
        <div className="space-y-3">
          {/* footage folder — ปุ่มสำคัญ สีเด่น */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">🎬 โฟลเดอร์ footage (วิดีโอพื้นหลัง) — จำพาธไว้ถาวร</label>
            <div className="flex gap-2">
              <input readOnly value={config.footageFolder} placeholder="ยังไม่ได้เลือกโฟลเดอร์..."
                className="flex-1 p-2.5 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white font-mono truncate" />
              <button onClick={() => pickFolder('footageFolder', 'เลือกโฟลเดอร์วิดีโอพื้นหลัง (footage)')}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20 active:scale-95 shrink-0">
                <FolderOpen className="w-4 h-4" /> เลือกโฟลเดอร์
              </button>
            </div>
          </div>

          {/* output folder */}
          <div>
            <label className="text-[11px] font-bold text-slate-400 block mb-1">📁 โฟลเดอร์ปลายทาง (Output)</label>
            <div className="flex gap-2">
              <input readOnly value={config.outputFolder} placeholder="ยังไม่ได้เลือก..."
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
              <input type="number" min={3} max={120} value={config.durationSec}
                onChange={e => updateConfig({ durationSec: Math.max(3, +e.target.value || 15) })}
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
              <input type="number" value={epStart} onChange={e => setEpStart(Math.max(1, +e.target.value || 1))} className="w-20 p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white text-center font-mono" /></div>
            <div><label className="text-[11px] text-slate-400 block mb-1">EP สิ้นสุด</label>
              <input type="number" value={epEnd} onChange={e => setEpEnd(Math.max(1, +e.target.value || 5))} className="w-20 p-2 text-xs bg-slate-950/80 border border-slate-800 rounded-lg text-white text-center font-mono" /></div>
          </div>
        )}

        {/* ปุ่ม AI เด่น */}
        <button onClick={generateContentWithAI} disabled={isAiGenerating}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 text-white font-black text-sm shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99]">
          {isAiGenerating ? <><RefreshCw className="w-5 h-5 animate-spin" /> กำลังเจน {aiGenProgress}...</> : <><Sparkles className="w-5 h-5 text-yellow-300" /> ⚡ เจนเนื้อหาด้วย AI</>}
        </button>
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
              <input type="number" min={1} max={50} value={batchCount} onChange={e => updateBatchCount(+e.target.value || 1)}
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
            <FileVideo className="w-6 h-6" /> ⚡ สั่งเรนเดอร์ {batchCount > 1 ? `(${batchCount} คลิป)` : ''}
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
