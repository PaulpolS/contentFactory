const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

process.env.PATH = `/opt/homebrew/opt/ffmpeg-full/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${process.env.PATH || ''}`;

const jobPath = process.argv[2];
if (!jobPath || !fs.existsSync(jobPath)) {
  console.error("Job file not found!");
  process.exit(1);
}

const job = JSON.parse(fs.readFileSync(jobPath, 'utf8'));
const { projectId, topic, scenes, outputPath, subtitles, subtitleStyle, headline, headlineStyle } = job;
const basePublicDir = path.resolve(__dirname, '../public');
const fontsDir = path.resolve(__dirname, '../public/Font_stock');
const tempDir = path.resolve(__dirname, '../public/temp_render', projectId.toString());

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const hasThai = (text) => /[\u0E00-\u0E7F]/.test(text || '');

function resolveFontPath(fontName, isBold = false) {
  const name = String(fontName).toLowerCase().trim();
  const mapping = {
    'chonburi': 'Chonburi-Regular.ttf',
    'itim': 'Itim-Regular.ttf',
    'kanit': isBold ? 'Kanit-Bold.ttf' : 'Kanit-Regular.ttf',
    'mali': 'Mali-Bold.ttf',
    'mitr': 'Mitr-Medium.ttf',
    'notosansthai': 'NotoSansThai-Bold.ttf',
    'prompt': isBold ? 'Prompt-Bold.ttf' : 'Prompt-Regular.ttf',
    'sarabun': 'Sarabun-Bold.ttf'
  };
  const file = mapping[name] || mapping[name.replace(/\s+/g, '')];
  if (file) {
    const fullPath = path.join(fontsDir, file);
    if (fs.existsSync(fullPath)) return fullPath;
  }
  
  // Generic search in public/Font_stock
  try {
    const files = fs.readdirSync(fontsDir);
    const matched = files.find(f => f.toLowerCase().includes(name));
    if (matched) return path.join(fontsDir, matched);
  } catch (e) {}

  // Fallback to Kanit if Thai font not found
  const fallback = isBold ? 'Kanit-Bold.ttf' : 'Kanit-Regular.ttf';
  return path.join(fontsDir, fallback);
}

const getVisualLength = (str) => {
  if (!str) return 0;
  // Remove Thai combining characters that stack vertically
  return str.replace(/[\u0E31\u0E34-\u0E3A\u0E47-\u0E4C]/g, '').length;
};

function wrapText(text, maxCharsPerLine = 22) {
  if (!text) return '';
  const lines = text.split(/\r?\n/);
  const resultLines = [];
  
  for (const line of lines) {
    if (getVisualLength(line) <= maxCharsPerLine) {
      resultLines.push(line);
      continue;
    }
    
    let tokens = [];
    try {
      if (typeof Intl !== 'undefined' && Intl.Segmenter) {
        const segmenter = new Intl.Segmenter('th', { granularity: 'word' });
        const segments = Array.from(segmenter.segment(line));
        tokens = segments.map((seg) => seg.segment);
      } else {
        tokens = line.split(' ');
      }
    } catch (e) {
      tokens = line.split(' ');
    }
    
    let currentLine = '';
    for (const token of tokens) {
      if (token === '\n' || token === '\r') {
        if (currentLine) resultLines.push(currentLine);
        currentLine = '';
        continue;
      }
      
      const currentVisual = getVisualLength(currentLine);
      const tokenVisual = getVisualLength(token);
      
      if (currentVisual + tokenVisual <= maxCharsPerLine) {
        currentLine += token;
      } else {
        if (!currentLine) {
          let tempToken = token;
          while (getVisualLength(tempToken) > maxCharsPerLine) {
            // Find slice point by visual length
            let sliceIdx = 0;
            let accVisual = 0;
            for (let i = 0; i < tempToken.length; i++) {
              const char = tempToken[i];
              const isCombining = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4C]/.test(char);
              if (!isCombining) {
                accVisual++;
              }
              if (accVisual > maxCharsPerLine) {
                sliceIdx = i;
                break;
              }
            }
            if (sliceIdx === 0) sliceIdx = tempToken.length;
            
            resultLines.push(tempToken.substring(0, sliceIdx));
            tempToken = tempToken.substring(sliceIdx);
          }
          currentLine = tempToken;
        } else {
          resultLines.push(currentLine);
          if (token.trim() === '') {
            currentLine = '';
          } else {
            let tempToken = token;
            while (getVisualLength(tempToken) > maxCharsPerLine) {
              let sliceIdx = 0;
              let accVisual = 0;
              for (let i = 0; i < tempToken.length; i++) {
                const char = tempToken[i];
                const isCombining = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4C]/.test(char);
                if (!isCombining) {
                  accVisual++;
                }
                if (accVisual > maxCharsPerLine) {
                  sliceIdx = i;
                  break;
                }
              }
              if (sliceIdx === 0) sliceIdx = tempToken.length;
              
              resultLines.push(tempToken.substring(0, sliceIdx));
              tempToken = tempToken.substring(sliceIdx);
            }
            currentLine = tempToken;
          }
        }
      }
    }
    
    if (currentLine) {
      resultLines.push(currentLine);
    }
  }
  
  return resultLines.map(l => l.trim()).filter(Boolean).join('\n');
}


