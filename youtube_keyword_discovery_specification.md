# รายละเอียดระบบค้นหาและวิเคราะห์คลิป YouTube จากคำค้นหา (YouTube Keyword Discovery Hub)

เอกสารนี้ระบุรายละเอียดทางสถาปัตยกรรม (Architectural Specifications) การทำงานทั้งส่วนหน้าบ้าน (Frontend) และหลังบ้าน (Backend) ของระบบ **"Discovery Hub 🔍 หา Content น่าแชร์ -> หา YouTube เรื่องน่าแชร์จาก Keyword"** เพื่อใช้เป็นคู่มือสำหรับการนำไปพัฒนาต่อในโปรแกรมหรือระบบอื่นๆ

---

## 1. ภาพรวมการทำงาน (System Overview)
ระบบนี้ช่วยให้ผู้ใช้งานสามารถ **ค้นหาคลิปวิดีโอที่เป็นกระแส (Trending) หรือคลิปอมตะ (Evergreen)** บน YouTube ตามหัวข้อหรือคีย์เวิร์ดที่ต้องการ โดยแก้ปัญหาเรื่องข้อจำกัดด้านโควตาของ YouTube Official API (v3 API Quotas) ด้วยการใช้เครื่องมือจำลองการดึงข้อมูล `yt-dlp` ร่วมกับการกรองข้อมูลอัจฉริยะในฝั่งเซิร์ฟเวอร์ และการขับเคลื่อนด้วย AI (LLMs) เพื่อช่วยคิดคีย์เวิร์ดหรือสกัดแนวคิดจากไฟล์ประวัติโพสต์ไวรัล (.csv)

### ความสามารถหลัก (Key Capabilities)
1. **Keyword Category & Pre-defined Seeds**: มีกลุ่มหมวดหมู่หลักพร้อมคีย์เวิร์ดตั้งต้น (เช่น เรื่องเล่าเทรดเดอร์ Forex, คนธรรมดาสร้างตัว, จิตวิทยาการลงทุน, เครื่องมือ AI)
2. **AI Keyword Recommendation (ให้ AI หา Keyword)**: ส่งข้อมูลหมวดหมู่และทิศทางของเพจไปให้ AI แตกยอดคีย์เวิร์ดภาษาอังกฤษและไทยออกมา 16 คำที่ค้นหาได้จริงบน YouTube
3. **CSV Trend Extraction (อัปโหลด CSV เพื่อหาคีย์เวิร์ด)**: วิเคราะห์ไฟล์สรุปโพสต์ยอดนิยม (.csv) ที่มีข้อมูลจำนวนมาก โดยการแบ่งชิ้นข้อมูล (Chunking) แล้วให้ AI สรุปหัวข้อและคำค้นหาแยกตามเทรนด์ที่เกิดขึ้นจริงในช่วงเวลานั้นๆ
4. **Bulk Keyword Search (การค้นหากลุ่ม)**: ค้นหาหลายคีย์เวิร์ดพร้อมกันในคลิกเดียว ดึงข้อมูลแบบขนาน สรุปผลลัพธ์แบบไม่ซ้ำกัน (De-duplicate) และเรียงลำดับตามความนิยม
5. **Advanced Filters & Scoring**: กรองคลิปที่เป็นยอดนิยม (Min Views), คลิปเนื้อหาลึก (Min Duration/Evergreen) และคลิปที่มีคนคุย/บทสัมภาษณ์จริง (Human Speak Heuristics)

---

## 2. โครงสร้างฐานข้อมูลและการตั้งค่า (Configurations & Storage)

### ข้อมูลภายในเครื่อง (Client-Side Storage)
ระบบใช้ `localStorage` ของเบราว์เซอร์เพื่อบันทึกสถานะของผู้ใช้ เพื่อไม่ต้องโหลดข้อมูลซ้ำทุกครั้งที่เปิดโปรแกรม:
- `yt_evergreen_only` (`true`/`false`): เปิดใช้ตัวกรองเฉพาะ Evergreen
- `yt_evergreen_min_views` (ตัวเลขยอดวิวขั้นต่ำ เช่น `50000`)
- `yt_evergreen_min_duration` (ความยาวคลิปขั้นต่ำเป็นวินาที เช่น `120`)
- `yt_evergreen_ignore_date` (`true`/`false`): ไม่จำกัดวันที่เมื่อกรองแบบ Evergreen
- `yt_search_results` (JSON string): เก็บผลลัพธ์การค้นหาล่าสุดของคลิป YouTube
- `yt_last_search` (string): คำค้นหาล่าสุด
- `yt_csv_keyword_categories` (JSON string): เก็บหมวดหมู่คีย์เวิร์ดที่ AI สกัดได้จากไฟล์ CSV ล่าสุด
- `yt_csv_filename` (string): ชื่อไฟล์ CSV ล่าสุดที่อัปโหลด

