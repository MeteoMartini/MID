import {useEffect,useMemo,useState} from 'react';
import {HtmlMarker} from './MapLibreCore';
import type {OperaRasterFrame} from './CompositeData';
import {loadOperaRasterData,operaRasterPoint,type OperaRaster} from './OperaRasterSource';
import {loadWeatherPhaseGrid,type WeatherPhaseGridData,type WeatherPhaseGridFrame} from './WeatherMapsData';
import type {RadarPhase} from './radarColorTables';

export type RadarModelPhaseStatus='idle'|'loading'|'ready'|'error';
type OverlayPhase=RadarPhase|'hail'|'graupel';
type PhaseResult={phase:OverlayPhase;label:string;confidence:'hoch'|'mittel'|'eingeschränkt';modelEvidence:boolean};
type EchoSummary={covered:boolean;hits:number;maxDbz:number;meanDbz:number;maxRate:number};
type SymbolPhase='mixed'|'snow'|'freezing'|'hail'|'graupel';
type PhaseSymbol={id:string;lat:number;lon:number;phase:SymbolPhase;symbol:string;label:string;dbz:number};

function finite(value:unknown){const number=Number(value);return Number.isFinite(number)?number:NaN}
function wetBulbStull(t:number,rh:number){if(!Number.isFinite(t)||!Number.isFinite(rh))return NaN;const humidity=Math.max(1,Math.min(100,rh));return t*Math.atan(.151977*Math.sqrt(humidity+8.313659))+Math.atan(t+humidity)-Math.atan(humidity-1.676331)+.00391838*Math.pow(humidity,1.5)*Math.atan(.023101*humidity)-4.686035}

function phaseFor(frame:WeatherPhaseGridFrame,index:number):PhaseResult{
 const code=Math.round(finite(frame.weatherCode[index])||0),temperature=finite(frame.temperature2m[index]),humidity=finite(frame.relativeHumidity2m[index]),directWetBulb=finite(frame.wetBulbTemperature2m[index]),wetBulb=Number.isFinite(directWetBulb)?directWetBulb:wetBulbStull(temperature,humidity),precipitation=Math.max(0,finite(frame.precipitation[index])||0),rain=Math.max(0,finite(frame.rain[index])||0),showers=Math.max(0,finite(frame.showers[index])||0),snowfall=Math.max(0,finite(frame.snowfall[index])||0),snowfallHeight=finite(frame.snowfallHeight[index]),freezingLevel=finite(frame.freezingLevelHeight[index]),elevation=finite(frame.elevation[index]),explicitFreezing=[56,57,66,67].includes(code),explicitSnow=[71,73,75,85,86].includes(code),explicitGraupel=[77].includes(code),explicitMixed=[68,69].includes(code),explicitHail=[96,99].includes(code),explicitThunder=[95,97,98].includes(code),explicitRain=[51,53,55,61,63,65,80,81,82].includes(code),liquid=rain+showers,modelEvidence=precipitation>=.003||liquid>=.003||snowfall>=.003||explicitFreezing||explicitSnow||explicitGraupel||explicitMixed||explicitHail||explicitThunder||explicitRain;
 if(explicitHail)return{phase:'hail',label:'Hagel',confidence:'hoch',modelEvidence};
 if(explicitFreezing)return{phase:'freezing',label:'gefrierender Niederschlag',confidence:Number.isFinite(wetBulb)&&wetBulb<=.8?'hoch':'mittel',modelEvidence};
 if(explicitMixed||(snowfall>=.003&&liquid>=.003))return{phase:'mixed',label:'Schneeregen / Mischphase',confidence:'hoch',modelEvidence};
 if(explicitGraupel)return{phase:'graupel',label:'Graupel / Eiskörner',confidence:Number.isFinite(wetBulb)&&wetBulb<=1.2?'hoch':'mittel',modelEvidence};
 const snowLevelSupports=Number.isFinite(snowfallHeight)&&Number.isFinite(elevation)&&snowfallHeight<=elevation+220,liquidLevelSupports=Number.isFinite(snowfallHeight)&&Number.isFinite(elevation)&&snowfallHeight>=elevation+320,freezeSupports=Number.isFinite(freezingLevel)&&Number.isFinite(elevation)&&freezingLevel<=elevation+280;
 if(explicitSnow||snowfall>=.003){if((Number.isFinite(wetBulb)&&wetBulb<=.9)||snowLevelSupports)return{phase:'snow',label:'Schnee',confidence:explicitSnow?'hoch':'mittel',modelEvidence};if(Number.isFinite(wetBulb)&&wetBulb<=1.7)return{phase:'mixed',label:'Mischphase möglich',confidence:'mittel',modelEvidence}}
 if(explicitRain||explicitThunder||liquid>=.003){if((Number.isFinite(wetBulb)&&wetBulb>=1.3)||liquidLevelSupports)return{phase:'rain',label:'Regen',confidence:explicitRain?'hoch':'mittel',modelEvidence};if(Number.isFinite(wetBulb)&&wetBulb>=.1&&wetBulb<1.3)return{phase:'mixed',label:'Mischphase möglich',confidence:'eingeschränkt',modelEvidence}}
 if(modelEvidence&&Number.isFinite(wetBulb)){
  if(wetBulb<=.1&&snowLevelSupports&&precipitation>=.05)return{phase:'graupel',label:'Graupel / Eiskörner möglich',confidence:'mittel',modelEvidence};
  if(wetBulb<=.35&&snowLevelSupports)return{phase:'snow',label:'Schneephase wahrscheinlich',confidence:'mittel',modelEvidence};
  if(wetBulb>=1.7&&!freezeSupports)return{phase:'rain',label:'flüssige Phase wahrscheinlich',confidence:'mittel',modelEvidence}
 }
 return{phase:'uncertain',label:'Phase nicht belastbar bestimmbar',confidence:'eingeschränkt',modelEvidence};
}

