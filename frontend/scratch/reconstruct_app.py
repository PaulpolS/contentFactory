import os

BACKUP_PATH = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx.bak"
TARGET_PATH = "/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx"

CANVAS_TAB_TSX = r"""
          {/* TAB 3: GRAPHIC CANVAS WORKSPACE */}
          {activeTab === 'canvas' && (
            <div className="space-y-6 w-full animate-fade-in">
              
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
                            }]);
                            setIsCheckingCredits(false);
                            return;
                          }
                          const info = await checkOpenRouterCredits(openRouterKey);
                          const keyPreview = openRouterKey.slice(0, 8) + '...' + openRouterKey.slice(-4);
                          setCreditCheckResults([{
                            label: 'OpenRouter API Key',
                            keyPreview,
                            valid: info.valid,
                            balance: info.balanceFormatted,
                            usage: `$${(Number(info.usage) || 0).toFixed(4)}`,
                            isFreeTier: info.isFreeTier,
                            keyApiLabel: info.keyLabel,
                            error: info.error,
                          }]);
                        } catch (e: any) {
                          setCreditCheckResults([{ label: 'Error', keyPreview: '-', valid: false, balance: '$0', usage: '$0', error: e.message }]);
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
                            setCreditCheckResults([{ label: 'ไม่พบ API Key', keyPreview: '-', valid: false, balance: '-', usage: '-', error: 'ไม่พบ Key' }]);
                            return;
                          }
                          const testModel = 'google/gemini-2.5-flash';
                          setCreditCheckResults([{
                            label: `🧪 กำลังทดสอบ ${testModel}...`,
                            keyPreview: String(openRouterKey || '').slice(0, 8) + '...' + String(openRouterKey || '').slice(-4),
                            valid: true,
                            balance: 'กำลังทดสอบ...',
                            usage: '-'
                          }]);
                          const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                            method: 'POST',
                            headers: {
                              'Content-Type': 'application/json',
                              'Authorization': `Bearer ${openRouterKey}`,
                              'HTTP-Referer': window.location.origin
                            },
                            body: JSON.stringify({
                              model: testModel,
                              messages: [{ role: 'user', content: 'ตอบแค่คำว่า "OK"' }],
                              max_tokens: 5
                            })
                          });
                          const data = await res.json();
                          if (res.ok && !data.error) {
                            setCreditCheckResults([{
                              label: `✅ ทดสอบ ${testModel} สำเร็จ!`,
                              keyPreview: String(openRouterKey || '').slice(0, 8) + '...' + String(openRouterKey || '').slice(-4),
                              valid: true,
                              balance: `ตอบกลับ: ${data.choices?.[0]?.message?.content || 'OK'}`,
                              usage: `Model: ${data.model || testModel}`
                            }]);
                          } else {
                            const err = data.error?.message || JSON.stringify(data.error) || `HTTP ${res.status}`;
                            setCreditCheckResults([{
                              label: `❌ ทดสอบ ${testModel} ล้มเหลว`,
                              keyPreview: String(openRouterKey || '').slice(0, 8) + '...' + String(openRouterKey || '').slice(-4),
                              valid: false,
                              balance: '-',
                              usage: '-',
                              error: err
                            }]);
                          }
                        } catch (e: any) {
                          setCreditCheckResults([{ label: 'Error', keyPreview: '-', valid: false, balance: '-', usage: '-', error: e.message }]);
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-blue-800/85 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      🧪 ทดสอบ API
                    </button>
                  </div>
                </div>

                {creditCheckResults.length > 0 && (
                  <div className="mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-xs font-bold text-cyan-400">🔑 ผลตรวจวิเคราะห์ OpenRouter API Key</h3>
                      <button onClick={() => setCreditCheckResults([])} className="text-[10px] text-slate-500 hover:text-slate-300">
                        ✕ ปิดแผง
                      </button>
                    </div>
                    <div className="space-y-2">
                      {creditCheckResults.map((r, idx) => (
                        <div key={idx} className={`p-3 rounded-lg border text-xs ${r.valid ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-red-950/20 border-red-500/20'}`}>
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

                {/* ☁️ Dropbox Integration Settings */}
                <div style={{ marginBottom: '20px', padding: '14px', background: 'rgba(15,23,42,0.4)', borderRadius: '12px', border: '1px solid rgba(51,65,85,0.3)' }}>
                  <p style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>☁️ Dropbox Integration</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>🔑 Dropbox Access Token</label>
                      <input
                        type="password"
                        value={dropboxToken}
                        onChange={(e) => {
                          setDropboxToken(e.target.value);
                          localStorage.setItem('dropbox_token', e.target.value);
                        }}
                        placeholder="sl.xxxxxxxx..."
                        style={{
                          width: '100%',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(51,65,85,0.5)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '10px',
                          color: '#e2e8f0',
                          outline: 'none'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>📁 Dropbox Folder Path</label>
                      <input
                        type="text"
                        value={dropboxFolder}
                        onChange={(e) => {
                          setDropboxFolder(e.target.value);
                          localStorage.setItem('dropbox_folder', e.target.value);
                        }}
                        placeholder="/ContentFactory/exports"
                        style={{
                          width: '100%',
                          background: 'rgba(15,23,42,0.8)',
                          border: '1px solid rgba(51,65,85,0.5)',
                          borderRadius: '8px',
                          padding: '8px 10px',
                          fontSize: '10px',
                          color: '#e2e8f0',
                          outline: 'none'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* ⚙️ Canvas Designer Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                
                {/* Left column options */}
                <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
                      <span>📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles)</span>
                    </label>
                    <select
                      value={canvasWritingStyle}
                      onChange={(e) => setCanvasWritingStyle(e.target.value)}
                      className="glass-input h-10 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer w-full"
                    >
                      {PALETTE_WRITING_STYLES.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
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
                    onClick={() => document.getElementById('canvas-logo-uploader-basic')?.click()}
                    style={{
                      width: '100%',
                      background: 'linear-gradient(90deg, #f97316, #f59e0b, #f97316)',
                      color: '#0a0a0a',
                      border: '2px solid #fb923c',
                      padding: '8px 12px',
                      borderRadius: '10px',
                      boxShadow: '0 0 15px rgba(249, 115, 22, 0.4)',
                      fontWeight: 900,
                      fontSize: '11px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    <Upload className="w-4 h-4" />
                    <span>🔗 อัพโหลดโลโก้ใหม่</span>
                  </button>
                  <input
                    type="file"
                    id="canvas-logo-uploader-basic"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    style={{ display: 'none' }}
                  />

                  {savedLogos.length > 0 && (
                    <div style={{ padding: '8px', background: 'rgba(15,23,42,0.4)', borderRadius: '8px', border: '1px solid rgba(51,65,85,0.3)' }}>
                      <p style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, marginBottom: '8px' }}>📁 โลโก้ที่บันทึกไว้ — คลิกเพื่อเลือก:</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {savedLogos.map((logo) => {
                          const isSelected = canvasLogoUrl === logo.url;
                          return (
                            <div key={logo.name} style={{ position: 'relative' }} className="group">
                              <button
                                type="button"
                                onClick={() => {
                                  setCanvasLogoUrl(logo.url);
                                  if (rememberLogo) {
                                    localStorage.setItem('canvas_logo_url', logo.url);
                                  }
                                }}
                                style={{
                                  width: '48px',
                                  height: '48px',
                                  borderRadius: '10px',
                                  border: isSelected ? '2px solid #22d3ee' : '2px solid rgba(51, 65, 85, 0.5)',
                                  background: isSelected ? 'rgba(34, 211, 238, 0.08)' : 'rgba(15, 23, 42, 0.6)',
                                  padding: '4px',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  boxShadow: isSelected ? '0 0 8px rgba(34, 211, 238, 0.3)' : 'none'
                                }}
                                title={logo.name}
                              >
                                <img src={`${API_BASE}${logo.url}`} alt={logo.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </button>
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
                              {isSelected && (
                                <div style={{ position: 'absolute', bottom: '-2px', left: '50%', transform: 'translateX(-50%)', fontSize: '7px', fontWeight: 900, color: '#22d3ee', whiteSpace: 'nowrap' }}>
                                  ✓ เลือก
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {canvasShowPageLogo && (
                    <div style={{ padding: '10px', background: 'rgba(6, 182, 212, 0.04)', borderRadius: '8px', border: '1px solid rgba(34, 211, 238, 0.15)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <p style={{ fontSize: '10px', fontWeight: 700, color: '#67e8f9', margin: 0 }}>⚙️ ตั้งค่าโลโก้</p>
                      
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>📏 ขนาด</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#e2e8f0' }}>{canvasLogoSize}%</span>
                        </div>
                        <input
                          type="range"
                          min="3"
                          max="30"
                          value={canvasLogoSize}
                          onChange={(e) => setCanvasLogoSize(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#22d3ee', height: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>↔️ ระยะขอบแนวนอน</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#e2e8f0' }}>{canvasLogoMarginX}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={canvasLogoMarginX}
                          onChange={(e) => setCanvasLogoMarginX(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#22d3ee', height: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>↕️ ระยะขอบแนวตั้ง</span>
                          <span style={{ fontSize: '9px', fontWeight: 800, color: '#e2e8f0' }}>{canvasLogoMarginY}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={canvasLogoMarginY}
                          onChange={(e) => setCanvasLogoMarginY(Number(e.target.value))}
                          style={{ width: '100%', accentColor: '#22d3ee', height: '4px' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '9px', fontWeight: 600, color: '#94a3b8' }}>📌 มุมที่จัดวาง</span>
                        </div>
                        <select
                          value={canvasLogoCorner}
                          onChange={(e) => setCanvasLogoCorner(e.target.value as any)}
                          style={{ width: '100%', background: 'rgba(15,23,42,0.8)', border: '1px solid rgba(51,65,85,0.4)', borderRadius: '6px', padding: '6px 8px', fontSize: '10px', color: '#e2e8f0' }}
                        >
                          <option value="top-right">↗️ บนขวา (Top Right)</option>
                          <option value="top-left">↖️ บนซ้าย (Top Left)</option>
                          <option value="bottom-right">↘️ ล่างขวา (Bottom Right)</option>
                          <option value="bottom-left">↙️ ล่างซ้าย (Bottom Left)</option>
                        </select>
                      </div>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                        <input
                          type="checkbox"
                          checked={rememberLogo}
                          onChange={(e) => {
                            setRememberLogo(e.target.checked);
                            if (e.target.checked && canvasLogoUrl) {
                              localStorage.setItem('canvas_logo_url', canvasLogoUrl);
                            } else {
                              localStorage.removeItem('canvas_logo_url');
                            }
                          }}
                          style={{ width: '12px', height: '12px' }}
                        />
                        <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700 }}>จดจำโลโก้นี้ไว้ใช้ครั้งถัดไป</span>
                      </label>
                    </div>
                  )}

                  {/* Premium overlays option panel */}
                  <div className="md:col-span-2 space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-850">
                      <Cpu className="w-4 h-4 text-pink-400" />
                      <span className="text-xs font-bold text-white">🧩 ออปชันตกแต่งภาพซ้อนหลังแบบพรีเมียม (Premium Overlays)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Badge Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">✨ แสดง Badge (แบรนด์ไอคอน)</span>
                          <input
                            type="checkbox"
                            checked={canvasShowBadge}
                            onChange={(e) => setCanvasShowBadge(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowBadge && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasBadgeText}
                              onChange={(e) => setCanvasBadgeText(e.target.value)}
                              placeholder="เช่น AI"
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasBadgeSubtext}
                              onChange={(e) => setCanvasBadgeSubtext(e.target.value)}
                              placeholder="เช่น Content Lab"
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Callout Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">📢 แสดง Callout (ป้ายคำพูดสติกเกอร์)</span>
                          <input
                            type="checkbox"
                            checked={canvasShowCallout}
                            onChange={(e) => setCanvasShowCallout(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowCallout && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasCalloutText}
                              onChange={(e) => setCanvasCalloutText(e.target.value)}
                              placeholder="คำอธิบาย..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasCalloutHighlight}
                              onChange={(e) => setCanvasCalloutHighlight(e.target.value)}
                              placeholder="คำเน้นสีเหลือง..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* Meme Frame Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">🎭 แสดง Meme Text Overlay</span>
                          <input
                            type="checkbox"
                            checked={canvasShowMeme}
                            onChange={(e) => setCanvasShowMeme(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowMeme && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasMemeText}
                              onChange={(e) => setCanvasMemeText(e.target.value)}
                              placeholder="เช่น เร็วกว่าเดิม"
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasMemeSubtext}
                              onChange={(e) => setCanvasMemeSubtext(e.target.value)}
                              placeholder="เช่น AI ช่วยย่นเวลา"
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>

                      {/* News Strap Switch */}
                      <div className="bg-slate-950/40 p-3 rounded-lg border border-slate-850/80">
                        <label className="flex items-center justify-between cursor-pointer">
                          <span className="text-[10px] font-bold text-slate-300">📰 แสดงแถบข้อมูลข่าว (News Card Overlay)</span>
                          <input
                            type="checkbox"
                            checked={canvasShowNewsCard}
                            onChange={(e) => setCanvasShowNewsCard(e.target.checked)}
                            className="w-4 h-4 rounded text-cyan-500 bg-slate-900 cursor-pointer"
                          />
                        </label>
                        {canvasShowNewsCard && (
                          <div className="mt-2 space-y-2 pt-2 border-t border-slate-900">
                            <input
                              type="text"
                              value={canvasNewsTitle}
                              onChange={(e) => setCanvasNewsTitle(e.target.value)}
                              placeholder="หัวข้อข่าว..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                            <input
                              type="text"
                              value={canvasNewsDetail}
                              onChange={(e) => setCanvasNewsDetail(e.target.value)}
                              placeholder="คำบรรยายย่อข่าว..."
                              className="w-full text-[10px] px-2 py-1 rounded bg-slate-900 border border-slate-800 text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right column options */}
                <div className="space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-400 mb-2">📐 สเกลสัดส่วนโพสต์ (Aspect Ratio)</label>
                    <select
                      className="glass-input h-11 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer"
                      value={canvasRatio}
                      onChange={(e) => setCanvasRatio(e.target.value as any)}
                    >
                      <option value="1:1">⬜ 1:1 — สี่เหลี่ยมจัตุรัส (Instagram / Facebook Post)</option>
                      <option value="4:5">📱 4:5 — แนวตั้งสั้น (Instagram Portrait / Ads)</option>
                      <option value="4:3">🖥️ 4:3 — แนวนอนสั้น (Presentation / Blog)</option>
                      <option value="16:9">🎬 16:9 — แนวนอนกว้าง (YouTube Thumbnail / Website)</option>
                      <option value="9:16">📲 9:16 — แนวตั้งยาว (IG Story / Reels / Shorts / TikTok)</option>
                    </select>
                  </div>

                  <div className="border-t border-slate-850/40 my-1" />

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

                  <div className="space-y-3">
                    <p className="text-[10px] text-slate-500 leading-snug">ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูลและภาพที่ Render เสร็จสิ้น</p>
                    <div className="grid grid-cols-1 gap-2.5 mt-2">
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
                          {exportFolderName ? `📁 โฟลเดอร์ที่เลือก: ${exportFolderName}` : '📂 คลิกเพื่อเลือกโฟลเดอร์ปลายทาง'}
                        </span>
                      </button>

                      {/* Export / Save to Local Button */}
                      <button
                        type="button"
                        onClick={handleExportLocal}
                        disabled={!exportDirHandle}
                        className={`w-full py-3 px-3 rounded-lg border text-xs font-black flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                          canvasSelectedIds.length > 0
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

                {/* Swatches theme palette Selection */}
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
                          <div className="flex flex-col h-full justify-between">
                            <div className="swatch-header">
                              <span className="swatch-title" title={theme.name}>{theme.name}</span>
                              {isSelected && <CheckCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                            </div>
                            <div className="swatch-bar mt-2 flex gap-1 h-3 rounded overflow-hidden">
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.gradient[0] }} title="Gradient Start" />
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.gradient[1] }} title="Gradient End" />
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.highlight }} title="Highlight Block" />
                              <div className="flex-1 h-full" style={{ backgroundColor: theme.secondaryHighlight }} title="Second Highlight" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Configurations parameters controls (scale, split, font family) */}
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
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>ขนาดฟอนต์ (Font Scale)</span>
                        <span className="text-cyan-400 font-mono font-bold">{canvasFontScale}x</span>
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
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>สัดส่วนแบ่งรูปภาพ / สี (Split Ratio)</span>
                        <span className="text-cyan-400 font-mono font-bold">{canvasImageSplit}%</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={canvasImageSplit}
                        onChange={(e) => setCanvasImageSplit(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                      />
                    </div>

                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 mb-1">การจัดวางแนวพาดหัว (Align)</span>
                      <select
                        value={canvasHeadlineAlign}
                        onChange={(e) => setCanvasHeadlineAlign(e.target.value as any)}
                        className="glass-input h-9 text-xs w-full cursor-pointer bg-slate-950"
                      >
                        <option value="left">⬅️ ชิดซ้าย (Left)</option>
                        <option value="center">↕️ กึ่งกลาง (Center)</option>
                        <option value="right">➡️ ชิดขวา (Right)</option>
                      </select>
                    </div>

                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                        <span>ระยะขอบพาดหัว (Margin)</span>
                        <span className="text-cyan-400 font-mono font-bold">{canvasHeadlineMargin}px</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="80"
                        value={canvasHeadlineMargin}
                        onChange={(e) => setCanvasHeadlineMargin(Number(e.target.value))}
                        className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Action buttons (bulk generate and single item detail workspace) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
                
                {/* Left panel: selected item edit/AI copywriting generator workspace */}
                <div className="lg:col-span-1 space-y-4">
                  <div className="glass-panel p-5 relative overflow-hidden bg-slate-950/20">
                    <div className="flex items-center gap-2 pb-2.5 border-b border-slate-850">
                      <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" />
                      <h3 className="text-xs font-black text-white uppercase tracking-wider">✍️ ดีไซน์และเกลาคำโฆษณาเดี่ยว</h3>
                    </div>

                    {canvasSelectedItem ? (
                      <div className="space-y-4 pt-3 text-left">
                        <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-850">
                          <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">หัวข้อคอนเทนต์ดิบ</p>
                          <p className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{canvasSelectedItem.title}</p>
                        </div>

                        {/* Mode selectors: single headline vs triple headlines */}
                        <div className="space-y-1">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">📢 โหมดคำโฆษณาพาดหัวรูปภาพ</span>
                          <div className="flex gap-2 p-1 bg-slate-950 rounded-lg border border-slate-850">
                            <button
                              type="button"
                              onClick={() => setCanvasHeadlineMode('single')}
                              className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${
                                canvasHeadlineMode === 'single'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              พาดหัวบรรทัดเดียว (Single)
                            </button>
                            <button
                              type="button"
                              onClick={() => setCanvasHeadlineMode('triple')}
                              className={`flex-1 py-1.5 text-[10px] font-black rounded-md transition-all ${
                                canvasHeadlineMode === 'triple'
                                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                                  : 'text-slate-500 hover:text-slate-300 border border-transparent'
                              }`}
                            >
                              พาดหัว 3 บรรทัด (Triple Grid)
                            </button>
                          </div>
                        </div>

                        {/* Editable fields */}
                        {canvasHeadlineMode === 'single' ? (
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✍️ พาดหัวภาพรูป</label>
                            <input
                              type="text"
                              value={canvasHeadline}
                              onChange={(e) => setCanvasHeadline(e.target.value)}
                              placeholder="ระบุข้อความพาดหัวรูป..."
                              className="w-full text-xs font-medium px-3 h-10 rounded-lg bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                            />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">✍️ พาดหัวแบบ 3 บรรทัด (แสดงผลซ้อนแยกแถว)</label>
                            <div className="space-y-2 bg-slate-950/30 p-2.5 rounded-lg border border-slate-850/60">
                              <input
                                type="text"
                                value={canvasHeadlineLine1}
                                onChange={(e) => setCanvasHeadlineLine1(e.target.value)}
                                placeholder="บรรทัดที่ 1 (ตัวหนาสีชมพู/ขาว)..."
                                className="w-full text-xs font-medium px-2.5 h-8.5 rounded bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                              />
                              <input
                                type="text"
                                value={canvasHeadlineLine2}
                                onChange={(e) => setCanvasHeadlineLine2(e.target.value)}
                                placeholder="บรรทัดที่ 2 (ตัวหนาสีขาว)..."
                                className="w-full text-xs font-medium px-2.5 h-8.5 rounded bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                              />
                              <input
                                type="text"
                                value={canvasHeadlineLine3}
                                onChange={(e) => setCanvasHeadlineLine3(e.target.value)}
                                placeholder="บรรทัดที่ 3 (ตัวเน้นสีเหลือง)..."
                                className="w-full text-xs font-medium px-2.5 h-8.5 rounded bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🖍️ ไฮไลท์คีย์เวิร์ดพารามิเตอร์</label>
                          <input
                            type="text"
                            value={canvasHighlight}
                            onChange={(e) => setCanvasHighlight(e.target.value)}
                            placeholder="ระบุคำสำคัญที่ต้องการแยกเน้น เช่น AI, เขียนโค้ด..."
                            className="w-full text-xs font-medium px-3 h-10 rounded-lg bg-slate-950 border border-slate-850 text-white focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none"
                          />
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">✍️ แคปชั่นสำหรับโพสต์โฆษณา</label>
                            {canvasCaption && (
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(canvasCaption);
                                  alert('📋 คัดลอกแคปชั่นสำเร็จ!');
                                }}
                                className="text-[9px] text-cyan-400 hover:text-white px-2 py-0.5 bg-slate-950 border border-slate-850 rounded"
                              >
                                คัดลอก
                              </button>
                            )}
                          </div>
                          <textarea
                            value={canvasCaption}
                            onChange={(e) => setCanvasCaption(e.target.value)}
                            placeholder="พิมพ์รายละเอียดสำหรับเขียนแคปชั่นโพสต์..."
                            className="w-full text-xs font-medium p-3 rounded-lg bg-slate-950 border border-slate-850 text-white min-h-[120px] focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30 outline-none resize-y custom-scrollbar"
                          />
                        </div>

                        {/* AI actions */}
                        <div className="flex gap-2.5 pt-2 border-t border-slate-850/60">
                          <button
                            type="button"
                            disabled={generatingCopywriting}
                            onClick={handleAIRewriteHeadline}
                            className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
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
                    ) : (
                      <div className="text-center py-16 text-slate-500">
                        <Info className="w-12 h-12 mx-auto mb-3.5 text-slate-700" />
                        <p className="text-xs font-bold">ยังไม่ได้เลือกรายการวัตถุดิบเดี่ยว</p>
                        <p className="text-[10px] text-slate-600 mt-1 max-w-[200px] mx-auto leading-relaxed">
                          กรุณาคลิกเลือกการ์ดหัวข้อวัตถุดิบทางด้านขวา เพื่อปรับแต่งและใช้ AI เขียนบทความทีละรายการ
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right panel: bulk generation checklist + logs + database cards flow */}
                <div className="lg:col-span-2 space-y-4">
                  
                  {/* Item Selector List */}
                  <div className="md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 mt-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <label className="text-xs font-semibold text-slate-300">
                          🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)
                        </label>
                        <button
                          type="button"
                          onClick={handleAutoSelectBgImages}
                          disabled={isAutoSelectingBg || canvasImportedItems.length === 0}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 border flex items-center gap-1.5 shadow-lg ${
                            isAutoSelectingBg
                              ? 'bg-slate-800 border-slate-750 text-slate-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white border-cyan-500/30 hover:border-cyan-400/40 hover:shadow-cyan-500/20 active:scale-95 cursor-pointer'
                          }`}
                        >
                          {isAutoSelectingBg ? (
                            <>
                              <span className="animate-spin rounded-full h-3 w-3 border-2 border-slate-400 border-t-transparent" />
                              <span>กำลังตรวจจับใบหน้า...</span>
                            </>
                          ) : (
                            <>
                              <span>🤖 เลือกรูปที่มีคนอัตโนมัติ (ทุกโพส)</span>
                            </>
                          )}
                        </button>
                      </div>
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
                            className="w-4 h-4 rounded border-slate-750 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                          />
                          <span className="text-[10px] font-bold text-slate-400">
                            เลือกทั้งหมดเพื่อสร้างโพสรูป ({canvasSearchFiltered.length} รายการ)
                          </span>
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
                          type="button"
                          onClick={() => setCanvasSearchQuery('')}
                          className="px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                        >
                          ล้าง
                        </button>
                      )}
                    </div>

                    {canvasSelectedIds.length > 0 && (
                      <div className="pt-1.5 pb-2 animate-fade-in w-full">
                        <div className="relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-950/80 to-indigo-950/60 p-4 shadow-2xl shadow-purple-500/10">
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/10 to-indigo-500/5 pointer-events-none" />
                          <div className="relative flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/20">
                            <Sparkles className="w-5 h-5 text-fuchsia-400 animate-pulse" />
                            <h3 className="text-sm font-black text-white tracking-tight">✍️ สั่ง AI เขียนบทความและพาดหัว</h3>
                            <span className="ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                              {canvasSelectedIds.length} รายการ
                            </span>
                          </div>

                          <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                            <div>
                              <label className="block text-[10px] font-bold text-purple-300/80 mb-1 uppercase tracking-wider">🎯 สไตล์พาดหัว</label>
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
                            <div>
                              <label className="block text-[10px] font-bold text-purple-300/80 mb-1 uppercase tracking-wider">📝 สไตล์การเขียนโพส</label>
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

                          {(!canvasHeadlineStyle || !canvasWritingStyle) && (
                            <p className="text-[10px] text-amber-400/80 mb-2 flex items-center gap-1">
                              ⚠️ กรุณาเลือกสไตล์พาดหัวและสไตล์การเขียนโพสให้ครบทั้ง 2 ช่องก่อนกดปุ่ม
                            </p>
                          )}

                          <button
                            type="button"
                            disabled={generatingCopywriting || !canvasHeadlineStyle || !canvasWritingStyle}
                            onClick={handleBulkGenerateCopywriting}
                            className="relative w-full rounded-xl font-black text-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
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
                            }}
                          >
                            {generatingCopywriting ? (
                              <>
                                <RefreshCw className="w-5 h-5 animate-spin" style={{ color: '#86efac' }} />
                                <span>กำลังใช้ AI เขียนบทความแบบกลุ่ม... ({canvasSelectedIds.length} รายการ)</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-5 h-5 text-slate-900 animate-pulse" />
                                <span>🪄 สั่ง AI เขียนบทความแบบกลุ่มที่เลือกทั้งหมด</span>
                              </>
                            )}
                          </button>

                          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
                            <span className="text-[10px] text-slate-400 font-bold">📜 AI Copywriting Logs</span>
                            <button
                              type="button"
                              onClick={() => setShowCanvasLogs(!showCanvasLogs)}
                              className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[9px] font-bold text-slate-400 hover:text-white"
                            >
                              {showCanvasLogs ? '🙈 ซ่อนประวัติบอท' : '👁️ แสดงประวัติบอท'}
                            </button>
                          </div>

                          {showCanvasLogs && logs.canvas && logs.canvas.length > 0 && (
                            <div className="mt-2.5 p-3 rounded-lg bg-black/80 border border-slate-850 font-mono text-[9.5px] leading-relaxed max-h-[140px] overflow-y-auto text-left scrollbar-thin">
                              {logs.canvas.map((line, idx) => (
                                <div key={idx} className="py-0.5 border-b border-slate-950/20 last:border-b-0 hover:bg-slate-900/40 text-emerald-400 flex gap-2">
                                  <span className="text-slate-600 shrink-0 font-bold">[{idx + 1}]</span>
                                  <span>{line}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="swatches-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {canvasSearchFiltered.length === 0 ? (
                        <div className="text-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/20 w-full col-span-2">
                          <Info className="w-10 h-10 mx-auto mb-3 text-slate-700" />
                          <p className="text-xs font-bold text-slate-400">ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์</p>
                          <p className="text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                            กรุณาไปที่แท็บ <span className="text-cyan-400 font-bold">คลังวัตถุดิบคุณภาพ</span> และกดปุ่ม <span className="text-cyan-400 font-bold">📥 นำเข้าทำรูป</span> หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่
                          </p>
                        </div>
                      ) : (
                        canvasSearchFiltered.map((item) => {
                          const isSelected = canvasSelectedItem?.id === item.id;
                          const copywriting = item.metadata?.copywriting;
                          const hasCopywriting = !!copywriting;
                          const isChecked = canvasSelectedIds.includes(item.id);

                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setCanvasSelectedItem(item);
                                if (copywriting) {
                                  setCanvasCaption(copywriting.caption || '');
                                  setCanvasHighlight(copywriting.highlight || '');
                                  if (copywriting.headline_3line && copywriting.headline_3line.length > 0) {
                                    setCanvasHeadlineLine1(copywriting.headline_3line[0] || '');
                                    setCanvasHeadlineLine2(copywriting.headline_3line[1] || '');
                                    setCanvasHeadlineLine3(copywriting.headline_3line[2] || '');
                                    setCanvasHeadlineMode('triple');
                                  } else {
                                    setCanvasHeadline(copywriting.headlines?.[0] || item.selected_headline || item.title || '');
                                    setCanvasHeadlineMode('single');
                                  }
                                } else {
                                  setCanvasHeadline(item.selected_headline || item.title || '');
                                  setCanvasHeadlineLine1('');
                                  setCanvasHeadlineLine2('');
                                  setCanvasHeadlineLine3('');
                                  setCanvasCaption('');
                                  setCanvasHighlight('');
                                  setCanvasHeadlineMode('triple');
                                }
                                if (item.media_paths && item.media_paths.length > 0) {
                                  setCanvasBgImage(item.media_paths[0]);
                                } else {
                                  setCanvasBgImage('');
                                }
                              }}
                              className={`p-4 rounded-xl border transition-all duration-200 text-left relative cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-slate-900/90 border-cyan-500 shadow-lg shadow-cyan-500/10'
                                  : isChecked
                                    ? 'bg-purple-950/20 border-purple-500/30'
                                    : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40'
                              }`}
                            >
                              <div className="absolute top-3.5 right-3.5" onClick={(e) => {
                                e.stopPropagation();
                                if (canvasSelectedIds.includes(item.id)) {
                                  setCanvasSelectedIds(canvasSelectedIds.filter(id => id !== item.id));
                                } else {
                                  setCanvasSelectedIds([...canvasSelectedIds, item.id]);
                                }
                              }}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {}}
                                  className="w-4 h-4 rounded border-slate-750 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400"
                                />
                              </div>

                              <div className="space-y-2.5 pr-6">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider
                                  ${item.source_type === 'radar' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' : ''}
                                  ${item.source_type === 'rss' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' : ''}
                                  ${item.source_type === 'youtube' ? 'bg-red-500/10 text-red-400 border-red-500/20' : ''}
                                  ${item.source_type === 'github' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : ''}
                                `}>
                                  {item.source_type}
                                </span>

                                <h4 className="text-xs font-bold text-slate-200 line-clamp-2 leading-relaxed">{item.title}</h4>

                                <div className="flex flex-wrap gap-2">
                                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-sans font-bold
                                    ${hasCopywriting ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}
                                  `}>
                                    {hasCopywriting ? '✅ มีบทความ AI แล้ว' : '⏳ รอคิวเขียนบทความ'}
                                  </span>

                                  {item.media_paths && item.media_paths.length > 0 && (
                                    <span className="inline-flex items-center gap-1 bg-slate-900/60 px-2 py-0.5 rounded border border-slate-800 text-[9px] text-slate-400 font-sans">
                                      🖼️ มีเฟรมภาพ ({item.media_paths.length})
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2.5 mt-4 pt-3.5 border-t border-slate-850/60 items-center justify-between" onClick={e => e.stopPropagation()}>
                                <div className="flex gap-1.5">
                                  {hasCopywriting && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setQuickViewCopywriting(item);
                                        setQuickViewTab('post');
                                      }}
                                      className="px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-[9px] font-black transition-all shadow-sm flex items-center gap-1"
                                    >
                                      <Eye className="w-3 h-3 text-cyan-400" />
                                      <span>ดูบทความ</span>
                                    </button>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updatedList = canvasImportedItems.filter(x => x.id !== item.id);
                                      setCanvasImportedItems(updatedList);
                                      if (canvasSelectedItem?.id === item.id) {
                                        setCanvasSelectedItem(null);
                                      }
                                    }}
                                    className="p-1 px-2 text-[9px] font-bold bg-slate-950 text-slate-500 rounded border border-slate-850 hover:bg-red-950/20 hover:text-red-400 hover:border-red-950/30 transition-colors"
                                  >
                                    ลบออก
                                  </button>

                                  <button
                                    type="button"
                                    disabled={runningModule.canvas}
                                    onClick={() => {
                                      const q = new URLSearchParams();
                                      q.append('title', item.title);
                                      q.append('theme_name', canvasTheme);
                                      q.append('ratio', canvasRatio);
                                      q.append('layout', canvasLayout);
                                      q.append('content_id', item.id);
                                      
                                      // Font Configuration Parameters
                                      q.append('font_family', canvasFontFamily);
                                      q.append('font_scale', String(canvasFontScale));
                                      q.append('image_split', String(canvasImageSplit));
                                      q.append('headline_align', canvasHeadlineAlign);
                                      q.append('headline_margin', String(canvasHeadlineMargin));

                                      let headline = item.selected_headline || item.title || '';
                                      let caption = '';
                                      if (isSelected) {
                                        if (canvasHeadlineMode === 'triple') {
                                          if (canvasHeadlineLine1 || canvasHeadlineLine2 || canvasHeadlineLine3) {
                                            q.append('headline_line1', canvasHeadlineLine1);
                                            q.append('headline_line2', canvasHeadlineLine2);
                                            q.append('headline_line3', canvasHeadlineLine3);
                                          }
                                        } else {
                                          headline = canvasHeadline;
                                        }
                                        caption = canvasCaption;
                                      } else if (copywriting) {
                                        if (copywriting.headline_3line && copywriting.headline_3line.length > 0) {
                                          q.append('headline_line1', copywriting.headline_3line[0] || '');
                                          q.append('headline_line2', copywriting.headline_3line[1] || '');
                                          q.append('headline_line3', copywriting.headline_3line[2] || '');
                                        } else {
                                          headline = copywriting.headlines?.[0] || item.selected_headline || item.title || '';
                                        }
                                        caption = copywriting.caption || '';
                                      }

                                      q.append('headline', headline);
                                      if (caption) q.append('caption', caption);

                                      if (isSelected && canvasBgImage) {
                                        q.append('base_image', canvasBgImage);
                                      } else if (item.media_paths && item.media_paths.length > 0) {
                                        q.append('base_image', item.media_paths[0]);
                                      }

                                      const activeHighlight = isSelected ? canvasHighlight : (copywriting?.highlight || '');
                                      if (activeHighlight) q.append('highlight', activeHighlight);

                                      // Append custom branding & overlays parameters
                                      appendCustomParams(q);

                                      runModule('canvas', q.toString());
                                    }}
                                    className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50"
                                  >
                                    <Play className="w-3 h-3 text-slate-100" />
                                    <span>วาดรูปภาพ</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Draw output gallery preview grid */}
                  {contentGraphics.length > 0 && (
                    <div className="w-full mt-6 pt-6 border-t border-slate-800/80 animate-fade-in flex flex-col items-center">
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
                                    const response = await fetch(`${API_BASE}/vault/stock-upload-dropbox`, {
                                      method: 'POST',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${dropboxToken}`
                                      },
                                      body: JSON.stringify({
                                        token: dropboxToken,
                                        folder: dropboxFolder,
                                        graphics: contentGraphics
                                      })
                                    });
                                    const result = await response.json();
                                    if (result.success) {
                                      // Build CSV export
                                      const csvRows = [['Headline', 'Caption', 'Dropbox Link'].join(',')];
                                      const successfulResults = result.results || [];
                                      
                                      for (const resItem of successfulResults) {
                                        const dbItem = canvasImportedItems.find(x => x.id === resItem.content_id);
                                        const headline = dbItem?.selected_headline || dbItem?.title || '';
                                        const caption = dbItem?.metadata?.copywriting?.caption || '';
                                        
                                        const escapeCsv = (val: string) => `"${(val || '').replace(/"/g, '""').replace(/\n/g, '\\n')}"`;
                                        csvRows.push([
                                          escapeCsv(headline),
                                          escapeCsv(caption),
                                          escapeCsv(resItem.shared_link || ''),
                                        ].join(','));
                                      }

                                      const csvContent = '\uFEFF' + csvRows.join('\n');
                                      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                      const url = URL.createObjectURL(blob);
                                      const a = document.createElement('a');
                                      a.href = url;
                                      a.download = `content_export_${new Date().toISOString().slice(0, 10)}.csv`;
                                      a.click();
                                      URL.revokeObjectURL(url);

                                      setDropboxUploadProgress(`✅ อัพโหลดสำเร็จ ${successfulResults.length} ไฟล์ + บันทึก CSV แล้ว!`);
                                      setTimeout(() => setDropboxUploadProgress(''), 5000);
                                    } else {
                                      alert(`❌ อัพโหลดล้มเหลว: ${result.error}`);
                                    }
                                  } catch (err: any) {
                                    alert(`❌ ไม่สามารถเชื่อมต่อ Dropbox: ${err.message}`);
                                  }
                                  setIsUploadingDropbox(false);
                                }}
                                className="flex items-center gap-1 text-[10px] font-black text-cyan-400 hover:text-white bg-slate-900 border border-slate-800 rounded px-2.5 py-1 cursor-pointer transition-all hover:scale-105"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                {isUploadingDropbox ? 'กำลังส่ง...' : '📤 ส่งขึ้น Dropbox (Batch)'}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {dropboxUploadProgress && (
                        <p className="text-[10px] text-yellow-400 font-bold mb-3 self-start animate-pulse">{dropboxUploadProgress}</p>
                      )}

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full">
                        {contentGraphics.map((g, idx) => (
                          <div
                            key={g.id}
                            className="relative overflow-hidden rounded-xl border border-slate-850 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-300 cursor-zoom-in"
                            onClick={() => {
                              const dbItem = canvasImportedItems.find(x => x.id === g.content_id);
                              setLightboxItem(dbItem || null);
                              setLightboxImage(`${API_BASE}/vault/media?path=${encodeURIComponent(g.file_path)}`);
                            }}
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
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {runningModule.canvas && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5 mt-4">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>กำลังเขียนภาพโพสรูปและบันทึกข้อมูลเข้าSQLite...</span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
"""

