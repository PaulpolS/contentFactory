import React, { useState, useEffect, useRef } from 'react';

const STRICT_COPYWRITING_RULES = `
[กฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด (Strict Output Rules จาก ai_prompt_instructions.md)]
กรุณาปฏิบัติตามกฎด้านรูปแบบการตอบกลับอย่างเคร่งครัดที่สุด หากไม่ปฏิบัติตามจะถือว่าการทำงานล้มเหลว:

1. เริ่มต้นด้วยเนื้อหาโพสต์/แคปชั่นทันที:
   ห้ามเขียนข้อความเกริ่นนำ, คำทักทาย หรือข้อความพูดคุยของ AI ใดๆ ทั้งสิ้น (เช่น ห้ามเขียนว่า "แน่นอนครับ...", "นี่คือตัวอย่าง...", "ยินดีค่ะ...", "Certainly!...", "Here is...") ข้อความแรกที่ตอบกลับมาจะต้องเริ่มด้วยอักขระตัวแรกของแคปชั่นทันที

2. ห้ามใส่หัวข้อหรือลำดับแนวคิดเด็ดขาด:
   ห้ามใส่หัวข้อเรื่อง, หัวข้อใหญ่ (##), หัวข้อย่อย (###), หรือคำระบุลำดับแคปชั่นเด็ดขาด (เช่น ห้ามมีคำว่า "แนวคิดที่ 1:", "ตัวอย่างที่ 1:", "**แนวคิดที่ 1**", "ตัวอย่างแคปชั่นสำหรับโพสต์")

3. ห้ามใช้เครื่องหมายตกแต่งคั่นกลาง:
   ห้ามใช้เครื่องหมายคั่นกลางจำพวกเส้นขีด เช่น "-------", "---", "***", "===" เด็ดขาด

4. การแบ่งตัวเลือก/แคปชั่น:
   หากต้องการเสนอแคปชั่นหลายรูปแบบ ให้แบ่งแต่ละตัวเลือกด้วยการ "เว้นบรรทัดเปล่า 2 บรรทัด (\\n\\n)" เท่านั้น เพื่อให้ระบบแยกแยะและนำไปโพสต์ได้ง่าย

5. ห้ามใส่คำอธิบายท้ายแคปชั่น:
   ห้ามมีข้อความคุยท้ายประโยค, ข้อความอธิบายเหตุผล, หรือคำถามเพื่อสื่อสารกับผู้สั่งงาน (เช่น ห้ามมีคำว่า "หวังว่าจะชอบนะคะ", "หากต้องการแก้ไขโปรดบอก") แคปชั่นจะต้องจบลงที่ตัวสะกดหรือ Emoji ตัวสุดท้ายของเนื้อหาโพสต์เท่านั้น

---
[ตัวอย่างผลลัพธ์ที่ถูกต้องและพร้อมใช้งาน (Good Output - แคปชั่นแท้ 100%)]
"**ชีวิตก็เช่นหยก ต้องผ่านการชำระล้าง เพื่อเผยความงามที่แท้จริง**"
เช่นเดียวกับหยกที่ต้องการการดูแล ด้วยการบ่มเพาะในเกลือบริสุทธิ์ เพื่อดึงดูดพลังงานที่หนักอึ้งและความหมองมัวออกไปจากเนื้อแท้ที่งามล้ำ ในบางช่วงชีวิต เราเองก็จำเป็นต้องหยุดพัก เพื่อให้จิตใจได้ชำระล้างสิ่งรบกวน ความคิดลบที่เกาะกิน และความวุ่นวายที่สะสม เพื่อกลับคืนสู่ความสงบภายใน แล้ววันนี้ คุณได้ชำระล้างสิ่งใดในชีวิตบ้างแล้วหรือยัง? 🌿

"**แท้จริงแล้ว ความหมองมัวไม่ใช่เนื้อแท้ หากคือคราบที่ต้องเช็ดออก**"
บางคราว หยกอาจดูหมองหม่น ไม่ส่องประกายดั่งเดิม ไม่ใช่เพราะเนื้อแท้ของมันเปลี่ยนไป หากแต่เป็นเพียงสิ่งเจือปนที่เกาะกุม การแช่ในเกลือบริสุทธิ์ จึงเป็นการช่วยกระตุ้นให้หยกได้ปลดปล่อยสิ่งรบกวน เปรียบได้กับช่วงเวลาที่เราเผชิญกับความทุกข์ ความผิดหวัง จิตใจอาจถูกบดบังด้วยความเจ็บปวด แต่แก่นแท้ของจิตวิญญาณเรายังคงบริสุทธิ์เสมอ 🌿
`;

