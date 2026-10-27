import {precipitationIntensityDescriptor,precipitationParts,WMO_PRECIP_TYPE,type PrecipSample} from './precipitation';
import {precipitationPhaseColor,precipitationPhaseColorLabel} from './precipitationPhaseColor';

export type SkyBarSegment={
  key:string;
  layer:'base'|'precip';
  x1:number;
  x2:number;
  y:number;
  color:string;
  strokeWidth:number;
  thicknessLevel:1|2|3|4;
  opacity:number;
  title:string;
};

export type SkyBarHourVisual={
  color:string;
  thicknessLevel:1|2|3|4;
  opacity:number;
  title:string;
};

export type SkyBarHourCell={
  key:string;
  index:number;
  base:SkyBarHourVisual|null;
  precip:SkyBarHourVisual|null;
  state:'weather'|'clear-night'|'unavailable';
  title:string;
};

type WeatherStripLayer='base'|'precip';

type WeatherStripVisual={
  layer:WeatherStripLayer;
  color:string;
  strokeWidth:number;
  thicknessLevel:1|2|3|4;
  opacity:number;
  title:string;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const clamp01=(value:number)=>clamp(value,0,1);

export const sunVisualShare=(sunshineShare:number|null,_cloudCover?:number)=>{
  // Keep the physical sunshine-duration helper independent from the sky-state
  // classification. If a direct sunshine share exists it remains authoritative
  // for that parameter; cloud complement is only its fallback. The Skybar base
  // itself is classified separately in baseSkyVisual(), where known total cloud
  // cover has priority by design.
  if(sunshineShare!==null&&Number.isFinite(sunshineShare))return clamp01(sunshineShare);
  return NaN;
};

const SKYBAR_THICKNESS_STEPS=[2.4,3.6,4.8,6.0] as const;
type SkyBarThicknessIndex=0|1|2|3;
const skybarThickness=(level:SkyBarThicknessIndex)=>SKYBAR_THICKNESS_STEPS[level];
const skybarThicknessLevel=(level:SkyBarThicknessIndex):1|2|3|4=>(level+1) as 1|2|3|4;
const skybarAboveHalfLevel=(share:number):SkyBarThicknessIndex=>{
  const value=clamp01(share);
  if(value<.625)return 0;
  if(value<.75)return 1;
  if(value<.875)return 2;
  return 3;
};

const cloudBandWidth=(cloud:number)=>{
  if(!Number.isFinite(cloud)||cloud<50)return 0;
  return skybarThickness(skybarAboveHalfLevel(cloud/100));
};

const sunBandWidth=(sunshineShare:number)=>{
  if(sunshineShare<=.5)return 0;
  return skybarThickness(skybarAboveHalfLevel(sunshineShare));
};

// A missing timestamp is not the Unix epoch. In particular Number(null),
// Number('') and Number(false) would otherwise silently fabricate 1970-01-01.
const skybarEpochMillis=(value:unknown):number=>
  typeof value==='number'||(typeof value==='string'&&value.trim()!=='')?Number(value):NaN;

const sampleIntervalSeconds=(hours:PrecipSample[],index:number)=>{
  const sample=hours[index],explicitStart=skybarEpochMillis(sample?.precipitationIntervalStartEpoch),explicitEnd=skybarEpochMillis(sample?.precipitationIntervalEndEpoch),explicit=Number.isFinite(explicitStart)&&Number.isFinite(explicitEnd)&&explicitEnd>explicitStart?(explicitEnd-explicitStart)/1000:NaN;
  if(Number.isFinite(explicit)&&explicit>0)return clamp(explicit,60,6*3600);
  const current=skybarEpochMillis(sample?.epoch),next=skybarEpochMillis(hours[index+1]?.epoch),previous=skybarEpochMillis(hours[index-1]?.epoch);
  const forward=Number.isFinite(current)&&Number.isFinite(next)?(next-current)/1000:NaN;
  const backward=Number.isFinite(current)&&Number.isFinite(previous)?(current-previous)/1000:NaN;
  // With a missing interval-start field, the supplied sample epoch and valid
  // interval end still prove a forward slot, even without adjacent samples.
  const endForward=!Number.isFinite(explicitStart)&&Number.isFinite(current)&&Number.isFinite(explicitEnd)&&explicitEnd>current?(explicitEnd-current)/1000:NaN;
  const interval=Number.isFinite(endForward)&&endForward>0?endForward:Number.isFinite(forward)&&forward>0?forward:Number.isFinite(backward)&&backward>0?backward:3600;
  return clamp(interval,60,6*3600);
};

const baseSkyVisual=(cloud:number,daylight:boolean,sunshineShare:number|null,sunshineReference='der betrachteten Zeit'):WeatherStripVisual|null=>{
  const cloudKnown=Number.isFinite(cloud),sunshineDirect=sunshineShare!==null&&Number.isFinite(sunshineShare);

  // Gesamtbewölkung und Sonnenscheindauer bleiben getrennte physikalische Größen.
  // Bekannte starke Bewölkung trägt das graue Grundband. Bei geringer Bewölkung
  // darf Gelb nur eine direkt gelieferte Sonnenscheindauer oder – klar benannt –
  // den unbedeckten Himmelsanteil darstellen; 1-cloud ist niemals Sonnenscheindauer.
  if(cloudKnown){
    const boundedCloud=clamp(cloud,0,100);
    const cloudWidth=cloudBandWidth(boundedCloud);
    if(cloudWidth>0){const level=skybarAboveHalfLevel(boundedCloud/100);return {
      layer:'base',
      color:'#aeb3b9',
      strokeWidth:cloudWidth,
      thicknessLevel:skybarThicknessLevel(level),
      opacity:0.96,
      title:`Gesamtbewölkung${daylight?'':' Nacht'} · ${boundedCloud.toFixed(0)} %`,
    };}
    if(daylight&&sunshineDirect){
      const directSunshine=clamp01(Number(sunshineShare)),width=sunBandWidth(directSunshine);
      if(width>0){const level=skybarAboveHalfLevel(directSunshine);return {
        layer:'base',
        color:'#ffc229',
        strokeWidth:width,
        thicknessLevel:skybarThicknessLevel(level),
        opacity:0.98,
        title:`Sonnenscheindauer · ${(directSunshine*100).toFixed(0)} % ${sunshineReference} · Gesamtbewölkung ${boundedCloud.toFixed(0)} %`,
      };}
    }
    // Accumulated sunshine can legitimately be short in a sunrise/sunset slot.
    // It must not erase a known open sky. Keep the quantities labelled separately.
    if(daylight&&(!sunshineDirect||Number(sunshineShare)<=.5)){
      const openSkyShare=clamp01(1-boundedCloud/100),width=sunBandWidth(openSkyShare);
      if(width>0){const level=skybarAboveHalfLevel(openSkyShare);return {
        layer:'base',
        color:'#ffc229',
        strokeWidth:width,
        thicknessLevel:skybarThicknessLevel(level),
        opacity:0.78,
        title:`Wolkenlücken · ${(openSkyShare*100).toFixed(0)} % unbedeckter Himmelsanteil · Gesamtbewölkung ${boundedCloud.toFixed(0)} % · ${sunshineDirect?`Sonnenscheindauer ${(clamp01(Number(sunshineShare))*100).toFixed(0)} % ${sunshineReference}`:'Sonnenscheindauer nicht verfügbar'}`,
      };}
    }
    return null;
  }

  if(daylight&&sunshineDirect){
    const directSunshine=clamp01(Number(sunshineShare)),width=sunBandWidth(directSunshine);
    if(width>0){const level=skybarAboveHalfLevel(directSunshine);return {
      layer:'base',
      color:'#ffc229',
      strokeWidth:width,
      thicknessLevel:skybarThicknessLevel(level),
      opacity:0.98,
      title:`Sonnenscheindauer · ${(directSunshine*100).toFixed(0)} % ${sunshineReference} · Bewölkung unbekannt`,
    };}
  }
  return null;
};
// The Skybar must distinguish a measured 0 from a missing precipitation amount.
// A valid WMO weather code can still describe the phase/intensity without an
// amount; a missing amount must never be converted to a fictitious 0 mm.
const skybarKnownAmount=(value:unknown):number|null=>{
  if(typeof value!=='number'&&typeof value!=='string')return null;
  if(typeof value==='string'&&!value.trim())return null;
  const number=Number(value);
  return Number.isFinite(number)&&number>=0?number:null;
};
const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number):WeatherStripVisual|null=>{
  const measuredAmount=skybarKnownAmount(hour.precipitation),measuredSnow=skybarKnownAmount(hour.snowfall);
  const rainComponent=skybarKnownAmount(hour.rain),showerComponent=skybarKnownAmount(hour.showers);
  const code=skybarKnownAmount(hour.code),wmoCode=code!==null&&Number.isInteger(code)&&WMO_PRECIP_TYPE[code]?code:null;
  const partialAmount=Math.max(rainComponent??0,showerComponent??0);
  // Components may establish a positive lower-bound signal but may not
  // masquerade as the missing canonical total amount.
  const amount=measuredAmount??partialAmount,snowfall=measuredSnow??0;
  const hasAmountEvidence=measuredAmount!==null||partialAmount>0||snowfall>0;
  if(!hasAmountEvidence&&wmoCode===null)return null;
  const intervalMinutes=Math.round(intervalSeconds/60),parts=precipitationParts(hour),intensity=precipitationIntensityDescriptor(parts.type,amount,snowfall,intervalSeconds,parts.displayCode);
  if(!intensity)return null;
  const {level:rawLevel,label:intensityLabel}=intensity;
  const intensityBasis=measuredAmount!==null?intensity.basis:
    snowfall>0?`${intensity.basis} · Wasseräquivalent nicht verfügbar`:
    wmoCode!==null?`WMO-Wettercode ${wmoCode} · Gesamtmenge nicht verfügbar`:
    'Gesamtmenge nicht verfügbar · Niederschlagsteilfeld vorhanden';
  const level=(rawLevel-1) as SkyBarThicknessIndex,width=skybarThickness(level);
  const rawSunshine=hour.sunshineDuration,sunshineShare=!!hour.isDay&&rawSunshine!==null&&rawSunshine!==undefined&&String(rawSunshine).trim()!==''&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null;
  const hasSunshineBase=!!hour.isDay&&sunshineShare!==null&&Number.isFinite(sunshineShare)&&sunshineShare>.5;
  return {
    layer:'precip',
    color:precipitationPhaseColor(parts.type),
    strokeWidth:width,
    thicknessLevel:skybarThicknessLevel(level),
    opacity:1,
    title:`${measuredAmount===null?parts.weatherLabel:parts.label||'Niederschlag'} · ${precipitationPhaseColorLabel(parts.type)} · ${intensityLabel} · ${intensityBasis}${measuredAmount!==null&&intervalMinutes<60&&parts.type!=='showers'&&parts.type!=='sleetShowers'&&parts.type!=='snowShowers'&&parts.type!=='graupelShowers'&&parts.type!=='hailShowers'&&parts.type!=='thunderstorm'&&parts.type!=='thunderstormHail'?` · ${measuredAmount.toFixed(measuredAmount>=10?0:1)} mm/${intervalMinutes} min`:''}${hasSunshineBase?' · auf Sonnenscheindauer-Grundband':''}`,
  };
};

