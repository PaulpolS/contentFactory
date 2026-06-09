import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';

const router = Router();

// Locate scripts directory
const SCRIPTS_DIR = path.resolve(__dirname, '../../../scripts');

/**
 * GET /api/orchestrator/run/:module_name
 * Expose live SSE log streaming for running scraper and graphic child processes
 */
router.get('/run/:module_name', (req: Request, res: Response) => {
  const { module_name } = req.params;

  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering for nginx/etc.
  
  // Flush headers if method exists
  if (typeof (res as any).flushHeaders === 'function') {
    (res as any).flushHeaders();
  }

  // System startup message
  res.write(`data: [SYSTEM] กำลังเปิดการเชื่อมต่อแบบสตรีมมิ่งสดสำหรับโมดูล: ${module_name.toUpperCase()}\n\n`);

  // Map module_name to its python script filename
  let scriptFilename = '';
  if (module_name === 'radar') {
    scriptFilename = '01_competitor_radar.py';
  } else if (module_name === 'rss') {
    scriptFilename = '02_discovery_rss.py';
  } else if (module_name === 'youtube') {
    scriptFilename = '03_discovery_youtube.py';
  } else if (module_name === 'github') {
    scriptFilename = '04_discovery_github.py';
  } else if (module_name === 'draw' || module_name === 'canvas') {
    scriptFilename = '06_graphic_generator.py';
  } else {
    res.write(`data: [ERROR] ไม่พบโมดูลย่อยที่ระบุ: ${module_name}\n\n`);
    res.end();
    return;
  }

  const scriptPath = path.join(SCRIPTS_DIR, scriptFilename);

  if (!fs.existsSync(scriptPath)) {
    res.write(`data: [ERROR] ไม่พบไฟล์สคริปต์สำหรับการประมวลผลที่พาธ: ${scriptPath}\n\n`);
    res.end();
    return;
  }

  res.write(`data: [SYSTEM] เริ่มทำงานสคริปต์ย่อย: ${scriptFilename}...\n\n`);

  // Collect arguments from query parameters
  const pythonArgs: string[] = [scriptPath];
  for (const [key, value] of Object.entries(req.query)) {
    if (value !== undefined) {
      const cliKey = key.replace(/_/g, '-');
      pythonArgs.push(`--${cliKey}`, String(value));
    }
  }

  console.log(`[ORCHESTRATOR] Spawning python3 with args:`, pythonArgs);

  // Spawn the python process
  const pythonProcess = spawn('python3', pythonArgs);

  // Process stdout stream
  pythonProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        res.write(`data: ${line}\n\n`);
      }
    }
  });

  // Process stderr stream
  pythonProcess.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        res.write(`data: [WARN] ${line}\n\n`);
      }
    }
  });

  // Process error handling
  pythonProcess.on('error', (err) => {
    console.error(`[ORCHESTRATOR ERROR] Failed to start subprocess:`, err);
    res.write(`data: [ERROR] ไม่สามารถเรียกทำงานสคริปต์ย่อยได้: ${err.message}\n\n`);
    res.end();
  });

  // Process exit completion
  pythonProcess.on('close', (code) => {
    console.log(`[ORCHESTRATOR] Process ${scriptFilename} exited with code ${code}`);
    res.write(`data: [SYSTEM] ✅ สิ้นสุดกระบวนการทำงานโมดูลย่อย (Exit Code: ${code})\n\n`);
    res.end();
  });

  // Gracefully handle client disconnection
  req.on('close', () => {
    console.log(`[ORCHESTRATOR] Client disconnected. Terminating subprocess: ${scriptFilename}`);
    try {
      pythonProcess.kill('SIGTERM');
    } catch (err) {
      console.error(`Failed to kill process ${pythonProcess.pid}:`, err);
    }
  });
});

export default router;
