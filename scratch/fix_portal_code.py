import os

file_path = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
    content = f.read()

# Define the start of the block to replace
start_marker = "  const handlePlayHistoryAudio = (item: any) => {"
# Define the end marker
end_marker = "  // Wrapper for manual single generation button"

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

if start_idx == -1:
    print("Error: Start marker not found!")
    exit(1)

if end_idx == -1:
    print("Error: End marker not found!")
    exit(1)

print(f"Start index: {start_idx}, End index: {end_idx}")

# Restored clean code
restored_code = """  const handlePlayHistoryAudio = (item: any) => {
    if (playingHistoryId === item.id) {
      historyAudioRef.current?.pause();
      setPlayingHistoryId(null);
    } else {
      if (historyAudioRef.current) {
        historyAudioRef.current.pause();
      }
      const audio = new Audio(item.audioUrl);
      audio.play().catch(e => {
        console.error("Error playing history audio:", e);
        addLog(`❌ เล่นเสียงล้มเหลว: ${e.message}`, 'error');
      });
      audio.onended = () => setPlayingHistoryId(null);
      historyAudioRef.current = audio;
      setPlayingHistoryId(item.id);
    }
  };

  const handleGenerateScript = async (targetTopic: string, styleId: string) => {
    let apiKey = getActiveOpenRouterKey();
    if (!apiKey || apiKey === 'undefined' || apiKey === 'null' || apiKey.startsWith('MOCK_')) {
      try {
        const res = await fetch('/api/vault/credentials');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.data)) {
            const row = data.data.find((r: any) => r.service_name === 'openrouter');
            if (row && row.credential_key && row.credential_key.trim() !== '' && !row.credential_key.startsWith('MOCK_')) {
              apiKey = row.credential_key.trim();
              localStorage.setItem('openrouter_key', apiKey);
            }
          }
        }
      } catch (err) {}
    }

    if (!apiKey) {
      addLog('ไม่พบสไตล์การเขียนบทในระบบ กรุณาสร้างหรือเลือกสไตล์ใหม่', 'error');
      alert('ล้มเหลว: ไม่พบสไตล์การเขียนบทในระบบ กรุณาเลือกสไตล์ใหม่อีกครั้งครับบอส');
      return null;
    }

    const selectedStyle = copyStyles.find(s => s.id === styleId);
    if (!selectedStyle) {
      if (copyStyles.length > 0) {
        const fallbackStyle = copyStyles[0];
        addLog(`ไม่พบสไตล์รหัส "${styleId}" จึงสลับไปใช้สไตล์แรกคือ "${fallbackStyle.name}" เพื่อดำเนินต่อ`, 'info');
      } else {
        addLog('ไม่พบสไตล์การเขียนบทในระบบ กรุณาสร้างหรือเลือกสไตล์ใหม่', 'error');
        alert('ล้มเหลว: ไม่พบสไตล์การเขียนบทในระบบ กรุณาเลือกสไตล์ใหม่อีกครั้งครับบอส');
        return null;
      }
    }

    const styleObj = selectedStyle || copyStyles[0];

    addLog(`กำลังเขียนสคริปต์ความต้องการหัวข้อ: "${targetTopic}"...`, 'info');

    // Brain personality inject
    const brain = savedBrains.find(b => b.id === selectedBrainId);
    let brainContext = '';
    if (brain) {
      brainContext = `\\n\\n[อัตลักษณ์เพจและสไตล์ของสมองเป้าหมาย (Persona & Writing Style of Selected Brain)]:
${brain.content}

**ข้อความการประมวลผลความยาว:** โปรดปรับสไตล์การเรียบเรียงและใช้น้ำเสียง การใช้เครื่องหมายคำ และสไตล์วรรณศิลป์เฉพาะตัวตามที่ระบบวิเคราะห์ให้เหมาะสมตาม Persona ดังกล่าวข้างต้นเพื่อเลียนแบบสมองดังกล่าวให้ดีที่สุด!`;
    }

    // Series Mode inject
    const epMatch = targetTopic.match(/EP\\.?\\s*(\\d+)/i);
    let seriesContext = '';
    if (epMatch) {
      const epNum = epMatch[1];
      seriesContext = `\\n\\n[ข้อมูลบทในซีรีส์ (Series Episode Context)]:
- ตอนที่จะเขียนอยู่นี้คือ "ตอนที่ ${epNum}" ของซีรีส์วิดีโอสั้น
- โปรดเชื่อมโยงเนื้อหาให้มีหัวข้อเข้ากัน มีความสอดคล้องกัน แนะนำเนื้อหาส่วนที่เกี่ยวข้อง เพื่อดึงความสนใจของผู้ชม และเชื่อมโยงเนื้อหาต่อเนื่องจากหัวข้อหลัก และสร้างความน่าติดตามในแต่ละตอนอย่างมีชั้นเชิงธรรมชาติ!`;
    }

    try {
      const systemPrompt = `คุณคือผู้เชี่ยวชาญการเขียนบทสคริปต์สั้นแนวตั้ง (Shorts/TikTok/Reels) ที่ดีที่สุด

ข้อกำหนดที่สำคัญที่สุด (CRITICAL RULES):
1. เขียนเฉพาะ "บทพากย์เท่านั้น" ที่เสียงพากย์ AI จะนำไปพากย์ได้ทันที
2. ห้ามมีวงเล็บกำกับอารมณ์/ท่าทาง (เช่น (ยิ้ม), (หัวเราะ)) โดยเด็ดขาด
3. ห้ามมีชื่อผู้ดำเนินรายการหรือตัวละคร (เช่น "ผู้ดำเนินรายการ:", "พิธีกร:") โดยเด็ดขาด
4. เขียนให้เข้าปากคนพูด ลื่นไหล สะกดสายตาคนดูได้ภายใน 3 วินาทีแรก
5. ความยาวของบทสคริปต์รวมให้อยู่ระหว่าง 30 ถึง 45 วินาทีเมื่ออ่านออกเสียง (ประมาณ 100-150 คำภาษาไทย)

โปรดเสนอหัวข้อสั้น กระชับ แปะหัววิดีโอที่ช่วยสะกดจิตหรือหัวใจคนให้หยุดดูด้วย 1 ประโยค
* สำคัญมาก: โปรดช่วยใส่เว้นวรรคหรือเว้นบรรทัดช่องคำที่เหมาะสมเพื่อความเป็นระบบ โดยใช้เครื่องหมายเว้นบรรทัดใหม่ (\\\\n) ห้ามพิมพ์ติดกันยาวเกินไป (เช่น คำว่า 'เศรษฐี' หรือ 'โรงเรียน' ต้องอยู่บนบรรทัดเดียวกัน ห้ามมีเครื่องหมายตัดคำหรือสระหลุดบรรทัดแยกกัน)
* ตัวอย่างการใส่เว้นบรรทัดพาดหัวที่สวยงาม:
  "เคล็ดลับวิถี\\\\nเปลี่ยนชีวิตคนธรรมดาเป็นเศรษฐี!"
  "แค 3 ข้อนี้\\\\nที่จะช่วยให้คุณรวยเร็วขึ้น"

ส่งผลลัพธ์กลับมาในรูปแบบ JSON Object เท่านั้น (ห้ามมีคำนำหรืออธิบายเสริมใดๆ):
{
  "headline": "คำพาดหัวสั้นๆ ที่มีเว้นวรรค \\\\n สวยงามตามข้อกำหนดภาษาไทย",
  "script": "เนื้อหาสคริปต์สำหรับเสียงพากย์ มีความเว้นวรรค ช่องว่างเพื่อจังหวะการอ่าน"
}${brainContext}${seriesContext}`;

      const userPrompt = `เขียนบทสคริปต์หัวข้อ: "${targetTopic}" ด้วยสไตล์การเล่าเรื่องแบบ: "${styleObj.name}" (${styleObj.description}) ตัวอย่างเช่น: "${styleObj.example}"`;
      const aiResponse = await callAICompletions(apiKey, systemPrompt, userPrompt, true);

      const cleanJson = aiResponse.substring(
        aiResponse.indexOf('{'),
        aiResponse.lastIndexOf('}') + 1
      );
      const parsed = JSON.parse(cleanJson);
      
      addLog(`เขียนสคริปต์และพาดหัวสำเร็จสำหรับหัวข้อ: ${targetTopic}`, 'success');
      return {
        script: parsed.script,
        headline: parsed.headline
      };

    } catch (e: any) {
      addLog(`เกิดข้อผิดพลาดในการสร้างบทสคริปต์: ${e.message}`, 'error');
      return null;
    }
  };

  """

new_content = content[:start_idx] + restored_code + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Successfully restored handlePlayHistoryAudio and handleGenerateScript!")