function srtTimeToAssTime(srtTime) {
  const cleanTime = srtTime.trim().replace(',', '.');
  const parts = cleanTime.split(':');
  if (parts.length < 3) return '0:00:00.00';
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const secondsFloat = parseFloat(parts[2]);
  
  const centiseconds = Math.round((secondsFloat - Math.floor(secondsFloat)) * 100);
  const seconds = Math.floor(secondsFloat);
  
  const formattedHours = hours.toString();
  const formattedMinutes = minutes.toString().padStart(2, '0');
  const formattedSeconds = seconds.toString().padStart(2, '0');
  const formattedCentiseconds = centiseconds.toString().padStart(2, '0').substring(0, 2);
  
  return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedCentiseconds}`;
}

function convertSrtToAss(srtText, fontName, fontSize, marginV, primaryColor, outlineColor, shadowColor, borderStyle, outlineThickness, shadowThickness) {
  const hexToAss = (hex) => {
     if(!hex) return "FFFFFF";
     const h = hex.replace('#', '').toUpperCase();
     if(h.length !== 6) return "FFFFFF";
     return `${h.substring(4,6)}${h.substring(2,4)}${h.substring(0,2)}`;
  };

  const priColorHex = hexToAss(primaryColor);
  const outColorHex = hexToAss(outlineColor);
  const backColorHex = borderStyle === 3 ? outColorHex : hexToAss(shadowColor);

  const scaledFontSize = Math.round(fontSize * 8 / 3);
  const scaledOutline = (outlineThickness !== undefined ? outlineThickness : 2.5) * 2.0;
  const scaledShadow = (shadowThickness !== undefined ? shadowThickness : 0) * 2.0;

  let ass = `[Script Info]
Title: Animated Subtitles
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${fontName},${scaledFontSize},&H00${priColorHex},&H000000FF,&H00${outColorHex},&H00${backColorHex},-1,0,0,0,100,100,0,0,${borderStyle},${scaledOutline},${scaledShadow},2,50,50,${marginV},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const normalized = srtText.replace(/\r\n/g, '\n').trim();
  const blocks = normalized.split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 3) continue;

    const timingIndex = lines.findIndex(l => l.includes('-->'));
    if (timingIndex === -1) continue;

    const timingLine = lines[timingIndex];
    const textLines = lines.slice(timingIndex + 1);
    const text = textLines.join('\\N');

    const timingParts = timingLine.split('-->');
    if (timingParts.length < 2) continue;

    const startAss = srtTimeToAssTime(timingParts[0]);
    const endAss = srtTimeToAssTime(timingParts[1]);

    ass += `Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,${text}\n`;
  }

  return ass;
}

