# คู่มือวิเคราะห์และคัดลอกระบบติดตามงาน (Work Tracking System)
ระบบนี้ถูกดึงมาจากโปรเจกต์ **BulkVideoCreatorApp-Clean** เพื่อใช้เป็นข้อมูลอ้างอิงในการพัฒนาและเชื่อมต่อเข้ากับระบบใหม่ใน **ContentFactory**

---

## 📌 ภาพรวมระบบติดตามงาน (Sync Master Dashboard)
ระบบนี้เป็น Dashboard ที่ทำหน้าที่ตรวจสอบและแสดงผล **"จำนวน Stock งานคงเหลือ"** และ **"สถานะขั้นตอนการทำงาน (To-Do / Kanban)"** จาก Google Sheets โดยเป็นการทำงานแบบ **Client-Side Direct Fetch** (ดึงข้อมูลตรงจากบราวเซอร์ผ่าน API Key โดยไม่ต้องมี Backend มาคั่น) 

### ฟีเจอร์หลักของระบบ:
1. **Dashboard & Summary Widget**: แสดงผลยอดรวมสะสม Stock ของแต่ละทีมหรือครีเอเตอร์แต่ละคน (เช่น Ton's Total Stock และ Tee's Total Stock)
2. **Dynamic Chart**: แสดงแผนภูมิแท่งเปรียบเทียบจำนวน Stock ในแต่ละเพจย่อย โดยใช้ Chart.js
3. **Tab Navigation**: จัดหมวดหมู่การติดตามงานเป็นหลายส่วน เช่น ภาพรวม (Overview), งานส่วนบุคคล, งานช่องทางต่าง ๆ (บทความ, Youtube, หยก, AI, ดูดวง)
4. **Hub (แหล่งรวมลิงก์เพจ)**: สรุปลิงก์เพจและแผนงานทั้งหมดจากชีทกลาง
5. **Custom Tracking Boxes**: ผู้ใช้สามารถกดบวกสร้างกล่องเช็คข้อมูลเฉพาะตัว โดยกำหนด Spreadsheet ID, ชื่อชีท และตำแหน่งเซลล์ (Cell) ที่ต้องการดึงข้อมูลเองได้ และรองรับการทำ Drag & Drop จัดลำดับกล่อง
6. **API Key Profile Manager**: ระบบเลือกและสลับโปรไฟล์ API Keys (OpenRouter, Dropbox, Google Sheets, Apify, GIPHY) ได้ในที่เดียว

---

## 🔑 ข้อมูล Google API Key ที่แปะอยู่ในระบบ
จากการตรวจสอบไฟล์คอนฟิก `api_profiles.json` และตัวโค้ดของแอปพลิเคชันต้นทาง พบ API Key ดังนี้:

* **Google API Key ที่บันทึกไว้ในโปรไฟล์เริ่มต้น:** `AIzaSyAihSSlxF8yeYd0GhyMea4s9vb0aVbY8qw`
* **ประเภทของ API:** **Google Sheets API v4 (Read-Only)**
* **ทำหน้าที่อะไร:** เป็นคีย์ความปลอดภัยของ Google Cloud Platform (GCP) ที่อนุญาตให้แอปพลิเคชันภายนอกสามารถส่ง HTTP Request ไปดึงข้อมูลหรืออ่านค่า (Read values) จากเซลล์ต่าง ๆ ใน Google Sheets ที่ผู้ใช้แชร์ไว้เป็นสาธารณะ (Anyone with the link can view)
* **ข้อดีของแนวทางนี้:** 
  * สะดวกมาก ไม่ต้องติดตั้งระบบยืนยันตัวตนที่ซับซ้อน (OAuth 2.0)
  * ผู้ใช้ทั่วไปสามารถนำเอา Spreadsheet ID ของตัวเองมาใช้งานได้ทันที เพียงแค่แชร์ Google Sheets นั้นให้เป็น **"ทุกคนที่มีลิงก์มีสิทธิ์อ่าน (Viewer)"**
  * โค้ดดึงข้อมูลฝั่งบราวเซอร์ใช้เพียงคำสั่ง `fetch` ธรรมดาในการอ่านข้อมูล

> [!WARNING]
> **ข้อควรระวังเกี่ยวกับความปลอดภัย (Security Warning)**
> * คีย์ `AIzaSyAihSSlxF8yeYd0GhyMea4s9vb0aVbY8qw` เป็นคีย์ที่เปิดให้แอปพลิเคชันเข้าถึงข้อมูล Sheets ได้อย่างอิสระ หากต้องการนำระบบนี้ไปใช้ในระบบใหม่ **แนะนำให้ผู้ใช้สร้าง Google API Key ของตนเอง** บน Google Cloud Console และตั้งค่า **API Restriction** ให้เข้าถึงได้เฉพาะ "Google Sheets API" เท่านั้น เพื่อความปลอดภัยสูงสุด
> * หลีกเลี่ยงการ Commit คีย์จริงขึ้นไปบน GitHub สาธารณะ โดยใช้ไฟล์ `.env` หรือระบบ API Profiles ที่แยกไฟล์จัดเก็บ เช่น `public/app_data/api_profiles.json` (ซึ่งระบุไว้ใน `.gitignore`)