function cellEchoSummary(raster:OperaRaster,south:number,north:number,west:number,east:number,samplesPerAxis=3):EchoSummary{
 let hits=0,maxDbz=NaN,sumDbz=0,maxRate=0;
 for(let row=0;row<samplesPerAxis;row++)for(let col=0;col<samplesPerAxis;col++){
  const lat=south+((row+.5)/samplesPerAxis)*(north-south),lon=west+((col+.5)/samplesPerAxis)*(east-west),echo=operaRasterPoint(raster,lat,lon);
  if(!echo.covered||!Number.isFinite(echo.dbz))continue;const dbz=Number(echo.dbz),rate=Math.max(0,Number(echo.rate)||0);hits++;sumDbz+=dbz;maxDbz=Number.isFinite(maxDbz)?Math.max(maxDbz,dbz):dbz;maxRate=Math.max(maxRate,rate)
 }
 return{covered:hits>0,hits,maxDbz:Number.isFinite(maxDbz)?maxDbz:NaN,meanDbz:hits?sumDbz/hits:NaN,maxRate};
}

function radarBackedThermalPhase(base:PhaseResult,frame:WeatherPhaseGridFrame,index:number,echo:EchoSummary):PhaseResult{
 if((base.phase!=='uncertain'&&base.confidence!=='eingeschränkt')||!echo.covered||!Number.isFinite(echo.maxDbz)||echo.maxDbz<7)return base;
 const temperature=finite(frame.temperature2m[index]),humidity=finite(frame.relativeHumidity2m[index]),directWetBulb=finite(frame.wetBulbTemperature2m[index]),wetBulb=Number.isFinite(directWetBulb)?directWetBulb:wetBulbStull(temperature,humidity),snowfallHeight=finite(frame.snowfallHeight[index]),elevation=finite(frame.elevation[index]);
 if(Number.isFinite(wetBulb)&&wetBulb>=2)return{phase:'rain',label:'Regen · Radar + thermische Phase',confidence:'mittel',modelEvidence:true};
 if(Number.isFinite(wetBulb)&&wetBulb<=-.7&&echo.maxDbz>=17)return{phase:'graupel',label:'Graupel / Eiskörner · Radar + thermische Phase',confidence:'mittel',modelEvidence:true};
 if(Number.isFinite(wetBulb)&&wetBulb<=-.4&&Number.isFinite(snowfallHeight)&&Number.isFinite(elevation)&&snowfallHeight<=elevation+250)return{phase:'snow',label:'Schnee · Radar + thermische Phase',confidence:'mittel',modelEvidence:true};
 return base;
}