PORTALS_AND_END_TSX = r"""
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
                borderRadius: '12px',
                background: 'transparent'
              }}
              title="Sync Master Dashboard"
              className="animate-fade-in"
            />
          )}

          {/* TAB 5: PROMPT GENERATION PORTAL */}
          {activeTab === 'prompt-generator' && (
            <PromptGeneratorPortal />
          )}

          {/* TAB 6: VERTICAL VIDEO SUITE PORTAL */}
          {activeTab === 'vertical-video' && (
            <VerticalVideoSuitePortal />
          )}

          {/* TAB 7: QUOTE VIDEO PORTAL */}
          {activeTab === 'quote-video' && (
            <QuoteVideoPortal />
          )}

          {/* TAB 8: AVATAR VERTICAL CLIP PORTAL */}
          {activeTab === 'avatar-video' && (
            <AvatarVerticalClipPortal />
          )}

          {/* TAB 9: FLOW AUTOMATOR / DROPBOX CSV */}
          {activeTab === 'dropbox-csv' && (
            <FlowAutomatorPortal />
          )}

          {/* TAB 10: PODCAST VIDEO PORTAL */}
          {activeTab === 'podcast-clip' && (
            <PodcastVideoPortal />
          )}

        </div>
      </main>

      {/* 🔮 AI COPYWRITING VIEW MODAL */}
      {quickViewCopywriting && quickViewCopywriting.metadata?.copywriting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-2xl bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden glass-panel flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-5 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center">
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

            {/* Tab Selector */}
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
                📢 พาดหัว 3 บรรทัด (3-Line Headlines)
              </button>
            </div>

            {/* Body */}
            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar space-y-4">
              {quickViewTab === 'post' ? (
                <div className="space-y-4">
                  <div className="space-y-2 bg-slate-950/40 p-4 rounded-xl border border-slate-850 relative">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">✍️ คำโฆษณาโพสต์</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(quickViewCopywriting.metadata.copywriting.caption);
                          alert('📋 คัดลอกแคปชั่นโพสต์สำเร็จ!');
                        }}
                        className="text-[10px] font-extrabold text-cyan-400 hover:text-white px-2 py-0.5 bg-slate-900 border border-slate-800 rounded transition-all"
                      >
                        คัดลอกแคปชั่น
                      </button>
                    </div>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed font-medium">
                      {quickViewCopywriting.metadata.copywriting.caption}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">💬 ชุดคอมเม้นท์ดันโพสต์ (FOMO Comments)</span>
                    <div className="grid grid-cols-1 gap-2.5">
                      {quickViewCopywriting.metadata.copywriting.comments.map((comment: string, idx: number) => (
                        <div key={idx} className="bg-slate-950/20 p-3 rounded-lg border border-slate-850/80 text-[11px] leading-relaxed relative">
                          <div className="flex items-center justify-between mb-1 text-[9px] font-black text-slate-400 tracking-wider">
                            <span>💬 เม้นท์ที่ {idx + 1}</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(comment);
                                alert(`📋 คัดลอกคอมเม้นท์ที่ ${idx + 1} สำเร็จ!`);
                              }}
                              className="text-[9px] text-cyan-400 hover:text-white bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5"
                            >
                              คัดลอก
                            </button>
                          </div>
                          <p className="text-slate-300 font-medium">{comment}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {quickViewCopywriting.metadata.copywriting.headline_3line ? (
                    <div className="bg-slate-950/30 p-4 rounded-xl border border-slate-850/80 space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-850/40 pb-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📢 พาดหัว 3 บรรทัดต้นฉบับ (3-Line Headlines)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const h3 = quickViewCopywriting.metadata.copywriting.headline_3line;
                            setCanvasHeadlineLine1(h3[0] || '');
                            setCanvasHeadlineLine2(h3[1] || '');
                            setCanvasHeadlineLine3(h3[2] || '');
                            setCanvasHeadlineMode('triple');
                            alert('🎨 นำพาดหัว 3 บรรทัดเข้าสู่ห้องควบคุมดีไซน์เรียบร้อย!');
                          }}
                          className="text-[10px] font-bold text-purple-400 hover:text-white bg-slate-900 px-2 py-0.5 border border-slate-800 rounded transition-all"
                        >
                          นำไปจัดวางรูป
                        </button>
                      </div>
                      <div className="space-y-2 pt-1">
                        {quickViewCopywriting.metadata.copywriting.headline_3line.map((line: string, idx: number) => (
                          <div key={idx} className="flex gap-3 items-center text-xs font-bold text-slate-200">
                            <span className={`w-2 h-2 rounded-full ${idx === 0 ? 'bg-pink-500 shadow-sm shadow-pink-500/30' : idx === 1 ? 'bg-slate-200' : 'bg-yellow-400 shadow-sm shadow-yellow-400/30'}`} />
                            <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-wide w-14 shrink-0">Line {idx + 1}:</span>
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

      {/* 🖼️ IMAGE LIGHTBOX MODAL */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fade-in"
          style={{ background: 'rgba(2, 6, 23, 0.92)', backdropFilter: 'blur(12px)' }}
          onClick={() => setLightboxImage(null)}
        >
          <div 
            style={{
              maxWidth: '1100px',
              width: '100%',
              maxHeight: '90vh',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%)',
              border: '1px solid rgba(51, 65, 85, 0.5)',
              borderRadius: '20px',
              boxShadow: '0 25px 80px rgba(0, 0, 0, 0.7), 0 0 40px rgba(6, 182, 212, 0.08)',
              display: 'flex',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: Image */}
            <div style={{ flex: '0 0 55%', maxWidth: '55%', background: 'rgba(0, 0, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', position: 'relative' }}>
              <img 
                src={lightboxImage} 
                alt="Render Output" 
                style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: '12px', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)' }} 
              />
            </div>

            {/* Right side: Meta Details */}
            <div style={{ flex: '1', padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', position: 'relative' }}>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(51, 65, 85, 0.6)',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  zIndex: 10
                }}
                title="ปิดหน้าต่าง"
              >
                <X className="w-4 h-4" />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ background: 'linear-gradient(90deg, #06b6d4, #22d3ee)', color: '#0a0a0a', padding: '4px 12px', borderRadius: '8px', fontSize: '10px', fontWeight: 900, letterSpacing: '0.5px' }}>
                  ✨ ผลงานสำเร็จ
                </div>
                <span style={{ fontSize: '10px', color: '#475569' }}>
                  {lightboxItem?.source_type === 'youtube' ? '▶️ YouTube' : '📰 Content'}
                </span>
              </div>

              <div>
                <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>📌 พาดหัว</p>
                <div style={{ background: 'rgba(6, 182, 212, 0.06)', border: '1px solid rgba(34, 211, 238, 0.15)', borderRadius: '10px', padding: '12px 14px' }}>
                  {lightboxItem?.metadata?.copywriting?.headline_3line?.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {lightboxItem?.metadata?.copywriting?.headline_3line?.map((hLine: string, hIdx: number) => (
                        <p key={hIdx} style={{ fontSize: '14px', fontWeight: 800, color: '#f1f5f9', margin: 0, lineHeight: 1.4 }}>
                          {hLine}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '14px', fontWeight: 700, color: '#e2e8f0', margin: 0, lineHeight: 1.4 }}>
                      {lightboxItem?.selected_headline || lightboxItem?.title || 'ไม่มีพาดหัว'}
                    </p>
                  )}
                </div>
              </div>

              <div style={{ flex: 1, minHeight: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <p style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', margin: 0, textTransform: 'uppercase', letterSpacing: '1px' }}>📝 บทความโพส</p>
                  {lightboxItem?.metadata?.copywriting?.caption && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(lightboxItem.metadata.copywriting.caption);
                        alert('📋 คัดลอกแคปชั่นสำเร็จ!');
                      }}
                      style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        color: '#4ade80',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      📋 คัดลอก
                    </button>
                  )}
                </div>
                <div style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid rgba(51, 65, 85, 0.4)', borderRadius: '10px', padding: '14px', maxHeight: '280px', overflowY: 'auto' }}>
                  {lightboxItem?.metadata?.copywriting?.caption ? (
                    <p style={{ fontSize: '12px', color: '#cbd5e1', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {lightboxItem.metadata.copywriting.caption}
                    </p>
                  ) : (
                    <p style={{ fontSize: '11px', color: '#475569', margin: 0, fontStyle: 'italic' }}>
                      ⚠️ ยังไม่มีบทความโพส — กรุณากดเขียนบทความก่อน
                    </p>
                  )}
                </div>
              </div>

              {lightboxItem && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '10px', borderTop: '1px solid rgba(51, 65, 85, 0.3)' }}>
                  {lightboxItem.author_avatar_url && (
                    <img 
                      src={`${API_BASE}/vault/media?path=${encodeURIComponent(lightboxItem.author_avatar_url)}`} 
                      alt="" 
                      style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid rgba(51, 65, 85, 0.5)' }} 
                    />
                  )}
                  <div>
                    <p style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', margin: 0 }}>
                      {lightboxItem.author_name || 'Unknown'}
                    </p>
                    {lightboxItem.author_followers && (
                      <p style={{ fontSize: '8px', color: '#475569', margin: 0 }}>
                        {lightboxItem.metadata?.subscribers_formatted || lightboxItem.author_followers} ผู้ติดตาม
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
}
"""

def main():
    if not os.path.exists(BACKUP_PATH):
        print(f"ERROR: Backup file {BACKUP_PATH} not found.")
        return

    print(f"Reading from {BACKUP_PATH}...")
    with open(BACKUP_PATH, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    # We keep exactly lines 1 to 2668 (which is index 0 to 2667)
    header_lines = lines[:2668]
    
    print(f"Header lines count: {len(header_lines)}")
    header_content = "".join(header_lines)

    # Reconstruct final content
    full_content = header_content + CANVAS_TAB_TSX + PORTALS_AND_END_TSX

    print(f"Writing reconstructed file to {TARGET_PATH}...")
    with open(TARGET_PATH, 'w', encoding='utf-8') as f:
        f.write(full_content)

    print("Reconstruction complete!")

if __name__ == '__main__':
    main()
