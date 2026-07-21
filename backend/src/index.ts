import express from 'express';
import os from 'os';

import cors from 'cors';
import dotenv from 'dotenv';
import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import vaultRouter from './routes/vault';
import orchestratorRouter from './routes/orchestrator';
import clipEditorRouter from './routes/clipEditor';

// Load optional environment variables from .env
dotenv.config();

const app = express();

// Enable basic middleware
app.use(cors());
app.use(express.json({ limit: '200mb' }));

// Mount routers
app.use('/api/vault', vaultRouter);
app.use('/api/orchestrator', orchestratorRouter);
app.use('/api/clip-editor', clipEditorRouter);

// === Restored Visual Footage Presets API Endpoints ===
app.post('/api/save-video', (req, res) => {
  const urlParams = new URLSearchParams(req.url?.split('?')[1] || '');
  const exportPath = urlParams.get('path');
  const filename = urlParams.get('filename');

  if (!exportPath || !filename) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: "Missing path or filename" }));
    return;
  }

  try {
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, { recursive: true });
    }
    const targetFile = path.join(exportPath, filename);
    const fileStream = fs.createWriteStream(targetFile);
    req.pipe(fileStream);

    fileStream.on('finish', () => {
      res.json({ success: true, filePath: targetFile });
    });

    fileStream.on('error', (err: any) => {
      res.status(500).json({ error: err.message });
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/pick-folder', (req, res) => {
  let prompt = 'เลือกโฟลเดอร์สำหรับเก็บรูป Footage';
  if (req.body && req.body.prompt) prompt = req.body.prompt;
  const safePrompt = prompt.replace(/'/g, '’');
  try {
    const result = execSync(
      `osascript -e 'POSIX path of (choose folder with prompt "${safePrompt}")'`,
      { encoding: 'utf-8', timeout: 60000 }
    ).trim().replace(/\/$/, '');
    res.json({ success: true, dir: result });
  } catch (err) {
    res.json({ success: false, cancelled: true });
  }
});

// เปิดโฟลเดอร์/ไฟล์ใน Finder (ใช้ร่วมกันหลายพอร์ทัล)
app.get('/api/open-folder', (req, res) => {
  const target = String((req.query as any).type || (req.query as any).path || '').trim();
  if (!target || !fs.existsSync(target)) {
    return res.json({ success: false, error: 'ไม่พบโฟลเดอร์' });
  }
  try {
    execSync(`open ${JSON.stringify(target)}`, { timeout: 8000 });
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// === Generic key-value app-data store (ใช้เก็บคลังสมอง/brains และข้อมูลแอปอื่นๆ) ===
// เก็บเป็นไฟล์ JSON แยกตาม key ใน public/app_data เพื่อให้สอดคล้องกับ cache อื่นๆ ของระบบ
const APP_DATA_DIR = path.resolve(__dirname, '../../public/app_data');

const appDataFilePath = (key: string): string => {
  // sanitize key กัน path traversal — อนุญาตเฉพาะ ตัวอักษร/ตัวเลข/ขีด
  const safeKey = String(key).replace(/[^A-Za-z0-9_-]/g, '');
  return path.join(APP_DATA_DIR, `${safeKey}.json`);
};

// โหลดข้อมูลตาม key — ถ้ายังไม่เคยบันทึกจะคืน [] (ฝั่ง frontend เช็ค data.length)
app.get('/api/get-app-data', (req, res) => {
  const key = String((req.query as any).key || '').trim();
  if (!key) return res.status(400).json({ error: 'Missing key' });
  try {
    const filePath = appDataFilePath(key);
    if (!fs.existsSync(filePath)) {
      return res.json([]);
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    let parsed: any = [];
    try { parsed = JSON.parse(raw); } catch { parsed = []; }
    res.json(parsed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// บันทึกข้อมูลตาม key — body: { key, data }
app.post('/api/save-app-data', (req, res) => {
  const { key, data } = req.body || {};
  if (!key) return res.status(400).json({ error: 'Missing key' });
  try {
    if (!fs.existsSync(APP_DATA_DIR)) {
      fs.mkdirSync(APP_DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(appDataFilePath(key), JSON.stringify(data ?? [], null, 2), 'utf8');
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// === Serve ไฟล์รูป/วิดีโอ จาก absolute path บนเครื่อง (พรีวิวคลิป/รูปที่เรนเดอร์แล้ว) ===
// รองรับ HTTP Range อัตโนมัติผ่าน res.sendFile เพื่อให้ <video> เล่น/seek ได้
app.get('/api/local-stock-image', (req, res) => {
  const target = String((req.query as any).path || '').trim();
  if (!target) return res.status(400).json({ error: 'Missing path' });
  try {
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      return res.status(404).json({ error: 'ไม่พบไฟล์' });
    }
    res.sendFile(path.resolve(target), (err: any) => {
      if (err && !res.headersSent) {
        res.status(500).json({ error: err.message });
      }
    });
  } catch (err: any) {
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

app.post('/api/find-local-folder', (req, res) => {
  const { folderName, fileSignatures } = req.body;
  if (!folderName) {
    return res.status(400).json({ success: false, error: 'Folder name is required' });
  }

  const home = os.homedir();
  const searchRoots = [
    path.resolve(__dirname, '../../..'),
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Downloads')
  ];

  const findFolder = (dir: string, targetName: string, depth = 0): string[] => {
    if (depth > 3) return [];
    const results: string[] = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === 'Library') continue;
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.lstatSync(fullPath);
          if (stat.isSymbolicLink()) continue;
          if (stat.isDirectory()) {
            if (item.toLowerCase() === targetName.toLowerCase()) {
              results.push(fullPath);
            } else {
              results.push(...findFolder(fullPath, targetName, depth + 1));
            }
          }
        } catch {}
      }
    } catch {}
    return results;
  };

  const matchedPaths: string[] = [];
  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      matchedPaths.push(...findFolder(root, folderName));
    }
  }

  const uniquePaths = Array.from(new Set(matchedPaths));

  if (uniquePaths.length === 0) {
    return res.json({ success: false, error: 'ไม่พบโฟลเดอร์นี้ในไดเรกทอรีมาตรฐาน' });
  }

  if (uniquePaths.length === 1) {
    return res.json({ success: true, path: uniquePaths[0] });
  }

  if (fileSignatures && fileSignatures.length > 0) {
    for (const p of uniquePaths) {
      try {
        const files = fs.readdirSync(p);
        let matchCount = 0;
        for (const sig of fileSignatures) {
          if (files.includes(sig.name)) {
            const sigPath = path.join(p, sig.name);
            const stat = fs.lstatSync(sigPath);
            if (stat.isSymbolicLink()) continue;
            const fileStat = fs.statSync(sigPath);
            if (fileStat.size === sig.size) {
              matchCount++;
            }
          }
        }
        if (matchCount === fileSignatures.length) {
          return res.json({ success: true, path: p });
        }
      } catch {}
    }
  }

  res.json({ success: true, path: uniquePaths[0] });
});

app.post('/api/find-local-file', (req, res) => {
  const { fileName, fileSize } = req.body;
  if (!fileName) {
    return res.status(400).json({ success: false, error: 'File name is required' });
  }

  const home = os.homedir();
  const searchRoots = [
    path.resolve(__dirname, '../../..'),
    path.join(home, 'Desktop'),
    path.join(home, 'Documents'),
    path.join(home, 'Downloads')
  ];

  const findFile = (dir: string, targetName: string, fileSize?: number, depth = 0): string[] => {
    if (depth > 3) return [];
    const results: string[] = [];
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        if (item.startsWith('.') || item === 'node_modules' || item === 'Library') continue;
        const fullPath = path.join(dir, item);
        try {
          const stat = fs.lstatSync(fullPath);
          if (stat.isSymbolicLink()) continue;
          if (stat.isDirectory()) {
            results.push(...findFile(fullPath, targetName, fileSize, depth + 1));
          } else if (stat.isFile()) {
            if (item.toLowerCase() === targetName.toLowerCase()) {
              if (fileSize === undefined || stat.size === fileSize) {
                results.push(fullPath);
              }
            }
          }
        } catch {}
      }
    } catch {}
    return results;
  };

  const matchedPaths: string[] = [];
  for (const root of searchRoots) {
    if (fs.existsSync(root)) {
      matchedPaths.push(...findFile(root, fileName, fileSize));
    }
  }

  const uniquePaths = Array.from(new Set(matchedPaths));
  if (uniquePaths.length === 0) {
    return res.json({ success: false, error: 'ไม่พบไฟล์นี้ในไดเรกทอรีมาตรฐาน' });
  }

  res.json({ success: true, path: uniquePaths[0] });
});

app.post('/api/list-footage-folders', (req, res) => {
  const { parentFolder } = req.body;
  if (!parentFolder || !fs.existsSync(parentFolder)) {
    return res.json({ success: false, error: 'ไม่พบโฟลเดอร์', folders: [] });
  }

  try {
    const items = fs.readdirSync(parentFolder);
    const folders = [];
    for (const item of items) {
      const fullPath = path.join(parentFolder, item);
      if (fs.statSync(fullPath).isDirectory() && !item.startsWith('.')) {
        let imageCount = 0;
        try {
          const files = fs.readdirSync(fullPath);
          imageCount = files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f)).length;
        } catch {}
        folders.push({
          name: item,
          path: fullPath,
          imageCount
        });
      }
    }
    res.json({ success: true, folders });
  } catch (err: any) {
    res.json({ success: false, error: err.message, folders: [] });
  }
});

app.post('/api/create-subfolders', (req, res) => {
  const { parentFolder, subfolders } = req.body;
  if (!parentFolder || !fs.existsSync(parentFolder)) {
    return res.json({ success: false, error: 'ไม่พบโฟลเดอร์หลัก' });
  }

  try {
    for (const sub of subfolders) {
      const fullPath = path.join(parentFolder, sub);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, error: err.message });
  }
});

// === KIE.AI Image Generation Proxy Endpoints ===
app.post('/api/kie-create', async (req, res) => {
  const { apiKey, model, input } = req.body;
  if (!apiKey) {
    return res.status(400).json({ code: 400, msg: 'ไม่พบ KIE API Key' });
  }
  try {
    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model: model || 'gpt-image-2-text-to-image', input })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

app.get('/api/kie-status', async (req, res) => {
  const { taskId, apiKey } = req.query;
  if (!taskId || !apiKey) {
    return res.status(400).json({ code: 400, msg: 'ไม่พบ taskId หรือ apiKey' });
  }
  try {
    const response = await fetch(`https://api.kie.ai/api/v1/jobs/recordInfo?taskId=${encodeURIComponent(String(taskId))}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${String(apiKey)}`
      }
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ code: 500, msg: err.message });
  }
});

// Proxy chat completions ไปยัง Kie.ai (endpoint แยกตามโมเดล, ตอบกลับรูปแบบ OpenAI)
app.post('/api/kie-chat', async (req, res) => {
  const { apiKey, model, payload } = req.body || {};
  if (!apiKey) {
    return res.status(400).json({ error: { message: 'ไม่พบ KIE API Key' } });
  }
  const modelSlug = String(model || payload?.model || 'gemini-2.5-flash').split('/').pop();
  try {
    const response = await fetch(`https://api.kie.ai/${modelSlug}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ ...(payload || {}), model: modelSlug, stream: false })
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    res.status(500).json({ error: { message: err.message } });
  }
});

// === Serve public folder statically under root path ===
app.use(express.static(path.resolve(__dirname, '../../public')));

// === Vertical Video Suite API Endpoints ===

// 1. Single Scene & Overlay Render
app.post('/api/render-video', (req, res) => {
  try {
    const data = req.body;
    const jobId = Date.now().toString();
    const tempDir = path.resolve(__dirname, '../../public/temp_render');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const jobPath = path.join(tempDir, `job_${jobId}.json`);
    
    fs.writeFileSync(jobPath, JSON.stringify({ ...data, projectId: jobId }));

    const { exec } = require('child_process');
    const scriptPath = path.resolve(__dirname, '../../scripts/render.js');
    
    exec(`node "${scriptPath}" "${jobPath}"`, (error: any, stdout: any, stderr: any) => {
      if (fs.existsSync(jobPath)) {
        try { fs.unlinkSync(jobPath); } catch {}
      }
      if (error) {
        return res.status(500).json({ error: error.message, details: stderr });
      }
      res.json({ success: true, logs: stdout });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Local Audio/Image Cache Downloader
app.post('/api/save-audio', async (req, res) => {
  const { url, fileName, prompt, tags = [], folder = 'Sound_stock' } = req.body;
  if (!url || !fileName) {
    return res.status(400).json({ error: "Missing url or fileName" });
  }
  try {
    const safeFolder = folder.replace(/[^A-Za-z0-9_-]/g, "");
    const stockDir = path.resolve(__dirname, `../../public/${safeFolder}`);
    if (!fs.existsSync(stockDir)) {
      fs.mkdirSync(stockDir, { recursive: true });
    }
    
    let ext = '';
    if (!fileName.includes('.')) {
      if (folder === 'Image_stock') ext = '.png';
      else if (folder === 'Voice_stock') ext = '.mp3';
      else ext = '.mp3';
    }
    const safeName = `${fileName}${ext}`;
    const filePath = path.join(stockDir, safeName);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.statusText}`);
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(filePath, buffer);

    // Probe actual audio duration using ffprobe
    let duration = 0;
    try {
      const ffprobePath = getFFprobePath();
      const probeCmd = `"${ffprobePath}" -v error -show_entries format=duration -of csv=p=0 "${filePath}"`;
      await new Promise<void>((resolve) => {
        const { exec } = require('child_process');
        exec(probeCmd, (error: any, stdout: any) => {
          const dur = parseFloat(stdout?.trim());
          if (!error && Number.isFinite(dur) && dur > 0) {
            duration = dur;
          }
          resolve();
        });
      });
    } catch (probeErr) {
      console.error('[save-audio] ffprobe duration failed:', probeErr);
    }

    // Update catalog for sounds/voices
    if (folder === 'Sound_stock' || folder === 'Voice_stock') {
      const catalogPath = path.join(stockDir, 'sfx_catalog.json');
      let catalog: any[] = [];
      if (fs.existsSync(catalogPath)) {
        try {
          catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        } catch {}
      }
      const index = catalog.findIndex((c) => c.fileName === safeName);
      const metadata = {
        fileName: safeName,
        prompt: prompt || '',
        tags: tags,
        updatedAt: new Date().toISOString()
      };
      if (index >= 0) {
        catalog[index] = { ...catalog[index], ...metadata };
      } else {
        catalog.push(metadata);
      }
      fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
    }

    res.json({
      success: true,
      fileName: safeName,
      savedTo: `public/${safeFolder}`,
      url: `/${safeFolder}/${safeName}`,
      duration: duration || undefined
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2.4. macOS Native Text-to-Speech (say command wrapper)
app.get('/api/mac-tts', async (req, res) => {
  const text = String(req.query.text || '').trim();
  const voiceName = String(req.query.voice || 'Kanya').trim();

  if (!text) {
    return res.status(400).json({ error: "Missing text query parameter" });
  }

  try {
    const stockDir = path.resolve(__dirname, '../../public/Voice_stock');
    if (!fs.existsSync(stockDir)) {
      fs.mkdirSync(stockDir, { recursive: true });
    }

    const uniqueId = Date.now().toString();
    const tempTxtPath = path.join(stockDir, `mac-tts-text-${uniqueId}.txt`);
    const tempAiffPath = path.join(stockDir, `mac-tts-temp-${uniqueId}.aiff`);
    const finalMp3Path = path.join(stockDir, `mac-tts-${uniqueId}.mp3`);

    // Write text to a temp file to securely handle all Thai characters and line breaks
    fs.writeFileSync(tempTxtPath, text, 'utf8');

    const { exec } = require('child_process');

    // Step 1: Run macOS say command to synthesize text to an AIFF file
    const sayCmd = `say -v "${voiceName}" -f "${tempTxtPath}" -o "${tempAiffPath}"`;
    await new Promise<void>((resolve, reject) => {
      exec(sayCmd, (error: any, stdout: any, stderr: any) => {
        if (error) reject(new Error(`macOS say command failed: ${stderr || error.message}`));
        else resolve();
      });
    });

    // Clean up temporary text file
    try { fs.unlinkSync(tempTxtPath); } catch {}

    if (!fs.existsSync(tempAiffPath)) {
      throw new Error("Failed to generate intermediate AIFF audio file");
    }

    // Step 2: Convert AIFF to high-quality MP3 using FFmpeg
    const ffmpegPath = getFFmpegPath();
    const convertCmd = `"${ffmpegPath}" -y -i "${tempAiffPath}" -codec:a libmp3lame -qscale:a 2 "${finalMp3Path}"`;
    await new Promise<void>((resolve, reject) => {
      exec(convertCmd, (error: any, stdout: any, stderr: any) => {
        if (error) reject(new Error(`FFmpeg audio conversion failed: ${stderr || error.message}`));
        else resolve();
      });
    });

    // Clean up temporary AIFF file
    try { fs.unlinkSync(tempAiffPath); } catch {}

    if (!fs.existsSync(finalMp3Path)) {
      throw new Error("Failed to generate final MP3 audio file");
    }

    // Step 3: Get audio file duration using ffprobe
    const ffprobePath = getFFprobePath();
    const probeCmd = `"${ffprobePath}" -v error -show_entries format=duration -of csv=p=0 "${finalMp3Path}"`;
    let duration = 0;
    await new Promise<void>((resolve) => {
      exec(probeCmd, (error: any, stdout: any) => {
        const dur = parseFloat(stdout.trim());
        if (!error && Number.isFinite(dur) && dur > 0) {
          duration = dur;
        }
        resolve();
      });
    });

    // Update SFX catalog for the voice file
    const catalogPath = path.join(stockDir, 'sfx_catalog.json');
    let catalog: any[] = [];
    if (fs.existsSync(catalogPath)) {
      try {
        catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
      } catch {}
    }
    const safeName = `mac-tts-${uniqueId}.mp3`;
    catalog.push({
      fileName: safeName,
      prompt: text.substring(0, 50),
      tags: ['offline', 'macos', voiceName],
      updatedAt: new Date().toISOString()
    });
    fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));

    res.json({
      success: true,
      audioUrl: `/Voice_stock/${safeName}`,
      duration: duration || 5.0
    });

  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2.5. Whisper Subtitle Generator for standard videos
app.post('/api/generate-whisper-subtitles', async (req, res) => {
  const { audioUrl, scriptText } = req.body;
  if (!audioUrl) {
    return res.status(400).json({ error: 'Missing audioUrl' });
  }

  try {
    // Resolve audioUrl to filesystem path
    let audioPath = audioUrl;
    if (audioUrl.startsWith('/')) {
      audioPath = path.resolve(__dirname, `../../public${audioUrl}`);
    } else if (!fs.existsSync(audioPath)) {
      // try public folder Voice_stock anyway
      audioPath = path.resolve(__dirname, `../../public/Voice_stock`, path.basename(audioUrl));
    }

    if (!fs.existsSync(audioPath)) {
      return res.status(404).json({ error: `Audio file not found at: ${audioPath}` });
    }

    const tempDir = path.resolve(__dirname, `../../public/temp_render/.whisper_temp_${Date.now()}`);
    if (!fs.existsSync(path.dirname(tempDir))) {
      fs.mkdirSync(path.dirname(tempDir), { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    try {
      const segments = await runWhisper(
        audioPath,
        tempDir,
        'large-v3-turbo',
        'th',
        (obj: any) => console.log(`[Whisper API Log] ${obj.log || ''}`),
        res
      );
      res.json({ success: true, segments });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    } finally {
      if (tempDir && fs.existsSync(tempDir)) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
      }
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 3. SSE Shell execution (For BGM Mixing & final post processing)
app.post('/api/run-bash-script', (req, res) => {
  // Disable Node.js default request timeout (2 min) to prevent killing long-running ffmpeg processes
  req.setTimeout(0);
  res.setTimeout(0);

  const { script } = req.body;
  if (!script) {
    return res.status(400).json({ error: 'No script provided' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const tempDir = path.resolve(__dirname, '../../public/temp_render');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const tmpFile = path.join(tempDir, `bash_${Date.now()}.sh`);
  
  try {
    fs.writeFileSync(tmpFile, script, { mode: 0o755 });
  } catch (e: any) {
    res.write('data: ' + JSON.stringify({ type: 'error', text: 'Failed to write temp file: ' + e.message }) + '\n\n');
    res.end();
    return;
  }

  const { spawn } = require('child_process');
  const env = { 
    ...process.env, 
    PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` 
  };
  const proc = spawn('bash', [tmpFile], { stdio: ['ignore', 'pipe', 'pipe'], env });
  
  const cleanup = () => {
    try { if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile); } catch {}
  };

  let finished = false;
  const send = (obj: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch {}
    }
  };

  proc.stdout.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) send({ type: 'log', text: line });
    }
  });

  proc.stderr.on('data', (data: Buffer) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) send({ type: 'log', text: line });
    }
  });

  proc.on('close', (code: number | null) => {
    if (finished) return;
    finished = true;
    cleanup();
    if (code === 0) {
      send({ type: 'done' });
    } else {
      send({ type: 'error', text: code != null ? `ffmpeg exited (code ${code})` : 'Process stopped' });
    }
    if (!res.writableEnded) res.end();
  });

  proc.on('error', (err: Error) => {
    if (finished) return;
    finished = true;
    cleanup();
    send({ type: 'error', text: err.message });
    if (!res.writableEnded) res.end();
  });

  // Use res.on('close') instead of req.on('close') — req 'close' fires immediately
  // after express.json() consumes the body, but res 'close' fires when the client
  // actually disconnects the SSE stream.
  res.on('close', () => {
    if (!finished) {
      proc.kill();
      cleanup();
    }
  });
});

// 4. B-Roll Footage Folder Video Scanner
app.get('/api/list-video-folder', (req, res) => {
  const folder = String(req.query.folder || '');
  if (!folder || folder.includes('..')) {
    return res.status(400).json({ error: 'Invalid folder' });
  }
  
  const folderPath = path.resolve(__dirname, '../../public/Video_stock', folder);
  const result: any[] = [];
  
  if (fs.existsSync(folderPath)) {
    try {
      const files = fs.readdirSync(folderPath).filter(f => 
        /\.(mp4|mov|webm)$/i.test(f)
      );
      files.forEach(f => {
        result.push({
          name: f,
          url: `/Video_stock/${folder}/${f}`,
        });
      });
    } catch {}
  }
  
  res.json(result);
});

// 5. PNGTuber Avatar Catalog List
app.get('/api/list-avatars', (req, res) => {
  const stockDir = path.resolve(__dirname, '../../public/Avatar_stock');
  const characters: any[] = [];
  
  if (fs.existsSync(stockDir)) {
    const folders = fs.readdirSync(stockDir);
    for (const folder of folders) {
      const dirPath = path.join(stockDir, folder);
      try {
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.png'));
          const avatars = files.map(f => {
            const parts = f.replace('.png', '').split('_');
            const expName = parts.length >= 2 ? parts[1] : parts[0];
            return {
              name: expName,
              fullName: f,
              url: `/Avatar_stock/${folder}/${f}`
            };
          });
          
          const animConfigFile = path.join(dirPath, 'animations.json');
          let animations = {};
          if (fs.existsSync(animConfigFile)) {
             try { animations = JSON.parse(fs.readFileSync(animConfigFile, 'utf8')); } catch(e){}
          } else {
             animations = {
                talking: ['neutral', 'talking'],
                laughing: ['happy', 'talking'],
                angry_talk: ['angry', 'talking'],
                crying: ['crying', 'sad']
             };
             fs.writeFileSync(animConfigFile, JSON.stringify(animations, null, 2));
          }

          characters.push({
            name: folder,
            avatars,
            animations
          });
        }
      } catch(e) {}
    }
  }
  res.json(characters);
});

// 6. PNGTuber Avatar Uploader
app.post('/api/save-avatar', (req, res) => {
  try {
    const { filename, characterName, base64 } = req.body;
    if (!filename || !characterName || !base64) {
      return res.status(400).json({ error: 'Missing data' });
    }
    
    const safeCharName = characterName.replace(/[^a-zA-Z0-9ก-๙]/g, '_');
    const avatarDir = path.resolve(__dirname, '../../public/Avatar_stock', safeCharName);
    if (!fs.existsSync(avatarDir)) fs.mkdirSync(avatarDir, { recursive: true });
    
    const filePath = path.join(avatarDir, filename);
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    fs.writeFileSync(filePath, base64Data, 'base64');
    
    res.json({ success: true, url: `/Avatar_stock/${safeCharName}/${filename}` });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 7. PNGTuber Avatar Deleter
app.post('/api/delete-avatar', (req, res) => {
  try {
    const { characterName, filename } = req.body;
    if (!characterName) return res.status(400).json({ error: 'Missing characterName' });
    
    const avatarDir = path.resolve(__dirname, '../../public/Avatar_stock', characterName);
    if (fs.existsSync(avatarDir)) {
      if (filename) {
        const filePath = path.join(avatarDir, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } else {
        const files = fs.readdirSync(avatarDir);
        for (const file of files) {
          fs.unlinkSync(path.join(avatarDir, file));
        }
        fs.rmdirSync(avatarDir);
      }
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

// 8. BG Music / SFX Stock Directory Listing
app.get('/api/list-sound-stock', (req, res) => {
  const folderPath = path.resolve(__dirname, '../../public/Sound_stock');
  const result: any[] = [];
  
  if (fs.existsSync(folderPath)) {
    const { execSync } = require('child_process');
    const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.mp3') || f.endsWith('.wav'));
    files.forEach(f => {
      let duration = 0;
      try {
        const dur = execSync(`ffprobe -v error -show_entries format=duration -of csv=p=0 "${path.join(folderPath, f)}"`, { encoding: 'utf8' });
        duration = parseFloat(dur.trim()) || 0;
      } catch(e) {}
      result.push({
        name: f,
        url: `/Sound_stock/${f}`,
        duration: Math.round(duration * 10) / 10,
      });
    });
  }
  res.json(result);
});

// 9. Bulk Asset Clean-up Utility
app.post('/api/delete-assets', (req, res) => {
  try {
     const { paths } = req.body;
     const baseDir = path.resolve(__dirname, '../../public');
     const deleted: string[] = [];
     
     (paths || []).forEach((p: string) => {
        if (p.includes('..')) return;
        const filePath = path.join(baseDir, p);
        if (fs.existsSync(filePath)) {
           fs.unlinkSync(filePath);
           deleted.push(p);

           if (p.startsWith('Sound_stock/') || p.startsWith('Voice_stock/')) {
              const folderName = p.split('/')[0];
              const catalogPath = path.join(baseDir, `${folderName}/sfx_catalog.json`);
              if (fs.existsSync(catalogPath)) {
                 try {
                   let catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
                   const name = p.split('/')[1];
                   catalog = catalog.filter((c: any) => c.fileName !== name);
                   fs.writeFileSync(catalogPath, JSON.stringify(catalog, null, 2));
                 } catch(e){}
              }
           }
        }
     });
     res.json({ success: true, deleted });
  } catch (e: any) {
     res.status(500).json({ error: e.message });
  }
});

// 10. Random footage looping and assembly (SSE streaming logs)
app.post('/api/build-random-clip-assembly', async (req, res) => {
  // Disable Node.js default request timeout (2 min) to prevent killing long-running ffmpeg processes
  req.setTimeout(0);
  res.setTimeout(0);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const send = (obj: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch {}
    }
  };

  const sh = (value: string) => `'${String(value).replace(/'/g, `'\\''`)}'`;
  
  const toFinite = (value: any, fallback: number, min: number, max: number) => {
    const n = Number(value);
    if (!Number.isFinite(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };

  const shuffle = <T,>(items: T[]) => {
    const next = [...items];
    for (let i = next.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  };

  try {
    const payload = req.body || {};
    const sourceFolder = String(payload.sourceFolder || '').trim();
    const outputFolder = String(payload.outputFolder || '').trim();
    const targetSeconds = toFinite(payload.targetSeconds, 45, 1, 60 * 60);
    const requestedOutputCount = Math.floor(toFinite(payload.outputCount, 0, 0, 1000));
    const width = Math.round(toFinite(payload.width, 1080, 320, 7680));
    const height = Math.round(toFinite(payload.height, 1920, 320, 7680));
    const usedKeys = new Set<string>(Array.isArray(payload.usedKeys) ? payload.usedKeys.map((v: any) => String(v)) : []);
    const outputBase = String(payload.outputName || 'random_cut')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 80) || 'random_cut';

    if (!sourceFolder || !fs.existsSync(sourceFolder) || !fs.statSync(sourceFolder).isDirectory()) {
      send({ type: 'error', text: 'ไม่พบโฟลเดอร์คลิปต้นทาง' });
      res.end();
      return;
    }

    try {
      fs.mkdirSync(outputFolder, { recursive: true });
    } catch (e: any) {
      send({ type: 'error', text: 'สร้างโฟลเดอร์ปลายทางไม่ได้: ' + e.message });
      res.end();
      return;
    }

    const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
    const files = fs.readdirSync(sourceFolder)
      .filter((file: string) => VIDEO_EXTS.includes(path.extname(file).toLowerCase()))
      .map((file: string) => {
        const filePath = path.join(sourceFolder, file);
        const stat = fs.statSync(filePath);
        const key = `${sourceFolder}::${file}`;
        return { file, filePath, key, mtimeMs: stat.mtimeMs, size: stat.size };
      });

    if (files.length === 0) {
      send({ type: 'error', text: 'ไม่พบไฟล์วิดีโอในโฟลเดอร์ต้นทาง' });
      res.end();
      return;
    }

    const currentFileKeys = new Set(files.map((item: any) => item.key));
    const carriedUsedKeys = new Set<string>([...usedKeys].filter(key => currentFileKeys.has(key)));
    const cycleReset = carriedUsedKeys.size >= files.length;
    const historyBase = cycleReset ? new Set<string>() : carriedUsedKeys;
    const freshFileCount = files.filter((item: any) => !historyBase.has(item.key)).length;

    send({
      type: 'log',
      text: cycleReset
        ? `ใช้ครบทุกไฟล์แล้ว เริ่มรอบใหม่จาก ${files.length} ไฟล์ กำลังอ่านความยาว...`
        : `เหลือคลิปใหม่ในรอบนี้ ${freshFileCount}/${files.length} ไฟล์ กำลังอ่านความยาว...`,
    });

    const cachePath = path.resolve(__dirname, '../../public/temp_render/.durations_cache.json');
    let durationCache: Record<string, { duration: number; mtimeMs: number; size: number }> = {};
    try {
      if (fs.existsSync(cachePath)) {
        durationCache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      }
    } catch (e) {}

    const { spawn } = require('child_process');
    const getFFprobePath = () => {
      const customPath = '/opt/homebrew/opt/ffmpeg-full/bin/ffprobe';
      if (fs.existsSync(customPath)) return customPath;
      const brewPath = '/opt/homebrew/bin/ffprobe';
      if (fs.existsSync(brewPath)) return brewPath;
      return 'ffprobe';
    };

    const getFFmpegPath = () => {
      const customPath = '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
      if (fs.existsSync(customPath)) return customPath;
      const brewPath = '/opt/homebrew/bin/ffmpeg';
      if (fs.existsSync(brewPath)) return brewPath;
      return 'ffmpeg';
    };

    const env = { 
      ...process.env, 
      PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` 
    };

    const getDurationAsync = (filePath: string): Promise<number> => {
      return new Promise((resolve) => {
        const probe = spawn(getFFprobePath(), [
          '-v', 'error',
          '-show_entries', 'format=duration',
          '-of', 'default=noprint_wrappers=1:nokey=1',
          filePath,
        ], { env, timeout: 20000 });

        let stdout = '';
        probe.stdout.on('data', (data: Buffer) => { stdout += data.toString(); });
        probe.on('close', (code: number | null) => {
          const dur = Number(stdout.trim());
          if (code === 0 && Number.isFinite(dur) && dur >= 0.1) {
            resolve(dur);
          } else {
            resolve(0);
          }
        });
        probe.on('error', () => { resolve(0); });
      });
    };

    const limitConcurrency = async <T, R>(
      items: T[],
      limit: number,
      fn: (item: T) => Promise<R>
    ): Promise<R[]> => {
      const results: R[] = [];
      const executing: Promise<any>[] = [];
      for (const item of items) {
        const p = fn(item).then((res) => {
          executing.splice(executing.indexOf(p), 1);
          return res;
        });
        executing.push(p);
        results.push(p as any);
        if (executing.length >= limit) {
          await Promise.race(executing);
        }
      }
      return Promise.all(results);
    };

    let cacheUpdated = false;
    const clipsRaw = await limitConcurrency(files, 15, async (item: any) => {
      const cacheKey = item.filePath;
      const cached = durationCache[cacheKey];
      if (cached && cached.mtimeMs === item.mtimeMs && cached.size === item.size) {
        return { ...item, duration: cached.duration };
      }

      const duration = await getDurationAsync(item.filePath);
      if (duration >= 0.1) {
        durationCache[cacheKey] = { duration, mtimeMs: item.mtimeMs, size: item.size };
        cacheUpdated = true;
        return { ...item, duration };
      }
      return null;
    });

    const clips = clipsRaw.filter(Boolean) as any[];

    if (cacheUpdated) {
      try {
        fs.writeFileSync(cachePath, JSON.stringify(durationCache, null, 2), 'utf8');
      } catch (e) {}
    }

    if (clips.length === 0) {
      send({ type: 'error', text: 'อ่านความยาวคลิปไม่ได้ ตรวจว่าเครื่องมี ffprobe/ffmpeg และไฟล์วิดีโอเปิดได้' });
      res.end();
      return;
    }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDirName = `.random_assembly_${Date.now()}`;
    const tempDir = path.join(outputFolder, tempDirName);
    const scriptPath = path.join(tempDir, `random_clip_assembly_${Date.now()}.sh`);
    const vf = `scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p`;
    const nextHistory = new Set<string>(historyBase);
    const jobs: Array<{ outputPath: string; selected: any[] }> = [];
    const maxOutputs = requestedOutputCount > 0 ? requestedOutputCount : Math.max(1, clips.length);

    while (jobs.length < maxOutputs) {
      if (requestedOutputCount === 0 && jobs.length > 0 && nextHistory.size >= clips.length) break;
      if (requestedOutputCount > 0 && jobs.length > 0 && nextHistory.size >= clips.length) {
        nextHistory.clear();
        send({ type: 'log', text: `ใช้ครบทุกไฟล์แล้ว เริ่มรอบใหม่เพื่อสร้างไฟล์ที่ ${jobs.length + 1}` });
      }

      const selected: Array<any> = [];
      const selectedKeysThisOutput = new Set<string>();
      let remaining = targetSeconds;
      const freshClips = shuffle(clips.filter((clip: any) => !nextHistory.has(clip.key)));
      if (freshClips.length === 0) break;

      const addSegment = (clip: any, fromReuse: boolean) => {
        const naturalTake = remaining <= 8 ? remaining : 3 + Math.random() * 5;
        const segDuration = Math.min(clip.duration, remaining, Math.max(0.5, naturalTake));
        const maxStart = Math.max(0, clip.duration - segDuration);
        const start = maxStart > 0 ? Math.random() * maxStart : 0;
        selected.push({
          ...clip,
          start: Number(start.toFixed(2)),
          segmentDuration: Number(segDuration.toFixed(2)),
          fromReuse,
          outputIndex: jobs.length + 1,
        });
        selectedKeysThisOutput.add(clip.key);
        remaining -= segDuration;
      };

      for (const clip of freshClips) {
        if (remaining <= 0.05) break;
        addSegment(clip, false);
        nextHistory.add(clip.key);
      }

      let refillPass = 0;
      while (remaining > 0.05 && refillPass < 2000) {
        const unusedInThisOutput = clips.filter((clip: any) => !selectedKeysThisOutput.has(clip.key));
        const refillPool = shuffle(unusedInThisOutput.length > 0 ? unusedInThisOutput : clips);
        if (refillPass === 0) {
          send({ type: 'log', text: `ไฟล์ที่ ${jobs.length + 1}: คลิปใหม่ไม่พอเติม ${targetSeconds}s จึงสุ่มคลิปที่เคยใช้แล้วมาเติมท้ายงาน` });
        }
        for (const clip of refillPool) {
          if (remaining <= 0.05) break;
          addSegment(clip, true);
        }
        refillPass++;
      }

      if (remaining > 0.25 || selected.length === 0) {
        send({ type: 'error', text: `สร้างไฟล์ที่ ${jobs.length + 1} ไม่ครบ ${targetSeconds} วินาที ลองเพิ่มคลิปในโฟลเดอร์` });
        res.end();
        return;
      }

      const outputSuffix = requestedOutputCount === 1 ? '' : `_${String(jobs.length + 1).padStart(2, '0')}`;
      jobs.push({
        outputPath: path.join(outputFolder, `${outputBase}_${stamp}${outputSuffix}.mp4`),
        selected,
      });
    }

    if (jobs.length === 0) {
      send({ type: 'error', text: 'ไม่มีคลิปใหม่พอให้สร้างงาน ลองล้างประวัติหรือเพิ่มคลิปในโฟลเดอร์' });
      res.end();
      return;
    }

    // Ensure tempDir is created
    fs.mkdirSync(tempDir, { recursive: true });

    const scriptLines = [
      '#!/bin/bash',
      'set -euo pipefail',
      'export PATH="/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"',
      `TMP_DIR=${sh(tempDir)}`,
      'mkdir -p "$TMP_DIR"',
      `echo "เริ่มสร้าง ${jobs.length} ไฟล์ ไฟล์ละประมาณ ${targetSeconds}s"`,
    ];

    jobs.forEach((job, jobIndex) => {
      const jobNo = String(jobIndex + 1).padStart(3, '0');
      const segmentPaths = job.selected.map((_: any, index: number) => path.join(tempDir, `job_${jobNo}_seg_${String(index + 1).padStart(3, '0')}.mp4`));
      const listPath = path.join(tempDir, `job_${jobNo}_concat_list.txt`);
      scriptLines.push(`echo "=== Output ${jobIndex + 1}/${jobs.length}: ${path.basename(job.outputPath)} ==="`);
      job.selected.forEach((clip, index) => {
        scriptLines.push(`echo "[${jobIndex + 1}.${index + 1}/${job.selected.length}] ${clip.file} @ ${clip.start}s + ${clip.segmentDuration}s${clip.fromReuse ? ' (reuse)' : ''}"`);
        scriptLines.push([
          'ffmpeg', '-y',
          '-ss', sh(String(clip.start)),
          '-t', sh(String(clip.segmentDuration)),
          '-i', sh(clip.filePath),
          '-map', '0:v:0',
          '-an',
          '-vf', sh(vf),
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '20',
          '-movflags', '+faststart',
          sh(segmentPaths[index]),
        ].join(' '));
      });
      scriptLines.push(`cat > ${sh(listPath)} <<'EOF'`);
      segmentPaths.forEach(segmentPath => scriptLines.push(`file ${sh(segmentPath)}`));
      scriptLines.push('EOF');
      scriptLines.push(`ffmpeg -y -f concat -safe 0 -i ${sh(listPath)} -c copy ${sh(job.outputPath)}`);
      scriptLines.push(`echo "เสร็จแล้ว: ${job.outputPath}"`);
    });

    scriptLines.push('rm -rf "$TMP_DIR"');

    try {
      fs.writeFileSync(scriptPath, scriptLines.join('\n'), { mode: 0o755 });
    } catch (e: any) {
      send({ type: 'error', text: 'เขียนไฟล์สคริปต์ชั่วคราวไม่ได้: ' + e.message });
      res.end();
      return;
    }

    if (nextHistory.size >= clips.length) {
      clips.forEach((clip: any) => nextHistory.add(clip.key));
    }
    const outputPaths = jobs.map(job => job.outputPath);
    const flatSelected = jobs.flatMap(job => job.selected.map(clip => ({ ...clip, outputFilename: path.basename(job.outputPath) })));
    const used = flatSelected.map(clip => clip.key);

    send({
      type: 'plan',
      outputPath: outputPaths[0],
      outputPaths,
      outputCount: jobs.length,
      usedKeys: used,
      historyKeys: Array.from(nextHistory),
      cycleReset,
      cycleCompleted: nextHistory.size >= clips.length,
      clips: flatSelected.map(clip => ({
        filename: clip.file,
        key: clip.key,
        start: clip.start,
        duration: clip.segmentDuration,
        sourceDuration: Number(clip.duration.toFixed(2)),
        fromReuse: Boolean(clip.fromReuse),
        outputIndex: clip.outputIndex,
        outputFilename: clip.outputFilename,
      })),
    });

    const proc = spawn('bash', [scriptPath], { stdio: ['ignore', 'pipe', 'pipe'], env });
    let finished = false;
    const cleanup = () => { try { if (fs.existsSync(scriptPath)) fs.unlinkSync(scriptPath); } catch {} };

    proc.stdout.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        if (line.trim()) send({ type: 'log', text: line });
      }
    });

    proc.stderr.on('data', (data: Buffer) => {
      for (const line of data.toString().split('\n')) {
        if (line.trim()) send({ type: 'log', text: line });
      }
    });

    proc.on('close', (code: number | null) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (code === 0) {
        send({ 
          type: 'done', 
          outputPath: outputPaths[0], 
          outputPaths, 
          outputCount: jobs.length, 
          usedKeys: used, 
          historyKeys: Array.from(nextHistory), 
          cycleReset, 
          cycleCompleted: nextHistory.size >= clips.length 
        });
      } else {
        send({ type: 'error', text: code != null ? `ffmpeg exited (code ${code}) — ดู log ด้านบน` : 'Process stopped' });
      }
      if (!res.writableEnded) res.end();
    });

    proc.on('error', (err: Error) => {
      if (finished) return;
      finished = true;
      cleanup();
      send({ type: 'error', text: err.message });
      if (!res.writableEnded) res.end();
    });

    // Use res.on('close') instead of req.on('close') — req 'close' fires immediately
    // after express.json() consumes the body, but res 'close' fires when the client
    // actually disconnects the SSE stream.
    res.on('close', () => { 
      if (!finished) { 
        proc.kill(); 
        cleanup(); 
      } 
    });

  } catch (err: any) {
    send({ type: 'error', text: err.message });
    res.end();
  }
});

// ── Avatar Vertical Clip Maker Helper Functions & APIs ─────────────
function getFFmpegPath(): string {
  const customPath = '/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg';
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  const brewPath = '/opt/homebrew/bin/ffmpeg';
  if (fs.existsSync(brewPath)) {
    return brewPath;
  }
  try {
    return require('ffmpeg-static') || 'ffmpeg';
  } catch (e) {
    return 'ffmpeg';
  }
}

function getFFprobePath(): string {
  const customPath = '/opt/homebrew/opt/ffmpeg-full/bin/ffprobe';
  if (fs.existsSync(customPath)) {
    return customPath;
  }
  const brewPath = '/opt/homebrew/bin/ffprobe';
  if (fs.existsSync(brewPath)) {
    return brewPath;
  }
  return 'ffprobe';
}

const cleanFilePart = (value: string) => {
  return String(value || 'avatar')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120) || 'avatar';
};

const escapeConcatPath = (value: string) => String(value).replace(/'/g, "'\\''");

const escapeFilterPath = (value: string) => String(value)
  .replace(/\\/g, '\\\\')
  .replace(/:/g, '\\:')
  .replace(/'/g, "\\'");

const shuffle = <T,>(items: T[]) => {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
};

const probeDuration = (filePath: string) => {
  const { spawnSync } = require('child_process');
  const probe = spawnSync(getFFprobePath(), [
    '-v', 'error',
    '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1',
    filePath,
  ], { encoding: 'utf8', timeout: 20000 });
  const duration = Number(String(probe.stdout || '').trim());
  return Number.isFinite(duration) && duration > 0 ? duration : 0;
};

const hasAudioStream = (filePath: string) => {
  const { spawnSync } = require('child_process');
  const probe = spawnSync(getFFprobePath(), [
    '-v', 'error',
    '-select_streams', 'a:0',
    '-show_entries', 'stream=codec_type',
    '-of', 'csv=p=0',
    filePath,
  ], { encoding: 'utf8', timeout: 12000 });
  return String(probe.stdout || '').includes('audio');
};

const assTime = (seconds: number) => {
  const safe = Math.max(0, seconds || 0);
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = Math.floor(safe % 60);
  const cs = Math.floor((safe - Math.floor(safe)) * 100);
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(cs).padStart(2, '0')}`;
};

const escapeAssText = (value: string) => String(value || '')
  .replace(/\\/g, '\\\\')
  .replace(/\{/g, '\\{')
  .replace(/\}/g, '\\}')
  .replace(/\r?\n/g, '\\N')
  .trim();

const splitSubtitleSegments = (
  segments: Array<{ start: number; end: number; text: string }>,
  density: string,
) => {
  if (density === 'full') return segments;
  const maxWords = density === 'balanced' ? 7 : 5;
  const maxChars = density === 'balanced' ? 42 : 30;
  const minDuration = 0.75;
  const next: Array<{ start: number; end: number; text: string }> = [];
  for (const segment of segments) {
    const words = String(segment.text || '').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
    if (words.length <= maxWords && Array.from(segment.text).length <= maxChars) {
      next.push(segment);
      continue;
    }
    const chunks: string[][] = [];
    let current: string[] = [];
    for (const word of words) {
      const candidate = [...current, word].join(' ');
      if (current.length >= maxWords || (Array.from(candidate).length > maxChars && current.length > 0)) {
        chunks.push(current);
        current = [word];
      } else {
        current.push(word);
      }
    }
    if (current.length) chunks.push(current);
    const duration = Math.max(segment.end - segment.start, minDuration * chunks.length);
    const totalWords = Math.max(words.length, 1);
    let cursor = segment.start;
    chunks.forEach((chunk, index) => {
      const isLast = index === chunks.length - 1;
      const share = chunk.length / totalWords;
      const rawEnd = isLast ? segment.end : cursor + duration * share;
      const end = Math.min(segment.end, Math.max(cursor + minDuration, rawEnd));
      next.push({ start: cursor, end, text: chunk.join(' ') });
      cursor = end;
    });
  }
  return next.filter(segment => segment.end > segment.start && segment.text);
};

const splitThaiWithoutSpaces = (text: string, maxChars = 24): string => {
  const chars = Array.from(text);
  if (chars.length <= maxChars) return text;
  
  const half = Math.floor(chars.length / 2);
  let splitIdx = half;
  
  const leadingVowels = ['เ', 'แ', 'โ', 'ไ', 'เ', 'โ'];
  const nonStartingChars = [
    'ะ', 'ั', 'า', 'ำ', 'ิ', 'ี', 'ึ', 'ื', 'ุ', 'ู', 
    '็', '่', '้', '๊', '๋', '์', 'ํ', '์'
  ];

  for (let offset = 0; offset <= 6; offset++) {
    const idx1 = half + offset;
    if (idx1 < chars.length - 3) {
      const char = chars[idx1];
      if (leadingVowels.includes(char) || (!nonStartingChars.includes(char) && char !== ' ')) {
        splitIdx = idx1;
        break;
      }
    }
    const idx2 = half - offset;
    if (idx2 > 3) {
      const char = chars[idx2];
      if (leadingVowels.includes(char) || (!nonStartingChars.includes(char) && char !== ' ')) {
        splitIdx = idx2;
        break;
      }
    }
  }
  
  const line1 = chars.slice(0, splitIdx).join('').trim();
  const line2 = chars.slice(splitIdx).join('').trim();
  return `${line1}\n${line2}`;
};

const wrapSubtitleText = (text: string, maxChars = 24) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  
  const words = clean.split(' ').filter(Boolean);
  
  if (words.length <= 1 && Array.from(clean).length > maxChars) {
    return splitThaiWithoutSpaces(clean, maxChars);
  }

  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (Array.from(next).length > maxChars && current && lines.length < 1) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2).join('\n');
};

const getSubtitlePosition = (positionId: string) => {
  const positions: Record<string, { alignment: number; marginV: number }> = {
    'avatar-low': { alignment: 2, marginV: 170 },
    'avatar-mid': { alignment: 2, marginV: 430 },
    'split-line': { alignment: 2, marginV: 830 },
    'top-low': { alignment: 2, marginV: 925 },
    'bottom-safe': { alignment: 2, marginV: 72 },
  };
  return positions[positionId] || positions['avatar-low'];
};

const getSubtitleStyle = (styleId: string) => {
  const styles: Record<string, any> = {
    'bold-yellow': { fontSize: 58, primary: '&H005CE4FF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineWidth: 5, shadow: 2, bold: -1 },
    'clean-white': { fontSize: 56, primary: '&H00FFFFFF', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineWidth: 5, shadow: 2, bold: -1 },
    'paper-box': { fontSize: 50, primary: '&H00111827', outline: '&H00B4DDF3', back: '&H00B4DDF3', borderStyle: 3, outlineWidth: 12, shadow: 0, bold: -1 },
    'cinema-box': { fontSize: 52, primary: '&H00FFFFFF', outline: '&HCC000000', back: '&HC0000000', borderStyle: 3, outlineWidth: 11, shadow: 0, bold: -1 },
    'neon-blue': { fontSize: 56, primary: '&H00FCD37D', outline: '&H00000000', back: '&H80000000', borderStyle: 1, outlineWidth: 4, shadow: 3, bold: -1 },
  };
  return styles[styleId] || styles['bold-yellow'];
};

const buildTitleAss = (
  titleText: string,
  styleId: string,
  fontSize: number,
  padding: number,
  opacity: number,
  yPosition: number,
  fontName: string = 'Prompt',
  boxWidth: number = 0,
  boxHeight: number = 0,
) => {
  const OUT_W = 1080;
  const OUT_H = 1920;

  let primaryColor = '&H00F3DDB4';
  let backColor = '&H00111111';
  let borderStyle = 3;
  let outlineWidth = padding / 3;
  let shadow = 0;
  let bold = -1;

  const alphaHex = Math.round((1 - opacity) * 255).toString(16).padStart(2, '0').toUpperCase();

  // สไตล์ที่ไม่มีกล่อง (ตัวอักษรขอบดำ) — กล่อง W×H ไม่มีผลกับสไตล์เหล่านี้
  const NO_BOX_STYLES = new Set(['no-box-shadow', 'outline-minimal']);

  if (styleId === 'minimal-black') {
    primaryColor = '&H00FFFFFF';
    backColor = `&H${alphaHex}000000`;
  } else if (styleId === 'modern-white') {
    primaryColor = '&H00271811';
    backColor = `&H${alphaHex}FFFFFF`;
  } else if (styleId === 'neon-purple') {
    primaryColor = '&H00FFFFFF';
    backColor = `&H${alphaHex}ED3A7C`;
  } else if (styleId === 'attention-red') {
    primaryColor = '&H00FFFFFF';
    backColor = `&H${alphaHex}4444EF`;
  } else if (styleId === 'shopee-orange') {
    primaryColor = '&H00FFFFFF';
    backColor = `&H${alphaHex}2D4DEE`;
  } else if (styleId === 'mint-green') {
    primaryColor = '&H00231A0E';
    backColor = `&H${alphaHex}A6B814`;
  } else if (styleId === 'pastel-blue') {
    primaryColor = '&H00422D11';
    backColor = `&H${alphaHex}FEDBBF`;
  } else if (styleId === 'rich-gold') {
    primaryColor = '&H00231A0E';
    backColor = `&H${alphaHex}44B0E0`;
  } else if (styleId === 'no-box-shadow') {
    primaryColor = '&H00FFFFFF';
    backColor = '&H00000000';
    borderStyle = 1;
    outlineWidth = 4;
    shadow = 2;
  } else if (styleId === 'outline-minimal') {
    primaryColor = '&H00FFFFFF';
    backColor = '&H00000000';
    borderStyle = 1;
    outlineWidth = 2;
    shadow = 0;
  } else {
    primaryColor = '&H00111111';
    backColor = `&H${alphaHex}B4DDF3`;
  }

  const formattedText = titleText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .join('\\N');

  // ── โหมดกล่องกำหนดขนาดเอง (W×H) ── วาดสี่เหลี่ยมด้วย ASS drawing แล้ววางข้อความตรงกลาง
  // เพื่อให้คุมความกว้าง/ความสูงกล่องได้อิสระจริง (ASS BorderStyle=3 ขยายตามตัวอักษรเท่านั้น)
  const useDrawnBox = boxWidth > 0 && boxHeight > 0 && !NO_BOX_STYLES.has(styleId);

  const fontsize = Math.max(8, Math.round(fontSize));

  if (useDrawnBox) {
    const cx = Math.round(OUT_W / 2);
    const boxLeft = Math.round(cx - boxWidth / 2);
    const boxTop = Math.round(yPosition);
    const textCy = Math.round(boxTop + boxHeight / 2);
    const backMatch = backColor.match(/&H(..)(......)/i);
    const boxAlpha = backMatch ? backMatch[1] : '00';
    const boxRGB = backMatch ? backMatch[2] : '111111';

    return `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${OUT_W}
PlayResY: ${OUT_H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontsize},${primaryColor},&H00FFFFFF,&H00000000,&H00000000,${bold},0,0,0,100,100,0,0,1,2,0,5,40,40,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,9:59:59.99,Default,,0,0,0,,{\\pos(${boxLeft},${boxTop})\\an7\\1c&H${boxRGB}&\\1a&H${boxAlpha}&\\bord0\\shad0\\p1}m 0 0 l ${Math.round(boxWidth)} 0 ${Math.round(boxWidth)} ${Math.round(boxHeight)} 0 ${Math.round(boxHeight)}{\\p0}
Dialogue: 1,0:00:00.00,9:59:59.99,Default,,0,0,0,,{\\pos(${cx},${textCy})\\an5}${formattedText}`;
  }

  const header = `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${OUT_W}
PlayResY: ${OUT_H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontsize},${primaryColor},&H00FFFFFF,${backColor},${backColor},${bold},0,0,0,100,100,0,0,${borderStyle},${outlineWidth},${shadow},8,120,120,${yPosition},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
Dialogue: 0,0:00:00.00,9:59:59.99,Default,,0,0,0,,${formattedText}`;

  return header;
};

// ── สร้างลายน้ำเครดิต (Watermark) เป็นไฟล์ ASS ──
//   mode: fixed = มุมเดียวคงที่, random-corners = สุ่มย้ายมุมทุกช่วง, roaming = ลอยเคลื่อนไปมา
const buildWatermarkAss = (
  text: string,
  opts: { mode?: string; corner?: string; style?: string; opacity?: number; fontSize?: number; font?: string; intervalSec?: number },
  durationSec: number,
) => {
  const OUT_W = 1080, OUT_H = 1920;
  const dur = Math.max(0.5, Number(durationSec) || 5);
  const mode = String(opts.mode || 'random-corners');
  const style = String(opts.style || 'faint');
  const fontName = String(opts.font || 'Prompt');
  const fontSize = Math.max(18, Math.min(140, Math.round(Number(opts.fontSize) || 44)));
  const opacity = Math.max(0.05, Math.min(1, Number(opts.opacity ?? 0.35)));
  const intervalSec = Math.max(2, Math.min(12, Number(opts.intervalSec) || 4));

  const aHex = (o: number) => Math.round((1 - Math.max(0, Math.min(1, o))) * 255).toString(16).padStart(2, '0').toUpperCase();
  const primary = `&H${aHex(opacity)}FFFFFF`;
  const outline = `&H${aHex(Math.min(1, opacity * 1.1))}000000`;
  let borderStyle = 1, outlineW = 2, shadow = 0, back = '&HFF000000', italic = 0;
  if (style === 'outline') { outlineW = 3.5; }
  else if (style === 'box') { borderStyle = 3; outlineW = 10; back = `&H${aHex(opacity * 0.7)}000000`; }
  else if (style === 'italic') { italic = -1; outlineW = 2; }

  const esc = String(text || '').replace(/[\r\n]+/g, ' ').replace(/[{}\\]/g, '').replace(/\s+/g, ' ').trim() || '@yourshop';

  const secToAss = (t: number) => {
    const cs = Math.max(0, Math.round(t * 100));
    const h = Math.floor(cs / 360000);
    const m = Math.floor((cs % 360000) / 6000);
    const s = Math.floor((cs % 6000) / 100);
    const c = cs % 100;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}.${String(c).padStart(2, '0')}`;
  };

  // จุดยึด (เว้นขอบ ~ปลอดภัย) เป็นพิกัดจริงบนเฟรม 1080x1920
  const anchors = [
    { x: 200, y: 230 }, { x: 880, y: 230 },          // บนซ้าย/ขวา
    { x: 200, y: 1700 }, { x: 880, y: 1700 },        // ล่างซ้าย/ขวา
    { x: 540, y: 250 }, { x: 540, y: 1680 },         // บนกลาง/ล่างกลาง
    { x: 220, y: 960 }, { x: 860, y: 960 },          // กลางซ้าย/ขวา
  ];
  const cornerMap: Record<string, { x: number; y: number }> = {
    'top-left': anchors[0], 'top-right': anchors[1], 'bottom-left': anchors[2],
    'bottom-right': anchors[3], 'top': anchors[4], 'bottom': anchors[5], 'center': { x: 540, y: 960 },
  };

  const header = `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${OUT_W}
PlayResY: ${OUT_H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},${primary},&H00FFFFFF,${outline},${back},0,${italic},0,0,100,100,0,0,${borderStyle},${outlineW},${shadow},5,0,0,0,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const lines: string[] = [];
  if (mode === 'fixed') {
    const a = cornerMap[String(opts.corner || 'bottom-right')] || anchors[3];
    lines.push(`Dialogue: 0,${secToAss(0)},${secToAss(dur)},Default,,0,0,0,,{\\pos(${a.x},${a.y})\\an5}${esc}`);
  } else {
    let t = 0;
    let prev = anchors[Math.floor(Math.random() * anchors.length)];
    let guard = 0;
    while (t < dur - 0.05 && guard < 400) {
      guard++;
      const t1 = Math.min(dur, t + intervalSec);
      let next = anchors[Math.floor(Math.random() * anchors.length)];
      let tries = 0;
      while (next === prev && tries < 6) { next = anchors[Math.floor(Math.random() * anchors.length)]; tries++; }
      if (mode === 'roaming') {
        lines.push(`Dialogue: 0,${secToAss(t)},${secToAss(t1)},Default,,0,0,0,,{\\move(${prev.x},${prev.y},${next.x},${next.y})\\an5\\fad(250,250)}${esc}`);
      } else {
        // random-corners: กระโดดมุม + เฟดเข้า-ออก
        lines.push(`Dialogue: 0,${secToAss(t)},${secToAss(t1)},Default,,0,0,0,,{\\pos(${next.x},${next.y})\\an5\\fad(350,350)}${esc}`);
      }
      prev = next; t = t1;
    }
  }

  return header + lines.join('\n');
};

const buildSubtitleAss = (
  segments: Array<{ start: number; end: number; text: string }>,
  styleId: string,
  density: string,
  positionId: string,
  fontSizeOverride?: number,
  yPositionOverride?: number,
) => {
  const OUT_W = 1080;
  const OUT_H = 1920;
  const style = getSubtitleStyle(styleId);
  const position = getSubtitlePosition(positionId);
  const displaySegments = splitSubtitleSegments(segments, density);
  const maxLineChars = density === 'full' ? 30 : density === 'balanced' ? 24 : 18;
  
  const finalFontSize = fontSizeOverride && fontSizeOverride > 0 ? fontSizeOverride : style.fontSize;
  
  let finalMarginV = position.marginV;
  if (yPositionOverride && yPositionOverride > 0) {
    finalMarginV = Math.max(20, Math.min(1860, OUT_H - yPositionOverride));
  }

  const header = `[Script Info]
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
PlayResX: ${OUT_W}
PlayResY: ${OUT_H}

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Prompt,${finalFontSize},${style.primary},&H00FFFFFF,${style.outline},${style.back},${style.bold},0,0,0,100,100,0,0,${style.borderStyle},${style.outlineWidth},${style.shadow},${position.alignment},80,80,${finalMarginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
  const events = displaySegments
    .filter(segment => segment.text && segment.end > segment.start)
    .map(segment => {
      const text = escapeAssText(wrapSubtitleText(segment.text, maxLineChars));
      return `Dialogue: 0,${assTime(segment.start)},${assTime(segment.end)},Default,,0,0,0,,${text}`;
    });
  return [header, ...events].join('\n');
};

const readWhisperSegments = (jsonPath: string) => {
  const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const rawSegments = Array.isArray(parsed.segments) ? parsed.segments : [];
  return rawSegments
    .map((segment: any) => ({
      start: Number(segment.start),
      end: Number(segment.end),
      text: String(segment.text || '').replace(/\s+/g, ' ').trim(),
    }))
    .filter((segment: any) => Number.isFinite(segment.start) && Number.isFinite(segment.end) && segment.end > segment.start && segment.text);
};

let cachedWhisperPython = '';
const findWhisperPython = (sendCallback: (obj: any) => void) => {
  if (cachedWhisperPython) return cachedWhisperPython;
  const { spawnSync } = require('child_process');
  const candidates = [
    process.env.WHISPER_PYTHON,
    '/Library/Frameworks/Python.framework/Versions/3.11/bin/python3',
    '/usr/local/bin/python3',
    '/opt/homebrew/bin/python3',
    'python3',
  ].filter(Boolean) as string[];
  for (const candidate of candidates) {
    const probe = spawnSync(candidate, ['-c', 'import sys, whisper; print(sys.executable)'], {
      encoding: 'utf8',
      timeout: 15000,
      env: { ...process.env, PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/bin:${process.env.PATH || ''}` },
    });
    if (probe.status === 0) {
      cachedWhisperPython = candidate;
      const executable = String(probe.stdout || candidate).trim().split('\n').pop() || candidate;
      sendCallback({ log: `ใช้ Python สำหรับ Whisper: ${executable}` });
      return cachedWhisperPython;
    }
  }
  throw new Error('ไม่พบ Python ที่ติดตั้ง openai-whisper ลองติดตั้งด้วย python3 -m pip install -U openai-whisper');
};

const runProcess = (command: string, args: string[], label: string, sendCallback: (obj: any) => void, resConnection: any) => new Promise<void>((resolve, reject) => {
  const { spawn } = require('child_process');
  const env = { ...process.env, PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` };
  const proc = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'], env });
  const onData = (data: Buffer) => {
    const lines = data.toString().split('\n').map(line => line.trim()).filter(Boolean);
    for (const line of lines.slice(-3)) sendCallback({ log: `${label}: ${line}` });
  };
  proc.stdout.on('data', onData);
  proc.stderr.on('data', onData);
  proc.on('close', (code: number | null) => {
    if (code === 0) resolve();
    else reject(new Error(`${label} ล้มเหลว (code ${code})`));
  });
  proc.on('error', reject);
  resConnection.on('close', () => {
    try { proc.kill('SIGKILL'); } catch {}
  });
});

const runWhisper = async (audioPath: string, tempDir: string, model: string, language: string, sendCallback: (obj: any) => void, resConnection: any) => {
  const allowedModels = new Set(['tiny', 'base', 'small', 'medium', 'large-v2', 'large-v3', 'large-v3-turbo', 'turbo']);
  const selectedModel = allowedModels.has(model) ? model : 'large-v3';
  
  let success = false;
  let segments: any[] = [];

  try {
    const whisperCliPath = '/opt/homebrew/bin/whisper-cli';
    const modelName = 'ggml-large-v3-turbo-q5_0.bin';
    const modelPath = path.join(__dirname, '../../public/models', modelName);
    
    if (fs.existsSync(whisperCliPath) && fs.existsSync(modelPath)) {
      sendCallback({ log: `⚡ พบระบบถอดเสียงความเร็วสูง whisper.cpp! เริ่มต้นถอดเสียงทันที...` });
      
      const tempOutPrefix = path.join(tempDir, 'whisper_cpp_out');
      const args = [
        '-m', modelPath,
        '-f', audioPath,
        '-l', language === 'auto' ? 'th' : language,
        '-osrt',
        '-of', tempOutPrefix,
        '--max-len', '30',
        '--split-on-word',
      ];
      
      await runProcess(whisperCliPath, args, 'whisper.cpp', sendCallback, resConnection);
      
      const srtFile = tempOutPrefix + '.srt';
      if (fs.existsSync(srtFile)) {
        const srtContent = fs.readFileSync(srtFile, 'utf8');
        const blocks = srtContent.trim().split(/\r?\n\r?\n/);
        
        const srtTimeToSec = (srtTime: string) => {
          const [h, m, s_ms] = srtTime.split(':');
          const [s, ms] = s_ms.split(',');
          return parseInt(h) * 3600 + parseInt(m) * 60 + parseInt(s) + parseInt(ms) / 1000;
        };

        for (const block of blocks) {
          const lines = block.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
          if (lines.length >= 3) {
            const match = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
            if (match) {
              const start = srtTimeToSec(match[1]);
              const end = srtTimeToSec(match[2]);
              const text = lines.slice(2).join(' ').trim();
              if (text) {
                segments.push({ start, end, text });
              }
            }
          }
        }
        
        if (segments.length > 0) {
          sendCallback({ log: `⚡ [Success] ถอดเสียงความเร็วสูงสำเร็จ! ได้ซับทั้งหมด ${segments.length} ประโยค` });
          return segments;
        }
      }
    }
  } catch (e: any) {
    sendCallback({ log: `whisper.cpp ขัดข้องชั่วคราว: ${e.message || e}. สลับไปใช้ระบบ WhisperX/Python...` });
  }
  
  try {
    sendCallback({ log: `เริ่มต้นใช้งาน WhisperX (สำรอง)...` });
    const finalModel = (selectedModel === 'large-v3-turbo' || selectedModel === 'turbo') ? 'large-v2' : selectedModel;
    const args = [
      audioPath,
      '--model', finalModel,
      '--output_dir', tempDir,
      '--output_format', 'json',
      '--device', 'cpu',
      '--compute_type', 'int8',
      // ข้ามขั้น alignment (wav2vec2) เพราะภาษาไทยไม่มี default align-model → WhisperX จะ crash
      // segment-level timestamps จากการถอดเสียงเพียงพอสำหรับซับไตเติลแล้ว
      '--no_align',
    ];
    if (language && language !== 'auto') args.push('--language', language);

    await runProcess('/opt/homebrew/bin/whisperx', args, `WhisperX ${finalModel}`, sendCallback, resConnection);
    success = true;
  } catch (e: any) {
    sendCallback({ log: `WhisperX สำรองขัดข้อง: ${e.message || e}. กำลังสลับไปใช้ Python openai-whisper...` });
    
    try {
      const whisperPython = findWhisperPython(sendCallback);
      const args = [
        '-m', 'whisper',
        audioPath,
        '--model', selectedModel,
        '--output_dir', tempDir,
        '--output_format', 'json',
        '--task', 'transcribe',
        '--temperature', '0',
        '--beam_size', '5',
        '--best_of', '5',
        '--fp16', 'False',
        '--verbose', 'False',
        '--condition_on_previous_text', 'False',
      ];
      if (language && language !== 'auto') args.push('--language', language);
      await runProcess(whisperPython, args, `Whisper ${selectedModel}`, sendCallback, resConnection);
      success = true;
    } catch (e2: any) {
      sendCallback({ log: `เรียก Whisper Python แพ็กเกจไม่สำเร็จ: ${e2.message || e2}. ลองใช้ global CLI...` });
      
      try {
        const args = [
          audioPath,
          '--model', selectedModel,
          '--output_dir', tempDir,
          '--output_format', 'json',
          '--task', 'transcribe',
          '--temperature', '0',
          '--beam_size', '5',
          '--best_of', '5',
          '--fp16', 'False',
        ];
        if (language && language !== 'auto') args.push('--language', language);
        
        await runProcess('whisper', args, `Whisper CLI ${selectedModel}`, sendCallback, resConnection);
        success = true;
      } catch(e3: any) {
        sendCallback({ log: `เรียก Whisper CLI ไม่สำเร็จ: ${e3.message || e3}` });
        throw new Error('ไม่พบการติดตั้งเครื่องมือถอดเสียง ทั้ง whisper-cli, WhisperX, openai-whisper หรือ whisper CLI บนระบบเครื่องของคุณครับ');
      }
    }
  }
  
  const jsonPath = path.join(tempDir, `${path.parse(audioPath).name}.json`);
  if (!fs.existsSync(jsonPath)) throw new Error('ไม่พบไฟล์ JSON transcript ผลลัพธ์จากการถอดเสียง');
  return readWhisperSegments(jsonPath);
};

// เรียก LLM แบบขอผลลัพธ์ JSON — เลือก provider ได้ ('openrouter' | 'kie')
// Kie.ai ใช้ endpoint แยกตามโมเดล (ตัด vendor prefix ออก) แต่ตอบกลับรูปแบบ OpenAI เหมือนกัน
const callOpenRouterJson = (apiKey: string, model: string, prompt: string, provider: string = 'openrouter') => new Promise<any>((resolve, reject) => {
  const https = require('https');
  const isKie = provider === 'kie';
  const resolvedModel = model || 'google/gemini-2.5-flash';
  const kieModel = resolvedModel.includes('/') ? resolvedModel.split('/').pop()! : resolvedModel;
  const body = JSON.stringify({
    model: isKie ? kieModel : resolvedModel,
    messages: [
      { role: 'system', content: 'You correct Whisper subtitle text or generate viral hook headlines. Return valid JSON only.' },
      { role: 'user', content: prompt },
    ],
    temperature: 0.1,
    max_tokens: 3000,
  });
  const req = https.request({
    hostname: isKie ? 'api.kie.ai' : 'openrouter.ai',
    path: isKie ? `/${kieModel}/v1/chat/completions` : '/api/v1/chat/completions',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'http://localhost:5173',
      'X-Title': 'BulkVideoCreatorApp',
      'Content-Length': Buffer.byteLength(body),
    },
    timeout: 60000,
  }, (response: any) => {
    let raw = '';
    response.on('data', (chunk: Buffer) => { raw += chunk.toString(); });
    response.on('end', () => {
      try {
        const data = JSON.parse(raw || '{}');
        if (data.error) throw new Error(data.error.message || (isKie ? 'Kie.ai error' : 'OpenRouter error'));
        const content = String(data.choices?.[0]?.message?.content || '').trim();
        const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1] || content;
        const start = Math.min(...[fenced.indexOf('['), fenced.indexOf('{')].filter(index => index >= 0));
        if (!Number.isFinite(start)) throw new Error('AI ไม่ได้ตอบ JSON');
        const candidate = fenced.slice(start);
        const end = Math.max(candidate.lastIndexOf(']'), candidate.lastIndexOf('}'));
        resolve(JSON.parse(candidate.slice(0, end + 1)));
      } catch (e) {
        reject(e);
      }
    });
  });
  req.on('error', reject);
  req.on('timeout', () => {
    req.destroy(new Error(isKie ? 'Kie.ai timeout' : 'OpenRouter timeout'));
  });
  req.write(body);
  req.end();
});

const generateAiHeadline = async (scriptText: string, apiKey: string, llmProvider: string = 'openrouter') => {
  if (!apiKey || !scriptText.trim()) return [];
  // คิดพาดหัว 3 สไตล์ตามลำดับ: 1) สุขุม/สารคดี/ปรัชญา (สไตล์เจ้าของช่อง) 2) Clickbait 3) บอกประโยชน์ตรงๆ
  const prompt = `คุณเป็นนักการตลาดสายคอนเทนต์ ขายของบน TikTok/Reels/Shopee
จากเนื้อหา/สคริปต์วิดีโอต่อไปนี้ ให้คิด "พาดหัว (Hook) ภาษาไทย" 3 แบบ แบบละ 1 ข้อ เรียงตามลำดับนี้เป๊ะ ๆ:

1) สไตล์สุขุม/สารคดี/ปรัชญา — กวนแบบผู้ใหญ่ ชวนสงสัย ไม่ขายของตรง ๆ เปรียบเปรยเกินจริงนิด ๆ
   ตัวอย่างโทนที่ต้องการ:
   - "ศัตรูตัวนี้โจมตีคุณตั้งแต่เกิด"
   - "การออกจากบ้านโดยไม่ป้องกันผิว คือการพนันรูปแบบหนึ่ง"
   - "ดวงอาทิตย์ไม่ได้เกลียดคุณ...แต่มันก็ไม่ได้ปรานีคุณ"
2) สไตล์ Clickbait — เร้าอารมณ์ อยากกดดูทันที ใช้ตัวเลข/คำเกินจริงนิด ๆ ความอยากรู้สูง
3) สไตล์บอกประโยชน์สินค้าตรง ๆ — ชัดเจนว่าได้อะไร แก้ปัญหาอะไร เข้าใจง่าย

กฎ:
- แต่ละพาดหัวสั้น กระชับ ไม่เกินประมาณ 14 คำ ภาษาไทย
- ส่งกลับเป็น JSON Array ของสตริง "3 ตัวเท่านั้น" เรียงตามลำดับ 1,2,3 เช่น ["...","...","..."]
- ห้ามมีข้อความเกริ่นนำ/ลงท้าย ห้ามใส่หมายเลขข้อ ห้ามใช้ Markdown code block

เนื้อหา/สคริปต์:
"${scriptText}"`;

  try {
    const data = await callOpenRouterJson(apiKey, 'google/gemini-2.5-flash', prompt, llmProvider);
    if (Array.isArray(data)) return data.map(t => String(t || '').trim()).filter(Boolean);
  } catch(e) {
    console.error('[AI Headline] Failed:', e);
  }
  return [];
};

// เขียนพาดหัวจาก "ข้อมูลสินค้าจริง" (ไม่อิงสคริปต์ตลก) — โทนขายของ Shopee บอกชัดว่าขายอะไร
const generateDbHeadline = async (productName: string, productDetail: string, apiKey: string, count = 3, llmProvider: string = 'openrouter'): Promise<string[]> => {
  const detail = String(productDetail || '').replace(/^"+|"+$/g, '').replace(/^\s*Script/i, '').trim();
  if (!apiKey || !detail) return [];
  const n = Math.max(1, Math.min(5, Number(count) || 3));
  const prompt = `คุณเป็นนักเขียนพาดหัวสินค้าสำหรับ Shopee/TikTok ภาษาไทย
จาก "ข้อมูลสินค้าจริง" ด้านล่าง ให้เขียนพาดหัว (headline) ภาษาไทย ${n} แบบที่ต่างกัน
โดยแต่ละแบบต้อง "บอกชัดว่าขายอะไร" + จุดเด่น 2-3 อย่าง โทนขายของแบบมืออาชีพ

กฎ:
- บอกชนิดสินค้าให้ชัดเจนตั้งแต่ต้นประโยค (เช่น "ถุงมือกันร้อน...", "ที่วางมือถือในรถ...", "พัดลมพกพา...")
- ตามด้วยจุดเด่น/ประโยชน์ คั่นแต่ละวลีด้วยการเว้นวรรค
- กระชับ ประมาณ 6-14 คำ ไม่ตลก ไม่เล่นคำ ไม่ปรัชญา ไม่ clickbait เกินจริง
- อิงจากข้อมูลสินค้าจริงเท่านั้น ห้ามแต่งสรรพคุณที่ไม่มีในข้อมูล
- ห้ามใส่ราคา อีโมจิ แฮชแท็ก หรือหมายเลขข้อ

ตัวอย่างสไตล์ที่ต้องการ (คนละสินค้า):
- "ถุงมือกันร้อนเปิดหม้อข้าว หยิบจับปลอดภัย"
- "ที่วางมือถือในรถ แน่นหนา ไม่หลุดง่าย"
- "พัดลมตั้งโต๊ะมีไฟสว่าง ลมแรงคุ้มค่าสุด"

ชื่อสินค้า (อ้างอิงภายใน): ${productName || '-'}
ข้อมูลสินค้าจริง:
"""${detail.slice(0, 1500)}"""

ตอบกลับเป็น JSON Array ของสตริง ${n} ตัวเท่านั้น เช่น ["...","...","..."] ห้ามมีข้อความอื่น`;

  try {
    const data = await callOpenRouterJson(apiKey, 'google/gemini-2.5-flash', prompt, llmProvider);
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.headlines) ? data.headlines : []);
    return arr.map((t: any) => String(t || '').replace(/^["'\d.\)\-\s]+/, '').trim()).filter(Boolean).slice(0, n);
  } catch (e) {
    console.error('[DB Headline] Failed:', e);
    return [];
  }
};

// เขียน "แคปชั่นโพสต์ขายสั้นๆ" จากข้อมูลสินค้าจริง (ยาวกว่าพาดหัวเล็กน้อย เป็นประโยคชวนซื้อ)
const generateDbCaption = async (productName: string, productDetail: string, apiKey: string, count = 2, llmProvider: string = 'openrouter'): Promise<string[]> => {
  const detail = String(productDetail || '').replace(/^"+|"+$/g, '').replace(/^\s*Script/i, '').trim();
  if (!apiKey || !detail) return [];
  const n = Math.max(1, Math.min(5, Number(count) || 2));
  const prompt = `คุณเป็นนักเขียนแคปชั่นขายของออนไลน์ภาษาไทย
จาก "ข้อมูลสินค้าจริง" ด้านล่าง เขียนแคปชั่นโพสต์ขายสั้นๆ เข้าใจง่าย ${n} แบบที่ต่างกัน

กฎ:
- บอกชัดว่าขายอะไร + จุดเด่น/ประโยชน์ที่ลูกค้าจะได้ โทนขายของเป็นกันเอง ชวนซื้อ
- สั้น กระชับ 1-2 ประโยค (ประมาณ 15-35 คำ) อ่านจบไว
- ใส่อีโมจิได้เล็กน้อย (0-2 ตัว) ปิดท้ายด้วยประโยคชวนกด/ทักสั่งซื้อ
- อิงจากข้อมูลจริงเท่านั้น ห้ามแต่งสรรพคุณเกินจริง ห้ามใส่ราคา
- แต่ละแบบต้องต่างมุมกัน (เช่น เน้นปัญหาที่แก้ / เน้นจุดเด่น / เน้นความคุ้ม)

ชื่อสินค้า (อ้างอิงภายใน): ${productName || '-'}
ข้อมูลสินค้าจริง:
"""${detail.slice(0, 1500)}"""

ตอบกลับเป็น JSON Array ของสตริง ${n} ตัวเท่านั้น เช่น ["...","..."] ห้ามมีข้อความอื่น`;

  try {
    const data = await callOpenRouterJson(apiKey, 'google/gemini-2.5-flash', prompt, llmProvider);
    const arr = Array.isArray(data) ? data : (Array.isArray(data?.captions) ? data.captions : (Array.isArray(data?.headlines) ? data.headlines : []));
    return arr.map((t: any) => String(t || '').trim()).filter(Boolean).slice(0, n);
  } catch (e) {
    console.error('[DB Caption] Failed:', e);
    return [];
  }
};

// parse CSV รองรับ field ที่มี comma/newline ในเครื่องหมายคำพูด (RFC4180 อย่างง่าย)
const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;
  const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
};

// แปลงข้อความ CSV → รายการสินค้า (คอลัมน์: ชื่อในโฟลเดอร์, Link, รายละเอียดสินค้า)
const parseProductCsvText = (text: string) => {
  const rows = parseCsvRows(text).filter(r => r.some(c => c.trim() !== ''));
  if (rows.length === 0) return [];
  const header = rows[0].map(h => h.trim());
  const idxName = header.findIndex(h => h.includes('โฟลเดอร์') || h.toLowerCase().includes('name'));
  const idxLink = header.findIndex(h => h.toLowerCase().includes('link'));
  const idxDetail = header.findIndex(h => h.includes('รายละเอียด') || h.toLowerCase().includes('detail'));
  return rows.slice(1).map(r => ({
    name: (idxName >= 0 ? r[idxName] : r[0] || '').trim(),
    link: (idxLink >= 0 ? r[idxLink] : '').trim(),
    detail: (idxDetail >= 0 ? r[idxDetail] : r[r.length - 1] || '').trim(),
  })).filter(p => p.name);
};
const readProductCsv = (csvPath: string) => parseProductCsvText(fs.readFileSync(csvPath, 'utf-8'));

const polishSubtitleSegments = async (
  segments: Array<{ start: number; end: number; text: string }>,
  apiKey: string,
  model: string,
  language: string,
  sendCallback: (obj: any) => void,
  llmProvider: string = 'openrouter',
) => {
  if (!apiKey || segments.length === 0) return segments;
  const next = [...segments];
  const chunkSize = 32;
  for (let offset = 0; offset < next.length; offset += chunkSize) {
    const chunk = next.slice(offset, offset + chunkSize);
    const payload = chunk.map((segment, index) => ({ i: offset + index, text: segment.text }));
    const prompt = `Correct these Whisper subtitle lines for a video.
Rules:
- Keep the original language (${language === 'th' ? 'Thai' : language === 'en' ? 'English' : 'detected language'}).
- Fix misheard words, spelling mistakes, punctuation, capitalization, and spacing.
- Do not translate.
- Do not add new ideas.
- Keep each line concise for subtitles.
- For Thai language subtitles:
  * Crucially, insert single space characters (' ') at natural Thai word boundaries or semantic phrase boundaries (เว้นวรรคระหว่างคำหรือกลุ่มคำที่มีความหมายสมบูรณ์เพื่อให้อ่านง่าย เช่น 'อยากให้ องค์กร ของเรา ก้าวไปข้างหน้า อย่างมั่นคง และรวดเร็ว').
  * This allows the subtitle wrapping function to split lines cleanly at word spaces, preventing truncated/broken syllables or incorrect spelling splits. Do not leave the entire sentence as a single long contiguous string.
- Return ONLY a JSON array in this exact shape: [{"i":0,"text":"corrected text"}]

Input:
${JSON.stringify(payload)}`;
    sendCallback({ log: `AI กำลังเกลาซับ ${offset + 1}-${offset + chunk.length}/${next.length}` });
    const data = await callOpenRouterJson(apiKey, model, prompt, llmProvider);
    const corrections = Array.isArray(data) ? data : [];
    for (const item of corrections) {
      const index = Number(item.i);
      const text = String(item.text || '').replace(/\s+/g, ' ').trim();
      if (Number.isInteger(index) && next[index] && text) next[index] = { ...next[index], text };
    }
  }
  return next;
};

const collectVideos = (root: string) => {
  const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
  const files: string[] = [];
  const scan = (dir: string) => {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) scan(fullPath);
      else if (stat.isFile() && VIDEO_EXTS.includes(path.extname(entry).toLowerCase())) files.push(fullPath);
    }
  };
  scan(root);
  return files;
};

const normalizeTitleText = (value: string) => {
  return String(value || '')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .slice(0, 3)
    .join('\n');
};

const segmentGraphemes = (str: string): string[] => {
  const regex = /[^\u0e30-\u0e39\u0e47-\u0e4c\u0e4d\u0e4e][\u0e30-\u0e39\u0e47-\u0e4c\u0e4d\u0e4e]*/g;
  return str.match(regex) || Array.from(str);
};

const wrapWord = (word: string, maxChars: number): string[] => {
  const graphemes = segmentGraphemes(word);
  const chunks: string[] = [];
  for (let i = 0; i < graphemes.length; i += maxChars) {
    chunks.push(graphemes.slice(i, i + maxChars).join(''));
  }
  return chunks;
};

const wrapTitleLine = (line: string, maxChars: number) => {
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
};

const makeTitle = (fileName: string, customTitle?: string) => {
  const custom = normalizeTitleText(customTitle || '');
  if (custom) {
    const wrapped = custom
      .split('\n')
      .flatMap(line => wrapTitleLine(line, 26))
      .slice(0, 3)
      .join('\n');
    return wrapped || custom;
  }
  const base = path.parse(fileName).name
    .replace(/[._-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const source = base || 'Avatar Clip';
  const splitWords = source.split(' ').filter(Boolean);
  const charMode = splitWords.length <= 1;
  const words = charMode ? Array.from(source) : splitWords;
  const maxLine = source.length > 42 ? 20 : 16;
  const lines: string[] = [];
  let current = '';
  for (const word of words.length ? words : Array.from(source)) {
    const next = current ? `${current}${charMode ? '' : ' '}${word}` : word;
    if (Array.from(next).length > maxLine && current && lines.length < 1) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 2).join('\n');
};

// ── Endpoints for Avatar Vertical Clip Maker ──

app.post('/api/list-folder-videos', (req, res) => {
  try {
    const { folder } = req.body;
    if (!folder) { res.json({ files: [] }); return; }
    const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
    const allFiles = fs.readdirSync(folder);
    const videoFiles = allFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return VIDEO_EXTS.includes(ext);
    });
    res.json({ files: videoFiles });
  } catch (e: any) {
    res.status(500).json({ error: e.message, files: [] });
  }
});

// ── ดึงเฟรมตัวอย่างจากคลิป Avatar (สำหรับเครื่องมือตั้งค่า Crop ใบหน้าวงกลม) ──
//   คืนภาพ base64 + ขนาดจริงของวิดีโอ เพื่อให้ frontend วาง overlay crop ได้ตรง
app.post('/api/extract-avatar-frame', (req, res) => {
  try {
    const body = req.body || {};
    let videoPath = String(body.videoPath || '').trim();
    if (!videoPath && body.folder && body.file) {
      videoPath = path.join(String(body.folder), String(body.file));
    }
    const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
    if (!videoPath || !fs.existsSync(videoPath) || !VIDEO_EXTS.includes(path.extname(videoPath).toLowerCase())) {
      return res.json({ success: false, error: 'ไม่พบไฟล์วิดีโอ' });
    }

    const { spawnSync } = require('child_process');
    const ffmpegPath = getFFmpegPath();
    const env = { ...process.env, PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` };
    const tmpPng = path.join(require('os').tmpdir(), `avatar_frame_${Date.now()}.jpg`);

    // ดึงเฟรมที่ ~0.8 วินาที ย่อกว้างไม่เกิน 640px
    const r = spawnSync(ffmpegPath, [
      '-y', '-ss', '0.8', '-i', videoPath, '-frames:v', '1',
      '-vf', "scale='min(640,iw)':-2", '-q:v', '4', tmpPng,
    ], { env, timeout: 30000 });
    if (r.status !== 0 || !fs.existsSync(tmpPng)) {
      // เผื่อคลิปสั้นกว่า 0.8s ลองที่เฟรมแรก
      spawnSync(ffmpegPath, ['-y', '-i', videoPath, '-frames:v', '1', '-vf', "scale='min(640,iw)':-2", '-q:v', '4', tmpPng], { env, timeout: 30000 });
    }
    if (!fs.existsSync(tmpPng)) return res.json({ success: false, error: 'ดึงเฟรมไม่สำเร็จ' });

    // อ่านขนาดวิดีโอจริงด้วย ffprobe (ถ้ามี) เพื่อบอก aspect
    let vw = 0, vh = 0;
    try {
      const probe = spawnSync(getFFprobePath(), ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', videoPath], { env, encoding: 'utf8', timeout: 15000 });
      const m = String(probe.stdout || '').trim().match(/(\d+)x(\d+)/);
      if (m) { vw = Number(m[1]); vh = Number(m[2]); }
    } catch {}

    const b64 = fs.readFileSync(tmpPng).toString('base64');
    try { fs.unlinkSync(tmpPng); } catch {}
    res.json({ success: true, image: `data:image/jpeg;base64,${b64}`, width: vw, height: vh });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ── โหมด Shopee: ลิสต์โฟลเดอร์ย่อย product/avatar แล้วจับคู่อัตโนมัติจากชื่อ (prefix) ──
//   product subfolder เช่น 001_RiceWarmerGlove
//   avatar subfolder  เช่น 001_RiceWarmerGlove_script1  → ตัด _scriptN ออกแล้วจับกับ product
//   แต่ละ avatar subfolder = 1 คลิป output (footage มาจาก product ที่จับคู่ได้)
app.post('/api/shopee-pair-folders', (req, res) => {
  try {
    const productFolder = String((req.body || {}).productFolder || '').trim();
    const avatarFolder = String((req.body || {}).avatarFolder || '').trim();
    if (!productFolder || !fs.existsSync(productFolder) || !fs.statSync(productFolder).isDirectory()) {
      return res.json({ success: false, error: 'ไม่พบโฟลเดอร์สินค้า', pairs: [], productFolders: [] });
    }
    if (!avatarFolder || !fs.existsSync(avatarFolder) || !fs.statSync(avatarFolder).isDirectory()) {
      return res.json({ success: false, error: 'ไม่พบโฟลเดอร์ Avatar', pairs: [], productFolders: [] });
    }

    const listSubDirs = (root: string) =>
      fs.readdirSync(root)
        .filter(name => !name.startsWith('.') && fs.statSync(path.join(root, name)).isDirectory())
        .sort();

    // ตัด suffix สคริปต์/เวอร์ชัน เพื่อใช้เทียบกับชื่อสินค้า
    const normalizeKey = (name: string) =>
      name.toLowerCase()
        .replace(/[_-]?script\s*\d*$/i, '')
        .replace(/[_-]?v\d+$/i, '')
        .replace(/[_-]+$/,'')
        .trim();
    const numericPrefix = (name: string) => (name.match(/^\s*(\d{1,6})/) || [])[1] || '';

    const productSubs = listSubDirs(productFolder).map(name => {
      const full = path.join(productFolder, name);
      return { name, path: full, key: normalizeKey(name), id: numericPrefix(name), clipCount: collectVideos(full).length };
    });
    const productFolders = productSubs.map(p => ({ name: p.name, path: p.path, clipCount: p.clipCount }));

    // รวบรวม "ชุด Avatar" — รองรับ 2 แบบ:
    //   (ก) โฟลเดอร์ย่อย 1 โฟลเดอร์ = 1 ชุด (ใช้วิดีโอตัวแรกในโฟลเดอร์)
    //   (ข) ไฟล์วิดีโอวางตรงๆ (flat) 1 ไฟล์ = 1 ชุด  ← เช่น 001_RiceWarmerGlove_script1.mp4
    const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
    const avatarUnits: { name: string; videoPath: string; videoDir: string; cacheKey: string }[] = [];
    for (const name of listSubDirs(avatarFolder)) {
      const subPath = path.join(avatarFolder, name);
      const v = collectVideos(subPath)[0] || '';
      avatarUnits.push({ name, videoPath: v, videoDir: v ? path.dirname(v) : subPath, cacheKey: subPath });
    }
    for (const entry of fs.readdirSync(avatarFolder)) {
      if (entry.startsWith('.')) continue;
      const full = path.join(avatarFolder, entry);
      if (!fs.statSync(full).isFile() || !VIDEO_EXTS.includes(path.extname(entry).toLowerCase())) continue;
      avatarUnits.push({ name: path.parse(entry).name, videoPath: full, videoDir: avatarFolder, cacheKey: full });
    }
    avatarUnits.sort((a, b) => a.name.localeCompare(b.name));

    const pairs = avatarUnits.map(unit => {
      const name = unit.name;
      const avatarVideoPath = unit.videoPath;
      const key = normalizeKey(name);
      const id = numericPrefix(name);

      // จับคู่: 1) key ตรงกัน  2) numeric id ตรงกัน  3) ชื่อขึ้นต้นกัน
      let match = productSubs.find(p => p.key === key);
      if (!match && id) match = productSubs.find(p => p.id === id);
      if (!match) match = productSubs.find(p => key.startsWith(p.key) || p.key.startsWith(key));

      return {
        avatarSubfolder: name,
        avatarSubfolderPath: unit.cacheKey,
        avatarVideoFile: avatarVideoPath ? path.basename(avatarVideoPath) : '',
        avatarVideoDir: avatarVideoPath ? path.dirname(avatarVideoPath) : unit.videoDir,
        productSubfolder: match ? match.name : '',
        productSubfolderPath: match ? match.path : '',
        productClipCount: match ? match.clipCount : 0,
        matched: !!match && !!avatarVideoPath,
      };
    });

    res.json({ success: true, pairs, productFolders });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message, pairs: [], productFolders: [] });
  }
});

// ── โหลดฐานข้อมูลสินค้าเริ่มต้นจาก CSV (สินค้า Shopee.csv ที่รากโปรเจกต์) ──
app.get('/api/shopee-product-db', (req, res) => {
  try {
    const custom = String((req.query || {}).path || '').trim();
    // ลำดับความสำคัญ: อันนี้แหละ.csv (ครบ 32 สินค้า) ก่อน แล้วค่อย สินค้า Shopee.csv
    const DEFAULT_CSV_NAMES = ['อันนี้แหละ.csv', 'สินค้า Shopee.csv'];
    const roots = [path.resolve(process.cwd(), '..'), path.resolve(__dirname, '..', '..'), process.cwd()];
    const candidates = custom ? [custom] : DEFAULT_CSV_NAMES.flatMap(n => roots.map(r => path.join(r, n)));
    const found = candidates.find(p => { try { return fs.existsSync(p) && fs.statSync(p).isFile(); } catch { return false; } });
    if (!found) return res.json({ success: false, error: 'ไม่พบไฟล์ CSV เริ่มต้น (สินค้า Shopee.csv)', products: [], source: '' });
    const products = readProductCsv(found);
    res.json({ success: true, products, source: found });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message, products: [], source: '' });
  }
});

// ── เขียนพาดหัวจากฐานข้อมูลสินค้าจริง (ไม่อิงสคริปต์) ──
app.post('/api/shopee-db-headline', async (req, res) => {
  try {
    const { productName, productDetail, openRouterKey, count, llmProvider } = req.body || {};
    if (!openRouterKey) return res.json({ success: false, error: 'ไม่พบ AI API Key (ตั้งค่าในหน้า Settings ก่อน)', headlines: [] });
    if (!String(productDetail || '').trim()) return res.json({ success: false, error: 'ไม่มีข้อมูลสินค้าสำหรับคลิปนี้ในฐานข้อมูล', headlines: [] });
    const headlines = await generateDbHeadline(String(productName || ''), String(productDetail || ''), String(openRouterKey), Number(count) || 3, String(llmProvider || 'openrouter'));
    if (headlines.length === 0) return res.json({ success: false, error: 'AI ไม่ได้ส่งพาดหัวกลับมา ลองใหม่อีกครั้ง', headlines: [] });
    res.json({ success: true, headlines });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message, headlines: [] });
  }
});

// ── ดึงฐานข้อมูลสินค้าจาก Google Sheet (ต้องตั้งแชร์ "ทุกคนที่มีลิงก์ดูได้") ──
app.get('/api/gsheet-products', async (req, res) => {
  try {
    const q: any = req.query || {};
    let id = String(q.id || '').trim();
    let gid = String(q.gid || '').trim();
    const url = String(q.url || '').trim();
    if (url) {
      const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9\-_]+)/);
      const gm = url.match(/[?&#]gid=(\d+)/);
      if (m) id = m[1];
      if (gm) gid = gm[1];
    }
    if (!id) { id = '18sppbH-mkojCxcMhOMz726a8UVwx6jUl-UaXoSHIxi0'; if (!gid) gid = '337821009'; }
    const csvUrl = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
    const resp = await fetch(csvUrl);
    if (!resp.ok) return res.json({ success: false, error: `ดึง Google Sheet ไม่สำเร็จ (HTTP ${resp.status}) — ตรวจว่าตั้งค่าแชร์เป็น "ทุกคนที่มีลิงก์ดูได้"`, products: [] });
    const text = await resp.text();
    if (/^\s*<(!doctype|html)/i.test(text)) return res.json({ success: false, error: 'Sheet ไม่ได้เปิดสาธารณะ (ได้หน้า HTML แทน CSV) — ตั้งค่าแชร์เป็นดูได้ทุกคนที่มีลิงก์', products: [] });
    const products = parseProductCsvText(text);
    if (products.length === 0) return res.json({ success: false, error: 'ไม่พบข้อมูลสินค้าใน Sheet (ต้องมีหัวคอลัมน์ ชื่อในโฟลเดอร์/รายละเอียดสินค้า)', products: [] });
    res.json({ success: true, products, source: csvUrl });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message, products: [] });
  }
});

// ── เขียนแคปชั่นโพสต์ขายสั้นๆ จากข้อมูลสินค้าจริง (ใช้ในโหมด Shopee ของ Workflow Automator) ──
app.post('/api/shopee-caption', async (req, res) => {
  try {
    const { productName, productDetail, openRouterKey, count, llmProvider } = req.body || {};
    if (!openRouterKey) return res.json({ success: false, error: 'ไม่พบ AI API Key (ตั้งค่าก่อน)', captions: [] });
    if (!String(productDetail || '').trim()) return res.json({ success: false, error: 'ไม่มีข้อมูลสินค้าสำหรับไฟล์นี้', captions: [] });
    const captions = await generateDbCaption(String(productName || ''), String(productDetail || ''), String(openRouterKey), Number(count) || 2, String(llmProvider || 'openrouter'));
    if (captions.length === 0) return res.json({ success: false, error: 'AI ไม่ได้ส่งแคปชั่นกลับมา ลองใหม่อีกครั้ง', captions: [] });
    res.json({ success: true, captions });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message, captions: [] });
  }
});

app.post('/api/pick-file', (req, res) => {
  let prompt = 'เลือกไฟล์';
  if (req.body && req.body.prompt) prompt = req.body.prompt;
  const safePrompt = prompt.replace(/'/g, '’');
  try {
    const result = execSync(
      `osascript -e 'POSIX path of (choose file with prompt "${safePrompt}")'`,
      { encoding: 'utf-8', timeout: 60000 }
    ).trim();
    res.json({ success: true, file: result });
  } catch {
    res.json({ success: false, cancelled: true });
  }
});

app.post('/api/generate-avatar-headline', (req, res) => {
  // Disable Node.js default request timeout (2 min) to prevent killing long-running processes
  req.setTimeout(0);
  res.setTimeout(0);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const send = (obj: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch {}
    }
  };

  let tempDir = '';
  const { avatarFolder, avatarFile, openRouterKey, llmProvider } = req.body;
  
  (async () => {
    try {
      if (!avatarFolder || !fs.existsSync(avatarFolder)) throw new Error('ไม่พบโฟลเดอร์ Avatar');
      const avatarPath = path.join(avatarFolder, avatarFile);
      if (!fs.existsSync(avatarPath)) throw new Error('ไม่พบไฟล์ Avatar');
      if (!openRouterKey) throw new Error('ไม่พบ OpenRouter Key ในการเรียกใช้ AI');

      send({ status: 'extracting', log: '🎬 [1/3] เริ่มแยกเสียงสำหรับวิเคราะห์พาดหัว...' });

      tempDir = path.join(avatarFolder, `.headline_temp_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      const tempAudioPath = path.join(tempDir, 'audio.wav');
      
      const { spawnSync } = require('child_process');
      spawnSync(getFFmpegPath(), [
        '-y',
        '-i', avatarPath,
        '-vn',
        '-ar', '16000',
        '-ac', '1',
        '-c:a', 'pcm_s16le',
        tempAudioPath
      ], { timeout: 30000 });

      if (!fs.existsSync(tempAudioPath)) {
        throw new Error('ไม่สามารถแยกเสียงเพื่อวิเคราะห์หัวข้อได้');
      }

      send({ status: 'transcribing', log: '🎙️ [2/3] เริ่มการถอดเสียงเป็นข้อความด้วย Whisper...' });

      const segments = await runWhisper(tempAudioPath, tempDir, 'large-v3-turbo', 'th', (obj: any) => {
        send({ status: 'transcribing', log: obj.log || '' });
      }, res);
      const transcriptText = segments.map((s: any) => s.text).join(' ');

      if (!transcriptText.trim()) {
        throw new Error('ไม่พบคำพูดในวิดีโอ Avatar นี้ จึงไม่สามารถคิดหัวข้อได้');
      }

      send({ status: 'generating_headline', log: '💡 [3/3] กำลังวิเคราะห์สคริปต์และสร้างพาดหัวดึงดูดใจ...' });

      const headlines = await generateAiHeadline(transcriptText, openRouterKey, String(llmProvider || 'openrouter'));

      send({
        success: true,
        status: 'done',
        log: '✅ เสร็จสิ้นขั้นตอนการดึงพาดหัว AI และถอดซับ!',
        transcript: transcriptText,
        segments: segments,
        headlines: headlines.length >= 3 ? headlines : [
          'พาดหัวคลิปดึงดูดใจ 1',
          'พาดหัวคลิปดึงดูดใจ 2',
          'พาดหัวคลิปดึงดูดใจ 3'
        ]
      });
      res.end();

    } catch(e: any) {
      send({ success: false, error: e.message || String(e) });
      res.end();
    } finally {
      if (tempDir && fs.existsSync(tempDir)) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch(e){}
      }
    }
  })();
});

app.post('/api/render-avatar-vertical-clip', (req, res) => {
  // Disable Node.js default request timeout (2 min) to prevent killing long-running ffmpeg processes
  req.setTimeout(0);
  res.setTimeout(0);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { spawn } = require('child_process');
  const ffmpegPath = getFFmpegPath();
  const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
  const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const OUT_W = 1080;
  const OUT_H = 1920;
  // โหมด split: ความสูง footage (บน) / Avatar (ล่าง) — ปรับได้ผ่าน footageRatioPct (กำหนดค่าจริงด้านล่าง)
  let TOP_H = 1040;
  let AVATAR_H = OUT_H - TOP_H;

  const send = (obj: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch {}
    }
  };
  
  const runFfmpeg = (args: string[], label: string) => new Promise<void>((resolve, reject) => {
    const env = { ...process.env, PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` };
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'], env });
    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match) send({ log: `${label} ${match[1]}` });
    });
    proc.on('close', (code: number | null) => {
      if (code === 0) resolve();
      else reject(new Error(`${label} ล้มเหลว (ffmpeg code ${code})`));
    });
    proc.on('error', reject);
    res.on('close', () => {
      try { proc.kill('SIGKILL'); } catch {}
    });
  });

  let tempDir = '';
  const payload = req.body || {};
  
  (async () => {
    try {
      const avatarFolder = String(payload.avatarFolder || '').trim();
      const avatarFile = String(payload.avatarFile || '').trim();
      const footageFolder = String(payload.footageFolder || '').trim();
      const outputFolder = String(payload.outputFolder || '').trim();
      const bgmFile = String(payload.bgmFile || '').trim();
      const bgmVolume = Math.max(0, Math.min(1, Number(payload.bgmVolume ?? 0.08)));
      let customTitleText = String(payload.titleText || '').trim();
      
      const isVerticalAvatar = !!payload.isVerticalAvatar;
      const useGreenScreenKeying = !!payload.useGreenScreenKeying;
      const headlineAiEnabled = !!payload.headlineAiEnabled;

      // ── เลย์เอาต์ Avatar: split | greenscreen-full | bottom-band | circle ──
      // รองรับ payload.avatarLayout โดยตรง และ map ย้อนหลังจาก flag เดิม
      let avatarLayout = String(payload.avatarLayout || '').trim();
      if (!avatarLayout) {
        avatarLayout = isVerticalAvatar ? (useGreenScreenKeying ? 'greenscreen-full' : 'greenscreen-full') : 'split';
      }
      const clampPct = (v: any, def: number, lo: number, hi: number) =>
        Math.max(lo, Math.min(hi, Number(v ?? def)));
      const footageRatioPct = clampPct(payload.footageRatioPct, 54, 30, 75);   // % ความสูง footage (โหมด split)
      const avatarScalePct = clampPct(payload.avatarScalePct, 100, 40, 120);    // % สเกล Avatar (โหมด greenscreen)
      const bandHeightPct = clampPct(payload.bandHeightPct, 32, 15, 60);        // % ความสูงแถบล่าง
      const bandPosYPct = clampPct(payload.bandPosYPct, 0, 0, 40);              // % ระยะห่างจากขอบล่าง
      const circleDiameterPct = clampPct(payload.circleDiameterPct, 38, 18, 70); // % เส้นผ่านศูนย์กลาง (อิงความกว้าง)
      const circlePosXPct = clampPct(payload.circlePosXPct, 50, 0, 100);
      const circlePosYPct = clampPct(payload.circlePosYPct, 72, 0, 100);
      // ── Crop ใบหน้าในวงกลม (ตั้งค่าครั้งเดียวใช้ทุกคลิป) ──
      // size = ด้านของสี่เหลี่ยม crop เทียบกับด้านสั้นของเฟรม (ยิ่งน้อย = ซูมเข้าหน้ามาก)
      const circleCropSizePct = clampPct(payload.circleCropSizePct, 80, 30, 100);
      const circleCropXPct = clampPct(payload.circleCropXPct, 50, 0, 100); // ตำแหน่งซ้าย-ขวาใน source
      const circleCropYPct = clampPct(payload.circleCropYPct, 32, 0, 100);  // ตำแหน่งบน-ล่างใน source (เล็งใบหน้า)

      // โหมด split: คำนวณความสูง footage(บน)/Avatar(ล่าง) จากสัดส่วนที่ผู้ใช้ตั้ง (เป็นเลขคู่กัน 30 fps ปลอดภัย)
      TOP_H = Math.round((OUT_H * footageRatioPct) / 100 / 2) * 2;
      AVATAR_H = OUT_H - TOP_H;

      const subtitleOptions = payload.subtitle && typeof payload.subtitle === 'object' ? payload.subtitle : {};
      const headlineOptions = payload.headlineOptions && typeof payload.headlineOptions === 'object' ? payload.headlineOptions : {};
      const hlStyle = String(headlineOptions.style || 'classic-gold');
      const hlPadding = Math.max(4, Math.min(128, Number(headlineOptions.padding ?? 32)));
      const hlOpacity = Math.max(0, Math.min(100, Number(headlineOptions.opacity ?? 96))) / 100;
      const hlFontSizeOverride = Number(headlineOptions.fontSize ?? 0);
      const hlYPosition = Math.max(50, Math.min(1500, Number(headlineOptions.yPosition ?? 220)));
      const hlFont = String(headlineOptions.font || 'Prompt');
      const hlBoxWidth = Math.max(0, Math.min(OUT_W, Number(headlineOptions.boxWidth ?? 0)));
      const hlBoxHeight = Math.max(0, Math.min(OUT_H, Number(headlineOptions.boxHeight ?? 0)));

      const watermarkOptions = payload.watermark && typeof payload.watermark === 'object' ? payload.watermark : {};
      const watermarkEnabled = !!watermarkOptions.enabled && !!String(watermarkOptions.text || '').trim();

      if (!avatarFolder || !fs.existsSync(avatarFolder) || !fs.statSync(avatarFolder).isDirectory()) throw new Error('ไม่พบโฟลเดอร์ Avatar');
      if (!avatarFile || path.isAbsolute(avatarFile) || path.basename(avatarFile) !== avatarFile) {
        throw new Error('ชื่อไฟล์ Avatar ไม่ถูกต้อง');
      }
      if (!footageFolder || !fs.existsSync(footageFolder) || !fs.statSync(footageFolder).isDirectory()) throw new Error('ไม่พบโฟลเดอร์ footage');
      if (!outputFolder) throw new Error('ยังไม่ได้เลือกโฟลเดอร์ Output');
      fs.mkdirSync(outputFolder, { recursive: true });

      const avatarPath = path.join(avatarFolder, avatarFile);
      if (!fs.existsSync(avatarPath) || !VIDEO_EXTS.includes(path.extname(avatarPath).toLowerCase())) throw new Error('ไม่พบไฟล์ Avatar');
      if (bgmFile && (!fs.existsSync(bgmFile) || !AUDIO_EXTS.includes(path.extname(bgmFile).toLowerCase()))) throw new Error('ไฟล์เสียงพื้นหลังไม่ถูกต้อง');

      const avatarDuration = probeDuration(avatarPath);
      if (!avatarDuration) throw new Error('อ่านความยาวคลิป Avatar ไม่ได้');
      send({ log: `Avatar ยาว ${avatarDuration.toFixed(1)} วินาที` });

      const footageCandidates = collectVideos(footageFolder)
        .map((filePath: string) => ({ filePath, duration: probeDuration(filePath) }))
        .filter((item: any) => item.duration > 0.6);
      if (footageCandidates.length === 0) throw new Error('ไม่พบ footage ที่อ่านความยาวได้');
      send({ log: `พบ footage ใช้งานได้ ${footageCandidates.length} ไฟล์ กำลังสุ่มต่อกันตามความยาวเป๊ะๆ (Dynamic Looping)` });

      tempDir = path.join(outputFolder, `.avatar_vertical_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      const selected: Array<{ filePath: string; start: number; duration: number }> = [];
      let remaining = avatarDuration + 0.4;
      let guard = 0;
      while (remaining > 0.15 && guard < 1500) {
        for (const clip of shuffle(footageCandidates)) {
          if (remaining <= 0.15) break;
          const take = Math.min(remaining, clip.duration, 3 + Math.random() * 4.5);
          const duration = Math.max(0.4, take);
          const maxStart = Math.max(0, clip.duration - duration);
          const start = maxStart > 0 ? Math.random() * maxStart : 0;
          selected.push({ filePath: clip.filePath, start, duration });
          remaining -= duration;
        }
        guard++;
      }
      if (selected.length === 0 || remaining > 0.3) throw new Error('สุ่ม footage ให้ยาวเท่า Avatar ไม่สำเร็จ');
      send({ log: `เลือก footage ${selected.length} ชิ้น รวมประมาณ ${(avatarDuration + 0.4 - remaining).toFixed(1)} วินาที` });

      const segmentPaths: string[] = [];
      const bRollW = OUT_W;
      // footage เต็มจอสำหรับเลย์เอาต์ที่ Avatar ลอยทับ (greenscreen/แถบล่าง/วงกลม); split ใช้แค่ส่วนบน
      const footageFullFrame = avatarLayout !== 'split';
      const bRollH = footageFullFrame ? OUT_H : TOP_H;
      const topVf = `scale=${bRollW}:${bRollH}:force_original_aspect_ratio=increase,crop=${bRollW}:${bRollH},setsar=1,fps=30,format=yuv420p`;
      
      for (let i = 0; i < selected.length; i++) {
        const clip = selected[i];
        const segmentPath = path.join(tempDir, `top_${String(i + 1).padStart(3, '0')}.mp4`);
        segmentPaths.push(segmentPath);
        send({ log: `เตรียม footage ${i + 1}/${selected.length}: ${path.basename(clip.filePath)}` });
        await runFfmpeg([
          '-y',
          '-ss', clip.start.toFixed(2),
          '-t', clip.duration.toFixed(2),
          '-i', clip.filePath,
          '-map', '0:v:0',
          '-an',
          '-vf', topVf,
          '-c:v', 'libx264',
          '-preset', 'veryfast',
          '-crf', '21',
          '-movflags', '+faststart',
          segmentPath,
        ], `footage ${i + 1}/${selected.length}`);
      }

      const listPath = path.join(tempDir, 'top_concat.txt');
      fs.writeFileSync(listPath, segmentPaths.map(segmentPath => `file '${escapeConcatPath(segmentPath)}'`).join('\n'));
      const topPath = path.join(tempDir, 'top_montage.mp4');
      send({ log: 'รวม B-Roll Background สำเร็จ' });
      await runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', topPath], 'concat footage');

      const avatarHasAudio = hasAudioStream(avatarPath);
      let subtitleSegments: any[] = [];
      
      if (subtitleOptions.precomputedSubtitles && Array.isArray(subtitleOptions.precomputedSubtitles) && subtitleOptions.precomputedSubtitles.length > 0) {
        send({ log: 'ใช้คำบรรยายซับไทยที่บันทึกอยู่ในระบบ (ข้ามขั้นตอนแปลงเสียง Whisper)' });
        subtitleSegments = subtitleOptions.precomputedSubtitles;
      } else if (avatarHasAudio && (subtitleOptions.enabled || headlineAiEnabled)) {
        const subtitleAudioPath = path.join(tempDir, 'avatar_audio.wav');
        send({ log: 'แยกเสียง Avatar สำหรับถอดเสียง...' });
        await runFfmpeg([
          '-y',
          '-i', avatarPath,
          '-vn',
          '-ar', '16000',
          '-ac', '1',
          '-c:a', 'pcm_s16le',
          subtitleAudioPath,
        ], 'extract subtitle audio');

        send({ log: `เริ่มถอดเสียงด้วย Whisper: ${subtitleOptions.model || 'large-v3'}` });
        subtitleSegments = await runWhisper(
          subtitleAudioPath,
          tempDir,
          String(subtitleOptions.model || 'large-v3'),
          String(subtitleOptions.language || 'th'),
          send,
          res
        );
        send({ log: `Whisper ได้ซับ ${subtitleSegments.length} ช่วง` });
      }

      const transcriptText = subtitleSegments.map(s => s.text).join(' ');
      if (headlineAiEnabled && !customTitleText && transcriptText.trim() && subtitleOptions.openRouterKey) {
        send({ log: 'กำลังเรียก AI ให้เลือกพาดหัว (Hook) ที่ดีที่สุดอัตโนมัติ...' });
        const aiHooks = await generateAiHeadline(transcriptText, subtitleOptions.openRouterKey, String(subtitleOptions.llmProvider || 'openrouter'));
        if (aiHooks.length > 0) {
          customTitleText = aiHooks[0];
          send({ log: `✨ ได้พาดหัวที่ดีที่สุดจาก AI: "${customTitleText}"` });
        }
      }

      const titleAssPath = path.join(tempDir, 'title.ass');
      const titleText = makeTitle(avatarFile, customTitleText);
      const titleLines = titleText.split('\n').filter(Boolean);
      const longestLine = Math.max(...titleLines.map(line => segmentGraphemes(line).length), 1);
      const fontSize = Math.max(42, Math.min(82, Math.floor(1500 / longestLine)));
      const hlFontSize = hlFontSizeOverride > 0 ? hlFontSizeOverride : fontSize;
      // WYSIWYG: ใช้ตำแหน่ง Y ตามที่ผู้ใช้ตั้ง/ลากในพรีวิวตรง ๆ (เลิก override ค่า default
      // เป็น 416 ซึ่งทำให้ output ไม่ตรงกับพรีวิว)
      const finalY = hlYPosition;

      fs.writeFileSync(
        titleAssPath,
        buildTitleAss(
          titleText,
          hlStyle,
          hlFontSize,
          hlPadding,
          hlOpacity,
          finalY,
          hlFont,
          hlBoxWidth,
          hlBoxHeight
        ),
        'utf8'
      );

      let safeHeadlineName = '';
      if (customTitleText) {
        safeHeadlineName = customTitleText
          .replace(/[\r\n]+/g, ' ')
          .replace(/[\\/:*?"<>|#%&{}$@=!`']/g, '')
          .replace(/\s+/g, '_')
          .trim()
          .substring(0, 100);
      }

      const safeBase = cleanFilePart(path.parse(avatarFile).name);
      // ถ้าระบุ outputName มา (เช่นโหมด Shopee) → ตั้งชื่อตามนั้นเลย (ชื่อเดียวกับคลิป Avatar)
      const explicitOutName = cleanFilePart(String(payload.outputName || '').trim());
      const finalBase = (String(payload.outputName || '').trim() ? explicitOutName : (safeHeadlineName || safeBase));
      const finalOutName = `${finalBase}_output.mp4`;
      const outputPath = path.join(outputFolder, finalOutName);

      let subtitleAssPath = '';
      if (subtitleOptions.enabled && subtitleSegments.length > 0) {
        if (subtitleOptions.aiPolish && subtitleOptions.openRouterKey) {
          try {
            subtitleSegments = await polishSubtitleSegments(
              subtitleSegments,
              String(subtitleOptions.openRouterKey),
              String(subtitleOptions.openRouterModel || 'google/gemini-2.5-flash'),
              String(subtitleOptions.language || 'th'),
              send,
              String(subtitleOptions.llmProvider || 'openrouter'),
            );
            send({ log: 'AI ช่วยตรวจและเกลาคำผิดของภาษาไทยเรียบร้อย (รักษา Timestamp เดิม)' });
          } catch (e: any) {
            send({ log: `AI เกลาซับไม่สำเร็จ ใช้ผล Whisper เดิม: ${e.message || e}` });
          }
        }

        subtitleAssPath = path.join(tempDir, 'avatar_subtitles.ass');
        fs.writeFileSync(
          subtitleAssPath,
          buildSubtitleAss(
            subtitleSegments,
            String(subtitleOptions.style || 'bold-yellow'),
            String(subtitleOptions.density || 'short'),
            String(subtitleOptions.position || 'avatar-low'),
            Number(subtitleOptions.fontSize ?? 0),
            Number(subtitleOptions.yPosition ?? 0),
          ),
          'utf8',
        );
        send({ log: `สร้างไฟล์ซับพร้อม burn-in แล้ว (ขนาด: ${Number(subtitleOptions.fontSize ?? 0) || 'เริ่มต้นตามสไตล์'})` });
      }

      let filterParts: string[] = [];
      const fontsDir = escapeFilterPath(path.resolve(__dirname, '../../public/Font_stock'));
      // footage montage = พื้นหลังหลักของทุกเลย์เอาต์
      filterParts.push(`[0:v]trim=duration=${avatarDuration.toFixed(3)},setpts=PTS-STARTPTS,fps=30,format=yuv420p[bg]`);

      if (avatarLayout === 'greenscreen-full') {
        // Avatar เต็มจอ (สเกลได้) ลอยทับ footage — เจาะกรีนสกรีนตามตัวเลือก จัดกึ่งกลางชิดล่าง
        const avatarW = Math.round((OUT_W * avatarScalePct) / 100 / 2) * 2;
        if (useGreenScreenKeying) {
          filterParts.push(`[1:v]colorkey=0x00FF00:0.32:0.08,scale=${avatarW}:-2,setsar=1,fps=30,format=rgba[avatarv]`);
        } else {
          filterParts.push(`[1:v]scale=${avatarW}:-2,setsar=1,fps=30,format=rgba[avatarv]`);
        }
        filterParts.push(`[bg][avatarv]overlay=(W-w)/2:H-h[stacked]`);
      } else if (avatarLayout === 'bottom-band') {
        // คลิป Avatar แนวนอนวางเป็นแถบล่าง บน footage เต็มจอ
        const bandH = Math.round((OUT_H * bandHeightPct) / 100 / 2) * 2;
        const marginBottom = Math.round((OUT_H * bandPosYPct) / 100);
        filterParts.push(`[1:v]scale=${OUT_W}:${bandH}:force_original_aspect_ratio=decrease,setsar=1,fps=30,format=yuv420p[avatarv]`);
        filterParts.push(`[bg][avatarv]overlay=(W-w)/2:H-h-${marginBottom}[stacked]`);
      } else if (avatarLayout === 'circle') {
        // crop Avatar เป็นวงกลม face-cam แล้ววางบน footage เต็มจอ ตามตำแหน่ง X/Y
        const D = Math.round((OUT_W * circleDiameterPct) / 100 / 2) * 2;
        const r = D / 2;
        const cxp = Math.round((OUT_W * circlePosXPct) / 100) - r;
        const cyp = Math.round((OUT_H * circlePosYPct) / 100) - r;
        // crop ใบหน้าตามที่ผู้ใช้ตั้ง — X/Y = ตำแหน่ง "จุดศูนย์กลาง" ของวง (fraction ของเฟรม) ให้ตรงกับวงที่ลากในตัวแก้ไข
        // side = ด้านสั้น(min) × size% ; clamp ไม่ให้ออกนอกเฟรม
        const S = (circleCropSizePct / 100).toFixed(3);
        const CX = (circleCropXPct / 100).toFixed(3);
        const CY = (circleCropYPct / 100).toFixed(3);
        const sideE = `min(iw,ih)*${S}`;
        const cropExpr = `crop=w='${sideE}':h='${sideE}':x='max(0,min(iw-${sideE},iw*${CX}-${sideE}/2))':y='max(0,min(ih-${sideE},ih*${CY}-${sideE}/2))'`;
        filterParts.push(`[1:v]${cropExpr},scale=${D}:${D},setsar=1,fps=30,format=rgba,geq=r='r(X,Y)':g='g(X,Y)':b='b(X,Y)':a='if(lte((X-${r})*(X-${r})+(Y-${r})*(Y-${r}),${r * r}),255,0)'[avatarv]`);
        filterParts.push(`[bg][avatarv]overlay=${cxp}:${cyp}[stacked]`);
      } else {
        // split (ค่าเริ่มต้น): footage บน (สูง TOP_H) / Avatar ล่าง
        filterParts.push(`[1:v]scale=${OUT_W}:${AVATAR_H}:force_original_aspect_ratio=increase,crop=${OUT_W}:${AVATAR_H},setsar=1,fps=30,format=yuv420p[avatarv]`);
        filterParts.push(`color=c=black:s=${OUT_W}x${OUT_H}:d=${avatarDuration.toFixed(3)}[base]`);
        filterParts.push(`[base][bg]overlay=0:0[withtop]`);
        filterParts.push(`[withtop][avatarv]overlay=0:${TOP_H}[stacked]`);
      }

      // เตรียมไฟล์ลายน้ำ (ถ้าเปิด)
      let watermarkAssPath = '';
      if (watermarkEnabled) {
        watermarkAssPath = path.join(tempDir, 'watermark.ass');
        fs.writeFileSync(watermarkAssPath, buildWatermarkAss(String(watermarkOptions.text || ''), {
          mode: String(watermarkOptions.mode || 'random-corners'),
          corner: String(watermarkOptions.corner || 'bottom-right'),
          style: String(watermarkOptions.style || 'faint'),
          opacity: Number(watermarkOptions.opacity ?? 0.35),
          fontSize: Number(watermarkOptions.fontSize ?? 44),
          font: String(watermarkOptions.font || 'Prompt'),
          intervalSec: Number(watermarkOptions.intervalSec ?? 4),
        }, avatarDuration), 'utf8');
        send({ log: `💧 ใส่ลายน้ำ "${String(watermarkOptions.text).trim()}" (โหมด: ${watermarkOptions.mode || 'random-corners'})` });
      }

      // เชนตัวกรอง: พาดหัว → ซับ → ลายน้ำ → [vout]
      filterParts.push(`[stacked]subtitles=filename=${escapeFilterPath(titleAssPath)}:fontsdir=${fontsDir}[titled]`);
      let lastLabel = 'titled';
      if (subtitleAssPath) {
        filterParts.push(`[${lastLabel}]subtitles=filename=${escapeFilterPath(subtitleAssPath)}:fontsdir=${fontsDir}[subbed]`);
        lastLabel = 'subbed';
      }
      if (watermarkAssPath) {
        filterParts.push(`[${lastLabel}]subtitles=filename=${escapeFilterPath(watermarkAssPath)}:fontsdir=${fontsDir}[wm]`);
        lastLabel = 'wm';
      }
      filterParts.push(`[${lastLabel}]format=yuv420p[vout]`);

      const finalArgs = ['-y', '-i', topPath, '-i', avatarPath];
      let audioMapped = false;
      if (bgmFile) finalArgs.push('-stream_loop', '-1', '-i', bgmFile);
      
      if (avatarHasAudio && bgmFile) {
        filterParts.push(`[1:a]volume=1.0,aresample=async=1:first_pts=0[voice]`);
        filterParts.push(`[2:a]volume=${bgmVolume.toFixed(3)},atrim=0:${avatarDuration.toFixed(3)},asetpts=PTS-STARTPTS[bgm]`);
        filterParts.push(`[voice][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`);
        audioMapped = true;
      } else if (!avatarHasAudio && bgmFile) {
        filterParts.push(`[2:a]volume=${bgmVolume.toFixed(3)},atrim=0:${avatarDuration.toFixed(3)},asetpts=PTS-STARTPTS[aout]`);
        audioMapped = true;
      }

      finalArgs.push('-filter_complex', filterParts.join(';'), '-map', '[vout]');
      if (audioMapped) {
        finalArgs.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '160k');
      } else if (avatarHasAudio) {
        finalArgs.push('-map', '1:a:0', '-c:a', 'aac', '-b:a', '160k');
      } else {
        finalArgs.push('-an');
      }

      finalArgs.push(
        '-t', avatarDuration.toFixed(3),
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '20',
        '-r', '30',
        '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart',
        '-shortest',
        outputPath,
      );

      send({ log: `ใส่หัวข้อ "${titleText.replace(/\n/g, ' / ')}"` });
      if (bgmFile) send({ log: `mix เสียงพื้นหลัง ${path.basename(bgmFile)} ที่ ${(bgmVolume * 100).toFixed(0)}%` });
      send({ log: 'กำลัง render final 1080x1920 (9:16)...' });
      await runFfmpeg(finalArgs, 'render final');

      send({ log: `บันทึกไฟล์เรียบร้อย: ${outputPath}` });
      send({ success: true, filePath: outputPath });
      if (!res.writableEnded) res.end();
    } catch (e: any) {
      send({ error: e.message || String(e) });
      if (!res.writableEnded) res.end();
    } finally {
      if (tempDir) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    }
  })();
});

// ══════════════════════════════════════════════════════════════════════
// ── Quote Video (คลิปคำคม) APIs ──
//   เรนเดอร์ฝั่ง backend: เอา footage ในโฟลเดอร์มาสุ่มต่อ/วน ให้ครบวินาที
//   แล้ว overlay ด้วย PNG โปร่งใส (tint + ตัวอักษร + ไอคอน + โลโก้) ที่ frontend
//   วาดจาก canvas พรีวิวตัวเดียวกัน → ผลลัพธ์ตรงกับพรีวิว 100% (WYSIWYG)
//   มีปุ่ม พัก/เรนเดอร์ต่อ/หยุด ผ่าน SIGSTOP/SIGCONT/SIGKILL
// ══════════════════════════════════════════════════════════════════════
let quoteRenderProcess: any = null;
let quoteRenderPaused = false;
let quoteRenderStopped = false;
let quoteRenderStream: any = null;

app.post('/api/quote-render', (req, res) => {
  // ปิด timeout เริ่มต้นของ Node (2 นาที) กัน ffmpeg ที่รันนานถูกฆ่า
  req.setTimeout(0);
  res.setTimeout(0);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const { spawn } = require('child_process');
  const ffmpegPath = getFFmpegPath();
  const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const OUT_W = 1080;
  const OUT_H = 1920;

  quoteRenderStream = res;
  quoteRenderStopped = false;
  quoteRenderPaused = false;

  const send = (obj: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch {}
    }
  };

  const runFfmpeg = (args: string[], label: string) => new Promise<void>((resolve, reject) => {
    const env = { ...process.env, PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}` };
    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'ignore', 'pipe'], env });
    quoteRenderProcess = proc;
    proc.stderr.on('data', (data: Buffer) => {
      const text = data.toString();
      const match = text.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
      if (match) send({ log: `⚙️ ${label} » ${match[1]}` });
    });
    proc.on('close', (code: number | null) => {
      if (quoteRenderProcess === proc) quoteRenderProcess = null;
      if (quoteRenderStopped) reject(new Error('ถูกหยุดโดยผู้ใช้'));
      else if (code === 0) resolve();
      else reject(new Error(`${label} ล้มเหลว (ffmpeg code ${code})`));
    });
    proc.on('error', reject);
    res.on('close', () => { try { proc.kill('SIGKILL'); } catch {} });
  });

  let tempDir = '';
  const payload = req.body || {};

  (async () => {
    try {
      const footageFolder = String(payload.footageFolder || '').trim();
      const outputFolder = String(payload.outputFolder || '').trim();
      const bgmFile = String(payload.bgmFile || '').trim();
      const bgmVolume = Math.max(0, Math.min(1, Number(payload.bgmVolume ?? 0.15)));
      const durationSec = Math.max(3, Math.min(120, Number(payload.durationSec ?? 15)));

      // items: [{ overlayPng (base64 dataURL หรือ raw), fileNameBase }]
      let items: Array<{ overlayPng: string; fileNameBase: string }> = Array.isArray(payload.items) ? payload.items : [];
      if (items.length === 0 && payload.overlayPng) {
        items = [{ overlayPng: payload.overlayPng, fileNameBase: payload.fileNameBase || 'quote' }];
      }

      if (!footageFolder || !fs.existsSync(footageFolder) || !fs.statSync(footageFolder).isDirectory()) throw new Error('ไม่พบโฟลเดอร์ footage (กรุณาเลือกโฟลเดอร์วิดีโอพื้นหลัง)');
      if (!outputFolder) throw new Error('ยังไม่ได้เลือกโฟลเดอร์ Output');
      if (items.length === 0) throw new Error('ไม่มี overlay สำหรับเรนเดอร์');
      if (bgmFile && (!fs.existsSync(bgmFile) || !AUDIO_EXTS.includes(path.extname(bgmFile).toLowerCase()))) throw new Error('ไฟล์เพลงพื้นหลัง (BGM) ไม่ถูกต้อง');
      fs.mkdirSync(outputFolder, { recursive: true });

      const footageCandidates = collectVideos(footageFolder)
        .map((filePath: string) => ({ filePath, duration: probeDuration(filePath) }))
        .filter((item: any) => item.duration > 0.6);
      if (footageCandidates.length === 0) throw new Error('ไม่พบไฟล์วิดีโอที่อ่านความยาวได้ในโฟลเดอร์ footage');
      send({ log: `📂 พบ footage ใช้งานได้ ${footageCandidates.length} ไฟล์ | เป้าหมาย ${durationSec} วินาที/คลิป` });

      tempDir = path.join(outputFolder, `.quote_render_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      send({ total: items.length, log: `🚀 เริ่มเรนเดอร์ทั้งหมด ${items.length} คลิป` });

      const savedFiles: string[] = [];
      for (let idx = 0; idx < items.length; idx++) {
        if (quoteRenderStopped) break;
        const item = items[idx];
        const safeBase = cleanFilePart(item.fileNameBase || `quote_${idx + 1}`);
        send({ progress: idx + 1, log: `──────── 🎬 คลิป ${idx + 1}/${items.length}: ${safeBase} ────────` });

        // 1) เขียน overlay PNG ลง temp
        const overlayPath = path.join(tempDir, `overlay_${idx}.png`);
        const b64 = String(item.overlayPng || '').replace(/^data:image\/\w+;base64,/, '');
        fs.writeFileSync(overlayPath, Buffer.from(b64, 'base64'));

        // 2) สุ่ม footage ต่อกันให้ยาวครบ durationSec (Dynamic Looping)
        send({ log: `🎲 สุ่มเรียงคลิปพื้นหลังให้ครบ ${durationSec} วินาที...` });
        const selected: Array<{ filePath: string; start: number; duration: number }> = [];
        let remaining = durationSec + 0.4;
        let guard = 0;
        while (remaining > 0.15 && guard < 1500) {
          for (const clip of shuffle(footageCandidates)) {
            if (remaining <= 0.15) break;
            const take = Math.min(remaining, clip.duration, 3 + Math.random() * 4.5);
            const dur = Math.max(0.4, take);
            const maxStart = Math.max(0, clip.duration - dur);
            const start = maxStart > 0 ? Math.random() * maxStart : 0;
            selected.push({ filePath: clip.filePath, start, duration: dur });
            remaining -= dur;
          }
          guard++;
        }
        if (selected.length === 0) throw new Error('สุ่ม footage ให้ครบความยาวไม่สำเร็จ');

        // 3) เตรียม segment scale/crop เป็น 1080x1920
        const segVf = `scale=${OUT_W}:${OUT_H}:force_original_aspect_ratio=increase,crop=${OUT_W}:${OUT_H},setsar=1,fps=30,format=yuv420p`;
        const segmentPaths: string[] = [];
        for (let i = 0; i < selected.length; i++) {
          if (quoteRenderStopped) break;
          const clip = selected[i];
          const segPath = path.join(tempDir, `seg_${idx}_${String(i + 1).padStart(3, '0')}.mp4`);
          segmentPaths.push(segPath);
          await runFfmpeg([
            '-y',
            '-ss', clip.start.toFixed(2),
            '-t', clip.duration.toFixed(2),
            '-i', clip.filePath,
            '-map', '0:v:0',
            '-an',
            '-vf', segVf,
            '-c:v', 'libx264',
            '-preset', 'veryfast',
            '-crf', '21',
            '-movflags', '+faststart',
            segPath,
          ], `เตรียมพื้นหลัง ${i + 1}/${selected.length}`);
        }
        if (quoteRenderStopped) break;

        // 4) concat segment เป็นพื้นหลังตัวเดียว
        const listPath = path.join(tempDir, `concat_${idx}.txt`);
        fs.writeFileSync(listPath, segmentPaths.map(p => `file '${escapeConcatPath(p)}'`).join('\n'));
        const bgPath = path.join(tempDir, `bg_${idx}.mp4`);
        await runFfmpeg(['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', bgPath], 'รวมคลิปพื้นหลัง');
        if (quoteRenderStopped) break;

        // 5) composite overlay (+BGM) แล้วตัดที่ durationSec
        const outputPath = path.join(outputFolder, `${safeBase}.mp4`);
        const finalArgs = ['-y', '-i', bgPath, '-i', overlayPath];
        if (bgmFile) finalArgs.push('-stream_loop', '-1', '-i', bgmFile);
        const filterParts: string[] = [`[0:v][1:v]overlay=0:0:format=auto[vout]`];
        if (bgmFile) {
          filterParts.push(`[2:a]volume=${bgmVolume.toFixed(3)},atrim=0:${durationSec.toFixed(3)},asetpts=PTS-STARTPTS[aout]`);
        }
        finalArgs.push('-filter_complex', filterParts.join(';'), '-map', '[vout]');
        if (bgmFile) finalArgs.push('-map', '[aout]', '-c:a', 'aac', '-b:a', '160k');
        else finalArgs.push('-an');
        finalArgs.push(
          '-t', durationSec.toFixed(3),
          '-c:v', 'libx264',
          '-preset', 'fast',
          '-crf', '20',
          '-r', '30',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-shortest',
          outputPath,
        );
        send({ log: `🎨 ประกอบตัวอักษร + พื้นหลัง${bgmFile ? ' + เพลง BGM' : ''}...` });
        await runFfmpeg(finalArgs, `เรนเดอร์ ${idx + 1}/${items.length}`);

        // ลบ temp ของคลิปนี้
        for (const p of segmentPaths) { try { fs.rmSync(p, { force: true }); } catch {} }
        try { fs.rmSync(bgPath, { force: true }); } catch {}
        try { fs.rmSync(overlayPath, { force: true }); } catch {}
        try { fs.rmSync(listPath, { force: true }); } catch {}

        savedFiles.push(outputPath);
        send({ done: idx + 1, filePath: outputPath, log: `✅ บันทึกแล้ว: ${outputPath}` });
      }

      if (quoteRenderStopped) {
        send({ error: 'ถูกหยุดโดยผู้ใช้' });
      } else {
        send({ success: true, files: savedFiles, log: `🎉 เรนเดอร์ครบ ${savedFiles.length} คลิปเรียบร้อย!` });
      }
      if (!res.writableEnded) res.end();
    } catch (e: any) {
      send({ error: e.message || String(e) });
      if (!res.writableEnded) res.end();
    } finally {
      quoteRenderProcess = null;
      quoteRenderStream = null;
      if (tempDir) {
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    }
  })();
});

const quotePauseHandler = (_req: any, res: any) => {
  quoteRenderPaused = true;
  if (quoteRenderProcess) { try { quoteRenderProcess.kill('SIGSTOP'); } catch {} }
  if (quoteRenderStream) { try { quoteRenderStream.write(`data: ${JSON.stringify({ paused: true, log: '⏸ พักการเรนเดอร์ (ffmpeg หยุดชั่วคราว)' })}\n\n`); } catch {} }
  res.json({ success: true });
};
app.post('/api/quote-render-pause', quotePauseHandler);

const quoteResumeHandler = (_req: any, res: any) => {
  quoteRenderPaused = false;
  if (quoteRenderProcess) { try { quoteRenderProcess.kill('SIGCONT'); } catch {} }
  if (quoteRenderStream) { try { quoteRenderStream.write(`data: ${JSON.stringify({ resumed: true, log: '▶ เรนเดอร์ต่อ' })}\n\n`); } catch {} }
  res.json({ success: true });
};
app.post('/api/quote-render-resume', quoteResumeHandler);

const quoteStopHandler = (_req: any, res: any) => {
  quoteRenderStopped = true;
  quoteRenderPaused = false;
  if (quoteRenderProcess) {
    try { quoteRenderProcess.kill('SIGCONT'); } catch {} // ปลุกจาก SIGSTOP ก่อนค่อยฆ่า
    try { quoteRenderProcess.kill('SIGKILL'); } catch {}
    quoteRenderProcess = null;
  }
  if (quoteRenderStream) {
    try {
      quoteRenderStream.write(`data: ${JSON.stringify({ error: 'ถูกหยุดโดยผู้ใช้' })}\n\n`);
      quoteRenderStream.end();
    } catch {}
    quoteRenderStream = null;
  }
  res.json({ success: true });
};
app.post('/api/quote-render-stop', quoteStopHandler);

// ── PodcastClip APIs ──
let podcastClipProcess: any = null;
let podcastClipPaused = false;
let podcastClipStopped = false;
let podcastClipStream: any = null;

app.post('/api/save-thumbnail', (req, res) => {
  try {
    const { imageUrl, outputPath: savePath } = req.body;
    if (!imageUrl || !savePath) throw new Error('Missing imageUrl or outputPath');

    // Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const https = require('https');
    const http = require('http');
    const protocol = imageUrl.startsWith('https') ? https : http;
    const fileStream = fs.createWriteStream(savePath);

    protocol.get(imageUrl, (response: any) => {
      // Follow redirects
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        const redirectProtocol = response.headers.location.startsWith('https') ? https : http;
        redirectProtocol.get(response.headers.location, (redirectResponse: any) => {
          redirectResponse.pipe(fileStream);
          fileStream.on('finish', () => {
            fileStream.close();
            res.json({ success: true, filePath: savePath });
          });
        }).on('error', (err: any) => {
          try { fs.unlinkSync(savePath); } catch (e) {}
          res.status(500).json({ success: false, error: err.message });
        });
        return;
      }
      response.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        res.json({ success: true, filePath: savePath });
      });
    }).on('error', (err: any) => {
      try { fs.unlinkSync(savePath); } catch (e) {}
      res.status(500).json({ success: false, error: err.message });
    });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const listAudioFilesHandler = (req: any, res: any) => {
  try {
    const { folder } = req.body;
    if (!folder) { res.json({ files: [] }); return; }
    const AUDIO_EXTS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
    const allFiles = fs.readdirSync(folder);
    const audioFiles = allFiles.filter((f: string) => {
      const ext = path.extname(f).toLowerCase();
      return AUDIO_EXTS.includes(ext);
    });
    res.json({ files: audioFiles });
  } catch (e: any) {
    res.status(500).json({ error: e.message, files: [] });
  }
};
app.post('/api/list-audio-files', listAudioFilesHandler);
app.post('/api/podcastclip-list-audio', listAudioFilesHandler);

const checkFileExistsHandler = (req: any, res: any) => {
  try {
    const { path: filePath } = req.body;
    const exists = filePath ? fs.existsSync(filePath) : false;
    res.json({ success: true, exists });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
};
app.post('/api/check-file-exists', checkFileExistsHandler);
app.post('/api/podcastclip-check-exists', checkFileExistsHandler);

const pauseHandler = (req: any, res: any) => {
  podcastClipPaused = true;
  if (podcastClipProcess) {
    try { podcastClipProcess.kill('SIGSTOP'); } catch (e) {}
  }
  if (podcastClipStream) {
    try { podcastClipStream.write(`data: ${JSON.stringify({ paused: true })}\n\n`); } catch (e) {}
  }
  res.json({ success: true });
};
app.post('/api/stockclip-pause', pauseHandler);
app.post('/api/podcastclip-pause', pauseHandler);

const resumeHandler = (req: any, res: any) => {
  podcastClipPaused = false;
  if (podcastClipProcess) {
    try { podcastClipProcess.kill('SIGCONT'); } catch (e) {}
  }
  if (podcastClipStream) {
    try { podcastClipStream.write(`data: ${JSON.stringify({ resumed: true })}\n\n`); } catch (e) {}
  }
  res.json({ success: true });
};
app.post('/api/stockclip-resume', resumeHandler);
app.post('/api/podcastclip-resume', resumeHandler);

const stopHandler = (req: any, res: any) => {
  podcastClipStopped = true;
  podcastClipPaused = false;
  if (podcastClipProcess) {
    try { podcastClipProcess.kill('SIGKILL'); } catch (e) {}
    podcastClipProcess = null;
  }
  if (podcastClipStream) {
    try {
      podcastClipStream.write(`data: ${JSON.stringify({ error: 'ถูกหยุดโดยผู้ใช้' })}\n\n`);
      podcastClipStream.end();
    } catch (e) {}
    podcastClipStream = null;
  }
  res.json({ success: true });
};
app.post('/api/stockclip-stop', stopHandler);
app.post('/api/podcastclip-stop', stopHandler);

const renderHandler = (req: any, res: any) => {
  try {
    // Disable Node.js default request timeout (2 min) to prevent killing long-running ffmpeg processes
    req.setTimeout(0);
    res.setTimeout(0);

    const { sourceFolder, audioFolder, outputFolder, audioFile, bgMusicPath, bgMusicVolume } = req.body;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    podcastClipStream = res;
    podcastClipStopped = false;
    podcastClipPaused = false;

    const ffmpegPath = getFFmpegPath();
    const { execSync, spawn } = require('child_process');

    const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
    const allVideos: string[] = [];

    function scanDir(dir: string) {
      if (!fs.existsSync(dir)) return;
      const entries = fs.readdirSync(dir);
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          scanDir(fullPath);
        } else if (stat.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          if (VIDEO_EXTS.includes(ext)) {
            allVideos.push(fullPath);
          }
        }
      }
    }

    scanDir(sourceFolder);

    if (allVideos.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'ไม่พบไฟล์วิดีโอในโฟลเดอร์ต้นทาง' })}\n\n`);
      res.end();
      podcastClipStream = null;
      return;
    }

    const audioPath = path.join(audioFolder, audioFile);
    if (!fs.existsSync(audioPath)) {
      res.write(`data: ${JSON.stringify({ error: 'ไม่พบไฟล์เสียง' })}\n\n`);
      res.end();
      podcastClipStream = null;
      return;
    }

    let audioDuration = 0;
    try {
      const { execFileSync } = require('child_process');
      const probeOut = execFileSync(
        getFFprobePath(),
        ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audioPath],
        { encoding: 'utf-8', timeout: 15000 }
      );
      audioDuration = parseFloat(probeOut.trim());
      if (isNaN(audioDuration) || audioDuration <= 0) throw new Error('Invalid duration');
    } catch (e) {
      try {
        const { spawnSync } = require('child_process');
        const ffOut = spawnSync(
          ffmpegPath,
          ['-i', audioPath],
          { encoding: 'utf-8', timeout: 15000 }
        );
        const stderr = ffOut.stderr || '';
        const match = stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2}\.\d{2})/);
        if (match) {
          audioDuration = parseInt(match[1]) * 3600 + parseInt(match[2]) * 60 + parseFloat(match[3]);
        }
        if (isNaN(audioDuration) || audioDuration <= 0) throw new Error('Invalid duration');
      } catch (e2) {
        res.write(`data: ${JSON.stringify({ error: 'ไม่สามารถอ่านความยาวไฟล์เสียงได้' })}\n\n`);
        res.end();
        podcastClipStream = null;
        return;
      }
    }

    res.write(`data: ${JSON.stringify({ log: `ไฟล์เสียงยาว ${audioDuration.toFixed(1)} วินาที | พบ ${allVideos.length} คลิป` })}\n\n`);

    const clipDurations: { path: string; duration: number }[] = [];
    for (const vPath of allVideos) {
      if (podcastClipStopped) { res.end(); podcastClipStream = null; return; }
      try {
        const { execFileSync } = require('child_process');
        const dOut = execFileSync(
          getFFprobePath(),
          ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', vPath],
          { encoding: 'utf-8', timeout: 10000 }
        );
        const dur = parseFloat(dOut.trim());
        if (!isNaN(dur) && dur > 0.5) {
          clipDurations.push({ path: vPath, duration: dur });
        }
      } catch (e) {}
    }

    if (clipDurations.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'ไม่สามารถอ่านความยาวคลิปวิดีโอได้' })}\n\n`);
      res.end();
      podcastClipStream = null;
      return;
    }

    const selectedClips: string[] = [];
    let selectedDuration = 0;
    const targetDuration = audioDuration + 1.0;
    const maxClips = Math.max(clipDurations.length * Math.ceil(targetDuration / Math.max(...clipDurations.map(c => c.duration), 1)) * 3, 1000);

    while (selectedDuration < targetDuration && selectedClips.length < maxClips) {
      const clip = clipDurations[Math.floor(Math.random() * clipDurations.length)];
      selectedClips.push(clip.path);
      selectedDuration += clip.duration;
    }

    if (selectedClips.length === 0) {
      res.write(`data: ${JSON.stringify({ error: 'ไม่สามารถเลือกคลิปได้เพียงพอ' })}\n\n`);
      res.end();
      podcastClipStream = null;
      return;
    }

    const repeatedCount = selectedClips.length - new Set(selectedClips).size;
    res.write(`data: ${JSON.stringify({ log: `สุ่มเลือก ${selectedClips.length} คลิป รวมประมาณ ${selectedDuration.toFixed(1)} วินาที${repeatedCount > 0 ? ` (มีคลิปซ้ำ ${repeatedCount} ครั้ง เพื่อให้ยาวพอเสียง)` : ''}` })}\n\n`);

    let targetW = 1920, targetH = 1080;
    try {
      const { spawnSync } = require('child_process');
      const ffOut = spawnSync(
        ffmpegPath,
        ['-i', selectedClips[0]],
        { encoding: 'utf-8', timeout: 10000 }
      );
      const stderr = ffOut.stderr || '';
      const match = stderr.match(/Video: .*, (\d+)x(\d+)/);
      if (match) {
        targetW = parseInt(match[1]);
        targetH = parseInt(match[2]);
        if (targetW % 2 !== 0) targetW += 1;
        if (targetH % 2 !== 0) targetH += 1;
      }
    } catch (e) {}

    const audioBaseName = path.parse(audioFile).name;
    const safeName = audioBaseName.replace(/[^ก-๙a-zA-Z0-9_-]/g, '_');
    const outputFileName = `${safeName}_output.mp4`;
    const outputPath = path.join(outputFolder, outputFileName);

    const listPath = path.join(outputFolder, `podcastclip_concat_${Date.now()}.txt`);
    let listContent = '';
    for (const videoPath of selectedClips) {
      const escaped = videoPath.replace(/'/g, "'\\''");
      listContent += `file '${escaped}'\n`;
    }
    fs.writeFileSync(listPath, listContent);

    const args: string[] = [];
    args.push('-y');
    args.push('-f', 'concat', '-safe', '0', '-i', listPath);
    args.push('-i', audioPath);

    if (bgMusicPath && fs.existsSync(bgMusicPath)) {
      args.push('-stream_loop', '-1', '-i', bgMusicPath);
    }

    args.push('-map', '0:v:0');

    if (bgMusicPath && fs.existsSync(bgMusicPath)) {
      const vol = typeof bgMusicVolume === 'number' ? bgMusicVolume : 0.15;
      args.push(
        '-filter_complex',
        `[1:a]volume=1.0[voice];[2:a]volume=${vol}[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0[a]`,
        '-map',
        '[a]'
      );
    } else {
      args.push('-map', '1:a:0');
    }

    args.push(
      '-vf',
      `scale=${targetW}:${targetH}:force_original_aspect_ratio=increase,crop=${targetW}:${targetH},setsar=1`
    );

    args.push(
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '22',
      '-r', '24',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-shortest',
      outputPath
    );

    res.write(`data: ${JSON.stringify({ log: 'กำลังเรนเดอร์...' })}\n\n`);

    podcastClipProcess = spawn(ffmpegPath, args);

    podcastClipProcess.stderr.on('data', (data: any) => {
      if (podcastClipStopped) return;
      const lines = data.toString().split('\n');
      for (const l of lines) {
        if (l.trim().length > 0) {
          const timeMatch = l.trim().match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
          if (timeMatch) {
            try {
              if (!res.writableEnded) {
                res.write(`data: ${JSON.stringify({ log: `เรนเดอร์... ${timeMatch[1]}` })}\n\n`);
              }
            } catch (e) {}
          }
        }
      }
    });

    podcastClipProcess.on('close', (code: number) => {
      try { fs.unlinkSync(listPath); } catch (e) {}
      podcastClipProcess = null;
      if (podcastClipStopped) return;
      if (code !== 0 && code !== null) {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({ error: `FFmpeg error (code ${code})` })}\n\n`);
          res.end();
        }
      } else {
        if (!res.writableEnded) {
          res.write(`data: ${JSON.stringify({
            success: true,
            filePath: outputPath,
            duration: audioDuration,
            clipsUsed: selectedClips.length,
          })}\n\n`);
          res.end();
        }
      }
      podcastClipStream = null;
    });

    podcastClipProcess.on('error', (err: any) => {
      try { fs.unlinkSync(listPath); } catch (e) {}
      podcastClipProcess = null;
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      }
      podcastClipStream = null;
    });

    res.on('close', () => {
      if (podcastClipProcess && !podcastClipStopped) {
        podcastClipProcess.kill('SIGKILL');
        podcastClipProcess = null;
      }
      podcastClipStream = null;
    });
  } catch (e: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
    podcastClipStream = null;
    podcastClipProcess = null;
  }
};
app.post('/api/render-stockclip-audio', renderHandler);
app.post('/api/render-podcastclip-audio', renderHandler);

app.post('/api/youtube-keyword-search', async (req, res) => {
  try {
    const { keyword, limit = 12, days = 30 } = req.body;
    const query = String(keyword || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Missing keyword' });
    }

    const resultLimit = Math.max(1, Math.min(100, Number(limit) || 12));
    const daysNum = days !== undefined && days !== null ? Number(days) : 30;
    const dayWindow = isNaN(daysNum) ? 30 : (daysNum <= 0 ? 0 : Math.min(365, daysNum));

    // กำหนดลิมิตตั้งต้นในการค้นหา เพื่อเผื่อสำหรับการกรองคัดออกภายหลัง
    const searchLimit = Math.min(25, Math.max(resultLimit + 5, 15));
    const cutoff = dayWindow > 0 ? Date.now() - dayWindow * 24 * 60 * 60 * 1000 : 0;
    const seen = new Set<string>();
    const rows: any[] = [];

    // ฟังก์ชันแปลงวันที่ของ YouTube
    const parseVideoDate = (video: any) => {
      const raw = String(video.upload_date || video.release_date || '');
      if (/^\d{8}$/.test(raw)) {
        return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000Z`);
      }
      if (typeof video.timestamp === 'number') {
        return new Date(video.timestamp * 1000);
      }
      return null;
    };

    // คำสั่งรันดึงข้อมูลจาก yt-dlp
    const args = [
      '--skip-download',
      '--no-playlist',
      '--no-warnings',
      '--ignore-errors',
      '--print',
      '%(id)s\t%(title)s\t%(webpage_url)s\t%(view_count)s\t%(upload_date)s\t%(timestamp)s\t%(duration)s\t%(channel)s\t%(channel_url)s\t%(thumbnail)s'
    ];

    // ถ้าไม่กำหนดกรอบเวลา ให้ดึงแบบ flat-playlist เพื่อความเร็วสูงและเลี่ยงการโดนบล็อกบอท
    if (dayWindow === 0) {
      args.push('--flat-playlist');
    }

    args.push(`ytsearch${searchLimit}:${query}`);

    // รันคำสั่งย่อยในระบบปฏิบัติการ โดยลองผ่านเบราว์เซอร์ต่าง ๆ เพื่อข้ามการบล็อกบอท
    let rawStdout = '';
    let lastError: any = null;
    const cookieSources = ['chrome', 'safari', 'edge', 'none'];

    for (const source of cookieSources) {
      try {
        const currentArgs = [...args];
        if (source !== 'none') {
          currentArgs.unshift('--cookies-from-browser', source);
        }
        console.log(`[YT Search] Trying search for "${query}" using cookie source: ${source}`);
        rawStdout = execFileSync('yt-dlp', currentArgs, { 
          timeout: 150000, 
          maxBuffer: 1024 * 1024 * 20 
        }).toString();
        
        // ถ้าได้ผลลัพธ์มา (แม้จะไม่ได้ออกทาง stdout เต็มรูปแบบ แต่ไม่เกิดข้อผิดพลาดรุนแรง)
        if (rawStdout.trim()) {
          console.log(`[YT Search] Success with cookie source: ${source}`);
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[YT Search] Cookie source "${source}" failed:`, err.message || err);
        // ถ้าเกิด Error (เช่น exit code 1 จาก yt-dlp) แต่ยังคงมี stdout แสดงว่ามีบางคลิปโหลดได้สำเร็จ
        if (err.stdout && err.stdout.toString().trim()) {
          rawStdout = err.stdout.toString();
          console.log(`[YT Search] Partial success with cookie source: ${source} (exited with error but returned data)`);
          break;
        }
      }
    }

    // หากไม่พบผลลัพธ์ใดๆ เลย และรอบสุดท้ายมี error ให้ throw error นั้น
    if (!rawStdout.trim() && lastError) {
      throw new Error(`ไม่พบผลลัพธ์ในการค้นหา และเกิดข้อผิดพลาด: ${lastError.message || String(lastError)}`);
    }

    // แยกประมวลข้อมูลดิบ
    rawStdout.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => {
        const parts = line.split('\t');
        if (parts.length < 10) return;

        const [
          id, title, url, viewsRaw, uploadDate, 
          timestampRaw, durationRaw, channel, channelUrl, thumbnail
        ] = parts;

        const videoObj = {
          id,
          title,
          upload_date: uploadDate,
          timestamp: timestampRaw && timestampRaw !== 'NA' ? Number(timestampRaw) : null,
          view_count: viewsRaw && viewsRaw !== 'NA' ? Number(viewsRaw) : null,
          duration: durationRaw && durationRaw !== 'NA' ? Number(durationRaw) : null,
          channel,
          channel_url: channelUrl,
          thumbnail,
          webpage_url: url
        };

        const vDate = parseVideoDate(videoObj);
        
        // ตรวจสอบวันที่ของคลิปเทียบกับเกณฑ์วันที่รับได้
        if (cutoff > 0 && (!vDate || vDate.getTime() < cutoff)) return;

        const videoId = videoObj.id || videoObj.webpage_url;
        if (!videoId || seen.has(videoId)) return;
        seen.add(videoId);

        const finalThumbnail = (videoObj.thumbnail && videoObj.thumbnail !== 'NA')
          ? videoObj.thumbnail
          : `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        rows.push({
          id: videoId,
          title: videoObj.title || '(ไม่มีชื่อคลิป)',
          url: videoObj.webpage_url,
          views: videoObj.view_count,
          uploadedAt: videoObj.upload_date && videoObj.upload_date !== 'NA' ? videoObj.upload_date : (vDate ? vDate.toISOString() : ''),
          thumbnail: finalThumbnail,
          duration: videoObj.duration,
          channelName: videoObj.channel,
          channelUrl: videoObj.channel_url
        });
      });

    // เรียงตามยอดวิวสูงสุด
    rows.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

    res.json({
      success: true,
      videos: rows.slice(0, resultLimit),
      searched: true,
      days: dayWindow
    });

  } catch (error: any) {
    console.error('[YT Search Error]:', error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
});