function distanceKm(a:PhaseSymbol,b:PhaseSymbol){const latKm=(a.lat-b.lat)*111.2,lonKm=(a.lon-b.lon)*111.2*Math.max(.3,Math.cos((a.lat+b.lat)*Math.PI/360));return Math.hypot(latKm,lonKm)}
function phaseSymbol(phase:SymbolPhase){return phase==='snow'?'❄️':phase==='freezing'?'🧊':phase==='hail'?'◆':phase==='graupel'?'❆':'🌨️'}
function phaseMinimumDbz(phase:SymbolPhase){return phase==='hail'?15:phase==='graupel'?9:(phase==='snow'||phase==='freezing'?5:7)}
function asSymbolPhase(phase:OverlayPhase):SymbolPhase|null{return['mixed','snow','freezing','hail','graupel'].includes(phase)?phase as SymbolPhase:null}

function buildPhaseSymbols(data:WeatherPhaseGridData,raster:OperaRaster):PhaseSymbol[]{
 const frame=data.frame,latStep=data.lats.length>1?Math.abs(data.lats[1]-data.lats[0]):.05,lonStep=data.lons.length>1?Math.abs(data.lons[1]-data.lons[0]):.05,candidates:PhaseSymbol[]=[];
 for(let row=0;row<data.lats.length;row++)for(let col=0;col<data.lons.length;col++){
  const index=row*data.lons.length+col,lat=data.lats[row],lon=data.lons[col],echo=cellEchoSummary(raster,lat-latStep/2,lat+latStep/2,lon-lonStep/2,lon+lonStep/2,3);if(!echo.covered||!Number.isFinite(echo.maxDbz))continue;
  const phase=radarBackedThermalPhase(phaseFor(frame,index),frame,index,echo),typed=asSymbolPhase(phase.phase);if(!typed||phase.confidence==='eingeschränkt')continue;
  if(echo.maxDbz<phaseMinimumDbz(typed))continue;
  candidates.push({id:`${row}:${col}:${typed}`,lat,lon,phase:typed,symbol:phaseSymbol(typed),label:`${phase.label} · ${Math.round(echo.maxDbz)} dBZ · ${data.modelLabel||'Regionalmodell'}`,dbz:echo.maxDbz});
 }
 const selected:PhaseSymbol[]=[];
 for(const item of candidates.sort((a,b)=>b.dbz-a.dbz)){
  const spacing=item.phase==='hail'?18:item.phase==='graupel'?15:14;
  if(selected.some(existing=>distanceKm(existing,item)<spacing))continue;selected.push(item);if(selected.length>=90)break
 }
 return selected;
}

function phaseSummary(symbols:PhaseSymbol[]){
 const counts={mixed:0,snow:0,freezing:0,hail:0,graupel:0} as Record<SymbolPhase,number>;
 for(const item of symbols)counts[item.phase]++;
 const parts=[] as string[];
 if(counts.snow)parts.push(`${counts.snow}× Schnee`);
 if(counts.graupel)parts.push(`${counts.graupel}× Graupel`);
 if(counts.hail)parts.push(`${counts.hail}× Hagel`);
 if(counts.mixed)parts.push(`${counts.mixed}× Mischphase`);
 if(counts.freezing)parts.push(`${counts.freezing}× gefrierend`);
 return parts.join(' · ');
}

function phaseRateLimit(message:string){return /(?:request|rate|minute|minutes|429).*limit|limit.*(?:request|rate|minute|minutes)|too many requests/i.test(message)}

