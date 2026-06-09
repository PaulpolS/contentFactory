import { useState, useEffect, useRef, Fragment } from 'react';
import { 
  Compass, 
  Database, 
  Image as ImageIcon, 
  Play, 
  CheckCircle, 
  Sliders, 
  Search, 
  Info, 
  Cpu,
  RefreshCw,
  Eye,
  Upload,
  Trash2,
  Sparkles,
  X,
  Download,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Users,
  User,
  FileText,
  Quote,
  Mic,
  Activity
} from 'lucide-react';
import DiscoveryPortal from './components/DiscoveryPortal';
import SettingsPortal from './components/SettingsPortal';
import PromptGeneratorPortal from './components/PromptGeneratorPortal';
import VerticalVideoSuitePortal from './components/VerticalVideoSuitePortal';
import QuoteVideoPortal from './components/QuoteVideoPortal';
import { AvatarVerticalClipPortal } from './components/AvatarVerticalClipPortal';
import FlowAutomatorPortal from './components/FlowAutomatorPortal';
import PodcastVideoPortal from './components/PodcastVideoPortal';


const API_BASE = 'http://localhost:5005/api';

interface VaultContent {
  id: string;
  source_type: 'radar' | 'rss' | 'youtube' | 'github';
  title: string;
  selected_headline: string | null;
  raw_content: string;
  source_url: string;
  author_name: string | null;
  author_avatar_url: string | null;
  author_followers: number | null;
  rating_news: number;
  rating_evergreen: number;
  metadata: any;
  media_paths: string[];
  status: 'scraped' | 'ready_for_design' | 'designed' | 'posted' | 'archived';
  created_at: string;
  updated_at: string;
}

interface GraphicItem {
  id: string;
  content_id: string;
  file_path: string;
  image_ratio: string;
  theme_name: string;
  created_at: string;
}

interface PaletteTheme {
  id: string;
  name: string;
  gradient: [string, string];
  primaryText: string;
  highlight: string;
  highlightText: string;
  secondaryHighlight: string;
  accent: string;
}

const PALETTE_THEMES: PaletteTheme[] = [
  {
    id: "Classic Red Blue",
    name: "Neutron Red Blue",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#dc2626",
    highlightText: "#ffffff",
    secondaryHighlight: "#1d4ed8",
    accent: "#dc2626"
  },
  {
    id: "Emerald Gold",
    name: "Morkot Emerald Gold",
    gradient: ["#022c22", "#020f0c"],
    primaryText: "#ffffff",
    highlight: "#059669",
    highlightText: "#f59e0b",
    secondaryHighlight: "#f59e0b",
    accent: "#f59e0b"
  },
  {
    id: "Neon Purple",
    name: "Cyberpunk Neon Purple",
    gradient: ["#4c1d95", "#0f172a"],
    primaryText: "#ffffff",
    highlight: "#a855f7",
    highlightText: "#facc15",
    secondaryHighlight: "#f97316",
    accent: "#a855f7"
  },
  {
    id: "orange_teal",
    name: "Orange Teal Burst",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#f97316",
    highlightText: "#fde047",
    secondaryHighlight: "#0891b2",
    accent: "#f97316"
  },
  {
    id: "purple_lime",
    name: "Purple Lime Electro",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#7c3aed",
    highlightText: "#bef264",
    secondaryHighlight: "#4f46e5",
    accent: "#7c3aed"
  },
  {
    id: "rose_cyan",
    name: "Rose Cyan Synthwave",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#e11d48",
    highlightText: "#22d3ee",
    secondaryHighlight: "#0e7490",
    accent: "#e11d48"
  },
  {
    id: "amber_indigo",
    name: "Amber Indigo Fusion",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#fff7ed",
    highlight: "#f59e0b",
    highlightText: "#fef08a",
    secondaryHighlight: "#4f46e5",
    accent: "#f59e0b"
  },
  {
    id: "magenta_mint",
    name: "Magenta Mint Fresh",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#db2777",
    highlightText: "#a7f3d0",
    secondaryHighlight: "#10b981",
    accent: "#db2777"
  },
  {
    id: "graphite_gold",
    name: "Graphite Gold Royal",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#f8fafc",
    highlight: "#374151",
    highlightText: "#fbbf24",
    secondaryHighlight: "#92400e",
    accent: "#fbbf24"
  },
  {
    id: "navy_coral",
    name: "Navy Coral Sunset",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#1d4ed8",
    highlightText: "#fb7185",
    secondaryHighlight: "#0f172a",
    accent: "#1d4ed8"
  },
  {
    id: "white_hot",
    name: "White Hot Flame",
    gradient: ["#18181b", "#09090b"],
    primaryText: "#ffffff",
    highlight: "#fb923c",
    highlightText: "#facc15",
    secondaryHighlight: "#f8fafc",
    accent: "#fb923c"
  }
];

export interface WritingStyle {
  id: string;
  name: string;
  desc: string;
  content: string;
}

export interface HeadlinePack {
  id: string;
  name: string;
  headlines: string[];
}

export interface ImagePromptStyle {
  id: string;
  name: string;
  core_prompt: string;
  negative_prompt: string;
}

export const ARTICLE_LENGTH_OPTIONS = [
  { id: 'short', label: 'สั้น', hint: 'ประมาณ 500-800 ตัวอักษร', range: '500-800' },
  { id: 'medium', label: 'กลาง', hint: 'ประมาณ 900-1,300 ตัวอักษร', range: '900-1300' },
  { id: 'long', label: 'ยาว', hint: 'ประมาณ 1,500-2,200 ตัวอักษร', range: '1500-2200' },
  { id: 'deep', label: 'ละเอียด', hint: 'ประมาณ 2,500-3,500 ตัวอักษร', range: '2500-3500' },
];

export const PALETTE_WRITING_STYLES: WritingStyle[] = [
  {
    id: "ai_trendtech",
    name: "AI Trendtech (เล่าเทรนด์สุดล้ำ)",
    desc: "เน้นเล่าเรื่องเทคโนโลยี/เครื่องมือ AI เป็นขั้นตอน อารมณ์เป็นกันเอง แทรกความตื่นเต้น มีสติ๊กเกอร์ มีการแชร์วิธีสร้าง Sub-agents อย่างชัดเจน",
    content: `สร้างกองทัพ AI 15 ตัวที่ทำงานพร้อมกันได้ ด้วยการใช้ Sub-agent ใน Claude Cowork ตั้งค่าไม่ยาก สามารถทำตามได้ทันที
.
กลับมาที่ Claude เพื่อรัก ฮ่าา
ตอนนี้อินสุด ๆ มันจริง ๆ ครับ ฮ่าา
วันนี้มาในเรื่องของการสร้างกองทัพ AI ที่ทำงานพร้อมกันได้
ทีละหลาย ๆ ตัว โดยใช้ Sub-agents และ สามารถบันทุกมาเป็น
plugins ไว้ใช้งานทีหลังได้ง่าย ๆ เลย
.
ด้วยความที่เป็น Claude มัน user friendly มาก ๆ 
ตั้งค่าไม่ยาก ทำตามได้ง่าย ๆ 
มาดูกันว่าเขาทำยังไงกันบ้าง ไปดูวว`
  },
  {
    id: "style_pospage_ai",
    name: "โพสเพจAI (สไตล์คลิกเบทสะกดสายตา)",
    desc: "เน้นเปิดด้วยประโยคกระตุ้นอารมณ์แรง (เช่น แจก, พลาดไม่ได้, วิธี...) ชวนให้คลิกอ่านรายละเอียดต่อในคอมเม้นใต้โพสต์ แบ่งแคปชั่นแยกกันชัดเจน",
    content: `สไตล์การเขียนโพสเพจ Facebook แบบคลิกเบท สำหรับเพจด้านเทคโนโลยี AI และคอร์สออนไลน์

== รูปแบบผลลัพธ์ตามไฟล์ตัวอย่างโพสข้อความคลิกเบท.csv ==
ต้องแยกเป็น 4 ช่องชัดเจน:
แคปชั่น
ใต้เม้น1
ใต้เม้น2
ใต้เม้น3

== รูปแบบแคปชั่น ==
- เปิดด้วยคำกระตุ้นแรง เช่น แจก, มาแล้ว, ห้ามพลาด, วิธี, โอกาส, เปลี่ยนชีวิต, นำหน้าคู่แข่ง
- ระบุประโยชน์หลักแบบจับต้องได้ เช่น ได้ Prompt, ได้คอร์ส, ได้เครื่องมือ, ประหยัดเวลา, ทำงานเร็วขึ้น, นำหน้าคนอื่น
- สั้น กระแทก ชวนคลิก อ่านแล้วรู้ว่ามีต่อในคอมเม้น
- ใช้วงเล็บหรือท้ายประโยคแบบ (มีต่อ👇), (วาปในเม้น👇), (รายละเอียดในคอมเม้นท์)

== รูปแบบใต้เม้น ==
- แบ่งเนื้อหาเป็น ใต้เม้น1, ใต้เม้น2, ใต้เม้น3 เหมือนคอลัมน์ใน CSV
- แต่ละใต้เม้นเป็นเนื้อหาต่อกัน ไม่ต้องเขียนเกริ่นซ้ำ
- ถ้าเป็นรายการ ให้แบ่งลำดับต่อเนื่อง เช่น 1-5, 6-10, 11-15
- ใต้เม้น3 ปิดด้วย CTA หรือแหล่งที่มาเมื่อมีลิงก์

== ตัวอย่างแคปชั่น ==
แจก 100 Prompt ลับ! ที่บริษัทที่ปรึกษาราคาแพงไม่เคยบอกคุณ ใช้เวลา 6 เดือนรวบรวม-ทดสอบ ช่วยให้คุณนำหน้าคน 99% ในเวลาแค่ 12 เดือน (มีต่อ👇)

วิธีนำหน้าคู่แข่ง 99% ใน 3 เดือน โดยไม่ต้องเสียเงินเพิ่ม! แค่มี 100 Prompt นี้ เหมือนมีโค้ชธุรกิจส่วนตัว 24 ชม. (มีต่อ👇)

== กฎสำคัญ ==
- ภาษาไทยเป็นหลัก อาจมีภาษาอังกฤษสำหรับชื่อเทคนิค/เครื่องมือ
- ใช้คำย่อที่คนไทยเข้าใจ เช่น AI, Prompt, Tools, คอร์ส, เครดิต
- ไม่ใช้ภาษาวิชาการเกินไป อ่านง่าย เข้าถึงได้
- ทุกแคปชั่นต้องบอกชัดว่ามีต่อในคอมเม้น`
  }
];

export const PALETTE_HEADLINE_STYLES: HeadlinePack[] = [
  {
    id: "ai_clickbait",
    name: "AI Click Bait (พาดหัวคลิกเบท)",
    headlines: [
      "หุ่นยนต์ AI โซนี่ ชนะนักปิงปองมืออาชีพแล้ว",
      "หุ่นยนต์ฮิวแมนนอยด์ วิ่งมาราธอนเร็วกว่านักโอลิมปิก",
      "Sony AI: หุ่นยนต์ปิงปองโค่นเซียน, หุ่นยนต์มาราธอนทุบสถิติ",
      "Physical AI เข้าสู่สนามจริง: หุ่นยนต์โซนี่และหุ่นยนต์มาราธอนสร้างประวัติศาสตร์",
      "วงการ AI สะเทือน: หุ่นยนต์ชนะคนในปิงปองและมาราธอน"
    ]
  },
  {
    id: "ai_educational",
    name: "AI Educational (ความรู้และจัดอันดับ)",
    headlines: [
      "แจก 5 เครื่องมือ AI ช่วยเขียนโค้ดฟรีที่พัฒนาชีวิตคุณ 10 เท่า",
      "สรุป 3 เทรนด์เทคโนโลยีที่จะมาแรงที่สุดในปี 2026",
      "เปรียบเทียบชัดๆ: Gemini 2.5 Flash กับคู่แข่งในงานโปรดักชั่น",
      "คู่มือประหยัดเวลาทำงาน 10 ชั่วโมงต่อสัปดาห์ด้วย Prompt ลับ",
      "5 สเต็ปง่ายๆ ในการสร้าง Sub-agents ช่วยรันงานแทนคุณ"
    ]
  },
  {
    id: "ai_curiosity",
    name: "AI Curiosity (ความลับและน่าสงสัย)",
    headlines: [
      "ความลับที่บริษัทไอทีชั้นนำ ปิดบังคุณเกี่ยวกับการใช้ AI",
      "สิ่งที่จะเกิดขึ้นกับสายอาชีพคุณ ถ้าคุณไม่เริ่มใช้วิธีนี้...",
      "ทำไมเบื้องหลังโปรแกรมเมอร์เงินแสน ถึงเลือกใช้ตัวนี้เขียนงาน?",
      "จุดจบของยุคเก่า: สิ่งที่กำลังจะมาแทนที่เครื่องมือที่คุณใช้อยู่",
      "เผยเคล็ดลับที่ไม่มีสอนในมหาวิทยาลัยเกี่ยวกับการสเกลธุรกิจอัตโนมัติ"
    ]
  },
  {
    id: "ai_fomo",
    name: "AI FOMO (ตกขบวนและกระตุ้นอารมณ์)",
    headlines: [
      "เรียนด่วนก่อนตกงาน! เปิดตัวโมเดลใหม่ทำแทนคนได้เกือบ 100%",
      "ช็อกวงการซอฟต์แวร์! เครื่องมือในตำนานประกาศปิดตัวแล้ววันนี้",
      "ถ้าคุณยังใช้วิธีเดิมๆ อยู่ เตรียมตัวถูกทิ้งไว้ข้างหลังได้เลย",
      "นาทีสุดท้าย! แจกฟรีคลังความรู้ชุดคำสั่งเฉพาะก่อนปรับเป็นเสียเงิน",
      "ชี้ชะตาอนาคต: เทคโนโลยีตัวเดียวที่คุณห้ามพลาดเด็ดขาดในปีนี้"
    ]
  },
  {
    id: "ai_direct",
    name: "AI Direct (คำสั่งและแก้ปัญหาด่วน)",
    headlines: [
      "เลิกเขียนโค้ดแบบเดิมๆ! หยิบสคริปต์นี้ไปกดรันทันที",
      "หยุดทำสิ่งนี้ถ้าอยากได้งานที่มีประสิทธิภาพขึ้น 200%",
      "แก้ปัญหาคอมพิวเตอร์ช้าใน 3 คลิกด้วยชุดคำสั่งฟรี",
      "อยากมีผู้ช่วยอัจฉริยะส่วนตัว? ทำตามขั้นตอนนี้ด่วน",
      "เปลี่ยนไอเดียฟุ้งซ่านให้เป็นแอปพร้อมใช้ในเวลาแค่ 10 นาที"
    ]
  }
];