const weatherStripVisuals=(hour:PrecipSample,intervalSeconds:number,daylightSeconds?:number)=>{
  const cloud=hour.cloud===null||hour.cloud===undefined||String(hour.cloud).trim()===''?NaN:clamp(Number(hour.cloud),0,100);
  const daylight=!!hour.isDay,rawSunshine=hour.sunshineDuration;
  const sunshineShare=daylight&&rawSunshine!==null&&rawSunshine!==undefined&&String(rawSunshine).trim()!==''&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(.001,daylightSeconds??Math.max(60,intervalSeconds))):null;
  const visuals:WeatherStripVisual[]=[];
  const base=baseSkyVisual(cloud,daylight,sunshineShare,daylightSeconds===undefined?'der betrachteten Zeit':'der möglichen Tageslichtzeit');
  if(base)visuals.push(base);
  const precipitation=precipitationOverlayVisual(hour,intervalSeconds);
  if(precipitation)visuals.push(precipitation);
  return visuals;
};


export function detailSkyBarHourCells(hours:PrecipSample[]):SkyBarHourCell[]{
  return hours.map((hour,index)=>{
    const intervalSeconds=sampleIntervalSeconds(hours,index);
    const visuals=weatherStripVisuals(hour,intervalSeconds);
    const baseVisual=visuals.find(visual=>visual.layer==='base')??null;
    const precipVisual=visuals.find(visual=>visual.layer==='precip')??null;
    const toHourVisual=(visual:WeatherStripVisual|null):SkyBarHourVisual|null=>visual?{
      color:visual.color,
      thicknessLevel:visual.thicknessLevel,
      opacity:visual.opacity,
      title:visual.title,
    }:null;
    const measured=(value:unknown)=>value!==null&&value!==undefined&&String(value).trim()!==''&&Number.isFinite(Number(value))?Number(value):NaN;
    const cloud=measured(hour.cloud),sunshine=measured(hour.sunshineDuration);
    const hasObservedSignal=Number.isFinite(cloud)||(Boolean(hour.isDay)&&Number.isFinite(sunshine));
    const state:SkyBarHourCell['state']=baseVisual||precipVisual?'weather':Number.isFinite(cloud)&&!hour.isDay?'clear-night':hasObservedSignal?'weather':'unavailable';
    const title=[baseVisual?.title,precipVisual?.title].filter(Boolean).join(' · ')|| (Number.isFinite(cloud)?`${hour.isDay?'Tag':'Nacht'} · Gesamtbewölkung ${clamp(cloud,0,100).toFixed(0)} % · kein Bewölkungsband unter 50 %${hour.isDay&&Number.isFinite(sunshine)?` · Sonnenscheindauer ${(clamp01(sunshine/intervalSeconds)*100).toFixed(0)} % der betrachteten Zeit · kein Sonnenband bis 50 %`:''}`:hasObservedSignal?`Sonnenscheindauer ${(clamp01(sunshine/intervalSeconds)*100).toFixed(0)} % der betrachteten Zeit · kein Sonnenband bis 50 % · Bewölkung nicht verfügbar`:`${hour.isDay?'Tag':'Nacht'} · Bewölkung nicht verfügbar`);
    return{key:`hour-${index}`,index,base:toHourVisual(baseVisual),precip:toHourVisual(precipVisual),state,title};
  });
}

