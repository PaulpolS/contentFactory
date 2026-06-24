// ── ชนิดข้อมูลกลางของระบบทำคลิปคำคม (Quote Video) ──

export type CategoryId = 'ai' | 'horoscope' | 'finance';

// ตระกูลเลย์เอาต์ของเทมเพลต (ใช้กรองว่าหมวดไหนเห็นเทมเพลตแบบไหน)
export type TemplateFamily =
  | 'series'      // คำคมซีรีส์ EP. คอลัมน์เดียว
  | 'quote'       // คำคมเดี่ยวกลางจอ
  | 'icon-list'   // หัวข้อ + ลิสต์แถว (ไอคอน/ตัวอักษร + บล็อกข้อความ)
  | 'grid-2col'   // หัวข้อ + กริด 2 คอลัมน์ (เช่น 12 ราศี)
  | 'card-grid';  // หัวข้อ + การ์ดกริดสี (เช่น 7 วัน)

export interface CanvasElement {
  id: string;
  type: 'title' | 'text-block';
  x: number;        // % ของความกว้าง canvas
  y: number;        // % ของความสูง canvas
  width: number;    // % ของความกว้าง canvas
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
  textAlign: 'left' | 'center' | 'right';
  bgBox: boolean;
  bgBoxColor: string;
  bgBoxRadius: number;
  bgBoxPaddingX: number;
  bgBoxPaddingY: number;
  bgBoxMode?: 'full' | 'fit' | 'line';
  // ── ส่วนขยายสำหรับเทมเพลตกริด/การ์ด/ไอคอน/สไตล์พรีเมียม ──
  boxHeight?: number;             // ถ้ากำหนด = ความสูงกล่องคงที่ (% ของ canvas) แทนที่จะคิดจากจำนวนบรรทัด
  valign?: 'top' | 'center';      // จัดข้อความแนวตั้งในกล่อง (default 'top')
  bgBoxGradient?: { from: string; to: string; dir?: 'h' | 'v' }; // ไล่เฉดสีพื้นกล่อง (ทับ bgBoxColor)
  role?: 'header' | 'block' | 'badge' | 'footer'; // ใช้ระบุบทบาท (เพื่ออ่านง่าย/ขยายภายหลัง)
}

export interface CanvasTemplate {
  id: string;
  name: string;
  icon: string;
  desc: string;
  family: TemplateFamily;
  canvasWidth: number;
  canvasHeight: number;
  overlayOpacity: number;
  fontFamily: string;
  autoStack?: boolean;   // true = วางบล็อกข้อความต่อกันอัตโนมัติ (คอลัมน์เดียว); false = ใช้พิกัด y ตรงๆ (กริด)
  elements: CanvasElement[];
}

// ค่า config ที่จำต่อหมวด (เก็บใน localStorage แยกแต่ละหมวด)
export interface QuoteCategoryConfig {
  footageFolder: string;
  outputFolder: string;
  bgmFile: string;
  bgmVolume: number;       // 0-100
  colorFilter: string;     // none | dark | vintage | warm | cool
  durationSec: number;
  lastTemplateId: string;
  logoImage: string;       // dataURL หรือ URL โลโก้ลายน้ำ
  logoPosition: string;
  logoScale: string;
  tone: string;            // โทนการเล่า (เช่น trader_secrets | general | mystic | finance)
  brainId: string;         // id ของสมองที่เลือก (จากคลัง) หรือ 'custom'
  customBrainText: string; // system prompt ที่ผู้ใช้แก้เอง (สมองของหมวดนี้)
}

// "สมอง" = ชุด system prompt ที่ผู้ใช้บันทึกไว้ใช้ซ้ำ/อัปเดตเรื่อยๆ
export interface Brain {
  id: string;
  name: string;
  systemPrompt: string;
  category?: CategoryId;
}
