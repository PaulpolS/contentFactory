import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router = Router();

// ----------------------------------------------------------------------------
//  Single Clip Editor backend (พอร์ตจาก SingleClipEditor_FullSpec.md §5)
//  หมายเหตุสถาปัตยกรรม: สเปกเดิมวาง API ไว้ใน Vite middleware แต่ contentFactory
//  มี Express backend แยกอยู่แล้ว จึงพอร์ตมาที่นี่ (mount: /api/clip-editor)
//  ส่วน pick-folder / pick-file / list-folder-videos ใช้ของเดิมใน index.ts ได้เลย
// ----------------------------------------------------------------------------

function getFFmpegPath(): string {
  const customPath = '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
  if (fs.existsSync(customPath)) return customPath;
  const brewPath = '/opt/homebrew/bin/ffmpeg';
  if (fs.existsSync(brewPath)) return brewPath;
  try { return require('ffmpeg-static') || 'ffmpeg'; } catch { return 'ffmpeg'; }
}

function getFFprobePath(): string {
  const customPath = '/opt/homebrew/opt/ffmpeg-full/bin/ffprobe';
  if (fs.existsSync(customPath)) return customPath;
  const brewPath = '/opt/homebrew/bin/ffprobe';
  if (fs.existsSync(brewPath)) return brewPath;
  return 'ffprobe';
}

