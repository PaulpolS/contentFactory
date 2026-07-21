import { useState, useRef, useEffect } from 'react';
import {
  Film,
  Shuffle,
  Wand2,
  Sparkles,
  Play,
  Square,
  FolderOpen,
  Music,
  Terminal,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Type,
  Volume2,
} from 'lucide-react';
import {
  generateRelaxingScript,
  THEME_OPTIONS,
  type RelaxingTheme,
  type ScriptLength,
  type SpiceLevel,
} from '../lib/relaxingScript';
import { chatCompletions, getLlmKey } from '../lib/llm';

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

interface ClipResult {
  index: number;
  title: string;
  status: 'pending' | 'rendering' | 'done' | 'error';
  outputPath?: string;
  fileName?: string;
  duration?: number;
  clipsUsed?: number;
  errorMessage?: string;
}

const FONT_OPTIONS = ['Kanit', 'Prompt', 'Mitr', 'Sarabun', 'Itim', 'Mali', 'Chonburi'];

export default function RelaxingClipPortal() {
  // โฟลเดอร์
  const [sourceFolder, setSourceFolder] = useState(() => localStorage.getItem('relax_source') || '');
  const [outputFolder, setOutputFolder] = useState(() => localStorage.getItem('relax_output') || '');

  // ควบคุมบท
  const [theme, setTheme] = useState<RelaxingTheme>('palace_romance');
  const [length, setLength] = useState<ScriptLength>('medium');
  const [spice, setSpice] = useState<SpiceLevel>('medium');
  const [maleName, setMaleName] = useState('');
  const [femaleName, setFemaleName] = useState('');
  const [scriptTitle, setScriptTitle] = useState('');
  const [scriptText, setScriptText] = useState('');
  const [aiBusy, setAiBusy] = useState(false);

  // เสียง & ซับ
  const [voice, setVoice] = useState('Kanya');
  const [rate, setRate] = useState(190);
  const [fontName, setFontName] = useState('Kanit');
  const [fontSize, setFontSize] = useState(22);
  const [primaryColor, setPrimaryColor] = useState('#ffffff');
  const [outlineColor, setOutlineColor] = useState('#000000');
  const [marginV, setMarginV] = useState(150);
  const [burnSubtitles, setBurnSubtitles] = useState(true);

  // เพลงประกอบ
  const [enableBgMusic, setEnableBgMusic] = useState(false);
  const [bgMusicPath, setBgMusicPath] = useState('');
  const [bgMusicVolume, setBgMusicVolume] = useState(12);

  // batch + สถานะ
  const [clipCount, setClipCount] = useState(1);
  const [isRendering, setIsRendering] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [results, setResults] = useState<ClipResult[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const logBoxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { localStorage.setItem('relax_source', sourceFolder); }, [sourceFolder]);
  useEffect(() => { localStorage.setItem('relax_output', outputFolder); }, [outputFolder]);
  useEffect(() => { if (!scriptText) regenerate(); /* บทตั้งต้น */ // eslint-disable-next-line
  }, []);
  useEffect(() => {
    if (logBoxRef.current) logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
  }, [logs]);

  const addLog = (msg: string) => {
    const t = new Date().toLocaleTimeString('th-TH');
    setLogs((prev) => [...prev.slice(-400), `[${t}] ${msg}`]);
  };

  const regenerate = () => {
    const s = generateRelaxingScript({ theme, length, spice, maleName, femaleName });
    setScriptTitle(s.title);
    setScriptText(s.text);
  };

  const generateWithAi = async () => {
    if (!getLlmKey()) {
      addLog('⚠️ ยังไม่ได้ตั้งค่า API Key ของ AI (ไปที่หน้าตั้งค่า) — ใช้ปุ่ม "สุ่มบทใหม่" แทนได้เลย');
      alert('ยังไม่ได้ตั้งค่า API Key ของ AI\nใช้ปุ่ม "สุ่มบทใหม่" (ฟรี ออฟไลน์) แทนได้ครับ');
      return;
    }
    const themeLabel = THEME_OPTIONS.find((t) => t.value === theme)?.label || '';
    const spiceHint = spice === 'medium'
      ? 'โรแมนติกยั่วเย้าเล็กน้อย ตึงเครียดทางอารมณ์ แต่ห้ามมีคำหยาบหรือฉากโจ่งแจ้ง'
      : 'หวานใส สุภาพ';
    const lenHint = length === 'short' ? 'ประมาณ 45 วินาที' : length === 'long' ? 'ประมาณ 90 วินาที' : 'ประมาณ 60 วินาที';
    try {
      setAiBusy(true);
      addLog('✨ ให้ AI แต่งบทใหม่...');
      const resp = await chatCompletions({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'คุณเป็นนักเขียนบทพากย์ละครสั้นแนวตั้งภาษาไทย เขียนบทให้ฟังลื่น เล่าเป็นฉากๆ สำหรับพากย์เสียงเดียว' },
          { role: 'user', content:
            `เขียนบทพากย์ภาษาไทยแนว "${themeLabel}" สำหรับคลิปสั้นแนวตั้ง ${lenHint}\n` +
            `โทน: ${spiceHint}\n` +
            `${maleName ? `ชื่อพระเอก: ${maleName}\n` : ''}${femaleName ? `ชื่อนางเอก: ${femaleName}\n` : ''}` +
            `เขียนเป็นประโยคเล่าเรื่องต่อเนื่อง 8-12 ประโยค แต่ละประโยคขึ้นบรรทัดใหม่ ` +
            `ไม่ต้องมีหัวข้อ ไม่ต้องมีเลขข้อ ไม่ต้องอธิบายอะไรนอกจากตัวบท ให้จบแบบค้างชวนติดตาม`,
          },
        ],
        temperature: 1.0,
      });
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content?.trim();
      if (content) {
        setScriptText(content.replace(/^\s*[-*\d.]+\s*/gm, '').trim());
        setScriptTitle(`${themeLabel} (AI)`);
        addLog('✅ AI แต่งบทเสร็จแล้ว');
      } else {
        throw new Error('AI ไม่ส่งข้อความกลับมา');
      }
    } catch (e: any) {
      addLog(`❌ AI แต่งบทไม่สำเร็จ: ${e.message} — ใช้ "สุ่มบทใหม่" แทนได้`);
    } finally {
      setAiBusy(false);
    }
  };

  const pickFolder = async (setter: (v: string) => void, prompt: string, key: string) => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/pick-folder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success) { setter(data.dir); addLog(`📁 ${key}: ${data.dir}`); }
    } catch (e: any) { addLog(`❌ เลือกโฟลเดอร์ไม่สำเร็จ: ${e.message}`); }
  };

  const pickBgMusic = async () => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/pick-file`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'เลือกไฟล์เพลงประกอบ (.mp3, .wav, .m4a)' }),
      });
      const data = await res.json();
      if (data.success) { setBgMusicPath(data.path || data.file || ''); addLog(`🎵 เพลงประกอบ: ${data.path || data.file}`); }
    } catch (e: any) { addLog(`❌ เลือกไฟล์เพลงไม่สำเร็จ: ${e.message}`); }
  };

  const openOutput = async () => {
    try { await fetch(`${BACKEND_BASE}/api/open-folder?type=${encodeURIComponent(outputFolder)}`); } catch {}
  };

  const renderOne = async (index: number, textForClip: string, titleForClip: string, controller: AbortController) => {
    setResults((prev) => prev.map((r) => (r.index === index ? { ...r, status: 'rendering', title: titleForClip } : r)));
    const res = await fetch(`${BACKEND_BASE}/api/render-relaxing-clip`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        sourceFolder,
        outputFolder,
        scriptText: textForClip,
        voice,
        rate,
        burnSubtitles,
        subtitleStyle: { fontName, fontSize, primaryColor, outlineColor, marginV },
        bgMusicPath: enableBgMusic ? bgMusicPath : '',
        bgMusicVolume: enableBgMusic ? bgMusicVolume / 100 : 0,
        outputName: 'relaxing_clip',
      }),
    });
    const reader = res.body?.getReader();
    if (!reader) throw new Error('เบราว์เซอร์ไม่รองรับ stream');
    const decoder = new TextDecoder();
    let done = false;
    let outcome: ClipResult = { index, title: titleForClip, status: 'error', errorMessage: 'ไม่ทราบสาเหตุ' };
    let buf = '';
    while (!done) {
      const { value, done: dr } = await reader.read();
      done = dr;
      if (!value) continue;
      buf += decoder.decode(value, { stream: true });
      const parts = buf.split('\n');
      buf = parts.pop() || '';
      for (const line of parts) {
        if (!line.startsWith('data: ')) continue;
        try {
          const d = JSON.parse(line.slice(6));
          if (d.type === 'log') addLog(`  [${index + 1}] ${d.text}`);
          else if (d.type === 'error') outcome = { index, title: titleForClip, status: 'error', errorMessage: d.text };
          else if (d.type === 'done') outcome = {
            index, title: titleForClip, status: 'done',
            outputPath: d.outputPath, fileName: d.fileName, duration: d.duration, clipsUsed: d.clipsUsed,
          };
        } catch { /* skip */ }
      }
    }
    setResults((prev) => prev.map((r) => (r.index === index ? outcome : r)));
    return outcome;
  };

  const startRender = async () => {
    if (!sourceFolder) return alert('กรุณาเลือกโฟลเดอร์คลิปฟุตเทจต้นทาง');
    if (!outputFolder) return alert('กรุณาเลือกโฟลเดอร์ปลายทาง');
    if (!scriptText.trim()) return alert('ยังไม่มีบทพากย์ กด "สุ่มบทใหม่" ก่อน');

    const count = Math.max(1, Math.min(50, clipCount));
    const controller = new AbortController();
    abortRef.current = controller;
    setIsRendering(true);
    setResults(Array.from({ length: count }, (_, i) => ({ index: i, title: '', status: 'pending' as const })));
    addLog(`🚀 เริ่มสร้าง ${count} คลิป`);

    try {
      for (let i = 0; i < count; i++) {
        if (controller.signal.aborted) break;
        // คลิปแรกใช้บทปัจจุบัน (ที่อาจแก้เอง) ที่เหลือสุ่มบทใหม่ให้หลากหลาย
        let text = scriptText;
        let title = scriptTitle;
        if (i > 0) {
          const s = generateRelaxingScript({ theme, length, spice, maleName, femaleName });
          text = s.text; title = s.title;
        }
        try {
          const r = await renderOne(i, text, title || `คลิปที่ ${i + 1}`, controller);
          if (r.status === 'done') addLog(`  ✅ คลิปที่ ${i + 1} เสร็จ (${r.duration?.toFixed(1)}s, ${r.clipsUsed} ฟุตเทจ)`);
          else addLog(`  ❌ คลิปที่ ${i + 1}: ${r.errorMessage}`);
        } catch (e: any) {
          if (e.name === 'AbortError') { addLog('🛑 หยุดโดยผู้ใช้'); break; }
          addLog(`  ❌ คลิปที่ ${i + 1}: ${e.message}`);
          setResults((prev) => prev.map((r) => (r.index === i ? { ...r, status: 'error', errorMessage: e.message } : r)));
        }
      }
      if (!controller.signal.aborted) addLog('🎉 สร้างครบทุกคลิปแล้ว!');
    } finally {
      setIsRendering(false);
      abortRef.current = null;
    }
  };

  const stopRender = () => { abortRef.current?.abort(); addLog('🛑 กำลังหยุด...'); };

  const inputCls = 'flex-1 px-4 py-2.5 bg-slate-900/40 border border-slate-800 rounded-lg text-xs text-white outline-none';
  const btnCls = 'px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 rounded-lg font-bold text-xs transition-all flex items-center gap-1 cursor-pointer';
  const labelCls = 'block text-xs font-bold text-slate-400 mb-2';
  const estChars = scriptText.replace(/\s/g, '').length;
  const estSeconds = Math.round(estChars / 8.5); // ประมาณการหยาบๆ

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-5">
      {/* Intro */}
      <div className="rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/30 to-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-500/20 flex items-center justify-center text-2xl">🍿</div>
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              ทำคลิปดูเพลินๆ <span className="text-[10px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full">ละครสั้นแนวตั้ง</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              ปั่นบทละครรักแนวจีนแบบสุ่มไม่ซ้ำ · เสียงพากย์ฟรีในเครื่อง · ซับไตเติ้ลอัตโนมัติ · สุ่มฟุตเทจต่อกันครบนาที (ไม่มีพาดหัว)
            </p>
          </div>
        </div>
      </div>

      {/* 1. โฟลเดอร์ */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><Film className="w-4 h-4 text-rose-400" /> 1 · โฟลเดอร์ฟุตเทจ & ปลายทาง</h3>
        <div>
          <label className={labelCls}>โฟลเดอร์คลิปฟุตเทจต้นทาง (จะสุ่มมาต่อกัน)</label>
          <div className="flex gap-2">
            <input type="text" readOnly value={sourceFolder} placeholder="ยังไม่ได้เลือก..." className={inputCls} />
            <button onClick={() => pickFolder(setSourceFolder, 'เลือกโฟลเดอร์คลิปฟุตเทจ (B-roll)', 'ฟุตเทจ')} className={btnCls}><FolderOpen className="w-4 h-4" /> เลือก</button>
          </div>
        </div>
        <div>
          <label className={labelCls}>โฟลเดอร์ปลายทางเซฟวิดีโอ</label>
          <div className="flex gap-2">
            <input type="text" readOnly value={outputFolder} placeholder="ยังไม่ได้เลือก..." className={inputCls} />
            <button onClick={() => pickFolder(setOutputFolder, 'เลือกโฟลเดอร์ปลายทาง', 'ปลายทาง')} className={btnCls}><FolderOpen className="w-4 h-4" /> เลือก</button>
          </div>
        </div>
      </div>

      {/* 2. บทพากย์ */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><Wand2 className="w-4 h-4 text-rose-400" /> 2 · บทพากย์ (สุ่มสลับไม่ซ้ำ)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className={labelCls}>ธีมเรื่อง</label>
            <select value={theme} onChange={(e) => setTheme(e.target.value as RelaxingTheme)} className={inputCls + ' w-full'}>
              {THEME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>ความยาวบท</label>
            <select value={length} onChange={(e) => setLength(e.target.value as ScriptLength)} className={inputCls + ' w-full'}>
              <option value="short">สั้น (~45s)</option>
              <option value="medium">กลาง (~60s)</option>
              <option value="long">ยาว (~90s)</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>ระดับความหวานเผ็ด</label>
            <select value={spice} onChange={(e) => setSpice(e.target.value as SpiceLevel)} className={inputCls + ' w-full'}>
              <option value="soft">นุ่มนวล หวานใส</option>
              <option value="medium">ยั่วเย้า/ดราม่าตึงๆ</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelCls}>ชื่อ ญ</label>
              <input value={femaleName} onChange={(e) => setFemaleName(e.target.value)} placeholder="สุ่ม" className={inputCls + ' w-full !px-2'} />
            </div>
            <div>
              <label className={labelCls}>ชื่อ ช</label>
              <input value={maleName} onChange={(e) => setMaleName(e.target.value)} placeholder="สุ่ม" className={inputCls + ' w-full !px-2'} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={regenerate} className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all">
            <Shuffle className="w-4 h-4" /> สุ่มบทใหม่
          </button>
          <button onClick={generateWithAi} disabled={aiBusy} className={btnCls + (aiBusy ? ' opacity-60' : '')}>
            {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />} ให้ AI แต่งบท
          </button>
          {scriptTitle && <span className="text-[11px] text-rose-300 self-center font-bold">📖 {scriptTitle}</span>}
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <label className={labelCls + ' !mb-0'}>บทพากย์ (แก้ไขได้)</label>
            <span className="text-[10px] text-slate-500 font-mono">{estChars} ตัวอักษร · ประมาณ {estSeconds}s</span>
          </div>
          <textarea
            value={scriptText}
            onChange={(e) => setScriptText(e.target.value)}
            rows={9}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-800 rounded-xl text-sm text-slate-100 leading-relaxed outline-none focus:border-rose-500/50 resize-y"
            placeholder='กด "สุ่มบทใหม่" เพื่อสร้างบท...'
          />
        </div>
      </div>

      {/* 3. เสียง & ซับ */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><Volume2 className="w-4 h-4 text-rose-400" /> 3 · เสียงพากย์ & ซับไตเติ้ล</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>เสียงพากย์ (ฟรีในเครื่อง)</label>
            <input value={voice} onChange={(e) => setVoice(e.target.value)} className={inputCls + ' w-full'} />
            <p className="text-[10px] text-slate-500 mt-1">ค่าเริ่มต้น Kanya (เสียงไทย macOS)</p>
          </div>
          <div>
            <label className={labelCls}>ความเร็วเสียง: {rate}</label>
            <input type="range" min={140} max={260} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="w-full accent-rose-500 mt-3" />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
              <input type="checkbox" checked={burnSubtitles} onChange={(e) => setBurnSubtitles(e.target.checked)} className="w-4 h-4 accent-rose-500 rounded" />
              <Type className="w-4 h-4" /> เผาซับไตเติ้ลลงคลิป
            </label>
          </div>
        </div>

        {burnSubtitles && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-900/30 p-3 rounded-xl border border-slate-800/60">
            <div>
              <label className={labelCls}>ฟอนต์ซับ</label>
              <select value={fontName} onChange={(e) => setFontName(e.target.value)} className={inputCls + ' w-full'}>
                {FONT_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>ขนาดฟอนต์: {fontSize}</label>
              <input type="range" min={14} max={40} value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-full accent-rose-500 mt-3" />
            </div>
            <div>
              <label className={labelCls}>สีตัวอักษร / ขอบ</label>
              <div className="flex gap-2 items-center">
                <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent" />
                <input type="color" value={outlineColor} onChange={(e) => setOutlineColor(e.target.value)} className="w-9 h-9 rounded cursor-pointer bg-transparent" />
              </div>
            </div>
            <div>
              <label className={labelCls}>ระยะซับจากล่าง: {marginV}</label>
              <input type="range" min={40} max={500} value={marginV} onChange={(e) => setMarginV(Number(e.target.value))} className="w-full accent-rose-500 mt-3" />
            </div>
          </div>
        )}

        {/* เพลงประกอบ */}
        <div className="pt-3 border-t border-slate-800/60">
          <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer mb-2">
            <input type="checkbox" checked={enableBgMusic} onChange={(e) => setEnableBgMusic(e.target.checked)} className="w-4 h-4 accent-rose-500 rounded" />
            <Music className="w-4 h-4 text-pink-400" /> เพลงประกอบฉากหลัง (ไม่บังคับ)
          </label>
          {enableBgMusic && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 flex gap-2">
                <input type="text" readOnly value={bgMusicPath} placeholder="ยังไม่ได้เลือกเพลง..." className={inputCls} />
                <button onClick={pickBgMusic} className={btnCls}><FolderOpen className="w-4 h-4" /> เลือกเพลง</button>
              </div>
              <div>
                <label className={labelCls + ' !mb-1'}>ระดับเสียงเพลง: {bgMusicVolume}%</label>
                <input type="range" min={2} max={60} value={bgMusicVolume} onChange={(e) => setBgMusicVolume(Number(e.target.value))} className="w-full accent-pink-500" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. สร้างคลิป */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5 space-y-4">
        <h3 className="text-sm font-black text-white flex items-center gap-2"><Play className="w-4 h-4 text-rose-400" /> 4 · สร้างคลิป</h3>
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={labelCls}>จำนวนคลิป (แต่ละคลิปสุ่มบทใหม่)</label>
            <input type="number" min={1} max={50} value={clipCount} onChange={(e) => setClipCount(Number(e.target.value))} className={inputCls + ' w-28'} />
          </div>
          {!isRendering ? (
            <button onClick={startRender} className="px-6 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-rose-900/30">
              <Play className="w-4 h-4" /> เริ่มสร้างคลิป
            </button>
          ) : (
            <button onClick={stopRender} className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer transition-all">
              <Square className="w-4 h-4" /> หยุด
            </button>
          )}
          {outputFolder && <button onClick={openOutput} className={btnCls}><FolderOpen className="w-4 h-4" /> เปิดโฟลเดอร์ปลายทาง</button>}
        </div>

        {/* ผลลัพธ์ */}
        {results.length > 0 && (
          <div className="space-y-1.5">
            {results.map((r) => (
              <div key={r.index} className="flex items-center gap-2 text-xs bg-slate-900/40 border border-slate-800/60 rounded-lg px-3 py-2">
                {r.status === 'done' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                {r.status === 'error' && <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />}
                {r.status === 'rendering' && <Loader2 className="w-4 h-4 text-rose-400 animate-spin shrink-0" />}
                {r.status === 'pending' && <div className="w-4 h-4 rounded-full border border-slate-600 shrink-0" />}
                <span className="text-slate-300 font-bold shrink-0">คลิป {r.index + 1}</span>
                <span className="text-slate-500 truncate flex-1">{r.status === 'done' ? r.fileName : r.status === 'error' ? r.errorMessage : (r.title || '...')}</span>
                {r.status === 'done' && <span className="text-emerald-500 font-mono shrink-0">{r.duration?.toFixed(1)}s</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log */}
      <div className="rounded-2xl border border-slate-800 bg-black/40 p-4">
        <h3 className="text-xs font-black text-slate-400 flex items-center gap-2 mb-2"><Terminal className="w-4 h-4" /> Log</h3>
        <div ref={logBoxRef} className="h-40 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-0.5 whitespace-pre-wrap">
          {logs.length === 0 ? <div className="text-slate-600">ยังไม่มี log...</div> : logs.map((l, i) => <div key={i}>{l}</div>)}
        </div>
      </div>
    </div>
  );
}
