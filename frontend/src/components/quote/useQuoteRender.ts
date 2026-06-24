// ── Hook คุมการเรนเดอร์ฝั่ง backend ผ่าน SSE + ปุ่ม เริ่ม/พัก/ต่อ/หยุด ──

import { useState, useRef, useCallback } from 'react';

const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';

export type RenderStatus = 'idle' | 'running' | 'paused' | 'done' | 'error';

export interface RenderItem {
  overlayPng: string;     // base64 dataURL ของ overlay (โปร่งใส)
  fileNameBase: string;   // ชื่อไฟล์ (ไม่รวมนามสกุล)
}

export interface RenderRequest {
  footageFolder: string;
  outputFolder: string;
  bgmFile: string;
  bgmVolume: number;      // 0-1
  durationSec: number;
  items: RenderItem[];
}

export function useQuoteRender() {
  const [logs, setLogs] = useState<string[]>([]);
  const [status, setStatus] = useState<RenderStatus>('idle');
  const [progress, setProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const abortRef = useRef<AbortController | null>(null);

  const addLog = useCallback((line: string) => {
    const stamp = new Date().toLocaleTimeString('th-TH', { hour12: false });
    setLogs(prev => [...prev.slice(-500), `[${stamp}] ${line}`]);
  }, []);

  const start = useCallback(async (req: RenderRequest) => {
    setLogs([]);
    setStatus('running');
    setProgress({ current: 0, total: req.items.length });
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch(`${BACKEND_BASE}/api/quote-render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) throw new Error(`เชื่อมต่อ backend ไม่สำเร็จ (HTTP ${res.status})`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let sawError = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split('\n\n');
        buffer = parts.pop() || '';
        for (const part of parts) {
          const line = part.replace(/^data:\s*/, '').trim();
          if (!line) continue;
          let msg: any;
          try { msg = JSON.parse(line); } catch { continue; }
          if (msg.log) addLog(msg.log);
          if (typeof msg.total === 'number') setProgress(p => ({ ...p, total: msg.total }));
          if (typeof msg.progress === 'number') setProgress(p => ({ ...p, current: msg.progress }));
          if (msg.paused) setStatus('paused');
          if (msg.resumed) setStatus('running');
          if (msg.error) { sawError = true; setStatus('error'); }
          if (msg.success) setStatus('done');
        }
      }
      if (!sawError) setStatus(prev => (prev === 'running' || prev === 'paused') ? 'done' : prev);
    } catch (e: any) {
      if (e?.name === 'AbortError') { addLog('⏹ หยุดการเรนเดอร์แล้ว'); setStatus('idle'); }
      else { addLog(`❌ ${e?.message || e}`); setStatus('error'); }
    } finally {
      abortRef.current = null;
    }
  }, [addLog]);

  const pause = useCallback(async () => {
    try { await fetch(`${BACKEND_BASE}/api/quote-render-pause`, { method: 'POST' }); } catch {}
    setStatus('paused');
  }, []);

  const resume = useCallback(async () => {
    try { await fetch(`${BACKEND_BASE}/api/quote-render-resume`, { method: 'POST' }); } catch {}
    setStatus('running');
  }, []);

  const stop = useCallback(async () => {
    try { await fetch(`${BACKEND_BASE}/api/quote-render-stop`, { method: 'POST' }); } catch {}
    if (abortRef.current) { try { abortRef.current.abort(); } catch {} }
    setStatus('idle');
  }, []);

  const clearLogs = useCallback(() => setLogs([]), []);

  return { logs, status, progress, start, pause, resume, stop, clearLogs, addLog };
}