export default function RadarModelPrecipTypeOverlay({latitude,longitude,targetTime,operaFrame,opacity=.9,onStatus}:{latitude:number;longitude:number;targetTime?:string;operaFrame?:OperaRasterFrame|null;opacity?:number;onStatus?:(status:RadarModelPhaseStatus,message?:string)=>void}){
 const[data,setData]=useState<WeatherPhaseGridData|null>(null),[raster,setRaster]=useState<OperaRaster|null>(null),[retryTick,setRetryTick]=useState(0);
 useEffect(()=>{const controller=new AbortController();let retryTimer:number|undefined;setData(null);setRaster(null);if(!operaFrame?.fileUrl){onStatus?.('error','OPERA-CIRRUS-Echomaske fehlt; die Niederschlagsart bleibt aus.');return()=>controller.abort()}const targetIso=targetTime||operaFrame.time,targetMs=Date.parse(targetIso),operaMs=Date.parse(operaFrame.time);if(!Number.isFinite(targetMs)||!Number.isFinite(operaMs)||Math.abs(targetMs-operaMs)>12*60000){onStatus?.('error','OPERA-CIRRUS liegt zeitlich zu weit vom gewählten Radarstand entfernt.');return()=>controller.abort()}onStatus?.('loading','OPERA-CIRRUS-Echomaske und Rapid-/Regionalmodell werden für die Symbolklassifikation geprüft.');Promise.all([loadWeatherPhaseGrid(latitude,longitude,targetIso,controller.signal),loadOperaRasterData(operaFrame.fileUrl,controller.signal)]).then(([grid,nextRaster])=>{if(controller.signal.aborted)return;if(grid.error)throw new Error(grid.error);const modelMs=Date.parse(grid.frame?.time||''),maxTimeDelta=grid.stale?45*60000:20*60000;if(!Number.isFinite(modelMs)||Math.abs(modelMs-targetMs)>maxTimeDelta)throw new Error('Kein ausreichend zeitnahes Rapid-/Regionalmodell-Phasenfeld.');if(Number.isFinite(Number(grid.modelAgeHours))&&Number(grid.modelAgeHours)>16)throw new Error('Der ausgewählte Modelllauf ist für eine belastbare Radarphase zu alt.');setData(grid);setRaster(nextRaster)}).catch(error=>{if(controller.signal.aborted)return;const message=error instanceof Error?error.message:String(error);if(phaseRateLimit(message)){onStatus?.('error','Rapid-/Regionalmodell-Phasenfeld vorübergehend durch das Open-Meteo-Minutenlimit blockiert. Radar bleibt aktiv; automatischer neuer Versuch in etwa 60 s.');retryTimer=window.setTimeout(()=>setRetryTick(value=>value+1),65000)}else onStatus?.('error',message)});return()=>{controller.abort();if(retryTimer!==undefined)window.clearTimeout(retryTimer)}},[latitude,longitude,targetTime,operaFrame?.fileUrl,operaFrame?.time,onStatus,retryTick]);
 const symbols=useMemo(()=>data&&raster?buildPhaseSymbols(data,raster):[],[data,raster]);
 useEffect(()=>{if(!data||!raster)return;const staleNote=data.stale?' · Ersatzfeld wegen temporärem API-Limit':'';const source=`OPERA + ${data.modelLabel||'Regionalmodell'}${data.rapidUpdate?' · Rapid Update':''}`;if(symbols.length){onStatus?.('ready',`${source} · ${symbols.length} Symbole im aktuellen Ausschnitt · ${phaseSummary(symbols)}${staleNote}`);return}onStatus?.('ready',`${source} · Layer aktiv · aktuell keine festen/gemischten Niederschlagsarten im sichtbaren Ausschnitt${staleNote}`)},[data,raster,symbols,onStatus]);
 if(!symbols.length)return null;const safeOpacity=Math.max(.2,Math.min(1,opacity));return <>{symbols.map(item=><HtmlMarker key={item.id} latitude={item.lat} longitude={item.lon} anchor="center" className={`radar-phase-symbol radar-phase-${item.phase}`} zIndex={450} html={`<span style="opacity:${safeOpacity.toFixed(2)}" title="${item.label.replace(/"/g,'&quot;')}">${item.symbol}</span>`}/>)}</>;
}
