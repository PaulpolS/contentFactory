// ============================================================================
//  ffmpegBuilder.ts — "สมอง" ของ Single Clip Editor (พอร์ตจากสเปก §4)
//  สร้าง filter_complex + bash script สำหรับโหมด Jump Cut
//  ปรับ path ให้ตรงเครื่องนี้: FREI0R_PATH = /opt/homebrew/lib/frei0r-1
// ============================================================================

export interface TemplateDef {
  cut_dur: number;
  n_cuts: number;
  dynamic: boolean;
}

export const TEMPLATES: Record<string, TemplateDef> = {
  '⚡ Quick Cut  (0.5วิ × 8)': { cut_dur: 0.5, n_cuts: 8, dynamic: false },
  '🔥 Highlight  (0.8วิ × 6)': { cut_dur: 0.8, n_cuts: 6, dynamic: false },
  '💫 Dynamic Beat (สลับจังหวะ)': { cut_dur: 0.5, n_cuts: 8, dynamic: true },
  '😈 Phonk Beat (0.4วิ × 10)': { cut_dur: 0.4, n_cuts: 10, dynamic: true },
  '🌊 Slow Reveal (1.5วิ × 4)': { cut_dur: 1.5, n_cuts: 4, dynamic: false },
  '🎯 Micro Cuts  (0.3วิ × 10)': { cut_dur: 0.3, n_cuts: 10, dynamic: false },
  '✏️ Custom (กำหนดเอง)': { cut_dur: 0.5, n_cuts: 6, dynamic: false },
};

export interface EffectState { var: boolean; label: string; }
export type EffectMap = Record<string, EffectState>;

export const DEFAULT_EFFECTS: EffectMap = {
  fade_in: { var: true, label: 'Fade In (ค่อยๆ เปิด)' },
  sharpen: { var: true, label: 'Sharpen (เพิ่มความคม)' },
  vignette: { var: false, label: 'Vignette (ขอบมืด)' },
  glow: { var: false, label: 'Glow / Bloom (แสงเรือง)' },
  grain: { var: false, label: 'Film Grain (เม็ดฟิล์ม)' },
  chroma_ab: { var: false, label: 'Chromatic Aberration' },
  color_grade: { var: false, label: 'Color Grade (โทนอุ่น)' },
  zoom: { var: false, label: 'Ken Burns Zoom' },
  phonk_flash: { var: false, label: '💥 Phonk Flash' },
  phonk_shake: { var: false, label: '🫨 Phonk Shake' },
  phonk_invert: { var: false, label: '🔄 Phonk Invert' },
  fr_cartoon: { var: false, label: '🎨 Cartoon (frei0r)' },
  fr_glitch: { var: false, label: '📺 Glitch (frei0r)' },
};

export const FREI0R_KEYS = [
  'fr_cartoon', 'fr_glow', 'fr_glitch', 'fr_pixelize',
  'fr_scanline', 'fr_softglow', 'fr_nervous', 'fr_colorize',
];

const FREI0R_FILTERS: Record<string, string> = {
  fr_cartoon: 'frei0r=cartoon:0.5|0.1',
  fr_glow: 'frei0r=glow:0.5',
  fr_glitch: 'frei0r=glitch0r:0.1|0.5|0.5',
  fr_pixelize: 'frei0r=pixeliz0r:0.05|0.05',
  fr_scanline: 'frei0r=scanline0r:0',
  fr_softglow: 'frei0r=softglow:0.5|0.75|0.85',
  fr_nervous: 'frei0r=nervous',
  fr_colorize: 'frei0r=colorize:0.5|0.6|0.5',
};

export const TRANSITION_TYPES = [
  'fade', 'dissolve', 'wipeleft', 'wiperight',
  'slideleft', 'slideright', 'circleopen', 'radial',
];

export interface CutPreview { ts: number; dur: number; }

export interface SingleClipConfig {
  clipPath: string;
  outputPath: string;
  scene1Start: number;
  scene1End: number;
  cutsPreview: CutPreview[];
  bgmPath?: string;
  bgmVolStart: number;
  bgmRampAt: number;
  scEffects: EffectMap;   // Scene 1
  scEffectsS2: EffectMap; // Scene 2
  transType: string;
  transDur: number;
}

const fx = (n: number) => n.toFixed(3);

