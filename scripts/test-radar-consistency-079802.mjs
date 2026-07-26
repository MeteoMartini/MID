import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,radar,pixel,worker,changes,ensemble,styles]=await Promise.all([
 readFile(path.join(root,'src','App.tsx'),'utf8'),
 readFile(path.join(root,'src','RadarPanel.tsx'),'utf8'),
 readFile(path.join(root,'src','Px250Overlay.tsx'),'utf8'),
 readFile(path.join(root,'worker','metar-proxy.js'),'utf8'),
 readFile(path.join(root,'src','modelRunChanges.ts'),'utf8'),
 readFile(path.join(root,'src','EnsemblePanel.tsx'),'utf8'),
 readFile(path.join(root,'src','styles.css'),'utf8')
]);
const failures=[];
for(const token of [
 'const arrivalSegment=arrivalVisible?',
 'arrivalSegment&&!observedArrivalCovered',
 'Die Balkenhöhe entspricht der Radarintensität.',
 "radar.arrivalKind!=='site'",
 'if(value>=50)return 22',
 'className={`radar-nowcast-wet future expected'
])if(!app.includes(token))failures.push(`Nowcast-Leiste: ${token}`);
for(const token of ['.radar-nowcast-wet.expected{','.radar-nowcast-wet.expected.uncertain{','.radar-nowcast-wet.nearby{'])if(!styles.includes(token))failures.push(`Nowcast-CSS: ${token}`);
for(const token of ['function projectedBounds(',"projectionFrom(where)",'inverseProjected(','boundsFromFile(file,meta,dataset)'])if(!pixel.includes(token))failures.push(`PX250-Georeferenz: ${token}`);
const metadataStart=worker.indexOf('async function px250Metadata(request,lat,lon){'),metadataEnd=worker.indexOf('async function px250FileResponse',metadataStart),metadata=worker.slice(metadataStart,metadataEnd);
if(metadata.indexOf("productName:'DWD PX250 Standortradar'")<0||metadata.indexOf("productName:'DWD HX Deutschlandkomposit'")<0||metadata.indexOf("productName:'DWD PX250 Standortradar'")>metadata.indexOf("productName:'DWD HX Deutschlandkomposit'"))failures.push('PX250-Standortradar wird nicht vor HX bevorzugt.');
for(const token of ["motionSource:'multi-frame-grid-correlation'","motionDirectionConvention:'towards'",'observedMotionTimes=',"method:'WMS GetMap + GetFeatureInfo je Analyseframe; Zugrichtung aus Mehrframe-Rasterkorrelation, KONRAD3D und Schwerpunktströmung'"])if(!worker.includes(token))failures.push(`Mehrframe-Zugrichtung: ${token}`);
for(const token of ["motionAvailable=showRadar&&Number.isFinite(motionDirection)&&Number.isFinite(motionSpeed)&&motionSpeed>=2","showMotion=showMotionOverlay&&motionAvailable",'Zug nach {Math.round(motionDirection)}°','Zugrichtung nach {Math.round(motionDirection)}°'])if(!radar.includes(token))failures.push(`Zugrichtungsbeschriftung: ${token}`);
for(const token of ['secondaryDetail?:string',"detail:`${onsetClock(previous.precipitationOnset)} → ${onsetClock(current.precipitationOnset)}`","secondaryDetail:`${Math.abs(Math.round(onsetDelta))} h ${later?'später':'früher'}`"])if(!changes.includes(token))failures.push(`Modelllauf-Zeitvergleich: ${token}`);
if(!ensemble.includes('item.secondaryDetail&&<small className="model-change-secondary">'))failures.push('Getrennte zweite Zeile für Zeitverschiebung fehlt.');

// Funktionaler Test: eine nach Osten wandernde Rasterstruktur muss als Zug nach Osten erscheinen.
try{
 const begin=worker.indexOf('function gridMotionPair('),end=worker.indexOf('async function dwdMotionField',begin),snippet=worker.slice(begin,end);
 const factory=new Function(`${snippet}; return {radarMotionFromFields};`),{radarMotionFromFields}=factory();
 const size=31,make=(offset,time)=>{const values=new Array(size*size).fill(0);for(let y=12;y<=17;y++)for(let x=7+offset;x<=12+offset;x++)values[y*size+x]=2;return{time,lat:51,lon:7,latDelta:1,lonDelta:1,grid:{size,values}}};
 const base=Date.UTC(2026,6,26,14,0),result=radarMotionFromFields([make(0,base),make(1,base+15*60000),make(2,base+30*60000),make(3,base+45*60000)]);
 if(!Number.isFinite(result.motionDirectionDeg)||Math.abs(result.motionDirectionDeg-90)>30)failures.push(`Mehrframe-Bewegung ist nicht ostwärts: ${JSON.stringify(result)}`);
 if(result.motionDirectionConvention!=='towards')failures.push('Bewegungsrichtung ist nicht ausdrücklich als Zielrichtung markiert.');
}catch(error){failures.push(`Funktionaler Mehrframe-Test nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

// Funktionaler Test: alter und neuer Niederschlagsbeginn werden getrennt vom Delta ausgegeben.
try{
 const js=ts.transpileModule(changes,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,module={exports:{}},storage=new Map();
 const localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,String(value)),removeItem:key=>storage.delete(key)};
 new Function('module','exports','require','localStorage',js)(module,module.exports,()=>({}),localStorage);
 const previous={version:1,createdAt:'2026-07-26T09:00:00Z',runKey:'a',signature:'a',precipitationOnset:'2026-07-26T15:00:00Z',days:[]};
 const current={version:1,createdAt:'2026-07-26T10:00:00Z',runKey:'b',signature:'b',precipitationOnset:'2026-07-26T14:00:00Z',days:[]};
 const report=module.exports.compareModelChangeSnapshots(previous,current),item=report.items.find(row=>row.metric==='onset');
 if(!item?.detail.includes('15:00')||!item.detail.includes('14:00')||item.secondaryDetail!=='1 h früher')failures.push(`Niederschlagsbeginn nicht vollständig: ${JSON.stringify(item)}`);
}catch(error){failures.push(`Funktionaler Modelllauf-Test nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Radar-/Modelllauf-Konsistenzprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-/Modelllauf-Konsistenz geprüft: Ankunftsfenster, Intensitätshöhen, PX250-Georeferenz, Mehrframe-Zugrichtung und alter/neuer Niederschlagsbeginn sind geschützt.');
