import {readFile} from 'node:fs/promises';

const [app,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'className="sun-moon-card-value"',
  'className="sun-moon-time-block"',
  'Sonnenaufgang',
  'Sonnenuntergang',
  'className="sun-moon-divider"',
  'className="sun-moon-phase"',
  'className="sun-moon-meta"'
])need('Sonne-/Mond-Kartenstruktur',app,token);

if(app.includes('className="sun-moon-primary"'))failures.push('Die veraltete einzeilige Sonne-/Mond-Hauptzeile ist weiterhin aktiv.');

for(const token of [
  '.sun-moon-card-value{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);',
  '.sun-moon-time-block small{',
  '.sun-moon-time-block b{display:block;color:var(--text);font-size:clamp(16px,1.55vw,24px);font-variant-numeric:tabular-nums;line-height:1.02}',
  '.sun-moon-phase{display:flex;align-items:center;gap:5px;min-width:0;flex-wrap:wrap;color:var(--text)}',
  '@media(max-width:420px){.sun-moon-card-value{grid-template-columns:1fr;gap:5px}.sun-moon-divider{display:none}.sun-moon-time-block:last-child{padding-top:4px;border-top:1px solid var(--border);text-align:left}}'
])need('Sonne-/Mond-Kartenstyling',styles,token);

if(failures.length){console.error('Sonne-/Mond-Kachel-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonne-/Mond-Kachel geprüft: zweizeilige Struktur, stabile Zeitblöcke und mobile Stapelung vorhanden.');
