import {precipitationIntensityDescriptor,precipitationParts,type PrecipSample} from './precipitation';
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

const sampleIntervalSeconds=(hours:PrecipSample[],index:number)=>{
  const sample=hours[index],explicitStart=Number(sample?.precipitationIntervalStartEpoch),explicitEnd=Number(sample?.precipitationIntervalEndEpoch),explicit=Number.isFinite(explicitStart)&&Number.isFinite(explicitEnd)&&explicitEnd>explicitStart?(explicitEnd-explicitStart)/1000:NaN;
  if(Number.isFinite(explicit)&&explicit>0)return clamp(explicit,60,6*3600);
  const current=Number(sample?.epoch),next=Number(hours[index+1]?.epoch),previous=Number(hours[index-1]?.epoch);
  const forward=Number.isFinite(current)&&Number.isFinite(next)?(next-current)/1000:NaN;
  const backward=Number.isFinite(current)&&Number.isFinite(previous)?(current-previous)/1000:NaN;
  const interval=Number.isFinite(forward)&&forward>0?forward:Number.isFinite(backward)&&backward>0?backward:3600;
  return clamp(interval,60,6*3600);
};

const baseSkyVisual=(cloud:number,daylight:boolean,sunshineShare:number|null):WeatherStripVisual|null=>{
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
        title:`Sonnenscheindauer · ${(directSunshine*100).toFixed(0)} % der betrachteten Zeit · Gesamtbewölkung ${boundedCloud.toFixed(0)} %`,
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
        title:`Wolkenlücken · ${(openSkyShare*100).toFixed(0)} % unbedeckter Himmelsanteil · Gesamtbewölkung ${boundedCloud.toFixed(0)} % · ${sunshineDirect?`Sonnenscheindauer ${(clamp01(Number(sunshineShare))*100).toFixed(0)} % der betrachteten Zeit`:'Sonnenscheindauer nicht verfügbar'}`,
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
      title:`Sonnenscheindauer · ${(directSunshine*100).toFixed(0)} % der betrachteten Zeit · Bewölkung unbekannt`,
    };}
  }
  return null;
};
const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number):WeatherStripVisual|null=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const intervalMinutes=Math.round(intervalSeconds/60),parts=precipitationParts(hour),snowfall=Math.max(0,Number(hour.snowfall??0)),intensity=precipitationIntensityDescriptor(parts.type,amount,snowfall,intervalSeconds,parts.displayCode);
  if(!intensity)return null;
  const {level:rawLevel,label:intensityLabel,basis:intensityBasis}=intensity,level=(rawLevel-1) as SkyBarThicknessIndex,width=skybarThickness(level);
  const rawSunshine=hour.sunshineDuration,sunshineShare=!!hour.isDay&&rawSunshine!==null&&rawSunshine!==undefined&&String(rawSunshine).trim()!==''&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null;
  const hasSunshineBase=!!hour.isDay&&sunshineShare!==null&&Number.isFinite(sunshineShare)&&sunshineShare>.5;
  return {
    layer:'precip',
    color:precipitationPhaseColor(parts.type),
    strokeWidth:width,
    thicknessLevel:skybarThicknessLevel(level),
    opacity:1,
    title:`${parts.label||'Niederschlag'} · ${precipitationPhaseColorLabel(parts.type)} · ${intensityLabel} · ${intensityBasis}${intervalMinutes<60&&parts.type!=='showers'&&parts.type!=='sleetShowers'&&parts.type!=='snowShowers'&&parts.type!=='graupelShowers'&&parts.type!=='hailShowers'&&parts.type!=='thunderstorm'&&parts.type!=='thunderstormHail'?` · ${amount.toFixed(amount>=10?0:1)} mm/${intervalMinutes} min`:''}${hasSunshineBase?' · auf Sonnenscheindauer-Grundband':''}`,
  };
};