// สร้าง chain ของเอฟเฟกต์ที่ var=true ต่อกัน (สเปก §4.3)
// คืน { lines, lastLabel } — lines = filter ที่ต้องต่อ, lastLabel = label สุดท้ายของ chain
function buildFx(
  inputLabel: string,
  effects: EffectMap,
  prefix: string,
  ctx: { fps: string; zoomDur: string; vidW: string; vidH: string },
): { lines: string[]; lastLabel: string } {
  const lines: string[] = [];
  let cur = inputLabel;
  let n = 0;
  const hasFrei0r = FREI0R_KEYS.some(k => effects[k]?.var);

  const chain = (tag: string, filter: string) => {
    const out = `[${prefix}_${tag}_${n}]`;
    lines.push(`${cur}${filter}${out}`);
    cur = out;
    n++;
  };

  // ลำดับตามสเปก
  if (effects.fade_in?.var) chain('fade', 'fade=t=in:st=0:d=0.5');
  if (effects.zoom?.var) {
    chain('zoom', `zoompan=z='min(zoom+0.0008,1.08)':d=${ctx.fps}*${ctx.zoomDur}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${ctx.vidW}x${ctx.vidH}`);
  }
  if (effects.color_grade?.var) {
    chain('grade', `curves=r='0/0 0.5/0.58 1/1':g='0/0 0.5/0.50 1/1':b='0/0 0.5/0.42 1/0.9'`);
  }
  if (effects.sharpen?.var) chain('sharp', 'unsharp=5:5:1.2:5:5:0.0');
  if (effects.chroma_ab?.var) chain('chroma', 'rgbashift=rh=2:bh=-2');
  if (effects.vignette?.var) chain('vig', 'vignette=angle=PI/4');
  if (effects.phonk_flash?.var) chain('pflash', `eq=brightness='0.2*sin(t*8)':contrast=1.2`);
  if (effects.phonk_shake?.var) chain('pshake', 'crop=iw*0.9:ih*0.9:iw*0.05+20*sin(t*15):ih*0.05+20*cos(t*15),scale=iw:ih');
  if (effects.phonk_invert?.var) chain('pinv', 'negate');
  // glow ข้ามถ้ามี frei0r เปิดอยู่ (กันชนกัน)
  if (effects.glow?.var && !hasFrei0r) {
    chain('glow', 'split[a][b];[b]gblur=sigma=8[blur];[a][blur]blend=all_mode=screen:all_opacity=0.25');
  }
  if (effects.grain?.var) chain('grain', 'noise=alls=8:allf=t+u');

  // frei0r effects: ต้อง format=rgb24 ก่อน แล้วจบด้วย format=yuv420p
  const frActive = FREI0R_KEYS.filter(k => effects[k]?.var);
  if (frActive.length > 0) {
    chain('frin', 'format=rgb24');
    for (const k of frActive) chain(k.replace('fr_', 'fr'), FREI0R_FILTERS[k]);
    chain('frout', 'format=yuv420p');
  }

  return { lines, lastLabel: cur };
}

