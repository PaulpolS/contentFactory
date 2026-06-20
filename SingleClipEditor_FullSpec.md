# 🎬 Single Clip Editor (โหมดตัดต่อคลิปเดียว) — Full Build Spec

เอกสารนี้อธิบาย **ฟีเจอร์ "ตัด/สุ่มต่อคลิป" (Single Clip Editor)** ทั้งหมดแบบครบจบ
เพื่อให้นำไปสร้างใหม่บนเครื่อง/โปรเจกต์อื่นได้ทันทีโดยไม่ต้องเดา

ฟีเจอร์นี้มี **2 โหมดในหน้าเดียว**:
1. **✂️ Jump Cut เดิม** — ตัดทุกคลิปในโฟลเดอร์ด้วยสูตร Scene 1 (คลิปเปิดยาว) + Scene 2 (Jump Cuts จังหวะนรก) + เอฟเฟกต์ + Transition + BGM
2. **🎲 สุ่มต่อคลิปตามเวลา (Assembly)** — สุ่มหยิบคลิปไม่ซ้ำจากโฟลเดอร์ มาต่อกันให้ได้ความยาวที่กำหนด (เช่น 45 วิ) สร้างได้หลายไฟล์ต่อรอบ

---

## 1. สถาปัตยกรรมโดยรวม (Architecture)

```
[ React UI (SingleClipEditorTab.tsx) ]
        │  fetch() → /api/...
        ▼
[ Vite Dev-Server Middleware (vite.config.ts) ]   ← นี่คือ "backend"
        │  spawn('bash', tmpScript)  /  spawn(ffprobe)
        ▼
[ FFmpeg / FFprobe บนเครื่อง (Homebrew) ]
        │
        ▼
[ ไฟล์ .mp4 ใน Output folder ]
```

**จุดสำคัญ:** โปรเจกต์นี้ **ไม่มี backend แยก** — ใช้ Vite plugin middleware เป็นตัวรับ API
ทั้งหมดทำงานผ่าน `npm run dev` (Vite dev server) เท่านั้น ไม่ใช่ production server

### Tech Stack
| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite 5 |
| Styling | Tailwind CSS 3 (มี dark mode + CSS variables `--bg-card`, `--border-color`, `--text-main`) |
| Icons | (ในหน้านี้ใช้ emoji ล้วน ไม่พึ่ง icon library) |
| Backend | Vite middleware (`server.middlewares.use`) ใน `vite.config.ts` |
| Render engine | FFmpeg + FFprobe (เรียกผ่าน `child_process.spawn`) |
| Native dialog | macOS `osascript` (`choose folder` / `choose file`) |

### Dependencies ที่จำเป็น (package.json)
```jsonc
"dependencies": {
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "ffmpeg-static": "^5.2.0"   // fallback หา ffmpeg ถ้าไม่มีใน brew
},
"devDependencies": {
  "vite": "^5.2.0",
  "@vitejs/plugin-react": "^4.2.1",
  "typescript": "^5.2.2",
  "tailwindcss": "^3.4.3",
  "autoprefixer": "^10.4.19",
  "postcss": "^8.4.38"
}
```

### ความต้องการของเครื่อง (Prerequisites)
- **macOS** (เพราะใช้ `osascript` เปิด native folder/file picker และ path เป็นแบบ `/opt/homebrew/...`)
- ติดตั้ง FFmpeg ผ่าน Homebrew:
  ```bash
  brew install ffmpeg
  # แนะนำ ffmpeg-full เพื่อให้ได้ frei0r plugins (Cartoon/Glitch effect):
  brew install homebrew-ffmpeg/ffmpeg/ffmpeg --with-frei0r --with-... # หรือ
  brew install frei0r
  ```
- Node.js 18+