---

## 3. รายละเอียดการทำงานของฝั่งผู้ใช้ (Frontend Logic)

### 3.1 ระบบคิดคีย์เวิร์ดด้วย AI (AI Keyword Recommendation)
เมื่อผู้ใช้เลือกหมวดหมู่ที่ต้องการและกดปุ่ม **"ให้ AI หา Keyword"** ฝั่งหน้าบ้านจะส่งคำขอไปยังระบบ OpenRouter API (รองรับ Free Models เช่น Qwen/Llama เพื่อประหยัดค่าใช้จ่าย)

> [!NOTE]
> ระบบมีกลไก **Retry & Model Fallback** เมื่อใช้ AI ฟรี: จะสลับโมเดลอัตโนมัติหากเจอการจำกัดโควตา (Rate Limit) หรือเชื่อมต่อล้มเหลว โดยเรียงจาก `qwen/qwen3-8b:free` -> `meta-llama/llama-3.1-8b-instruct:free` -> `openai/gpt-oss-20b:free`

#### ตัวอย่างพรอมต์ของ AI แนะนำคีย์เวิร์ด (Forex/Finance)
```text
System Prompt:
คุณคือ content strategist สำหรับเพจ Forex/ลงทุนภาษาไทย
ต้องช่วยหา YouTube search keywords ที่มีโอกาสเจอคลิป "เรื่องเล่าความสำเร็จ/เคสจริง/เส้นทางชีวิต/บทเรียนการเงิน" เพื่อเอาไปทำคอนเทนต์แชร์ง่ายและชวนคนสนใจ Forex อย่างมีความรับผิดชอบ
ตอบ JSON เท่านั้น: { "keywords": ["keyword 1", "keyword 2"] }
ข้อกำหนด:
- ให้ 16 keywords
- ใช้ภาษาอังกฤษเป็นหลัก เพราะ YouTube มีเคสเยอะกว่า
- ผสม keyword ภาษาไทยได้ไม่เกิน 4 รายการ
- เน้นคำอย่าง success story, journey, interview, case study, financial freedom, trading psychology, risk management, profitable trader, ordinary people, from zero ตามบริบท
- ต้องมีทั้งมุมความสำเร็จและมุมบทเรียน/ความเสี่ยงบ้าง เพื่อไม่ให้คอนเทนต์ดูขายฝัน
- หลีกเลี่ยง keyword ที่สื่อการันตีกำไร/รวยเร็ว/ไร้ความเสี่ยง เช่น guaranteed profit, no risk, rich overnight
- หลีกเลี่ยง keyword กว้างเกินไป เช่น "forex" หรือ "money" คำเดียว
```

---

### 3.2 ระบบสกัดคีย์เวิร์ดจากไฟล์ยอดนิยม (.csv)
เมื่ออัปโหลดไฟล์ `.csv` เข้ามาระบบจะทำการอ่านไฟล์แบบดิบในรูปแบบข้อความ (Text) แล้วทำสิ่งต่อไปนี้:

1. **การแบ่งชิ้นข้อความ (Text Chunking)**:
   เนื่องจากไฟล์ CSV ของโพสยอดนิยมมักมีขนาดใหญ่เกินความยาวข้อความ (Context Window) ที่โมเดล AI ขนาดเล็กจะรับได้ ระบบจะแบ่งข้อมูลออกเป็นส่วนๆ ละไม่เกิน **25,000 ตัวอักษร** โดยจะตัดที่ขึ้นบรรทัดใหม่ (`\n`) เพื่อไม่ให้ข้อมูลแถวเสียหาย
2. **ส่งให้ AI วิเคราะห์แยกชิ้น**:
   ส่งข้อความทีละส่วนไปประมวลผลผ่าน AI API โดยใช้พรอมต์การทำงานเฉพาะด้านสกัดหมวดหมู่

