import {readFile} from 'node:fs/promises';

const [cross,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: Altvertrag noch vorhanden: ${token}`)};

for(const token of [
  'className="flight-cross-section flight-route-briefing"',
  '<h3>Cross Section · Streckenbriefing</h3>',
  'Gefahren entlang der Route, am gewählten Flugniveau und passend zu Start- und Landezeit.',
  'Start- und Landezeit müssen gültig sein',
  '<span>Flughöhe</span>',
  "fetchWorkerJson<CrossSectionData>('flight-cross-section'",
  'function pointHazards(',
  'function hazardRuns(',
  'function officialSignals(',
  'Wann und in welchem größeren Raum ist etwas zu erwarten?',
  'AMTLICHE / OPERATIVE SIGNALE',
  'Wolkenuntergrenze Start',
  'Wolkenuntergrenze Landung',
  'Turbulenz / vertikale Windscherung',
  'Konvektion / Gewitter',
  'Die frühere Cross-Section-Grafik bleibt durch das handlungsorientierte Streckenbriefing ersetzt'
])need('Cross-Section-Streckenbriefing',cross,token);

for(const token of [
  '.flight-route-briefing{',
  '.flight-briefing-overview{',
  '.flight-route-hazards,',
  '.flight-route-hazard-list{'
])need('Flight-Briefing-CSS',styles,token);

for(const legacy of [
  'const HORIZONTAL_DENSITY=',
  'const VERTICAL_SUBDIVISIONS=',
  'terrainProfile?:TerrainPoint[]',
  'filter="url(#softCloud)"',
  'filter="url(#cloudShadow)"',
  'terrainAreaPath(',
  'terrainOutlinePath('
])forbid('Grafische Cross Section',cross,legacy);

need('Package-Test',pkg,'test:flight-cross-section-rendering');
need('Baseline-Test',baseline,'scripts/test-flight-cross-section-rendering-08181.mjs');

if(failures.length){console.error('Cross-Section-Streckenbriefing-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross Section geprüft: textuelles Streckenbriefing mit Route, FL, Start/Landung, Zeit-/Ortshinweisen und amtlichen Signalen aktiv; alte Grafik bleibt entfernt.');