> ⚠️ **ถ้าจะพอร์ตไป Windows/Linux:** ต้องเปลี่ยน 3 จุด — (1) `osascript` picker เป็น dialog ของ OS นั้น, (2) hardcoded path `/opt/homebrew/...`, (3) path separator. ดูหัวข้อ [§8 จุดที่ต้องแก้เวลาย้ายเครื่อง](#8-จุดที่ต้องแก้เวลาย้ายเครื่อง)

---

## 2. โครงสร้างไฟล์ที่เกี่ยวข้อง

```
src/
├─ components/
│  ├─ editor/SingleClipEditorTab.tsx   ← หน้าจอหลัก (UI + state + fetch logic)
│  └─ ui/
│     ├─ NumInput.tsx                  ← input ตัวเลขที่ลบค่าทิ้งเพื่อพิมพ์ใหม่ได้
│     └─ Card.tsx                      ← การ์ด wrapper
├─ utils/ffmpegBuilder.ts             ← "สมอง" สร้าง FFmpeg filter_complex + bash script
vite.config.ts                        ← backend API ทั้งหมด (middleware)
public/BG_music/*.mp3                  ← เพลง BGM (โหลดอัตโนมัติด้วย import.meta.glob)
```

---

## 3. Frontend: `SingleClipEditorTab.tsx`

### 3.1 State ทั้งหมด

```ts
// โหมด
const [activeMode, setActiveMode] = useState<'jumpcut' | 'assembly'>('jumpcut');

// === Jump Cut mode ===
const [clipPath, setClipPath]   = useState('/Users/macos/Desktop/Done/example.mp4');   // โฟลเดอร์ต้นฉบับ
const [outputPath, setOutputPath] = useState('/Users/macos/Desktop/Done/example_output.mp4'); // โฟลเดอร์ output

// Scene 1 (คลิปเปิดแบบยาว)
const [s1Start, setS1Start] = useState(0.0);
const [s1End, setS1End]     = useState(8.0);

// Scene 2 (Jump Cuts)
const [templateKey, setTemplateKey] = useState(Object.keys(TEMPLATES)[0]); // default = Quick Cut
const [nCuts, setNCuts]   = useState(8);     // จำนวน cut
const [cutDur, setCutDur] = useState(0.5);   // ความยาวต่อ cut (วิ)
const [s2Total, setS2Total] = useState(4.0); // เวลารวม = nCuts*cutDur (อ่านอย่างเดียว)

// Audio / BGM
const [bgmPath, setBgmPath] = useState('');
const [bgmVol, setBgmVol]   = useState(0.2);   // 0.0-1.0
const [bgmRamp, setBgmRamp] = useState(0.0);   // วินาทีที่เริ่มดันเสียงขึ้นเป็น 1.0

// Transition
const [transDur, setTransDur]   = useState(1.0);
const [transType, setTransType] = useState('fade');

// Effects (object คีย์ → {label, var:boolean})
const [scEffects, setScEffects]     = useState(DEFAULT_EFFECTS);            // Scene 1
const [scEffectsS2, setScEffectsS2] = useState(DEFAULT_EFFECTS ทุกตัว var=false); // Scene 2

// === Assembly mode ===
const [assemblySourceFolder, setAssemblySourceFolder] = useState(localStorage 'singleclip_assembly_source');
const [assemblyOutputFolder, setAssemblyOutputFolder] = useState(localStorage 'singleclip_assembly_output');
const [assemblyTargetSeconds, setAssemblyTargetSeconds] = useState(45);
const [assemblyOutputCount, setAssemblyOutputCount]     = useState(0);  // 0 = auto จนใช้คลิปครบ
const [assemblyOutputName, setAssemblyOutputName]       = useState('random_cut');
const [assemblyWidth, setAssemblyWidth]   = useState(1080);
const [assemblyHeight, setAssemblyHeight] = useState(1920);
const [assemblyUsedKeys, setAssemblyUsedKeys] = useState(localStorage 'singleclip_assembly_used_keys'); // string[]
const [assemblyLastPlan, setAssemblyLastPlan] = useState<AssemblyClipPlan[]>([]);

// === Run state (ใช้ร่วมกันทั้ง 2 โหมด) ===
const [isRunning, setIsRunning] = useState(false);
const [runLog, setRunLog]       = useState<string[]>([]);
const [runStatus, setRunStatus] = useState<'idle'|'running'|'done'|'error'>('idle');
const abortRef = useRef<(() => void) | null>(null);   // เก็บฟังก์ชัน abort ของ fetch
```

### 3.2 localStorage keys
| Key | ใช้เก็บ |
|-----|---------|
| `singleclip_assembly_source`    | path โฟลเดอร์ต้นทาง (โหมดสุ่ม) |
| `singleclip_assembly_output`    | path โฟลเดอร์ปลายทาง (โหมดสุ่ม) |
| `singleclip_assembly_used_keys` | `string[]` ของคลิปที่เคยถูกสุ่มใช้แล้ว (กันซ้ำข้ามรอบ) |

### 3.3 useEffect สำคัญ
```ts
// 1) sync เวลารวม Scene2 อัตโนมัติ
useEffect(() => { setS2Total(parseFloat((nCuts * cutDur).toFixed(2))); }, [nCuts, cutDur]);

// 2) auto-scroll log ไปล่างสุดทุกครั้งที่มี log ใหม่
useEffect(() => { logEndRef.current?.scrollIntoView({behavior:'smooth'}); }, [runLog]);

// 3) persist โฟลเดอร์ assembly ลง localStorage
useEffect(() => localStorage.setItem('singleclip_assembly_source', assemblySourceFolder), [assemblySourceFolder]);
useEffect(() => localStorage.setItem('singleclip_assembly_output', assemblyOutputFolder), [assemblyOutputFolder]);
```

### 3.4 BGM dropdown — โหลดเพลงอัตโนมัติ
```ts
const bgmModules = import.meta.glob('/public/BG_music/*.{mp3,wav,m4a,aac}', { eager: true });
const BG_MUSIC_OPTIONS = Object.keys(bgmModules).map(p => p.split('/').pop() || '');
// path เต็มที่ใช้จริงตอนรัน:
const ABSOLUTE_BGM_DIR = "/Users/macos/Desktop/.../BulkVideoCreatorApp/public/BG_music";
```
Dropdown มี 3 ประเภท option: `''` (ไม่ใช้เพลง), เพลงในโฟลเดอร์ (value = `${ABSOLUTE_BGM_DIR}/ชื่อไฟล์`), และ `custom` (เปิด native file picker)

> ⚠️ `ABSOLUTE_BGM_DIR` เป็น **hardcoded path** ต้องแก้ให้ตรงเครื่องใหม่

### 3.5 ปุ่ม/Flow ของ Jump Cut mode

**ปุ่มบนหัว:**
- `💾 สร้างสคริปต์ .command` → `handleGenerateScript()` — สร้าง bash script แล้ว **download เป็นไฟล์ `.command`** (ดับเบิลคลิกรันบน Mac ได้) ไม่รันทันที
- `▶ ตัดต่อเลย!` → `handleRun()` — รันทันทีผ่าน API แบบ stream log สด
- ขณะรัน ปุ่มเปลี่ยนเป็น `⛔ หยุด` → `handleStop()` (เรียก `abortRef.current()`)

**`handleRun()` ทำงานยังไง:**
```
1. POST /api/list-folder-videos { folder: clipPath }   → ได้ list ชื่อไฟล์วิดีโอในโฟลเดอร์
2. วน loop ทุกไฟล์:
   - basename = ชื่อไฟล์ตัดนามสกุล
   - outFile  = outputPath + '/' + basename + '_output.mp4'
   - cuts     = calculateCuts(...)
   - script   = buildBashScript(config) แต่ "ตัด shebang + comment ออก"
   - ต่อเข้า scriptParts[]
3. รวมเป็น 1 bash script ใหญ่ (ห่อด้วย header: set -euo pipefail, export PATH, mkdir -p output, echo progress)
4. POST /api/run-bash-script { script } → อ่าน response แบบ SSE stream
5. parse แต่ละบรรทัดที่ขึ้นต้น 'data: ' → JSON {type:'log'|'done'|'error', text}
   - 'log'   → push เข้า runLog (เก็บแค่ 100 บรรทัดล่าสุด)
   - 'done'  → runStatus='done'
   - 'error' → push '[ERROR]...' + runStatus='error'
```

> 📌 **สำคัญ:** ปุ่ม "ตัดต่อเลย!" จริง ๆ ทำ **ทุกไฟล์ในโฟลเดอร์** ไม่ใช่ไฟล์เดียว (แม้ state ชื่อ `clipPath` จะดูเหมือน path ไฟล์ แต่ตอนรันใช้เป็นโฟลเดอร์)

### 3.6 ปุ่ม/Flow ของ Assembly mode

- `▶ สุ่มต่อคลิปเลย!` → `handleRunAssembly()`
- `📁 เลือกต้นทาง / ปลายทาง` → `handlePickAssemblyFolder('source'|'output')` → POST `/api/pick-folder`
- `♻️ ล้างประวัติคลิปที่เคยใช้แล้ว` → `clearAssemblyHistory()` (confirm + ล้าง `assemblyUsedKeys` + localStorage)

**`handleRunAssembly()`:**
```
POST /api/build-random-clip-assembly {
  sourceFolder, outputFolder, targetSeconds, outputCount, outputName, width, height, usedKeys
}
→ อ่าน SSE stream:
  - 'log'  → runLog
  - 'plan' → setAssemblyLastPlan(clips) + log สรุป (สร้างกี่ไฟล์/ใช้กี่ชิ้น/เติมซ้ำกี่คลิป)
  - 'done' → อัปเดต assemblyUsedKeys จาก payload.historyKeys (หรือ usedKeys) + บันทึก localStorage + log output paths
  - 'error'→ log
```

### 3.7 calculateCuts() — คำนวณตำแหน่งตัด (ฝั่ง client, สำหรับ preview/generate)
```ts
const calculateCuts = (totalClipAssume = 30) => {
  const tmpl = TEMPLATES[templateKey];
  // กรณี Custom: แบ่งเท่า ๆ กันแบบ sequential
  if (templateKey.includes("Custom") || !tmpl) {
    const sec = totalClipAssume / nCuts;
    return Array.from({length:nCuts}, (_,i) => ({ ts: i*sec, dur: cutDur }));
  }
  const section = totalClipAssume / nCuts;
  // ถ้า dynamic ใช้ beat pattern หมุนวน, ไม่งั้นใช้ cutDur คงที่
  const beats = [0.3,0.7,0.4,0.8,0.5,0.6,0.3,0.7];
  const durs = tmpl.dynamic
    ? Array.from({length:nCuts}, (_,i) => beats[i % beats.length])
    : Array.from({length:nCuts}, () => cutDur);

  const cuts = [];
  for (let i=0; i<nCuts; i++) {
    const di = durs[i];
    const lo = i*section;
    let hi = (i+1)*section - di;
    if (hi <= lo) hi = lo + 0.01;
    let ts = lo + (hi-lo)/2;                       // เลือกกึ่งกลาง section (deterministic)
    ts = Math.max(0, Math.min(ts, totalClipAssume - di));
    cuts.push({ ts, dur: di });
  }
  return cuts;
};

// timeline ที่ใช้คำนวณ = max(s1End, cutDur, 0.1)
const getCutTimelineDuration = () => Math.max((s1End>0 ? s1End : 30), cutDur, 0.1);
```

---

## 4. Engine: `src/utils/ffmpegBuilder.ts` (สมองของการตัดต่อ)

### 4.1 TEMPLATES (สไตล์ Jump Cut สำเร็จรูป)
```ts
export const TEMPLATES = {
  "⚡ Quick Cut  (0.5วิ × 8)":   { cut_dur: 0.5, n_cuts: 8,  dynamic: false },
  "🔥 Highlight  (0.8วิ × 6)":   { cut_dur: 0.8, n_cuts: 6,  dynamic: false },
  "💫 Dynamic Beat (สลับจังหวะ)": { cut_dur: 0.5, n_cuts: 8,  dynamic: true  },
  "😈 Phonk Beat (0.4วิ × 10)":   { cut_dur: 0.4, n_cuts: 10, dynamic: true  },
  "🌊 Slow Reveal (1.5วิ × 4)":  { cut_dur: 1.5, n_cuts: 4,  dynamic: false },
  "🎯 Micro Cuts  (0.3วิ × 10)": { cut_dur: 0.3, n_cuts: 10, dynamic: false },
  "✏️ Custom (กำหนดเอง)":         { cut_dur: 0.5, n_cuts: 6,  dynamic: false },
};
```
- `dynamic: true` = ความยาวแต่ละ cut สลับตาม beat pattern `[0.3,0.7,0.4,0.8,0.5,0.6,0.3,0.7]`
- เลือก template แล้ว `nCuts`/`cutDur` จะถูก set ตาม template ทันที (`handleTemplateChange`)

### 4.2 DEFAULT_EFFECTS (รายการเอฟเฟกต์ใน UI)
```ts
const DEFAULT_EFFECTS = {
  fade_in:    { var: true,  label: "Fade In (ค่อยๆ เปิด)" },
  sharpen:    { var: true,  label: "Sharpen (เพิ่มความคม)" },
  vignette:   { var: false, label: "Vignette (ขอบมืด)" },
  glow:       { var: false, label: "Glow / Bloom (แสงเรือง)" },
  grain:      { var: false, label: "Film Grain (เม็ดฟิล์ม)" },
  chroma_ab:  { var: false, label: "Chromatic Aberration" },
  color_grade:{ var: false, label: "Color Grade (โทนอุ่น)" },
  zoom:       { var: false, label: "Ken Burns Zoom" },
  phonk_flash:{ var: false, label: "💥 Phonk Flash" },
  phonk_shake:{ var: false, label: "🫨 Phonk Shake" },
  phonk_invert:{var: false, label: "🔄 Phonk Invert" },
  fr_cartoon: { var: false, label: "🎨 Cartoon (frei0r)" },
  fr_glitch:  { var: false, label: "📺 Glitch (frei0r)" },
};
```
> Scene 1 default เปิด `fade_in`+`sharpen`; Scene 2 ปิดทุกตัว

### 4.3 ตาราง map เอฟเฟกต์ → FFmpeg filter (จากฟังก์ชัน `buildFx`)

แต่ละ effect ที่ var=true จะ chain ต่อกันตามลำดับด้านล่าง (label ภายในใช้ pattern `[{prefix}_{tag}_{n}]`):

| Key | FFmpeg filter |
|-----|---------------|
| `fade_in`    | `fade=t=in:st=0:d=0.5` |
| `zoom`       | `zoompan=z='min(zoom+0.0008,1.08)':d=${fps}*${zoom_dur}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=iwxih` |
| `color_grade`| `curves=r='0/0 0.5/0.58 1/1':g='0/0 0.5/0.50 1/1':b='0/0 0.5/0.42 1/0.9'` |
| `sharpen`    | `unsharp=5:5:1.2:5:5:0.0` |
| `chroma_ab`  | `rgbashift=rh=2:bh=-2` |
| `vignette`   | `vignette=angle=PI/4` |
| `phonk_flash`| `eq=brightness='0.2*sin(t*8)':contrast=1.2` |
| `phonk_shake`| `crop=iw*0.9:ih*0.9:iw*0.05+20*sin(t*15):ih*0.05+20*cos(t*15),scale=iw:ih` |
| `phonk_invert`| `negate` |
| `glow`       | `split[a][b];[b]gblur=sigma=8[blur];[a][blur]blend=all_mode=screen:all_opacity=0.25` (ข้ามถ้ามี frei0r เปิดอยู่) |
| `grain`      | `noise=alls=8:allf=t+u` |

**frei0r effects** (ต้องมี frei0r plugins ติดตั้ง) — ก่อนใช้ต้อง `format=rgb24` แล้วจบด้วย `format=yuv420p`:
| Key | filter |
|-----|--------|
| `fr_cartoon`  | `frei0r=cartoon:0.5\|0.1` |
| `fr_glow`     | `frei0r=glow:0.5` |
| `fr_glitch`   | `frei0r=glitch0r:0.1\|0.5\|0.5` |
| `fr_pixelize` | `frei0r=pixeliz0r:0.05\|0.05` |
| `fr_scanline` | `frei0r=scanline0r:0` |
| `fr_softglow` | `frei0r=softglow:0.5\|0.75\|0.85` |
| `fr_nervous`  | `frei0r=nervous` |
| `fr_colorize` | `frei0r=colorize:0.5\|0.6\|0.5` |

`FREI0R_KEYS = ["fr_cartoon","fr_glow","fr_glitch","fr_pixelize","fr_scanline","fr_softglow","fr_nervous","fr_colorize"]`

### 4.4 `buildBashScript(config)` — โครงสร้าง bash script ที่ generate

**Config interface:**
```ts
interface SingleClipConfig {
  clipPath: string; outputPath: string;
  scene1Start: number; scene1End: number;
  cutsPreview: { ts: number; dur: number }[];
  bgmPath?: string; bgmVolStart: number; bgmRampAt: number;
  scEffects: {[k:string]: {label,var}};   // Scene 1
  scEffectsS2: {[k:string]: {label,var}}; // Scene 2
  transType: string; transDur: number;
}
```

**ลำดับการสร้าง script:**

**(A) Header + probe ข้อมูลไฟล์**
```bash
#!/bin/bash
set -euo pipefail
CLIP="${1:-<clipPath>}"
OUTPUT="${2:-<outputPath>}"
BGM="<bgmPath or ''>"
# เช็คว่าไฟล์มีจริง ไม่งั้น exit 1
duration=$(ffprobe ... format=duration ...)
fps=$(ffprobe ... stream=r_frame_rate ...)   # เช่น 30/1
sr=$(ffprobe ... stream=sample_rate ...)      # fallback 44100
cl="stereo"
zoom_dur="${duration}"
```

**(B) Input arguments**
```
-i "$CLIP"                                    # input 0 = ไฟล์เต็ม (สำหรับ Scene 1)
-ss <cut.ts> -t <cut.dur> -i "$CLIP"  (×N)    # input 1..N = แต่ละ jump cut
-i "$BGM"                                      # input สุดท้าย (ถ้ามี BGM)
```

**(C) filter_complex — สร้างเป็น array `fc[]` แล้ว join ด้วย `;\n`**

*Scene 1 (วิดีโอ):*
```
[0:v]trim=<s1Start>:<s1End>,setpts=PTS-STARTPTS[s1v_raw]
... buildFx Scene1 effects ...
<curOut>fps=$fps[s1_final]
```

*Scene 2 (วิดีโอ — ต่อ jump cuts):*
```
[1:v]setpts=PTS-STARTPTS,scale=iw:ih:flags=fast_bilinear,format=yuv420p[cv0]
[2:v]...[cv1]   (วนทุก cut)
[cv0][cv1]...concat=n=N:v=1:a=0:unsafe=1[s2_concat]
... buildFx Scene2 effects ...
<curOut>fps=$fps[s2v]
```

*Transition (เชื่อม Scene1 → Scene2):*
```
[s1_final][s2v]xfade=transition=<transType>:duration=<transDur>:offset=<s1Dur - transDur>[vout]
```

*Audio:*
```
[0:a]atrim=<s1Start>:<s1End>,asetpts=PTS-STARTPTS,aformat=...[s1a]   # เสียง Scene1
[1:a]volume=0,...[ca0]  (jump cuts → mute ทุกตัว)
[ca0][ca1]...concat=n=N:v=0:a=1[s2a]
[s1a][s2a]concat=n=2:v=0:a=1[basea]
```

*BGM mixing (ถ้ามี):*
```
# volume ramp: คงที่ bgmVolStart จนถึง rampAt แล้วไต่ขึ้นเป็น 1.0 ตอน s1Dur
[<bgmIdx>:a]volume='if(lt(t,RAMPAT),VOL, if(lt(t,S1DUR), VOL+(1-VOL)*((t-RAMPAT)/RAMPDUR), 1.0))':eval=frame,aformat=...[amusic]
[basea][amusic]amix=inputs=2:duration=first:normalize=0[finala]
# ถ้าไม่มี BGM: [basea]anull[finala]
```

**(D) คำสั่ง ffmpeg จริง**
```bash
export FREI0R_PATH="/usr/local/lib/frei0r-1:/opt/homebrew/lib/frei0r-1:$FREI0R_PATH"
ffmpeg -y <inputArgs> \
  -filter_complex "<fc joined>" \
  -map '[vout]' -map '[finala]' \
  -c:v libx264 -preset medium -crf 23 \
  -pix_fmt yuv420p \
  -c:a aac -b:a 192k \
  -shortest -movflags +faststart \
  "$OUTPUT"
# เช็ค output มีขนาด > 0 ไม่งั้น exit 1
```

> 💡 ทั้งหมดต่อกันใน **filter_complex ครั้งเดียว** = re-encode รอบเดียว ได้ไฟล์เดียวที่ Scene1 ตามด้วย Scene2 มี transition คั่น และมี BGM ผสม

---

## 5. Backend API (Vite middleware ใน `vite.config.ts`)

ทุก endpoint เป็น `server.middlewares.use('/api/...', (req,res)=>{...})`
รับ POST body เป็น JSON, ตอบ JSON ธรรมดา **หรือ** SSE stream (`text/event-stream`)

### 5.1 Helper functions (วางไว้ระดับ module)
```ts
function getFFmpegPath(): string {
  // ลำดับการหา: ffmpeg-full → brew → ffmpeg-static → 'ffmpeg'
  for (const p of ['/opt/homebrew/opt/ffmpeg-full/bin/ffmpeg', '/opt/homebrew/bin/ffmpeg'])
    if (fs.existsSync(p)) return p;
  try { return require('ffmpeg-static') || 'ffmpeg'; } catch { return 'ffmpeg'; }
}
function getFFprobePath(): string {
  for (const p of ['/opt/homebrew/opt/ffmpeg-full/bin/ffprobe', '/opt/homebrew/bin/ffprobe'])
    if (fs.existsSync(p)) return p;
  return 'ffprobe';
}
// PATH ที่ inject ให้ทุก spawn:
const FF_PATH = `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH||''}`;
```