function generateUnifiedAss(subtitles, subtitleStyle, headline, headlineStyle) {
  const hexToAss = (hex) => {
     if (!hex) return "FFFFFF";
     const h = hex.replace('#', '').toUpperCase();
     if (h.length !== 6) return "FFFFFF";
     return `${h.substring(4,6)}${h.substring(2,4)}${h.substring(0,2)}`;
  };

  const opacityToAssAlpha = (opacity) => {
    if (opacity === undefined) return "00";
    const alpha = Math.round((1 - opacity) * 255);
    return alpha.toString(16).toUpperCase().padStart(2, '0');
  };

  let ass = `[Script Info]
Title: Animated Subtitles & Headlines
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
`;

  // 1. Define Subtitle Style
  const st = subtitleStyle || {};
  let fontName = st.fontName || 'Arial';
  if (hasThai(subtitles) && ['arial', 'helvetica', 'impact', 'courier new', 'sans-serif'].includes(fontName.toLowerCase())) {
    fontName = 'Kanit';
  }
  const scaledFontSize = Math.round((st.fontSize || 24) * 8 / 3);
  const scaledOutline = (st.outlineThickness !== undefined ? st.outlineThickness : 2.5) * 2.0;
  const scaledShadow = (st.shadowThickness !== undefined ? st.shadowThickness : 0) * 2.0;
  const priColorHex = hexToAss(st.primaryColor || '#ffffff');
  const outColorHex = hexToAss(st.outlineColor || '#000000');
  const backColorHex = st.borderStyle === 3 ? outColorHex : hexToAss(st.shadowColor || '#000000');
  const borderStyle = st.borderStyle !== undefined ? st.borderStyle : 1;
  const marginV = st.marginV || 30;

  ass += `Style: Default,${fontName},${scaledFontSize},&H00${priColorHex},&H000000FF,&H00${outColorHex},&H00${backColorHex},-1,0,0,0,100,100,0,0,${borderStyle},${scaledOutline},${scaledShadow},2,50,50,${marginV},1\n`;

  // 2. Define Headline Style
  if (headline && headlineStyle) {
    const hl = headlineStyle;
    
    // Strict boolean and type casting for all settings
    const hlBoxEnabled = hl.boxEnabled === true || String(hl.boxEnabled).toLowerCase() === 'true';
    let hlFontName = hl.fontName || 'Arial';
    if (hasThai(headline) && ['arial', 'helvetica', 'impact', 'courier new', 'sans-serif'].includes(hlFontName.toLowerCase())) {
      hlFontName = 'Kanit';
    }
    const hlFontSize = parseFloat(hl.fontSize) || 40;
    const hlOutlineWidth = hl.outlineWidth !== undefined ? parseFloat(hl.outlineWidth) : 0;
    const hlShadowBlur = hl.shadowBlur !== undefined ? parseFloat(hl.shadowBlur) : 0;
    const hlBoxOpacity = hl.boxOpacity !== undefined ? parseFloat(hl.boxOpacity) : 1.0;
    const hlPaddingX = hl.paddingX !== undefined ? parseFloat(hl.paddingX) : 16;
    const hlPaddingY = hl.paddingY !== undefined ? parseFloat(hl.paddingY) : 8;
    
    const scaledHlFontSize = Math.round(hlFontSize * 8 / 3);
    const priColorHex = hexToAss(hl.fontColor || '#ffffff');
    const outColorHex = hexToAss(hl.outlineColor || '#000000');
    const shadowColorHex = hexToAss(hl.shadowColor || '#000000');
    const rawBoxColor = hl.boxColor || '#000000';
    const boxColorHex = hexToAss(rawBoxColor);
    
    let hlBorderStyle;
    let backColorHex;
    let backColorAlpha;
    let outlineColorHex;
    let scaledOutline;
    let scaledShadow;

    if (hlBoxEnabled) {
      hlBorderStyle = 3; // Opaque Box
      backColorHex = boxColorHex;
      backColorAlpha = opacityToAssAlpha(hlBoxOpacity);
      
      // If outlineWidth > 0, use outlineColor. Otherwise use boxColor to prevent default black border.
      outlineColorHex = hlOutlineWidth > 0 ? outColorHex : boxColorHex;
      
      // The solid background box padding is defined by Outline parameter
      scaledOutline = Math.round(hlPaddingX * 2.0);
      
      // Shadow must be 0 to keep the box perfectly centered around the text!
      scaledShadow = 0;
    } else {
      hlBorderStyle = 1; // Normal Outline/Shadow
      outlineColorHex = outColorHex;
      backColorHex = shadowColorHex;
      backColorAlpha = '00'; // Opaque glow layer
      
      scaledOutline = Math.round(hlOutlineWidth * 8 / 3);
      
      // Set Style shadow to a non-zero value so libass doesn't skip rendering the shadow layer
      scaledShadow = Math.max(1.0, hlShadowBlur * 0.15) * 2.0;
    }

    ass += `Style: Headline,${hlFontName},${scaledHlFontSize},&H00${priColorHex},&H000000FF,&H${backColorAlpha}${outlineColorHex},&H${backColorAlpha}${backColorHex},-1,0,0,0,100,100,0,0,${hlBorderStyle},${scaledOutline},${scaledShadow},8,50,50,0,1\n`;
  }

  ass += `\n[Events]\nFormat: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text\n`;

  // 3. Populate Subtitle Dialogues
  if (subtitles) {
    const normalized = subtitles.replace(/\r\n/g, '\n').trim();
    const blocks = normalized.split(/\n\s*\n/);
    const maxSubChars = Math.max(16, Math.floor(650 / (scaledFontSize * 0.42)));

    for (const block of blocks) {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 3) continue;

      const timingIndex = lines.findIndex(l => l.includes('-->'));
      if (timingIndex === -1) continue;

      const timingLine = lines[timingIndex];
      const textLines = lines.slice(timingIndex + 1);
      const rawText = textLines.join(' ').replace(/\s+/g, ' ').trim();
      const wrappedText = wrapText(rawText, maxSubChars);
      const text = wrappedText.split('\n').join('\\N');

      const timingParts = timingLine.split('-->');
      if (timingParts.length < 2) continue;

      const startAss = srtTimeToAssTime(timingParts[0]);
      const endAss = srtTimeToAssTime(timingParts[1]);

      ass += `Dialogue: 0,${startAss},${endAss},Default,,0,0,0,,${text}\n`;
    }
  }

  // 4. Populate Headline Dialogues
  if (headline && headlineStyle) {
    const hl = headlineStyle;
    const hlBoxEnabled = hl.boxEnabled === true || String(hl.boxEnabled).toLowerCase() === 'true';
    const hlFontSize = parseFloat(hl.fontSize) || 40;
    const scaledHlFontSize = Math.round(hlFontSize * 8 / 3);
    const maxCharsPerLine = Math.max(12, Math.floor(950 / (scaledHlFontSize * 0.42)));
    const wrappedHeadline = wrapText(headline, maxCharsPerLine);
    const lines = wrappedHeadline.split('\n').map(l => l.trim()).filter(Boolean);

    const hlY = hl.y !== undefined ? parseFloat(hl.y) : 150;
    let lineY = hlY;
    
    const hlOutlineWidth = hl.outlineWidth !== undefined ? parseFloat(hl.outlineWidth) : 0;
    const hlShadowBlur = hl.shadowBlur !== undefined ? parseFloat(hl.shadowBlur) : 0;
    const hlPaddingX = hl.paddingX !== undefined ? parseFloat(hl.paddingX) : 16;
    const hlLineSpacing = hl.lineSpacing !== undefined ? parseFloat(hl.lineSpacing) : 10;
    
    const scaledOutline = hlBoxEnabled ? Math.round(hlPaddingX * 2.0) : Math.round(hlOutlineWidth * 8 / 3);
    const scaledLineSpacing = Math.round(hlLineSpacing * 8 / 3);
    
    const blurAmount = (!hlBoxEnabled && hlShadowBlur > 0) ? Math.min(10, Math.round(hlShadowBlur * 0.3)) : 0;
    const blurTag = blurAmount > 0 ? `\\blur${blurAmount}` : '';

    const endAssTime = '9:59:59.99';

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i];
      let inlineTags = `\\an8\\pos(540,${Math.round(lineY)})\\shad0`;
      
      if (!hlBoxEnabled) {
        inlineTags += `\\bord${scaledOutline}`;
      }
      
      if (blurTag) {
        inlineTags += blurTag;
      }

      ass += `Dialogue: 1,0:00:00.00,${endAssTime},Headline,,0,0,0,,{${inlineTags}}${lineText}\n`;

      if (hlBoxEnabled) {
        lineY += scaledHlFontSize + (scaledOutline * 2) + scaledLineSpacing;
      } else {
        lineY += scaledHlFontSize + scaledLineSpacing;
      }
    }
  }

  return ass;
}

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, {
      maxBuffer: 50 * 1024 * 1024,
      env: {
        ...process.env,
        LANG: 'en_US.UTF-8',
        LC_ALL: 'en_US.UTF-8'
      }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error(`[CMD FAILED] ${cmd.substring(0, 200)}...`);
        console.error(stderr?.substring(0, 500));
        reject(error);
      }
      else resolve(stdout);
    });
  });
}