// python ที่มี whisper ติดตั้งอยู่
// ลำดับแรกใช้ venv เฉพาะของโปรเจกต์ (.venv-whisper) ที่ติดตั้ง openai-whisper ไว้
// (สร้างด้วย: python3.11 -m venv .venv-whisper && .venv-whisper/bin/pip install openai-whisper)
function getPythonPath(): string {
  const repoRoot = path.join(__dirname, '..', '..', '..');
  const candidates = [
    path.join(process.cwd(), '..', '.venv-whisper', 'bin', 'python'),
    path.join(process.cwd(), '.venv-whisper', 'bin', 'python'),
    path.join(repoRoot, '.venv-whisper', 'bin', 'python'),
    '/Library/Frameworks/Python.framework/Versions/3.11/bin/python3',
    '/opt/homebrew/bin/python3.11',
    '/opt/homebrew/bin/python3',
    '/usr/local/bin/python3',
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return 'python3';
}

// หา path ของ scripts/transcribe_clips.py (backend cwd มักเป็น .../backend)
function getTranscribeScriptPath(): string | null {
  const candidates = [
    path.join(process.cwd(), '..', 'scripts', 'transcribe_clips.py'),
    path.join(process.cwd(), 'scripts', 'transcribe_clips.py'),
    path.join(__dirname, '..', '..', '..', 'scripts', 'transcribe_clips.py'),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return p;
  return null;
}

// PATH ที่ inject ให้ทุก spawn (ให้ ffmpeg/ffprobe/frei0r หาเจอ)
const FF_PATH = `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`;

const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];

// escape ทุก argument ที่จะลง shell (ป้องกัน command injection) — สเปก §5.6
const sh = (v: string | number) => `'${String(v).replace(/'/g, `'\\''`)}'`;

// ============================================================================
//  5.5  POST /api/clip-editor/run-bash-script  — รัน bash script + stream (SSE)
//       ใช้โดยปุ่ม "▶ ตัดต่อเลย!" (Jump Cut mode)
// ============================================================================
router.post('/run-bash-script', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

  const send = (o: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(o) + '\n\n'); } catch { /* ignore */ }
    }
  };

  const script: string = (req.body && req.body.script) || '';
  if (!script) { send({ type: 'error', text: 'No script provided' }); res.end(); return; }

  const tmpFile = path.join(os.tmpdir(), `singleclip_render_${Date.now()}.sh`);
  try {
    fs.writeFileSync(tmpFile, script, { mode: 0o755 });
  } catch (e: any) {
    send({ type: 'error', text: 'Failed to write temp file: ' + e.message });
    res.end();
    return;
  }

  const env = { ...process.env, PATH: FF_PATH };
  const proc = spawn('bash', [tmpFile], { stdio: ['ignore', 'pipe', 'pipe'], env });
  let finished = false;
  const cleanup = () => { try { fs.unlinkSync(tmpFile); } catch { /* ignore */ } };

  proc.stdout.on('data', (d: Buffer) =>
    d.toString().split('\n').forEach(l => l.trim() && send({ type: 'log', text: l })));
  proc.stderr.on('data', (d: Buffer) =>
    d.toString().split('\n').forEach(l => l.trim() && send({ type: 'log', text: l })));

  proc.on('close', (code) => {
    if (finished) return; finished = true; cleanup();
    if (code === 0) send({ type: 'done' });
    else send({ type: 'error', text: code != null ? `ffmpeg exited (code ${code}) — ดู log ด้านบน` : 'Process stopped' });
    if (!res.writableEnded) res.end();
  });
  proc.on('error', (err: any) => {
    if (finished) return; finished = true; cleanup();
    send({ type: 'error', text: err.message });
    if (!res.writableEnded) res.end();
  });

  // client ตัดการเชื่อมต่อ (กด ⛔ หยุด) → kill process
  res.on('close', () => { if (!finished) { try { proc.kill('SIGKILL'); } catch { /* ignore */ } cleanup(); } });
});

// ============================================================================
//  5.6  POST /api/clip-editor/build-random-clip-assembly  — สุ่มต่อคลิป (SSE)
//       ใช้โดยปุ่ม "▶ สุ่มต่อคลิปเลย!" (Assembly mode)
// ============================================================================
interface SegmentPlan {
  filename: string;
  key: string;
  start: number;
  duration: number;
  sourceDuration: number;
  fromReuse: boolean;
  outputIndex: number;
  outputFilename: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function sanitizeName(name: string): string {
  const cleaned = String(name || '')
    .replace(/[^a-zA-Z0-9ก-๙_\- ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
  return cleaned || 'random_cut';
}

// อ่าน duration ของไฟล์วิดีโอ พร้อม cache (key=path, ใช้ได้ถ้า mtime+size ตรง)
function probeDurationsCached(
  files: { filePath: string; mtimeMs: number; size: number }[],
): Promise<Record<string, number>> {
  const cachePath = path.join(process.cwd(), '.durations_cache.json');
  let cache: Record<string, { duration: number; mtimeMs: number; size: number }> = {};
  try { cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8')); } catch { cache = {}; }

  const ffprobe = getFFprobePath();
  const env = { ...process.env, PATH: FF_PATH };
  const result: Record<string, number> = {};
  const toProbe: typeof files = [];

  for (const f of files) {
    const c = cache[f.filePath];
    if (c && c.mtimeMs === f.mtimeMs && c.size === f.size && c.duration > 0) {
      result[f.filePath] = c.duration;
    } else {
      toProbe.push(f);
    }
  }

  const probeOne = (f: { filePath: string; mtimeMs: number; size: number }) =>
    new Promise<void>((resolve) => {
      const p = spawn(ffprobe, [
        '-v', 'error',
        '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1',
        f.filePath,
      ], { env });
      let out = '';
      p.stdout.on('data', (d: Buffer) => { out += d.toString(); });
      p.on('close', () => {
        const dur = parseFloat(out.trim());
        const duration = Number.isFinite(dur) && dur > 0 ? dur : 0;
        result[f.filePath] = duration;
        cache[f.filePath] = { duration, mtimeMs: f.mtimeMs, size: f.size };
        resolve();
      });
      p.on('error', () => { result[f.filePath] = 0; resolve(); });
    });

  // concurrency 15
  return (async () => {
    const CONC = 15;
    for (let i = 0; i < toProbe.length; i += CONC) {
      await Promise.all(toProbe.slice(i, i + CONC).map(probeOne));
    }
    try { fs.writeFileSync(cachePath, JSON.stringify(cache)); } catch { /* ignore */ }
    return result;
  })();
}

router.post('/build-random-clip-assembly', async (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

  let finished = false;
  let proc: ReturnType<typeof spawn> | null = null;
  const send = (o: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(o) + '\n\n'); } catch { /* ignore */ }
    }
  };
  const fail = (text: string) => { send({ type: 'error', text }); if (!res.writableEnded) res.end(); finished = true; };

  try {
    const body = req.body || {};
    const sourceFolder: string = body.sourceFolder || '';
    const outputFolder: string = body.outputFolder || '';
    const targetSeconds = clamp(Number(body.targetSeconds) || 45, 1, 3600);
    const outputCount = clamp(Math.floor(Number(body.outputCount) || 0), 0, 1000);
    const width = clamp(Math.floor(Number(body.width) || 1080), 320, 7680);
    const height = clamp(Math.floor(Number(body.height) || 1920), 320, 7680);
    const outputBase = sanitizeName(body.outputName);
    const incomingUsedKeys: string[] = Array.isArray(body.usedKeys) ? body.usedKeys : [];

    if (!sourceFolder || !fs.existsSync(sourceFolder)) return fail('ไม่พบโฟลเดอร์ต้นทาง');
    if (!outputFolder) return fail('ยังไม่ได้เลือกโฟลเดอร์ปลายทาง');
    fs.mkdirSync(outputFolder, { recursive: true });

    send({ type: 'log', text: '📂 กำลังอ่านไฟล์วิดีโอในโฟลเดอร์ต้นทาง...' });

    const fileNames = fs.readdirSync(sourceFolder)
      .filter(f => VIDEO_EXTS.includes(path.extname(f).toLowerCase()));
    if (fileNames.length === 0) return fail('ไม่พบไฟล์วิดีโอในโฟลเดอร์ต้นทาง');

    const clipsRaw = fileNames.map(filename => {
      const filePath = path.join(sourceFolder, filename);
      const st = fs.statSync(filePath);
      return { filename, filePath, key: `${sourceFolder}::${filename}`, mtimeMs: st.mtimeMs, size: st.size };
    });

    send({ type: 'log', text: `🔎 พบ ${clipsRaw.length} คลิป — กำลังอ่านความยาว (ffprobe)...` });
    const durations = await probeDurationsCached(
      clipsRaw.map(c => ({ filePath: c.filePath, mtimeMs: c.mtimeMs, size: c.size })),
    );

    const clips = clipsRaw
      .map(c => ({ ...c, duration: durations[c.filePath] || 0 }))
      .filter(c => c.duration > 0.2);
    if (clips.length === 0) return fail('อ่านความยาวคลิปไม่ได้เลย (ไฟล์อาจเสีย)');

    const allKeys = new Set(clips.map(c => c.key));
    // คงเฉพาะ usedKeys ที่ยังมีไฟล์อยู่จริง
    const carriedUsedKeys = incomingUsedKeys.filter(k => allKeys.has(k));
    const cycleResetAtStart = carriedUsedKeys.length >= clips.length;
    const history = new Set<string>(cycleResetAtStart ? [] : carriedUsedKeys);
    let cycleCompleted = cycleResetAtStart;

    const shuffle = <T,>(arr: T[]): T[] => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    };

    const maxOutputs = outputCount > 0 ? outputCount : Math.max(1, clips.length);
    const stamp = `${Date.now()}`;
    const segments: SegmentPlan[] = [];
    const outputPaths: string[] = [];
    let outputIndex = 0;

    while (outputIndex < maxOutputs) {
      // history เต็มทุกไฟล์แล้ว → จบรอบ
      if (history.size >= clips.length) {
        if (outputCount === 0) break;            // auto mode: หยุดเมื่อใช้ครบ
        history.clear();                          // fixed count: เริ่มรอบใหม่
        cycleCompleted = true;
      }

      let remaining = targetSeconds;
      const jobSegments: SegmentPlan[] = [];

      const addSegment = (clip: typeof clips[number], fromReuse: boolean): boolean => {
        if (remaining <= 0.05) return false;
        const naturalTake = remaining <= 8 ? remaining : 3 + Math.random() * 5;
        const segDuration = Math.min(clip.duration, remaining, Math.max(0.5, naturalTake));
        if (segDuration <= 0.05) return false;
        const start = Math.random() * Math.max(0, clip.duration - segDuration);
        jobSegments.push({
          filename: clip.filename,
          key: clip.key,
          start: parseFloat(start.toFixed(3)),
          duration: parseFloat(segDuration.toFixed(3)),
          sourceDuration: clip.duration,
          fromReuse,
          outputIndex,
          outputFilename: '',
        });
        remaining -= segDuration;
        return true;
      };

      // 1) เติมคลิป "ใหม่" (ยังไม่อยู่ใน history) ก่อน
      const freshClips = shuffle(clips.filter(c => !history.has(c.key)));
      for (const clip of freshClips) {
        if (remaining <= 0.05) break;
        if (addSegment(clip, false)) history.add(clip.key);
      }

      // 2) ถ้ายังไม่ครบเวลา → เติมซ้ำจากคลิปทั้งหมด (fromReuse)
      let guard = 0;
      while (remaining > 0.05 && guard < 2000) {
        guard++;
        const clip = clips[Math.floor(Math.random() * clips.length)];
        addSegment(clip, true);
      }

      if (jobSegments.length === 0 || remaining > 0.25) {
        return fail('คลิปในโฟลเดอร์ไม่พอจะต่อให้ได้ความยาวที่ตั้งไว้ (ลองลดความยาว หรือเพิ่มคลิป)');
      }

      const suffix = maxOutputs === 1 ? '' : `_${String(outputIndex + 1).padStart(2, '0')}`;
      const outputFilename = `${outputBase}_${stamp}${suffix}.mp4`;
      const outputPath = path.join(outputFolder, outputFilename);
      jobSegments.forEach(s => { s.outputFilename = outputFilename; });
      segments.push(...jobSegments);
      outputPaths.push(outputPath);
      outputIndex++;
    }

    const historyKeys = Array.from(history);

    // ส่งแผนให้ UI แสดง
    send({
      type: 'plan',
      outputPaths,
      outputCount: outputPaths.length,
      usedKeys: historyKeys,
      historyKeys,
      cycleReset: cycleResetAtStart,
      clips: segments,
    });
    send({ type: 'log', text: `🧩 วางแผนเสร็จ: สร้าง ${outputPaths.length} ไฟล์ จาก ${segments.length} ท่อนคลิป` });

    // สร้าง bash script: normalize ทุก segment → concat demuxer
    const VF = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p`;
    const lines: string[] = [
      '#!/bin/bash',
      'set -euo pipefail',
      `export PATH=${sh(FF_PATH)}`,
      'TMP_DIR=$(mktemp -d)',
      `trap 'rm -rf "$TMP_DIR"' EXIT`,
    ];

    for (let oi = 0; oi < outputPaths.length; oi++) {
      const segs = segments.filter(s => s.outputIndex === oi);
      const listFile = `$TMP_DIR/list_${oi}.txt`;
      lines.push(`echo "🎬 กำลังสร้างไฟล์ ${oi + 1}/${outputPaths.length} ..."`);
      lines.push(`: > ${listFile}`);
      segs.forEach((s, si) => {
        const segPath = `$TMP_DIR/seg_${oi}_${si}.mp4`;
        const clip = clips.find(c => c.key === s.key)!;
        lines.push(
          `ffmpeg -y -ss ${sh(s.start)} -t ${sh(s.duration)} -i ${sh(clip.filePath)} ` +
          `-map 0:v:0 -an -vf ${sh(VF)} -c:v libx264 -preset veryfast -crf 20 ` +
          `-movflags +faststart ${segPath} </dev/null`,
        );
        lines.push(`echo "file '${segPath.replace(/'/g, `'\\''`)}'" >> ${listFile}`);
      });
      lines.push(`ffmpeg -y -f concat -safe 0 -i ${listFile} -c copy ${sh(outputPaths[oi])} </dev/null`);
      lines.push(`echo "✅ เสร็จ: ${outputPaths[oi].replace(/"/g, '\\"')}"`);
    }
    lines.push('echo "🎉 สร้างครบทุกไฟล์แล้ว"');

    const script = lines.join('\n') + '\n';
    const tmpScript = path.join(os.tmpdir(), `assembly_${Date.now()}.sh`);
    fs.writeFileSync(tmpScript, script, { mode: 0o755 });

    const env = { ...process.env, PATH: FF_PATH };
    proc = spawn('bash', [tmpScript], { stdio: ['ignore', 'pipe', 'pipe'], env });
    const cleanup = () => { try { fs.unlinkSync(tmpScript); } catch { /* ignore */ } };

    proc.stdout?.on('data', (d: Buffer) =>
      d.toString().split('\n').forEach(l => l.trim() && send({ type: 'log', text: l })));
    proc.stderr?.on('data', (d: Buffer) =>
      d.toString().split('\n').forEach(l => l.trim() && send({ type: 'log', text: l })));

    proc.on('close', (code) => {
      if (finished) return; finished = true; cleanup();
      if (code === 0) {
        send({
          type: 'done',
          outputPaths,
          outputCount: outputPaths.length,
          usedKeys: historyKeys,
          historyKeys,
          cycleReset: cycleResetAtStart,
          cycleCompleted,
        });
      } else {
        send({ type: 'error', text: code != null ? `ffmpeg exited (code ${code}) — ดู log ด้านบน` : 'Process stopped' });
      }
      if (!res.writableEnded) res.end();
    });
    proc.on('error', (err: any) => {
      if (finished) return; finished = true; cleanup();
      send({ type: 'error', text: err.message });
      if (!res.writableEnded) res.end();
    });

    res.on('close', () => { if (!finished && proc) { try { proc.kill('SIGKILL'); } catch { /* ignore */ } cleanup(); } });
  } catch (e: any) {
    if (!finished) fail(e?.message || 'เกิดข้อผิดพลาดไม่ทราบสาเหตุ');
  }
});

