with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update ✍️ แก้ไขตัวโพส Header to include "เขียนโพสต์ด้วย AI" button
target_caption_header = """                                    {/* 1. Post Caption Editor */}
                                    <div className="space-y-1.5">
                                      <label className="text-[11px] font-bold text-slate-300 block">
                                        ✍️ แก้ไขตัวโพส (Post Caption / แคปชั่น)
                                      </label>"""

replacement_caption_header = """                                    {/* 1. Post Caption Editor */}
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
                                        </button>
                                      </div>"""

if target_caption_header in content:
    content = content.replace(target_caption_header, replacement_caption_header)
    print("Injected AI Caption generation button!")

# 2. Update 📢 ตัวเลือกพาดหัว Header to include "เขียนพาดหัวด้วย AI" button
target_headline_header = """                                    {/* 2. Headline Selector & Editor */}
                                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850/65">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="text-[11px] font-bold text-cyan-400 block">
                                          📢 ตัวเลือกพาดหัวที่มีให้เลือก (Headline Options)
                                        </label>"""

replacement_headline_header = """                                    {/* 2. Headline Selector & Editor */}
                                    <div className="space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850/65">
                                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                          <label className="text-[11px] font-bold text-cyan-400 block">
                                            📢 ตัวเลือกพาดหัวที่มีให้เลือก (Headline Options)
                                          </label>
                                          <button
                                            type="button"
                                            disabled={generatingCopywriting}
                                            onClick={() => handleGenerateCopywritingForItem(item)}
                                            className="px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-500/10"
                                          >
                                            {generatingCopywriting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 animate-pulse text-cyan-200" />}
                                            <span>✨ AI เขียนพาดหัวใหม่</span>
                                          </button>
                                        </div>"""

if target_headline_header in content:
    content = content.replace(target_headline_header, replacement_headline_header)
    print("Injected AI Headline generation button!")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("AI buttons injection complete!")
