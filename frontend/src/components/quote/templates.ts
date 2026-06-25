// ── คลังเทมเพลตสำเร็จรูป (ข้อมูลล้วน — เพิ่มเทมเพลตใหม่ทีหลังได้เลย) ──
// องค์ประกอบ:
//   - element type 'title'      = ป้าย/หัวข้อคงที่ (AI ไม่เขียนทับ)
//   - element type 'text-block' = ช่องเนื้อหาที่ AI เติมตามลำดับ (split ด้วย --- หรือ \n\n\n)
// ทุกเทมเพลตขนาด 1080x1920 (9:16)

import type { CanvasElement, CanvasTemplate } from './types';

const W = 1080;
const H = 1920;

const base = (e: Partial<CanvasElement>): CanvasElement => ({
  id: e.id || Math.random().toString(36).slice(2),
  type: e.type || 'text-block',
  x: e.x ?? 5,
  y: e.y ?? 5,
  width: e.width ?? 90,
  text: e.text ?? '',
  fontSize: e.fontSize ?? 44,
  color: e.color ?? '#FFFFFF',
  bold: e.bold ?? false,
  textAlign: e.textAlign ?? 'center',
  bgBox: e.bgBox ?? false,
  bgBoxColor: e.bgBoxColor ?? 'rgba(0,0,0,0.55)',
  bgBoxRadius: e.bgBoxRadius ?? 18,
  bgBoxPaddingX: e.bgBoxPaddingX ?? 24,
  bgBoxPaddingY: e.bgBoxPaddingY ?? 16,
  bgBoxMode: e.bgBoxMode ?? 'full',
  boxHeight: e.boxHeight,
  valign: e.valign,
  autoFitText: e.autoFitText,
  bgBoxGradient: e.bgBoxGradient,
  role: e.role,
});