### 5.2 `POST /api/pick-folder` — native folder picker (macOS)
```ts
// body: { prompt?: string }  → res: { success, dir } | { success:false, cancelled:true }
const safePrompt = prompt.replace(/'/g, '’');  // กัน quote พัง
const result = execSync(
  `osascript -e 'POSIX path of (choose folder with prompt "${safePrompt}")'`,
  { encoding:'utf-8', timeout:60000 }
).trim().replace(/\/$/, '');   // ตัด trailing slash
res.end(JSON.stringify({ success:true, dir:result }));
// ถ้า user กด cancel → execSync throw → ตอบ { success:false, cancelled:true }
```

### 5.3 `POST /api/pick-file` — native file picker (macOS)
เหมือน pick-folder แต่ใช้ `choose file` และคืน `{ success, file }` (ไม่ตัด trailing slash)

### 5.4 `POST /api/list-folder-videos` — list ไฟล์วิดีโอในโฟลเดอร์
```ts
// body: { folder } → res: { files: string[] }
const VIDEO_EXTS = ['.mp4','.mov','.avi','.mkv','.m4v','.webm'];
const files = fs.readdirSync(folder).filter(f => VIDEO_EXTS.includes(path.extname(f).toLowerCase()));
res.end(JSON.stringify({ files }));
```

