import React, { useState, useEffect, useRef } from 'react';
import {
  TEMPLATES,
  DEFAULT_EFFECTS,
  TRANSITION_TYPES,
  buildBashScript,
} from '../utils/ffmpegBuilder';
import type { EffectMap, SingleClipConfig, CutPreview } from '../utils/ffmpegBuilder';
import Card from './ui/Card';
import NumInput from './ui/NumInput';

// เรียก backend เดิม (Express 5005) — ใช้ pattern เดียวกับ portal อื่น
const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';
const API = (p: string) => `${BACKEND_BASE}/api${p}`;

// โฟลเดอร์เพลง BGM ที่ bundle มากับแอป (ผู้ใช้เอาเพลงมาใส่ที่ frontend/public/BG_music)
const bgmModules = import.meta.glob('/public/BG_music/*.{mp3,wav,m4a,aac}', { eager: true });
const BG_MUSIC_OPTIONS = Object.keys(bgmModules).map((p) => p.split('/').pop() || '');
const ABSOLUTE_BGM_DIR =
  '/Users/macos/โปรแกรมทำContent/contentFactory/frontend/public/BG_music';

type RunStatus = 'idle' | 'running' | 'done' | 'error';

interface SSEMessage {
  type: string;
  text?: string;
  [k: string]: unknown;
}

// อ่าน SSE stream (data: {json}) แล้ว callback ทีละ message
async function readSSE(
  res: Response,
  onMessage: (msg: SSEMessage) => void,
): Promise<void> {
  if (!res.body) return;
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split('\n');
    buffer = parts.pop() || '';
    for (const line of parts) {
      const t = line.trim();
      if (!t.startsWith('data:')) continue;
      const payload = t.slice(5).trim();
      if (!payload) continue;
      try { onMessage(JSON.parse(payload)); } catch { /* ignore */ }
    }
  }
}

