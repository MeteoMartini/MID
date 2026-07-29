import {readFile} from 'node:fs/promises';

const [cross,styles,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/CrossSectionPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'const HORIZONTAL_DENSITY=12;',
  'const VERTICAL_SUBDIVISIONS=7;',
  'type TerrainPoint=',
  'terrainProfile?:TerrainPoint[]',
  'function densifyPoints(points:CrossPoint[],subdivisions=HORIZONTAL_DENSITY)',
  'function terrainOutlinePath(points:TerrainPoint[])',
  'const terrainPoints=useMemo(()=>data.terrainProfile?.length?data.terrainProfile',
  'const terrainPath=useMemo(()=>terrainAreaPath(terrainPoints),[terrainPoints]);',
  'const terrainRidge=useMemo(()=>terrainOutlinePath(terrainPoints),[terrainPoints]);',
  'filter="url(#softCloud)"',
  'filter="url(#cloudShadow)"',
  'className="flight-banner-text"',
  'className="flight-origin-tag"',
  'className="flight-time-top-label"'
])need('Cross-Section-Rendering',cross,token);

for(const token of [
  'shape-rendering:geometricPrecision',
  '.flight-banner-text{',
  '.flight-origin-tag{',
  '.flight-time-top-label{'
])need('Flight-CSS',styles,token);

need('Package-Test',pkg,'test:flight-cross-section-rendering');
need('Baseline-Test',baseline,'scripts/test-flight-cross-section-rendering-08181.mjs');

if(failures.length){console.error('Cross-Section-Rendering-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross-Section-Rendering geprüft: dichtere Wolken-/Risiko-Felder, Banner/Zeitleiste und geglättete, separate Topographie vorhanden.');