function getAbsolutePath(url) {
  if (!url) {
    console.log("[DEBUG-AUDIO] URL is empty or null");
    return null;
  }
  console.log("[DEBUG-AUDIO] original URL input:", url);
  // If the path is already an absolute path that exists on disk, use it directly
  if (fs.existsSync(url)) {
    console.log("[DEBUG-AUDIO] resolved as existing absolute path:", url);
    return url;
  }
  // Handle HTTP/HTTPS localhost or remote URLs by extracting pathname and mapping to local public directory
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const parsedUrl = new URL(url);
      const pathname = parsedUrl.pathname;
      if (pathname) {
        const publicPath = path.join(basePublicDir, pathname);
        console.log("[DEBUG-AUDIO] parsing URL pathname:", pathname, "-> publicPath:", publicPath);
        if (fs.existsSync(publicPath)) {
          console.log("[DEBUG-AUDIO] resolved existing publicPath:", publicPath);
          return publicPath;
        }
        // Fallback search inside public directories (in case of folder structure discrepancies)
        const parts = pathname.split('/');
        const fileName = parts[parts.length - 1];
        const folderName = parts[parts.length - 2];
        if (fileName && folderName) {
          const directPath = path.join(basePublicDir, folderName, fileName);
          console.log("[DEBUG-AUDIO] trying directPath fallback:", directPath);
          if (fs.existsSync(directPath)) {
            console.log("[DEBUG-AUDIO] resolved existing directPath fallback:", directPath);
            return directPath;
          }
        }
      }
    } catch (e) {
      console.log("[DEBUG-AUDIO] error parsing URL:", e.message);
    }
  }
  // If it starts with '/' but does not exist at root level, resolve relative to the public folder
  if (url.startsWith('/')) {
    const publicPath = path.join(basePublicDir, url);
    console.log("[DEBUG-AUDIO] resolving relative path:", url, "-> publicPath:", publicPath);
    if (fs.existsSync(publicPath)) {
      console.log("[DEBUG-AUDIO] resolved existing relative path:", publicPath);
      return publicPath;
    }
    return publicPath;
  }
  return url;
}

