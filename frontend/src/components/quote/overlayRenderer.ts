// ── ตัวเรนเดอร์ Overlay แบบ deterministic (วาดเหมือนกันทั้งพรีวิวและตอนส่งออก) ──
//   วาดบน canvas "พื้นใส" เสมอ: tint + กล่อง + ตัวอักษร + ไอคอน + โลโก้
//   พื้นหลังวิดีโอจริงจะถูกประกอบทีหลังที่ backend (หรือเล่นอยู่ข้างหลังตอนพรีวิว)
//   โลโก้ต้องถูก preload มาก่อน (ส่งเป็น HTMLImageElement) → ฟังก์ชันนี้ sync ล้วน

import type { CanvasElement, CanvasTemplate } from './types';

export interface OverlayOptions {
  colorFilter: string;            // none | dark | vintage | warm | cool
  blockMargin: number;            // ระยะห่างระหว่างบล็อก (px @1080) สำหรับ autoStack
  logoImg?: HTMLImageElement | null;
  logoPosition?: string;          // top-left | top-right | bottom-left | bottom-right | center
  logoScale?: string;             // small | medium | large
}

const drawRoundedRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  if (r <= 0) {
    ctx.rect(x, y, w, h);
  } else {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.moveTo(x + rr, y);
    ctx.lineTo(x + w - rr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
    ctx.lineTo(x + w, y + h - rr);
    ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
    ctx.lineTo(x + rr, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
    ctx.lineTo(x, y + rr);
    ctx.quadraticCurveTo(x, y, x + rr, y);
  }
  ctx.closePath();
  ctx.fill();
};

export function wrapTextLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const rawLine of (text || '').split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) { result.push(''); continue; }
    if (ctx.measureText(trimmed).width <= maxWidth) { result.push(trimmed); continue; }
    let cur = '';
    for (const ch of trimmed) {
      const test = cur + ch;
      if (ctx.measureText(test).width <= maxWidth) { cur = test; }
      else { if (cur) result.push(cur); cur = ch; }
    }
    if (cur) result.push(cur);
  }
  return result;
}

const applyColorFilter = (ctx: CanvasRenderingContext2D, w: number, h: number, filter: string) => {
  ctx.save();
  if (filter === 'dark') {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, w, h);
  } else if (filter === 'vintage') {
    ctx.fillStyle = 'rgba(120, 60, 20, 0.22)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255, 230, 180, 0.04)';
    ctx.fillRect(0, 0, w, h);
  } else if (filter === 'warm') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(251, 146, 60, 0.2)');
    grad.addColorStop(1, 'rgba(244, 63, 94, 0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  } else if (filter === 'cool') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.2)');
    grad.addColorStop(1, 'rgba(59, 130, 246, 0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
};

/**
 * วาด overlay ทั้งหมดลงบน canvas (พื้นใส) — sync ล้วน
 * ผูกตำแหน่งที่คำนวณไว้ลงบน element (_computedY, _renderedH) เพื่อให้ hit-test ลากวางตรงกับที่วาด
 */
