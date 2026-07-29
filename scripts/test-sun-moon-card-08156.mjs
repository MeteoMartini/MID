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
  '.metrics .sun-moon-card{min-height:118px}',
  '.metrics .sun-moon-card>strong{display:grid;gap:6px;margin-top:7px;font-size:inherit;line-height:1.08;white-space:normal}',
  '.sun-moon-card-value{display:grid;gap:6px;min-width:0}',
  '.sun-moon-time-block b{display:block;color:var(--text);font-size:clamp(16px,1.45vw,22px);font-weight:820;font-variant-numeric:tabular-nums;line-height:.98}',
  '@media(max-width:760px){.metrics .sun-moon-card{min-height:106px}.metrics .sun-moon-card>strong{gap:5px}.sun-moon-card-value{gap:5px}.sun-moon-time-block b{font-size:clamp(15px,5.4vw,20px)}}',
  '@media(max-width:420px){.metrics .sun-moon-card{min-height:96px}.sun-moon-time-block b{font-size:clamp(14px,7.2vw,18px)}.sun-moon-phase{gap:4px}.sun-moon-phase em{display:inline}}'
])need('Sonne-/Mond-Kartenstyling',styles,token);

for(const forbidden of [
  'className="sun-moon-primary"',
  'className="sun-moon-divider"',
  '.sun-moon-card-value{grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);',
  '.metrics .sun-moon-card{min-height:156px}',
  '.sun-moon-time-block b{display:block;color:var(--text);font-size:clamp(22px,2.35vw,34px);'
]){if(app.includes(forbidden)||styles.includes(forbidden))failures.push(`Veraltete Sonne-/Mond-Darstellung noch aktiv: ${forbidden}`)}

if(failures.length){console.error('Sonne-/Mond-Kachel-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonne-/Mond-Kachel geprüft: kompaktere Typografie, angeglichene Kartenhöhe und überlappungsfreie Desktop-/Mobilstruktur vorhanden.');
