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
  'className="sun-moon-card-divider"',
  'Sonnenaufgang',
  'Sonnenuntergang',
  'className="sun-moon-phase"',
  'className="sun-moon-meta"'
])need('Sonne-/Mond-Kartenstruktur',app,token);

for(const token of [
  '.metrics .sun-moon-card{min-height:156px}',
  '.metrics .sun-moon-card>strong{display:grid;gap:8px;margin-top:8px;font-size:inherit;line-height:1.1;white-space:normal}',
  '.sun-moon-card-value{display:grid;gap:8px;min-width:0}',
  '.sun-moon-card-divider{display:block;height:1px;border-radius:999px;background:color-mix(in srgb,var(--border) 92%,transparent)}',
  '.sun-moon-time-block b{display:block;color:var(--text);font-size:clamp(22px,2.35vw,34px);font-weight:850;font-variant-numeric:tabular-nums;line-height:.96}',
  '@media(max-width:420px){.metrics .sun-moon-card{min-height:138px}.sun-moon-time-block b{font-size:clamp(18px,8.4vw,24px)}.sun-moon-phase{gap:5px}.sun-moon-phase em{display:inline}}'
])need('Sonne-/Mond-Kartenstyling',styles,token);

for(const forbidden of [
  'className="sun-moon-primary"',
  'className="sun-moon-divider"',
  '.sun-moon-card-value{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);',
  '.sun-moon-time-block:last-child{text-align:right}'
]){if(app.includes(forbidden)||styles.includes(forbidden))failures.push(`Veraltete Sonne-/Mond-Darstellung noch aktiv: ${forbidden}`)}

if(failures.length){console.error('Sonne-/Mond-Kachel-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonne-/Mond-Kachel geprüft: standardnahes Kartenlayout, getrennte Zeitblöcke und überlappungsfreie Desktop-/Mobilstruktur vorhanden.');
