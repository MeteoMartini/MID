import {precipitationParts,type PrecipSample} from './precipitation';
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

const sunVisualShare=(sunshineShare:number|null,cloudCover:number)=>{
  if(sunshineShare!==null&&Number.isFinite(sunshineShare))return clamp01(sunshineShare);
  if(!Number.isFinite(cloudCover))return NaN;const cloud=clamp(cloudCover,0,100);
  return clamp01(1-cloud/100);
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

const precipBandLevel=(amount:number):SkyBarThicknessIndex|null=>{
  if(amount<0.05)return null;
  if(amount<0.5)return 0;
  if(amount<2.5)return 1;
  if(amount<10)return 2;
  return 3;
};
const precipBandWidth=(amount:number)=>{const level=precipBandLevel(amount);return level===null?0:skybarThickness(level);};

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
  const sunshineDirect=sunshineShare!==null&&Number.isFinite(sunshineShare);
  if(daylight){
    const visualSunshine=sunVisualShare(sunshineShare,cloud);
    if(visualSunshine>.5){
      const level=skybarAboveHalfLevel(visualSunshine),width=sunBandWidth(visualSunshine);
      if(width>0)return {
        layer:'base',
        color:'#ffc229',
        strokeWidth:width,
        thicknessLevel:skybarThicknessLevel(level),
        opacity:0.98,
        title:`Sonnenschein · ${(visualSunshine*100).toFixed(0)} % der betrachteten Zeit${sunshineDirect?'':' · aus Bewölkungsgrad abgeleitet'} · ${Number.isFinite(cloud)?`${cloud.toFixed(0)} % Wolken`:'Bewölkung unbekannt'}`,
      };
    }
  }

  const regularCloudWidth=cloudBandWidth(cloud),daylightFallback=daylight&&sunshineDirect&&sunshineShare<=.5&&regularCloudWidth<=0;
  const fallbackShare=Number.isFinite(cloud)?Math.max(.5,clamp01(cloud/100)):sunshineDirect?Math.max(.5,1-clamp01(Number(sunshineShare))):NaN;
  const level=regularCloudWidth>0?skybarAboveHalfLevel(cloud/100):daylightFallback&&Number.isFinite(fallbackShare)?skybarAboveHalfLevel(fallbackShare):0;
  const width=regularCloudWidth>0?regularCloudWidth:daylightFallback?skybarThickness(level):0;
  if(width<=0)return null;
  const cloudLabel=Number.isFinite(cloud)?`${cloud.toFixed(0)} %`:'unbekannt';
  return {
    layer:'base',
    color:'#aeb3b9',
    strokeWidth:width,
    thicknessLevel:skybarThicknessLevel(level),
    opacity:0.96,
    title:`Bewölkung${daylight?'':' Nacht'} · ${cloudLabel}${daylightFallback?' · Tages-Fallback bei ≤50 % Sonnenschein':''}`,
  };
};

const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number,cloud:number):WeatherStripVisual|null=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds));
  const level=precipBandLevel(precipitationRateMmh),width=precipBandWidth(precipitationRateMmh);
  if(level===null||width<=0)return null;
  const intervalMinutes=Math.round(intervalSeconds/60);
  const parts=precipitationParts(hour);
  const rawSunshine=hour.sunshineDuration,sunshineShare=!!hour.isDay&&rawSunshine!==null&&rawSunshine!==undefined&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null,hasSunshineBase=!!hour.isDay&&sunVisualShare(sunshineShare,cloud)>.5;
  return {
    layer:'precip',
    color:precipitationPhaseColor(parts.type),
    strokeWidth:width,
    thicknessLevel:skybarThicknessLevel(level),
    opacity:1,
    title:`${parts.label||'Niederschlag'} · ${precipitationPhaseColorLabel(parts.type)} · ${precipitationRateMmh.toFixed(precipitationRateMmh>=10?0:1)} mm/h${intervalMinutes<60?` · ${amount.toFixed(amount>=10?0:1)} mm/${intervalMinutes} min`:''}${hasSunshineBase?' · auf sonnigem Grundband':''}`,
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
