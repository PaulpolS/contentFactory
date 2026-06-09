with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Let's target the exact corrupted block
target = """                          {savedLogos.map((logo) => {
                            const isSelected = canvasLogoUrl === logo.url;
                            return (
                              <div key={logo.name} className="relative group">
                                <button
                                  onClick={() => {
                                    setCanvasLogoUrl(logo.url);
                                    if (rememberLogo) {
                                      localStorage.setItem('canvas_logo_url', logo.url);
                                    }
                                  }}
                                  className={`w-12 h-12 rounded-xl border-2 p-1.5 transition-all flex items-center justify-center bg-slate-900 ${
                                    isSelected 
                                      ? 'border-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-400/20' 
                                      : 'border-slate-800 hover:border-slate-600'
                                  }`}
                                  ti-slate-200'
                                }`}
                                title={opt.hint}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>"""

replacement = """                          {savedLogos.map((logo) => {
                            const isSelected = canvasLogoUrl === logo.url;
                            return (
                              <div key={logo.name} className="relative group">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCanvasLogoUrl(logo.url);
                                    if (rememberLogo) {
                                      localStorage.setItem('canvas_logo_url', logo.url);
                                    }
                                  }}
                                  className={`w-12 h-12 rounded-xl border-2 p-1.5 transition-all flex items-center justify-center bg-slate-900 ${
                                    isSelected 
                                      ? 'border-cyan-400 bg-cyan-500/10 shadow-md shadow-cyan-400/20' 
                                      : 'border-slate-800 hover:border-slate-600'
                                  }`}
                                  title={logo.name}
                                >
                                  <img src={`${logo.url}`} alt={logo.name} className="w-full h-full object-contain" />
                                </button>
                                {/* Delete stamp button */}
                                {!['crown.png', 'ai-badge.png'].includes(logo.name) && (
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
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}"""

if target in content:
    print("Found exact target!")
    new_content = content.replace(target, replacement)
    with open("/Users/paulpolsulintaboon/Documents/GitHub/ContentFactory/frontend/src/App.tsx", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Successfully replaced!")
else:
    print("Exact target NOT found. Let's try matching with flexible whitespace...")
    # Let's try a regex or simpler match
    import re
    # Match the block up to ti-slate-200' and opt.label and close
    pattern = re.compile(
        r"\{\s*savedLogos\.map\(\(logo\)\s*=>\s*\{.*?"
        r"ti-slate-200'.*?"
        r"opt\.label.*?"
        r"\}\s*\)\s*\)\s*\)\s*;\s*\}\s*\}\s*\)\s*\}\s*<\/div>",
        re.DOTALL
    )
    # Let's search with a broader pattern
    match = re.search(r"\{\s*savedLogos\.map\(\(logo\)\s*=>.*?ti-slate-200'.*?opt\.label.*?\)\s*\)\s*\)\s*;\s*\}\s*\}\s*\)\s*\}\s*<\/div>", content, re.DOTALL)
    if match:
        print("Broad match found!")
    else:
        print("Broad match not found either.")
