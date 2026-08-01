import {readFile} from 'node:fs/promises';

const [frame,styles,meteogram,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsembleChartFrame.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../src/MeteogramPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'className="ensemble-responsive-chart"',
 'ResizeObserver',
 'getBoundingClientRect()',
 'cloneElement(children,{width,height,responsive:false',
 'style={{height,minHeight}}',
 'minHeight=Math.max(180,Math.min(240,height-42))',
 'responsive:false'
])need('Ensemble-Liveframe',frame,token);
forbid('Ensemble-Liveframe',frame,'ResponsiveContainer');
for(const token of [
 '.ensemble-responsive-chart{',
 'min-height:180px',
 '.ensemble-responsive-chart>.recharts-wrapper'
])need('Ensemble-CSS',styles,token);

for(const token of [
 'Datenquelle Vereisung / Turbulenz',
 'Direkte ADWICE- beziehungsweise WAWFOR-EDP-Produkte des DWD sind nicht eingebunden.',
 'Vereisung (MID-Diagnose)',
 'Turbulenz und CAT (MID-Diagnose)',
 'keine amtlichen ADWICE- oder WAWFOR-Turbulenzprodukte'
])need('Flugwetter-Herkunft',meteogram,token);
forbid('Flugwetter-Herkunft',meteogram,'ADWICE-Daten werden geladen');

const parsedPackage=JSON.parse(pkg),parsedBaseline=JSON.parse(baseline),versionParts=String(parsedPackage.version||'').split('.').map(Number),minimumVersion=[0,8,26,5];
const validVersion=versionParts.length===4&&versionParts.every(Number.isInteger),isAtLeastMinimum=validVersion&&versionParts.some((part,index)=>part!==minimumVersion[index]?part>minimumVersion[index]:false)||validVersion&&versionParts.every((part,index)=>part===minimumVersion[index]);
if(!isAtLeastMinimum)failures.push(`Paketversion ${parsedPackage.version} liegt nicht auf oder nach dem geprüften Wartungsstand 0.8.26.5.`);
if(!parsedBaseline.regressionTests?.includes('scripts/test-ensemble-runtime-aviation-source-08265.mjs'))failures.push('Neue Regression fehlt in MID_BASELINE.json.');
if(!parsedPackage.scripts?.['test:ensemble-runtime-aviation-source'])failures.push('Neues Testskript fehlt in package.json.');

if(failures.length){console.error('Ensemble-Live-/Flugwetterquellen-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Recharts-3-Livediagramme und transparente ADWICE/WAWFOR-Datenherkunft geprüft.');