#### ตัวอย่างพรอมต์วิเคราะห์เทรนด์จาก CSV
```text
System Prompt:
คุณเป็น content strategist สำหรับเพจ Social Media ภาษาไทย
ภารกิจ: วิเคราะห์รายการโพสไวรัลที่ให้มา แล้วสกัด YouTube Search Keywords ที่ควรค้นหา เพื่อนำมาทำคอนเทนต์ใหม่ที่จะ Viral ตาม

ตอบกลับเป็น JSON เท่านั้น ห้ามมีข้อความอื่น:
{
  "categories": [
    {
      "label": "ชื่อหมวดภาษาไทย (สั้น กระชับ ไม่เกิน 20 ตัวอักษร)",
      "description": "อธิบายว่าทำไมหมวดนี้ถึงน่าสนใจตามเทรนด์จากโพสเหล่านี้ (1-2 ประโยค)",
      "keywords": ["keyword 1", "keyword 2", ...]
    }
  ]
}

กำหนด:
- สร้าง 3-6 หมวดหมู่ ตามธีมที่ Viral จากเนื้อหาที่ให้
- แต่ละหมวดมี 8-12 keywords สำหรับค้น YouTube
- Keywords ต้องใช้งานค้น YouTube ได้จริง (specific พอ ไม่กว้างเกินไป)
- ผสม EN/TH ตามที่เหมาะสมกับเนื้อหา
- เน้น keywords ที่จะเจอคลิป เรื่องเล่า/เคสจริง/วิธีทำ/ผลลัพธ์จริง ที่เอาไปทำโพสต่อได้
```

3. **การยุบรวมหมวดหมู่ที่ซ้ำกัน (Merging)**:
   เนื่องจากวิเคราะห์ทีละ Chunk AI อาจสร้างหมวดหมู่ที่คล้ายกันขึ้นมา ระบบฝั่งหน้าบ้านจึงใช้โค้ดในการตรวจสอบตัวอักษรของชื่อหมวดหมู่ (ดึงตัวอักษร 15 ตัวแรกมาเทียบแบบ Case-Insensitive) หากเจอหมวดที่ชื่อซ้ำกัน จะทำการยุบรวมคีย์เวิร์ด (De-duplicate keywords) เข้าไว้ด้วยกัน และจำกัดไว้ที่สูงสุด 12 คีย์เวิร์ดต่อหมวดหมู่
4. **บันทึกลงฐานข้อมูล**:
   หมวดหมู่ที่เกิดจาก CSV จะถูกนำมาแทรกไว้ที่แถบด้านบนของรายการคีย์เวิร์ดเพื่อให้ผู้ใช้คลิกเลือกเปลี่ยนกลุ่มได้อย่างสะดวก

---

### 3.3 ระบบการค้นหาแบบกลุ่มและการอัปเดตแบบเรียลไทม์ (Bulk Search Logic)
หากผู้ใช้เลือกคีย์เวิร์ดพร้อมกันหลายๆ คำ (เช่น เลือก 5 คีย์เวิร์ด) ระบบฝั่งหน้าบ้านจะวนลูปเรียก API ทีละคำ เพื่อป้องกันปัญหา Timeouts และประหยัดทรัพยากร:
- ทำการเก็บผลลัพธ์ไว้ใน `Map` (กุญแจหลักคือ `videoId` หรือ `url` ของคลิป) เพื่อตัดคลิปที่ซ้ำกันออกโดยอัตโนมัติ
- เมื่อดึงข้อมูลของคีย์เวิร์ดใดสำเร็จ ระบบจะอัปเดตแสดงผลในหน้าจอให้ผู้ใช้เห็นทันที (Incremental rendering) ไม่ต้องรอจนครบทุกคำค้นหา
- จัดเรียงผลลัพธ์ทั้งหมดตาม **ยอดรับชม (Views) สูงสุด**

---

### 3.4 ระบบกรองและตรวจสอบคุณภาพฝั่งผู้ใช้ (Client-Side Metadata Parsing)
เมื่อได้ผลลัพธ์คลิปวิดีโอจาก API ฝั่งหน้าบ้านจะนำคุณลักษณะของคลิปมาวิเคราะห์และติดป้ายกำกับ (Badges):

