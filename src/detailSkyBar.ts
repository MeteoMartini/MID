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

const sunVisualShare=(sunshineShare:number|null,_cloudCover?:number)=>{
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
    if(daylight&&!sunshineDirect){
      const openSkyShare=clamp01(1-boundedCloud/100),width=sunBandWidth(openSkyShare);
      if(width>0){const level=skybarAboveHalfLevel(openSkyShare);return {
        layer:'base',
        color:'#ffc229',
        strokeWidth:width,
        thicknessLevel:skybarThicknessLevel(level),
        opacity:0.78,
        title:`Wolkenlücken · ${(openSkyShare*100).toFixed(0)} % unbedeckter Himmelsanteil · Sonnenscheindauer nicht verfügbar`,
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
const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number,cloud:number):WeatherStripVisual|null=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const intervalMinutes=Math.round(intervalSeconds/60),parts=precipitationParts(hour),snowfall=Math.max(0,Number(hour.snowfall??0)),intensity=precipitationIntensityDescriptor(parts.type,amount,snowfall,intervalSeconds,parts.displayCode);
  if(!intensity)return null;
  const {level:rawLevel,label:intensityLabel,basis:intensityBasis}=intensity,level=(rawLevel-1) as SkyBarThicknessIndex,width=skybarThickness(level);
  const rawSunshine=hour.sunshineDuration,sunshineShare=!!hour.isDay&&rawSunshine!==null&&rawSunshine!==undefined&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null;
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
  const cloud=hour.cloud===null||hour.cloud===undefined?NaN:clamp(Number(hour.cloud),0,100);
  const daylight=!!hour.isDay,rawSunshine=hour.sunshineDuration;
  const sunshineShare=daylight&&rawSunshine!==null&&rawSunshine!==undefined&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null;
  const visuals:WeatherStripVisual[]=[];
  const base=baseSkyVisual(cloud,daylight,sunshineShare);
  if(base)visuals.push(base);
  const precipitation=precipitationOverlayVisual(hour,intervalSeconds,cloud);
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
    const cloud=Number(hour.cloud),sunshine=Number(hour.sunshineDuration),precipitation=Number(hour.precipitation),snowfall=Number(hour.snowfall);
    const hasObservedSignal=[cloud,sunshine,precipitation,snowfall].some(Number.isFinite);
    const state:SkyBarHourCell['state']=baseVisual||precipVisual?'weather':hasObservedSignal&&!hour.isDay?'clear-night':'unavailable';
    const title=[baseVisual?.title,precipVisual?.title].filter(Boolean).join(' · ')|| (state==='clear-night'?'Klare Nacht':'Wetterdaten für diese Stunde nicht verfügbar');
    return{key:`hour-${index}`,index,base:toHourVisual(baseVisual),precip:toHourVisual(precipVisual),state,title};
  });
}

function appendSegment(segments:SkyBarSegment[],index:number,prefix:string,x0:number,x1:number,centerY:number,visual:WeatherStripVisual){
  if(x1<=x0)return;
  const previous=segments[segments.length-1];
  if(previous&&Math.abs(previous.x2-x0)<=0.65&&previous.y===centerY&&previous.color===visual.color&&previous.strokeWidth===visual.strokeWidth&&previous.thicknessLevel===visual.thicknessLevel&&previous.opacity===visual.opacity){
    previous.x2=x1;
    previous.title=visual.title;
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
