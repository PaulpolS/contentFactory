with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Define handleBulkGenerateCopywriting function
target_func = """  // One-click AI Copywriting Details Suite Generator (Post Caption, Selective Headlines, 3 comments, 3-line headline)
  const handleGenerateCopywriting = async () => {
    if (!canvasSelectedItem) {
      alert("⚠️ กรุณาเลือกหัวข้อวัตถุดิบลักษณะการ์ดด้านล่างสุดก่อนกดเขียนบทความครับ");
      return;
    }
    await handleGenerateCopywritingForItem(canvasSelectedItem);
  };"""

replacement_func = """  // One-click AI Copywriting Details Suite Generator (Post Caption, Selective Headlines, 3 comments, 3-line headline)
  const handleGenerateCopywriting = async () => {
    if (!canvasSelectedItem) {
      alert("⚠️ กรุณาเลือกหัวข้อวัตถุดิบลักษณะการ์ดด้านล่างสุดก่อนกดเขียนบทความครับ");
      return;
    }
    await handleGenerateCopywritingForItem(canvasSelectedItem);
  };

  // Bulk AI Copywriting Suite Generator for all selected items
  const handleBulkGenerateCopywriting = async () => {
    if (canvasSelectedIds.length === 0) {
      alert("⚠️ กรุณาเลือกหัวข้อไอเดียคอนเทนต์ที่ต้องการเขียนบทความอย่างน้อย 1 รายการก่อนครับ");
      return;
    }

    setGeneratingCopywriting(true);
    let successCount = 0;
    try {
      for (let i = 0; i < canvasSelectedIds.length; i++) {
        const id = canvasSelectedIds[i];
        const item = (canvasShowAll ? canvasAllItems : canvasImportedItems).find(x => x.id === id);
        if (!item) continue;

        console.log(`[BULK] Generating AI copywriting for item ${i+1}/${canvasSelectedIds.length}: ${item.title}`);
        const response = await fetch(`${API_BASE}/vault/contents/${item.id}/generate-copywriting`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ length: canvasArticleLength })
        });
        const resData = await response.json();
        if (resData.success) {
          successCount++;
          const updatedItem = {
            ...item,
            metadata: {
              ...item.metadata,
              copywriting: resData.data
            }
          };

          // Update state lists immediately to reflect AI results in real-time
          setCanvasImportedItems(prev => prev.map(x => x.id === updatedItem.id ? updatedItem : x));
          setCanvasAllItems(prev => prev.map(x => x.id === updatedItem.id ? updatedItem : x));

          // Also update selected item if currently focused
          if (canvasSelectedItem && canvasSelectedItem.id === item.id) {
            setCanvasSelectedItem(updatedItem);
          }
        }
      }

      // Sync and reload DB
      fetchVaultData();
      fetchApprovedItems();

      alert(`✨ ประมวลผลและเขียนบทความจำลองพาดหัวด้วย AI สำเร็จทั้งหมด ${successCount}/${canvasSelectedIds.length} รายการ!`);
    } catch (err) {
      console.error("Bulk copywriting generation error:", err);
      alert("⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อเพื่อประมวลผลคำโฆษณาแบบกลุ่ม");
    } finally {
      setGeneratingCopywriting(false);
    }
  };"""

if target_func in content:
    content = content.replace(target_func, replacement_func)
    print("Injected handleBulkGenerateCopywriting function!")

# 2. Inject the bulk generation button below the search bar container
target_search_row = """                      <div className="flex gap-2">
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
                            onClick={() => setCanvasSearchQuery('')}
                            className="px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                          >
                            ล้าง
                          </button>
                        )}
                      </div>"""

replacement_search_row = """                      <div className="flex gap-2">
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
                            onClick={() => setCanvasSearchQuery('')}
                            className="px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white"
                          >
                            ล้าง
                          </button>
                        )}
                      </div>

                      {/* Bulk AI Copywriting Generation Button */}
                      {canvasSelectedIds.length > 0 && (
                        <div className="pt-1.5 pb-2 animate-fade-in w-full">
                          <button
                            type="button"
                            disabled={generatingCopywriting}
                            onClick={handleBulkGenerateCopywriting}
                            className={`w-full py-3 px-4 rounded-xl border font-black text-xs flex items-center justify-center gap-2.5 transition-all shadow-xl active:scale-[0.99] disabled:opacity-50 ${
                              generatingCopywriting
                                ? 'bg-purple-900/20 border-purple-800/40 text-purple-400 cursor-wait'
                                : 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white border-purple-500 hover:scale-[1.01] shadow-purple-500/20 animate-pulse'
                            }`}
                          >
                            {generatingCopywriting ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
                                <span>กำลังใช้ AI เขียนบทความและจำลองพาดหัวแบบกลุ่ม... ({canvasSelectedIds.length} รายการ)</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4 text-purple-200" />
                                <span>✍️ สั่ง AI เขียนบทความและพาดหัวทั้งหมดที่เลือกไว้แบบกลุ่มเดียว ({canvasSelectedIds.length} รายการ)</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}"""

if target_search_row in content:
    content = content.replace(target_search_row, replacement_search_row)
    print("Injected bulk AI spawner button!")

with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Bulk AI modifications complete!")