function appendSegment(segments:SkyBarSegment[],index:number,prefix:string,x0:number,x1:number,centerY:number,visual:WeatherStripVisual,maxMergeGap=0.65){
  if(x1<=x0)return;
  const previous=segments[segments.length-1];
  if(previous&&Math.abs(previous.x2-x0)<=maxMergeGap&&previous.y===centerY&&previous.color===visual.color&&previous.strokeWidth===visual.strokeWidth&&previous.thicknessLevel===visual.thicknessLevel&&previous.opacity===visual.opacity&&previous.title===visual.title){
    previous.x2=x1;
    return;
  }
  segments.push({
    key:`${prefix}-${index}`,
    layer:visual.layer,
    x1:x0,
    x2:x1,
    y:centerY,
    color:visual.color,
    strokeWidth:visual.strokeWidth,
    thicknessLevel:visual.thicknessLevel,
    opacity:visual.opacity,
    title:visual.title,
  });
}

/** Render explicit forward intervals on a shared epoch axis, preserving gaps and clipping edges. */
export function detailSkyBarTimedSegments(samples:PrecipSample[],startEpoch:number,endEpoch:number,left:number,right:number,chartW:number,centerY:number,nightBands:readonly SkyBarSolarNightBand[]=[]):SkyBarSegment[]{
  if(!Number.isFinite(startEpoch)||!Number.isFinite(endEpoch)||endEpoch<=startEpoch||chartW<=left+right)return[];
  const x=(epoch:number)=>left+(epoch-startEpoch)/(endEpoch-startEpoch)*(chartW-left-right);
  const result=samples.flatMap((sample,index)=>{
    const originalStart=skybarEpochMillis(sample.precipitationIntervalStartEpoch);
    const start=Number.isFinite(originalStart)?originalStart:skybarEpochMillis(sample.epoch);
    const end=skybarEpochMillis(sample.precipitationIntervalEndEpoch);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end<=startEpoch||start>=endEpoch)return[];
    // Keep the original amount and duration for intensity; only the geometry is clipped.
    const segments=nightBands.length?detailSkyBarSolarSegments([sample],0,0,1,centerY,[0],nightBands,[1]):detailSkyBarSegments([sample],0,0,1,centerY);
    return segments.map(segment=>({...segment,key:`timed-${index}-${segment.key}`,x1:x(Math.max(startEpoch,start+(end-start)*segment.x1)),x2:x(Math.min(endEpoch,start+(end-start)*segment.x2))})).filter(segment=>segment.x2>segment.x1);
  });
  return result.filter(segment=>segment.layer==='base').concat(result.filter(segment=>segment.layer==='precip'));
}

