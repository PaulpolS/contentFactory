Created At: 2026-05-27T16:22:18Z
Completed At: 2026-05-27T16:22:18Z
The following changes were made by the replace_file_content tool to: /Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx. If relevant, proactively run terminal commands to execute this code for the USER. Don't ask for permission.
[diff_block_start]
@@ -2655,148 +2655,74 @@
                           <label className="flex items-center gap-2 cursor-pointer select-none">
                             <input 
                               type="checkbox" 
-                              checked={canvasSearchFiltered.length > 0 && canvasSelectedIds.length === canvasSearchFiltered.length}
-                              onChange={() => {
-                                if (canvasSelectedIds.length === canvasSearchFiltered.length) {
-                                  setCanvasSelectedIds([]);
-                                } else {
-                                  setCanvasSelectedIds(canvasSearchFiltered.map(i => i.id));
-                                }
-                              }}
-                              className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
-                            />
-                            <span className="text-[10px] font-bold text-slate-400">เลือกทั้งหมดเพื่อสร้างโพสรูป ({canvasSearchFiltered.leng
---

### 🔴 ปัญหาที่ 2: Text Wrapping ไม่ตรงกัน — Browser CSS vs Pillow ThaiSyllableWrapper

**Live Preview (CSS)**: ใช้ `\n` → `display: block` → แสดงผล **3 บรรทัดเป๊ะ**

**Pillow (Python)**: `ThaiSyllableWrapper.wrap_text()` แยกตาม `\n` แล้ว **ตัดแต่ละ paragraph ซ้ำอีกรอบ** ตาม `max_text_width` (960px สำหรับ 1:1) → ถ้าบรรทัดกว้างเกิน → *
if "\n" in headline:
    explicit_lines = [l.strip() for l in headline.split("\n") if l.strip()]
    while font_size > 20:
        max_line_w = max(int(font.getlength(line)) for line in ex
  author_name: string | null;
  author_avatar_url: string | null;
  author_followers: number | null;
  rating_news: number;
+                                              className="glass-input h-8 text-[11px] py-1 bg-slate-900"
+                                              placeholder="บรรทัดที่ 3 (ชวนให้ติดตามต่อ)..."
+                                            />
+                                          </div>
+                                        </div>
+                                      </div>
+
+                                      {/* Highlight Keyword Input */}
+                                      <div className="space-y-1 pt-1">
+                                        <span className="text-[10px] text-slate-400 font-bold block">คำเด่นหลักที่ต้องการใส่สีเน้น (Highlight Keyword):</span>
+                                        <input
+                                          type="text"
+                                          value={canvasHighlight}
+                                          onChange={(e) => setCanvasHighlight(e.target.value)}
+                                          className="glass-input h-8 text-[11px] py-1 bg-slate-900"
+                                          placeholder="เช่น Llama 3, Agent, แจกฟรี..."
+                                        />
+                                      </div>
+                                    </div>s(item.id);
                             
                             // Color scheme for source badges
                             let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
[diff_block_end]

Please note that the above snippet only shows the MODIFIED lines from the last change. It shows up to 3 lines of unchanged lines before and after the modified lines. The actual file contents may have many more lines not shown.

Preview จะอัปเดต realtime ตอนพิมพ์ใน triple mode โดยไม่ต้องกดปุ่ม

---

### Fix 5: `line_height` Ratio (🟡 Minor)

**ไฟล์**: [06_graphic_generator.py](file:///Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scripts/06_graphic_generator.py#L801-L809)

```diff
- line_height = int(75 * font_scale)  # ratio 1.36
+ line_height = int(55 * 1.4 * font_scale)  # ratio 1.4 = CSS leading-snug
```

---

### Fix 6: Classic Blue Highlight Color Sync (🟢 Minor)

**ไฟล์**: [App.tsx](file:///Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx#L1349)

```diff
- { box: '#2563EB', text: '#FFFFFF' }  // Blue-600
+ { box: '#3B82F6', text: '#FFFFFF' }  // Blue-500 (matches Pillow)

1. **Fix `bg_image` → `base_image`** (4 จุด: L1166, L1168, L2866, L2867)
2. **Fix `displayHeadline` ให้ realtime สำหรับ triple mode** (L2948)
3. **Fix classic blue color** `#2563EB` → `#3B82F6` (L1349)

---

### Backend — `06_graphic_generator.py`

#### [MODIFY] [06_graphic_generator.py](file:///Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/scripts/06_graphic_generator.py)

1. **เมื่อ headline มี `\n` → ใช้ explicit lines โดยตรง ไม่ wrap ซ้ำ + auto-scale font ลงถ้ากว้างเกิน** (L814-817)
2. **ปรับ line_height ratio เป็น 1.4** ให้ตรง CSS `leading-snug` (L803, L806, L809)

---

### Font Files

#### [NEW] Download Kanit-Medium.ttf + Kanit-Bold.ttf → `scripts/`

ดาวน์โหลดจาก Google Fonts เพื่อให้ Pillow ใช้ Kanit เหมือน Live Preview

---

## Verification Plan

### Automated Tests
1. Build frontend + restart backend
2. ทดสอบกดปุ่ม Draw Poster → ตรวจ exit code = 0
3. เปรียบเทียบ preview กับ Pillow output ด้วยตา

### Manual Verification
- เปิด Live Preview ที่ triple mode → พิมพ์ 3 บรรทัดพร้อม keywords
- กด Draw Poster → ตรวจว่า:
  - ✅ Background image ถูกต้อง (ไม่ crash)
  - ✅ จำนวนบรรทัดตรงกัน (3 บรรทัด)
  - ✅ สี highlight keyword ตรงกันทุกบรรทัด
  - ✅ Font เป็น Kanit ทั้ง preview และ Pillow
  - ✅ Font ไม่ล้นขอบ (auto-scale ทำงาน)

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
                              let imgCount = 0;
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
                            >
export interface HeadlinePack {
  id: string;
  name: string;
  headlines: string[];
}

export interface ImagePromptStyle {
  id: string;
  id: string;
  name: string;
  core_prompt: string;
  negative_prompt: string;
}

export const ARTICLE_LENGTH_OPTIONS = [
  { id: 'short', label: 'สั้น', hint: 'ประมาณ 500-800 ตัวอักษร', range: '500-800' },
  { id: 'medium', label: 'กลาง', hint: 'ประมาณ 900-1,300 ตัวอักษร', range: '900-1300' },
  { id: 'long', label: 'ยาว', hint: 'ประมาณ 1,500-2,200 ตัวอักษร', range: '1500-2200' },
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
ทีละหลาย ๆ ตัว โดยใช้ Sub-agents และ ส
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
                                  <span className={`badge-status 
                                    ${item.status === 'scraped' ? 'badge-scraped' : ''}
                                    ${item.status === 'ready_for_design' ? 'badge-ready' : ''}
                                    ${item.status === 'designed' ? 'badge-designed' : ''}
                                    ${item.status === 'posted' ? 'badge-posted' : ''}
                                    ${item.status === 'archived' ? 'badge-ready' : ''}
                                  `}>
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
      "เปรียบเทียบชัดๆ: Gemini 2.5 Flash กับคู่แข่งในงานโ
  {
    id: "ai_interesting",
    name: "AI น่าสนใจ (YouTuber Studio)",
    core_prompt: "ภาพถ่ายบุคคลสไตล์ยูทูปเบอร์แนวเทคโนโลยีหรือ
  // Global scale state for accessibility
  const [appScale, setAppScale] = useState<number>(() => {
    const saved = localStorage.getItem('app_scale');
    return saved ? Number(saved) : 100;
  });

  // Apply scale to root element on changes
  useEffect(() => {
    localStorage.setItem('app_scale', String(appScale));
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

  // SSE event connections
  const sseConnections = useRef<{ [key: string]: EventSource | null }>({
    canvas: null,
export default function App() {
  const [activeTab, setActiveTab] = useState<'discovery' | 'vault' | 'canvas' | 'settings'>('discovery');

  // Global scale state for accessibility
  const [appScale, setAppScale] = useState<number>(() => {
    const saved = localStorage.getItem('app_scale');
                                <div className="flex gap-2">
  });

  // Apply scale to root element on changes
  useEffect(() => {
    localStorage.setItem('app_scale', String(appScale));
    const rootSize = (appScale / 100) * 16; // 16px is base font size
    document.documentElement.style.fontSize = `${rootSize}px`;
  }, [appScale]);

  // Vault data states
  const [vaultItems, setVaultItems] = useState<VaultContent[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [vaultSelectedIds, setVaultSelectedIds] = useState<string[]>([]);

  // Vault filters state
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [filterMinRating, setFilterMinRating] = useState<number>(0);
  const [sortBy] = useState<string>('newest');



  const [runningModule, setRunningModule] = useState<{
    canvas: boolean;
  }>({
    canvas: false,
  });

    canvas: boolean;
  }>({
    canvas: false,
  });

    return parts[parts.length - 1] || saved;
  });
  const [stockFolderLog, setStockFolderLog] = useState<string>('');

  // Category Badge (Strap / Label)
  const
  const [canvasNewsDetail, setCanvasNewsDetail] = useState('');
  const [canvasNewsSource, setCanvasNewsSource] = useState('');

  // Callout & Sticker
  const [canvasShowCallout, setCanvasShowCallout] = useState(false);
  const [canvasCalloutText, setCanvasCalloutText] = useState('สร้างทุกอย่างด้วยตัวเองและ AI');
  const [canvasNewsTitle, setCanvasNewsTitle] = useState('');
  const [canvasNewsDetail, setCanvasNewsDetail] = useState('');
  const [canvasNewsSource, setCanvasNewsSource] = useState('');

  // Callout & Sticker
  const [canvasShowCallout, setCanvasShowCallout] = useState(false);
  const [canvasCalloutText, setCanvasCalloutText] = useState('สร้างทุกอย่างด้วยตัวเองและ AI');
  const [canvasQueueIndex, setCanvasQueueIndex] = useState<number | null>(null);
  const [canvasQueueIds, setCanvasQueueIds] = useState<string[]>([]);
  const queueIndexRef = useRef<number | null>(null);
  const queueIdsRef = useRef<string[]>([]);
  const [canvasRatio, setCanvasRatio] = useState<'1:1' | '4:5' | '4:3' | '16:9' | '9:16'>('1:1');
  const [canvasTheme, setCanvasTheme] = useState('Classic Red Blue');
  const [canvasLayout, setCanvasLayout] = useState('top_gainers');
  const [canvasHeadline, setCanvasHeadline] = useState('');
  const [canvasCaption, setCanvasCaption] = useState('');
  const [canvasHeadlineMode, setCanvasHeadlineMode] = useState<'single' | 'triple'>('single');
  const [canvasHeadlineLine1, setCanvasHeadlineLine1] = useState('');
  const [canvasHeadlineLine2, setCanvasHeadlineLine2] = useState('');
  const [canvasHeadlineLine3, setCanvasHeadlineLine3] = useState('');
  const [generatingCopywriting, setGeneratingCopywriting] = useState(false);
  const [quickViewCopywriting, setQuickViewCopywriting] = useState<VaultContent | null>(null);
  const [quickViewTab, setQuickViewTab] = useState<'post' | 'headlines'>('post');
  const [canvasHighlight, setCanvasHighlight] = useState('');
  const [canvasBgImage, setCanvasBgImage] = useState('');
  const [latestGraphic, setLatestGraphic] = useState<GraphicItem | null>(null);
  const [loadingGraphics, setLoadingGraphics] = useState(false);

  // V1 Logo circular stamps & margins
  const [savedLogos, setSavedLogos] = useState<{ name: string; url: string }[]>([]);
  const [canvasLogoUrl, setCanvasLogoUrl] = useState('');
  const [canvasLogoSize, setCanvasLogoSize] = useState(10);
  const [canvasLogoMarginX, setCanvasLogoMarginX] = useState(20);
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
  
  // Right side panel preview toggle
  const [previewTab, setPreviewTab] = useState<'live' | 'pillow'>('live');

  // Copywriting styles state
  const [canvasWritingStyle, setCanvasWritingStyle] = useState('ai_trendtech');
  const [canvasHeadlineStyle, setCanvasHeadlineStyle] = useState('ai_clickbait');
  const [canvasImagePromptStyle, setCanvasImagePromptStyle] = useState('trendtech');
  const [rewritingHeadline, setRewritingHeadline] = useState(false);
  
  // Premium Credit Checker States
  const [creditCheckResults, setCreditCheckResults] = useState<{
    label: string;
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
Provide the final result strictly as a clean JSON block containing exactly two fields:
1. "headline": The final optimized 1-line Thai headline for overlaying on a post graphic. Keep it bold, clear, and highly engaging. If writing in clicking/clickbait style, make sure to add (มีต่อ👇) or similar in the headline itself. Max length 12 words.
2. "highlight": 1-2 important standout words or names from the headline that should be colored for highlight emphasis (e.g. "Gemini 2.5", "Sub-agents", "Sony AI").

Make sure to return only the raw JSON block without any markdown wrappers or backticks. Example:
      alert(`❌ การแปลเรียบเรียงและเกลาด้วย AI ขัดข้อง: ${err.message || err}`);
    } finally {
      setRewritingHeadline(false);
    }
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
      const headlineExamples = activeHeadlinePack ? activeHeadlinePack.headlines.join("\n- ") : ""
      
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

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${openRouterKey}`,
          "HTTP-Referer": "https://contentfactory.antigravity.ai", // Required by OpenRouter
          "X-Title": "Antigravity ContentFactory"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
    try {
      const response = await fetch(`${API_BASE}/vault/contents/${targetItem.id}/generate-copywriting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          length: canvasArticleLength,
          font_scale: canvasFontScale
        })
      });
      const resData = await response.json();
      if (resData.success) {
        // Update item's copywriting metadata locally immediately
        const updatedItem = {
          ...targetItem,
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
        
        alert("✨ สร้างบทความและจำลองคำโฆษณาเรียบร้อยแล้ว!");
      } else {
        alert("⚠️ " + (resData.error || "เกิดข้อผิดพลาดในการสร้างบทความ"));
      }
    } catch (err) {
      console.error("Copywriting generation error:", err);
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
    let successCount = 0;
    try {
      for (let i = 0; i < canvasSelectedIds.length; i++) {
        const id = canvasSelectedIds[i];
        const item = (canvasShowAll ? canvasAllItems : canvasImportedItems).find(x => x.id === id);
        if (!item) continue;

        console.log(`[BULK] Generating AI copywriting for item ${i+1}/${canvasSelectedIds.length}: ${item.title}`);
        const response = await fetch(`${API_BASE}/vault/contents/${item.id}/generate-copywriting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            length: canvasArticleLength,
            font_scale: canvasFontScale
          })
        });
        const resData = await response.json();
        if (resData.success) {
          successCount++;
          const updatedItem = {
            ...item,
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
        }
      }

      // Sync and reload DB
      fetchVaultData();
      fetchApprovedItems();

      alert(`✨ ประมวลผลและเขียนบทความจำลองพาดหัวด้วย AI สำเร็จทั้งหมด ${successCount}/${canvasSelectedIds.length} รายการ!`);
    } catch (err) {
      console.error("Bulk copywriting generation error:", err);
          // Update state lists immediately to reflect AI results in real-time
          setCanvasImportedItems(prev => prev.map(x => x.id === updatedItem.id ? updatedItem : x));
          setCanvasAllItems(prev => prev.map(x => x.id === updatedItem.id ? updatedItem : x));

          // Also update selected item if currently focused
          if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
            setCanvasSelectedItem(updatedItem);
          }
        }
      }
          }
        }
      }

      // Sync and reload DB
      fetchVaultData();
      fetchApprovedItems();

      alert(`✨ ประมวลผลและเขียนบทความจำลองพาดหัวด้วย AI สำเร็จทั้งหมด ${successCount}/${canvasSelectedIds.length} รายการ!`);
    } catch (err) {
      console.error("Bulk copywriting generation error:", err);
      alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อประมวลผลคำโฆษณาแบบกลุ่ม");
    } finally {
      setGeneratingCopywriting(false);
    }
  };

  const handleExportLocal = async () => {
    if (!exportDirHandle) {
      alert("⚠️ กรุณาเลือกโฟลเดอร์สำหรับ Save ก่อนครับ");
      return;
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
        const csvFile = await exportDirHandle.getFileHandle(
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
              const imgFile = await exportDirHandle.getFileHandle(img.filename, { create: true });
              const writable = await imgFile.createWritable();
              await writable.write(imgBlob);
              await writable.close();
              imgCount++;
            }
          } catch (e) { console.warn('Image copy failed:', img.filename, e); }
        }
      }

      alert(`✅ ส่งออกสำเร็จ!\n📁 โฟลเดอร์: ${exportFolderName}\n📊 CSV: ${result.total_records} รายการ\n🖼️ รูปภาพ: ${imgCount} ไฟล์`);
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
      const response = await fetch(`${API_BASE}/vault/contents/${canvasSelectedItem.id}/generate-copywriting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
    }
  };

  const appendCustomParams = (q: URLSearchParams) => {
    q.append('show_logo', String(canvasShowPageLogo));
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
        
        // If queue is active, run next item!
        if (module === 'canvas' && queueIndexRef.current !== null) {
          const nextIdx = queueIndexRef.current + 1;
          setCanvasQueueIndex(nextIdx);
        } else if (canvasSelectedItem) {
          fetchGraphicsForContent(canvasSelectedItem.id);
          setPreviewTab('pillow');
        }
      }
    };

            </div>
          )}

          {/* TAB 4: SYSTEM SETTINGS PORTAL */}
          {activeTab === 'settings' && (
            <div className="glass-panel p-6">
              <SettingsPortal appScale={appScale} setAppScale={setAppScale} />
            </div>
          )}

        </div>
      </main>
    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-2">เกลาหัวข้อข่าวโพสต์ภาษาไทย (Thai Headline Editor)</label>
                      <textarea 
                        className="glass-input h-24 resize-none leading-relaxed"
                        value={canvasHeadline}
                        onChange={(e) => setCanvasHeadline(e.target.value)}
                        placeholder="พิมพ์ขัดเกลาแปลไทย เช่น สรุปเทรนด์ AI หรือ ข่าวชิปแบบพรีเมียมให้อ่านง่ายสไตล์คุณ..."
                      />
                    </div>

                    {/* Highlight keywords */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 mb-2">คำเด่นหลักที่ต้องการใส่สีเน้น (Highlight Keyword)</label>
                      <input 
                        type="text" 
                        className="glass-input" 
                        value={canvasHighlight}
                        onChange={(e) => setCanvasHighlight(e.target.value)}
                        placeholder="เช่น M5 Ultra, Llama 4"
          {activeTab === 'canvas' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Workspace inputs: 2 columns */}
              <div className="xl:col-span-2 glass-panel p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-slate-850 pb-4">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    ห้องควบคุมดีไซน์ (Design Configuration Studio)
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Canvas Item Selector with search filter and imported V1 toggle */}
                    <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-semibold text-slate-300">
                          🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)
      const res = await fetch(`${API_BASE}/vault/contents/${id}/graphics`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setLatestGraphic(data.data[0]);
      } else {
        setLatestGraphic(null);
      }
    } catch (err) {
      console.error('Failed to load graphics for content:', err);
    } finally {
      setLoadingGraphics(false);
    }
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
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-400 to-pink-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Cpu className="w-4 h-4 text-slate-900" />
          </div>
          <span className="sidebar-logo-text font-bold">CONTENT V2</span>
        </div>
                          {canvasSelectedItem.media_paths.map((path, idx) => {
                            const isSelected = canvasBgImage === path;
                            return (
                              <div 
                                key={idx}
                                className={`relative cursor-pointer flex-shrink-0 w-28 h-18 rounded-lg overflow-hidden border-2 transition-all ${
                                  isSelected ? 'border-cyan-400 shadow-md shadow-cyan-400/20' : 'border-slate-800'
                                }`}
                                onClick={() => setCanvasBgImage(path)}
                              >
                                <img 
                                  src={`${API_BASE}/vault/media?path=${encodeURIComponent(path)}`}
                                  alt="YouTube Frame" 
                                  className="w-full h-full object-cover"
                                />
                                {isSelected && (
                                  <div className="absolute inset-0 bg-cyan-500/10 flex items-center justify-center">
  const canvasSearchFiltered = canvasImportedItems.filter(item => 
    item.title.toLowerCase().includes(canvasSearchQuery.toLowerCase()) ||
    (item.selected_headline || '').toLowerCase().includes(canvasSearchQuery.toLowerCase())
  );

  const renderHeadlineWithHighlights = (text: string, keywordsStr: string) => {
    if (!text) return null;
    if (!keywordsStr) return <span className="text-white">{text}</span>;
    
    // Clean and split keywords by comma or space
    const keywords = keywordsStr.split(/[\s,]+/).map(k => k.trim().toLowerCase()).filter(Boolean);
    if (keywords.length === 0) return <span className="text-white">{text}</span>;
    
    // Tokenize text into words and spaces to preserve formatting
    const tokens = text.split(/(\s+)/);
    return tokens.map((token, idx) => {
      if (!token.trim()) return token; // Keep spaces as is
      
      const cleaned = token.trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").toLowerCase();
      const isMatch = keywords.some(kw => cleaned === kw || cleaned.includes(kw) || kw.includes(cleaned));
      if (isMatch) {
        return (
          <span key={idx} className="live-highlight-box">
            {token}
          </span>
        );
      }
      return <span key={idx} className="text-white">{token}</span>;
    });
  };

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
                                    ${item.source_type === 'rss' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : ''}
                                    ${item.source_type === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                    ${item.source_type === 'github' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                                  `}>
                                    {item.source_type}
                                  </span>
                                </td>
                                <td className="data-grid-td">
                                  <div className="font-semibold text-slate-200 line-clamp-1">{item.title}</div>
    }
  };

  // Fetch graphics
  const fetchGraphicsForContent = async (id: string) => {
    setLoadingGraphics(true);
    try {
      const res = await fetch(`${API_BASE}/vault/contents/${id}/graphics`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setLatestGraphic(data.data[0]);
      } else {
        setLatestGraphic(null);
      }
    } catch (err) {
      console.error('Failed to load graphics for content:', err);
    } finally {
      setLoadingGraphics(false);
    }
  };
        fetchGraphicsForContent(canvasSelectedItem.id);
      }
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
    if (canvasSelectedItem?.id === item.id) {
      if (canvasHeadlineMode === 'triple') {
        activeHeadline = [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n');
      } else {
        activeHeadline = canvasHeadline;
      }
    } else {
      activeHeadline = item.selected_headline || item.title;
    }
    q.append('headline', activeHeadline);
    
    // Choose backdrop image: if custom backdrop image is selected, apply it to all. Otherwise, use item's first media path.
    if (canvasBgImage) {
      q.append('bg_image', canvasBgImage);
    } else if (item.media_paths && item.media_paths.length > 0) {
      q.append('bg_image', item.media_paths[0]);
    }

    // Keyword Highlight
    const activeHighlight = (canvasSelectedItem?.id === item.id) ? canvasHighlight : '';
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

      const res = await fetch(`${API_BASE}/vault/contents/${itemId}/metadata`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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

  // Fetch graphics
  const fetchGraphicsForContent = async (id: string) => {
    setLoadingGraphics(true);
    try {
      const res = await fetch(`${API_BASE}/vault/contents/${id}/graphics`);
      const data = await res.json();
      if (data.success && data.data.length > 0) {
        setLatestGraphic(data.data[0]);
      } else {
        setLatestGraphic(null);
      }
    } catch (err) {
      console.error('Failed to load graphics for content:', err);
    } finally {
      setLoadingGraphics(false);
    }
  };



  // Initial load
  useEffect(() => {
    fetchVaultData();
    fetchApprovedItems();
    fetchSavedLogos();
      setLatestGraphic(null);
    }
  }, [canvasSelectedItem]);

  // Filter canvas items by search query and showAll toggle
  const canvasSearchFiltered = canvasImportedItems.filter(item => 
    item.title.toLowerCase().includes(canvasSearchQuery.toLowerCase()) ||
    (item.selected_headline || '').toLowerCase().includes(canvasSearchQuery.toLowerCase())
  );

    <div className="app-container">
      {/* Sidebar Section */}
      <aside className="sidebar">
        <div className="sidebar-logo">
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
      // Pre-select first keyframe if available
      if (canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.length > 0) {
        setCanvasBgImage(canvasSelectedItem.media_paths[0]);
      } else {
        setCanvasBgImage('');
      }
      fetchGraphicsForContent(canvasSelectedItem.id);
    } else {
      setCanvasHeadline('');
      setCanvasCaption('');
      setCanvasHeadlineLine1('');
      setCanvasHeadlineLine2('');
      setCanvasHeadlineLine3('');
      setCanvasHighlight('');
      setCanvasBgImage('');
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
        { box: '#F43F5E',
        <span key={lineIdx} style={{ display: 'block', minHeight: line.trim() ? 'auto' : '1.2em' }}>
          {content}
        </span>
      );
    });

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
    } catch (e: any) {
      alert(`❌ ข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${e.message}`);
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
      // Pre-select first keyframe if available
      if (canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.length > 0) {
        setCanvasBgImage(canvasSelectedItem.media_paths[0]);
      } else {
        setCanvasBgImage('');
      }
      fetchGraphicsForContent(canvasSelectedItem.id);
    } else {
      setCanvasHeadline('');
      setCanvasCaption('');
      setCanvasHeadlineLine1('');
      setCanvasHeadlineLine2('');
      setCanvasHeadlineLine3('');
      setCanvasHighlight('');
      setCanvasBgImage('');
      setLatestGraphic(null);
    }
  }, [canvasSelectedItem]);

  // Filter canvas items by search query and showAll toggle
  const canvasSearchFiltered = canvasImportedItems.filter(item => 
    item.title.toLowerCase().includes(canvasSearchQuery.toLowerCase()) ||
    (item.selected_headline || '').toLowerCase().includes(canvasSearchQuery.toLowerCase())
  );

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
                <h2 className="text-md font-bold text-cyan-400 mb-4 flex items-center gap-2 border-b border-slate-850 pb-2.5">
                  ⚙️ ตั้งค่าพื้นฐาน
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column: ตราประทับ (Logo) */}
                  <div className="space-y-3 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
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
// MISSING LINE 1476
// MISSING LINE 1477
// MISSING LINE 1478
                                  isSelected 
                                    <span>📥 นำเข้าทำรูป</span>
                                  </button>
                                </td>
                              </tr>
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
       
                    )}

                    {canvasLogoUrl && (
                      <div className="flex items-center gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-850 mt-1">
                        <img src={canvasLogoUrl} alt="Active Logo" className="h-8 object-contain bg-black/40 p-1 rounded border border-slate-800" />
                        <span className="text-[10px] font-bold text-emerald-400">✅ ใช้งานอยู่</span>
                        <button 
                          onClick={() => {
                            setCanvasLogoUrl('');
                            if (rememberLogo) localStorage.removeItem('canvas_logo_url');
                          }} 
                          className="text-[10px] font-bold text-red-400 hover:text-red-300 hover:underline ml-auto"
                        >
                          เอาออก
                        </button>
                      </div>
                    )}

                    {/* Sizing & Margins coordinates when active */}
                    {canvasShowPageLogo && (
                      <div className="space-y-3 pt-3 border-t border-slate-850/40">
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>ขนาดตราประทับ (Logo Size %)</span>
                            <span className="text-cyan-400">{canvasLogoSize}%</span>
                          </div>
                          <input
                            type="range"
                            min="5"
                            max="40"
                            value={canvasLogoSize}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setCanvasLogoSize(val);
                              if (rememberLogo) localStorage.setItem('canvas_logo_size', String(val));
                            }}
                            className="w-full h-1 bg-slate-85
                        ))}
                      </div>
                    </div>
                                </td>
                                <td className="data-grid-td text-center" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    onClick={() => handleSingleImport(item)}
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'discovery' && 'สแกน Facebook เพจคู่แข่ง, ข่าวสาร RSS, วิดีโอ YouTube และ GitHub Trends สตรีม Log สดแยกโปรเซส'}
              {activeTab === 'vault' && 'กรอง คัดเลือก และอนุมัติไอเดียไวรัลที่ผ่านเกณฑ์ AI คะแนนคุณภาพ ให้เข้าสู่ขั้นตอนการสร้างภาพโพสต์'}
              {activeTab === 'canvas' && 'เลือกไอเดียผ่านการอนุมัติ แปลหัวข้อข่าวภาษาไทย จัดวางคีย์เวิร์ดเด่น เลือก aspect ratio และสั่งบอท Pillow เรนเดอร์ภาพโพสรูป'}
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
                            }])
                            setIsCheckingCredits(false);
                            return;
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
                      onClick={async () => {
                        setIsCheckingCredits(true);
                        setCreditCheckResults([]);
                        try {
                          const openRouterKey = localStorage.getItem('openrouter_key')?.trim();
                          if (!openRouterKey) {
                        try {
                          const openRouterKey = localStorage.getItem('openrouter_key')?.trim();
                          if (!openRouterKey) {
                            setCreditCheckResults([{label: 'ไม่พบ API Key', keyPreview: '-', valid: false, balance: '-', usage: '-', error: 'ไม่พบ Key'}]);
                            return;
                              />
                              <span className="text-[11px] font-bold text-slate-200">ป้ายหมวดมุมซ้าย (Category Badge)</span>
                            </label>
                          </div>
                          {canvasShowBadge && (
                            <div className="space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-400 font-bold">สไตล์ของป้าย</span>
                                  <select
    
// MISSING LINE 1672
// MISSING LINE 1673
                              />
                        checked={rememberLogo}
                        onChange={(e) => handleToggleRememberLogo(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-750 text-cyan-500 accent-cyan-400 focus:ring-cyan-500 bg-slate-950/80 cursor-pointer"
                      />
                      <span className="text-[10px] font-extrabold text-slate-400">จำค่า Logo นี้ไว้ใช้ครั้งหน้า</span>
                    </label>
                  </div>

                </div>
              </div>

              {/* Workspace Layout Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              
              {/* Workspace inputs: 2 columns */}
              <div className="xl:col-span-2 glass-panel p-6 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-6 border-b border-slate-850 pb-4">
                    <Sliders className="w-5 h-5 text-cyan-400" />
                    ห้องควบคุมดีไซน์ (Design Configuration Studio)
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* 📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles) */}
                    <div className="md:co
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
                            setCreditCheckResults([{label: `✅ ทดสอบ ${testModel} สำเร็จ!`, keyPreview: String(openRouterKey || '').slice(0,8)+'...'+String(openRouterKey || '').slice(-4), valid: true, balance: `ตอบกลับ: ${data.choices?.[0]?.message?.content || 'OK'}`, usage: `Model: ${data.model || testModel}`}]);
                          } else {
                            const errMsg = data.error?.message || JSON.stringify(data.error) || `HTTP ${res.status}`;
                            setCreditCheckResults([{label: `❌ ทดสอบ ${testModel} ล้มเหลว`, keyPreview: String(openRouterKey || '').slice(0,8)+'...'+String(openRouterKey || '').slice(-4), valid: false, balance: '-', usage: '
// MISSING LINE 1715
// MISSING LINE 1716
                          setCreditCheckResults([{label: 'Error', keyPreview: '-', valid: false, balance: '-', usage: '-', error: e.message}]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-800/85 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      🧪 ทดสอบ API
                    </button>
                  </div>
                </div>

                {/* Inline credit check results panel */}
                {creditCheckResults.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-cyan-400">🔑 ผลตรวจวิเคราะห์ OpenRouter API Key</h3>
                      <button onClick={() => setCreditCheckResults([])} className="text-[10px] text-slate-500 hover:text-slate-300">✕ ปิดแผง</button>
                    </div>
                    <div className="space-y-2">
                      {creditCheckResults.map((r, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-xs ${r.valid ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                        onChange={(e) => setCanvasHighlight(e.target.value)}
                        placeholder="เช่น M5 Ultra, Llama 4"
                      />
                    </div>
                      <label className="flex items-center gap-1.5 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={canvasShowPageLogo}
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
                            }])
                    {/* Saved logo picker */}
                    {savedLogos.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <p className="text-[10px] text-slate-500 font-bold">โลโก้ที่บันทึกไว้ — คลิกเพื่อเลือก:</p>
                        <div className="flex flex-wrap gap-2.5">
                          {savedLogos.map((logo) => {
                            const isSelected = canvasLogoUrl === logo.url;
                            return (
                              <div key={logo.name} className="relative group">
                                <button
                                  onClick={() => {
                                    setCanvasLogoUrl(logo.url);
                                    if (rememberLogo) {
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
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                          
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
                                      handleDeleteLogo(logo.name);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700"
                                    title="ลบโลโก้นี้"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                  
                  {/* Left Column: ตราประทับ (Logo) */}
                  <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
                    {/* 📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles) */}
                        </div>

                        {canvasSelectedItem?.metadata?.copywriting ? (
                          <div className="space-y-4 pt-1 animate-fade-in">
                            {/* A. Post Caption */}
                            <div className="space-y-2 bg-slate-900/60 p-3 rounded-lg border border-slate-850/80 relative group animate-fade-in">
                              <div className="flex items-center justify-between">
                        className="glass-input h-10 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer w-full"
                      >
                        {PALETTE_WRITING_STYLES.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.name}
                          </option>
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
                      onClick={() => {
                        const fileInput = document.getElementById('canvas-logo-uploader-basic');
                          } else {
                            const errMsg = data.error?.message || JSON.stringify(data.error) || `HTTP ${res.status}`;
                            setCreditCheckResults([{label: `❌ ทดสอบ ${testModel} ล้มเหลว`, keyPreview: String(openRouterKey || '').slice(0,8)+'...'+String(openRouterKey || '').slice(-4), valid: false, balance: '-', usage: '-', error: errMsg}]);
                          }
                        } catch (e: any) {
                          setCreditCheckResults([{label: 'Error', keyPreview: '-', valid: false, balance: '-', usage: '-', error: e.message}]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-800/85 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      🧪 ทดสอบ API
                    </button>
                  </div>
                </div>

                {/* Inline credit check results panel */}
                {creditCheckResults.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-cyan-400">🔑 ผลตรวจวิเคราะห์ OpenRouter API Key</h3>
                      <button onClick={() => setCreditCheckResults([])} className="text-[10px] text-slate-500 hover:text-slate-300">✕ ปิดแผง</button>
                    </div>
                    <div className="space-y-2">
                      {creditCheckResults.map((r, i) => (
                        <div key={i} className={`p-3 rounded-lg border text-xs ${r.valid ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
                          <div className="flex items-center gap-2 font-bold mb-2">
                            <span>{r.valid ? '✅' : '❌'}</span>
                            <span className={r.valid ? 'text-emerald-400' : 'text-red-400'}>{r.label}</span>
                          </div>
                          <div className="text-[11px] text-slate-400 space-y-1 ml                      {/* Export / Save to Local */}
                      <div className="space-y-2">
                        <label className="block text-xs font-semibold text-slate-400">💾 ส่
                                    className="glass-input text-xs h-9 flex-1 py-1 px-2.5 animate-none"
                                  />
                                  <button
                                    type="button"
                                    disabled={generatingCopywriting || !canvasHeadlineFeedback.trim()}
                                    onClick={() => {
                                      handleRewriteCopywritingWithFeedback(canvasHeadlineFeedback);
                                      setCanvasHeadlineFeedback('');
                                    }}
                                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all disabled:opacity-40"
                                  >
                                    🔄 ปรับเกลา
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* C. 3-Line Headlines */}
                            {canvasSelectedItem.metadata?.copywriting?.headline_3line && (
                              <div className="space-y-2 bg-slate-900/30 p-3 rounded-lg border border-slate-850/80">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                    🔴 พาดหัว 3 บรรทัดแบบเก่า
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const l3 = canvasSelectedItem.metadata.copywriting.headline_3line;
                    )}
                          
                          <button
                            type="button"
                            onClick={handleGenerateCopywriting}
                            disabled={generatingCopywriting}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                              generatingCopywriting
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-wait'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02]'
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
                      onClick={() => {
                        const fileInput = document.getElementById('canvas-logo-uploader-basic');
                        fileInput?.click();
                      }}
                      className="w-full py-2.5 px-3 rounded-lg border text-xs font-bold flex items-center justify-center gap-2 transition-all bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-slate-600 text-slate-300 hover:text-white"
                    <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
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
                                      handleDeleteLogo(logo.name);
                                    }}
                                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700"
                                    title="ลบโลโก้นี้"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                          
                          <button
                            type="button"
                            onClick={handleGenerateCopywriting}
                            disabled={generatingCopywriting}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                              generatingCopywriting
                                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400 cursor-wait'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 hover:from-purple-500 hover:to-indigo-500 hover:scale-[1.02]'
                            }`}
                          >
                            {generatingCopywriting ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-300" />
                        <option value="top_gainers">🔥 ไวรัลไทย (Top Gainers - Grid Split)</option>
                        <option value="ai_news">🔴 สรุปข่าวไอที (AI News - Header Strap)</option>
                        <option value="github">💻 ซอฟต์แวร์ (GitHub Tech - Code strap)</option>
                        <option value="quotes">💬 คำวิจารณ์กูรู (Quotes - Quote Card)</option>
                        <option value="youtube">🎥 สารคดี (YouTube Style - Dark Overlay)</option>
                      </select>
                    </div>

                    {/* 2. Visual Palette Swatches grid */}
                    <div className="md:col-span-2">
                      <label className="block text-xs font-semibold text-slate-400 mb-3">
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                          
                          <button
                            type="button"
                            onClick={handleGenerateCopywriting}
                            disabled={generatingCopywriting}
                            className={`px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
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

                    {/* Right Column: Aspect Ratio + Layout + Export */}
                    <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">

                      {/* Aspect Ratio Dropdown */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-semibold text-slate-400 mb-2">📐 สเกลสัดส่วนโพสต์ (Aspect Ratio)</label>
                        <div className="relative">
                          <select
                            className="glass-input h-11 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer pl-11"
                            value={canvasRatio}
                            onChange={(e) => setCanvasRatio(e.target.value as any)}
                          >
                            <option value="1:1">⬜ 1:1 — สี่เหลี่ยมจัตุรัส (Instagram / Facebook Post)</option>
                            <option value="4:5">📱 4:5 — แนวตั้งสั้น (Instagram Portrait / Ads)</option>
                            <option value="4:3">🖥️ 4:3 — แนวนอนสั้น (Presentation / Blog)</option>
                            <option value="16:9">🎬 16:9 — แนวนอนกว้าง (YouTube
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ content_ids: idsToExport })
                              });
                              
                              if (!resp.ok) throw new Error('Export failed');
                              const result = await resp.json();
                              
                              // Download CSV via browser
                              {canvasRatio === '9:16' && <rect x="5" y="1" width="10" height="18" rx="2" stroke="#22d3ee" strokeWidth="1.5" fill="#22d3ee" fillOpacity="0.15"/>}
                            </svg>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                          {canvasRatio === '1:1' && '🔲 1080×1080px — Facebook, Instagram Feed, LINE Timeline'}
                          {canvasRatio === '4:5' && '📱 1080×1350px — Instagram Portrait, Facebook Ads, Pinterest'}
                          {canvasRatio === '4:3' && '🖥️ 1080×810px — Presentation Slide, Blog Hero, LinkedIn'}
                          {canvasRatio === '16:9' && '🎬 1280×720px — YouTube Thumbnail, Twitter Post, Medium'}
                          {canvasRatio === '9:16' && '📲 1080×1920px — IG/FB Story, TikTok, Reels, Shorts'}
                        </p>
                      </div>

                      <div className="border-t border-slate-850/40 my-1" />

                      {/* Layout Template */}
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

                      {/* Export / Save to Local */}
                      <div className="space-y-3">
    
                        <p className="text-[10px] text-slate-500 leading-snug">ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูลและภาพที่ Render เสร็จสิ้น</p>
                        
                        <div className="grid grid-cols-1 gap-2.5 mt-2">
                          {/* Folder Selector Button: Glowing Green Style */}
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
                              {exportFolderName 
                                ? `📁 โฟลเดอร์ที่เลือก: ${exportFolderName}` 
                                : '📂 คลิกเพื่อเลือกโฟลเดอร์ปลายทาง'}
                            </span>
                          </button>

                          {/* Action Save Button */}
                          <button
                          <p className="text-xs font-bold text-slate-400">ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            กรุณาไปที่แท็บ <span className="text-cyan-400 font-bold">คลังวัตถุดิบคุณภาพ</span> และกดปุ่ม <span className="text-cyan-400 font-bold">📥 นำเข้าทำรูป</span> หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                            }`}
                          >
                            <Download className="w-4 h-4" />
                            <span>🚀 เริ่มบันทึกไฟล์และรูปภาพ</span>
                          </button>
                        </div>

                        <p className="text-[9px] text-slate-600 text-center mt-1">
                          {canvasSelectedIds.length > 0 
                            ? `📌 จะส่งออก ${canvasSelectedIds.length} รายการที่เลือก`
                            : `📦 จะส่งออกทุกรายการที่ Import (${canvasImportedItems.length} รายการ)`
                          }
                        </p>
                      </div>

                    </div>

                    {/* 2. Visual Palette Swatches grid */}
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
                              <div>
                                <div className="swatch-header">
                                  <span className="swatch-title" title={theme.name}>
                                    {theme.name}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  )}
                                </div
                                
                                {/* Swatch visual blocks */}
                                <div className="swatch-bar">
                                  <div className="swatch-bar-block" style={{ backgroundColor: theme.gradient[0] }} title="BG Grad Start" />
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
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 5. Font Scale, Image Split, Font Family & Credit Settings */}
                    <div className="md:col-span-2 space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-850/40">
                        <Sliders className="w-4 h-4 text-cyan-400" />
                        <span className="text-xs font-bold text-white">⚙️ โครงสร้างฟอนต์และสัดส่วนกราฟิก (Font & Split Configuration)</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
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
                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>ขนาดฟอนต์ (Font Scale)</span>
                            <span className="text-cyan-400">{canvasFontScale}x</span>
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
                            value={canvasFontScale}
                            onChange={(e) => setCanvasFontScale(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>สัดส่วนสปลิตกราฟิก (%)</span>
                            <span className="text-cyan-400">{canvasImageSplit}%</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="80"
                            step="5"
                            value={canvasImageSplit}
                            onChange={(e) => setCanvasImageSplit(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                          />
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
                            onChange={(e) => setCanvasHeadlineMargin(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                          />
                        </div>

                        <div>
                
                          >
                            ล้าง
                          </button>
                        )}
                      </div>

                      {/* Interactive Card Grid */}
                          <div className="flex gap-1 mt-1.5">
                            {(['left', 'center', 'right'] as const).map((align) => (
                              <button
                                key={align}
                                type="button"
                                onClick={() => setCanvasHeadlineAlign(align)}
                                className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${
                                  canvasHeadlineAlign === align
                                    ? 'bg-cyan-500/20 border border-cyan-500 text-cyan-400'
                                    : 'bg-slate-800/40 border border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
                                }`}
                              >
                                {align === 'left' ? 'ซ้าย' : align === 'center' ? 'กลาง' : 'ขวา'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="block text-[10px] font-bold text-slate-400 mb-1">ชุดสีเน้นคีย์เวิร์ด (Highlight Theme)</span>
                          <select
                            value={canvasHighlightColorSet}
                            onChange={(e) => setCanvasHi
                          />
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <option value="forest">Forest Nature (🟢มรกต, 🟢มะนาว, 🔵แกมน้ำเงิน)</option>
                          <div className="flex items-center justify-between">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={canvasShowCallout}
                                onChange={(e) => setCanvasShowCallout(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 accent-cyan-400"
                              />
                              <span className="text-[11px] font-bold text-slate-200">ลูกศรชี้คำเน้น (Highlight Callout)</span>
                            </label>
                          </div>
                          {canvasShowCallout && (
                            <div className="space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-400 font-bold">ตำแหน่งชี้</span>
                                  <select
                                    value={canvasCalloutPlacement}
                                    onChange={(e) => setCanvasCalloutPlacement(e.target.value)}
                                    className="glass-input h-8 py-0 px-2 mt-1 text-[10px] w-full"
                                  >
                                    <option value="random">🎲 สุ่มพิกัดปลอดภัย</option>
                            max="80"
                            step="5"
                            value={canvasImageSplit}
                            onChange={(e) => setCanvasImageSplit(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                          />
     
                                        className="text-cyan-400 hover:text-white bg-slate-950/80 px-1.5 py-0.5 rounded border border-slate-800 transition-all text-[8px]"
                                      >
                                        Copy
                                      </button>
                                    </div>
                                    <p className="text-slate-300 font-medium line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-help" title={comment}>
                                      {comment}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                                  <span>
                                    📅 {new Date(item.created_at).toLocaleDateString('th-TH')}
                                  </span>
                                </div>

                                {isSelected && (
                                  <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-4 text-left w-full" onClick={(e) => e.stopPropagation()}>
                                    {/* 1. Post Caption Editor */}
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-bold text-slate-300 block">
                                        ✍️ แก้ไขตัวโพส (Post Caption / แคปชั่น)
                                      </label>
                                      <textarea
                                        value={canvasCaption}
                                        onChange={(e) => setCanvasCaption(e.target.value)}
                                        rows={4}
                                        className="glass-input text-xs w-full p-2.5 bg-slate-950/80 border-slate-800 rounded-lg text-white font-medium resize-y"
                                        placeholder="ใส่แคปชั่นข้อความโพสต์ที่ต้องการ..."
                                      />
                       
                                )}
                              </div>
                            );
                          })}
                        </div>
                    
                    )}
                                
                                {/* Swatch visual blocks */}
                                            type="button"
                                            onClick={() => setCanvasHeadlineMode('single')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${
                                              canvasHeadlineMode === 'single'
                                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            พาดหัวเดี่ยว
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCanvasHeadlineMode('triple')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${
                                              canvasHeadlineMode === 'triple'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            พาดหัว 3 บรรทัด
                                          </button>
                                        </div>
                                <div className="live-news-source font-bold">
                                  📰 แหล่งข่าว: {canvasNewsSource || 'Coinpulse Feed'}
                                </div>
                              </div>
                          const isSelected = canvasTheme === theme.id;
                          return (
                            <div
                              key={theme.id}
                              onClick={() => setCanvasTheme(theme.id)}
                              className={`swatch-card ${isSelected ? 'active' : ''}`}
                            >
                              <div>
                                <div className="swatch-header">
                                  <span className="swatch-title" title={theme.name}>
                                    {theme.name}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                  )}
                                </div>
                                
                            onClick={() => setCanvasSearchQuery('')}
                            className="px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                          >
                            ล้าง
                          </button>
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {canvasSearchFiltered.map(item => {
                            const isSelected = canvasSelectedItem?.id === item.id;
                            const isApproved = item.status === 'ready_for_design' || item.status === 'designed' || item.status === 'posted';
                            const isChecked = canvasSelectedIds.includes(ite
                            
                            // Color scheme for source badges
                            let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
                            if (item.source_type === 'radar') badgeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            else if (item.source_type === 'rss') badgeStyle = "bg-pink-500/10 text-pink-400 border-pink-500/20";
                            else if (item.source_type === 'youtube') badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                            else if (item.source_type === 'github') badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

                            return (
                              <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between hover:
                                onChange={(e) => setCanvasShowBadge(e.target.checked)}
                                className="w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 accent-cyan-400"
                              />
                              <span className="text-[11px] font-bold text-slate-200">ป้ายหมวดมุมซ้าย (Category Badge)</span>
                            </label>
                          </div>
                          {canvasShowBadge && (
                            <div className="space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]">
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-slate-400 font-bold">สไตล์ของป้าย</span>
                                  <select
                                    value={canvasBadgeStyle}
                                    onChange={(e) => setCanvasBadgeStyle(e.target.value)}
                                      type="checkbox"
                                      checked={isChecked}
                                      onChange={() => {
                                        setCanvasSelectedIds(prev => 
                                          prev.includes(item.id) ? prev.filter(x => x !== item.id) : [...prev, item.id]
                                        );
                                      }}
                                      className="w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400 shrink-0"
                                    />
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {isApproved ? 'พร้อมเขียนรูป' : 'ฉบับร่างดิบ'}
                                    </span>
                                    {isSelected && (
                                      <CheckCircle className="w-4 h-4 text-cyan-400 ml-1 shadow-sm shrink-0" />
                                    )}
                                  </div>
                                </div>

                                {/* Title headline */}
                                <p className={`text-xs font-semibold leading-relaxed line-clamp-2 transition-colors mb-3 ${
                                  isSelected ? 'text-cyan-300' : 'text-slate-200 group-hover:text-white'
                                }`}>
                                  {item.title}
                                </p>

                                {/* Footer: Date & author */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/60 pt-2 mt-auto">
                                  <span className="truncate max-w-[120px] font-medium text-slate-400">
                                    👤 {item.author_name || 'ไม่ระบุผู้แต่ง'}
                                  </span>
                                  <span>
                                    📅 {new Date(item.created_at).toLocaleDateString('th-TH')}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none mt-2"
                      disabled={runningModule.canvas || (!canvasSelectedItem && canvasSelectedIds.length === 0)}
                      onClick={() => {
                        const activeId = canvasSelectedIds.length === 1 ? canvasSelectedIds[0] : canvasSelectedItem?.id;
                        if (!activeId) return;
                        const item = (canvasShowAll ? canvasAllItems : canvasImportedItems).find(i => i.id === activeId);
                        if (!item) return;

                        const q = new URLSearchParams();
                        q.append('content_id', item.id);
                        q.append('ratio', canvasRatio);
                        q.append('theme', canvasTheme);
                        q.append('layout', canvasLayout);
                        
                        let activeHeadline = '';
                        if (canvasSelectedItem?.id === item.id) {
                          if (canvasHeadlineMode === 'triple') {
                            activeHeadline = [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n');
                          } else {
                            activeHeadline = canvasHeadline;
                          }
                        } else {
                          activeHeadline = item.selected_headline || item.title;
                        }
                        q.append('headline', activeHeadline);
                        if (canvasBgImage && canvasSelectedItem?.id === item.id) q.append('bg_image', canvasBgImage);
                        else if (item.media_paths && item.media_paths.length > 0) q.append('bg_image', item.media_paths[0]);
                        
                        const activeHighlight = (canvasSelectedItem?.id === item.id) ? canvasHighlight : '';
                        if (activeHighlight) q.append('highlight', activeHighlight);
                        
                        // Append branding logos & advanced overlays parameters
                        appendCustomParams(q);
                        
                        runModule('canvas', q.toString());
                      }}
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

                      {/* Bulk AI Copywriting Generation Button */}
                      {canvasSelectedIds.length > 0 && (
                        <div className="pt-1.5 pb-2 animate-fade-in w-full">
                          <button
                            type="button"
                            disabled={generatingCopywriting}
                            onClick={handleBulkGenerateCopywriting}
                            className={`w-full py-3 px-4 rounded-xl border font-black text-xs flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.99] disabled:opacity-50 ${
                              generatingCopywriting
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

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
                            <span className="text-[10px] font-bold text-slate-400">เลือกทั้
                                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-500/10"
                                          >
                                            {generatingCopywriting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 animate-pulse text-cyan-200" />}
                                            <span>✨ AI เขียนพาดหัวใหม่</span>
                                          </button>
                                        </div>
                                      </div>

                                      {/* Editable inputs */}
                                      <div className="space-y-2 mt-2 pt-1.5 border-t border-slate-850/40">
                                        <span className="text-[10px] text-slate-400 font-bold block">พิมพ์แก้ไขพาดหัว 3 บรรทัด:</span>
                                        <div className="grid grid-cols-1 gap-1.5">
// MISSING LINE 2681
// MISSING LINE 2682
// MISSING LINE 2683
// MISSING LINE 2684
// MISSING LINE 2685
// MISSING LINE 2686
// MISSING LINE 2687
// MISSING LINE 2688
// MISSING LINE 2689
// MISSING LINE 2690
// MISSING LINE 2691
// MISSING LINE 2692
// MISSING LINE 2693
// MISSING LINE 2694
// MISSING LINE 2695
// MISSING LINE 2696
// MISSING LINE 2697
// MISSING LINE 2698
// MISSING LINE 2699
                                          </div>
                                          <div className="flex gap-2 items-center">
                                            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
                                            <input
                                              type="text"
                                              value={canvasHeadlineLine3}
                                              onChange={(e) => setCanvasHeadlineLine3(e.target.value)}
                                              className="glass-input h-8 text-[11px] py-1 bg-slate-900"
                                              placeholder="บรรทัดที่ 3 (ชวนให้ติดตามต่อ)..."
                                            />
                                          </div>
                                        </div>
                                      </div>

                                      {/* Highlight Keyword Input */}
                                      <div className="space-y-1 pt-1">
                                        <span className="text-[10px] text-slate-400 font-bold block">คำเด่นหลักที่ต้องการใส่สีเน้น (Highlight Keyword):</span>
                                        <input
                                          type="text"
                                          value={canvasHighlight}
                                          onChange={(e) => setCanvasHighlight(e.target.value)}
                                          className="glass-input h-8 text-[11px] py-1 bg-slate-900"
                                          placeholder="เช่น Llama 3, Agent, แจกฟรี..."
                                        />
                                      </div>
                                    </div>s(item.id);
                            
                            // Color scheme for source badges
                            let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
                            if (item.source_type === 'radar') badgeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            else if (item.source_type === 'rss') badgeStyle = "bg-pink-500/10 text-pink-400 border-pink-500/20";
                            else if (item.source_type === 'youtube') badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {canvasSearchFiltered.map(item => {
                            const isSelected = canvasSelectedItem?.id === item.id;
                            const isApproved = item.status === 'ready_for_design' || item.status === 'designed' || item.status === 'posted';
                            const isChecked = canvasSelectedIds.includes(item.id);
                            
                            // Color scheme for source badges
                            let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
                            if (item.source_type === 'radar') badgeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            else if (item.source_type === 'rss') badgeStyle = "bg-pink-500/10 text-pink-400 border-pink-500/20";
                            else if (item.source_type === 'youtube') badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                            else if (item.source_type === 'github') badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

                            return (
                              <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border tran
                          placeholder="เครดิต: ใส่ข้อความสโลแกนหรือชื่อเพจของคุณ..."
                            <option value="Noto Sans Thai">Noto Sans Thai (สไตล์โมเดิร์นมาตรฐาน)</option>
                            <option value="Mali">Mali (สไตล์น่ารักเป็นกันเอง)</option>
                            <option value="Chonburi">Chonburi (สไตล์พรีเมียมมีหัวมีระดับ)</option>
                            <option value="Itim">Itim (สไตล์ลายมือวัยรุ่น)</option>
                          </select>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                            <span>ขนาดฟอนต์ (Font Scale)</span>
                            <span className="text-cyan-400">{canvasFontScale}x</span>
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
      
// MISSING LINE 2772
// MISSING LINE 2773
// MISSING LINE 2774
// MISSING LINE 2775
// MISSING LINE 2776
// MISSING LINE 2777
// MISSING LINE 2778
// MISSING LINE 2779
                            min="20"
                            max="80"
                            step="5"
                            value={canvasImageSplit}
                            onChange={(e) => setCanvasImageSplit(Number(e.target.value))}
                            className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <span className="block text-[10px] font-bold text-slate-400 mb-1">ข้อความเครดิตท้ายโพสต์ (Credit Label)</span>
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
                          {canvasSearchFiltered.map(item => {
                            const isSelected = canvasSelectedItem?.id === item.id;
                            const isApproved = item.status === 'ready_for_design' || item.status === 'designed' || item.status === 'posted';
                            const isChecked = canvasSelectedIds.includes(item.id);
                            
                            // Color scheme for source badges
                            let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
                            if (item.source_type === 'radar') badgeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            else if (item.source_type === 'rss') badgeStyle = "bg-pink-500/10 text-pink-400 border-pink-500/20";
                            else if (item.source_type === 'youtube') badgeStyle = "bg-red-500/10 text-red-400 border-red-500/20";
                            else if (item.source_type === 'github') badgeStyle = "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";

                            return (
                              <div
                                key={item.id}
                                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] group ${
                                  isSelected 
                                    ? 'bg-cyan-500/10 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30 sm:col-span-2' 
                                    : isChecked
                                      ? 'bg-slate-900/60 border-slate-700/60'
                                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700/80'
               
                                        onChange={(e) => setCanvasCaption(e.target.value)}
                                        rows={4}
                                        className="glass-input text-xs w-full p-2.5 bg-slate-950/80 border-slate-800 rounded-lg text-white font-medium resize-y"
                                        placeholder="ใส่แคปชั่นข้อความโพสต์ที่ต้องการ..."
                                      />
                                    </div>

                                    {/* 2. Headline Selector & Editor */}
                                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850/65">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          </button>
                                        </div>
                                        <div className="flex gap-2">
                                          <button
                                            type="button"
                                            onClick={() => setCanvasHeadlineMode('single')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${
                                              canvasHeadlineMode === 'single'
                                                ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            พาดหัวเดี่ยว
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setCanvasHeadlineMode('triple')}
                                            className={`px-2.5 py-1 text-[10px] font-bold rounded border transition-all ${
                                              canvasHeadlineMode === 'triple'
                                                ? 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                                                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                                            }`}
                                          >
                                            พาดหัว 3 บรรทัด
                                          </button>
                                        </div>
                                      </div>

                                      {/* Dropdown of generated alternative headlines */}
                                      {item.metadata?.copywriting?.headlines && (
                                        <div className="space-y-1">
                                          <span className="text-[9px] font-bold text-slate-400">เลือกพาดหัวจากการวิเคราะห์:</span>
                                          <select
                                            value={canvasHeadlineMode === 'triple' ? 'triple' : canvasHeadline}
                                            onChange={(e) => {
                                              const selectedVal = e.target.value;
                                              if (selectedVal === 'triple') {
                                                setCanvasHeadlineMode('triple');
                                                const l3 = item.metadata?.copywriting?.headline_3line || [];
                                                setCanvasHeadlineLine1(l3[0] || '');
                                                setCanvasHeadlineLine2(l3[1] || '');
                                                setCanvasHeadlineLine3(l3[2] || '');
                                              } else if (selectedVal) {
                                                setCanvasHeadlineMode('single');
                                                setCanvasHeadline(selectedVal);
                                              }
                                            }}
                                            className="glass-input h-8 py-0 px-2 mt-1 text-[10px] w-full cursor-pointer bg-slate-90
                                        </button>
                                      </div>
                                      <textarea
                                        value={canvasCaption}
                                        onChange={(e) => setCanvasCaption(e.target.value)}
                                        rows={4}
                                        className="glass-input text-xs w-full p-2.5 bg-slate-950/80 border-slate-800 rounded-lg text-white font-medium resize-y"
                                        placeholder="ใส่แคปชั่นข้อความโพสต์ที่ต้องการ..."
                                      />
                                    </div>

                                    {/* 2. Headline Selector & Editor */}
                                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850/65">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                      
                                            ))}
                                            {item.metadata.copywriting.headline_3line && (
                                              <option value="triple">
                                                🔴 พาดหัว 3 บรรทัด (3-Line Headlines)
                                              </option>
                                            )}
                                          </select>
                                        </div>
                                      )}

                                      {/* Editable inputs */}
                                      {canvasHeadlineMode === 'single' ? (
                                        <div className="space-y-1 mt-2">
                                          <span className="text-[10px] text-slate-400 font-bold">พิมพ์แก้ไขพาดหัวเดี่ยว:</span>
                                          <input
                                            type="text"
                                            value={canvasHeadline}
                                            onChange={(e) => setCanvasHeadline(e.target.value)}
                                            className="glass-input h-9 text-xs py-1.5 bg-slate-900"
                                            placeholder="พิมพ์พาดหัวเดี่ยวที่ต้องการ..."
                                          />
                                        </div>
                                      ) : (
                                        <div className="space-y-2 mt-2 pt-1.5 border-t border-slate-800/40">
                                          <span className="text-[10px] text-slate-400 font-bold block">พิมพ์แก้ไขพาดหัว 3 บรรทัด:</span>
                                          <div className="grid grid-cols-1 gap-1.5">
                                            <div className="flex gap-2 items-center">
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
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      className="w-full 
                                      <div className="space-y-1 pt-1">
                                        <span className="text-[10px] text-slate-400 font-bold block">คำเด่นหลักที่ต้องการใส่สีเน้น (Highlight Keyword):</span>
                                        <input
                                          type="text"
                                          value={canvasHighlight}
                                          onChange={(e) => setCanvasHighlight(e.target.value)}
                                          className="glass-input h-8 text-[11px] py-1 bg-slate-900"
                                          placeholder="เช่น Llama 3, Agent, แจกฟรี..."
                                        />
                                      </div>
                                    </div>
                            
                            // Color scheme for source badges
                            let badgeStyle = "bg-slate-900 border-slate-800 text-slate-400";
                            if (item.source_type === 'radar') badgeStyle = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            else if (i
                                              </option>
                                            )}
                                          </select>
                                        </div>
                                      )}

                                      {/* Editable inputs */}
                                      {canvasHeadlineMode === 'single' ? (
                        if (canvasBgImage && canvasSelectedItem?.id === item.id) q.append('base_image', canvasBgImage);
                        else if (item.media_paths && item.media_paths.length > 0) q.append('base_image', item.media_paths[0]);
                        
                        const activeHighlight = (canvasSelectedItem?.id === item.id) ? canvasHighlight : '';
                        if (activeHighlight) q.append('keywords', activeHighlight);
                        
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
                            ? `สั่งเรนเดอร์โพสรูปกลุ่มจำนวน ${canvasSelectedIds.length} ภาพด้วย Pillow (Draw Posters)`
                            : 'สั่งเรนเดอร์ภาพโพสรูปด้วย Pillow (Draw Poster)'
                      }
                    </span>
                  </button>
                </div>

              {/* Rendering Output Preview Canvas - Stacked at the Top */}
              <div className="glass-panel p-6 flex flex-col justify-start min-h-[400px]" style={{ order: 1 }}>
                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      <Eye className="w-5 h-5 text-emerald-400" />
                      พรีวิวชิ้นงาน (Design Preview Hub)
                    </h2>
                    <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPreviewTab('live')}
                        className={`px-3 py-1.5 text-[10px] font-extrabold rounded-md transition-all select-none ${
                          previewTab === 'live'
                            ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                            setExportFolderName(dirHandle.name);
                            localStorage.setItem('canvas_export_folder_name', dirHandle.name);
                          } catch (e: any) {
                            if (e.name === 'AbortError') return;
                            console.error('Folder picker error:', e);
                            alert('❌ ไม่สามารถเลือกโฟลเดอร์ได้: ' + e.message);
                          }
                        }}
                        className={`w-full py-3.5 px-4 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.97] hover:scale-[1.015] ${
                          exportFolderName
                            ? 'bg-gradient-to-r from-emerald-950/40 via-green-950/40 to-slate-900 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.25)]'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-400/80 shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                        }`}
                      >
                        <FolderOpen className={`w-4 h-4 shrink-0 ${exportFolderName ? 'text-green-400' : 'text-green-400 animate-pulse'}`} />
                        <span>
                          {exportFolderName 
                            ? `📁 โฟลเดอร์ปลายทาง: ${exportFolderName}`
                        if (canvasBgImage && canvasSelectedItem?.id === item.id) q.append('base_image', canvasBgImage);
                        else if (item.media_paths && item.media_paths.length > 0) q.append('base_image', item.media_paths[0]);
                            ? 'bg-gradient-to-r from-emerald-950/40 via-green-950/40 to-slate-900 text-green-400 border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.25)]'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-400/80 shadow-[0_0_18px_rgba(34,197,94,0.35)]'
                        }`}
                      >
                        <FolderOpen className={`w-4 h-4 shrink-0 ${exportFolderName ? 'text-green-400' : 'text-green-400 animate-pulse'}`} />
                        <span>
                          {exportFolderName 
                            ? `📁 โฟลเดอร์ปลายทาง: ${exportFolderName}` 
                            : '📂 เลือกโฟลเดอร์ที่จะจัดเก็บ'}
                        </span>
                      </button>

                      {/* Action Save Button: Glowing prominent green color! */}
                      <button
                        type="button"
                        disabled={!exportDirHandle}
                        onClick={handleExportLocal}
                        className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.97] hover:scale-[1.015] ${
                          exportDirHandle
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

              {/* Rendering Output Preview Canvas - Stacked at the Top */}
              <div className="glass-panel p-6 flex flex-col justify-start min-h-[400px]" style={{ order: 1 }}>
                <div>
                  <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4">
                    <h2 className="text-md font-bold text-white flex items-center gap-2">
                      >
                        Live HTML5
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewTab('pillow')}
                        className={`px-3 py-1.5 text-[10px] font-extrabold rounded-md transition-all select-none ${
                          previewTab === 'pillow'
                            ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                            : 'text-slate-400 hover:text-white'
                                  right: canvasCalloutPlacement === 'top_right' || canvasCalloutPlacement === 'bottom_right' ? '4cqw' : 'auto',
                                  ...(canvasCalloutPlacement === 'random' ? { top: '30%', left: '20%' } : {})
                                }}
                              >
                                <span className="live-callout-hl">
                                  📢 {canvasCalloutHighlight || 'อัพเดตล่าสุด'}
                                </span>
                                <span className="live-callout-text font-bold">
                                  {canvasCalloutText || 'วิธีสร้างแบบละเอียดในคอมเม้นท์'}
                                </span>
                                <div className="live-callout-sticker-badge">
                 
            <div className="glass-panel p-6">
              <SettingsPortal appScale={appScale} setAppScale={setAppScale} />
            </div>
          )}

        </div>
      </main>

                            /* Full Overlay text layout */
                                </span>
                                <span className="live-meme-subtext">
                                  {canvasMemeSubtext || 'AI ช่วยรันงานขนาน'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Divider bar (Split layout only) */}
                          {canvasLayout === 'top_gainers' && (
                            <div 
                              className="live-split-divider"
                              style={{ 
                                top: `${canvasImageSplit}%`,
                                backgroundColor: activeTheme.accent
                              }}
                            />
                          )}
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
                                            headlines: it
                                          };
                                          handleSaveManuallyUpdatedMetadata(item.id, finalCopywriting);
                                        }}
                                        className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1"
                                      >
                                        <span>💾 บันทึกการแก้ไข</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                                className="live-callout-sticker"
                                style={{
                                  top: canvasCalloutPlacement === 'top_left' || canvasCalloutPlacement === 'top_right' ? '18cqw' : 'auto',
                                  bottom: canvasCalloutPlacement === 'bottom_left' || canvasCalloutPlacement === 'bottom_right' ? '4cqw' : 'auto',
                                  left: canvasCalloutPlacement === 'top_left' || canvasCalloutPlacement === 'bottom_left' ? '4cqw' : 'auto',
                                  right: canvasCalloutPlacement === 'top_right' || canvasCalloutPlacement === 'bottom_right' ? '4cqw' : 'auto',
                                  ...(canvasCalloutPlacement === 'random' ? { top: '30%', left: '20%' } : {})
                                }}
                              >
                                <span className="live-callout-hl">
                                  📢 {canvasCalloutHighlight || 'อัพเดตล่าสุด'}
                                </span>
                                <span className="live-callout-text font-bold">
                                  {canvasCalloutText || 'วิธีสร้
                                  {renderHeadlineWithHighlights(displayHeadline, displayHighlight)}
                                </p>
                              </div>

                              <div className="live-credit-text border-t border-slate-900 pt-3 text-slate-400">
                                เครดิต: {canvasCreditText || 'Coinpulse Content Lab'}
                              </div>
                            </div>
                          ) :
                                    className="live-logo-placeholder"
                                    style={{
                                      right: `${canvasLogoMarginX}px`,
                                      top: `${canvasLogoMarginY}px`,
                                      width: `${canvasLogoSize}%`,
                                      height: `${canvasLogoSize}%`
                                    }}
                                  >
                              {/* Top spacer */}
                              <div className="h-12" />

                              {/* Center aligned title */}
                              <div 
                                className="flex-1 flex items-center justify-center"
                                style={{
                                  fontSize: `${canvasFontScale * 4.2}cqw`,
                                  textAlign: canvasHeadlineAlign,
                                  textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)',
                                  padding: '0 2cqw'
                                }}
                              >
                                <p className="font-black tracking-wide leading-snug w-full">
                                  {renderHeadlineWithHighlights(displayHeadline, displayHighlight)}
                                </p>
                              </div>

                              {/* Bottom section (Author line or YouTube Channel card) */}
                              <div className="flex items-end justify-between w-full min-h-16">
                                {/* Quotes Author line */}
                                {canvasLayout === 'quotes' && (
                                  <div 
                                    className="w-full text-center font-bold text-amber-550"
                                    style={{
                                      fontSize: '3.4cqw',
                                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                    }}
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
                                className="flex-1 flex items-center justify-center"
                                style={{
                  </div>
                  <p className="text-[11px] text-slate-400 mb-6 leading-relaxed">
                    {previewTab === 'live' 
                      ? 'จำลองการจัดวางสัดส่วน สีสัน โลโก้ และเนื้อหาแบบเรียลไทม์ (Live Container Mockup) ก่อนกดส่งเรนเดอร์ผ่าน Pillow'
                      : 'พรีวิวภาพโพสรูปความละเอียดสูงสำเร็จรูป (Pillow Subprocess Output) ที่บันทึกลงฐานข้อมูล SQL เรียบร้อยแล้ว'
                    }
                  </p>
                </div>

                {previewTab === 'live' ? (
                  (() => {
                    const activeTheme = PALETTE_THEMES.find(t => t.id === canvasTheme) || PALETTE_THEMES[0];
                    
                    // Fallback visual mock content when fields are empty to let user preview layout instantly
                    const defaultContent = canvasWritingStyle === 'ai_trendtech'
                      ? {
                          headline: "สร้างกองทัพ AI 15 ตัวด้วย Sub-agents ทำแทนคุณอัตโนมัติ! (มีต่อ👇)",
                          highlight: "Sub-agents"
                        }
                      : {
                          headline: "วิธีประหยัดเวลาทำงาน 10 เท่า ด้วย 100 Prompt เทพที่บริษัทที่ปรึกษาปกปิด! (มีต่อ👇)",
                          highlight: "100 Prompt"
                        };
                        
                    const displayHeadline = (canvasHeadlineMode === 'triple'
                      ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\n')
                      : canvasHeadline) || defaultContent.headline;
                    const displayHighlight = canvasHighlight || defaultContent.highlight;
                    const mockBgUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800";

                    return (
                      <div className="w-full flex flex-col items-center justify-start p-2 mb-2 animate-fade-in">
                        <div 
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
                              height: canvasLayout === 'top_gainers' ? `${canvasImageSplit}%` : '100%',
                              backgroundImage: canvasBgImage 
                                ? `url(${API_BASE}/vault/media?path=${encodeURIComponent(canvasBgImage)})` 
                                : `url(${mockBgUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            {/* Visual Tint Overlay */}
                            <div className="absolute inset-0 bg-black/40" />

                                  {canvasMemeText || 'โคตรประหยัดเวลา'}
                                </span>
                                <span className="live-meme-subtext">
                                  {canvasMemeSubtext || 'AI ช่วยรันงานขนาน'}
                                </span>
                                className="w-full rounded-lg object-contain border border-slate-800 shadow-inner"
                              />
                              <div className="absolute top-4 right-4 bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded shadow">
                                RENDER SUCCESS
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full flex flex-col items-center justify-start p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 mb-4 relative overflow-hidden min-h-[300px]" style={{ maxWidth: '412px', margin: '0 auto' }}>
                    {loadingGraphics ? (
                      <div className="flex flex-col items-center text-slate-500 gap-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-xs">กำลังโหลดไฟล์รูปภาพ...</span>
                      </div>
                    ) : latestGraphic ? (
                      <div className="w-full h-full flex items-center justify-center max-h-[350px]" style={{ maxWidth: '380px', margin: '0 auto' }}>
                        <img 
                          src={`${API_BASE}/vault/media?path=${encodeURIComponent(latestGraphic.file_path)}`}
                          alt="Pillow Poster Output Preview"
                          className="max-w-full rounded-md object-contain border border-slate-700 shadow-xl"
                        />
                                style={{ 
                                  fontSize: `${canvasFontScale * 4.2}cqw`,
                                  fontFamily: canvasFontFamily
                                }}
                              >
                                <p className="w-full text-left font-black tracking-wide leading-snug">
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
                                className="flex-1 flex items-center justify-center"
                                style={{
                                  fontSize: `${canvasFontScale * 4.2}cqw`,
                                  textAlign: 'center',
                                  textShadow: '0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)',
                                  padding: '0 2cqw'
                                }}
                              >
                                <p className="font-black tracking-wide leading-snug w-full">
                                  {renderHeadlineWithHighlights(displayHeadline, displayHighlight)}
                                </p>
                              </div>

                              {/* Bottom section (Author line or YouTube Channel card) */}
                              <div className="flex items-end justify-between w-full min-h-16">
                                {/* Quotes Author line */}
                                {canvasLayout === 'quotes' && (
                                  <div 
                                    className="w-full text-center font-bold text-amber-550"
                                    style={{
                                      fontSize: '3.4cqw',
                                      textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                                    }}
                                  >
                                    — {canvasCreditText || 'Content Factory V2'}
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
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full flex flex-col items-center justify-start p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 mb-4 relative overflow-hidden min-h-[300px]" style={{ maxWidth: '412px', margin: '0 auto' }}>
                    {loadingGraphics ? (
                      <div className="flex flex-col items-center text-slate-500 gap-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-xs">กำลังโหลดไฟล์รูปภาพ...</span>
                                <span className="live-meme-subtext">
                                  {canvasMemeSubtext || 'AI ช่วยรันงานขนาน'}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Divider bar */}
                          <div 
                            className="live-split-divider"
                            style={{ 
                              top: `${canvasImageSplit}%`,
                              backgroundColor: activeTheme.accent
                            }}
                          />

                          {/* Lower Text Typography region */}
                          <div 
                            className="live-headline-section"
                            style={{ 
                              top: `calc(${canvasImageSplit}% + 0.8cqw)`
                            }}
                          >
                            <div 
                              className="live-headline-text flex-1 flex items-center" 
                              style={{ 
                                fontSize: `${canvasFontScale * 4.2}cqw`,
                                fontFamily: canvasFontFamily
                              }}
                            >
                              <p className="w-full text-left font-black tracking-wide leading-snug">
                                {renderHeadlineWithHighlights(displayHeadline, displayHighlight)}
                              </p>
                            </div>

                            <div className="live-credit-text border-t border-slate-900 pt-3 text-slate-400">
                              เครดิต: {canvasCreditText || 'Coinpulse Content Lab'}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()
                ) : (
                  <div className="w-full flex flex-col items-center justify-start p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 mb-4 relative overflow-hidden min-h-[300px]" style={{ maxWidth: '412px', margin: '0 auto' }}>
                    {loadingGraphics ? (
                      <div className="flex flex-col items-center text-slate-500 gap-2">
                        <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
                        <span className="text-xs">กำลังโหลดไฟล์รูปภาพ...</span>
                      </div>
                    ) : latestGraphic ? (
                        >
                          นำไปจัดวางรูป
                        </button>
                      </div>
                      <div className="space-y-2 pt-1">
                        {quickViewCopywriting.metadata.copywriting.headline_3line.map((line: string, i: number) => (
                          <div key={i} className="flex gap-3 items-center text-xs font-bold text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-pink-500 shadow-sm shadow-pink-500/30' : i === 1 ? 'bg-slate-200' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} />
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide w-14 shrink-0">Line {i + 1}:</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
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
    </div>
  );
  if (false) { console.log(approvedItems, canvasShowAll, setCanvasShowAll, canvasAllItems, fetchAllCanvasItems); }
}

// MISSING LINE 3509
// MISSING LINE 3510
// MISSING LINE 3511
// MISSING LINE 3512
// MISSING LINE 3513
// MISSING LINE 3514
// MISSING LINE 3515
// MISSING LINE 3516
// MISSING LINE 3517
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

            {/* Tab selector */}
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
              >
                ✕
              </button>
            </div>

            {/* Tab selector */}
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
                📢 พาดหัวข่าว (Selectable Headlines)
              </button>
            </div>

            {/* Content Box */}
            <div className="p-
// MISSING LINE 3583
// MISSING LINE 3584
// MISSING LINE 3585
// MISSING LINE 3586
// MISSING LINE 3587
// MISSING LINE 3588
// MISSING LINE 3589
// MISSING LINE 3590
// MISSING LINE 3591
// MISSING LINE 3592
// MISSING LINE 3593
// MISSING LINE 3594
// MISSING LINE 3595
// MISSING LINE 3596
// MISSING LINE 3597
// MISSING LINE 3598
// MISSING LINE 3599
// MISSING LINE 3600
// MISSING LINE 3601
// MISSING LINE 3602
// MISSING LINE 3603
// MISSING LINE 3604
// MISSING LINE 3605
// MISSING LINE 3606
// MISSING LINE 3607
// MISSING LINE 3608
// MISSING LINE 3609
// MISSING LINE 3610
// MISSING LINE 3611
// MISSING LINE 3612
// MISSING LINE 3613
// MISSING LINE 3614
// MISSING LINE 3615
// MISSING LINE 3616
// MISSING LINE 3617
// MISSING LINE 3618
// MISSING LINE 3619
// MISSING LINE 3620
// MISSING LINE 3621
// MISSING LINE 3622
// MISSING LINE 3623
// MISSING LINE 3624
// MISSING LINE 3625
// MISSING LINE 3626
// MISSING LINE 3627
// MISSING LINE 3628
// MISSING LINE 3629
// MISSING LINE 3630
// MISSING LINE 3631
// MISSING LINE 3632
// MISSING LINE 3633
// MISSING LINE 3634
// MISSING LINE 3635
// MISSING LINE 3636
// MISSING LINE 3637
// MISSING LINE 3638
// MISSING LINE 3639
// MISSING LINE 3640
// MISSING LINE 3641
// MISSING LINE 3642
// MISSING LINE 3643
// MISSING LINE 3644
// MISSING LINE 3645
// MISSING LINE 3646
// MISSING LINE 3647
// MISSING LINE 3648
// MISSING LINE 3649
// MISSING LINE 3650
// MISSING LINE 3651
// MISSING LINE 3652
// MISSING LINE 3653
// MISSING LINE 3654
// MISSING LINE 3655
// MISSING LINE 3656
// MISSING LINE 3657
// MISSING LINE 3658
// MISSING LINE 3659
// MISSING LINE 3660
// MISSING LINE 3661
// MISSING LINE 3662
// MISSING LINE 3663
// MISSING LINE 3664
// MISSING LINE 3665
// MISSING LINE 3666
// MISSING LINE 3667
// MISSING LINE 3668
// MISSING LINE 3669
// MISSING LINE 3670
// MISSING LINE 3671
// MISSING LINE 3672
// MISSING LINE 3673
// MISSING LINE 3674
// MISSING LINE 3675
// MISSING LINE 3676
// MISSING LINE 3677
// MISSING LINE 3678
// MISSING LINE 3679
                        >
                          นำไปจัดวางรูป
                        </button>
                      </div>
                      <div className="space-y-2 pt-1">
                        {quickViewCopywriting.metadata.copywriting.headline_3line.map((line: string, i: number) => (
                          <div key={i} className="flex gap-3 items-center text-xs font-bold text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-pink-500 shadow-sm shadow-pink-500/30' : i === 1 ? 'bg-slate-200' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} />
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide w-14 shrink-0">Line {i + 1}:</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
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
    </div>
  );
  if (false) { console.log(approvedItems, canvasShowAll, setCanvasShowAll, canvasAllItems, fetchAllCanvasItems, logs); }
}

// MISSING LINE 3717
// MISSING LINE 3718
// MISSING LINE 3719
// MISSING LINE 3720
// MISSING LINE 3721
// MISSING LINE 3722
// MISSING LINE 3723
// MISSING LINE 3724
// MISSING LINE 3725
// MISSING LINE 3726
// MISSING LINE 3727
// MISSING LINE 3728
// MISSING LINE 3729
                        );
                      })}
                    </div>
                  </div>

                  {/* 3-Line structured headlines */}
                  {quickViewCopywriting.metadata.copywriting.headline_3line && (
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850/40 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🔴 พาดหัว 3 บรรทัดต้นฉบับ</span>
                        <button
                          type="button"
                          onClick={() => {
                            const l3 = quickViewCopywriting.metadata.copywriting.headline_3line;
                            setCanvasHeadlineLine1(l3[0] || '');
                            setCanvasHeadlineLine2(l3[1] || '');
                            setCanvasHeadlineLine3(l3[2] || '');
                            setCanvasHeadlineMode('triple');
                            alert("🎨 นำพาดหัว 3 บรรทัดเข้าสู่ห้องควบคุมดีไซน์เรียบร้อย!");
                          }}
                      >
                        คัดลอกแคปชั่น
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {quickViewCopywriting.metadata.copywriting.caption}
                    </p>
                  </div>

                  {/* Comments preview */}
                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">💬 ชุดคอมเม้นท์ดันโพสต์ (FOMO Comments)</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {quickViewCopywriting.metadata.copywriting.comments.map((cmt: string, idx: number) => (
                        <div key={idx} className="bg-slate-950/20 p-3 rounded-lg border border-slate-850/80 text-[11px] leading-relaxed relative">
                          <div className="flex items-center justify-between mb-1 text-[9px] font-black text-slate-400 tracking-wider">
                            <span>💬 เม้นท์ที่ {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(cmt);
                                alert(`📋
// MISSING LINE 3772
// MISSING LINE 3773
// MISSING LINE 3774
// MISSING LINE 3775
// MISSING LINE 3776
// MISSING LINE 3777
// MISSING LINE 3778
// MISSING LINE 3779
// MISSING LINE 3780
// MISSING LINE 3781
// MISSING LINE 3782
// MISSING LINE 3783
// MISSING LINE 3784
// MISSING LINE 3785
// MISSING LINE 3786
// MISSING LINE 3787
// MISSING LINE 3788
// MISSING LINE 3789
// MISSING LINE 3790
// MISSING LINE 3791
// MISSING LINE 3792
// MISSING LINE 3793
// MISSING LINE 3794
// MISSING LINE 3795
// MISSING LINE 3796
// MISSING LINE 3797
// MISSING LINE 3798
// MISSING LINE 3799
// MISSING LINE 3800
// MISSING LINE 3801
// MISSING LINE 3802
// MISSING LINE 3803
// MISSING LINE 3804
// MISSING LINE 3805
// MISSING LINE 3806
// MISSING LINE 3807
// MISSING LINE 3808
// MISSING LINE 3809
// MISSING LINE 3810
// MISSING LINE 3811
// MISSING LINE 3812
// MISSING LINE 3813
// MISSING LINE 3814
// MISSING LINE 3815
// MISSING LINE 3816
// MISSING LINE 3817
// MISSING LINE 3818
// MISSING LINE 3819
// MISSING LINE 3820
// MISSING LINE 3821
// MISSING LINE 3822
// MISSING LINE 3823
// MISSING LINE 3824
// MISSING LINE 3825
// MISSING LINE 3826
// MISSING LINE 3827
// MISSING LINE 3828
// MISSING LINE 3829
// MISSING LINE 3830
// MISSING LINE 3831
                          }}
                          className="text-[10px] font-bold text-purple-400 hover:text-white bg-slate-900 px-2 py-0.5 border border-slate-800 rounded transition-all"
                        >
                          นำไปจัดวางรูป
                        </button>
                      </div>
                      <div className="space-y-2 pt-1">
                        {quickViewCopywriting.metadata.copywriting.headline_3line.map((line: string, i: number) => (
                          <div key={i} className="flex gap-3 items-center text-xs font-bold text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-pink-500 shadow-sm shadow-pink-500/30' : i === 1 ? 'bg-slate-200' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} />
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide w-14 shrink-0">Line {i + 1}:</span>
                            <span>{line}</span>
                          </div>
                        ))}
                      </div>
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
    </div>
  );
  if (false) { console.log(approvedItems, canvasShowAll, setCanvasShowAll, canvasAllItems, fetchAllCanvasItems, logs); }
}

