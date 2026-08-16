import {readFile,readdir} from 'node:fs/promises';
import {resolve,dirname,extname,join} from 'node:path';
import {fileURLToPath} from 'node:url';

const [app,portal,styles,stationClient,routePanel]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/AppPortalPopover.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
  readFile(new URL('../src/connectedStation.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/RouteWeatherPanel.tsx',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  'function useActiveItemReveal',
  'new ResizeObserver(schedule)',
  'observer.observe(elementRef.current)',
  'void fonts?.ready.then(schedule)',
  'settleTimer=window.setTimeout(schedule,180)'
])need('Favoritenpositionierung ohne Timer-Kaskade',app,token);
for(const legacy of ['timers=[0,70,180,360,650].map','timers=[0,70,180,360].map','timers=[0,80,200,420].map'])if(app.includes(legacy))failures.push(`Veraltete Timer-Kaskade vorhanden: ${legacy}`);

for(const token of [
  'probeX=Math.max(1,Math.min(window.innerWidth-1,Math.round(window.innerWidth/2))),',
  'document.elementFromPoint(probeX,viewportTop)',
  'document.querySelector<HTMLElement>(`[data-mid-view="${pending.section}"]`)'
])need('Schnelle Ansichtspositionssicherung',app,token);
const captureStart=app.indexOf('function captureCurrentView()');
const captureEnd=app.indexOf('function setLoc(next:Location',captureStart);
if(captureStart<0||captureEnd<0||app.slice(captureStart,captureEnd).includes('querySelectorAll'))failures.push('captureCurrentView misst weiterhin synchron alle Dashboardmodule.');

for(const token of [
  'const detachEdgeGestureListeners=()=>',
  "window.addEventListener('touchstart',start,{passive:true})",
  "window.addEventListener('touchmove',move,{passive:false})",
  'navigationFavoritesRef.current',
  'navigationLocationRef.current'
])need('Edge-Wischgeste nur bei tatsächlichem Randkontakt',app,token);
const edgeEffectStart=app.indexOf('const detachEdgeGestureListeners=()=>');
const edgeStartHandler=app.indexOf('const start=(event:TouchEvent)=>',edgeEffectStart);
const touchMoveAttach=app.indexOf("window.addEventListener('touchmove',move,{passive:false})",edgeEffectStart);
if(edgeEffectStart<0||edgeStartHandler<0||touchMoveAttach<edgeStartHandler)failures.push('Der nicht-passive Touchmove-Listener wird weiterhin dauerhaft statt erst nach Randkontakt registriert.');

for(const token of [
  'pendingDragTarget=useRef',
  'dragFrame=useRef(0)',
  'window.requestAnimationFrame(flushDragTarget)',
  'setDragOverId(current=>current===target?current:target)'
])need('Favoritenziehen auf einen Updatezyklus pro Frame begrenzt',app,token);

for(const token of [
  "window.addEventListener('scroll',schedule,scrollOptions)",
  'if(!frame)frame=window.requestAnimationFrame(update)',
  'setPosition(current=>current.left===left'
])need('Popover-Positionierung gedrosselt',portal,token);

need('Stationsintegration ist ausdrücklich reaktiviert',stationClient,'export const CONNECTED_STATION_INTEGRATION_ENABLED=true;');
need('Aktiver Dashboardpfad übernimmt plausible Privatstation',app,'const effectiveStation=useMemo(()=>connectedObservation?.station?');
if(!routePanel.includes('function RouteMap'))failures.push('Das deaktivierte Routenwetter wurde statt nur aus dem Laufzeitpfad vollständig entfernt.');
if(app.includes("lazy(()=>import('./RouteWeatherPanel'))")||app.includes("from './RouteWeatherPanel'"))failures.push('Das deaktivierte Routenwetter wird unerwartet in den aktiven App-Bundlepfad aufgenommen.');

for(const token of [
  '.favorite-manager-list{display:grid;gap:10px;overflow-y:auto;overscroll-behavior:contain',
  'touch-action:pan-x;-webkit-overflow-scrolling:touch'
])need('Touch-Scrollbereiche',styles,token);

const srcDir=resolve(dirname(fileURLToPath(import.meta.url)),'../src'),sourceNames=(await readdir(srcDir)).filter(name=>['.ts','.tsx'].includes(extname(name))&&!name.endsWith('.d.ts')),sourcePaths=new Set(sourceNames.map(name=>join(srcDir,name))),reachable=new Set(),pending=[join(srcDir,'main.tsx')],importPattern=/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"](\.[^'"]+)['"]|import\(\s*['"](\.[^'"]+)['"]\s*\)/g;
while(pending.length){const file=pending.pop();if(!file||reachable.has(file)||!sourcePaths.has(file))continue;reachable.add(file);const text=await readFile(file,'utf8');for(const match of text.matchAll(importPattern)){const spec=match[1]||match[2],base=resolve(dirname(file),spec),candidates=[base,`${base}.ts`,`${base}.tsx`,join(base,'index.ts'),join(base,'index.tsx')],target=candidates.find(candidate=>sourcePaths.has(candidate));if(target&&!reachable.has(target))pending.push(target)}}
const expectedDormant=new Set(['RouteWeatherPanel.tsx','CrossSectionPanel.tsx','routeWeather.ts','SynopticPanel.tsx','synoptic.ts','DwdPrecipitationMap.tsx','HymecNgOverlay.tsx','HymecNgSource.ts']),unexpectedDormant=sourceNames.filter(name=>!reachable.has(join(srcDir,name))&&!expectedDormant.has(name)),unexpectedActive=[...expectedDormant].filter(name=>reachable.has(join(srcDir,name)));
if(unexpectedDormant.length)failures.push(`Unerwartete, nicht erreichbare Laufzeitmodule gefunden: ${unexpectedDormant.join(', ')}`);
if(unexpectedActive.length)failures.push(`Bewusst deaktivierte Module sind wieder im aktiven Bundlepfad: ${unexpectedActive.join(', ')}`);

if(failures.length){console.error('Interaktions-/Performancebereinigung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Interaktionsperformance geprüft: Randwischen blockiert normales Scrollen nicht mehr, Favoritenpositionierung und Drag-Reorder sind rAF-gedrosselt, Ansichtswechsel vermeiden Voll-Layoutmessungen; deaktivierte Altmodule einschließlich der verworfenen DWD-Rekonstruktionspipeline bleiben dormant; die Stationsintegration ist bewusst wieder aktiv; das amtliche DWD-Originalbild benötigt diese Zusatzmodule nicht.');
