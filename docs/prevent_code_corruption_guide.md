# คู่มือป้องกันความเสียหายและกฎความปลอดภัยในการแก้ไขโค้ด (Code Corruption Prevention Guide)

เอกสารฉบับนี้จัดทำขึ้นเพื่อกำหนดแนวทางปฏิบัติสำหรับผู้พัฒนา (Developer) และ AI Coding Assistant ในอนาคต เพื่อป้องกันไม่ให้เกิดปัญหาโค้ดพังหรือถูกตัดทอน (Truncated/Corrupted) ในกรณีที่มีการแก้ไขไฟล์ขนาดใหญ่ เช่น [App.tsx](file:///Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx)

---

## 🚨 สาเหตุของปัญหาในอดีต (Root Cause)
1. **ไฟล์มีขนาดใหญ่เกินไป (Monolithic Monolith)**: ไฟล์ `src/App.tsx` มีขนาดความยาวมากกว่า 4,500 บรรทัด ซึ่งรวมทั้งการจัดการ State, ฟังก์ชันการทำงาน และการเรนเดอร์ UI ของทั้ง 11 แท็บและโมดอลต่าง ๆ ไว้ในไฟล์เดียว
2. **ขีดจำกัดของ AI (AI Context Limits & Splice Errors)**: เมื่อ AI ทำการแก้ไขจุดเล็ก ๆ ในไฟล์ขนาดใหญ่มหาศาล AI มักใช้คำสั่งแบบค้นหาและทดแทน (Search and Replace) ซึ่งอาจเกิดความผิดพลาดในการจับคู่แท็กเปิด-ปิด (เช่น `div` และปีกกา `{}`) หรือเขียนทับโค้ดส่วนอื่นโดยไม่ตั้งใจ
3. **การหลุดรอดของการตรวจสอบไทป์ (Lack of Immediate Verification)**: ไม่ได้รันตัวตรวจสอบ TypeScript Compiler ทันทีหลังจากแก้เสร็จ ทำให้พบปัญหาเมื่อต้องการ Build โปรดักชัน

---

## 🛡️ วิธีการป้องกันในอนาคต (Actionable Solutions)

### 1. การทำ Code Splitting (แยกส่วนประกอบไฟล์) — *ดีที่สุดและยั่งยืนที่สุด*
ควรเริ่มแยกโค้ดภายในแท็บต่าง ๆ ของ `App.tsx` ออกเป็น Component ย่อย ๆ แล้วบันทึกไว้ในโฟลเดอร์ `src/components/` หรือ `src/components/portals/` เช่น:
* แยกแท็บ Canvas เป็น `src/components/CanvasTab.tsx`
* แยกแท็บ Discovery เป็น `src/components/DiscoveryTab.tsx`
* แยกแท็บ Video Suite เป็น `src/components/VerticalVideoSuiteTab.tsx`

จากนั้นใน `App.tsx` จะเหลือเพียงตัวควบคุมแท็บ (Tab Router/Controller) และนำเข้า (Import) คอมโพเนนต์เหล่านี้มาแสดงผล ทำให้ `App.tsx` ลดขนาดจาก 4,500 บรรทัด เหลือต่ำกว่า **500 บรรทัด** ซึ่งจะปลอดภัยจากการแก้ไขของ AI 100%

### 2. การสร้างและปฏิบัติตามกฎเหล็กของ AI (.clinerules / .cursorrules)
สร้างไฟล์กฎเกณฑ์ระดับระบบเพื่อให้ AI ที่เข้ามาทำงานอ่านและทำตามอย่างเคร่งครัด โดยบังคับให้รันตรวจสอบคำสั่งด้านความปลอดภัยเสมอ (ดูตัวอย่างด้านล่าง)

### 3. ขั้นตอนการตรวจสอบทุกครั้งหลังการแก้ไข (Mandatory Post-Edit Verification Checklist)
ผู้พัฒนาหรือ AI ต้องทำการตรวจสอบการคอมไพล์โค้ดหลังจากการทำแก้ไขใด ๆ ทันทีผ่าน Terminal:
1. **รันตัวตรวจสอบไทป์ (TypeScript Type Checking)**:
   ```bash
   cd frontend
   npx tsc -p tsconfig.app.json --noEmit
   ```
   *ห้ามผ่านงานหากมี Error แม้แต่จุดเดียว*
2. **รันการทดสอบ Build โปรดักชัน (Production Build Test)**:
   ```bash
   cd frontend
   npm run build
   ```
   *ตรวจสอบว่า Vite และ Rolldown บิลด์แอปพลิเคชันออกมาผ่าน*

---

## 🤖 ตัวอย่างการตั้งค่ากฎเหล็ก `.clinerules` ในโฟลเดอร์ Root
เพื่อให้ AI เครื่องมืออื่น ๆ (เช่น Cline, Cursor, Roo Code) ทราบแนวทางปฏิบัติโดยอัตโนมัติ ให้สร้างไฟล์ `.clinerules` ไว้ที่ระดับโฟลเดอร์หลัก:

```markdown
# Repository Rules for AI Assistants

## Critical Safety Guidelines
1. **Never Make Large Spliced Replacements**: When modifying `frontend/src/App.tsx` or other files larger than 1,000 lines, do not attempt to write the entire file or large contiguous blocks unless using dedicated code-slicing tools. Always make surgical edits.
2. **Immediate Type Validation**: After EVERY edit on TypeScript/TSX files, you MUST run the following command in the `frontend` folder to ensure no type errors were introduced:
   `npx tsc -p tsconfig.app.json --noEmit`
3. **Verify Build Success**: Before declaring the task complete, verify that the production build compiles cleanly:
   `npm run build`
4. **Code Splitting Preference**: If adding new feature modules, create them as standalone components under `frontend/src/components/` and import them rather than expanding `frontend/src/App.tsx`.
```