const SingleClipEditorPortal: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'jumpcut' | 'assembly'>('jumpcut');

  // === Jump Cut state ===
  const [clipPath, setClipPath] = useState('');
  const [outputPath, setOutputPath] = useState('');
  const [s1Start, setS1Start] = useState(0.0);
  const [s1End, setS1End] = useState(8.0);
  const [templateKey, setTemplateKey] = useState(Object.keys(TEMPLATES)[0]);
  const [nCuts, setNCuts] = useState(8);
  const [cutDur, setCutDur] = useState(0.5);
  const [s2Total, setS2Total] = useState(4.0);
  const [bgmPath, setBgmPath] = useState('');
  const [bgmVol, setBgmVol] = useState(0.2);
  const [bgmRamp, setBgmRamp] = useState(0.0);
  const [transDur, setTransDur] = useState(1.0);
  const [transType, setTransType] = useState('fade');
  const [scEffects, setScEffects] = useState<EffectMap>(() => structuredClone(DEFAULT_EFFECTS));
  const [scEffectsS2, setScEffectsS2] = useState<EffectMap>(() => {
    const e = structuredClone(DEFAULT_EFFECTS);
    Object.keys(e).forEach((k) => { e[k].var = false; });
    return e;
  });

  // === Assembly state ===
  const [assemblySourceFolder, setAssemblySourceFolder] = useState(
    () => localStorage.getItem('singleclip_assembly_source') || '',
  );
  const [assemblyOutputFolder, setAssemblyOutputFolder] = useState(
    () => localStorage.getItem('singleclip_assembly_output') || '',
  );
  const [assemblyTargetSeconds, setAssemblyTargetSeconds] = useState(45);
  const [assemblyOutputCount, setAssemblyOutputCount] = useState(0);
  const [assemblyOutputName, setAssemblyOutputName] = useState('random_cut');
  const [assemblyWidth, setAssemblyWidth] = useState(1080);
  const [assemblyHeight, setAssemblyHeight] = useState(1920);
  const [assemblyUsedKeys, setAssemblyUsedKeys] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('singleclip_assembly_used_keys') || '[]'); }
    catch { return []; }
  });
  const [assemblyLastPlan, setAssemblyLastPlan] = useState<any[]>([]);

  // === Run state ===
  const [isRunning, setIsRunning] = useState(false);
  const [runLog, setRunLog] = useState<string[]>([]);
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const abortRef = useRef<(() => void) | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // sync เวลารวม Scene2
  useEffect(() => { setS2Total(parseFloat((nCuts * cutDur).toFixed(2))); }, [nCuts, cutDur]);
  // auto-scroll log
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [runLog]);
  // persist assembly folders
  useEffect(() => { localStorage.setItem('singleclip_assembly_source', assemblySourceFolder); }, [assemblySourceFolder]);
  useEffect(() => { localStorage.setItem('singleclip_assembly_output', assemblyOutputFolder); }, [assemblyOutputFolder]);

  const pushLog = (text: string) =>
    setRunLog((prev) => [...prev, text].slice(-100));

  // ---------- pickers (ใช้ endpoint เดิมของ backend) ----------
  const pickFolder = async (prompt: string): Promise<string | null> => {
    try {
      const res = await fetch(API('/pick-folder'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      return data.success ? data.dir : null;
    } catch { return null; }
  };
  const pickFile = async (prompt: string): Promise<string | null> => {
    try {
      const res = await fetch(API('/pick-file'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      return data.success ? data.file : null;
    } catch { return null; }
  };

  const handleTemplateChange = (key: string) => {
    setTemplateKey(key);
    const t = TEMPLATES[key];
    if (t) { setNCuts(t.n_cuts); setCutDur(t.cut_dur); }
  };

  // ---------- calculateCuts (สเปก §3.7) ----------
  const calculateCuts = (totalClipAssume = 30): CutPreview[] => {
    const tmpl = TEMPLATES[templateKey];
    if (templateKey.includes('Custom') || !tmpl) {
      const sec = totalClipAssume / nCuts;
      return Array.from({ length: nCuts }, (_, i) => ({ ts: i * sec, dur: cutDur }));
    }
    const section = totalClipAssume / nCuts;
    const beats = [0.3, 0.7, 0.4, 0.8, 0.5, 0.6, 0.3, 0.7];
    const durs = tmpl.dynamic
      ? Array.from({ length: nCuts }, (_, i) => beats[i % beats.length])
      : Array.from({ length: nCuts }, () => cutDur);
    const cuts: CutPreview[] = [];
    for (let i = 0; i < nCuts; i++) {
      const di = durs[i];
      const lo = i * section;
      let hi = (i + 1) * section - di;
      if (hi <= lo) hi = lo + 0.01;
      let ts = lo + (hi - lo) / 2;
      ts = Math.max(0, Math.min(ts, totalClipAssume - di));
      cuts.push({ ts, dur: di });
    }
    return cuts;
  };
  const getCutTimelineDuration = () => Math.max(s1End > 0 ? s1End : 30, cutDur, 0.1);

  const makeConfig = (clip: string, output: string): SingleClipConfig => ({
    clipPath: clip,
    outputPath: output,
    scene1Start: s1Start,
    scene1End: s1End,
    cutsPreview: calculateCuts(getCutTimelineDuration()),
    bgmPath: bgmPath || undefined,
    bgmVolStart: bgmVol,
    bgmRampAt: bgmRamp,
    scEffects,
    scEffectsS2,
    transType,
    transDur,
  });

  // ---------- Jump Cut: download .command ----------
  const handleGenerateScript = () => {
    const cfg = makeConfig(clipPath || '$1', outputPath || '$2');
    const script = buildBashScript(cfg);
    const blob = new Blob([script], { type: 'text/x-shellscript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'single_clip_render.command';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ---------- Jump Cut: run ทุกไฟล์ในโฟลเดอร์ ----------
  const handleRun = async () => {
    if (!clipPath || !outputPath) { alert('กรุณาเลือกโฟลเดอร์ต้นฉบับและปลายทางก่อน'); return; }
    setIsRunning(true); setRunStatus('running'); setRunLog([]);
    pushLog('📂 กำลังอ่านไฟล์วิดีโอในโฟลเดอร์...');
    try {
      const listRes = await fetch(API('/list-folder-videos'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder: clipPath }),
      });
      const { files } = await listRes.json();
      if (!files || files.length === 0) { pushLog('[ERROR] ไม่พบไฟล์วิดีโอในโฟลเดอร์'); setRunStatus('error'); setIsRunning(false); return; }

      const scriptParts: string[] = [];
      for (const file of files as string[]) {
        const basename = file.replace(/\.[^.]+$/, '');
        const inFile = `${clipPath}/${file}`;
        const outFile = `${outputPath}/${basename}_output.mp4`;
        const cfg = makeConfig(inFile, outFile);
        let body = buildBashScript(cfg);
        // ตัด shebang + comment บรรทัดแรกออก (รวมเป็นสคริปต์ใหญ่อันเดียว)
        body = body.split('\n').filter((l) => !l.startsWith('#!') && !l.startsWith('set -euo')).join('\n');
        scriptParts.push(`echo "🎬 ${basename} ..."\n${body}`);
      }
      const fullScript = [
        '#!/bin/bash',
        'set -euo pipefail',
        `mkdir -p "${outputPath}"`,
        '',
        ...scriptParts,
        'echo "🎉 ตัดต่อครบทุกไฟล์แล้ว"',
      ].join('\n');

      const controller = new AbortController();
      abortRef.current = () => controller.abort();
      const res = await fetch(API('/clip-editor/run-bash-script'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script: fullScript }),
        signal: controller.signal,
      });
      await readSSE(res, (msg) => {
        if (msg.type === 'log') pushLog(msg.text || '');
        else if (msg.type === 'done') { setRunStatus('done'); pushLog('✅ เสร็จเรียบร้อย'); }
        else if (msg.type === 'error') { setRunStatus('error'); pushLog('[ERROR] ' + (msg.text || '')); }
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') pushLog('⛔ หยุดแล้ว');
      else { pushLog('[ERROR] ' + (e?.message || e)); setRunStatus('error'); }
    } finally {
      setIsRunning(false); abortRef.current = null;
    }
  };

  // ---------- Assembly: สุ่มต่อคลิป ----------
  const handleRunAssembly = async () => {
    if (!assemblySourceFolder || !assemblyOutputFolder) { alert('กรุณาเลือกโฟลเดอร์ต้นทางและปลายทางก่อน'); return; }
    setIsRunning(true); setRunStatus('running'); setRunLog([]);
    try {
      const controller = new AbortController();
      abortRef.current = () => controller.abort();
      const res = await fetch(API('/clip-editor/build-random-clip-assembly'), {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceFolder: assemblySourceFolder,
          outputFolder: assemblyOutputFolder,
          targetSeconds: assemblyTargetSeconds,
          outputCount: assemblyOutputCount,
          outputName: assemblyOutputName,
          width: assemblyWidth,
          height: assemblyHeight,
          usedKeys: assemblyUsedKeys,
        }),
        signal: controller.signal,
      });
      await readSSE(res, (msg) => {
        if (msg.type === 'log') pushLog(msg.text || '');
        else if (msg.type === 'plan') {
          setAssemblyLastPlan((msg.clips as any[]) || []);
          pushLog(`🧩 แผน: ${(msg.outputCount as number) || 0} ไฟล์ จาก ${((msg.clips as any[]) || []).length} ท่อน`);
        } else if (msg.type === 'done') {
          const keys = (msg.historyKeys as string[]) || (msg.usedKeys as string[]) || [];
          setAssemblyUsedKeys(keys);
          localStorage.setItem('singleclip_assembly_used_keys', JSON.stringify(keys));
          setRunStatus('done');
          ((msg.outputPaths as string[]) || []).forEach((p) => pushLog('📄 ' + p));
          pushLog('✅ เสร็จเรียบร้อย');
        } else if (msg.type === 'error') { setRunStatus('error'); pushLog('[ERROR] ' + (msg.text || '')); }
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') pushLog('⛔ หยุดแล้ว');
      else { pushLog('[ERROR] ' + (e?.message || e)); setRunStatus('error'); }
    } finally {
      setIsRunning(false); abortRef.current = null;
    }
  };

  const handleStop = () => { abortRef.current?.(); setRunStatus('idle'); };

  const clearAssemblyHistory = () => {
    if (!confirm('ล้างประวัติคลิปที่เคยถูกสุ่มใช้แล้ว? (รอบถัดไปจะเริ่มสุ่มใหม่ทั้งหมด)')) return;
    setAssemblyUsedKeys([]);
    localStorage.removeItem('singleclip_assembly_used_keys');
  };

  // ---------- BGM dropdown ----------
  const onBgmSelect = async (val: string) => {
    if (val === 'custom') {
      const f = await pickFile('เลือกไฟล์เพลง BGM');
      if (f) setBgmPath(f);
    } else { setBgmPath(val); }
  };

  // ---------- effect toggle UI ----------
  const renderEffects = (effects: EffectMap, setEffects: (e: EffectMap) => void) => (
    <div className="grid grid-cols-2 gap-1.5">
      {Object.entries(effects).map(([key, st]) => (
        <label key={key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-800/60">
          <input
            type="checkbox"
            checked={st.var}
            onChange={(e) => setEffects({ ...effects, [key]: { ...st, var: e.target.checked } })}
          />
          <span>{st.label}</span>
        </label>
      ))}
    </div>
  );

  const inputCls = 'w-full rounded-lg border border-zinc-700 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-indigo-500';

  return (
    <div className="space-y-4 p-1">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-zinc-100">🎬 ตัด/สุ่มต่อคลิป (Single Clip Editor)</h2>
        <div className="flex gap-2">
          {activeMode === 'jumpcut' && (
            <button onClick={handleGenerateScript} disabled={isRunning}
              className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700 disabled:opacity-50">
              💾 สร้างสคริปต์ .command
            </button>
          )}
          {!isRunning ? (
            <button onClick={activeMode === 'jumpcut' ? handleRun : handleRunAssembly}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
              {activeMode === 'jumpcut' ? '▶ ตัดต่อเลย!' : '▶ สุ่มต่อคลิปเลย!'}
            </button>
          ) : (
            <button onClick={handleStop}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-500">
              ⛔ หยุด
            </button>
          )}
        </div>
      </div>

      {/* Mode switcher */}
      <div className="grid grid-cols-2 gap-3">
        {([['jumpcut', '✂️ Jump Cut เดิม', 'ตัดทุกคลิปในโฟลเดอร์ด้วยสูตร Scene1+Scene2'],
          ['assembly', '🎲 สุ่มต่อคลิปตามเวลา', 'สุ่มหยิบคลิปไม่ซ้ำมาต่อให้ได้ความยาวที่กำหนด']] as const)
          .map(([mode, title, desc]) => (
            <button key={mode} onClick={() => setActiveMode(mode)}
              className={`rounded-xl border p-3 text-left transition ${activeMode === mode
                ? 'border-indigo-500 bg-indigo-500/10' : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-700'}`}>
              <div className="text-sm font-bold text-zinc-100">{title}</div>
              <div className="text-xs text-zinc-400">{desc}</div>
            </button>
          ))}
      </div>

      {/* ===== JUMP CUT MODE ===== */}
      {activeMode === 'jumpcut' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* ซ้าย */}
          <div className="space-y-4">
            <Card title="📂 เลือกไฟล์ต้นฉบับ">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button onClick={async () => { const d = await pickFolder('เลือกโฟลเดอร์ต้นฉบับ'); if (d) setClipPath(d); }}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">📁 ต้นฉบับ</button>
                  <input className={inputCls} value={clipPath} onChange={(e) => setClipPath(e.target.value)} placeholder="โฟลเดอร์ที่มีคลิปต้นฉบับ" />
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { const d = await pickFolder('เลือกโฟลเดอร์ปลายทาง'); if (d) setOutputPath(d); }}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">📁 ปลายทาง</button>
                  <input className={inputCls} value={outputPath} onChange={(e) => setOutputPath(e.target.value)} placeholder="โฟลเดอร์เซฟไฟล์ผลลัพธ์" />
                </div>
              </div>
            </Card>

            <Card title="🎬 Scene 1 (คลิปเปิดแบบยาว)">
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="เริ่ม (วิ)" value={s1Start} step={0.5} min={0} onChange={setS1Start} />
                <NumInput label="จบ (วิ)" value={s1End} step={0.5} min={0} onChange={setS1End} />
              </div>
              <div className="mt-3">
                <div className="mb-1 text-xs font-medium text-zinc-400">⚡ Effects (Scene 1)</div>
                {renderEffects(scEffects, setScEffects)}
              </div>
            </Card>

            <Card title="🎵 BGM (เพลงประกอบ)">
              <div className="space-y-2">
                <select className={inputCls} value={BG_MUSIC_OPTIONS.includes(bgmPath.split('/').pop() || '') ? bgmPath : (bgmPath ? 'custom' : '')}
                  onChange={(e) => onBgmSelect(e.target.value)}>
                  <option value="">— ไม่ใช้เพลง —</option>
                  {BG_MUSIC_OPTIONS.map((name) => (
                    <option key={name} value={`${ABSOLUTE_BGM_DIR}/${name}`}>{name}</option>
                  ))}
                  <option value="custom">📁 เลือกไฟล์เพลงเอง...</option>
                </select>
                {bgmPath && <div className="truncate text-xs text-zinc-500">🎵 {bgmPath}</div>}
                <div className="grid grid-cols-2 gap-3">
                  <NumInput label="ความดัง (0-1)" value={bgmVol} step={0.05} min={0} max={1} onChange={setBgmVol} />
                  <NumInput label="Ramp Up (วิ)" value={bgmRamp} step={0.5} min={0} onChange={setBgmRamp} />
                </div>
              </div>
            </Card>
          </div>

          {/* ขวา */}
          <div className="space-y-4">
            <Card title="✂️ Scene 2 (Jump Cuts)">
              <div className="space-y-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-400">Template</span>
                  <select className={inputCls} value={templateKey} onChange={(e) => handleTemplateChange(e.target.value)}>
                    {Object.keys(TEMPLATES).map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <NumInput label="จำนวน Cuts" value={nCuts} step={1} min={1} max={50} onChange={setNCuts} />
                  <NumInput label="ต่อ Cut (วิ)" value={cutDur} step={0.1} min={0.1} onChange={setCutDur} />
                  <NumInput label="รวม (วิ)" value={s2Total} readOnly onChange={() => {}} />
                </div>
                <div>
                  <div className="mb-1 text-xs font-medium text-zinc-400">⚡ Effects (Scene 2)</div>
                  {renderEffects(scEffectsS2, setScEffectsS2)}
                </div>
              </div>
            </Card>

            <Card title="✨ Transition (เชื่อม Scene 1 → 2)">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-zinc-400">Type</span>
                  <select className={inputCls} value={transType} onChange={(e) => setTransType(e.target.value)}>
                    {TRANSITION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <NumInput label="Duration (วิ)" value={transDur} step={0.1} min={0} onChange={setTransDur} />
              </div>
            </Card>

            <div className="rounded-lg border border-yellow-600/40 bg-yellow-500/10 p-3 text-xs text-yellow-200/90">
              💡 ปุ่ม "ตัดต่อเลย!" จะตัด <b>ทุกไฟล์</b> ในโฟลเดอร์ต้นฉบับ แล้วเซฟเป็น <code>ชื่อไฟล์_output.mp4</code> ในโฟลเดอร์ปลายทาง
            </div>
          </div>
        </div>
      )}

      {/* ===== ASSEMBLY MODE ===== */}
      {activeMode === 'assembly' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Card title="📂 โฟลเดอร์">
              <div className="space-y-2">
                <div className="flex gap-2">
                  <button onClick={async () => { const d = await pickFolder('เลือกโฟลเดอร์ต้นทาง'); if (d) setAssemblySourceFolder(d); }}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">📁 ต้นทาง</button>
                  <input className={inputCls} value={assemblySourceFolder} onChange={(e) => setAssemblySourceFolder(e.target.value)} placeholder="โฟลเดอร์ที่มีคลิปดิบ" />
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => { const d = await pickFolder('เลือกโฟลเดอร์ปลายทาง'); if (d) setAssemblyOutputFolder(d); }}
                    className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm hover:bg-zinc-700">📁 ปลายทาง</button>
                  <input className={inputCls} value={assemblyOutputFolder} onChange={(e) => setAssemblyOutputFolder(e.target.value)} placeholder="โฟลเดอร์เซฟผลลัพธ์" />
                </div>
              </div>
            </Card>

            <Card title="⏱️ ตั้งค่า">
              <div className="grid grid-cols-2 gap-3">
                <NumInput label="ความยาว/ไฟล์ (วิ)" value={assemblyTargetSeconds} step={1} min={1} max={3600} onChange={setAssemblyTargetSeconds} />
                <NumInput label="จำนวน Output (0=อัตโนมัติ)" value={assemblyOutputCount} step={1} min={0} max={1000} onChange={setAssemblyOutputCount} />
                <NumInput label="กว้าง (px)" value={assemblyWidth} step={10} min={320} max={7680} onChange={setAssemblyWidth} />
                <NumInput label="สูง (px)" value={assemblyHeight} step={10} min={320} max={7680} onChange={setAssemblyHeight} />
                <label className="col-span-2 block">
                  <span className="mb-1 block text-xs font-medium text-zinc-400">ชื่อไฟล์ผลลัพธ์</span>
                  <input className={inputCls} value={assemblyOutputName} onChange={(e) => setAssemblyOutputName(e.target.value)} placeholder="random_cut" />
                </label>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-xs text-zinc-500">เคยใช้คลิปไปแล้ว {assemblyUsedKeys.length} ชิ้น</span>
                <button onClick={clearAssemblyHistory}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700">♻️ ล้างประวัติ</button>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <Card title="🧩 แผนคลิปที่สุ่มล่าสุด">
              {assemblyLastPlan.length === 0 ? (
                <div className="text-xs text-zinc-500">ยังไม่มีแผน — กด "สุ่มต่อคลิปเลย!" เพื่อเริ่ม</div>
              ) : (
                <div className="max-h-72 space-y-1 overflow-y-auto text-xs">
                  {assemblyLastPlan.map((c, i) => (
                    <div key={i} className="flex justify-between rounded bg-zinc-800/50 px-2 py-1">
                      <span className="truncate text-zinc-300">{c.fromReuse ? '🔁' : '🆕'} {c.filename}</span>
                      <span className="shrink-0 text-zinc-500">@{Number(c.start).toFixed(1)}s · {Number(c.duration).toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <div className="rounded-lg border border-yellow-600/40 bg-yellow-500/10 p-3 text-xs text-yellow-200/90">
              💡 ระบบจะใช้คลิป "ใหม่" ให้ครบทุกไฟล์ก่อน (กันซ้ำข้ามรอบ) เมื่อครบจะเริ่มรอบใหม่ — กด "ล้างประวัติ" เพื่อรีเซ็ต
            </div>
          </div>
        </div>
      )}

      {/* ===== LOG PANEL ===== */}
      <Card title="📋 Log Output" className="!bg-black/80">
        <div className="h-64 overflow-y-auto rounded bg-black p-3 font-mono text-xs leading-relaxed text-green-400">
          {runLog.length === 0 ? <span className="text-zinc-600">— ยังไม่มี log —</span>
            : runLog.map((l, i) => (
              <div key={i} className={l.startsWith('[ERROR]') ? 'text-red-400' : ''}>{l}</div>
            ))}
          <div ref={logEndRef} />
        </div>
        <div className="mt-2 text-xs text-zinc-500">
          สถานะ: {runStatus === 'running' ? '⏳ กำลังทำงาน' : runStatus === 'done' ? '✅ เสร็จ' : runStatus === 'error' ? '❌ ผิดพลาด' : '— ว่าง —'}
        </div>
      </Card>
    </div>
  );
};

export default SingleClipEditorPortal;
