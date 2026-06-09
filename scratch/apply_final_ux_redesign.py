with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Inject canvasCaption state
target_state = "  const [canvasHeadline, setCanvasHeadline] = useState('');"
replacement_state = "  const [canvasHeadline, setCanvasHeadline] = useState('');\n  const [canvasCaption, setCanvasCaption] = useState('');"
if target_state in content:
    content = content.replace(target_state, replacement_state)
    print("Injected canvasCaption state!")

# 2. Update useEffect to initialize states when canvasSelectedItem changes
target_effect = """  // Load canvas selection details
  useEffect(() => {
    if (canvasSelectedItem) {
      setCanvasHeadline(canvasSelectedItem.selected_headline || canvasSelectedItem.title);
      // Pre-select first keyframe if available
      if (canvasSelectedItem.media_paths && canvasSelectedItem.media_paths.length > 0) {
        setCanvasBgImage(canvasSelectedItem.media_paths[0]);
      } else {
        setCanvasBgImage('');
      }
      fetchGraphicsForContent(canvasSelectedItem.id);
    } else {
      setCanvasHeadline('');
      setCanvasBgImage('');
      setLatestGraphic(null);
    }
  }, [canvasSelectedItem]);"""

replacement_effect = """  // Load canvas selection details
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
  }, [canvasSelectedItem]);"""

if target_effect in content:
    content = content.replace(target_effect, replacement_effect)
    print("Updated useEffect hooks!")

# 3. Inject the copywriting dropdown inside the Left Column
target_logo_col = """                  {/* Left Column: ตราประทับ (Logo) */}
                  <div className="space-y-3 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">"""

replacement_logo_col = """                  {/* Left Column: ตราประทับ (Logo) */}
                  <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
                    {/* 📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles) */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                        <span>📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles)</span>
                      </label>
                      <select
                        value={canvasWritingStyle}
                        onChange={(e) => setCanvasWritingStyle(e.target.value)}
                        className="glass-input h-10 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer w-full"
                      >
                        {PALETTE_WRITING_STYLES.map((style) => (
                          <option key={style.id} value={style.id}>
                            {style.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="border-t border-slate-850/40 my-2 pt-2" />"""

if target_logo_col in content:
    content = content.replace(target_logo_col, replacement_logo_col)
    print("Injected copywriting tone select dropdown!")

# 4. Update the card grid layout to expand to full-width when selected
target_card_class = """                                  isSelected 
                                    ? 'bg-cyan-500/10 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30' """
replacement_card_class = """                                  isSelected 
                                    ? 'bg-cyan-500/10 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30 sm:col-span-2' """

if target_card_class in content:
    content = content.replace(target_card_class, replacement_card_class)
    print("Updated card grid CSS to support expanded selection!")

# 5. Append the inline editor right below the card footer
target_card_footer = """                                {/* Footer: Date & author */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/60 pt-2 mt-auto">
                                  <span className="truncate max-w-[120px] font-medium text-slate-400">
                                    👤 {item.author_name || 'ไม่ระบุผู้แต่ง'}
                                  </span>
                                  <span>
                                    📅 {new Date(item.created_at).toLocaleDateString('th-TH')}
                                  </span>
                                </div>"""

replacement_card_footer = """                                {/* Footer: Date & author */}
                                <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/60 pt-2 mt-auto">
                                  <span className="truncate max-w-[120px] font-medium text-slate-400">
                                    👤 {item.author_name || 'ไม่ระบุผู้แต่ง'}
                                  </span>
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
                                    </div>

                                    {/* 2. Headline Selector & Editor */}
                                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850/65">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="text-[11px] font-bold text-cyan-400 block">
                                          📢 ตัวเลือกพาดหัวที่มีให้เลือก (Headline Options)
                                        </label>
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
                                            className="glass-input h-8 py-0 px-2 mt-1 text-[10px] w-full cursor-pointer bg-slate-900"
                                          >
                                            <option value="">-- เลือกเพื่อนำหัวข้อไปใช้ --</option>
                                            {item.metadata.copywriting.headlines.map((hl: string, hIdx: number) => (
                                              <option key={hIdx} value={hl}>
                                                📢 พาดหัวเดี่ยว {hIdx + 1}: {hl}
                                              </option>
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
                                              <span className="w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0" />
                                              <input
                                                type="text"
                                                value={canvasHeadlineLine1}
                                                onChange={(e) => setCanvasHeadlineLine1(e.target.value)}
                                                className="glass-input h-8 text-[11px] py-1 bg-slate-900"
                                                placeholder="บรรทัดที่ 1 (เน้นตัวใหญ่เด่น)..."
                                              />
                                            </div>
                                            <div className="flex gap-2 items-center">
                                              <span className="w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0" />
                                              <input
                                                type="text"
                                                value={canvasHeadlineLine2}
                                                onChange={(e) => setCanvasHeadlineLine2(e.target.value)}
                                                className="glass-input h-8 text-[11px] py-1 bg-slate-900"
                                                placeholder="บรรทัดที่ 2 (สรุปเนื้อหาหลัก)..."
                                              />
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
                                      )}

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
                                    </div>

                                    {/* Action Buttons inside Card */}
                                    <div className="flex flex-wrap gap-2 pt-2 justify-end border-t border-slate-800/40">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          // Update preview state instantly
                                          setCanvasHeadline(canvasHeadlineMode === 'triple' ? [canvasHeadlineLine1, canvasHeadlineLine2, canvasHeadlineLine3].filter(Boolean).join('\\n') : canvasHeadline);
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
                                )}"""

if target_card_footer in content:
    content = content.replace(target_card_footer, replacement_card_footer)
    print("Injected inline card editor and action buttons!")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("UI Redesign modifications finished!")
