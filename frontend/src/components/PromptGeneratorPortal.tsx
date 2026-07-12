import React, { useState, useCallback, useRef } from 'react';
import { chatCompletions, getLlmKey, getLlmProviderLabel, missingLlmKeyMessage } from '../lib/llm';
import {
  Sparkles,
  Cpu,
  Layers,
  Zap,
  FileText,
  Clipboard,
  Download,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Plus,
  Check,
  Settings,
  HelpCircle,
  Brain,
  Compass,
  BookOpen,
  TrendingUp,
  Upload,
  X,
  ChevronDown,
  ChevronUp,
  Volume2,
  Star
} from 'lucide-react';

// ─── Interfaces ──────────────────────────────────────────────────────────────

interface StyleGroup {
  id: string;
  name: string;
  emoji: string;
  description: string;
  keywords: string[];
  negativeKeywords: string[];
  exampleTopic: string;
}

interface GeneratedPrompt {
  styleId: string;
  styleName: string;
  styleEmoji: string;
  content?: string;        // Thai text content for infographic
  designPrompt?: string;   // Imagen 4 design prompt
  prompt?: string;         // General prompt
  negativePrompt?: string;
  mode: ContentMode;
  target: TargetGenerator;
  topicLabel?: string;
}

type TargetGenerator = 'midjourney' | 'imagen4';
type ContentMode     = 'general' | 'infographic';

interface PageConfig {
  name: string;
  sheet_name: string;
  image_credit: string;
  post_persona: string;
  post_length: string;
  post_hook: string;
  image_theme: string;
  image_font: string;
  item_limit: number;
  dropbox_path: string;
}

interface ClickbaitPostItem {
  id: string;
  topic: string;
  headline: string;
  postText: string;
  comments: [string, string, string];
  status: 'done' | 'error';
  error?: string;
  createdAt: string;
}

interface VoiceoverResult {
  id: string;
  topic: string;        // ชื่อสินค้า / หัวข้อ
  scriptName?: string;  // ชื่อไฟล์สคริปต์ เช่น Chair_script1 (เฉพาะแท็บรีวิวสินค้า)
  detail?: string;      // รายละเอียดสินค้า (จาก CSV)
  script: string;
  presetId: string;
  lengthId: string;
  error?: string;
  createdAt: string;
}

interface VoiceoverPreset {
  id: string;
  label: string;
  description: string;
  promptGuideline?: string;
}

// ผลลัพธ์ของแท็บ "รีวิวสินค้า Shopee" (แยก Hook / ชื่อคลิป / Script ออกจากกัน)
interface ProductScriptResult {
  id: string;
  productName: string;   // ชื่อสินค้าเดิม (จาก CSV)
  englishName: string;   // ชื่ออังกฤษ PascalCase เช่น RiceWarmerGlove
  clipName: string;      // ชื่อคลิป เช่น 001_RiceWarmerGlove_script1
  hooks: string[];       // พาดหัวพูด 5 ข้อ (สำหรับ voiceover)
  overlayTitle: string;  // พาดหัวตัวหนังสือใหญ่ในคลิป สั้น เข้าใจง่าย บอกตรงๆเกี่ยวกับสินค้า
  script: string;        // เนื้อ voiceover ล้วน (ไม่มีวงเล็บการกระทำ/หัวข้อ)
  detail?: string;       // รายละเอียดสินค้า
  lengthId: string;
  error?: string;
  createdAt: string;
}

// ─── Presets ─────────────────────────────────────────────────────────────────

const DEFAULT_PAGE_CONFIGS: PageConfig[] = [
  {
    name: '🧠 AI & Tech Explorer',
    sheet_name: 'AI_Tech',
    image_credit: 'AI Content Lab',
    post_persona: 'ผู้เชี่ยวชาญเทคโนโลยี สอนใช้ AI เชิงลึก น้ำเสียงตื่นเต้นและทรงพลัง',
    post_length: '2-4 บรรทัดพร้อมแฮชแท็ก',
    post_hook: 'เริ่มด้วย Hook ชวนตื่นตาตื่นใจเกี่ยวกับความเร็วและอนาคต',
    image_theme: 'Modern glowing tech illustration, dark mode, futuristic cyan and violet neon streaks, clean icons',
    image_font: 'Kanit',
    item_limit: 10,
    dropbox_path: '/ContentFactory/ai_tech'
  },
  {
    name: '💰 Wealth Builder',
    sheet_name: 'Wealth_Builder',
    image_credit: 'วางแผนเป็น เห็นทางรวย',
    post_persona: 'ที่ปรึกษาการเงิน อธิบายเข้าใจง่าย น้ำเสียงสุภาพและเป็นทางการ',
    post_length: '3-5 บรรทัด',
    post_hook: 'เริ่มต้นด้วยปัญหาด้านการเงินที่ทุกคนต้องพบเจอและแนวทางแก้ไขทันที',
    image_theme: 'Luxury dark background, clean metallic gold infographics, subtle chart lines, glowing gold light accents',
    image_font: 'Mitr',
    item_limit: 10,
    dropbox_path: '/ContentFactory/wealth_builder'
  },
  {
    name: '🔮 Astrology & Horoscope',
    sheet_name: 'Astrology',
    image_credit: 'ปั้นดินให้เป็นดาว',
    post_persona: 'แม่หมอใจดี ปลอบโยน น้ำเสียงเป็นกันเองและชวนค้นหา',
    post_length: '2-3 บรรทัดสั้นๆ',
    post_hook: 'ขึ้นต้นด้วยราศีหรือดวงชะตาที่กำลังมีจุดเปลี่ยนใหญ่',
    image_theme: 'Celestial mystical starry night, deep violet and navy sky, glowing magical crystal ball, gold cosmic orbits',
    image_font: 'Prompt',
    item_limit: 10,
    dropbox_path: '/ContentFactory/astrology'
  }
];

// บุคลิก "ผู้ดีจิบไวน์" รีวิวสินค้า Shopee แนวสารคดี+ปรัชญา+มุกบากิ (อ้างอิง role_shopee.txt)
const ROLE_SHOPEE_TEMPLATE = `# ROLE
คุณคือชายวัย 40-50 ปี สวมสูท นั่งจิบไวน์หรือกาแฟในห้องหนังสือ
มีบุคลิกสุขุม พูดช้า น้ำเสียงจริงจัง ราวกับกำลังเล่าเรื่องสำคัญระดับโลก แต่แท้จริงแล้วกำลังรีวิวสินค้า
สไตล์การเล่าคล้ายสารคดี ผสมปรัชญา และการเปรียบเปรยแบบเกินจริง
ผู้ฟังควรรู้สึกว่า "ฟังดูมีเหตุผล" และ "เดี๋ยวนะ...นี่มึงกำลังโม้อยู่ใช่ไหม" ในเวลาเดียวกัน

# OBJECTIVE
นำรายละเอียดสินค้าที่ได้รับ มาสร้างเป็นสคริปต์รีวิวความยาว 30-60 วินาที
ห้ามเปิดเรื่องด้วยการขายสินค้าโดยตรง ต้องเริ่มจากแนวคิด ปรัชญา ปัญหา หรือการเปรียบเทียบก่อนเสมอ แล้วค่อยเชื่อมโยงเข้าสินค้า

# STYLE
ใช้ประโยคสั้น ขึ้นบรรทัดใหม่บ่อย เว้นจังหวะให้คนอ่านตามทัน
ตัวอย่าง:
มีคนจำนวนมากเชื่อว่า...
แสงแดดเป็นเพียงแสง
ซึ่งก็ไม่ต่างอะไรจากการบอกว่า
เสือเป็นเพียงแมว
ความคิดนั้นฟังดูถูกต้อง
จนกระทั่งท่านเข้าใกล้มันมากพอ

# HUMOR RULES
ให้ใช้มุกแบบ "บากิ" โดยมีหลักดังนี้
1. เริ่มจากเรื่องธรรมดา
2. ขยายให้กลายเป็นเรื่องระดับสงคราม
3. เปรียบเทียบกับสัตว์ ธรรมชาติ วิทยาศาสตร์ หรือประวัติศาสตร์
4. พูดด้วยน้ำเสียงจริงจังราวกับเป็นข้อเท็จจริงระดับโลก
5. จบด้วยข้อสรุปที่ฟังดูมีเหตุผล แต่แอบเวอร์เกินจริง
ตัวอย่าง:
"บางคนคิดว่าไม่จำเป็นต้องพกแบตสำรอง นั่นก็ไม่ต่างจากนักดำน้ำ ที่คิดว่าตนเองไม่จำเป็นต้องหายใจ"
"หลายคนเชื่อว่าฝุ่นเป็นเพียงผงเล็กๆ ซึ่งก็ไม่ต่างจากการบอกว่า ฉลามเป็นเพียงปลา"

# LANGUAGE STYLE
ใช้คำสุภาพ แต่มีความกวนแบบผู้ใหญ่ สามารถใช้คำต่อไปนี้ได้เป็นครั้งคราว (ห้ามใช้บ่อยเกินไป):
ท่านผู้ชม, ข้าพเจ้า, น่าพิศวง, ความคิดนั้นฟังดูถูกต้อง, หาเป็นเช่นนั้นไม่, ข้าขออวยพร, ท่านพูดจาโป้ปดสมสู่อาชา, ฟังดูมีความหวัง แต่ข้อมูลไม่รองรับ, นั่นเป็นความกล้าหาญ หรือไม่ก็ประมาท

# HOOK GENERATION
ก่อนเริ่มสคริปต์ สร้างพาดหัวจำนวน 5 ข้อ โดยใช้รูปแบบดังนี้
* ดวงอาทิตย์ไม่ได้เกลียดคุณ...แต่มันก็ไม่ได้ปรานีคุณ
* การออกจากบ้านโดยไม่ป้องกันผิว คือการพนันรูปแบบหนึ่ง
* บางคนต่อสู้กับดวงอาทิตย์ด้วยหน้าเปล่า
* นี่อาจเป็นการต่อสู้ที่คุณแพ้ทุกวัน
* ศัตรูตัวนี้โจมตีคุณตั้งแต่เกิด
พาดหัวต้องชวนสงสัย และไม่ดูเหมือนกำลังขายสินค้า

# OVERLAY TITLE (พาดหัวตัวหนังสือใหญ่ในคลิป — คนละส่วนกับ hooks ด้านบน)
สร้างพาดหัวสั้นๆ อีก 1 ข้อ สำหรับใช้เป็นตัวหนังสือใหญ่ทับวิดีโอ (ไม่ใช่คำพูด)
กฎ:
- ต้องสื่อถึงสินค้าตรงๆ ทันทีที่อ่าน ไม่ใช้คำเปรียบเปรยหรือปรัชญา
- สั้นมาก ไม่เกิน 8-10 คำ อ่านจบในพริบตา
- เน้นจุดขายหรือความคุ้มของสินค้า
ตัวอย่าง: "ตะกร้าใหญ่มาก สุดคุ้ม", "ผ้าห่มนุ่มสุด ราคาเบาๆ", "ที่ชาร์จไร้สาย ใช้ง่ายมาก"

# STRUCTURE
1. Hook — เริ่มจากข้อคิด ปรัชญา หรือการเปรียบเทียบ
2. Escalation — ขยายเรื่องให้ดูยิ่งใหญ่เกินจริง เหมือนกำลังเล่าเรื่องสงครามหรือสารคดี
3. Product Reveal — เปิดเผยสินค้า พร้อมเชื่อมโยงว่าสินค้านี้ช่วยแก้ปัญหาได้อย่างไร
4. Closing — จบด้วยประโยคคมๆ ประชดเบาๆ หรือข้อคิดที่ทำให้คนยิ้ม
ตัวอย่าง Closing:
"แน่นอน... ท่านอาจไม่เชื่อข้า แต่ข้าก็ไม่คิดว่า ดวงอาทิตย์จะสนใจความเห็นของท่านเช่นกัน"

# INPUT
รายละเอียดสินค้า:
{{PRODUCT_INFORMATION}}

# OUTPUT
ส่งกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่นนอก JSON และห้ามครอบด้วย \`\`\`:
{
  "englishName": "ชื่อสินค้าเป็นภาษาอังกฤษแบบ PascalCase ไม่มีเว้นวรรค ไม่มีอักขระพิเศษ เช่น RiceWarmerGlove, SunscreenSPF50",
  "hooks": ["พาดหัวข้อ 1", "พาดหัวข้อ 2", "พาดหัวข้อ 3", "พาดหัวข้อ 4", "พาดหัวข้อ 5"],
  "overlayTitle": "พาดหัวตัวหนังสือใหญ่ในคลิป สั้น เข้าใจง่าย บอกตรงๆเกี่ยวกับสินค้า ไม่เกิน 8-10 คำ",
  "script": "บทพูด voiceover ล้วนๆ พร้อมพากย์เสียงทันที"
}

กฎของ "hooks": พาดหัว 5 ข้อ ชวนสงสัย ไม่ดูเหมือนกำลังขายสินค้า (สำหรับคำพูด)
กฎของ "overlayTitle": พาดหัวสั้น 1 ข้อ บอกสินค้าตรงๆ เข้าใจง่ายทันที (สำหรับตัวหนังสือใหญ่ในคลิป ไม่ใช่คำพูด)

กฎเหล็กของ "script" (สำคัญมาก):
- ใส่เฉพาะ "คำพูดที่จะพากย์จริง" เท่านั้น
- ห้ามมีคำเกริ่นนำ เช่น "นี่คือสคริปต์...", "ข้าพเจ้าขอเลือกสินค้า..."
- ห้ามมีหัวข้อหรือมาร์กดาวน์ เช่น #, **, "1. พาดหัว", "สคริปต์รีวิว:", "(ความยาว...)"
- ห้ามมีคำบรรยายการกระทำหรือฉากในวงเล็บเด็ดขาด เช่น (ภาพเปิด: ...), *(หยิบแก้วไวน์)*, *(ดับไฟ)*
- ห้ามนำพาดหัว (hooks) มาใส่ซ้ำในตัว script
- ขึ้นบรรทัดใหม่ได้ตามจังหวะการพูด เริ่มด้วยประโยคดึงดูด ปิดท้ายชวนคิด
- ชื่อสินค้าที่กล่าวถึงใน script ให้เป็นภาษาอังกฤษ`;