const weatherStripVisuals=(hour:PrecipSample,intervalSeconds:number)=>{
  const cloud=hour.cloud===null||hour.cloud===undefined||String(hour.cloud).trim()===''?NaN:clamp(Number(hour.cloud),0,100);
  const daylight=!!hour.isDay,rawSunshine=hour.sunshineDuration;
  const sunshineShare=daylight&&rawSunshine!==null&&rawSunshine!==undefined&&String(rawSunshine).trim()!==''&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null;
  const visuals:WeatherStripVisual[]=[];
  const base=baseSkyVisual(cloud,daylight,sunshineShare);
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

function appendSegment(segments:SkyBarSegment[],index:number,prefix:string,x0:number,x1:number,centerY:number,visual:WeatherStripVisual){
  if(x1<=x0)return;
  const previous=segments[segments.length-1];
  if(previous&&Math.abs(previous.x2-x0)<=0.65&&previous.y===centerY&&previous.color===visual.color&&previous.strokeWidth===visual.strokeWidth&&previous.thicknessLevel===visual.thicknessLevel&&previous.opacity===visual.opacity&&previous.title===visual.title){
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
export function detailSkyBarTimedSegments(samples:PrecipSample[],startEpoch:number,endEpoch:number,left:number,right:number,chartW:number,centerY:number):SkyBarSegment[]{
  if(!Number.isFinite(startEpoch)||!Number.isFinite(endEpoch)||endEpoch<=startEpoch||chartW<=left+right)return[];
  const x=(epoch:number)=>left+(epoch-startEpoch)/(endEpoch-startEpoch)*(chartW-left-right);
  const result=samples.flatMap((sample,index)=>{
    const start=Number(sample.precipitationIntervalStartEpoch??sample.epoch),end=Number(sample.precipitationIntervalEndEpoch);
    if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start||end<=startEpoch||start>=endEpoch)return[];
    // Keep the original amount and duration for intensity; only the geometry is clipped.
    return detailSkyBarSegments([sample],0,0,1,centerY).map(segment=>({...segment,key:`timed-${index}-${segment.key}`,x1:x(Math.max(startEpoch,start)),x2:x(Math.min(endEpoch,end))}));
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
      const rawEnd=Number.isFinite(following)&&following>rawStart?following:rawStart+fallbackWidth;
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
export function detailSkyBarSolarSegments(
  hours:PrecipSample[],left:number,right:number,chartW:number,centerY:number,
  xPositions:number[]|undefined,nightBands:readonly SkyBarSolarNightBand[],
):SkyBarSegment[]{
  const original=detailSkyBarSegments(hours,left,right,chartW,centerY,xPositions);
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
    const rawEnd=positions?(Number.isFinite(following)&&following>rawStart?following:rawStart+fallbackWidth):rawStart+uniformWidth;
    const x0=Math.max(leftEdge,rawStart),x1=Math.min(rightEdge,rawEnd);
    if(!Number.isFinite(x0)||!Number.isFinite(x1)||x1<=x0)return;
    // Instantaneous cloud/isDay state is anchored at hour.epoch, never at an
    // accumulation's potentially different end-anchored precipitation interval.
    const start=hour.epoch===null||hour.epoch===undefined||String(hour.epoch).trim()===''?NaN:Number(hour.epoch);
    const explicitEnd=Number(hour.precipitationIntervalEndEpoch);
    const nextEpoch=Number(hours[index+1]?.epoch);
    const end=Number.isFinite(nextEpoch)&&nextEpoch>start?nextEpoch:Number.isFinite(explicitEnd)&&explicitEnd>start?explicitEnd:NaN;
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
    const duration=sampleIntervalSeconds(hours,index);
    for(let part=0;part<cuts.length-1;part++){
      const from=cuts[part],to=cuts[part+1];
      if(to<=from)continue;
      const middle=from+(to-from)/2;
      const night=validBands.some(band=>band.startEpoch<=middle&&middle<band.endEpoch);
      const base=weatherStripVisuals({...hour,isDay:!night},duration).find(visual=>visual.layer==='base');
      if(!base)continue;
      const startX=x0+(from-start)/(end-start)*(x1-x0),endX=x0+(to-start)/(end-start)*(x1-x0);
      appendSegment(bases,index*1024+part,'base',startX,endX,centerY,base);
    }
  });
  return [...bases,...precip];
}
