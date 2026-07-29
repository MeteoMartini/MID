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
  'const HORIZONTAL_DENSITY=7;',
  'const VERTICAL_SUBDIVISIONS=4;',
  'function densifyPoints(points:CrossPoint[],subdivisions=HORIZONTAL_DENSITY)',
  'function smoothPath(coords:[number,number][],tension=.92)',
  'function terrainAreaPath(points:CrossPoint[])',
  'const densePoints=useMemo(()=>densifyPoints(data.points,HORIZONTAL_DENSITY),[data.points]);',
  'const riskCells=useMemo(()=>cells(densePoints),[densePoints]);',
  'const terrainPath=useMemo(()=>terrainAreaPath(densePoints),[densePoints]);',
  'filter="url(#softCloud)"',
  'filter="url(#cloudShadow)"',
  'topTimelineIndexes.map(index=>{const point=data.points[index];return <text',
  'className="flight-time-top-label"'
])need('Cross-Section-Rendering',cross,token);

for(const token of [
  'shape-rendering:geometricPrecision',
  '.flight-time-top-label{'
])need('Flight-CSS',styles,token);

need('Package-Test',pkg,'test:flight-cross-section-rendering');
need('Baseline-Test',baseline,'scripts/test-flight-cross-section-rendering-08181.mjs');

if(failures.length){console.error('Cross-Section-Rendering-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cross-Section-Rendering geprüft: geglättete Linien, verdichtete Wolken-/Risiko-Felder, Top-Zeitachse und geglättete Topographie vorhanden.');