### 5.5 `POST /api/run-bash-script` — รัน bash script + stream log (SSE)

> ใช้โดยปุ่ม "▶ ตัดต่อเลย!" (Jump Cut mode)

```ts
server.middlewares.use('/api/run-bash-script', (req, res) => {
  if (req.method !== 'POST') { res.statusCode = 405; res.end(''); return; }
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  const { spawn } = require('child_process');
  let body = '';
  req.on('data', (c: Buffer) => { body += c.toString(); });
  req.on('end', () => {
    let script = '';
    try { script = JSON.parse(body).script || ''; } catch {}
    if (!script) { res.write('data: '+JSON.stringify({type:'error',text:'No script provided'})+'\n\n'); res.end(); return; }

    // เขียน script ลงไฟล์ temp ที่ exec ได้
    const tmpFile = `/tmp/singleclip_render_${Date.now()}.sh`;
    try { fs.writeFileSync(tmpFile, script, { mode: 0o755 }); }
    catch (e:any) { res.write('data: '+JSON.stringify({type:'error',text:'Failed to write temp file: '+e.message})+'\n\n'); res.end(); return; }

    const env = { ...process.env, PATH: FF_PATH };
    const proc = spawn('bash', [tmpFile], { stdio:['ignore','pipe','pipe'], env });
    const cleanup = () => { try { fs.unlinkSync(tmpFile); } catch {} };
    let finished = false;
    const send = (o:object) => { if (!res.writableEnded) { try { res.write('data: '+JSON.stringify(o)+'\n\n'); } catch {} } };

    // ส่งทุกบรรทัด stdout/stderr เป็น log
    proc.stdout.on('data', d => d.toString().split('\n').forEach(l => l.trim() && send({type:'log',text:l})));
    proc.stderr.on('data', d => d.toString().split('\n').forEach(l => l.trim() && send({type:'log',text:l})));

    proc.on('close', (code) => {
      if (finished) return; finished = true; cleanup();
      if (code === 0) send({type:'done'});
      else send({type:'error', text: code!=null ? `ffmpeg exited (code ${code}) — ดู log ด้านบน` : 'Process stopped'});
      if (!res.writableEnded) res.end();
    });
    proc.on('error', (err) => { if (finished) return; finished=true; cleanup(); send({type:'error',text:err.message}); if (!res.writableEnded) res.end(); });

    // ถ้า client ตัดการเชื่อมต่อ (กด ⛔ หยุด) → kill process
    res.on('close', () => { if (!finished) { proc.kill(); cleanup(); } });
  });
});
```

