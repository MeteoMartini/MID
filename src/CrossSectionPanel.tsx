import {useMemo,useRef,useState} from 'react';
import {AlertTriangle,Download,Plane,RefreshCw,Route as RouteIcon} from 'lucide-react';
import {toBlob} from 'html-to-image';
import {fetchWorkerJson} from './workerClient';

const ROUTE_KEY='mid:flightCrossSection:route';
const MODEL_KEY='mid:flightCrossSection:model';
const FL_KEY='mid:flightCrossSection:flightLevel';
const SAMPLES_KEY='mid:flightCrossSection:samples';
const START_KEY='mid:flightCrossSection:start';
const END_KEY='mid:flightCrossSection:end';
const STAGE_WIDTH=1280;
const STAGE_HEIGHT=690;
const MAX_HFT=550;

type ModelOption={id:string;label:string;detail:string};
const MODELS:ModelOption[]=[
 {id:'best_match',label:'Best Match',detail:'ortsabhängig optimierte Modellwahl'},
 {id:'dwd_icon_eu',label:'DWD ICON-EU',detail:'Europa · hohe räumliche Auflösung'},
 {id:'ecmwf_ifs',label:'ECMWF IFS',detail:'global · robuste synoptische Entwicklung'},
 {id:'ncep_gfs025',label:'NOAA GFS 0,25°',detail:'global · lange Vorhersage'},
 {id:'dwd_icon',label:'DWD ICON Global',detail:'global · DWD-Modell'}
];

type CrossLevel={pressure:number;height:number|null;temperature:number|null;humidity:number|null;cloud:number|null;windSpeed:number|null;windDirection:number|null};
type CrossPoint={fraction:number;distanceKm:number;latitude:number;longitude:number;elevation:number;validTime:string;precipitation:number|null;levels:CrossLevel[]};
type CrossWaypoint={id:string;name:string;latitude:number;longitude:number;elevation:number;fraction:number;distanceKm:number};
type CrossSectionData={route:string;waypoints:CrossWaypoint[];points:CrossPoint[];totalDistanceKm:number;startTime:string;endTime:string;flightLevel:number;model:string;modelLabel:string;generatedAt:string;source:string;version?:string;error?:string};

type Cell={path:string;opacity:number;kind:'cloud'|'icing'|'turbulence'};
type SvgLine={path:string;label:string;color:string;dash?:string};