// หัวข้อบนสุด (แถบดำเด่น)
const header = (text: string, fontSize = 64): CanvasElement =>
  base({ id: 'title_main', type: 'title', x: 4, y: 3, width: 92, text, fontSize, bold: true,
    color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.62)', bgBoxRadius: 22, bgBoxPaddingX: 28, bgBoxPaddingY: 22 });

// ── พรีเซ็ตไล่เฉดสี (gradient) ──
const GRAD = {
  gold: { from: '#FFE69A', to: '#D99A1C' },
  purplePink: { from: '#8B5CF6', to: '#EC4899' },
  cyanBlue: { from: '#22D3EE', to: '#3B82F6' },
  sunset: { from: '#FB923C', to: '#F43F5E' },
  mystic: { from: 'rgba(91,33,182,0.78)', to: 'rgba(190,24,93,0.7)' },
  emerald: { from: '#10B981', to: '#0D9488' },
  redDeep: { from: '#E0463A', to: '#9B1C1C' },
};

// แถบ/บล็อกสีตกแต่ง (ข้อความว่าง) — ใช้ทำเส้นคั่น/แถบ accent
const bar = (id: string, x: number, y: number, width: number, boxHeight: number, grad: { from: string; to: string; dir?: 'h' | 'v' }, radius = 6): CanvasElement =>
  base({ id, type: 'title', x, y, width, text: '', boxHeight, bgBox: true, bgBoxGradient: grad, bgBoxRadius: radius, bgBoxPaddingX: 0, bgBoxPaddingY: 0 });

export const BUILT_IN_TEMPLATES: CanvasTemplate[] = [
  // ───────────────────── 1) ซีรีส์ EP. (คอลัมน์เดียว) ─────────────────────
  {
    id: 'trader_series',
    name: 'ซีรีส์ EP. (ถึงเทรดเดอร์)',
    icon: '📈',
    desc: 'หัวข้อใหญ่ + เลข EP + กล่องข้อความดำซ้อนกัน เหมาะกับคำคมซีรีส์ต่อเนื่อง',
    family: 'series',
    canvasWidth: W, canvasHeight: H, overlayOpacity: 0.45,
    fontFamily: '"Noto Sans Thai", sans-serif',
    autoStack: true,
    elements: [
      base({ id: 'title_main', type: 'title', x: 5, y: 5, width: 90, text: 'ถึงเทรดเดอร์', fontSize: 90, bold: true, textAlign: 'center' }),
      base({ id: 'title_ep', type: 'title', x: 5, y: 14, width: 90, text: 'EP.1', fontSize: 105, color: '#FFD700', bold: true, textAlign: 'center' }),
      base({ id: 'block_1', type: 'text-block', x: 5, y: 30, width: 90, fontSize: 48, bold: false, textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 24, bgBoxPaddingY: 18,
        text: 'คนส่วนใหญ่ทนทำงาน 40 ปี\nเพื่อทำให้ฝันของผู้อื่นสำเร็จ\nแต่กลับทนสร้างฝันตนเอง\nแค่ 5 ปีไม่ได้' }),
      base({ id: 'block_2', type: 'text-block', x: 5, y: 55, width: 90, fontSize: 48, textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 24, bgBoxPaddingY: 18,
        text: 'ถ้าไม่กล้าเผชิญความล้มเหลว\nคุณก็ไม่มีสิทธิ์เห็นความสำเร็จ\nในตลาดที่แฟร์ที่สุดแห่งนี้' }),
      base({ id: 'block_3', type: 'text-block', x: 5, y: 76, width: 90, fontSize: 48, color: '#FFD700', bold: true, textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 24, bgBoxPaddingY: 18,
        text: 'สุดท้ายมันวัดกันที่ความนิ่ง\nและวินัยในการคุมความเสี่ยง' }),
    ],
  },

  // ───────────────────── 2) คำคมเดี่ยวกลางจอ ─────────────────────
  {
    id: 'quote_card',
    name: 'คำคมเดี่ยวกลางจอ',
    icon: '💬',
    desc: 'คำคมโดนๆ กลางจอ + บรรทัดผู้กล่าว เหมาะกับโพสต์เดี่ยว',
    family: 'quote',
    canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5,
    fontFamily: '"Prompt", sans-serif',
    autoStack: false,
    elements: [
      base({ id: 'quote_text', type: 'text-block', x: 10, y: 36, width: 80, fontSize: 52, bold: true, textAlign: 'center', bgBox: true, bgBoxMode: 'fit', bgBoxColor: 'rgba(0,0,0,0.5)', bgBoxRadius: 28, bgBoxPaddingX: 44, bgBoxPaddingY: 26,
        text: '"จงทำงานหนักในความเงียบ\nแล้วปล่อยให้ความสำเร็จ\nเป็นตัวส่งเสียงคำราม"' }),
      base({ id: 'quote_author', type: 'title', x: 10, y: 62, width: 80, text: '— ความลับเทรดเดอร์', fontSize: 34, color: '#FFD700', bold: true, textAlign: 'center' }),
    ],
  },

  // ───────────────────── 3) ลิสต์ไอคอน + บล็อก (เช่น กรุ๊ปเลือด) ─────────────────────
  {
    id: 'icon_list_4',
    name: 'ลิสต์ไอคอน + บล็อก (4 แถว)',
    icon: '🅰️',
    desc: 'หัวข้อ + 4 แถว แต่ละแถวมีป้ายไอคอน/ตัวอักษร + บล็อกข้อความ (สไตล์กรุ๊ปเลือด)',
    family: 'icon-list',
    canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5,
    fontFamily: '"Noto Sans Thai", sans-serif',
    autoStack: false,
    elements: (() => {
      const rowY = [22, 41, 60, 79];
      const badges = ['A', 'B', 'O', 'AB'];
      const badgeColors = ['rgba(22,163,74,0.92)', 'rgba(37,99,235,0.92)', 'rgba(217,119,6,0.92)', 'rgba(124,58,237,0.92)'];
      const defaults = [
        'กรุ๊ป A\nมั่นคง รอบคอบ ชอบช่วยเหลือผู้อื่น เหมาะกับงานสายดูแล',
        'กรุ๊ป B\nสร้างสรรค์ อิสระ กล้าแสดงออก เหมาะกับงานสายศิลปะ',
        'กรุ๊ป O\nผู้นำ ลงมือจริง วางแผนเก่ง เหมาะกับงานบริหาร',
        'กรุ๊ป AB\nสนใจหลากหลาย คิดวิเคราะห์ลึก เหมาะกับงานมนุษยศาสตร์',
      ];
      const els: CanvasElement[] = [header('หัวข้อเรื่องของคุณ', 60)];
      rowY.forEach((y, i) => {
        els.push(base({ id: `badge_${i}`, type: 'title', x: 5, y, width: 15, boxHeight: 12, valign: 'center', text: badges[i], fontSize: 72, bold: true, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxColor: badgeColors[i], bgBoxRadius: 20 }));
        els.push(base({ id: `block_${i}`, type: 'text-block', x: 22, y, width: 73, boxHeight: 12, valign: 'center', text: defaults[i], fontSize: 33, autoFitText: true, textAlign: 'left', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 18, bgBoxPaddingX: 24, bgBoxPaddingY: 14 }));
      });
      return els;
    })(),
  },

  // ───────────────────── 4) กริด 2 คอลัมน์ (เช่น 12 ราศี) ─────────────────────
  {
    id: 'grid_2col_12',
    name: 'กริด 2 คอลัมน์ (12 ช่อง)',
    icon: '🔮',
    desc: 'หัวข้อ + 12 ช่องเรียง 2 คอลัมน์ เหมาะกับ 12 ราศี/รายการยาว',
    family: 'grid-2col',
    canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5,
    fontFamily: '"Noto Sans Thai", sans-serif',
    autoStack: false,
    elements: (() => {
      const signs = ['เมษ', 'พฤษภ', 'เมถุน', 'กรกฎ', 'สิงห์', 'กันย์', 'ตุลย์', 'พิจิก', 'ธนู', 'มังกร', 'กุมภ์', 'มีน'];
      const els: CanvasElement[] = [header('ทายนิสัย 12 ราศี', 56)];
      const startY = 13.5;
      const rowH = 14;     // % ต่อแถว (6 แถว) — เต็มความสูง
      for (let i = 0; i < 12; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? 2 : 51;   // ขอบบางลง — เต็มความกว้าง
        const y = startY + row * rowH;
        els.push(base({ id: `block_${i}`, type: 'text-block', x, y, width: 47, boxHeight: rowH - 0.8, valign: 'center', textAlign: 'center', fontSize: 29, autoFitText: true, bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 16, bgBoxPaddingX: 14, bgBoxPaddingY: 8,
          text: `ราศี${signs[i]}\nนิสัยเด่นของราศีนี้` }));
      }
      return els;
    })(),
  },

  // ───────────────────── 5) การ์ดกริดสี (เช่น 7 วันเกิด) ─────────────────────
  {
    id: 'card_grid_8',
    name: 'การ์ดกริดสี (8 ช่อง)',
    icon: '🗓️',
    desc: 'หัวข้อ + การ์ด 2x4 พื้นสีต่างกัน เหมาะกับ 7 วันเกิด/หมวดหมู่',
    family: 'card-grid',
    canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5,
    fontFamily: '"Noto Sans Thai", sans-serif',
    autoStack: false,
    elements: (() => {
      const titles = ['วันจันทร์', 'วันอังคาร', 'วันพุธ (วัน)', 'วันพุธ (คืน)', 'วันพฤหัส', 'วันศุกร์', 'วันเสาร์', 'วันอาทิตย์'];
      const cardColors = [
        'rgba(202,138,4,0.55)', 'rgba(219,39,119,0.5)', 'rgba(22,163,74,0.5)', 'rgba(5,150,105,0.5)',
        'rgba(217,119,6,0.55)', 'rgba(13,148,136,0.5)', 'rgba(124,58,237,0.5)', 'rgba(220,38,38,0.5)',
      ];
      const els: CanvasElement[] = [header('สิ่งที่ขาดไม่ได้ของแต่ละวันเกิด', 48)];
      const startY = 14;
      const rowH = 20.5;
      for (let i = 0; i < 8; i++) {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = col === 0 ? 4 : 51;
        const y = startY + row * rowH;
        els.push(base({ id: `block_${i}`, type: 'text-block', x, y, width: 45, boxHeight: rowH - 2, valign: 'center', textAlign: 'center', fontSize: 27, autoFitText: true, bold: false, bgBox: true, bgBoxColor: cardColors[i], bgBoxRadius: 18, bgBoxPaddingX: 16, bgBoxPaddingY: 12,
          text: `${titles[i]}\nสิ่งที่ขาดไม่ได้ของคนวันนี้` }));
      }
      return els;
    })(),
  },

  // ═════════════ สไตล์พรีเมียมเพิ่มเติม (เลือกใช้ได้ทุกหมวด) ═════════════

  // 6) Bold โซเชียล — ตัวหนาใหญ่ ไม่มีกล่อง + แถบทองใต้ข้อความ
  {
    id: 'style_bold_social', name: 'Bold โซเชียล', icon: '🔥', desc: 'ตัวหนาใหญ่จัดจ้าน ไม่มีกล่อง + แถบทองคั่น สายไวรัล',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Mitr", sans-serif', autoStack: false,
    elements: [
      base({ id: 'quote_text', type: 'text-block', x: 6, y: 33, width: 88, fontSize: 78, bold: true, color: '#FFFFFF', textAlign: 'center', text: 'วินัย\nคือทางลัด\nสู่ความรวย' }),
      bar('accent_bar', 40, 60, 20, 0.6, GRAD.gold, 6),
      base({ id: 'quote_author', type: 'title', x: 10, y: 62, width: 80, fontSize: 34, bold: true, color: '#FFD34D', textAlign: 'center', text: '— ความลับเทรดเดอร์' }),
    ],
  },

  // 7) Editorial — ชิดซ้าย แถบทองตั้งคั่น เรียบหรู
  {
    id: 'style_editorial', name: 'นิตยสาร / Editorial', icon: '📰', desc: 'ชิดซ้าย แถบทองตั้งคั่น เรียบหรู มีที่ว่างเยอะ',
    family: 'series', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Sarabun", sans-serif', autoStack: false,
    elements: [
      bar('accent_bar', 8, 34, 1.4, 18, GRAD.gold, 4),
      base({ id: 'block_1', type: 'text-block', x: 13, y: 34, width: 78, fontSize: 64, bold: true, color: '#FFFFFF', textAlign: 'left', text: 'เงียบ แต่\nไม่เคยหยุด\nพัฒนา' }),
      base({ id: 'quote_author', type: 'title', x: 13, y: 58, width: 78, fontSize: 28, color: '#C9D2E0', textAlign: 'left', text: 'EP.07 · ความลับเทรดเดอร์' }),
    ],
  },

  // 8) การ์ดสีเต็มแถบ 3 ช่อง (อินโฟกราฟิกหัวข้อ + การ์ดไล่สี)
  {
    id: 'style_color_sections', name: 'การ์ดสี 3 ช่อง', icon: '🟥', desc: 'หัวข้อ + การ์ดสีเต็มแถบ 3 บล็อก ไล่เฉดสวย',
    family: 'card-grid', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Kanit", sans-serif', autoStack: false,
    elements: [
      base({ id: 'title_main', type: 'title', x: 4, y: 4, width: 92, fontSize: 56, bold: true, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.redDeep, bgBoxRadius: 22, bgBoxPaddingX: 26, bgBoxPaddingY: 20, text: 'หัวข้อเรื่องของคุณ' }),
      base({ id: 'block_0', type: 'text-block', x: 6, y: 22, width: 88, boxHeight: 20, valign: 'center', fontSize: 36, autoFitText: true, bold: false, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.purplePink, bgBoxRadius: 22, bgBoxPaddingX: 28, bgBoxPaddingY: 16, text: 'ข้อที่ 1\nรายละเอียดสั้นๆ' }),
      base({ id: 'block_1', type: 'text-block', x: 6, y: 46, width: 88, boxHeight: 20, valign: 'center', fontSize: 36, autoFitText: true, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.cyanBlue, bgBoxRadius: 22, bgBoxPaddingX: 28, bgBoxPaddingY: 16, text: 'ข้อที่ 2\nรายละเอียดสั้นๆ' }),
      base({ id: 'block_2', type: 'text-block', x: 6, y: 70, width: 88, boxHeight: 20, valign: 'center', fontSize: 36, autoFitText: true, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.emerald, bgBoxRadius: 22, bgBoxPaddingX: 28, bgBoxPaddingY: 16, text: 'ข้อที่ 3\nรายละเอียดสั้นๆ' }),
    ],
  },

  // 9) Neon line — กล่องแยกบรรทัดโทนไซเบอร์
  {
    id: 'style_neon_line', name: 'Neon แยกบรรทัด', icon: '💠', desc: 'กล่องดำแยกทีละบรรทัด ตัวอักษรนีออน โทนไซเบอร์ (สาย AI/เทค)',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.55, fontFamily: '"Chakra Petch", sans-serif', autoStack: false,
    elements: [
      base({ id: 'quote_text', type: 'text-block', x: 10, y: 35, width: 80, fontSize: 52, bold: true, color: '#5EEAD4', textAlign: 'center', bgBox: true, bgBoxMode: 'line', bgBoxColor: 'rgba(8,12,24,0.72)', bgBoxRadius: 10, bgBoxPaddingX: 20, bgBoxPaddingY: 10, text: 'อนาคตเป็นของ\nคนที่ปรับตัว\nก่อนใคร' }),
      base({ id: 'quote_author', type: 'title', x: 10, y: 60, width: 80, fontSize: 30, color: '#FFFFFF', textAlign: 'center', text: '— โลกของ AI' }),
    ],
  },

  // 10) Lower third — ข้อความล่างจอแบบข่าว
  {
    id: 'style_lower_third', name: 'Lower Third (ล่างจอ)', icon: '📺', desc: 'ป้ายเล็ก + ข้อความวางช่วงล่างจอแบบข่าว เห็นภาพพื้นหลังเต็มบน',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.4, fontFamily: '"Kanit", sans-serif', autoStack: false,
    elements: [
      base({ id: 'title_main', type: 'title', x: 6, y: 58, width: 34, boxHeight: 5, valign: 'center', fontSize: 28, bold: true, color: '#1a1200', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.gold, bgBoxRadius: 10, bgBoxPaddingX: 16, bgBoxPaddingY: 6, text: 'ข้อคิดวันนี้' }),
      base({ id: 'block_1', type: 'text-block', x: 6, y: 65, width: 88, fontSize: 46, bold: true, color: '#FFFFFF', textAlign: 'left', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.62)', bgBoxRadius: 18, bgBoxPaddingX: 28, bgBoxPaddingY: 22, text: 'ทำวันนี้ให้ดีที่สุด\nพรุ่งนี้จะขอบคุณตัวเอง' }),
    ],
  },

  // 11) แบนเนอร์บน + คำคมกลาง
  {
    id: 'style_top_banner', name: 'แบนเนอร์บน + คำคม', icon: '🏷️', desc: 'ป้ายทองด้านบน + กล่องคำคมพอดีคำตรงกลาง',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Prompt", sans-serif', autoStack: false,
    elements: [
      base({ id: 'title_main', type: 'title', x: 16, y: 7, width: 68, fontSize: 40, bold: true, color: '#1a1200', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.gold, bgBoxRadius: 16, bgBoxPaddingX: 24, bgBoxPaddingY: 14, text: 'ความลับเทรดเดอร์' }),
      base({ id: 'quote_text', type: 'text-block', x: 10, y: 40, width: 80, fontSize: 52, bold: true, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxMode: 'fit', bgBoxColor: 'rgba(0,0,0,0.5)', bgBoxRadius: 26, bgBoxPaddingX: 40, bgBoxPaddingY: 26, text: '"อย่าเทรดด้วยอารมณ์\nจงเทรดด้วยแผน"' }),
    ],
  },

  // 12) หรูทอง — กรอบเส้นทองบน/ล่าง ตัวอักษรทอง
  {
    id: 'style_gold_luxury', name: 'หรูหราทองคำ', icon: '👑', desc: 'เส้นทองคั่นบน-ล่าง ตัวอักษรทอง เรียบหรูระดับพรีเมียม',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.55, fontFamily: '"Kanit", sans-serif', autoStack: false,
    elements: [
      bar('bar_top', 35, 32, 30, 0.4, GRAD.gold, 4),
      base({ id: 'quote_text', type: 'text-block', x: 10, y: 36, width: 80, fontSize: 52, bold: true, color: '#F5D77A', textAlign: 'center', text: 'ความมั่งคั่งที่แท้จริง\nคือความสงบในใจ' }),
      bar('bar_bottom', 35, 56, 30, 0.4, GRAD.gold, 4),
      base({ id: 'quote_author', type: 'title', x: 10, y: 59, width: 80, fontSize: 28, color: '#FFFFFF', textAlign: 'center', text: '— ความลับเทรดเดอร์' }),
    ],
  },

  // 13) EP ตัวเลขยักษ์ + คำคมซีรีส์
  {
    id: 'style_big_ep', name: 'EP ตัวเลขยักษ์', icon: '🔢', desc: 'เลข EP ทองตัวใหญ่เด่น + กล่องคำคมซ้อนกัน เหมาะซีรีส์',
    family: 'series', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Mitr", sans-serif', autoStack: true,
    elements: [
      base({ id: 'title_main', type: 'title', x: 5, y: 6, width: 90, fontSize: 56, bold: true, color: '#FFFFFF', textAlign: 'center', text: 'ความลับเทรดเดอร์' }),
      base({ id: 'title_ep', type: 'title', x: 5, y: 13, width: 90, fontSize: 150, bold: true, color: '#FFD34D', textAlign: 'center', text: 'EP.1' }),
      base({ id: 'block_1', type: 'text-block', x: 6, y: 42, width: 88, fontSize: 46, bold: false, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 26, bgBoxPaddingY: 18, text: 'บทเรียนแรกของการเทรด\nคือการรู้จักรอ' }),
      base({ id: 'block_2', type: 'text-block', x: 6, y: 60, width: 88, fontSize: 46, color: '#FFD34D', bold: true, textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 26, bgBoxPaddingY: 18, text: 'คนใจร้อนคือเหยื่อ\nของตลาดเสมอ' }),
    ],
  },

  // 14) สองโทน — หัวข้อไล่สีบน + คำคมล่าง
  {
    id: 'style_split', name: 'สองโทน (Split)', icon: '🎭', desc: 'หัวข้อกล่องไล่สีด้านบน + คำคมกล่องดำด้านล่าง',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Mitr", sans-serif', autoStack: false,
    elements: [
      base({ id: 'title_main', type: 'text-block', x: 6, y: 22, width: 88, boxHeight: 15, valign: 'center', fontSize: 54, bold: true, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.purplePink, bgBoxRadius: 22, bgBoxPaddingX: 28, bgBoxPaddingY: 14, text: 'รู้ไว้ก่อนสาย' }),
      base({ id: 'quote_text', type: 'text-block', x: 10, y: 48, width: 80, fontSize: 44, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxMode: 'fit', bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 22, bgBoxPaddingX: 36, bgBoxPaddingY: 24, text: 'เงินไม่ได้ทำงานหนัก\nแต่เงินทำงานฉลาด' }),
    ],
  },

  // 15) ไฮไลต์ปากกาเมจิก — กล่องเหลืองทับทีละบรรทัด ตัวอักษรดำ
  {
    id: 'style_highlight', name: 'ไฮไลต์ปากกาเมจิก', icon: '🖍️', desc: 'แถบสีไฮไลต์ทับทีละบรรทัด ตัวอักษรดำ สดใสสะดุดตา',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.35, fontFamily: '"Mitr", sans-serif', autoStack: false,
    elements: [
      base({ id: 'quote_text', type: 'text-block', x: 8, y: 36, width: 84, fontSize: 54, bold: true, color: '#1a1a1a', textAlign: 'center', bgBox: true, bgBoxMode: 'line', bgBoxColor: '#FDE047', bgBoxRadius: 6, bgBoxPaddingX: 18, bgBoxPaddingY: 6, text: 'หยุดผัดวันประกันพรุ่ง\nเริ่มเลยตอนนี้' }),
      base({ id: 'quote_author', type: 'title', x: 10, y: 60, width: 80, fontSize: 30, bold: true, color: '#FFFFFF', textAlign: 'center', text: 'ลงมือ = ชนะ' }),
    ],
  },

  // 16) การ์ดกรอบ — กล่องใหญ่ใบเดียว หัวข้อสี + เนื้อหา
  {
    id: 'style_framed_card', name: 'การ์ดกรอบเดียว', icon: '🪧', desc: 'การ์ดใหญ่ใบเดียว มีหัวข้อสีทอง + เนื้อหา ดูเป็นทางการ',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.45, fontFamily: '"Prompt", sans-serif', autoStack: false,
    elements: [
      base({ id: 'card_bg', type: 'title', x: 9, y: 30, width: 82, boxHeight: 38, text: '', bgBox: true, bgBoxColor: 'rgba(12,15,26,0.78)', bgBoxRadius: 30 }),
      base({ id: 'title_main', type: 'title', x: 12, y: 35, width: 76, fontSize: 34, bold: true, color: '#FFD34D', textAlign: 'center', text: 'กฎข้อแรกของเงิน' }),
      base({ id: 'block_1', type: 'text-block', x: 12, y: 44, width: 76, fontSize: 42, color: '#FFFFFF', textAlign: 'center', text: 'จ่ายให้ตัวเองก่อนเสมอ\nออมก่อนใช้ ไม่ใช่ใช้ก่อนออม' }),
    ],
  },

  // 17) คำถามฮุก — คำถามเด่น + คำตอบเป็นบล็อก
  {
    id: 'style_question_hook', name: 'คำถามฮุก', icon: '❓', desc: 'คำถามตัวใหญ่สีทองด้านบน + บล็อกคำตอบ ดึงให้คนหยุดดู',
    family: 'icon-list', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Kanit", sans-serif', autoStack: true,
    elements: [
      base({ id: 'title_main', type: 'title', x: 6, y: 14, width: 88, fontSize: 60, bold: true, color: '#FFD34D', textAlign: 'center', text: 'ทำไมยิ่งทำยิ่งจน?' }),
      base({ id: 'block_1', type: 'text-block', x: 6, y: 34, width: 88, fontSize: 44, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 26, bgBoxPaddingY: 18, text: 'เพราะคุณใช้เงินเพื่อดูรวย\nไม่ใช่เพื่อสร้างความรวย' }),
      base({ id: 'block_2', type: 'text-block', x: 6, y: 56, width: 88, fontSize: 44, color: '#FFFFFF', textAlign: 'center', bgBox: true, bgBoxColor: 'rgba(0,0,0,0.55)', bgBoxRadius: 20, bgBoxPaddingX: 26, bgBoxPaddingY: 18, text: 'เปลี่ยนมุมคิดวันนี้\nก่อนจะสายเกินไป' }),
    ],
  },

  // 18) มิสติก — กล่องไล่สีม่วง-ชมพู โทนดูดวง
  {
    id: 'style_mystic', name: 'มิสติกดูดวง', icon: '🌙', desc: 'กล่องไล่สีม่วง-ชมพู ตัวอักษรทองนวล โทนหมอดูอบอุ่น',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"Prompt", sans-serif', autoStack: false,
    elements: [
      base({ id: 'quote_text', type: 'text-block', x: 9, y: 35, width: 82, fontSize: 48, bold: true, color: '#F7E6B0', textAlign: 'center', bgBox: true, bgBoxGradient: GRAD.mystic, bgBoxRadius: 28, bgBoxPaddingX: 40, bgBoxPaddingY: 28, text: 'ดวงดาวกำลังเข้าข้างคุณ\nสิ่งดีๆ กำลังจะมาถึง' }),
      base({ id: 'quote_author', type: 'title', x: 10, y: 62, width: 80, fontSize: 30, bold: true, color: '#F7E6B0', textAlign: 'center', text: 'ดูดวงกับหมอต้น' }),
    ],
  },

  // 19) คลีนมินิมอล — ไม่มีกล่อง จุดคั่นเล็ก โทนสะอาด
  {
    id: 'style_clean', name: 'คลีนมินิมอล', icon: '🤍', desc: 'ตัวอักษรขาวสะอาด ไม่มีกล่อง มีเส้นคั่นเล็ก ดูโปร่ง',
    family: 'quote', canvasWidth: W, canvasHeight: H, overlayOpacity: 0.5, fontFamily: '"IBM Plex Sans Thai", sans-serif', autoStack: false,
    elements: [
      base({ id: 'quote_text', type: 'text-block', x: 10, y: 40, width: 80, fontSize: 50, bold: true, color: '#FFFFFF', textAlign: 'center', text: 'ความสำเร็จไม่ใช่โชค\nแต่คือนิสัยที่ทำซ้ำทุกวัน' }),
      bar('accent_dot', 46, 58, 8, 0.6, GRAD.cyanBlue, 6),
      base({ id: 'quote_author', type: 'title', x: 10, y: 61, width: 80, fontSize: 28, color: '#C9D2E0', textAlign: 'center', text: '— แนวคิดคนสำเร็จ' }),
    ],
  },
];

export const getTemplateById = (id: string): CanvasTemplate | undefined =>
  BUILT_IN_TEMPLATES.find(t => t.id === id);