**Protocol (SSE):** แต่ละบรรทัด = `data: {json}\n\n`
| type | payload |
|------|---------|
| `log`   | `{ type:'log', text }` |
| `done`  | `{ type:'done' }` |
| `error` | `{ type:'error', text }` |

### 5.6 `POST /api/build-random-clip-assembly` — สุ่มต่อคลิป (SSE)

> ใช้โดยปุ่ม "▶ สุ่มต่อคลิปเลย!" (Assembly mode)

**Request body:**
```ts
{ sourceFolder, outputFolder, targetSeconds, outputCount, outputName, width, height, usedKeys: string[] }
```

**อัลกอริทึมโดยสรุป:**
```
1. validate + sanitize input (clamp targetSeconds 1..3600, width/height 320..7680, outputCount 0..1000)
   outputBase = sanitize(outputName) || 'random_cut'
2. mkdir -p outputFolder
3. อ่านไฟล์วิดีโอทั้งหมด (VIDEO_EXTS) → แต่ละไฟล์ key = `${sourceFolder}::${filename}`
4. กรอง usedKeys ที่ยังมีอยู่จริง (carriedUsedKeys)
   - cycleReset = (carriedUsedKeys >= จำนวนไฟล์ทั้งหมด) → เริ่มรอบใหม่ (history ว่าง)
   - historyBase = cycleReset ? ∅ : carriedUsedKeys
5. อ่าน duration ทุกไฟล์ด้วย ffprobe (concurrency 15) + cache ลง .durations_cache.json
   - cache key = filePath, ใช้ได้ถ้า mtimeMs + size ตรงกัน (กัน re-probe ทุกครั้ง)
6. สร้าง jobs (= ไฟล์ output แต่ละไฟล์):
   maxOutputs = outputCount>0 ? outputCount : max(1, จำนวนคลิป)
   loop จนได้ครบ maxOutputs:
     - ถ้า outputCount==0 และ history ครบทุกไฟล์แล้ว → หยุด
     - ถ้า outputCount>0 และ history ครบ → reset history เริ่มรอบใหม่
     - remaining = targetSeconds
     - freshClips = shuffle(คลิปที่ยังไม่อยู่ใน history)
     - addSegment(clip):
         naturalTake = remaining<=8 ? remaining : 3 + random*5   // ความยาวธรรมชาติ 3-8 วิ
         segDuration = min(clip.duration, remaining, max(0.5, naturalTake))
         start       = random ในช่วง [0, clip.duration - segDuration]
         push {start, segmentDuration, fromReuse, outputIndex}
         remaining -= segDuration
     - เติม freshClips ก่อน (fromReuse=false) จนกว่า remaining<=0.05
     - ถ้ายังไม่ครบ → refill loop (สูงสุด 2000 รอบ): สุ่มคลิป "ที่เคยใช้แล้ว" มาเติม (fromReuse=true)
     - ถ้า remaining>0.25 หรือไม่มี segment → error (คลิปในโฟลเดอร์ไม่พอ)
     - outputPath = outputFolder/`${outputBase}_${stamp}${suffix}.mp4`
       (suffix = '' ถ้า outputCount==1, ไม่งั้น '_01','_02',...)
7. ส่ง event 'plan' (รายการคลิปทั้งหมด) ให้ UI แสดง
8. สร้าง bash script: แต่ละ segment → ffmpeg ตัด+scale/pad เป็น temp .mp4, แล้ว concat demuxer รวม
9. spawn bash → stream log → 'done' (พร้อม historyKeys ใหม่)
```