function storageGet(key:string,fallback:string){try{return localStorage.getItem(key)??fallback}catch{return fallback}}
function storageSet(key:string,value:string){try{localStorage.setItem(key,value)}catch{}}
function utcInput(date:Date){return date.toISOString().slice(0,16)}
function initialStart(){const saved=storageGet(START_KEY,'');if(saved)return saved;const date=new Date();date.setUTCMinutes(0,0,0);date.setUTCHours(date.getUTCHours()+1);return utcInput(date)}
function initialEnd(start:string){const saved=storageGet(END_KEY,'');if(saved)return saved;const date=new Date(`${start}:00Z`);date.setUTCHours(date.getUTCHours()+2);return utcInput(date)}
function parseUtcInput(value:string){const parsed=Date.parse(`${value}:00Z`);return Number.isFinite(parsed)?new Date(parsed).toISOString():''}
function finite(value:unknown):number|null{const number=Number(value);return value===null||value===undefined||value===''||!Number.isFinite(number)?null:number}
function hft(metres:number|null){return metres===null?null:metres*3.28084/100}
function xAt(fraction:number){return 74+Math.max(0,Math.min(1,fraction))*(STAGE_WIDTH-104)}
function yAtHft(value:number){const top=42,bottom=480;return top+(MAX_HFT-Math.max(0,Math.min(MAX_HFT,value)))/MAX_HFT*(bottom-top)}
function routeCodes(value:string){return value.toUpperCase().split(/[^A-Z0-9]+/).map(item=>item.trim()).filter(Boolean)}
function timeLabel(value:string){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',hourCycle:'h23'}).format(date)+' UTC':'–'}
function dateTimeLabel(value:string){const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('de-DE',{timeZone:'UTC',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date)+' UTC':'–'}
function interpolateLevel(levels:CrossLevel[],targetHft:number,key:'temperature'|'humidity'|'cloud'|'windSpeed'|'windDirection'){
 const rows=levels.map(level=>({height:hft(level.height),value:finite(level[key])})).filter((row):row is {height:number;value:number}=>row.height!==null&&row.value!==null).sort((a,b)=>a.height-b.height);
 if(!rows.length)return null;if(targetHft<=rows[0].height)return rows[0].value;if(targetHft>=rows[rows.length-1].height)return rows[rows.length-1].value;
 for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i];if(targetHft<=b.height){const f=(targetHft-a.height)/Math.max(1,b.height-a.height);if(key==='windDirection'){const delta=((b.value-a.value+540)%360)-180;return(a.value+delta*f+360)%360}return a.value+(b.value-a.value)*f}}
 return null;
}
function heightForValue(levels:CrossLevel[],key:'temperature'|'windSpeed',target:number){
 const rows=levels.map(level=>({height:hft(level.height),value:finite(level[key])})).filter((row):row is {height:number;value:number}=>row.height!==null&&row.value!==null).sort((a,b)=>a.height-b.height);
 for(let i=1;i<rows.length;i++){const a=rows[i-1],b=rows[i];if((a.value-target)*(b.value-target)<=0&&a.value!==b.value){const f=(target-a.value)/(b.value-a.value);return a.height+(b.height-a.height)*f}}
 return null;
}
function tropopauseHeight(levels:CrossLevel[]){
 const rows=levels.map(level=>({height:hft(level.height),temperature:finite(level.temperature)})).filter((row):row is {height:number;temperature:number}=>row.height!==null&&row.temperature!==null&&row.height>=260&&row.height<=560).sort((a,b)=>a.height-b.height);
 if(!rows.length)return 390;let coldest=rows[0];for(const row of rows)if(row.temperature<coldest.temperature)coldest=row;return Math.max(300,Math.min(520,coldest.height));
}
function pathFromHeights(points:CrossPoint[],height:(point:CrossPoint)=>number|null){const coords=points.map(point=>{const value=height(point);return value===null?null:[xAt(point.fraction),yAtHft(value)] as [number,number]}).filter((value):value is [number,number]=>Boolean(value));return coords.length>1?`M ${coords.map(([x,y])=>`${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')}`:''}
function contourLines(points:CrossPoint[]):SvgLine[]{
 const lines:SvgLine[]=[];
 const zero=pathFromHeights(points,point=>heightForValue(point.levels,'temperature',0));if(zero)lines.push({path:zero,label:'0 °C',color:'#e84646'});
 const tropo=pathFromHeights(points,point=>tropopauseHeight(point.levels));if(tropo)lines.push({path:tropo,label:'Tropopause',color:'#f5dc33'});
 for(const threshold of[50,75,100]){const path=pathFromHeights(points,point=>heightForValue(point.levels,'windSpeed',threshold));if(path)lines.push({path,label:`${threshold} kt`,color:'#a28b27',dash:'6 5'})}
 return lines;
}
function cells(points:CrossPoint[]):Cell[]{
 const result:Cell[]=[];if(points.length<2)return result;const pressures=[1000,975,950,925,900,850,800,700,600,500,400,300,250,200,150,100];
 for(let i=0;i<points.length-1;i++){
  const a=points[i],b=points[i+1],x1=xAt(a.fraction),x2=xAt(b.fraction);
  for(let levelIndex=0;levelIndex<pressures.length-1;levelIndex++){
   const p1=pressures[levelIndex],p2=pressures[levelIndex+1],a1=a.levels.find(level=>level.pressure===p1),a2=a.levels.find(level=>level.pressure===p2),b1=b.levels.find(level=>level.pressure===p1),b2=b.levels.find(level=>level.pressure===p2);if(!a1||!a2||!b1||!b2)continue;
   const ah1=hft(a1.height),ah2=hft(a2.height),bh1=hft(b1.height),bh2=hft(b2.height);if(ah1===null||ah2===null||bh1===null||bh2===null)continue;
   const avg=(values:(number|null)[])=>{const finiteValues=values.filter((value):value is number=>value!==null&&Number.isFinite(value));return finiteValues.length?finiteValues.reduce((sum,value)=>sum+value,0)/finiteValues.length:null};
   const cloud=avg([finite(a1.cloud),finite(a2.cloud),finite(b1.cloud),finite(b2.cloud)]),humidity=avg([finite(a1.humidity),finite(a2.humidity),finite(b1.humidity),finite(b2.humidity)]),temperature=avg([finite(a1.temperature),finite(a2.temperature),finite(b1.temperature),finite(b2.temperature)]),windLow=avg([finite(a1.windSpeed),finite(b1.windSpeed)]),windHigh=avg([finite(a2.windSpeed),finite(b2.windSpeed)]);
   const path=`M ${x1.toFixed(1)} ${yAtHft(ah1).toFixed(1)} L ${x2.toFixed(1)} ${yAtHft(bh1).toFixed(1)} L ${x2.toFixed(1)} ${yAtHft(bh2).toFixed(1)} L ${x1.toFixed(1)} ${yAtHft(ah2).toFixed(1)} Z`;
   const cloudScore=Math.max(cloud??0,Math.max(0,(humidity??0)-65)*2.2);if(cloudScore>=35)result.push({path,kind:'cloud',opacity:Math.min(.9,.16+cloudScore/125)});
   if(temperature!==null&&temperature<=0&&temperature>=-20&&cloudScore>=45)result.push({path,kind:'icing',opacity:temperature>=-12?.55:.36});
   const verticalShear=windLow!==null&&windHigh!==null?Math.abs(windHigh-windLow)/Math.max(8,Math.abs((ah2+bh2-ah1-bh1)/2)/10):0;if(verticalShear>=1.15)result.push({path,kind:'turbulence',opacity:Math.min(.7,.28+verticalShear/6)});
  }
 }
 return result;
}
function cloudCode(value:number|null){if(value===null)return'–';if(value<12)return'CLEAR';if(value<37)return'FEW';if(value<62)return'SCT';if(value<87)return'BKN';return'OVC'}
function safeFileName(value:string){return value.replace(/[^A-Z0-9_-]+/gi,'-').replace(/^-+|-+$/g,'')||'route'}

function CrossSectionGraphic({data}:{data:CrossSectionData}){
 const lines=useMemo(()=>contourLines(data.points),[data.points]),riskCells=useMemo(()=>cells(data.points),[data.points]),flightY=yAtHft(data.flightLevel),terrainPath=`M 74 480 ${data.points.map(point=>`L ${xAt(point.fraction).toFixed(1)} ${yAtHft(Math.max(0,hft(point.elevation)??0)).toFixed(1)}`).join(' ')} L ${STAGE_WIDTH-30} 480 Z`,sampleIndexes=Array.from(new Set([0,Math.round((data.points.length-1)*.2),Math.round((data.points.length-1)*.4),Math.round((data.points.length-1)*.6),Math.round((data.points.length-1)*.8),data.points.length-1]));
 return <div className="flight-cross-stage" data-flight-export="cross-section"><svg viewBox={`0 0 ${STAGE_WIDTH} ${STAGE_HEIGHT}`} role="img" aria-label={`Flugmeteorologischer Cross Section ${data.route}`}>
  <defs>
   <linearGradient id="flightSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#133d83"/><stop offset=".58" stopColor="#4b82ce"/><stop offset="1" stopColor="#7eaae5"/></linearGradient>
   <linearGradient id="flightTerrain" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e7dc75"/><stop offset="1" stopColor="#7d7040"/></linearGradient>
   <pattern id="icingPattern" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 0 5 H 10 M 5 0 V 10" stroke="#83e8ff" strokeWidth="1.3" opacity=".9"/></pattern>
   <pattern id="turbPattern" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M 0 0 V 10" stroke="#ffb144" strokeWidth="2" opacity=".85"/></pattern>
   <filter id="softCloud"><feGaussianBlur stdDeviation="1.2"/></filter>
  </defs>
  <rect x="0" y="0" width={STAGE_WIDTH} height={STAGE_HEIGHT} fill="#f7f8fb"/>
  <rect x="74" y="42" width={STAGE_WIDTH-104} height="438" rx="4" fill="url(#flightSky)"/>
  {Array.from({length:12},(_,index)=>index*50).map(level=><g key={level}><line x1="74" x2={STAGE_WIDTH-30} y1={yAtHft(level)} y2={yAtHft(level)} stroke="rgba(255,255,255,.22)" strokeDasharray="2 5"/><text x="64" y={yAtHft(level)+3} textAnchor="end" className="flight-axis-label">{level}</text><text x={STAGE_WIDTH-23} y={yAtHft(level)+3} className="flight-axis-label">{level}</text></g>)}
  {data.points.map((point,index)=><line key={`v-${index}`} x1={xAt(point.fraction)} x2={xAt(point.fraction)} y1="42" y2="480" stroke="rgba(255,255,255,.15)" strokeDasharray="3 5"/>)}
  {riskCells.filter(cell=>cell.kind==='cloud').map((cell,index)=><path key={`c-${index}`} d={cell.path} fill="#fff" opacity={cell.opacity} filter="url(#softCloud)"/>)}
  {riskCells.filter(cell=>cell.kind==='icing').map((cell,index)=><path key={`i-${index}`} d={cell.path} fill="url(#icingPattern)" opacity={cell.opacity}/>)}
  {riskCells.filter(cell=>cell.kind==='turbulence').map((cell,index)=><path key={`t-${index}`} d={cell.path} fill="url(#turbPattern)" opacity={cell.opacity}/>)}
  {data.points.map((point,index)=>{const amount=finite(point.precipitation)??0;if(amount<.1)return null;const x=xAt(point.fraction),terrainY=yAtHft(hft(point.elevation)??0),height=Math.min(150,25+amount*35);return <g key={`p-${index}`} opacity={Math.min(.9,.35+amount/5)}><path d={`M ${x-4} ${terrainY-height} Q ${x} ${terrainY-height-18} ${x+4} ${terrainY-height} L ${x+7} ${terrainY} L ${x-7} ${terrainY} Z`} fill="#f7e6c6"/><text x={x} y={terrainY-height-5} textAnchor="middle" className="flight-precip-label">{amount>=1?'▾▾':'▾'}</text></g>})}
  {lines.map((line,index)=><g key={`${line.label}-${index}`}><path d={line.path} fill="none" stroke={line.color} strokeWidth={line.label==='0 °C'?2.3:1.8} strokeDasharray={line.dash}/><text x="84" y={line.label==='Tropopause'?70+index*13:line.label==='0 °C'?yAtHft(heightForValue(data.points[0]?.levels??[],'temperature',0)??100)-5:95+index*12} fill={line.color} className="flight-contour-label">{line.label}</text></g>)}
  <line x1="74" x2={STAGE_WIDTH-30} y1={flightY} y2={flightY} stroke="#ffef00" strokeWidth="2.4"/>
  <rect x="78" y={Math.max(45,flightY-16)} width="58" height="15" rx="3" fill="#fff200"/><text x="107" y={Math.max(56,flightY-5)} textAnchor="middle" className="flight-level-label">FL{String(Math.round(data.flightLevel)).padStart(3,'0')}</text>
  <path d={terrainPath} fill="url(#flightTerrain)" stroke="#6f6335" strokeWidth="1.2"/>
  <text x="18" y="265" transform="rotate(-90 18 265)" className="flight-axis-title">Altitude (hft)</text>
  <text x="76" y="20" className="flight-chart-title">MID CROSS SECTION · {data.route}</text><text x={STAGE_WIDTH-30} y="20" textAnchor="end" className="flight-chart-meta">{data.modelLabel} · {dateTimeLabel(data.startTime)} → {dateTimeLabel(data.endTime)}</text>
  {data.waypoints.map((waypoint,index)=><g key={`${waypoint.id}-${index}`}><line x1={xAt(waypoint.fraction)} x2={xAt(waypoint.fraction)} y1="42" y2="480" stroke="rgba(255,238,0,.7)" strokeWidth="1"/><rect x={xAt(waypoint.fraction)-27} y="482" width="54" height="16" rx="3" fill="#e8fff1" stroke="#88c99d"/><text x={xAt(waypoint.fraction)} y="494" textAnchor="middle" className="flight-waypoint-label">{waypoint.id}</text></g>)}
  <rect x="74" y="506" width={STAGE_WIDTH-104} height="82" rx="4" fill="#fff" stroke="#cad3df"/>
  {sampleIndexes.map((sampleIndex,column)=>{const point=data.points[sampleIndex],x=74+column*(STAGE_WIDTH-104)/(sampleIndexes.length-1),temp=interpolateLevel(point.levels,data.flightLevel,'temperature'),speed=interpolateLevel(point.levels,data.flightLevel,'windSpeed'),direction=interpolateLevel(point.levels,data.flightLevel,'windDirection'),cloud=interpolateLevel(point.levels,data.flightLevel,'cloud');return <g key={`summary-${sampleIndex}`}><line x1={x} x2={x} y1="506" y2="588" stroke="#d4dbe5"/><text x={x} y="521" textAnchor="middle" className="flight-summary-time">{timeLabel(point.validTime)}</text><text x={x} y="538" textAnchor="middle" className="flight-summary-main">{temp===null?'–':`${Math.round(temp)} °C`} · {speed===null?'–':`${Math.round(speed)} kt`}</text><text x={x} y="554" textAnchor="middle" className="flight-summary-secondary">{direction===null?'–':`${Math.round(direction)}°`} · {cloudCode(cloud)}</text><text x={x} y="571" textAnchor="middle" className="flight-summary-coord">{point.latitude.toFixed(2)}° / {point.longitude.toFixed(2)}°</text></g>})}
  <rect x="74" y="602" width={STAGE_WIDTH-104} height="66" rx="4" fill="#f3f6fa" stroke="#cad3df"/>
  {[50,100,150,200,300,400].map((level,index)=><g key={level}><text x="86" y={618+index*8} className="flight-standard-label">FL{String(level).padStart(3,'0')}</text><text x="126" y={618+index*8} className="flight-standard-value">{sampleIndexes.map(sampleIndex=>{const point=data.points[sampleIndex],speed=interpolateLevel(point.levels,level,'windSpeed'),direction=interpolateLevel(point.levels,level,'windDirection'),temp=interpolateLevel(point.levels,level,'temperature');return`${direction===null?'---':String(Math.round(direction)).padStart(3,'0')}/${speed===null?'--':String(Math.round(speed)).padStart(2,'0')} ${temp===null?'--':Math.round(temp)}`}).join('   ')}</text></g>)}
 </svg></div>
}

export default function CrossSectionPanel(){
 const[start,setStart]=useState(initialStart),[end,setEnd]=useState(()=>initialEnd(initialStart())),[route,setRoute]=useState(()=>storageGet(ROUTE_KEY,'EDDG_EDDF')),[flightLevel,setFlightLevel]=useState(()=>Math.max(0,Math.min(550,Number(storageGet(FL_KEY,'100'))||100))),[model,setModel]=useState(()=>storageGet(MODEL_KEY,'best_match')),[samples,setSamples]=useState(()=>Math.max(9,Math.min(19,Number(storageGet(SAMPLES_KEY,'13'))||13))),[loading,setLoading]=useState(false),[error,setError]=useState(''),[data,setData]=useState<CrossSectionData|null>(null),stageRef=useRef<HTMLDivElement>(null);
 const codes=routeCodes(route),validRoute=codes.length>=2&&codes.length<=8&&codes.every(code=>/^[A-Z0-9]{4}$/.test(code)),modelOption=MODELS.find(item=>item.id===model)??MODELS[0];
 async function generate(){
  const startIso=parseUtcInput(start),endIso=parseUtcInput(end);if(!validRoute){setError('Bitte 2 bis 8 gültige ICAO-Kennungen mit Leerzeichen, Bindestrich oder Unterstrich eingeben.');return}if(!startIso||!endIso||Date.parse(endIso)<Date.parse(startIso)){setError('Start- und Endzeit müssen gültig sein; das Ende darf nicht vor dem Start liegen.');return}
  setLoading(true);setError('');storageSet(ROUTE_KEY,codes.join('_'));storageSet(MODEL_KEY,model);storageSet(FL_KEY,String(flightLevel));storageSet(SAMPLES_KEY,String(samples));storageSet(START_KEY,start);storageSet(END_KEY,end);
  try{const response=await fetchWorkerJson<CrossSectionData>('flight-cross-section',{route:codes.join('_'),start:startIso,end:endIso,flight_level:Math.round(flightLevel),model,samples},{purpose:'meteogram',timeoutMs:42000});setData(response)}catch(reason){setError(reason instanceof Error?reason.message:String(reason))}finally{setLoading(false)}
 }
 async function exportPng(){if(!stageRef.current||!data)return;const blob=await toBlob(stageRef.current,{pixelRatio:2,backgroundColor:'#f7f8fb',cacheBust:true,width:STAGE_WIDTH,height:STAGE_HEIGHT});if(!blob)return;const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download=`MID-Cross-Section-${safeFileName(data.route)}-${data.startTime.slice(0,16).replace(/[:T]/g,'-')}.png`;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),5000)}
 return <section className="flight-cross-section">
  <header className="flight-section-head"><div><span>Flugmeteorologie</span><h3>Cross Section</h3><p>Räumlich-zeitlicher Vertikalschnitt entlang einer ICAO-Route.</p></div><span className="flight-source-badge">Open-Meteo · NOAA AWC</span></header>
  <form className="flight-cross-form" onSubmit={event=>{event.preventDefault();void generate()}}>
   <label className="flight-route-input"><span>Route · ICAO-Kennungen</span><div><RouteIcon size={16}/><input value={route} onChange={event=>setRoute(event.target.value.toUpperCase())} placeholder="EDDG_EDDL_EDDF" autoCapitalize="characters" spellCheck={false}/></div><small>2–8 Punkte in Flugrichtung; Trennung durch Leerzeichen, „-“ oder „_“.</small></label>
   <label><span>Start · UTC</span><input type="datetime-local" value={start} onChange={event=>setStart(event.target.value)} step="3600"/></label>
   <label><span>Ende · UTC</span><input type="datetime-local" value={end} onChange={event=>setEnd(event.target.value)} step="3600"/></label>
   <label><span>Detailliertes Flugniveau</span><div className="flight-number-field"><b>FL</b><input type="number" min="0" max="550" step="10" value={flightLevel} onChange={event=>setFlightLevel(Math.max(0,Math.min(550,Number(event.target.value)||0)))}/></div></label>
   <label><span>Modell</span><select value={model} onChange={event=>setModel(event.target.value)}>{MODELS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select><small>{modelOption.detail}</small></label>
   <label><span>Abtastpunkte</span><select value={samples} onChange={event=>setSamples(Number(event.target.value))}><option value="9">9 · schnell</option><option value="13">13 · ausgewogen</option><option value="17">17 · detailliert</option><option value="19">19 · maximal</option></select></label>
   <button type="submit" className="primary flight-generate" disabled={loading||!validRoute}>{loading?<RefreshCw className="spin" size={16}/>:<Plane size={16}/>} {loading?'Cross Section wird berechnet …':'Cross Section erzeugen'}</button>
  </form>
  <div className="flight-guide"><AlertTriangle size={15}/><span>Diagnostische Modellgrafik, keine amtliche Flugwetterberatung oder Navigationsgrundlage. Gelände, Vereisung und Turbulenz sind automatisierte Näherungen.</span></div>
  {error&&<div className="error">{error}</div>}
  {data&&<><div className="flight-result-toolbar"><div><b>{data.route.replaceAll('_',' → ')}</b><small>{Math.round(data.totalDistanceKm)} km · FL{String(data.flightLevel).padStart(3,'0')} · {data.modelLabel}</small></div><button type="button" className="secondary" onClick={()=>void exportPng()}><Download size={15}/> PNG</button></div><div ref={stageRef} className="flight-stage-export"><CrossSectionGraphic data={data}/></div><div className="flight-legend"><span><i className="cloud"/>Wolken</span><span><i className="icing"/>Vereisung</span><span><i className="turbulence"/>Turbulenz</span><span><i className="freezing"/>0-°C-Niveau</span><span><i className="tropopause"/>Tropopause</span><span><i className="flightlevel"/>gewähltes FL</span></div><div className="flight-point-cards">{data.waypoints.map((waypoint,index)=><article key={`${waypoint.id}-${index}`}><header><b>{waypoint.id}</b><span>{Math.round(waypoint.distanceKm)} km</span></header><strong>{waypoint.name||'Flugplatz'}</strong><small>{waypoint.latitude.toFixed(4)}°, {waypoint.longitude.toFixed(4)}° · {Math.round(waypoint.elevation)} m</small></article>)}</div><small className="flight-data-note">Quelle: {data.source}. Darstellung nach dem Grundprinzip eines GRAMET/Route-Meteogramms: Höhe gegen Route und Zeit, mit Wolken-, Nullgrad-, Wind-, Vereisungs-, Turbulenz- und Geländeindikatoren.</small></>}
  {!data&&!loading&&!error&&<div className="flight-empty"><Plane size={28}/><strong>Route eingeben und Cross Section erzeugen</strong><span>Die Grafik kombiniert räumliche Route und zeitlichen Flugverlauf. Bei identischer Start- und Endzeit entsteht ein reiner Wetterschnitt.</span></div>}
 </section>
}