export const PALETTE_IMAGE_PROMPT_STYLES: ImagePromptStyle[] = [
  {
    id: "trendtech",
    name: "Trendtech Layout",
    core_prompt: "A social media post or YouTube thumbnail for a tech/business channel. The main image is a high-quality video still of a content creator looking at the camera, gesturing, against a slightly blurred office or studio background with professional lighting and often colored ambient backlights (e.g., purple, blue). The post has a consistent layout and text style. At the top right corner, there is a channel logo. On the right side, there is a black box with a thin white outline containing a circular profile picture, channel name, and subscriber count. The main text overlay is located in the bottom half of the image, featuring a large, bold headline in a modern Thai sans-serif font. The headline text is primarily white, with specific keywords or phrases highlighted in a bright color like red or blue, often placed against a solid color block for emphasis. A smaller, single-line caption in white text is at the very bottom. The layout frequently includes other small graphic elements like black arrows with white outlines, icons, or simple diagrams to illustrate a point.",
    negative_prompt: "watermarks, bad anatomy, bad spelling"
  },
  {
    id: "ai_interesting",
    name: "AI น่าสนใจ (YouTuber Studio)",
    core_prompt: "ภาพถ่ายบุคคลสไตล์ยูทูปเบอร์แนวเทคโนโลยีหรือธุรกิจ บรรยากาศแบบมืออาชีพคล้ายภาพจากวิดีโอสัมภาษณ์ในสตูดิโอ ตัวแบบมองตรงมาที่กล้อง จัดแสงแบบภาพยนตร์โดยมีแสงหลักส่องที่ใบหน้าอย่างชัดเจน พื้นหลังเป็นห้องทำงานหรือสตูดิโอที่ทันสมัยซึ่งถูกทำให้เบลอเล็กน้อย มีการใช้แสงไฟนีออนหรือ LED สีม่วงและน้ำเงินเพื่อสร้างมิติและความสวยงามให้กับฉากหลัง Layout details: ข้อความพาดหัวหลักขนาดใหญ่ที่ครึ่งล่างของภาพ ใช้ฟอนต์หนาและทันสมัย มีการเน้นคำสำคัญด้วยสีหรือแถบสีไฮไลท์ที่โดดเด่น. ข้อความบรรยายย่อยหนึ่งบรรทัดอยู่ด้านล่างสุดของภาพ มักขึ้นต้นด้วยเครื่องหมายขีด. มีองค์ประกอบกราฟิกเล็กๆ เช่น กล่องข้อความ แผนภาพ หรือโลโก้ พร้อมลูกศรชี้ เพื่ออธิบายประเด็นสำคัญในภาพ Additional details: บางทีก็ไม่จำเป็นต้องมีรูปคนนั่งอยู๋ตรงกลางที่เป็นยูทูปเบอร์แ เสมอไป อยากให้เข้ากับตัวบทความที่ส่งให้ด้วย ให้คุณคิดเองว่า บทความแบบนี้ควรมีรูปคนนั่งเล่ามั้ย ถ้าไม่จำเป็น ก็ทำเป็นรูปประกอบที่เหมาะกับบทความแทน",
    negative_prompt: "ลายน้ำ, อวัยวะบิดเบี้ยว, สะกดผิด, ตัวอักษรผิดเพี้ยน, โลโก้ผิดเพี้ยน"
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'vault' | 'canvas' | 'settings' | 'prompt-generator' | 'vertical-video' | 'quote-video' | 'avatar-video' | 'dropbox-csv' | 'podcast-clip' | 'tracking'>('discovery');

  // Global scale state for accessibility
  const [appScale, setAppScale] = useState<number>(() => {
    const saved = localStorage.getItem('app_scale');
    return saved ? Number(saved) : 100;
  });

  // Apply scale to root element on changes
  useEffect(() => {
    localStorage.setItem('app_scale', String(appScale));
    const rootSize = (appScale / 100) * 16; // 16px is base font size
    document.documentElement.style.fontSize = `${rootSize}px`;
  }, [appScale]);

  // Synchronize Google API Key for tracking dashboard iframe compatibility
  useEffect(() => {
    const googleKey = localStorage.getItem('google_key');
    if (googleKey) {
      localStorage.setItem('google_api_key', googleKey);
    }
  }, [activeTab]);

  // Vault data states
  const [vaultItems, setVaultItems] = useState<VaultContent[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [vaultSelectedIds, setVaultSelectedIds] = useState<string[]>([]);
  const [expandedImageIds, setExpandedImageIds] = useState<string[]>([]);
  const [expandedScriptIds, setExpandedScriptIds] = useState<string[]>([]);

  const toggleImages = (itemId: string) => {
    setExpandedImageIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleScript = (itemId: string) => {
    setExpandedScriptIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  // Vault filters state
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [sortBy] = useState<string>('newest');
  // Active Terminal log states for SSE streams
  const [logs, setLogs] = useState<{
    canvas: string[];
  }>({
    canvas: ['[SYSTEM] Terminal ready. Select an item and click "Draw Poster" to start...'],
  });

  const [runningModule, setRunningModule] = useState<{
    canvas: boolean;
  }>({
    canvas: false,
  });

  // SSE event connections
  const sseConnections = useRef<{ [key: string]: EventSource | null }>({
    canvas: null,
  });

  // Terminal scroll targets
  const terminalBottoms = {
    canvas: useRef<HTMLDivElement>(null),
  };

  // Canvas View Configuration States
  const [approvedItems, setApprovedItems] = useState<VaultContent[]>([]);
  const [canvasAllItems, setCanvasAllItems] = useState<VaultContent[]>([]);
  const [canvasShowAll, setCanvasShowAll] = useState(false);
  const [canvasSearchQuery, setCanvasSearchQuery] = useState('');
  const [canvasSelectedItem, setCanvasSelectedItem] = useState<VaultContent | null>(null);
  const [showCanvasItemMedia, setShowCanvasItemMedia] = useState<boolean>(true);
  const [showCanvasCardDetails, setShowCanvasCardDetails] = useState<boolean>(true);
  const [canvasImportedItems, setCanvasImportedItems] = useState<VaultContent[]>([]);
  const [canvasSelectedIds, setCanvasSelectedIds] = useState<string[]>([]);
  const [canvasQueueIndex, setCanvasQueueIndex] = useState<number | null>(null);
  const [canvasQueueIds, setCanvasQueueIds] = useState<string[]>([]);
  const queueIndexRef = useRef<number | null>(null);
  const queueIdsRef = useRef<string[]>([]);
  const [canvasRatio, setCanvasRatio] = useState<'1:1' | '4:5' | '4:3' | '16:9' | '9:16'>('1:1');
  const [canvasTheme, setCanvasTheme] = useState('Classic Red Blue');
  const [canvasLayout, setCanvasLayout] = useState('top_gainers');
  const [canvasHeadline, setCanvasHeadline] = useState('');
  const [canvasCaption, setCanvasCaption] = useState('');
  const [canvasHeadlineMode, setCanvasHeadlineMode] = useState<'single' | 'triple'>('triple');
  const [canvasHeadlineLine1, setCanvasHeadlineLine1] = useState('');
  const [canvasHeadlineLine2, setCanvasHeadlineLine2] = useState('');
  const [canvasHeadlineLine3, setCanvasHeadlineLine3] = useState('');
  const [generatingCopywriting, setGeneratingCopywriting] = useState(false);
  const [isAutoSelectingBg, setIsAutoSelectingBg] = useState(false);
  const [exportDirHandle, setExportDirHandle] = useState<any>(null);
  const [exportFolderName, setExportFolderName] = useState<string>(() => localStorage.getItem('canvas_export_folder_name') || '');
  const [quickViewCopywriting, setQuickViewCopywriting] = useState<VaultContent | null>(null);
  const [quickViewTab, setQuickViewTab] = useState<'post' | 'headlines'>('post');
  const [canvasHighlight, setCanvasHighlight] = useState('');
  const [canvasBgImage, setCanvasBgImage] = useState('');
  const [canvasBgSource, setCanvasBgSource] = useState<'default' | 'stock'>(() => (localStorage.getItem('canvas_bg_source') as any) || 'default');
  const [latestGraphic, setLatestGraphic] = useState<GraphicItem | null>(null);
  const [loadingGraphics, setLoadingGraphics] = useState(false);
  const [contentGraphics, setContentGraphics] = useState<any[]>([]);
  const [graphicIndex, setGraphicIndex] = useState<number>(0);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxItem, setLightboxItem] = useState<VaultContent | null>(null);

  // V1 Logo circular stamps & margins
  const [savedLogos, setSavedLogos] = useState<{ name: string; url: string }[]>([]);
  const [canvasLogoUrl, setCanvasLogoUrl] = useState('');
  const [canvasLogoSize, setCanvasLogoSize] = useState(10);
  const [canvasLogoMarginX, setCanvasLogoMarginX] = useState(20);
  const [canvasLogoMarginY, setCanvasLogoMarginY] = useState(20);
  const [canvasShowPageLogo, setCanvasShowPageLogo] = useState(false);
  const [canvasLogoCorner, setCanvasLogoCorner] = useState<'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'>('top-right');
  const [rememberLogo, setRememberLogo] = useState(false);
  const [stockFolder, setStockFolder] = useState<string>(() => localStorage.getItem('canvas_stock_folder') || '');
  const [stockFolderName, setStockFolderName] = useState<string>(() => {
    const saved = localStorage.getItem('canvas_stock_folder') || '';
    if (!saved) return '';
    const parts = saved.split('/').filter(Boolean);
    return parts[parts.length - 1] || saved;
  });
  const [stockFolderLog, setStockFolderLog] = useState<string>('');

  // Category Badge (Strap / Label)
  const [canvasShowBadge, setCanvasShowBadge] = useState(true);
  const [canvasBadgeStyle, setCanvasBadgeStyle] = useState('dev-pick');
  const [canvasBadgeText, setCanvasBadgeText] = useState('AI');
  const [canvasBadgeSubtext, setCanvasBadgeSubtext] = useState('Content Lab');

  // News Card Overlay
  const [canvasShowNewsCard, setCanvasShowNewsCard] = useState(false);
  const [canvasNewsTitle, setCanvasNewsTitle] = useState('');
  const [canvasNewsDetail, setCanvasNewsDetail] = useState('');
  const [canvasNewsSource, setCanvasNewsSource] = useState('');

  // Callout & Sticker
  const [canvasShowCallout, setCanvasShowCallout] = useState(false);
  const [canvasCalloutText, setCanvasCalloutText] = useState('สร้างทุกอย่างด้วยตัวเองและ AI');
  const [canvasCalloutHighlight, setCanvasCalloutHighlight] = useState('เคสนี้น่าแชร์');
  const [canvasCalloutPlacement, setCanvasCalloutPlacement] = useState('random');
  const [canvasCalloutSticker, setCanvasCalloutSticker] = useState('random');

  // Meme Sticker
  const [canvasShowMeme, setCanvasShowMeme] = useState(false);
  const [canvasMemeText, setCanvasMemeText] = useState('เร็วกว่าเดิม');
  const [canvasMemeSubtext, setCanvasMemeSubtext] = useState('AI ช่วยย่นเวลา');

  // Credit, Font scale, Image split
  const [canvasCreditText, setCanvasCreditText] = useState('วางแผนเป็น เห็นทางรวย');
  const [canvasFontScale, setCanvasFontScale] = useState(1.0);
  const [canvasImageSplit, setCanvasImageSplit] = useState(60);
  const [canvasFontFamily, setCanvasFontFamily] = useState('Kanit');
  const [canvasHeadlineAlign, setCanvasHeadlineAlign] = useState<'left' | 'center' | 'right'>('left');
  const [canvasHeadlineMargin, setCanvasHeadlineMargin] = useState<number>(35);
  const [canvasHighlightColorSet, setCanvasHighlightColorSet] = useState<string>('classic');
  const [canvasHighlightPaddingX, setCanvasHighlightPaddingX] = useState<number>(() => {
    const saved = localStorage.getItem('canvas_highlight_padding_x');
    return saved ? Number(saved) : 0.22;
  });
  const [canvasHighlightPaddingY, setCanvasHighlightPaddingY] = useState<number>(() => {
    const saved = localStorage.getItem('canvas_highlight_padding_y');
    return saved ? Number(saved) : 0.09;
  });
  
  // Right side panel preview toggle
  const [previewTab, setPreviewTab] = useState<'live' | 'pillow'>('live');

  // Dropbox integration state
  const [dropboxToken, setDropboxToken] = useState<string>(() => localStorage.getItem('dropbox_token') || '');
  const [dropboxFolder, setDropboxFolder] = useState<string>(() => localStorage.getItem('dropbox_folder') || '/ContentFactory/exports');
  const [isUploadingDropbox, setIsUploadingDropbox] = useState(false);
  const [dropboxUploadProgress, setDropboxUploadProgress] = useState('');

  // Copywriting styles state
  const [canvasWritingStyle, setCanvasWritingStyle] = useState('ai_trendtech');
  const [canvasHeadlineStyle, setCanvasHeadlineStyle] = useState('ai_clickbait');
  const [canvasImagePromptStyle, setCanvasImagePromptStyle] = useState('trendtech');
  const [rewritingHeadline, setRewritingHeadline] = useState(false);
  const [showCanvasLogs, setShowCanvasLogs] = useState<boolean>(true);
  
  // Premium Credit Checker States
  const [creditCheckResults, setCreditCheckResults] = useState<{
    label: string;
    keyPreview: string;
    valid: boolean;
    balance: string;
    usage: string;
    isFreeTier?: boolean;
    keyApiLabel?: string;
    error?: string;
  }[]>([]);
  const [isCheckingCredits, setIsCheckingCredits] = useState(false);

  // Interactive Copywriting & AI Teacher Feedback States
  const [canvasArticleLength, setCanvasArticleLength] = useState<'short' | 'medium' | 'long' | 'deep'>('medium');
  const [canvasArticleFeedback, setCanvasArticleFeedback] = useState('');
  const [canvasHeadlineFeedback, setCanvasHeadlineFeedback] = useState('');

  const checkOpenRouterCredits = async (apiKey: string) => {
    if (!apiKey?.trim()) {
      return { valid: false, balance: 0, balanceFormatted: '$0.00', usage: 0, limit: null, error: 'ไม่พบ API Key' };
    }
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        headers: { 'Authorization': `Bearer ${apiKey.trim()}` },
      });
      if (!res.ok) {
        return {
          valid: false, balance: 0, balanceFormatted: '$0.00', usage: 0, limit: null,
          error: `HTTP ${res.status}: ${res.statusText}`,
        };
      }
      const data = await res.json();
      const usage = Number(data.data?.usage) || 0;
      const limit = data.data?.limit != null ? Number(data.data.limit) : null;
      const isFreeTier = data.data?.is_free_tier === true;
      const keyLabel = data.data?.label || '';
      const balance = limit !== null ? Math.max(0, limit - usage) : -1;
      const balanceFormatted = limit !== null ? `$${balance.toFixed(4)}` : 'ไม่ได้ตั้งลิมิตบน Key นี้';
      return { valid: true, balance, balanceFormatted, usage, limit, isFreeTier, keyLabel, rawData: data.data };
    } catch (e: any) {
      return {
        valid: false, balance: 0, balanceFormatted: '$0.00', usage: 0, limit: null,
        error: e.message || 'Network error',
      };
    }
  };

  // One-click OpenRouter AI copywriting completion using Gemini 2.5 Flash
  const handleAIRewriteHeadline = async () => {
    if (!canvasSelectedItem) {
      alert("⚠️ กรุณาเลือกหัวข้อวัตถุดิบลักษณะการ์ดด้านล่างสุดก่อนกดเกลาครับ");
      return;
    }

    const openRouterKey = localStorage.getItem('openrouter_key')?.trim();
    if (!openRouterKey) {
      alert("❌ ไม่พบคีย์ระบบหลังบ้าน OpenRouter API Key!\nกรุณาไปที่แท็บ '⚙️ ตั้งค่าระบบ' (Settings Tab) และกรอกกุญแจในส่วน 'OpenRouter API Key' ก่อนครับ");
      return;
    }

    setRewritingHeadline(true);
    try {
      // Find writing style templates
      const activeStyle = PALETTE_WRITING_STYLES.find(s => s.id === canvasWritingStyle);
      const activeHeadlinePack = PALETTE_HEADLINE_STYLES.find(h => h.id === canvasHeadlineStyle);

      const postStylePrompt = activeStyle ? activeStyle.content : "";
      const headlineExamples = activeHeadlinePack ? activeHeadlinePack.headlines.join("\n- ") : "";
      
      const systemPrompt = `You are Antigravity Copywriter, an advanced Thai technology and business marketing AI.
Your job is to read an article, extract the core message, and write an extremely engaging, high-converting Thai headline and post in the exact style specified by the user.

== USER REQUESTED WRITING STYLE TONE & RULES ==
${postStylePrompt}

== IDEAL HEADLINE STYLE EXAMPLES ==
- ${headlineExamples}

== SPECIFIC OUTPUT INSTRUCTIONS ==
Provide the final result strictly as a clean JSON block containing exactly two fields:
1. "headline": The final optimized 1-line Thai headline for overlaying on a post graphic. Keep it bold, clear, and highly engaging. If writing in clicking/clickbait style, make sure to add (มีต่อ👇) or similar in the headline itself. Max length 12 words.
2. "highlight": 1-2 important standout words or names from the headline that should be colored for highlight emphasis (e.g. "Gemini 2.5", "Sub-agents", "Sony AI").

Make sure to return only the raw JSON block without any markdown wrappers or backticks. Example:
{"headline": "สร้างกองทัพ AI 15 ตัวด้วย Sub-agent (มีต่อ👇)", "highlight": "Sub-agent"}`;

      const userContent = `ARTICLE TITLE: ${canvasSelectedItem.title}
ARTICLE CONTENT:
${canvasSelectedItem.raw_content || canvasSelectedItem.title}

Please rewrite this following the copywriting style tone and output rules above.`;

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://contentfactory.antigravity.ai", // Required by OpenRouter
          "X-Title": "Antigravity ContentFactory"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent }
          ],
          temperature: 0.7,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter returned status ${response.status}`);
      }

      const data = await response.json();
      const contentText = data.choices?.[0]?.message?.content;
      if (!contentText) {
        throw new Error("Empty response from AI engine");
      }

      // Parse JSON response safely
      let parsedResult;
      try {
        parsedResult = JSON.parse(contentText.trim().replace(/^```json\s*|```$/g, ''));
      } catch {
        // Fallback if not pure JSON
        parsedResult = { headline: contentText.trim(), highlight: "" };
      }

      if (parsedResult.headline) {
        setCanvasHeadline(parsedResult.headline);
        if (parsedResult.highlight) {
          setCanvasHighlight(parsedResult.highlight);
        }
        alert("✨ ให้ AI เกลาหัวข้อข่าวและปรับสไตล์เรียบร้อยแล้วครับ!");
      }
    } catch (err: any) {
      console.error("AI Copywriting rewrite failure:", err);
      alert(`❌ การแปลเรียบเรียงและเกลาด้วย AI ขัดข้อง: ${err.message || err}`);
    } finally {
      setRewritingHeadline(false);
    }
  };

  // One-click AI Copywriting Details Suite Generator (Post Caption, Selective Headlines, 3 comments, 3-line headline) for a specific item
  const handleGenerateCopywritingForItem = async (targetItem: VaultContent) => {
    if (!targetItem) return;
    
    setGeneratingCopywriting(true);
    const activeStyle = PALETTE_WRITING_STYLES.find(s => s.id === canvasWritingStyle);
    const activeHeadlinePack = PALETTE_HEADLINE_STYLES.find(h => h.id === canvasHeadlineStyle);
    const openRouterKey = localStorage.getItem('openrouter_key')?.trim() || '';

    // Initialize and show logs console
    setShowCanvasLogs(true);
    setLogs(prev => ({
      ...prev,
      canvas: [
        `[SYSTEM] เริ่มสั่งเขียนบทความและพาดหัว AI (แบบเดี่ยว) สำหรับ: "${targetItem.title}"...`,
        `[SYSTEM] สไตล์พาดหัว: ${activeHeadlinePack?.name || 'ไม่ได้เลือก'}`,
        `[SYSTEM] สไตล์การเขียน: ${activeStyle?.name || 'ไม่ได้เลือก'}`,
        `[SYSTEM] ความยาวแคปชั่น: ${canvasArticleLength}`,
        `[SYSTEM] --------------------------------------------------`
      ]
    }));
    scrollTerminal('canvas');

    try {
      const keySentPreview = openRouterKey ? `${openRouterKey.slice(0, 8)}...${openRouterKey.slice(-4)}` : 'ใช้คีย์เซิร์ฟเวอร์ (SQLite)';
      setLogs(prev => ({
        ...prev,
        canvas: [
          ...prev.canvas,
          `[PROCESS] กำลังส่งคำขอไปยัง API (คีย์ที่ส่ง: ${keySentPreview})...`
        ]
      }));
      scrollTerminal('canvas');

      const response = await fetch(`${API_BASE}/vault/contents/${targetItem.id}/generate-copywriting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          length: canvasArticleLength,
          font_scale: canvasFontScale,
          writing_style_prompt: activeStyle?.content || '',
          headline_style_examples: activeHeadlinePack?.headlines || [],
          openrouter_key: openRouterKey
        })
      });
      const resData = await response.json();
      if (resData.success) {
        const hl3 = resData.data.headline_3line || [];
        const joinedHl = hl3.length > 0 ? hl3.filter(Boolean).join('\n') : targetItem.title;

        // Update item's copywriting metadata locally immediately
        const updatedItem = {
          ...targetItem,
          selected_headline: joinedHl,
          metadata: {
            ...targetItem.metadata,
            copywriting: resData.data
          }
        };
        
        // If the processed item is currently selected, update the selected state too
        if (canvasSelectedItem && canvasSelectedItem.id === targetItem.id) {
          setCanvasSelectedItem(updatedItem);
        }
        
        // Update the main state list too
        setCanvasImportedItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setCanvasAllItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        
        // Reload from database to ensure everything is synchronized
        fetchVaultData();
        fetchApprovedItems();
        
        if (resData.data.is_simulated) {
          setLogs(prev => ({
            ...prev,
            canvas: [
              ...prev.canvas,
              `[WARNING] ขัดข้องในการเรียกใช้ AI API: ${resData.data.error_message || 'Unknown API Error'}`,
              `[WARNING] สลับระบบเป็น Local Simulator Fallback (แบบจำลองข้อความในเครื่องแทน) เรียบร้อย!`,
              `[SUCCESS] จำลองข้อความสำหรับ "${targetItem.title}" เสร็จสิ้น!`
            ]
          }));
        } else {
          setLogs(prev => ({
            ...prev,
            canvas: [
              ...prev.canvas,
              `[SUCCESS] AI (Gemini-2.5-Flash) ประมวลผลสำเร็จ!`,
              `[SUCCESS] พาดหัว 3 บรรทัด: ${hl3.filter(Boolean).join(' | ')}`,
              `[SUCCESS] บันทึกคำโฆษณาและแคปชั่นเสร็จสมบูรณ์`
            ]
          }));
        }
        scrollTerminal('canvas');
        alert("✨ สร้างบทความและจำลองคำโฆษณาเรียบร้อยแล้ว!");
      } else {
        const errMsg = resData.error || "เกิดข้อผิดพลาดในการสร้างบทความ";
        setLogs(prev => ({
          ...prev,
          canvas: [
            ...prev.canvas,
            `[ERROR] เกิดข้อผิดพลาดจากหลังบ้าน: ${errMsg}`
          ]
        }));
        scrollTerminal('canvas');
        alert("⚠️ " + errMsg);
      }
    } catch (err: any) {
      console.error("Copywriting generation error:", err);
      const errMsg = err.message || String(err);
      setLogs(prev => ({
        ...prev,
        canvas: [
          ...prev.canvas,
          `[ERROR] การเชื่อมต่อเครือข่ายล้มเหลว: ${errMsg}`
        ]
      }));
      scrollTerminal('canvas');
      alert("⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์เพื่อประมวลผลคำโฆษณาได้");
    } finally {
      setGeneratingCopywriting(false);
    }
  };

  // One-click AI Copywriting Details Suite Generator (Post Caption, Selective Headlines, 3 comments, 3-line headline)
  const handleGenerateCopywriting = async () => {
    if (!canvasSelectedItem) {
      alert("⚠️ กรุณาเลือกหัวข้อวัตถุดิบลักษณะการ์ดด้านล่างสุดก่อนกดเขียนบทความครับ");
      return;
    }
    await handleGenerateCopywritingForItem(canvasSelectedItem);
  };

  // Bulk AI Copywriting Suite Generator for all selected items
  const handleBulkGenerateCopywriting = async () => {
    if (canvasSelectedIds.length === 0) {
      alert("⚠️ กรุณาเลือกหัวข้อไอเดียคอนเทนต์ที่ต้องการเขียนบทความอย่างน้อย 1 รายการก่อนครับ");
      return;
    }

    setGeneratingCopywriting(true);
    const activeStyle = PALETTE_WRITING_STYLES.find(s => s.id === canvasWritingStyle);
    const activeHeadlinePack = PALETTE_HEADLINE_STYLES.find(h => h.id === canvasHeadlineStyle);
    const openRouterKey = localStorage.getItem('openrouter_key')?.trim() || '';

    // Initialize and show logs console
    setShowCanvasLogs(true);
    setLogs(prev => ({
      ...prev,
      canvas: [
        `[SYSTEM] เริ่มการสั่งเขียนบทความและพาดหัวด้วย AI (แบบกลุ่ม) สำหรับ ${canvasSelectedIds.length} รายการ...`,
        `[SYSTEM] สไตล์พาดหัว: ${activeHeadlinePack?.name || 'ไม่ได้เลือก'}`,
        `[SYSTEM] สไตล์การเขียน: ${activeStyle?.name || 'ไม่ได้เลือก'}`,
        `[SYSTEM] ความยาวโพสต์: ${canvasArticleLength}`,
        `[SYSTEM] --------------------------------------------------`
      ]
    }));
    scrollTerminal('canvas');

    let successCount = 0;
    try {
      for (let i = 0; i < canvasSelectedIds.length; i++) {
        const id = canvasSelectedIds[i];
        const item = (canvasShowAll ? canvasAllItems : canvasImportedItems).find(x => x.id === id);
        if (!item) continue;

        setLogs(prev => ({
          ...prev,
          canvas: [
            ...prev.canvas,
            `[PROCESS] [${i + 1}/${canvasSelectedIds.length}] กำลังส่งคำขอสำหรับ: "${item.title}"...`
          ]
        }));
        scrollTerminal('canvas');

        console.log(`[BULK] Generating AI copywriting for item ${i+1}/${canvasSelectedIds.length}: ${item.title}`);
        const response = await fetch(`${API_BASE}/vault/contents/${item.id}/generate-copywriting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            length: canvasArticleLength,
            font_scale: canvasFontScale,
            writing_style_prompt: activeStyle?.content || '',
            headline_style_examples: activeHeadlinePack?.headlines || [],
            openrouter_key: openRouterKey
          })
        });
        const resData = await response.json();
        if (resData.success) {
          successCount++;
          const hl3 = resData.data.headline_3line || [];
          const joinedHl = hl3.length > 0 ? hl3.filter(Boolean).join('\n') : item.title;

          const updatedItem = {
            ...item,
            selected_headline: joinedHl,
            metadata: {
              ...item.metadata,
              copywriting: resData.data
            }
          };

          // Update state lists immediately to reflect AI results in real-time
          setCanvasImportedItems(prev => prev.map(x => x.id === updatedItem.id ? updatedItem : x));
          setCanvasAllItems(prev => prev.map(x => x.id === updatedItem.id ? updatedItem : x));

          // Also update selected item if currently focused
          if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
            setCanvasSelectedItem(updatedItem);
          }

          if (resData.data.is_simulated) {
            setLogs(prev => ({
              ...prev,
              canvas: [
                ...prev.canvas,
                `[WARNING] ขัดข้องในการเรียกใช้ AI: ${resData.data.error_message || 'API Error'}`,
                `[WARNING] สลับระบบเป็น Local Simulator Fallback สำหรับรายการนี้`,
                `[SUCCESS] จำลองบทความและพาดหัวเสร็จสิ้นสำหรับ "${item.title.slice(0, 30)}..."`
              ]
            }));
          } else {
            setLogs(prev => ({
              ...prev,
              canvas: [
                ...prev.canvas,
                `[SUCCESS] AI เขียนโพสต์สำเร็จสำหรับ: "${item.title.slice(0, 30)}..."`,
                `[SUCCESS] พาดหัว: ${hl3.filter(Boolean).join(' | ')}`
              ]
            }));
          }
          scrollTerminal('canvas');
        } else {
          setLogs(prev => ({
            ...prev,
            canvas: [
              ...prev.canvas,
              `[ERROR] ล้มเหลวสำหรับรายการ "${item.title.slice(0, 30)}...": ${resData.error || 'Server Error'}`
            ]
          }));
          scrollTerminal('canvas');
        }
      }

      // Sync and reload DB
      fetchVaultData();
      fetchApprovedItems();
      fetchAllCanvasItems(); // Ensure Canvas lists reload from DB as well!

      alert(`✨ ประมวลผลและเขียนบทความจำลองพาดหัวด้วย AI สำเร็จทั้งหมด ${successCount}/${canvasSelectedIds.length} รายการ!`);
    } catch (err: any) {
      console.error("Bulk copywriting generation error:", err);
      const errMsg = err.message || String(err);
      setLogs(prev => ({
        ...prev,
        canvas: [
          ...prev.canvas,
          `[FATAL ERROR] การเชื่อมต่อแบบกลุ่มขัดข้อง: ${errMsg}`
        ]
      }));
      scrollTerminal('canvas');
      alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อประมวลผลคำโฆษณาแบบกลุ่ม");
    } finally {
      setGeneratingCopywriting(false);
      setLogs(prev => ({
        ...prev,
        canvas: [
          ...prev.canvas,
          `[SYSTEM] --------------------------------------------------`,
          `[SYSTEM] ประมวลผลเสร็จสิ้นทั้งหมด! สำเร็จรวม ${successCount}/${canvasSelectedIds.length} รายการ`
        ]
      }));
      scrollTerminal('canvas');
    }
  };

  const handleExportLocal = async () => {
    let activeDirHandle = exportDirHandle;
    if (!activeDirHandle) {
      try {
        activeDirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        setExportDirHandle(activeDirHandle);
        setExportFolderName(activeDirHandle.name);
        localStorage.setItem('canvas_export_folder_name', activeDirHandle.name);
      } catch (e: any) {
        if (e.name === 'AbortError') return;
        console.error('Folder picker error:', e);
        alert('❌ กรุณาเลือกโฟลเดอร์เพื่อเริ่มต้นบันทึกไฟล์ครับ: ' + e.message);
        return;
      }
    }

    const idsToExport = canvasSelectedIds.length > 0 
      ? canvasSelectedIds 
      : canvasImportedItems.map(i => i.id);
    
    if (idsToExport.length === 0) {
      alert('⚠️ ไม่มีข้อมูลที่จะส่งออก กรุณาเลือกรายการก่อน');
      return;
    }

    try {
      // Call backend export API
      const resp = await fetch(`${API_BASE}/vault/export-local`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content_ids: idsToExport })
      });
      
      if (!resp.ok) throw new Error('Export failed');
      const result = await resp.json();
      
      // Download CSV via browser
      if (result.csv_content) {
        const csvBlob = new Blob([result.csv_content], { type: 'text/csv;charset=utf-8;' });
        const csvFile = await activeDirHandle.getFileHandle(
          `content_export_${new Date().toISOString().slice(0,10).replace(/-/g,'')}.csv`, 
          { create: true }
        );
        const writable = await csvFile.createWritable();
        await writable.write(csvBlob);
        await writable.close();
      }

      // Download rendered images via browser
      let imgCount = 0;
      if (result.images && result.images.length > 0) {
        for (const img of result.images) {
          try {
            const imgResp = await fetch(`${API_BASE}/vault/media?path=${encodeURIComponent(img.path)}`);
            if (imgResp.ok) {
              const imgBlob = await imgResp.blob();
              const imgFile = await activeDirHandle.getFileHandle(img.filename, { create: true });
              const writable = await imgFile.createWritable();
              await writable.write(imgBlob);
              await writable.close();
              imgCount++;
            }
          } catch (e) { console.warn('Image copy failed:', img.filename, e); }
        }
      }

      alert(`✅ ส่งออกสำเร็จ!\n📁 โฟลเดอร์: ${activeDirHandle.name}\n📊 CSV: ${result.total_records} รายการ\n🖼️ รูปภาพ: ${imgCount} ไฟล์`);
    } catch (e: any) {
      console.error('Export error:', e);
      alert('❌ เกิดข้อผิดพลาดในการส่งออก: ' + e.message);
    }
  };

  // Interactive Copywriting Rewrite using AI Teacher Feedback Loop
  const handleRewriteCopywritingWithFeedback = async (feedbackText: string) => {
    if (!canvasSelectedItem) return;
    if (!feedbackText.trim()) return alert("⚠️ กรุณากรอกคำแนะนำก่อนสั่งเกลาครับ");
    
    setGeneratingCopywriting(true);
    try {
      const openRouterKey = localStorage.getItem('openrouter_key')?.trim() || '';
      const response = await fetch(`${API_BASE}/vault/contents/${canvasSelectedItem.id}/generate-copywriting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          feedback: feedbackText,
          length: canvasArticleLength,
          font_scale: canvasFontScale,
          openrouter_key: openRouterKey
        })
      });
      const resData = await response.json();
      if (resData.success) {
        const updatedItem = {
          ...canvasSelectedItem,
          metadata: {
            ...canvasSelectedItem.metadata,
            copywriting: resData.data
          }
        };
        setCanvasSelectedItem(updatedItem);
        setCanvasImportedItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        setCanvasAllItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
        fetchVaultData();
        fetchApprovedItems();
        alert("✨ ปรับแก้ไขตามคำติชมเรียบร้อยแล้ว!");
      } else {
        alert("⚠️ " + (resData.error || "เกิดข้อผิดพลาดในการปรับแก้บทความ"));
      }
    } catch (err) {
      console.error("Copywriting feedback rewrite error:", err);
      alert("⚠️ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setGeneratingCopywriting(false);
    }
  };

  const fetchSavedLogos = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/logos`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedLogos(data);
      }
    } catch (err) {
      console.error('Failed to load saved logos:', err);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch(`${API_BASE}/vault/logos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 })
        });
        const data = await res.json();
        if (data.success) {
          setCanvasLogoUrl(data.url);
          fetchSavedLogos();
          if (rememberLogo) {
            localStorage.setItem('canvas_logo_url', data.url);
          }
        }
      } catch (err) {
        console.error('Failed to upload logo:', err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteLogo = async (filename: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ว่าต้องการลบโลโก้นี้ออกจากคลัง?')) return;
    try {
      const res = await fetch(`${API_BASE}/vault/logos/${encodeURIComponent(filename)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        fetchSavedLogos();
        if (canvasLogoUrl.includes(filename)) {
          setCanvasLogoUrl('');
          localStorage.removeItem('canvas_logo_url');
        }
      }
    } catch (err) {
      console.error('Failed to delete logo:', err);
    }
  };

  const handleToggleRememberLogo = (checked: boolean) => {
    setRememberLogo(checked);
    localStorage.setItem('canvas_remember_logo', String(checked));
    if (checked) {
      localStorage.setItem('canvas_logo_url', canvasLogoUrl);
      localStorage.setItem('canvas_logo_size', String(canvasLogoSize));
      localStorage.setItem('canvas_logo_margin_x', String(canvasLogoMarginX));
      localStorage.setItem('canvas_logo_margin_y', String(canvasLogoMarginY));
      localStorage.setItem('canvas_show_page_logo', String(canvasShowPageLogo));
    } else {
      localStorage.removeItem('canvas_logo_url');
      localStorage.removeItem('canvas_logo_size');
      localStorage.removeItem('canvas_logo_margin_x');
      localStorage.removeItem('canvas_logo_margin_y');
      localStorage.removeItem('canvas_show_page_logo');
    }
  };

  const appendCustomParams = (q: URLSearchParams) => {
    q.append('show_logo', String(canvasShowPageLogo));
    if (canvasLogoUrl) {
      const urlParams = new URLSearchParams(canvasLogoUrl.split('?')[1]);
      const logoPathVal = urlParams.get('path');
      if (logoPathVal) {
        q.append('page_logo_path', logoPathVal);
      }
    }
    q.append('page_logo_size', String(canvasLogoSize));
    q.append('page_logo_margin_x', String(canvasLogoMarginX));
    q.append('page_logo_margin_y', String(canvasLogoMarginY));
    q.append('page_logo_corner', canvasLogoCorner);

    // Category badge
    q.append('show_badge', String(canvasShowBadge));
    q.append('badge_style', canvasBadgeStyle);
    q.append('badge_text', canvasBadgeText);
    q.append('badge_subtext', canvasBadgeSubtext);

    // News card
    q.append('show_news_card', String(canvasShowNewsCard));
    q.append('news_title', canvasNewsTitle);
    q.append('news_detail', canvasNewsDetail);
    q.append('news_source', canvasNewsSource);

    // Callout
    q.append('show_callout', String(canvasShowCallout));
    q.append('callout_text', canvasCalloutText);
    q.append('callout_highlight', canvasCalloutHighlight);
    q.append('callout_placement', canvasCalloutPlacement);
    q.append('callout_sticker', canvasCalloutSticker);

    // Meme
    q.append('show_meme', String(canvasShowMeme));
    q.append('meme_text', canvasMemeText);
    q.append('meme_subtext', canvasMemeSubtext);

    // Other properties
    q.append('credit_text', canvasCreditText);
    q.append('font_scale', String(canvasFontScale));
    q.append('image_split', String(canvasImageSplit));
    q.append('font-family', canvasFontFamily);
    q.append('headline_align', canvasHeadlineAlign);
    q.append('headline_margin', String(canvasHeadlineMargin));
    q.append('highlight_color_set', canvasHighlightColorSet);
    q.append('highlight_padding_x', String(canvasHighlightPaddingX));
    q.append('highlight_padding_y', String(canvasHighlightPaddingY));
  };

  // Auto scroll terminal logs
  const scrollTerminal = (module: 'canvas') => {
    setTimeout(() => {
      terminalBottoms[module].current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  };

  // SSE Process Runner Engine
  const runModule = (module: 'canvas', queryParams: string) => {
    // Terminate existing SSE
    if (sseConnections.current[module]) {
      sseConnections.current[module]?.close();
    }

    setLogs(prev => ({
      ...prev,
      [module]: [`[SYSTEM] Starting spawned child process for '${module}'...`]
    }));
    setRunningModule(prev => ({ ...prev, [module]: true }));

    const url = `${API_BASE}/orchestrator/run/${module}?${queryParams}`;
    const source = new EventSource(url);
    sseConnections.current[module] = source;

    source.onmessage = (event) => {
      setLogs(prev => ({
        ...prev,
        [module]: [...prev[module], event.data]
      }));
      scrollTerminal(module);

      // Check if process finished
      if (event.data.includes('Exit Code:')) {
        source.close();
        setRunningModule(prev => ({ ...prev, [module]: false }));

        const isSuccess = event.data.includes('Exit Code: 0');
        const parsedParams = new URLSearchParams(queryParams);
        const contentId = parsedParams.get('content_id');
        
        if (module === 'canvas') {
          if (isSuccess && contentId) {
            // Fetch the newly rendered graphic and append to session
            fetchNewestGraphic(contentId).then(newG => {
              if (newG) {
                setContentGraphics(prev => {
                  const updated = [...prev, newG];
                  setGraphicIndex(updated.length - 1);
                  setLatestGraphic(newG);
                  return updated;
                });
              }
            });
          }

          // If queue is active, run next item!
          if (queueIndexRef.current !== null) {
            const nextIdx = queueIndexRef.current + 1;
            setCanvasQueueIndex(nextIdx);
          } else {
            setPreviewTab('pillow');
          }
        } else if (canvasSelectedItem) {
          fetchGraphicsForContent(canvasSelectedItem.id);
          setPreviewTab('pillow');
        }
      }
    };

    source.onerror = (err) => {
      console.error(`SSE stream error on ${module}:`, err);
      setLogs(prev => ({
        ...prev,
        [module]: [...prev[module], '[ERROR] การเชื่อมต่อเซิร์ฟเวอร์ขัดข้อง หรือโปรเซสหยุดทำงานกะทันหัน']
      }));
      source.close();
      setRunningModule(prev => ({ ...prev, [module]: false }));
    };
  };

  // Disconnect active processes on unmount
  useEffect(() => {
    return () => {
      Object.keys(sseConnections.current).forEach(key => {
        if (sseConnections.current[key]) {
          sseConnections.current[key]?.close();
        }
      });
    };
  }, []);

  // Fetch Vault list
  const fetchVaultData = async () => {
    setLoadingItems(true);
    try {
      const q = new URLSearchParams();
      if (filterSource !== 'all') q.append('source_type', filterSource);
      if (filterStatus !== 'all') q.append('status', filterStatus);
      if (filterKeyword) q.append('keyword', filterKeyword);
      if (filterMinRating > 0) q.append('min_rating', filterMinRating.toString());
      q.append('sort_by', sortBy);

      const res = await fetch(`${API_BASE}/vault/contents?${q.toString()}`);
      const data = await res.json();
      if (data.success) {
        setVaultItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load content vault:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  // Selection toggles
  const toggleVaultItemSelection = (id: string) => {
    setVaultSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAllVaultItems = () => {
    if (vaultSelectedIds.length === vaultItems.length && vaultItems.length > 0) {
      setVaultSelectedIds([]);
    } else {
      setVaultSelectedIds(vaultItems.map(item => item.id));
    }
  };

  // Client-side Vault CSV Exporter
  const handleExportVaultCSV = () => {
    const itemsToExport = vaultSelectedIds.length > 0 
      ? vaultItems.filter(item => vaultSelectedIds.includes(item.id))
      : vaultItems;

    if (itemsToExport.length === 0) {
      alert('ไม่พบข้อมูลสำหรับดาวน์โหลด CSV');
      return;
    }

    const csvHeaders = [
      'ลำดับ',
      'แหล่งที่มา',
      'ชื่อเพจ/ผู้เขียน/เจ้าของ',
      'หัวข้อคอนเทนต์',
      'ลิงก์โพสต์',
      'เนื้อหาดิบ/สคริปต์/คำบรรยาย',
      'ยอดไลก์/ดาว',
      'ยอดแชร์/ฟอร์ก',
      'ยอดคอมเมนต์',
      'ยอดวิว',
      'ผู้ติดตาม/ดาว',
      'คะแนนข่าว',
      'คะแนน Evergreen',
      'หัวข้อพาดหัว AI',
      'คีย์เวิร์ด/แท็ก',
      'สถานะ',
      'วันที่บันทึกข้อมูล'
    ];

    const escape = (val: any) => {
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    };

    const csvRows = itemsToExport.map((item, index) => {
      const meta = item.metadata || {};
      
      let likes = 0;
      let shares = 0;
      let comments = 0;
      let views = 0;
      let followers = item.author_followers || 0;
      let keywords = '';

      if (item.source_type === 'radar') {
        likes = meta.likes || 0;
        shares = meta.shares || 0;
        comments = meta.comments || 0;
        views = meta.views || 0;
      } else if (item.source_type === 'youtube') {
        views = meta.views || 0;
        likes = meta.likes || 0;
        comments = meta.comments || 0;
      } else if (item.source_type === 'github') {
        likes = meta.stars || item.author_followers || 0;
        shares = meta.forks || 0;
      }

      if (meta.keywords) {
        keywords = Array.isArray(meta.keywords) ? meta.keywords.join(';') : String(meta.keywords);
      } else if (meta.tags) {
        keywords = Array.isArray(meta.tags) ? meta.tags.join(';') : String(meta.tags);
      }

      return [
        index + 1,
        escape(item.source_type),
        escape(item.author_name || ''),
        escape(item.title),
        escape(item.source_url),
        escape(item.raw_content || ''),
        likes,
        shares,
        comments,
        views,
        followers,
        item.rating_news,
        item.rating_evergreen,
        escape(item.selected_headline || ''),
        escape(keywords),
        escape(item.status),
        escape(item.created_at)
      ].join(',');
    });

    const csvContent = '\uFEFF' + csvHeaders.join(',') + '\n' + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    
    let sourceName = filterSource === 'all' ? 'all_sources' : filterSource;
    a.download = `vault_export_${sourceName}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Batch operations
  const handleBatchApprove = async () => {
    if (vaultSelectedIds.length === 0) return;
    try {
      const selectedIdsToApprove = [...vaultSelectedIds];
      const res = await fetch(`${API_BASE}/vault/contents/batch-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIdsToApprove, status: 'ready_for_design' })
      });
      const data = await res.json();
      if (data.success) {
        setVaultSelectedIds([]);
        fetchVaultData();
        
        // Fetch approved items, then set newly selected item and navigate to Canvas tab
        const approvedRes = await fetch(`${API_BASE}/vault/contents?status=ready_for_design`);
        const approvedData = await approvedRes.json();
        if (approvedData.success && approvedData.data && approvedData.data.length > 0) {
          setApprovedItems(approvedData.data);
          
          // Import newly approved items into canvasImportedItems
          const newlyApproved = approvedData.data.filter((i: any) => selectedIdsToApprove.includes(i.id));
          setCanvasImportedItems(prev => {
            const unique = [...prev];
            newlyApproved.forEach((item: any) => {
              if (!unique.some(x => x.id === item.id)) unique.push(item);
            });
            return unique;
          });

          // Check newly approved items in canvasSelectedIds
          setCanvasSelectedIds(prev => {
            const unique = [...prev];
            selectedIdsToApprove.forEach(id => {
              if (!unique.includes(id)) unique.push(id);
            });
            return unique;
          });

          const firstApprovedId = selectedIdsToApprove[0];
          const newlySelected = approvedData.data.find((i: any) => i.id === firstApprovedId) || approvedData.data[0];
          setCanvasSelectedItem(newlySelected);
        }
        
        setActiveTab('canvas');
      }
    } catch (err) {
      console.error('Batch approve failed:', err);
    }
  };

  // Single Item Import to Canvas Workspace
  const handleSingleImport = async (item: VaultContent) => {
    if (item.status === 'scraped') {
      try {
        await fetch(`${API_BASE}/vault/contents/batch-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: [item.id], status: 'ready_for_design' })
        });
        fetchVaultData();
        fetchApprovedItems();
      } catch (err) {
        console.error('Failed to update status on single import:', err);
      }
    }

    setCanvasImportedItems(prev => {
      if (prev.some(x => x.id === item.id)) return prev;
      return [...prev, item];
    });

    setCanvasSelectedIds(prev => {
      if (prev.includes(item.id)) return prev;
      return [...prev, item.id];
    });

    setCanvasSelectedItem(item);
    setActiveTab('canvas');
  };

  const handleBatchDelete = async () => {
    if (vaultSelectedIds.length === 0) return;
    if (!confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบไอเดียที่เลือกจำนวน ${vaultSelectedIds.length} รายการออกจากระบบ?`)) return;
    try {
      const res = await fetch(`${API_BASE}/vault/contents/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: vaultSelectedIds })
      });
      const data = await res.json();
      if (data.success) {
        setVaultSelectedIds([]);
        fetchVaultData();
        fetchApprovedItems();
      }
    } catch (err) {
      console.error('Batch delete failed:', err);
    }
  };

  // Synchronize queue index and ids state to refs to prevent stale closure in SSE streams
  useEffect(() => {
    queueIndexRef.current = canvasQueueIndex;
  }, [canvasQueueIndex]);

  useEffect(() => {
    queueIdsRef.current = canvasQueueIds;
  }, [canvasQueueIds]);

  const runNextQueueItem = async (idx: number, ids: string[]) => {
    if (idx >= ids.length) {
      // Completed all items!
      setCanvasQueueIndex(null);
      setCanvasQueueIds([]);
      // Reload lists
      fetchVaultData();
      fetchApprovedItems();
      // Keep the newly populated batch session graphics active in contentGraphics, do not overwrite them!
      return;
    }

    const currentId = ids[idx];
    const item = (canvasShowAll ? canvasAllItems : canvasImportedItems).find(i => i.id === currentId);
    if (!item) {
      // Skip if not found
      setCanvasQueueIndex(idx + 1);
      return;
    }

    // Set as selected item to show active logs and preview
    setCanvasSelectedItem(item);

    const q = new URLSearchParams();
    q.append('content_id', item.id);
    q.append('ratio', canvasRatio);
    q.append('theme', canvasTheme);
    q.append('layout', canvasLayout);
    // Use manually typed headline if it is the currently selected active item, otherwise use item headline/title
    let activeHeadline = '';
    if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
      if (canvasHeadlineMode === 'triple') {
        activeHeadline = [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n');
      } else {
        activeHeadline = canvasHeadline;
      }
    } else {
      const h3 = item.metadata?.copywriting?.headline_3line;
      if (Array.isArray(h3) && h3.filter(Boolean).length > 0) {
        activeHeadline = h3.filter(Boolean).join('\n');
      } else {
        activeHeadline = item.selected_headline || item.title;
      }
    }
    q.append('headline', activeHeadline);
    
    // Background image source logic
    let resolvedBgImage = '';
    if (canvasBgImage && item.media_paths && item.media_paths.includes(canvasBgImage)) {
      resolvedBgImage = canvasBgImage;
    } else if (item.media_paths && item.media_paths.length > 0) {
      resolvedBgImage = item.media_paths[0];
    }

    if (canvasBgSource === 'stock' && stockFolder) {
      try {
        const stockRes = await fetch(`${API_BASE}/vault/stock-random?folder=${encodeURIComponent(stockFolder)}`);
        const stockData = await stockRes.json();
        if (stockData.success && stockData.absolute_path) {
          q.append('base_image', stockData.absolute_path);
        } else {
          if (resolvedBgImage) q.append('base_image', resolvedBgImage);
        }
      } catch {
        if (resolvedBgImage) q.append('base_image', resolvedBgImage);
      }
    } else {
      if (resolvedBgImage) {
        q.append('base_image', resolvedBgImage);
      }
    }

    // Keyword Highlight
    let activeHighlight = '';
    if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
      activeHighlight = canvasHighlight;
    } else {
      activeHighlight = item.metadata?.copywriting?.highlight || '';
    }

    if (activeHighlight) {
      q.append('keywords', activeHighlight);
    } else {
      // Fetch fallback keywords from metadata
      let keywords: string[] = [];
      if (item.metadata) {
        const meta = item.metadata;
        keywords = meta.keywords || meta.tags || [];
      }
      if (keywords.length > 0) {
        q.append('keywords', keywords.join(','));
      }
    }

    // Append custom branding & overlays parameters
    appendCustomParams(q);

    // Call runModule
    runModule('canvas', q.toString());
  };

  useEffect(() => {
    if (canvasQueueIndex !== null) {
      runNextQueueItem(canvasQueueIndex, canvasQueueIds);
    }
  }, [canvasQueueIndex, canvasQueueIds]);

  // Fetch only approved items for Canvas tab
  const fetchApprovedItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents?status=ready_for_design`);
      const data = await res.json();
      if (data.success) {
        setApprovedItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load approved content:', err);
    }
  };

  // Fetch all items (raw scraped & approved) in SQLite for Canvas
  const fetchAllCanvasItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents`);
      const data = await res.json();
      if (data.success) {
        setCanvasAllItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load all canvas items:', err);
    }
  };

  // Fetch graphics for a specific content item
  const fetchGraphicsForContent = async (id: string) => {
    setLoadingGraphics(true);
    try {
      const res = await fetch(`${API_BASE}/vault/contents/${id}/graphics`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setContentGraphics(data.data);
        setGraphicIndex(0);
        setLatestGraphic(data.data[0]);
      } else {
        setContentGraphics([]);
        setGraphicIndex(0);
        setLatestGraphic(null);
      }
    } catch (err) {
      console.error('Failed to load graphics for content:', err);
      setContentGraphics([]);
      setGraphicIndex(0);
      setLatestGraphic(null);
    } finally {
      setLoadingGraphics(false);
    }
  };

  // Fetch only the single newest graphic for an item
  const fetchNewestGraphic = async (id: string): Promise<GraphicItem | null> => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents/${id}/graphics`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        return data.data[0];
      }
    } catch (err) {
      console.error('Failed to fetch newest graphic:', err);
    }
    return null;
  };



  // Initial load
  useEffect(() => {
    fetchVaultData();
    fetchApprovedItems();
    fetchSavedLogos();

    // Load remembered logo variables if rememberLogo was active
    const savedRemember = localStorage.getItem('canvas_remember_logo');
    if (savedRemember === 'true') {
      setRememberLogo(true);
      const savedLogoUrl = localStorage.getItem('canvas_logo_url');
      if (savedLogoUrl) setCanvasLogoUrl(savedLogoUrl);
      const savedLogoSize = localStorage.getItem('canvas_logo_size');
      if (savedLogoSize) setCanvasLogoSize(Number(savedLogoSize));
      const savedLogoMarginX = localStorage.getItem('canvas_logo_margin_x');
      if (savedLogoMarginX) setCanvasLogoMarginX(Number(savedLogoMarginX));
      const savedLogoMarginY = localStorage.getItem('canvas_logo_margin_y');
      if (savedLogoMarginY) setCanvasLogoMarginY(Number(savedLogoMarginY));
      const savedShowLogo = localStorage.getItem('canvas_show_page_logo');
      if (savedShowLogo) setCanvasShowPageLogo(savedShowLogo === 'true');
    }
  }, [filterSource, filterStatus, filterMinRating, sortBy]);

  // Save manually updated copywriting metadata to SQLite
  const handleSaveManuallyUpdatedMetadata = async (itemId: string, updatedCopywriting: any) => {
    try {
      const item = (canvasShowAll ? canvasAllItems : canvasImportedItems).find(i => i.id === itemId);
      if (!item) return;

      const updatedMetadata = {
        ...(item.metadata || {}),
        copywriting: updatedCopywriting
      };

      const res = await fetch(`${API_BASE}/vault/contents/${itemId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updateList = (list: VaultContent[]) => list.map(i => i.id === itemId ? { ...i, metadata: updatedMetadata } : i);
        setCanvasImportedItems(updateList);
        setCanvasAllItems(updateList);
        
        // Update selected item in local state too
        if (canvasSelectedItem && canvasSelectedItem.id === itemId) {
          setCanvasSelectedItem({ ...canvasSelectedItem, metadata: updatedMetadata });
        }
        
        alert('💾 บันทึกการแก้ไขคำโฆษณาและพาดหัวเรียบร้อยแล้ว!');
      } else {
        alert(`❌ ไม่สามารถบันทึกได้: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`❌ ข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${e.message}`);
    }
  };

  // Automatically select background images with faces for all ready_for_design items
  const handleAutoSelectBgImages = async () => {
    setIsAutoSelectingBg(true);
    try {
      const res = await fetch(`${API_BASE}/vault/contents/auto-select-bg-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        // Update local lists
        const updateList = (prev: VaultContent[]) => prev.map(item => {
          const found = data.data.find((x: any) => x.id === item.id);
          return found ? { ...item, metadata: found.metadata } : item;
        });

        setCanvasImportedItems(updateList);
        setCanvasAllItems(updateList);

        if (canvasSelectedItem) {
          const found = data.data.find((x: any) => x.id === canvasSelectedItem.id);
          if (found) {
            setCanvasSelectedItem({ ...canvasSelectedItem, metadata: found.metadata });
            const savedBg = found.metadata?.copywriting?.selected_bg_image;
            if (savedBg) {
              setCanvasBgImage(savedBg);
            }
          }
        }

        await fetchApprovedItems();
        alert(`🖼️ เลือกรูปพื้นหลังอัตโนมัติสำเร็จแล้ว! (${data.count} รายการ)`);
      } else {
        alert(`❌ ไม่สามารถเลือกรูปอัตโนมัติได้: ${data.error || 'เกิดข้อผิดพลาดในการวิเคราะห์'}`);
      }
    } catch (error: any) {
      alert(`❌ ข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${error.message}`);
    } finally {
      setIsAutoSelectingBg(false);
    }
  };

  // Upload generated images to Dropbox and export metadata CSV with logs
  const handleUploadAndExportCSV = async () => {
    if (!dropboxToken) {
      alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
      return;
    }
    if (contentGraphics.length === 0) return;
    
    const addLog = (msg: string) => {
      setLogs(prev => ({
        ...prev,
        canvas: [...prev.canvas, msg]
      }));
      scrollTerminal('canvas');
    };

    setIsUploadingDropbox(true);
    setShowCanvasLogs(true);
    setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
    
    addLog('[PROCESS] ☁️ เริ่มกระบวนการอัพโหลดไฟล์ไปยัง Dropbox และส่งออกไฟล์ CSV...');
    try {
      const filePaths = contentGraphics.map((g: any) => g.file_path);
      setDropboxUploadProgress(`อัพโหลด ${filePaths.length} ไฟล์ไปยัง Dropbox...`);
      addLog(`[PROCESS] 📦 เตรียมไฟล์สำหรับอัพโหลดจำนวน ${filePaths.length} รายการ...`);
      addLog('[PROCESS] ☁️ กำลังเชื่อมต่อ API และส่งไฟล์ขึ้นระบบคลาวด์ของ Dropbox...');
      
      const res = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_paths: filePaths,
          dropbox_token: dropboxToken,
          dropbox_folder: dropboxFolder,
        }),
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      addLog('[SUCCESS] ✅ อัพโหลดรูปภาพขึ้น Dropbox เสร็จสมบูรณ์!');
      addLog('[PROCESS] 📑 กำลังสร้างข้อมูลและแมปรายละเอียดโพสต์สำหรับไฟล์ CSV...');

      // Check for specific upload errors inside results
      const failedCount = data.results.filter((r: any) => r.error).length;
      if (failedCount > 0) {
        const firstError = data.results.find((r: any) => r.error)?.error || 'Unknown error';
        addLog(`[WARN] ⚠️ การอัพโหลดบางไฟล์ล้มเหลว (${failedCount}/${data.results.length} ไฟล์): ${firstError}`);
        if (failedCount === data.results.length) {
          throw new Error(firstError);
        } else {
          alert(`การอัพโหลดบางส่วนล้มเหลว (${failedCount}/${data.results.length} ไฟล์): ${firstError}`);
        }
      }
      
      setDropboxUploadProgress('สร้างไฟล์ CSV...');
      
      // Build CSV content
      const csvRows = [['พาดหัว', 'บทความโพส', 'Dropbox Link'].join(',')];
      
      // Only export successful ones in CSV
      const successfulResults = data.results.filter((r: any) => !r.error);
      for (const result of successfulResults) {
        // Find the corresponding graphic from contentGraphics to get the correct content_id
        const matchingGraphic = contentGraphics.find((g: any) => g.file_path === result.file_path);
        
        let headline = '';
        let caption = '';
        
        if (matchingGraphic) {
          const itemId = matchingGraphic.content_id;
          const item = canvasAllItems.find(i => i.id === itemId) || canvasImportedItems.find(i => i.id === itemId);
          if (item) {
            const copywriting = item.metadata?.copywriting;
            headline = copywriting?.headline_3line?.join(' ') || item.selected_headline || item.title || '';
            caption = copywriting?.caption || '';
          }
        }
        
        // Fallback to currently selected item if not found
        if (!headline) {
          const copywriting = canvasSelectedItem?.metadata?.copywriting;
          headline = copywriting?.headline_3line?.join(' ') || canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || '';
          caption = copywriting?.caption || '';
        }
        
        addLog(` - [แมปข้อมูลสำเร็จ] ไฟล์: ${result.file_path.split('/').pop()} -> หัวข้อ: ${headline.substring(0, 40)}...`);

        const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
        csvRows.push([
          escapeCsv(headline),
          escapeCsv(caption),
          escapeCsv(result.shared_link || ''),
        ].join(','));
      }
      
      const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Thai encoding
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      addLog('[SUCCESS] 💾 สร้างและดาวน์โหลดไฟล์ CSV ลงเครื่องเรียบร้อยแล้ว!');
      addLog('[SYSTEM] 🎉 เสร็จสิ้นกระบวนการทำงาน Dropbox + CSV Export สำเร็จทุกขั้นตอน');

      setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
      setTimeout(() => setDropboxUploadProgress(''), 5000);
    } catch (err: any) {
      console.error('Dropbox upload error:', err);
      const errMsg = err.message || '';
      let friendlyMsg = errMsg;
      if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
        friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
      }
      addLog(`[ERROR] ❌ เกิดข้อผิดพลาดในกระบวนการทำงาน: ${friendlyMsg}`);
      setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
      setTimeout(() => setDropboxUploadProgress(''), 10000);
    }
    setIsUploadingDropbox(false);
  };

  // Select and persist canvas background image selection silently to SQLite
  const handleSelectCanvasBgImage = async (item: VaultContent, path: string) => {
    setCanvasBgImage(path);

    const finalCopywriting = {
      ...(item.metadata?.copywriting || {}),
      selected_bg_image: path
    };

    const updatedMetadata = {
      ...(item.metadata || {}),
      copywriting: finalCopywriting
    };

    const updateList = (list: VaultContent[]) => list.map(i => i.id === item.id ? { ...i, metadata: updatedMetadata } : i);
    setCanvasImportedItems(updateList);
    setCanvasAllItems(updateList);
    if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
      setCanvasSelectedItem({ ...canvasSelectedItem, metadata: updatedMetadata });
    }

    try {
      await fetch(`${API_BASE}/vault/contents/${item.id}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metadata: updatedMetadata })
      });
    } catch (e) {
      console.error('Failed to auto-save selected canvas background image:', e);
    }
  };

  // Load canvas selection details
  useEffect(() => {
    if (canvasSelectedItem) {
      setCanvasHeadline(canvasSelectedItem.selected_headline || canvasSelectedItem.title);
      setCanvasCaption(canvasSelectedItem.metadata?.copywriting?.caption || '');
      const l3 = canvasSelectedItem.metadata?.copywriting?.headline_3line || [];
      setCanvasHeadlineLine1(l3[0] || '');
      setCanvasHeadlineLine2(l3[1] || '');
      setCanvasHeadlineLine3(l3[2] || '');
      setCanvasHighlight(canvasSelectedItem.metadata?.copywriting?.highlight || '');
      // Automatically default to triple headline mode
      setCanvasHeadlineMode('triple');
      // Load saved bg image if available, else fall back to first keyframe
      const savedBg = canvasSelectedItem.metadata?.copywriting?.selected_bg_image;
      if (savedBg && canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.includes(savedBg)) {
        setCanvasBgImage(savedBg);
      } else if (canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.length > 0) {
        setCanvasBgImage(canvasSelectedItem.media_paths[0]);
      } else {
        setCanvasBgImage('');
      }
      // ONLY fetch graphics manually or during rendering sessions, do not auto-fetch history to maintain clean session renders!
    } else {
      setCanvasHeadline('');
      setCanvasCaption('');
      setCanvasHeadlineLine1('');
      setCanvasHeadlineLine2('');
      setCanvasHeadlineLine3('');
      setCanvasHighlight('');
      setCanvasBgImage('');
      setContentGraphics([]);
      setGraphicIndex(0);
      setLatestGraphic(null);
    }
  }, [canvasSelectedItem]);

  // Filter canvas items by search query and showAll toggle
  const canvasSearchFiltered = canvasImportedItems.filter(item => 
    item.title.toLowerCase().includes(canvasSearchQuery.toLowerCase()) ||
    (item.selected_headline || '').toLowerCase().includes(canvasSearchQuery.toLowerCase())
  );

  const renderHeadlineWithHighlights = (text: string, keywordsStr: string) => {
    if (!text) return null;
    const lines = text.split('\n');

    // Parse the 5 premium color sets matching Pillow
    const previewColorSets: Record<string, Array<{ box: string; text: string }>> = {
      classic: [
        { box: '#EF4444', text: '#FFFFFF' }, // Red
        { box: '#F59E0B', text: '#000000' }, // Yellow
        { box: '#3B82F6', text: '#FFFFFF' }  // Blue
      ],
      cyber: [
        { box: '#EC4899', text: '#FFFFFF' }, // Pink
        { box: '#8B5CF6', text: '#FFFFFF' }, // Purple
        { box: '#06B6D4', text: '#000000' }  // Cyan
      ],
      gold: [
        { box: '#B45309', text: '#FFFFFF' }, // Dark Gold
        { box: '#F59E0B', text: '#000000' }, // Amber
        { box: '#FBBF24', text: '#000000' }  // Light Gold
      ],
      forest: [
        { box: '#10B981', text: '#FFFFFF' }, // Emerald
        { box: '#84CC16', text: '#000000' }, // Lime
        { box: '#14B8A6', text: '#FFFFFF' }  // Teal
      ],
      sunset: [
        { box: '#F97316', text: '#FFFFFF' }, // Orange
        { box: '#F43F5E', text: '#FFFFFF' }, // Rose
        { box: '#F59E0B', text: '#000000' }  // Amber
      ]
    };

    const activeTheme = previewColorSets[canvasHighlightColorSet] || previewColorSets.classic;

    return lines.map((line, lineIdx) => {
      let content;
      if (!keywordsStr) {
        content = <span className="text-white">{line}</span>;
      } else {
        // Split keywords by comma or space
        const keywords = keywordsStr
          .split(',')
          .map(k => k.trim())
          .filter(Boolean);

        if (keywords.length === 0) {
          content = <span className="text-white">{line}</span>;
        } else {
          // Sort keywords by length descending so that longer phrases are matched first
          const sortedKeywords = [...keywords].sort((a, b) => b.length - a.length);
          const escapedKeywords = sortedKeywords.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const regex = new RegExp(`(${escapedKeywords.join('|')})`, 'gi');
          
          const parts = line.split(regex);
          const colorConfig = activeTheme[lineIdx % activeTheme.length];

          content = parts.map((part, idx) => {
            const isMatch = keywords.some(
              kw => part.toLowerCase() === kw.toLowerCase()
            );
            if (isMatch) {
              return (
                <span 
                  key={idx} 
                  className="live-highlight-box"
                  style={{
                    backgroundColor: colorConfig.box,
                    color: colorConfig.text,
                    padding: `${canvasHighlightPaddingY * 0.556}cqw ${canvasHighlightPaddingX * 1.364}cqw`
                  }}
                >
                  {part}
                </span>
              );
            }
            return <span key={idx} className="text-white">{part}</span>;
          });
        }
      }
      return (
        <span key={lineIdx} style={{ display: 'block', minHeight: line.trim() ? 'auto' : '1.2em' }}>
          {content}
        </span>
      );
    });
  };

  const activeLightboxItem = lightboxItem || canvasSelectedItem;

  return (
    <div className="app-container">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-4 h-4 text-slate-900" />
          </div>
          <span className="sidebar-logo-text font-bold">CONTENT V2</span>
        </div>
        
        <nav className="sidebar-menu">
          <button 
            className={`sidebar-btn ${activeTab === 'discovery' ? 'active' : ''}`}
            onClick={() => setActiveTab('discovery')}
          >
            <Compass className="w-5 h-5" />
            <span>หมวดค้นหา (Discovery)</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'vault' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('vault');
              fetchVaultData();
            }}
          >
            <Database className="w-5 h-5" />
            <span>คลังวัตถุดิบ (Vault)</span>
          </button>
          
          <button 
            className={`sidebar-btn ${activeTab === 'canvas' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('canvas');
              fetchApprovedItems();
            }}
          >
            <ImageIcon className="w-5 h-5" />
            <span>สตูดิโอสร้างโพสรูป (Canvas)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'prompt-generator' ? 'active' : ''}`}
            onClick={() => setActiveTab('prompt-generator')}
          >
            <Sparkles className="w-5 h-5" />
            <span>สร้าง Prompt (Prompt Gen)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'vertical-video' ? 'active' : ''}`}
            onClick={() => setActiveTab('vertical-video')}
          >
            <Play className="w-5 h-5" />
            <span>วิดีโอแนวตั้ง (Video Suite)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'quote-video' ? 'active' : ''}`}
            onClick={() => setActiveTab('quote-video')}
          >
            <Quote className="w-5 h-5" />
            <span>ทำคลิปคำคม (Quote Video)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'avatar-video' ? 'active' : ''}`}
            onClick={() => setActiveTab('avatar-video')}
          >
            <User className="w-5 h-5" />
            <span>🧑‍💼 Avatar แนวตั้ง (Avatar Clip)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'podcast-clip' ? 'active' : ''}`}
            onClick={() => setActiveTab('podcast-clip')}
          >
            <Mic className="w-5 h-5" />
            <span>🎙️ สร้างคลิปpodcast (Podcast Clip)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'dropbox-csv' ? 'active' : ''}`}
            onClick={() => setActiveTab('dropbox-csv')}
          >
            <FolderOpen className="w-5 h-5" />
            <span>☁️ Dropbox/CSV (บอท Flow)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'tracking' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracking')}
          >
            <Activity className="w-5 h-5" />
            <span>📊 ติดตามงาน (Work Tracking)</span>
          </button>

          <button 
            className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Sliders className="w-5 h-5" />
            <span>⚙️ ตั้งค่าระบบ (Settings)</span>
          </button>
        </nav>
  
          <div className="p-4 m-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></div>
              <span className="text-xs font-semibold text-emerald-400">SERVER ONLINE</span>
            </div>
            <p className="text-[11px] text-slate-500">Express Backend running at port 5005. Safe SQLite Pool DB active.</p>
          </div>
        </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="header-bar">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              {activeTab === 'discovery' && '🧭 Discovery Portal | ระบบดักจับไอเดียข้ามโซเชียล'}
              {activeTab === 'vault' && '📂 Vault Manager | คลังวิเคราะห์คะแนนคุณภาพคอนเทนต์'}
              {activeTab === 'canvas' && '🎨 Graphic Canvas | ห้องทำโพสรูปด้วย Pillow'}
              {activeTab === 'prompt-generator' && '✨ Prompt Generation | ระบบคลังคำสั่งสร้างรูปและโพส'}
              {activeTab === 'vertical-video' && '🎬 Automated Vertical Video Suite | ระบบสร้างวิดีโอแนวตั้งอัจฉริยะ'}
              {activeTab === 'quote-video' && '🎨 ทำคลิปคำคม | ระบบสร้างวิดีโอคำคมแนวตั้ง 9:16'}
              {activeTab === 'avatar-video' && '🧑‍💼 Avatar Vertical Clip Maker | ห้องตัดต่อวิดีโออวาตาร์แนวตั้ง'}
              {activeTab === 'podcast-clip' && '🎙️ สร้างคลิปpodcast | ระบบตัดต่อ B-Roll ซ้อนเสียงพากย์อัตโนมัติ'}
              {activeTab === 'dropbox-csv' && '☁️ Dropbox/CSV | Workflow Automator (บอท Flow)'}
              {activeTab === 'tracking' && '📊 Work Tracking System | ระบบติดตามงานและจัดการ Stock จาก Google Sheets'}
              {activeTab === 'settings' && '⚙️ ตั้งค่าระบบ | แผงควบคุมกุญแจและขนาดการแสดงผล'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'discovery' && 'สแกน Facebook เพจคู่แข่ง, ข่าวสาร RSS, วิดีโอ YouTube และ GitHub Trends สตรีม Log สดแยกโปรเซส'}
              {activeTab === 'vault' && 'กรอง คัดเลือก และอนุมัติไอเดียไวรัลที่ผ่านเกณฑ์ AI คะแนนคุณภาพ ให้เข้าสู่ขั้นตอนการสร้างภาพโพสต์'}
              {activeTab === 'canvas' && 'เลือกไอเดียผ่านการอนุมัติ แปลหัวข้อข่าวภาษาไทย จัดวางคีย์เวิร์ดเด่น เลือก aspect ratio และสั่งบอท Pillow เรนเดอร์ภาพโพสรูป'}
              {activeTab === 'prompt-generator' && 'สร้างรูปด้วย API, แคปชั่น Clickbait, CSV Post Generator และคลัง Prompt สำเร็จรูป 1:1 จากต้นฉบับ'}
              {activeTab === 'vertical-video' && 'ระบบสร้างวิดีโอสั้นแนวตั้งอัตโนมัติ เขียนบทด้วย AI สังเคราะห์เสียงพากย์พรีเมียม วางซับไตเติ้ลคำเด่นอัจฉริยะ และสั่ง FFmpeg เรนเดอร์วิดีโอ'}
              {activeTab === 'quote-video' && 'สร้างคลิปสั้นคำคมและซีรีส์ความลับเทรดเดอร์ด้วยระบบ Drag-and-Drop ผสาน FFmpeg.wasm เรนเดอร์ออฟไลน์ระดับความเร็วสูง'}
              {activeTab === 'avatar-video' && 'สุ่มฟุตเทจ B-Roll ปิดเสียงซ้อนทับกรีนสกรีนหรือแบ่งหน้าจอ เจนพาดหัว Hook AI และเบิร์นซับไตเติ้ลภาษาไทยเว้นวรรคคำ'}
              {activeTab === 'podcast-clip' && 'สุ่มหยิบฟุตเทจ B-Roll จากโฟลเดอร์ดิบ มา Concat เรียงซ้อนทับไฟล์เสียงเสียงพากย์ บังคับ Scale/Crop และรักษาระยะเวลาตามความยาวเสียงเป๊ะ'}
              {activeTab === 'dropbox-csv' && 'เชื่อมต่อ Dropbox → AI Prompt → Google Sheets / CSV อัตโนมัติ ปรับระดับการประมวลผลวิดีโอและรูปภาพ'}
              {activeTab === 'tracking' && 'เชื่อมต่อ Google Sheets ดึงข้อมูล Stock ของนักตัดต่อและคลังบทความโดยตรง สรุปเปรียบเทียบในรูปแบบแผนภูมิกราฟิก'}
              {activeTab === 'settings' && 'ปรับแต่งระดับการสเกลโปรแกรม ขนาดตัวอักษรและปุ่ม จัดการคีย์ API สำหรับ Scrapers / AI และบันทึกโทเคนเพจเฟซบุ๊กออฟไลน์'}

            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 rounded-lg font-mono">Port: 5005 (Express)</span>
          </div>
        </header>

        <div className="view-container">
          
          {/* TAB 1: DISCOVERY PORTAL */}
          {activeTab === 'discovery' && (
            <DiscoveryPortal 
              onApprove={() => {
                fetchVaultData();
                fetchApprovedItems();
              }} 
            />
          )}

          {/* TAB 2: VAULT MANAGER */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              
              {/* Horizontal Filters Glass Panel */}
              <div className="glass-panel p-6 flex flex-wrap items-center gap-6 justify-between">
                <div className="flex flex-wrap items-center gap-6">
                  
                  {/* Filter source */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">ค้นหาตามประเภทสื่อ</label>
                    <select 
                      className="glass-input w-44"
                      value={filterSource}
                      onChange={(e) => setFilterSource(e.target.value)}
                    >
                      <option value="all">ทั้งหมด (All Sources)</option>
                      <option value="radar"> watchlist เรดาร์</option>
                      <option value="rss">ข่าวสาร RSS Feeds</option>
                      <option value="youtube">คลิปวิดีโอ YouTube</option>
                      <option value="github">คลังซอฟต์แวร์ GitHub</option>
                    </select>
                  </div>

                  {/* Filter status */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">คัดกรองตามขั้นตอน</label>
                    <select 
                      className="glass-input w-44"
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <option value="all">ทั้งหมด (All Status)</option>
                      <option value="scraped">ดึงข้อมูลแล้ว (Scraped)</option>
                      <option value="ready_for_design">อนุมัติสร้างโพสรูป (Ready for Design)</option>
                      <option value="designed">เรนเดอร์โพสรูปเสร็จ (Designed)</option>
                      <option value="posted">โพสต์เรียบร้อย (Posted)</option>
                      <option value="archived">จัดเก็บในคลัง (Archived)</option>
                    </select>
                  </div>

                  {/* Filter keyword */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2">ค้นด้วยคำสำคัญ (Keyword)</label>
                    <div className="relative w-64">
                      <input 
                        type="text" 
                        className="glass-input pl-10" 
                        placeholder="ชื่อเรื่อง คีย์เวิร์ด..."
                        value={filterKeyword}
                        onChange={(e) => setFilterKeyword(e.target.value)}
                      />
                      <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                    </div>
                  </div>

                  {/* Min Rating */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-2 flex items-center justify-between">
                      <span>คะแนนคุณภาพต่ำสุด</span>
                      <span className="text-cyan-400 font-bold font-mono">{filterMinRating}+</span>
                    </label>
                    <input 
                      type="range" 
                      min="0" 
                      max="10" 
                      className="w-40 h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                      value={filterMinRating}
                      onChange={(e) => setFilterMinRating(Number(e.target.value))}
                    />
                  </div>

                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setFilterSource('all');
                      setFilterStatus('all');
                      setFilterKeyword('');
                      setFilterMinRating(0);
                    }}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    ล้างการกรอง
                  </button>
                  <button 
                    onClick={handleExportVaultCSV}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" />
                    <span>ดาวน์โหลด CSV</span>
                  </button>
                  <button 
                    onClick={fetchVaultData}
                    className="btn-neon btn-neon-cyan px-3.5 py-2 text-xs"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รีเฟรชข้อมูล</span>
                  </button>
                </div>
              </div>

              {/* Main Content Grid (Full-Width) */}
              <div className="grid grid-cols-1 gap-8">
                
                {/* Vault Data Table */}
                <div className="glass-panel overflow-hidden">
                  
                  {/* Floating / Inline Batch Operations Panel */}
                  {vaultSelectedIds.length > 0 && (
                    <div className="p-4 bg-gradient-to-r from-cyan-950/40 to-pink-950/40 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 backdrop-blur-md transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></div>
                        <span className="text-xs font-bold text-cyan-400">เลือกวัตถุดิบคอนเทนต์แล้ว {vaultSelectedIds.length} รายการ</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <button 
                          onClick={handleBatchApprove}
                          className="btn-neon btn-neon-cyan px-4 py-2 text-xs"
                        >
                          🟢 อนุมัติที่เลือกเพื่อส่งไปทำโพสรูป (Batch Approve)
                        </button>
                        <button 
                          onClick={handleBatchDelete}
                          className="px-4 py-2 rounded-lg bg-red-950/30 border border-red-500/20 text-xs font-bold text-red-400 hover:bg-red-950/50 hover:text-red-300 transition-all"
                        >
                          🗑️ ลบที่เลือก (Batch Delete)
                        </button>
                        <button 
                          onClick={() => setVaultSelectedIds([])}
                          className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-400 hover:text-white"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="p-4 border-bottom border-slate-850 flex items-center justify-between bg-slate-950/40">
                    <span className="text-sm font-semibold text-slate-300">พบไอเทมคอนเทนต์ทั้งหมด {vaultItems.length} ไอเทม</span>
                  </div>

                  <div className="data-grid-container max-h-[550px] overflow-y-auto">
                    {loadingItems ? (
                      <div className="flex items-center justify-center p-20 text-slate-400 gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                        <span>กำลังเชื่อมต่อ SQLite ค้นหาข้อมูล...</span>
                      </div>
                    ) : vaultItems.length === 0 ? (
                      <div className="text-center p-20 text-slate-500">
                        <Info className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                        <p className="text-sm font-medium">ไม่พบผลลัพธ์ในตารางเก็บ</p>
                        <p className="text-xs text-slate-600 mt-1">ลองล้างตัวกรอง หรือสั่งสแกนข้อมูลบอทในหน้าแรก</p>
                      </div>
                    ) : (
                      <table className="data-grid-table">
                        <thead>
                          <tr>
                            <th className="data-grid-th w-14 text-center">
                              <input 
                                type="checkbox"
                                checked={vaultItems.length > 0 && vaultSelectedIds.length === vaultItems.length}
                                onChange={toggleSelectAllVaultItems}
                                className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                              />
                            </th>
                            <th className="data-grid-th w-28">แหล่งที่มา</th>
                            <th className="data-grid-th">หัวข้อบทความ / คอนเทนต์ไวรัล</th>
                            <th className="data-grid-th w-64 text-center">คะแนน AI (News / Evergreen)</th>
                            <th className="data-grid-th w-32">สเตตัสงาน</th>
                            <th className="data-grid-th w-36 text-center">การจัดการ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vaultItems.map((item) => {
                            const isChecked = vaultSelectedIds.includes(item.id);
                            const showImages = expandedImageIds.includes(item.id);
                            const showScript = expandedScriptIds.includes(item.id);
                            const hasImages = item.media_paths && item.media_paths.length > 0;
                            const hasScript = item.source_type === 'youtube' ? (item.metadata?.transcript_cues?.length > 0) : !!item.raw_content;
                            return (
                              <Fragment key={item.id}>
                                <tr 
                                  className={`data-grid-tr cursor-pointer ${isChecked ? 'selected' : ''}`}
                                  onClick={() => toggleVaultItemSelection(item.id)}
                                >
                                  <td className="data-grid-td text-center" onClick={(e) => { e.stopPropagation(); toggleVaultItemSelection(item.id); }}>
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {}}
                                      className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                                    />
                                  </td>
                                  <td className="data-grid-td">
                                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold border uppercase tracking-wider
                                      ${item.source_type === 'radar' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : ''}
                                      ${item.source_type === 'rss' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : ''}
                                      ${item.source_type === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                      ${item.source_type === 'github' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                                    `}>
                                      {item.source_type}
                                    </span>
                                  </td>
                                  <td className="data-grid-td" onClick={(e) => e.stopPropagation()}>
                                    <div className="font-semibold text-slate-200 hover:text-cyan-400 transition-colors" onClick={() => toggleVaultItemSelection(item.id)}>
                                      {item.title}
                                    </div>
                                    
                                    {/* Badges for channel details and pulled elements */}
                                    <div className="text-xs text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                                      <span className="text-[10px] text-slate-500 font-medium">
                                        {new Date(item.created_at).toLocaleDateString('th-TH')}
                                      </span>
                                      <span>•</span>
                                      
                                      {/* Logo Status and Author name */}
                                      <span className="inline-flex items-center gap-1.5 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/80 text-[10px] font-sans">
                                        {item.author_avatar_url ? (
                                          <img 
                                            src={`${API_BASE}/vault/media?path=${encodeURIComponent(item.author_avatar_url)}`} 
                                            alt="logo" 
                                            className="w-3.5 h-3.5 rounded-full object-cover" 
                                          />
                                        ) : (
                                          <User className="w-3 h-3 text-slate-500" />
                                        )}
                                        <span className="font-semibold text-slate-300">
                                          {item.author_name ? `${item.author_name}` : '❌ ไม่มีชื่อผู้แต่ง/ช่อง'}
                                        </span>
                                      </span>

                                      {/* Subscribers count status */}
                                      {item.source_type === 'youtube' && (
                                        <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800/80 text-[10px] font-sans">
                                          <Users className="w-3 h-3 text-cyan-400" />
                                          <span className="font-medium text-slate-400">
                                            {item.metadata?.subscribers_formatted || item.author_followers 
                                              ? `ผู้ติดตาม: ${item.metadata?.subscribers_formatted || item.author_followers}` 
                                              : '❌ ไม่มีผู้ติดตาม'}
                                          </span>
                                        </span>
                                      )}

                                      {/* Logo Status explicitly */}
                                      {item.source_type === 'youtube' && (
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-sans
                                          ${item.author_avatar_url ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}
                                        `}>
                                          {item.author_avatar_url ? '✅ โลโก้ช่อง' : '❌ ไม่มีโลโก้ช่อง'}
                                        </span>
                                      )}

                                      {/* Script pulled status explicitly */}
                                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-sans
                                        ${hasScript ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}
                                      `}>
                                        {hasScript 
                                          ? (item.source_type === 'youtube' 
                                              ? `🗣️ ดึงสคริปต์ซับแล้ว (${item.metadata?.transcript_cues?.length || 0} ประโยค)` 
                                              : '📄 ดึงเนื้อหาดิบแล้ว') 
                                          : '❌ ไม่มีสคริปต์'}
                                      </span>
                                    </div>

                                    {/* Toggle Expand Buttons */}
                                    <div className="flex items-center gap-2 mt-2.5">
                                      {hasImages && (
                                        <button
                                          onClick={() => toggleImages(item.id)}
                                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer"
                                        >
                                          <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                                          <span>{showImages ? '🙈 ซ่อนรูปแนบ' : `🖼️ ดูรูปแนบ (${item.media_paths.length})`}</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => toggleScript(item.id)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-bold text-slate-300 hover:border-cyan-500 hover:text-cyan-400 transition-colors cursor-pointer"
                                      >
                                        <FileText className="w-3.5 h-3.5 text-pink-400" />
                                        <span>{showScript ? '🙈 ซ่อนเนื้อหาดิบ/Script' : '📄 ดูเนื้อหาดิบ/Script'}</span>
                                      </button>
                                    </div>
                                  </td>
                                  <td className="data-grid-td text-center" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-center gap-2">
                                      <div className="inline-flex items-center bg-pink-500/10 border border-pink-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-pink-400 font-mono">
                                        📰 News: {item.rating_news}/10
                                      </div>
                                      <div className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded text-[10px] font-bold text-emerald-400 font-mono">
                                        🌲 Evergreen: {item.rating_evergreen}/10
                                      </div>
                                    </div>
                                  </td>
                                  <td className="data-grid-td">
                                    <span className={`badge-status 
                                      ${item.status === 'scraped' ? 'badge-scraped' : ''}
                                      ${item.status === 'ready_for_design' ? 'badge-ready' : ''}
                                      ${item.status === 'designed' ? 'badge-designed' : ''}
                                      ${item.status === 'posted' ? 'badge-posted' : ''}
                                      ${item.status === 'archived' ? 'badge-ready' : ''}
                                    `}>
                                      {item.status === 'scraped' && 'ดึงดิบ'}
                                      {item.status === 'ready_for_design' && 'รอดีไซน์'}
                                      {item.status === 'designed' && 'โพสรูปเสร็จแล้ว'}
                                      {item.status === 'posted' && 'เผยแพร่แล้ว'}
                                      {item.status === 'archived' && 'จัดเก็บ'}
                                    </span>
                                  </td>
                                  <td className="data-grid-td text-center" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => handleSingleImport(item)}
                                      className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-400 flex items-center gap-1 mx-auto transition-all"
                                    >
                                      <span>📥 นำเข้าทำรูป</span>
                                    </button>
                                  </td>
                                </tr>

                                {/* Expanded sub-row */}
                                {(showImages || showScript) && (
                                  <tr className="bg-slate-950/80 border-b border-slate-900/60" onClick={(e) => e.stopPropagation()}>
                                    <td colSpan={6} className="p-4">
                                      <div className="space-y-4">
                                        
                                        {/* Display Attached Images */}
                                        {showImages && hasImages && (
                                          <div className="space-y-2">
                                            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">🖼️ รูปแนบ / เฟรมภาพวิดีโอ ({item.media_paths.length} รูป):</div>
                                            <div className="flex flex-wrap gap-3">
                                              {item.media_paths.map((p, idx) => (
                                                <a 
                                                  key={idx}
                                                  href={`${API_BASE}/vault/media?path=${encodeURIComponent(p)}`} 
                                                  target="_blank" 
                                                  rel="noopener noreferrer"
                                                  className="relative group block overflow-hidden rounded-lg border border-slate-800 bg-slate-900 w-48 aspect-video shadow-md hover:border-cyan-500 transition-all"
                                                >
                                                  <img 
                                                    src={`${API_BASE}/vault/media?path=${encodeURIComponent(p)}`} 
                                                    alt={`frame ${idx}`} 
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-[1.05]" 
                                                  />
                                                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <span className="text-[10px] text-white font-bold uppercase tracking-wider">🔎 คลิกเปิดดูรูปใหญ่</span>
                                                  </div>
                                                </a>
                                              ))}
                                            </div>
                                          </div>
                                        )}

                                        {/* Display Script / Transcript */}
                                        {showScript && (
                                          <div className="space-y-2">
                                            <div className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">📄 Script / เนื้อหาคำบรรยายดิบ:</div>
                                            <div className="text-xs bg-slate-900 p-4 border border-slate-850 rounded-lg text-slate-300 max-h-[300px] overflow-y-auto font-mono whitespace-pre-wrap leading-relaxed text-left">
                                              {item.source_type === 'youtube' && item.metadata?.transcript_cues ? (
                                                <div className="space-y-1.5 font-sans">
                                                  {item.metadata.transcript_cues.map((cue: any, cueIdx: number) => (
                                                    <div key={cueIdx} className="flex gap-2.5 py-0.5 border-b border-slate-950 last:border-b-0 hover:bg-slate-950/20">
                                                      <span className="text-[10px] text-cyan-500 font-mono font-bold min-w-16">[{cue.start}s]</span>
                                                      <span className="text-slate-200">{cue.text}</span>
                                                    </div>
                                                  ))}
                                                </div>
                                              ) : (
                                                item.raw_content || 'ไม่มีข้อมูลเนื้อหาดิบ'
                                              )}
                                            </div>
                                          </div>
                                        )}

                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}
          
          {/* TAB 3: GRAPHIC CANVAS WORKSPACE */}
          {activeTab === 'canvas' && (
            <div className="space-y-6 w-full">
              
              {/* ⚙️ ตั้งค่าพื้นฐาน (Basic Configurations) */}
              <div className="glass-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-850 pb-2.5">
                  <h2 className="text-md font-bold text-cyan-400 flex items-center gap-2">
                    ⚙️ ตั้งค่าพื้นฐาน
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleUploadAndExportCSV}
                        setIsCheckingCredits(true);
                        setCreditCheckResults([]);
                        try {
                          const openRouterKey = localStorage.getItem('openrouter_key')?.trim();
                          if (!openRouterKey) {
                            setCreditCheckResults([{
                              label: 'ไม่พบ API Key',
                              keyPreview: '-',
                              valid: false,
                              balance: '$0',
                              usage: '$0',
                              error: 'กรุณาต
                            }]);
                            setIsCheckingCredits(false);
                            return;
      
                  </div>
                </div>

              </div>
            </div>
                            keyPreview,
                            valid: info.valid,
                            balance: info.balanceFormatted,
                            usage: `$${(Number(info.usage) || 0).toFixed(4)}`,
                            isFreeTier: info.isFreeTier,
                            keyApiLabel: info.keyLabel,
                            error: info.error,
                          }]);
                        } catch (e: any) {
                          setCreditCheckResults([{label: 'Error', keyPreview: '-', valid: false, balance: '$0', usage: '$0', error: e.message}]);
                        }
                        setIsCheckingCredits(false);
                      }}
                      disabled={isCheckingCredits}
                      className="px-3 py-1.5 rounded-lg bg-emerald-800/85 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCheckingCredits ? '⚙️ กำลังตรวจ...' : '💰 เช็คเครดิต API'}
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const openRouterKey = localStorage.getItem('openrouter_key')?.trim();
                          if (!openRouterKey) {
                            setCreditCheckResults([{label: 'ไม่พบ API Key', keyPreview: '-', valid: false, balance: '-', usage: '-', error: 'ไม่พบ Key'}]);
                            return;
                          }
                          const testModel = 'google/gemini-2.5-flash';
                          setCreditCheckResults([{label: `🧪 กำลังทดสอบ ${testModel}...`, keyPreview: String(openRouterKey || '').slice(0,8)+'...'+String(openRouterKey || '').slice(-4), valid: true, balance: 'กำลังทดสอบ...', usage: '-'}]);
                          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${openRouterKey}`,
                              'HTTP-Referer': window.location.origin,
                            },
                            body: JSON.stringify({ model: testModel, messages: [{role:'user',content:'ตอบแค่คำว่า "OK"'}], max_tokens: 5 })
                          });
                          const data = await res.json();
                          if (res.ok && !data.error) {
                          <button
                            type="button"
                            onClick={handleGenerateCopywriting}
                                    isSelected 
                                      ? 'border-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-400/20' 
                                      : 'border-slate-800 hover:border-slate-600'
                                  }`}
                                  title={logo.name}
                                >
                                  <img src={`${logo.url}`} alt={logo.name} className="w-full h-full object-contain" />
                                </button>
                                {/* Delete stamp button */}
                                {!['crown.png', 'ai-badge.png'].includes(logo.name) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                            const paths = canvasSelectedItem.media_paths;
                                            const currentIdx = paths.indexOf(canvasBgImage);
                                            const nextIdx = currentIdx === -1 || currentIdx >= paths.length - 1 ? 0 : currentIdx + 1;
 
                                          }}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md shadow-black/40 font-black text-xs select-none pointer-events-auto"
                                          title="ดูรูปพื้นหลังถัดไป"
                                        >
                                          ▶
                                        </button>
                                        <button
                                          type="button"
                                          disabled={generatingCopywriting}
                                          onClick={() => handleGenerateCopywritingForItem(item)}
                                          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-md shadow-purple-500/10"
                                        >
                                          {generatingCopywriting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 animate-pulse text-purple-200" />}
                                          <span>✨ AI เขียนโพสต์ใหม่</span>
                          
                                      </div>
                                      <textarea
                                        value={canvasCaption}
                            ) : (
                              <div className="text-red-400">ข้อผิดพลาด: {r.error}</div>
                                }
                              }}
                              className="w-full flex items-center justify-center gap-2"
                              style={{
                                marginTop: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                background: 'rgba(6, 182, 212, 0.08)',
                                color: '#22d3ee',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>🎲 สุ่มภาพพื้นหลังใหม่ (Randomize Background)</span>
                            </button>
                          )}
                          {stockFolderLog && (
                            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                              {stockFolderLog}
                            </p>
                          )}
                          {canvasBgSource === 'stock' && !stockFolder && (
                            <p style={{ fontSize: '10px', color: '#f59e0b', marginTop: '4px', textAlign: 'center' }}>
                              ⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์
                            </p>
                          )}
                        </div>
                      )}
                    </div>



                      {/* Interactive Card Grid */}
                      {canvasSearchFiltered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                          <Info className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                          <p className="text-xs font-bold text-slate-400">ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            กรุณาไปที่แท็บ <span className="text-cyan-400 font-bold">คลังวัตถุดิบคุณภาพ</span> และกดปุ่ม <span className="text-cyan-400 font-bold">📥 นำเข้าทำรูป</span> หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-
                                        gap: '8px',
                   
                        appendCustomParams(q);
                        
                        runModule('canvas', q.toString());
                      }}
                    >
                      {runningModule.canvas ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    <span className="font-semibold">
                      {canvasQueueIndex !== null 
                                }`}>
                                  {item.title}
                                </p>

                                {/* Footer: Date & author */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/60 pt-2 mt-auto">
                                  <span className="truncate max-w-[120px] font-medium text-slate-400">
                                    👤 {item.author_name || 'ไม่ระบุผู้แต่ง'}
                                  </span>
                                    ? 'bg-cyan-500/10 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30 sm:col-span-2' 
                                    : isChecked
                                      ? 'bg-slate-900/60 border-slate-700/60'
                                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700/80'
                                }`}
                                onClick={() => setCanvasSelectedItem(item)}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
                                    {item.source_type}
                                  </span>
                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setCanvasSelectedIds(prev => 
                                          prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                                        );
                                      }}
                                      className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400 shrink-0"
                                    />

                                    {/* Collapsible Body */}
                                    {showCanvasCardDetails && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {/* 0. Captured Frame Thumbnails Selector (Collapsible, fixed pixel sizes) */}
                                    {canvasBgSource === 'default' && showCanvasItemMedia && item.media_paths && item.media_paths.length > 0 && (
                                      <div style={{
                                        padding: '8px 10px',
                                        background: 'rgba(2, 6, 23, 0.5)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(51, 65, 85, 0.4)',
                                      }}>
                                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                                          🖼️ กดเลือกเฟรมที่ต้องการใช้เป็นฉากหลัง:
                                        </span>
                                              borderRadius: '4px',
                                              border: showCanvasItemMedia ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(71,85,105,0.5)',
                                              background: showCanvasItemMedia ? 'rgba(34,211,238,0.08)' : 'rgba(30,41,59,0.5)',
                                              color: showCanvasItemMedia ? '#67e8f9' : '#94a3b8',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                            }}
                                          >
                                            {showCanvasItemMedia ? '🙈 ซ่อนรูป' : '🖼️ ดูรูป'} {item.media_paths.length}
                                          </span>
                                        )}
                                        <span style={{
                                          fontSize: '10px',
                                          color: showCanvasCardDetails ? '#67e8f9' : '#64748b',
                                          transition: 'transform 0.2s ease',
                                          transform: showCanvasCardDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}>▼</span>
                                      </span>
                                    </button>

                                    {/* Collapsible Body */}
                                    {showCanvasCardDetails && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        fontSize: '0.75rem',
                        cursor: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 'not-allowed' : 'pointer',
                        opacity: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 0.5 : 1,
                        pointerEvents: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 'none' as any : 'auto' as any,
                                        background: 'rgba(2, 6, 23, 0.5)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(51, 65, 85, 0.4)',
                                      }}>
                                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                                          🖼️ กดเลือกเฟรมที่ต้องการใช้เป็นฉากหลัง:
                                        </span>
                                        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                                          {item.media_paths.map((path, pathIdx) => {
                                            const isPathSelected = canvasBgImage === path;
                                            return (
                                              <div
                                                key={pathIdx}
                                                onClick={() => setCanvasBgImage(path)}
                                                style={{
                                                  position: 'relative',
                                                  cursor: 'pointer',
                                                  flexShrink: 0,
                                                  width: '48px',
                                                  height: '32px',
                                                  borderRadius: '4px',
                                                  overflow: 'hidden',
                                                  border: isPathSelected ? '2px solid #22d3ee' : '1px solid rgba(51, 65, 85, 0.6)',
                                                  boxShadow: isPathSelected ? '0 0 6px rgba(34, 211, 238, 0.3)' : 'none',
                                                  transition: 'all 0.15s ease',
                                                }}
                        if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
                          if (canvasHeadlineMode === 'triple') {
                            activeHeadline = [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n');
                          } else {
                            activeHeadline = canvasHeadline;
                          }
                        } else {
                          const h3 = item.metadata?.copywriting?.headline_3line;
                          if (Array.isArray(h3) && h3.filter(Boolean).length > 0) {
                            activeHeadline = h3.filter(Boolean).join('\n');
                          } else {
                            activeHeadline = item.selected_headline || item.title;
                          }
                        }
                        q.append('headline', activeHeadline);

                        // Background image source logic
                        if (canvasBgSource === 'stock' && canvasBgImage && canvasBgImage.includes(stockFolder)) {
                          q.append('base_image', canvasBgImage);
                          } else {
                            activeHeadline = item.selected_headline || item.title;
                          }
                        }
                        q.append('headline', activeHeadline);

                        // Background image source logic
                        if (canvasBgSource === 'stock' && canvasBgImage && canvasBgImage.includes(stockFolder)) {
                          q.append('base_image', canvasBgImage);
                        } else if (canvasBgSource === 'stock' && stockFolder) {
                          // Fetch random stock image from backend if not randomized in preview yet
                          try {
                            const stockRes = await fetch(`${API_BASE}/vault/stock-random?folder=${encodeURIComponent(stockFolder)}`);
                            const stockData = await stockRes.json();
                            if (stockData.success && stockData.absolute_path) {
                              q.append('base_image', stockData.absolute_path);
                            } else {
                              if (canvasBgImage && canvasSelectedItem?.id === item.id) q.append('base_image', canvasBgImage);
                              else if (item.media_paths && item.media_paths.length > 0) q.append('base_image', item.media_paths[0]);
                            }
                          } catch {
                            if (can
                          activeHighlight = canvasHighlight;
                        } else {
                          activeHighlight = item.metadata?.copywriting?.highlight || '';
                        }

                        if (activeHighlight) {
                          q.append('keywords', activeHighlight);
                        } else {
                          let keywords: string[] = [];
                          if (item.metadata) {
                            const meta = item.metadata;
                            keywords = meta.keywords || meta.tags || [];
                          }
                          if (keywords.length > 0) {
                            q.append('keywords', keywords.join(','));
                          }
                        }
                        
                        // Append branding logos & advanced overlays parameters
                        appendCustomParams(q);
                        
                        runModule('canvas', q.toString());
                      }}
                    >
                      {runningModule.canvas ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    <span className="font-semibold">
                      {canvasQueueIndex !== null 
                        ? `กำลังสร้างโพสรูปที่ ${canvasQueueIndex + 1}/${canvasQueueIds.length} ...`
                        : runningModule.canvas 
                          ? 'กำลังเขียนภาพและคำนวณสัดส่วน...' 
                          : canvasSelectedIds.length > 1
                            ? `สั่งเรนเดอร์โพสรูปกลุ่มจำนวน ${ca
  const fetchApprovedItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents?status=ready_for_design`);
      const data = await res.json();
      if (data.success) {
        setApprovedItems(data.data);
                  <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800 shadow-xl mt-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <Download className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-bold text-white">💾 ส่งออกข้อมูลและบันทึกรูปลง Local (Export Data & Images)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูล (.csv) และภาพที่ Render เสร็จสิ้น</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                            setExportDirHandle(dirHandle);
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                                        onClick={() => {
                                          // Update preview state instantly
                                          setCanvasHeadline(canvasHeadlineMode === 'triple' ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n') : canvasHeadline);
                                          setCanvasHighlight(canvasHighlight);
                                          // Trigger alert to let user know preview is updated
                                          alert("👁️ อัปเดตการแสดงผลในหน้าจอพรีวิวด้านบนเรียบร้อยแล้ว!");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>👁️ แสดงตัวอย่างในพรีวิวด้านบน</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                              className="relative w-full rounded-xl font-black text-sm flex items-center justify-center gap-3"
                              style={{
                                background: generatingCopywriting
                                  ? 'rgba(20, 83, 45, 0.3)'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? 'rgba(30, 41, 59, 0.5)'
                                    : 'linear-gradient(90deg, #22c55e, #34d399, #22c55e)',
                                color: generatingCopywriting
                                  ? '#4ade80'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? '#64748b'
                                    : '#0a0a0a',
                                border: generatingCopywriting
                                  ? '2px solid rgba(22, 101, 52, 0.4)'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? '1px solid rgba(51, 65, 85, 0.4)'
                                    : '2px solid #4ade80',
                                padding: '14px 20px',
                                borderRadius: '12px',
                                boxShadow: generatingCopywriting
                                  ? 'none'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                        </div>
                      )}
                    </div>
                    {/* Canvas Item Selector with search filter and imported V1 toggle (Moved to very bottom) */}
                    <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-semibold text-slate-300">
                          🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)
                        </label>
                        {canvasSearchFiltered.length > 0 && (
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={canvasSearchFiltered.length > 0 && canvasSelectedIds.length === canvasSearchFiltered.length}
                              onChange={() => {
                                if (canvasSelectedIds.length === canvasSearchFiltered.length) {
                                  setCanvasSelectedIds([]);
                                } else {
                                  setCanvasSelectedIds(canvasSearchFiltered.map(i => i.id));
                                }
                        
                              className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                            />
                            )}
                          </div>
                          {stockFolderLog && (
                            <p className="text-[9px] text-slate-400 text-center font-medium mt-1">
                              {stockFolderLog}
                            </p>
                          )}
                          {!stockFolder && (
                            <p className="text-[9px] text-amber-500 text-center font-semibold mt-1">
                              ⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                            >
                              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {stockFolder ? `📂 Stock: ${stockFolderName}` : '📂 เลือกโฟลเดอร์ Stock...'}
                              </span>
                            </button>
                            {stockFolder && (
                              <button
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            กรุณาไปที่แท็บ <span className="text-cyan-400 font-bold">คลังวัตถุดิบคุณภาพ</span> และกดปุ่ม <span className="text-cyan-400 font-bold">📥 นำเข้าทำรูป</span> หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {canvasSearchFiltered.map(item => {
                            const isSelected = canvasSelectedItem?.id === ite
                            const isApproved = item.status === 'ready_for_design' || item.status === 'designed' || item.status === 'posted';
                            const isChecked = canvasSelectedIds.includes(ite
                            
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                            setExportDirHandle(dirHandle);
                            setExportFolderName(dirHandle.name);
                            localStorage.setItem('canvas_export_folder_name', dirHandle.name);
                        q.append('theme', canvasTheme);
                        q.append('layout', canvasLayout);
                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              {/* Headline Style */}
                              </h3>
                              <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                                {canvasSelectedIds.length} รายการ
                              </span>
                            </div>

                            {/* Dropdowns Row */}
                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              {/* Headline Style */}
                              <div>
                                <label className="block text-[10px] font-bold text-purple-300/80 mb-1 uppercase tracking-wider">
                                  🎯 สไตล์พาดหัว
                                </label>
                                <select
                                  value={canvasHeadlineStyle}
                                  onChange={(e) => setCanvasHeadlineStyle(e.target.value)}
                                  className="w-full h-9 text-[11px] rounded-lg border border-purple-500/30 bg-slate-950/80 text-white font-medium cursor-pointer px-2.5 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/30 transition-all"
                                >
                                  <option value="">-- เลือกสไตล์พาดหัว --</option>
                               
                                </label>
                                <select
                                  value={canvasWritingStyle}
                                  onChange={(e) => setCanvasWritingStyle(e.target.value)}
                                  className="w-full h-9 text-[11px] rounded-lg border border-purple-500/30 bg-slate-950/80 text-white font-medium cursor-pointer px-2.5 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/30 transition-all"
                                >
                                  <option value="">-- เลือกสไตล์การเขียนโพส --</option>
                                  {PALETTE_WRITING_STYLES.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Validation hint */}
                            {(!canvasHeadlineStyle || !canvasWritingStyle) && (
                              <p className="text-[10px] text-amber-400/80 mb-2 flex items-center gap-1">
                                ⚠️ กรุณาเลือกสไตล์พาดหัวและสไตล์การเขียนโพสให้ครบทั้ง 2 ช่องก่อนกดปุ่ม
                              </p>
                            )}
                              </div>
                            </div>

                            {/* Validation hint */}
                            {(!canvasHeadlineStyle || !canvasWritingStyle) && (
                              <p className="text-[10px] text-amber-400/80 mb-2 flex items-center gap-1">
                                ⚠️ กรุณาเลือกสไตล์พาดหัวและสไตล์การเขียนโพสให้ครบทั้ง 2 ช่องก่อนกดปุ่ม
                              </p>
                            )}

                            {/* Big Action Button */}
                            <button
                              type="button"
                              disabled={generatingCopywriting || !canvasHeadlineStyle || !canvasWritingStyle}
                              onClick={handleBulkGenerateCopywriting}
                              className="relative w-full rounded-xl font-black text-sm flex items-center justify-center gap-3"
                              style={{
                                background: generatingCopywriting
                                  ? 'rgba(20, 83, 45, 0.3)'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? 'rgba(30, 41, 59, 0.5)'
                                    : 'linear-gradient(90deg, #22c55e, #34d399, #22c55e)',
                                color: generatingCopywriting
                                  ? '#4ade80'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? '#64748b'
                                    : '#0a0a0a',
                                border: generatingCopywriting
                                  ? '2px solid rgba(22, 101, 52, 0.4)'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? '1px solid rgba(51, 65, 85, 0.4)'
                                    : '2px solid #4ade80',
                                padding: '14px 20px',
                                borderRadius: '12px',
                                boxShadow: generatingCopywriting
                                  ? 'none'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? 'none'
                                    : '0 0 25px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.2)',
                                fontWeight: 900,
                    {/* Canvas Item Selector with search filter and imported V1 toggle (Moved to very bottom) */}
                    <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-semibold text-slate-300">
                          🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)
                        </label>
                        {canvasSearchFiltered.length > 0 && (
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={canvasSearchFiltered.length > 0 && canvasSelectedIds.length === canvasSearchFiltered.length}
                              onChange={() => {
                                if (canvasSelectedIds.length === canvasSearchFiltered.length) {
                                  setCanvasSelectedIds([]);
                                } else {
                                  setCanvasSelectedIds(canvasSearchFiltered.map(i => i.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                            />
                            )}
                          </div>
                          {stockFolderLog && (
                            <p className="text-[9px] text-slate-400 text-center font-medium mt-1">
                              {stockFolderLog}
                            </p>
                          )}
                          {!stockFolder && (
                            <p className="text-[9px] text-amber-500 text-center font-semibold mt-1">
                              ⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                            >
                              <FolderOpen className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {stockFolder ? `📂 Stock: ${stockFolderName}` : '📂 เลือกโฟลเดอร์ Stock...'}
                              </span>
                            </button>
                            {stockFolder && (
                              <button
                                type="button"
                                onClick={async () => {
                                  try {
                                    const stockRes = await fetch(`${API_BASE}/vault/stock-random?folder=${encodeURIComponent(stockFolder)}`);
                                    const stockData = await stockRes.json();
                                    if (stockData.success && stockData.absolute_path) {
                                      setCanvasBgImage(stockData.absolute_path);
                                      setStockFolderLog(`🎲 สุ่มภาพสำเร็จ! ${stockData.absolute_path.split('/').pop()}`);
                                    } else {
                                      alert(`⚠️ ${stockData.error || 'ไม่สามารถดึงรูปภาพสุ่มได้'}`);
                                    }
                                  } catch (err: any) {
                                    alert(`❌ ไม่สามารถเชื่อมต่อระบบสุ่มภาพได้: ${err.message}`);
                                  }
                                }}
                                className="flex items-center justify-center gap-1 px-3 py-1.5 border border-cyan-500/40 bg-cyan-500/5 text-cyan-400 rounded-lg text-[10px] font-bold hover:bg-cyan-500/10 active:scale-98 transition-all cursor-pointer shrink-0"
                              >
                                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                                <span>สุ่มใหม่</span>
                              </button>
                            )}
                          </div>
                          {stockFolderLog && (
                            <p className="text-[9px] text-slate-400 text-center font-medium mt-1">
                              {stockFolderLog}
                            </p>
                          )}
                          {!stockFolder && (
                            <p className="text-[9px] text-amber-500 text-center font-semibold mt-1">
                              ⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Canvas Item Selector with search filter and imported V1 toggle (Moved to very bottom) */}
                    <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 mt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-semibold text-slate-300">
                          🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)
                        </label>
                        {canvasSearchFiltered.length > 0 && (
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={canvasSearchFiltered.length > 0 && canvasSelectedIds.length === canvasSearchFiltered.length}
                              onChange={() => {
                                if (canvasSelectedIds.length === canvasSearchFiltered.length) {
                                  setCanvasSelectedIds([]);
                                } else {
                                  setCanvasSelectedIds(canvasSearchFiltered.map(i => i.id));
                                }
                              }}
                              className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                            />
                            <span className="text-[10px] font-bold text-slate-400">เลือกทั้งหมดเพื่อสร้างโพสรูป ({canvasSearchFiltered.length} รายการ)</span>
                          </label>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text" 
                            value={canvasSearchQuery}
                            onChange={e => setCanvasSearchQuery(e.target.value)}
                            placeholder="🔍 พิมพ์คำค้นหาโพสต์ เช่น TechFeed, Llama, AI..."
                            className="glass-input py-2 text-xs pl-8 bg-black/40"
                          />
                          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3" />
                        </div>
                        {canvasSearchQuery && (
                          <button 
                            onClick={() => setCanvasSearchQuery('')}
                            className="px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                          >
                            ล้าง
                          </button>
                        )}
                      </div>

                      {/* Bulk AI Copywriting Generation — Prominent Card */}
                      {canvasSelectedIds.length > 0 && (
                        <div className="pt-1.5 pb-2 animate-fade-in w-full">
                          <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-950/80 to-indigo-950/60 p-4 shadow-2xl shadow-purple-500/10">
                            {/* Glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/10 to-indigo-500/5 pointer-events-none" />
                            
                            {/* Header */}
                            <div className="relative flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/20">
                              <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                              <h3 className="text-sm font-black text-white tracking-tight">
                                ✍️ สั่ง AI เขียนบทความและพาดหัว
                              </h3>
                              <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                                {canvasSelectedIds.length} รายการ
                              </span>
                            </div>

                            {/* Dropdowns Row */}
                            <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                              {/* Headline Style */}
                              <div>
                                <label className="block text-[10px] font-bold text-purple-300/80 mb-1 uppercase tracking-wider">
                                  🎯 สไตล์พาดหัว
                                </label>
                                <select
                                  value={canvasHeadlineStyle}
                                  onChange={(e) => setCanvasHeadlineStyle(e.target.value)}
                                  className="w-full h-9 text-[11px] rounded-lg border border-purple-500/30 bg-slate-950/80 text-white font-medium cursor-pointer px-2.5 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/30 transition-all"
                                >
                                  <option value="">-- เลือกสไตล์พาดหัว --</option>
                                  {PALETTE_HEADLINE_STYLES.map(h => (
                                    <option key={h.id} value={h.id}>{h.name}</option>
                                  ))}
                                </select>
                              </div>
                              
                              {/* Writing Style */}
               
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                      background: 'rgba(15, 23, 42, 0.4)',
                    }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                        <ImageIcon className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                          🖼️ แหล่งภาพพื้นหลัง (Background Source)
                        </span>
                      </div>
                      <select
                        value={canvasBgSource}
                        onChange={(e) => {
                          const v = e.target.value as 'default' | 'stock';
                          setCanvasBgSource(v);
                          localStorage.setItem('canvas_bg_source', v);
                        }}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          borderRadi
                        <ImageIcon className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                          🖼️ แหล่งภาพพื้นหลัง (Background Source)
                        </span>
                      </div>
                      <select
                        value={canvasBgSource}
                        onChange={(e) => {
                          const v = e.target.value as 'default' | 'stock';
                          setCanvasBgSource(v);
                          localStorage.setItem('canvas_bg_source', v);
                                    ? 'rgba(30, 41, 59, 0.5)'
                                    : 'linear-gradient(90deg, #22c55e, #34d399, #22c55e)',
                                color: generatingCopywriting
                                  ? '#4ade80'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? '#64748b'
                                    : '#0a0a0a',
                                border: generatingCopywriting
                                  ? '2px solid rgba(22, 101, 52, 0.4)'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? '1px solid rgba(51, 65, 85, 0.4)'
                                    : '2px solid #4ade80',
                                padding: '14px 20px',
                                borderRadius: '12px',
                                boxShadow: generatingCopywriting
                                  ? 'none'
                                  : (!canvasHeadlineStyle || !canvasWritingStyle)
                                    ? 'none'
                                    : '0 0 25px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.2)',
                                fontWeight: 900,
                                fontSize: '0.875rem',
                                cursor: generatingCopywriting ? 'wait' : (!canvasHeadlineStyle || !canvasWritingStyle) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                opacity: (generatingCopywriting || !canvasHeadlineStyle || !canvasWritingStyle) ? 0.85 : 1,
                              }}
                            >
                              {generatingCopywriting ? (
                                <>
                                  <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#86efac' }} />
                                  <span>กำลังใช้ AI เขียนบทความแบบกลุ่ม... ({canvasSelectedIds.length} รายการ)</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-5 h-5" />
                                  <span>🚀 เริ่มสั่ง AI เขียนบทความและพาดหัวทั้งหมด ({canvasSelectedIds.length} รายการ)</span>
                                </>
                              )}
                            </button>

                            {/* Toggle Logs and Detailed Terminal Panel */}
                            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                              <span className="text-[10px] text-slate-400 font-bold">📜 AI Copywriting Logs</span>
                              <button
                                type="button"
                                onClick={() => setShowCanvasLogs(!showCanvasLogs)}
                                className="px-2.5 py-0.5 r
                                  <div className="mt-4 pt-3 border-t border-slate-800/80 text-left w-full" onClick={(e) => e.stopPropagation()}>
                                    {/* Collapsible Header Bar */}
                                    <button
                                      type="button"
                                      onClick={() => setShowCanvasCardDetails(prev => !prev)}
                                      style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: '8px',
                                        padding: '6px 10px',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(51, 65, 85, 0.4)',
                                        background: showCanvasCardDetails ? 'rgba(6, 182, 212, 0.06)' : 'rgba(15, 23, 42, 0.4)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        marginBottom: showCanvasCardDetails ? '12px' : '0',
                                      }}
                                    >
     
                                </>
                                      {logLine}
                                    </div>
                                  );
                                })}
                                <div ref={terminalBottoms.canvas} />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* === Background Image Source Dropdown === */}
                    <div style={{
                      marginTop: '10px',
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: '1px solid rgba(63, 63, 70, 0.5)',
                      background: 'rgba(15, 23, 42, 0.4)',
                    }}>
                      <div className="flex items-center gap-2" style={{ marginBottom: '8px' }}>
                        <ImageIcon className="w-3.5 h-3.5" style={{ color: '#94a3b8' }} />
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>
                          🖼️ แหล่งภาพพื้นหลัง (Background Source)
                        </span>
                      </div>
                      <select
                        value={canvasBgSource}
                        onChange={(e) => {
                          const v = e.target.value as 'default' | 'stock';
                          setCanvasBgSource(v);
                          localStorage.setItem('canvas_bg_source', v);
                        }}
                        style={{
                                    </button>

                                    {/* Collapsible Body */}
                                    {showCanvasCardDetails && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {/* 0. Captured Frame Thumbnails Selector (Collapsible, fixed pixel sizes) */}
                                    {canvasBgSource === 'default' && showCanvasItemMedia && item.media_paths && item.media_paths.length > 0 && (
                                      <div style={{
                                        padding: '8px 10px',
                        }}
                      >
                        <option value="default">📰 รูปจากบทความต้นทาง (Default Media)</option>
                                                key={pathIdx}
                                                onClick={() => setCanvasBgImage(path)}
                                                style={{
                                                  position: 'relative',
                                                  cursor: 'pointer',
                                                  flexShrink: 0,
                                                  width: '48px',
                                                  height: '32px',
                                                  borderRadius: '4px',
                                                  overflow: 'hidden',
                                                  border: isPathSelected ? '2px solid #22d3ee' : '1px solid rgba(51, 65, 85, 0.6)',
                                                  boxShadow: isPathSelected ? '0 0 6px rgba(34, 211, 238, 0.3)' : 'none',
                                                  transition: 'all 0.15s ease',
                                                }}
                                              >
                                                <img
                                                  src={`${API_BASE}/vault/media?path=${encodeURIComponent(path)}`}
                                                  alt={`Frame ${pathIdx + 1}`}
                                                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                                />
                                                {isPathSelected && (
                                                  <div style={{
                                                    position: 'absolute',
                                                    inset: 0,
                                                    background: 'rgba(34, 211, 238, 0.15)',
                                                    display: 'flex',
                                      setStockFolderLog(`✅ พบ ${data.total} รูปในโฟลเดอร์ Stock`);
                                    } else {
                                      setStockFolderLog(`⚠️ ${data.error}`);
                                    }
                                  } catch {
                                    setStockFolderLog('⚠️ ไม่สามารถตรวจสอบโฟลเดอร์กับ Backend ได้');
                                  }
                                }
                              } catch (e: any) {
                                if (e.name === 'AbortError') return;
                                console.error('Stock folder picker error:', e);
                              }
                            }}
                            className="w-full flex items-center justify-center gap-2"
                            style={{
                              padding: '8px 12px',
                              borderRadius: '8px',
                              border: stockFolder
                                ? '1px solid rgba(139, 92, 246, 0.4)'
                                : '1px dashed rgba(139, 92, 246, 0.6)',
                              background: stockFolder
                                ? 'rgba(139, 92, 246, 0.08)'
                                : 'rgba(139, 92, 246, 0.05)',
 
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                            }}
                          >
                                      </div>
                                    )}

                                    {/* 1. Post Caption Editor */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-bold text-slate-300 block">
                                          ✍️ แก้ไขตัวโพส (Post Caption / แคปชั่น)
                                        </label>
                                        <button
                                          type="button"
                                          disabled={generatingCopywriting}
                                          onClick={() => handleGenerateCopywritingForItem(item)}
                                          className="px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-md shadow-purple-500/10"
                                        >
                                          {generatingCopywriting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 animate-pulse text-purple-200" />}
                                          <span>✨ AI เขียนโพสต์ใหม่</span>
                          
                        </div>
                      )}
                    </div>


                                }
                              }}
                              className="w-full flex items-center justify-center gap-2"
                              style={{
                                marginTop: '6px',
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(6, 182, 212, 0.4)',
                                background: 'rgba(6, 182, 212, 0.08)',
                                color: '#22d3ee',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                              }}
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                              <span>🎲 สุ่มภาพพื้นหลังใหม่ (Randomize Background)</span>
                            </button>
                          )}
                          {stockFolderLog && (
                            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textAlign: 'center' }}>
                              {stockFolderLog}
                            </p>
                          )}
                          {canvasBgSource === 'stock' && !stockFolder && (
                            <p style={{ fontSize: '10px', color: '#f59e0b', marginTop: '4px', textAlign: 'center' }}>
                              ⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์
                            </p>
                          )}
                        </div>
                      )}
                    </div>



                      {/* Interactive Card Grid */}
                      {canvasSearchFiltered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                          <Info className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                          <p className="text-xs font-bold text-slate-400">ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            กรุณาไปที่แท็บ <span className="text-cyan-400 font-bold">คลังวัตถุดิบคุณภาพ</span> และกดปุ่ม <span className="text-cyan-400 font-bold">📥 นำเข้าทำรูป</span> หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-
                                        gap: '8px',
                   
                                    {/* 1. Post Caption Editor */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-bold text-slate-300 block">
                                          ✍️ แก้ไขตัวโพส (Post Caption / แคปชั่น)
                                        </label>
                                        <button
                                          type="button"
                                }`}>
                                  {item.title}
                                </p>

                                {/* Footer: Date & author */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/60 pt-2 mt-auto">
                                  <span className="truncate max-w-[120px] font-medium text-slate-400">
                                    👤 {item.author_name || 'ไม่ระบุผู้แต่ง'}
                                  </span>
                                    ? 'bg-cyan-500/10 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30 sm:col-span-2' 
                                    : isChecked
                                      ? 'bg-slate-900/60 border-slate-700/60'
                                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700/80'
                                }`}
                                onClick={() => setCanvasSelectedItem(item)}
                              >
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${badgeStyle}`}>
                                    {item.source_type}
                                  </span>
                                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                    <input 
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setCanvasSelectedIds(prev => 
                                          prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                                        );
                                      }}
                                      className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400 shrink-0"
                                    />

                                    {/* Collapsible Body */}
                                    {showCanvasCardDetails && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {/* 0. Captured Frame Thumbnails Selector (Collapsible, fixed pixel sizes) */}
                                    {canvasBgSource === 'default' && showCanvasItemMedia && item.media_paths && item.media_paths.length > 0 && (
                                      <div style={{
                                        padding: '8px 10px',
                                        background: 'rgba(2, 6, 23, 0.5)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(51, 65, 85, 0.4)',
                                      }}>
                                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                                          🖼️ กดเลือกเฟรมที่ต้องการใช้เป็นฉากหลัง:
                                        </span>
                                              borderRadius: '4px',
                                              border: showCanvasItemMedia ? '1px solid rgba(34,211,238,0.3)' : '1px solid rgba(71,85,105,0.5)',
                                              background: showCanvasItemMedia ? 'rgba(34,211,238,0.08)' : 'rgba(30,41,59,0.5)',
                                              color: showCanvasItemMedia ? '#67e8f9' : '#94a3b8',
                                              cursor: 'pointer',
                                              transition: 'all 0.15s ease',
                                            }}
                                          >
                                            {showCanvasItemMedia ? '🙈 ซ่อนรูป' : '🖼️ ดูรูป'} {item.media_paths.length}
                                          </span>
                                        )}
                                        <span style={{
                                          fontSize: '10px',
                                          color: showCanvasCardDetails ? '#67e8f9' : '#64748b',
                                          transition: 'transform 0.2s ease',
                                          transform: showCanvasCardDetails ? 'rotate(180deg)' : 'rotate(0deg)',
                                        }}>▼</span>
                                      </span>
                                    </button>

                                    {/* Collapsible Body */}
                                    {showCanvasCardDetails && (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        fontSize: '0.75rem',
                        cursor: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 'not-allowed' : 'pointer',
                        opacity: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 0.5 : 1,
                        pointerEvents: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 'none' as any : 'auto' as any,
                                        background: 'rgba(2, 6, 23, 0.5)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(51, 65, 85, 0.4)',
                                      }}>
                                        <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '6px' }}>
                                          🖼️ กดเลือกเฟรมที่ต้องการใช้เป็นฉากหลัง:
                                        </span>
                                        <div style={{ display: 'flex', gap: '5px', overflowX: 'auto', paddingBottom: '2px' }}>
                                          {item.media_paths.map((path, pathIdx) => {
                                            const isPathSelected = canvasBgImage === path;
                                            return (
                                              <div
                                                key={pathIdx}
                                                onClick={() => setCanvasBgImage(path)}
                                                style={{
                                                  position: 'relative',
                                                  cursor: 'pointer',
                                                  flexShrink: 0,
                                                  width: '48px',
                                                  height: '32px',
                                                  borderRadius: '4px',
                                                  overflow: 'hidden',
                                                  border: isPathSelected ? '2px solid #22d3ee' : '1px solid rgba(51, 65, 85, 0.6)',
                                                  boxShadow: isPathSelected ? '0 0 6px rgba(34, 211, 238, 0.3)' : 'none',
                                                  transition: 'all 0.15s ease',
                                                }}
                        if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
                          if (canvasHeadlineMode === 'triple') {
                            activeHeadline = [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n');
                          } else {
                            activeHeadline = canvasHeadline;
                          }
                        } else {
                          const h3 = item.metadata?.copywriting?.headline_3line;
                          if (Array.isArray(h3) && h3.filter(Boolean).length > 0) {
                            activeHeadline = h3.filter(Boolean).join('\n');
                          } else {
                            activeHeadline = item.selected_headline || item.title;
                          }
                        }
                        q.append('headline', activeHeadline);

                        // Background image source logic
                        if (canvasBgSource === 'stock' && canvasBgImage && canvasBgImage.includes(stockFolder)) {
                          q.append('base_image', canvasBgImage);
                          } else {
                            activeHeadline = item.selected_headline || item.title;
                          }
                        }
                        q.append('headline', activeHeadline);

                        // Background image source logic
                        if (canvasBgSource === 'stock' && canvasBgImage && canvasBgImage.includes(stockFolder)) {
                          q.append('base_image', canvasBgImage);
                        } else if (canvasBgSource === 'stock' && stockFolder) {
                          // Fetch random stock image from backend if not randomized in preview yet
                          try {
                            const stockRes = await fetch(`${API_BASE}/vault/stock-random?folder=${encodeURIComponent(stockFolder)}`);
                            const stockData = await stockRes.json();
                            if (stockData.success && stockData.absolute_path) {
                              q.append('base_image', stockData.absolute_path);
                            } else {
                              if (canvasBgImage && canvasSelectedItem?.id === item.id) q.append('base_image', canvasBgImage);
                              else if (item.media_paths && item.media_paths.length > 0) q.append('base_image', item.media_paths[0]);
                            }
                          } catch {
                            if (can
                          activeHighlight = canvasHighlight;
                        } else {
                          activeHighlight = item.metadata?.copywriting?.highlight || '';
                        }

                        if (activeHighlight) {
                          q.append('keywords', activeHighlight);
                        } else {
                          let keywords: string[] = [];
                          if (item.metadata) {
                            const meta = item.metadata;
                            keywords = meta.keywords || meta.tags || [];
                          }
                          if (keywords.length > 0) {
                            q.append('keywords', keywords.join(','));
                          }
                        }
                        
                        // Append branding logos & advanced overlays parameters
                        appendCustomParams(q);
                        
                        runModule('canvas', q.toString());
                      }}
                    >
                      {runningModule.canvas ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    <span className="font-semibold">
                      {canvasQueueIndex !== null 
                        ? `กำลังสร้างโพสรูปที่ ${canvasQueueIndex + 1}/${canvasQueueIds.length} ...`
                        : runningModule.canvas 
                          ? 'กำลังเขียนภาพและคำนวณสัดส่วน...' 
                          : canvasSelectedIds.length > 1
                            ? `สั่งเรนเดอร์โพสรูปกลุ่มจำนวน ${ca
  const fetchApprovedItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents?status=ready_for_design`);
      const data = await res.json();
      if (data.success) {
        setApprovedItems(data.data);
                  <div className="space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800 shadow-xl mt-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                      <Download className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-bold text-white">💾 ส่งออกข้อมูลและบันทึกรูปลง Local (Export Data & Images)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูล (.csv) และภาพที่ Render เสร็จสิ้น</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                            setExportDirHandle(dirHandle);
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                                        onClick={() => {
                                          // Update preview state instantly
                                          setCanvasHeadline(canvasHeadlineMode === 'triple' ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n') : canvasHeadline);
                                          setCanvasHighlight(canvasHighlight);
                                          // Trigger alert to let user know preview is updated
                                          alert("👁️ อัปเดตการแสดงผลในหน้าจอพรีวิวด้านบนเรียบร้อยแล้ว!");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>👁️ แสดงตัวอย่างในพรีวิวด้านบน</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("UI Redesign modifications finished!")

                                }}
                              >
                                <span className="live-callout-hl">
                                  📢 {canvasCalloutHighlight || 'อัพเดตล่าสุด'}
                                </span>
                          : '0 0 25px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.2)',
                        fontWeight: 900,
                        fontSize: '0.75rem',
                        cursor: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 'not-allowed' : 'pointer',
                        opacity: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 0.5 : 1,
                        pointerEvents: (runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)) ? 'none' as any : 'auto' as any,
                        transition: 'all 0.3s ease',
                      }}
                      disabled={runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)}
                      onClick={async () => {
                        setContentGraphics([]); // Clear previous graphics session
                        setGraphicIndex(0);
                        setLatestGraphic(null);

                        } else {
                          const h3 = item.metadata?.copywriting?.headline_3line;
                          if (Array.isArray(h3) && h3.filter(Boolean).length > 0) {
                            activeHeadline = h3.filter(Boolean).join('\n');
                          } else {
                            activeHeadline = item.selected_headline || item.title;
                          }
                        }
                        q.append('headline', activeHeadline);

                        // Background image source logic
                        if (canvasBgSource === 'stock' && canvasBgImage && canvasBgImage.includes(stockFolder)) {
                          q.append('base_image', canvasBgImage);
                        } else if (canvasBgSource === 'stock' && stockFolder) {
                          // Fetch random stock image from backend if not randomized in preview yet
                          try {
                            const stockRes = await fetch(`${API_BASE}/vault/stock-random?folder=${encodeURIComponent(stockFolder)}`);
                            const stockData = await stockRes.json();
                            if (stockData.success && stockData.absolute_path) {
                              q.append('base_image', stockData.absolute_path);
                            } else {
                              if (canvasBgImage && canvasSelectedItem?.id === item.id) q.append('base_image', canvasBgImage);
                              else if (item.media_paths && item.media_paths.length > 0) q.append('base_image', item.media_paths[0]);
                            }
                          } catch {
                            if (canvasBgImage && canvasSelectedItem?.id === 
                            else if (item.media_paths && item.media_paths.length > 0) q.append('base_image', item.media_paths[0]);
                          }
      }
                          highlight: "100 Prompt"
                        };
                        
                    const displayHeadline = (canvasHeadlineMode === 'triple'
                      ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n')
                      : canvasHeadline) || defaultContent.headline;
                          activeHighlight = canvasHighlight;
                        } else {
                          activeHighlight = item.metadata?.copywriting?.highlight || '';
                        }

                        if (activeHighlight) {
                          q.append('keywords', activeHighlight);
                        } else {
                          let keywords: string[] = [];
                          if (item.metadata) {
                            const meta = item.metadata;
                            keywords = meta.keywords || meta.tags || [];
                          }
                          if (keywords.length > 0) {
                            q.append('keywords', keywords.join(','));
                          }
                        }
                        
                        // Append branding logos & advanced overlays parameters
                        appendCustomParams(q);
                        
                        runModule('canvas', q.toString());
                      }}
                    >
                      {runningModule.canvas ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                    <span className="font-semibold">
                      {canvasQueueIndex !== null 
                        ? `กำลังสร้างโพสรูปที่ ${canvasQueueIndex + 1}/${canvasQueueIds.length} ...`
                        : runningModule.canvas 
                          ? 'กำลังเขียนภาพและคำนวณสัดส่วน...' 
                          : canvasSelectedIds.length > 1
  // Fetch only approved items for Canvas tab
  const fetchApprovedItems = async () => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents?status=ready_for_design`);
      const data = await res.json();
      if (data.success) {
        setApprovedItems(data.data);
      }
    } catch (err) {
                      <Download className="w-4 h-4 text-green-400" />
                      <span className="text-xs font-bold text-white">💾 ส่งออกข้อมูลและบันทึกรูปลง Local (Export Data & Images)</span>
                    </div>
                    <p className="text-[10px] text-slate-400 leading-snug">ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูล (.csv) และภาพที่ Render เสร็จสิ้น</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                            setExportDirHandle(dirHandle);
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                      {/* Folder Selector Button */}
                      <button
                        type="button"
                                        onClick={() => {
                                          // Update preview state instantly
                                          setCanvasHeadline(canvasHeadlineMode === 'triple' ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n') : canvasHeadline);
                                          setCanvasHighlight(canvasHighlight);
                                          // Trigger alert to let user know preview is updated
                                          alert("👁️ อัปเดตการแสดงผลในหน้าจอพรีวิวด้านบนเรียบร้อยแล้ว!");
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>👁️ แสดงตัวอย่างในพรีวิวด้านบน</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                    </div>
                                    )}{/* end collapsible body */}

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

                        </div>
                      )}
                    </div>

                    <button
                      style={{
                                                      fontWeight: 900,
                                                      display: 'flex',
                                                      alignItems: 'center',
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          const finalCopywriting = {
                                            ...(item.metadata?.copywriting || {}),
                                            caption: canvasCaption,
                                            headline_3line: [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3],
                                            highlight: canvasHighlight,
                                            headlines: item.metadata?.copywriting?.headlines || [canvasHeadline]
                                          };
                                {canvasLogoUrl ? (
                                  <img
                                    src={`${API_BASE}${canvasLogoUrl}`}
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                  </div>
                                )}"""

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
                                    bottom: '14cqw',
                                    fontSize: '18cqw',
                                    color: activeTheme.highlight,
                                    opacity: 0.3,
                                    lineHeight: 1
                                  }}
                                >
                                  ”
                                </span>
                              </>
                            )}

                            {/* Backdrop Image Cycler Controls */}
                            {canvasSelectedItem && canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const paths = canvasSelectedItem.media_paths;
                          className={`preview-canvas-container relative overflow-hidden rounded-xl border border-slate-800 shadow-2xl ${
                            canvasRatio === '16:9' 
                              ? 'aspect-[16/9] w-full' 
                              : canvasRatio === '4:3'
                                ? 'aspect-[4/3] w-full'
                                : canvasRatio === '9:16'
                                  ? 'aspect-[9/16] h-[400px]'
                                  : canvasRatio === '4:5'
                                    ? 'aspect-[4/5] h-[400px]'
                                    : 'aspect-square w-full'
                          }`}
                          style={{ maxWidth: '380px', margin: '0 auto' }}
                        >
                          {/* Upper Background Split region / Full Background region */}
                          <div 
                            className="absolute top-0 left-0 right-0 overflow-hidden"
                            style={{ 
                                                <button
                                      type="button"
                                      disabled={isUploadingDropbox}
                                      onClick={async () => {
                                        if (!dropboxToken) {
                                          alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                          return;
                                        }
                                        if (contentGraphics.length === 0) return;
                                        
                                        const addLog = (msg: string) => {
                                          setLogs(prev => ({
                                            ...prev,
                                            canvas: [...prev.canvas, msg]
                                          }));
                                          scrollTerminal('canvas'
                                        };

                                        setIsUploadingDropbox(true);
                                        setShowCanvasLogs(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
                                        addLog('[PROCESS] ☁️ เริ่มกระบวนการอัพโหลดไฟล์ไปยัง Dropbox และส่งออกไฟล์ CSV...');
                                        try {
                                          const filePaths = contentGraphics.map((g: any) => g.file_path);
                                          setDropboxUploadProgress(`อัพโหลด ${filePaths.length} ไฟล์ไปยัง Dropbox...`);
                                          addLog(`[PROCESS] 📦 เตรียมไฟล์สำหรับอัพโหลดจำนวน ${filePaths.length} รายการ...`);
                                          addLog('[PROCESS] ☁️ กำลังเชื่อมต่อ API และส่งไฟล์ขึ้นระบบคลาวด์ของ Dropbox...');
                                          
                                          const res = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              file_paths: filePaths,
                                     setCanvasBgImage(paths[nextIdx]);
                                   }}
                                   className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md shadow-black/40 font-black text-xs select-none pointer-events-auto"
                                   title="ดูรูปพื้นหลังถัดไป"
                                 >
                                   ▶
                                 </button>
                                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/40 text-[9px] font-black text-slate-300 tracking-wider">
                                  🖼️ ฉากคลังภาพที่ {(canvasSelectedItem.media_paths.indexOf(canvasBgImage) !== -1 ? canvasSelectedItem.media_paths.indexOf(canvasBgImage) : 0) + 1}/{canvasSelectedItem.media_paths.length}
                                </div>
                              </>
                            )}

                            {/* Category Badge overlay */}
                            {canvasShowBadge && (
                                          const headline = copywriting?.headline_3line?.join(' ') || canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || '';
                                          const caption = copywriting?.caption || '';
                                          
                                          const csvRows = [['พาดหัว', 'บทความโพส', 'Dropbox Link'].join(',')];
                                          
                                          for (const result of data.results) {
                                            const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
                                  
                                  {canvasBadgeText || 'AI'}
                                              escapeCsv(caption),
                                              escapeCsv(result.shared_link || ''),
                                            ].join(','));
                                          }
                                          
                                          const csvContent = '\uFEFF' + csvRows.join('\n'); // BOM for Thai encoding
                                          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                          const url = URL.createObjectURL(blob);
                                          const a = document.createElement('a');
                                          a.href = url;
                                          a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;
                                          a.click();
                                          URL.revokeObjectURL(url);
                                          
                                       setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                       setTimeout(() => setDropboxUploadProgress(''), 5000);
                                        } catch (err: any) {
                                          console.error('Dropbox upload error:', err);
                                          setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${err.message}`);
                                          setTimeout(() => setDropboxUploadProgress(''), 5000);
                                        }
                                        setIsUploadingDropbox(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1.5px solid rgba(56,189,248,0.4)',
                                        background: isUploadingDropbox ? 'rgba(56,189,248,0.08)' : 'linear-gradient(90deg, rgba(14,165,233,0.2), rgba(56,189,248,0.15))',
                                        color: isUploadingDropbox ? '#7dd3fc' : '#38bdf8',
                                        cursor: isUploadingDropbox || !dropboxToken ? 'not-allowed' : 'pointer',
                                        opacity: !dropboxToken ? 0.4 : 1,
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 0 10px rgba(56,189,248,0.1)',
                                      }}
                                    >
                                      {isUploadingDropbox ? (
                                        <><RefreshCw className="w-3 h-3 animate-spin" /> กำลังอัพโหลด...</>
                                      ) : (
                                        <><Upload className="w-3 h-3" /> ☁️ Dropbox + CSV</>
                                      )}
                                    </button>
                                  </>
                                )}
                                <span className="text-[10px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0">
                                  {contentGraphics.length} รูป
                                </span>
                              </div>
                              {dropboxUploadProgress && (
                                <p style={{ fontSize: '9px', fontWeight: 700, color: dropboxUploadProgress.startsWith('✅') ? '#4ade80' : dropboxUploadProgress.startsWith('❌') ? '#f87171' : '#7dd3fc', marginTop: '6px' }}>
                                  {dropboxUploadProgress}
                                </p>
                              )}
                            </div>
                            
                            {/* Gallery Grid: 5 items per row using inline styles for guaranteed desktop layout */}
                            <div 
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">AI Copywriting Viewer</h3>
                                width: '100%'
                              }}
                            >
                              {contentGraphics.map((g, idx) => (
                                <div 
                                  key={g.id} 
                                  className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-350 cursor-zoom-in"
                                  onClick={() => setLightboxImage(`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`)}
                                >
                                  <img 
                                    src={`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`}
                                    alt={`Poster Output ${idx + 1}`}
                                    className="w-full h-auto rounded-lg object-contain border border-slate-900 group-hover:scale-[1.03] transition-all duration-305"
                                    <img
                                      src={`${API_BASE}/vault/media?path=${encodeURIComponent(canvasSelectedItem.author_avatar_url)}`}
                                      alt="channel"
                                      style={{
                                        width: '5cqw',
                                        height: '5cqw',
                                        borderRadius: '50%',
                                        border: '0.25cqw solid rgba(255,255,255,0.3)',
                                        objectFit: 'cover',
                                        flexShrink: 0,
                                      }}
                                    />
                                  ) : (
                                    <div style={{
                                      width: '5cqw',
                                      height: '5cqw',
                                      borderRadius: '50%',
                                      background: '#ef4444',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '2.5cqw',
                                      fontWeight: 900,
                                      color: 'white',
                                      flexShrink: 0,
                                    }}>▶</div>
                                  )}
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2cqw', minWidth: 0 }}>
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {contentGraphics.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                        setContentGraphics([]);
                                        setLatestGraphic(null);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2.5 py-1 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                        
                                  <Trash2 className="w-2.5 h-2.5" />
                                  เคลียร์รูปภาพ
                                </button>
                                <button
                                  type="button"
                                      disabled={isUploadingDropbox}
                                      onClick={async () => {
                                        if (!dropboxToken) {
                                          alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                          return;
                                        }
                                        if (contentGraphics.length === 0) return;
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
            
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                          
                                          setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                          setTimeout(() => setDropboxUploadProgress(''), 5000);
                                        } catch (err: any) {
                                          console.error('Dropbox upload error:', err);
                                          const errMsg = err.message || '';
                                          let friendlyMsg = errMsg;
                                          if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
                                            friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
                                          }
                                          setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
                                          setTimeout(() => setDropboxUploadProgress(''), 10000);
                                        }
                                        setIsUploadingDropbox(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1.5px solid rgba(56,189,248,0.4)',
                                        background: isUploadingDropbox ? 'rgba(56,189,248,0.08)' : 'linear-gradient(90deg, rgba(14,165,233,0.2), rgba(56,189,248,0.15))',
                                        color: isUploadingDropbox ? '#7dd3fc' : '#38bdf8',

                              {/* Bottom section (Author line or YouTube Channel card) */}
                              <div className="flex items-end justify-between w-full min-h-16">
                                paddingTop: `${canvasHeadlineMargin / 10.8}cqw`
                              }}
                            >
                              <div 
                                className="live-headline-text flex-1 flex items-center" 
                                style={{ 
                                  fontSize: `${canvasFontScale * 4.2}cqw`,
                                  fontFamily: canvasFontFamily
                                }}
                              >
                                <p 
                                  className="w-full font-black tracking-wide leading-snug"
                                  style={{ textAlign: canvasHeadlineAlign }}
                                >
                                  {renderHeadlineWithHighlights(displayHeadline, displayHighlight)}
                                </p>
                              </div>

                              <div className="live-credit-text border-t border-slate-900 pt-3 text-slate-400">
                                เครดิต: {canvasCreditText || 'Coinpulse Content Lab'}
                              </div>
                            </div>
                          ) : (
                            /* Full Overlay text layout */
                            <div 
                              className="absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between p-6 z-20"
                              style={{ 
                                fontFamily: canvasFontFamily,
                                pointerEvents: 'none'
                              }}
                            >
                              {/* Top spacer */}
                              <div className="h-12" />

                              {/* Center aligned title */}
                              <div 
                     
                                style={{
                                  fontSize: `${canvasFontScale * 4.2}cqw`,
                                  textAlign: canvasHeadlineAlign,
                                  textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)',
                                  padding: '0 2cqw',
                                  cursor: !dropboxToken || isUploadingDropbox ? 'not-allowed' : 'pointer',
                                  opacity: !dropboxToken ? 0.6 : 1
                                }}
                              >
                                <p className="font-black tracking-wide leading-snug w-full">
                                  {render
                                  </div>
                                )}

                                {/* YouTube documentary card badge */}
                                {canvasLayout === 'youtube' && (
                                  <div 
                                    className="ml-auto flex items-center gap-2 bg-slate-950/85 border border-slate-800/80 rounded-xl p-2.5 max-w-[210px] shadow-lg shadow-black/60"
                                    style={{
                                      backdropFilter: 'blur(4px)'
                                    }}
                                  >
                                    <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                                      {canvasLogoUrl ? (
                                        <img src={canvasLogoUrl} alt="Channel Logo" className="w-full h-full object-contain" />
                                      ) : (
                                        <span className="text-[10px] font-black text-white">YT</span>
                                      )}
                                    </div>
                                    <div className="text-left">
                                      <p className="text-[9px] font-black text-white truncate max-w-[130px]">{canvasCreditText || 'Coinpulse Tech'}</p>
                                      <p className="text-[7.5px] font-bold text-slate-400 mt-0.5">👤 1.25M subscribers</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 🎯 ผลลัพธ์จากการเรนเดอร์ล่าสุด (Pillow Output) */}
                        {latestGraphic && (
                                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 font-mono text-[8px] px-1.5 py-0.5 rounded-md shadow z-10">
                                    #{idx + 1}
                                  </div>
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                                            } else {
                                              alert(`การอัพโหลดบางส่วนล้มเหลว (${failedCount}/${data.results.length} ไฟล์): ${firstError}`);
                                            }
                                          }
                                          
                                          setDropboxUploadProgress('สร้างไฟล์ CSV...');
                                          
                                          // Build CSV content
                            <div className="flex items-center justify-between mb-3 text-left w-full">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider text-left">🎯 ผลลัพธ์ (Pillow Output)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {contentGraphics.length > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setContentGraphics([]);
                                        setLatestGraphic(null);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2.5 py-1 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      เคลียร์รูปภาพ
      
                                          const url = URL.createObjectURL(blob);
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUploadingDropbox}
                                      onClick={async () => {
                                        if (!dropboxToken) {
                                          alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                          return;
                                        }
                                        if (contentGraphics.length === 0) return;
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
                                        try {
                                          const filePaths = contentGraphics.map((g: any) => g.file_path);
                                          setDropboxUploadProgress(`อัพโหลด ${filePaths.length} ไฟล์ไปยัง Dropbox...`);
                                          
                                          const res = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              file_paths: filePaths,
                                              dropbox_token: dropboxToken,
                                              dropbox_folder: dropboxFolder,
                                            }),
                                          });
                                          
                                          const data = await res.json();
                                          
                                          if (!data.success) {
                                            throw new Error(data.error || 'Upload failed');
                                          }

                                          // Check for specific upload errors inside results
                                          const failedCount = data.results.filter((r: any) => r.error).length;
                                          if (failedCount > 0) {
                                            const firstError = data.results.find((r: any) => r.error)?.error || 'Unknown error';
                                            if (failedCount === data.results.length) {
                                              throw new Error(firstError);
                                            } else {
                                              alert(`การอัพโหลดบางส่วนล้มเหลว (${failedCount}/${data.results.length} ไฟล์): ${firstError}`);
                                            }
                                          }
                                          
                                          setDropboxUploadProgress('สร้างไฟล์ CSV...');
                                          
                                          // Build CSV content
                            <div className="flex items-center justify-between mb-3 text-left w-full">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider text-left">🎯 ผลลัพธ์ (Pillow Output)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {contentGraphics.length > 0 && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setContentGraphics([]);
                                        setLatestGraphic(null);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2.5 py-1 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      เคลียร์รูปภาพ
      
                                          const url = URL.createObjectURL(blob);
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUploadingDropbox}
                                      onClick={async () => {
                                        if (!dropboxToken) {
                                          alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                          return;
                                        }
                                        if (contentGraphics.length === 0) return;
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
                                        try {
                                          const filePaths = contentGraphics.map((g: any) => g.file_path);
                                          setDropboxUploadProgress(`อัพโหลด ${filePaths.length} ไฟล์ไปยัง Dropbox...`);
                                          
                                          const res = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
                                          
                                              file_paths: filePaths,
                                              dropbox_token: dropboxToken,
                                              dropbox_folder: dropboxFolder,
                                            }),
                                          });
                                          
                                          const data = await res.json();
                                          
                                          if (!data.success) {
                                            throw new Error(data.error || 'Upload failed');
                                          }

                                          // Check for specific upload errors inside results
                                          const failedCount = data.results.filter((r: any) => r.error).length;
                                          if (failedCount > 0) {
                                            const firstError = data.results.find((r: any) => r.error)?.error || 'Unknown error';
                                            if (failedCount === data.results.length) {
                                              throw new Error(firstError);
                                            } else {
                                              alert(`การอัพโหลดบางส่วนล้มเหลว (${failedCount}/${data.results.length} ไฟล์): ${firstError}`);
                                            }
                                          }
                                          
                                          setDropboxUploadProgress('สร้างไฟล์ CSV...');
                                          
                                          // Build CSV content
                                          const csvRows = [['พาดหัว', 'บทความโพส', 'Dropbox Link'].join(',')];
                                          
                                          // Only export successful ones in CSV
                                          const successfulResults = data.results.filter((r: any) => !r.error);
                                          for (const result of successfulResults) {
                                            // Find the corresponding graphic from contentGraphics to get the correct content_id
                                            const matchingGraphic = contentGraphics.find((g: any) => g.file_path === result.file_path);
                                            
                                            let headline = '';
                                            let caption = '';
                                            
                                            if (matchingGraphic) {
                                              const itemId = matchingGraphic.content_id;
                                              // Find the original
          if (item) {
            const copywriting = item.metadata?.copywriting;
            headline = copywriting?.headline_3line?.join(' ') || item.selected_headline || item.title || '';
            caption = copywriting?.caption || '';
          }
        }
        
        // Fallback to currently selected item if not found
        if (!headline) {
          const copywriting = canvasSelectedItem?.metadata?.copywriting;
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS PORTAL */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6">
              <SettingsPortal appScale={appScale} setAppScale={setAppScale} />
            </div>
          )}

          {/* TAB 11: WORK TRACKING SYSTEM */}
          {activeTab === 'tracking' && (
            <iframe 
              src="/tracking-dashboard.html" 
              style={{
                width: '100%',
                height: 'calc(100vh - 150px)',
                border: 'none',
                ) : (
                  <div className="w-full flex flex-col items-center justify-start p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 mb-4 relative overflow-hidden min-h-[300px]">
                    {loadingGraphics ? (
                      <div className="flex flex-col items-center text-slate-500 gap-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-xs">กำลังโหลดไฟล์รูปภาพ...</span>
                                        } catch (err: any) {
                                          console.error('Dropbox upload error:', err);
                                          const errMsg = err.message || '';
                                          let friendlyMsg = errMsg;
                                          if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
                                            friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
                                          }
                                          setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
                                          setTimeout(() => setDropboxUploadProgress(''), 10000);
                                        }
                                        setIsUploadingDropbox(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        color: isUploadingDropbox ? '#7dd3fc' : '#38bdf8',
                                        cursor: isUploadingDropbox ? 'not-allowed' : 'pointer',
                                        opacity: !dropboxToken ? 0.6 : 1,
                                        transition: 'all 0.2s ease',
                                        setContentGraphics([]);
                                        setLatestGraphic(null);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2.5 py-1 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      เคลียร์รูปภาพ
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUploadingDropbox}
                                      onClick={async () => {
                                        if (!dropboxToken) {
                                          alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                          return;
                                        }
                                        if (contentGraphics.length === 0) return;
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
                                        try {
                                          const filePaths = contentGraphics.map((g: any) => g.file_path);
                                          setDropboxUploadProgress(`อัพโหลด ${filePaths.length} ไฟล์ไปยัง Dropbox...`);
                                          
                                          const res = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
                                            method: 'POST',
                            
                                gap: '12px',
                                width: '100%'
                              }}
                            >
                              {contentGraphics.map((g, idx) => (
                                <div 
                                  key={g.id} 
                                  className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-350 cursor-zoom-in"
                                  onClick={() => setLightboxImage(`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`)}
                                >
                                  <img 
                                    src={`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`}
                                    alt={`Poster Output ${idx + 1}`}
                                    className="w-full h-auto rounded-lg object-contain border border-slate-900 group-hover:scale-[1.03] transition-all duration-305"
                                  />
                                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 font-mono text-[8px] px-1.5 py-0.5 rounded-md shadow z-10">
                                    #{idx + 1}
                                  </div>
                                    <Eye className="w-5 h-5 text-emerald-400 filter drop-shadow" />
                                  </div>
                                </div>
                              ))}
                            </div>
                type="button"
                onClick={() => setQuickViewTab('headlines')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  quickViewTab === 'headlines'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                📢 พาดหัว 3 บรรทัด (3-Line Headlines)
              </button>

                        {/* 🎯 ผลลัพธ์จากการเรนเดอร์ล่าสุด (Pillow Output) */}
                        {latestGraphic && (
                                       const a = document.createElement('a');
                                       a.href = url;
                                       a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;
                                       a.click();
                                       URL.revokeObjectURL(url);
                                       
                                       setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                            {contentGraphics.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setContentGraphics([]);
                                    setLatestGraphic(null);
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2 py-0.5 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  เคลียร์รูปภาพ
                                </button>
                                <button
                                  type="button"
                                  disabled={isUploadingDropbox}
                                   onClick={async () => {
                                     if (!dropboxToken) {
                                       alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                       return;
                                     }
         
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
            
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                          
                                          setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                          setTimeout(() => setDropboxUploadProgress(''), 5000);
                                        } catch (err: any) {
                                          console.error('Dropbox upload error:', err);
                                          const errMsg = err.message || '';
                                          let friendlyMsg = errMsg;
                                          if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
                                            friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
                                          }
                                          setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
                                          setTimeout(() => setDropboxUploadProgress(''), 10000);
                                        }
                                        setIsUploadingDropbox(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1.5px solid rgba(56,189,248,0.4)',
                                        background: isUploadingDropbox ? 'rgba(56,189,248,0.08)' : 'linear-gradient(90deg, rgba(14,165,233,0.2), rgba(56,189,248,0.15))',
                                        color: isUploadingDropbox ? '#7dd3fc' : '#38bdf8',
            </div>
            <p className="text-[11px] text-slate-500">Express Backend running at port 5005. Safe SQLite Pool DB active.</p>
          </div>
        </aside>

      {/* Main Panel Content */}
      
      // Only export successful ones in CSV
      const successfulResults = data.results.filter((r: any) => !r.error);
      for (const result of successfulResults) {
        // Find the corresponding graphic from contentGraphics to get the correct content_id
        const matchingGraphic = contentGraphics.find((g: any) => g.file_path === result.file_path);
        
        let headline = '';
        let caption = '';
        
        if (matchingGraphic) {
          const itemId = matchingGraphic.content_id;
          const item = canvasAllItems.find(i => i.id === itemId) || canvasImportedItems.find(i => i.id === itemId);
          if (item) {
            const copywriting = item.metadata?.copywriting;
            headline = copywriting?.headline_3line?.join(' ') || item.selected_headline || item.title || '';
                                             caption = copywriting?.caption || '';
                                           }
                                         }
                                         
                                         // Fallback to currently selected item if not found
                                         if (!headline) {
                                           const copywriting = canvasSelectedItem?.metadata?.copywriting;
                                           headline = copywriting?.headline_3line?.join(' ') || canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || '';
                                           caption = copywriting?.caption || '';
                                         }
                                         
                                         const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
                                         csvRows.push([
                                           escapeCsv(headline),
                                           escapeCsv(caption),
                                           escapeCsv(result.shared_link || ''),
                                         ].join(','));
                                       }
                                       
                                       const csvContent = '\uFEFF' + csvRows.join('\n');
                                       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                       const url = URL.createObjectURL(blob);
                                       const a = document.createElement('a');
                                       a.href = url;
                                       a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv\`;
                                       a.click();
                                   
                                    gap: '4px',
                                    fontSize: '9px',
                                       setTimeout(() => setDropboxUploadProgress(''), 5000);
                                     } catch (err: any) {
                                       console.error('Dropbox upload error:', err);
                                       const errMsg = err.message || '';
                                       let friendlyMsg = errMsg;
                                       if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
                                         friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
                                       }
                                       setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
                                       setTimeout(() => setDropboxUploadProgress(''), 10000);
                                     }
                                     setIsUploadingDropbox(false);
                                   }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '9px',
                                    fontWeight: 900,
                            width: '100%'
                          }}
                        >
                          {contentGraphics.map((g, idx) => (
                            <div 
                      <div className="flex flex-col items-center text-slate-500 gap-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-xs">กำลังโหลดไฟล์รูปภาพ...</span>
                      </div>
                    ) : latestGraphic ? (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="flex items-center justify-between w-full mb-3 px-1 border-b border-slate-800/80 pb-2">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                    setLatestGraphic(null);
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2 py-0.5 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  เคลียร์รูปภาพ
                                </button>
                                <button
                                  type="button"
                                  disabled={isUploadingDropbox}
                                   onClick={async () => {
                                     if (!dropboxToken) {
                                       alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                       return;
                                     }
                                     if (contentGraphics.length === 0) return;
                                     
                                     setIsUploadingDropbox(true);
                                     setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
          
                            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                            gap: '12px',
                            width: '100%'
                          }}
                        >
                            gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
                            gap: '12px',
                            width: '100%'
                          }}
                        >
                          {contentGraphics.map((g, idx) => (
                            <div 
                              key={g.id} 
                              className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-350 cursor-zoom-in"
                              onClick={() => setLightboxImage(`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`)}
                            >
                              <img 
                                src={`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`}
                                alt={`Poster Output ${idx + 1}`}
                                className="w-full h-auto rounded-lg object-contain border border-slate-900 group-hover:scale-[1.03] transition-all duration-300"
                              />
                              <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 font-mono text-[8px] px-1.5 py-0.5 rounded-md shadow z-10">
                                #{idx + 1}
                              </div>
                              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                                <Eye className="w-5 h-5 text-emerald-400 filter drop-shadow" />
                                          
                                          const data = await res.json();
                                          
                                          if (!data.success) {
                                            throw new Error(data.error || 'Upload failed');
                                          }
                                        csvRows.push([
            
                                          escapeCsv(caption),
                                          escapeCsv(result.shared_link || ''),
                                        ].join(','));
                                        throw new Error(data.error || 'Upload failed');
                                      }
                                      
                                      setDropboxUploadProgress('สร้างไฟล์ CSV...');
                                      
                                      const copywriting = canvasSelectedItem?.metadata?.copywriting;
                                      const headline = copywriting?.headline_3line?.join(' ') || canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || '';
                                      const caption = copywriting?.caption || '';
                                      
                                      const csvRows = [['พาดหัว', 'บทความโพส', 'Dropbox Link'].join(',')];
                                      
                                      for (const result of data.results) {
                                        const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
                                        csvRows.push([
                                          escapeCsv(headline),
                                          escapeCsv(caption),
                                          escapeCsv(result.shared_link || ''),
                                        ].join(','));
                                      }
                                      
                                      const csvContent = '\uFEFF' + csvRows.join('\n');
                                       
                                           caption = copywriting?.caption || '';
                                         }
                                         
                                         const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
                                         csvRows.push([
                                           escapeCsv(headline),
                                           escapeCsv(caption),
                                           escapeCsv(result.shared_link || ''),
                                         ].join(','));
                                       }
                                       
                                       const csvContent = '\uFEFF' + csvRows.join('\n');
                                       const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                       const url = URL.createObjectURL(blob);
                                       const a = document.createElement('a');
                                       a.href = url;
                                       a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;
                                       a.click();
                                       URL.revokeObjectURL(url);
                                       
                                       setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                       setTimeout(() => setDropboxUploadProgress(''), 5000);
                                     } catch (err: any) {
                                       console.error('Dropbox upload error:', err);
                                       const errMsg = err.message || '';
                                       let friendlyMsg = errMsg;
                                       if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
                                         friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
                                       }
                                       setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
                                       setTimeout(() => setDropboxUploadProgress(''), 10000);
                                     }
                                     setIsUploadingDropbox(false);
                                   }}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    fontSize: '9px',
                                    fontWeight: 900,
                            width: '100%'
                          }}
                        >
                          {contentGraphics.map((g, idx) => (
                            <div 
                                        transition: 'all 0.2s ease',
                                        setContentGraphics([]);
                                        setLatestGraphic(null);
                                      }}
                                      className="flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2.5 py-1 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      เคลียร์รูปภาพ
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isUploadingDropbox}
                                      onClick={async () => {
                                        if (!dropboxToken) {
                                          alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                          return;
                                        }
                                        if (contentGraphics.length === 0) return;
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
                                        try {
                                          const filePaths = contentGraphics.map((g: any) => g.file_path);
                                          setDropboxUploadProgress(`อัพโหลด ${filePaths.length} ไฟล์ไปยัง Dropbox...`);
                                          
                                          const res = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
                                            method: 'POST',
                            
                                gap: '12px',
                                width: '100%'
                              }}
                            >
                              {contentGraphics.map((g, idx) => (
                                <div 
                                  key={g.id} 
                                  className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-350 cursor-zoom-in"
                                  onClick={() => setLightboxImage(`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`)}
                                >
                                  <img 
                                    src={`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`}
                                    alt={`Poster Output ${idx + 1}`}
                                    className="w-full h-auto rounded-lg object-contain border border-slate-900 group-hover:scale-[1.03] transition-all duration-305"
                                  />
                                  <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 font-mono text-[8px] px-1.5 py-0.5 rounded-md shadow z-10">
                                    #{idx + 1}
                                  </div>
                                    <Eye className="w-5 h-5 text-emerald-400 filter drop-shadow" />
                                  </div>
                                </div>
                              ))}
                            </div>
                type="button"
                onClick={() => setQuickViewTab('headlines')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  quickViewTab === 'headlines'
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                📢 พาดหัว 3 บรรทัด (3-Line Headlines)
              </button>
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-xs">กำลังโหลดไฟล์รูปภาพ...</span>
                      </div>
                                       const a = document.createElement('a');
                                       a.href = url;
                                       a.download = `content_export_${new Date().toISOString().slice(0,10)}.csv`;
                                       a.click();
                                       URL.revokeObjectURL(url);
                                       
                                       setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                            {contentGraphics.length > 0 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setContentGraphics([]);
                                    setLatestGraphic(null);
                                  }}
                                  className="flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2 py-0.5 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                  เคลียร์รูปภาพ
                                </button>
                                <button
                                  type="button"
                                  disabled={isUploadingDropbox}
                                   onClick={async () => {
                                     if (!dropboxToken) {
                                       alert('กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน');
                                       return;
                                     }
         
                                        
                                        setIsUploadingDropbox(true);
                                        setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                        
            
                                >
                                  <Trash2 className="w-2.5 h-2.5" />
                                          
                                          setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                          setTimeout(() => setDropboxUploadProgress(''), 5000);
                                        } catch (err: any) {
                                          console.error('Dropbox upload error:', err);
                                          const errMsg = err.message || '';
                                          let friendlyMsg = errMsg;
                                          if (errMsg.includes('invalid_access_token') || errMsg.includes('401')) {
                                            friendlyMsg = 'Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่';
                                          }
                                          setDropboxUploadProgress(`❌ เกิดข้อผิดพลาด: ${friendlyMsg}`);
                                          setTimeout(() => setDropboxUploadProgress(''), 10000);
                                        }
                                        setIsUploadingDropbox(false);
                                      }}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        fontSize: '10px',
                                        fontWeight: 900,
                                        padding: '5px 12px',
                                        borderRadius: '8px',
                                        border: '1.5px solid rgba(56,189,248,0.4)',
                                        background: isUploadingDropbox ? 'rgba(56,189,248,0.08)' : 'linear-gradient(90deg, rgba(14,165,233,0.2), rgba(56,189,248,0.15))',
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/20">
                      <p className="text-xs font-bold text-slate-400">ไม่พบข้อมูลพาดหัว 3 บรรทัดสำหรับรายการนี้</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-850/80 flex justify-end bg-slate-950/20">
              <button
                type="button"
                onClick={() => setQuickViewCopywriting(null)}
                className="btn-neon btn-neon-cyan px-6 py-2 text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Premium Popup Card for Render Result Preview */}
      {lightboxImage && (
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 Premium Popup Card for Render Result Preview */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
          style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(12px)' }}
          onClick={() => setLightboxImage(null)}
        >
          <div 
            style={{
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, rgba(15,23,42,0.98) 0%, rgba(30,41,59,0.95) 100%)',
              border: '1px solid rgba(51,65,85,0.5)',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0,0,0,0.7), 0 0 40px rgba(6,182,212,0.08)',
              display: 'flex',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Image */}
            <div style={{
              flex: '0 0 55%',
              maxWidth: '55%',
              background: 'rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
                                    boxShadow: isSelected ? '0 0 8px rgba(34,211,238,0.3)' : 'none',
                                  }}
                                  title={logo.name}
                                >
                                  <img src={`${API_BASE}${logo.url}`} alt={logo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                </button>
                                        </div>
                                      </div>
                                    )}

                                    {/* 1. Post Caption Editor */}
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between gap-4">
                                        <label className="text-[11px] font-bold text-slate-300 block">
                                          ✍️ แก้ไขตัวโพส (Post Caption / แคปชั่น)
                                        </label>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const paths = canvasSelectedItem.media_paths;
                                            const currentIdx = paths.indexOf(canvasBgImage);
                                            const nextIdx = currentIdx === -1 || currentIdx >= paths.length - 1 ? 0 : currentIdx + 1;
 
                                          }}
                                          className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md shadow-black/40 font-black text-xs select-none pointer-events-auto"
                                          title="ดูรูปพื้นหลังถัดไป"
                  borderRadius: '50%',
                  background: 'rgba(15,23,42,0.8)',
                  border: '1px solid rgba(51,65,85,0.6)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: 10,
                }}
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Header tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                  color: '#0a0a0a',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                }}>
              {/* Header tag */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{
                  background: 'linear-gradient(90deg, #06b6d4, #22d3ee)',
                  color: '#0a0a0a',
                  padding: '4px 12px',
                  borderRadius: '8px',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '0.5px',
                }}>
                  ✨ ผลงานสำเร็จ
                </div>
                <span style={{ fontSize: '10px', color: '#475569' }}>
                  {canvasSelectedItem?.source_type === 'youtube' ? '▶️ YouTube' : '📰 Content'}
                </span>
              </div>

              {/* Headline section */}
              <div>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  📌 พาดหัว
                </p>
                <div style={{
                  background: 'rgba(6,182,212,0.06)',
                  border: '1px solid rgba(34,211,238,0.15)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                }}>
                  {canvasSelectedItem?.metadata?.copywriting?.headline_3line?.length > 0 ? (
           
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1.4 }}>
                      {canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || 'ไม่มีพาดหัว'}
                    </p>
                  )}
                </div>
              </div>

              {/* Ca
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1.4 }}>
                      {canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || 'ไม่มีพาดหัว'}
                    </p>
                  )}
                </div>
              </div>

              {/* Caption / Post Article */}
              <div style={{ flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>
                    📝 บทความโพส
                  </p>
                  {canvasSelectedItem?.metadata?.copywriting?.caption && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(canvasSelectedItem.metadata.copywriting.caption);
                      }}
                      style={{
                        background: 'rgba(34,197,94,0.1)',
                        border: '1px solid rgba(34,197,94,0.3)',
                        color: '#4ade80',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      📋 คัดลอก
                    </button>
                  )}
                </div>
                <div style={{
                  background: 'rgba(15,23,42,0.5)',
                  border: '1px solid rgba(51,65,85,0.4)',
                  borderRadius: '10px',
                  padding: '14px',
                  maxHeight: '280px',
                  overflowY: 'auto',
                }}>
                  {canvasSelectedItem?.metadata?.copywriting?.caption ? (
                    <p style={{
                      fontSize: '12px',
                      color: '#cbd5e1',
                      lineHeight: 1.7,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                    }}>
                      {canvasSelectedItem.metadata.copywriting.caption}
                    </p>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontStyle: 'italic' }}>
                      ⚠️ ยังไม่มีบทความโพส — กรุณากดเขียนบทความก่อน
                    </p>
                  )}
                </div>
              </div>

              {/* Footer info */}
              {canvasSelectedItem && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  paddingTop: '10px',
                  borderTop: '1px solid rgba(51,65,85,0.3)',
                }}>
                  {canvasSelectedItem.author_avatar_url && (
                    <img
                      src={`${API_BASE}/vault/media?path=${encodeURIComponent(canvasSelectedItem.author_avatar_url)}`}
                      alt=""
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(51,65,85,0.5)' }}
                    />
                  )}
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', margin: 0 }}>
                      {canvasSelectedItem.author_name || 'Unknown'}
                    </p>
                    {canvasSelectedItem.author_followers && (
                      <p style={{ fontSize: '8px', color: '#475569', margin: 0 }}>
                        {canvasSelectedItem.metadata?.subscribers_formatted || canvasSelectedItem.author_followers} ผู้ติดตาม
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