// สร้าง bash script เต็ม (สเปก §4.4)
export function buildBashScript(cfg: SingleClipConfig): string {
  const fps = '$fps';
  const zoomDur = '$zoom_dur';
  const cuts = cfg.cutsPreview;
  const nCuts = cuts.length;
  const s1Dur = Math.max(0.01, cfg.scene1End - cfg.scene1Start);
  const hasBgm = !!(cfg.bgmPath && cfg.bgmPath.trim());

  // --- (A) Header + probe ---
  const head: string[] = [
    '#!/bin/bash',
    'set -euo pipefail',
    `CLIP="\${1:-${cfg.clipPath}}"`,
    `OUTPUT="\${2:-${cfg.outputPath}}"`,
    `BGM="${hasBgm ? cfg.bgmPath : ''}"`,
    '[ ! -f "$CLIP" ] && { echo "Error: input not found: $CLIP"; exit 1; }',
    'duration=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$CLIP")',
    'fps=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=noprint_wrappers=1:nokey=1 "$CLIP" | head -n1)',
    'vid_w=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of default=noprint_wrappers=1:nokey=1 "$CLIP" | head -n1)',
    'vid_h=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of default=noprint_wrappers=1:nokey=1 "$CLIP" | head -n1)',
    '[ -z "$vid_w" ] && vid_w="1080"',
    '[ -z "$vid_h" ] && vid_h="1920"',
    'sr=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of default=noprint_wrappers=1:nokey=1 "$CLIP" | head -n1)',
    '[ -z "$sr" ] && sr="44100"',
    'cl="stereo"',
    'zoom_dur="${duration}"',
    'export FREI0R_PATH="/opt/homebrew/lib/frei0r-1:/usr/local/lib/frei0r-1:${FREI0R_PATH:-}"',
  ];

  // --- (B) input args ---
  const inputs: string[] = ['-i "$CLIP"'];
  for (const c of cuts) inputs.push(`-ss ${fx(c.ts)} -t ${fx(c.dur)} -i "$CLIP"`);
  const bgmIdx = nCuts + 1;
  if (hasBgm) inputs.push('-i "$BGM"');

  // --- (C) filter_complex ---
  const fc: string[] = [];
  const ctx = { fps, zoomDur, vidW: '${vid_w}', vidH: '${vid_h}' };
  const aformat = 'aformat=sample_fmts=fltp:sample_rates=44100:channel_layouts=stereo';

  // Scene 1 video
  fc.push(`[0:v]trim=${fx(cfg.scene1Start)}:${fx(cfg.scene1End)},setpts=PTS-STARTPTS[s1v_raw]`);
  const s1fx = buildFx('[s1v_raw]', cfg.scEffects, 's1', ctx);
  fc.push(...s1fx.lines);
  // บังคับขนาดให้เท่าต้นฉบับ (กัน effect บางตัวเปลี่ยนขนาด → xfade ต่อไม่ได้)
  fc.push(`${s1fx.lastLabel}scale=${ctx.vidW}:${ctx.vidH},setsar=1,fps=${fps}[s1_final]`);

  // Scene 2 video (concat jump cuts)
  for (let i = 0; i < nCuts; i++) {
    fc.push(`[${i + 1}:v]setpts=PTS-STARTPTS,scale=iw:ih:flags=fast_bilinear,format=yuv420p[cv${i}]`);
  }
  const cvLabels = Array.from({ length: nCuts }, (_, i) => `[cv${i}]`).join('');
  fc.push(`${cvLabels}concat=n=${nCuts}:v=1:a=0:unsafe=1[s2_concat]`);
  const s2fx = buildFx('[s2_concat]', cfg.scEffectsS2, 's2', ctx);
  fc.push(...s2fx.lines);
  fc.push(`${s2fx.lastLabel}scale=${ctx.vidW}:${ctx.vidH},setsar=1,fps=${fps}[s2v]`);

  // Transition (Scene1 → Scene2)
  const offset = Math.max(0, s1Dur - cfg.transDur);
  fc.push(`[s1_final][s2v]xfade=transition=${cfg.transType}:duration=${fx(cfg.transDur)}:offset=${fx(offset)}[vout]`);

  // Audio
  fc.push(`[0:a]atrim=${fx(cfg.scene1Start)}:${fx(cfg.scene1End)},asetpts=PTS-STARTPTS,${aformat}[s1a]`);
  for (let i = 0; i < nCuts; i++) {
    fc.push(`[${i + 1}:a]volume=0,asetpts=PTS-STARTPTS,${aformat}[ca${i}]`);
  }
  const caLabels = Array.from({ length: nCuts }, (_, i) => `[ca${i}]`).join('');
  fc.push(`${caLabels}concat=n=${nCuts}:v=0:a=1[s2a]`);
  fc.push(`[s1a][s2a]concat=n=2:v=0:a=1[basea]`);

  // BGM mixing
  if (hasBgm) {
    const vol = cfg.bgmVolStart;
    const rampAt = cfg.bgmRampAt;
    const rampDur = Math.max(0.01, s1Dur - rampAt);
    fc.push(
      `[${bgmIdx}:a]volume='if(lt(t,${fx(rampAt)}),${fx(vol)},if(lt(t,${fx(s1Dur)}),${fx(vol)}+${fx(1 - vol)}*((t-${fx(rampAt)})/${fx(rampDur)}),1.0))':eval=frame,${aformat}[amusic]`,
    );
    fc.push(`[basea][amusic]amix=inputs=2:duration=first:normalize=0[finala]`);
  } else {
    fc.push(`[basea]anull[finala]`);
  }

  // --- (D) ffmpeg command ---
  const cmd = [
    `ffmpeg -y ${inputs.join(' ')} \\`,
    `  -filter_complex "${fc.join(';\n')}" \\`,
    `  -map '[vout]' -map '[finala]' \\`,
    `  -c:v libx264 -preset medium -crf 23 \\`,
    `  -pix_fmt yuv420p \\`,
    `  -c:a aac -b:a 192k \\`,
    `  -shortest -movflags +faststart \\`,
    `  "$OUTPUT"`,
    '[ ! -s "$OUTPUT" ] && { echo "Error: output empty"; exit 1; }',
    'echo "✅ done: $OUTPUT"',
  ];

  return head.join('\n') + '\n\n' + cmd.join('\n') + '\n';
}