// ── News-to-Video Pipeline APIs (NEW) ──

app.post('/api/news/scrape-images', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    // Fetch the actual article page HTML
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    });
    const html = await response.text();

    // Extract title from <title> or og:title
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
    const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
    const title = ogTitleMatch?.[1] || titleTagMatch?.[1] || '';

    // Extract images
    const images: string[] = [];
    const seen = new Set<string>();

    const addImage = (imgUrl: string) => {
      if (!imgUrl || seen.has(imgUrl)) return;
      // Skip tiny images, icons, tracking pixels, base64, SVGs
      if (imgUrl.startsWith('data:')) return;
      if (imgUrl.endsWith('.svg')) return;
      if (/logo|icon|avatar|badge|button|pixel|tracking|ads|banner-ad/i.test(imgUrl)) return;
      if (imgUrl.length < 10) return;
      // Make absolute URL
      let absoluteUrl = imgUrl;
      if (imgUrl.startsWith('//')) absoluteUrl = 'https:' + imgUrl;
      else if (imgUrl.startsWith('/')) {
        const base = new URL(url);
        absoluteUrl = base.origin + imgUrl;
      } else if (!imgUrl.startsWith('http')) return;
      seen.add(absoluteUrl);
      images.push(absoluteUrl);
    };

    // 1. Open Graph image
    const ogImgMatches = html.matchAll(/<meta[^>]*property=["']og:image[^"']*["'][^>]*content=["']([^"']*)["']/gi);
    for (const m of ogImgMatches) addImage(m[1]);

    // 2. Twitter card image
    const twitterImgMatch = html.match(/<meta[^>]*name=["']twitter:image[^"']*["'][^>]*content=["']([^"']*)["']/i);
    if (twitterImgMatch) addImage(twitterImgMatch[1]);

    // 3. All <img> tags in article/main content
    // First try to find article content area
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
      || html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
      || html.match(/<div[^>]*class=["'][^"']*content[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
    const contentHtml = articleMatch?.[1] || html;

    const imgMatches = contentHtml.matchAll(/<img[^>]*(?:src|data-src|data-lazy-src)=["']([^"']+)["'][^>]*>/gi);
    for (const m of imgMatches) addImage(m[1]);

    // 4. <figure> with <img>
    const figureMatches = contentHtml.matchAll(/<figure[^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["'][^>]*>[\s\S]*?<\/figure>/gi);
    for (const m of figureMatches) addImage(m[1]);

    // 5. <picture> source
    const pictureMatches = contentHtml.matchAll(/<source[^>]*srcset=["']([^"'\s]+)/gi);
    for (const m of pictureMatches) addImage(m[1]);

    res.json({ success: true, images, title, imageCount: images.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/news/download-images', async (req, res) => {
  try {
    const { images, articleId } = req.body;
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'Missing images array' });
    }
    const safeId = (articleId || `news_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_');
    const outputDir = path.resolve(__dirname, `../../public/Image_stock/${safeId}`);
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const localPaths: string[] = [];
    const https = require('https');
    const http = require('http');

    for (let i = 0; i < images.length; i++) {
      try {
        const imgUrl = images[i];
        const ext = (imgUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)?.[0] || '.jpg').toLowerCase();
        const fileName = `img_${String(i + 1).padStart(3, '0')}${ext}`;
        const filePath = path.join(outputDir, fileName);

        await new Promise<void>((resolve, reject) => {
          const protocol = imgUrl.startsWith('https') ? https : http;
          const makeRequest = (requestUrl: string, redirectCount = 0) => {
            if (redirectCount > 5) { reject(new Error('Too many redirects')); return; }
            let refererHeader = '';
            try {
              refererHeader = new URL(requestUrl).origin;
            } catch {}

            protocol.get(requestUrl, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'image/*',
                ...(refererHeader ? { 'Referer': refererHeader } : {}),
              },
              timeout: 15000,
            }, (response: any) => {
              if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                makeRequest(response.headers.location, redirectCount + 1);
                return;
              }
              if (response.statusCode !== 200) { reject(new Error(`HTTP ${response.statusCode}`)); return; }
              const fileStream = fs.createWriteStream(filePath);
              response.pipe(fileStream);
              fileStream.on('finish', () => { fileStream.close(); resolve(); });
              fileStream.on('error', reject);
            }).on('error', reject);
          };
          makeRequest(imgUrl);
        });

        localPaths.push(filePath);
      } catch (imgErr: any) {
        console.warn(`Failed to download image ${i}: ${imgErr.message}`);
      }
    }

    res.json({ success: true, localPaths, outputDir });
  } catch (e: any) {
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/news/build-image-slideshow', (req, res) => {
  try {
    req.setTimeout(0);
    res.setTimeout(0);

    const { imagePaths, targetDuration, outputPath } = req.body;
    if (!imagePaths || !Array.isArray(imagePaths) || imagePaths.length === 0) {
      return res.status(400).json({ error: 'Missing imagePaths array' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const send = (data: any) => {
      if (!res.writableEnded) {
        try { res.write(`data: ${JSON.stringify(data)}\n\n`); } catch {}
      }
    };

    (async () => {
      const tempDir = path.join(path.resolve(__dirname, '../../public/temp_render'), `news_slideshow_${Date.now()}`);
      fs.mkdirSync(tempDir, { recursive: true });

      try {
        const ffmpegPath = getFFmpegPath();
        const { execFileSync: localExecFileSync, spawn: spawnProcess } = require('child_process');
        const duration = Number(targetDuration) || 60;
        const OUT_W = 1080;
        const OUT_H = 1920;
        const FPS = 30;

        // Resolve absolute image paths
        const publicDir = path.resolve(__dirname, '../../public');
        const resolvedPaths = imagePaths.map((p: string) => {
          // If it's already a full absolute path (e.g. /Users/.../public/Image_stock/...)
          if (path.isAbsolute(p) && fs.existsSync(p)) return p;
          // Otherwise treat as web-relative path (e.g. /Image_stock/...) and resolve against public dir
          return path.resolve(publicDir, p.replace(/^\//, ''));
        }).filter((p: string) => fs.existsSync(p));

        if (resolvedPaths.length === 0) {
          send({ error: 'ไม่พบไฟล์รูปภาพที่ระบุ' });
          if (!res.writableEnded) res.end();
          return;
        }

        // Calculate per-image duration and loop images if needed
        const minDurationPerImage = 3; // minimum 3 seconds per image
        let perImageDuration = duration / resolvedPaths.length;
        let imagesToUse = [...resolvedPaths];

        if (perImageDuration < minDurationPerImage) {
          // Loop images to fill duration
          const neededCount = Math.ceil(duration / minDurationPerImage);
          imagesToUse = [];
          for (let i = 0; i < neededCount; i++) {
            imagesToUse.push(resolvedPaths[i % resolvedPaths.length]);
          }
          perImageDuration = duration / imagesToUse.length;
        }

        send({ log: `สร้าง slideshow จากรูป ${resolvedPaths.length} รูป (ใช้ ${imagesToUse.length} ช่อง) ความยาว ${duration} วินาที` });

        // Build each image segment with Ken Burns zoom
        const segmentPaths: string[] = [];
        for (let i = 0; i < imagesToUse.length; i++) {
          const imgPath = imagesToUse[i];
          const segPath = path.join(tempDir, `seg_${String(i).padStart(3, '0')}.mp4`);
          segmentPaths.push(segPath);

          const totalFrames = Math.ceil(perImageDuration * FPS);
          // Alternate between zoom-in and zoom-out for visual variety
          const isZoomIn = i % 2 === 0;
          const zpFilter = isZoomIn
            ? `zoompan=z='min(zoom+0.001,1.3)':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${OUT_W}x${OUT_H}:fps=${FPS}`
            : `zoompan=z='if(eq(on,1),1.3,max(zoom-0.001,1.0))':d=${totalFrames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${OUT_W}x${OUT_H}:fps=${FPS}`;

          const vf = `scale=${OUT_W * 2}:${OUT_H * 2}:force_original_aspect_ratio=increase,crop=${OUT_W * 2}:${OUT_H * 2},${zpFilter},format=yuv420p`;

          send({ log: `เตรียมรูป ${i + 1}/${imagesToUse.length}: ${path.basename(imgPath)} (${isZoomIn ? 'zoom-in' : 'zoom-out'})` });

          localExecFileSync(ffmpegPath, [
            '-y',
            '-loop', '1',
            '-i', imgPath,
            '-t', perImageDuration.toFixed(2),
            '-vf', vf,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-an',
            segPath,
          ], { timeout: 120000, maxBuffer: 1024 * 1024 * 50 });
        }

        // Concatenate segments with xfade transitions
        send({ log: 'รวมรูปทั้งหมดเข้าด้วยกัน (fade transitions)...' });

        const finalOutput = outputPath || path.join(tempDir, 'slideshow_output.mp4');
        const finalDir = path.dirname(finalOutput);
        if (!fs.existsSync(finalDir)) fs.mkdirSync(finalDir, { recursive: true });

        if (segmentPaths.length === 1) {
          // Single segment, just copy
          fs.copyFileSync(segmentPaths[0], finalOutput);
        } else {
          // Use concat for simplicity and reliability (xfade can be fragile with many segments)
          const concatListPath = path.join(tempDir, 'concat_list.txt');
          const concatContent = segmentPaths.map(p => `file '${p.replace(/'/g, "'\\''")}'`).join('\n');
          fs.writeFileSync(concatListPath, concatContent);

          localExecFileSync(ffmpegPath, [
            '-y',
            '-f', 'concat',
            '-safe', '0',
            '-i', concatListPath,
            '-c:v', 'libx264',
            '-preset', 'fast',
            '-crf', '20',
            '-pix_fmt', 'yuv420p',
            '-movflags', '+faststart',
            '-an',
            finalOutput,
          ], { timeout: 600000, maxBuffer: 1024 * 1024 * 100 });
        }

        send({ log: `✅ สร้าง slideshow สำเร็จ: ${finalOutput}` });
        send({ success: true, filePath: finalOutput, duration });
        if (!res.writableEnded) res.end();
      } catch (e: any) {
        send({ error: e.message || String(e) });
        if (!res.writableEnded) res.end();
      } finally {
        // Clean up temp segments
        try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
      }
    })();
  } catch (e: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: e.message }));
  }
});

