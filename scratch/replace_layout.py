import os

target_file = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/components/VerticalVideoSuitePortal.tsx"

with open(target_file, "r", encoding="utf-8") as f:
    content = f.read()

# We can search for the text between {/* Step 4: Premium Voiceover & Subtitles Styling */} and {/* Advanced Library Collapsible */}
start_marker = "          {/* Step 4: Premium Voiceover & Subtitles Styling */}"
end_marker = "            {/* Advanced Library Collapsible */}"

start_pos = content.find(start_marker)
end_pos = content.find(end_marker)

if start_pos == -1 or end_pos == -1:
    print("Error: Could not find start or end markers!")
    print(f"Start pos: {start_pos}, End pos: {end_pos}")
    # Let's try matching Step 3 Text-to-Speech (TTS)
    start_marker = "            {/* Step 3: Text-to-Speech (TTS) */}"
    start_pos = content.find(start_marker)
    # find parent grid container start right before it (about 100 chars before)
    if start_pos != -1:
        grid_start = content.rfind('<div className="grid grid-cols-1 md:grid-cols-2 gap-6">', 0, start_pos)
        if grid_start != -1:
            start_pos = grid_start
            print(f"Recovered start pos from grid container at {start_pos}")
        else:
            print("Could not find grid container start")
            exit(1)
    else:
        print("Failed completely")
        exit(1)

