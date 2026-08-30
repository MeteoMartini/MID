import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript-strada');

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
 'const FIVE_MINUTES=5*60000',
 'observedArrivalCovered=rawSegments.some',
 "radar.arrivalKind!=='site'",
 'function radarAmountScale(',
 'radar-nowcast-yaxis',
 '<em>mm/5 min</em>',
 'height:radarBarHeight(segment.amount,scale,segment.nearby)',
 '5-Minuten-Menge',
 '<PortalPopover anchorRef={anchorRef}'
])if(!app.includes(token))failures.push(`Nowcast-Leiste: ${token}`);
for(const forbidden of ['Die y-Achse und Balkenhöhe zeigen die Intensität','function radarRateScale(','radar-nowcast-events','5–15-minütig'])if(app.includes(forbidden))failures.push(`Veraltete Nowcast-Leiste: ${forbidden}`);
for(const token of ['.radar-nowcast-wet.expected{','.radar-nowcast-wet.expected.uncertain{','.radar-nowcast-wet.nearby{'])if(!styles.includes(token))failures.push(`Nowcast-CSS: ${token}`);
for(const token of ['function projectedBounds(',"projectionFrom(where)",'inverseProjected(','boundsFromFile(file,meta,dataset)'])if(!pixel.includes(token))failures.push(`PX250-Georeferenz: ${token}`);
const metadataStart=worker.indexOf('async function px250Metadata(request,lat,lon){'),metadataEnd=worker.indexOf('async function px250FileResponse',metadataStart),metadata=worker.slice(metadataStart,metadataEnd);
const hxIndex=metadata.indexOf("productName:'DWD HX 250-m-Deutschlandkomposit'"),localFallbackIndex=metadata.indexOf("productName:'DWD PX250 Standortradar · Fallback'");
if(hxIndex<0||localFallbackIndex<0||hxIndex>localFallbackIndex)failures.push('Amtliches HX-Deutschlandkomposit wird nicht vor dem lokalen PX250-Fallback bevorzugt.');
for(const token of ["motionSource:'multi-frame-grid-correlation'","motionDirectionConvention:'towards'",'observedMotionTimes=',"method:'DWD RV GetFeatureInfo am exakten Standort in allen verfügbaren 5-Minuten-Schritten; GetMap nur für Umfeld, lokale/regional gekoppelte Bewegungsdiagnostik und Wachstum/Zerfall'"])if(!worker.includes(token))failures.push(`Mehrframe-Zugrichtung: ${token}`);
for(const token of ["motionAvailable=showRadar&&Number.isFinite(motionDirection)&&Number.isFinite(motionSpeed)&&motionSpeed>=2","showMotion=showMotionOverlay&&motionAvailable",'motionLabel=motionAvailable?`Schwerpunktströmung ${Math.round(motionDirection)}°','Zeitpfeil {Math.round(motionDirection)}°'])if(!radar.includes(token))failures.push(`Zugrichtungsbeschriftung: ${token}`);
for(const token of ['secondaryDetail?:string',"detail:`${onsetClock(previous.precipitationOnset)} → ${onsetClock(current.precipitationOnset)}`","secondaryDetail:`${Math.abs(Math.round(onsetDelta))} h ${later?'später':'früher'}`"])if(!changes.includes(token))failures.push(`Modelllauf-Zeitvergleich: ${token}`);
if(!ensemble.includes('item.secondaryDetail&&<small className="model-change-secondary">'))failures.push('Getrennte zweite Zeile für Zeitverschiebung fehlt.');

// Funktionaler Test: eine nach Osten wandernde Rasterstruktur muss als Zug nach Osten erscheinen.
try{
 const begin=worker.indexOf('function gridMotionPair('),end=worker.indexOf('async function dwdMotionField',begin),snippet=worker.slice(begin,end);
 const factory=new Function(`const clamp=(value,min,max)=>Math.max(min,Math.min(max,value)); ${snippet}; return {radarMotionFromFields};`),{radarMotionFromFields}=factory();
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
 const formatOnset=value=>new Intl.DateTimeFormat('de-DE',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(value)).replace(',', ' ·')+' Uhr',expectedDetail=`${formatOnset(previous.precipitationOnset)} → ${formatOnset(current.precipitationOnset)}`;
 if(item?.detail!==expectedDetail||item.secondaryDetail!=='1 h früher')failures.push(`Niederschlagsbeginn nicht vollständig: ${JSON.stringify(item)}`);
}catch(error){failures.push(`Funktionaler Modelllauf-Test nicht ausführbar: ${error instanceof Error?error.message:String(error)}`)}

if(failures.length){console.error('Radar-/Modelllauf-Konsistenzprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-/Modelllauf-Konsistenz geprüft: Ankunftsfenster, 5-Minuten-Mengenhöhen, PX250-Georeferenz, Mehrframe-Zugrichtung und alter/neuer Niederschlagsbeginn sind geschützt.');