**bash ที่ generate (ต่อ segment):**
```bash
# normalize ทุก segment เป็นขนาดเดียวกัน (สำคัญมากเพื่อ concat -c copy ได้)
VF="scale=W:H:force_original_aspect_ratio=decrease,pad=W:H:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=30,format=yuv420p"
ffmpeg -y -ss <start> -t <dur> -i <clip> -map 0:v:0 -an \
  -vf "$VF" -c:v libx264 -preset veryfast -crf 20 -movflags +faststart <segPath>
# ...ทำทุก segment แล้ว...
cat > concat_list.txt <<'EOF'
file '<seg1>'
file '<seg2>'
EOF
ffmpeg -y -f concat -safe 0 -i concat_list.txt -c copy <outputPath>
rm -rf "$TMP_DIR"
```

**SSE events:**
| type | payload |
|------|---------|
| `log`   | `{type:'log', text}` |
| `plan`  | `{type:'plan', outputPaths, outputCount, usedKeys, historyKeys, cycleReset, clips:[{filename,key,start,duration,sourceDuration,fromReuse,outputIndex,outputFilename}]}` |
| `done`  | `{type:'done', outputPaths, outputCount, usedKeys, historyKeys, cycleReset, cycleCompleted}` |
| `error` | `{type:'error', text}` |