export function detailSkyBarSegments(
  hours:PrecipSample[],
  left:number,
  right:number,
  chartW:number,
  centerY:number,
  xPositions?:number[],
  xEndPositions?:number[],
):SkyBarSegment[]{
  if(!hours.length||chartW<=0)return [];

  const baseSegments:SkyBarSegment[]=[];
  const precipSegments:SkyBarSegment[]=[];
  const segmentsForLayer=(layer:WeatherStripLayer)=>layer==='precip'?precipSegments:baseSegments;

  if(Array.isArray(xPositions)&&xPositions.length){
    const leftEdge=left;
    const rightEdge=Math.max(leftEdge,chartW-right);
    const positions=xPositions.slice(0,hours.length);
    hours.forEach((hour,index)=>{
      const visuals=weatherStripVisuals(hour,sampleIntervalSeconds(hours,index));
      if(!visuals.length)return;
      // xPositions represent interval starts. Accumulated precipitation and sunshine
      // belong to the forward interval [T,T+Δ], not to a cell centred on T.
      const rawStart=Number(positions[index]);
      const previous=Number(positions[index-1]);
      const following=Number(positions[index+1]);
      const fallbackWidth=Number.isFinite(rawStart)&&Number.isFinite(previous)&&rawStart>previous?rawStart-previous:(rightEdge-leftEdge)/Math.max(1,hours.length);
      const providedEnd=Number(xEndPositions?.[index]);
      const rawEnd=Array.isArray(xEndPositions)&&Number.isFinite(providedEnd)&&providedEnd>rawStart?providedEnd:Number.isFinite(following)&&following>rawStart?following:rawStart+fallbackWidth;
      const x0=Math.max(leftEdge,Number.isFinite(rawStart)?rawStart:leftEdge);
      const x1=Math.min(rightEdge,Number.isFinite(rawEnd)?rawEnd:rightEdge);
      visuals.forEach((visual,visualIndex)=>appendSegment(segmentsForLayer(visual.layer),index*2+visualIndex,visual.layer,x0,x1,centerY,visual));
    });
    return [...baseSegments,...precipSegments];
  }

  const leftEdge=left;
  const rightEdge=Math.max(leftEdge,chartW-right);
  const segmentWidth=(rightEdge-leftEdge)/hours.length;
  hours.forEach((hour,index)=>{
    const visuals=weatherStripVisuals(hour,sampleIntervalSeconds(hours,index));
    if(!visuals.length)return;
    const segmentLeft=leftEdge+index*segmentWidth;
    const segmentRight=index===hours.length-1?rightEdge:leftEdge+(index+1)*segmentWidth;
    const x0=Math.max(leftEdge,segmentLeft);
    const x1=Math.min(rightEdge,segmentRight);
    visuals.forEach((visual,visualIndex)=>appendSegment(segmentsForLayer(visual.layer),index*2+visualIndex,visual.layer,x0,x1,centerY,visual));
  });

  return [...baseSegments,...precipSegments];
}