async function getFileDuration(filePath) {
  try {
    const result = await runCommand(
      `ffprobe -v error -show_entries format=duration -of csv=p=0 "${filePath}"`
    );
    const dur = parseFloat(result.trim());
    if (isNaN(dur) || dur <= 0) return null;
    return dur;
  } catch (e) {
    return null;
  }
}

// แปลง transition type จาก UI เป็น ffmpeg xfade transition name
function mapTransition(type) {
  const map = {
    'fade': 'fade',
    'slide-left': 'slideleft',
    'slide-right': 'slideright',
    'zoom-in': 'circleopen',
    'glitch': 'pixelize',
  };
  return map[type] || null;
}

function getAudioSpeechIntervals(audioPath, totalDuration) {
  return new Promise((resolve) => {
    if (!audioPath || !fs.existsSync(audioPath)) {
        // Fallback: speak for the whole duration
        return resolve([{start: 0, end: totalDuration}]);
    }
    const cmd = `ffmpeg -i "${audioPath}" -af silencedetect=noise=-30dB:d=0.15 -f null -`;
    exec(cmd, (error, stdout, stderr) => {
        const lines = stderr.split('\n');
        const silenceStarts = [];
        const silenceEnds = [];
        lines.forEach(line => {
             const startMatch = line.match(/silence_start: ([\d.]+)/);
             if (startMatch) silenceStarts.push(parseFloat(startMatch[1]));
             const endMatch = line.match(/silence_end: ([\d.]+)/);
             if (endMatch) silenceEnds.push(parseFloat(endMatch[1]));
        });

        let speechIntervals = [];
        let currentPos = 0;
        for (let i = 0; i < silenceStarts.length; i++) {
             let sStart = silenceStarts[i];
             let sEnd = silenceEnds[i] || sStart + 0.15; // fallback
             if (sStart > currentPos) {
                 speechIntervals.push({start: currentPos, end: sStart});
             }
             currentPos = sEnd;
        }
        if (currentPos < totalDuration) {
             speechIntervals.push({start: currentPos, end: totalDuration});
        }
        
        // If it failed to detect anything (e.g. noise above -30dB whole time)
        if (speechIntervals.length === 0) {
             speechIntervals.push({start: 0, end: totalDuration});
        }
        resolve(speechIntervals);
    });
  });
}

async function buildAvatarSequence(scene, duration, index, audioPath) {
  if (!scene.avatarCharacter) return null;
  const charDir = path.join(path.resolve(__dirname, '../public/Avatar_stock'), scene.avatarCharacter);
  if (!fs.existsSync(charDir)) return null;

  let animations = {
    talking: ['neutral', 'talking'],
    laughing: ['happy', 'talking'],
    angry_talk: ['angry', 'talking'],
    crying: ['crying', 'sad']
  };
  const animConfigFile = path.join(charDir, 'animations.json');
  if (fs.existsSync(animConfigFile)) {
     try { animations = JSON.parse(fs.readFileSync(animConfigFile, 'utf8')); } catch(e){}
  }

  const expNames = animations[scene.avatarAnimation || 'talking'] || animations['talking'];
  
  const files = fs.readdirSync(charDir).filter(f => f.endsWith('.png'));
  if (files.length === 0) return null;
  
  const getImgPath = (exp) => {
     let f = files.find(f => {
        const parts = f.replace('.png','').split('_');
        const expName = parts.length >= 2 ? parts[1] : parts[0];
        return expName === exp;
     });
     return f ? path.join(charDir, f) : null;
  };
  
  const frameA = getImgPath(expNames[0]) || getImgPath('neutral') || path.join(charDir, files[0]);
  const frameB = getImgPath(expNames[1]) || frameA;

  const animType = scene.avatarAnimation || 'talking';
  
  // Audio-driven lip sync!
  const speechIntervals = await getAudioSpeechIntervals(audioPath, duration);
  
  // Generate concat sequence
  let concatText = '';
  // Time resolution: 0.12 seconds per frame for natural look
  const step = 0.12;
  let currentDur = 0;
  
  while (currentDur < (duration + 0.5)) {
      // Check if current time is within any speech interval
      const isSpeaking = speechIntervals.some(iv => currentDur >= iv.start && currentDur <= iv.end);
      
      let frameFile;
      if (isSpeaking) {
          // Flip-flop between frameA and frameB (if talking)
          const talkCycle = Math.floor(currentDur / step) % 2;
          frameFile = talkCycle === 0 ? frameA : frameB;
      } else {
          // Silent frame (Neutral expression)
          // We always use the 'neutral' equivalent provided as first element
          frameFile = frameA;
      }
      
      concatText += `file '${frameFile}'\n`;
      concatText += `duration ${step}\n`;
      currentDur += step;
  }
  
  concatText += `file '${frameA}'\n`;

  const concatFile = path.join(tempDir, `avatar_scene_${index}.txt`);
  fs.writeFileSync(concatFile, concatText);
  return concatFile;
}