**Sanitize helper ที่ใช้สร้างคำสั่ง shell (สำคัญด้านความปลอดภัย):**
```ts
const sh = (v:string) => `'${String(v).replace(/'/g, `'\\''`)}'`;  // single-quote escape ทุก argument
```

> 📌 **กลไกกันคลิปซ้ำ (cycle):** ระบบจะใช้คลิป "ใหม่" ให้ครบทุกไฟล์ก่อน เก็บใน `historyKeys` (UI persist ลง localStorage `singleclip_assembly_used_keys`) เมื่อใช้ครบรอบจะ reset เริ่มสุ่มใหม่ได้ ปุ่ม "♻️ ล้างประวัติ" = ล้าง key นี้

---

## 6. Layout ของ UI (สำหรับสร้างหน้าใหม่ให้เหมือน)

```
┌─ Header: 🎬 โหมดตัดต่อคลิปเดียว ────────[💾 สร้างสคริปต์][▶ ตัดต่อเลย!]┐

┌─ Mode Switcher (2 การ์ด) ───────────────────────────────────────────┐
│ [✂️ Jump Cut เดิม]            [🎲 สุ่มต่อคลิปตามเวลา]                  │

── ถ้าโหมด JUMP CUT: grid 2 คอลัมน์ ──────────────────────────────────
ซ้าย:                                  ขวา:
┌ 📂 เลือกไฟล์ต้นฉบับ ┐                ┌ ✂️ Scene 2 (Jump Cuts) ┐
│ [เลือกโฟลเดอร์] path │                │ Template dropdown        │
│ [เลือกโฟลเดอร์] out  │                │ จำนวนCuts|ต่อCut|รวม(ro) │
└────────────────────┘                │ ⚡ Effects (Scene 2) grid │
┌ 🎬 Scene 1 ─────────┐                └─────────────────────────┘
│ เริ่มวิ | จบวิ        │                ┌ ✨ Transition ──────────┐
│ ⚡ Effects (Scene1)  │                │ Type dropdown | Duration │
└────────────────────┘                └─────────────────────────┘
┌ 🎵 BGM ─────────────┐                💡 กล่องคำแนะนำสีเหลือง
│ dropdown|เลือกไฟล์   │
│ ความดัง | Ramp Up    │
└────────────────────┘

── ถ้าโหมด ASSEMBLY: grid 2 คอลัมน์ ──────────────────────────────────
ซ้าย: 📂 โฟลเดอร์ต้นทาง/ปลายทาง + ⏱️ ตั้งค่า (ความยาว|จำนวน Output|ชื่อ|กว้าง|สูง) + ♻️ล้างประวัติ
ขวา: 🧩 แผนคลิปที่สุ่มล่าสุด (list) + 💡 วิธีใช้

── ล่างสุด (ทั้ง 2 โหมด): 📋 Log Output panel (พื้นดำ ตัวอักษรเขียว สูง 64) ──
```

**Transition types ใน dropdown:**
`fade, dissolve, wipeleft, wiperight, slideleft, slideright, circleopen, radial`

---

## 7. ขั้นตอนติดตั้งบนเครื่องใหม่ (Quick Start)

```bash
# 1. ติดตั้ง dependencies
npm install

# 2. ติดตั้ง ffmpeg (+ frei0r ถ้าต้องการ Cartoon/Glitch)
brew install ffmpeg frei0r

