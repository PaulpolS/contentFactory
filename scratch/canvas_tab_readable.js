,
  JSX(`span`,{
    className:`text-slate-200`,
    children:e.text})]},t))}):e.raw_content||`ไม่มีข้อมูลเนื้อหาดิบ`})]})]})})})]},e.id)})})]})})]})})]}),e===`canvas`&&
  JSXS(`div`,{
    className:`space-y-6 w-full`,
    children:[
  JSXS(`div`,{
    className:`glass-panel p-6`,
    children:[
  JSXS(`div`,{
    className:`flex flex-wrap items-center justify-between gap-4 mb-4 border-b border-slate-850 pb-2.5`,
    children:[
  JSX(`h2`,{
    className:`text-md font-bold text-cyan-400 flex items-center gap-2`,
    children:`⚙️ ตั้งค่าพื้นฐาน`}),
  JSXS(`div`,{
    className:`flex items-center gap-2`,
    children:[
  JSX(`button`,{
    onClick:async()=>{br(!0),vr([]);try{let e=localStorage.getItem(`openrouter_key`)?.trim();if(!e){vr([{label:`ไม่พบ API Key`,keyPreview:`-`,valid:!1,balance:`$0`,usage:`$0`,error:`กรุณาตั้งค่า API Key ในหน้าตั้งค่าระบบ`}]),br(!1);return}let t=await Dr(e),n=String(e||``);vr([{label:`OpenRouter API Key`,keyPreview:n.slice(0,8)+`...`+n.slice(-4),valid:t.valid,balance:t.balanceFormatted,usage:`$${(Number(t.usage)||0).toFixed(4)}`,isFreeTier:t.isFreeTier,keyApiLabel:t.keyLabel,error:t.error}])}catch(e){vr([{label:`Error`,keyPreview:`-`,valid:!1,balance:`$0`,usage:`$0`,error:e.message}])}br(!1)},disabled:yr,
    className:`px-3 py-1.5 rounded-lg bg-emerald-800/85 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50`,
    children:yr?`⚙️ กำลังตรวจ...`:`💰 เช็คเครดิต API`}),
  JSX(`button`,{
    onClick:async()=>{try{let e=localStorage.getItem(`openrouter_key`)?.trim();if(!e){vr([{label:`ไม่พบ API Key`,keyPreview:`-`,valid:!1,balance:`-`,usage:`-`,error:`ไม่พบ Key`}]);return}let t=`google/gemini-2.5-flash`;vr([{label:`🧪 กำลังทดสอบ ${t}...`,keyPreview:String(e||``).slice(0,8)+`...`+String(e||``).slice(-4),valid:!0,balance:`กำลังทดสอบ...`,usage:`-`}]);let n=await fetch(`https://openrouter.ai/api/v1/chat/completions`,{method:`POST`,headers:{"Content-Type":`application/json`,Authorization:`Bearer ${e}`,"HTTP-Referer":window.location.origin},body:JSON.stringify({model:t,messages:[{role:`user`,content:`ตอบแค่คำว่า "OK"`}],max_tokens:5})}),r=await n.json();if(n.ok&&!r.error)vr([{label:`✅ ทดสอบ ${t} สำเร็จ!`,keyPreview:String(e||``).slice(0,8)+`...`+String(e||``).slice(-4),valid:!0,balance:`ตอบกลับ: ${r.choices?.[0]?.message?.content||`OK`}`,usage:`Model: ${r.model||t}`}]);else{let i=r.error?.message||JSON.stringify(r.error)||`HTTP ${n.status}`;vr([{label:`❌ ทดสอบ ${t} ล้มเหลว`,keyPreview:String(e||``).slice(0,8)+`...`+String(e||``).slice(-4),valid:!1,balance:`-`,usage:`-`,error:i}])}}catch(e){vr([{label:`Error`,keyPreview:`-`,valid:!1,balance:`-`,usage:`-`,error:e.message}])}},
    className:`px-3 py-1.5 rounded-lg bg-blue-800/85 hover:bg-blue-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5`,
    children:`🧪 ทดสอบ API`})]})]}),_r.length>0&&
  JSXS(`div`,{
    className:`mb-6 p-4 rounded-xl border border-slate-800 bg-slate-900/60`,
    children:[
  JSXS(`div`,{
    className:`flex justify-between items-center mb-3`,
    children:[
  JSX(`h3`,{
    className:`text-xs font-bold text-cyan-400`,
    children:`🔑 ผลตรวจวิเคราะห์ OpenRouter API Key`}),
  JSX(`button`,{
    onClick:()=>vr([]),
    className:`text-[10px] text-slate-500 hover:text-slate-300`,
    children:`✕ ปิดแผง`})]}),
  JSX(`div`,{
    className:`space-y-2`,
    children:_r.map((e,t)=>
  JSXS(`div`,{
    className:`p-3 rounded-lg border text-xs ${e.valid?`bg-emerald-950/20 border-emerald-500/20`:`bg-red-950/20 border-red-500/20`}`,
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-2 font-bold mb-2`,
    children:[
  JSX(`span`,{
    children:e.valid?`✅`:`❌`}),
  JSX(`span`,{
    className:e.valid?`text-emerald-400`:`text-red-400`,
    children:e.label})]}),
  JSXS(`div`,{
    className:`text-[11px] text-slate-400 space-y-1 ml-6`,
    children:[
  JSXS(`div`,{
    children:[`Key Preview: `,
  JSX(`span`,{
    className:`text-slate-300 font-mono`,
    children:e.keyPreview})]}),e.valid?
  JSXS(Y.Fragment,{
    children:[e.isFreeTier&&
  JSXS(`div`,{
    children:[`⚠️ Tier: `,
  JSX(`span`,{
    className:`text-amber-400 font-bold`,
    children:`Free Tier (จำกัดการเรียกใช้งาน)`})]}),!e.isFreeTier&&
  JSXS(`div`,{
    children:[`Tier: `,
  JSX(`span`,{
    className:`text-emerald-400 font-semibold`,
    children:`Paid Tier (ใช้งานปกติ)`})]}),
  JSXS(`div`,{
    children:[`ยอดเงินคงเหลือ: `,
  JSX(`span`,{
    className:`text-emerald-400 font-bold`,
    children:e.balance})]}),
  JSXS(`div`,{
    children:[`ใช้งานไปแล้ว: `,
  JSX(`span`,{
    className:`text-yellow-400 font-semibold`,
    children:e.usage})]})]}):
  JSXS(`div`,{
    className:`text-red-400`,
    children:[`ข้อผิดพลาด: `,e.error]})]})]}))})]}),
  JSXS(`div`,{style:{marginBottom:`20px`,padding:`14px`,background:`rgba(15,23,42,0.4)`,borderRadius:`12px`,border:`1px solid rgba(51,65,85,0.3)`},
    children:[
  JSX(`p`,{style:{fontSize:`11px`,fontWeight:800,color:`#38bdf8`,marginBottom:`10px`,display:`flex`,alignItems:`center`,gap:`6px`},
    children:`☁️ Dropbox Integration`}),
  JSXS(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`10px`},
    children:[
  JSXS(`div`,{
    children:[
  JSX(`label`,{style:{fontSize:`9px`,fontWeight:700,color:`#64748b`,display:`block`,marginBottom:`4px`},
    children:`🔑 Dropbox Access Token`}),
  JSX(`input`,{type:`password`,
    value:$n,
    onChange:e=>{er(e.target.value),localStorage.setItem(`dropbox_token`,e.target.value)},placeholder:`sl.xxxxxxxx...`,style:{width:`100%`,background:`rgba(15,23,42,0.8)`,border:`1px solid rgba(51,65,85,0.5)`,borderRadius:`8px`,padding:`8px 10px`,fontSize:`10px`,color:`#e2e8f0`,outline:`none`}})]}),
  JSXS(`div`,{
    children:[
  JSX(`label`,{style:{fontSize:`9px`,fontWeight:700,color:`#64748b`,display:`block`,marginBottom:`4px`},
    children:`📁 Dropbox Folder Path`}),
  JSX(`input`,{type:`text`,
    value:tr,
    onChange:e=>{nr(e.target.value),localStorage.setItem(`dropbox_folder`,e.target.value)},placeholder:`/ContentFactory/exports`,style:{width:`100%`,background:`rgba(15,23,42,0.8)`,border:`1px solid rgba(51,65,85,0.5)`,borderRadius:`8px`,padding:`8px 10px`,fontSize:`10px`,color:`#e2e8f0`,outline:`none`}})]})]})]}),
  JSX(`div`,{
    className:`grid grid-cols-1 md:grid-cols-2 gap-8 items-start`,
    children:
  JSXS(`div`,{
    className:`space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60`,
    children:[
  JSXS(`div`,{
    className:`space-y-1.5`,
    children:[
  JSX(`label`,{
    className:`text-[11px] font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider`,
    children:
  JSX(`span`,{
    children:`📝 สไตล์การเขียนคำโฆษณา (AI Copywriting Tone & Styles)`})}),
  JSX(`select`,{
    value:sr,
    onChange:e=>cr(e.target.value),
    className:`glass-input h-10 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer w-full`,
    children:on.map(e=>
  JSX(`option`,{
    value:e.id,
    children:e.name},e.id))})]}),
  JSX(`div`,{
    className:`border-t border-slate-850/40 my-2 pt-2`}),
  JSXS(`div`,{
    className:`flex items-center justify-between pb-2 border-b border-slate-850/40`,
    children:[
  JSX(`label`,{
    className:`text-xs font-semibold text-slate-300 block`,
    children:`🏷️ ตราประทับ (Logo)`}),
  JSXS(`label`,{
    className:`flex items-center gap-1.5 cursor-pointer select-none`,
    children:[
  JSX(`input`,{type:`checkbox`,checked:It,
    onChange:e=>Lt(e.target.checked),
    className:`w-4 h-4 rounded border-slate-750 text-cyan-500 accent-cyan-400 bg-slate-950/80 cursor-pointer`}),
  JSX(`span`,{
    className:`text-[10px] font-bold text-slate-300`,
    children:`แสดงโลโก้บนภาพ`})]})]}),
  JSXS(`button`,{
    onClick:()=>{document.getElementById(`canvas-logo-uploader-basic`)?.click()},style:{width:`100%`,background:`linear-gradient(90deg, #f97316, #f59e0b, #f97316)`,color:`#0a0a0a`,border:`2px solid #fb923c`,padding:`8px 12px`,borderRadius:`10px`,boxShadow:`0 0 15px rgba(249,115,22,0.4)`,fontWeight:900,fontSize:`11px`,cursor:`pointer`,transition:`all 0.3s ease`,display:`flex`,alignItems:`center`,justifyContent:`center`,gap:`6px`},
    children:[
  JSX(xe,{
    className:`w-4 h-4`}),
  JSX(`span`,{
    children:`🔗 อัพโหลดโลโก้ใหม่`})]}),
  JSX(`input`,{type:`file`,id:`canvas-logo-uploader-basic`,accept:`image/*`,
    onChange:Mr,style:{display:`none`}}),Et.length>0&&
  JSXS(`div`,{style:{padding:`8px`,background:`rgba(15,23,42,0.4)`,borderRadius:`8px`,border:`1px solid rgba(51,65,85,0.3)`},
    children:[
  JSX(`p`,{style:{fontSize:`10px`,color:`#64748b`,fontWeight:700,marginBottom:`8px`},
    children:`📁 โลโก้ที่บันทึกไว้ — คลิกเพื่อเลือก:`}),
  JSX(`div`,{style:{display:`flex`,flexWrap:`wrap`,gap:`8px`},
    children:Et.map(e=>{let t=Ot===e.url;return
  JSXS(`div`,{style:{position:`relative`},
    className:`group`,
    children:[
  JSX(`button`,{type:`button`,
    onClick:()=>{kt(e.url),Bt&&localStorage.setItem(`canvas_logo_url`,e.url)},style:{width:`48px`,height:`48px`,borderRadius:`10px`,border:t?`2px solid #22d3ee`:`2px solid rgba(51,65,85,0.5)`,background:t?`rgba(34,211,238,0.08)`:`rgba(15,23,42,0.6)`,padding:`4px`,cursor:`pointer`,transition:`all 0.15s ease`,display:`flex`,alignItems:`center`,justifyContent:`center`,boxShadow:t?`0 0 8px rgba(34,211,238,0.3)`:`none`},title:e.name,
    children:
  JSX(`img`,{src:`${$}${e.url}`,alt:e.name,style:{width:`100%`,height:`100%`,objectFit:`contain`}})}),
  JSX(`button`,{type:`button`,
    onClick:t=>{t.stopPropagation(),Nr(e.name)},
    className:`absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-700`,title:`ลบโลโก้นี้`,
    children:
  JSX(Ee,{
    className:`w-3 h-3`})}),t&&
  JSX(`div`,{style:{position:`absolute`,bottom:`-2px`,left:`50%`,transform:`translateX(-50%)`,fontSize:`7px`,fontWeight:900,color:`#22d3ee`,whiteSpace:`nowrap`},
    children:`✓ เลือก`})]},e.name)})})]}),It&&
  JSXS(`div`,{style:{padding:`10px`,background:`rgba(6,182,212,0.04)`,borderRadius:`8px`,border:`1px solid rgba(34,211,238,0.15)`,display:`flex`,flexDirection:`column`,gap:`10px`},
    children:[
  JSX(`p`,{style:{fontSize:`10px`,fontWeight:700,color:`#67e8f9`,margin:0},
    children:`⚙️ ตั้งค่าโลโก้`}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`4px`},
    children:[
  JSX(`span`,{style:{fontSize:`9px`,fontWeight:600,color:`#94a3b8`},
    children:`📏 ขนาด`}),
  JSXS(`span`,{style:{fontSize:`9px`,fontWeight:800,color:`#e2e8f0`},
    children:[At,`%`]})]}),
  JSX(`input`,{type:`range`,min:`3`,max:`30`,
    value:At,
    onChange:e=>jt(Number(e.target.value)),style:{width:`100%`,accentColor:`#22d3ee`,height:`4px`}})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`4px`},
    children:[
  JSX(`span`,{style:{fontSize:`9px`,fontWeight:600,color:`#94a3b8`},
    children:`↔️ ระยะขอบแนวนอน`}),
  JSXS(`span`,{style:{fontSize:`9px`,fontWeight:800,color:`#e2e8f0`},
    children:[Mt,`px`]})]}),
  JSX(`input`,{type:`range`,min:`0`,max:`80`,
    value:Mt,
    onChange:e=>Nt(Number(e.target.value)),style:{width:`100%`,accentColor:`#22d3ee`,height:`4px`}})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{style:{display:`flex`,justifyContent:`space-between`,alignItems:`center`,marginBottom:`4px`},
    children:[
  JSX(`span`,{style:{fontSize:`9px`,fontWeight:600,color:`#94a3b8`},
    children:`↕️ ระยะขอบแนวตั้ง`}),
  JSXS(`span`,{style:{fontSize:`9px`,fontWeight:800,color:`#e2e8f0`},
    children:[Pt,`px`]})]}),
  JSX(`input`,{type:`range`,min:`0`,max:`80`,
    value:Pt,
    onChange:e=>Ft(Number(e.target.value)),style:{width:`100%`,accentColor:`#22d3ee`,height:`4px`}})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{style:{fontSize:`9px`,fontWeight:600,color:`#94a3b8`,display:`block`,marginBottom:`6px`},
    children:`📍 ตำแหน่งมุม`}),
  JSX(`div`,{style:{display:`grid`,gridTemplateColumns:`1fr 1fr`,gap:`4px`},
    children:[[`top-left`,`↖ ซ้ายบน`],[`top-right`,`↗ ขวาบน`],[`bottom-left`,`↙ ซ้ายล่าง`],[`bottom-right`,`↘ ขวาล่าง`]].map(([e,t])=>
  JSX(`button`,{type:`button`,
    onClick:()=>zt(e),style:{padding:`5px 8px`,borderRadius:`6px`,fontSize:`9px`,fontWeight:Rt===e?900:600,border:Rt===e?`1.5px solid #22d3ee`:`1px solid rgba(51,65,85,0.5)`,background:Rt===e?`rgba(34,211,238,0.12)`:`rgba(15,23,42,0.4)`,color:Rt===e?`#67e8f9`:`#94a3b8`,cursor:`pointer`,transition:`all 0.15s ease`},
    children:t},e))})]})]})]})}),
  JSXS(`div`,{
    className:`space-y-4 bg-slate-900/20 p-4 rounded-xl border border-slate-850/60`,
    children:[
  JSXS(`div`,{
    className:`space-y-1.5`,
    children:[
  JSX(`label`,{
    className:`block text-xs font-semibold text-slate-400 mb-2`,
    children:`📐 สเกลสัดส่วนโพสต์ (Aspect Ratio)`}),
  JSXS(`div`,{
    className:`relative`,
    children:[
  JSXS(`select`,{
    className:`glass-input h-11 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer pl-11`,
    value:ke,
    onChange:e=>Ae(e.target.value),
    children:[
  JSX(`option`,{
    value:`1:1`,
    children:`⬜ 1:1 — สี่เหลี่ยมจัตุรัส (Instagram / Facebook Post)`}),
  JSX(`option`,{
    value:`4:5`,
    children:`📱 4:5 — แนวตั้งสั้น (Instagram Portrait / Ads)`}),
  JSX(`option`,{
    value:`4:3`,
    children:`🖥️ 4:3 — แนวนอนสั้น (Presentation / Blog)`}),
  JSX(`option`,{
    value:`16:9`,
    children:`🎬 16:9 — แนวนอนกว้าง (YouTube Thumbnail / Twitter)`}),
  JSX(`option`,{
    value:`9:16`,
    children:`📲 9:16 — แนวตั้งยาว (Reels / TikTok / Story)`})]}),
  JSX(`div`,{
    className:`absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none`,
    children:
  JSXS(`svg`,{width:`20`,height:`20`,viewBox:`0 0 20 20`,fill:`none`,
    children:[ke===`1:1`&&
  JSX(`rect`,{x:`3`,y:`3`,width:`14`,height:`14`,rx:`2`,stroke:`#22d3ee`,strokeWidth:`1.5`,fill:`#22d3ee`,fillOpacity:`0.15`}),ke===`4:5`&&
  JSX(`rect`,{x:`4`,y:`2`,width:`12`,height:`16`,rx:`2`,stroke:`#22d3ee`,strokeWidth:`1.5`,fill:`#22d3ee`,fillOpacity:`0.15`}),ke===`4:3`&&
  JSX(`rect`,{x:`2`,y:`4`,width:`16`,height:`12`,rx:`2`,stroke:`#22d3ee`,strokeWidth:`1.5`,fill:`#22d3ee`,fillOpacity:`0.15`}),ke===`16:9`&&
  JSX(`rect`,{x:`1`,y:`5`,width:`18`,height:`10`,rx:`2`,stroke:`#22d3ee`,strokeWidth:`1.5`,fill:`#22d3ee`,fillOpacity:`0.15`}),ke===`9:16`&&
  JSX(`rect`,{x:`5`,y:`1`,width:`10`,height:`18`,rx:`2`,stroke:`#22d3ee`,strokeWidth:`1.5`,fill:`#22d3ee`,fillOpacity:`0.15`})]})})]}),
  JSXS(`p`,{
    className:`text-[10px] text-slate-500 mt-1 leading-snug`,
    children:[ke===`1:1`&&`🔲 1080×1080px — Facebook, Instagram Feed, LINE Timeline`,ke===`4:5`&&`📱 1080×1350px — Instagram Portrait, Facebook Ads, Pinterest`,ke===`4:3`&&`🖥️ 1080×810px — Presentation Slide, Blog Hero, LinkedIn`,ke===`16:9`&&`🎬 1280×720px — YouTube Thumbnail, Twitter Post, Medium`,ke===`9:16`&&`📲 1080×1920px — IG/FB Story, TikTok, Reels, Shorts`]})]}),
  JSX(`div`,{
    className:`border-t border-slate-850/40 my-1`}),
  JSXS(`div`,{
    className:`space-y-1.5`,
    children:[
  JSX(`label`,{
    className:`block text-xs font-semibold text-slate-400 mb-2`,
    children:`🎨 รูปแบบโครงร่างกระดาษ (Layout Template)`}),
  JSXS(`select`,{
    className:`glass-input h-11 text-xs border-slate-700 bg-slate-950/90 text-white font-medium cursor-pointer`,
    value:Z,
    onChange:e=>Ne(e.target.value),
    children:[
  JSX(`option`,{
    value:`top_gainers`,
    children:`🔥 ไวรัลไทย (Top Gainers - Grid Split)`}),
  JSX(`option`,{
    value:`ai_news`,
    children:`🔴 สรุปข่าวไอที (AI News - Header Strap)`}),
  JSX(`option`,{
    value:`github`,
    children:`💻 ซอฟต์แวร์ (GitHub Tech - Code strap)`}),
  JSX(`option`,{
    value:`quotes`,
    children:`💬 คำวิจารณ์กูรู (Quotes - Quote Card)`}),
  JSX(`option`,{
    value:`youtube`,
    children:`🎥 สารคดี (YouTube Style - Dark Overlay)`})]})]})]}),
  JSXS(`div`,{
    className:`md:col-span-2`,
    children:[
  JSX(`label`,{
    className:`block text-xs font-semibold text-slate-400 mb-3`,
    children:`🌈 เลือกธีมสีเอกลักษณ์โพสต์รูป (Visual Color Swatch Cards)`}),
  JSX(`div`,{
    className:`swatches-grid`,
    children:an.map(e=>{let t=je===e.id;return
  JSXS(`div`,{
    onClick:()=>Me(e.id),
    className:`swatch-card ${t?`active`:``}`,
    children:[
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`swatch-header`,
    children:[
  JSX(`span`,{
    className:`swatch-title`,title:e.name,
    children:e.name}),t&&
  JSX(N,{
    className:`w-3.5 h-3.5 text-cyan-400 shrink-0`})]}),
  JSXS(`div`,{
    className:`swatch-bar`,
    children:[
  JSX(`div`,{
    className:`swatch-bar-block`,style:{backgroundColor:e.gradient[0]},title:`BG Grad Start`}),
  JSX(`div`,{
    className:`swatch-bar-block`,style:{backgroundColor:e.gradient[1]},title:`BG Grad End`}),
  JSX(`div`,{
    className:`swatch-bar-block`,style:{backgroundColor:e.highlight},title:`Highlight Main`}),
  JSX(`div`,{
    className:`swatch-bar-block`,style:{backgroundColor:e.secondaryHighlight},title:`Highlight Sub`})]})]}),
  JSXS(`div`,{
    className:`swatch-dots-row`,
    children:[
  JSX(`span`,{
    className:`swatch-dot`,style:{backgroundColor:e.primaryText},title:`Text color`}),
  JSX(`span`,{
    className:`swatch-dot`,style:{backgroundColor:e.highlightText},title:`Highlight text`}),
  JSX(`span`,{
    className:`swatch-dot`,style:{backgroundColor:e.accent},title:`Accent line`})]})]},e.id)})})]}),
  JSXS(`div`,{
    className:`md:col-span-2 space-y-4 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60`,
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-2 pb-2 border-b border-slate-850`,
    children:[
  JSX(L,{
    className:`w-4 h-4 text-pink-400`}),
  JSX(`span`,{
    className:`text-xs font-bold text-white`,
    children:`🧩 ออปชันตกแต่งภาพซ้อนหลังแบบพรีเมียม (Premium Overlays)`})]}),
  JSXS(`div`,{
    className:`grid grid-cols-1 md:grid-cols-2 gap-4`,
    children:[
  JSXS(`div`,{
    className:`bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-3`,
    children:[
  JSX(`div`,{
    className:`flex items-center justify-between`,
    children:
  JSXS(`label`,{
    className:`flex items-center gap-1.5 cursor-pointer select-none`,
    children:[
  JSX(`input`,{type:`checkbox`,checked:Jt,
    onChange:e=>Yt(e.target.checked),
    className:`w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 accent-cyan-400`}),
  JSX(`span`,{
    className:`text-[11px] font-bold text-slate-200`,
    children:`ป้ายหมวดมุมซ้าย (Category Badge)`})]})}),Jt&&
  JSXS(`div`,{
    className:`space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`สไตล์ของป้าย`}),
  JSXS(`select`,{
    value:Xt,
    onChange:e=>Zt(e.target.value),
    className:`glass-input h-8 py-0 px-2 mt-1 text-[10px] w-full`,
    children:[
  JSX(`option`,{
    value:`dev-pick`,
    children:`⭐ Editor's Pick`}),
  JSX(`option`,{
    value:`tech-focus`,
    children:`🔥 Hot Topic`}),
  JSX(`option`,{
    value:`editorial`,
    children:`📢 Breaking News`}),
  JSX(`option`,{
    value:`youtube-channel`,
    children:`▶️ YouTube Channel`})]})]}),Xt===`youtube-channel`?
  JSXS(`div`,{style:{padding:`8px`,background:`rgba(255,0,0,0.06)`,borderRadius:`8px`,border:`1px solid rgba(255,0,0,0.15)`},
    children:[
  JSX(`p`,{style:{fontSize:`9px`,color:`#f87171`,fontWeight:700,margin:0},
    children:`▶️ ดึงข้อมูลอัตโนมัติจากบทความที่เลือก`}),
  JSX(`p`,{style:{fontSize:`8px`,color:`#94a3b8`,margin:`4px 0 0 0`},
    children:U?.author_name?`📺 ${U.author_name} — ${U.metadata?.subscribers_formatted||U.author_followers||`N/A`} ผู้ติดตาม`:`⚠️ ยังไม่มีข้อมูลช่อง — เลือกบทความที่มีข้อมูล YouTube`})]}):
  JSXS(`div`,{
    className:`grid grid-cols-2 gap-2`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`คำหลักย่อยบน`}),
  JSX(`input`,{type:`text`,
    value:$t,
    onChange:e=>en(e.target.value),
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`ชื่อหมวดหมู่หลัก`}),
  JSX(`input`,{type:`text`,
    value:nn,
    onChange:e=>cn(e.target.value),
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]})]})]})]}),
  JSXS(`div`,{
    className:`bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-3`,
    children:[
  JSX(`div`,{
    className:`flex items-center justify-between`,
    children:
  JSXS(`label`,{
    className:`flex items-center gap-1.5 cursor-pointer select-none`,
    children:[
  JSX(`input`,{type:`checkbox`,checked:ln,
    onChange:e=>un(e.target.checked),
    className:`w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 accent-cyan-400`}),
  JSX(`span`,{
    className:`text-[11px] font-bold text-slate-200`,
    children:`การ์ดสรุปย่อมุมซ้ายล่าง (News Card)`})]})}),ln&&
  JSXS(`div`,{
    className:`space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]`,
    children:[
  JSXS(`div`,{
    className:`grid grid-cols-2 gap-2`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`หัวข้อสั้น`}),
  JSX(`input`,{type:`text`,
    value:dn,
    onChange:e=>fn(e.target.value),placeholder:`เช่น ข่าวด่วนไอที`,
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`แหล่งข่าวอ้างอิง`}),
  JSX(`input`,{type:`text`,
    value:hn,
    onChange:e=>gn(e.target.value),placeholder:`เช่น Coinpulse Feed`,
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`สรุปเนื้อหาข่าว (สูงสุด 2 บรรทัด)`}),
  JSX(`textarea`,{
    value:pn,
    onChange:e=>mn(e.target.value),placeholder:`สรุปสั้นกระชับ สรุปใจความให้อ่านจบใน 5 วินาที...`,
    className:`glass-input h-12 py-1 mt-1 text-[10px] w-full resize-none`})]})]})]}),
  JSXS(`div`,{
    className:`bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-3`,
    children:[
  JSX(`div`,{
    className:`flex items-center justify-between`,
    children:
  JSXS(`label`,{
    className:`flex items-center gap-1.5 cursor-pointer select-none`,
    children:[
  JSX(`input`,{type:`checkbox`,checked:_n,
    onChange:e=>vn(e.target.checked),
    className:`w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 accent-cyan-400`}),
  JSX(`span`,{
    className:`text-[11px] font-bold text-slate-200`,
    children:`ลูกศรชี้คำเน้น (Highlight Callout)`})]})}),_n&&
  JSXS(`div`,{
    className:`space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]`,
    children:[
  JSXS(`div`,{
    className:`grid grid-cols-2 gap-2`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`ตำแหน่งชี้`}),
  JSXS(`select`,{
    value:Cn,
    onChange:e=>wn(e.target.value),
    className:`glass-input h-8 py-0 px-2 mt-1 text-[10px] w-full`,
    children:[
  JSX(`option`,{
    value:`random`,
    children:`🎲 สุ่มพิกัดปลอดภัย`}),
  JSX(`option`,{
    value:`top_left`,
    children:`↖️ บนซ้าย`}),
  JSX(`option`,{
    value:`top_right`,
    children:`↗️ บนขวา`}),
  JSX(`option`,{
    value:`bottom_left`,
    children:`↙️ ล่างซ้าย`}),
  JSX(`option`,{
    value:`bottom_right`,
    children:`↘️ ล่างขวา`})]})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`สติกเกอร์ชี้`}),
  JSXS(`select`,{
    value:Tn,
    onChange:e=>En(e.target.value),
    className:`glass-input h-8 py-0 px-2 mt-1 text-[10px] w-full`,
    children:[
  JSX(`option`,{
    value:`random`,
    children:`🎲 สุ่มลูกศร`}),
  JSX(`option`,{
    value:`arrow_up_left`,
    children:`↖️ ชี้ขึ้นซ้าย`}),
  JSX(`option`,{
    value:`arrow_up_right`,
    children:`↗️ ชี้ขึ้นขวา`}),
  JSX(`option`,{
    value:`arrow_down_left`,
    children:`↙️ ชี้ลงซ้าย`}),
  JSX(`option`,{
    value:`arrow_down_right`,
    children:`↘️ ชี้ลงขวา`})]})]})]}),
  JSXS(`div`,{
    className:`grid grid-cols-2 gap-2`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`คำเน้นลูกศร`}),
  JSX(`input`,{type:`text`,
    value:xn,
    onChange:e=>Sn(e.target.value),
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`ข้อความลูกศร`}),
  JSX(`input`,{type:`text`,
    value:yn,
    onChange:e=>bn(e.target.value),
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]})]})]})]}),
  JSXS(`div`,{
    className:`bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-3`,
    children:[
  JSX(`div`,{
    className:`flex items-center justify-between`,
    children:
  JSXS(`label`,{
    className:`flex items-center gap-1.5 cursor-pointer select-none`,
    children:[
  JSX(`input`,{type:`checkbox`,checked:Dn,
    onChange:e=>On(e.target.checked),
    className:`w-3.5 h-3.5 rounded border-slate-700 text-cyan-500 accent-cyan-400`}),
  JSX(`span`,{
    className:`text-[11px] font-bold text-slate-200`,
    children:`มีมสติกเกอร์ขวาล่าง (Meme Capsule)`})]})}),Dn&&
  JSX(`div`,{
    className:`space-y-2 pt-1.5 border-t border-slate-850/40 text-[10px]`,
    children:
  JSXS(`div`,{
    className:`grid grid-cols-2 gap-2`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`คำเน้นเด่นมีม`}),
  JSX(`input`,{type:`text`,
    value:kn,
    onChange:e=>An(e.target.value),
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`text-slate-400 font-bold`,
    children:`คำบรรยายประกอบ`}),
  JSX(`input`,{type:`text`,
    value:jn,
    onChange:e=>Mn(e.target.value),
    className:`glass-input h-8 py-1 mt-1 text-[10px] w-full`})]})]})})]})]})]}),
  JSXS(`div`,{
    className:`md:col-span-2 space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-850/60`,
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-2 pb-1.5 border-b border-slate-850/40`,
    children:[
  JSX(ge,{
    className:`w-4 h-4 text-cyan-400`}),
  JSX(`span`,{
    className:`text-xs font-bold text-white`,
    children:`⚙️ โครงสร้างฟอนต์และสัดส่วนกราฟิก (Font & Split Configuration)`})]}),
  JSXS(`div`,{
    className:`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-1`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`block text-[10px] font-bold text-slate-400 mb-1`,
    children:`ฟอนต์แสดงผล (Font Family)`}),
  JSXS(`select`,{
    value:zn,
    onChange:e=>Bn(e.target.value),
    className:`glass-input h-9 text-xs w-full cursor-pointer bg-slate-950`,
    children:[
  JSX(`option`,{
    value:`Kanit`,
    children:`Kanit (สไตล์โมเดิร์นหนา)`}),
  JSX(`option`,{
    value:`Mitr`,
    children:`Mitr (สไตล์หัวกลมคลาสสิก)`}),
  JSX(`option`,{
    value:`Prompt`,
    children:`Prompt (สไตล์มินิมอลสะอาด)`}),
  JSX(`option`,{
    value:`Sarabun`,
    children:`Sarabun (สไตล์ราชการสุภาพ)`}),
  JSX(`option`,{
    value:`Noto Sans Thai`,
    children:`Noto Sans Thai (สไตล์โมเดิร์นมาตรฐาน)`}),
  JSX(`option`,{
    value:`Mali`,
    children:`Mali (สไตล์น่ารักเป็นกันเอง)`}),
  JSX(`option`,{
    value:`Chonburi`,
    children:`Chonburi (สไตล์พรีเมียมมีหัวมีระดับ)`}),
  JSX(`option`,{
    value:`Itim`,
    children:`Itim (สไตล์ลายมือวัยรุ่น)`})]})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex justify-between text-[10px] font-bold text-slate-400 mb-1`,
    children:[
  JSX(`span`,{
    children:`ขนาดฟอนต์ (Font Scale)`}),
  JSXS(`span`,{
    className:`text-cyan-400`,
    children:[Fn,`x`]})]}),
  JSX(`input`,{type:`range`,min:`0.5`,max:`2.0`,step:`0.1`,
    value:Fn,
    onChange:e=>In(Number(e.target.value)),
    className:`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3`})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex justify-between text-[10px] font-bold text-slate-400 mb-1`,
    children:[
  JSX(`span`,{
    children:`สัดส่วนสปลิตกราฟิก (%)`}),
  JSXS(`span`,{
    className:`text-cyan-400`,
    children:[Ln,`%`]})]}),
  JSX(`input`,{type:`range`,min:`20`,max:`80`,step:`5`,
    value:Ln,
    onChange:e=>Rn(Number(e.target.value)),
    className:`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3`})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex justify-between text-[10px] font-bold text-slate-400 mb-1`,
    children:[
  JSX(`span`,{
    children:`ระยะเว้นพาดหัวบน`}),
  JSXS(`span`,{
    className:`text-cyan-400`,
    children:[Un,`px`]})]}),
  JSX(`input`,{type:`range`,min:`10`,max:`120`,step:`5`,
    value:Un,
    onChange:e=>Wn(Number(e.target.value)),
    className:`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3`})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex justify-between text-[10px] font-bold text-slate-400 mb-1`,
    children:[
  JSX(`span`,{
    children:`จัดวางแนวอักษรพาดหัว`}),
  JSX(`span`,{
    className:`text-cyan-400`,
    children:Vn===`left`?`ชิดซ้าย`:Vn===`center`?`กึ่งกลาง`:`ชิดขวา`})]}),
  JSX(`div`,{
    className:`flex gap-1 mt-1.5`,
    children:[`left`,`center`,`right`].map(e=>
  JSX(`button`,{type:`button`,
    onClick:()=>Hn(e),
    className:`flex-1 py-1 rounded-lg text-[10px] font-medium transition-all ${Vn===e?`bg-cyan-500/20 border border-cyan-500 text-cyan-400`:`bg-slate-800/40 border border-slate-700/60 text-slate-400 hover:bg-slate-800 hover:text-slate-300`}`,
    children:e===`left`?`ซ้าย`:e===`center`?`กลาง`:`ขวา`},e))})]}),
  JSXS(`div`,{
    children:[
  JSX(`span`,{
    className:`block text-[10px] font-bold text-slate-400 mb-1`,
    children:`ชุดสีเน้นคีย์เวิร์ด (Highlight Theme)`}),
  JSXS(`select`,{
    value:Gn,
    onChange:e=>Kn(e.target.value),
    className:`glass-input h-9 text-xs w-full cursor-pointer bg-slate-950`,
    children:[
  JSX(`option`,{
    value:`classic`,
    children:`Classic (🔴แดง, 🟡เหลือง, 🔵น้ำเงิน)`}),
  JSX(`option`,{
    value:`cyber`,
    children:`Cyber Neon (💗ชมพู, 💜ม่วง, 🩵ฟ้า)`}),
  JSX(`option`,{
    value:`gold`,
    children:`Premium Gold (🟤ทองเข้ม, 🟡เหลือง, 🟡ทองสว่าง)`}),
  JSX(`option`,{
    value:`forest`,
    children:`Forest Nature (🟢มรกต, 🟢มะนาว, 🔵แกมน้ำเงิน)`}),
  JSX(`option`,{
    value:`sunset`,
    children:`Sunset Glow (🟠ส้ม, 🔴กุหลาบ, 🟡เหลืองทอง)`})]})]})]}),
  JSXS(`div`,{
    className:`grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/40 mt-1`,
    children:[
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex justify-between text-[10px] font-bold text-slate-400 mb-1`,
    children:[
  JSX(`span`,{
    children:`ระยะเว้นขอบแนวนอนตัวเน้น (Highlight Padding X)`}),
  JSX(`span`,{
    className:`text-cyan-400`,
    children:qn})]}),
  JSX(`input`,{type:`range`,min:`0.05`,max:`0.80`,step:`0.01`,
    value:qn,
    onChange:e=>{let t=Number(e.target.value);Jn(t),localStorage.setItem(`canvas_highlight_padding_x`,String(t))},
    className:`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3`})]}),
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex justify-between text-[10px] font-bold text-slate-400 mb-1`,
    children:[
  JSX(`span`,{
    children:`ระยะเว้นขอบแนวตั้งตัวเน้น (Highlight Padding Y)`}),
  JSX(`span`,{
    className:`text-cyan-400`,
    children:Yn})]}),
  JSX(`input`,{type:`range`,min:`0.01`,max:`0.40`,step:`0.01`,
    value:Yn,
    onChange:e=>{let t=Number(e.target.value);Xn(t),localStorage.setItem(`canvas_highlight_padding_y`,String(t))},
    className:`w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 mt-3`})]})]}),
  JSXS(`div`,{
    className:`pt-2`,
    children:[
  JSX(`span`,{
    className:`block text-[10px] font-bold text-slate-400 mb-1`,
    children:`ข้อความเครดิตท้ายโพสต์ (Credit Label)`}),
  JSX(`input`,{type:`text`,
    value:Nn,
    onChange:e=>Pn(e.target.value),
    className:`glass-input h-9 text-xs`,placeholder:`เครดิต: ใส่ข้อความสโลแกนหรือชื่อเพจของคุณ...`})]})]}),
  JSXS(`div`,{
    className:`md:col-span-2 space-y-2 bg-slate-950/40 p-3.5 rounded-xl border border-slate-850`,
    children:[
  JSX(`div`,{
    className:`flex items-center justify-between gap-4`,
    children:
  JSXS(`label`,{
    className:`text-xs font-semibold text-slate-300 flex items-center gap-1.5`,
    children:[
  JSX(ae,{
    className:`w-3.5 h-3.5 text-slate-400`}),
  JSX(`span`,{
    children:`🌄 แหล่งภาพพื้นหลัง (BACKGROUND SOURCE)`})]})}),
  JSXS(`select`,{
    value:dt,
    onChange:e=>{let t=e.target.value;ft(t),localStorage.setItem(`canvas_bg_source`,t)},
    className:`glass-input h-9 text-xs w-full cursor-pointer bg-slate-950 font-bold`,
    children:[
  JSX(`option`,{
    value:`default`,
    children:`📰 รูปจากบทความต้นทาง (Default Media)`}),
  JSX(`option`,{
    value:`stock`,
    children:`📸 รูป Stock สุ่มจากโฟลเดอร์ที่เลือก`})]}),dt===`stock`&&
  JSXS(`div`,{
    className:`space-y-2 pt-2 border-t border-slate-900 animate-fade-in`,
    children:[
  JSXS(`div`,{
    className:`flex gap-2`,
    children:[
  JSXS(`button`,{type:`button`,
    onClick:async()=>{try{let e=await window.showDirectoryPicker({mode:`read`}),t=prompt(`📂 กรุณาพิมพ์ Full Path ของโฟลเดอร์ "${e.name}" ที่เลือก:\n\n(เช่น /Users/.../stock-images/${e.name})`,Ut||`/Users/${e.name}`);if(t){Wt(t),Q(e.name),localStorage.setItem(`canvas_stock_folder`,t);try{let e=await(await fetch(`${$}/vault/stock-list?folder=${encodeURIComponent(t)}`)).json();e.success?qt(`✅ พบ ${e.total} รูปในโฟลเดอร์ Stock`):qt(`⚠️ ${e.error}`)}catch{qt(`⚠️ ไม่สามารถตรวจสอบโฟลเดอร์กับ Backend ได้`)}}}catch(e){if(e.name===`AbortError`)return;console.error(`Stock folder picker error:`,e)}},
    className:`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 border border-dashed border-purple-500/40 bg-purple-500/5 text-purple-400 rounded-lg text-[10px] font-bold hover:bg-purple-500/10 active:scale-98 transition-all cursor-pointer`,
    children:[
  JSX(re,{
    className:`w-3.5 h-3.5 shrink-0`}),
  JSX(`span`,{
    className:`truncate`,
    children:Ut?`📂 Stock: ${Gt}`:`📂 เลือกโฟลเดอร์ Stock...`})]}),Ut&&
  JSXS(`button`,{type:`button`,
    onClick:async()=>{try{let e=await(await fetch(`${$}/vault/stock-random?folder=${encodeURIComponent(Ut)}`)).json();e.success&&e.absolute_path?(ut(e.absolute_path),qt(`🎲 สุ่มภาพสำเร็จ! ${e.absolute_path.split(`/`).pop()}`)):alert(`⚠️ ${e.error||`ไม่สามารถดึงรูปภาพสุ่มได้`}`)}catch(e){alert(`❌ ไม่สามารถเชื่อมต่อระบบสุ่มภาพได้: ${e.message}`)}},
    className:`flex items-center justify-center gap-1 px-3 py-1.5 border border-cyan-500/40 bg-cyan-500/5 text-cyan-400 rounded-lg text-[10px] font-bold hover:bg-cyan-500/10 active:scale-98 transition-all cursor-pointer shrink-0`,
    children:[
  JSX(G,{
    className:`w-3.5 h-3.5 shrink-0`}),
  JSX(`span`,{
    children:`สุ่มใหม่`})]})]}),Kt&&
  JSX(`p`,{
    className:`text-[9px] text-slate-400 text-center font-medium mt-1`,
    children:Kt}),!Ut&&
  JSX(`p`,{
    className:`text-[9px] text-amber-500 text-center font-semibold mt-1`,
    children:`⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์`})]})]}),
  JSXS(`div`,{
    className:`md:col-span-2 space-y-3 bg-slate-950/40 p-4 rounded-xl border border-slate-850 mt-4`,
    children:[
  JSXS(`div`,{
    className:`flex flex-col sm:flex-row sm:items-center justify-between gap-3`,
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-3 flex-wrap`,
    children:[
  JSX(`label`,{
    className:`text-xs font-semibold text-slate-300`,
    children:`🎯 เลือกหัวข้อวัตถุดิบมาเขียนรูป (Select Content Idea)`}),
  JSX(`button`,{type:`button`,
    onClick:Xr,disabled:Ye||K.length===0,
    className:`px-3 py-1.5 rounded-lg text-[10px] font-black tracking-wider uppercase transition-all duration-300 border flex items-center gap-1.5 shadow-lg ${Ye?`bg-slate-800 border-slate-750 text-slate-400 cursor-not-allowed`:`bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white border-cyan-500/30 hover:border-cyan-400/40 hover:shadow-cyan-500/20 active:scale-95 cursor-pointer`}`,
    children:Ye?
  JSXS(Y.Fragment,{
    children:[
  JSX(`span`,{
    className:`animate-spin rounded-full h-3 w-3 border-2 border-slate-400 border-t-transparent`}),
  JSX(`span`,{
    children:`กำลังตรวจจับใบหน้า...`})]}):
  JSX(Y.Fragment,{
    children:
  JSX(`span`,{
    children:`🤖 เลือกรูปที่มีคนอัตโนมัติ (ทุกโพส)`})})})]}),Qr.length>0&&
  JSXS(`label`,{
    className:`flex items-center gap-2 cursor-pointer select-none`,
    children:[
  JSX(`input`,{type:`checkbox`,checked:Qr.length>0&&ye.length===Qr.length,
    onChange:()=>{ye.length===Qr.length?be([]):be(Qr.map(e=>e.id))},
    className:`w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400`}),
  JSXS(`span`,{
    className:`text-[10px] font-bold text-slate-400`,
    children:[`เลือกทั้งหมดเพื่อสร้างโพสรูป (`,Qr.length,` รายการ)`]})]})]}),
  JSXS(`div`,{
    className:`flex gap-2`,
    children:[
  JSXS(`div`,{
    className:`relative flex-1`,
    children:[
  JSX(`input`,{type:`text`,
    value:ie,
    onChange:e=>se(e.target.value),placeholder:`🔍 พิมพ์คำค้นหาโพสต์ เช่น TechFeed, Llama, AI...`,
    className:`glass-input py-2 text-xs pl-8 bg-black/40`}),
  JSX(me,{
    className:`w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-3`})]}),ie&&
  JSX(`button`,{
    onClick:()=>se(``),
    className:`px-2.5 py-2 text-xs bg-slate-900 border border-slate-800 text-slate-400 rounded-lg hover:text-white`,
    children:`ล้าง`})]}),ye.length>0&&
  JSX(`div`,{
    className:`pt-1.5 pb-2 animate-fade-in w-full`,
    children:
  JSXS(`div`,{
    className:`relative overflow-hidden rounded-2xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-950/60 via-slate-950/80 to-indigo-950/60 p-4 shadow-2xl shadow-purple-500/10`,
    children:[
  JSX(`div`,{
    className:`absolute inset-0 bg-gradient-to-r from-purple-500/5 via-fuchsia-500/10 to-indigo-500/5 pointer-events-none`}),
  JSXS(`div`,{
    className:`relative flex items-center gap-2 mb-3 pb-2 border-b border-purple-500/20`,
    children:[
  JSX(q,{
    className:`w-5 h-5 text-fuchsia-400 animate-pulse`}),
  JSX(`h3`,{
    className:`text-sm font-black text-white tracking-tight`,
    children:`✍️ สั่ง AI เขียนบทความและพาดหัว`}),
  JSXS(`span`,{
    className:`ml-auto px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30`,
    children:[ye.length,` รายการ`]})]}),
  JSXS(`div`,{
    className:`relative grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3`,
    children:[
  JSXS(`div`,{
    children:[
  JSX(`label`,{
    className:`block text-[10px] font-bold text-purple-300/80 mb-1 uppercase tracking-wider`,
    children:`🎯 สไตล์พาดหัว`}),
  JSXS(`select`,{
    value:lr,
    onChange:e=>ur(e.target.value),
    className:`w-full h-9 text-[11px] rounded-lg border border-purple-500/30 bg-slate-950/80 text-white font-medium cursor-pointer px-2.5 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/30 transition-all`,
    children:[
  JSX(`option`,{
    value:``,
    children:`-- เลือกสไตล์พาดหัว --`}),sn.map(e=>
  JSX(`option`,{
    value:e.id,
    children:e.name},e.id))]})]}),
  JSXS(`div`,{
    children:[
  JSX(`label`,{
    className:`block text-[10px] font-bold text-purple-300/80 mb-1 uppercase tracking-wider`,
    children:`📝 สไตล์การเขียนโพส`}),
  JSXS(`select`,{
    value:sr,
    onChange:e=>cr(e.target.value),
    className:`w-full h-9 text-[11px] rounded-lg border border-purple-500/30 bg-slate-950/80 text-white font-medium cursor-pointer px-2.5 focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-400/30 transition-all`,
    children:[
  JSX(`option`,{
    value:``,
    children:`-- เลือกสไตล์การเขียนโพส --`}),on.map(e=>
  JSX(`option`,{
    value:e.id,
    children:e.name},e.id))]})]})]}),(!lr||!sr)&&
  JSX(`p`,{
    className:`text-[10px] text-amber-400/80 mb-2 flex items-center gap-1`,
    children:`⚠️ กรุณาเลือกสไตล์พาดหัวและสไตล์การเขียนโพสให้ครบทั้ง 2 ช่องก่อนกดปุ่ม`}),
  JSX(`button`,{type:`button`,disabled:Ke||!lr||!sr,
    onClick:kr,
    className:`relative w-full rounded-xl font-black text-sm flex items-center justify-center gap-3`,style:{background:Ke?`rgba(20, 83, 45, 0.3)`:!lr||!sr?`rgba(30, 41, 59, 0.5)`:`linear-gradient(90deg, #22c55e, #34d399, #22c55e)`,color:Ke?`#4ade80`:!lr||!sr?`#64748b`:`#0a0a0a`,border:Ke?`2px solid rgba(22, 101, 52, 0.4)`:!lr||!sr?`1px solid rgba(51, 65, 85, 0.4)`:`2px solid #4ade80`,padding:`14px 20px`,borderRadius:`12px`,boxShadow:Ke||!lr||!sr?`none`:`0 0 25px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.2)`,fontWeight:900,fontSize:`0.875rem`,cursor:Ke?`wait`:!lr||!sr?`not-allowed`:`pointer`,transition:`all 0.3s ease`,opacity:Ke||!lr||!sr?.85:1},
    children:Ke?
  JSXS(Y.Fragment,{
    children:[
  JSX(G,{
    className:`w-5 h-5 animate-spin`,style:{color:`#86efac`}}),
  JSXS(`span`,{
    children:[`กำลังใช้ AI เขียนบทความแบบกลุ่ม... (`,ye.length,` รายการ)`]})]}):
  JSXS(Y.Fragment,{
    children:[
  JSX(q,{
    className:`w-5 h-5`}),
  JSXS(`span`,{
    children:[`🚀 เริ่มสั่ง AI เขียนบทความและพาดหัวทั้งหมด (`,ye.length,` รายการ)`]})]})}),
  JSXS(`div`,{
    className:`flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80`,
    children:[
  JSX(`span`,{
    className:`text-[10px] text-slate-400 font-bold`,
    children:`📜 AI Copywriting Logs`}),
  JSX(`button`,{type:`button`,
    onClick:()=>gr(!hr),
    className:`px-2.5 py-0.5 rounded text-[9px] font-black transition-all flex items-center gap-1 active:scale-95 border`,style:{border:hr?`1px solid rgba(168,85,247,0.4)`:`1px solid rgba(71,85,105,0.5)`,background:hr?`rgba(168,85,247,0.1)`:`rgba(30,41,59,0.5)`,color:hr?`#c084fc`:`#94a3b8`,cursor:`pointer`},
    children:hr?`🙈 ซ่อน Log`:`👁️ แสดง Log`})]}),hr&&
  JSXS(`div`,{
    className:`mt-2 p-3 bg-black/90 border border-purple-500/20 rounded-lg text-[10px] text-slate-300 font-mono text-left max-h-[160px] overflow-y-auto whitespace-pre-wrap leading-relaxed relative flex flex-col`,style:{boxShadow:`inset 0 0 10px rgba(0,0,0,0.8)`},
    children:[E.canvas.map((e,t)=>{let n=`#94a3b8`;return e.includes(`[SUCCESS]`)?n=`#4ade80`:e.includes(`[WARNING]`)?n=`#facc15`:e.includes(`[ERROR]`)||e.includes(`[FATAL ERROR]`)?n=`#f87171`:e.includes(`[SYSTEM]`)?n=`#c084fc`:e.includes(`[PROCESS]`)&&(n=`#67e8f9`),
  JSX(`div`,{style:{color:n},
    children:e},t)}),
  JSX(`div`,{ref:M.canvas})]})]})}),
  JSXS(`div`,{style:{marginTop:`10px`,padding:`10px 12px`,borderRadius:`10px`,border:`1px solid rgba(63, 63, 70, 0.5)`,background:`rgba(15, 23, 42, 0.4)`},
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-2`,style:{marginBottom:`8px`},
    children:[
  JSX(ae,{
    className:`w-3.5 h-3.5`,style:{color:`#94a3b8`}}),
  JSX(`span`,{style:{fontSize:`10px`,fontWeight:700,color:`#94a3b8`,textTransform:`uppercase`,letterSpacing:`0.05em`},
    children:`🖼️ แหล่งภาพพื้นหลัง (Background Source)`})]}),
  JSXS(`select`,{
    value:dt,
    onChange:e=>{let t=e.target.value;ft(t),localStorage.setItem(`canvas_bg_source`,t)},style:{width:`100%`,padding:`8px 10px`,borderRadius:`8px`,border:`1px solid rgba(63, 63, 70, 0.6)`,background:`rgba(6, 8, 16, 0.85)`,color:`#e2e8f0`,fontSize:`12px`,fontWeight:600,cursor:`pointer`,outline:`none`},
    children:[
  JSX(`option`,{
    value:`default`,
    children:`📰 รูปจากบทความต้นทาง (Default Media)`}),
  JSX(`option`,{
    value:`stock`,
    children:`📸 รูป Stock สุ่มจากโฟลเดอร์ที่เลือก`})]}),dt===`stock`&&
  JSXS(`div`,{style:{marginTop:`8px`},
    children:[
  JSXS(`button`,{type:`button`,
    onClick:async()=>{try{let e=await window.showDirectoryPicker({mode:`read`}),t=prompt(`📂 กรุณาพิมพ์ Full Path ของโฟลเดอร์ "${e.name}" ที่เลือก:\n\n(เช่น /Users/.../stock-images/${e.name})`,Ut||`/Users/${e.name}`);if(t){Wt(t),Q(e.name),localStorage.setItem(`canvas_stock_folder`,t);try{let e=await(await fetch(`${$}/vault/stock-list?folder=${encodeURIComponent(t)}`)).json();e.success?qt(`✅ พบ ${e.total} รูปในโฟลเดอร์ Stock`):qt(`⚠️ ${e.error}`)}catch{qt(`⚠️ ไม่สามารถตรวจสอบโฟลเดอร์กับ Backend ได้`)}}}catch(e){if(e.name===`AbortError`)return;console.error(`Stock folder picker error:`,e)}},
    className:`w-full flex items-center justify-center gap-2`,style:{padding:`8px 12px`,borderRadius:`8px`,border:Ut?`1px solid rgba(139, 92, 246, 0.4)`:`1px dashed rgba(139, 92, 246, 0.6)`,background:Ut?`rgba(139, 92, 246, 0.08)`:`rgba(139, 92, 246, 0.05)`,color:`#c084fc`,fontSize:`11px`,fontWeight:700,cursor:`pointer`,transition:`all 0.2s ease`},
    children:[
  JSX(re,{
    className:`w-3.5 h-3.5`}),
  JSX(`span`,{
    children:Ut?`📂 Stock: ${Gt}`:`📂 เลือกโฟลเดอร์ Stock...`})]}),Ut&&
  JSXS(`button`,{type:`button`,
    onClick:async()=>{try{let e=await(await fetch(`${$}/vault/stock-random?folder=${encodeURIComponent(Ut)}`)).json();e.success&&e.absolute_path?(ut(e.absolute_path),qt(`🎲 สุ่มภาพสำเร็จ! ${e.absolute_path.split(`/`).pop()}`)):alert(`⚠️ ${e.error||`ไม่สามารถดึงรูปภาพสุ่มได้`}`)}catch(e){alert(`❌ ไม่สามารถเชื่อมต่อระบบสุ่มภาพได้: ${e.message}`)}},
    className:`w-full flex items-center justify-center gap-2`,style:{marginTop:`6px`,padding:`6px 12px`,borderRadius:`8px`,border:`1px solid rgba(6, 182, 212, 0.4)`,background:`rgba(6, 182, 212, 0.08)`,color:`#22d3ee`,fontSize:`11px`,fontWeight:700,cursor:`pointer`,transition:`all 0.2s ease`},
    children:[
  JSX(G,{
    className:`w-3.5 h-3.5`}),
  JSX(`span`,{
    children:`🎲 สุ่มภาพพื้นหลังใหม่ (Randomize Background)`})]}),Kt&&
  JSX(`p`,{style:{fontSize:`10px`,color:`#94a3b8`,marginTop:`4px`,textAlign:`center`},
    children:Kt}),dt===`stock`&&!Ut&&
  JSX(`p`,{style:{fontSize:`10px`,color:`#f59e0b`,marginTop:`4px`,textAlign:`center`},
    children:`⚠️ กรุณาเลือกโฟลเดอร์ Stock ก่อนเรนเดอร์`})]})]}),Qr.length===0?
  JSXS(`div`,{
    className:`text-center py-12 text-slate-500 border border-dashed border-slate-850 rounded-xl bg-slate-950/20`,
    children:[
  JSX(oe,{
    className:`w-10 h-10 mx-auto mb-3 text-slate-700`}),
  JSX(`p`,{
    className:`text-xs font-bold text-slate-400`,
    children:`ยังไม่มีคอนเทนต์ที่นำเข้ามาในห้องควบคุมดีไซน์`}),
  JSXS(`p`,{
    className:`text-[10px] text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed`,
    children:[`กรุณาไปที่แท็บ `,
  JSX(`span`,{
    className:`text-cyan-400 font-bold`,
    children:`คลังวัตถุดิบคุณภาพ`}),` และกดปุ่ม `,
  JSX(`span`,{
    className:`text-cyan-400 font-bold`,
    children:`📥 นำเข้าทำรูป`}),` หรือใช้คำสั่งอนุมัติกลุ่มเพื่อส่งไอเดียเข้ามาทำงานที่นี่`]})]}):
  JSX(`div`,{
    className:`grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar`,
    children:Qr.map(e=>{let t=U?.id===e.id,n=e.status===`ready_for_design`||e.status===`designed`||e.status===`posted`,r=ye.includes(e.id),i=`bg-slate-900 border-slate-800 text-slate-400`;return e.source_type===`radar`?i=`bg-cyan-500/10 text-cyan-400 border-cyan-500/20`:e.source_type===`rss`?i=`bg-pink-500/10 text-pink-400 border-pink-500/20`:e.source_type===`youtube`?i=`bg-red-500/10 text-red-400 border-red-500/20`:e.source_type===`github`&&(i=`bg-indigo-500/10 text-indigo-400 border-indigo-500/20`),
  JSXS(`div`,{
    className:`p-3.5 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] group ${t?`bg-cyan-500/10 border-cyan-400/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/30 sm:col-span-2`:r?`bg-slate-900/60 border-slate-700/60`:`bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/70 hover:border-slate-700/80`}`,
    onClick:()=>ce(e),
    children:[
  JSXS(`div`,{
    className:`flex items-center justify-between gap-2 mb-2`,
    children:[
  JSX(`span`,{
    className:`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${i}`,
    children:e.source_type}),
  JSXS(`div`,{
    className:`flex items-center gap-1.5`,
    onClick:e=>e.stopPropagation(),
    children:[
  JSX(`input`,{type:`checkbox`,checked:r,
    onChange:()=>{be(t=>t.includes(e.id)?t.filter(t=>t!==e.id):[...t,e.id])},
    className:`w-4 h-4 rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-slate-900 bg-slate-950/80 cursor-pointer accent-cyan-400 shrink-0`}),
  JSX(`span`,{
    className:`text-[10px] font-bold text-slate-400`,
    children:n?`พร้อมเขียนรูป`:`ฉบับร่างดิบ`}),t&&
  JSX(N,{
    className:`w-4 h-4 text-cyan-400 ml-1 shadow-sm shrink-0`})]})]}),
  JSX(`p`,{
    className:`text-xs font-semibold leading-relaxed line-clamp-2 transition-colors mb-3 ${t?`text-cyan-300`:`text-slate-200 group-hover:text-white`}`,
    children:e.title}),
  JSXS(`div`,{
    className:`flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-850/60 pt-2 mt-auto`,
    children:[
  JSXS(`span`,{
    className:`truncate max-w-[120px] font-medium text-slate-400`,
    children:[`👤 `,e.author_name||`ไม่ระบุผู้แต่ง`]}),
  JSXS(`span`,{
    children:[`📅 `,new Date(e.created_at).toLocaleDateString(`th-TH`)]})]}),t&&
  JSXS(`div`,{
    className:`mt-4 pt-3 border-t border-slate-800/80 text-left w-full`,
    onClick:e=>e.stopPropagation(),
    children:[
  JSXS(`button`,{type:`button`,
    onClick:()=>he(e=>!e),style:{width:`100%`,display:`flex`,alignItems:`center`,justifyContent:`space-between`,gap:`8px`,padding:`6px 10px`,borderRadius:`8px`,border:`1px solid rgba(51, 65, 85, 0.4)`,background:pe?`rgba(6, 182, 212, 0.06)`:`rgba(15, 23, 42, 0.4)`,cursor:`pointer`,transition:`all 0.2s ease`,marginBottom:pe?`12px`:`0`},
    children:[
  JSXS(`span`,{style:{display:`flex`,alignItems:`center`,gap:`6px`,fontSize:`11px`,fontWeight:700,color:pe?`#67e8f9`:`#94a3b8`},
    children:[
  JSX(q,{style:{width:`12px`,height:`12px`}}),`🛠️ ปรับแต่งโพสต์การสร้างรูป`]}),
  JSXS(`span`,{style:{display:`flex`,alignItems:`center`,gap:`6px`},
    children:[dt===`default`&&e.media_paths&&e.media_paths.length>0&&
  JSXS(`span`,{
    onClick:e=>{e.stopPropagation(),de(e=>!e)},style:{fontSize:`9px`,fontWeight:800,padding:`2px 8px`,borderRadius:`4px`,border:ue?`1px solid rgba(34,211,238,0.3)`:`1px solid rgba(71,85,105,0.5)`,background:ue?`rgba(34,211,238,0.08)`:`rgba(30,41,59,0.5)`,color:ue?`#67e8f9`:`#94a3b8`,cursor:`pointer`,transition:`all 0.15s ease`},
    children:[ue?`🙈 ซ่อนรูป`:`🖼️ ดูรูป`,` `,e.media_paths.length]}),
  JSX(`span`,{style:{fontSize:`10px`,color:pe?`#67e8f9`:`#64748b`,transition:`transform 0.2s ease`,transform:pe?`rotate(180deg)`:`rotate(0deg)`},
    children:`▼`})]})]}),pe&&
  JSXS(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`16px`},
    children:[dt===`default`&&ue&&e.media_paths&&e.media_paths.length>0&&
  JSXS(`div`,{style:{padding:`8px 10px`,background:`rgba(2, 6, 23, 0.5)`,borderRadius:`8px`,border:`1px solid rgba(51, 65, 85, 0.4)`},
    children:[
  JSX(`span`,{style:{fontSize:`9px`,fontWeight:600,color:`#94a3b8`,display:`block`,marginBottom:`6px`},
    children:`🖼️ กดเลือกเฟรมที่ต้องการใช้เป็นฉากหลัง:`}),
  JSX(`div`,{style:{display:`flex`,gap:`5px`,overflowX:`auto`,paddingBottom:`2px`},
    children:e.media_paths.map((t,n)=>{let r=lt===t;return
  JSXS(`div`,{
    onClick:()=>Zr(e,t),style:{position:`relative`,cursor:`pointer`,flexShrink:0,width:`48px`,height:`32px`,borderRadius:`4px`,overflow:`hidden`,border:r?`2px solid #22d3ee`:`1px solid rgba(51, 65, 85, 0.6)`,boxShadow:r?`0 0 6px rgba(34, 211, 238, 0.3)`:`none`,transition:`all 0.15s ease`},
    children:[
  JSX(`img`,{src:`${$}/vault/media?path=${encodeURIComponent(t)}`,alt:`Frame ${n+1}`,style:{width:`100%`,height:`100%`,objectFit:`cover`,display:`block`}}),r&&
  JSX(`div`,{style:{position:`absolute`,inset:0,background:`rgba(34, 211, 238, 0.15)`,display:`flex`,alignItems:`center`,justifyContent:`center`},
    children:
  JSX(`div`,{style:{width:`14px`,height:`14px`,borderRadius:`50%`,background:`#22d3ee`,color:`#0f172a`,fontSize:`8px`,fontWeight:900,display:`flex`,alignItems:`center`,justifyContent:`center`},
    children:`✓`})})]},n)})})]}),
  JSXS(`div`,{
    className:`space-y-1.5`,
    children:[
  JSXS(`div`,{
    className:`flex items-center justify-between gap-4`,
    children:[
  JSX(`label`,{
    className:`text-[11px] font-bold text-slate-300 block`,
    children:`✍️ แก้ไขตัวโพส (Post Caption / แคปชั่น)`}),
  JSXS(`button`,{type:`button`,disabled:Ke,
    onClick:()=>Or(e),
    className:`px-2.5 py-1 rounded bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-md shadow-purple-500/10`,
    children:[Ke?
  JSX(G,{
    className:`w-3 h-3 animate-spin`}):
  JSX(q,{
    className:`w-3 h-3 animate-pulse text-purple-200`}),
  JSX(`span`,{
    children:`✨ AI เขียนโพสต์ใหม่`})]})]}),
  JSX(`textarea`,{
    value:Ie,
    onChange:e=>Le(e.target.value),rows:4,
    className:`glass-input text-xs w-full p-2.5 bg-slate-950/80 border-slate-800 rounded-lg text-white font-medium resize-y`,placeholder:`ใส่แคปชั่นข้อความโพสต์ที่ต้องการ...`})]}),
  JSXS(`div`,{
    className:`space-y-3 p-3 bg-slate-950/40 rounded-xl border border-slate-850/65`,
    children:[
  JSX(`div`,{
    className:`flex flex-col sm:flex-row sm:items-center justify-between gap-2`,
    children:
  JSXS(`div`,{
    className:`flex items-center gap-2`,
    children:[
  JSX(`label`,{
    className:`text-[11px] font-bold text-cyan-400 block`,
    children:`📢 พาดหัว 3 บรรทัด (3-Line Headlines)`}),
  JSXS(`button`,{type:`button`,disabled:Ke,
    onClick:()=>Or(e),
    className:`px-2.5 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[9px] font-black transition-all flex items-center gap-1.5 active:scale-95 disabled:opacity-50 shadow-md shadow-cyan-500/10`,
    children:[Ke?
  JSX(G,{
    className:`w-3 h-3 animate-spin`}):
  JSX(q,{
    className:`w-3 h-3 animate-pulse text-cyan-200`}),
  JSX(`span`,{
    children:`✨ AI เขียนพาดหัวใหม่`})]})]})}),
  JSXS(`div`,{
    className:`space-y-2 mt-2 pt-1.5 border-t border-slate-850/40`,
    children:[
  JSX(`span`,{
    className:`text-[10px] text-slate-400 font-bold block`,
    children:`พิมพ์แก้ไขพาดหัว 3 บรรทัด:`}),
  JSXS(`div`,{
    className:`grid grid-cols-1 gap-1.5`,
    children:[
  JSXS(`div`,{
    className:`flex gap-2 items-center`,
    children:[
  JSX(`span`,{
    className:`w-1.5 h-1.5 rounded-full bg-pink-500 shrink-0`}),
  JSX(`input`,{type:`text`,
    value:Be,
    onChange:e=>Ve(e.target.value),
    className:`glass-input h-8 text-[11px] py-1 bg-slate-900`,placeholder:`บรรทัดที่ 1 (เน้นตัวใหญ่เด่น)...`})]}),
  JSXS(`div`,{
    className:`flex gap-2 items-center`,
    children:[
  JSX(`span`,{
    className:`w-1.5 h-1.5 rounded-full bg-slate-200 shrink-0`}),
  JSX(`input`,{type:`text`,
    value:He,
    onChange:e=>Ue(e.target.value),
    className:`glass-input h-8 text-[11px] py-1 bg-slate-900`,placeholder:`บรรทัดที่ 2 (สรุปเนื้อหาหลัก)...`})]}),
  JSXS(`div`,{
    className:`flex gap-2 items-center`,
    children:[
  JSX(`span`,{
    className:`w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0`}),
  JSX(`input`,{type:`text`,
    value:We,
    onChange:e=>Ge(e.target.value),
    className:`glass-input h-8 text-[11px] py-1 bg-slate-900`,placeholder:`บรรทัดที่ 3 (ชวนให้ติดตามต่อ)...`})]})]})]}),
  JSXS(`div`,{
    className:`space-y-1 pt-1`,
    children:[
  JSX(`span`,{
    className:`text-[10px] text-slate-400 font-bold block`,
    children:`คำเด่นหลักที่ต้องการใส่สีเน้น (Highlight Keyword):`}),
  JSX(`input`,{type:`text`,
    value:ot,
    onChange:e=>ct(e.target.value),
    className:`glass-input h-8 text-[11px] py-1 bg-slate-900`,placeholder:`เช่น Llama 3, Agent, แจกฟรี...`})]})]}),
  JSXS(`div`,{
    className:`flex flex-wrap gap-2 pt-2 justify-end border-t border-slate-800/40`,
    children:[
  JSX(`button`,{type:`button`,
    onClick:()=>{Fe(Re===`triple`?[Be,He,We].filter(Boolean).join(`
`):Pe),ct(ot),alert(`👁️ อัปเดตการแสดงผลในหน้าจอพรีวิวด้านบนเรียบร้อยแล้ว!`)},
    className:`px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold transition-all flex items-center gap-1`,
    children:
  JSX(`span`,{
    children:`👁️ แสดงตัวอย่างในพรีวิวด้านบน`})}),
  JSX(`button`,{type:`button`,
    onClick:()=>{let t={...e.metadata?.copywriting||{},caption:Ie,headline_3line:[Be,He,We],highlight:ot,headlines:e.metadata?.copywriting?.headlines||[Pe],selected_bg_image:lt};Yr(e.id,t)},
    className:`px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-all flex items-center gap-1`,
    children:
  JSX(`span`,{
    children:`💾 บันทึกการแก้ไข`})})]})]})]})]},e.id)})})]}),
  JSXS(`button`,{type:`button`,
    className:`w-full rounded-xl font-black text-xs flex items-center justify-center gap-2 mt-2`,style:{height:`48px`,background:O.canvas||!U&&ye.length===0?`rgba(30, 41, 59, 0.5)`:`linear-gradient(90deg, #22c55e, #34d399, #22c55e)`,color:O.canvas||!U&&ye.length===0?`#64748b`:`#0a0a0a`,border:O.canvas||!U&&ye.length===0?`1px solid rgba(51, 65, 85, 0.4)`:`2px solid #4ade80`,borderRadius:`12px`,boxShadow:O.canvas||!U&&ye.length===0?`none`:`0 0 25px rgba(34,197,94,0.6), 0 0 50px rgba(34,197,94,0.2)`,fontWeight:900,fontSize:`0.75rem`,cursor:O.canvas||!U&&ye.length===0?`not-allowed`:`pointer`,opacity:O.canvas||!U&&ye.length===0?.5:1,pointerEvents:O.canvas||!U&&ye.length===0?`none`:`auto`,transition:`all 0.3s ease`},disabled:O.canvas||!U&&ye.length===0,
    onClick:async()=>{if(vt([]),bt(0),mt(null),ye.length>1){J(ye),Te(0);return}let e=ye.length===1?ye[0]:U?.id;if(!e)return;let t=(H?B:K).find(t=>t.id===e);if(!t)return;let n=new URLSearchParams;n.append(`content_id`,t.id),n.append(`ratio`,ke),n.append(`theme`,je),n.append(`layout`,Z);let r=``;if(U&&U.id===t.id)r=Re===`triple`?[Be,He,We].filter(Boolean).join(`
`):Pe;else{let e=t.metadata?.copywriting?.headline_3line;r=Array.isArray(e)&&e.filter(Boolean).length>0?e.filter(Boolean).join(`
`):t.selected_headline||t.title}if(n.append(`headline`,r),dt===`stock`&&lt&&lt.includes(Ut))n.append(`base_image`,lt);else if(dt===`stock`&&Ut)try{let e=await(await fetch(`${$}/vault/stock-random?folder=${encodeURIComponent(Ut)}`)).json();e.success&&e.absolute_path?n.append(`base_image`,e.absolute_path):lt&&U?.id===t.id?n.append(`base_image`,lt):t.media_paths&&t.media_paths.length>0&&n.append(`base_image`,t.media_paths[0])}catch{lt&&U?.id===t.id?n.append(`base_image`,lt):t.media_paths&&t.media_paths.length>0&&n.append(`base_image`,t.media_paths[0])}else lt&&U?.id===t.id?n.append(`base_image`,lt):t.media_paths&&t.media_paths.length>0&&n.append(`base_image`,t.media_paths[0]);let i=``;if(i=U&&U.id===t.id?ot:t.metadata?.copywriting?.highlight||``,i)n.append(`keywords`,i);else{let e=[];if(t.metadata){let n=t.metadata;e=n.keywords||n.tags||[]}e.length>0&&n.append(`keywords`,e.join(`,`))}Pr(n),Ir(`canvas`,n.toString())},
    children:[O.canvas?
  JSX(G,{
    className:`w-5 h-5 animate-spin`}):
  JSX(fe,{
    className:`w-5 h-5`}),
  JSX(`span`,{
    className:`font-semibold`,
    children:Se===null?O.canvas?`กำลังเขียนภาพและคำนวณสัดส่วน...`:ye.length>1?`สั่งเรนเดอร์โพสรูปกลุ่มจำนวน ${ye.length} ภาพด้วย Pillow (Draw Posters)`:`สั่งเรนเดอร์ภาพโพสรูปด้วย Pillow (Draw Poster)`:`กำลังสร้างโพสรูปที่ ${Se+1}/${De.length} ...`})]}),
  JSXS(`div`,{
    className:`space-y-4 bg-slate-900/30 p-4 rounded-xl border border-slate-800 shadow-xl mt-4`,
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-2 pb-2 border-b border-slate-800`,
    children:[
  JSX(z,{
    className:`w-4 h-4 text-green-400`}),
  JSX(`span`,{
    className:`text-xs font-bold text-white`,
    children:`💾 ส่งออกข้อมูลและบันทึกรูปลง Local (Export Data & Images)`})]}),
  JSX(`p`,{
    className:`text-[10px] text-slate-400 leading-snug`,
    children:`ตั้งค่าโฟลเดอร์ที่ต้องการจัดเก็บไฟล์ข้อมูล (.csv) และภาพที่ Render เสร็จสิ้น`}),
  JSXS(`div`,{
    className:`grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2`,
    children:[
  JSXS(`button`,{type:`button`,
    onClick:async()=>{try{let e=await window.showDirectoryPicker({mode:`readwrite`});$e(e),tt(e.name),localStorage.setItem(`canvas_export_folder_name`,e.name)}catch(e){if(e.name===`AbortError`)return;console.error(`Folder picker error:`,e),alert(`❌ ไม่สามารถเลือกโฟลเดอร์ได้: `+e.message)}},
    className:`w-full rounded-xl text-xs font-black flex items-center justify-center gap-2.5`,style:{background:et?`linear-gradient(90deg, rgba(124, 45, 18, 0.4), rgba(120, 53, 15, 0.4), rgba(15, 23, 42, 1))`:`rgba(249,115,22,0.1)`,color:`#fb923c`,border:et?`2px solid rgba(249, 115, 22, 0.5)`:`2px solid rgba(251, 146, 60, 0.8)`,padding:`14px 16px`,borderRadius:`12px`,boxShadow:et?`0 0 15px rgba(249,115,22,0.25)`:`0 0 18px rgba(249,115,22,0.45), 0 0 35px rgba(249,115,22,0.15)`,fontWeight:900,fontSize:`0.75rem`,cursor:`pointer`,transition:`all 0.3s ease`},
    children:[
  JSX(re,{
    className:`w-4 h-4`,style:{color:`#fb923c`}}),
  JSX(`span`,{
    children:et?`📁 โฟลเดอร์ปลายทาง: ${et}`:`📂 เลือกโฟลเดอร์ที่จะจัดเก็บ`})]}),
  JSXS(`button`,{type:`button`,
    onClick:Ar,
    className:`w-full rounded-xl font-black text-xs flex items-center justify-center gap-2`,style:{background:`linear-gradient(90deg, #4ade80, #34d399, #22c55e)`,color:`#0a0a0a`,border:`2px solid #86efac`,padding:`14px 16px`,borderRadius:`12px`,boxShadow:`0 0 30px rgba(34,197,94,0.8), 0 0 60px rgba(34,197,94,0.3)`,fontWeight:900,fontSize:`0.75rem`,cursor:`pointer`,transition:`all 0.3s ease`},
    children:[
  JSX(z,{
    className:`w-4 h-4`,style:{color:`#0a0a0a`}}),
  JSX(`span`,{
    children:`🚀 เริ่มบันทึกไฟล์และรูปภาพ`})]})]}),
  JSX(`p`,{
    className:`text-[10px] text-slate-500 text-center`,
    children:ye.length>0?`📌 จะส่งออก ${ye.length} รายการที่เลือก`:`📦 จะส่งออกทุกรายการที่ Import (${K.length} รายการ)`})]})]}),
  JSXS(`div`,{
    className:`glass-panel p-6 flex flex-col justify-start min-h-[400px]`,style:{order:1},
    children:[
  JSXS(`div`,{
    children:[
  JSXS(`div`,{
    className:`flex items-center justify-between border-b border-slate-850 pb-4 mb-4`,
    children:[
  JSXS(`h2`,{
    className:`text-md font-bold text-white flex items-center gap-2`,
    children:[
  JSX(ee,{
    className:`w-5 h-5 text-emerald-400`}),`พรีวิวชิ้นงาน (Design Preview Hub)`]}),
  JSXS(`div`,{
    className:`flex bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0`,
    children:[
  JSX(`button`,{type:`button`,
    onClick:()=>Qn(`live`),
    className:`px-3 py-1.5 text-[10px] font-extrabold rounded-md transition-all select-none ${Zn===`live`?`bg-cyan-500 text-slate-950 shadow-md font-black`:`text-slate-400 hover:text-white`}`,
    children:`Live HTML5`}),
  JSX(`button`,{type:`button`,
    onClick:()=>Qn(`pillow`),
    className:`px-3 py-1.5 text-[10px] font-extrabold rounded-md transition-all select-none ${Zn===`pillow`?`bg-emerald-500 text-slate-950 shadow-md font-black`:`text-slate-400 hover:text-white`}`,
    children:`Pillow Render`})]})]}),
  JSX(`p`,{
    className:`text-[11px] text-slate-400 mb-6 leading-relaxed`,
    children:Zn===`live`?`จำลองการจัดวางสัดส่วน สีสัน โลโก้ และเนื้อหาแบบเรียลไทม์ (Live Container Mockup) ก่อนกดส่งเรนเดอร์ผ่าน Pillow`:`พรีวิวภาพโพสรูปความละเอียดสูงสำเร็จรูป (Pillow Subprocess Output) ที่บันทึกลงฐานข้อมูล SQL เรียบร้อยแล้ว`})]}),Zn===`live`?(()=>{let e=an.find(e=>e.id===je)||an[0],t=sr===`ai_trendtech`?{headline:`สร้างกองทัพ AI 15 ตัวด้วย Sub-agents ทำแทนคุณอัตโนมัติ! (มีต่อ👇)`,highlight:`Sub-agents`}:{headline:`วิธีประหยัดเวลาทำงาน 10 เท่า ด้วย 100 Prompt เทพที่บริษัทที่ปรึกษาปกปิด! (มีต่อ👇)`,highlight:`100 Prompt`},n=(Re===`triple`?[Be,He,We].filter(Boolean).join(`
`):Pe)||t.headline,r=ot||t.highlight;return
  JSXS(`div`,{
    className:`w-full flex flex-col items-center justify-start p-2 mb-2 animate-fade-in`,
    children:[
  JSXS(`div`,{
    className:`preview-canvas-container relative overflow-hidden rounded-xl border border-slate-800 shadow-2xl ${ke===`16:9`?`aspect-[16/9] w-full`:ke===`4:3`?`aspect-[4/3] w-full`:ke===`9:16`?`aspect-[9/16] h-[400px]`:ke===`4:5`?`aspect-[4/5] h-[400px]`:`aspect-square w-full`}`,style:{maxWidth:`380px`,margin:`0 auto`},
    children:[
  JSXS(`div`,{
    className:`absolute top-0 left-0 right-0 overflow-hidden`,style:{height:Z===`top_gainers`?`${Ln}%`:`100%`,backgroundImage:lt?`url(${$}/vault/media?path=${encodeURIComponent(lt)})`:`url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800)`,backgroundSize:`cover`,backgroundPosition:`center`},
    children:[
  JSX(`div`,{
    className:`absolute inset-0 bg-black/40`}),Z===`youtube`&&
  JSX(`div`,{
    className:`absolute inset-0 z-10`,style:{background:`linear-gradient(to top, rgba(12, 12, 12, 0.95) 0%, rgba(12, 12, 12, 0.8) 35%, rgba(12, 12, 12, 0) 65%)`}}),Z===`ai_news`&&
  JSX(`div`,{
    className:`absolute z-20 flex items-center justify-center rounded-lg bg-red-600 px-3 py-1.5 shadow-lg border-2 border-pink-500/80`,style:{left:`4cqw`,top:`4cqw`,boxShadow:`0 0 10px rgba(236, 72, 153, 0.4)`},
    children:
  JSX(`span`,{
    className:`text-[10px] font-black tracking-wider text-white`,
    children:`ข่าว AI`})}),Z===`github`&&
  JSX(`div`,{
    className:`absolute z-20 flex items-center justify-center rounded-lg bg-[#10b981] px-3 py-1.5 shadow-lg border border-emerald-450`,style:{left:`4cqw`,top:`4cqw`},
    children:
  JSX(`span`,{
    className:`text-[10px] font-black tracking-wider text-white`,
    children:`GITHUB`})}),Z===`quotes`&&
  JSXS(Y.Fragment,{
    children:[
  JSX(`span`,{
    className:`absolute z-10 font-serif select-none pointer-events-none`,style:{left:`5cqw`,top:`1cqw`,fontSize:`18cqw`,color:e.highlight,opacity:.3,lineHeight:1},
    children:`“`}),
  JSX(`span`,{
    className:`absolute z-10 font-serif select-none pointer-events-none`,style:{right:`5cqw`,bottom:`14cqw`,fontSize:`18cqw`,color:e.highlight,opacity:.3,lineHeight:1},
    children:`”`})]}),U&&U.media_paths&&U.media_paths.length>1&&
  JSXS(Y.Fragment,{
    children:[
  JSX(`button`,{type:`button`,
    onClick:e=>{e.stopPropagation();let t=U.media_paths,n=t.indexOf(lt);Zr(U,t[n<=0?t.length-1:n-1])},
    className:`absolute left-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-350 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md shadow-black/40 font-black text-xs select-none pointer-events-auto`,title:`ดูรูปพื้นหลังก่อนหน้า`,
    children:`◀`}),
  JSX(`button`,{type:`button`,
    onClick:e=>{e.stopPropagation();let t=U.media_paths,n=t.indexOf(lt);Zr(U,t[n===-1||n>=t.length-1?0:n+1])},
    className:`absolute right-2.5 top-1/2 -translate-y-1/2 z-30 w-8 h-8 rounded-full bg-slate-950/80 border border-slate-850 text-slate-350 hover:text-white flex items-center justify-center transition-all hover:bg-slate-900 active:scale-95 hover:scale-105 shadow-md shadow-black/40 font-black text-xs select-none pointer-events-auto`,title:`ดูรูปพื้นหลังถัดไป`,
    children:`▶`}),
  JSXS(`div`,{
    className:`absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800/40 text-[9px] font-black text-slate-300 tracking-wider`,
    children:[`🖼️ ฉากคลังภาพที่ `,(U.media_paths.indexOf(lt)===-1?0:U.media_paths.indexOf(lt))+1,`/`,U.media_paths.length]})]}),Jt&&(Xt===`youtube-channel`&&U?
  JSXS(`div`,{style:{position:`absolute`,top:`4cqw`,left:`4cqw`,display:`flex`,alignItems:`center`,gap:`1.5cqw`,background:`rgba(0,0,0,0.75)`,backdropFilter:`blur(8px)`,border:`0.3cqw solid rgba(255,255,255,0.15)`,borderRadius:`1.8cqw`,padding:`1.2cqw 2cqw`,zIndex:15},
    children:[U.author_avatar_url?
  JSX(`img`,{src:`${$}/vault/media?path=${encodeURIComponent(U.author_avatar_url)}`,alt:`channel`,style:{width:`5cqw`,height:`5cqw`,borderRadius:`50%`,border:`0.25cqw solid rgba(255,255,255,0.3)`,objectFit:`cover`,flexShrink:0}}):
  JSX(`div`,{style:{width:`5cqw`,height:`5cqw`,borderRadius:`50%`,background:`#ef4444`,display:`flex`,alignItems:`center`,justifyContent:`center`,fontSize:`2.5cqw`,fontWeight:900,color:`white`,flexShrink:0},
    children:`▶`}),
  JSXS(`div`,{style:{display:`flex`,flexDirection:`column`,gap:`0.2cqw`,minWidth:0},
    children:[
  JSX(`span`,{style:{fontSize:`2cqw`,fontWeight:800,color:`white`,whiteSpace:`nowrap`,overflow:`hidden`,textOverflow:`ellipsis`},
    children:U.author_name||`YouTube Channel`}),
  JSX(`span`,{style:{fontSize:`1.5cqw`,fontWeight:600,color:`rgba(255,255,255,0.6)`},
    children:U.metadata?.subscribers_formatted||(U.author_followers?`${U.author_followers} subscribers`:`N/A`)})]})]}):Xt===`youtube-channel`?null:
  JSXS(`div`,{
    className:`live-badge`,style:{backgroundColor:e.highlight,border:`0.3cqw solid ${e.accent}`},
    children:[
  JSX(`span`,{
    className:`live-badge-title font-extrabold`,style:{color:e.highlightText},
    children:$t||`AI`}),
  JSX(`span`,{
    className:`live-badge-subtitle font-medium text-white`,
    children:nn||`Content Lab`})]})),It&&
  JSX(Y.Fragment,{
    children:Ot?
  JSX(`img`,{src:`${$}${Ot}`,alt:`Page Logo`,
    className:`live-logo-image`,style:{...Rt.includes(`right`)?{right:`${Mt}px`}:{left:`${Mt}px`},...Rt.includes(`bottom`)?{bottom:`${Pt}px`}:{top:`${Pt}px`},width:`${At}%`}}):
  JSX(`div`,{
    className:`live-logo-placeholder`,style:{...Rt.includes(`right`)?{right:`${Mt}px`}:{left:`${Mt}px`},...Rt.includes(`bottom`)?{bottom:`${Pt}px`}:{top:`${Pt}px`},width:`${At}%`,height:`${At}%`},
    children:`LOGO`})}),ln&&
  JSXS(`div`,{
    className:`live-news-card`,style:{bottom:`4cqw`,left:`4cqw`,width:`55%`},
    children:[
  JSX(`div`,{
    className:`live-news-title font-extrabold truncate`,
    children:dn||`ข่าวด่วน AI`}),
  JSX(`div`,{
    className:`live-news-detail`,
    children:pn||`บอทอัจฉริยะรุ่นใหม่ประมวลผลเร็วขึ้น 20 เท่า ค่าบริการลดลง 90% เริ่มใช้งานแล้ววันนี้`}),
  JSXS(`div`,{
    className:`live-news-source font-bold`,
    children:[`📰 แหล่งข่าว: `,hn||`Content Lab`]})]}),_n&&
  JSXS(`div`,{
    className:`live-callout-sticker`,style:{top:Cn===`top_left`||Cn===`top_right`?`18cqw`:`auto`,bottom:Cn===`bottom_left`||Cn===`bottom_right`?`4cqw`:`auto`,left:Cn===`top_left`||Cn===`bottom_left`?`4cqw`:`auto`,right:Cn===`top_right`||Cn===`bottom_right`?`4cqw`:`auto`,...Cn===`random`?{top:`30%`,left:`20%`}:{}},
    children:[
  JSXS(`span`,{
    className:`live-callout-hl`,
    children:[`📢 `,xn||`อัพเดตล่าสุด`]}),
  JSX(`span`,{
    className:`live-callout-text font-bold`,
    children:yn||`วิธีสร้างแบบละเอียดในคอมเม้นท์`}),
  JSX(`div`,{
    className:`live-callout-sticker-badge`,
    children:Tn.includes(`down`)?`👇`:`👉`})]}),Dn&&
  JSXS(`div`,{
    className:`live-meme-sticker`,style:{bottom:`4cqw`,right:`4cqw`},
    children:[
  JSX(`span`,{
    className:`live-meme-text`,
    children:kn||`โคตรประหยัดเวลา`}),
  JSX(`span`,{
    className:`live-meme-subtext`,
    children:jn||`AI ช่วยรันงานขนาน`})]})]}),Z===`top_gainers`&&
  JSX(`div`,{
    className:`live-split-divider`,style:{top:`${Ln}%`,backgroundColor:e.accent}}),Z===`top_gainers`?
  JSXS(`div`,{
    className:`live-headline-section`,style:{top:`calc(${Ln}% + 0.8cqw)`,paddingTop:`${Un/10.8}cqw`},
    children:[
  JSX(`div`,{
    className:`live-headline-text flex-1 flex items-center`,style:{fontSize:`${Fn*4.2}cqw`,fontFamily:zn},
    children:
  JSX(`p`,{
    className:`w-full font-black tracking-wide leading-snug`,style:{textAlign:Vn},
    children:$r(n,r)})}),
  JSXS(`div`,{
    className:`live-credit-text border-t border-slate-900 pt-3 text-slate-400`,
    children:[`เครดิต: `,Nn||`Coinpulse Content Lab`]})]}):
  JSXS(`div`,{
    className:`absolute inset-x-0 bottom-0 top-0 flex flex-col justify-between p-6 z-20`,style:{fontFamily:zn,pointerEvents:`none`},
    children:[
  JSX(`div`,{
    className:`h-12`}),
  JSX(`div`,{
    className:`flex-1 flex items-center justify-center`,style:{fontSize:`${Fn*4.2}cqw`,textAlign:Vn,textShadow:`0 2px 8px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)`,padding:`0 2cqw`},
    children:
  JSX(`p`,{
    className:`font-black tracking-wide leading-snug w-full`,
    children:$r(n,r)})}),
  JSXS(`div`,{
    className:`flex items-end justify-between w-full min-h-16`,
    children:[Z===`quotes`&&
  JSXS(`div`,{
    className:`w-full text-center font-bold text-amber-550`,style:{fontSize:`3.4cqw`,textShadow:`0 2px 4px rgba(0,0,0,0.8)`},
    children:[`— `,Nn||`Content Factory V2`]}),Z===`youtube`&&
  JSXS(`div`,{
    className:`ml-auto flex items-center gap-2 bg-slate-950/85 border border-slate-800/80 rounded-xl p-2.5 max-w-[210px] shadow-lg shadow-black/60`,style:{backdropFilter:`blur(4px)`},
    children:[
  JSX(`div`,{
    className:`w-8 h-8 rounded-full bg-red-600 flex items-center justify-center shadow-inner overflow-hidden shrink-0`,
    children:Ot?
  JSX(`img`,{src:Ot,alt:`Channel Logo`,
    className:`w-full h-full object-contain`}):
  JSX(`span`,{
    className:`text-[10px] font-black text-white`,
    children:`YT`})}),
  JSXS(`div`,{
    className:`text-left`,
    children:[
  JSX(`p`,{
    className:`text-[9px] font-black text-white truncate max-w-[130px]`,
    children:Nn||`Coinpulse Tech`}),
  JSX(`p`,{
    className:`text-[7.5px] font-bold text-slate-400 mt-0.5`,
    children:`👤 1.25M subscribers`})]})]})]})]})]}),pt&&
  JSXS(`div`,{
    className:`w-full mt-6 pt-6 border-t border-slate-800/80 animate-fade-in flex flex-col items-center`,
    children:[
  JSXS(`div`,{
    className:`flex items-center justify-between mb-3 text-left w-full`,
    children:[
  JSXS(`div`,{
    className:`flex items-center gap-2`,
    children:[
  JSX(N,{
    className:`w-4 h-4 text-emerald-400`}),
  JSX(`span`,{
    className:`text-xs font-black text-emerald-400 uppercase tracking-wider text-left`,
    children:`🎯 ผลลัพธ์ (Pillow Output)`})]}),
  JSXS(`div`,{
    className:`flex items-center gap-2`,
    children:[_t.length>0&&
  JSXS(Y.Fragment,{
    children:[
  JSXS(`button`,{type:`button`,
    onClick:()=>{vt([]),mt(null)},
    className:`flex items-center gap-1 text-[10px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2.5 py-1 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95`,
    children:[
  JSX(ve,{
    className:`w-3.5 h-3.5`}),`เคลียร์รูปภาพ`]}),
  JSX(`button`,{type:`button`,disabled:rr,
    onClick:async()=>{if(!$n){alert(`กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน`);return}if(_t.length!==0){ir(!0),or(`กำลังเริ่มอัพโหลด...`);try{let e=_t.map(e=>e.file_path);or(`อัพโหลด ${e.length} ไฟล์ไปยัง Dropbox...`);let t=await(await fetch(`${$}/vault/dropbox/batch-upload`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({file_paths:e,dropbox_token:$n,dropbox_folder:tr})})).json();if(!t.success)throw Error(t.error||`Upload failed`);let n=t.results.filter(e=>e.error).length;if(n>0){let e=t.results.find(e=>e.error)?.error||`Unknown error`;if(n===t.results.length)throw Error(e);alert(`การอัพโหลดบางส่วนล้มเหลว (${n}/${t.results.length} ไฟล์): ${e}`)}or(`สร้างไฟล์ CSV...`);let r=[[`พาดหัว`,`บทความโพส`,`Dropbox Link`].join(`,`)],i=t.results.filter(e=>!e.error);for(let e of i){let t=_t.find(t=>t.file_path===e.file_path),n=``,i=``;if(t){let e=t.content_id,r=B.find(t=>t.id===e)||K.find(t=>t.id===e);if(r){let e=r.metadata?.copywriting;n=e?.headline_3line?.join(` `)||r.selected_headline||r.title||``,i=e?.caption||``}}if(!n){let e=U?.metadata?.copywriting;n=e?.headline_3line?.join(` `)||U?.selected_headline||U?.title||``,i=e?.caption||``}let a=e=>`"${(e||``).replace(/"/g,`""`).replace(/\n/g,`\\n`)}"`;r.push([a(n),a(i),a(e.shared_link||``)].join(`,`))}let a=`﻿`+r.join(`
`),o=new Blob([a],{type:`text/csv;charset=utf-8;`}),s=URL.createObjectURL(o),c=document.createElement(`a`);c.href=s,c.download=`content_export_${new Date().toISOString().slice(0,10)}.csv`,c.click(),URL.revokeObjectURL(s),or(`✅ อัพโหลดสำเร็จ ${i.length} ไฟล์ + บันทึก CSV แล้ว!`),setTimeout(()=>or(``),5e3)}catch(e){console.error(`Dropbox upload error:`,e);let t=e.message||``,n=t;(t.includes(`invalid_access_token`)||t.includes(`401`))&&(n=`Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่`),or(`❌ เกิดข้อผิดพลาด: ${n}`),setTimeout(()=>or(``),1e4)}ir(!1)}},style:{display:`flex`,alignItems:`center`,gap:`5px`,fontSize:`10px`,fontWeight:900,padding:`5px 12px`,borderRadius:`8px`,border:`1.5px solid rgba(56,189,248,0.4)`,background:rr?`rgba(56,189,248,0.08)`:`linear-gradient(90deg, rgba(14,165,233,0.2), rgba(56,189,248,0.15))`,color:rr?`#7dd3fc`:`#38bdf8`,cursor:rr?`not-allowed`:`pointer`,opacity:$n?1:.6,transition:`all 0.2s ease`,boxShadow:`0 0 10px rgba(56,189,248,0.1)`},
    children:rr?
  JSXS(Y.Fragment,{
    children:[
  JSX(G,{
    className:`w-3 h-3 animate-spin`}),` กำลังอัพโหลด...`]}):
  JSXS(Y.Fragment,{
    children:[
  JSX(xe,{
    className:`w-3 h-3`}),` ☁️ Dropbox + CSV`]})})]}),
  JSXS(`span`,{
    className:`text-[10px] font-black text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0`,
    children:[_t.length,` รูป`]})]}),ar&&
  JSX(`p`,{style:{fontSize:`9px`,fontWeight:700,color:ar.startsWith(`✅`)?`#4ade80`:ar.startsWith(`❌`)?`#f87171`:`#7dd3fc`,marginTop:`6px`},
    children:ar})]}),
  JSX(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(5, minmax(0, 1fr))`,gap:`12px`,width:`100%`},
    children:_t.map((e,t)=>
  JSXS(`div`,{
    className:`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-350 cursor-zoom-in`,
    onClick:()=>{St(`${$}/vault/media?path=${encodeURIComponent(e.file_path)}`),wt((H?B:K).find(t=>t.id===e.content_id)||U)},
    children:[
  JSX(`img`,{src:`${$}/vault/media?path=${encodeURIComponent(e.file_path)}`,alt:`Poster Output ${t+1}`,
    className:`w-full h-auto rounded-lg object-contain border border-slate-900 group-hover:scale-[1.03] transition-all duration-305`}),
  JSXS(`div`,{
    className:`absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 font-mono text-[8px] px-1.5 py-0.5 rounded-md shadow z-10`,
    children:[`#`,t+1]}),
  JSX(`div`,{
    className:`absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300`,
    children:
  JSX(ee,{
    className:`w-5 h-5 text-emerald-400 filter drop-shadow`})})]},e.id))})]})]})})():
  JSX(`div`,{
    className:`w-full flex flex-col items-center justify-start p-4 bg-slate-950/40 rounded-xl border border-slate-850/80 mb-4 relative overflow-hidden min-h-[300px]`,
    children:ht?
  JSXS(`div`,{
    className:`flex flex-col items-center text-slate-500 gap-2`,
    children:[
  JSX(G,{
    className:`w-8 h-8 animate-spin text-cyan-400`}),
  JSX(`span`,{
    className:`text-xs`,
    children:`กำลังโหลดไฟล์รูปภาพ...`})]}):pt?
  JSXS(`div`,{
    className:`w-full h-full flex flex-col items-center justify-center`,
    children:[
  JSXS(`div`,{
    className:`flex items-center justify-between w-full mb-3 px-1 border-b border-slate-800/80 pb-2`,
    children:[
  JSXS(`span`,{
    className:`text-[10px] font-bold text-slate-400 flex items-center gap-1.5`,
    children:[
  JSX(N,{
    className:`w-3.5 h-3.5 text-emerald-400`}),`ผลลัพธ์การเรนเดอร์ในเซสชันนี้:`]}),
  JSXS(`div`,{
    className:`flex items-center gap-2 flex-wrap`,
    children:[_t.length>0&&
  JSXS(Y.Fragment,{
    children:[
  JSXS(`button`,{type:`button`,
    onClick:()=>{vt([]),mt(null)},
    className:`flex items-center gap-1 text-[9px] font-black text-slate-400 hover:text-pink-400 bg-slate-900 hover:bg-pink-950/20 px-2 py-0.5 rounded border border-slate-800 hover:border-pink-900 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95`,
    children:[
  JSX(ve,{
    className:`w-2.5 h-2.5`}),`เคลียร์รูปภาพ`]}),
  JSX(`button`,{type:`button`,disabled:rr,
    onClick:async()=>{if(!$n){alert(`กรุณากรอก Dropbox Access Token ในส่วนตั้งค่าพื้นฐานก่อน`);return}if(_t.length!==0){ir(!0),or(`กำลังเริ่มอัพโหลด...`);try{let e=_t.map(e=>e.file_path);or(`อัพโหลด ${e.length} ไฟล์ไปยัง Dropbox...`);let t=await(await fetch(`${$}/vault/dropbox/batch-upload`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({file_paths:e,dropbox_token:$n,dropbox_folder:tr})})).json();if(!t.success)throw Error(t.error||`Upload failed`);let n=t.results.filter(e=>e.error).length;if(n>0){let e=t.results.find(e=>e.error)?.error||`Unknown error`;if(n===t.results.length)throw Error(e);alert(`การอัพโหลดบางส่วนล้มเหลว (${n}/${t.results.length} ไฟล์): ${e}`)}or(`สร้างไฟล์ CSV...`);let r=[[`พาดหัว`,`บทความโพส`,`Dropbox Link`].join(`,`)],i=t.results.filter(e=>!e.error);for(let e of i){let t=_t.find(t=>t.file_path===e.file_path),n=``,i=``;if(t){let e=t.content_id,r=B.find(t=>t.id===e)||K.find(t=>t.id===e);if(r){let e=r.metadata?.copywriting;n=e?.headline_3line?.join(` `)||r.selected_headline||r.title||``,i=e?.caption||``}}if(!n){let e=U?.metadata?.copywriting;n=e?.headline_3line?.join(` `)||U?.selected_headline||U?.title||``,i=e?.caption||``}let a=e=>`"${(e||``).replace(/"/g,`""`).replace(/\n/g,`\\n`)}"`;r.push([a(n),a(i),a(e.shared_link||``)].join(`,`))}let a=`﻿`+r.join(`
`),o=new Blob([a],{type:`text/csv;charset=utf-8;`}),s=URL.createObjectURL(o),c=document.createElement(`a`);c.href=s,c.download=`content_export_${new Date().toISOString().slice(0,10)}.csv`,c.click(),URL.revokeObjectURL(s),or(`✅ อัพโหลดสำเร็จ ${i.length} ไฟล์ + บันทึก CSV แล้ว!`),setTimeout(()=>or(``),5e3)}catch(e){console.error(`Dropbox upload error:`,e);let t=e.message||``,n=t;(t.includes(`invalid_access_token`)||t.includes(`401`))&&(n=`Dropbox Access Token ไม่ถูกต้องหรือหมดอายุการใช้งานแล้ว (Access Token ของ Dropbox แบบสั้นจะหมดอายุทุกๆ 4 ชั่วโมง) กรุณาตรวจสอบหรือสร้าง Token ใหม่`),or(`❌ เกิดข้อผิดพลาด: ${n}`),setTimeout(()=>or(``),1e4)}ir(!1)}},style:{display:`flex`,alignItems:`center`,gap:`4px`,fontSize:`9px`,fontWeight:900,padding:`4px 10px`,borderRadius:`6px`,border:`1.5px solid rgba(56,189,248,0.4)`,background:rr?`rgba(56,189,248,0.08)`:`linear-gradient(90deg, rgba(14,165,233,0.2), rgba(56,189,248,0.15))`,color:rr?`#7dd3fc`:`#38bdf8`,cursor:rr?`not-allowed`:`pointer`,opacity:$n?1:.6,transition:`all 0.2s ease`,boxShadow:`0 0 8px rgba(56,189,248,0.08)`},
    children:rr?
  JSXS(Y.Fragment,{
    children:[
  JSX(G,{
    className:`w-2.5 h-2.5 animate-spin`}),` อัพโหลด...`]}):
  JSXS(Y.Fragment,{
    children:[
  JSX(xe,{
    className:`w-2.5 h-2.5`}),` ☁️ Dropbox + CSV`]})})]}),
  JSXS(`span`,{
    className:`text-[9px] font-black text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 shrink-0`,
    children:[_t.length,` รูป`]})]}),ar&&
  JSX(`p`,{style:{fontSize:`8px`,fontWeight:700,color:ar.startsWith(`✅`)?`#4ade80`:ar.startsWith(`❌`)?`#f87171`:`#7dd3fc`,marginTop:`4px`},
    children:ar})]}),
  JSX(`div`,{style:{display:`grid`,gridTemplateColumns:`repeat(5, minmax(0, 1fr))`,gap:`12px`,width:`100%`},
    children:_t.map((e,t)=>
  JSXS(`div`,{
    className:`relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950/50 p-1.5 shadow-lg group hover:border-emerald-400/80 transition-all duration-350 cursor-zoom-in`,
    onClick:()=>{St(`${$}/vault/media?path=${encodeURIComponent(e.file_path)}`),wt((H?B:K).find(t=>t.id===e.content_id)||U)},
    children:[
  JSX(`img`,{src:`${$}/vault/media?path=${encodeURIComponent(e.file_path)}`,alt:`Poster Output ${t+1}`,
    className:`w-full h-auto rounded-lg object-contain border border-slate-900 group-hover:scale-[1.03] transition-all duration-300`}),
  JSXS(`div`,{
    className:`absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-sm text-slate-300 border border-slate-800 font-mono text-[8px] px-1.5 py-0.5 rounded-md shadow z-10`,
    children:[`#`,t+1]}),
  JSX(`div`,{
    className:`absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300`,
    children:
  JSX(ee,{
    className:`w-5 h-5 text-emerald-400 filter drop-shadow`})})]},e.id))})]}):
  JSXS(`div`,{
    className:`text-center p-8 text-slate-600 w-full flex flex-col items-center justify-center min-h-[220px]`,
    children:[
  JSX(ae,{
    className:`w-16 h-16 mx-auto mb-4 text-slate-800`}),
  JSX(`p`,{
    className:`text-xs font-semibold`,
    children:`ไม่มีภาพโพสรูปที่สร้างขึ้นในระบบขณะนี้`}),
  JSX(`p`,{
    className:`text-[10px] mt-1 text-slate-700`,
    children:`กรุณาเลือกคอนเทนต์และสั่งเรนเดอร์วาดภาพโพสรูปด้วยปุ่มทางด้านซ้าย`})]})}),pt&&
  JSXS(`div`,{
    className:`p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-xs text-center flex items-center justify-center gap-1.5`,
    children:[
  JSX(N,{
    className:`w-4 h-4`}),
  JSX(`span`,{
    children:`ภาพโพสรูปล่าสุดถูกเรนเดอร์เสร็จสิ้นและบันทึกลงSQLite สำเร็จ!`})]})]})]}),e===`settings`&&
  JSX(`div`,{
    className:`glass-panel p-6`,
    children:
  JSX(Qe,{appScale:n,setAppScale:r})}),e===`tracking`&&
  JSX(`iframe`,{src:`/tracking-dashboard.html`,style:{width:`100%`,height:`calc(100vh - 150px)`,border:`none`,borderRadius:`12px`,background:`transparent`},title:`Sync