// ============================================================================
//  POST /api/clip-editor/transcribe-rename  — ถอดเสียงคลิป → ตั้งชื่อไฟล์ (SSE)
//  ใช้ Whisper (รันในเครื่อง) ถอดสิ่งที่พูดในคลิป แล้วเปลี่ยนชื่อไฟล์ต้นฉบับ
//  - ข้ามคลิปที่ไม่มีเสียงอัตโนมัติ
//  - rename แบบกันชนกัน (ไม่ทับไฟล์เดิม) และ log ทุกการเปลี่ยนชื่อ
// ============================================================================

// แปลงข้อความที่ถอดได้ → ชื่อไฟล์ปลอดภัย (รองรับไทย+อังกฤษ)
function makeNameFromText(text: string, maxWords = 12, maxChars = 60): string {
  let cleaned = String(text || '')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[^a-zA-Z0-9ก-๙\s_-]/g, '') // ตัดอักขระที่ใช้ในชื่อไฟล์ไม่ได้/ไม่ต้องการ
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return '';
  const words = cleaned.split(' ');
  if (words.length > 1) cleaned = words.slice(0, maxWords).join(' ');
  if (cleaned.length > maxChars) cleaned = cleaned.slice(0, maxChars).trim();
  return cleaned
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '');
}

router.post('/transcribe-rename', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  if (typeof (res as any).flushHeaders === 'function') (res as any).flushHeaders();

  let finished = false;
  const send = (o: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(o) + '\n\n'); } catch { /* ignore */ }
    }
  };
  const endErr = (text: string) => { send({ type: 'error', text }); if (!res.writableEnded) res.end(); finished = true; };

  const body = req.body || {};
  const folder: string = body.folder || '';
  const model: string = (body.model || 'large-v3-turbo').toString();
  const language: string = (body.language || 'auto').toString();
  const dryRun: boolean = !!body.dryRun;
  const prefix: string = (body.prefix || '').toString();

  if (!folder || !fs.existsSync(folder) || !fs.statSync(folder).isDirectory()) {
    return endErr('ไม่พบโฟลเดอร์ต้นฉบับ');
  }
  const scriptPath = getTranscribeScriptPath();
  if (!scriptPath) return endErr('ไม่พบ scripts/transcribe_clips.py');

  // กันชน: เก็บชื่อที่ "จะใช้" ในรอบนี้ไว้ด้วย (ไฟล์ที่ยังไม่ถูก rename จริงตอน dryRun)
  const reserved = new Set<string>();
  const pickUniqueName = (base: string, ext: string, original: string): string => {
    let candidate = base + ext;
    if (candidate === original) return original; // ชื่อเดิมอยู่แล้ว
    let i = 2;
    while (fs.existsSync(path.join(folder, candidate)) || reserved.has(candidate.toLowerCase())) {
      candidate = `${base}_${i}${ext}`;
      i++;
    }
    return candidate;
  };

  const python = getPythonPath();
  const env = { ...process.env, PATH: FF_PATH };
  send({ type: 'log', text: `🎤 เริ่มถอดเสียง (โมเดล: ${model}, ภาษา: ${language})${dryRun ? ' — โหมดดูตัวอย่าง (ยังไม่เปลี่ยนชื่อจริง)' : ''}` });

  const proc = spawn(python, [scriptPath, folder, model, language], { stdio: ['ignore', 'pipe', 'pipe'], env });

  let renamed = 0, skipped = 0, failed = 0;
  let stdoutBuf = '';

  const handleObj = (obj: any) => {
    if (!obj || typeof obj !== 'object') return;
    switch (obj.type) {
      case 'log':
        send({ type: 'log', text: obj.text || '' });
        break;
      case 'progress':
        send({ type: 'log', text: `🎧 (${obj.index}/${obj.total}) ${obj.file}` });
        break;
      case 'skip':
        skipped++;
        send({ type: 'log', text: `⏭️ ข้าม "${obj.file}" — ${obj.reason === 'no_audio' ? 'คลิปไม่มีเสียง' : obj.reason}` });
        break;
      case 'text': {
        const original: string = obj.file;
        const ext = path.extname(original);
        const base = makeNameFromText(obj.text || '');
        if (!base) {
          failed++;
          send({ type: 'log', text: `⚠️ "${original}" — ถอดเสียงไม่ได้ความ คงชื่อเดิมไว้` });
          break;
        }
        const finalBase = prefix ? `${prefix}${base}` : base;
        const newName = pickUniqueName(finalBase, ext, original);
        if (newName === original) {
          send({ type: 'log', text: `✓ "${original}" — ชื่อเหมาะสมอยู่แล้ว` });
          break;
        }
        reserved.add(newName.toLowerCase());
        if (dryRun) {
          renamed++;
          send({ type: 'rename', file: original, newName, dryRun: true });
          send({ type: 'log', text: `👁️ "${original}"  →  "${newName}"  (ตัวอย่าง)` });
        } else {
          try {
            fs.renameSync(path.join(folder, original), path.join(folder, newName));
            renamed++;
            send({ type: 'rename', file: original, newName, dryRun: false });
            send({ type: 'log', text: `✅ "${original}"  →  "${newName}"` });
          } catch (e: any) {
            failed++;
            send({ type: 'log', text: `❌ เปลี่ยนชื่อ "${original}" ไม่สำเร็จ: ${e.message}` });
          }
        }
        break;
      }
      case 'all_done':
        break;
      case 'error':
        send({ type: 'log', text: `[ERROR] ${obj.text || ''}` });
        break;
    }
  };

  proc.stdout.on('data', (d: Buffer) => {
    stdoutBuf += d.toString();
    const lines = stdoutBuf.split('\n');
    stdoutBuf = lines.pop() || '';
    for (const line of lines) {
      const t = line.trim();
      if (!t) continue;
      try { handleObj(JSON.parse(t)); } catch { send({ type: 'log', text: t }); }
    }
  });
  proc.stderr.on('data', (d: Buffer) =>
    d.toString().split('\n').forEach(l => l.trim() && send({ type: 'log', text: l })));

  proc.on('close', (code) => {
    if (finished) return; finished = true;
    if (stdoutBuf.trim()) { try { handleObj(JSON.parse(stdoutBuf.trim())); } catch { /* ignore */ } }
    if (code === 0) {
      send({ type: 'done', renamed, skipped, failed, dryRun });
      send({ type: 'log', text: `🎉 เสร็จ — ${dryRun ? 'ดูตัวอย่าง' : 'เปลี่ยนชื่อ'} ${renamed} ไฟล์, ข้าม ${skipped}, พลาด ${failed}` });
    } else {
      send({ type: 'error', text: `transcribe process exited (code ${code})` });
    }
    if (!res.writableEnded) res.end();
  });
  proc.on('error', (err: any) => {
    if (finished) return; finished = true;
    send({ type: 'error', text: err.message });
    if (!res.writableEnded) res.end();
  });

  res.on('close', () => { if (!finished) { try { proc.kill('SIGKILL'); } catch { /* ignore */ } } });
});

export default router;