replacement = """          {/* Steps 4 & 5: Voiceover & Subtitles Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ขั้นตอนที่ 4: นักพากย์เสียงไทยพรีเมียม (Kie.ai) */}
            <div className={`p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between transition-all duration-300 ${silentMode ? 'opacity-40 pointer-events-none' : ''}`}>
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">4</span>
                    เลือกนักพากย์เสียงไทยพรีเมียม (Kie.ai Voices)
                  </h3>
                  <span className="text-xs text-amber-300 font-bold">พรีเมียมออนไลน์</span>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-white/70">รายชื่อนักพากย์พรีเมียมออนไลน์ (Kie.ai Premium Thai)</label>
                  <select
                    value={voiceId}
                    onChange={(e) => setVoiceId(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs outline-none focus:border-teal-500 transition-colors font-semibold"
                  >
                    {KIEAI_VOICES.map(v => (
                      <option key={v.id} value={v.id} className="bg-slate-900 text-white font-semibold font-mono">✨ {v.name}</option>
                    ))}
                  </select>
                  
                  <p className="text-[10px] text-amber-300">
                    🔥 เสียงพรีเมียมสมจริงระดับมืออาชีพจาก Kie.ai พูดไทยเป็นธรรมชาติ ลื่นไหลไร้รอยต่อ
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-2">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>ลิงก์ไฟล์เสียง:</span>
                    <span className="font-mono text-teal-400 truncate max-w-[150px]">{audioUrl || 'ยังไม่มีเสียง'}</span>
                  </div>
                  <div className="flex justify-between text-xs text-white/60">
                    <span>ความยาวไฟล์เสียง:</span>
                    <span className="font-mono text-teal-400">{audioDuration ? `${audioDuration.toFixed(2)} วินาที` : '0.00s'}</span>
                  </div>
                  {audioUrl && (
                    <audio src={audioUrl} controls className="w-full h-8 mt-1 scale-95 origin-left" />
                  )}
                </div>
              </div>

              <button
                onClick={triggerManualVoiceGen}
                disabled={isGeneratingVoice || !script}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-40"
              >
                {isGeneratingVoice ? '🎙️ กำลังบันทึกเสียงพากย์...' : '👑 เจนเสียงพากย์พรีเมียม (Kie.ai / ElevenLabs)'}
              </button>
            </div>

            {/* ขั้นตอนที่ 5: จัดแต่งรูปแบบซับไตเติ้ลพาดหัว (Subtitles & Headline Styling) */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">5</span>
                    เลือก Preset และรูปแบบซับไตเติ้ล (Smart Subtitling Presets)
                  </h3>
                  <span className="text-xs text-white/50">จัดแต่งซับไตเติ้ล</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2">
                  {SUBTITLE_PRESETS.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyPreset(p)}
                      className="p-2 text-left text-xs rounded-xl border border-white/10 bg-black/20 hover:bg-purple-950/20 hover:border-purple-500/30 transition-all truncate"
                    >
                      ⚡ {p.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60">แบบอักษร (Font Family)</label>
                    <select
                      value={subStyle.fontName}
                      onChange={(e) => setSubStyle(prev => ({ ...prev, fontName: e.target.value }))}
                      className="w-full p-2 rounded-lg bg-black/40 border border-white/10 text-xs text-white"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Impact">Impact (หนาพิเศษ)</option>
                      <option value="Kanit">Kanit (โมเดิร์นยอดฮิต)</option>
                      <option value="Prompt">Prompt (สะอาดเรียบหรู)</option>
                      <option value="Mitr">Mitr (กลมมนเป็นมิตร)</option>
                      <option value="Sarabun">Sarabun (สะอาดทางการ)</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60">ขนาดอักษร (Font Size)</label>
                    <input
                      type="number"
                      value={subStyle.fontSize}
                      onChange={(e) => setSubStyle(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
                      className="w-full p-1.5 rounded-lg bg-black/40 border border-white/10 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60">สีหลัก (Primary)</label>
                    <input
                      type="color"
                      value={subStyle.primaryColor}
                      onChange={(e) => setSubStyle(prev => ({ ...prev, primaryColor: e.target.value }))}
                      className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60">สีขอบ (Outline)</label>
                    <input
                      type="color"
                      value={subStyle.outlineColor}
                      onChange={(e) => setSubStyle(prev => ({ ...prev, outlineColor: e.target.value }))}
                      className="w-full h-8 rounded border border-white/10 bg-transparent cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-white/60">ขอบเขตซับ</label>
                    <select
                      value={subStyle.borderStyle}
                      onChange={(e) => setSubStyle(prev => ({ ...prev, borderStyle: Number(e.target.value) }))}
                      className="w-full h-8 p-1.5 rounded bg-black/40 border border-white/10 text-[10px]"
                    >
                      <option value={1}>ขอบหนา</option>
                      <option value={3}>กล่องทึบ</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  if (silentMode) {
                    const formatTime = (sec: number) => {
                      const h = Math.floor(sec / 3600);
                      const m = Math.floor((sec % 3600) / 60);
                      const s = Math.floor(sec % 60);
                      const ms = Math.floor((sec % 1) * 1000);
                      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
                    };
                    const sub = `1\\n${formatTime(0)} --> ${formatTime(silentDuration)}\\n${script}\\n`;
                    setSrtContent(sub);
                    addLog('สร้างคำบรรยายแบบค้างนิ่งตลอดคลิปสไตล์ Silent Mode เรียบร้อย', 'success');
                  } else {
                    triggerAutoSubtiming(script, audioDuration, audioUrl);
                  }
                }}
                disabled={!script || (!silentMode && !audioDuration)}
                className="w-full py-2.5 bg-gradient-to-r from-purple-700/60 to-pink-700/60 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-xs rounded-xl transition-all disabled:opacity-30"
              >
                {silentMode ? '🔤 สร้างกล่องคำบรรยายคำคมสไตล์ค้างนิ่ง' : '🔤 คำนวณตัดแบ่งคำบรรยายตามความยาวเสียงพากย์'}
              </button>
            </div>

          </div>

          {/* Steps 6 & 7: BGM Mixing & Batch Execution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ขั้นตอนที่ 6: เพลงประกอบ BGM และระดับความดัง (BGM Mixing & Cinematic Tones) */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">6</span>
                    ดนตรีประกอบและฟิลเตอร์สี (BGM Mixing & Cinematic Filters)
                  </h3>
                  <span className="text-xs text-teal-400 font-semibold">BGM & Tones</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-white/70">ไฟล์หรือโฟลเดอร์เพลงประกอบ BGM (.mp3 / .wav / โฟลเดอร์)</label>
                    <div className="flex flex-wrap gap-2 justify-end">
                      <button 
                        onClick={handleSelectBgm} 
                        className="text-xs text-indigo-400 hover:text-indigo-305 font-semibold transition-all active:scale-95"
                        title="เลือกไฟล์ MP3 เดี่ยวเพียงไฟล์เดียว"
                      >
                        📂 เลือกไฟล์ BGM
                      </button>
                      <button 
                        onClick={handleSelectBgmFolder} 
                        className="text-xs text-teal-400 hover:text-teal-305 font-semibold transition-all active:scale-95"
                        title="เลือกโฟลเดอร์เพื่อสุ่มหยิบเพลงประกอบแตกต่างกันให้แต่ละคลิปใน Batch"
                      >
                        🗂️ สุ่มจากโฟลเดอร์
                      </button>
                      <button 
                        onClick={() => {
                          const manualBgm = window.prompt(`กรอก/วาง Path ไฟล์ BGM หรือโฟลเดอร์เพลงบรรเลงโดยตรง:`, bgmFile || '');
                          if (manualBgm !== null) {
                            setBgmFile(manualBgm.trim());
                            addLog(`ระบุแหล่ง BGM แบบระบุเองสำเร็จ: ${manualBgm.trim()}`, 'success');
                          }
                        }} 
                        className="text-xs text-purple-400 hover:text-purple-305 font-semibold transition-all active:scale-95"
                        title="ระบุ Path เองโดยตรง"
                      >
                        ✏️ ระบุเอง
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={bgmFile || ''}
                    onChange={(e) => setBgmFile(e.target.value)}
                    placeholder="วาง Path ไฟล์เพลงประกอบ (.mp3) หรือโฟลเดอร์เพลงเพื่อเปิดระบบ BGM Randomizer..."
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500 transition-all font-mono"
                  />
                  {bgmFile && !bgmFile.endsWith('.mp3') && !bgmFile.endsWith('.wav') && !bgmFile.endsWith('.m4a') && (
                    <p className="text-[10px] text-teal-400 italic">🎲 เปิดโหมดสุ่มเพลง BGM อัตโนมัติจากโฟลเดอร์สำเร็จ!</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-white/60">
                    <span>ความดังเพลง BGM (BGM Volume Mixing)</span>
                    <span className="font-mono text-teal-400 font-bold">{Math.round(bgmVolume * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="0.4"
                    step="0.01"
                    value={bgmVolume}
                    onChange={(e) => setBgmVolume(Number(e.target.value))}
                    className="w-full h-1.5 bg-black/40 rounded-lg appearance-none cursor-pointer accent-teal-400"
                  />
                  <p className="text-[9px] text-white/40">* แนะนำความดังที่ 8% - 15% เพื่อไม่ให้กลบเสียงพากย์หลักครับบอส</p>
                </div>

                {/* Cinematic Color Grading Filter inside BGM */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <label className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                    🎨 ฟิลเตอร์โทนสีวิดีโอ (Cinematic Color Grading)
                  </label>
                  <select
                    value={colorFilter}
                    onChange={(e) => setColorFilter(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white outline-none focus:border-teal-500 transition-colors font-semibold"
                  >
                    <option value="none">ปกติ (Original Colors)</option>
                    <option value="grayscale">🔘 ขาว-ดำ คลาสสิก (Grayscale / B&W)</option>
                    <option value="dark">🌑 ฟิล์มมืดดราม่า (Dark Cinematic Overlay)</option>
                    <option value="contrast">🎭 ไฮคอนทราสต์จัดจ้าน (High Contrast Cinematic)</option>
                    <option value="dark-grayscale">🖤 ดำ-เทาฟิล์มหม่น (Dark Grayscale Tone)</option>
                  </select>
                </div>

                {/* 🤫 Collapsible Silent Mode Control Panel */}
                <div className="p-3.5 rounded-xl border border-indigo-500/20 bg-indigo-950/20 shadow-inner flex flex-col justify-between gap-2">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-bold text-indigo-350 flex items-center gap-1.5">
                      🤫 โหมดคำคมคำบรรยายไร้เสียง (Silent Quote Mode)
                    </h4>
                    <p className="text-[10px] text-white/60 leading-relaxed">
                      ข้ามการเจนเสียงพากย์ ใช้เพียงฟุตเทจประกอบคำบรรยายอย่างเดียว
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-black/30 p-2 rounded-xl border border-white/5 justify-between">
                    <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={silentMode}
                        onChange={(e) => setSilentMode(e.target.checked)}
                        className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 focus:ring-indigo-500 cursor-pointer"
                      />
                      เปิดใช้งานโหมดเงียบ
                    </label>

                    {silentMode && (
                      <div className="flex items-center gap-2 border-l border-white/10 pl-3">
                        <label className="text-[10px] text-white/50 block">เวลา (วิ):</label>
                        <input
                          type="number"
                          min="3"
                          max="60"
                          value={silentDuration}
                          onChange={(e) => setSilentDuration(Math.max(3, Number(e.target.value)))}
                          className="w-12 p-1 bg-slate-900 border border-white/10 rounded-lg text-xs text-center text-teal-400 font-mono font-bold outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Manual single assembly button under details */}
                <details className="border-t border-white/5 pt-2 group text-[11px] text-white/50 cursor-pointer">
                  <summary className="hover:text-white transition-colors">⚙️ ตัวประกอบร่างคลิปเดี่ยวแบบแมนนวล (Manual Fallback)</summary>
                  <div className="pt-2 cursor-default">
                    <button
                      onClick={async () => {
                        if (!script || !srtContent) {
                          return alert('กรุณาสร้างและตรวจสอบบทสคริปต์และจัดทำ SRT ซับไตเติ้ลก่อนประกอบร่างครับบอส');
                        }
                        setIsAssembling(true);
                        addLog('เริ่มขั้นตอนประกอบร่างและเรนเดอร์ภาพเดี่ยว...', 'info');
                        const activeAudioUrl = silentMode ? '' : audioUrl;
                        const activeDuration = silentMode ? silentDuration : audioDuration;
                        const activeBgm = await resolveBgmFileRandomly(bgmFile);

                        const renderPath = await handleRenderSingleVideo(
                          topic || 'Manual_Render',
                          activeAudioUrl,
                          activeDuration,
                          srtContent,
                          headline,
                          activeBgm
                        );
                        if (renderPath) {
                          setAssembledVideoPath(renderPath);
                          addLog(`ประกอบร่างและเรนเดอร์วิดีโอเดี่ยวสำเร็จ: ${renderPath}`, 'success');
                        }
                        setIsAssembling(false);
                      }}
                      disabled={isAssembling || (!silentMode && !audioUrl) || !srtContent}
                      className="w-full py-2 bg-gradient-to-r from-teal-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all disabled:opacity-40"
                    >
                      {isAssembling ? '🎬 กำลังประกอบฟุตเทจและเรนเดอร์...' : '💥 สั่งประกอบร่างและเรนเดอร์เป็นรายตอนเดี่ยว'}
                    </button>
                  </div>
                </details>
              </div>
            </div>

            {/* ขั้นตอนที่ 7: ปุ่มเริ่มรันงาน Batch Pipeline และหน้าจอมอนิเตอร์ Logs (Start Batch Pipeline & Logs) */}
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-900/60 backdrop-blur-md shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                  <h3 className="text-md font-bold text-teal-400 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 text-sm">7</span>
                    สั่งเริ่มรัน Batch Pipeline และหน้าจอ Log
                  </h3>
                  <span className="text-xs text-teal-400 font-semibold">Start & Monitor</span>
                </div>

                <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-black/40 border border-white/10 font-semibold text-white">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white flex items-center gap-1.5">
                      🚀 สั่งเริ่มผลิตวิดีโอแบบกลุ่มอัตโนมัติ (Start Batch Pipeline)
                    </p>
                    <p className="text-[10px] text-white/50 leading-relaxed font-normal">
                      รันคิวต่อเนื่องแบบอัตโนมัติคีย์เดียว: เจนสคริปต์สไตล์ AI -> เจนเสียง Kie.ai -> แกะซับ Whisper/AI เกลาคำ -> ต่อฟุตเทจ -> ซ้อน BGM -> เซฟชื่อไฟล์ตามพาดหัว
                    </p>
                  </div>

                  <div className="flex gap-2 w-full shrink-0 justify-between items-center pt-2 border-t border-white/5">
                    <button
                      onClick={executeBatchQueue}
                      disabled={batchStatus === 'running' || batchItems.length === 0}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20 active:scale-95"
                    >
                      ▶️ เริ่มทำงานคิวรัน
                    </button>
                    <button
                      onClick={handlePauseBatch}
                      disabled={batchStatus !== 'running'}
                      className="px-2.5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center active:scale-95"
                      title="พักชั่วคราว"
                    >
                      ⏸️ พัก
                    </button>
                    <button
                      onClick={handleStopBatch}
                      disabled={batchStatus !== 'running' && batchStatus !== 'paused'}
                      className="px-2.5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl disabled:opacity-40 transition-all flex items-center justify-center active:scale-95"
                      title="หยุดรันคิวทั้งหมด"
                    >
                      ⏹️ หยุด
                    </button>
                  </div>
                </div>

                {/* Live Running Console Log */}
                <div className="space-y-2">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-teal-400 font-semibold">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping" />
                    รายงานสถานะการประมวลผล (Terminal Monitor Log)
                  </span>
                  
                  {/* Monospace Log Viewbox */}
                  <div className="h-[210px] p-3 rounded-xl bg-black border border-white/10 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1 select-text scrollbar-thin shadow-inner">
                    {logs.length === 0 ? (
                      <div className="text-white/30 text-xs italic">📟 รอระบบเริ่มทำงานเพื่อแสดงผลลัพธ์การเรนเดอร์ประโยคต่อประโยค...</div>
                    ) : (
                      logs.map((log, idx) => (
                        <div key={idx} className="whitespace-pre-wrap leading-relaxed">{log}</div>
                      ))
                    )}
                    <div ref={terminalEndRef} />
                  </div>
                </div>
              </div>
            </div>

          </div>
"""

new_content = content[:start_pos] + replacement + content[end_pos:]

with open(target_file, "w", encoding="utf-8") as f:
    f.write(new_content)

print("Replacement successful!")