async function renderScene(scene, index) {
  console.log(`[INFO] ========== Scene ${index + 1} ==========`);
  const mediaPath = getAbsolutePath(scene.imageUrl);
  const audioPath = getAbsolutePath(scene.audioUrl);
  const outPath = path.join(tempDir, `scene_${index}.mp4`);

  const isRemoteMedia = mediaPath && (mediaPath.startsWith('http://') || mediaPath.startsWith('https://'));
  if (!mediaPath || (!isRemoteMedia && !fs.existsSync(mediaPath))) {
    throw new Error(`Scene ${index + 1}: ไม่มีไฟล์ media`);
  }

  const isVideo = mediaPath.endsWith('.mp4') || mediaPath.endsWith('.mov') || mediaPath.endsWith('.webm') || isRemoteMedia;

  const isRemoteAudio = audioPath && (audioPath.startsWith('http://') || audioPath.startsWith('https://'));
  let duration;
  if (audioPath && (isRemoteAudio || fs.existsSync(audioPath))) {
    duration = await getFileDuration(audioPath);
    console.log(`[PROBE] เสียงยาว ${duration}s`);
  }
  if (!duration) {
    duration = parseFloat(scene.duration) || 5;
    console.log(`[FALLBACK] ใช้ scene.duration: ${duration}s`);
  }
  
  const avatarConcatFile = await buildAvatarSequence(scene, duration, index, audioPath);

  let colorFilterStr = '';
  const cFilter = scene.colorFilter || job.colorFilter || '';
  if (cFilter === 'grayscale' || cFilter === 'blackwhite') {
    colorFilterStr = ',eq=saturation=0';
  } else if (cFilter === 'dark') {
    colorFilterStr = ',eq=brightness=-0.25:contrast=1.15';
  } else if (cFilter === 'contrast') {
    colorFilterStr = ',eq=contrast=1.35:brightness=-0.05';
  } else if (cFilter === 'dark-grayscale') {
    colorFilterStr = ',eq=saturation=0:brightness=-0.25:contrast=1.15';
  }

  let bgFilter = `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920${colorFilterStr},setsar=1:1,fps=30`;
  if (!isVideo && scene.animation) {
    const totalFrames = Math.ceil(duration * 30);
    if (scene.animation === 'zoom-in') bgFilter = `zoompan=z='min(zoom+0.0015,1.5)':d=${totalFrames}:s=1080x1920${colorFilterStr},setsar=1:1,fps=30`;
    if (scene.animation === 'zoom-out') bgFilter = `zoompan=z='1.5-0.0015*in':d=${totalFrames}:s=1080x1920${colorFilterStr},setsar=1:1,fps=30`;
  }


  const videoOpts = `-c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -crf 18 -r 30`;
  const loopFlag = isVideo ? '-stream_loop -1' : '-loop 1';
  let cmd = `ffmpeg -y ${loopFlag} -i "${mediaPath}" `;
  
  // Audio Input [1:a]
  if (audioPath && (isRemoteAudio || fs.existsSync(audioPath))) {
     cmd += `-i "${audioPath}" `;
  } else {
     cmd += `-f lavfi -i anullsrc=channel_layout=stereo:sample_rate=44100 `;
  }

  // Avatar Input [2:v] (if exists)
  if (avatarConcatFile) {
     cmd += `-f concat -safe 0 -i "${avatarConcatFile}" `;
     
     let posStr = "x=(W-w)/2:y=H-h-120"; // Center Bottom (lifted up 120px to look proper)
     let avScale = 900;
     
     if (scene.avatarPos) {
         avScale = Math.round(900 * (scene.avatarPos.scale || 1));
         const xPx = Math.round(1080 * (scene.avatarPos.x / 100));
         const yPx = Math.round(1920 * (scene.avatarPos.y / 100));
         posStr = `x=${xPx}:y=${yPx}`;
     } else {
         if (scene.avatarPosition === 'bottom-right') posStr = "x=W-w-50:y=H-h-120";
         if (scene.avatarPosition === 'bottom-left') posStr = "x=50:y=H-h-120";
     }

     const filterComplex = `[0:v]${bgFilter}[bg]; [2:v]scale=${avScale}:-1[av]; [bg][av]overlay=${posStr}:format=auto[outv]`;
     
     cmd += `-filter_complex "${filterComplex}" -map "[outv]" -map 1:a ${videoOpts} -c:a aac -b:a 128k -ar 44100 -ac 2 -shortest -t ${duration} "${outPath}"`;
  } else {
     // No avatar, use simple -vf
     cmd += `-map 0:v -map 1:a ${videoOpts} -vf "${bgFilter}" -c:a aac -b:a 128k -ar 44100 -ac 2 -shortest -t ${duration} "${outPath}"`;
  }

  await runCommand(cmd);
  if (avatarConcatFile) {
     try { fs.unlinkSync(avatarConcatFile); } catch(e){}
  }
  console.log(`[OK] Scene ${index + 1} → ${path.basename(outPath)}`);
  return outPath;
}

