"import os\nimport json\n\nbrain_dir = \"/Users/paulpolsulintaboon/.gemini/antigravity/brain\"\nresults = []\n\nfor folder in os.listdir(brain_dir):\n    folder_path = os.path.join(brain_dir, folder)\n    if not os.path.isdir(folder_path):\n        continue\n    \n    # Check if there is a transcript.jsonl\n    transcript_path = os.path.join(folder_path, \".system_generated/logs/transcript.jsonl\")\n    if os.path.exists(transcript_path):\n        print(f\"Searching transcript in {folder}...\")\n        try:\n            with open(transcript_path, \"r\", encoding=\"utf-8\", errors=\"ignore\") as f:\n                for line_idx, line in enumerate(f):\n                    if \"App.tsx\" in line:\n                        try:\n                            data = json.loads(line)\n                            step = data.get(\"step_index\")\n                            tool_calls = data.get(\"tool_calls\", [])\n                            for tc in tool_calls:\n                                name = tc.get(\"name\")\n                                args = tc.get(\"args\") or tc.get(\"arguments\") or {}\n                                content = args.get(\"CodeContent\") or \"\"\n                                if content and \"export default App\" in content:\n                                    print(f\"FOUND full write of App.tsx in folder {folder}, step {step}! Content length: {len(content)}\")\n                                    results.append((folder, step, content))\n                        except Exception as e:\n                            pass\n        except Exception as e:\n            print(f\"Error reading {transcript_path}: {e}\")\n\nif results:\n    print(f\"Found {len(results)} versions of App.tsx. Writing the most recent one to scratch/App_tsx_recovered.tsx\")\n    # Save the one from the current conversation if possible, or the largest/newest one\n    # The current conversation is eccbdc81-f670-4dae-922b-0be80b80189b\n    chosen = None\n    for r in results:\n        if r[0] == \"eccbdc81-f670-4dae-
<truncated 400 bytes>

prev_log = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/59119761-b490-421b-b15d-46f12f5c4158/.system_generated/logs/transcript.jsonl"
curr_log = "/Users/paulpolsulintaboon/.gemini/antigravity/brain/247e75b9-4826-40df-8e90-5fa35311e2ea/.system_generated/logs/transcript.jsonl"

def search_log(log_path, label):
    if not os.path.exists(log_path):
        print(f"{label} log not found")
        return
    print(f"Searching {label} log...")
    with open(log_path, 'r', encoding='utf-8') as f:
        for idx, line in enumerate(f):
            try:
                data = json.loads(line)
            except:
                continue
            
            tool_calls = data.get("tool_calls", [])
            for tc_idx, tc in enumerate(tool_calls):
                if tc.get("name") == "write_to_file":
                    args = tc.get("args", {})
                    target = args.get("TargetFile", "")
                    if "App.tsx" in target and not target.endswith(".py") and not "dump" in target:
                        print(f"Found full write in {label} log at line {idx}: {target} (len: {len(args.get('CodeContent', ''))})")

