import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const pkg=JSON.parse(read('../package.json'));
const app=read('../src/App.tsx');
const ensemble=read('../src/EnsemblePanel.tsx');
const meteogram=read('../src/MeteogramPanel.tsx');
const workerClient=read('../src/workerClient.ts');
const styles=read('../src/styles.css');
const sw=read('../public/sw.js');
const serviceWorker=read('../public/service-worker.js');

const requirements=[
 ['Suchfeld-Außenklick',app,"document.addEventListener('pointerdown',outside,true)"],
 ['Suchfeld-Escape',app,"event.key!=='Escape'"],
 ['Suchfeld-Fokuswechsel',app,"document.addEventListener('focusin',focusOutside,true)"],
 ['Tagesnavigation',app,"event.key==='ArrowUp'?1:-1"],
 ['Mausradnavigation',app,'onWheel={handleDetailChartWheel}'],
 ['Mausrad-Normalisierung',app,'event.deltaMode===1?event.deltaY*16'],
 ['Tagesstunde erhalten',app,"current?.time.slice(11,13)"],
 ['Radarintervall',app,'5*60*1000'],
 ['Radarretry',app,'60*1000'],
 ['Radartimer-Eindeutigkeit',app,'window.clearTimeout(timer);timer=0'],
 ['Radartransparenz',app,'Radarabgleich ·'],
 ['Ensemble-Hover',ensemble,'hoveredConsistency'],
 ['Ensemble-Mouseenter',ensemble,'onMouseEnter'],
 ['Meteogramm-Autoload',meteogram,'void load(controller.signal)'],
 ['Leere Worker-Adresse überspringen',workerClient,"if(!trimmed)return''"],
 ['Alten Seiten-Endpunkt verwerfen',workerClient,'endpoint.href===page.href'],
 ['Worker-JSON-Prüfung',workerClient,"contentType.includes('json')"],
 ['Widget-Zweizeiler',styles,'-webkit-line-clamp:2']
];
const missing=requirements.filter(([,source,token])=>!source.includes(token)).map(([name])=>name);
if(missing.length){console.error('Quellprüfung fehlgeschlagen:',missing.join(', '));process.exit(1)}
if(app.includes('className="meteogram-gate"')){console.error('Meteogramm ist noch durch das fehleranfällige Viewport-Gate verschachtelt.');process.exit(1)}
if(meteogram.includes('[open,setOpen]')){console.error('Meteogramm besitzt noch eine doppelte interne Modulklappe.');process.exit(1)}
const expected=`mid-shell-v${pkg.version}`;
if(!sw.includes(expected)||!serviceWorker.includes(expected)){console.error(`Service-Worker-Cache stimmt nicht mit ${pkg.version} überein.`);process.exit(1)}
console.log(`Quellprüfung v${pkg.version}: Suche, ENS-Hover, Diagrammnavigation, Meteogramm, Worker-Failover, Widget-Zweizeiler, Radarabgleich und PWA-Cache vorhanden.`);