const VOICEOVER_PRESETS: VoiceoverPreset[] = [
  {
    id: 'business_mentor',
    label: '👔 ผู้ใหญ่สอนบริหาร', 
    description: 'สุขุม ตรงประเด็น เหมือนที่ปรึกษาธุรกิจรุ่นใหญ่',
    promptGuideline: 'สไตล์ผู้ใหญ่สอนบริหาร: ใช้น้ำเสียงสุขุม สุภาพ ตรงประเด็น เหมือนที่ปรึกษาธุรกิจรุ่นใหญ่ วิเคราะห์เจาะลึกกลยุทธ์การบริหารและการจัดการด้วยประสบการณ์ช่ำชอง'
  },
  { 
    id: 'finance_mentor', 
    label: '💰 ผู้ใหญ่สอนการเงิน', 
    description: 'สอนเงินแบบเข้าใจง่าย รอบคอบ ไม่ขายฝัน',
    promptGuideline: 'สไตล์ผู้ใหญ่สอนการเงิน: สอนเรื่องการเงินแบบเข้าใจง่าย รอบคอบ ไม่ขายฝัน เน้นสถิติ ความเป็นจริง และการวางแผนทางการเงินที่รัดกุมปลอดภัย'
  },
  { 
    id: 'retirement_life', 
    label: '🏡 ชีวิตวัยเกษียณ', 
    description: 'เล่าชีวิตหลังเกษียณแบบอบอุ่น ใช้ได้จริง',
    promptGuideline: 'สไตล์ชีวิตวัยเกษียณ: เล่าชีวิตหลังเกษียณด้วยน้ำเสียงอบอุ่น อ่อนโยน ให้ข้อคิดที่ใช้ได้จริงในชีวิตประจำวันอย่างเป็นธรรมชาติ'
  },
  { 
    id: 'deep_reminder', 
    label: '🧘 เตือนสติแบบนุ่มลึก', 
    description: 'เริ่มด้วยข้อคิดชวนสะดุ้ง แต่ไม่ขู่เกินจริง',
    promptGuideline: 'สไตล์เตือนสติแบบนุ่มลึก: เริ่มต้นบทพูดด้วยข้อคิดหรือคำถามชวนสะดุ้ง สะกิดใจให้คิดตามทันที แต่มีความเป็นจริงนุ่มลึก ไม่ใช้วิธีข่มขู่หรือสร้างความหวาดกลัวเกินจริง'
  },
  { 
    id: 'moral_storyteller', 
    label: '📖 เล่าเรื่องสอนใจ', 
    description: 'ใช้เรื่องเล่าสั้น ๆ แล้วสรุปเป็นบทเรียน',
    promptGuideline: 'สไตล์เล่าเรื่องสอนใจ: ใช้เรื่องเล่าหรือนิทานสั้นๆ ชวนติดตามก่อน แล้วค่อยสรุปถอดความชี้เป็นบทเรียนหรือคติเตือนใจในตอนท้ายอย่างสวยงาม'
  },
  { 
    id: 'quantum_dhamma', 
    label: '🌌 ธรรมะ Quantum EN', 
    description: 'ผู้ชายมีอายุ เล่าธรรมะเชื่อมควอนตัมเป็นอังกฤษ',
    promptGuideline: 'สไตล์ธรรมะ Quantum EN: บุคลิกผู้ชายมีอายุ เล่าประเด็นหลักคำสอนทางธรรมะที่เชื่อมโยงกับทฤษฎีควอนตัมฟิสิกส์ (Quantum Physics) เป็นภาษาอังกฤษสลับกับอธิบายสั้นๆ เป็นภาษาไทย'
  }
];

const VOICEOVER_LENGTHS = [
  { id: 'short', label: '⏱️ สั้น (300-500 ตัวอักษร)', description: 'ความยาว 30-45 วินาที กระชับมาก เน้นความไว', targetChars: 400 },
  { id: 'medium', label: '⏱️ กลาง (800-1100 ตัวอักษร)', description: 'ความยาว 1-1.5 นาที สรุปประเด็นได้ดีที่สุด', targetChars: 950 },
  { id: 'long', label: '⏱️ ยาว (1500-1800 ตัวอักษร)', description: 'ความยาว 2-2.5 นาที อภิปรายลึกมีหลักฐานสถิติรองรับ', targetChars: 1650 }
];

const PRESET_MODELS = [
  { value: 'google/gemini-3.5-flash',               label: 'Gemini 3.5 Flash (แนะนำ)' },
  { value: 'google/gemini-2.5-flash',               label: 'Gemini 2.5 Flash' },
  { value: 'anthropic/claude-3.5-haiku',            label: 'Claude 3.5 Haiku' },
  { value: 'openai/gpt-4o-mini',                    label: 'GPT-4o Mini' },
  { value: 'meta-llama/llama-3.1-8b-instruct:free', label: 'Llama 3.1 8B (ฟรี)' },
];

const IMAGE_RATIOS_MJ = [
  { label: '1:1', value: '--ar 1:1' },
  { label: '4:5', value: '--ar 4:5' },
  { label: '9:16', value: '--ar 9:16' },
  { label: '16:9', value: '--ar 16:9' },
  { label: '3:4', value: '--ar 3:4' },
];

const IMAGE_RATIOS_IMAGEN = [
  { label: '1:1', value: '1:1' },
  { label: '4:5', value: '4:5' },
  { label: '9:16', value: '9:16' },
  { label: '16:9', value: '16:9' },
  { label: '3:4', value: '3:4' },
];

// Helper to remove formatting ticks
const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

// ─── API Helper Calls ────────────────────────────────────────────────────────

async function callOpenRouterAI(messages: { role: string; content: string }[], model: string): Promise<string> {
  const apiKey = getLlmKey();
  if (!apiKey) throw new Error(missingLlmKeyMessage());

  const res = await chatCompletions({
    model: model || 'google/gemini-3.5-flash',
    messages,
    temperature: 0.72,
  });

  const data = await res.json();
  if (res.ok && !data.error) {
    return data.choices?.[0]?.message?.content?.trim() || '';
  }
  throw new Error(data.error?.message || `${getLlmProviderLabel()} API Error: ${res.status}`);
}

