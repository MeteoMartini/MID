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
  '.metrics .sun-moon-card{min-height:0}',
  '.metrics .sun-moon-card>strong{display:block;margin-top:6px;font-size:clamp(13px,.95vw,16px);line-height:1.04;white-space:normal}',
  '.sun-moon-card-value{display:grid;grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr);align-items:end;gap:6px;min-width:0}',
  '.sun-moon-time-block b{display:block;color:var(--text);font:inherit;font-weight:780;font-variant-numeric:tabular-nums;line-height:1}',
  '@media(max-width:760px){.metrics .sun-moon-card>strong{font-size:14px}.sun-moon-card-value{gap:5px}.sun-moon-card-divider{height:25px}}',
  '@media(max-width:420px){.metrics .sun-moon-card>strong{font-size:13px}.sun-moon-card-value{gap:4px}.sun-moon-card-divider{height:23px}.sun-moon-phase{gap:3px}.sun-moon-phase em{display:inline}}'
])need('Sonne-/Mond-Kartenstyling',styles,token);

for(const forbidden of [
  'className="sun-moon-primary"',
  'className="sun-moon-divider"',
  '.metrics .sun-moon-card{min-height:108px}',
  '.sun-moon-time-block b{display:block;color:var(--text);font-size:clamp(14px,1.2vw,19px);',
  '.sun-moon-time-block b{display:block;color:var(--text);font-size:clamp(16px,1.45vw,22px);'
]){if(app.includes(forbidden)||styles.includes(forbidden))failures.push(`Veraltete Sonne-/Mond-Darstellung noch aktiv: ${forbidden}`)}

if(failures.length){console.error('Sonne-/Mond-Kachel-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Sonne-/Mond-Kachel geprüft: Uhrzeiten sind auf die kompakte Werttypografie der übrigen Kacheln begrenzt und bleiben auf Desktop/Mobil kompakt.');