# 3. รัน dev server (Vite จะเปิด browser อัตโนมัติ — server.open=true)
npm run dev
```
แล้วเข้าเมนู **"5 ตัดวิดีโอ → ตัด/สุ่มต่อคลิป"** ในแอป

---

## 8. จุดที่ต้องแก้เวลาย้ายเครื่อง

| ที่ | ค่าเดิม (hardcoded) | ต้องทำ |
|-----|--------------------|--------|
| `SingleClipEditorTab.tsx` | `clipPath`/`outputPath` default = `/Users/macos/Desktop/Done/...` | เปลี่ยน หรือปล่อยให้ user เลือกผ่าน picker |
| `SingleClipEditorTab.tsx` | `ABSOLUTE_BGM_DIR = "/Users/macos/Desktop/.../public/BG_music"` | แก้เป็น path จริงของเครื่อง |
| `vite.config.ts` | `getFFmpegPath/getFFprobePath` ชี้ `/opt/homebrew/...` | ปรับ path ถ้าไม่ใช่ Apple Silicon (Intel = `/usr/local/...`) |
| `vite.config.ts` | `FF_PATH` (PATH ที่ inject) | เหมือนข้างบน |
| `buildBashScript` | `FREI0R_PATH=/usr/local/lib/frei0r-1:/opt/homebrew/lib/frei0r-1` | ปรับให้ตรงตำแหน่ง frei0r plugins |
| ทุก picker | `osascript` (macOS เท่านั้น) | ถ้าไป Windows/Linux ต้องเปลี่ยน dialog (เช่น `electron dialog`, `zenity`) |
| `.durations_cache.json` | สร้างที่ project root | ไม่ต้องแก้ แต่ควร gitignore |

---

## 9. สรุปสิ่งที่ต้องสร้างทั้งหมด (Checklist พอร์ตงาน)

- [ ] `src/components/editor/SingleClipEditorTab.tsx` (UI + 2 โหมด + SSE stream handler)
- [ ] `src/utils/ffmpegBuilder.ts` (TEMPLATES, buildFx, buildBashScript)
- [ ] `src/components/ui/NumInput.tsx` + `Card.tsx`
- [ ] Backend middleware ใน `vite.config.ts`:
  - [ ] `getFFmpegPath` / `getFFprobePath` helpers
  - [ ] `/api/pick-folder`, `/api/pick-file`
  - [ ] `/api/list-folder-videos`
  - [ ] `/api/run-bash-script` (SSE)
  - [ ] `/api/build-random-clip-assembly` (SSE + cache + cycle logic)
- [ ] โฟลเดอร์ `public/BG_music/` (ใส่เพลง .mp3/.wav/.m4a/.aac)
- [ ] ติดตั้ง ffmpeg + frei0r
- [ ] mount `<SingleClipEditorTab/>` เข้าเมนู sidebar

---

### ภาคผนวก: ตัวอย่าง bash script ที่ได้จริง (Jump Cut, ย่อ)
```bash
#!/bin/bash
set -euo pipefail
CLIP="${1:-/path/input.mp4}"
OUTPUT="${2:-/path/output.mp4}"
BGM="/path/bgm.mp3"
[ ! -f "$CLIP" ] && { echo "Error: not found"; exit 1; }
duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$CLIP")
fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$CLIP" | head -n1)
sr=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$CLIP" | head -n1)
[ -z "$sr" ] && sr="44100"; cl="stereo"; zoom_dur="${duration}"
export FREI0R_PATH="/usr/local/lib/frei0r-1:/opt/homebrew/lib/frei0r-1:$FREI0R_PATH"
ffmpeg -y -i "$CLIP" -ss 1.875 -t 0.500 -i "$CLIP" ... (×8) -i "$BGM" \
-filter_complex "
[0:v]trim=0.000:8.000,setpts=PTS-STARTPTS[s1v_raw];
[s1v_raw]fade=t=in:st=0:d=0.5[s1_fade_1];
[s1_fade_1]unsharp=5:5:1.2:5:5:0.0[s1_sharp_2];
[s1_sharp_2]fps=$fps[s1_final];
[1:v]setpts=PTS-STARTPTS,scale=iw:ih:flags=fast_bilinear,format=yuv420p[cv0];
...
[cv0][cv1]...concat=n=8:v=1:a=0:unsafe=1[s2_concat];
[s2_concat]fps=$fps[s2v];
[s1_final][s2v]xfade=transition=fade:duration=1.00:offset=7.000[vout];
[0:a]atrim=0.000:8.000,asetpts=PTS-STARTPTS,aformat=...[s1a];
[1:a]volume=0,...[ca0]; ... [ca0]...concat=n=8:v=0:a=1[s2a];
[s1a][s2a]concat=n=2:v=0:a=1[basea];
[9:a]volume='if(lt(t,0.000),0.200,if(lt(t,8.000),0.200+0.800*((t-0.000)/8.000),1.0))':eval=frame,aformat=...[amusic];
[basea][amusic]amix=inputs=2:duration=first:normalize=0[finala]
" \
-map '[vout]' -map '[finala]' -c:v libx264 -preset medium -crf 23 \
-pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "$OUTPUT"
```

---
*สร้างจากการอ่านโค้ดจริงใน `BulkVideoCreatorApp-Clean` — ครอบคลุม frontend, ffmpegBuilder engine และ backend API ครบทุกจุดที่ใช้งานในฟีเจอร์นี้*
