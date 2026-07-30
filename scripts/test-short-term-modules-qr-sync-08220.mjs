import {readFile,writeFile,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}


const files=await Promise.all([
 'src/App.tsx','src/ShortTermForecast.tsx','src/dashboardModules.ts','src/DashboardModuleSettings.tsx','src/deviceSync.ts','src/DeviceSyncSettings.tsx','src/qrCode.ts','src/thunderstorm.ts','src/styles.css','package.json','MID_BASELINE.json'
].map(path=>readFile(new URL(`../${path}`,import.meta.url),'utf8')));
const[app,shortTerm,modules,moduleSettings,sync,syncSettings,qr,thunder,styles,pkg,baseline]=files;
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

for(const token of [
 'const QUARTER_STEP_COUNT=4;',
 'function buildTargetEpochs(now:number)',
 'export function buildShortTermForecast(',
 "offsetMinutes<=60?nearest(minutes15,target,12*60000):undefined",
 'className="short-term-strip"',
 'className="short-term-detail"',
 'Number(point.thunderPercent)>=30',
 'Best Match'
])need('Kurzfristvorhersage',shortTerm,token);
forbid('Kurzfristvorhersage',shortTerm,'fetch(');
forbid('Kurzfristvorhersage',shortTerm,'fetchWorker');
forbid('Kurzfristvorhersage',shortTerm,'ohne zusätzlichen Abruf');

const warningsIndex=modules.indexOf("{id:'warnings'");
const shortIndex=modules.indexOf("{id:'short-term'");
const forecastIndex=modules.indexOf("{id:'forecast'");
if(!(warningsIndex>=0&&warningsIndex<shortIndex&&shortIndex<forecastIndex))failures.push('Dashboard: Kurzfristvorhersage ist standardmäßig nicht direkt zwischen Warnungen und 7-Tage-Vorhersage einsortiert.');
for(const token of [
 "DASHBOARD_MODULE_SETTINGS_KEY='mid:dashboard-modules:v1'",
 'normalizeDashboardModuleSettings(',
 'moveDashboardModule(',
 "if(typeof window!=='undefined')window.dispatchEvent"
])need('Dashboard-Datenvertrag',modules,token);
for(const token of [
 'draggable',
 'onDragStart=',
 'onPointerDown=',
 'onPointerMove=',
 'dashboard-module-order-actions',
 'type="checkbox"'
])need('Dashboard-Einstellungen',moduleSettings,token);
for(const token of [
 'dashboardModuleSettings.order.map(renderDashboardModule)',
 "case'short-term':return <ShortTermForecast",
 "case'warnings':return",
 'dashboardModuleSettings.enabled[id]',
 'DashboardModuleSettingsPanel'
])need('Dashboard-Einbindung',app,token);

for(const token of [
 'windUnit?:WindUnit',
 'gustSignalText(cell.gustFlag,context.windUnit)',
 'selectedWindSpeed(speed,unit)'
])need('Gewitter-Windeinheit',thunder,token);
need('Gewitter-Appübergabe',app,'windUnit:unit');

for(const token of [
 "const DEVICE_SYNC_HASH_KEY='mid-sync'",
 'buildDeviceSyncTransferUrl(',
 'consumeDeviceSyncTransferFromLocation()',
 'history.replaceState(',
 'storePendingDeviceSyncCode(code)'
])need('QR-Synchronisation',sync,token);
for(const token of [
 "void import('./qrCode')",
 'createQrSvg(transferUrl)',
 'Mit QR-Code verbinden',
 'mit der Kamera-App scannen',
 'Der QR-Code wird ausschließlich lokal erzeugt'
])need('QR-Einstellungen',syncSettings,token);
for(const token of [
 'export function createQrSvg(',
 'export function createQrMatrix(',
 'new TextEncoder().encode(text)',
 'errorCorrection(',
 'shape-rendering="crispEdges"'
])need('Lokaler QR-Generator',qr,token);
forbid('Lokaler QR-Generator',qr,'fetch(');
forbid('Lokaler QR-Generator',qr,'api.qr');
forbid('Lokaler QR-Generator',qr,'quickchart');
for(const token of [
 'consumeDeviceSyncTransferFromLocation()',
 "setSettingsSection('sync')",
 'setSettingsOpen(true)'
])need('QR-Übernahme',app,token);

for(const token of [
 '.short-term-strip{display:flex;',
 'overflow-x:auto',
 '.dashboard-module-item.dragging',
 '.device-sync-qr-code svg{display:block'
])need('Responsive Gestaltung',styles,token);
need('Package-Test',pkg,'test:short-term-modules-qr');
need('Baseline-Test',baseline,'scripts/test-short-term-modules-qr-sync-08220.mjs');

const dir=await mkdtemp(join(tmpdir(),'mid-08220-'));
try{
 const compile=async(name,source)=>{const out=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:name});const path=join(dir,`${name}.mjs`);await writeFile(path,out.outputText);return import(`${pathToFileURL(path).href}?v=${Date.now()}`)};
 const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
 globalThis.window={dispatchEvent:()=>true};globalThis.CustomEvent=class{constructor(type,init){this.type=type;this.detail=init?.detail}};
 const dashboard=await compile('dashboardModules',modules);
 const defaults=dashboard.defaultDashboardModuleSettings();
 const warningPosition=defaults.order.indexOf('warnings'),shortPosition=defaults.order.indexOf('short-term'),forecastPosition=defaults.order.indexOf('forecast');
 if(!(warningPosition+1===shortPosition&&shortPosition+1===forecastPosition))failures.push('Dashboard-Dynamik: Standardreihenfolge Warnungen → Kurzfrist → 7 Tage stimmt nicht.');
 const moved=dashboard.moveDashboardModule(defaults,'forecast','current');
 if(moved.order.indexOf('forecast')!==moved.order.indexOf('current')-1)failures.push('Dashboard-Dynamik: Verschieben eines Moduls funktioniert nicht erwartungsgemäß.');
 const normalized=dashboard.normalizeDashboardModuleSettings({order:['forecast','forecast','short-term'],enabled:{'short-term':false}});
 if(normalized.order.filter(id=>id==='forecast').length!==1||normalized.enabled['short-term']!==false||normalized.order.length!==defaults.order.length)failures.push('Dashboard-Dynamik: Migration/Normalisierung ist unvollständig.');
 const qrModule=await compile('qrCode',qr),matrix=qrModule.createQrMatrix('https://example.invalid/MID/#mid-sync=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz');
 if(matrix.length!==49||matrix.some(row=>row.length!==49)||matrix.flat().some(value=>typeof value!=='boolean'))failures.push('QR-Dynamik: 49×49-Matrix wurde nicht korrekt erzeugt.');
 const svg=qrModule.createQrSvg('https://example.invalid/MID/#mid-sync=0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_abcdefghijklmnopqrstuvwxyz');
 if(!svg.startsWith('<svg')||!svg.includes('<path')||svg.includes('<script'))failures.push('QR-Dynamik: SVG-Ausgabe ist ungültig oder unsicher.');
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Kurzfrist-/Modul-/QR-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kurzfristvorhersage, modulare Dashboard-Reihenfolge, ausgewählte Windeinheit in Gewitterangaben und lokaler QR-Synchronisationstransfer geprüft.');