search_log(prev_log, "PREV")
search_log(curr_log, "CURR")

    for start_idx, end_idx, block in reversed(occurrences):
        new_content = new_content[:start_idx] + "onClick={handleUploadAndExportCSV}" + new_content[end_idx:]
        
    with open(app_path, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Replacement done successfully!")
else:
    print(f"File not found: {app_path}")

    print(f"Transcript not found at {transcript_path}")

- **Problem**:
  - The batch Dropbox upload returned upload results for multiple files.
  - The CSV builder looped through the results but pulled the `headline` and `caption` from the globally selected canvas item (`canvasSelectedItem`) instead of looking up each file's corresponding source item.
- **Solution**:
  - Linked each upload result's `file_path` back to its graphic record in `contentGraphics` to obtain the `content_id`.
  - Found the corresponding copywriting item in the local item lists (`canvasAllItems` or `canvasImportedItems`) using the `content_id`.
  - Exported the unique `headline` and `caption` for each uploaded poster row in the CSV file, falling back to `canvasSelectedItem` only if the graphic record could not be mapped.
  - Fixed this mapping inside both Dropbox upload button callbacks.

---

## Renders & Verification

### 1. Dynamic Grid Layout (`top_gainers`) with Top-Left Badge and Tilted Stickers
- **Render Output**: [rendered_badge.png](file:///Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/rendered_badge.png)

![Rendered Dynamic Grid with top-left badge and tilted highlight stickers](/Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/rendered_badge.png)

### 2. YouTube Layout Style (`youtube`) with Unified Bottom-Right Cyber Glassmorphic Badge
- **Render Output**: [rendered_badge_youtube.png](file:///Users/paulpolsulintaboon/.gemini/antigravity/brain/eccbdc81-f670-4dae-922b-0be80b80189b/rendered_badge_youtube.png)
// MISSING LINE 61
// MISSING LINE 62
// MISSING LINE 63
// MISSING LINE 64
// MISSING LINE 65
// MISSING LINE 66
// MISSING LINE 67
// MISSING LINE 68
// MISSING LINE 69
// MISSING LINE 70
// MISSING LINE 71
// MISSING LINE 72
// MISSING LINE 73
// MISSING LINE 74
// MISSING LINE 75
// MISSING LINE 76
// MISSING LINE 77
// MISSING LINE 78
// MISSING LINE 79
// MISSING LINE 80
// MISSING LINE 81
// MISSING LINE 82
// MISSING LINE 83
// MISSING LINE 84
// MISSING LINE 85
// MISSING LINE 86
// MISSING LINE 87
// MISSING LINE 88
// MISSING LINE 89
// MISSING LINE 90
// MISSING LINE 91
                  height: '36px',
// MISSING LINE 93
// MISSING LINE 94
// MISSING LINE 95
// MISSING LINE 96
// MISSING LINE 97
// MISSING LINE 98
// MISSING LINE 99
// MISSING LINE 100
// MISSING LINE 101
// MISSING LINE 102
// MISSING LINE 103
// MISSING LINE 104
// MISSING LINE 105
// MISSING LINE 106
// MISSING LINE 107
// MISSING LINE 108
// MISSING LINE 109
// MISSING LINE 110
// MISSING LINE 111
// MISSING LINE 112
// MISSING LINE 113
// MISSING LINE 114
// MISSING LINE 115
// MISSING LINE 116
// MISSING LINE 117
// MISSING LINE 118
// MISSING LINE 119
// MISSING LINE 120
// MISSING LINE 121
// MISSING LINE 122
// MISSING LINE 123
// MISSING LINE 124
// MISSING LINE 125
// MISSING LINE 126
// MISSING LINE 127
// MISSING LINE 128
// MISSING LINE 129
// MISSING LINE 130
// MISSING LINE 131
// MISSING LINE 132
// MISSING LINE 133
// MISSING LINE 134
// MISSING LINE 135
// MISSING LINE 136
// MISSING LINE 137
// MISSING LINE 138
// MISSING LINE 139
// MISSING LINE 140
// MISSING LINE 141
// MISSING LINE 142
// MISSING LINE 143
// MISSING LINE 144
// MISSING LINE 145
// MISSING LINE 146
// MISSING LINE 147
// MISSING LINE 148
// MISSING LINE 149
// MISSING LINE 150
// MISSING LINE 151
// MISSING LINE 152
// MISSING LINE 153
// MISSING LINE 154
// MISSING LINE 155
// MISSING LINE 156
// MISSING LINE 157
// MISSING LINE 158
// MISSING LINE 159
// MISSING LINE 160
// MISSING LINE 161
// MISSING LINE 162
// MISSING LINE 163
// MISSING LINE 164
// MISSING LINE 165
// MISSING LINE 166
// MISSING LINE 167
// MISSING LINE 168
// MISSING LINE 169
// MISSING LINE 170
// MISSING LINE 171
// MISSING LINE 172
// MISSING LINE 173
// MISSING LINE 174
// MISSING LINE 175
// MISSING LINE 176
// MISSING LINE 177
// MISSING LINE 178
// MISSING LINE 179
// MISSING LINE 180
// MISSING LINE 181
// MISSING LINE 182
// MISSING LINE 183
// MISSING LINE 184
// MISSING LINE 185
// MISSING LINE 186
// MISSING LINE 187
// MISSING LINE 188
// MISSING LINE 189
// MISSING LINE 190
// MISSING LINE 191
// MISSING LINE 192
// MISSING LINE 193
// MISSING LINE 194
// MISSING LINE 195
// MISSING LINE 196
// MISSING LINE 197
// MISSING LINE 198
// MISSING LINE 199
// MISSING LINE 200
// MISSING LINE 201
// MISSING LINE 202
// MISSING LINE 203
// MISSING LINE 204
// MISSING LINE 205
// MISSING LINE 206
// MISSING LINE 207
// MISSING LINE 208
// MISSING LINE 209
// MISSING LINE 210
// MISSING LINE 211
// MISSING LINE 212
// MISSING LINE 213
// MISSING LINE 214
// MISSING LINE 215
// MISSING LINE 216
// MISSING LINE 217
// MISSING LINE 218
// MISSING LINE 219
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
ตั้งค่าไม
// MISSING LINE 235
// MISSING LINE 236
// MISSING LINE 237
// MISSING LINE 238
// MISSING LINE 239
// MISSING LINE 240
// MISSING LINE 241
// MISSING LINE 242
// MISSING LINE 243
// MISSING LINE 244
// MISSING LINE 245
// MISSING LINE 246
// MISSING LINE 247
// MISSING LINE 248
// MISSING LINE 249
// MISSING LINE 250
// MISSING LINE 251
// MISSING LINE 252
// MISSING LINE 253
// MISSING LINE 254
// MISSING LINE 255
// MISSING LINE 256
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
// MISSING LINE 271
// MISSING LINE 272
// MISSING LINE 273
// MISSING LINE 274
// MISSING LINE 275
// MISSING LINE 276
// MISSING LINE 277
// MISSING LINE 278
// MISSING LINE 279
// MISSING LINE 280
// MISSING LINE 281
// MISSING LINE 282
// MISSING LINE 283
// MISSING LINE 284
// MISSING LINE 285
// MISSING LINE 286
// MISSING LINE 287
// MISSING LINE 288
// MISSING LINE 289
// MISSING LINE 290
// MISSING LINE 291
// MISSING LINE 292
// MISSING LINE 293
// MISSING LINE 294
// MISSING LINE 295
// MISSING LINE 296
// MISSING LINE 297
// MISSING LINE 298
// MISSING LINE 299
// MISSING LINE 300
// MISSING LINE 301
// MISSING LINE 302
// MISSING LINE 303
// MISSING LINE 304
// MISSING LINE 305
// MISSING LINE 306
// MISSING LINE 307
// MISSING LINE 308
// MISSING LINE 309
// MISSING LINE 310
// MISSING LINE 311
// MISSING LINE 312
// MISSING LINE 313
// MISSING LINE 314
// MISSING LINE 315
// MISSING LINE 316
// MISSING LINE 317
// MISSING LINE 318
// MISSING LINE 319
// MISSING LINE 320
// MISSING LINE 321
// MISSING LINE 322
// MISSING LINE 323
// MISSING LINE 324
// MISSING LINE 325
// MISSING LINE 326
// MISSING LINE 327
// MISSING LINE 328
// MISSING LINE 329
// MISSING LINE 330
// MISSING LINE 331
// MISSING LINE 332
// MISSING LINE 333
// MISSING LINE 334
// MISSING LINE 335
// MISSING LINE 336
// MISSING LINE 337
// MISSING LINE 338
// MISSING LINE 339
// MISSING LINE 340
// MISSING LINE 341
// MISSING LINE 342
// MISSING LINE 343
// MISSING LINE 344
// MISSING LINE 345
// MISSING LINE 346
// MISSING LINE 347
// MISSING LINE 348
// MISSING LINE 349

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
  const [exportDirHandle, setExportDirHandle] = useState<any>(null);
  const [exportFolderName, setExportFolderName] = useState<string>(() => localStorage.getItem('canvas_export_folder_name') || '');
  const [quickViewCopywriting, setQuickViewCopywriting] = useState<VaultContent | null>(null);
  const [quickViewTab, setQuickViewTab] = useState<'post' | 'headlines'>('post');
  const [canvasHighlight, setCanvasHighlight] = useState('');
  const [canvasBgImage, setCanvasBgImage] = useState('');
  const [canvasBgSource, setCanvasBgSource] = useState<'default' | 'stock'>(() => (localStorage.getItem('canvas_bg_source') as any) || 'default');
// MISSING LINE 451
// MISSING LINE 452
// MISSING LINE 453
// MISSING LINE 454
// MISSING LINE 455
// MISSING LINE 456
// MISSING LINE 457
// MISSING LINE 458
// MISSING LINE 459
// MISSING LINE 460
// MISSING LINE 461
// MISSING LINE 462
// MISSING LINE 463
// MISSING LINE 464
// MISSING LINE 465
// MISSING LINE 466
// MISSING LINE 467
// MISSING LINE 468
// MISSING LINE 469
// MISSING LINE 470
// MISSING LINE 471
// MISSING LINE 472
// MISSING LINE 473
// MISSING LINE 474
// MISSING LINE 475
// MISSING LINE 476
// MISSING LINE 477
// MISSING LINE 478
// MISSING LINE 479
// MISSING LINE 480
// MISSING LINE 481
// MISSING LINE 482
// MISSING LINE 483
// MISSING LINE 484
// MISSING LINE 485
// MISSING LINE 486
// MISSING LINE 487
// MISSING LINE 488
// MISSING LINE 489
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
// MISSING LINE 541
// MISSING LINE 542
// MISSING LINE 543
// MISSING LINE 544
// MISSING LINE 545
// MISSING LINE 546
// MISSING LINE 547
// MISSING LINE 548
// MISSING LINE 549
// MISSING LINE 550
// MISSING LINE 551
// MISSING LINE 552
// MISSING LINE 553
// MISSING LINE 554
// MISSING LINE 555
// MISSING LINE 556
// MISSING LINE 557
// MISSING LINE 558
// MISSING LINE 559
// MISSING LINE 560
// MISSING LINE 561
// MISSING LINE 562
// MISSING LINE 563
// MISSING LINE 564
// MISSING LINE 565
// MISSING LINE 566
// MISSING LINE 567
// MISSING LINE 568
// MISSING LINE 569
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

      const postStylePrompt = activeStyle ? activeStyle
// MISSING LINE 599
// MISSING LINE 600
// MISSING LINE 601
// MISSING LINE 602
// MISSING LINE 603
// MISSING LINE 604
// MISSING LINE 605
// MISSING LINE 606
// MISSING LINE 607
// MISSING LINE 608
// MISSING LINE 609
// MISSING LINE 610
// MISSING LINE 611
// MISSING LINE 612
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
      const activeStyle = PALETTE_WRITING_STYLES.find(s => s.id === canvasWritingStyle);
      const activeHeadlinePack = PALETTE_HEADLINE_STYLES.find(h => h.id === canvasHeadlineStyle);
      const openRouterKey = localStorage.getItem('openrouter_key')?.trim() || '';

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
      const resData = await response.json

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
        
        alert("✨ สร้างบทความและจำลองคำโฆษณาเรียบร้อยแล้ว!");
      } else {
        alert("⚠️ " + (resData.error || "เกิดข้อผิดพลาดในการสร้างบทความ"));
      }
    } catch (err) {
// MISSING LINE 731
// MISSING LINE 732
// MISSING LINE 733
// MISSING LINE 734
// MISSING LINE 735
// MISSING LINE 736
// MISSING LINE 737
// MISSING LINE 738
// MISSING LINE 739
    if (!canvasSelectedItem) {
      alert("⚠️ กรุณาเลือกหัวข้อวัตถุดิบลักษณะการ์ดด้านล่างสุดก่อนกดเขียนบทความครับ");
      return;
    }
    await handleGenerateCopywritingForItem(canvasSelectedItem);
  };

  // Bulk AI Copywriting Suite Generator for all selected items

  // Bulk AI Copywriting Suite Generator for all selected items
  const handleBulkGenerateCopywriting = async () => {
    if (canvasSelectedIds.length === 0) {
      alert("⚠️ กรุณาเลือกหัวข้อไอเดียคอนเทนต์ที่ต้องการเขียนบทความอย่างน้อย 1 รายการก่อนครับ");
      return;
    }

    setGeneratingCopywriting(true);
    let successCount = 0;
    try {
      const activeStyle = PALETTE_WRITING_STYLES.find(s => s.id === canvasWritingStyle);
      const activeHeadlinePack = PALETTE_HEADLINE_STYLES.find(h => h.id === canvasHeadlineStyle);
      const openRouterKey = localStorage.getItem('openrouter_key')?.trim() || '';

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
            font_scale: canvasFontScale,
            writ
          })
        });
        const resData = await response.json();
        if (resData.success) {
          successCount++;

          const updatedItem = {
            ...item,
            selected_headline: joinedHl,
            metadata: {

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
    let activeDirHandle = exportDirHandle;
    if (!activeDirHandle) {
      try {
        activeDirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        setExportDirHandle(activeDirHandle);
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
        },
        body: JSON.stringify({
          feedback: feedbackText,
          length: canvasArticleLength,
          font_scale: canvasFontScale
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
// MISSING LINE 951
// MISSING LINE 952
// MISSING LINE 953
// MISSING LINE 954
// MISSING LINE 955
// MISSING LINE 956
// MISSING LINE 957
// MISSING LINE 958
// MISSING LINE 959
// MISSING LINE 960
// MISSING LINE 961
// MISSING LINE 962
// MISSING LINE 963
// MISSING LINE 964
// MISSING LINE 965
// MISSING LINE 966
// MISSING LINE 967
// MISSING LINE 968
// MISSING LINE 969
// MISSING LINE 970
// MISSING LINE 971
// MISSING LINE 972
// MISSING LINE 973
// MISSING LINE 974
// MISSING LINE 975
// MISSING LINE 976
// MISSING LINE 977
// MISSING LINE 978
// MISSING LINE 979
// MISSING LINE 980
// MISSING LINE 981
// MISSING LINE 982
// MISSING LINE 983
// MISSING LINE 984
// MISSING LINE 985
// MISSING LINE 986
// MISSING LINE 987
// MISSING LINE 988
// MISSING LINE 989
// MISSING LINE 990
// MISSING LINE 991
// MISSING LINE 992
// MISSING LINE 993
// MISSING LINE 994
// MISSING LINE 995
// MISSING LINE 996
// MISSING LINE 997
// MISSING LINE 998
// MISSING LINE 999
// MISSING LINE 1000
// MISSING LINE 1001
// MISSING LINE 1002
// MISSING LINE 1003
// MISSING LINE 1004
// MISSING LINE 1005
// MISSING LINE 1006
// MISSING LINE 1007
// MISSING LINE 1008
// MISSING LINE 1009
// MISSING LINE 1010
// MISSING LINE 1011
// MISSING LINE 1012
// MISSING LINE 1013
// MISSING LINE 1014
// MISSING LINE 1015
// MISSING LINE 1016
// MISSING LINE 1017
// MISSING LINE 1018
// MISSING LINE 1019
// MISSING LINE 1020
// MISSING LINE 1021
// MISSING LINE 1022
// MISSING LINE 1023
// MISSING LINE 1024
// MISSING LINE 1025
// MISSING LINE 1026
// MISSING LINE 1027
// MISSING LINE 1028
// MISSING LINE 1029
// MISSING LINE 1030
// MISSING LINE 1031
// MISSING LINE 1032
// MISSING LINE 1033
// MISSING LINE 1034
// MISSING LINE 1035
// MISSING LINE 1036
// MISSING LINE 1037
// MISSING LINE 1038
// MISSING LINE 1039
// MISSING LINE 1040
// MISSING LINE 1041
// MISSING LINE 1042
// MISSING LINE 1043
// MISSING LINE 1044
// MISSING LINE 1045
// MISSING LINE 1046
// MISSING LINE 1047
// MISSING LINE 1048
// MISSING LINE 1049
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
    const source = new Eve
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
  const fetchVaultData = async () => {
    setLoadingItems(true);
    try {
      const q = new URLSearchParams();
      if (filterSource !== 'all') q.append('source_type', filterSource);
      if (filterStatus !== 'all') q.append('status', filterStatus);
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
          // Check newly approved items in canvasSelectedIds
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
// MISSING LINE 1271
// MISSING LINE 1272
// MISSING LINE 1273
// MISSING LINE 1274
// MISSING LINE 1275
// MISSING LINE 1276
// MISSING LINE 1277
// MISSING LINE 1278
// MISSING LINE 1279
// MISSING LINE 1280
// MISSING LINE 1281
// MISSING LINE 1282
// MISSING LINE 1283
// MISSING LINE 1284
// MISSING LINE 1285
// MISSING LINE 1286
// MISSING LINE 1287
// MISSING LINE 1288
// MISSING LINE 1289
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
// MISSING LINE 1371
// MISSING LINE 1372
// MISSING LINE 1373
// MISSING LINE 1374
// MISSING LINE 1375
// MISSING LINE 1376
// MISSING LINE 1377
// MISSING LINE 1378
// MISSING LINE 1379
// MISSING LINE 1380
// MISSING LINE 1381
// MISSING LINE 1382
// MISSING LINE 1383
// MISSING LINE 1384
// MISSING LINE 1385
// MISSING LINE 1386
// MISSING LINE 1387
// MISSING LINE 1388
// MISSING LINE 1389
  // Synchronize queue index and ids state to refs to prevent stale closure in SSE streams
  useEffect(() => {
    queueIndexRef.current = canvasQueueIndex;
  }, [canvasQueueIndex]);

  useEffect(() => {
    queueIdsRef.current = canvasQueueIds;
  }, [canvasQueueIds]);

  const runNextQueueItem = async (idx: number, ids: string[]) => {

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
        activeHeadline = [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boo
// MISSING LINE 1438
// MISSING LINE 1439
      }
    } else {
      const h3 = item.metadata?.copywriting?.headline_3line;
      if (Array.isArray(h3) && h3.filter(Boolean).length > 0) {
        activeHeadline = h3.filter(Boolean).join('\n');
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
      const data = await res.json();
      if (data.success) {
        setApprovedItems(data.data);
      }
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
        alert(`❌ ไม่สามารถบันทึกได้: ${data.error || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert(`❌ ข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${e.message}`);
    }
  };

  // Select and persist canvas background image selection silently to SQLite
  const handleSelectCanvasBgImage = async (item: VaultContent, path: string) => {
    setCanvasBgImage(path);

    const finalCopywriting = {
      ...(item.metadata?.copywriting || {}),
      selected_bg_image: path
    };

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
      } else {
        alert(`❌ ไม่สามารถเลือกรูปอัตโนมัติได้: ${data.error || 'เกิดข้อผิดพลาดในการวิเคราะห์'}`);
      }
    } catch (error: any) {
      alert(`❌ ข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${error.message}`);
    } finally {
      setIsAutoSelectingBg(false);
    }
  };

  // Select and persist canvas background image selection silently to SQLite
  const handleSelectCanvasBgImage = async (item: VaultContent, path: string) => {
    setCanvasBgImage(path);

    const finalCopywriting = {
      ...(item.metadata?.copywriting || {}),
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
// MISSING LINE 1841
// MISSING LINE 1842
// MISSING LINE 1843
// MISSING LINE 1844
// MISSING LINE 1845
// MISSING LINE 1846
// MISSING LINE 1847
// MISSING LINE 1848
// MISSING LINE 1849
// MISSING LINE 1850
// MISSING LINE 1851
// MISSING LINE 1852
// MISSING LINE 1853
// MISSING LINE 1854
// MISSING LINE 1855
// MISSING LINE 1856
// MISSING LINE 1857
// MISSING LINE 1858
// MISSING LINE 1859
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
              {activeTab === 'vault' && '📂 Vault Manager | คลังวิเคราะห
// MISSING LINE 1888
// MISSING LINE 1889
// MISSING LINE 1890
// MISSING LINE 1891
// MISSING LINE 1892
// MISSING LINE 1893
// MISSING LINE 1894
// MISSING LINE 1895
// MISSING LINE 1896
// MISSING LINE 1897
// MISSING LINE 1898
// MISSING LINE 1899
              {activeTab === 'settings' && 'ปรับแต่งระดับการสเกลโปรแกรม ขนาดตัวอักษรและปุ่ม จัดการคีย์ API สำหรับ Scrapers / AI และบันทึกโทเคนเพจเฟซบุ๊กออฟไลน์'}

            </p>
          </div>
          <div className="flex items-center gap-3">
              {activeTab === 'avatar-video' && 'สุ่มฟุตเทจ B-Roll ปิดเสียงซ้อนทับกรีนสกรีนหรือแบ่งหน้าจอ เจนพาดหัว Hook AI และเบิร์นซับไตเติ้ลภาษาไทยเว้นวรรคคำ'}
              {activeTab === 'podcast-clip' && 'สุ่มหยิบฟุตเทจ B-Roll จากโฟลเดอร์ดิบ มา Concat เรียงซ้อนทับไฟล์เสียงเสียงพากย์ บังคับ Scale/Crop และรักษาระยะเวลาตามความยาวเสียงเป๊ะ'}
              {activeTab === 'dropbox-csv' && 'เชื่อมต่อ Dropbox → AI Prompt → Google Sheets / CSV อัตโนมัติ ปรับระดับการประมวลผลวิดีโอและรูปภาพ'}
              {activeTab === 'tracking' && 'เชื่อมต่อ Google Sheets ดึงข้อมูล Stock ของนักตัดต่อและคลังบทความโดยตรง สรุปเปรียบเทียบในรูปแบบแผนภูมิกราฟิก'}
              {activeTab === 'settings' && 'ปรับแต่งระดับการสเกลโปรแกรม ขนาดตัวอักษรและปุ่ม จัดการคีย์ API สำหรับ Scrapers / AI และบันทึกโทเคนเพจเฟซบุ๊กออฟไลน์'}

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
// MISSING LINE 1931
// MISSING LINE 1932
// MISSING LINE 1933
// MISSING LINE 1934
// MISSING LINE 1935
// MISSING LINE 1936
// MISSING LINE 1937
// MISSING LINE 1938
// MISSING LINE 1939
// MISSING LINE 1940
// MISSING LINE 1941
// MISSING LINE 1942
// MISSING LINE 1943
// MISSING LINE 1944
// MISSING LINE 1945
// MISSING LINE 1946
// MISSING LINE 1947
// MISSING LINE 1948
// MISSING LINE 1949
// MISSING LINE 1950
// MISSING LINE 1951
// MISSING LINE 1952
// MISSING LINE 1953
// MISSING LINE 1954
// MISSING LINE 1955
// MISSING LINE 1956
// MISSING LINE 1957
// MISSING LINE 1958
// MISSING LINE 1959
// MISSING LINE 1960
// MISSING LINE 1961
// MISSING LINE 1962
// MISSING LINE 1963
// MISSING LINE 1964
// MISSING LINE 1965
// MISSING LINE 1966
// MISSING LINE 1967
// MISSING LINE 1968
// MISSING LINE 1969
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
// MISSING LINE 1991
// MISSING LINE 1992
// MISSING LINE 1993
// MISSING LINE 1994
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
// MISSING LINE 2026
// MISSING LINE 2027
// MISSING LINE 2028
// MISSING LINE 2029
// MISSING LINE 2030
// MISSING LINE 2031
// MISSING LINE 2032
// MISSING LINE 2033
// MISSING LINE 2034
// MISSING LINE 2035
// MISSING LINE 2036
// MISSING LINE 2037
// MISSING LINE 2038
// MISSING LINE 2039
// MISSING LINE 2040
// MISSING LINE 2041
// MISSING LINE 2042
// MISSING LINE 2043
// MISSING LINE 2044
// MISSING LINE 2045
// MISSING LINE 2046
// MISSING LINE 2047
// MISSING LINE 2048
// MISSING LINE 2049
// MISSING LINE 2050
// MISSING LINE 2051
// MISSING LINE 2052
// MISSING LINE 2053
// MISSING LINE 2054
// MISSING LINE 2055
// MISSING LINE 2056
// MISSING LINE 2057
// MISSING LINE 2058
// MISSING LINE 2059
// MISSING LINE 2060
// MISSING LINE 2061
// MISSING LINE 2062
// MISSING LINE 2063
// MISSING LINE 2064
// MISSING LINE 2065
// MISSING LINE 2066
// MISSING LINE 2067
// MISSING LINE 2068
// MISSING LINE 2069
// MISSING LINE 2070
// MISSING LINE 2071
// MISSING LINE 2072
// MISSING LINE 2073
// MISSING LINE 2074
// MISSING LINE 2075
// MISSING LINE 2076
// MISSING LINE 2077
// MISSING LINE 2078
// MISSING LINE 2079
// MISSING LINE 2080
// MISSING LINE 2081
// MISSING LINE 2082
// MISSING LINE 2083
// MISSING LINE 2084
// MISSING LINE 2085
// MISSING LINE 2086
// MISSING LINE 2087
// MISSING LINE 2088
// MISSING LINE 2089
// MISSING LINE 2090
// MISSING LINE 2091
// MISSING LINE 2092
// MISSING LINE 2093
// MISSING LINE 2094
// MISSING LINE 2095
// MISSING LINE 2096
// MISSING LINE 2097
// MISSING LINE 2098
// MISSING LINE 2099
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
// MISSING LINE 2151
// MISSING LINE 2152
// MISSING LINE 2153
// MISSING LINE 2154
// MISSING LINE 2155
// MISSING LINE 2156
// MISSING LINE 2157
// MISSING LINE 2158
// MISSING LINE 2159
// MISSING LINE 2160
// MISSING LINE 2161
// MISSING LINE 2162
// MISSING LINE 2163
// MISSING LINE 2164
// MISSING LINE 2165
// MISSING LINE 2166
// MISSING LINE 2167
// MISSING LINE 2168
// MISSING LINE 2169
// MISSING LINE 2170
// MISSING LINE 2171
// MISSING LINE 2172
// MISSING LINE 2173
// MISSING LINE 2174
// MISSING LINE 2175
// MISSING LINE 2176
// MISSING LINE 2177
// MISSING LINE 2178
// MISSING LINE 2179
// MISSING LINE 2180
// MISSING LINE 2181
// MISSING LINE 2182
// MISSING LINE 2183
// MISSING LINE 2184
// MISSING LINE 2185
// MISSING LINE 2186
// MISSING LINE 2187
// MISSING LINE 2188
// MISSING LINE 2189
// MISSING LINE 2190
// MISSING LINE 2191
// MISSING LINE 2192
// MISSING LINE 2193
// MISSING LINE 2194
// MISSING LINE 2195
// MISSING LINE 2196
// MISSING LINE 2197
// MISSING LINE 2198
// MISSING LINE 2199
// MISSING LINE 2200
// MISSING LINE 2201
// MISSING LINE 2202
// MISSING LINE 2203
// MISSING LINE 2204
// MISSING LINE 2205
// MISSING LINE 2206
// MISSING LINE 2207
// MISSING LINE 2208
// MISSING LINE 2209
// MISSING LINE 2210
// MISSING LINE 2211
// MISSING LINE 2212
// MISSING LINE 2213
// MISSING LINE 2214
// MISSING LINE 2215
// MISSING LINE 2216
// MISSING LINE 2217
// MISSING LINE 2218
// MISSING LINE 2219
// MISSING LINE 2220
// MISSING LINE 2221
// MISSING LINE 2222
// MISSING LINE 2223
// MISSING LINE 2224
// MISSING LINE 2225
// MISSING LINE 2226
// MISSING LINE 2227
// MISSING LINE 2228
// MISSING LINE 2229
// MISSING LINE 2230
// MISSING LINE 2231
// MISSING LINE 2232
// MISSING LINE 2233
// MISSING LINE 2234
// MISSING LINE 2235
// MISSING LINE 2236
// MISSING LINE 2237
// MISSING LINE 2238
// MISSING LINE 2239
// MISSING LINE 2240
// MISSING LINE 2241
// MISSING LINE 2242
// MISSING LINE 2243
// MISSING LINE 2244
// MISSING LINE 2245
// MISSING LINE 2246
// MISSING LINE 2247
// MISSING LINE 2248
// MISSING LINE 2249
// MISSING LINE 2250
// MISSING LINE 2251
// MISSING LINE 2252
// MISSING LINE 2253
// MISSING LINE 2254
// MISSING LINE 2255
// MISSING LINE 2256
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
// MISSING LINE 2280
// MISSING LINE 2281
// MISSING LINE 2282
// MISSING LINE 2283
// MISSING LINE 2284
// MISSING LINE 2285
// MISSING LINE 2286
// MISSING LINE 2287
// MISSING LINE 2288
// MISSING LINE 2289
// MISSING LINE 2290
// MISSING LINE 2291
// MISSING LINE 2292
// MISSING LINE 2293
// MISSING LINE 2294
// MISSING LINE 2295
// MISSING LINE 2296
// MISSING LINE 2297
// MISSING LINE 2298
// MISSING LINE 2299
// MISSING LINE 2300
// MISSING LINE 2301
// MISSING LINE 2302
// MISSING LINE 2303
// MISSING LINE 2304
// MISSING LINE 2305
// MISSING LINE 2306
// MISSING LINE 2307
// MISSING LINE 2308
// MISSING LINE 2309
// MISSING LINE 2310
// MISSING LINE 2311
// MISSING LINE 2312
// MISSING LINE 2313
// MISSING LINE 2314
// MISSING LINE 2315
// MISSING LINE 2316
// MISSING LINE 2317
// MISSING LINE 2318
// MISSING LINE 2319
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
                            setCreditCheckResults([{
                              label: 'ไม่พบ API Key',
                              keyPreview: '-',
                              valid: false,
                              balance: '$0',
                              usage: '$0',
                              error: 'กรุณาต
// MISSING LINE 2348
// MISSING LINE 2349
// MISSING LINE 2350
// MISSING LINE 2351
// MISSING LINE 2352
// MISSING LINE 2353
// MISSING LINE 2354
// MISSING LINE 2355
// MISSING LINE 2356
// MISSING LINE 2357
// MISSING LINE 2358
// MISSING LINE 2359
// MISSING LINE 2360
// MISSING LINE 2361
// MISSING LINE 2362
// MISSING LINE 2363
// MISSING LINE 2364
// MISSING LINE 2365
// MISSING LINE 2366
// MISSING LINE 2367
// MISSING LINE 2368
// MISSING LINE 2369
// MISSING LINE 2370
// MISSING LINE 2371
// MISSING LINE 2372
// MISSING LINE 2373
// MISSING LINE 2374
// MISSING LINE 2375
// MISSING LINE 2376
// MISSING LINE 2377
// MISSING LINE 2378
// MISSING LINE 2379
// MISSING LINE 2380
// MISSING LINE 2381
// MISSING LINE 2382
// MISSING LINE 2383
// MISSING LINE 2384
// MISSING LINE 2385
// MISSING LINE 2386
// MISSING LINE 2387
// MISSING LINE 2388
// MISSING LINE 2389
// MISSING LINE 2390
// MISSING LINE 2391
// MISSING LINE 2392
// MISSING LINE 2393
// MISSING LINE 2394
// MISSING LINE 2395
// MISSING LINE 2396
// MISSING LINE 2397
// MISSING LINE 2398
// MISSING LINE 2399
// MISSING LINE 2400
// MISSING LINE 2401
// MISSING LINE 2402
// MISSING LINE 2403
// MISSING LINE 2404
// MISSING LINE 2405
// MISSING LINE 2406
// MISSING LINE 2407
// MISSING LINE 2408
// MISSING LINE 2409
// MISSING LINE 2410
// MISSING LINE 2411
// MISSING LINE 2412
// MISSING LINE 2413
// MISSING LINE 2414
// MISSING LINE 2415
// MISSING LINE 2416
// MISSING LINE 2417
// MISSING LINE 2418
// MISSING LINE 2419
// MISSING LINE 2420
                          <div className={`p-3 rounded-lg border text-xs ${r.valid ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
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
// MISSING LINE 2441
// MISSING LINE 2442
// MISSING LINE 2443
// MISSING LINE 2444
// MISSING LINE 2445
// MISSING LINE 2446
// MISSING LINE 2447
// MISSING LINE 2448
// MISSING LINE 2449
// MISSING LINE 2450
// MISSING LINE 2451
// MISSING LINE 2452
// MISSING LINE 2453
// MISSING LINE 2454
// MISSING LINE 2455
// MISSING LINE 2456
// MISSING LINE 2457
// MISSING LINE 2458
// MISSING LINE 2459
// MISSING LINE 2460
// MISSING LINE 2461
// MISSING LINE 2462
// MISSING LINE 2463
// MISSING LINE 2464
// MISSING LINE 2465
// MISSING LINE 2466
// MISSING LINE 2467
// MISSING LINE 2468
// MISSING LINE 2469
// MISSING LINE 2470
// MISSING LINE 2471
// MISSING LINE 2472
// MISSING LINE 2473
// MISSING LINE 2474
// MISSING LINE 2475
// MISSING LINE 2476
// MISSING LINE 2477
// MISSING LINE 2478
// MISSING LINE 2479
// MISSING LINE 2480
// MISSING LINE 2481
// MISSING LINE 2482
// MISSING LINE 2483
// MISSING LINE 2484
// MISSING LINE 2485
// MISSING LINE 2486
// MISSING LINE 2487
// MISSING LINE 2488
// MISSING LINE 2489
// MISSING LINE 2490
// MISSING LINE 2491
// MISSING LINE 2492
// MISSING LINE 2493
// MISSING LINE 2494
// MISSING LINE 2495
// MISSING LINE 2496
// MISSING LINE 2497
// MISSING LINE 2498
// MISSING LINE 2499
// MISSING LINE 2500
// MISSING LINE 2501
// MISSING LINE 2502
// MISSING LINE 2503
// MISSING LINE 2504
// MISSING LINE 2505
// MISSING LINE 2506
// MISSING LINE 2507
// MISSING LINE 2508
// MISSING LINE 2509
// MISSING LINE 2510
// MISSING LINE 2511
// MISSING LINE 2512
// MISSING LINE 2513
// MISSING LINE 2514
// MISSING LINE 2515
// MISSING LINE 2516
// MISSING LINE 2517
// MISSING LINE 2518
// MISSING LINE 2519
// MISSING LINE 2520
// MISSING LINE 2521
// MISSING LINE 2522
// MISSING LINE 2523
// MISSING LINE 2524
// MISSING LINE 2525
// MISSING LINE 2526
// MISSING LINE 2527
// MISSING LINE 2528
// MISSING LINE 2529
// MISSING LINE 2530
// MISSING LINE 2531
// MISSING LINE 2532
// MISSING LINE 2533
// MISSING LINE 2534
// MISSING LINE 2535
// MISSING LINE 2536
// MISSING LINE 2537
// MISSING LINE 2538
// MISSING LINE 2539
// MISSING LINE 2540
// MISSING LINE 2541
// MISSING LINE 2542
// MISSING LINE 2543
// MISSING LINE 2544
// MISSING LINE 2545
// MISSING LINE 2546
// MISSING LINE 2547
// MISSING LINE 2548
// MISSING LINE 2549
// MISSING LINE 2550
// MISSING LINE 2551
// MISSING LINE 2552
// MISSING LINE 2553
// MISSING LINE 2554
// MISSING LINE 2555
// MISSING LINE 2556
// MISSING LINE 2557
// MISSING LINE 2558
// MISSING LINE 2559
// MISSING LINE 2560
// MISSING LINE 2561
// MISSING LINE 2562
// MISSING LINE 2563
// MISSING LINE 2564
// MISSING LINE 2565
// MISSING LINE 2566
// MISSING LINE 2567
// MISSING LINE 2568
// MISSING LINE 2569
// MISSING LINE 2570
// MISSING LINE 2571
// MISSING LINE 2572
// MISSING LINE 2573
// MISSING LINE 2574
// MISSING LINE 2575
// MISSING LINE 2576
// MISSING LINE 2577
// MISSING LINE 2578
// MISSING LINE 2579
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
                                {(showImages || showS
// MISSING LINE 2600
// MISSING LINE 2601
// MISSING LINE 2602
// MISSING LINE 2603
// MISSING LINE 2604
// MISSING LINE 2605
// MISSING LINE 2606
// MISSING LINE 2607
// MISSING LINE 2608
// MISSING LINE 2609
// MISSING LINE 2610
// MISSING LINE 2611
// MISSING LINE 2612
// MISSING LINE 2613
// MISSING LINE 2614
// MISSING LINE 2615
// MISSING LINE 2616
// MISSING LINE 2617
// MISSING LINE 2618
// MISSING LINE 2619
// MISSING LINE 2620
// MISSING LINE 2621
// MISSING LINE 2622
// MISSING LINE 2623
// MISSING LINE 2624
// MISSING LINE 2625
// MISSING LINE 2626
// MISSING LINE 2627
// MISSING LINE 2628
// MISSING LINE 2629
// MISSING LINE 2630
// MISSING LINE 2631
// MISSING LINE 2632
// MISSING LINE 2633
// MISSING LINE 2634
// MISSING LINE 2635
// MISSING LINE 2636
// MISSING LINE 2637
// MISSING LINE 2638
// MISSING LINE 2639
// MISSING LINE 2640
// MISSING LINE 2641
// MISSING LINE 2642
// MISSING LINE 2643
// MISSING LINE 2644
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
// MISSING LINE 2700
// MISSING LINE 2701
// MISSING LINE 2702
// MISSING LINE 2703
// MISSING LINE 2704
// MISSING LINE 2705
// MISSING LINE 2706
// MISSING LINE 2707
// MISSING LINE 2708
// MISSING LINE 2709
// MISSING LINE 2710
// MISSING LINE 2711
// MISSING LINE 2712
// MISSING LINE 2713
// MISSING LINE 2714
// MISSING LINE 2715
// MISSING LINE 2716
// MISSING LINE 2717
// MISSING LINE 2718
// MISSING LINE 2719
// MISSING LINE 2720
// MISSING LINE 2721
// MISSING LINE 2722
// MISSING LINE 2723
// MISSING LINE 2724
// MISSING LINE 2725
// MISSING LINE 2726
// MISSING LINE 2727
// MISSING LINE 2728
// MISSING LINE 2729
// MISSING LINE 2730
// MISSING LINE 2731
// MISSING LINE 2732
// MISSING LINE 2733
// MISSING LINE 2734
// MISSING LINE 2735
// MISSING LINE 2736
// MISSING LINE 2737
// MISSING LINE 2738
// MISSING LINE 2739
// MISSING LINE 2740
// MISSING LINE 2741
// MISSING LINE 2742
// MISSING LINE 2743
// MISSING LINE 2744
// MISSING LINE 2745
// MISSING LINE 2746
// MISSING LINE 2747
// MISSING LINE 2748
// MISSING LINE 2749
// MISSING LINE 2750
// MISSING LINE 2751
// MISSING LINE 2752
// MISSING LINE 2753
// MISSING LINE 2754
// MISSING LINE 2755
// MISSING LINE 2756
// MISSING LINE 2757
// MISSING LINE 2758
// MISSING LINE 2759
// MISSING LINE 2760
// MISSING LINE 2761
// MISSING LINE 2762
// MISSING LINE 2763
// MISSING LINE 2764
// MISSING LINE 2765
// MISSING LINE 2766
// MISSING LINE 2767
// MISSING LINE 2768
// MISSING LINE 2769
// MISSING LINE 2770
// MISSING LINE 2771
// MISSING LINE 2772
// MISSING LINE 2773
// MISSING LINE 2774
// MISSING LINE 2775
// MISSING LINE 2776
// MISSING LINE 2777
// MISSING LINE 2778
// MISSING LINE 2779
// MISSING LINE 2780
// MISSING LINE 2781
// MISSING LINE 2782
// MISSING LINE 2783
// MISSING LINE 2784
// MISSING LINE 2785
// MISSING LINE 2786
// MISSING LINE 2787
// MISSING LINE 2788
// MISSING LINE 2789
// MISSING LINE 2790
// MISSING LINE 2791
// MISSING LINE 2792
// MISSING LINE 2793
// MISSING LINE 2794
// MISSING LINE 2795
// MISSING LINE 2796
// MISSING LINE 2797
// MISSING LINE 2798
// MISSING LINE 2799
// MISSING LINE 2800
// MISSING LINE 2801
// MISSING LINE 2802
// MISSING LINE 2803
// MISSING LINE 2804
// MISSING LINE 2805
// MISSING LINE 2806
// MISSING LINE 2807
// MISSING LINE 2808
// MISSING LINE 2809
// MISSING LINE 2810
// MISSING LINE 2811
// MISSING LINE 2812
// MISSING LINE 2813
// MISSING LINE 2814
// MISSING LINE 2815
// MISSING LINE 2816
// MISSING LINE 2817
// MISSING LINE 2818
// MISSING LINE 2819
// MISSING LINE 2820
// MISSING LINE 2821
// MISSING LINE 2822
// MISSING LINE 2823
// MISSING LINE 2824
// MISSING LINE 2825
// MISSING LINE 2826
// MISSING LINE 2827
// MISSING LINE 2828
// MISSING LINE 2829
// MISSING LINE 2830
// MISSING LINE 2831
// MISSING LINE 2832
// MISSING LINE 2833
// MISSING LINE 2834
// MISSING LINE 2835
// MISSING LINE 2836
// MISSING LINE 2837
// MISSING LINE 2838
// MISSING LINE 2839
// MISSING LINE 2840
// MISSING LINE 2841
// MISSING LINE 2842
// MISSING LINE 2843
// MISSING LINE 2844
// MISSING LINE 2845
// MISSING LINE 2846
// MISSING LINE 2847
// MISSING LINE 2848
// MISSING LINE 2849
// MISSING LINE 2850
// MISSING LINE 2851
// MISSING LINE 2852
// MISSING LINE 2853
// MISSING LINE 2854
// MISSING LINE 2855
// MISSING LINE 2856
// MISSING LINE 2857
// MISSING LINE 2858
// MISSING LINE 2859
// MISSING LINE 2860
// MISSING LINE 2861
// MISSING LINE 2862
// MISSING LINE 2863
// MISSING LINE 2864
// MISSING LINE 2865
// MISSING LINE 2866
// MISSING LINE 2867
// MISSING LINE 2868
// MISSING LINE 2869
// MISSING LINE 2870
// MISSING LINE 2871
// MISSING LINE 2872
// MISSING LINE 2873
// MISSING LINE 2874
// MISSING LINE 2875
// MISSING LINE 2876
// MISSING LINE 2877
// MISSING LINE 2878
// MISSING LINE 2879
// MISSING LINE 2880
// MISSING LINE 2881
// MISSING LINE 2882
// MISSING LINE 2883
// MISSING LINE 2884
// MISSING LINE 2885
// MISSING LINE 2886
// MISSING LINE 2887
// MISSING LINE 2888
// MISSING LINE 2889
// MISSING LINE 2890
// MISSING LINE 2891
// MISSING LINE 2892
// MISSING LINE 2893
// MISSING LINE 2894
// MISSING LINE 2895
// MISSING LINE 2896
// MISSING LINE 2897
// MISSING LINE 2898
// MISSING LINE 2899
// MISSING LINE 2900
// MISSING LINE 2901
// MISSING LINE 2902
// MISSING LINE 2903
// MISSING LINE 2904
// MISSING LINE 2905
// MISSING LINE 2906
// MISSING LINE 2907
// MISSING LINE 2908
// MISSING LINE 2909
// MISSING LINE 2910
// MISSING LINE 2911
// MISSING LINE 2912
// MISSING LINE 2913
// MISSING LINE 2914
// MISSING LINE 2915
// MISSING LINE 2916
// MISSING LINE 2917
// MISSING LINE 2918
// MISSING LINE 2919
// MISSING LINE 2920
// MISSING LINE 2921
// MISSING LINE 2922
// MISSING LINE 2923
// MISSING LINE 2924
// MISSING LINE 2925
// MISSING LINE 2926
// MISSING LINE 2927
// MISSING LINE 2928
// MISSING LINE 2929
// MISSING LINE 2930
// MISSING LINE 2931
// MISSING LINE 2932
// MISSING LINE 2933
// MISSING LINE 2934
// MISSING LINE 2935
// MISSING LINE 2936
// MISSING LINE 2937
// MISSING LINE 2938
// MISSING LINE 2939
// MISSING LINE 2940
// MISSING LINE 2941
// MISSING LINE 2942
// MISSING LINE 2943
// MISSING LINE 2944
// MISSING LINE 2945
// MISSING LINE 2946
// MISSING LINE 2947
// MISSING LINE 2948
// MISSING LINE 2949
// MISSING LINE 2950
// MISSING LINE 2951
// MISSING LINE 2952
// MISSING LINE 2953
// MISSING LINE 2954
// MISSING LINE 2955
// MISSING LINE 2956
// MISSING LINE 2957
// MISSING LINE 2958
// MISSING LINE 2959
// MISSING LINE 2960
// MISSING LINE 2961
// MISSING LINE 2962
// MISSING LINE 2963
// MISSING LINE 2964
// MISSING LINE 2965
// MISSING LINE 2966
// MISSING LINE 2967
// MISSING LINE 2968
// MISSING LINE 2969
// MISSING LINE 2970
// MISSING LINE 2971
// MISSING LINE 2972
// MISSING LINE 2973
// MISSING LINE 2974
// MISSING LINE 2975
// MISSING LINE 2976
// MISSING LINE 2977
// MISSING LINE 2978
// MISSING LINE 2979
// MISSING LINE 2980
// MISSING LINE 2981
// MISSING LINE 2982
// MISSING LINE 2983
// MISSING LINE 2984
// MISSING LINE 2985
// MISSING LINE 2986
// MISSING LINE 2987
// MISSING LINE 2988
// MISSING LINE 2989
// MISSING LINE 2990
// MISSING LINE 2991
// MISSING LINE 2992
// MISSING LINE 2993
// MISSING LINE 2994
// MISSING LINE 2995
// MISSING LINE 2996
// MISSING LINE 2997
// MISSING LINE 2998
// MISSING LINE 2999
// MISSING LINE 3000
// MISSING LINE 3001
// MISSING LINE 3002
// MISSING LINE 3003
// MISSING LINE 3004
// MISSING LINE 3005
// MISSING LINE 3006
// MISSING LINE 3007
// MISSING LINE 3008
// MISSING LINE 3009
// MISSING LINE 3010
// MISSING LINE 3011
// MISSING LINE 3012
// MISSING LINE 3013
// MISSING LINE 3014
// MISSING LINE 3015
// MISSING LINE 3016
// MISSING LINE 3017
// MISSING LINE 3018
// MISSING LINE 3019
// MISSING LINE 3020
// MISSING LINE 3021
// MISSING LINE 3022
// MISSING LINE 3023
// MISSING LINE 3024
// MISSING LINE 3025
// MISSING LINE 3026
// MISSING LINE 3027
// MISSING LINE 3028
// MISSING LINE 3029
// MISSING LINE 3030
// MISSING LINE 3031
// MISSING LINE 3032
// MISSING LINE 3033
// MISSING LINE 3034
// MISSING LINE 3035
// MISSING LINE 3036
// MISSING LINE 3037
// MISSING LINE 3038
// MISSING LINE 3039
// MISSING LINE 3040
// MISSING LINE 3041
// MISSING LINE 3042
// MISSING LINE 3043
// MISSING LINE 3044
// MISSING LINE 3045
// MISSING LINE 3046
// MISSING LINE 3047
// MISSING LINE 3048
// MISSING LINE 3049
// MISSING LINE 3050
// MISSING LINE 3051
// MISSING LINE 3052
// MISSING LINE 3053
// MISSING LINE 3054
// MISSING LINE 3055
// MISSING LINE 3056
// MISSING LINE 3057
// MISSING LINE 3058
// MISSING LINE 3059
// MISSING LINE 3060
// MISSING LINE 3061
// MISSING LINE 3062
// MISSING LINE 3063
// MISSING LINE 3064
// MISSING LINE 3065
// MISSING LINE 3066
// MISSING LINE 3067
// MISSING LINE 3068
// MISSING LINE 3069
// MISSING LINE 3070
// MISSING LINE 3071
// MISSING LINE 3072
// MISSING LINE 3073
// MISSING LINE 3074
// MISSING LINE 3075
// MISSING LINE 3076
// MISSING LINE 3077
// MISSING LINE 3078
// MISSING LINE 3079
// MISSING LINE 3080
// MISSING LINE 3081
// MISSING LINE 3082
// MISSING LINE 3083
// MISSING LINE 3084
// MISSING LINE 3085
// MISSING LINE 3086
// MISSING LINE 3087
// MISSING LINE 3088
// MISSING LINE 3089
// MISSING LINE 3090
// MISSING LINE 3091
// MISSING LINE 3092
// MISSING LINE 3093
// MISSING LINE 3094
// MISSING LINE 3095
// MISSING LINE 3096
// MISSING LINE 3097
// MISSING LINE 3098
// MISSING LINE 3099
// MISSING LINE 3100
// MISSING LINE 3101
// MISSING LINE 3102
// MISSING LINE 3103
// MISSING LINE 3104
// MISSING LINE 3105
// MISSING LINE 3106
// MISSING LINE 3107
// MISSING LINE 3108
// MISSING LINE 3109
// MISSING LINE 3110
// MISSING LINE 3111
// MISSING LINE 3112
// MISSING LINE 3113
// MISSING LINE 3114
// MISSING LINE 3115
// MISSING LINE 3116
// MISSING LINE 3117
// MISSING LINE 3118
// MISSING LINE 3119
// MISSING LINE 3120
// MISSING LINE 3121
// MISSING LINE 3122
// MISSING LINE 3123
// MISSING LINE 3124
// MISSING LINE 3125
// MISSING LINE 3126
// MISSING LINE 3127
// MISSING LINE 3128
// MISSING LINE 3129
// MISSING LINE 3130
// MISSING LINE 3131
// MISSING LINE 3132
// MISSING LINE 3133
// MISSING LINE 3134
// MISSING LINE 3135
// MISSING LINE 3136
// MISSING LINE 3137
// MISSING LINE 3138
// MISSING LINE 3139
// MISSING LINE 3140
// MISSING LINE 3141
// MISSING LINE 3142
// MISSING LINE 3143
// MISSING LINE 3144
// MISSING LINE 3145
// MISSING LINE 3146
// MISSING LINE 3147
// MISSING LINE 3148
// MISSING LINE 3149
// MISSING LINE 3150
// MISSING LINE 3151
// MISSING LINE 3152
// MISSING LINE 3153
// MISSING LINE 3154
// MISSING LINE 3155
// MISSING LINE 3156
// MISSING LINE 3157
// MISSING LINE 3158
// MISSING LINE 3159
// MISSING LINE 3160
// MISSING LINE 3161
// MISSING LINE 3162
// MISSING LINE 3163
// MISSING LINE 3164
// MISSING LINE 3165
// MISSING LINE 3166
// MISSING LINE 3167
// MISSING LINE 3168
// MISSING LINE 3169
// MISSING LINE 3170
// MISSING LINE 3171
// MISSING LINE 3172
// MISSING LINE 3173
// MISSING LINE 3174
// MISSING LINE 3175
// MISSING LINE 3176
// MISSING LINE 3177
// MISSING LINE 3178
// MISSING LINE 3179
// MISSING LINE 3180
// MISSING LINE 3181
// MISSING LINE 3182
// MISSING LINE 3183
// MISSING LINE 3184
// MISSING LINE 3185
// MISSING LINE 3186
// MISSING LINE 3187
// MISSING LINE 3188
// MISSING LINE 3189
// MISSING LINE 3190
// MISSING LINE 3191
// MISSING LINE 3192
// MISSING LINE 3193
// MISSING LINE 3194
// MISSING LINE 3195
// MISSING LINE 3196
// MISSING LINE 3197
// MISSING LINE 3198
// MISSING LINE 3199
// MISSING LINE 3200
// MISSING LINE 3201
// MISSING LINE 3202
// MISSING LINE 3203
// MISSING LINE 3204
// MISSING LINE 3205
// MISSING LINE 3206
// MISSING LINE 3207
// MISSING LINE 3208
// MISSING LINE 3209
// MISSING LINE 3210
// MISSING LINE 3211
// MISSING LINE 3212
// MISSING LINE 3213
// MISSING LINE 3214
// MISSING LINE 3215
// MISSING LINE 3216
// MISSING LINE 3217
// MISSING LINE 3218
// MISSING LINE 3219
// MISSING LINE 3220
// MISSING LINE 3221
// MISSING LINE 3222
// MISSING LINE 3223
// MISSING LINE 3224
// MISSING LINE 3225
// MISSING LINE 3226
// MISSING LINE 3227
// MISSING LINE 3228
// MISSING LINE 3229
// MISSING LINE 3230
// MISSING LINE 3231
// MISSING LINE 3232
// MISSING LINE 3233
// MISSING LINE 3234
// MISSING LINE 3235
// MISSING LINE 3236
// MISSING LINE 3237
// MISSING LINE 3238
// MISSING LINE 3239
// MISSING LINE 3240
// MISSING LINE 3241
// MISSING LINE 3242
// MISSING LINE 3243
// MISSING LINE 3244
// MISSING LINE 3245
// MISSING LINE 3246
// MISSING LINE 3247
// MISSING LINE 3248
// MISSING LINE 3249
// MISSING LINE 3250
// MISSING LINE 3251
// MISSING LINE 3252
// MISSING LINE 3253
// MISSING LINE 3254
// MISSING LINE 3255
// MISSING LINE 3256
// MISSING LINE 3257
// MISSING LINE 3258
// MISSING LINE 3259
// MISSING LINE 3260
// MISSING LINE 3261
// MISSING LINE 3262
// MISSING LINE 3263
// MISSING LINE 3264
// MISSING LINE 3265
// MISSING LINE 3266
// MISSING LINE 3267
// MISSING LINE 3268
// MISSING LINE 3269
// MISSING LINE 3270
// MISSING LINE 3271
// MISSING LINE 3272
// MISSING LINE 3273
// MISSING LINE 3274
// MISSING LINE 3275
// MISSING LINE 3276
// MISSING LINE 3277
// MISSING LINE 3278
// MISSING LINE 3279
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
                        
// MISSING LINE 3301
// MISSING LINE 3302
// MISSING LINE 3303
// MISSING LINE 3304
// MISSING LINE 3305
// MISSING LINE 3306
// MISSING LINE 3307
// MISSING LINE 3308
// MISSING LINE 3309
// MISSING LINE 3310
// MISSING LINE 3311
// MISSING LINE 3312
// MISSING LINE 3313
// MISSING LINE 3314
// MISSING LINE 3315
// MISSING LINE 3316
// MISSING LINE 3317
// MISSING LINE 3318
// MISSING LINE 3319
// MISSING LINE 3320
// MISSING LINE 3321
// MISSING LINE 3322
// MISSING LINE 3323
// MISSING LINE 3324
// MISSING LINE 3325
// MISSING LINE 3326
// MISSING LINE 3327
// MISSING LINE 3328
// MISSING LINE 3329
// MISSING LINE 3330
// MISSING LINE 3331
// MISSING LINE 3332
// MISSING LINE 3333
// MISSING LINE 3334
// MISSING LINE 3335
// MISSING LINE 3336
// MISSING LINE 3337
// MISSING LINE 3338
// MISSING LINE 3339
// MISSING LINE 3340
// MISSING LINE 3341
// MISSING LINE 3342
// MISSING LINE 3343
// MISSING LINE 3344
// MISSING LINE 3345
// MISSING LINE 3346
// MISSING LINE 3347
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
     
// MISSING LINE 3693
// MISSING LINE 3694
// MISSING LINE 3695
// MISSING LINE 3696
// MISSING LINE 3697
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
// MISSING LINE 3741
// MISSING LINE 3742
// MISSING LINE 3743
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
 
// MISSING LINE 3794
// MISSING LINE 3795
// MISSING LINE 3796
// MISSING LINE 3797
// MISSING LINE 3798
// MISSING LINE 3799
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
                          
// MISSING LINE 3818
// MISSING LINE 3819
// MISSING LINE 3820
// MISSING LINE 3821
// MISSING LINE 3822
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
                   
// MISSING LINE 3872
// MISSING LINE 3873
// MISSING LINE 3874
// MISSING LINE 3875
// MISSING LINE 3876
// MISSING LINE 3877
// MISSING LINE 3878
// MISSING LINE 3879
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
// MISSING LINE 4054
// MISSING LINE 4055
// MISSING LINE 4056
// MISSING LINE 4057
// MISSING LINE 4058
// MISSING LINE 4059
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
// MISSING LINE 4121
// MISSING LINE 4122
// MISSING LINE 4123
// MISSING LINE 4124
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
// MISSING LINE 4146
// MISSING LINE 4147
// MISSING LINE 4148
// MISSING LINE 4149
// MISSING LINE 4150
// MISSING LINE 4151
// MISSING LINE 4152
// MISSING LINE 4153
// MISSING LINE 4154
// MISSING LINE 4155
// MISSING LINE 4156
// MISSING LINE 4157
// MISSING LINE 4158
// MISSING LINE 4159
// MISSING LINE 4160
// MISSING LINE 4161
// MISSING LINE 4162
// MISSING LINE 4163
// MISSING LINE 4164
// MISSING LINE 4165
// MISSING LINE 4166
// MISSING LINE 4167
// MISSING LINE 4168
// MISSING LINE 4169
// MISSING LINE 4170
// MISSING LINE 4171
// MISSING LINE 4172
// MISSING LINE 4173
// MISSING LINE 4174
// MISSING LINE 4175
// MISSING LINE 4176
// MISSING LINE 4177
// MISSING LINE 4178
// MISSING LINE 4179
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
// MISSING LINE 4201
// MISSING LINE 4202
// MISSING LINE 4203
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
// MISSING LINE 4241
// MISSING LINE 4242
// MISSING LINE 4243
// MISSING LINE 4244
// MISSING LINE 4245
// MISSING LINE 4246
// MISSING LINE 4247
// MISSING LINE 4248
// MISSING LINE 4249
// MISSING LINE 4250
// MISSING LINE 4251
// MISSING LINE 4252
// MISSING LINE 4253
// MISSING LINE 4254
// MISSING LINE 4255
// MISSING LINE 4256
// MISSING LINE 4257
// MISSING LINE 4258
// MISSING LINE 4259
// MISSING LINE 4260
// MISSING LINE 4261
// MISSING LINE 4262
// MISSING LINE 4263
// MISSING LINE 4264
// MISSING LINE 4265
// MISSING LINE 4266
// MISSING LINE 4267
// MISSING LINE 4268
// MISSING LINE 4269
// MISSING LINE 4270
// MISSING LINE 4271
// MISSING LINE 4272
// MISSING LINE 4273
// MISSING LINE 4274
// MISSING LINE 4275
// MISSING LINE 4276
// MISSING LINE 4277
// MISSING LINE 4278
// MISSING LINE 4279
// MISSING LINE 4280
// MISSING LINE 4281
// MISSING LINE 4282
// MISSING LINE 4283
// MISSING LINE 4284
// MISSING LINE 4285
// MISSING LINE 4286
// MISSING LINE 4287
// MISSING LINE 4288
// MISSING LINE 4289
// MISSING LINE 4290
// MISSING LINE 4291
// MISSING LINE 4292
// MISSING LINE 4293
// MISSING LINE 4294
// MISSING LINE 4295
// MISSING LINE 4296
// MISSING LINE 4297
// MISSING LINE 4298
// MISSING LINE 4299
// MISSING LINE 4300
// MISSING LINE 4301
// MISSING LINE 4302
// MISSING LINE 4303
// MISSING LINE 4304
// MISSING LINE 4305
// MISSING LINE 4306
// MISSING LINE 4307
// MISSING LINE 4308
// MISSING LINE 4309
// MISSING LINE 4310
// MISSING LINE 4311
// MISSING LINE 4312
// MISSING LINE 4313
// MISSING LINE 4314
// MISSING LINE 4315
// MISSING LINE 4316
// MISSING LINE 4317
// MISSING LINE 4318
// MISSING LINE 4319
// MISSING LINE 4320
// MISSING LINE 4321
// MISSING LINE 4322
// MISSING LINE 4323
// MISSING LINE 4324
// MISSING LINE 4325
// MISSING LINE 4326
// MISSING LINE 4327
// MISSING LINE 4328
// MISSING LINE 4329
// MISSING LINE 4330
// MISSING LINE 4331
// MISSING LINE 4332
// MISSING LINE 4333
// MISSING LINE 4334
// MISSING LINE 4335
// MISSING LINE 4336
// MISSING LINE 4337
// MISSING LINE 4338
// MISSING LINE 4339
// MISSING LINE 4340
// MISSING LINE 4341
// MISSING LINE 4342
// MISSING LINE 4343
// MISSING LINE 4344
// MISSING LINE 4345
// MISSING LINE 4346
// MISSING LINE 4347
// MISSING LINE 4348
// MISSING LINE 4349
// MISSING LINE 4350
// MISSING LINE 4351
// MISSING LINE 4352
// MISSING LINE 4353
// MISSING LINE 4354
// MISSING LINE 4355
// MISSING LINE 4356
// MISSING LINE 4357
// MISSING LINE 4358
// MISSING LINE 4359
// MISSING LINE 4360
// MISSING LINE 4361
// MISSING LINE 4362
// MISSING LINE 4363
// MISSING LINE 4364
// MISSING LINE 4365
// MISSING LINE 4366
// MISSING LINE 4367
// MISSING LINE 4368
// MISSING LINE 4369
// MISSING LINE 4370
// MISSING LINE 4371
// MISSING LINE 4372
// MISSING LINE 4373
// MISSING LINE 4374
// MISSING LINE 4375
// MISSING LINE 4376
// MISSING LINE 4377
// MISSING LINE 4378
// MISSING LINE 4379
// MISSING LINE 4380
// MISSING LINE 4381
// MISSING LINE 4382
// MISSING LINE 4383
// MISSING LINE 4384
// MISSING LINE 4385
// MISSING LINE 4386
// MISSING LINE 4387
// MISSING LINE 4388
// MISSING LINE 4389
// MISSING LINE 4390
// MISSING LINE 4391
// MISSING LINE 4392
// MISSING LINE 4393
// MISSING LINE 4394
// MISSING LINE 4395
// MISSING LINE 4396
// MISSING LINE 4397
// MISSING LINE 4398
// MISSING LINE 4399
// MISSING LINE 4400
// MISSING LINE 4401
// MISSING LINE 4402
// MISSING LINE 4403
// MISSING LINE 4404
// MISSING LINE 4405
// MISSING LINE 4406
// MISSING LINE 4407
// MISSING LINE 4408
// MISSING LINE 4409
// MISSING LINE 4410
// MISSING LINE 4411
// MISSING LINE 4412
// MISSING LINE 4413
// MISSING LINE 4414
// MISSING LINE 4415
// MISSING LINE 4416
// MISSING LINE 4417
// MISSING LINE 4418
// MISSING LINE 4419
// MISSING LINE 4420
// MISSING LINE 4421
// MISSING LINE 4422
// MISSING LINE 4423
// MISSING LINE 4424
// MISSING LINE 4425
// MISSING LINE 4426
// MISSING LINE 4427
// MISSING LINE 4428
// MISSING LINE 4429
// MISSING LINE 4430
// MISSING LINE 4431
// MISSING LINE 4432
// MISSING LINE 4433
// MISSING LINE 4434
// MISSING LINE 4435
// MISSING LINE 4436
// MISSING LINE 4437
// MISSING LINE 4438
// MISSING LINE 4439
// MISSING LINE 4440
// MISSING LINE 4441
// MISSING LINE 4442
// MISSING LINE 4443
// MISSING LINE 4444
// MISSING LINE 4445
// MISSING LINE 4446
// MISSING LINE 4447
// MISSING LINE 4448
// MISSING LINE 4449
// MISSING LINE 4450
// MISSING LINE 4451
// MISSING LINE 4452
// MISSING LINE 4453
// MISSING LINE 4454
// MISSING LINE 4455
// MISSING LINE 4456
// MISSING LINE 4457
// MISSING LINE 4458
// MISSING LINE 4459
// MISSING LINE 4460
// MISSING LINE 4461
// MISSING LINE 4462
// MISSING LINE 4463
// MISSING LINE 4464
// MISSING LINE 4465
// MISSING LINE 4466
// MISSING LINE 4467
// MISSING LINE 4468
// MISSING LINE 4469
// MISSING LINE 4470
// MISSING LINE 4471
// MISSING LINE 4472
// MISSING LINE 4473
// MISSING LINE 4474
// MISSING LINE 4475
// MISSING LINE 4476
// MISSING LINE 4477
// MISSING LINE 4478
// MISSING LINE 4479
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
// MISSING LINE 4566
// MISSING LINE 4567
// MISSING LINE 4568
// MISSING LINE 4569
// MISSING LINE 4570
// MISSING LINE 4571
// MISSING LINE 4572
// MISSING LINE 4573
// MISSING LINE 4574
// MISSING LINE 4575
// MISSING LINE 4576
// MISSING LINE 4577
// MISSING LINE 4578
// MISSING LINE 4579
// MISSING LINE 4580
// MISSING LINE 4581
// MISSING LINE 4582
// MISSING LINE 4583
// MISSING LINE 4584
// MISSING LINE 4585
// MISSING LINE 4586
// MISSING LINE 4587
// MISSING LINE 4588
// MISSING LINE 4589
// MISSING LINE 4590
// MISSING LINE 4591
// MISSING LINE 4592
// MISSING LINE 4593
// MISSING LINE 4594
// MISSING LINE 4595
// MISSING LINE 4596
// MISSING LINE 4597
// MISSING LINE 4598
// MISSING LINE 4599
// MISSING LINE 4600
// MISSING LINE 4601
// MISSING LINE 4602
// MISSING LINE 4603
// MISSING LINE 4604
// MISSING LINE 4605
// MISSING LINE 4606
// MISSING LINE 4607
// MISSING LINE 4608
// MISSING LINE 4609
// MISSING LINE 4610
// MISSING LINE 4611
// MISSING LINE 4612
// MISSING LINE 4613
// MISSING LINE 4614
// MISSING LINE 4615
// MISSING LINE 4616
// MISSING LINE 4617
// MISSING LINE 4618
// MISSING LINE 4619
// MISSING LINE 4620
// MISSING LINE 4621
// MISSING LINE 4622
// MISSING LINE 4623
// MISSING LINE 4624
// MISSING LINE 4625
// MISSING LINE 4626
// MISSING LINE 4627
// MISSING LINE 4628
// MISSING LINE 4629
// MISSING LINE 4630
// MISSING LINE 4631
// MISSING LINE 4632
// MISSING LINE 4633
// MISSING LINE 4634
// MISSING LINE 4635
// MISSING LINE 4636
// MISSING LINE 4637
// MISSING LINE 4638
// MISSING LINE 4639
// MISSING LINE 4640
// MISSING LINE 4641
// MISSING LINE 4642
// MISSING LINE 4643
// MISSING LINE 4644
// MISSING LINE 4645
// MISSING LINE 4646
// MISSING LINE 4647
// MISSING LINE 4648
// MISSING LINE 4649
// MISSING LINE 4650
// MISSING LINE 4651
// MISSING LINE 4652
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
// MISSING LINE 4681
// MISSING LINE 4682
// MISSING LINE 4683
// MISSING LINE 4684
// MISSING LINE 4685
// MISSING LINE 4686
// MISSING LINE 4687
// MISSING LINE 4688
// MISSING LINE 4689
// MISSING LINE 4690
// MISSING LINE 4691
// MISSING LINE 4692
// MISSING LINE 4693
// MISSING LINE 4694
// MISSING LINE 4695
// MISSING LINE 4696
// MISSING LINE 4697
// MISSING LINE 4698
// MISSING LINE 4699
// MISSING LINE 4700
// MISSING LINE 4701
// MISSING LINE 4702
// MISSING LINE 4703
// MISSING LINE 4704
// MISSING LINE 4705
// MISSING LINE 4706
// MISSING LINE 4707
// MISSING LINE 4708
// MISSING LINE 4709
// MISSING LINE 4710
// MISSING LINE 4711
// MISSING LINE 4712
// MISSING LINE 4713
// MISSING LINE 4714
// MISSING LINE 4715
// MISSING LINE 4716
// MISSING LINE 4717
// MISSING LINE 4718
// MISSING LINE 4719
// MISSING LINE 4720
// MISSING LINE 4721
// MISSING LINE 4722
// MISSING LINE 4723
// MISSING LINE 4724
// MISSING LINE 4725
// MISSING LINE 4726
// MISSING LINE 4727
// MISSING LINE 4728
// MISSING LINE 4729
// MISSING LINE 4730
// MISSING LINE 4731
// MISSING LINE 4732
// MISSING LINE 4733
// MISSING LINE 4734
// MISSING LINE 4735
// MISSING LINE 4736
// MISSING LINE 4737
// MISSING LINE 4738
// MISSING LINE 4739
// MISSING LINE 4740
// MISSING LINE 4741
// MISSING LINE 4742
// MISSING LINE 4743
// MISSING LINE 4744
// MISSING LINE 4745
// MISSING LINE 4746
// MISSING LINE 4747
// MISSING LINE 4748
// MISSING LINE 4749
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
                     
// MISSING LINE 4778
// MISSING LINE 4779
// MISSING LINE 4780
// MISSING LINE 4781
// MISSING LINE 4782
// MISSING LINE 4783
// MISSING LINE 4784
// MISSING LINE 4785
// MISSING LINE 4786
// MISSING LINE 4787
// MISSING LINE 4788
// MISSING LINE 4789
// MISSING LINE 4790
// MISSING LINE 4791
// MISSING LINE 4792
// MISSING LINE 4793
// MISSING LINE 4794
// MISSING LINE 4795
// MISSING LINE 4796
// MISSING LINE 4797
// MISSING LINE 4798
// MISSING LINE 4799
// MISSING LINE 4800
// MISSING LINE 4801
// MISSING LINE 4802
// MISSING LINE 4803
// MISSING LINE 4804
// MISSING LINE 4805
// MISSING LINE 4806
// MISSING LINE 4807
// MISSING LINE 4808
// MISSING LINE 4809
// MISSING LINE 4810
// MISSING LINE 4811
// MISSING LINE 4812
// MISSING LINE 4813
// MISSING LINE 4814
// MISSING LINE 4815
// MISSING LINE 4816
// MISSING LINE 4817
// MISSING LINE 4818
// MISSING LINE 4819
// MISSING LINE 4820
// MISSING LINE 4821
// MISSING LINE 4822
// MISSING LINE 4823
// MISSING LINE 4824
// MISSING LINE 4825
// MISSING LINE 4826
// MISSING LINE 4827
// MISSING LINE 4828
// MISSING LINE 4829
// MISSING LINE 4830
// MISSING LINE 4831
// MISSING LINE 4832
// MISSING LINE 4833
// MISSING LINE 4834
// MISSING LINE 4835
// MISSING LINE 4836
// MISSING LINE 4837
// MISSING LINE 4838
// MISSING LINE 4839
// MISSING LINE 4840
// MISSING LINE 4841
// MISSING LINE 4842
// MISSING LINE 4843
// MISSING LINE 4844
// MISSING LINE 4845
// MISSING LINE 4846
// MISSING LINE 4847
// MISSING LINE 4848
// MISSING LINE 4849
// MISSING LINE 4850
// MISSING LINE 4851
// MISSING LINE 4852
// MISSING LINE 4853
// MISSING LINE 4854
// MISSING LINE 4855
// MISSING LINE 4856
// MISSING LINE 4857
// MISSING LINE 4858
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
// MISSING LINE 4980
// MISSING LINE 4981
// MISSING LINE 4982
// MISSING LINE 4983
// MISSING LINE 4984
// MISSING LINE 4985
// MISSING LINE 4986
// MISSING LINE 4987
// MISSING LINE 4988
// MISSING LINE 4989
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
// MISSING LINE 5101
// MISSING LINE 5102
// MISSING LINE 5103
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
         
// MISSING LINE 5133
// MISSING LINE 5134
// MISSING LINE 5135
// MISSING LINE 5136
// MISSING LINE 5137
// MISSING LINE 5138
// MISSING LINE 5139
                                          
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
// MISSING LINE 5166
// MISSING LINE 5167
// MISSING LINE 5168
// MISSING LINE 5169
// MISSING LINE 5170
// MISSING LINE 5171
// MISSING LINE 5172
// MISSING LINE 5173
// MISSING LINE 5174
// MISSING LINE 5175
// MISSING LINE 5176
// MISSING LINE 5177
// MISSING LINE 5178
// MISSING LINE 5179
// MISSING LINE 5180
// MISSING LINE 5181
// MISSING LINE 5182
// MISSING LINE 5183
// MISSING LINE 5184
// MISSING LINE 5185
// MISSING LINE 5186
// MISSING LINE 5187
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
// MISSING LINE 5211
// MISSING LINE 5212
// MISSING LINE 5213
// MISSING LINE 5214
// MISSING LINE 5215
// MISSING LINE 5216
// MISSING LINE 5217
// MISSING LINE 5218
// MISSING LINE 5219
// MISSING LINE 5220
// MISSING LINE 5221
// MISSING LINE 5222
// MISSING LINE 5223
// MISSING LINE 5224
// MISSING LINE 5225
// MISSING LINE 5226
// MISSING LINE 5227
// MISSING LINE 5228
// MISSING LINE 5229
// MISSING LINE 5230
// MISSING LINE 5231
// MISSING LINE 5232
// MISSING LINE 5233
// MISSING LINE 5234
// MISSING LINE 5235
// MISSING LINE 5236
// MISSING LINE 5237
// MISSING LINE 5238
// MISSING LINE 5239
// MISSING LINE 5240
// MISSING LINE 5241
// MISSING LINE 5242
// MISSING LINE 5243
// MISSING LINE 5244
// MISSING LINE 5245
// MISSING LINE 5246
// MISSING LINE 5247
// MISSING LINE 5248
// MISSING LINE 5249
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
// MISSING LINE 5296
// MISSING LINE 5297
// MISSING LINE 5298
// MISSING LINE 5299
// MISSING LINE 5300
// MISSING LINE 5301
// MISSING LINE 5302
// MISSING LINE 5303
// MISSING LINE 5304
// MISSING LINE 5305
// MISSING LINE 5306
// MISSING LINE 5307
// MISSING LINE 5308
// MISSING LINE 5309
// MISSING LINE 5310
// MISSING LINE 5311
// MISSING LINE 5312
// MISSING LINE 5313
// MISSING LINE 5314
// MISSING LINE 5315
// MISSING LINE 5316
// MISSING LINE 5317
// MISSING LINE 5318
// MISSING LINE 5319
// MISSING LINE 5320
// MISSING LINE 5321
// MISSING LINE 5322
// MISSING LINE 5323
// MISSING LINE 5324
// MISSING LINE 5325
// MISSING LINE 5326
// MISSING LINE 5327
// MISSING LINE 5328
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
// MISSING LINE 5351
// MISSING LINE 5352
// MISSING LINE 5353
// MISSING LINE 5354
// MISSING LINE 5355
// MISSING LINE 5356
// MISSING LINE 5357
// MISSING LINE 5358
// MISSING LINE 5359
// MISSING LINE 5360
// MISSING LINE 5361
// MISSING LINE 5362
// MISSING LINE 5363
// MISSING LINE 5364
// MISSING LINE 5365
// MISSING LINE 5366
// MISSING LINE 5367
// MISSING LINE 5368
// MISSING LINE 5369
// MISSING LINE 5370
// MISSING LINE 5371
// MISSING LINE 5372
// MISSING LINE 5373
// MISSING LINE 5374
// MISSING LINE 5375
// MISSING LINE 5376
// MISSING LINE 5377
// MISSING LINE 5378
// MISSING LINE 5379
// MISSING LINE 5380
// MISSING LINE 5381
// MISSING LINE 5382
// MISSING LINE 5383
// MISSING LINE 5384
// MISSING LINE 5385
// MISSING LINE 5386
// MISSING LINE 5387
// MISSING LINE 5388
// MISSING LINE 5389
// MISSING LINE 5390
// MISSING LINE 5391
// MISSING LINE 5392
// MISSING LINE 5393
// MISSING LINE 5394
// MISSING LINE 5395
// MISSING LINE 5396
// MISSING LINE 5397
// MISSING LINE 5398
// MISSING LINE 5399
// MISSING LINE 5400
// MISSING LINE 5401
// MISSING LINE 5402
// MISSING LINE 5403
// MISSING LINE 5404
// MISSING LINE 5405
// MISSING LINE 5406
// MISSING LINE 5407
// MISSING LINE 5408
// MISSING LINE 5409
// MISSING LINE 5410
// MISSING LINE 5411
// MISSING LINE 5412
// MISSING LINE 5413
// MISSING LINE 5414
// MISSING LINE 5415
// MISSING LINE 5416
// MISSING LINE 5417
// MISSING LINE 5418
// MISSING LINE 5419
// MISSING LINE 5420
// MISSING LINE 5421
// MISSING LINE 5422
// MISSING LINE 5423
// MISSING LINE 5424
// MISSING LINE 5425
// MISSING LINE 5426
// MISSING LINE 5427
// MISSING LINE 5428
// MISSING LINE 5429
// MISSING LINE 5430
// MISSING LINE 5431
// MISSING LINE 5432
// MISSING LINE 5433
// MISSING LINE 5434
// MISSING LINE 5435
// MISSING LINE 5436
// MISSING LINE 5437
// MISSING LINE 5438
// MISSING LINE 5439
// MISSING LINE 5440
// MISSING LINE 5441
// MISSING LINE 5442
// MISSING LINE 5443
// MISSING LINE 5444
// MISSING LINE 5445
// MISSING LINE 5446
// MISSING LINE 5447
// MISSING LINE 5448
// MISSING LINE 5449
// MISSING LINE 5450
// MISSING LINE 5451
// MISSING LINE 5452
// MISSING LINE 5453
// MISSING LINE 5454
// MISSING LINE 5455
// MISSING LINE 5456
// MISSING LINE 5457
// MISSING LINE 5458
// MISSING LINE 5459
// MISSING LINE 5460
// MISSING LINE 5461
// MISSING LINE 5462
// MISSING LINE 5463
// MISSING LINE 5464
// MISSING LINE 5465
// MISSING LINE 5466
// MISSING LINE 5467
// MISSING LINE 5468
// MISSING LINE 5469
// MISSING LINE 5470
// MISSING LINE 5471
// MISSING LINE 5472
// MISSING LINE 5473
// MISSING LINE 5474
// MISSING LINE 5475
// MISSING LINE 5476
// MISSING LINE 5477
// MISSING LINE 5478
// MISSING LINE 5479
// MISSING LINE 5480
// MISSING LINE 5481
// MISSING LINE 5482
// MISSING LINE 5483
// MISSING LINE 5484
// MISSING LINE 5485
// MISSING LINE 5486
// MISSING LINE 5487
// MISSING LINE 5488
// MISSING LINE 5489
// MISSING LINE 5490
// MISSING LINE 5491
// MISSING LINE 5492
// MISSING LINE 5493
// MISSING LINE 5494
// MISSING LINE 5495
// MISSING LINE 5496
// MISSING LINE 5497
// MISSING LINE 5498
// MISSING LINE 5499
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
// MISSING LINE 5566
// MISSING LINE 5567
// MISSING LINE 5568
// MISSING LINE 5569
// MISSING LINE 5570
// MISSING LINE 5571
// MISSING LINE 5572
// MISSING LINE 5573
// MISSING LINE 5574
// MISSING LINE 5575
// MISSING LINE 5576
// MISSING LINE 5577
// MISSING LINE 5578
// MISSING LINE 5579
// MISSING LINE 5580
// MISSING LINE 5581
// MISSING LINE 5582
// MISSING LINE 5583
// MISSING LINE 5584
// MISSING LINE 5585
// MISSING LINE 5586
// MISSING LINE 5587
// MISSING LINE 5588
// MISSING LINE 5589
// MISSING LINE 5590
// MISSING LINE 5591
// MISSING LINE 5592
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
// MISSING LINE 5661
// MISSING LINE 5662
// MISSING LINE 5663
// MISSING LINE 5664
// MISSING LINE 5665
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