export default function FlowAutomatorPortal() {
  const [dropboxKey, setDropboxKey] = useState(localStorage.getItem('dropbox_key') || '');
  const [folderPath, setFolderPath] = useState('/หยก/set3');
  
  const [systemPrompt, setSystemPrompt] = useState(`## สินค้าหยก
Role: คุณคือเจ้าของร้านหยกประสบการณ์สูงที่เน้นการขายแบบ "Short & Sharp" (สั้น กระชับ ได้ใจความ) สไตล์ของคุณคือ ตรงไปตรงมา จริงใจ บอกสเปกชัดเจน และเน้นความคุ้มค่า
Task: ดูข้อมูลรูปภาพสินค้าหยก แล้วเขียนแคปชั่นขายของแบบสั้นๆ (Micro-Content) ที่คนอ่านจบใน 10 วินาทีแล้วอยากทักซื้อทันที

Rules (กฎเหล็ก):
ห้ามมีหัวข้อ: ห้ามใส่คำว่า "Hook:", "Body:", "Price:" หรือหัวข้อใดๆ
ความยาว: ห้ามเกิน 4-5 บรรทัด (รวมเว้นวรรค)
หัวข้อบังคับ:
บรรทัดแรก: จุดเด่น
บรรทัดสอง: สเปก
บรรทัดสาม: ราคาและ CTA

รูปแบบ: เป็นข้อความดิบ ไม่มี markdown ไม่ใช้ markdown bold

${STRICT_COPYWRITING_RULES}`);

  const [logs, setLogs] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  // New V2 states
  const [automatorMode, setAutomatorMode] = useState<'vision_caption' | 'filename_caption' | 'only_convert' | 'filename_convert' | 'shopee_caption'>(() => {
    return (localStorage.getItem('automator_mode') as 'vision_caption' | 'filename_caption' | 'only_convert' | 'filename_convert' | 'shopee_caption') || 'vision_caption';
  });
  
  const [dropboxStatus, setDropboxStatus] = useState<'connected' | 'disconnected' | 'checking' | 'idle'>('idle');
  const [openRouterStatus, setOpenRouterStatus] = useState<'connected' | 'disconnected' | 'checking' | 'idle'>('idle');
  
  const [activePromptTab, setActivePromptTab] = useState<'editor' | 'analyzer' | 'tuner'>('editor');
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  
  const [testKeyword, setTestKeyword] = useState('สร้อยข้อมือหยกขาวแกะสลักสวยๆ');
  const [isGeneratingTest, setIsGeneratingTest] = useState(false);
  const [testResult, setTestResult] = useState('');
  
  const [userFeedback, setUserFeedback] = useState('');
  const [isRefiningPrompt, setIsRefiningPrompt] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  // ── โหมด Shopee: ฐานข้อมูลสินค้า (จับคู่ชื่อไฟล์ → เขียนแคปชั่นขาย) ──
  const [shopeeDb, setShopeeDb] = useState<Array<{ name: string; link: string; detail: string }>>(() => {
    try { return JSON.parse(localStorage.getItem('flow_shopee_db') || '[]'); } catch { return []; }
  });
  const [shopeeDbSource, setShopeeDbSource] = useState(() => localStorage.getItem('flow_shopee_db_source') || '');
  const [shopeeDbSheetUrl, setShopeeDbSheetUrl] = useState(() => localStorage.getItem('flow_shopee_db_sheet_url') || 'https://docs.google.com/spreadsheets/d/18sppbH-mkojCxcMhOMz726a8UVwx6jUl-UaXoSHIxi0/edit?gid=337821009');
  const [shopeeDbLoading, setShopeeDbLoading] = useState(false);
  const shopeeCsvRef = useRef<HTMLInputElement>(null);
  const [shopeeRows, setShopeeRows] = useState<string[][]>([]);

  useEffect(() => {
    localStorage.setItem('automator_mode', automatorMode);
    if (automatorMode === 'only_convert' || automatorMode === 'filename_convert') {
      setActivePromptTab('editor');
    }
  }, [automatorMode]);

  // Google OAuth states
  const [clientIds, setClientIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('google_client_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [selectedClientId, setSelectedClientId] = useState<string>(() => {
    return localStorage.getItem('google_selected_client_id') || '';
  });
  const [newClientId, setNewClientId] = useState('');
  
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  
  // Output Mode: "sheets" (Append to Google Sheets) or "csv" (Local download)
  const [outputMode, setOutputMode] = useState<'sheets' | 'csv'>(() => {
     return (localStorage.getItem('flow_output_mode') as 'sheets' | 'csv') || 'csv';
  });

  const [savedBrains, setSavedBrains] = useState<{id:string, name:string, content:string}[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('system_prompts_brain') || '[]');
    } catch { return []; }
  });
  const [selectedBrainId, setSelectedBrainId] = useState<string>('');

  // Sync savedBrains when window focused
  useEffect(() => {
    const syncBrains = () => {
      try {
        setSavedBrains(JSON.parse(localStorage.getItem('system_prompts_brain') || '[]'));
      } catch {}
    };
    window.addEventListener('focus', syncBrains);
    syncBrains(); 
    return () => window.removeEventListener('focus', syncBrains);
  }, []);
  
  // Dropbox key persistence
  useEffect(() => {
    localStorage.setItem('dropbox_key', dropboxKey);
  }, [dropboxKey]);

  // Google Sheets integration states
  const [spreadsheets, setSpreadsheets] = useState<{id: string, name: string}[]>([]);
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<string>(localStorage.getItem('google_selected_spreadsheet') || '');
  
  const [worksheets, setWorksheets] = useState<{title: string, id: number}[]>([]);
  const [selectedWorksheet, setSelectedWorksheet] = useState<string>(localStorage.getItem('google_selected_worksheet') || '');

  useEffect(() => {
    localStorage.setItem('google_client_ids', JSON.stringify(clientIds));
  }, [clientIds]);

  useEffect(() => {
    localStorage.setItem('google_selected_client_id', selectedClientId);
  }, [selectedClientId]);
  
  useEffect(() => {
    localStorage.setItem('google_selected_spreadsheet', selectedSpreadsheet);
  }, [selectedSpreadsheet]);
  
  useEffect(() => {
    localStorage.setItem('google_selected_worksheet', selectedWorksheet);
  }, [selectedWorksheet]);

  useEffect(() => {
    localStorage.setItem('flow_output_mode', outputMode);
  }, [outputMode]);

  // Scan and migrate existing brains in localStorage to include the strict rules
  useEffect(() => {
    try {
      const stored = localStorage.getItem('system_prompts_brain');
      if (stored) {
        const brains = JSON.parse(stored);
        let updated = false;
        const migrated = brains.map((b: any) => {
          if (!b.content.includes("Strict Output Rules") && !b.content.includes("กฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด")) {
            b.content = b.content.trim() + "\n\n" + STRICT_COPYWRITING_RULES.trim();
            updated = true;
          }
          return b;
        });
        if (updated) {
          localStorage.setItem('system_prompts_brain', JSON.stringify(migrated));
          setSavedBrains(migrated);
          addLog("🧠 ระบบได้สแกนและปรับปรุงกฎเหล็กเด็ดขาด (Strict Output Rules) เข้ากับทุกสมองในคลังของบอสเรียบร้อยแล้วครับ!");
          
          const BACKEND_BASE = window.location.port !== '5005' ? 'http://localhost:5005' : '';
          fetch(`${BACKEND_BASE}/api/save-app-data`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'brains', data: migrated })
          }).catch(err => console.error("Failed to sync migrated brains to backend:", err));
        }
      }
    } catch (e) {
      console.error("Failed to migrate brains:", e);
    }
  }, []);
  
  const cancelRef = useRef<boolean>(false);

  const [cacheData, setCacheData] = useState<{
    folderPath: string;
    completed: Array<{
      id: string;
      name: string;
      row: any[];
    }>;
  } | null>(() => {
    try {
      const cached = localStorage.getItem('flow_automator_cache');
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  const downloadCacheCsv = () => {
    if (!cacheData || cacheData.completed.length === 0) {
      alert("ไม่มีข้อมูลที่เสร็จแล้วให้ดาวน์โหลดครับ");
      return;
    }
    
    addLog(`📦 กำลังสร้างไฟล์ CSV จากแคชเดิมจำนวน ${cacheData.completed.length} รายการ...`);
    let csvContent = ""; 
    
    cacheData.completed.forEach(item => {
       csvContent += item.row.join(",") + "\r\n";
    });
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `automator_cache_export_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    addLog(`📥 ดาวน์โหลดไฟล์ CSV สำเร็จแล้ว!`);
  };

  const clearCache = () => {
    if (confirm("⚠️ คุณแน่ใจใช่ไหมว่าต้องการล้างงานเดิมที่ค้างไว้? ข้อมูลที่ทำเสร็จแล้วแต่ยังไม่ได้รับไฟล์ CSV จะสูญหายนะบอส")) {
      localStorage.removeItem('flow_automator_cache');
      setCacheData(null);
      addLog(`🗑️ เคลียร์แคชระบบเรียบร้อย เริ่มใหม่แบบคลีนๆ ได้เลยครับ`);
    }
  };

  // Catch redirected Google OAuth Token
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('access_token=')) {
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get('access_token');
      if (token) {
        setGoogleToken(token);
        addLog(`✅ ล็อคอิน Google สำเร็จ! (วิธี Redirect) ได้รับ Token แล้ว`);
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchSpreadsheets(token);
      }
    }
  }, []);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  };

  const getOpenRouterKey = () => localStorage.getItem('openrouter_key')?.trim() || '';

  const checkDropboxConnection = async (token: string) => {
    if (!token.trim()) {
      setDropboxStatus('disconnected');
      return;
    }
    setDropboxStatus('checking');
    try {
      const res = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.trim()}`
        }
      });
      if (res.ok) {
        setDropboxStatus('connected');
      } else {
        const errText = await res.text();
        console.error(`[DROPBOX CHECK ERROR] Status: ${res.status}, Response: ${errText}`);
        addLog(`⚠️ ตรวจสอบ Dropbox ไม่ผ่าน (Status: ${res.status}) - ${errText}`);
        setDropboxStatus('disconnected');
      }
    } catch (e: any) {
      console.error('[DROPBOX CHECK ERROR] Connection failed:', e);
      addLog(`⚠️ ตรวจสอบ Dropbox ขัดข้อง: ${e.message || e}`);
      setDropboxStatus('disconnected');
    }
  };

  const checkOpenRouterConnection = async (key: string) => {
    if (!key.trim()) {
      setOpenRouterStatus('disconnected');
      return;
    }
    setOpenRouterStatus('checking');
    try {
      const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key.trim()}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.data?.is_active) {
          setOpenRouterStatus('connected');
        } else {
          setOpenRouterStatus('connected');
        }
      } else {
        setOpenRouterStatus('disconnected');
      }
    } catch {
      setOpenRouterStatus('disconnected');
    }
  };

  const runApiChecks = async () => {
    // Proactively refresh Dropbox token using credentials if needed
    const refreshed = await refreshDropboxTokenIfNeeded();

    const savedProfiles = JSON.parse(localStorage.getItem('api_global_profiles') || '[]');
    const activeId = localStorage.getItem('api_global_active_id');
    const profile = savedProfiles.find((x: any) => x.id === activeId) || savedProfiles[0];
    const dbKey = refreshed || profile?.dropboxKey || localStorage.getItem('dropbox_key') || dropboxKey;
    if (dbKey) {
      checkDropboxConnection(dbKey);
    } else {
      setDropboxStatus('disconnected');
    }

    const orKey = getOpenRouterKey();
    if (orKey) {
      checkOpenRouterConnection(orKey);
    } else {
      setOpenRouterStatus('disconnected');
    }
  };

  useEffect(() => {
    runApiChecks();
  }, []);

  const handleTxtFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const openRouterKey = getOpenRouterKey();
    if (!openRouterKey) {
      alert("⚠️ กรุณาตั้งค่าและตรวจสอบความถูกต้องของ OpenRouter API Key ก่อนวิเคราะห์สำนวนเขียนครับ");
      return;
    }

    setIsAnalyzingFile(true);
    addLog(`📄 กำลังอ่านไฟล์ตัวอย่างสำนวนเขียน: ${file.name}...`);

    try {
      const text = await file.text();
      addLog(`🤖 กำลังส่งข้อความตัวอย่างไปให้ AI วิเคราะห์สกัดสำนวนและสร้างสมองใหม่...`);
      
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "HTTP-Referer": window.location.href,
          "X-Title": "BulkVideoCreator",
          "Authorization": `Bearer ${openRouterKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `คุณคือผู้เชี่ยวชาญด้านการวิเคราะห์สำนวนการเขียนและ Prompt Engineer ระดับสูง (AI Copywriting Style & Prompt Analyst)
หน้าที่ของคุณคือวิเคราะห์ตัวอย่างข้อความ/แคปชั่น/โพสต์ขายของที่แนบมาด้านล่างนี้ โดยสกัดรูปแบบการเขียนที่โดดเด่นออกมาเป็น "AI System Prompt (สมองของ AI)" เพื่อใช้ในการสั่งให้โมเดลภาษาเขียนข้อความในสไตล์นี้ได้อย่างแม่นยำในอนาคต

โปรดวิเคราะห์ลักษณะเหล่านี้:
1. โทนเสียง (Tone & Voice): เช่น เป็นกันเอง, พรีเมียม, ตรงไปตรงมา, ตลก, ออดอ้อน
2. โครงสร้างโพสต์ (Structure & Formats): เช่น การเว้นวรรค, การใช้ Bullet points, การใช้อีโมจิ, รูปแบบราคา, และการจูงใจ (CTA)
3. ความยาวโพสต์ (Length constraints)
4. กฎเหล็ก (Rules / Do's & Don'ts)

นี่คือตัวอย่างข้อความสำนวนที่จะให้วิเคราะห์:
"""
${text}
"""

กรุณาแปลงข้อมูลที่ได้จากการวิเคราะห์ออกมาในรูปแบบของ AI System Prompt ภาษาไทยที่สมบูรณ์ โดยจัดเตรียมหัวข้ออย่างสวยงาม (เช่น ## บทบาทของคุณ, ## กฎเหล็ก, ## รูปแบบโครงสร้าง) และมีคำสั่งที่ชัดเจน เพื่อให้ AI เข้าใจและนำไปผลิตโพสต์ใหม่ได้ทันที

ข้อกำหนดเด็ดขาด: บังคับให้คุณคัดลอกท่อนกฎเหล็กและรูปแบบการตอบกลับด้านล่างนี้ (Strict Output Rules) ต่อท้ายลงใน AI System Prompt ที่วิเคราะห์ขึ้นมาภายใต้หัวข้อ "## กฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด (Strict Output Rules)" ทุกครั้ง ห้ามละเลยเด็ดขาด เพื่อความสะอาดพร้อมใช้งาน 100%:
${STRICT_COPYWRITING_RULES}

ตอบกลับเฉพาะตัว System Prompt ที่เสร็จแล้วเท่านั้น ไม่ต้องระบุบทนำหรือคำอธิบายภายนอก`
            }
          ]
        })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const extractedPrompt = data.choices?.[0]?.message?.content || "";
      
      if (extractedPrompt) {
        let finalPrompt = extractedPrompt;
        if (!finalPrompt.includes("Strict Output Rules") && !finalPrompt.includes("กฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด")) {
          finalPrompt = finalPrompt.trim() + "\n\n" + STRICT_COPYWRITING_RULES.trim();
        }
        setSystemPrompt(finalPrompt);
        addLog(`✅ วิเคราะห์สำนวนสำเร็จ! ได้เขียนทับลงในช่องกรอก System Prompt เรียบร้อยแล้ว`);
        
        const brainName = `สมองจากไฟล์ ${file.name.replace('.txt', '')} (${new Date().toLocaleDateString('th-TH')})`;
        const newBrainId = 'brain_' + Date.now();
        const newBrain = { id: newBrainId, name: brainName, content: finalPrompt };
        const updatedBrains = [newBrain, ...savedBrains];
        localStorage.setItem('system_prompts_brain', JSON.stringify(updatedBrains));
        setSavedBrains(updatedBrains);
        setSelectedBrainId(newBrainId);
        addLog(`🧠 บันทึกสมองชุดใหม่ "${brainName}" ลงคลังเรียบร้อย!`);
        setActivePromptTab('editor');
      } else {
        addLog(`❌ AI ไม่สามารถสกัดข้อความสำนวนออกมาได้`);
      }
    } catch (e: any) {
      addLog(`❌ ข้อผิดพลาดในการวิเคราะห์ไฟล์: ${e.message}`);
      alert(`❌ วิเคราะห์ไฟล์ไม่สำเร็จ: ${e.message}`);
    } finally {
      setIsAnalyzingFile(false);
      event.target.value = '';
    }
  };

  const handleTestGenerate = async (keyword: string) => {
    const openRouterKey = getOpenRouterKey();
    if (!openRouterKey) {
      alert("⚠️ กรุณาตั้งค่าและตรวจสอบความถูกต้องของ OpenRouter API Key ก่อนทดลองสร้างบทความครับ");
      return;
    }
    
    setIsGeneratingTest(true);
    setTestResult('');
    setFeedbackSuccess(false);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "HTTP-Referer": window.location.href,
          "X-Title": "BulkVideoCreator",
          "Authorization": `Bearer ${openRouterKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `โปรดช่วยเขียนแคปชั่น/โพสต์ หรือคำคมโดยใช้หัวข้อ/ชื่อสินค้า/คำสำคัญนี้: "${keyword}" ตามสไตล์และกฎเหล็กที่ระบุไว้ในระบบของคุณอย่างเคร่งครัด`
            }
          ]
        })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      setTestResult(data.choices?.[0]?.message?.content || '');
    } catch (e: any) {
      alert(`❌ ทดลองสร้างบทความล้มเหลว: ${e.message}`);
    } finally {
      setIsGeneratingTest(false);
    }
  };

  const handleRefinePrompt = async () => {
    if (!userFeedback.trim()) {
      alert("กรุณากรอกข้อแนะนำแก้ไขก่อนครับ");
      return;
    }

    const openRouterKey = getOpenRouterKey();
    if (!openRouterKey) {
      alert("⚠️ กรุณาตั้งค่าและตรวจสอบความถูกต้องของ OpenRouter API Key ก่อนปรับแต่งสมองครับ");
      return;
    }

    setIsRefiningPrompt(true);
    setFeedbackSuccess(false);

    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "HTTP-Referer": window.location.href,
          "X-Title": "BulkVideoCreator",
          "Authorization": `Bearer ${openRouterKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "user",
              content: `คุณคือวิศวกรออกแบบคำสั่งระบบ (Prompt Engineer) ขั้นเทพ
ผู้ใช้กำลังใช้ AI System Prompt (สมองของ AI) ตัวนี้อยู่:
---
${systemPrompt}
---

และมีผลลัพธ์การทดลองสร้างบทความ/แคปชั่นที่ได้คือ:
---
${testResult}
---

แต่ผู้ใช้ระบุว่าผลลัพธ์นี้ยังไม่น่าพึงพอใจ และให้ "คำแนะนำแก้ไขเพื่อให้ปรับปรุงสำนวนและกฎเหล็ก" ดังนี้:
---
${userFeedback}
---

กรุณาปรับปรุงตัว System Prompt (สมองของ AI) ข้างต้นใหม่ทั้งหมด โดยคงโครงสร้างเดิมที่ดีไว้ แต่เพิ่มเติม แก้ไข หรือกระชับกฎเกณฑ์ กฎเหล็ก หรือโทนอารมณ์ของการเขียนตามคำแนะนำของผู้ใช้ให้สมบูรณ์ขึ้น

และต้องบังคับแทรกรักษาท่อนกฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด (Strict Output Rules) ดังนี้ไว้ที่ท้ายสุดของ System Prompt ใหม่ภายใต้หัวข้อ "## กฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด (Strict Output Rules)" เสมอ ห้ามละเลยเด็ดขาด:
${STRICT_COPYWRITING_RULES}

ตอบกลับเฉพาะตัว System Prompt ใหม่ที่ปรับปรุงเสร็จแล้วเท่านั้น ไม่มีคำอธิบายภายนอกเด็ดขาด`
            }
          ]
        })
      });

      if (!res.ok) throw new Error(await res.text());

      const data = await res.json();
      const refined = data.choices?.[0]?.message?.content || "";
      if (refined) {
        let finalRefined = refined;
        if (!finalRefined.includes("Strict Output Rules") && !finalRefined.includes("กฎเหล็กและรูปแบบการตอบกลับขั้นเด็ดขาด")) {
          finalRefined = finalRefined.trim() + "\n\n" + STRICT_COPYWRITING_RULES.trim();
        }
        setSystemPrompt(finalRefined);
        setUserFeedback('');
        setFeedbackSuccess(true);
        await handleTestGenerate(testKeyword);
      }
    } catch (e: any) {
      alert(`❌ ปรับปรุงสมองล้มเหลว: ${e.message}`);
    } finally {
      setIsRefiningPrompt(false);
    }
  };

  const handleSaveCurrentBrain = () => {
    if (!systemPrompt.trim()) return alert("กรุณากรอก Prompt ก่อนบันทึก");
    const name = prompt("ตั้งชื่อสมองชุดใหม่นี้:");
    if (!name) return;
    const newId = 'brain_' + Date.now();
    const newBrain = { id: newId, name: name.trim(), content: systemPrompt };
    const updated = [newBrain, ...savedBrains];
    localStorage.setItem('system_prompts_brain', JSON.stringify(updated));
    setSavedBrains(updated);
    setSelectedBrainId(newId);
    alert(`🧠 บันทึกสมอง "${name}" สำเร็จ!`);
  };
  
  const handleAddClientId = () => {
    if (newClientId && !clientIds.includes(newClientId)) {
      const updated = [...clientIds, newClientId];
      setClientIds(updated);
      setSelectedClientId(newClientId);
      setNewClientId('');
    }
  };

  const handleDeleteClientId = (id: string) => {
    const updated = clientIds.filter(c => c !== id);
    setClientIds(updated);
    if (selectedClientId === id) {
      setSelectedClientId(updated.length > 0 ? updated[0] : '');
    }
  };

  const loginGoogle = () => {
    if (!selectedClientId) return alert("กรุณาเลือกหรือเพิ่ม Google Client ID ก่อน");
    
    const clientId = selectedClientId.trim();
    if (!clientId.endsWith('.apps.googleusercontent.com')) {
      alert("❌ Client ID ของคุณไม่ถูกต้อง! ต้องลงท้ายด้วย .apps.googleusercontent.com เสมอครับ");
      return;
    }

    addLog(`🔑 กำลังสลับหน้าต่างไปล็อคอินที่ Google (Redirect Flow)...`);
    const redirectUri = encodeURIComponent('http://localhost:5173');
    const scope = encodeURIComponent('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=token&scope=${scope}&include_granted_scopes=true`;
    
    window.location.href = authUrl;
  };

  const fetchSpreadsheets = async (token: string) => {
    addLog(`📂 กำลังค้นหาไฟล์ชีททั้งหมดใน Google Drive...`);
    try {
      const res = await fetch("https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name)&orderBy=modifiedTime desc", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSpreadsheets(data.files || []);
      addLog(`✅ พบชีทจำนวน ${data.files?.length || 0} ไฟล์`);
    } catch (e: any) {
      addLog(`❌ ดึงรายชื่อชีทไม่ได้: ${e.message}`);
    }
  };

  const fetchWorksheets = async (spreadsheetId: string) => {
    if (!googleToken || !spreadsheetId) return;
    addLog(`📂 กำลังดึงแท็บงานในชีทที่เลือก...`);
    try {
      const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties(title,sheetId)`, {
        headers: { Authorization: `Bearer ${googleToken}` }
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      const sheets = data.sheets.map((s: any) => s.properties);
      setWorksheets(sheets || []);
      if (!selectedWorksheet || !sheets.find((s: any) => s.title === selectedWorksheet)) {
         setSelectedWorksheet(sheets[0]?.title || '');
      }
    } catch (e: any) {
      addLog(`❌ ดึงรายชื่อแท็บไม่ได้: ${e.message}`);
    }
  };

  useEffect(() => {
    if (selectedSpreadsheet && googleToken) {
      fetchWorksheets(selectedSpreadsheet);
    }
  }, [selectedSpreadsheet, googleToken]);

  const refreshDropboxTokenIfNeeded = async (): Promise<string> => {
    try {
      const savedProfiles = JSON.parse(localStorage.getItem('api_global_profiles') || '[]');
      const activeId = localStorage.getItem('api_global_active_id');
      const profile = savedProfiles.find((x: any) => x.id === activeId) || savedProfiles[0];
      
      if (profile && profile.dropboxRefreshToken && profile.dropboxAppKey && profile.dropboxAppSecret) {
        addLog(`🔄 ตรวจพบระบบ Auto-Refresh (กำลังอัปเดตคีย์ Dropbox ใหม่เอี่ยมให้คุณ...)`);
        const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
           method: 'POST',
           headers: {
             'Content-Type': 'application/x-www-form-urlencoded',
             'Authorization': 'Basic ' + btoa(profile.dropboxAppKey + ':' + profile.dropboxAppSecret)
           },
           body: new URLSearchParams({
              grant_type: 'refresh_token',
              refresh_token: profile.dropboxRefreshToken
           })
         });
         const data = await res.json();
         if (data.access_token) {
            profile.dropboxKey = data.access_token;
            localStorage.setItem('api_global_profiles', JSON.stringify(savedProfiles));
            localStorage.setItem('dropbox_key', data.access_token);
            setDropboxKey(data.access_token);
            addLog(`✅ ดึงคีย์ใหม่สำเร็จ! คีย์นี้จะไม่มีวันหมดอายุระหว่างรัน`);
            return data.access_token;
         } else {
            addLog(`⚠️ แจ้งเตือน: ดึงคีย์ใหม่ไม่สำเร็จ (${data.error_description || 'Unknown'})`);
         }
      } else {
        // Fallback to global localStorage keys if no profile-specific OAuth exists!
        const appKey = localStorage.getItem('dropbox_app_key')?.trim() || '';
        const appSecret = localStorage.getItem('dropbox_app_secret')?.trim() || '';
        const refreshToken = localStorage.getItem('dropbox_refresh_token')?.trim() || '';

        if (appKey && appSecret && refreshToken) {
          addLog(`🔄 ตรวจพบระบบ Auto-Refresh ทั่วไป (กำลังขอคีย์ Dropbox ใหม่จากระบบ...)`);
          const res = await fetch('https://api.dropboxapi.com/oauth2/token', {
             method: 'POST',
             headers: {
               'Content-Type': 'application/x-www-form-urlencoded',
               'Authorization': 'Basic ' + btoa(appKey + ':' + appSecret)
             },
             body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken
             })
          });
          const data = await res.json();
          if (data.access_token) {
             localStorage.setItem('dropbox_key', data.access_token);
             setDropboxKey(data.access_token);
             addLog(`✅ ต่ออายุคีย์สำเร็จ! คีย์นี้พร้อมใช้ในการรันบอท`);
             return data.access_token;
          } else {
             addLog(`⚠️ แจ้งเตือน: ต่ออายุคีย์ถาวรไม่ได้ (${data.error_description || 'Unknown'})`);
          }
        }
      }
    } catch(e) {
       addLog(`⚠️ แจ้งเตือน: ระบบ Auto-Refresh ขัดข้อง (${e})`);
    }
    return '';
  };

  // ── โหมด Shopee: helpers ──
  const BACKEND_BASE_FLOW = window.location.port !== '5005' ? 'http://localhost:5005' : '';

  const parseShopeeCsv = (text: string): Array<{ name: string; link: string; detail: string }> => {
    const rows: string[][] = [];
    let row: string[] = [], field = '', inQ = false;
    const s = String(text || '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inQ) { if (c === '"') { if (s[i + 1] === '"') { field += '"'; i++; } else inQ = false; } else field += c; }
      else { if (c === '"') inQ = true; else if (c === ',') { row.push(field); field = ''; } else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else field += c; }
    }
    if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
    const clean = rows.filter(r => r.some(c => c.trim() !== ''));
    if (!clean.length) return [];
    const header = clean[0].map(h => h.trim());
    const iName = header.findIndex(h => h.includes('โฟลเดอร์') || h.toLowerCase().includes('name'));
    const iLink = header.findIndex(h => h.toLowerCase().includes('link'));
    const iDetail = header.findIndex(h => h.includes('รายละเอียด') || h.toLowerCase().includes('detail'));
    return clean.slice(1).map(r => ({
      name: (iName >= 0 ? r[iName] : r[0] || '').trim(),
      link: (iLink >= 0 ? r[iLink] : '').trim(),
      detail: (iDetail >= 0 ? r[iDetail] : r[r.length - 1] || '').trim(),
    })).filter(p => p.name);
  };

  const applyShopeeDb = (products: Array<{ name: string; link: string; detail: string }>, source: string) => {
    setShopeeDb(products);
    setShopeeDbSource(source);
    try { localStorage.setItem('flow_shopee_db', JSON.stringify(products)); localStorage.setItem('flow_shopee_db_source', source); } catch {}
  };

  const loadShopeeDbFromSheet = async () => {
    if (!shopeeDbSheetUrl.trim()) { alert('กรุณาวางลิงก์ Google Sheet ก่อน'); return; }
    setShopeeDbLoading(true);
    try {
      localStorage.setItem('flow_shopee_db_sheet_url', shopeeDbSheetUrl);
      const res = await fetch(`${BACKEND_BASE_FLOW}/api/gsheet-products?url=${encodeURIComponent(shopeeDbSheetUrl)}`);
      const data = await res.json();
      if (data.success && data.products?.length) {
        applyShopeeDb(data.products, `Google Sheet (${data.products.length} รายการ)`);
        addLog(`🔗 ดึงข้อมูลสินค้าจาก Google Sheet สำเร็จ ${data.products.length} รายการ`);
      } else {
        alert(data.error || 'ดึง Google Sheet ไม่สำเร็จ');
      }
    } catch (e: any) {
      alert(`ดึง Google Sheet ไม่สำเร็จ: ${e.message || e}`);
    } finally {
      setShopeeDbLoading(false);
    }
  };

  const handleShopeeCsvUpload = async (file: File | null) => {
    if (!file) return;
    try {
      const products = parseShopeeCsv(await file.text());
      if (!products.length) { alert('อ่าน CSV ไม่พบข้อมูลสินค้า (ต้องมีคอลัมน์ ชื่อในโฟลเดอร์ / รายละเอียดสินค้า)'); return; }
      applyShopeeDb(products, file.name);
      addLog(`📄 อัพโหลด CSV สินค้า "${file.name}" — ${products.length} รายการ`);
    } catch (e: any) {
      alert(`อ่านไฟล์ไม่สำเร็จ: ${e.message || e}`);
    }
  };

  const numIdOf = (s: string) => (String(s || '').match(/(\d{1,6})/) || [])[1] || '';
  const matchShopeeProduct = (filename: string, products: Array<{ name: string; link: string; detail: string }>) => {
    const base = filename.replace(/\.[^.]+$/, '');
    const id = (base.match(/^\s*(\d{1,6})/) || [])[1] || '';
    if (id) { const byId = products.find(p => numIdOf(p.name) === id); if (byId) return byId; }
    const key = base.toLowerCase();
    return products.find(p => p.name && key.startsWith(p.name.trim().toLowerCase())) || null;
  };

  const downloadShopeeCsv = (rowsArg?: string[][]) => {
    const rows = rowsArg && rowsArg.length ? rowsArg : shopeeRows;
    if (!rows || rows.length <= 1) { alert('ยังไม่มีข้อมูลให้ดาวน์โหลด — กด Run โหมด Shopee ให้เสร็จก่อนครับ'); return; }
    const esc = (s: string) => `"${String(s ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
    const csv = rows.map(r => r.map(esc).join(',')).join('\r\n');
    const blob = new Blob(["﻿" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shopee_captions_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const runShopeeCaptionWorkflow = async () => {
    setIsRunning(true);
    setLogs([]);
    cancelRef.current = false;
    try {
      const refreshedToken = await refreshDropboxTokenIfNeeded();
      const currentDropboxKey = (refreshedToken || localStorage.getItem('dropbox_key') || dropboxKey || '').trim();
      if (!currentDropboxKey) { alert('กรุณาใส่ Dropbox Access Token ใน ⚙️ ตั้งค่า API ก่อนครับ'); return; }
      const openRouterKey = getOpenRouterKey();
      if (!openRouterKey) { alert('กรุณาใส่ OpenRouter API Key ใน ⚙️ ตั้งค่า API ก่อนครับ'); return; }
      if (outputMode === 'sheets') {
        if (!googleToken) { alert('กรุณา Login with Google และเลือกชีทก่อน'); return; }
        if (!selectedSpreadsheet || !selectedWorksheet) { alert('กรุณาเลือก Google Sheet และแท็บเป้าหมายก่อน'); return; }
      }

      let products = shopeeDb;
      if (!products.length) {
        addLog('📊 ยังไม่มีฐานข้อมูลสินค้า — กำลังดึงจาก Google Sheet เริ่มต้น...');
        try {
          const res = await fetch(`${BACKEND_BASE_FLOW}/api/gsheet-products?url=${encodeURIComponent(shopeeDbSheetUrl)}`);
          const data = await res.json();
          if (data.success && data.products?.length) { products = data.products; applyShopeeDb(products, `Google Sheet (${products.length} รายการ)`); }
        } catch {}
      }
      if (!products.length) { alert('ไม่มีฐานข้อมูลสินค้า — อัพโหลด CSV หรือใส่ลิงก์ Google Sheet ก่อน'); return; }
      addLog(`🛒 โหมด Shopee เริ่มทำงาน — ฐานข้อมูลสินค้า ${products.length} รายการ (Output: ${outputMode === 'csv' ? 'ไฟล์ CSV' : 'Google Sheets'})`);

      addLog(`📂 กำลังดึงรายชื่อไฟล์จาก Dropbox: ${folderPath}`);
      const dbxRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
        method: "POST",
        headers: { "Authorization": `Bearer ${currentDropboxKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ path: folderPath.trim(), recursive: false, include_media_info: false, include_deleted: false, include_has_explicit_shared_members: false })
      });
      if (!dbxRes.ok) throw new Error(`Dropbox List Error: ${await dbxRes.text()}`);
      const listData = await dbxRes.json();
      const files = listData.entries.filter((e: any) => e['.tag'] === 'file');
      addLog(`✅ พบไฟล์ทั้งหมด ${files.length} รายการ`);

      const getDl1Link = (urlStr: string): string => {
        if (!urlStr) return "ไม่พบลิงก์";
        try { const url = new URL(urlStr); url.searchParams.delete('raw'); url.searchParams.set('dl', '1'); return url.toString(); }
        catch { let c = urlStr.replace(/[?&]dl=[01]/g, '').replace(/[?&]raw=1/g, ''); if (c.endsWith('?') || c.endsWith('&')) c = c.slice(0, -1); return c.includes('?') ? `${c}&dl=1` : `${c}?dl=1`; }
      };

      const header = ['ชื่อสินค้า', 'Link shopee', 'Link dropbox', 'แคปชั่นโพสสั้นๆ1', 'แคปชั่นโพสสั้นๆ2'];
      const rows: string[][] = [header];

      for (let i = 0; i < files.length; i++) {
        if (cancelRef.current) { addLog('🛑 ผู้ใช้สั่งหยุด จะรวมผลเท่าที่เสร็จ...'); break; }
        const file = files[i];
        addLog(`⏳ [${i + 1}/${files.length}] ${file.name}`);
        try {
          let fileUrl = '';
          try {
            const linkRes = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
              method: "POST", headers: { "Authorization": `Bearer ${currentDropboxKey}`, "Content-Type": "application/json" },
              body: JSON.stringify({ path: file.path_lower })
            });
            const shareData = await linkRes.json();
            if (shareData.url) fileUrl = shareData.url;
            else if (shareData.error && shareData.error.shared_link_already_exists) fileUrl = shareData.error.shared_link_already_exists.metadata.url;
          } catch (e: any) { addLog(`⚠️ หาลิงก์ Dropbox ไม่สำเร็จ: ${e.message || e}`); }
          const dropboxDl = getDl1Link(fileUrl);

          const product = matchShopeeProduct(file.name, products);
          if (!product) {
            addLog(`⚠️ ไม่พบสินค้าที่ตรงกับ "${file.name}" ในฐานข้อมูล — บันทึกลิงก์ไว้ ไม่มีแคปชั่น`);
            rows.push([file.name.replace(/\.[^.]+$/, ''), '', dropboxDl, '(ไม่พบข้อมูลสินค้า)', '']);
          } else {
            addLog(`🔗 จับคู่ "${file.name}" → ${product.name} · กำลังเขียนแคปชั่น...`);
            let captions: string[] = [];
            try {
              const capRes = await fetch(`${BACKEND_BASE_FLOW}/api/shopee-caption`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productName: product.name, productDetail: product.detail, openRouterKey, count: 2 })
              });
              const capData = await capRes.json();
              if (capData.success && capData.captions?.length) captions = capData.captions;
              else addLog(`⚠️ [${product.name}] ${capData.error || 'เขียนแคปชั่นไม่สำเร็จ'}`);
            } catch (e: any) { addLog(`⚠️ [${product.name}] เขียนแคปชั่นล้มเหลว: ${e.message || e}`); }
            rows.push([product.name, product.link || '', dropboxDl, captions[0] || '', captions[1] || '']);
          }

          if (outputMode === 'sheets') {
            const last = rows[rows.length - 1];
            const encodedRange = encodeURIComponent(`${selectedWorksheet}!A1`);
            const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheet}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;
            const sheetRes = await fetch(sheetUrl, { method: "POST", headers: { "Authorization": `Bearer ${googleToken}`, "Content-Type": "application/json" }, body: JSON.stringify({ range: `${selectedWorksheet}!A1`, majorDimension: "ROWS", values: [last] }) });
            if (!sheetRes.ok) addLog(`❌ บันทึก Google Sheets ไม่สำเร็จ: ${await sheetRes.text()}`);
            else addLog(`✅ บันทึกลง Google Sheets แล้ว`);
          }
        } catch (fe: any) { addLog(`❌ ข้ามไฟล์ ${file.name}: ${fe.message || fe}`); }
        await new Promise(r => setTimeout(r, 2500));
      }

      setShopeeRows(rows);
      if (outputMode === 'csv' && rows.length > 1) {
        downloadShopeeCsv(rows);
        addLog(`📥 ดาวน์โหลด CSV สำเร็จ (${rows.length - 1} แถว)`);
      }
      addLog('🎉 จบการทำงานโหมด Shopee! (กดปุ่ม 📥 ดาวน์โหลด .csv ซ้ำได้ตลอด)');
    } catch (err: any) {
      addLog(`🆘 ข้อผิดพลาด: ${err.message || err}`);
    } finally {
      setIsRunning(false);
    }
  };

  const runWorkflow = async (shouldResume = false) => {
    if (automatorMode === 'shopee_caption') { void runShopeeCaptionWorkflow(); return; }
    setIsRunning(true);
    setLogs([]);
    cancelRef.current = false;
    
    const refreshedToken = await refreshDropboxTokenIfNeeded();

    const rawDbKey = refreshedToken || localStorage.getItem('dropbox_key') || dropboxKey;
    const currentDropboxKey = rawDbKey ? rawDbKey.trim() : "";
    
    if (!currentDropboxKey) {
      setIsRunning(false);
      return alert("กรุณาใส่ Dropbox Access Token ใน ⚙️ ตั้งค่า API (มุมขวาบน) ก่อนครับ");
    }
    
    if (outputMode === 'sheets') {
      if (!googleToken) return alert("กรุณากด Login with Google และเลือกชีทให้เรียบร้อยก่อน");
      if (!selectedSpreadsheet || !selectedWorksheet) return alert("กรุณาเลือก Google Sheet และแท็บเป้าหมายก่อน");
    }
    
    const openRouterKey = getOpenRouterKey();
    if (automatorMode !== 'only_convert' && automatorMode !== 'filename_convert' && !openRouterKey) {
      setIsRunning(false);
      return alert("กรุณาใส่ OpenRouter API Key ใน ⚙️ ตั้งค่า API (มุมขวาบน) ก่อนครับ");
    }

    addLog(`🚀 เริ่มต้น Workflow Automator โหมดโคลนนิ่ง... (Mode: ${automatorMode}, Output: ${outputMode === 'csv' ? 'ไฟล์ CSV' : 'Google Sheets'})`);

    let completedRecords: Array<{ id: string; name: string; row: any[] }> = [];
    
    if (shouldResume) {
      try {
        const cached = localStorage.getItem('flow_automator_cache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed.folderPath.trim() === folderPath.trim()) {
            completedRecords = parsed.completed || [];
            addLog(`🔄 ดึงงานเดิมจากหน่วยความจำชั่วคราวสำเร็จ! ทำเสร็จไปแล้ว ${completedRecords.length} ไฟล์`);
          }
        }
      } catch (e) {
        console.error("Error loading cache:", e);
      }
    } else {
      localStorage.removeItem('flow_automator_cache');
      setCacheData(null);
    }

    const recordsForCsv: any[] = completedRecords.map(item => item.row);

    try {
      addLog(`📂 กำลังดึงรายชื่อไฟล์จาก Dropbox: ${folderPath}`);
      const dbxRes = await fetch("https://api.dropboxapi.com/2/files/list_folder", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${currentDropboxKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          path: folderPath.trim(),
          recursive: false,
          include_media_info: false,
          include_deleted: false,
          include_has_explicit_shared_members: false
        })
      });

      if (!dbxRes.ok) {
        throw new Error(`Dropbox List Error: ${await dbxRes.text()}`);
      }

      const listData = await dbxRes.json();
      const files = listData.entries.filter((e: any) => e['.tag'] === 'file');
      
      const completedIds = new Set(completedRecords.map(item => item.id));
      const filesToProcess = files.filter((f: any) => !completedIds.has(f.id));
      
      addLog(`✅ พบไฟล์ทั้งหมด ${files.length} รายการ (ต้องจัดการรอบนี้: ${filesToProcess.length} รายการ)`);

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const originalIndex = files.findIndex((f: any) => f.id === file.id);
        const displayIndex = originalIndex !== -1 ? originalIndex + 1 : i + 1;
        
        addLog(`⏳ [${displayIndex}/${files.length}] กำลังจัดการไฟล์: ${file.name}`);

        if (cancelRef.current) {
          addLog(`🛑 ผู้ใช้สั่งหยุดการทำงานกลางคัน! จะทำการรวมไฟล์เท่าที่เสร็จแล้ว...`);
          break;
        }

        try {
          const getDl1Link = (urlStr: string): string => {
            if (!urlStr) return "ไม่พบลิงก์";
            try {
              const url = new URL(urlStr);
              url.searchParams.delete('raw');
              url.searchParams.set('dl', '1');
              return url.toString();
            } catch (e) {
              let cleanUrl = urlStr.replace(/[?&]dl=[01]/g, '').replace(/[?&]raw=1/g, '');
              if (cleanUrl.endsWith('?') || cleanUrl.endsWith('&')) {
                cleanUrl = cleanUrl.slice(0, -1);
              }
              return cleanUrl.includes('?') ? `${cleanUrl}&dl=1` : `${cleanUrl}?dl=1`;
            }
          };

          const getRawImageLink = (urlStr: string): string => {
            if (!urlStr) return "";
            try {
              const url = new URL(urlStr);
              url.searchParams.delete('dl');
              url.searchParams.set('raw', '1');
              return url.toString();
            } catch (e) {
              return urlStr.replace("?dl=0", "?raw=1").replace("&dl=0", "&raw=1");
            }
          };

          let fileUrl = "";
          try {
             const linkRes = await fetch("https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings", {
               method: "POST",
               headers: {
                 "Authorization": `Bearer ${currentDropboxKey}`,
                 "Content-Type": "application/json"
                 },
               body: JSON.stringify({ path: file.path_lower })
             });
             
             const shareData = await linkRes.json();
             if (shareData.url) {
               fileUrl = shareData.url;
             } else if (shareData.error && shareData.error.shared_link_already_exists) {
                fileUrl = shareData.error.shared_link_already_exists.metadata.url;
             } else if (!linkRes.ok) {
                throw new Error(shareData.error_summary || `Status ${linkRes.status}`);
             }
          } catch(e: any) {
             addLog(`⚠️ หาลิงก์ Shared Link ไม่สำเร็จ (${e.message || e}) จะข้ามการส่งรูปให้ AI แต่ยังบันทึกข้อมูล`);
          }

          let aiCaption = "";
          const isVideo = /\.(mp4|mov|avi|mkv|webm|m4v|flv)$/i.test(file.name);

          if (automatorMode === 'only_convert') {
            addLog(`🔗 โหมดแปลงลิงก์อย่างเดียว: แปลงลิงก์เรียบร้อย โดยไม่เรียกใช้ AI`);
            aiCaption = "-";
          } else if (automatorMode === 'filename_convert') {
            addLog(`🏷️ โหมดแปลงลิงก์ + ใช้ชื่อคลิป: ใช้ชื่อคลิป "${file.name}" เป็นแคปชั่นโดยตรง โดยไม่เรียกใช้ AI`);
            aiCaption = file.name;
          } else if (automatorMode === 'filename_caption' || isVideo) {
            if (isVideo) {
              addLog(`🎬 ตรวจพบว่าไฟล์เป็นคลิปวิดีโอ กำลังขอให้ AI คิดแคปชั่นคำคม...`);
            } else {
              addLog(`📝 กำลังขอให้ AI เขียนแคปชั่นอิงตามชื่อไฟล์: ${file.name}...`);
            }
            const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
              method: "POST",
              headers: {
                "HTTP-Referer": window.location.href,
                "X-Title": "BulkVideoCreator",
                "Authorization": `Bearer ${openRouterKey.trim()}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  {
                    role: "user",
                    content: isVideo 
                      ? `คุณคือผู้เชี่ยวชาญด้านการเขียนคำคมและแคปชั่นโซเชียลมีเดียชาวไทย
  โปรดแต่งแคปชั่นคำคมที่สร้างแรงบันดาลใจ ซึ้ง กินใจ หรือคมคาย ที่เข้ากับเนื้อหาหรือชื่อของคลิปวิดีโอนี้
  ชื่อไฟล์คลิป: "${file.name}"

  กติกา:
  1. ตอบกลับเฉพาะเนื้อหาแคปชั่นคำคมเท่านั้น ไม่ต้องมีเครื่องหมายคำพูดคร่อม (ยกเว้นต้องการเน้นคำคมข้างใน) และไม่ต้องมีข้อความอธิบายอื่นใดเพิ่มเติม
  2. เขียนภาษาไทยที่เป็นธรรมชาติ น่าแชร์ ดึงอารมณ์ร่วมได้ดี
  3. สามารถใส่ข้อความแนะนำเบื้องหลังหรือบริบทเพิ่มเติมจาก System Prompt นี้ได้:
  ${systemPrompt}`
                      : `คุณคือผู้เชี่ยวชาญด้านการเขียนแคปชั่นขายสินค้าชาวไทย
  โปรดเขียนโพสต์หรือแคปชั่นสำหรับสินค้าโดยยึดข้อมูลจากชื่อไฟล์สินค้านี้: "${file.name}" และปฏิบัติตามกฎเหล็กและสไตล์ที่ระบุใน System Prompt อย่างเคร่งครัด

  System Prompt:
  ${systemPrompt}

  กติกา:
  ตอบกลับเฉพาะเนื้อหาโพสต์/แคปชั่นที่แต่งเสร็จสมบูรณ์แล้วเท่านั้น ไม่ต้องมีคำเกริ่นนำหรือคำอธิบายใดๆ เพิ่มเติม`
                  }
                ]
              })
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              aiCaption = aiData.choices?.[0]?.message?.content || "";
            } else {
              throw new Error(`OpenRouter API error (Status ${aiRes.status}): ${await aiRes.text()}`);
            }
          } else if (automatorMode === 'vision_caption') {
            if (fileUrl) {
               const rawImageUrl = getRawImageLink(fileUrl);
               addLog(`🤖 กำลังส่งรูปลงตู้ AI ให้คิดแคปชั่น (Vision Mode)...`);
               const aiRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                 method: "POST",
                 headers: {
                   "HTTP-Referer": window.location.href,
                   "X-Title": "BulkVideoCreator",
                   "Authorization": `Bearer ${openRouterKey.trim()}`,
                   "Content-Type": "application/json"
                 },
                 body: JSON.stringify({
                   model: "google/gemini-2.5-flash",
                   messages: [
                     {
                       role: "user",
                       content: [
                         { type: "text", text: `${systemPrompt}\n\nโดยอิงข้อมูลจากชื่อรูปด้วย ก็คือชื่อนี้: ${file.name}` },
                         { type: "image_url", image_url: { url: rawImageUrl } }
                       ]
                     }
                   ]
                 })
               });

               if (aiRes.ok) {
                 const aiData = await aiRes.json();
                 aiCaption = aiData.choices?.[0]?.message?.content || "";
               } else {
                 throw new Error(`OpenRouter Vision API error (Status ${aiRes.status}): ${await aiRes.text()}`);
               }
            } else {
               aiCaption = "ไม่ได้เปิดเขียนแคปชั่นด้วย AI (เพราะหารูปไม่เจอ)";
            }
          }

          const updateDate = "มาใหม่ๆ " + new Date().toLocaleDateString('th-TH');
          const linkDl = getDl1Link(fileUrl);
          
          const safeCaption = aiCaption.trim().replace(/\r?\n/g, ' '); 
          const newRecord = [file.id, `"${safeCaption.replace(/"/g, '""')}"`, updateDate, "N", linkDl, "="];
          recordsForCsv.push(newRecord);

          // Real-time Save to Cache
          completedRecords.push({
            id: file.id,
            name: file.name,
            row: newRecord
          });
          const cacheObj = {
            folderPath: folderPath.trim(),
            completed: completedRecords
          };
          try {
            localStorage.setItem('flow_automator_cache', JSON.stringify(cacheObj));
          } catch (storageErr) {
            console.warn("Storage quota exceeded for flow_automator_cache:", storageErr);
            if (completedRecords.length === 1 || completedRecords.length % 20 === 0) {
              addLog("⚠️ แจ้งเตือน: พื้นที่เก็บข้อมูลเบราว์เซอร์เต็ม (Storage Quota Exceeded) ไม่สามารถบันทึกประวัติการฟื้นฟูงานลงเครื่องได้ชั่วคราว แต่ระบบจะยังคงประมวลผลต่อจนเสร็จและดาวน์โหลด CSV ได้ปกติครับ (แนะนำเคลียร์ประวัติ/แคชเบราว์เซอร์ของ localhost)");
            }
          }
          setCacheData(cacheObj);

          if (outputMode === 'sheets') {
             addLog(`📝 กำลังบันทึกอัดลง Google Sheets...`);
             const encodedRange = encodeURIComponent(`${selectedWorksheet}!A1`);
             const sheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${selectedSpreadsheet}/values/${encodedRange}:append?valueInputOption=USER_ENTERED`;
             
             const sheetRes = await fetch(sheetUrl, {
               method: "POST",
               headers: {
                 "Authorization": `Bearer ${googleToken}`,
                 "Content-Type": "application/json"
               },
               body: JSON.stringify({
                 range: `${selectedWorksheet}!A1`,
                 majorDimension: "ROWS",
                 values: [
                    [file.id, aiCaption.trim(), updateDate, "N", linkDl, "="]
                 ]
               })
             });

             if (!sheetRes.ok) {
                 addLog(`❌ บันทึก Google Sheets ไม่สำเร็จ: ${await sheetRes.text()}`);
             } else {
                 addLog(`✅ บันทึกแถว ${file.name} ลง Google Sheets สำเร็จ!`);
             }
          } else {
             addLog(`📝 บันทึกข้อมูล ${file.name} ลงหน่วยความจำชั่วคราวแล้ว`);
          }
        } catch (fileErr: any) {
          addLog(`❌ ข้ามไฟล์เนื่องจากมีข้อผิดพลาดรันไฟล์ ${file.name}: ${fileErr.message || fileErr}`);
        }

        addLog(`⏳ หน่วงเวลา 3 วินาทีเพื่อป้องกัน Rate Limit...`);
        await new Promise(r => setTimeout(r, 3000));
      }

      if (recordsForCsv.length > 0) {
         addLog(`📦 กำลังสร้างไฟล์ CSV...`);
         
         let csvContent = ""; 
         
         recordsForCsv.forEach(row => {
            csvContent += row.join(",") + "\r\n";
         });
         
         const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' }); 
         const url = URL.createObjectURL(blob);
         
         const a = document.createElement('a');
         a.href = url;
         a.download = `automator_export_${new Date().getTime()}.csv`;
         document.body.appendChild(a);
         a.click();
         document.body.removeChild(a);
         
         addLog(`📥 ดาวน์โหลดไฟล์ CSV สำเร็จแล้ว!`);
      }

      addLog(`🎉 จบการทำงาน Pipeline อย่างสมบูรณ์!`);

      // Clear cache upon successful run of ALL remaining files (unless cancelled)
      if (!cancelRef.current) {
        localStorage.removeItem('flow_automator_cache');
        setCacheData(null);
      }

    } catch (err: any) {
      addLog(`🆘 ข้อผิดพลาดร้ายแรง: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 relative pb-32 animate-fade-in text-slate-200">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 font-display uppercase tracking-tight">
             Workflow Automator
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-1">เชื่อมต่อ Dropbox → AI Prompt → Google Sheets / CSV อัตโนมัติ (ทดแทน n8n)</p>
        </div>
        <button 
          onClick={() => setShowConfig(!showConfig)}
          className="px-4 py-2 border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-slate-200 rounded-xl font-bold text-xs flex items-center transition-all cursor-pointer"
        >
          ⚙️ การตั้งค่า API & โหมดส่งออกข้อมูล
        </button>
      </div>

      {/* V2 Connectivity Status Bar */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between shadow-md">
        <div className="flex flex-wrap gap-4 items-center">
          <span className="text-xs font-mono font-bold text-slate-400">🔌 สถานะ API:</span>
          
          {/* Dropbox Status */}
          <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 border border-slate-850 rounded-xl">
            <span className="text-[11px] font-bold text-slate-300">📦 Dropbox:</span>
            {dropboxStatus === 'checking' ? (
              <span className="text-[10px] text-cyan-400 flex items-center gap-1"><span className="animate-spin text-xs">🌀</span> กำลังเช็ค...</span>
            ) : dropboxStatus === 'connected' ? (
              <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">🟢 เชื่อมต่อแล้ว</span>
            ) : (
              <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">🔴 ยังไม่เชื่อมต่อ</span>
            )}
          </div>

          {/* OpenRouter Status */}
          {automatorMode !== 'only_convert' && automatorMode !== 'filename_convert' && (
            <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 border border-slate-850 rounded-xl">
              <span className="text-[11px] font-bold text-slate-300">🤖 OpenRouter:</span>
              {openRouterStatus === 'checking' ? (
                <span className="text-[10px] text-cyan-400 flex items-center gap-1"><span className="animate-spin text-xs">🌀</span> กำลังเช็ค...</span>
              ) : openRouterStatus === 'connected' ? (
                <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">🟢 เชื่อมต่อแล้ว</span>
              ) : (
                <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">🔴 ยังไม่เชื่อมต่อ</span>
              )}
            </div>
          )}
        </div>
        <button 
          onClick={runApiChecks}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg cursor-pointer transition-all flex items-center gap-1"
        >
          🔄 ตรวจจับการเชื่อมต่ออีกครั้ง
        </button>
      </div>

      {cacheData && cacheData.folderPath.trim() === folderPath.trim() && cacheData.completed.length > 0 && (
        <div className="bg-slate-900/60 border border-amber-500/20 rounded-2xl p-4 mb-6 animate-fade-in flex flex-col md:flex-row gap-4 items-center justify-between text-left shadow-lg">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 font-sans">
              <span>⚠️ ตรวจพบงานเก่าค้างอยู่ในระบบ!</span>
            </h4>
            <p className="text-[11px] text-slate-400 font-sans">
              โฟลเดอร์ <code className="text-cyan-400 font-mono font-bold">{cacheData.folderPath}</code> มีความคืบหน้าที่ทำเสร็จสมบูรณ์ไปแล้ว <span className="text-white font-bold">{cacheData.completed.length}</span> ไฟล์ บอสสามารถดึงงานมารันต่อหรือดาวน์โหลดข้อมูลเฉพาะที่ทำเสร็จแล้วได้ครับ
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => runWorkflow(true)}
              disabled={isRunning}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-[11px] font-bold transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-1 font-sans"
            >
              🔄 รันต่อจากเดิม
            </button>
            {outputMode === 'csv' && (
              <button
                onClick={downloadCacheCsv}
                className="px-3.5 py-2 bg-emerald-900/60 hover:bg-emerald-800 border border-emerald-500/20 text-emerald-300 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer font-sans"
              >
                📥 โหลด CSV เท่าที่ได้
              </button>
            )}
            <button
              onClick={clearCache}
              disabled={isRunning}
              className="px-3.5 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-300 rounded-xl text-[11px] font-bold transition-all active:scale-95 cursor-pointer font-sans"
            >
              🗑️ ล้างแคชเริ่มใหม่
            </button>
          </div>
        </div>
      )}

      {showConfig && (
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 mb-8 shadow-xl animate-fade-in text-left">
          <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
            <h3 className="text-sm font-bold text-cyan-400 font-mono">วิธีส่งออกผลลัพธ์ข้อมูล (Output Mode)</h3>
            <div className="flex bg-slate-900/60 border border-slate-850 rounded-lg p-1">
              <button 
                onClick={() => setOutputMode('csv')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${outputMode === 'csv' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                📥 ออฟไลน์ (.CSV)
              </button>
              <button 
                onClick={() => setOutputMode('sheets')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${outputMode === 'sheets' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                ☁️ ออนไลน์ (Sheets)
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">🔑 Dropbox Access Token (ต้องใส่เสมอ)</label>
              <input 
                type="password"
                value={dropboxKey} 
                onChange={(e) => setDropboxKey(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/40 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-white"
                placeholder="sl.Bxxxxxxx..."
              />
            </div>
            
            {outputMode === 'sheets' && (
              <>
                <hr className="border-slate-900" />
                <div className="animate-fade-in space-y-4">
                   <label className="block text-xs font-bold text-slate-400">
                     🌐 Google Cloud Client ID (บันทึกไว้ใช้ร่วมกัน)
                   </label>
               
                   <div className="flex gap-2">
                     <select 
                       value={selectedClientId}
                       onChange={(e) => setSelectedClientId(e.target.value)}
                       className="flex-1 px-4 py-2 bg-slate-900/40 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-white cursor-pointer"
                     >
                       <option value="" disabled>-- เลือก Client ID ที่บันทึกไว้ --</option>
                       {clientIds.map(id => (
                          <option key={id} value={id}>{id.substring(0, 30)}...</option>
                       ))}
                     </select>
                     {selectedClientId && (
                       <button 
                         onClick={() => handleDeleteClientId(selectedClientId)}
                         className="px-3 py-2 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/20 text-rose-300 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                       >
                         ลบ
                       </button>
                     )}
                   </div>

                   <div className="flex gap-2">
                     <input 
                       type="text"
                       value={newClientId} 
                       onChange={(e) => setNewClientId(e.target.value)}
                       className="flex-1 px-4 py-2 bg-slate-900/40 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-white"
                       placeholder="เพิ่ม Client ID ใหม่ที่นี่ เช่น 2198....apps.googleusercontent.com"
                     />
                     <button 
                        onClick={handleAddClientId}
                        className="px-3 py-2 bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/20 text-indigo-300 rounded-lg text-xs font-bold transition-colors whitespace-nowrap cursor-pointer"
                     >
                        บันทึก +
                     </button>
                   </div>
               
                   <div className="mt-4 p-4 border border-slate-900 bg-slate-950/40 rounded-xl space-y-4">
                     <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                       <div className="text-xs">
                         {googleToken ? (
                           <span className="font-bold text-emerald-400">✅ ระบบเชื่อมต่อ Google Sheet พร้อมใช้งานแล้ว!</span>
                         ) : (
                           <span className="text-slate-400">กรุณาล็อคอินด้วย Google Account เพื่อดึงรายชื่อ Sheets ของคุณ</span>
                         )}
                       </div>
                       <button 
                         onClick={loginGoogle}
                         className="flex items-center justify-center gap-2 px-5 py-2 bg-white text-slate-900 rounded-full font-bold shadow-sm hover:bg-slate-100 transition-all active:scale-95 text-xs cursor-pointer"
                       >
                         <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-4 h-4" />
                         {googleToken ? "ต่ออายุ Login ใหม่" : "Sign in with Google"}
                       </button>
                     </div>

                     {googleToken && (
                       <div className="mt-6 space-y-4 animate-fade-in border-t border-slate-900 pt-4">
                         <div>
                           <label className="block text-xs font-bold text-cyan-400 mb-1.5">
                             📊 เลือกไฟล์ Google Sheet เป้าหมาย
                           </label>
                           {spreadsheets.length === 0 ? (
                             <div className="text-xs text-slate-500 italic px-2">กำลังโหลดรายชื่อชีทจาก Google Drive...</div>
                           ) : (
                             <select 
                               value={selectedSpreadsheet}
                               onChange={(e) => setSelectedSpreadsheet(e.target.value)}
                               className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-white font-medium cursor-pointer"
                             >
                               <option value="" disabled>-- เลือกไฟล์ Excel งานของคุณ --</option>
                               {spreadsheets.map(s => (
                                 <option key={s.id} value={s.id}>📄 {s.name}</option>
                               ))}
                             </select>
                           )}
                         </div>

                         {selectedSpreadsheet && worksheets.length > 0 && (
                           <div>
                             <label className="block text-xs font-bold text-cyan-400 mb-1.5">
                               📑 เลือกแผ่นงาน (Worksheet Tab)
                             </label>
                             <select 
                               value={selectedWorksheet}
                               onChange={(e) => setSelectedWorksheet(e.target.value)}
                               className="w-full px-4 py-2 bg-slate-950 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-white font-medium cursor-pointer"
                             >
                               <option value="" disabled>-- เลือกแท็บที่จะลงข้อมูล --</option>
                               {worksheets.map(w => (
                                 <option key={w.title} value={w.title}>📌 {w.title}</option>
                               ))}
                             </select>
                           </div>
                         )}
                       </div>
                     )}
                   </div>
                 </div>
              </>
            )}

            {outputMode === 'csv' && (
              <>
                <hr className="border-slate-900" />
                <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-4 animate-fade-in text-left">
                  <h4 className="font-bold text-emerald-400 mb-1 text-xs">✅ โหมดส่งออก Offline ใช้งานได้ทันที</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                     บอสสามารถ "รัน Pipeline ทันที" ได้เลย โดยไม่ต้องล็อคอิน Google Cloud รันเสร็จ 100 รูปปุ๊บ ระบบจะเด้งให้เซฟไฟล์ Excel (CSV) ซึ่งบอสสามารถลากไปคลุมดำแล้ววางใน Google Sheets อันไหนก็ได้ตามใจชอบครับ
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left pane: configuration */}
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl shadow-xl flex flex-col overflow-hidden text-left">
           <div className="p-4 border-b border-slate-900 bg-slate-950/60">
             <h3 className="font-bold text-xs text-white flex items-center gap-2 uppercase font-mono">
               🎯 เป้าหมายการผลิต (Target)
             </h3>
           </div>
           
           <div className="p-5 flex-1 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">📁 โฟลเดอร์ Dropbox (เช่น /หยก/set3)</label>
                <input 
                  type="text"
                  value={folderPath} 
                  onChange={(e) => setFolderPath(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-900/40 border border-slate-850 rounded-lg focus:outline-none focus:border-cyan-500 font-mono text-xs text-cyan-400 shadow-inner"
                />
              </div>

              {/* V2 Mode Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1.5">⚡ โหมดการทำงานของบอท Flow</label>
                <div className="grid grid-cols-1 gap-2 bg-slate-900/40 p-2 border border-slate-850 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setAutomatorMode('vision_caption')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-left flex flex-col ${automatorMode === 'vision_caption' ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-sm border border-cyan-400/20' : 'text-slate-400 hover:text-slate-300 bg-slate-950/40 border border-transparent'}`}
                  >
                    <span>📸 โหมด 1: AI ดูรูปภาพ Dropbox</span>
                    <span className="text-[9px] font-normal opacity-75 mt-0.5">ส่งรูปลงวิเคราะห์ด้วย Vision API + เขียนแคปชั่นโพสต์ + แปลงลิงก์ด่วน dl=1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutomatorMode('filename_caption')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-left flex flex-col ${automatorMode === 'filename_caption' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm border border-purple-400/20' : 'text-slate-400 hover:text-slate-300 bg-slate-950/40 border border-transparent'}`}
                  >
                    <span>✍️ โหมด 2: AI เขียนแคปชั่นอิงตามชื่อไฟล์</span>
                    <span className="text-[9px] font-normal opacity-75 mt-0.5">วิเคราะห์จากชื่อไฟล์เท่านั้นโดยไม่โหลดรูป + เขียนแคปชั่นโพสต์ + แปลงลิงก์ dl=1</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutomatorMode('only_convert')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-left flex flex-col ${automatorMode === 'only_convert' ? 'bg-gradient-to-r from-slate-700 to-slate-800 text-white shadow-sm border border-slate-500/20' : 'text-slate-400 hover:text-slate-300 bg-slate-950/40 border border-transparent'}`}
                  >
                    <span>🔗 โหมด 3: แปลงลิงก์ด่วน dl=1 อย่างเดียว</span>
                    <span className="text-[9px] font-normal opacity-75 mt-0.5">แปลงลิงก์ Dropbox ให้เป็นโหมดดาวน์โหลดตรง (dl=1) โดยไม่เรียกใช้ระบบ AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutomatorMode('filename_convert')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-left flex flex-col ${automatorMode === 'filename_convert' ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm border border-emerald-400/20' : 'text-slate-400 hover:text-slate-300 bg-slate-950/40 border border-transparent'}`}
                  >
                    <span>🏷️ โหมด 4: แปลงลิงก์ + ใช้ชื่อคลิปที่อัพ</span>
                    <span className="text-[9px] font-normal opacity-75 mt-0.5">แปลงลิงก์ด่วน dl=1 + เขียนชื่อคลิปตามชื่อไฟล์ที่อัพไปเลย (ผลลัพธ์: ชื่อคลิป | ลิงก์ที่แปลงแล้ว) โดยไม่เรียกใช้ระบบ AI</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAutomatorMode('shopee_caption')}
                    className={`px-3 py-2 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-left flex flex-col ${automatorMode === 'shopee_caption' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm border border-amber-400/20' : 'text-slate-400 hover:text-slate-300 bg-slate-950/40 border border-transparent'}`}
                  >
                    <span>🛒 โหมด 5: Shopee จับคู่สินค้า + เขียนแคปชั่นขาย</span>
                    <span className="text-[9px] font-normal opacity-75 mt-0.5">แปลงลิงก์ dl=1 + จับคู่ชื่อไฟล์กับ CSV/Google Sheet สินค้า + AI เขียนแคปชั่นขาย 2 แบบ (ผลลัพธ์: ชื่อสินค้า | Link shopee | Link dropbox | แคปชั่น1 | แคปชั่น2)</span>
                  </button>
                </div>
              </div>

              {/* โหมด Shopee: แหล่งฐานข้อมูลสินค้า */}
              {automatorMode === 'shopee_caption' && (
                <div className="mt-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="text-[11px] font-extrabold text-amber-400">🛒 ฐานข้อมูลสินค้า (จับคู่ชื่อไฟล์ → เขียนแคปชั่นขาย)</div>
                  <div className="text-[10px] text-slate-400">
                    {shopeeDb.length > 0
                      ? <>โหลดแล้ว <b className="text-slate-200">{shopeeDb.length}</b> รายการ · {shopeeDbSource}</>
                      : 'ยังไม่มีข้อมูล — ใส่ลิงก์ Google Sheet หรืออัพโหลด CSV (คอลัมน์: ชื่อในโฟลเดอร์, Link, รายละเอียดสินค้า)'}
                  </div>
                  <input
                    type="text"
                    value={shopeeDbSheetUrl}
                    onChange={(e) => setShopeeDbSheetUrl(e.target.value)}
                    placeholder="วางลิงก์ Google Sheet (แชร์แบบทุกคนที่มีลิงก์ดูได้)..."
                    className="w-full px-3 py-2 bg-slate-900/40 border border-slate-850 rounded-lg text-[11px] text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void loadShopeeDbFromSheet()}
                      disabled={shopeeDbLoading}
                      className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold disabled:opacity-50 transition-all"
                    >
                      {shopeeDbLoading ? '⏳ กำลังดึง...' : '🔗 ดึงจาก Sheet'}
                    </button>
                    <input ref={shopeeCsvRef} type="file" accept=".csv,text/csv" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0] || null; e.currentTarget.value = ''; void handleShopeeCsvUpload(f); }} />
                    <button
                      type="button"
                      onClick={() => shopeeCsvRef.current?.click()}
                      className="px-3 py-2 rounded-lg border border-slate-700 text-slate-300 text-[11px] font-bold hover:border-amber-500 transition-all"
                    >
                      ⬆️ CSV
                    </button>
                  </div>
                  {shopeeRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => downloadShopeeCsv()}
                      className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold transition-all"
                    >
                      📥 ดาวน์โหลด .csv ({shopeeRows.length - 1} แถว)
                    </button>
                  )}
                  <div className="text-[9px] text-slate-500 leading-normal">จับคู่ด้วยเลขหน้าไฟล์: <span className="text-amber-400">001_RiceWarmerGlove_script1_..._output.mp4</span> → <span className="text-amber-400">001_RiceWarmerGlove</span> · ผลลัพธ์: ชื่อสินค้า | Link shopee | Link dropbox | แคปชั่น1 | แคปชั่น2</div>
                </div>
              )}

              {/* V2 AI Brain Custom Writing Style (Tabs Layout) */}
              <div className="flex-1 flex flex-col min-h-[350px] mt-2">
                <div className="flex justify-between items-end mb-1 flex-wrap gap-2">
                  <label className="block text-xs font-bold text-slate-400">🧠 ระบบคลังสมองและจูนสำนวนการเขียน</label>
                </div>

                <div className="flex border-b border-slate-900 bg-slate-950/40 rounded-t-xl overflow-hidden mt-1.5">
                  <button
                    type="button"
                    onClick={() => setActivePromptTab('editor')}
                    className={`flex-1 py-2 text-center text-xs font-bold transition-all cursor-pointer ${activePromptTab === 'editor' ? 'bg-slate-900 text-cyan-400 border-b-2 border-cyan-500 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                  >
                    🧠 แก้ไขสมอง
                  </button>
                  {automatorMode !== 'only_convert' && automatorMode !== 'filename_convert' && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActivePromptTab('analyzer')}
                        className={`flex-1 py-2 text-center text-xs font-bold transition-all cursor-pointer ${activePromptTab === 'analyzer' ? 'bg-slate-900 text-purple-400 border-b-2 border-purple-500 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                      >
                        📁 สกัดสำนวน .TXT
                      </button>
                      <button
                        type="button"
                        onClick={() => setActivePromptTab('tuner')}
                        className={`flex-1 py-2 text-center text-xs font-bold transition-all cursor-pointer ${activePromptTab === 'tuner' ? 'bg-slate-900 text-indigo-400 border-b-2 border-indigo-500 font-black' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'}`}
                      >
                        🧪 จูน & ทดลองสร้าง
                      </button>
                    </>
                  )}
                </div>

                {/* Tab: Editor */}
                {activePromptTab === 'editor' && (
                  <div className="flex-1 flex flex-col bg-slate-900/10 border border-slate-900 border-t-0 p-4 rounded-b-xl gap-3">
                    {automatorMode === 'only_convert' || automatorMode === 'filename_convert' ? (
                      <div className="flex-1 flex items-center justify-center text-slate-500 italic text-[11px] text-center p-6 bg-slate-950/40 border border-dashed border-slate-900 rounded-lg font-sans">
                        {automatorMode === 'filename_convert'
                          ? '⚠️ โหมดแปลงลิงก์ + ใช้ชื่อคลิป จะนำชื่อคลิปที่อัพไปมาใส่เป็นแคปชั่นโดยตรง จึงไม่ส่งข้อมูลเข้าระบบ AI และไม่จำเป็นต้องเขียน AI System Prompt (สมองของ AI)'
                          : '⚠️ โหมดด่วน (แปลงลิงก์อย่างเดียว) จะไม่ส่งข้อมูลเข้าระบบ AI จึงไม่จำเป็นต้องเขียน AI System Prompt (สมองของ AI)'}
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between gap-2 flex-wrap bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                          <div className="flex items-center gap-2">
                            <select 
                              value={selectedBrainId}
                              onChange={(e) => {
                                 setSelectedBrainId(e.target.value);
                                 const match = savedBrains.find(b => b.id === e.target.value);
                                 if (match) setSystemPrompt(match.content);
                              }}
                              className="px-2 py-1 text-[11px] border border-slate-800 rounded-lg bg-slate-900 text-slate-300 focus:outline-none focus:border-cyan-500 max-w-[160px] cursor-pointer"
                            >
                              <option value="">-- สมองที่บันทึกไว้ --</option>
                              {savedBrains.map(b => (
                                 <option key={b.id} value={b.id}>🧠 {b.name.substring(0, 15)}...</option>
                              ))}
                            </select>
                            {selectedBrainId && (
                              <button 
                                type="button"
                                onClick={() => {
                                  if(confirm('🗑️ ยืนยันการลบสมองชุดนี้ใช่ไหม?')) {
                                    const updated = savedBrains.filter(x => x.id !== selectedBrainId);
                                    localStorage.setItem('system_prompts_brain', JSON.stringify(updated));
                                    setSavedBrains(updated);
                                    setSelectedBrainId('');
                                    setSystemPrompt(''); 
                                  }
                                }}
                                className="px-2 py-1 bg-rose-950/40 border border-rose-500/20 text-rose-300 rounded-lg hover:bg-rose-900/40 text-[10px] font-bold transition-all cursor-pointer"
                              >
                                ลบ
                              </button>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={handleSaveCurrentBrain}
                            className="px-2.5 py-1 bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 text-cyan-300 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            💾 เซฟเป็นสมองใหม่
                          </button>
                        </div>
                        <textarea 
                          value={systemPrompt}
                          onChange={(e) => setSystemPrompt(e.target.value)}
                          className="w-full flex-1 p-3 bg-slate-950/40 border border-slate-900 rounded-lg text-xs leading-relaxed text-slate-300 outline-none resize-none focus:border-cyan-500 custom-scrollbar h-[200px]"
                          placeholder="เขียน Prompt กำหนดทิศทางหรือบทบาทสมองของ AI ที่นี่..."
                        />
                      </>
                    )}
                  </div>
                )}

                {/* Tab: Analyzer */}
                {activePromptTab === 'analyzer' && (
                  <div className="flex-1 flex flex-col bg-slate-900/10 border border-slate-900 border-t-0 p-4 rounded-b-xl min-h-[250px] justify-center items-center text-center">
                    {isAnalyzingFile ? (
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                        <p className="text-xs text-purple-300 font-mono">กำลังส่งคำให้ AI สแกนวิเคราะห์สำนวนเขียนจากข้อความ...</p>
                      </div>
                    ) : (
                      <div className="space-y-4 p-4">
                        <div className="text-3xl text-purple-400">📁</div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200 mb-1 font-sans">สร้างสมองใหม่ด้วย AI จากการสกัดสำนวน (.TXT)</h4>
                          <p className="text-[10px] text-slate-400 max-w-sm leading-relaxed font-sans">
                            แนบไฟล์ข้อความ `.txt` ที่รวบรวมตัวอย่างโพสต์หรือแคปชั่นที่คุณอยากลอกเลียนแบบ AI จะถอดรหัสและแปลงเงื่อนไขให้กลายเป็น AI Prompt อัตโนมัติ!
                          </p>
                        </div>
                        <label className="inline-block px-4 py-2 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/30 text-purple-300 rounded-lg text-xs font-bold cursor-pointer transition-all font-sans">
                          📎 เลือกไฟล์ตัวอย่างสำนวน (.txt)
                          <input
                            type="file"
                            accept=".txt"
                            onChange={handleTxtFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab: Tuner */}
                {activePromptTab === 'tuner' && (
                  <div className="flex-1 flex flex-col bg-slate-900/10 border border-slate-900 border-t-0 p-4 rounded-b-xl min-h-[250px] text-left gap-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={testKeyword}
                        onChange={(e) => setTestKeyword(e.target.value)}
                        placeholder="ระบุหัวข้อ/ชื่อสินค้า เช่น สร้อยข้อมือหยกขาว"
                        className="flex-1 px-3 py-1.5 bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleTestGenerate(testKeyword)}
                        disabled={isGeneratingTest || isRefiningPrompt}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        {isGeneratingTest ? 'กำลังเขียน...' : '🧪 ทดลองสร้าง'}
                      </button>
                    </div>

                    {testResult && (
                      <div className="space-y-3 flex-1 flex flex-col">
                        <div className="flex-1 p-3 bg-indigo-950/20 border border-indigo-500/20 rounded-lg text-xs text-indigo-200 leading-relaxed max-h-[120px] overflow-y-auto custom-scrollbar font-sans">
                          <div className="font-bold text-[10px] text-indigo-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                            <span>📝 ผลลัพธ์ทดลองสร้าง:</span>
                          </div>
                          {testResult}
                        </div>

                        <div className="space-y-2 border-t border-slate-900 pt-3">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-slate-400 font-sans">💡 แนะนำแก้ไขปรับปรุงสำนวน:</label>
                            {feedbackSuccess && <span className="text-[10px] font-bold text-emerald-400 font-sans">✅ ปรับแต่งสมองเสร็จสิ้น!</span>}
                          </div>
                          <div className="flex gap-2 font-sans">
                            <textarea
                              value={userFeedback}
                              onChange={(e) => setUserFeedback(e.target.value)}
                              placeholder="เช่น 'อยากให้สั้นกระชับลงอีก หรือบังคับมีราคาบอกชัดเจน'"
                              className="flex-1 p-2 bg-slate-950 border border-slate-900 rounded-lg focus:outline-none focus:border-cyan-500 text-xs text-slate-200 resize-none h-12 leading-normal"
                            />
                            <button
                              type="button"
                              onClick={handleRefinePrompt}
                              disabled={isRefiningPrompt || !userFeedback.trim()}
                              className="px-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-all flex items-center justify-center whitespace-nowrap"
                            >
                              {isRefiningPrompt ? 'กำลังจูน...' : '🔄 สั่งจูนเพิ่ม'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {!testResult && (
                      <div className="flex-1 flex items-center justify-center text-slate-500 italic text-[11px] text-center p-6 bg-slate-950/40 border border-dashed border-slate-900 rounded-lg font-sans">
                        ใส่ชื่อสินค้าหรือหัวข้อของคุณแล้วกด "ทดลองสร้าง" เพื่อจูนสำนวนการเขียน
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isRunning ? (
                <button 
                   onClick={() => runWorkflow(false)}
                   className="w-full py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white rounded-xl font-black text-xs shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-3 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer uppercase tracking-wider"
                >
                   🚀 ปล่อยบอทรัน Pipeline ทันที
                </button>
              ) : (
                <button 
                   onClick={() => cancelRef.current = true}
                   className="w-full py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black text-xs shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-3 animate-pulse cursor-pointer uppercase tracking-wider"
                >
                   🛑 หยุดบอทเดี๋ยวนี้!
                </button>
              )}
           </div>
        </div>

        {/* Right pane: logs */}
        <div className="bg-slate-950/90 border border-slate-900 rounded-2xl flex flex-col overflow-hidden shadow-2xl relative text-left">
           <div className="p-3 border-b border-slate-900 bg-slate-950/60 flex justify-between items-center">
             <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isRunning ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </span>
                <span className="text-[10px] font-mono font-bold text-slate-300">SYSTEM LOGS TERMINAL</span>
             </div>
             {logs.length > 0 && !isRunning && (
               <button onClick={() => setLogs([])} className="text-[9px] text-slate-500 hover:text-white transition cursor-pointer bg-transparent border-none">CLEAR</button>
             )}
           </div>

           <div className="flex-1 p-4 overflow-y-auto bg-slate-950 min-h-[450px] custom-scrollbar font-mono text-[11px] text-left">
              {logs.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-slate-600 italic">
                   รอรับคำสั่งเพื่อเริ่มรันระบบ...
                 </div>
              ) : (
                 <div className="space-y-1.5 pb-8">
                    {logs.map((log, i) => (
                      <div key={i} className={`${log.includes('🔴') || log.includes('❌') || log.includes('🆘') ? 'text-rose-400' : log.includes('✅') || log.includes('🎉') ? 'text-emerald-400' : log.includes('⚠️') ? 'text-amber-400' : 'text-slate-300'}`}>
                        {log}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="flex items-center gap-1.5 text-cyan-400 mt-4 pl-2 opacity-70">
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1 h-1 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        <span className="ml-1 text-[10px]">กำลังทำงาน...</span>
                      </div>
                    )}
                 </div>
              )}
           </div>
           
           <div className="absolute top-0 right-0 p-4 opacity-[0.02] pointer-events-none">
              <svg className="w-48 h-48 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
           </div>
        </div>
      </div>
    </div>
  );
}