export function renderOverlay(
  canvas: HTMLCanvasElement,
  tpl: CanvasTemplate,
  els: CanvasElement[],
  opts: OverlayOptions,
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = tpl.canvasWidth;
  canvas.height = tpl.canvasHeight;
  const W = tpl.canvasWidth;
  const H = tpl.canvasHeight;

  ctx.clearRect(0, 0, W, H);

  // 1) tint สี (อยู่ใต้ตัวอักษร เหนือวิดีโอ)
  applyColorFilter(ctx, W, H, opts.colorFilter);

  // 2) องค์ประกอบข้อความ/กล่อง
  let nextBlockY = -1;
  let isFirstBlock = true;

  for (const el of els) {
    const px = (el.x / 100) * W;
    const pw = (el.width / 100) * W;

    // ตำแหน่ง y: autoStack ต่อบล็อกอัตโนมัติ หรือใช้ y ตรงๆ
    let py: number;
    if (tpl.autoStack && el.type === 'text-block' && nextBlockY >= 0 && !isFirstBlock) {
      py = nextBlockY + opts.blockMargin;
    } else {
      py = (el.y / 100) * H;
    }
    if (el.type === 'text-block') isFirstBlock = false;

    (el as any)._computedY = py;

    // ตั้งสีพื้นกล่อง: ไล่เฉด (gradient) หรือสีทึบ
    const setBoxFill = (bx: number, by: number, bw: number, bh: number) => {
      if (el.bgBoxGradient) {
        const g = el.bgBoxGradient.dir === 'h'
          ? ctx.createLinearGradient(bx, by, bx + bw, by)
          : ctx.createLinearGradient(bx, by, bx, by + bh);
        g.addColorStop(0, el.bgBoxGradient.from);
        g.addColorStop(1, el.bgBoxGradient.to);
        ctx.fillStyle = g;
      } else {
        ctx.fillStyle = el.bgBoxColor || 'rgba(0,0,0,0.55)';
      }
    };

    ctx.font = `${el.bold ? 'bold' : 'normal'} ${el.fontSize}px ${tpl.fontFamily}`;
    const innerW = pw - (el.bgBox ? el.bgBoxPaddingX * 2 : 0);
    const lines = wrapTextLines(ctx, el.text, innerW);
    const lineHeight = el.fontSize * 1.35;
    const totalTextH = lines.length * lineHeight;

    // ความสูงกล่อง: คงที่ (boxHeight) หรือคิดจากข้อความ
    const fixedBoxH = el.boxHeight ? (el.boxHeight / 100) * H : 0;
    const autoBoxH = totalTextH + (el.bgBox ? el.bgBoxPaddingY * 2 : 0);
    const boxH = fixedBoxH > 0 ? fixedBoxH : autoBoxH;

    // วาดกล่องพื้นหลัง (full / fit) — โหมด line วาดทีละบรรทัดด้านล่าง
    if (el.bgBox && (el.bgBoxMode !== 'line')) {
      let boxX = px;
      let boxW = pw;
      if (el.bgBoxMode === 'fit') {
        let maxLineWidth = 0;
        for (const line of lines) {
          const w = ctx.measureText(line).width;
          if (w > maxLineWidth) maxLineWidth = w;
        }
        boxW = Math.min(maxLineWidth + el.bgBoxPaddingX * 2, pw);
        const textStartX = px + el.bgBoxPaddingX;
        if (el.textAlign === 'center') boxX = textStartX + innerW / 2 - boxW / 2;
        else if (el.textAlign === 'right') boxX = textStartX + innerW - boxW + el.bgBoxPaddingX;
        else boxX = textStartX - el.bgBoxPaddingX;
      }
      setBoxFill(boxX, py, boxW, boxH);
      drawRoundedRect(ctx, boxX, py, boxW, boxH, el.bgBoxRadius || 0);
    }

    (el as any)._renderedH = el.bgBox ? boxH : totalTextH;
    if (el.type === 'text-block') nextBlockY = py + ((el as any)._renderedH);

    // ตำแหน่งเริ่มต้นข้อความ (รองรับ valign center สำหรับการ์ด/ไอคอน)
    const valignCenter = el.valign === 'center';
    let textTop: number;
    if (valignCenter) {
      textTop = py + (boxH - totalTextH) / 2;
    } else {
      textTop = py + (el.bgBox ? el.bgBoxPaddingY : 0);
    }
    const baseY = textTop + el.fontSize;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const ly = baseY + i * lineHeight;
      const textStartX = px + (el.bgBox ? el.bgBoxPaddingX : 0);

      let drawX: number;
      if (el.textAlign === 'center') { ctx.textAlign = 'center'; drawX = textStartX + innerW / 2; }
      else if (el.textAlign === 'right') { ctx.textAlign = 'right'; drawX = textStartX + innerW; }
      else { ctx.textAlign = 'left'; drawX = textStartX; }

      // โหมดกล่องแยกบรรทัด
      if (el.bgBox && el.bgBoxMode === 'line') {
        const w = ctx.measureText(line).width;
        const lineBoxW = Math.min(w + el.bgBoxPaddingX * 2, pw);
        let lineBoxX = textStartX;
        if (el.textAlign === 'center') lineBoxX = textStartX + innerW / 2 - lineBoxW / 2;
        else if (el.textAlign === 'right') lineBoxX = textStartX + innerW - lineBoxW + el.bgBoxPaddingX;
        else lineBoxX = textStartX - el.bgBoxPaddingX;
        const lineBoxH = el.fontSize + el.bgBoxPaddingY * 2;
        const lineBoxY = ly - el.fontSize - el.bgBoxPaddingY;
        setBoxFill(lineBoxX, lineBoxY, lineBoxW, lineBoxH);
        drawRoundedRect(ctx, lineBoxX, lineBoxY, lineBoxW, lineBoxH, el.bgBoxRadius || 0);
      }

      ctx.save();
      ctx.font = `${el.bold ? 'bold' : 'normal'} ${el.fontSize}px ${tpl.fontFamily}`;
      ctx.fillStyle = el.color;
      if (!el.bgBox) {
        // ตัวอักษรลอยบนวิดีโอ → ใช้ "เงานุ่ม" + เส้นขอบบางๆ ให้อ่านง่ายแบบพรีเมียม
        // (เลิกใช้เส้นขอบดำหนาที่ทำให้ตัวหนังสือดูแข็งเทอะทะ)
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = el.fontSize * 0.28;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = el.fontSize * 0.05;
        ctx.lineWidth = el.fontSize * 0.055;
        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.strokeText(line, drawX, ly);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }
      // ตัวอักษรในกล่องพื้นหลัง: ฟิลล์สะอาดๆ ไม่ต้องมีขอบ (กล่องให้คอนทราสต์อยู่แล้ว)
      ctx.fillText(line, drawX, ly);
      ctx.restore();
    }
  }

  // 3) โลโก้ลายน้ำ (preload มาแล้ว)
  const logo = opts.logoImg;
  if (logo && logo.complete && logo.naturalWidth > 0) {
    const scaleMap: Record<string, number> = { small: 0.08, medium: 0.12, large: 0.18 };
    const sc = scaleMap[opts.logoScale || 'medium'] || 0.12;
    const lw = W * sc;
    const lh = (logo.naturalHeight / logo.naturalWidth) * lw;
    const m = W * 0.03;
    let lx = m, ly = m;
    const pos = opts.logoPosition || 'top-right';
    if (pos === 'top-right') lx = W - lw - m;
    else if (pos === 'bottom-left') ly = H - lh - m;
    else if (pos === 'bottom-right') { lx = W - lw - m; ly = H - lh - m; }
    else if (pos === 'center') { lx = (W - lw) / 2; ly = (H - lh) / 2; }
    ctx.drawImage(logo, lx, ly, lw, lh);
  }
}

// preload โลโก้เป็น HTMLImageElement (cache) เพื่อให้ renderOverlay sync
const logoCache = new Map<string, HTMLImageElement>();
export function preloadLogo(src: string): Promise<HTMLImageElement | null> {
  if (!src) return Promise.resolve(null);
  const cached = logoCache.get(src);
  if (cached && cached.complete && cached.naturalWidth > 0) return Promise.resolve(cached);
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => { logoCache.set(src, img); resolve(img); };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
