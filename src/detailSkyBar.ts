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
  opacity:number;
  title:string;
};

type WeatherStripLayer='base'|'precip';

type WeatherStripVisual={
  layer:WeatherStripLayer;
  color:string;
  strokeWidth:number;
  opacity:number;
  title:string;
};

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const clamp01=(value:number)=>clamp(value,0,1);

const sunVisualShare=(sunshineShare:number|null,cloudCover:number)=>{
  if(sunshineShare!==null&&Number.isFinite(sunshineShare))return clamp01(sunshineShare);
  const cloud=clamp(Number.isFinite(cloudCover)?cloudCover:100,0,100);
  return clamp01(1-cloud/100);
};

const SKYBAR_THICKNESS_STEPS=[2.4,3.3,4.2,5.1] as const;
const skybarThickness=(level:number)=>SKYBAR_THICKNESS_STEPS[Math.max(0,Math.min(SKYBAR_THICKNESS_STEPS.length-1,Math.round(level)))]!;
const skybarFourStepLevel=(share:number)=>Math.min(3,Math.floor(clamp01(share)*4));
const skybarAboveHalfLevel=(share:number)=>skybarFourStepLevel((clamp01(share)-.5)/.5);

const cloudBandWidth=(cloud:number)=>{
  if(cloud<50)return 0;
  return skybarThickness(skybarAboveHalfLevel(cloud/100));
};

const sunBandWidth=(sunshineShare:number)=>{
  if(sunshineShare<=.5)return 0;
  return skybarThickness(skybarAboveHalfLevel(sunshineShare));
};

const precipBandWidth=(amount:number)=>{
  if(amount<0.05)return 0;
  if(amount<0.5)return skybarThickness(0);
  if(amount<2.5)return skybarThickness(1);
  if(amount<10)return skybarThickness(2);
  return skybarThickness(3);
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
  if(daylight){
    const visualSunshine=sunVisualShare(sunshineShare,cloud),sunshineDirect=sunshineShare!==null;
    if(visualSunshine>.5){
      const width=sunBandWidth(visualSunshine);
      if(width>0)return {
        layer:'base',
        color:'#ffc229',
        strokeWidth:width,
        opacity:0.98,
        title:`Sonnenschein · ${(visualSunshine*100).toFixed(0)} % der betrachteten Zeit${sunshineDirect?'':' · aus Bewölkungsgrad abgeleitet'} · ${cloud.toFixed(0)} % Wolken`,
      };
    }
  }

  const width=cloudBandWidth(cloud);
  if(width<=0)return null;
  return {
    layer:'base',
    color:'#aeb3b9',
    strokeWidth:width,
    opacity:0.96,
    title:`Bewölkung${daylight?'':' Nacht'} · ${cloud.toFixed(0)} %`,
  };
};

const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number,cloud:number):WeatherStripVisual|null=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds));
  const width=precipBandWidth(precipitationRateMmh);
  if(width<=0)return null;
  const intervalMinutes=Math.round(intervalSeconds/60);
  const parts=precipitationParts(hour);
  const rawSunshine=hour.sunshineDuration,sunshineShare=!!hour.isDay&&rawSunshine!==null&&rawSunshine!==undefined&&Number.isFinite(Number(rawSunshine))?clamp01(Number(rawSunshine)/Math.max(60,intervalSeconds)):null,hasSunshineBase=!!hour.isDay&&sunVisualShare(sunshineShare,cloud)>.5;
  return {
    layer:'precip',
    color:precipitationPhaseColor(parts.type),
    strokeWidth:width,
    opacity:1,
    title:`${parts.label||'Niederschlag'} · ${precipitationPhaseColorLabel(parts.type)} · ${precipitationRateMmh.toFixed(precipitationRateMmh>=10?0:1)} mm/h${intervalMinutes<60?` · ${amount.toFixed(amount>=10?0:1)} mm/${intervalMinutes} min`:''}${hasSunshineBase?' · auf sonnigem Grundband':''}`,
  };
};

const weatherStripVisuals=(hour:PrecipSample,intervalSeconds:number)=>{
  const cloud=clamp(Number(hour.cloud??0),0,100);
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
  if(previous&&Math.abs(previous.x2-x0)<=0.65&&previous.y===centerY&&previous.color===visual.color&&previous.strokeWidth===visual.strokeWidth&&previous.opacity===visual.opacity){
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
      const x=positions[index]??leftEdge;
      const prev=index>0?(positions[index-1]??leftEdge):leftEdge;
      const next=index<positions.length-1?(positions[index+1]??rightEdge):rightEdge;
      const rawX0=index===0?leftEdge:(prev+x)*0.5;
      const rawX1=index===positions.length-1?rightEdge:(x+next)*0.5;
      const x0=Math.max(leftEdge,rawX0);
      const x1=Math.min(rightEdge,rawX1);
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