export default function PromptGeneratorPortal() {
  const [activeTab, setActiveTab] = useState<'stock' | 'prompt-builder'>('stock');

  // Module 1 Tab states
  const [stockSubTab, setStockSubTab] = useState<'api-image' | 'clickbait' | 'csv-clickbait' | 'voiceover' | 'product-review'>('api-image');

  // Direct keys loading from localStorage
  const openRouterKey = localStorage.getItem('openrouter_key')?.trim() || '';
  const kieApiKey = localStorage.getItem('kie_api_key')?.trim() || '';

  const [expandedKeywordsIds, setExpandedKeywordsIds] = useState<string[]>([]);
  const toggleKeywords = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedKeywordsIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // -------------------------------------------------------------
  // M1 SUB-TAB 1: สร้างรูปด้วย API (KIE.AI)
  // -------------------------------------------------------------
  const [apiSelectedPage, setApiSelectedPage] = useState<PageConfig>(DEFAULT_PAGE_CONFIGS[0]);
  const [apiTopicsInput, setApiTopicsInput] = useState('');
  const [apiAspectRatio, setApiAspectRatio] = useState<'1:1' | '9:16' | '16:9' | '4:3' | '3:4'>('1:1');
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [apiIsRunning, setApiIsRunning] = useState(false);
  const [apiGeneratedImage, setApiGeneratedImage] = useState('');

  const logApi = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setApiLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const runKieImageCreator = async () => {
    const topics = apiTopicsInput.split('\n').map(t => t.trim()).filter(Boolean);
    if (!topics.length) {
      alert('กรุณาป้อนหัวข้อสร้างรูปอย่างน้อย 1 หัวข้อ');
      return;
    }
    if (!kieApiKey) {
      alert('ไม่พบ KIE API Key กรุณาป้อน API Key ในแท็บ ตั้งค่าระบบ');
      return;
    }

    setApiIsRunning(true);
    setApiLogs([]);
    setApiGeneratedImage('');
    logApi(`เริ่มสร้างรูปภาพจำนวน ${topics.length} หัวข้อ...`);

    for (const topic of topics) {
      try {
        logApi(`สร้าง Prompt อิงตามธีมเพจ "${apiSelectedPage.name}"`);
        const creditLine = apiSelectedPage.image_credit
          ? `Footer: Include the text "${apiSelectedPage.image_credit}" at the bottom.`
          : 'No Watermarks/Credits: DO NOT include any footer, credits, or watermark.';

        const imagePrompt = `Detailed infographic about "${topic}". Visual layout follows theme: "${apiSelectedPage.image_theme}". Font style: "${apiSelectedPage.image_font}". ${creditLine}. Ultra-detailed, clean graphic.`;

        logApi(`ส่งคำสั่งงานสร้างรูปไปที่ KIE.AI Proxy...`);
        const response = await fetch('http://localhost:5005/api/kie-create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: kieApiKey,
            model: 'gpt-image-2-text-to-image',
            input: {
              prompt: imagePrompt,
              aspect_ratio: apiAspectRatio,
              resolution: '1K'
            }
          })
        });

        const data = await response.json();
        const taskId = data?.data?.taskId || data?.taskId;

        if (data.code !== 200 || !taskId) {
          throw new Error(data.msg || 'KIE.AI ไม่ส่ง taskId กลับมา');
        }

        logApi(`สร้างงานสำเร็จบนคิว KIE.AI (Task ID: ${taskId}) กำลังรอการเรนเดอร์...`);

        // Poll KIE.AI status proxy
        let success = false;
        for (let poll = 1; poll <= 60; poll++) {
          await new Promise(r => setTimeout(r, 5000));
          logApi(`ตรวจสถานะ KIE.AI (${poll}/60)...`);

          const statusRes = await fetch(`http://localhost:5005/api/kie-status?taskId=${encodeURIComponent(taskId)}&apiKey=${encodeURIComponent(kieApiKey)}`);
          const statusData = await statusRes.json();
          const taskInfo = statusData.data || statusData;
          const state = String(taskInfo.state || taskInfo.status || '').toLowerCase();

          logApi(`ผลตรวจ: ${state}`);

          if (state === 'success' || state === 'completed' || state === 'done') {
            let extractedUrl = taskInfo.resultJson || taskInfo.result || '';
            if (typeof extractedUrl === 'object' && extractedUrl !== null) {
              extractedUrl = extractedUrl.resultUrls?.[0] || extractedUrl.images?.[0]?.url || extractedUrl.url || '';
            }
            if (extractedUrl) {
              setApiGeneratedImage(extractedUrl);
              logApi(`🎉 สำเร็จ! ได้ลิงก์รูปภาพ: ${extractedUrl}`);
              success = true;
              break;
            }
          } else if (state === 'fail' || state === 'failed' || state === 'error') {
            throw new Error(taskInfo.failMsg || 'KIE.AI รายงานว่าเกิดข้อผิดพลาดในการประมวลผล');
          }
        }
        if (!success) throw new Error('หมดเวลารอรูปภาพ (เกิน 5 นาที)');
      } catch (err: any) {
        logApi(`❌ ล้มเหลวสำหรับหัวข้อ "${topic}": ${err.message}`);
      }
    }
    setApiIsRunning(false);
  };


  // -------------------------------------------------------------
  // M1 SUB-TAB 2: สร้างโพส clickbait
  // -------------------------------------------------------------
  const [cbInput, setCbInput] = useState('');
  const [cbPosts, setCbPosts] = useState<ClickbaitPostItem[]>([]);
  const [cbIsRunning, setCbIsRunning] = useState(false);

  const cleanClickbaitText = (text: string) => {
    return text.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  };

  const createFallbackClickbaitPost = (topic: string): Omit<ClickbaitPostItem, 'id' | 'createdAt'> => {
    const cleanTopic = topic.trim();
    return {
      topic: cleanTopic,
      headline: `แจกขุมทรัพย์ไอเดีย! เปลี่ยน "${cleanTopic}" เป็นระบบสร้างเงินที่ทำจริงได้ทันที (มีต่อ👇)`,
      postText: `ใครอยากเริ่มต้นทำเรื่อง "${cleanTopic}" แต่ไม่มีเข็มทิศ เซฟโพสต์นี้ไว้ได้เลย! รวบรวมแนวทาง 15 ข้อ ที่คุยกับ AI ปุ๊บทำงานได้ปั๊บ ครบสูตรความมั่งคั่ง`,
      comments: [
        `1/3\n1. แตกแผนผังเริ่มต้นทำ "${cleanTopic}" ภายใน 15 นาทีแรก\n2. เช็คลิสต์ 5 สิ่งที่คนส่วนใหญ่ทำพลาดแล้วล้มเลิก\n3. โครงสร้างคำถามคุยกับ AI เพื่อวิเคราะห์หาตลาดหลัก\n\nต่อใน 2/3 👇`,
        `2/3\n4. ตารางคุมงาน 7 วันแรกสำหรับมือใหม่เวลาจำกัด\n5. สูตรคำนวณต้นทุน/กำไรขั้นพื้นฐานสำหรับเรื่องนี้\n6. เทมเพลตวางแผน SOP ทำตามได้ทันที\n\nต่อใน 3/3 👇`,
        `3/3\n7. ประเมินผลงานและปรับแก้ทิศทาง\n8. ลิงก์เครื่องมือแถมฟรีสำหรับเอาไปต่อยอด\n\nเซฟแล้วนำไปใช้ได้เลย!`
      ],
      status: 'done'
    };
  };

  const generateClickbaitPosts = async () => {
    const topics = cbInput.split('\n').map(t => t.trim()).filter(Boolean);
    if (!topics.length) {
      alert('กรุณาใส่หัวข้อโพสต์อย่างน้อย 1 บรรทัด');
      return;
    }
    setCbIsRunning(true);

    let currentIdx = 1;
    for (const topic of topics) {
      let item: ClickbaitPostItem;
      try {
        if (!openRouterKey) {
          const fallback = createFallbackClickbaitPost(topic);
          item = {
            ...fallback,
            id: `cb-${Date.now()}-${currentIdx}`,
            createdAt: new Date().toLocaleDateString('th-TH')
          };
        } else {
          const prompt = `คุณคือคนเขียนโพสต์เพจไทยสไตล์แจก Prompt/แจกวิธีทำ แบบหัวข้อ clickbait พอดีๆ ไม่หลอกลวง
ให้สร้างโพสต์ Facebook สำหรับหัวข้อ: "${topic}"

Pattern ที่ต้องเลียนแบบ:
- หัวข้อหลักต้องชวนคลิก มีคำแนว แจก Prompt, ขุมทรัพย์, เซฟไว้, เอาไปใช้ได้ทันที, มีต่อ👇
- โพสต์หลักสั้น ชวนให้อ่านต่อในคอมเมนต์
- ใต้คอมเมนต์ต้องมี 3 ตอนเท่านั้น โดยขึ้นต้นด้วย 1/3, 2/3, 3/3
- แต่ละคอมเมนต์ควรมีรายการ Prompt/วิธีทำ 4-6 ข้อ ใช้เลขลำดับต่อเนื่อง
- ภาษาไทยอ่านง่าย ใช้ได้จริง ไม่ต้องมี markdown, ไม่ต้องใส่คำอธิบายงาน

ส่งกลับเป็น JSON เท่านั้น:
{
  "headline": "...",
  "postText": "...",
  "comments": ["1/3...", "2/3...", "3/3..."]
}`;

          const raw = await callOpenRouterAI([{ role: 'user', content: prompt }], 'google/gemini-3.5-flash');
          const parsed = JSON.parse(cleanClickbaitText(raw));

          item = {
            id: `cb-${Date.now()}-${currentIdx}`,
            topic,
            headline: parsed.headline || `หัวข้อเด็ดเรื่อง ${topic}`,
            postText: parsed.postText || 'รายละเอียดในคอมเมนต์นะครับ',
            comments: parsed.comments || ['', '', ''],
            status: 'done',
            createdAt: new Date().toLocaleDateString('th-TH')
          };
        }
      } catch (err: any) {
        const fallback = createFallbackClickbaitPost(topic);
        item = {
          ...fallback,
          id: `cb-${Date.now()}-${currentIdx}`,
          createdAt: new Date().toLocaleDateString('th-TH'),
          status: 'error',
          error: err.message
        };
      }
      setCbPosts(prev => [item, ...prev]);
      currentIdx++;
    }

    setCbIsRunning(false);
  };


  // -------------------------------------------------------------
  // M1 SUB-TAB 3: CSV → Clickbait + ใต้เม้น
  // -------------------------------------------------------------
  const [csvContent, setCsvContent] = useState('');
  const [csvCbResults, setCsvCbResults] = useState<ClickbaitPostItem[]>([]);
  const [csvCbRunning, setCsvCbRunning] = useState(false);

  const parseCSVRows = (text: string): { title: string; article: string }[] => {
    const lines = text.split('\n').filter(Boolean);
    const parsed: { title: string; article: string }[] = [];
    
    // Skip header if matches standard csv
    const startIndex = lines[0].toLowerCase().includes('title') || lines[0].toLowerCase().includes('caption') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i];
      // Simple splitting by comma/quote
      const parts = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);
      if (parts.length > 0) {
        const title = parts[0]?.replace(/^"|"$/g, '').trim() || `บทความที่ ${i + 1}`;
        const article = parts[1]?.replace(/^"|"$/g, '').trim() || line;
        parsed.push({ title, article });
      }
    }
    return parsed;
  };

  const runCsvClickbaitGenerator = async () => {
    const rows = parseCSVRows(csvContent);
    if (!rows.length) {
      alert('ไม่พบข้อมูลบทความใน CSV');
      return;
    }
    if (!openRouterKey) {
      alert('กรุณากรอก OpenRouter Key ในแท็บ ตั้งค่าระบบ ก่อนเริ่มรันงานนี้');
      return;
    }

    setCsvCbRunning(true);

    let currentIdx = 1;
    for (const row of rows) {
      let item: ClickbaitPostItem;
      try {
        const prompt = `คุณคือคนเขียนโพสต์เพจไทยที่เก่งมากในการสรุปบทความให้น่าสนใจ

อ่านเนื้อหาบทความนี้:
"""
${row.article.slice(0, 5000)}
"""

งานของคุณ:
1. เขียน "headline" — โพสต์หลักแบบ clickbait สั้นๆ (1-3 บรรทัด) ที่ชวนคลิกมาก ต้องมี "(มีต่อ👇)" ต่อท้าย
2. เขียน "postText" — ข้อความสั้น 2-4 บรรทัดชวนให้อ่านต่อในคอมเมนต์
3. เขียน "comments" — 3 คอมเมนต์ เป็นการสรุปเนื้อหาบทความแบ่งเป็น 3 ส่วน:
   - คอมเมนต์แรกขึ้นต้นด้วย "1/3" แล้วสรุปส่วนแรก
   - คอมเมนต์สองขึ้นต้นด้วย "2/3" แล้วสรุปส่วนกลาง
   - คอมเมนต์สามขึ้นต้นด้วย "3/3" แล้วสรุปส่วนท้าย
   แต่ละคอมเมนต์ควรมี 4-8 ข้อ/bullet ใช้ emoji ประกอบได้

ภาษาไทยอ่านง่าย ไม่ต้องมี markdown

ส่งกลับเป็น JSON เท่านั้น:
{
  "headline": "...",
  "postText": "...",
  "comments": ["1/3...", "2/3...", "3/3..."]
}`;

        const raw = await callOpenRouterAI([{ role: 'user', content: prompt }], 'google/gemini-3.5-flash');
        const parsed = JSON.parse(cleanClickbaitText(raw));

        item = {
          id: `csv-cb-${Date.now()}-${currentIdx}`,
          topic: row.title,
          headline: parsed.headline || `${row.title} (มีต่อ👇)`,
          postText: parsed.postText || 'อ่านเรื่องนี้ลึกๆ ได้ในกล่องใต้คอมเมนต์ครับ',
          comments: parsed.comments || ['', '', ''],
          status: 'done',
          createdAt: new Date().toLocaleDateString('th-TH')
        };
      } catch (err: any) {
        item = {
          id: `csv-cb-${Date.now()}-${currentIdx}`,
          topic: row.title,
          headline: `${row.title} (มีต่อ👇)`,
          postText: 'เกิดข้อผิดพลาดในการประมวลผลสรุปเนื้อหาบทความชิ้นนี้',
          comments: [`1/3\nสรุปล้มเหลว: ${err.message}`, '', ''],
          status: 'error',
          error: err.message,
          createdAt: new Date().toLocaleDateString('th-TH')
        };
      }
      setCsvCbResults(prev => [item, ...prev]);
      currentIdx++;
    }

    setCsvCbRunning(false);
  };


  // -------------------------------------------------------------
  // M1 SUB-TAB 4: Avatar Voiceover Script
  // -------------------------------------------------------------
  const [voInput, setVoInput] = useState('');
  const [voPreset, setVoPreset] = useState('business_mentor');
  const [voLength, setVoLength] = useState('medium');
  const [voResults, setVoResults] = useState<VoiceoverResult[]>([]);
  const [voIsRunning, setVoIsRunning] = useState(false);
  const [voLogs, setVoLogs] = useState<string[]>([]);

  const logVo = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setVoLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const generateVoiceoverScripts = async () => {
    const topics = voInput.split('\n').map(t => t.trim()).filter(Boolean);
    if (!topics.length) {
      alert('กรุณากรอกหัวข้อ Voiceover อย่างน้อย 1 บรรทัด');
      return;
    }
    if (!openRouterKey) {
      alert('กรุณากรอก OpenRouter Key ในแท็บ ตั้งค่าระบบ ก่อนทำกิจกรรมนี้');
      return;
    }

    setVoIsRunning(true);
    setVoLogs([]);
    logVo(`เริ่มการประมวลผลเขียนสคริปต์จำนวน ${topics.length} หัวข้อ...`);

    const activePreset = VOICEOVER_PRESETS.find(p => p.id === voPreset) || VOICEOVER_PRESETS[0];
    const activeLength = VOICEOVER_LENGTHS.find(l => l.id === voLength) || VOICEOVER_LENGTHS[1];

    let currentIdx = 1;
    for (const topic of topics) {
      let item: VoiceoverResult;
      try {
        logVo(`[${currentIdx}/${topics.length}] กำลังส่งข้อมูลให้ AI เขียนบทพูดสำหรับหัวข้อ: "${topic}"...`);
        const prompt = `คุณคือผู้เขียนบทพูดวิดีโอ (Voiceover Script) ระดับมืออาชีพของไทย
เขียนบทพูดสไตล์ธรรมชาติ น่าฟัง สำหรับหัวข้อ: "${topic}"

ข้อมูลแนวทาง:
- แนวการพูด/บุคลิก: ${activePreset.label} (${activePreset.description})
- รายละเอียดบุคลิกและคำสั่งเฉพาะ: ${activePreset.promptGuideline || ''}
- ความยาวเป้าหมาย: ${activeLength.label} (${activeLength.description})
- ห้ามมีคำนำทาง เช่น "นี่คือบทพูด" หรือ "สวัสดีผู้รับชม"
- ห้ามมีคำอธิบายวงเล็บ เช่น (ดนตรีขึ้น), [ภาพตัดไป]
- ห้ามมี Markdown, เครื่องหมาย # หรือหัวข้อเรื่องเด็ดขาด
- ให้เริ่มต้นด้วยประโยคดึงดูดความสนใจทันที และปิดจบด้วยการทิ้งท้ายชวนคิด

เขียนบทพูดทั้งหมดเป็นความเรียงที่พร้อมสำหรับนำไปใส่ AI Avatar Voiceover เพื่อใช้แปลงเป็นเสียงสังเคราะห์ทันที`;

        const raw = await callOpenRouterAI([{ role: 'user', content: prompt }], 'google/gemini-3.5-flash');

        logVo(`[สำเร็จ] หัวข้อที่ ${currentIdx}: "${topic}" เขียนสคริปต์เสร็จเรียบร้อย!`);
        item = {
          id: `vo-${Date.now()}-${currentIdx}`,
          topic,
          script: raw.replace(/\*\*|##/g, '').trim(),
          presetId: voPreset,
          lengthId: voLength,
          createdAt: new Date().toLocaleDateString('th-TH')
        };
      } catch (err: any) {
        logVo(`❌ [ล้มเหลว] หัวข้อที่ ${currentIdx}: "${topic}" เกิดข้อผิดพลาด: ${err.message}`);
        item = {
          id: `vo-${Date.now()}-${currentIdx}`,
          topic,
          script: `[ล้มเหลวในการเขียนสคริปต์: ${err.message}]`,
          presetId: voPreset,
          lengthId: voLength,
          error: err.message,
          createdAt: new Date().toLocaleDateString('th-TH')
        };
      }
      setVoResults(prev => [item, ...prev]);
      currentIdx++;
    }

    logVo(`🎉 เสร็จสิ้นการผลิตสคริปต์ทั้งหมดแล้ว!`);
    setVoIsRunning(false);
  };

  const exportVoToCSV = (rows: VoiceoverResult[]) => {
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const header = ['ID', 'Topic', 'Script', 'Persona', 'Length', 'Created At'];

    const body = rows.map(r => {
      return [
        r.id,
        r.topic,
        r.script,
        r.presetId,
        r.lengthId,
        r.createdAt || ''
      ].map(escape).join(',');
    });

    const csv = '\ufeff' + [header.map(escape).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `voiceover_scripts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // M1 SUB-TAB 5: \u0e23\u0e35\u0e27\u0e34\u0e27\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 Shopee (CSV \u2192 \u0e2b\u0e25\u0e32\u0e22 Script \u0e15\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32)
  // \u0e43\u0e0a\u0e49\u0e1a\u0e38\u0e04\u0e25\u0e34\u0e01 "\u0e1c\u0e39\u0e49\u0e14\u0e35\u0e08\u0e34\u0e1a\u0e44\u0e27\u0e19\u0e4c" (ROLE_SHOPEE_TEMPLATE) \u0e42\u0e14\u0e22\u0e40\u0e09\u0e1e\u0e32\u0e30 \u0e41\u0e22\u0e01\u0e08\u0e32\u0e01\u0e41\u0e17\u0e47\u0e1a Voiceover \u0e40\u0e14\u0e34\u0e21
  // -------------------------------------------------------------
  const [prProducts, setPrProducts] = useState<{ name: string; detail: string }[]>([]);
  const [prCsvFileName, setPrCsvFileName] = useState('');
  const [prScriptsPerItem, setPrScriptsPerItem] = useState(3);
  const [prLength, setPrLength] = useState('medium');
  const [prResults, setPrResults] = useState<ProductScriptResult[]>([]);
  const [prIsRunning, setPrIsRunning] = useState(false);
  const [prLogs, setPrLogs] = useState<string[]>([]);
  const prFileRef = useRef<HTMLInputElement>(null);
  const [prSelected, setPrSelected] = useState<string[]>([]);
  const [prSheetUrl, setPrSheetUrl] = useState(() => localStorage.getItem('pr_gsheet_url') || 'https://docs.google.com/spreadsheets/d/18sppbH-mkojCxcMhOMz726a8UVwx6jUl-UaXoSHIxi0/edit?gid=337821009');
  const [prSheetLoading, setPrSheetLoading] = useState(false);

  const logPr = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setPrLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  // CSV parser \u0e41\u0e1a\u0e1a\u0e23\u0e2d\u0e07\u0e23\u0e31\u0e1a field \u0e17\u0e35\u0e48\u0e21\u0e35 comma / newline \u0e20\u0e32\u0e22\u0e43\u0e19\u0e40\u0e04\u0e23\u0e37\u0e48\u0e2d\u0e07\u0e2b\u0e21\u0e32\u0e22\u0e04\u0e33\u0e1e\u0e39\u0e14
  const parseCsvRecords = (text: string): string[][] => {
    const records: string[][] = [];
    let row: string[] = [];
    let field = '';
    let inQuotes = false;
    const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < src.length; i++) {
      const c = src[i];
      if (inQuotes) {
        if (c === '"') {
          if (src[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\n') {
        row.push(field); field = '';
        if (row.some(f => f.trim() !== '')) records.push(row);
        row = [];
      } else field += c;
    }
    if (field !== '' || row.length) {
      row.push(field);
      if (row.some(f => f.trim() !== '')) records.push(row);
    }
    return records;
  };

  // \u0e41\u0e1b\u0e25\u0e07\u0e40\u0e1b\u0e47\u0e19\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32: \u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c 1 = \u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32, \u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c 2 = \u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32
  const parseProductCSV = (text: string): { name: string; detail: string }[] => {
    const records = parseCsvRecords(text);
    if (!records.length) return [];
    const first = (records[0][0] || '').toLowerCase();
    const isHeader = first.includes('\u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32') || first.includes('\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32') || first.includes('name') || first.includes('product');
    const rows = isHeader ? records.slice(1) : records;
    return rows
      .map(r => ({ name: (r[0] || '').trim(), detail: (r[1] || '').trim() }))
      .filter(p => p.name);
  };

  // \u0e41\u0e1b\u0e25\u0e07\u0e0a\u0e37\u0e48\u0e2d\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29\u0e43\u0e2b\u0e49\u0e40\u0e1b\u0e47\u0e19 PascalCase \u0e1b\u0e25\u0e2d\u0e14\u0e20\u0e31\u0e22\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a\u0e0a\u0e37\u0e48\u0e2d\u0e04\u0e25\u0e34\u0e1b \u0e40\u0e0a\u0e48\u0e19 "Rice Warmer Glove" \u2192 "RiceWarmerGlove"
  const toPascalEnglish = (s: string) => {
    const cleaned = (s || '').replace(/[^A-Za-z0-9]+/g, ' ').trim();
    if (!cleaned) return '';
    return cleaned.split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('').slice(0, 40);
  };

  // ตั้งรายการสินค้า + เลือกทั้งหมดโดยอัตโนมัติ
  const applyPrProducts = (products: { name: string; detail: string }[], sourceName: string) => {
    setPrProducts(products);
    setPrCsvFileName(sourceName);
    setPrSelected(products.map(p => p.name));
  };

  const togglePrSelect = (name: string) =>
    setPrSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  const togglePrSelectAll = () =>
    setPrSelected(prev => prev.length === prProducts.length ? [] : prProducts.map(p => p.name));

  // เลข 001 + ชื่ออังกฤษ จากชื่อสินค้ารูปแบบ "001_RiceWarmerGlove" (คงเลขจริงแม้เลือกบางตัว)
  const prProductNo = (product: { name: string }, idx: number) => {
    const m = (product.name || '').match(/^\s*(\d{1,6})/);
    return m ? m[1].padStart(3, '0') : String(idx + 1).padStart(3, '0');
  };
  const prEnglishFromName = (product: { name: string }) => {
    const m = (product.name || '').match(/^\s*\d{1,6}[_\-\s]+(.+)$/);
    return m ? toPascalEnglish(m[1]) : '';
  };

  // ดึงสินค้าจาก Google Sheet ผ่าน backend (เลี่ยง CORS)
  const loadFromGoogleSheet = async () => {
    if (!prSheetUrl.trim()) { alert('กรุณาวางลิงก์ Google Sheet ก่อน'); return; }
    setPrSheetLoading(true);
    try {
      localStorage.setItem('pr_gsheet_url', prSheetUrl);
      const res = await fetch(`http://localhost:5005/api/gsheet-products?url=${encodeURIComponent(prSheetUrl)}`);
      const data = await res.json();
      if (data.success && data.products?.length) {
        applyPrProducts(data.products.map((p: any) => ({ name: p.name, detail: p.detail })), 'Google Sheet');
        logPr(`🔗 ดึงจาก Google Sheet สำเร็จ — พบสินค้า ${data.products.length} รายการ (เลือกทั้งหมดให้แล้ว)`);
      } else {
        alert(data.error || 'ดึง Google Sheet ไม่สำเร็จ');
        logPr(`❌ ${data.error || 'ดึง Google Sheet ไม่สำเร็จ'}`);
      }
    } catch (e: any) {
      alert(`ดึง Google Sheet ไม่สำเร็จ: ${e.message}`);
    } finally {
      setPrSheetLoading(false);
    }
  };

  // \u0e15\u0e31\u0e14\u0e2a\u0e48\u0e27\u0e19\u0e17\u0e35\u0e48\u0e44\u0e21\u0e48\u0e43\u0e0a\u0e48\u0e1a\u0e17\u0e1e\u0e39\u0e14\u0e2d\u0e2d\u0e01\u0e08\u0e32\u0e01 script (\u0e04\u0e33\u0e40\u0e01\u0e23\u0e34\u0e48\u0e19/\u0e2b\u0e31\u0e27\u0e02\u0e49\u0e2d/\u0e27\u0e07\u0e40\u0e25\u0e47\u0e1a\u0e01\u0e32\u0e23\u0e01\u0e23\u0e30\u0e17\u0e33) \u0e40\u0e1c\u0e37\u0e48\u0e2d AI \u0e2b\u0e25\u0e38\u0e14\u0e21\u0e32
  const cleanVoiceScript = (raw: string) =>
    (raw || '')
      .replace(/```(?:json)?/gi, '')
      .replace(/^\s*#{1,6}\s.*$/gm, '')          // \u0e2b\u0e31\u0e27\u0e02\u0e49\u0e2d\u0e21\u0e32\u0e23\u0e4c\u0e01\u0e14\u0e32\u0e27\u0e19\u0e4c # ...
      .replace(/\*\([^)]*\)\*/g, '')             // *(\u0e04\u0e33\u0e1a\u0e23\u0e23\u0e22\u0e32\u0e22\u0e01\u0e32\u0e23\u0e01\u0e23\u0e30\u0e17\u0e33)*
      .replace(/^\s*\*?\([^)]*\)\*?\s*$/gm, '')  // \u0e17\u0e31\u0e49\u0e07\u0e1a\u0e23\u0e23\u0e17\u0e31\u0e14\u0e17\u0e35\u0e48\u0e40\u0e1b\u0e47\u0e19\u0e27\u0e07\u0e40\u0e25\u0e47\u0e1a\u0e01\u0e32\u0e23\u0e01\u0e23\u0e30\u0e17\u0e33
      .replace(/\*\*/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

  const handlePrCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const products = parseProductCSV(String(reader.result || ''));
      if (!products.length) {
        alert('\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e32\u0e22\u0e01\u0e32\u0e23\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e43\u0e19\u0e44\u0e1f\u0e25\u0e4c CSV (\u0e04\u0e32\u0e14\u0e2b\u0e27\u0e31\u0e07\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c: \u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32, \u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32)');
        return;
      }
      applyPrProducts(products, file.name);
      logPr(`\ud83d\udce5 \u0e42\u0e2b\u0e25\u0e14\u0e44\u0e1f\u0e25\u0e4c "${file.name}" \u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08 \u0e1e\u0e1a\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 ${products.length} \u0e23\u0e32\u0e22\u0e01\u0e32\u0e23`);
    };
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  const clearPrProducts = () => {
    setPrProducts([]);
    setPrCsvFileName('');
    setPrSelected([]);
  };

  const generateProductScripts = async () => {
    if (!prProducts.length) {
      alert('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e2d\u0e31\u0e1b\u0e42\u0e2b\u0e25\u0e14\u0e44\u0e1f\u0e25\u0e4c CSV \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e01\u0e48\u0e2d\u0e19 (\u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c 1 = \u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32, \u0e04\u0e2d\u0e25\u0e31\u0e21\u0e19\u0e4c 2 = \u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32)');
      return;
    }
    if (!openRouterKey) {
      alert('\u0e01\u0e23\u0e38\u0e13\u0e32\u0e01\u0e23\u0e2d\u0e01 OpenRouter Key \u0e43\u0e19\u0e41\u0e17\u0e47\u0e1a \u0e15\u0e31\u0e49\u0e07\u0e04\u0e48\u0e32\u0e23\u0e30\u0e1a\u0e1a \u0e01\u0e48\u0e2d\u0e19\u0e17\u0e33\u0e01\u0e34\u0e08\u0e01\u0e23\u0e23\u0e21\u0e19\u0e35\u0e49');
      return;
    }

    const targets = prProducts.filter(p => prSelected.includes(p.name));
    if (!targets.length) { alert('กรุณาติ๊กเลือกสินค้าอย่างน้อย 1 รายการก่อนสร้างสคริปต์'); return; }
    const perItem = Math.max(1, Math.min(20, prScriptsPerItem || 1));
    const activeLength = VOICEOVER_LENGTHS.find(l => l.id === prLength) || VOICEOVER_LENGTHS[1];
    const totalJobs = targets.length * perItem;

    setPrIsRunning(true);
    setPrLogs([]);
    logPr(`\u0e40\u0e23\u0e34\u0e48\u0e21\u0e1c\u0e25\u0e34\u0e15\u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c\u0e23\u0e35\u0e27\u0e34\u0e27: ${prProducts.length} \u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 \u00d7 ${perItem} \u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c = ${totalJobs} \u0e0a\u0e34\u0e49\u0e19`);

    let currentIdx = 1;
    for (let p = 0; p < targets.length; p++) {
      const product = targets[p];
      const productNo = prProductNo(product, prProducts.indexOf(product));   // 001, 002, ... \u0e15\u0e32\u0e21\u0e25\u0e33\u0e14\u0e31\u0e1a\u0e43\u0e19\u0e44\u0e1f\u0e25\u0e4c (\u0e40\u0e2b\u0e21\u0e37\u0e2d\u0e19\u0e0a\u0e37\u0e48\u0e2d\u0e42\u0e1f\u0e25\u0e40\u0e14\u0e2d\u0e23\u0e4c)
      let englishName = prEnglishFromName(product);                                 // \u0e01\u0e33\u0e2b\u0e19\u0e14\u0e04\u0e23\u0e31\u0e49\u0e07\u0e40\u0e14\u0e35\u0e22\u0e27\u0e15\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 \u0e43\u0e2b\u0e49\u0e0a\u0e37\u0e48\u0e2d\u0e04\u0e25\u0e34\u0e1b\u0e17\u0e38\u0e01 script \u0e02\u0e2d\u0e07\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e19\u0e35\u0e49\u0e2a\u0e2d\u0e14\u0e04\u0e25\u0e49\u0e2d\u0e07\u0e01\u0e31\u0e19
      const fallbackName = `Product${productNo}`;
      const productInfo = product.detail
        ? `\u0e0a\u0e37\u0e48\u0e2d\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32: ${product.name}\n\u0e23\u0e32\u0e22\u0e25\u0e30\u0e40\u0e2d\u0e35\u0e22\u0e14\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32: ${product.detail}`
        : product.name;

      for (let i = 1; i <= perItem; i++) {
        const variationNote = perItem > 1
          ? `\n\n[\u0e2b\u0e21\u0e32\u0e22\u0e40\u0e2b\u0e15\u0e38] \u0e19\u0e35\u0e48\u0e04\u0e37\u0e2d\u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c\u0e0a\u0e38\u0e14\u0e17\u0e35\u0e48 ${i} \u0e08\u0e32\u0e01\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14 ${perItem} \u0e0a\u0e38\u0e14\u0e2a\u0e33\u0e2b\u0e23\u0e31\u0e1a "${product.name}" \u2014 \u0e01\u0e23\u0e38\u0e13\u0e32\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e1e\u0e32\u0e14\u0e2b\u0e31\u0e27\u0e41\u0e25\u0e30\u0e21\u0e38\u0e21\u0e21\u0e2d\u0e07\u0e43\u0e2b\u0e49\u0e41\u0e15\u0e01\u0e15\u0e48\u0e32\u0e07\u0e08\u0e32\u0e01\u0e0a\u0e38\u0e14\u0e2d\u0e37\u0e48\u0e19\u0e2d\u0e22\u0e48\u0e32\u0e07\u0e0a\u0e31\u0e14\u0e40\u0e08\u0e19`
          : '';
        let item: ProductScriptResult;

        try {
          logPr(`[${currentIdx}/${totalJobs}] \u0e01\u0e33\u0e25\u0e31\u0e07\u0e40\u0e02\u0e35\u0e22\u0e19\u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32 #${productNo} "${product.name}" (\u0e0a\u0e38\u0e14\u0e17\u0e35\u0e48 ${i}/${perItem})...`);
          const prompt = ROLE_SHOPEE_TEMPLATE.replace('{{PRODUCT_INFORMATION}}', productInfo)
            + `\n\n[\u0e1b\u0e23\u0e31\u0e1a\u0e04\u0e27\u0e32\u0e21\u0e22\u0e32\u0e27] ${activeLength.description} (~${activeLength.targetChars} \u0e15\u0e31\u0e27\u0e2d\u0e31\u0e01\u0e29\u0e23)`
            + variationNote;

          const raw = await callOpenRouterAI([{ role: 'user', content: prompt }], 'google/gemini-3.5-flash');
          const parsed = JSON.parse(cleanClickbaitText(raw));

          // \u0e43\u0e0a\u0e49\u0e0a\u0e37\u0e48\u0e2d\u0e2d\u0e31\u0e07\u0e01\u0e24\u0e29\u0e08\u0e32\u0e01\u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c\u0e0a\u0e38\u0e14\u0e41\u0e23\u0e01\u0e40\u0e1b\u0e47\u0e19\u0e21\u0e32\u0e15\u0e23\u0e10\u0e32\u0e19\u0e02\u0e2d\u0e07\u0e2a\u0e34\u0e19\u0e04\u0e49\u0e32\u0e19\u0e35\u0e49\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14
          if (!englishName) englishName = toPascalEnglish(parsed.englishName) || fallbackName;

          const hooks: string[] = Array.isArray(parsed.hooks)
            ? parsed.hooks.map((h: any) => String(h).trim()).filter(Boolean)
            : [];
          const overlayTitle = String(parsed.overlayTitle || '').trim();

          const clipName = `${productNo}_${englishName}_script${i}`;
          logPr(`[\u0e2a\u0e33\u0e40\u0e23\u0e47\u0e08] ${clipName} \u0e40\u0e02\u0e35\u0e22\u0e19\u0e40\u0e2a\u0e23\u0e47\u0e08\u0e40\u0e23\u0e35\u0e22\u0e1a\u0e23\u0e49\u0e2d\u0e22!`);
          item = {
            id: `pr-${Date.now()}-${currentIdx}`,
            productName: product.name,
            englishName,
            clipName,
            hooks,
            overlayTitle,
            script: cleanVoiceScript(String(parsed.script || '')),
            detail: product.detail,
            lengthId: prLength,
            createdAt: new Date().toLocaleDateString('th-TH')
          };
        } catch (err: any) {
          if (!englishName) englishName = fallbackName;
          const clipName = `${productNo}_${englishName}_script${i}`;
          logPr(`\u274c [\u0e25\u0e49\u0e21\u0e40\u0e2b\u0e25\u0e27] ${clipName}: ${err.message}`);
          item = {
            id: `pr-${Date.now()}-${currentIdx}`,
            productName: product.name,
            englishName,
            clipName,
            hooks: [],
            overlayTitle: '',
            script: `[\u0e25\u0e49\u0e21\u0e40\u0e2b\u0e25\u0e27\u0e43\u0e19\u0e01\u0e32\u0e23\u0e40\u0e02\u0e35\u0e22\u0e19\u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c: ${err.message}]`,
            detail: product.detail,
            lengthId: prLength,
            error: err.message,
            createdAt: new Date().toLocaleDateString('th-TH')
          };
        }
        setPrResults(prev => [...prev, item]);
        currentIdx++;
      }
    }

    logPr(`\ud83c\udf89 \u0e40\u0e2a\u0e23\u0e47\u0e08\u0e2a\u0e34\u0e49\u0e19\u0e01\u0e32\u0e23\u0e1c\u0e25\u0e34\u0e15\u0e2a\u0e04\u0e23\u0e34\u0e1b\u0e15\u0e4c\u0e23\u0e35\u0e27\u0e34\u0e27\u0e17\u0e31\u0e49\u0e07\u0e2b\u0e21\u0e14 ${totalJobs} \u0e0a\u0e34\u0e49\u0e19\u0e41\u0e25\u0e49\u0e27!`);
    setPrIsRunning(false);
  };

  const exportPrToCSV = (rows: ProductScriptResult[]) => {
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const header = ['Clip Name', 'Product', 'Overlay Title', 'Hook', 'Script', 'Length', 'Created At'];

    const body = rows.map(r => [
      r.clipName,
      r.productName,
      r.overlayTitle || '',
      (r.hooks || []).join('\n'),
      r.script,
      r.lengthId,
      r.createdAt || ''
    ].map(escape).join(','));

    const csv = '\ufeff' + [header.map(escape).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `shopee_review_scripts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportClickbaitToCSV = (rows: ClickbaitPostItem[], filenamePrefix = 'clickbait_posts') => {
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const header = ['ID', 'Topic', 'Headline', 'Post Text', 'Comment 1', 'Comment 2', 'Comment 3', 'Created At'];
    
    const body = rows.map(r => {
      return [
        r.id,
        r.topic,
        r.headline,
        r.postText,
        r.comments[0] || '',
        r.comments[1] || '',
        r.comments[2] || '',
        r.createdAt || ''
      ].map(escape).join(',');
    });

    const csv = '\ufeff' + [header.map(escape).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${filenamePrefix}_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // -------------------------------------------------------------
  // M2: ✨ Image Prompt Builder (1:1 Copy of MasterPromptBuilderTab.tsx)
  // -------------------------------------------------------------
  const [pageDesc, setPageDescState] = useState(() => localStorage.getItem('masterprompt_page_description') || '');
  const [styleGroups, setStyleGroupsState] = useState<StyleGroup[]>(() => { try { return JSON.parse(localStorage.getItem('masterprompt_style_groups') || '[]'); } catch { return []; } });
  const [selectedIds, setSelectedIds]      = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('masterprompt_selected_style_ids') || '[]'); } catch { return []; } });
  const [model, setModelState]             = useState(() => {
    const saved = localStorage.getItem('masterprompt_model');
    if (saved === 'google/gemini-2.0-flash-001') return 'google/gemini-3.5-flash';
    return saved || 'google/gemini-3.5-flash';
  });
  const [target, setTargetState]           = useState<TargetGenerator>(() => (localStorage.getItem('masterprompt_target') as TargetGenerator) || 'imagen4');
  const [contentMode, setContentModeState] = useState<ContentMode>(() => (localStorage.getItem('masterprompt_content_mode') as ContentMode) || 'infographic');

  const [topics, setTopics]         = useState('');
  const [ratio, setRatio]           = useState('1:1');
  const [extraDetail, setExtraDetail] = useState('');

  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [results, setResults]           = useState<GeneratedPrompt[]>([]);
  const [genStatus, setGenStatus]       = useState('');
  const [error, setError]               = useState('');

  const isImagen = target === 'imagen4';
  const isInfo   = contentMode === 'infographic';

  // Persist helpers
  const savePageDesc    = (v: string) => { setPageDescState(v); localStorage.setItem('masterprompt_page_description', v); };
  const saveStyleGroups = useCallback((g: StyleGroup[]) => { setStyleGroupsState(g); localStorage.setItem('masterprompt_style_groups', JSON.stringify(g)); }, []);
  const saveSel         = useCallback((ids: string[]) => { setSelectedIds(ids); localStorage.setItem('masterprompt_selected_style_ids', JSON.stringify(ids)); }, []);
  const saveModel       = (v: string) => { setModelState(v); localStorage.setItem('masterprompt_model', v); };
  const saveTarget      = (v: TargetGenerator) => { setTargetState(v); localStorage.setItem('masterprompt_target', v); setRatio(v === 'imagen4' ? '1:1' : '--ar 1:1'); };
  const saveMode        = (v: ContentMode) => { setContentModeState(v); localStorage.setItem('masterprompt_content_mode', v); };

  const toggleStyle = (id: string) => saveSel(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id]);
  const deleteStyle = (id: string) => { saveStyleGroups(styleGroups.filter(g => g.id !== id)); saveSel(selectedIds.filter(x => x !== id)); };
  const deleteAllStyles = () => {
    if (!styleGroups.length) return;
    if (!window.confirm(`ลบสไตล์ทั้งหมด ${styleGroups.length} อันออกจาก Pool?`)) return;
    saveStyleGroups([]); saveSel([]);
  };

  const suggestStyles = async () => {
    if (!pageDesc.trim()) { setError('กรุณาใส่รายละเอียดเพจก่อน'); return; }
    setError(''); setIsSuggesting(true);
    try {
      const raw = await callOpenRouterAI([
        { role: 'system', content: 'คุณคือผู้เชี่ยวชาญด้านสไตล์ภาพ AI สำหรับ Content Creator ไทย ตอบด้วย JSON array เท่านั้น ไม่ต้องมี markdown' },
        {
          role: 'user',
          content: `เพจของฉัน: "${pageDesc}"

ขั้นแรก วิเคราะห์ "ธีม / อารมณ์ / กลุ่มเป้าหมาย" ของเพจนี้ก่อน แล้วค่อยออกแบบสไตล์ภาพ
สร้างกลุ่มสไตล์ภาพ 7 กลุ่ม โดยทุกกลุ่ม "ต้องเข้ากับธีมและอารมณ์ของเพจนี้จริง ๆ" (เช่น เพจธรรมะ/สายมู ต้องสงบ ขลัง อบอุ่น มีมิติทางจิตวิญญาณ)
ภายใต้ธีมเดียวกันนี้ ค่อยทำให้ "หลากหลายแบบกลมกลืน" — ต่างกันที่โทนสี เทคนิค มุมมอง องค์ประกอบ เพื่อสลับใช้ให้ฟีดไม่น่าเบื่อ
ห้ามใส่สไตล์ที่ขัดกับธีมเพจเด็ดขาด (เช่น เพจธรรมะ ห้ามมี cyberpunk, sci-fi, แนวล้ำอนาคต หรือแนวที่ดูไม่เข้ากับเนื้อหา)

ตอบกลับ JSON array เท่านั้น:
[{"id":"style_1","name":"ชื่อสไตล์ไทย","emoji":"🎨","description":"อธิบาย 1-2 ประโยค","keywords":["en","keywords"],"negativeKeywords":["avoid"],"exampleTopic":"ตัวอย่างหัวข้อ"}]

ให้ครบ 7 กลุ่ม ทุกกลุ่มต้องเข้ากับธีมเพจ และหลากหลายกันภายใต้ธีมนั้น`,
        },
      ], model);

      const m = raw.match(/\[[\s\S]*\]/);
      if (!m) throw new Error('รูปแบบ JSON ไม่ถูกต้อง');
      const parsed: StyleGroup[] = JSON.parse(m[0]);
      if (!Array.isArray(parsed) || !parsed.length) throw new Error('ไม่ได้รับ style groups');

      const newIds = parsed.map(g => g.id);
      const merged = [...styleGroups.filter(g => !newIds.includes(g.id)), ...parsed];
      saveStyleGroups(merged);
      saveSel([...new Set([...selectedIds, ...parsed.map(g => g.id)])]);
    } catch (e: any) { setError(e.message); }
    finally { setIsSuggesting(false); }
  };

  const generateImagePrompts = async () => {
    const topicList = topics.split('\n').map(t => t.trim()).filter(Boolean);
    if (!topicList.length) { setError('กรุณาใส่หัวข้ออย่างน้อย 1 บรรทัด'); return; }
    if (!selectedIds.length) { setError('กรุณาเลือกสไตล์ใน Pool อย่างน้อย 1 สไตล์ก่อน'); return; }
    setError(''); setResults([]); setIsGenerating(true);

    const pool = styleGroups.filter(g => selectedIds.includes(g.id));
    const out: GeneratedPrompt[] = [];

    for (let i = 0; i < topicList.length; i++) {
      const currentTopic = topicList[i];
      const g = pool[Math.floor(Math.random() * pool.length)];
      setGenStatus(`หัวข้อ ${i + 1}/${topicList.length} · 🎲 ${g.emoji} ${g.name} · "${currentTopic.slice(0, 30)}${currentTopic.length > 30 ? '...' : ''}"`);
      try {
        let row: GeneratedPrompt = { styleId: `${g.id}_${i}`, styleName: g.name, styleEmoji: g.emoji, mode: contentMode, target };

        if (isInfo) {
          if (isImagen) {
            const masterSys = `คุณคือ AI Expert Prompt Engineer สำหรับ Imagen 4
หน้าที่: รับหัวข้อโพสต์และสไตล์ภาพ แล้วเขียน Prompt ภาษาไทยที่แม่นยำสูงสำหรับ Imagen 4 ลดโอกาสที่ AI จะสะกดภาษาไทยผิดพลาดให้เหลือน้อยที่สุด

กฎเหล็กที่ต้องปฏิบัติตามเสมอ (ห้ามละเมิด):
1. No Specific Fonts: ห้ามระบุชื่อฟอนต์เด็ดขาด ให้ใช้ "ข้อความภาษาไทย ตัวหนา อ่านง่าย เด่นชัด" เสมอ
2. Explicit Text Injection: ดึงหัวข้อโพสต์มาใส่ใน prompt ตรงๆ ด้วยโครงสร้าง: พาดหัวว่า "ข้อความจริง" (ใส่เครื่องหมายคำพูดเสมอ) ห้ามให้ AI คิดข้อความเอง
3. Structure Breakdown: ถ้าหัวข้อมีหลายส่วน ให้แตกรายละเอียดเป็นข้อๆ (1. 2. 3. 4.) ระบุเนื้อหาแต่ละช่องชัดเจน ห้ามเขียนรวม
4. No Page Credits: ลงท้าย prompt เสมอด้วยประโยคนี้ทุกครั้ง: "สำคัญ: ห้ามใส่โลโก้, เครดิตเพจ, ชื่อเว็บ, หรือลายน้ำใดๆ ทั้งสิ้น ข้อความทั้งหมดในภาพต้องเป็นภาษาไทยและสะกดถูกต้องตามนี้"
5. Output Only: ตอบเฉพาะ prompt เท่านั้น ห้ามเกริ่นนำ ห้ามอธิบาย ห้ามพูดว่า "นี่คือ prompt" หรือ "ต่อไปนี้คือ"

---
Few-Shot Examples (เรียนรู้รูปแบบจากตัวอย่างนี้):

[ตัวอย่างที่ 1]
หัวข้อ: "4 ราศี ดวงการเงินพุ่งแรง เตรียมรับทรัพย์ก้อนโต! (ช่วงนี้)"
สไตล์: ขลัง มีพลัง โทนทองและน้ำเงินเข้ม จักรราศี

Output:
สร้างรูปอินโฟกราฟิก ขนาด 1080x1080 ธีมโหราศาสตร์ การเงิน โทนสีทองและน้ำเงินเข้มดูขลัง มีเหรียญทองและถุงเงินลอยอยู่รอบๆ พื้นหลังเป็นวงล้อจักรราศี หัวข้อหลักด้านบนใช้ข้อความภาษาไทย ตัวหนา อ่านง่าย พาดหัวว่า "4 ราศี ดวงการเงินพุ่งแรง เตรียมรับทรัพย์ก้อนโต! (ช่วงนี้)". ด้านล่างแบ่งเป็น 4 ช่องสำหรับ 4 ราศี คือ สิงห์, กันย์, พิจิก, มีน แต่ละช่องมีไอคอนราศีและกองเงิน พร้อมข้อความภาษาไทยสั้นๆ ที่กำหนดไว้ดังนี้: 1. ช่องสิงห์: ไอคอนสิงโตทองคำ ข้อความภาษาไทย: "มีโชคลาภลอยแบบไม่คาดฝัน" 2. ช่องกันย์: ไอคอนผู้หญิงถือรวงข้าวทองคำ ข้อความภาษาไทย: "งานโปรเจกต์ใหญ่สำเร็จ ได้โบนัสก้อนโต" 3. ช่องพิจิก: ไอคอนแมงป่องทองคำ ข้อความภาษาไทย: "การลงทุนได้ผลตอบแทนสูง กำไรงาม" 4. ช่องมีน: ไอคอนปลาคู่ทองคำ ข้อความภาษาไทย: "มีโอกาสได้มรดก หรือผู้ใหญ่เอ็นดูให้ทรัพย์" สำคัญ: ห้ามใส่โลโก้, เครดิตเพจ, ชื่อเว็บ, หรือลายน้ำใดๆ ทั้งสิ้น ข้อความทั้งหมดในภาพต้องเป็นภาษาไทยและสะกดถูกต้องตามนี้`;

            const masterUser = `เพจ: "${pageDesc}"
สไตล์ภาพที่ต้องใช้: "${g.name}" — ${g.description}
ลักษณะ visual ของสไตล์นี้: ${g.keywords.join(', ')}
หัวข้อโพสต์: "${currentTopic}"
${extraDetail ? `ข้อกำหนดเพิ่มเติม: ${extraDetail}` : ''}
${ratio !== '1:1' ? `ขนาด/สัดส่วน: ${ratio}` : 'ขนาด: 1080x1080'}

สร้าง Master Prompt สำหรับ Imagen 4 ตามกฎเหล็กทั้ง 5 ข้อ และให้ตรงกับสไตล์ภาพที่กำหนด`;

            const raw = await callOpenRouterAI([
              { role: 'system', content: masterSys },
              { role: 'user', content: masterUser },
            ], model);

            row.content      = '';
            row.designPrompt = oneLine(raw.replace(/^(output:|prompt:|นี่คือ|ต่อไปนี้คือ)[^\n]*/i, ''));
            row.negativePrompt = '';
          } else {
            const mjSys = `You are a professional infographic designer for Thai social media.
Reply with EXACTLY this format, nothing else:

CONTENT:
[Thai infographic text content — clear structure with headline, 3-5 key points, CTA]

PROMPT:
[Midjourney English visual design prompt — 60-100 words, layout/colors/icons/mood, no actual text content]

NEGATIVE:
[negative prompt keywords]`;

            const userPrompt = `Page: "${pageDesc}"
Style: "${g.name}" — ${g.description}
Keywords: ${g.keywords.join(', ')}
Topic: "${currentTopic}"
${extraDetail ? `Extra: ${extraDetail}` : ''}`;

            const raw = await callOpenRouterAI([{ role: 'system', content: mjSys }, { role: 'user', content: userPrompt }], model);

            const cm = raw.match(/CONTENT:\s*([\s\S]*?)(?=\nPROMPT:|$)/i);
            const pm = raw.match(/PROMPT:\s*([\s\S]*?)(?=\nNEGATIVE:|$)/i);
            const nm = raw.match(/NEGATIVE:\s*([\s\S]*)/i);

            row.content        = cm ? oneLine(cm[1]) : '';
            row.designPrompt   = pm ? oneLine(pm[1]) : oneLine(raw);
            row.negativePrompt = nm ? oneLine(nm[1]) : '';
          }
        } else {
          // GENERAL image prompt mode
          if (isImagen) {
            const raw = await callOpenRouterAI([
              { role: 'system', content: `คุณคือผู้เชี่ยวชาญเขียน prompt ภาษาไทยสำหรับ Imagen 4 (natural language, ไม่ใช่ keywords)
เขียนเป็นพารากราฟภาษาไทยที่ลื่นไหล ครอบคลุม: สิ่งหลักในภาพ, ฉากหลัง, แสน, บรรยากาศ, สไตล์, โทนสี, มุมกล้อง, คุณภาพ
ความยาว 120-180 คำ ตอบเฉพาะ prompt เท่านั้น` },
              { role: 'user', content: `เพจ: "${pageDesc}"\nสไตล์: "${g.name}" — ${g.description}\nKeywords: ${g.keywords.join(', ')}\nหัวข้อ: "${currentTopic}"\n${extraDetail ? `เพิ่มเติม: ${extraDetail}` : ''}` },
            ], model);
            row.prompt = oneLine(raw.replace(/^(PROMPT:|prompt:)\s*/i, ''));
            row.negativePrompt = '';
          } else {
            const raw = await callOpenRouterAI([
              { role: 'system', content: `You are a professional Midjourney prompt engineer.\nOutput format — two lines only:\nPROMPT: [60-120 word comma-separated English prompt ending with: masterpiece, best quality, 8k]\nNEGATIVE: [negative keywords]` },
              { role: 'user', content: `Niche: "${pageDesc}"\nStyle: "${g.name}" — ${g.description}\nKeywords: ${g.keywords.join(', ')}\nAvoid: ${g.negativeKeywords.join(', ')}\nTopic: "${currentTopic}"\n${extraDetail ? `Extra: ${extraDetail}` : ''}` },
            ], model);
            const pm = raw.match(/PROMPT:\s*(.+?)(?=\nNEGATIVE:|$)/si);
            const nm = raw.match(/NEGATIVE:\s*(.+)/si);
            row.prompt        = pm ? oneLine(pm[1]) : oneLine(raw);
            row.negativePrompt = nm ? oneLine(nm[1]) : g.negativeKeywords.join(', ');
          }
        }

        row.topicLabel = currentTopic;
        out.push(row);
      } catch (e: any) {
        out.push({ styleId: `${g.id}_${i}`, styleName: g.name, styleEmoji: g.emoji, prompt: `[Error: ${e.message}]`, mode: contentMode, target });
      }
      setResults([...out]);
      if (i < topicList.length - 1) await new Promise(r => setTimeout(r, 500));
    }

    setGenStatus(''); setIsGenerating(false);
  };

  const exportCSV = (rows: GeneratedPrompt[]) => {
    const escape = (s: string) => `"${(s || '').replace(/"/g, '""')}"`;
    const isInfo = rows[0]?.mode === 'infographic';

    const header = isInfo
      ? ['สไตล์', 'หัวข้อ Content', 'Master Prompt (Imagen 4)', 'Design Prompt (Midjourney)', 'เนื้อหา (Thai)']
      : ['สไตล์', 'หัวข้อ Content', 'Prompt', 'Negative Prompt'];

    const body = rows.map(r => {
      const topicLabel = r.topicLabel || '';
      if (isInfo) {
        return [
          `${r.styleEmoji} ${r.styleName}`,
          topicLabel,
          r.designPrompt || '',
          '',
          r.content || '',
        ].map(escape).join(',');
      }
      return [
        `${r.styleEmoji} ${r.styleName}`,
        topicLabel,
        r.prompt || '',
        r.negativePrompt || '',
      ].map(escape).join(',');
    });

    const csv = '\ufeff' + [header.map(escape).join(','), ...body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `master_prompts_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasStyles = styleGroups.length > 0;
  const selCount  = selectedIds.length;
  const ratios    = isImagen ? IMAGE_RATIOS_IMAGEN : IMAGE_RATIOS_MJ;

  return (
    <div className="space-y-6">
      {/* Dynamic Styling Injection */}
      <style dangerouslySetInnerHTML={{ __html: `
        .prompt-container {
          background: rgba(15, 23, 42, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 1.25rem;
          overflow: hidden;
        }
        .prompt-tab {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1.25rem;
          font-weight: 700;
          font-size: 0.85rem;
          border-radius: 0.75rem;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          color: rgba(255, 255, 255, 0.6);
        }
        .prompt-tab.active {
          background: rgba(6, 182, 212, 0.15);
          border: 1px solid rgba(6, 182, 212, 0.3);
          color: #22d3ee;
        }
        .glass-tab-menu {
          background: rgba(15, 23, 42, 0.35);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
          padding: 0.75rem 1rem;
          display: flex;
          gap: 0.75rem;
        }
        .gradient-btn {
          background: linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%);
          color: #0f172a;
          font-weight: 700;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }
        .gradient-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .gradient-btn:active {
          transform: translateY(0);
        }
        .purple-btn {
          background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
          color: white;
          font-weight: 700;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }
        .purple-btn:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .green-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          font-weight: 700;
          border-radius: 0.75rem;
          transition: all 0.2s ease;
        }
        .green-btn:hover {
          filter: brightness(1.1);
        }
        .card-item {
          background: rgba(30, 41, 59, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 1rem;
          padding: 1.25rem;
          transition: all 0.2s ease;
        }
        .card-item:hover {
          border-color: rgba(255, 255, 255, 0.1);
          background: rgba(30, 41, 59, 0.35);
        }
        .log-screen {
          background: rgba(2, 6, 23, 0.85);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 0.75rem;
          font-family: monospace;
          color: #10b981;
          font-size: 0.75rem;
          padding: 1rem;
          height: 180px;
          overflow-y: auto;
        }
        @keyframes scaleIn {
          from { transform: scale(0.85); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scaleIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      ` }} />

      {/* Main Module Tabs */}
      <div className="glass-panel p-2 flex gap-2">
        <button
          className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all ${activeTab === 'stock' ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/5' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setActiveTab('stock')}
        >
          <span>📮 ทำStockลงเพจ</span>
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2.5 transition-all ${activeTab === 'prompt-builder' ? 'bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-lg shadow-violet-500/5' : 'text-slate-400 hover:text-slate-200'}`}
          onClick={() => setActiveTab('prompt-builder')}
        >
          <span>✨ Image Prompt Builder</span>
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 'stock' && (
        <div className="prompt-container">
          {/* Sub-tab selections */}
          <div className="glass-tab-menu">
            <button
              className={`prompt-tab ${stockSubTab === 'api-image' ? 'active' : ''}`}
              onClick={() => setStockSubTab('api-image')}
            >
              <ImageIcon className="w-4 h-4" />
              <span>สร้างรูปด้วย API</span>
            </button>
            <button
              className={`prompt-tab ${stockSubTab === 'clickbait' ? 'active' : ''}`}
              onClick={() => setStockSubTab('clickbait')}
            >
              <Zap className="w-4 h-4" />
              <span>สร้างโพส clickbait</span>
            </button>
            <button
              className={`prompt-tab ${stockSubTab === 'csv-clickbait' ? 'active' : ''}`}
              onClick={() => setStockSubTab('csv-clickbait')}
            >
              <FileText className="w-4 h-4" />
              <span>CSV → Clickbait + ใต้เม้น</span>
            </button>
            <button
              className={`prompt-tab ${stockSubTab === 'voiceover' ? 'active' : ''}`}
              onClick={() => setStockSubTab('voiceover')}
            >
              <Volume2 className="w-4 h-4" />
              <span>Avatar Voiceover Script</span>
            </button>
            <button
              className={`prompt-tab ${stockSubTab === 'product-review' ? 'active' : ''}`}
              onClick={() => setStockSubTab('product-review')}
            >
              <Star className="w-4 h-4" />
              <span>รีวิวสินค้า Shopee (CSV)</span>
            </button>
          </div>

          <div className="p-6">
            {/* SUB-TAB 1: สร้างรูปด้วย API */}
            {stockSubTab === 'api-image' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-5">
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <ImageIcon className="text-cyan-400 w-4 h-4" />
                      <span>ตั้งค่าสร้างรูปจากเพจโปรไฟล์</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">เลือกโปรไฟล์เพจ</label>
                        <select 
                          className="glass-input w-full"
                          value={apiSelectedPage.name}
                          onChange={(e) => setApiSelectedPage(DEFAULT_PAGE_CONFIGS.find(p => p.name === e.target.value) || DEFAULT_PAGE_CONFIGS[0])}
                        >
                          {DEFAULT_PAGE_CONFIGS.map(p => (
                            <option key={p.name} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 mb-2">สัดส่วนรูปภาพ</label>
                        <select 
                          className="glass-input w-full"
                          value={apiAspectRatio}
                          onChange={(e: any) => setApiAspectRatio(e.target.value)}
                        >
                          <option value="1:1">1:1 Square (Facebook)</option>
                          <option value="9:16">9:16 Portrait (Reels)</option>
                          <option value="16:9">16:9 Landscape</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-400 mb-2">หัวข้อเรื่องที่ต้องการสร้างรูป (ทีละบรรทัด)</label>
                      <textarea
                        className="glass-input w-full h-32 text-xs leading-relaxed resize-none p-3"
                        placeholder="เช่น&#10;5 บทเรียนการเงินคนวัย 40&#10;วิถีนักพัฒนาซอฟต์แวร์ยุคใหม่"
                        value={apiTopicsInput}
                        onChange={(e) => setApiTopicsInput(e.target.value)}
                      />
                    </div>

                    <div className="flex gap-3">
                      <button
                        className="gradient-btn px-6 py-2.5 text-xs font-bold flex-1"
                        onClick={runKieImageCreator}
                        disabled={apiIsRunning}
                      >
                        {apiIsRunning ? '⏳ กำลังทำงานสร้าง...' : '🚀 เริ่มสร้างรูปภาพด้วย API'}
                      </button>
                      <button 
                        className="glass-button px-4 py-2 text-xs font-bold"
                        onClick={() => { setApiTopicsInput(''); setApiLogs([]); setApiGeneratedImage(''); }}
                      >
                        ล้างข้อมูล
                      </button>
                    </div>
                  </div>

                  {apiLogs.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-400">📜 สตรีมมิ่งสดประมวลผลงาน:</h4>
                      <div className="log-screen">
                        {apiLogs.map((log, idx) => (
                          <div key={idx} className="mb-1">{log}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right col result preview */}
                <div className="glass-panel p-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Compass className="text-cyan-400 w-4 h-4" />
                      <span>พรีวิวภาพโพสต์สำเร็จ</span>
                    </h3>
                    
                    <div className="border border-slate-800 bg-slate-950/40 rounded-xl aspect-square flex items-center justify-center overflow-hidden">
                      {apiGeneratedImage ? (
                        <img src={apiGeneratedImage} alt="KIE generated stock visual" className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-center p-6 text-slate-600">
                          <ImageIcon className="mx-auto w-12 h-12 mb-3 text-slate-800" />
                          <p className="text-xs">จะอัปเดตรูปวาดเมื่อ KIE.AI เรนเดอร์เสร็จสิ้น</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {apiGeneratedImage && (
                    <a 
                      href={apiGeneratedImage} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="green-btn text-center py-2.5 mt-4 rounded-xl text-xs font-bold block"
                    >
                      🔗 เปิดดูรูปภาพต้นฉบับคุณภาพสูง
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 2: สร้างโพส clickbait */}
            {stockSubTab === 'clickbait' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Zap className="text-yellow-400 w-4 h-4" />
                      <span>เครื่องมือเขียนข้อความ Clickbait</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      ป้อนหัวข้อคีย์เวิร์ดทีละบรรทัด ระบบจะวิเคราะห์และสร้างพาดหัวที่ชวนให้คนคลิก พร้อมเนื้อหาใต้คอมเมนต์ 3 ส่วน
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">หัวข้อสปอตไลท์</label>
                      <textarea
                        className="glass-input w-full h-44 text-xs p-3 leading-relaxed resize-none"
                        placeholder="ป้อนหัวข้อละ 1 บรรทัด เช่น&#10;100 Prompt สำหรับธุรกิจ&#10;เทคนิคออมเงินฉบับพนักงานออฟฟิศ"
                        value={cbInput}
                        onChange={(e) => setCbInput(e.target.value)}
                      />
                    </div>

                    <button
                      className="gradient-btn w-full py-3 text-xs font-bold"
                      onClick={generateClickbaitPosts}
                      disabled={cbIsRunning}
                    >
                      {cbIsRunning ? '⏳ AI กำลังเรียบเรียงโพสต์...' : '✍️ สั่งสร้างโพสต์ Clickbait'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">📋 คลังข้อความสำเร็จ ({cbPosts.length} โพสต์)</h4>
                    {cbPosts.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button 
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5"
                          onClick={() => exportClickbaitToCSV(cbPosts, 'clickbait_posts')}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>โหลดทั้งหมดเป็น .CSV</span>
                        </button>
                        <button 
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
                          onClick={() => setCbPosts([])}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ล้างผลลัพธ์ทั้งหมด</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {cbPosts.length === 0 ? (
                    <div className="glass-panel p-12 text-center text-slate-500">
                      <Zap className="mx-auto w-12 h-12 mb-3 text-slate-800" />
                      <p className="text-xs">ป้อนหัวข้าวด้านซ้ายแล้วกดสร้างเพื่อรับขุมทรัพย์โพสต์เด็ด</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                      {cbPosts.map(post => (
                        <div key={post.id} className="card-item space-y-3.5 border-l-4 border-l-cyan-500">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className="text-[10px] bg-cyan-950/60 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                                {post.topic}
                              </span>
                              {post.error && (
                                <span className="ml-2 text-[10px] bg-red-950/60 border border-red-800 text-red-400 px-2 py-0.5 rounded-full font-bold">
                                  AI ล้มเหลว (ใช้ fallback ทรงคุณค่าแทน)
                                </span>
                              )}
                            </div>
                            <button
                              className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                              onClick={() => setCbPosts(prev => prev.filter(p => p.id !== post.id))}
                            >
                              <X className="w-3 h-3" /> ลบ
                            </button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-500">พาดหัวโพสต์ (Headline)</span>
                                <button 
                                  className="text-[10px] text-cyan-400 hover:underline font-bold"
                                  onClick={() => navigator.clipboard.writeText(post.headline)}
                                >
                                  คัดลอกพาดหัว
                                </button>
                              </div>
                              <input 
                                className="glass-input w-full text-xs font-bold text-cyan-400"
                                value={post.headline}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setCbPosts(prev => prev.map(p => p.id === post.id ? { ...p, headline: text } : p));
                                }}
                              />
                            </div>

                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-500">ข้อความโพสต์หลัก (Post text)</span>
                                <button 
                                  className="text-[10px] text-cyan-400 hover:underline font-bold"
                                  onClick={() => navigator.clipboard.writeText(post.postText)}
                                >
                                  คัดลอกบทความ
                                </button>
                              </div>
                              <textarea 
                                className="glass-input w-full text-xs leading-relaxed h-20 resize-none p-2.5"
                                value={post.postText}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setCbPosts(prev => prev.map(p => p.id === post.id ? { ...p, postText: text } : p));
                                }}
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {post.comments.map((comm, cidx) => (
                                <div key={cidx}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-slate-500">ใต้คอมเมนต์ {cidx + 1}/3</span>
                                    <button 
                                      className="text-[9px] text-cyan-400 hover:underline font-bold"
                                      onClick={() => navigator.clipboard.writeText(comm)}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <textarea 
                                    className="glass-input w-full text-xs leading-relaxed h-28 resize-none p-2"
                                    value={comm}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setCbPosts(prev => prev.map(p => {
                                        if (p.id !== post.id) return p;
                                        const updatedComments = [...p.comments] as [string, string, string];
                                        updatedComments[cidx] = text;
                                        return { ...p, comments: updatedComments };
                                      }));
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 3: CSV → Clickbait */}
            {stockSubTab === 'csv-clickbait' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FileText className="text-cyan-400 w-4 h-4" />
                      <span>แปลงไฟล์ CSV เป็นโพสต์</span>
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      คัดลอกเนื้อหาในไฟล์ CSV มาวางลงกล่องข้อความ โดยให้คอลัมน์แรกเป็นชื่อหัวข้อ และคอลัมน์สองเป็นเนื้อหายาวๆ ของคอนเทนต์
                    </p>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">ข้อมูลดิบ CSV</label>
                      <textarea
                        className="glass-input w-full h-48 text-xs p-3 leading-relaxed font-mono resize-none"
                        placeholder="title,article&#10;&quot;5 บทเรียนการเงิน&quot;,&quot;เนื้อหาบทความแบบเจาะลึก 3,000 คำ...&quot;"
                        value={csvContent}
                        onChange={(e) => setCsvContent(e.target.value)}
                      />
                    </div>

                    <button
                      className="gradient-btn w-full py-3 text-xs font-bold"
                      onClick={runCsvClickbaitGenerator}
                      disabled={csvCbRunning}
                    >
                      {csvCbRunning ? '⏳ กำลังสรุปข้อมูล CSV...' : '⚡ ประมวลผลดึงสรุป Clickbait'}
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">📋 ผลลัพธ์สรุปจาก CSV ({csvCbResults.length} โพสต์)</h4>
                    {csvCbResults.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button 
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5"
                          onClick={() => exportClickbaitToCSV(csvCbResults, 'csv_clickbait_posts')}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>โหลดทั้งหมดเป็น .CSV</span>
                        </button>
                        <button 
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
                          onClick={() => setCsvCbResults([])}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ล้างผลลัพธ์</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {csvCbResults.length === 0 ? (
                    <div className="glass-panel p-12 text-center text-slate-500">
                      <FileText className="mx-auto w-12 h-12 mb-3 text-slate-800" />
                      <p className="text-xs">วางเนื้อหาคอลัมน์ด้านซ้ายแล้วประมวลผลดึงสรุปโพสต์สำเร็จรูป</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                      {csvCbResults.map(post => (
                        <div key={post.id} className="card-item space-y-3 border-l-4 border-l-cyan-500">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] bg-cyan-950/60 border border-cyan-800 text-cyan-400 px-2 py-0.5 rounded-full font-bold">
                              {post.topic}
                            </span>
                            <button
                              className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-bold"
                              onClick={() => setCsvCbResults(prev => prev.filter(p => p.id !== post.id))}
                            >
                              <X className="w-3 h-3" /> ลบ
                            </button>
                          </div>

                          <div className="space-y-2">
                            <textarea 
                              className="glass-input w-full text-xs font-bold text-cyan-400 p-2 h-11"
                              value={post.headline}
                              onChange={(e) => {
                                const text = e.target.value;
                                setCsvCbResults(prev => prev.map(p => p.id === post.id ? { ...p, headline: text } : p));
                              }}
                            />
                            
                            <textarea 
                              className="glass-input w-full text-xs leading-relaxed h-16 resize-none p-2"
                              value={post.postText}
                              onChange={(e) => {
                                const text = e.target.value;
                                setCsvCbResults(prev => prev.map(p => p.id === post.id ? { ...p, postText: text } : p));
                              }}
                            />

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {post.comments.map((comm, cidx) => (
                                <div key={cidx}>
                                  <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-bold text-slate-500">คอมเมนต์ {cidx + 1}/3</span>
                                    <button 
                                      className="text-[9px] text-cyan-400 hover:underline font-bold"
                                      onClick={() => navigator.clipboard.writeText(comm)}
                                    >
                                      Copy
                                    </button>
                                  </div>
                                  <textarea 
                                    className="glass-input w-full text-xs leading-relaxed h-28 resize-none p-2"
                                    value={comm}
                                    onChange={(e) => {
                                      const text = e.target.value;
                                      setCsvCbResults(prev => prev.map(p => {
                                        if (p.id !== post.id) return p;
                                        const updatedComments = [...p.comments] as [string, string, string];
                                        updatedComments[cidx] = text;
                                        return { ...p, comments: updatedComments };
                                      }));
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 4: Avatar Voiceover */}
            {stockSubTab === 'voiceover' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Volume2 className="text-emerald-400 w-4.5 h-4.5" />
                      <span>สร้างสคริปต์พูด AI Voiceover</span>
                    </h3>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">หัวข้อพาดพิงบทพูด</label>
                      <textarea
                        className="glass-input w-full h-32 text-xs p-3 leading-relaxed resize-none"
                        placeholder="ป้อนหัวข้อ เช่น&#10;ทำไมเงินสำรองฉุกเฉินถึงสำคัญที่สุด"
                        value={voInput}
                        onChange={(e) => setVoInput(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">บุคลิกผู้พูด (Persona)</label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.625rem' }}>
                        {VOICEOVER_PRESETS.map(p => {
                          const active = voPreset === p.id;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => setVoPreset(p.id)}
                              className={`p-3 rounded-xl border text-left transition-all ${
                                active 
                                  ? 'bg-amber-500/10 border-amber-500 text-amber-400 shadow-lg shadow-amber-500/5' 
                                  : 'bg-slate-950/30 border-slate-850 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className={`font-extrabold text-[11px] ${active ? 'text-amber-400' : 'text-slate-200'}`}>
                                {p.label}
                              </div>
                              <div className="text-[9px] text-slate-500 mt-1 leading-normal">
                                {p.description}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">ขนาดความยาวสคริปต์</label>
                      <select 
                        className="glass-input w-full text-xs h-9"
                        value={voLength}
                        onChange={(e) => setVoLength(e.target.value)}
                      >
                        {VOICEOVER_LENGTHS.map(l => (
                          <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                      </select>
                    </div>

                    <button
                      className="gradient-btn w-full py-3 text-xs font-bold"
                      onClick={generateVoiceoverScripts}
                      disabled={voIsRunning}
                    >
                      {voIsRunning ? '⏳ กำลังแต่งบทพูดธรรมชาติ...' : '🎙️ เริ่มผลิตสคริปต์เสียง AI'}
                    </button>

                    {voLogs.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <label className="block text-xs font-bold text-slate-400">สถานะการทำงาน (Logs)</label>
                        <div className="log-screen">
                          {voLogs.map((log, idx) => (
                            <div key={idx} className="py-0.5">{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">📋 บทพูดพร้อมนำไปใช้ ({voResults.length} สคริปต์)</h4>
                    {voResults.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button 
                          className="text-xs text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1.5"
                          onClick={() => exportVoToCSV(voResults)}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>โหลดทั้งหมดเป็น .CSV</span>
                        </button>
                        <button 
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
                          onClick={() => setVoResults([])}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ล้างทั้งหมด</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {voResults.length === 0 ? (
                    <div className="glass-panel p-12 text-center text-slate-500">
                      <Volume2 className="mx-auto w-12 h-12 mb-3 text-slate-800" />
                      <p className="text-xs">ป้อนหัวข้าวด้านซ้ายเพื่อเริ่มต้นแปลงเป็นบทพูดลื่นไหลไร้สัญลักษณ์รบกวน</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                      {voResults.map(script => (
                        <div key={script.id} className="card-item space-y-3 border-l-4 border-l-emerald-500">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] bg-emerald-950/60 border border-emerald-800 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">
                              {script.topic}
                            </span>

                            <div className="flex items-center gap-2">
                              <button
                                className="text-[10px] text-emerald-400 hover:underline font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(script.script);
                                  alert('คัดลอกบทพูดลงคลิปบอร์ดแล้ว');
                                }}
                              >
                                คัดลอกบท
                              </button>
                              <button
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                                onClick={() => setVoResults(prev => prev.filter(s => s.id !== script.id))}
                              >
                                ลบ
                              </button>
                            </div>
                          </div>

                          <textarea
                            className="glass-input w-full text-xs leading-relaxed h-44 resize-none p-3 font-sans"
                            value={script.script}
                            onChange={(e) => {
                              const text = e.target.value;
                              setVoResults(prev => prev.map(s => s.id === script.id ? { ...s, script: text } : s));
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-TAB 5: รีวิวสินค้า Shopee (CSV → หลาย Script ต่อสินค้า) */}
            {stockSubTab === 'product-review' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-panel p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Star className="text-amber-400 w-4.5 h-4.5" />
                      <span>รีวิวสินค้า Shopee จาก CSV</span>
                    </h3>

                    <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <div className="text-[11px] font-extrabold text-amber-400">🍷 บุคลิก: ผู้ดีจิบไวน์</div>
                      <div className="text-[9px] text-slate-400 mt-1 leading-normal">
                        ชายสูทจิบไวน์ เล่าแบบสารคดี+ปรัชญา+มุกบากิ ขำหน้าตาย เปิดด้วยพาดหัว 5 ข้อ แล้วค่อยเฉลยสินค้า พร้อมพาดหัวตัวหนังสือใหญ่สั้นๆสำหรับใส่ในคลิป (อ้างอิง role_shopee.txt)
                      </div>
                    </div>

                    {/* อัปโหลด CSV สินค้า: ชื่อสินค้า | รายละเอียดสินค้า */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2">
                        อัปโหลดไฟล์สินค้า (.csv)
                        <span className="text-[9px] text-slate-500 font-normal block mt-0.5">คอลัมน์ 1 = ชื่อสินค้า, คอลัมน์ 2 = รายละเอียดสินค้า</span>
                      </label>
                      <input
                        ref={prFileRef}
                        type="file"
                        accept=".csv,text/csv"
                        className="hidden"
                        onChange={handlePrCsvUpload}
                      />
                      <div className="mb-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                        <div className="text-[11px] font-extrabold text-emerald-400 flex items-center gap-1.5">🔗 เชื่อม Google Sheet โดยตรง</div>
                        <input
                          type="text"
                          value={prSheetUrl}
                          onChange={(e) => setPrSheetUrl(e.target.value)}
                          placeholder="วางลิงก์ Google Sheet..."
                          className="glass-input w-full text-[11px] h-8 px-2.5"
                        />
                        <button
                          type="button"
                          onClick={loadFromGoogleSheet}
                          disabled={prSheetLoading}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold disabled:opacity-50 transition-all"
                        >
                          {prSheetLoading ? '⏳ กำลังดึงข้อมูล...' : '🔗 ดึงสินค้าจาก Sheet'}
                        </button>
                        <div className="text-[9px] text-slate-500 leading-normal">Sheet ต้องตั้งแชร์ "ทุกคนที่มีลิงก์ดูได้" · อ่านคอลัมน์ ชื่อในโฟลเดอร์ / รายละเอียดสินค้า</div>
                      </div>
                      <div className="text-[9px] text-slate-500 text-center mb-2">— หรือ อัปโหลดไฟล์ CSV —</div>
                      {prProducts.length === 0 ? (
                        <button
                          type="button"
                          onClick={() => prFileRef.current?.click()}
                          className="w-full py-2.5 rounded-xl border border-dashed border-slate-700 hover:border-amber-500 text-slate-400 hover:text-amber-400 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>เลือกไฟล์ CSV สินค้า</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-950/30 border border-amber-800">
                          <div className="min-w-0">
                            <div className="text-[11px] font-bold text-amber-400 truncate">📄 {prCsvFileName}</div>
                            <div className="text-[9px] text-slate-400">พบสินค้า {prProducts.length} รายการ</div>
                          </div>
                          <button
                            type="button"
                            onClick={clearPrProducts}
                            className="text-[10px] text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 shrink-0"
                          >
                            <X className="w-3 h-3" /> ล้าง
                          </button>
                        </div>
                      )}
                    </div>

                    {/* จำนวนสคริปต์ต่อ 1 สินค้า */}
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">จำนวน Script ต่อ 1 สินค้า</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        className="glass-input w-full text-xs h-9 px-3"
                        value={prScriptsPerItem}
                        onChange={(e) => setPrScriptsPerItem(Math.max(1, Math.min(20, parseInt(e.target.value) || 1)))}
                      />
                      <p className="text-[9px] text-slate-500 mt-1 leading-normal">
                        เช่น สินค้า "Chair" ตั้งค่า 3 → จะได้ <span className="text-amber-400 font-bold">Chair_script1, Chair_script2, Chair_script3</span>
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5">ขนาดความยาวสคริปต์</label>
                      <select
                        className="glass-input w-full text-xs h-9"
                        value={prLength}
                        onChange={(e) => setPrLength(e.target.value)}
                      >
                        {VOICEOVER_LENGTHS.map(l => (
                          <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                      </select>
                    </div>

                    {prProducts.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-400">เลือกสินค้าที่จะสร้าง Script ({prSelected.length}/{prProducts.length})</label>
                          <button
                            type="button"
                            onClick={togglePrSelectAll}
                            className="text-[10px] font-bold text-amber-400 hover:text-amber-300"
                          >
                            {prSelected.length === prProducts.length ? '☐ ล้างทั้งหมด' : '☑ เลือกทั้งหมด'}
                          </button>
                        </div>
                        <div className="max-h-52 overflow-y-auto rounded-xl border border-slate-700 divide-y divide-slate-800">
                          {prProducts.map((prod, idx) => (
                            <label key={idx} className="flex items-center gap-2 px-2.5 py-1.5 cursor-pointer hover:bg-slate-800/40">
                              <input
                                type="checkbox"
                                checked={prSelected.includes(prod.name)}
                                onChange={() => togglePrSelect(prod.name)}
                                style={{ accentColor: '#f59e0b' }}
                                className="w-3.5 h-3.5 shrink-0"
                              />
                              <span className="text-[11px] text-slate-200 truncate" title={prod.name}>{prod.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      className="gradient-btn w-full py-3 text-xs font-bold"
                      onClick={generateProductScripts}
                      disabled={prIsRunning}
                    >
                      {prIsRunning ? '⏳ กำลังรังสรรค์บทรีวิว...' : `🍷 ผลิตสคริปต์รีวิว (${prSelected.length * prScriptsPerItem} ชิ้น)`}
                    </button>

                    {prLogs.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <label className="block text-xs font-bold text-slate-400">สถานะการทำงาน (Logs)</label>
                        <div className="log-screen">
                          {prLogs.map((log, idx) => (
                            <div key={idx} className="py-0.5">{log}</div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">📋 สคริปต์รีวิวพร้อมใช้ ({prResults.length} ชิ้น)</h4>
                    {prResults.length > 0 && (
                      <div className="flex items-center gap-3">
                        <button
                          className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1.5"
                          onClick={() => exportPrToCSV(prResults)}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>โหลดทั้งหมดเป็น .CSV</span>
                        </button>
                        <button
                          className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1.5"
                          onClick={() => setPrResults([])}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>ล้างทั้งหมด</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {prResults.length === 0 ? (
                    <div className="glass-panel p-12 text-center text-slate-500">
                      <Star className="mx-auto w-12 h-12 mb-3 text-slate-800" />
                      <p className="text-xs">อัปโหลดไฟล์ CSV สินค้าด้านซ้าย ตั้งจำนวนสคริปต์ต่อสินค้า แล้วเริ่มผลิตบทรีวิวสไตล์ผู้ดีจิบไวน์</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[640px] overflow-y-auto pr-2">
                      {prResults.map(script => (
                        <div key={script.id} className="card-item space-y-3 border-l-4 border-l-amber-500">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex flex-col gap-1 min-w-0">
                              <span className="text-[12px] text-amber-300 font-extrabold font-mono truncate">
                                {script.clipName}
                              </span>
                              <span className="text-[9px] text-slate-500 truncate">สินค้า: {script.productName}</span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                className="text-[10px] text-amber-400 hover:underline font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(script.script);
                                  alert('คัดลอกบทรีวิว (Script) ลงคลิปบอร์ดแล้ว');
                                }}
                              >
                                คัดลอก Script
                              </button>
                              <button
                                className="text-[10px] text-rose-400 hover:text-rose-300 font-bold"
                                onClick={() => setPrResults(prev => prev.filter(s => s.id !== script.id))}
                              >
                                ลบ
                              </button>
                            </div>
                          </div>

                          {/* Overlay Title — พาดหัวตัวหนังสือใหญ่ในคลิป */}
                          {script.overlayTitle && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-cyan-400/80 uppercase tracking-wider">🔠 พาดหัวในคลิป (ข้อความใหญ่)</label>
                                <button
                                  className="text-[9px] text-cyan-400 hover:underline font-bold"
                                  onClick={() => navigator.clipboard.writeText(script.overlayTitle)}
                                >
                                  คัดลอก
                                </button>
                              </div>
                              <input
                                type="text"
                                className="glass-input w-full text-xs leading-relaxed p-3 font-sans font-bold"
                                value={script.overlayTitle}
                                onChange={(e) => {
                                  const text = e.target.value;
                                  setPrResults(prev => prev.map(s => s.id === script.id ? { ...s, overlayTitle: text } : s));
                                }}
                              />
                            </div>
                          )}

                          {/* Hook — แยกออกจาก Script */}
                          {script.hooks.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-[10px] font-bold text-amber-400/80 uppercase tracking-wider">🪝 Hook (พาดหัว {script.hooks.length} ข้อ)</label>
                                <button
                                  className="text-[9px] text-amber-400 hover:underline font-bold"
                                  onClick={() => navigator.clipboard.writeText(script.hooks.join('\n'))}
                                >
                                  คัดลอก Hook
                                </button>
                              </div>
                              <textarea
                                className="glass-input w-full text-xs leading-relaxed h-24 resize-none p-3 font-sans"
                                value={script.hooks.join('\n')}
                                onChange={(e) => {
                                  const lines = e.target.value.split('\n');
                                  setPrResults(prev => prev.map(s => s.id === script.id ? { ...s, hooks: lines } : s));
                                }}
                              />
                            </div>
                          )}

                          {/* Script — เนื้อ voiceover ล้วน */}
                          <div>
                            <label className="text-[10px] font-bold text-emerald-400/80 uppercase tracking-wider block mb-1">🎙️ Script (บทพูด voiceover)</label>
                            <textarea
                              className="glass-input w-full text-xs leading-relaxed h-56 resize-none p-3 font-sans"
                              value={script.script}
                              onChange={(e) => {
                                const text = e.target.value;
                                setPrResults(prev => prev.map(s => s.id === script.id ? { ...s, script: text } : s));
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* RENDER ✨ Image Prompt Builder */}
      {activeTab === 'prompt-builder' && (
        <div className="flex flex-col bg-slate-950/20 rounded-2xl border border-slate-800/80 overflow-hidden">
          
          {/* Top Config Navigation */}
          <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 flex-wrap">
              {/* Content Mode */}
              <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                {([['infographic', '📊', 'อินโฟกราฟฟิค'], ['general', '🖼️', 'ภาพ AI ทั่วไป']] as [ContentMode, string, string][]).map(([v, em, lb]) => (
                  <button 
                    key={v} 
                    onClick={() => saveMode(v)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold transition-all ${contentMode === v ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {em} {lb}
                  </button>
                ))}
              </div>

              {/* Generator Target */}
              <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
                {([['imagen4', '🌟', 'Imagen 4 (ไทย)'], ['midjourney', '🎨', 'Midjourney']] as [TargetGenerator, string, string][]).map(([v, em, lb]) => (
                  <button 
                    key={v} 
                    onClick={() => saveTarget(v)}
                    className={`px-3 py-1.5 rounded-md text-[10px] font-extrabold transition-all ${target === v ? (v === 'imagen4' ? 'bg-gradient-to-r from-blue-500/10 to-violet-500/10 border border-violet-500/30 text-violet-400 shadow' : 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow') : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {em} {lb}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-500">AI Model:</span>
              <select 
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[10px] font-bold text-slate-300"
                value={model} 
                onChange={e => saveModel(e.target.value)}
              >
                {PRESET_MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
          </div>

          {/* 3-Column Body layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            
            {/* LEFT: Style Groups */}
            <div className="lg:col-span-3 border-r border-slate-800 p-4 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">🏷️ รายละเอียดเพจ (Profile Niche)</label>
                  <textarea 
                    className="glass-input w-full text-xs leading-relaxed p-3"
                    rows={4} 
                    placeholder={"เพจดูดวง สายมู ทายใจ\nเพจ AI เทคโนโลยี\nเพจหยก มงคล เสริมดวง"} 
                    value={pageDesc} 
                    onChange={e => savePageDesc(e.target.value)} 
                  />
                </div>

                <button
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all text-slate-950 gradient-btn`}
                  onClick={suggestStyles} 
                  disabled={isSuggesting}
                >
                  {isSuggesting ? '⏳ AI กำลังดีไซน์สไตล์ภาพ...' : '🤖 สั่ง AI ออกแบบสไตล์เพจ'}
                </button>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800/40">
                {hasStyles && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400">🎲 Pool สุ่ม ({selCount} สไตล์)</span>
                    <div className="flex gap-2 items-center">
                      <button className="text-[10px] text-cyan-400 font-bold" onClick={() => saveSel(styleGroups.map(g => g.id))}>เลือกหมด</button>
                      <button className="text-[10px] text-slate-500 font-bold" onClick={() => saveSel([])}>ไม่เลือก</button>
                      <button className="text-[10px] text-red-400/90 hover:text-red-400 font-bold flex items-center gap-0.5" onClick={deleteAllStyles}>
                        <Trash2 className="w-3 h-3" /> ลบ Pool
                      </button>
                    </div>
                  </div>
                )}

                <div className="max-h-[360px] overflow-y-auto space-y-2 pr-1">
                  {styleGroups.map(group => {
                    const selected = selectedIds.includes(group.id);
                    const isExpanded = expandedKeywordsIds.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className={`relative rounded-xl border p-3 cursor-pointer transition-all select-none ${selected ? 'border-violet-500 bg-violet-950/15 shadow-lg shadow-violet-500/5' : 'border-slate-800 bg-slate-950/30 hover:border-slate-700'}`}
                        onClick={() => toggleStyle(group.id)}
                      >
                        <button
                          title="ลบสไตล์นี้"
                          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 hover:bg-red-500 hover:border-red-400 hover:text-white flex items-center justify-center transition-all z-10"
                          onClick={e => { e.stopPropagation(); deleteStyle(group.id); }}
                        >
                          <X className="w-3 h-3" strokeWidth={3} />
                        </button>
                        <div className="flex items-center gap-2.5 pr-6">
                          <span className="text-xl">{group.emoji}</span>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-xs text-white truncate">{group.name}</div>
                            <div className="text-[9px] text-slate-500 line-clamp-1 leading-normal">{group.description}</div>
                          </div>
                          {selected && (
                            <div className="w-4 h-4 rounded-full bg-violet-650 border border-violet-500 flex items-center justify-center flex-shrink-0 animate-scale-in">
                              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                            </div>
                          )}
                        </div>

                        {/* Accordion Keywords Section */}
                        <div className="mt-2 pt-2 border-t border-slate-850/80">
                          <button
                            type="button"
                            onClick={(e) => toggleKeywords(group.id, e)}
                            className="text-[9px] font-extrabold text-slate-400 hover:text-slate-200 flex items-center gap-1 transition-all"
                          >
                            <span>{isExpanded ? '▼' : '▶'} keywords</span>
                          </button>
                          
                          {isExpanded && (
                            <div className="mt-1.5 flex flex-wrap gap-1 max-h-[85px] overflow-y-auto pt-0.5">
                              {group.keywords.map(kw => (
                                <span key={kw} className="text-[8px] bg-slate-900 border border-slate-850 text-slate-400 px-1.5 py-0.5 rounded font-mono">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* MIDDLE: Content Controls */}
            <div className="lg:col-span-4 border-r border-slate-800 p-4 space-y-4">
              <div className={`rounded-xl p-3 border ${isInfo ? 'bg-cyan-950/10 border-cyan-800/40 text-cyan-400' : 'bg-slate-950/30 border-slate-800 text-slate-300'}`}>
                <p className="text-xs font-bold mb-1">{isInfo ? '📊 โหมด: อินโฟกราฟฟิค' : '🖼️ โหมด: ภาพ AI ทั่วไป'}</p>
                <p className="text-[9px] text-slate-400 leading-relaxed">
                  {isInfo
                    ? isImagen
                      ? 'ได้ 2 ส่วน: ① เนื้อหาภาษาไทย (ใส่ใน infographic) ② Design Prompt ภาษาไทย (สำหรับ Imagen 4)'
                      : 'ได้ 2 ส่วน: ① เนื้อหาภาษาไทย ② English Design Prompt + Negative (สำหรับ Midjourney)'
                    : isImagen
                      ? 'ได้ Master Prompt ภาษาไทยละเอียด สำหรับ Imagen 4'
                      : 'ได้ Keyword Prompt + Negative สำหรับ Midjourney/SDXL'}
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📝 หัวข้อ Content (ทีละบรรทัด)</label>
                <textarea
                  className="glass-input w-full h-44 text-xs leading-relaxed p-3"
                  placeholder={"ใส่หัวข้อละ 1 บรรทัด เช่น&#10;เปิดไพ่ทายดวงความรัก เดือนนี้&#10;4 ราศี เงินวิ่งชนก้อนโต!"}
                  value={topics}
                  onChange={e => setTopics(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">📐 สัดส่วนภาพ</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.375rem' }}>
                  {ratios.map(r => (
                    <button 
                      key={r.value} 
                      onClick={() => setRatio(r.value)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${ratio === r.value ? 'bg-cyan-500/10 border-cyan-500 text-cyan-400' : 'bg-slate-950/30 border-slate-850 text-slate-500 hover:border-slate-700'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">✏️ ข้อกำหนดรูปภาพเพิ่มเติม</label>
                <input 
                  className="glass-input w-full text-xs h-9 px-3"
                  placeholder={isInfo ? "เช่น: เน้นโทนชมพูพาสเทล, ห้ามใส่คน" : "เช่น: highly detailed cinematic lighting"}
                  value={extraDetail} 
                  onChange={e => setExtraDetail(e.target.value)} 
                />
              </div>

              {error && <div className="rounded-xl bg-red-950/20 border border-red-800/40 p-3 text-[10px] text-red-400">⚠️ {error}</div>}

              <button
                className="gradient-btn w-full py-3 text-xs font-bold text-slate-950"
                onClick={generateImagePrompts}
                disabled={isGenerating || selectedIds.length === 0}
              >
                {isGenerating ? '⏳ กำลังแต่งคลัง Prompt...' : `✨ สร้าง ${topics.split('\n').filter(Boolean).length || ''} Master Prompts`}
              </button>
              
              {isGenerating && <p className="text-[10px] text-center text-cyan-400 animate-pulse mt-2">{genStatus}</p>}
            </div>

            {/* RIGHT: Prompt outputs */}
            <div className="lg:col-span-5 p-4 space-y-4 flex flex-col justify-between overflow-hidden">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-extrabold text-white flex items-center gap-2">
                  <span>{isInfo ? '📊 Infographic Content ที่สร้างได้' : '🖼️ AI Prompts ที่สร้างได้'}</span>
                </h4>
                {results.length > 0 && (
                  <div className="flex gap-2">
                    <button 
                      className="text-[10px] bg-emerald-950/40 border border-emerald-800 text-emerald-400 font-extrabold px-2.5 py-1.5 rounded-lg flex items-center gap-1 hover:bg-emerald-900/30 transition-all"
                      onClick={() => exportCSV(results)}
                    >
                      <Download className="w-3 h-3" /> Export CSV
                    </button>
                    <button className="text-[10px] text-slate-500 font-extrabold hover:text-slate-300" onClick={() => setResults([])}>ล้าง</button>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1 max-h-[580px]">
                {results.length === 0 ? (
                  <div className="text-center p-12 text-slate-600 h-full flex flex-col justify-center items-center">
                    <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-6 shadow-xl relative overflow-hidden">
                      {/* Beautiful styled bar chart SVG exactly like the screenshot */}
                      <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" stroke="rgba(255,255,255,0.12)" fill="rgba(15, 23, 42, 0.4)" />
                        <line x1="7" y1="17" x2="7" y2="10" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />
                        <line x1="12" y1="17" x2="12" y2="7" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                        <line x1="17" y1="17" x2="17" y2="12" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 mb-1">สร้าง Infographic Content</h3>
                    <p className="text-[9px] text-slate-500 text-center max-w-[280px] leading-relaxed">
                      {isInfo 
                        ? 'ได้เนื้อหาภาษาไทย + Design Prompt พร้อมดาวน์โหลด CSV' 
                        : 'ได้คลัง Prompt สร้างภาพ AI รายหัวข้อพร้อมดาวน์โหลด CSV'}
                    </p>
                  </div>
                ) : (
                  results.map((res, idx) => {
                    const isResultInfo = res.mode === 'infographic';
                    const isResultImagen = res.target === 'imagen4';
                    return (
                      <div key={idx} className="card-item space-y-3.5 border-l-4 border-l-violet-500">
                        <div className="flex justify-between items-center gap-4">
                          <span className="text-xs font-bold text-white">{res.styleEmoji} {res.styleName}</span>
                          <span className="text-[9px] bg-violet-950/60 border border-violet-850 text-violet-400 px-2 py-0.5 rounded-full font-bold">
                            {res.target.toUpperCase()} · {ratio}
                          </span>
                        </div>

                        {res.topicLabel && (
                          <p className="text-[10px] text-slate-400 font-bold">📝 หัวข้อ: {res.topicLabel}</p>
                        )}

                        {/* RENDER IMAGEN 4 INFOGRAPHIC */}
                        {isResultInfo && isResultImagen && res.designPrompt && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">🌟 Master Prompt (Imagen 4)</span>
                              <button 
                                className="text-[10px] text-cyan-400 hover:underline font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(res.designPrompt || '');
                                  alert('คัดลอก Master Prompt สำเร็จ');
                                }}
                              >
                                คัดลอก
                              </button>
                            </div>
                            <div className="bg-slate-950/80 rounded-xl p-3 text-[11px] text-slate-200 leading-relaxed font-sans border border-slate-900/60">
                              {res.designPrompt}
                            </div>
                          </div>
                        )}

                        {/* RENDER MIDJOURNEY INFOGRAPHIC CONTENT */}
                        {isResultInfo && !isResultImagen && res.content && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">📝 เนื้อหาสรุป (Thai)</span>
                              <button 
                                className="text-[10px] text-cyan-400 hover:underline font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(res.content || '');
                                  alert('คัดลอกบทความสรุปสำเร็จ');
                                }}
                              >
                                คัดลอก
                              </button>
                            </div>
                            <div className="bg-slate-950/80 rounded-xl p-3 text-[11px] text-slate-200 leading-relaxed">
                              {res.content}
                            </div>
                          </div>
                        )}

                        {/* RENDER MIDJOURNEY INFOGRAPHIC DESIGN PROMPT */}
                        {isResultInfo && !isResultImagen && res.designPrompt && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">🎨 Design Prompt (Midjourney)</span>
                              <button 
                                className="text-[10px] text-cyan-400 hover:underline font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(`${res.designPrompt} ${ratio}`);
                                  alert('คัดลอก Design Prompt สำเร็จ');
                                }}
                              >
                                คัดลอก
                              </button>
                            </div>
                            <div className="bg-slate-950/80 rounded-xl p-3 text-[10px] text-violet-300 font-mono leading-relaxed">
                              {`${res.designPrompt} ${ratio}`}
                            </div>
                          </div>
                        )}

                        {/* RENDER GENERAL MODE PROMPT */}
                        {!isResultInfo && res.prompt && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-500">{isResultImagen ? 'Master Prompt (ภาษาไทย)' : 'Prompt'}</span>
                              <button 
                                className="text-[10px] text-cyan-400 hover:underline font-bold"
                                onClick={() => {
                                  navigator.clipboard.writeText(isResultImagen ? res.prompt || '' : `${res.prompt} ${ratio}`);
                                  alert('คัดลอก Prompt สำเร็จ');
                                }}
                              >
                                คัดลอก
                              </button>
                            </div>
                            <div className="bg-slate-950/80 rounded-xl p-3 text-[11px] text-slate-200 leading-relaxed font-sans">
                              {isResultImagen ? res.prompt : `${res.prompt} ${ratio}`}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
