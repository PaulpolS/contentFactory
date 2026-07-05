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
  Scissors,
  Activity,
  TrendingUp
} from 'lucide-react';
import DiscoveryPortal from './components/DiscoveryPortal';
import SettingsPortal from './components/SettingsPortal';
import PromptGeneratorPortal from './components/PromptGeneratorPortal';
import VerticalVideoSuitePortal from './components/VerticalVideoSuitePortal';
import QuoteVideoPortal from './components/QuoteVideoPortal';
import { AvatarVerticalClipPortal } from './components/AvatarVerticalClipPortal';
import FlowAutomatorPortal from './components/FlowAutomatorPortal';
import PodcastVideoPortal from './components/PodcastVideoPortal';
import SingleClipEditorPortal from './components/SingleClipEditorPortal';
import EngagementDashboardPortal from './components/EngagementDashboardPortal';


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
  examples?: string[];
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
  type TabType = 'discovery' | 'vault' | 'canvas' | 'settings' | 'prompt-generator' | 'vertical-video' | 'quote-video' | 'avatar-video' | 'dropbox-csv' | 'podcast-clip' | 'clip-editor' | 'tracking' | 'fb-insights';
  const validTabs: TabType[] = ['discovery', 'vault', 'canvas', 'settings', 'prompt-generator', 'vertical-video', 'quote-video', 'avatar-video', 'dropbox-csv', 'podcast-clip', 'tracking'];
  const [activeTab, _setActiveTab] = useState<TabType>(() => {
    const saved = localStorage.getItem('active_tab') as TabType | null;
    return saved && validTabs.includes(saved) ? saved : 'discovery';
  });
  const setActiveTab = (tab: TabType) => {
    localStorage.setItem('active_tab', tab);
    _setActiveTab(tab);
  };

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
  const [isImportingVideo, setIsImportingVideo] = useState(false);
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
  const [selectedGraphicIds, setSelectedGraphicIds] = useState<string[]>([]);

  useEffect(() => {
    if (contentGraphics.length > 0) {
      setSelectedGraphicIds(contentGraphics.map(g => g.id));
    } else {
      setSelectedGraphicIds([]);
    }
  }, [contentGraphics]);

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

  // Custom writing styles states
  const [customWritingStyles, setCustomWritingStyles] = useState<WritingStyle[]>(() => {
    try {
      const saved = localStorage.getItem('custom_writing_styles');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse custom_writing_styles:', e);
      return [];
    }
  });
  const [showStylesManager, setShowStylesManager] = useState(false);
  const [newStyleName, setNewStyleName] = useState('');
  const [newStyleDesc, setNewStyleDesc] = useState('');
  const [newStyleExamples, setNewStyleExamples] = useState<string[]>(['']);
  const [expandedStyleId, setExpandedStyleId] = useState<string | null>(null);

  // Combine system writing styles and custom writing styles
  const allWritingStyles = [...PALETTE_WRITING_STYLES, ...customWritingStyles];
  
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
      const activeStyle = allWritingStyles.find(s => s.id === canvasWritingStyle);
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
    const activeStyle = allWritingStyles.find(s => s.id === canvasWritingStyle);
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
          writing_style_examples: activeStyle?.examples || [],
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
    const activeStyle = allWritingStyles.find(s => s.id === canvasWritingStyle);
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
            writing_style_examples: activeStyle?.examples || [],
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
      const activeStyle = allWritingStyles.find(s => s.id === canvasWritingStyle);
      const activeHeadlinePack = PALETTE_HEADLINE_STYLES.find(h => h.id === canvasHeadlineStyle);
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
          writing_style_prompt: activeStyle?.content || '',
          writing_style_examples: activeStyle?.examples || [],
          headline_style_examples: activeHeadlinePack?.headlines || [],
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

  // Single Item Import to Vertical Video Workspace
  const handleSingleImportForVideo = async (item: VaultContent) => {
    setIsImportingVideo(true);
    try {
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
          console.error('Failed to update status on single import for video:', err);
        }
      }

      let images = (item.media_paths || []).map(p => {
        if (p.startsWith('http://') || p.startsWith('https://')) {
          return p;
        }
        return `${API_BASE}/vault/media?path=${encodeURIComponent(p)}`;
      });

      if (images.length === 0 && item.source_url) {
        try {
          const scrapeRes = await fetch(`${API_BASE}/news/scrape-images`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: item.source_url })
          });
          if (scrapeRes.ok) {
            const data = await scrapeRes.json();
            if (data.success && data.images && data.images.length > 0) {
              images = data.images;
            }
          }
        } catch (err) {
          console.error('Failed to scrape images during video import:', err);
        }
      }

      const newsPayload = {
        title: item.title,
        content: item.raw_content || '',
        headline: item.selected_headline || item.title,
        images: images,
        sourceUrl: item.source_url,
        source: item.author_name || 'Vault News',
        timestamp: Date.now()
      };

      try {
        localStorage.setItem('news_to_video_payload', JSON.stringify(newsPayload));
      } catch (storageErr) {
        console.error('Failed to setItem on localStorage:', storageErr);
        try {
          localStorage.removeItem('vertical_video_batch_items');
          localStorage.setItem('news_to_video_payload', JSON.stringify(newsPayload));
          alert('⚠️ หน่วยความจำบราว์เซอร์ (Local Storage) เต็ม ระบบได้เคลียร์ประวัติคิววิดีโอเก่าออกเพื่อทำรายการต่อให้แล้วครับบอส');
        } catch (innerErr) {
          alert('❌ หน่วยความจำบราว์เซอร์เต็มอย่างรุนแรง ไม่สามารถจัดส่งข้อมูลได้ กรุณาลบประวัติหรือเคลียร์แคชบราวเซอร์ครับ');
        }
      }
      setActiveTab('vertical-video');
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการนำเข้าคลิปแนวตั้ง: ${err.message || err}`);
    } finally {
      setIsImportingVideo(false);
    }
  };

  // Batch Approve & Import to Vertical Video Workspace
  const handleBatchApproveForVideo = async () => {
    if (vaultSelectedIds.length === 0) return;
    setIsImportingVideo(true);
    try {
      const selectedItems = vaultItems.filter(item => vaultSelectedIds.includes(item.id));
      const scrapedIds = selectedItems.filter(item => item.status === 'scraped').map(item => item.id);
      
      if (scrapedIds.length > 0) {
        await fetch(`${API_BASE}/vault/contents/batch-status`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: scrapedIds, status: 'ready_for_design' })
        });
      }

      const payloadPromises = selectedItems.map(async (item) => {
        let images = (item.media_paths || []).map(p => {
          if (p.startsWith('http://') || p.startsWith('https://')) {
            return p;
          }
          return `${API_BASE}/vault/media?path=${encodeURIComponent(p)}`;
        });

        if (images.length === 0 && item.source_url) {
          try {
            const scrapeRes = await fetch(`${API_BASE}/news/scrape-images`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ url: item.source_url })
            });
            if (scrapeRes.ok) {
              const data = await scrapeRes.json();
              if (data.success && data.images && data.images.length > 0) {
                images = data.images;
              }
            }
          } catch (err) {
            console.error(`Failed to scrape images for batch item ${item.id}:`, err);
          }
        }

        return {
          title: item.title,
          content: item.raw_content || '',
          headline: item.selected_headline || item.title,
          images: images,
          sourceUrl: item.source_url,
          source: item.author_name || 'Vault News',
          timestamp: Date.now()
        };
      });

      const batchPayloads = await Promise.all(payloadPromises);
      
      try {
        localStorage.setItem('batch_news_to_video_payloads', JSON.stringify(batchPayloads));
      } catch (storageErr) {
        console.error('Failed to setItem on localStorage:', storageErr);
        try {
          localStorage.removeItem('vertical_video_batch_items');
          localStorage.setItem('batch_news_to_video_payloads', JSON.stringify(batchPayloads));
          alert('⚠️ หน่วยความจำบราว์เซอร์ (Local Storage) เต็ม ระบบได้เคลียร์ประวัติคิววิดีโอเก่าออกเพื่อทำรายการต่อให้แล้วครับบอส');
        } catch (innerErr) {
          alert('❌ หน่วยความจำบราว์เซอร์เต็มอย่างรุนแรง ไม่สามารถจัดส่งข้อมูลได้ กรุณาลบประวัติหรือเคลียร์แคชบราวเซอร์ครับ');
        }
      }
      setVaultSelectedIds([]);
      fetchVaultData();
      fetchApprovedItems();
      
      setActiveTab('vertical-video');
    } catch (err: any) {
      alert(`เกิดข้อผิดพลาดในการนำเข้ากลุ่มคลิปแนวตั้ง: ${err.message || err}`);
    } finally {
      setIsImportingVideo(false);
    }
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
        // Prioritize backend-returned headline/caption (from DB query in batch-upload)
        let headline = result.headline || '';
        let caption = result.caption || '';
        
        // Fallback to frontend state lookup if backend didn't return them
        if (!headline) {
          const matchingGraphic = contentGraphics.find((g: any) => g.file_path === result.file_path);
          if (matchingGraphic) {
            const itemId = matchingGraphic.content_id;
            const item = canvasAllItems.find(i => i.id === itemId) || canvasImportedItems.find(i => i.id === itemId);
            if (item) {
              const copywriting = item.metadata?.copywriting;
              headline = copywriting?.headline_3line?.join(' ') || item.selected_headline || item.title || '';
              if (!caption) caption = copywriting?.caption || '';
            }
          }
        }
        
        // Last resort fallback to currently selected item
        if (!headline) {
          const copywriting = canvasSelectedItem?.metadata?.copywriting;
          headline = copywriting?.headline_3line?.join(' ') || canvasSelectedItem?.selected_headline || canvasSelectedItem?.title || '';
          if (!caption) caption = copywriting?.caption || '';
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
            className={`sidebar-btn ${activeTab === 'clip-editor' ? 'active' : ''}`}
            onClick={() => setActiveTab('clip-editor')}
          >
            <Scissors className="w-5 h-5" />
            <span>✂️ ตัด/สุ่มต่อคลิป (Clip Editor)</span>
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
            className={`sidebar-btn ${activeTab === 'fb-insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('fb-insights')}
          >
            <TrendingUp className="w-5 h-5" />
            <span>📈 สถิติเพจ (FB Insights)</span>
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
              {activeTab === 'clip-editor' && '✂️ ตัด/สุ่มต่อคลิป | Single Clip Editor — Jump Cut + สุ่มต่อคลิปด้วย FFmpeg'}
              {activeTab === 'fb-insights' && '📈 สถิติเพจเฟซบุ๊ก | Dashboard สรุป Reach, Views, Engagement Rate'}
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
              {activeTab === 'clip-editor' && 'ตัดทุกคลิปในโฟลเดอร์ด้วยสูตร Scene 1 + Jump Cuts + เอฟเฟกต์ + Transition + BGM หรือสุ่มหยิบคลิปไม่ซ้ำมาต่อกันให้ได้ความยาวที่กำหนด สั่ง FFmpeg เรนเดอร์พร้อมสตรีม Log สด'}
              {activeTab === 'fb-insights' && 'ดึงสถิติ Engagement ของเพจจาก Facebook Graph API โดยตรง สรุป Reach, Page Views, Engagement และ Engagement Rate พร้อมกราฟแนวโน้มรายวัน เลือกเพจจาก Token ที่บันทึกไว้ในตั้งค่าระบบ'}
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
              onSendToVideoSuite={() => setActiveTab('vertical-video')}
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
                          disabled={isImportingVideo}
                          className="btn-neon btn-neon-cyan px-4 py-2 text-xs"
                        >
                          🟢 อนุมัติที่เลือกเพื่อส่งไปทำโพสรูป (Batch Approve)
                        </button>
                        <button 
                          onClick={handleBatchApproveForVideo}
                          disabled={isImportingVideo}
                          className="btn-neon btn-neon-purple px-4 py-2 text-xs flex items-center gap-1.5"
                        >
                          {isImportingVideo ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              กำลังส่งไปทำคลิป...
                            </>
                          ) : (
                            '🎬 อนุมัติที่เลือกเพื่อส่งไปทำคลิปแนวตั้ง (Batch Video)'
                          )}
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
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                                      <button
                                        onClick={() => handleSingleImport(item)}
                                        disabled={isImportingVideo}
                                        className="px-2.5 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/25 hover:bg-cyan-500/20 text-[10px] font-bold text-cyan-400 flex items-center gap-1 transition-all"
                                      >
                                        <span>📥 นำเข้าทำรูป</span>
                                      </button>
                                      <button
                                        onClick={() => handleSingleImportForVideo(item)}
                                        disabled={isImportingVideo}
                                        className="px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/20 text-[10px] font-bold text-purple-400 flex items-center gap-1 transition-all"
                                      >
                                        <span>🎬 ทำคลิปแนวตั้ง</span>
                                      </button>
                                    </div>
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
            <div className="space-y-6 w-full animate-fade-in">
              
              {/* ⚙️ ตั้งค่าพื้นฐาน (Basic Configurations) */}
              <div className="glass-panel p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-850 pb-2.5">
                  <h2 className="text-md font-bold text-cyan-400 flex items-center gap-2">
                    ⚙️ ตั้งค่าพื้นฐาน
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
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
                              error: 'กรุณาตั้งค่า API Key ในหน้าตั้งค่าระบบ'
                            }]);
                            setIsCheckingCredits(false);
                            return;
                          }
                          const info = await checkOpenRouterCredits(openRouterKey);
                          const keyPreview = openRouterKey.slice(0, 8) + '...' + openRouterKey.slice(-4);
                          setCreditCheckResults([{
                            label: 'OpenRouter API Key',
                            keyPreview,
                            valid: info.valid,
                            balance: info.balanceFormatted,
                            usage: `$${(Number(info.usage) || 0).toFixed(4)}`,
                            isFreeTier: info.isFreeTier,
                            keyApiLabel: info.keyLabel,
                            error: info.error,
                          }]);
                        } catch (e: any) {
                          setCreditCheckResults([{ label: 'Error', keyPreview: '-', valid: false, balance: '$0', usage: '$0', error: e.message }]);
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
                            setCreditCheckResults([{ label: 'ไม่พบ API Key', keyPreview: '-', valid: false, balance: '-', usage: '-', error: 'ไม่พบ Key' }]);
                            return;
                          }
                          const testModel = 'google/gemini-2.5-flash';
                          setCreditCheckResults([{
                            label: `🧪 กำลังทดสอบ ${testModel}...`,
                            keyPreview: String(openRouterKey || '').slice(0, 8) + '...' + String(openRouterKey || '').slice(-4),
                            valid: true,
                            balance: 'กำลังทดสอบ...',
                            usage: '-'
                          }]);
                          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${openRouterKey}`,
                              'HTTP-Referer': window.location.origin
                            },
                            body: JSON.stringify({
                              model: testModel,
                              messages: [{ role: 'user', content: 'ตอบแค่คำว่า "OK"' }],
                              max_tokens: 5
                            })
                          });
                          const data = await res.json();
                          if (res.ok && !data.error) {
                            setCreditCheckResults([{
                              label: `✅ ทดสอบ ${testModel} สำเร็จ!`,
                              keyPreview: String(openRouterKey || '').slice(0, 8) + '...' + String(openRouterKey || '').slice(-4),
                              valid: true,
                              balance: `ตอบกลับ: ${data.choices?.[0]?.message?.content || 'OK'}`,
                              usage: `Model: ${data.model || testModel}`
                            }]);
                          } else {
                            const err = data.error?.message || JSON.stringify(data.error) || `HTTP ${res.status}`;
                            setCreditCheckResults([{
                              label: `❌ ทดสอบ ${testModel} ล้มเหลว`,
                              keyPreview: String(openRouterKey || '').slice(0, 8) + '...' + String(openRouterKey || '').slice(-4),
                              valid: false,
                              balance: '-',
                              usage: '-',
                              error: err
                            }]);
                          }
                        } catch (e: any) {
                          setCreditCheckResults([{ label: 'Error', keyPreview: '-', valid: false, balance: '-', usage: '-', error: e.message }]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-800/85 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      🧪 ทดสอบ API
                    </button>
                  </div>
                </div>

                {creditCheckResults.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-cyan-400">🔑 ผลตรวจวิเคราะห์ OpenRouter API Key</h3>
                      <button onClick={() => setCreditCheckResults([])} className="text-[10px] text-slate-500 hover:text-slate-300">
                        ✕ ปิดแผง
                      </button>
                    </div>
                    <div className="space-y-2">
                      {creditCheckResults.map((r, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border text-xs ${r.valid ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                          <div className="flex items-center gap-2 font-bold mb-2">
                            <span>{r.valid ? '✅' : '❌'}</span>
                            <span className={r.valid ? 'text-emerald-400' : 'text-red-400'}>{r.label}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 space-y-1 ml-6">
                            <div>Key Preview: <span className="text-slate-300 font-mono">{r.keyPreview}</span></div>
                            {r.valid ? (
                              <>
                                {r.isFreeTier && <div>⚠️ Tier: <span className="text-amber-400 font-bold">Free Tier (จำกัดการเรียกใช้งาน)</span></div>}
                                {!r.isFreeTier && <div>Tier: <span className="text-emerald-400 font-semibold">Paid Tier (ใช้งานปกติ)</span></div>}
                                <div>ยอดเงินคงเหลือ: <span className="text-emerald-400 font-bold">{r.balance}</span></div>
                                <div>ใช้งานไปแล้ว: <span className="text-yellow-400 font-semibold">{r.usage}</span></div>
                              </>
                            ) : (
                              <div className="text-red-400">ข้อผิดพลาด: {r.error}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* ☁️ Dropbox Integration Settings */}
                <div style={{ marginBottom: '20px', padding: '14px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px solid rgba(51,65,85,0.3)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>☁️ Dropbox Integration</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>🔑 Dropbox Access Token</label>
                      <input
                        type="password"
                        value={dropboxToken}
                        onChange={(e) => {
                          setDropboxToken(e.target.value);
                          localStorage.setItem('dropbox_token', e.target.value);
                        }}
                        placeholder="sl.xxxxxxxx..."
                        style={{
                          width: '100%',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(51,65,85,0.5)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '10px',
                          color: '#e2e8f0',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>📁 Dropbox Folder Path</label>
                      <input
                        type="text"
                        value={dropboxFolder}
                        onChange={(e) => {
                          setDropboxFolder(e.target.value);
                          localStorage.setItem('dropbox_folder', e.target.value);
                        }}
                        placeholder="/ContentFactory/exports"
                        style={{
                          width: '100%',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(51,65,85,0.5)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '10px',
                          color: '#e2e8f0',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ⚙️ Canvas Designer Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left column options */}
                <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
                  <div className="space-y-1.5 text-left">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowStylesManager(true)}
                        className="text-[9px] font-extrabold text-cyan-400 hover:text-white px-2 py-0.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded transition-all flex items-center gap-1 cursor-pointer"
                      >
                        ➕ เพิ่ม/จัดการสไตล์
                      </button>
                    </div>
                    <select
                      value={canvasWritingStyle}
                      onChange={(e) => setCanvasWritingStyle(e.target.value)}
                      className="glass-input h-10 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer w-full"
                    >
                      {allWritingStyles.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>📢 รูปแบบพาดหัวโพสต์ (Headline Pack)</span>
                    </label>
                    <select
                      value={canvasHeadlineStyle}
                      onChange={(e) => setCanvasHeadlineStyle(e.target.value)}
                      className="glass-input h-10 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer w-full"
                    >
                      <option value="">-- เลือกสไตล์พาดหัว --</option>
                      {PALETTE_HEADLINE_STYLES.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="border-t border-slate-850/40 my-2 pt-2" />

                  <div className="flex items-center justify-between pb-2 border-b border-slate-850/40">
                    <label className="text-xs font-semibold text-slate-300 block">🏷️ ตราประทับ (Logo)</label>
                    <label className="flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={canvasShowPageLogo}
                        onChange={(e) => setCanvasShowPageLogo(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-750 text-cyan-500 accent-cyan-400 bg-slate-950/80 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-slate-300">แสดงโลโก้บนภาพ</span>
                    </label>
                  </div>

                  <button
                    onClick={() => document.getElementById('canvas-logo-uploader-basic')?.click()}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, #f97316, #f59e0b, #f97316)',
                      color: '#0a0a0a',
                      border: '2px solid #fb923c',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)',
                      fontWeight: 900,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    <span>🔗 อัพโหลดโลโก้ใหม่</span>
                  </button>
                  <input
                    type="file"
                    id="canvas-logo-uploader-basic"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />

                  {savedLogos.length > 0 && (
                    <div style={{ padding: '8px', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', border: '1px solid rgba(51,65,85,0.3)' }}>
                      <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>📁 โลโก้ที่บันทึกไว้ — คลิกเพื่อเลือก:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {savedLogos.map((logo) => {
                          const isSelected = canvasLogoUrl === logo.url;
                          return (
                            <div key={logo.name} style={{ position: 'relative' }} className="group">
                              <button
                                type="button"
                                onClick={() => {
                                  setCanvasLogoUrl(logo.url);
                                  if (rememberLogo) {
                                    localStorage.setItem('canvas_logo_url', logo.url);
                                  }
                                }}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '10px',
                                  border: isSelected ? '2px solid #22d3ee' : '2px solid rgba(51, 65, 85, 0.5)',
                                  background: isSelected ? 'rgba(34, 211, 238, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: isSelected ? '0 0 8px rgba(34, 211, 238, 0.3)' : 'none'
                                }}
                                title={logo.name}
                              >
                                <img src={`${API_BASE}${logo.url}`} alt={logo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteLogo(logo.name);
                                }}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700"
                                title="ลบโลโก้นี้"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {isSelected && (
                                <div style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', fontSize: '7px', fontWeight: 900, color: '#22d3ee', whiteSpace: 'nowrap' }}>
                                  ✓ เลือก
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canvasShowPageLogo && (
                    <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.04)', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#67e8f9', margin: 0 }}>⚙️ ตั้งค่าโลโก้</p>
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>📏 ขนาด</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#e2e8f0' }}>{canvasLogoSize}%</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="30"
                          value={canvasLogoSize}
                          onChange={(e) => setCanvasLogoSize(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#22d3ee', height: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>↔️ ระยะขอบแนวนอน</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#e2e8f0' }}>{canvasLogoMarginX}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={canvasLogoMarginX}
                          onChange={(e) => setCanvasLogoMarginX(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#22d3ee', height: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>↕️ ระยะขอบแนวตั้ง</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#e2e8f0' }}>{canvasLogoMarginY}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={canvasLogoMarginY}
                          onChange={(e) => setCanvasLogoMarginY(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#22d3ee', height: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>📌 มุมที่จัดวาง</span>
                        </div>
                        <select
                          value={canvasLogoCorner}
                          onChange={(e) => setCanvasLogoCorner(e.target.value as any)}
                          style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', color: '#e2e8f0' }}
                        >
                          <option value="top-right">↗️ บนขวา (Top Right)</option>
                          <option value="top-left">↖️ บนซ้าย (Top Left)</option>
                          <option value="bottom-right">↘️ ล่างขวา (Bottom Right)</option>
                          <option value="bottom-left">↙️ ล่างซ้าย (Bottom Left)</option>
                        </select>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={rememberLogo}
                          onChange={(e) => {
                            setRememberLogo(e.target.checked);
                            if (e.target.checked && canvasLogoUrl) {
                              localStorage.setItem('canvas_logo_url', canvasLogoUrl);
                            } else {
                              localStorage.removeItem('canvas_logo_url');
                            }
                          }}
                          style={{ width: '12px', height: '12px' }}
                        />
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>จดจำโลโก้นี้ไว้ใช้ครั้งถัดไป</span>
                      </label>
                    </div>
                  )}

                  {/* Premium overlays option panel */}
                  <div className="md:col-span-2 space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                      <Cpu className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white">🧩 ออปชันตกแต่งภาพซ้อนหลังแบบพรีเมียม (Premium Overlays)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Badge Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">✨ แสดง Badge (แบรนด์ไอคอน)</span>
                          <input
                            type="checkbox"
                            checked={canvasShowBadge}
                            onChange={(e) => setCanvasShowBadge(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowBadge && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <div>
                              <span className="text-[9px] text-slate-400 font-bold">สไตล์ของป้าย</span>
                              <select
                                value={canvasBadgeStyle}
                                onChange={(e) => setCanvasBadgeStyle(e.target.value)}
                                className="w-full text-[10px] px-2 py-1 mt-1 rounded bg-slate-900 border border-slate-800 text-white cursor-pointer"
                              >
                                <option value="dev-pick">⭐ Editor's Pick</option>
                                <option value="tech-focus">🔥 Hot Topic</option>
                                <option value="editorial">📢 Breaking News</option>
                                <option value="youtube-channel">▶️ YouTube Channel</option>
                              </select>
                            </div>

                            {canvasBadgeStyle === 'youtube-channel' ? (
                              <div className="p-2 bg-red-955/20 rounded border border-red-900/30">
                                <p className="text-[9px] text-red-400 font-bold">▶️ ดึงข้อมูลอัตโนมัติจากบทความที่เลือก</p>
                                <p className="text-[8px] text-slate-450 mt-1">
                                  {canvasSelectedItem?.author_name
                                    ? `📺 ${canvasSelectedItem.author_name} — ${canvasSelectedItem.metadata?.subscribers_formatted || canvasSelectedItem.author_followers || 'N/A'} ผู้ติดตาม`
                                    : '⚠️ ยังไม่มีข้อมูลช่อง — เลือกบทความที่มีข้อมูล YouTube'}
                                </p>
                              </div>
                            ) : (
                              <>
                                <input
                                  type="text"
                                  value={canvasBadgeText}
                                  onChange={(e) => setCanvasBadgeText(e.target.value)}
                                  placeholder="เช่น AI"
                                  className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                                />
                                <input
                                  type="text"
                                  value={canvasBadgeSubtext}
                                  onChange={(e) => setCanvasBadgeSubtext(e.target.value)}
                                  placeholder="เช่น Content Lab"
                                  className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                                />
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Callout Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">📢 แสดง Callout (ป้ายคำพูดสติกเกอร์)</span>
                          <input
                            type="checkbox"
                            checked={canvasShowCallout}
                            onChange={(e) => setCanvasShowCallout(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowCallout && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasCalloutText}
                              onChange={(e) => setCanvasCalloutText(e.target.value)}
                              placeholder="คำอธิบาย..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasCalloutHighlight}
                              onChange={(e) => setCanvasCalloutHighlight(e.target.value)}
                              placeholder="คำเน้นสีเหลือง..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Meme Frame Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">🎭 แสดง Meme Text Overlay</span>
                          <input
                            type="checkbox"
                            checked={canvasShowMeme}
                            onChange={(e) => setCanvasShowMeme(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowMeme && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasMemeText}
                              onChange={(e) => setCanvasMemeText(e.target.value)}
                              placeholder="เช่น เร็วกว่าเดิม"
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasMemeSubtext}
                              onChange={(e) => setCanvasMemeSubtext(e.target.value)}
                              placeholder="เช่น AI ช่วยย่นเวลา"
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* News Strap Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">📰 แสดงแถบข้อมูลข่าว (News Card Overlay)</span>
                          <input
                            type="checkbox"
                            checked={canvasShowNewsCard}
                            onChange={(e) => setCanvasShowNewsCard(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowNewsCard && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasNewsTitle}
                              onChange={(e) => setCanvasNewsTitle(e.target.value)}
                              placeholder="หัวข้อข่าว..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasNewsDetail}
                              onChange={(e) => setCanvasNewsDetail(e.target.value)}
                              placeholder="คำบรรยายย่อข่าว..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column options */}
                <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">📐 สเกลสัดส่วนโพสต์ (Aspect Ratio)</label>
                    <select
                      className="glass-input h-11 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer"
                      value={canvasRatio}
                      onChange={(e) => setCanvasRatio(e.target.value as any)}
                    >
                      <option value="1:1">⬜ 1:1 — สี่เหลี่ยมจัตุรัส (Instagram / Facebook Post)</option>
                      <option value="4:5">📱 4:5 — แนวตั้งสั้น (Instagram Portrait / Ads)</option>
                      <option value="4:3">🖥️ 4:3 — แนวนอนสั้น (Presentation / Blog)</option>
                      <option value="16:9">🎬 16:9 — แนวนอนกว้าง (YouTube Thumbnail / Website)</option>
                      <option value="9:16">📲 9:16 — แนวตั้งยาว (IG Story / Reels / Shorts / TikTok)</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-850/40 my-1" />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">🎨 รูปแบบโครงร่างกระดาษ (Layout Template)</label>
                    <select
                      className="glass-input h-11 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer"
                      value={canvasLayout}
                      onChange={(e) => setCanvasLayout(e.target.value)}
                    >
                      <option value="top_gainers">🔥 ไวรัลไทย (Top Gainers - Grid Split)</option>
                      <option value="ai_news">🔴 สรุปข่าวไอที (AI News - Header Strap)</option>
                      <option value="github">💻 ซอฟต์แวร์ (GitHub Tech - Code strap)</option>
                      <option value="quotes">💬 คำวิจารณ์กูรู (Quotes - Quote Card)</option>
                      <option value="youtube">🎥 สารคดี (YouTube Style - Dark Overlay)</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-850/40 my-1" />

                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 leading-snug">ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูลและภาพที่ Render เสร็จสิ้น</p>
                    <div className="grid grid-cols-1 gap-2.5 mt-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
                            setExportDirHandle(dirHandle);
                            setExportFolderName(dirHandle.name);
                            localStorage.setItem('canvas_export_folder_name', dirHandle.name);
                          } catch (e: any) {
                            if (e.name === 'AbortError') return;
                            console.error('Folder picker error:', e);
                            alert('❌ ไม่สามารถเลือกโฟลเดอร์ได้: ' + e.message);
                          }
                        }}
                        className={`w-full py-3 px-3 rounded-lg border text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          exportFolderName
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-md shadow-emerald-500/10'
                            : 'bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-600/20 hover:from-emerald-500 hover:to-emerald-400 text-emerald-400 hover:text-slate-950 border border-emerald-500/50 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40'
                        }`}
                      >
                        <FolderOpen className={`w-4 h-4 ${exportFolderName ? 'text-emerald-400' : 'text-emerald-300'}`} />
                        <span>
                          {exportFolderName ? `📁 โฟลเดอร์ที่เลือก: ${exportFolderName}` : '📂 คลิกเพื่อเลือกโฟลเดอร์ปลายทาง'}
                        </span>
                      </button>

                      {/* Export / Save to Local Button */}
                      <button
                        type="button"
                        onClick={handleExportLocal}
                        disabled={!exportDirHandle}
                        className={`w-full py-3 px-3 rounded-lg border text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          canvasSelectedIds.length > 0
                            ? 'bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 text-slate-950 border-green-300 shadow-[0_0_30px_rgba(34,197,94,0.8)] hover:shadow-[0_0_40px_rgba(34,197,94,1)]'
                            : 'bg-slate-800/40 text-slate-500 cursor-not-allowed border border-slate-700/20'
                        }`}
                      >
                        <Download className="w-4 h-4 shrink-0" />
                        <span>🚀 เริ่มบันทึกไฟล์และรูปภาพ</span>
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">
                      {canvasSelectedIds.length > 0
                        ? `📌 จะส่งออก ${canvasSelectedIds.length} รายการที่เลือก`
                        : `📦 จะส่งออกทุกรายการที่ Import (${canvasImportedItems.length} รายการ)`
                      }
                    </p>
                  </div>
                </div>

                {/* Swatches theme palette Selection */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-400 mb-3">
                    🌈 เลือกธีมสีเอกลักษณ์โพสต์รูป (Visual Color Swatch Cards)
                  </label>
                  <div className="swatches-grid">
                    {PALETTE_THEMES.map((theme) => {
                      const isSelected = canvasTheme === theme.id;
                      return (
                        <div
                          key={theme.id}
                          onClick={() => setCanvasTheme(theme.id)}
                          className={`swatch-card ${isSelected ? 'active' : ''}`}
                        >
                          <div className="flex flex-col h-full justify-between">
                            <div className="swatch-header">
                              <span className="swatch-title" title={theme.name}>{theme.name}</span>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                            </div>
                            <div className="swatch-bar mt-2 flex gap-1 h-3 rounded overflow-hidden">
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.gradient[0] }} title="Gradient Start" />
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.gradient[1] }} title="Gradient End" />
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.highlight }} title="Highlight Block" />
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.secondaryHighlight }} title="Second Highlight" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Configurations parameters controls (scale, split, font family) */}
                <div className="md:col-span-2 space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-850/40">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-bold text-white">⚙️ โครงสร้างฟอนต์และสัดส่วนกราฟิก (Font & Split Configuration)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-1">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1">ฟอนต์แสดงผล (Font Family)</span>
                      <select
                        value={canvasFontFamily}
                        onChange={(e) => setCanvasFontFamily(e.target.value)}
                        className="glass-input h-9 text-xs w-full cursor-pointer bg-slate-950"
                      >
                        <option value="Kanit">Kanit (สไตล์โมเดิร์นหนา)</option>
                        <option value="Mitr">Mitr (สไตล์หัวกลมคลาสสิก)</option>
                        <option value="Prompt">Prompt (สไตล์มินิมอลสะอาด)</option>
                        <option value="Sarabun">Sarabun (สไตล์ราชการสุภาพ)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>ขนาดฟอนต์ (Font Scale)</span>
                        <span className="text-cyan-400 font-mono font-bold">{canvasFontScale}x</span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="2.0"
                        step="0.1"
                        value={canvasFontScale}
                        onChange={(e) => setCanvasFontScale(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>สัดส่วนแบ่งรูปภาพ / สี (Split Ratio)</span>
                        <span className="text-cyan-400 font-mono font-bold">{canvasImageSplit}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={canvasImageSplit}
                        onChange={(e) => setCanvasImageSplit(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1">การจัดวางแนวพาดหัว (Align)</span>
                      <select
                        value={canvasHeadlineAlign}
                        onChange={(e) => setCanvasHeadlineAlign(e.target.value as any)}
                        className="glass-input h-9 text-xs w-full cursor-pointer bg-slate-950"
                      >
                        <option value="left">⬅️ ชิดซ้าย (Left)</option>
                        <option value="center">↕️ กึ่งกลาง (Center)</option>
                        <option value="right">➡️ ชิดขวา (Right)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>ระยะขอบพาดหัว (Margin)</span>
                        <span className="text-cyan-400 font-mono font-bold">{canvasHeadlineMargin}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={canvasHeadlineMargin}
                        onChange={(e) => setCanvasHeadlineMargin(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1">ชื่อเพจ / เครดิต (Credit Text)</span>
                      <input
                        type="text"
                        value={canvasCreditText}
                        onChange={(e) => setCanvasCreditText(e.target.value)}
                        className="glass-input h-9 text-xs w-full bg-slate-950 border border-slate-800 rounded-lg px-2 text-white"
                        placeholder="วางแผนเป็น เห็นทางรวย"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* 🖼️ Live HTML Preview Section */}
              <div className="glass-panel p-5 bg-slate-950/30 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-850 mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">🖼️ Live Preview — ตัวอย่างรูปโพสต์แบบ Real-Time</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewTab('live')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        previewTab === 'live'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      🎨 HTML Preview
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab('pillow')}
                      className={`px-3 py-1 text-[10px] font-bold rounded-md transition-all ${
                        previewTab === 'pillow'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      🖨️ Pillow Output
                    </button>
                  </div>
                </div>

                {previewTab === 'live' && (() => {
                  const activeTheme = PALETTE_THEMES.find(t => t.id === canvasTheme) || PALETTE_THEMES[0];
                  const defaultContent = {
                    headline: 'เลือกไอเดียเพื่อดูพรีวิว',
                    highlight: 'AI Content'
                  };
                  const displayHeadline = (canvasHeadlineMode === 'triple'
                    ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n')
                    : canvasHeadline) || canvasSelectedItem?.title || defaultContent.headline;
                  const displayHighlight = canvasHighlight || canvasSelectedItem?.metadata?.copywriting?.highlight || defaultContent.highlight;
                  const bgImageUrl = canvasBgImage
                    ? `${API_BASE}/vault/media?path=${encodeURIComponent(canvasBgImage)}`
                    : (canvasSelectedItem?.media_paths?.[0]
                      ? `${API_BASE}/vault/media?path=${encodeURIComponent(canvasSelectedItem.media_paths[0])}`
                      : '');

                  return (
                    <div className="flex flex-col items-center gap-4">
                      <div
                        className={`preview-canvas-container relative overflow-hidden rounded-xl border border-slate-800 shadow-2xl ${
                          canvasRatio === '1:1' ? 'aspect-square'
                            : canvasRatio === '16:9' ? 'aspect-[16/9]'
                            : canvasRatio === '9:16' ? 'aspect-[9/16]'
                            : canvasRatio === '4:5' ? 'aspect-[4/5]'
                            : 'aspect-[4/3]'
                        }`}
                        style={{ maxWidth: canvasRatio === '9:16' ? '280px' : '500px', width: '100%' }}
                      >
                        {/* Background Image */}
                        {bgImageUrl && (
                          <img
                            src={bgImageUrl}
                            alt="Preview BG"
                            style={{
                              position: 'absolute', inset: 0, width: '100%',
                              height: `${canvasImageSplit}%`, objectFit: 'cover', zIndex: 1
                            }}
                          />
                        )}

                        {/* Gradient Overlay */}
                        <div style={{
                          position: 'absolute', left: 0, right: 0, bottom: 0,
                          height: `${100 - canvasImageSplit + 15}%`,
                          background: `linear-gradient(to bottom, transparent 0%, ${activeTheme.gradient[0]} 30%, ${activeTheme.gradient[1]} 100%)`,
                          zIndex: 2
                        }} />

                        {/* Badge */}
                        {canvasShowBadge && (
                          canvasBadgeStyle === 'youtube-channel' && canvasSelectedItem ? (
                            /* YouTube Channel Card Badge */
                            <div
                              style={{
                                position: 'absolute',
                                top: '4cqw',
                                left: '4cqw',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1.5cqw',
                                background: 'rgba(0,0,0,0.75)',
                                backdropFilter: 'blur(8px)',
                                border: '0.3cqw solid rgba(255,255,255,0.15)',
                                borderRadius: '1.8cqw',
                                padding: '1.2cqw 2cqw',
                                zIndex: 15
                              }}
                            >
                              {canvasSelectedItem.author_avatar_url ? (
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
                                <span style={{ fontSize: '2cqw', fontWeight: 800, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {canvasSelectedItem.author_name || 'YouTube Channel'}
                                </span>
                                <span style={{ fontSize: '1.5cqw', fontWeight: 600, color: 'rgba(255,255,255,0.6)' }}>
                                  {canvasSelectedItem.metadata?.subscribers_formatted || (canvasSelectedItem.author_followers ? `${canvasSelectedItem.author_followers} subscribers` : 'N/A')}
                                </span>
                              </div>
                            </div>
                          ) : canvasBadgeStyle === 'youtube-channel' ? null : (
                            /* Default Badge */
                            <div className="live-badge" style={{
                              background: canvasBadgeStyle === 'dev-pick'
                                ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)'
                                : activeTheme.highlight,
                              color: canvasBadgeStyle === 'dev-pick' ? '#ffffff' : '#000000',
                              border: `0.3cqw solid ${activeTheme.highlight}`
                            }}>
                              <span className="live-badge-title">{canvasBadgeText || 'AI'}</span>
                              <span className="live-badge-subtitle">{canvasBadgeSubtext || 'Content Lab'}</span>
                            </div>
                          )
                        )}

                        {/* Logo */}
                        {canvasShowPageLogo && canvasLogoUrl && (
                          <img
                            src={`${API_BASE}${canvasLogoUrl}`}
                            alt="Logo"
                            className="live-logo-image"
                            style={{
                              width: `${canvasLogoSize}%`,
                              ...(canvasLogoCorner === 'top-right' ? { top: `${canvasLogoMarginY}px`, right: `${canvasLogoMarginX}px` } :
                                canvasLogoCorner === 'top-left' ? { top: `${canvasLogoMarginY}px`, left: `${canvasLogoMarginX}px` } :
                                canvasLogoCorner === 'bottom-right' ? { bottom: `${canvasLogoMarginY}px`, right: `${canvasLogoMarginX}px` } :
                                { bottom: `${canvasLogoMarginY}px`, left: `${canvasLogoMarginX}px` })
                            }}
                          />
                        )}

                        {/* Headline Section */}
                        <div className="live-headline-section" style={{
                          background: activeTheme.gradient[1],
                          textAlign: canvasHeadlineAlign as any || 'left'
                        }}>
                          <div className="live-headline-text" style={{ fontSize: `${4.5 * (canvasFontScale || 1)}cqw` }}>
                            {displayHeadline.split('\n').map((line, i) => {
                              // Split highlight keywords by comma
                              const keywords = (displayHighlight || '').split(',').map((k: string) => k.trim()).filter(Boolean);
                              if (keywords.length === 0) {
                                return <div key={i}>{line}</div>;
                              }
                              // Escape special regex characters and sort by length descending
                              const escaped = keywords.map((k: string) => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
                              escaped.sort((a: string, b: string) => b.length - a.length);
                              const regex = new RegExp(`(${escaped.join('|')})`, 'gi');
                              const parts = line.split(regex);
                              return (
                                <div key={i}>
                                  {parts.map((part, idx) => {
                                    const isMatch = keywords.some((k: string) => k.toLowerCase() === part.toLowerCase());
                                    if (isMatch) {
                                      return (
                                        <span key={idx} className="live-highlight-box" style={{ background: activeTheme.highlight }}>
                                          {part}
                                        </span>
                                      );
                                    }
                                    return part;
                                  })}
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Credit Text */}
                          <div className="live-credit-text border-t border-slate-950/20 pt-2 mt-2.5 text-slate-400">
                            เครดิต: {canvasCreditText || 'Coinpulse Content Lab'}
                          </div>
                        </div>

                        {/* Split Divider */}
                        <div className="live-split-divider" style={{
                          top: `${canvasImageSplit}%`,
                          background: `linear-gradient(90deg, ${activeTheme.highlight}, ${activeTheme.secondaryHighlight || activeTheme.highlight})`
                        }} />

                        {/* Backdrop Image Cycler Controls */}
                        {canvasSelectedItem && canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.length > 1 && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const paths = canvasSelectedItem.media_paths;
                                const currentIdx = paths.indexOf(canvasBgImage);
                                const prevIdx = currentIdx <= 0 ? paths.length - 1 : currentIdx - 1;
                                setCanvasBgImage(paths[prevIdx]);
                              }}
                              className="absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md font-black text-xs select-none"
                            >
                              ◀
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const paths = canvasSelectedItem.media_paths;
                                const currentIdx = paths.indexOf(canvasBgImage);
                                const nextIdx = currentIdx === -1 || currentIdx >= paths.length - 1 ? 0 : currentIdx + 1;
                                setCanvasBgImage(paths[nextIdx]);
                              }}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-300 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md font-black text-xs select-none"
                            >
                              ▶
                            </button>
                          </>
                        )}
                      </div>

                      {!canvasSelectedItem && (
                        <p className="text-[10px] text-slate-500 text-center">
                          💡 คลิกเลือกการ์ดไอเดียด้านล่างเพื่อดูตัวอย่างรูปโพสต์
                        </p>
                      )}
                    </div>
                  );
                })()}

                {previewTab === 'pillow' && (
                  <div className="text-center py-8">
                    {latestGraphic ? (
                      <div className="flex flex-col items-center gap-3">
                        <img
                          src={`${API_BASE}/vault/media?path=${encodeURIComponent(latestGraphic.file_path)}`}
                          alt="Latest Pillow Output"
                          className="max-w-full max-h-[400px] rounded-xl border border-emerald-500/30 shadow-2xl shadow-emerald-500/10 object-contain"
                        />
                        <p className="text-[10px] text-emerald-400 font-bold">🖨️ ผลลัพธ์ล่าสุดจาก Pillow Engine</p>
                      </div>
                    ) : (
                      <div className="text-slate-500">
                        <Info className="w-10 h-10 mx-auto mb-2 text-slate-700" />
                        <p className="text-xs font-bold">ยังไม่มีผลลัพธ์ Pillow</p>
                        <p className="text-[10px] text-slate-600 mt-1">กดปุ่ม "สั่งเรนเดอร์โพสรูป" เพื่อเริ่มสร้างภาพ</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 🎨 Big Batch Render Button */}
              <div className="w-full">
                <button
                  className={`w-full py-4 px-6 font-black text-sm flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] border rounded-2xl cursor-pointer ${
                    runningModule.canvas
                      ? 'bg-green-950/30 text-green-400 border-green-800/40 opacity-75 cursor-not-allowed'
                      : (!canvasSelectedItem && canvasSelectedIds.length === 0)
                        ? 'bg-slate-900/50 text-slate-500 border-slate-800/60 opacity-60 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]'
                  }`}
                  disabled={runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)}
                  onClick={async () => {
                    setContentGraphics([]);
                    setGraphicIndex(0);
                    setLatestGraphic(null);

                    const idsToRender = canvasSelectedIds.length > 0
                      ? canvasSelectedIds
                      : canvasSelectedItem
                        ? [canvasSelectedItem.id]
                        : [];

                    if (idsToRender.length === 0) return;

                    if (idsToRender.length === 1) {
                      // Single render
                      const item = canvasImportedItems.find(x => x.id === idsToRender[0]);
                      if (!item) return;
                      const q = new URLSearchParams();
                      q.append('title', item.title);
                      q.append('theme_name', canvasTheme);
                      q.append('ratio', canvasRatio);
                      q.append('layout', canvasLayout);
                      q.append('content_id', item.id);
                      q.append('font_family', canvasFontFamily);
                      q.append('font_scale', String(canvasFontScale));
                      q.append('image_split', String(canvasImageSplit));
                      q.append('headline_align', canvasHeadlineAlign);
                      q.append('headline_margin', String(canvasHeadlineMargin));

                      const copywriting = item.metadata?.copywriting;
                      let headline = item.selected_headline || item.title || '';
                      let caption = '';
                      if (canvasSelectedItem?.id === item.id) {
                        if (canvasHeadlineMode === 'triple') {
                          if (canvasHeadlineLine1 || canvasHeadlineLine2 || canvasHeadlineLine3) {
                            q.append('headline_line1', canvasHeadlineLine1);
                            q.append('headline_line2', canvasHeadlineLine2);
                            q.append('headline_line3', canvasHeadlineLine3);
                          }
                        } else {
                          headline = canvasHeadline;
                        }
                        caption = canvasCaption;
                      } else if (copywriting) {
                        if (copywriting.headline_3line && copywriting.headline_3line.length > 0) {
                          q.append('headline_line1', copywriting.headline_3line[0] || '');
                          q.append('headline_line2', copywriting.headline_3line[1] || '');
                          q.append('headline_line3', copywriting.headline_3line[2] || '');
                        } else {
                          headline = copywriting.headlines?.[0] || item.selected_headline || item.title || '';
                        }
                        caption = copywriting.caption || '';
                      }
                      q.append('headline', headline);
                      if (caption) q.append('caption', caption);

                      if (canvasSelectedItem?.id === item.id && canvasBgImage) {
                        q.append('base_image', canvasBgImage);
                      } else if (item.media_paths && item.media_paths.length > 0) {
                        q.append('base_image', item.media_paths[0]);
                      }

                      const activeHighlight = canvasSelectedItem?.id === item.id ? canvasHighlight : (copywriting?.highlight || '');
                      if (activeHighlight) q.append('highlight', activeHighlight);

                      appendCustomParams(q);
                      runModule('canvas', q.toString());
                    } else {
                      // Batch render via queue
                      setCanvasQueueIds(idsToRender);
                      setCanvasQueueIndex(0);
                    }
                  }}
                >
                  {runningModule.canvas ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                  <span>
                    {canvasQueueIndex !== null
                      ? `กำลังสร้างโพสรูปที่ ${canvasQueueIndex + 1}/${canvasQueueIds.length} ...`
                      : runningModule.canvas
                        ? 'กำลังเขียนภาพและคำนวณสัดส่วน...'
                        : canvasSelectedIds.length > 1
                          ? `🎨 สั่งเรนเดอร์โพสรูปกลุ่มจำนวน ${canvasSelectedIds.length} รายการ`
                          : '🎨 สั่งเรนเดอร์โพสรูปด้วย Pillow'
                    }
                  </span>
                </button>
              </div>

              {/* Action buttons (bulk generate and single item detail workspace) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Left panel: selected item edit/AI copywriting generator workspace */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-panel p-5 relative overflow-hidden bg-slate-950/20">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">✍️ ดีไซน์และเกลาคำโฆษณาเดี่ยว</h3>
                    </div>

                    {canvasSelectedItem ? (
                      <div className="space-y-4 pt-3 text-left">
                        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-850">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">หัวข้อคอนเทนต์ดิบ</p>
                          <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{canvasSelectedItem.title}</p>
                        </div>

                        {/* Mode selectors: single headline vs triple headlines */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">📢 โหมดคำโฆษณาพาดหัวรูปภาพ</span>
                          <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-850">
                            <button
                              type="button"
                              onClick={() => setCanvasHeadlineMode('single')}
                              className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${
                                canvasHeadlineMode === 'single'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              พาดหัวบรรทัดเดียว (Single)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCanvasHeadlineMode('triple')}
                              className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${
                                canvasHeadlineMode === 'triple'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              พาดหัว 3 บรรทัด (Triple Grid)
                            </button>
                          </div>
                        </div>

                        {/* Editable fields */}
                        {canvasHeadlineMode === 'single' ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✍️ พาดหัวภาพรูป</label>
                            <input
                              type="text"
                              value={canvasHeadline}
                              onChange={(e) => setCanvasHeadline(e.target.value)}
                              placeholder="ระบุข้อความพาดหัวรูป..."
                              className="w-full text-xs font-medium px-3 h-10 rounded-lg bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✍️ พาดหัวแบบ 3 บรรทัด (แสดงผลซ้อนแยกแถว)</label>
                            <div className="space-y-2 bg-slate-950/30 p-2.5 rounded-lg border border-slate-850/60">
                              <input
                                type="text"
                                value={canvasHeadlineLine1}
                                onChange={(e) => setCanvasHeadlineLine1(e.target.value)}
                                placeholder="บรรทัดที่ 1 (ตัวหนาสีชมพู/ขาว)..."
                                className="w-full text-xs font-medium px-2.5 h-8.5 rounded bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                              />
                              <input
                                type="text"
                                value={canvasHeadlineLine2}
                                onChange={(e) => setCanvasHeadlineLine2(e.target.value)}
                                placeholder="บรรทัดที่ 2 (ตัวหนาสีขาว)..."
                                className="w-full text-xs font-medium px-2.5 h-8.5 rounded bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                              />
                              <input
                                type="text"
                                value={canvasHeadlineLine3}
                                onChange={(e) => setCanvasHeadlineLine3(e.target.value)}
                                placeholder="บรรทัดที่ 3 (ตัวเน้นสีเหลือง)..."
                                className="w-full text-xs font-medium px-2.5 h-8.5 rounded bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🖍️ ไฮไลท์คีย์เวิร์ดพารามิเตอร์</label>
                          <input
                            type="text"
                            value={canvasHighlight}
                            onChange={(e) => setCanvasHighlight(e.target.value)}
                            placeholder="ระบุคำสำคัญที่ต้องการแยกเน้น เช่น AI, เขียนโค้ด..."
                            className="w-full text-xs font-medium px-3 h-10 rounded-lg bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">✍️ แคปชั่นสำหรับโพสต์โฆษณา</label>
                            {canvasCaption && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(canvasCaption);
                                  alert('📋 คัดลอกแคปชั่นสำเร็จ!');
                                }}
                                className="text-[9px] text-cyan-400 hover:text-white px-2 py-0.5 bg-slate-950 border border-slate-850 rounded"
                              >
                                คัดลอก
                              </button>
                            )}
                          </div>
                          <textarea
                            value={canvasCaption}
                            onChange={(e) => setCanvasCaption(e.target.value)}
                            placeholder="พิมพ์รายละเอียดสำหรับเขียนแคปชั่นโพสต์..."
                            className="w-full text-xs font-medium p-3 rounded-lg bg-slate-950 border border-slate-850 text-white min-h-[120px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none resize-y custom-scrollbar"
                          />
                        </div>

                        {/* AI actions */}
                        <div className="flex gap-2.5 pt-2 border-t border-slate-850/60">
                          <button
                            type="button"
                            disabled={generatingCopywriting}
                            onClick={handleGenerateCopywriting}
                            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                              generatingCopywriting
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-wait'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02]'
                            }`}
                          >
                            {generatingCopywriting ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
                                <span>กำลังวิเคราะห์และเขียน...</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3.5 h-3.5 text-purple-200 animate-pulse" />
                                <span>เขียนบทความและจำลองพาดหัว</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-16 text-slate-500">
                        <Info className="w-12 h-12 mx-auto mb-3.5 text-slate-700" />
                        <p className="text-xs font-bold">ยังไม่ได้เลือกรายการวัตถุดิบเดี่ยว</p>
                        <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto leading-relaxed">
                          กรุณาคลิกเลือกการ์ดหัวข้อวัตถุดิบทางด้านขวา เพื่อปรับแต่งและใช้ AI เขียนบทความทีละรายการ
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right panel: bulk generation checklist + logs + database cards flow */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Item Selector List */}
                  <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-xs font-semibold text-slate-300">
                          🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoSelectBgImages}
                          disabled={isAutoSelectingBg || canvasImportedItems.length === 0}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 border flex items-center gap-1.5 shadow-lg ${
                            isAutoSelectingBg
                              ? 'bg-slate-800 border-slate-750 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white border-cyan-500/30 hover:border-cyan-400/40 hover:shadow-cyan-500/20 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {isAutoSelectingBg ? (
                            <>
                              <span className="animate-spin rounded-full h-3 w-3 border-2 border-slate-400 border-t-transparent" />
                              <span>กำลังตรวจจับใบหน้า...</span>
                            </>
                          ) : (
                            <>
                              <span>🤖 เลือกรูปที่มีคนอัตโนมัติ (ทุกโพส)</span>
                            </>
                          )}
                        </button>
                      </div>
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
                            className="w-4 h-4 rounded border-slate-750 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                          />
                          <span className="text-[10px] font-bold text-slate-400">
                            เลือกทั้งหมดเพื่อสร้างโพสรูป ({canvasSearchFiltered.length} รายการ)
                          </span>
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
                          type="button"
                          onClick={() => setCanvasSearchQuery('')}
                          className="px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>

                    {canvasSelectedIds.length > 0 && (
                      <div className="pt-1.5 pb-2 animate-fade-in w-full">
                        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-950/80 to-indigo-950/60 p-4 shadow-2xl shadow-purple-500/10">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/10 to-indigo-500/5 pointer-events-none" />
                          <div className="relative flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/20">
                            <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                            <h3 className="text-sm font-black text-white tracking-tight">✍️ สั่ง AI เขียนบทความและพาดหัว</h3>
                            <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                              {canvasSelectedIds.length} รายการ
                            </span>
                          </div>

                          {(!canvasHeadlineStyle || !canvasWritingStyle) && (
                            <p className="text-[10px] text-amber-400/80 mb-3 flex items-center justify-center gap-1 bg-amber-500/10 border border-amber-500/20 py-2 px-3 rounded-lg text-center w-full">
                              ⚠️ กรุณาเลือกรูปแบบพาดหัวและสไตล์การเขียนที่แผงควบคุมหลัก "⚙️ Canvas Designer Controls" ด้านบนก่อนครับ
                            </p>
                          )}

                          <button
                            type="button"
                            disabled={generatingCopywriting || !canvasHeadlineStyle || !canvasWritingStyle}
                            onClick={handleBulkGenerateCopywriting}
                            className={`w-full rounded-xl py-3.5 px-5 font-black text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99] border cursor-pointer ${
                              generatingCopywriting
                                ? 'bg-green-950/30 text-green-400 border-green-800/40 opacity-75'
                                : (!canvasHeadlineStyle || !canvasWritingStyle)
                                  ? 'bg-slate-900/50 text-slate-500 border-slate-800/60 cursor-not-allowed'
                                  : 'bg-gradient-to-r from-green-500 via-emerald-400 to-green-500 text-slate-950 border-emerald-400 shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)]'
                            }`}
                          >
                            {generatingCopywriting ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin text-green-400" />
                                <span>กำลังใช้ AI เขียนบทความแบบกลุ่ม... ({canvasSelectedIds.length} รายการ)</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className={`w-5 h-5 ${(!canvasHeadlineStyle || !canvasWritingStyle) ? 'text-slate-500' : 'text-slate-950 animate-pulse'}`} />
                                <span>🪄 สั่ง AI เขียนบทความแบบกลุ่มที่เลือกทั้งหมด</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-400 font-bold">📜 AI Copywriting Logs</span>
                            <button
                              type="button"
                              onClick={() => setShowCanvasLogs(!showCanvasLogs)}
                              className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 hover:text-white"
                            >
                              {showCanvasLogs ? '🙈 ซ่อนประวัติบอท' : '👁️ แสดงประวัติบอท'}
                            </button>
                          </div>

                          {showCanvasLogs && logs.canvas && logs.canvas.length > 0 && (
                            <div className="mt-2.5 p-3 rounded-lg bg-black/80 border border-slate-850 font-mono text-[9.5px] leading-relaxed max-h-[140px] overflow-y-auto text-left scrollbar-thin">
                              {logs.canvas.map((line, idx) => (
                                <div key={idx} className="py-0.5 border-b border-slate-950/20 last:border-b-0 hover:bg-slate-900/40 text-emerald-400 flex gap-2">
                                  <span className="text-slate-600 shrink-0 font-bold">[{idx + 1}]</span>
                                  <span>{line}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="swatches-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {canvasSearchFiltered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/20 w-full col-span-2">
                          <Info className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                          <p className="text-xs font-bold text-slate-400">ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            กรุณาไปที่แท็บ <span className="text-cyan-400 font-bold">คลังวัตถุดิบคุณภาพ</span> และกดปุ่ม <span className="text-cyan-400 font-bold">📥 นำเข้าทำรูป</span> หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่
                          </p>
                        </div>
                      ) : (
                        canvasSearchFiltered.map((item) => {
                          const isSelected = canvasSelectedItem?.id === item.id;
                          const copywriting = item.metadata?.copywriting;
                          const hasCopywriting = !!copywriting;
                          const isChecked = canvasSelectedIds.includes(item.id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setCanvasSelectedItem(item);
                                if (copywriting) {
                                  setCanvasCaption(copywriting.caption || '');
                                  setCanvasHighlight(copywriting.highlight || '');
                                  if (copywriting.headline_3line && copywriting.headline_3line.length > 0) {
                                    setCanvasHeadlineLine1(copywriting.headline_3line[0] || '');
                                    setCanvasHeadlineLine2(copywriting.headline_3line[1] || '');
                                    setCanvasHeadlineLine3(copywriting.headline_3line[2] || '');
                                    setCanvasHeadlineMode('triple');
                                  } else {
                                    setCanvasHeadline(copywriting.headlines?.[0] || item.selected_headline || item.title || '');
                                    setCanvasHeadlineMode('single');
                                  }
                                } else {
                                  setCanvasHeadline(item.selected_headline || item.title || '');
                                  setCanvasHeadlineLine1('');
                                  setCanvasHeadlineLine2('');
                                  setCanvasHeadlineLine3('');
                                  setCanvasCaption('');
                                  setCanvasHighlight('');
                                  setCanvasHeadlineMode('triple');
                                }
                                if (item.media_paths && item.media_paths.length > 0) {
                                  setCanvasBgImage(item.media_paths[0]);
                                } else {
                                  setCanvasBgImage('');
                                }
                              }}
                              className={`p-4 rounded-xl border transition-all duration-200 text-left relative cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-slate-900/90 border-cyan-500 shadow-lg shadow-cyan-500/10'
                                  : isChecked
                                    ? 'bg-purple-950/20 border-purple-500/30'
                                    : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40'
                              }`}
                            >
                              <div className="absolute top-3.5 right-3.5" onClick={(e) => {
                                e.stopPropagation();
                                if (canvasSelectedIds.includes(item.id)) {
                                  setCanvasSelectedIds(canvasSelectedIds.filter(id => id !== item.id));
                                } else {
                                  setCanvasSelectedIds([...canvasSelectedIds, item.id]);
                                }
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-750 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                                />
                              </div>

                              <div className="space-y-2.5 pr-6">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider
                                  ${item.source_type === 'radar' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : ''}
                                  ${item.source_type === 'rss' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : ''}
                                  ${item.source_type === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                  ${item.source_type === 'github' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                                `}>
                                  {item.source_type}
                                </span>

                                <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{item.title}</h4>

                                <div className="flex flex-wrap gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-sans font-bold
                                    ${hasCopywriting ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}
                                  `}>
                                    {hasCopywriting ? '✅ มีบทความ AI แล้ว' : '⏳ รอคิวเขียนบทความ'}
                                  </span>

                                  {item.media_paths && item.media_paths.length > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 text-[9px] text-slate-400 font-sans">
                                      🖼️ มีเฟรมภาพ ({item.media_paths.length})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-slate-850/60 items-center justify-between" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-1.5">
                                  {hasCopywriting && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuickViewCopywriting(item);
                                        setQuickViewTab('post');
                                      }}
                                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[9px] font-black transition-all shadow-sm flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3 text-cyan-400" />
                                      <span>ดูบทความ</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = canvasImportedItems.filter(x => x.id !== item.id);
                                      setCanvasImportedItems(updatedList);
                                      if (canvasSelectedItem?.id === item.id) {
                                        setCanvasSelectedItem(null);
                                      }
                                    }}
                                    className="p-1 px-2 text-[9px] font-bold bg-slate-950 text-slate-500 rounded border border-slate-850 hover:bg-red-950/20 hover:text-red-400 hover:border-red-950/30 transition-colors"
                                  >
                                    ลบออก
                                  </button>

                                  <button
                                    type="button"
                                    disabled={runningModule.canvas}
                                    onClick={() => {
                                      const q = new URLSearchParams();
                                      q.append('title', item.title);
                                      q.append('theme_name', canvasTheme);
                                      q.append('ratio', canvasRatio);
                                      q.append('layout', canvasLayout);
                                      q.append('content_id', item.id);
                                      
                                      // Font Configuration Parameters
                                      q.append('font_family', canvasFontFamily);
                                      q.append('font_scale', String(canvasFontScale));
                                      q.append('image_split', String(canvasImageSplit));
                                      q.append('headline_align', canvasHeadlineAlign);
                                      q.append('headline_margin', String(canvasHeadlineMargin));

                                      let headline = item.selected_headline || item.title || '';
                                      let caption = '';
                                      if (isSelected) {
                                        if (canvasHeadlineMode === 'triple') {
                                          if (canvasHeadlineLine1 || canvasHeadlineLine2 || canvasHeadlineLine3) {
                                            q.append('headline_line1', canvasHeadlineLine1);
                                            q.append('headline_line2', canvasHeadlineLine2);
                                            q.append('headline_line3', canvasHeadlineLine3);
                                          }
                                        } else {
                                          headline = canvasHeadline;
                                        }
                                        caption = canvasCaption;
                                      } else if (copywriting) {
                                        if (copywriting.headline_3line && copywriting.headline_3line.length > 0) {
                                          q.append('headline_line1', copywriting.headline_3line[0] || '');
                                          q.append('headline_line2', copywriting.headline_3line[1] || '');
                                          q.append('headline_line3', copywriting.headline_3line[2] || '');
                                        } else {
                                          headline = copywriting.headlines?.[0] || item.selected_headline || item.title || '';
                                        }
                                        caption = copywriting.caption || '';
                                      }

                                      q.append('headline', headline);
                                      if (caption) q.append('caption', caption);

                                      if (isSelected && canvasBgImage) {
                                        q.append('base_image', canvasBgImage);
                                      } else if (item.media_paths && item.media_paths.length > 0) {
                                        q.append('base_image', item.media_paths[0]);
                                      }

                                      const activeHighlight = isSelected ? canvasHighlight : (copywriting?.highlight || '');
                                      if (activeHighlight) q.append('highlight', activeHighlight);

                                      // Append custom branding & overlays parameters
                                      appendCustomParams(q);

                                      runModule('canvas', q.toString());
                                    }}
                                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                  >
                                    <Play className="w-3 h-3 text-slate-100" />
                                    <span>วาดรูปภาพ</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Terminal / Process Logs */}
                  {(logs.canvas && logs.canvas.length > 1) && (
                    <div className="mt-4 p-3 rounded-xl bg-black/70 border border-slate-850 font-mono text-[9.5px] leading-relaxed max-h-[180px] overflow-y-auto scrollbar-thin">
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-900">
                        <span className="text-[10px] font-bold text-emerald-400">📟 Pillow Engine Terminal</span>
                        <button
                          type="button"
                          onClick={() => setLogs(prev => ({ ...prev, canvas: ['[SYSTEM] Terminal cleared.'] }))}
                          className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors"
                        >
                          ✕ เคลียร์
                        </button>
                      </div>
                      {logs.canvas.map((line, idx) => (
                        <div key={idx} className="py-0.5 border-b border-slate-950/20 last:border-b-0 hover:bg-slate-900/40 text-emerald-400 flex gap-2">
                          <span className="text-slate-600 shrink-0 font-bold">[{idx + 1}]</span>
                          <span>{line}</span>
                        </div>
                      ))}
                      <div ref={terminalBottoms.canvas} />
                    </div>
                  )}

                  {/* Draw output gallery preview grid */}
                  {contentGraphics.length > 0 && (
                    <div className="w-full mt-6 pt-6 border-t border-slate-800/80 animate-fade-in flex flex-col items-center">
                      <div className="flex items-center justify-between mb-3 text-left w-full">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-black text-emerald-400 uppercase tracking-wider text-left">🎯 ผลลัพธ์ (Pillow Output)</span>
                          {contentGraphics.length > 0 && (
                            <label className="flex items-center gap-1.5 cursor-pointer ml-3 bg-slate-950/40 px-2 py-0.5 rounded border border-slate-850 select-none">
                              <input
                                type="checkbox"
                                checked={contentGraphics.length > 0 && selectedGraphicIds.length === contentGraphics.length}
                                onChange={() => {
                                  if (selectedGraphicIds.length === contentGraphics.length) {
                                    setSelectedGraphicIds([]);
                                  } else {
                                    setSelectedGraphicIds(contentGraphics.map(g => g.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded border-slate-750 text-emerald-500 focus:ring-emerald-500 bg-slate-950/80 cursor-pointer accent-emerald-400"
                              />
                              <span className="text-[9px] font-bold text-slate-400">เลือกทั้งหมด ({selectedGraphicIds.length}/{contentGraphics.length})</span>
                            </label>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {contentGraphics.length > 0 && (
                            <>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!confirm(`⚠️ คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพทั้งหมดที่สร้างขึ้น (${contentGraphics.length} รูป) ออกจากระบบอย่างถาวร? (การดำเนินการนี้จะลบไฟล์จริงออกจากดิสก์ของเซิร์ฟเวอร์ด้วย)`)) {
                                    return;
                                  }
                                  try {
                                    const res = await fetch(`${API_BASE}/vault/graphics`, {
                                      method: 'DELETE'
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      setContentGraphics([]);
                                      setLatestGraphic(null);
                                      alert(`✅ ${data.message || 'เคลียร์รูปภาพสำเร็จ!'}`);
                                    } else {
                                      alert(`❌ เกิดข้อผิดพลาด: ${data.error}`);
                                    }
                                  } catch (err: any) {
                                    console.error('Failed to clear graphics:', err);
                                    alert(`❌ ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${err.message}`);
                                  }
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
                                  const selectedGraphics = contentGraphics.filter(g => selectedGraphicIds.includes(g.id));
                                  if (selectedGraphics.length === 0) {
                                    alert('⚠️ กรุณาเลือกรูปภาพที่ต้องการอัพโหลดอย่างน้อย 1 รูปก่อนครับ');
                                    return;
                                  }

                                  setIsUploadingDropbox(true);
                                  setDropboxUploadProgress('กำลังเริ่มอัพโหลด...');
                                  try {
                                    const response = await fetch(`${API_BASE}/vault/dropbox/batch-upload`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json'
                                      },
                                      body: JSON.stringify({
                                        file_paths: selectedGraphics.map(g => g.file_path),
                                        dropbox_token: dropboxToken,
                                        dropbox_folder: dropboxFolder
                                      })
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      // Check for individual upload errors
                                      const allResults = result.results || [];
                                      const failedResults = allResults.filter((r: any) => r.error);
                                      const successfulResults = allResults.filter((r: any) => !r.error);
                                      
                                      if (failedResults.length > 0) {
                                        const firstError = failedResults[0]?.error || 'Unknown error';
                                        if (successfulResults.length === 0) {
                                          alert(`❌ อัพโหลดล้มเหลวทั้งหมด (${failedResults.length} ไฟล์): ${firstError}`);
                                        } else {
                                          alert(`⚠️ อัพโหลดบางไฟล์ล้มเหลว (${failedResults.length}/${allResults.length}): ${firstError}`);
                                        }
                                      }

                                      // Build CSV from ALL results (including failed ones) so we still get headline/caption
                                      const csvRows = [['Headline', 'Caption', 'Dropbox Link'].join(',')];
                                      
                                      for (const resItem of allResults) {
                                        // Use backend-returned headline/caption directly (they come from the DB query)
                                        const headline = resItem.headline || resItem.clip_title || '';
                                        const caption = resItem.caption || '';
                                        
                                        const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
                                        csvRows.push([
                                          escapeCsv(headline),
                                          escapeCsv(caption),
                                          escapeCsv(resItem.shared_link || ''),
                                        ].join(','));
                                      }

                                      if (csvRows.length > 1) {
                                        const csvContent = '\uFEFF' + csvRows.join('\n');
                                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `content_export_${new Date().toISOString().slice(0, 10)}.csv`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                      }

                                      setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length}/${allResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                      setTimeout(() => setDropboxUploadProgress(''), 5000);
                                    } else {
                                      alert(`❌ อัพโหลดล้มเหลว: ${result.error}`);
                                    }
                                  } catch (err: any) {
                                    alert(`❌ ไม่สามารถเชื่อมต่อ Dropbox: ${err.message}`);
                                  }
                                  setIsUploadingDropbox(false);
                                }}
                                className="flex items-center gap-1 text-[10px] font-black text-cyan-400 hover:text-white bg-slate-900 border border-slate-800 rounded px-2.5 py-1 cursor-pointer transition-all hover:scale-105"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isUploadingDropbox ? 'กำลังส่ง...' : '📤 ส่งขึ้น Dropbox (Batch)'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {dropboxUploadProgress && (
                        <p className="text-[10px] text-yellow-400 font-bold mb-3 self-start animate-pulse">{dropboxUploadProgress}</p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
                        {contentGraphics.map((g, idx) => {
                          const isChecked = selectedGraphicIds.includes(g.id);
                          return (
                            <div
                              key={g.id}
                              className={`relative overflow-hidden rounded-xl border p-1.5 shadow-lg group transition-all duration-300 cursor-zoom-in ${
                                isChecked 
                                  ? 'border-emerald-500 bg-slate-900/60' 
                                  : 'border-slate-850 bg-slate-950/50 hover:border-slate-700'
                              }`}
                              onClick={() => {
                                const dbItem = canvasImportedItems.find(x => x.id === g.content_id);
                                setLightboxItem(dbItem || null);
                                setLightboxImage(`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`);
                              }}
                            >
                              {/* Checkbox overlay */}
                              <div className="absolute top-2.5 left-2.5 z-20">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={() => {
                                    setSelectedGraphicIds(prev => 
                                      prev.includes(g.id) ? prev.filter(x => x !== g.id) : [...prev, g.id]
                                    );
                                  }}
                                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 bg-slate-950/80 cursor-pointer accent-emerald-400 shadow-md"
                                />
                              </div>
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
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {runningModule.canvas && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5 mt-4">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังเขียนภาพโพสรูปและบันทึกข้อมูลเข้าSQLite...</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS PORTAL */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6">
              <SettingsPortal appScale={appScale} setAppScale={setAppScale} onGoToInsights={() => setActiveTab('fb-insights')} />
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
                borderRadius: '12px',
                background: 'transparent'
              }}
              title="Sync Master Dashboard"
              className="animate-fade-in"
            />
          )}

          {/* TAB 5: PROMPT GENERATION PORTAL */}
          {activeTab === 'prompt-generator' && (
            <PromptGeneratorPortal />
          )}

          {/* TAB 6: VERTICAL VIDEO SUITE PORTAL */}
          {activeTab === 'vertical-video' && (
            <VerticalVideoSuitePortal />
          )}

          {/* TAB 7: QUOTE VIDEO PORTAL */}
          {activeTab === 'quote-video' && (
            <QuoteVideoPortal />
          )}

          {/* TAB 8: AVATAR VERTICAL CLIP PORTAL */}
          {activeTab === 'avatar-video' && (
            <AvatarVerticalClipPortal />
          )}

          {/* TAB 9: FLOW AUTOMATOR / DROPBOX CSV */}
          {activeTab === 'dropbox-csv' && (
            <FlowAutomatorPortal />
          )}

          {/* TAB 10: PODCAST VIDEO PORTAL */}
          {activeTab === 'podcast-clip' && (
            <PodcastVideoPortal />
          )}

          {/* TAB 11: SINGLE CLIP EDITOR (ตัด/สุ่มต่อคลิป) */}
          {activeTab === 'clip-editor' && (
            <SingleClipEditorPortal />
          )}

          {/* TAB 12: FACEBOOK ENGAGEMENT DASHBOARD */}
          {activeTab === 'fb-insights' && (
            <EngagementDashboardPortal />
          )}

        </div>
      </main>

      {/* 🔮 AI COPYWRITING VIEW MODAL */}
      {quickViewCopywriting && quickViewCopywriting.metadata?.copywriting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">AI Copywriting Viewer</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{quickViewCopywriting.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickViewCopywriting(null)}
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition-all text-xs font-black"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex bg-slate-950/40 p-1.5 border-b border-slate-850/60 gap-1.5">
              <button
                type="button"
                onClick={() => setQuickViewTab('post')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  quickViewTab === 'post'
                    ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                ✍️ บทความโพสต์ (Post Caption)
              </button>
              <button
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
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {quickViewTab === 'post' ? (
                <div className="space-y-4">
                  <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-850 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">✍️ คำโฆษณาโพสต์</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(quickViewCopywriting.metadata.copywriting.caption);
                          alert('📋 คัดลอกแคปชั่นโพสต์สำเร็จ!');
                        }}
                        className="text-[10px] font-extrabold text-cyan-400 hover:text-white px-2 py-0.5 bg-slate-900 border border-slate-800 rounded transition-all"
                      >
                        คัดลอกแคปชั่น
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {quickViewCopywriting.metadata.copywriting.caption}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">💬 ชุดคอมเม้นท์ดันโพสต์ (FOMO Comments)</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {quickViewCopywriting.metadata.copywriting.comments.map((comment: string, idx: number) => (
                        <div key={idx} className="bg-slate-950/20 p-3 rounded-lg border border-slate-850/80 text-[11px] leading-relaxed relative">
                          <div className="flex items-center justify-between mb-1 text-[9px] font-black text-slate-400 tracking-wider">
                            <span>💬 เม้นท์ที่ {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(comment);
                                alert(`📋 คัดลอกคอมเม้นท์ที่ ${idx + 1} สำเร็จ!`);
                              }}
                              className="text-[9px] text-cyan-400 hover:text-white bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5"
                            >
                              คัดลอก
                            </button>
                          </div>
                          <p className="text-slate-300 font-medium">{comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {quickViewCopywriting.metadata.copywriting.headline_3line ? (
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850/40 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📢 พาดหัว 3 บรรทัดต้นฉบับ (3-Line Headlines)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const h3 = quickViewCopywriting.metadata.copywriting.headline_3line;
                            setCanvasHeadlineLine1(h3[0] || '');
                            setCanvasHeadlineLine2(h3[1] || '');
                            setCanvasHeadlineLine3(h3[2] || '');
                            setCanvasHeadlineMode('triple');
                            alert('🎨 นำพาดหัว 3 บรรทัดเข้าสู่ห้องควบคุมดีไซน์เรียบร้อย!');
                          }}
                          className="text-[10px] font-bold text-purple-400 hover:text-white bg-slate-900 px-2 py-0.5 border border-slate-800 rounded transition-all"
                        >
                          นำไปจัดวางรูป
                        </button>
                      </div>
                      <div className="space-y-2 pt-1">
                        {quickViewCopywriting.metadata.copywriting.headline_3line.map((line: string, idx: number) => (
                          <div key={idx} className="flex gap-3 items-center text-xs font-bold text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-pink-500 shadow-sm shadow-pink-500/30' : idx === 1 ? 'bg-slate-200' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} />
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide w-14 shrink-0">Line {idx + 1}:</span>
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

      {/* 🖼️ IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
          style={{ background: 'rgba(2, 6, 23, 0.92)', backdropFilter: 'blur(12px)' }}
          onClick={() => setLightboxImage(null)}
        >
          <div 
            style={{
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.08)',
              display: 'flex',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: Image */}
            <div style={{ flex: '0 0 55%', maxWidth: '55%', background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' }}>
              <img 
                src={lightboxImage} 
                alt="Render Output" 
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)' }} 
              />
            </div>

            {/* Right side: Meta Details */}
            <div style={{ flex: '1', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(51, 65, 85, 0.6)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: 10
                }}
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'linear-gradient(90deg, #06b6d4, #22d3ee)', color: '#0a0a0a', padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>
                  ✨ ผลงานสำเร็จ
                </div>
                <span style={{ fontSize: '10px', color: '#475569' }}>
                  {lightboxItem?.source_type === 'youtube' ? '▶️ YouTube' : '📰 Content'}
                </span>
              </div>

              <div>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>📌 พาดหัว</p>
                <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(34, 211, 238, 0.15)', borderRadius: '10px', padding: '12px 14px' }}>
                  {lightboxItem?.metadata?.copywriting?.headline_3line?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {lightboxItem?.metadata?.copywriting?.headline_3line?.map((hLine: string, hIdx: number) => (
                        <p key={hIdx} style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
                          {hLine}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1.4 }}>
                      {lightboxItem?.selected_headline || lightboxItem?.title || 'ไม่มีพาดหัว'}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>📝 บทความโพส</p>
                  {lightboxItem?.metadata?.copywriting?.caption && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(lightboxItem.metadata.copywriting.caption);
                        alert('📋 คัดลอกแคปชั่นสำเร็จ!');
                      }}
                      style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#4ade80',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📋 คัดลอก
                    </button>
                  )}
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.4)', borderRadius: '10px', padding: '14px', maxHeight: '280px', overflowY: 'auto' }}>
                  {lightboxItem?.metadata?.copywriting?.caption ? (
                    <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {lightboxItem.metadata.copywriting.caption}
                    </p>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontStyle: 'italic' }}>
                      ⚠️ ยังไม่มีบทความโพส — กรุณากดเขียนบทความก่อน
                    </p>
                  )}
                </div>
              </div>

              {lightboxItem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(51, 65, 85, 0.3)' }}>
                  {lightboxItem.author_avatar_url && (
                    <img 
                      src={`${API_BASE}/vault/media?path=${encodeURIComponent(lightboxItem.author_avatar_url)}`} 
                      alt="" 
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(51, 65, 85, 0.5)' }} 
                    />
                  )}
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', margin: 0 }}>
                      {lightboxItem.author_name || 'Unknown'}
                    </p>
                    {lightboxItem.author_followers && (
                      <p style={{ fontSize: '8px', color: '#475569', margin: 0 }}>
                        {lightboxItem.metadata?.subscribers_formatted || lightboxItem.author_followers} ผู้ติดตาม
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📝 CUSTOM WRITING STYLES MANAGER MODAL */}
      {showStylesManager && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in text-left">
          <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">จัดการสไตล์และสำนวนการเขียน (Writing Styles Studio)</h3>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">เพิ่มตัวอย่างข้อความที่ต้องการให้ AI เลียนแบบรูปแบบโครงสร้างการเขียน</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStylesManager(false);
                  setNewStyleName('');
                  setNewStyleDesc('');
                  setNewStyleExamples(['']);
                }}
                className="w-7 h-7 rounded-lg bg-slate-900 border border-slate-850 hover:bg-slate-850 text-slate-400 hover:text-white flex items-center justify-center transition-all text-xs font-black"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-6">
              {/* Form to Add New Style */}
              <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850 space-y-4">
                <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider">➕ เพิ่มสำนวนการเขียนใหม่ (Add Custom Style)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">ชื่อสำนวน/สไตล์:</label>
                    <input
                      type="text"
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      placeholder="เช่น สำนวนขายด่วนเน้นแชร์ทริค"
                      className="glass-input h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400 font-bold block">คำอธิบายสไตล์การเขียน:</label>
                    <input
                      type="text"
                      value={newStyleDesc}
                      onChange={(e) => setNewStyleDesc(e.target.value)}
                      placeholder="เช่น สไตล์เป็นกันเอง พูดจาสุภาพ ชวนกดติดตามตอนท้าย"
                      className="glass-input h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] text-slate-400 font-bold block">
                      ตัวอย่างข้อความที่ต้องการให้เลียนแบบ (Copywriting Example Templates):
                    </label>
                    <button
                      type="button"
                      onClick={() => setNewStyleExamples([...newStyleExamples, ''])}
                      className="px-2.5 py-1 rounded bg-cyan-950/40 text-cyan-400 hover:bg-cyan-900/60 border border-cyan-800/40 hover:border-cyan-700 text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      ➕ เพิ่มตัวอย่างสำนวนที่ {newStyleExamples.length + 1}
                    </button>
                  </div>

                  <div className="space-y-3">
                    {newStyleExamples.map((example, idx) => (
                      <div key={idx} className="space-y-1 bg-slate-950/20 p-3 rounded-lg border border-slate-850 flex flex-col gap-2 relative">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400">
                            ตัวอย่างสำนวนที่ {idx + 1}
                          </span>
                          {newStyleExamples.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setNewStyleExamples(newStyleExamples.filter((_, i) => i !== idx));
                              }}
                              className="text-[10px] text-red-400 hover:text-red-300 font-bold flex items-center gap-1 cursor-pointer"
                            >
                              ✕ ลบ
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={5}
                          value={example}
                          onChange={(e) => {
                            const updated = [...newStyleExamples];
                            updated[idx] = e.target.value;
                            setNewStyleExamples(updated);
                          }}
                          placeholder={`พิมพ์หรือวางตัวอย่างโพสต์แบบที่ ${idx + 1} ที่นี่...`}
                          className="glass-input text-xs py-2 h-auto"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      const filteredExamples = newStyleExamples.map(ex => ex.trim()).filter(Boolean);
                      if (!newStyleName.trim() || filteredExamples.length === 0) {
                        alert('กรุณากรอกชื่อสไตล์และข้อความตัวอย่างอย่างน้อย 1 ตัวอย่างครับ');
                        return;
                      }
                      const newStyle: WritingStyle = {
                        id: `custom_${Date.now()}`,
                        name: `⭐ ${newStyleName.trim()}`,
                        desc: newStyleDesc.trim() || 'สำนวนที่กำหนดเอง',
                        content: filteredExamples[0] || '',
                        examples: filteredExamples
                      };
                      const updated = [...customWritingStyles, newStyle];
                      setCustomWritingStyles(updated);
                      localStorage.setItem('custom_writing_styles', JSON.stringify(updated));
                      setNewStyleName('');
                      setNewStyleDesc('');
                      setNewStyleExamples(['']);
                      alert('💾 บันทึกสำนวนใหม่เรียบร้อยแล้ว!');
                    }}
                    className="btn-neon btn-neon-cyan px-5 py-2 text-xs flex items-center gap-1.5"
                  >
                    <span>💾 บันทึกสำนวนนี้</span>
                  </button>
                </div>
              </div>

              {/* List of Existing Styles */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider text-left">📋 รายการสำนวนการเขียนทั้งหมดในระบบ</h4>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                  {[...PALETTE_WRITING_STYLES, ...customWritingStyles].map((style) => {
                    const isSystem = PALETTE_WRITING_STYLES.some(s => s.id === style.id);
                    const isExpanded = expandedStyleId === style.id;
                    return (
                      <div
                        key={style.id}
                        className="p-3 bg-slate-950/20 border border-slate-850 rounded-xl hover:border-slate-700/80 transition-all flex flex-col gap-2"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="text-left flex-1 cursor-pointer" onClick={() => setExpandedStyleId(isExpanded ? null : style.id)}>
                            <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                              {style.name}
                              {isSystem ? (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-bold border border-slate-700/60 uppercase">System</span>
                              ) : (
                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-400 font-bold border border-cyan-800/40 uppercase">Custom</span>
                              )}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">{style.desc}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setExpandedStyleId(isExpanded ? null : style.id)}
                              className="text-[10px] text-slate-400 hover:text-white px-2 py-1 bg-slate-900 border border-slate-800 rounded-md transition-all font-bold"
                            >
                              {isExpanded ? '🔺 ซ่อนตัวอย่าง' : '👁️ ดูตัวอย่าง'}
                            </button>
                            {!isSystem && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm(`คุณแน่ใจว่าต้องการลบสไตล์การเขียน "${style.name}" หรือไม่?`)) return;
                                  const updated = customWritingStyles.filter(s => s.id !== style.id);
                                  setCustomWritingStyles(updated);
                                  localStorage.setItem('custom_writing_styles', JSON.stringify(updated));
                                }}
                                className="w-8 h-8 rounded-lg bg-red-950/20 hover:bg-red-950/50 border border-red-900/30 hover:border-red-800 text-red-450 flex items-center justify-center transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 p-3 bg-slate-950/80 rounded-lg border border-slate-900 text-left relative space-y-4">
                            <span className="absolute right-2.5 top-2.5 text-[8px] font-bold text-slate-500 uppercase tracking-widest">Example Contents</span>
                            {(style.examples && style.examples.length > 0 ? style.examples : [style.content]).map((exampleText, exIdx) => (
                              <div key={exIdx} className="space-y-1 border-b border-slate-850/50 pb-2 last:border-0 last:pb-0">
                                <span className="text-[8px] font-extrabold text-cyan-400 block mb-1">ตัวอย่างสำนวนที่ {exIdx + 1}:</span>
                                <pre className="text-[10px] text-emerald-400 leading-relaxed font-mono whitespace-pre-wrap word-break-break-word pr-16">{exampleText}</pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-850/80 flex justify-end bg-slate-950/20">
              <button
                type="button"
                onClick={() => {
                  setShowStylesManager(false);
                  setNewStyleName('');
                  setNewStyleDesc('');
                  setNewStyleExamples(['']);
                }}
                className="btn-neon btn-neon-cyan px-6 py-2 text-xs"
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