/** Verified solar-night clipping for continuous skybars.
 * The night spans are absolute epoch milliseconds from solarTimelineWindow.
 * Original sample amounts, intervals, phase and legacy square cells are unchanged.
 * When exact timestamps are absent, use the legacy appearance, not inferred times.
 */
export type SkyBarSolarNightBand={startEpoch:number;endEpoch:number};
// Only the reference for the visible solar base changes: source seconds and
// precipitation intervals stay untouched. Union overlapping night bands once.
function skybarDaylightSeconds(start:number,end:number,bands:readonly SkyBarSolarNightBand[]){
  const nights=bands.map(band=>({start:Math.max(start,band.startEpoch),end:Math.min(end,band.endEpoch)})).filter(band=>band.end>band.start).sort((a,b)=>a.start-b.start);
  let night=0,coveredUntil=start;
  for(const band of nights){const from=Math.max(coveredUntil,band.start);if(band.end>from)night+=band.end-from;coveredUntil=Math.max(coveredUntil,band.end);}
  return Math.max(0,(end-start-night)/1000);
}
export function detailSkyBarSolarSegments(
  hours:PrecipSample[],left:number,right:number,chartW:number,centerY:number,
  xPositions:number[]|undefined,nightBands:readonly SkyBarSolarNightBand[],
  xEndPositions?:number[],
):SkyBarSegment[]{
  const original=detailSkyBarSegments(hours,left,right,chartW,centerY,xPositions,xEndPositions);
  if(!hours.length||!nightBands.length||!Number.isFinite(chartW)||chartW<=left+right)return original;
  const validBands=nightBands.filter(band=>Number.isFinite(band.startEpoch)&&Number.isFinite(band.endEpoch)&&band.endEpoch>band.startEpoch);
  if(!validBands.length)return original;
  const bases:SkyBarSegment[]=[],precip=original.filter(segment=>segment.layer==='precip');
  const leftEdge=left,rightEdge=Math.max(leftEdge,chartW-right),uniformWidth=(rightEdge-leftEdge)/hours.length;
  const positions=xPositions?.slice(0,hours.length);
  hours.forEach((hour,index)=>{
    const rawStart=positions?Number(positions[index]):leftEdge+index*uniformWidth;
    const previous=positions?Number(positions[index-1]):NaN;
    const following=positions?Number(positions[index+1]):NaN;
    const fallbackWidth=positions?(Number.isFinite(rawStart)&&Number.isFinite(previous)&&rawStart>previous?rawStart-previous:uniformWidth):uniformWidth;
    const providedEnd=Number(xEndPositions?.[index]);
    const rawEnd=positions?(Array.isArray(xEndPositions)&&Number.isFinite(providedEnd)&&providedEnd>rawStart?providedEnd:Number.isFinite(following)&&following>rawStart?following:rawStart+fallbackWidth):rawStart+uniformWidth;
    const x0=Math.max(leftEdge,rawStart),x1=Math.min(rightEdge,rawEnd);
    if(!Number.isFinite(x0)||!Number.isFinite(x1)||x1<=x0)return;
    // Instantaneous cloud/isDay state is anchored at hour.epoch, never at an
    // accumulation's potentially different end-anchored precipitation interval.
    const start=skybarEpochMillis(hour.epoch);
    const explicitEnd=skybarEpochMillis(hour.precipitationIntervalEndEpoch);
    const nextEpoch=skybarEpochMillis(hours[index+1]?.epoch);
    const end=Array.isArray(xEndPositions)&&Number.isFinite(explicitEnd)&&explicitEnd>start?explicitEnd:Number.isFinite(nextEpoch)&&nextEpoch>start?nextEpoch:Number.isFinite(explicitEnd)&&explicitEnd>start?explicitEnd:NaN;
    const originalBase=weatherStripVisuals(hour,sampleIntervalSeconds(hours,index)).find(visual=>visual.layer==='base');
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start){
      if(originalBase)appendSegment(bases,index*1024,'base',x0,x1,centerY,originalBase);
      return;
    }
    const cuts=[start,end];
    validBands.forEach(band=>{
      if(band.startEpoch>start&&band.startEpoch<end)cuts.push(band.startEpoch);
      if(band.endEpoch>start&&band.endEpoch<end)cuts.push(band.endEpoch);
    });
    cuts.sort((a,b)=>a-b);
    const duration=sampleIntervalSeconds(hours,index),daylightSeconds=skybarDaylightSeconds(start,end,validBands);
    for(let part=0;part<cuts.length-1;part++){
      const from=cuts[part],to=cuts[part+1];
      if(to<=from)continue;
      const middle=from+(to-from)/2;
      const night=validBands.some(band=>band.startEpoch<=middle&&middle<band.endEpoch);
      const base=weatherStripVisuals({...hour,isDay:!night},duration,daylightSeconds).find(visual=>visual.layer==='base');
      if(!base)continue;
      const startX=x0+(from-start)/(end-start)*(x1-x0),endX=x0+(to-start)/(end-start)*(x1-x0);
      appendSegment(bases,index*1024+part,'base',startX,endX,centerY,base,0);
    }
  });
  return [...bases,...precip];
}