1. **🔥 ยอดนิยม (Popular)**: ยอดวิวของคลิปจริงต้องมากกว่าเกณฑ์ที่ผู้ใช้กำหนด (เช่น `>= 50,000 วิว`)
2. **🌲 คัดเฉพาะ Evergreen**: เป็นคลิปที่มีการรับชมสม่ำเสมอ ซึ่งพิจารณาจากความยาวของคลิปต้องมากกว่าระยะเวลาที่กำหนด (เช่น `>= 120 วินาที` หรือ 2 นาที) เพื่อให้มั่นใจว่าเป็นคลิปเล่าเนื้อหาแบบเจาะลึก ไม่ใช่คลิปสั้น (Shorts/Reels) ที่มีความนิยมแค่ชั่วคราว
3. **🎙️ มีคนเล่า/คุย (Human Speaking / Interview Indicators)**:
   ใช้หลักการเขียนเงื่อนไขทางภาษาศาสตร์ (Heuristics) ค้นหาคำที่เกี่ยวข้องกับการพูดคุยจริงในหัวข้อคลิป (Title) เพื่อเลี่ยงคลิปที่มีแต่สไลด์บรรยายเงียบๆ:
   ```typescript
   const hasHumanOrStoryCues = (title: string): boolean => {
     const t = title.toLowerCase();
     const cues = [
       'interview', 'podcast', 'story', 'journey', 'talk', 'failed', 'success', 'lessons', 'how i',
       ' ordinary ', 'life', 'broke', 'millionaire', 'trader', 'investor', 'person', 'people', 'he ', 'she ',
       'สัมภาษณ์', 'เล่า', 'รีวิว', 'ประสบการณ์', 'คุย', 'คนธรรมดา', 'ชีวิต', 'เทรดเดอร์', 'เจ๊ง', 'รวย', 'จน'
     ];
     return cues.some(cue => t.includes(cue));
   };
   ```

---

## 4. รายละเอียดหลังบ้าน (Backend API Specification)

### Endpoint: `POST /api/youtube-keyword-search`
ทำหน้าที่รับคำค้นหา ค้นหากับ YouTube จริง กรองวันที่ของคลิปที่ลงล่าสุุด และจัดรูปแบบข้อมูลกลับมา

#### ข้อกำหนดของอินพุต (Request JSON Payload)
```json
{
  "keyword": "forex trader success story",
  "limit": 12,
  "days": 120
}
```
- `keyword` (string): คำค้นหา YouTube
- `limit` (number): จำนวนวิดีโอผลลัพธ์ที่ต้องการนำเสนอ
- `days` (number): จำกัดช่วงวันย้อนหลังของคลิปที่พบ (นับจากวันที่ปัจจุบัน) เช่น `120` วัน หากเป็น `0` หรือกรรองแบบยกเลิกขอบเขตวันที่ จะส่งเป็นไม่มีข้อจำกัดขีดคั่น

#### ลำดับการประมวลผลของ API หลังบ้าน
1. คำนวณวันที่สิ้นสุดการยอมรับข้อมูล (`cutoff` timestamp):
   `Date.now() - dayWindow * 24 * 60 * 60 * 1000`
2. เรียกใช้โปรแกรม `yt-dlp` บนระบบปฏิบัติการของเครื่องเป็นแบบลูกข่าย (Subprocess)
3. ส่งพารามิเตอร์การดึงข้อมูลเฉพาะเพื่อความรวดเร็วและป้องกันโควตา:
   - `--skip-download`: ไม่ดาวน์โหลดไฟล์วิดีโอจริง ดึงเฉพาะข้อมูลเชิงโครงสร้าง
   - `--no-playlist`: ไม่ดึงคลิปอื่นๆ ที่พ่วงใน Playlist
   - `--no-warnings` & `--ignore-errors`: ข้ามคำเตือนและข้อผิดพลาด
   - `--print`: สั่งให้อุปกรณ์พิมพ์ข้อมูลเป็นบรรทัดเดียวโดยแยกด้วย Tab (`\t`) เพื่อให้ตัดคำและประมวลผล (Parsing) ได้ง่ายและไวที่สุด
   - ตั้งปลายทางค้นหา (Target Search String) เป็น: `ytsearch<limit>:<keyword>` เพื่อกำหนดจำนวนการค้นหาต้นทาง เช่น `ytsearch15:forex trader success story`

