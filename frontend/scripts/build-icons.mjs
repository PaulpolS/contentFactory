// Regenerates src/lib/lucide-icons.js — a small pre-bundled subset of lucide-react.
// Vite 8's Rolldown optimizer hangs on lucide-react's full 3900+ icon barrel, so we
// alias `lucide-react` to this prebuilt file (see vite.config.ts). Run after adding
// a new icon import:  npm run build:icons
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const base = path.resolve(root, 'node_modules/lucide-react/dist/esm/icons');

// scan src for icons imported from 'lucide-react'
const used = new Set();
function walk(dir){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
    const p = path.join(dir,e.name);
    if(e.isDirectory()) walk(p);
    else if(/\.(tsx?|jsx?)$/.test(e.name)){
      const s = fs.readFileSync(p,'utf8');
      const m = s.match(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/s);
      if(m) m[1].split(',').map(x=>x.trim()).filter(Boolean)
        .forEach(spec => used.add(spec.split(/\s+as\s+/)[0].trim()));
    }
  }
}
walk(path.resolve(root,'src'));

const pascalToKebab = n => n.replace(/([a-z0-9])([A-Z])/g,'$1-$2').replace(/([a-zA-Z])([0-9])/g,'$1-$2').toLowerCase();
let entry = '';
for(const name of [...used].sort()){
  const file = path.join(base, pascalToKebab(name)+'.mjs');
  if(!fs.existsSync(file)){ console.error('WARN: icon file not found for', name); continue; }
  entry += `export { default as ${name} } from ${JSON.stringify(file)};\n`;
}
const tmp = path.resolve(root,'.icons-entry.mjs');
fs.writeFileSync(tmp, entry);
execFileSync(path.resolve(root,'node_modules/esbuild/bin/esbuild'),
  [tmp,'--bundle','--format=esm','--external:react','--external:react/jsx-runtime',
   '--outfile=src/lib/lucide-icons.js'], {cwd: root, stdio:'inherit'});
fs.unlinkSync(tmp);
console.log(`Rebuilt src/lib/lucide-icons.js with ${used.size} icons.`);