// ── "ทำคลิปดูเพลินๆ" (Relaxing Clip) ────────────────────────────────────────
// สุ่มฟุตเทจต่อกันให้ครบความยาวเสียง + เสียงพากย์ฟรีในเครื่อง (say) + ซับไทย เผาลงคลิป
// ไม่มีพาดหัว — ออกเป็นวิดีโอแนวตั้ง 9:16

// สร้างไฟล์ .ass จาก segment [{start,end,text}] ตามสไตล์ที่เลือก
function buildRelaxingAss(
  segments: Array<{ start: number; end: number; text: string }>,
  style: any = {}
): string {
  const hexToAss = (hex: string) => {
    if (!hex) return 'FFFFFF';
    const h = hex.replace('#', '').toUpperCase();
    if (h.length !== 6) return 'FFFFFF';
    return `${h.substring(4, 6)}${h.substring(2, 4)}${h.substring(0, 2)}`;
  };
  const fmt = (sec: number) => {
    const s = Math.max(0, sec);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = Math.floor(s % 60);
    const cs = Math.round((s - Math.floor(s)) * 100);
    const cc = Math.min(99, cs);
    return `${h}:${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}.${String(cc).padStart(2, '0')}`;
  };

  const fontName = style.fontName || 'Kanit';
  const fontSize = Math.round((Number(style.fontSize) || 22) * 8 / 3);
  const outline = (style.outlineThickness !== undefined ? Number(style.outlineThickness) : 3) * 2.0;
  const shadow = (style.shadowThickness !== undefined ? Number(style.shadowThickness) : 0.4) * 2.0;
  const pri = hexToAss(style.primaryColor || '#ffffff');
  const out = hexToAss(style.outlineColor || '#000000');
  const marginV = Number(style.marginV) || 150;

  let ass = `[Script Info]
Title: Relaxing Clip Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${fontSize},&H00${pri},&H000000FF,&H00${out},&H64000000,-1,0,0,0,100,100,0,0,1,${outline},${shadow},2,60,60,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  for (const seg of segments) {
    const text = String(seg.text || '').trim().replace(/\r?\n/g, '\\N').replace(/\{/g, '(').replace(/\}/g, ')');
    if (!text) continue;
    const start = Number(seg.start) || 0;
    let end = Number(seg.end);
    if (!Number.isFinite(end) || end <= start) end = start + 2;
    ass += `Dialogue: 0,${fmt(start)},${fmt(end)},Default,,0,0,0,,${text}\n`;
  }
  return ass;
}

// แบ่งบทเป็นซับตามสัดส่วนความยาว (ใช้เป็น fallback เมื่อ whisper ใช้ไม่ได้)
function buildSegmentsFromScript(
  scriptText: string,
  audioDuration: number
): Array<{ start: number; end: number; text: string }> {
  const rawLines = String(scriptText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  // แตกบรรทัดยาวให้เป็นวลีสั้น ~<=42 ตัวอักษร ตามช่องว่าง/เครื่องหมาย
  const chunks: string[] = [];
  for (const line of rawLines) {
    if (line.length <= 42) { chunks.push(line); continue; }
    const parts = line.split(/(?<=[ ,;“”"…])/);
    let buf = '';
    for (const p of parts) {
      if ((buf + p).length > 42 && buf) { chunks.push(buf.trim()); buf = p; }
      else buf += p;
    }
    if (buf.trim()) chunks.push(buf.trim());
  }
  const totalChars = chunks.reduce((a, c) => a + Math.max(1, c.length), 0) || 1;
  const segments: Array<{ start: number; end: number; text: string }> = [];
  let cursor = 0;
  for (const c of chunks) {
    const dur = (Math.max(1, c.length) / totalChars) * audioDuration;
    segments.push({ start: +cursor.toFixed(2), end: +(cursor + dur).toFixed(2), text: c });
    cursor += dur;
  }
  return segments;
}

app.post('/api/render-relaxing-clip', async (req, res) => {
  req.setTimeout(0);
  res.setTimeout(0);
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });
  const send = (obj: object) => {
    if (!res.writableEnded) {
      try { res.write('data: ' + JSON.stringify(obj) + '\n\n'); } catch {}
    }
  };
  const { spawn } = require('child_process');
  const env = {
    ...process.env,
    PATH: `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`,
  };
  const run = (cmd: string, args: string[], opts: any = {}): Promise<void> =>
    new Promise((resolve, reject) => {
      const p = spawn(cmd, args, { env, ...opts });
      let stderr = '';
      if (p.stderr) p.stderr.on('data', (d: Buffer) => { stderr += d.toString(); });
      if (opts.onStderr && p.stderr) p.stderr.on('data', (d: Buffer) => opts.onStderr(d.toString()));
      p.on('error', reject);
      p.on('close', (code: number | null) => {
        if (code === 0) resolve();
        else reject(new Error(`${path.basename(cmd)} exited ${code}: ${stderr.slice(-400)}`));
      });
    });
  const probeDuration = (file: string): Promise<number> =>
    new Promise((resolve) => {
      const p = spawn(getFFprobePath(), ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file], { env, timeout: 20000 });
      let outStr = '';
      p.stdout.on('data', (d: Buffer) => { outStr += d.toString(); });
      p.on('close', () => { const n = parseFloat(outStr.trim()); resolve(Number.isFinite(n) && n > 0 ? n : 0); });
      p.on('error', () => resolve(0));
    });

  let tempDir = '';
  try {
    const b = req.body || {};
    const sourceFolder = String(b.sourceFolder || '').trim();
    const outputFolder = String(b.outputFolder || '').trim();
    const scriptText = String(b.scriptText || '').trim();
    const voice = (String(b.voice || 'Kanya').replace(/[^A-Za-z ]/g, '').trim()) || 'Kanya';
    const rate = Number(b.rate);
    const burnSubtitles = b.burnSubtitles !== false;
    const subStyle = b.subtitleStyle || {};
    const bgMusicPath = String(b.bgMusicPath || '').trim();
    const bgMusicVolume = Number.isFinite(Number(b.bgMusicVolume)) ? Number(b.bgMusicVolume) : 0.12;
    const minSeconds = Number(b.minSeconds) || 0;
    const outputBase = (String(b.outputName || 'relaxing_clip')
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_').replace(/\s+/g, '_').replace(/^_+|_+$/g, '').slice(0, 80)) || 'relaxing_clip';

    if (!scriptText) { send({ type: 'error', text: 'ยังไม่มีบทพากย์ (script)' }); return res.end(); }
    if (!sourceFolder || !fs.existsSync(sourceFolder) || !fs.statSync(sourceFolder).isDirectory()) {
      send({ type: 'error', text: 'ไม่พบโฟลเดอร์คลิปต้นทาง' }); return res.end();
    }
    try { fs.mkdirSync(outputFolder, { recursive: true }); }
    catch (e: any) { send({ type: 'error', text: 'สร้างโฟลเดอร์ปลายทางไม่ได้: ' + e.message }); return res.end(); }

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    tempDir = path.join(outputFolder, `.relaxing_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    const fontsDir = path.resolve(__dirname, '../../public/Font_stock');

    // ── 1) เสียงพากย์ฟรีในเครื่อง (macOS say) ──
    send({ type: 'log', text: `🎙️ สังเคราะห์เสียงพากย์ (เสียง ${voice})...` });
    const txtPath = path.join(tempDir, 'narration.txt');
    const aiffPath = path.join(tempDir, 'voice.aiff');
    const voiceMp3 = path.join(tempDir, 'voice.mp3');
    fs.writeFileSync(txtPath, scriptText, 'utf8');
    const sayArgs = ['-v', voice, '-f', txtPath, '-o', aiffPath];
    if (Number.isFinite(rate) && rate >= 120 && rate <= 320) sayArgs.push('-r', String(Math.round(rate)));
    await run('say', sayArgs);
    if (!fs.existsSync(aiffPath)) throw new Error('สร้างไฟล์เสียงจาก say ไม่สำเร็จ (ตรวจว่ามีเสียงพากย์ภาษาไทยติดตั้งอยู่)');
    await run(getFFmpegPath(), ['-y', '-i', aiffPath, '-codec:a', 'libmp3lame', '-qscale:a', '2', voiceMp3]);
    const audioDuration = await probeDuration(voiceMp3);
    if (audioDuration <= 0) throw new Error('อ่านความยาวไฟล์เสียงไม่ได้');
    send({ type: 'log', text: `✅ เสียงพากย์ยาว ${audioDuration.toFixed(1)} วินาที` });

    // ── 2) ซับไทยอัตโนมัติ (whisper → fallback แบ่งจากบท) ──
    let segments: Array<{ start: number; end: number; text: string }> = [];
    let assPath = '';
    if (burnSubtitles) {
      try {
        send({ type: 'log', text: '📝 ถอดเสียงทำซับไตเติ้ล...' });
        segments = await runWhisper(voiceMp3, tempDir, 'large-v3-turbo', 'th', (o: any) => { if (o?.log) send({ type: 'log', text: o.log }); }, res);
      } catch (e: any) {
        send({ type: 'log', text: `whisper ใช้ไม่ได้ (${e.message}) — ใช้วิธีแบ่งซับจากบทแทน` });
      }
      if (!segments || segments.length === 0) {
        segments = buildSegmentsFromScript(scriptText, audioDuration);
        send({ type: 'log', text: `แบ่งซับจากบทได้ ${segments.length} ประโยค` });
      }
      const ass = buildRelaxingAss(segments, subStyle);
      assPath = path.join(tempDir, 'subs.ass');
      fs.writeFileSync(assPath, ass, 'utf8');
    }

    // ── 3) สแกน + สุ่มฟุตเทจให้ครบความยาวเสียง ──
    const VIDEO_EXTS = ['.mp4', '.mov', '.avi', '.mkv', '.m4v', '.webm'];
    const allVideos: string[] = [];
    (function scan(dir: string) {
      let entries: string[] = [];
      try { entries = fs.readdirSync(dir); } catch { return; }
      for (const e of entries) {
        if (e.startsWith('.')) continue;
        const fp = path.join(dir, e);
        let st: fs.Stats;
        try { st = fs.statSync(fp); } catch { continue; }
        if (st.isDirectory()) scan(fp);
        else if (VIDEO_EXTS.includes(path.extname(e).toLowerCase())) allVideos.push(fp);
      }
    })(sourceFolder);
    if (allVideos.length === 0) throw new Error('ไม่พบไฟล์วิดีโอในโฟลเดอร์ต้นทาง');
    send({ type: 'log', text: `📁 พบ ${allVideos.length} คลิป กำลังอ่านความยาว...` });

    const clips: Array<{ path: string; duration: number }> = [];
    for (const v of allVideos) {
      const d = await probeDuration(v);
      if (d >= 0.5) clips.push({ path: v, duration: d });
    }
    if (clips.length === 0) throw new Error('อ่านความยาวคลิปไม่ได้ (ตรวจ ffprobe/ไฟล์วิดีโอ)');

    const target = Math.max(audioDuration + 0.4, minSeconds);
    const plan: Array<{ path: string; start: number; dur: number }> = [];
    let remaining = target;
    let lastPath = '';
    let guard = 0;
    while (remaining > 0.1 && guard < 5000) {
      guard++;
      let pool = clips;
      if (clips.length > 1) { const f = clips.filter((c) => c.path !== lastPath); if (f.length) pool = f; }
      const clip = pool[Math.floor(Math.random() * pool.length)];
      const take = remaining <= 6 ? remaining : 3 + Math.random() * 3;
      const dur = Math.min(clip.duration, remaining, Math.max(0.8, take));
      const maxStart = Math.max(0, clip.duration - dur);
      const start = maxStart > 0 ? Math.random() * maxStart : 0;
      plan.push({ path: clip.path, start: +start.toFixed(2), dur: +dur.toFixed(2) });
      remaining -= dur;
      lastPath = clip.path;
    }
    send({ type: 'log', text: `🎬 วางแผนตัดฟุตเทจ ${plan.length} ท่อน (~${target.toFixed(0)}s)` });

    // ── 4) normalize แต่ละท่อนเป็น 1080x1920 แล้ว concat เป็นวิดีโอเงียบ ──
    const vf = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1,fps=30,format=yuv420p';
    const segPaths: string[] = [];
    for (let i = 0; i < plan.length; i++) {
      const seg = plan[i];
      const segOut = path.join(tempDir, `seg_${String(i + 1).padStart(3, '0')}.mp4`);
      await run(getFFmpegPath(), [
        '-y', '-ss', String(seg.start), '-i', seg.path, '-t', String(seg.dur),
        '-map', '0:v:0', '-an', '-vf', vf,
        '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-movflags', '+faststart', segOut,
      ]);
      segPaths.push(segOut);
      if ((i + 1) % 3 === 0 || i === plan.length - 1) send({ type: 'log', text: `   ตัดฟุตเทจ ${i + 1}/${plan.length}` });
    }
    const listPath = path.join(tempDir, 'concat.txt');
    fs.writeFileSync(listPath, segPaths.map((p) => `file '${p.replace(/'/g, `'\\''`)}'`).join('\n'), 'utf8');
    const silentPath = path.join(tempDir, 'silent.mp4');
    await run(getFFmpegPath(), ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', silentPath]);

    // ── 5) รวมเสียงพากย์ (+เพลงประกอบ) + เผาซับ → ไฟล์สุดท้าย ──
    send({ type: 'log', text: '🎞️ รวมภาพ เสียง และซับไตเติ้ล...' });
    const hasBg = bgMusicPath && fs.existsSync(bgMusicPath);
    const outName = `${outputBase}_${stamp}.mp4`;
    const outputPath = path.join(outputFolder, outName);
    const finalArgs: string[] = ['-y', '-i', silentPath, '-i', voiceMp3];
    if (hasBg) finalArgs.push('-stream_loop', '-1', '-i', bgMusicPath);

    const filters: string[] = [];
    let vLabel = '0:v';
    if (assPath) { filters.push(`[0:v]subtitles=subs.ass:fontsdir=${fontsDir}[v]`); vLabel = '[v]'; }
    let aLabel = '1:a';
    if (hasBg) {
      const vol = Math.max(0, Math.min(1, bgMusicVolume));
      filters.push(`[1:a]volume=1.0[voice];[2:a]volume=${vol}[music];[voice][music]amix=inputs=2:duration=first:dropout_transition=0[a]`);
      aLabel = '[a]';
    }
    if (filters.length) finalArgs.push('-filter_complex', filters.join(';'));
    finalArgs.push('-map', vLabel, '-map', aLabel);
    finalArgs.push('-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30',
      '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', '-shortest', outputPath);

    await run(getFFmpegPath(), finalArgs, {
      cwd: tempDir,
      onStderr: (s: string) => {
        const m = s.match(/time=(\d{2}:\d{2}:\d{2}\.\d{2})/);
        if (m) send({ type: 'log', text: `เรนเดอร์... ${m[1]}` });
      },
    });

    if (!fs.existsSync(outputPath)) throw new Error('เรนเดอร์ไม่สำเร็จ (ไม่พบไฟล์ผลลัพธ์)');
    try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    send({
      type: 'done',
      outputPath,
      fileName: outName,
      duration: audioDuration,
      clipsUsed: plan.length,
      subtitleCount: segments.length,
    });
    res.end();
  } catch (err: any) {
    try { if (tempDir && fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true }); } catch {}
    send({ type: 'error', text: err?.message || String(err) });
    if (!res.writableEnded) res.end();
  }
});

// Start listening
const PORT = process.env.PORT || 5005;
const server = app.listen(PORT, () => {
  console.log(`🔊 Content Vault V2 backend listening at http://localhost:${PORT}`);
});

// จับ error ตอนเปิด port ให้ชัด ๆ แทนที่จะ crash เงียบ ๆ แล้ว nodemon รีสตาร์ทวนไม่จบ
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n❌ Port ${PORT} ถูกใช้งานอยู่แล้ว — มี process เก่าค้างอยู่\n` +
      `   วิธีแก้: ดับเบิลคลิก StopApp.command หรือรันคำสั่ง:  lsof -ti tcp:${PORT} | xargs kill -9\n`
    );
    process.exit(1);
  }
  throw err;
});

export default app;