async function start() {
  try {
    console.log(`[START] Rendering ${scenes.length} scenes...`);

    // Phase 1: สร้างคลิปแต่ละฉากแยกกัน
    const clipPaths = [];
    const clipDurations = [];

    for (let i = 0; i < scenes.length; i++) {
      const outPath = await renderScene(scenes[i], i);
      clipPaths.push(outPath);
      const dur = await getFileDuration(outPath);
      clipDurations.push(dur || 5);
      console.log(`[DURATION] Scene ${i + 1} rendered = ${clipDurations[i].toFixed(2)}s`);
    }

    // Debug: พิมพ์ข้อมูล transition ของทุกฉาก
    for (let i = 0; i < scenes.length; i++) {
      console.log(`[DEBUG] Scene ${i+1}: transitionType="${scenes[i].transitionType || 'none'}" transitionSoundUrl="${scenes[i].transitionSoundUrl || 'ไม่มี'}"`);
    }

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const baseName = (headline || topic || 'Test').replace(/[^a-zA-Z0-9ก-๙]/g, '_').slice(0, 80);
    const finalOutPath = path.join(outputPath, `${baseName}_${Date.now()}.mp4`);

    // Phase 2: ตรวจว่ามี transition หรือ SFX อะไรบ้าง
    const TRANSITION_DURATION = 0.5;
    let hasAnyTransitionOrSfx = false;
    for (let i = 0; i < scenes.length - 1; i++) {
      if (mapTransition(scenes[i].transitionType) || scenes[i].transitionSoundUrl) {
        hasAnyTransitionOrSfx = true;
        break;
      }
    }

    let currentClip;
    let extraFilesToCleanup = [];

    // ===== Phase 2: ตรวจว่ามี transition หรือ SFX อะไรบ้าง =====
    if (!hasAnyTransitionOrSfx) {
      console.log(`[INFO] ไม่มี transition/SFX → เตรียมการไฟล์วีดีโอ`);
      if (clipPaths.length === 1) {
        currentClip = clipPaths[0];
      } else {
        const listFile = path.join(tempDir, 'list.txt');
        fs.writeFileSync(listFile, clipPaths.map(f => `file '${f}'`).join('\n') + '\n');
        const concatMerged = path.join(tempDir, 'concat_merged.mp4');
        await runCommand(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${concatMerged}"`);
        currentClip = concatMerged;
        extraFilesToCleanup.push(listFile);
        extraFilesToCleanup.push(concatMerged);
      }
    } else {
      // ===== มี transition/SFX → xfade ทีละคู่ =====
      console.log(`[INFO] มี transition/SFX → xfade processing...`);
      currentClip = clipPaths[0];
      let currentDuration = clipDurations[0];

    for (let i = 0; i < scenes.length - 1; i++) {
      const nextClip = clipPaths[i + 1];
      const nextDuration = clipDurations[i + 1];
      const transType = mapTransition(scenes[i].transitionType);
      const sfxUrl = scenes[i].transitionSoundUrl;
      const sfxPath = sfxUrl ? getAbsolutePath(sfxUrl) : null;
      const isRemoteSfx = sfxPath && (sfxPath.startsWith('http://') || sfxPath.startsWith('https://'));
      const hasSfx = sfxPath && (isRemoteSfx || fs.existsSync(sfxPath));
      const mergedPath = path.join(tempDir, `merged_${i}.mp4`);

      console.log(`[PAIR ${i}] transType=${transType || 'none'} | sfxPath=${sfxPath || 'none'} | sfxExists=${hasSfx}`);

      if (transType) {
        // ===== มี xfade ภาพ =====
        const offset = Math.max(0, currentDuration - TRANSITION_DURATION);
        console.log(`[XFADE] Scene ${i+1} → ${i+2} | type=${transType} offset=${offset.toFixed(2)}s`);

        let filterComplex = `[0:v][1:v]xfade=transition=${transType}:duration=${TRANSITION_DURATION}:offset=${offset.toFixed(3)}[vout];[0:a][1:a]acrossfade=d=${TRANSITION_DURATION}[aout]`;

        if (hasSfx) {
          console.log(`[SFX] mixing ${path.basename(sfxPath)} at ${offset.toFixed(2)}s`);
          const delayMs = Math.round(offset * 1000);
          const cmd = `ffmpeg -y -i "${currentClip}" -i "${nextClip}" -i "${sfxPath}" -filter_complex "${filterComplex};[aout]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[afmt];[2:a]adelay=${delayMs}|${delayMs},aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=1.5[sfx];[afmt][sfx]amix=inputs=2:duration=first:dropout_transition=2[afinal]" -map "[vout]" -map "[afinal]" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -crf 18 -r 30 -c:a aac -b:a 128k -ar 44100 -ac 2 "${mergedPath}"`;
          await runCommand(cmd);
        } else {
          const cmd = `ffmpeg -y -i "${currentClip}" -i "${nextClip}" -filter_complex "${filterComplex}" -map "[vout]" -map "[aout]" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -crf 18 -r 30 -c:a aac -b:a 128k -ar 44100 -ac 2 "${mergedPath}"`;
          await runCommand(cmd);
        }
      } else if (hasSfx) {
        // ===== ไม่มี xfade แต่มี SFX → concat แล้วใส่เสียง SFX ที่รอยต่อ =====
        console.log(`[SFX-ONLY] ใส่เสียง ${path.basename(sfxPath)} ที่ ${currentDuration.toFixed(2)}s (ตัดชน)`);
        const listFile = path.join(tempDir, `pair_${i}.txt`);
        fs.writeFileSync(listFile, `file '${currentClip}'\nfile '${nextClip}'\n`);
        const concatTemp = path.join(tempDir, `concat_temp_${i}.mp4`);
        await runCommand(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${concatTemp}"`);
        
        const delayMs = Math.round(currentDuration * 1000);
        const cmd = `ffmpeg -y -i "${concatTemp}" -i "${sfxPath}" -filter_complex "[1:a]adelay=${delayMs}|${delayMs},aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo,volume=1.5[sfx];[0:a]aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo[main];[main][sfx]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 128k -ar 44100 -ac 2 "${mergedPath}"`;
        await runCommand(cmd);
        try { fs.unlinkSync(concatTemp); } catch(e) {}
        try { fs.unlinkSync(listFile); } catch(e) {}
      } else {
        // ===== ไม่มี transition ไม่มี SFX → concat ธรรมดา =====
        console.log(`[CONCAT] Scene ${i+1} → ${i+2} (ตัดชน)`);
        const listFile = path.join(tempDir, `pair_${i}.txt`);
        fs.writeFileSync(listFile, `file '${currentClip}'\nfile '${nextClip}'\n`);
        await runCommand(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c copy "${mergedPath}"`);
        try { fs.unlinkSync(listFile); } catch(e) {}
      }

      // อัปเดต currentClip สำหรับรอบถัดไป
      const mergedDur = await getFileDuration(mergedPath);
      currentDuration = mergedDur || (currentDuration + nextDuration - (transType ? TRANSITION_DURATION : 0));
      currentClip = mergedPath;
    }
  }

  // ===== Unified ASS Subtitles & Headlines Burning =====
  if (subtitles || headline) {
    console.log(`[RENDER-OVERLAYS] 🔤 Generating unified ASS subtitle and headline file...`);
    const assPath = path.join(tempDir, 'subs.ass');
    const assContent = generateUnifiedAss(subtitles, subtitleStyle, headline, headlineStyle);
    fs.writeFileSync(assPath, assContent, 'utf8');

    const overlaysOutput = path.join(tempDir, 'merged_with_overlays.mp4');
    
    // Ensure path is escaped correctly for ffmpeg filter
    const escapedAssPath = assPath.replace(/\\/g, '/').replace(/:/g, '\\:');
    const escapedFontsDir = fontsDir.replace(/\\/g, '/').replace(/:/g, '\\:');
    
    const cmd = `ffmpeg -y -i "${currentClip}" -vf "subtitles='${escapedAssPath}':fontsdir='${escapedFontsDir}'" -c:v libx264 -pix_fmt yuv420p -profile:v high -level 4.1 -crf 18 -r 30 -c:a copy "${overlaysOutput}"`;
    console.log(`[RENDER-OVERLAYS] 🔥 Burning subtitles and headlines into video in a single pass with high definition H.264 profile...`);
    await runCommand(cmd);
    currentClip = overlaysOutput;
  }

  // คัดลอกผลลัพธ์สุดท้าย
  fs.copyFileSync(currentClip, finalOutPath);
  console.log(`[SUCCESS] ✅ Output → ${finalOutPath}`);

  // Cleanup
  cleanup(clipPaths, extraFilesToCleanup);
  try { fs.unlinkSync(path.join(tempDir, 'subs.ass')); } catch(e) {}
  try { fs.unlinkSync(path.join(tempDir, 'merged_with_overlays.mp4')); } catch(e) {}
  
  // ลบ merged files
  for (let i = 0; i < scenes.length - 1; i++) {
    const f = path.join(tempDir, `merged_${i}.mp4`);
    try { fs.unlinkSync(f); } catch(e) {}
  }

  } catch(e) {
    console.error("[ERROR]", e.message);
    process.exit(1);
  }
}

function cleanup(files, extras) {
  files.forEach(f => { try { fs.unlinkSync(f); } catch(e){} });
  extras.forEach(f => { try { fs.unlinkSync(f); } catch(e){} });
  try { fs.rmdirSync(tempDir); } catch(e) {}
}

start();