#### โครงสร้างคำสั่งที่ส่งไปรันใน Command Line
```bash
yt-dlp --skip-download --no-playlist --no-warnings --ignore-errors --print "%(id)s\t%(title)s\t%(webpage_url)s\t%(view_count)s\t%(upload_date)s\t%(timestamp)s\t%(duration)s\t%(channel)s\t%(channel_url)s\t%(thumbnail)s" "ytsearch15:forex trader success story"
```

#### การแปลงข้อมูลจากบรรทัดข้อความ (Row Parsing)
ข้อมูลดิบที่ได้จาก `yt-dlp` จะถูกนำมาแยกคำด้วย `split('\t')` เพื่อความถูกต้องในโครงสร้างข้อมูล:
- **แปลงวันที่**: ปรับ `upload_date` (ที่อยู่ในรูปแบบ YYYYMMDD เช่น `20260517`) หรือ `timestamp` เพื่อเปรียบเทียบกับตัวกรองช่วงวันย้อนหลัง
- **กรองช่วงวันย้อนหลัง**: หากตั้งไว้ (เช่น 120 วัน) และคลิปดังกล่าวมีอายุมากกว่าช่วงวันดังกล่าว คลิปนั้นจะถูกลบทิ้งจากชุดข้อมูลทันที
- **สกัดรูปภาพคุณภาพสูง**: คัดเลือก Thumbnail ที่ใหญ่ที่สุดหรือคมชัดที่สุดจากข้อมูลที่ส่งกลับ
- **เรียงลำดับใหม่**: จัดเรียงตามจำนวนการเข้าชม (`view_count`) จากมากไปหาน้อย
- **ส่งกลับ**: จำกัดตามจำนวนสูงสุดที่ต้องการ (`limit`) และส่งออกเป็นรูปแบบ JSON

---

## 5. ตัวอย่างซอร์สโค้ดหลังบ้าน (Backend Implementation Code - Node.js)
สามารถใช้โค้ดตัวอย่างส่วนนี้ไปติดตั้งบน Express.js Server หรือ API route ในระบบใดๆ ก็ได้:

```javascript
const { execFileSync } = require('child_process');

async function searchYoutubeKeywordHandler(req, res) {
  try {
    const { keyword, limit = 12, days = 30 } = req.body;
    const query = String(keyword || '').trim();
    if (!query) {
      return res.status(400).json({ success: false, error: 'Missing keyword' });
    }

    const resultLimit = Math.max(1, Math.min(100, Number(limit) || 12));
    const daysNum = days !== undefined && days !== null ? Number(days) : 30;
    const dayWindow = isNaN(daysNum) ? 30 : (daysNum <= 0 ? 0 : Math.min(365, daysNum));

    // กำหนดลิมิตตั้งต้นในการค้นหา เพื่อเผื่อสำหรับการกรองคัดออกภายหลัง
    const searchLimit = Math.min(25, Math.max(resultLimit + 5, 15));
    const cutoff = dayWindow > 0 ? Date.now() - dayWindow * 24 * 60 * 60 * 1000 : 0;
    const seen = new Set();
    const rows = [];

    // ฟังก์ชันแปลงวันที่ของ YouTube
    const parseVideoDate = (video) => {
      const raw = String(video.upload_date || video.release_date || '');
      if (/^\d{8}$/.test(raw)) {
        return new Date(`${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}T00:00:00.000Z`);
      }
      if (typeof video.timestamp === 'number') {
        return new Date(video.timestamp * 1000);
      }
      return null;
    };

    // คำสั่งรันดึงข้อมูลจาก yt-dlp
    const args = [
      '--skip-download',
      '--no-playlist',
      '--no-warnings',
      '--ignore-errors',
      '--print',
      '%(id)s\t%(title)s\t%(webpage_url)s\t%(view_count)s\t%(upload_date)s\t%(timestamp)s\t%(duration)s\t%(channel)s\t%(channel_url)s\t%(thumbnail)s',
      `ytsearch${searchLimit}:${query}`
    ];

    // รันคำสั่งย่อยในระบบปฏิบัติการ
    const rawStdout = execFileSync('yt-dlp', args, { 
      timeout: 150000, 
      maxBuffer: 1024 * 1024 * 20 
    }).toString();

    // แยกประมวลข้อมูลดิบ
    rawStdout.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      .forEach(line => {
        const parts = line.split('\t');
        if (parts.length < 10) return;

        const [
          id, title, url, viewsRaw, uploadDate, 
          timestampRaw, durationRaw, channel, channelUrl, thumbnail
        ] = parts;

        const videoObj = {
          id,
          title,
          webpage_url: url,
          view_count: viewsRaw && viewsRaw !== 'NA' ? Number(viewsRaw) : null,
          upload_date: uploadDate,
          timestamp: timestampRaw && timestampRaw !== 'NA' ? Number(timestampRaw) : null,
          duration: durationRaw && durationRaw !== 'NA' ? Number(durationRaw) : null,
          channel,
          channel_url: channelUrl,
          thumbnail,
        };

        const vDate = parseVideoDate(videoObj);
        
        // ตรวจสอบวันที่ของคลิปเทียบกับเกณฑ์วันที่รับได้
        if (cutoff > 0 && (!vDate || vDate.getTime() < cutoff)) return;

        const videoId = videoObj.id || videoObj.webpage_url;
        if (!videoId || seen.has(videoId)) return;
        seen.add(videoId);

        rows.push({
          id: videoId,
          title: videoObj.title || '(ไม่มีชื่อคลิป)',
          url: videoObj.webpage_url,
          views: videoObj.view_count,
          uploadedAt: videoObj.upload_date || (vDate ? vDate.toISOString() : ''),
          thumbnail: videoObj.thumbnail,
          duration: videoObj.duration,
          channelName: videoObj.channel,
          channelUrl: videoObj.channel_url
        });
      });

    // เรียงตามยอดวิวสูงสุด
    rows.sort((a, b) => (b.views ?? 0) - (a.views ?? 0));

    res.json({
      success: true,
      videos: rows.slice(0, resultLimit),
      searched: true,
      days: dayWindow
    });

  } catch (error) {
    console.error('[YT Search Error]:', error);
    res.status(500).json({ success: false, error: error.message || String(error) });
  }
}
```

