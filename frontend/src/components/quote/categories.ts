// ── นิยาม 3 หมวด (AI / ดูดวง / การเงิน) + การจำค่าต่อหมวด + คลัง "สมอง" ──

import type { CategoryId, QuoteCategoryConfig, Brain, TemplateFamily } from './types';

export interface CategoryDef {
  id: CategoryId;
  name: string;
  emoji: string;
  accent: string;          // โทนสีประจำหมวด (ใช้กับ gradient/ขอบ)
  accentFrom: string;
  accentTo: string;
  recommendedFamilies: TemplateFamily[];
  tones: { value: string; label: string }[];
  defaultTemplateId: string;
  defaultBrain: string;    // บุคลิก/สไตล์ของ AI (system prompt ส่วนตัวตน) — แก้ได้
}

export const CATEGORIES: CategoryDef[] = [
  {
    id: 'ai',
    name: 'เพจ AI',
    emoji: '🤖',
    accent: 'cyan',
    accentFrom: 'from-violet-600', accentTo: 'to-cyan-500',
    recommendedFamilies: ['series', 'quote'],
    tones: [
      { value: 'mentor', label: '🚀 โค้ชสร้างแรงบันดาลใจ' },
      { value: 'general', label: '✨ มินิมอลสะดุดหู' },
    ],
    defaultTemplateId: 'quote_card',
    defaultBrain: `คุณคือนักเขียนคอนเทนต์สาย AI/เทคโนโลยี และการพัฒนาตนเองที่ทรงพลัง
เล่าเรื่องด้วยน้ำเสียงทันสมัย กระตุกความคิด ให้แง่คิดเรื่องการปรับตัวในยุค AI การลงมือทำ และการเรียนรู้ตลอดชีวิต
เน้นประโยคสั้น คม จำง่าย เหมาะกับคลิปสั้นแนวตั้ง`,
  },
  {
    id: 'horoscope',
    name: 'เพจดูดวง',
    emoji: '🔮',
    accent: 'amber',
    accentFrom: 'from-amber-500', accentTo: 'to-fuchsia-600',
    recommendedFamilies: ['icon-list', 'grid-2col', 'card-grid'],
    tones: [
      { value: 'mystic', label: '🌙 หมอดูอบอุ่นเป็นกันเอง' },
      { value: 'general', label: '🎴 สนุกชวนแชร์' },
    ],
    defaultTemplateId: 'grid_2col_12',
    defaultBrain: `คุณคือหมอดูที่อบอุ่นเป็นกันเอง สไตล์ "หมอต้น ดูดวงกับต้น"
ทำนายดวงด้วยภาษาที่ฟังแล้วสบายใจ ให้กำลังใจ มีคำแนะนำเชิงบวกที่นำไปใช้ได้จริง
เขียนกระชับ น่าอ่าน เหมาะกับการ์ด/กริดแต่ละราศีหรือวันเกิด ชวนให้คนอยากอ่านของตัวเองและแชร์ต่อ`,
  },
  {
    id: 'finance',
    name: 'เพจการเงิน',
    emoji: '💰',
    accent: 'emerald',
    accentFrom: 'from-emerald-600', accentTo: 'to-amber-500',
    recommendedFamilies: ['series', 'icon-list', 'card-grid'],
    tones: [
      { value: 'trader_secrets', label: '📈 ความลับเทรดเดอร์ (Mentor)' },
      { value: 'general', label: '💸 การเงินคนรุ่นใหม่' },
    ],
    defaultTemplateId: 'trader_series',
    defaultBrain: `คุณคือสุดยอดพี่เลี้ยงเทรดเดอร์/ที่ปรึกษาการเงินระดับตำนาน
มี Mindset ของนักลงทุนที่นิ่งและมีวินัย เล่าเรื่องดุดัน ตรงไปตรงมา กระตุกความคิด ดึงสติ สัจธรรมจริงจัง
เน้นเรื่องวินัย การคุมความเสี่ยง จิตวิทยาการเงิน และการอดทนสร้างความมั่งคั่งระยะยาว`,
  },
];

export const getCategory = (id: CategoryId): CategoryDef =>
  CATEGORIES.find(c => c.id === id) || CATEGORIES[0];

// ── ค่า default ของ config ต่อหมวด ──
function defaultConfig(id: CategoryId): QuoteCategoryConfig {
  const cat = getCategory(id);
  return {
    footageFolder: '',
    outputFolder: localStorage.getItem('custom_output_folder') || '',
    bgmFile: '',
    bgmVolume: 15,
    colorFilter: 'dark',
    durationSec: 15,
    lastTemplateId: cat.defaultTemplateId,
    logoImage: '',
    logoPosition: 'top-right',
    logoScale: 'medium',
    tone: cat.tones[0].value,
    brainId: 'default',
    customBrainText: cat.defaultBrain,
    footerText: '',
    footerFontSize: 34,
    footerStyle: 'gold',
  };
}

const CFG_KEY = (id: CategoryId) => `quote_cat_${id}`;

export function loadCategoryConfig(id: CategoryId): QuoteCategoryConfig {
  const def = defaultConfig(id);
  try {
    const raw = localStorage.getItem(CFG_KEY(id));
    if (raw) return { ...def, ...JSON.parse(raw) };
  } catch {}
  return def;
}

export function saveCategoryConfig(id: CategoryId, cfg: QuoteCategoryConfig): void {
  try { localStorage.setItem(CFG_KEY(id), JSON.stringify(cfg)); } catch {}
}

// ── คลัง "สมอง" ที่ผู้ใช้บันทึก/อัปเดตเรื่อยๆ (แยกจาก portal อื่น) ──
const BRAINS_KEY = 'quote_brains';

export function loadBrains(): Brain[] {
  try {
    const raw = localStorage.getItem(BRAINS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

export function saveBrains(list: Brain[]): void {
  try { localStorage.setItem(BRAINS_KEY, JSON.stringify(list)); } catch {}
}