---

## 🛠️ โครงสร้างฐานข้อมูลและการเชื่อมต่อ Google Sheets

ระบบติดตามงานนี้เชื่อมต่อกับ **Spreadsheets ย่อยทั้งหมด 6 แหล่งหลัก** ดังนี้:

| ชื่อชีทระบบ | Spreadsheet ID ที่ใช้จริงในโค้ด | หน้าที่และการคำนวณ Stock |
| :--- | :--- | :--- |
| **Ton's Stock** | `1yamIh1Uvb3hlPp3earQglGyUMtsNqPPLLe65lR53rNY` | ดึงข้อมูล Stock ของ "ต้น" โดยหาผลรวมสะสมจากเซลล์ตัวเลขในแถวที่ 2 ของทุกชีทย่อย (เช็คคอลัมน์ Z, Y, U, K ตามลำดับ) |
| **Tee's Stock** | `14jiUb5-96MY6rCIJTWkbcSBmbvCk_v8HdVRc589MjrU` | ดึงข้อมูล Stock ของ "ลุงตี่" โดยทำแบบเดียวกับของต้น |
| **Hub ลิงก์เพจ** | `1wrWxK-NcPrkY0_cTaeXiTtE6HuGLS8zhk_iai94vdGY` | สรุปเพจและลิงก์ทั้งหมด โดยดึงค่าตั้งแต่แถว A2 ถึง C ของทุกชีท (ชื่อเพจ, ลิงก์, และแผนงาน) |
| **Youtube** | `1ZqTDnbals2n-dQA-6-GrvYtaWbBf3nDqEkkBtOwJn8A` | ดึงข้อมูลยอดพร้อมใช้งานในเซลล์ `P2` ของแต่ละชีทย่อย |
| **Yok (หยก)** | `1BGCO3xKKeVmaRQiYmfPnYAhWSz-F3KDr5I89seA3I84` | ดึงยอดจากเซลล์ `H2` (ถ้าชีทชื่อมีคำว่า ClickBait) หรือ `M2` (ชีทธรรมดา) |
| **AI Sources** | `1o_xAHtJgq8RBQbNVZnibrprvpM5E_UBo-7VEkyzoJME`<br>`1Rr0thsqzrLmTKcmAO_z4dKSZpE_5JexWSJxXn4Ot77U`<br>`1UdHqY_1Huu32aAgAovFuPWkOj7A_dkaSpSVOEqFUnQg`<br>`1uqJgzxYEJterGP30jMg79oK3mGu-efbXiyXm7VqXIi8` | ดึงข้อมูล Stock ของงาน AI เช่น คำคม AI, รูป Info, ข่าวเว็บจีน จากพิกัดเซลล์จำเพาะ เช่น `L2`, `K2`, `M2`, `S2` |

---

## 💻 โค้ดคำสั่งสำคัญสำหรับการดึงข้อมูลจาก Google Sheets (Core Logic)

หากคุณต้องการคัดลอกระบบนี้ไปสร้างในระบบใหม่ (เช่น ContentFactory) นี่คือฟังก์ชันหลัก 3 ตัวที่คุณสามารถนำไปประยุกต์ใช้ได้ทันที:

### 1. การดึงค่าจาก "เซลล์เดี่ยว" (Single Cell Fetch)
ใช้สำหรับกล่องติดตามงานกำหนดเอง (Custom Box) หรือยอดสะสมชิ้นเดี่ยว:

```javascript
async function fetchSingleCellValue(spreadsheetId, sheetName, cell, apiKey) {
    try {
        const range = encodeURIComponent(`${sheetName}!${cell}`);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        // ตรวจสอบโครงสร้างข้อมูลที่ส่งกลับมา
        if (data.values && data.values[0] && data.values[0][0]) {
            return data.values[0][0]; // คืนค่าข้อความ/ตัวเลขในเซลล์นั้น
        }
        return '0';
    } catch (error) {
        console.error("Fetch Single Cell Failed:", error);
        return 'Error';
    }
}
```

### 2. การดึงรายชื่อชีทย่อยทั้งหมดในไฟล์ (Get Sheet Titles Metadata)
ก่อนที่เราจะอ่านข้อมูลจากทุกแท็บ เราต้องรู้ก่อนว่าไฟล์ Google Sheets นี้มีแท็บชื่ออะไรบ้าง:

```javascript
async function getSheetTitles(spreadsheetId, apiKey) {
    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?key=${apiKey}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        // ดึงชื่อของทุกชีท/แท็บออกมาในรูปแบบ Array
        return data.sheets.map(s => s.properties.title);
    } catch (error) {
        console.error("Get Sheet Metadata Failed:", error);
        throw error;
    }
}
```

### 3. การดึงข้อมูลแบบกลุ่มประสิทธิภาพสูง (Batch Get Values)
เมื่อมีจำนวนแท็บเยอะ ๆ (เช่น 30-50 ชีท) การส่ง Request ทีละตัวจะทำให้โหลดช้ามากและอาจโดน Google บล็อก (Rate Limit) ระบบนี้จึงใช้วิธี **Batch Get** เพื่อดึงข้อมูลของหลาย ๆ แท็บในคำสั่งเดียว:

```javascript
async function batchFetchSheetsData(spreadsheetId, sheetNames, apiKey) {
    try {
        // แบ่งชื่อแท็บเป็นชุดย่อย ชุดละไม่เกิน 30 แท็บเพื่อความสถียร
        const chunkSize = 30;
        const results = [];
        
        for (let i = 0; i < sheetNames.length; i += chunkSize) {
            const chunk = sheetNames.slice(i, i + chunkSize);
            // สร้าง Query String สำหรับส่งช่วงเซลล์ (Ranges)
            // ตัวอย่าง: ranges='ชีท1'!2:2&ranges='ชีท2'!2:2
            const rangesQuery = chunk.map(name => `ranges=${encodeURIComponent("'" + name + "'!2:2")}`).join('&');
            
            const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?${rangesQuery}&key=${apiKey}`;
            const response = await fetch(url, { cache: "no-store" });
            
            if (!response.ok) throw new Error(`BatchGet Error: ${response.status}`);
            const data = await response.json();
            
            // ประมวลผลข้อมูลแต่ละแท็บที่ได้กลับมาในโครงสร้าง Array
            chunk.forEach((name, index) => {
                const valueRange = data.valueRanges[index];
                const rowValues = (valueRange && valueRange.values && valueRange.values[0]) ? valueRange.values[0] : [];
                
                // คัดกรองตัวเลข Stock จากคอลัมน์ Z, Y, U, หรือ K
                let stockValue = 0;
                try {
                    const kVal = (rowValues[10] != null ? rowValues[10] : '').toString().replace(/,/g,'').trim(); // K
                    const uVal = (rowValues[20] != null ? rowValues[20] : '').toString().replace(/,/g,'').trim(); // U
                    const yVal = (rowValues[24] != null ? rowValues[24] : '').toString().replace(/,/g,'').trim(); // Y
                    const zVal = (rowValues[25] != null ? rowValues[25] : '').toString().replace(/,/g,'').trim(); // Z
                    
                    if (zVal !== '' && !isNaN(Number(zVal))) stockValue = parseFloat(zVal);
                    else if (yVal !== '' && !isNaN(Number(yVal))) stockValue = parseFloat(yVal);
                    else if (uVal !== '' && !isNaN(Number(uVal))) stockValue = parseFloat(uVal);
                    else if (kVal !== '' && !isNaN(Number(kVal))) stockValue = parseFloat(kVal);
                } catch(err) {
                    console.error("Error parsing row values for tab:", name, err);
                }
                
                results.push({
                    title: name,
                    readyCount: stockValue
                });
            });
        }
        
        // เรียงลำดับจากงานที่มี Stock มากที่สุดไปน้อยที่สุด
        return results.sort((a, b) => b.readyCount - a.readyCount);
    } catch (error) {
        console.error("Batch Fetch Failed:", error);
        throw error;
    }
}
```

---

## 🎨 สรุปแนวทางนำไปใส่ในระบบใหม่ (ContentFactory)

หากต้องการนำระบบนี้ไปผนวกเข้ากับหน้าหลักหรือสร้างเมนูแยกใน **ContentFactory** แนะนำให้ออกแบบดังนี้:

1. **สร้างแท็บ / เมนูใหม่:** ตั้งชื่อเมนูว่า **"Dashboard ติดตามงาน" (Work Tracking)**
2. **ดึงหน้า UI เดิม:** โครงสร้างของหน้านี้ในโปรเจกต์เดิมใช้ iframe ไปดึงไฟล์ `public/tracking-dashboard.html` หากต้องการเขียนใหม่ให้เป็นโมเดิร์น React/TypeScript แนะนำให้นำฟังก์ชัน Fetch ข้างต้นไปเขียนร่วมกับ **React State** และใช้ **TailwindCSS Component** ที่ออกแบบไว้แล้ว
3. **จัดเก็บ API Key อย่างปลอดภัย:**
   * ให้เก็บคีย์ `google_api_key` ไว้ที่ `localStorage` หรือ `.env.local`
   * สามารถดึงโครงสร้าง Profile Manager จากไฟล์ `GlobalSettings.tsx` มาติดตั้ง เพื่อให้สลับคีย์ของแต่ละเพจ/ผู้ใช้ได้อย่างราบรื่น
4. **ทำระบบ Offline/Cache สำรอง:** เพื่อลดความถี่ในการเรียก API ของ Google Sheets (ป้องกัน Rate Limit หรือความช้าเวลาโหลดหน้าเว็บครั้งแรก) ควรบันทึกข้อมูลล่าสุดที่ดึงสำเร็จเก็บไว้ใน `localStorage` ก่อน เมื่อเปิดหน้าจอขึ้นมาให้แสดงผลข้อมูลเดิมทันที แล้วค่อยรันฟังก์ชันดึงข้อมูลใหม่แบบเบื้องหลัง (Background Sync)
