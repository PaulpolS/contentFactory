import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Play, 
  RefreshCw, 
  FileText, 
  Link, 
  ExternalLink, 
  Trash2, 
  Check, 
  ThumbsUp, 
  X, 
  AlertCircle, 
  Compass,
  Download,
  Image as ImageIcon
} from 'lucide-react';

interface VaultContent {
  id: string;
  source_type: string;
  title: string;
  selected_headline: string;
  raw_content: string;
  source_url: string;
  author_name?: string;
  author_avatar_url?: string;
  author_followers?: number;
  rating_news?: number;
  rating_evergreen?: number;
  metadata_json?: string;
  media_paths?: string[];
  status: 'scraped' | 'ready_for_design' | 'designed' | 'posted' | 'archived';
  created_at: string;
  updated_at: string;
}

interface ViralReplicatorPortalProps {
  API_BASE: string;
  openRouterKey: string;
  onApprove?: () => void;
}

export default function ViralReplicatorPortal({ API_BASE, openRouterKey, onApprove }: ViralReplicatorPortalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[][]>([]);
  const [limit, setLimit] = useState<number>(5);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [replicatedItems, setReplicatedItems] = useState<VaultContent[]>([]);
  const [loadingItems, setLoadingItems] = useState<boolean>(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState<boolean>(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const sseConnection = useRef<EventSource | null>(null);

  useEffect(() => {
    fetchReplicatedItems();
    return () => {
      if (sseConnection.current) {
        sseConnection.current.close();
      }
    };
  }, []);

  const fetchReplicatedItems = async () => {
    setLoadingItems(true);
    try {
      const res = await fetch(`${API_BASE}/vault/contents?source_type=replicator`);
      const data = await res.json();
      if (data.success) {
        setReplicatedItems(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch replicated items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim());
      const previewRows = lines.slice(0, 4).map(line => {
        // Simple comma split, stripping outer quotes
        return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => 
          cell.replace(/^"|"$/g, '').trim()
        );
      });
      setCsvPreview(previewRows);
    };
    reader.readAsText(file);
  };

  const handleRunReplicator = async () => {
    if (!csvFile) {
      alert('กรุณาอัปโหลดไฟล์ CSV ต้นแบบก่อนครับ');
      return;
    }

    setIsRunning(true);
    setLogs([`[SYSTEM] 🚀 เริ่มต้นกระบวนการ AI Viral Replicator...`]);

    try {
      // 1. Read full CSV content
      const reader = new FileReader();
      reader.onload = async (event) => {
        const content = event.target?.result as string;

        // 2. Upload CSV to temp backend file
        setLogs(prev => [...prev, `[SYSTEM] 📂 อัปโหลดไฟล์ ${csvFile.name} ไปที่ระบบหลังบ้าน...`]);
        const uploadRes = await fetch(`${API_BASE}/vault/upload-temp-csv`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: csvFile.name,
            content
          })
        });

        const uploadData = await uploadRes.json();
        if (!uploadData.success || !uploadData.filename) {
          throw new Error(uploadData.error || 'อัปโหลดไฟล์ไม่สำเร็จ');
        }

        setLogs(prev => [...prev, `[SYSTEM] ✅ ไฟล์บันทึกสำเร็จ: ${uploadData.filename}`]);
        setLogs(prev => [...prev, `[SYSTEM] 🔗 เปิดการเชื่อมต่อ SSE สำหรับบอทค้นหาข้อมูล...`]);

        // 3. Trigger Python Script via SSE
        const keyQuery = openRouterKey ? `&openrouter_key=${encodeURIComponent(openRouterKey)}` : '';
        const eventUrl = `${API_BASE}/orchestrator/run/replicator?csv_path=${encodeURIComponent(uploadData.filePath)}&limit=${limit}${keyQuery}`;
        
        if (sseConnection.current) {
          sseConnection.current.close();
        }

        const source = new EventSource(eventUrl);
        sseConnection.current = source;

        source.onmessage = (e) => {
          setLogs(prev => [...prev, e.data]);
          setTimeout(() => {
            terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);

          if (e.data.includes('Exit Code:')) {
            source.close();
            setIsRunning(false);
            setLogs(prev => [...prev, `[SYSTEM] 🎉 สิ้นสุดกระบวนการทำงานสำเร็จ! กำลังอัปเดตข้อมูลบทความ...`]);
            fetchReplicatedItems();
            if (onApprove) onApprove();
          }
        };

        source.onerror = (err) => {
          console.error('SSE Error:', err);
          setLogs(prev => [...prev, `[ERROR] ❌ เสียการเชื่อมต่อกับสคริปต์สแกนหลังบ้าน`]);
          source.close();
          setIsRunning(false);
        };
      };

      reader.readAsText(csvFile);

    } catch (err: any) {
      console.error(err);
      setLogs(prev => [...prev, `[ERROR] ❌ เกิดข้อผิดพลาด: ${err.message}`]);
      setIsRunning(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/vault/contents/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        fetchReplicatedItems();
        if (onApprove) onApprove();
      }
    } catch (err) {
      console.error('Failed to change status:', err);
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!window.confirm('คุณต้องการลบเรื่องนี้ออกจากคลังชั่วคราวใช่หรือไม่?')) return;
    
    try {
      const res = await fetch(`${API_BASE}/vault/contents/batch-delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [id] })
      });
      const data = await res.json();
      if (data.success) {
        fetchReplicatedItems();
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const clearCsv = () => {
    setCsvFile(null);
    setCsvPreview([]);
  };

  return (
    <div className="space-y-6 text-left">
      
      {/* Configuration & Action Glass Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: CSV Upload Box */}
        <div className={`bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between min-h-[380px] hover:border-slate-700/80 transition-all duration-300 ${
          showLogs ? 'lg:col-span-1' : 'lg:col-span-3'
        }`}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📤 อัปโหลด CSV ไวรัลต้นแบบ</h4>
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-850 text-slate-400 hover:text-white hover:border-slate-700 transition-all font-bold flex items-center gap-1 cursor-pointer"
                >
                  {showLogs ? '👁️ ซ่อน Logs' : '👁️ แสดง Logs'}
                </button>
              </div>
              {csvFile && (
                <button 
                  onClick={clearCsv}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  title="ล้างไฟล์"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {!csvFile ? (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-850 hover:border-pink-500/50 rounded-xl cursor-pointer p-8 bg-slate-950/20 hover:bg-slate-900/10 transition-all group min-h-[220px]">
                <Upload className="w-8 h-8 text-slate-400 group-hover:text-pink-400 group-hover:scale-110 transition-transform duration-300" />
                <span className="text-xs font-bold text-slate-300 mt-3 group-hover:text-white">เลือกไฟล์ .csv โพสต์ไวรัลของคุณ</span>
                <span className="text-[10px] text-slate-500 mt-1">ตรวจคอลัมน์อัตโนมัติ (Resilient Engine)</span>
                <input 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 bg-slate-950/60 rounded-xl border border-slate-900">
                  <FileText className="w-5 h-5 text-pink-400 shrink-0" />
                  <div className="truncate text-left">
                    <div className="text-xs font-bold text-white truncate">{csvFile.name}</div>
                    <div className="text-[10px] text-slate-500">{(csvFile.size / 1024).toFixed(1)} KB</div>
                  </div>
                </div>

                {/* CSV Preview Table */}
                {csvPreview.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 block uppercase">ตัวอย่างข้อมูลแถวแรก</span>
                    <div className="bg-slate-950/60 border border-slate-900 rounded-lg overflow-hidden text-[9px] max-h-[140px] overflow-y-auto">
                      <table className="w-full text-left border-collapse">
                        <tbody>
                          {csvPreview.map((row, idx) => (
                            <tr key={idx} className={idx === 0 ? "bg-slate-900/60 font-bold border-b border-slate-850" : "border-b border-slate-900 last:border-0"}>
                              {row.slice(0, 3).map((cell, cidx) => (
                                <td key={cidx} className="p-1.5 truncate max-w-[90px] text-slate-400">{cell}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-900/60">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-400">จำนวนที่ขุดค้นเรื่องใหม่</label>
              <input 
                type="number"
                value={limit}
                onChange={e => setLimit(Math.max(1, Number(e.target.value)))}
                className="w-16 h-7 bg-slate-900/60 border border-slate-800 text-white rounded text-xs font-bold text-center focus:outline-none focus:border-pink-500"
                min={1}
                max={20}
              />
            </div>
            <button
              onClick={handleRunReplicator}
              disabled={isRunning || !csvFile}
              className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all
                ${isRunning || !csvFile
                  ? 'bg-slate-900 text-slate-500 border border-slate-850 cursor-not-allowed'
                  : 'bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg shadow-pink-500/10 hover:shadow-pink-500/20 active:scale-95 cursor-pointer'
                }`}
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>กำลังโคลนไอเดีย...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>เริ่มบอทขุดหาเรื่องคล้ายกัน</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Live SSE Log Terminal */}
        <div className={`bg-slate-950/40 p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between min-h-[380px] ${
          showLogs ? 'lg:col-span-2' : 'hidden'
        }`}>
          <div className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="flex items-center justify-between border-b border-slate-900 pb-2">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-pink-500 animate-pulse' : 'bg-slate-600'}`}></div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">📡 TERMINAL LIVE LOGS (สแกนระบบ)</h4>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setShowLogs(false)}
                  className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  👁️ ซ่อน
                </button>
                <span className="text-slate-800 text-[10px]">|</span>
                <button 
                  onClick={() => setLogs([`[SYSTEM] ล้างหน้าล็อก Logs เรียบร้อย.`])}
                  className="text-[10px] font-bold text-slate-500 hover:text-white transition-colors cursor-pointer"
                >
                  ล้างจอ
                </button>
              </div>
            </div>

            <div className="flex-1 min-h-[220px] max-h-[260px] overflow-y-auto bg-slate-950 border border-slate-900 rounded-xl p-4 font-mono text-[10px] text-slate-300 custom-scrollbar space-y-1">
              {logs.length === 0 ? (
                <div className="text-slate-600 italic">บอทยังไม่ได้เริ่มต้นทำงาน. อัปโหลด CSV ด้านซ้ายแล้วกดปุ่มสตาร์ทเพื่อเริ่มการค้นหา...</div>
              ) : (
                logs.map((log, idx) => {
                  let colorClass = "text-slate-300";
                  if (log.includes("[WARN]")) colorClass = "text-amber-400";
                  else if (log.includes("[ERROR]")) colorClass = "text-red-400";
                  else if (log.includes("[SUCCESS]")) colorClass = "text-emerald-400 text-bold";
                  else if (log.includes("[SYSTEM]")) colorClass = "text-cyan-400 font-bold";
                  
                  return (
                    <div key={idx} className={`${colorClass} leading-relaxed break-all`}>
                      {log}
                    </div>
                  );
                })
              )}
              <div ref={terminalEndRef} />
            </div>
            
            <p className="text-[10px] text-slate-500 italic mt-1">
              * ระบบจะนำโพสต์ใน CSV ไปแยกแยะแก่นเรื่อง วิเคราะห์คีย์เวิร์ด เจาะขุดบทความใหม่ทางเว็บไซต์ แล้วสุ่มแกะภาพประกอบและดึงเรื่องราวมาแปลลง SQLite ทันที
            </p>
          </div>
        </div>
      </div>

      {/* Replicated Output Results Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-900 pb-3">
          <div>
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-pink-400" />
              เรื่องราวสืบค้นใหม่ที่ใกล้เคียง ({replicatedItems.length} รายการ)
            </h3>
            <p className="text-xs text-slate-400">บทความความสำเร็จเรื่องใหม่ที่ AI กรองแล้วว่าไม่ซ้ำ และแปลสรุปเรียบร้อยแล้ว</p>
          </div>
          <button 
            onClick={fetchReplicatedItems}
            disabled={loadingItems}
            className="p-1.5 rounded-lg border border-slate-800 bg-slate-950/40 hover:bg-slate-900 text-slate-300 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingItems ? 'animate-spin' : ''}`} />
            รีเฟรช
          </button>
        </div>

        {loadingItems ? (
          <div className="p-12 text-center text-slate-500 font-bold text-sm">
            <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-pink-500" />
            กำลังโหลดข้อมูลบทความที่วิเคราะห์สำเร็จ...
          </div>
        ) : replicatedItems.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-slate-900 bg-slate-950/20 rounded-2xl italic text-xs">
            ยังไม่มีข้อมูลบทความที่ถูกค้นหาในระบบ คุณสามารถเริ่มสแกนได้โดยการอัปโหลด CSV ด้านบนเพื่อค้นเรื่องราวใหม่ๆ
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {replicatedItems.map((item) => {
              const metadata = item.metadata_json ? JSON.parse(item.metadata_json) : {};
              const hasCover = item.media_paths && item.media_paths.length > 0;
              const coverUrl = hasCover 
                ? `${API_BASE}/vault/media?path=${encodeURIComponent(item.media_paths![0])}` 
                : '';
                
              return (
                <div 
                  key={item.id}
                  onMouseEnter={() => setHoveredItem(item.id)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`relative bg-slate-950/30 border rounded-2xl p-5 flex flex-col justify-between gap-4 transition-all duration-300 hover:scale-[1.01]
                    ${item.status === 'ready_for_design' 
                      ? 'border-emerald-500/40 bg-emerald-950/5' 
                      : 'border-slate-800/80 hover:border-pink-500/40'}`}
                >
                  <div className="space-y-3">
                    
                    {/* Header: Title and Scores */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2 py-0.5 rounded-md">
                            {item.author_name || 'Web Source'}
                          </span>
                          {metadata.tags && metadata.tags.map((tag: string, tidx: number) => (
                            <span key={tidx} className="text-[9px] font-bold bg-slate-900 text-slate-400 px-1.5 py-0.5 rounded">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <h4 className="text-sm font-black text-white leading-snug line-clamp-2 mt-1">
                          {item.selected_headline}
                        </h4>
                      </div>
                      
                      {/* Quality Score Badges */}
                      <div className="flex gap-1 shrink-0">
                        <div className="flex flex-col items-center bg-cyan-950/30 border border-cyan-500/20 px-1.5 py-0.5 rounded-lg text-center" title="คะแนนกระแสข่าว">
                          <span className="text-[8px] text-cyan-400 font-extrabold uppercase">News</span>
                          <span className="text-[11px] text-cyan-400 font-black">{item.rating_news || 0}</span>
                        </div>
                        <div className="flex flex-col items-center bg-indigo-950/30 border border-indigo-500/20 px-1.5 py-0.5 rounded-lg text-center" title="คะแนนอมตะ">
                          <span className="text-[8px] text-indigo-400 font-extrabold uppercase">Ever</span>
                          <span className="text-[11px] text-indigo-400 font-black">{item.rating_evergreen || 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Layout with Image preview + Summary */}
                    <div className="flex gap-4">
                      {hasCover ? (
                        <div className="w-24 h-24 rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shrink-0 aspect-square">
                          <img 
                            src={coverUrl} 
                            alt="Cover" 
                            className="w-full h-full object-cover" 
                            onError={(e) => {
                              // Hide image if broken link
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-xl border border-dashed border-slate-850 bg-slate-950/60 flex flex-col items-center justify-center text-slate-600 shrink-0 aspect-square">
                          <ImageIcon className="w-5 h-5 mb-1" />
                          <span className="text-[8px] font-bold">ไม่มีรูปปก</span>
                        </div>
                      )}
                      
                      <div className="space-y-1.5 text-left flex-1 min-w-0">
                        <p className="text-xs text-slate-300 leading-relaxed line-clamp-4">
                          {item.raw_content}
                        </p>
                        {metadata.original_title && (
                          <div className="text-[9px] text-slate-500 truncate" title={metadata.original_title}>
                            ต้นฉบับ: {metadata.original_title}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action row */}
                  <div className="flex items-center justify-between border-t border-slate-900/60 pt-3">
                    <a 
                      href={item.source_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[10px] font-bold text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      <Link className="w-3.5 h-3.5 text-slate-500" />
                      <span>เปิดอ่านบทความต้นฉบับ</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg border border-slate-850 bg-transparent text-slate-500 hover:text-rose-400 hover:border-rose-500/30 transition-all cursor-pointer"
                        title="ลบออกชั่วคราว"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {item.status === 'ready_for_design' ? (
                        <button
                          onClick={() => handleStatusChange(item.id, 'scraped')}
                          className="px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <ThumbsUp className="w-3 h-3" />
                          <span>อนุมัติแล้ว</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleStatusChange(item.id, 'ready_for_design')}
                          className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:border-emerald-500/50 hover:bg-emerald-500/10 hover:text-emerald-400 font-bold text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Check className="w-3 h-3" />
                          <span>กดอนุมัติเข้าคลัง</span>
                        </button>
                      )}
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