---

## 6. แนวทางการออกแบบหน้าจอใช้งาน (UI Spec & Tailored Palette)
เพื่อให้ระบบมีภาพลักษณ์ดูพรีเมียม สอดคล้องกับภาพหน้าจอตัวอย่าง:
1. **โทนสีหลัก (Color Palette)**:
   - ใช้ธีมสีเข้ม (Dark Mode) พื้นหลังหลัก `#0a0b0d` หรือ `HSL(220, 15%, 5%)`
   - พื้นหลังการ์ดหรือแผงข้อมูลใช้ `#121318` หรือ `HSL(220, 15%, 8%)`
   - ปุ่มหลักใช้สีแดงแบรนดิ้งของ YouTube `#e62117` หรือ `#dc2626`
   - ปุ่มสำหรับการทำงานอัจฉริยะ (AI) ใช้สีม่วงไล่ระดับ `#7c3aed` หรือ `#6d28d9` เพื่อแสดงความเป็นโมเดิร์น
   - ปุ่ม/ป้ายสถานะของการอัปโหลดไฟล์/กรองข้อมูลเชิงบวก (Evergreen) ใช้สีเขียวเอเมอรัลด์ `#047857` หรือ `#059669`
2. **การจัดวางองค์ประกอบ (Layout Grid)**:
   - **หัวข้อและตัวกรองช่วงวัน**: วางขนานกันในส่วนบนสุดเพื่อไม่ให้บดบังพื้นที่ทำงาน
   - **ด้านซ้าย (แถบหมวดหมู่)**: ความกว้างคงที่ (เช่น `240px` ถึง `280px`) แสดงรายการหมวดหมู่แบบการ์ดขนาดเล็กพร้อมรายละเอียดสั้นๆ
   - **ด้านขวา (พื้นที่ทำงานหลัก)**:
     - แถบค้นหาหลัก, ติ๊กถูกตั้งค่า ( Evergreen, ดึงทั้งหมด), และชุดคำสั่งการรัน
     - แถบยาแคปซูล (Pills Tags) แสดงคีย์เวิร์ดย่อยที่เลือกได้แบบสลับ (Toggle Selection)
     - แผงการจัดสรรรายการผลลัพธ์คลิปวิดีโอ (แบ่งหน้าต่างแบบภาพย่อ/คลิกช่อง/แสดงป้าย/ปุ่มดึงเข้าคิวงานหลัก)
