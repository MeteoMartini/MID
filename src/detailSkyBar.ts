import {precipitationParts,type PrecipSample} from './precipitation';

export type SkyBarSegment={
  key:string;
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

const sunVisualShare=(sunshineShare:number,cloudCover:number)=>clamp01(sunshineShare*0.82+(1-clamp(Number.isFinite(cloudCover)?cloudCover:100,0,100)/100)*0.18);

const precipBaseColor=(kind:'rain'|'snow'|'mixed'|'storm')=>({
  rain:'var(--param-precipitation)',
  snow:'#66bce8',
  mixed:'#a769d8',
  storm:'#7869e8',
}[kind]);

const SKYBAR_THICKNESS_STEPS=[2.1,2.9,3.7,4.5] as const;
const skybarThickness=(level:number)=>SKYBAR_THICKNESS_STEPS[Math.max(0,Math.min(SKYBAR_THICKNESS_STEPS.length-1,Math.round(level)))]!;

const cloudBandWidth=(cloud:number,daylight:boolean)=>{
  if(!daylight&&cloud<20)return 0;
  if(cloud<25)return daylight?skybarThickness(0):0;
  if(cloud<50)return skybarThickness(1);
  if(cloud<75)return skybarThickness(2);
  return skybarThickness(3);
};

const sunBandWidth=(sunshineShare:number,cloud:number)=>{
  const share=sunVisualShare(sunshineShare,cloud);
  if(share>=0.78)return skybarThickness(3);
  if(share>=0.54)return skybarThickness(2);
  if(share>=0.3)return skybarThickness(1);
  return skybarThickness(0);
};

const precipBandWidth=(amount:number)=>{
  if(amount<0.05)return 0;
  if(amount<0.5)return skybarThickness(0);
  if(amount<2.5)return skybarThickness(1);
  if(amount<10)return skybarThickness(2);
  return skybarThickness(3);
};

const precipitationKind=(hour:PrecipSample):'rain'|'snow'|'mixed'|'storm'=>{
  const parts=precipitationParts(hour);
  if(parts.type==='thunderstorm'||parts.type==='thunderstormHail')return 'storm';
  if(parts.type==='sleet'||parts.type==='sleetShowers'||parts.type==='freezingDrizzle'||parts.type==='freezingRain')return 'mixed';
  if(parts.type==='snow'||parts.type==='snowGrains'||parts.type==='snowShowers')return 'snow';
  return 'rain';
};

const precipitationLabel=(hour:PrecipSample)=>precipitationParts(hour).label||'Niederschlag';

const sampleIntervalSeconds=(hours:PrecipSample[],index:number)=>{
  const current=Number(hours[index]?.epoch),next=Number(hours[index+1]?.epoch),previous=Number(hours[index-1]?.epoch);
  const forward=Number.isFinite(current)&&Number.isFinite(next)?(next-current)/1000:NaN;
  const backward=Number.isFinite(current)&&Number.isFinite(previous)?(current-previous)/1000:NaN;
  const interval=Number.isFinite(forward)&&forward>0?forward:Number.isFinite(backward)&&backward>0?backward:3600;
  return clamp(interval,60,3600);
};

const baseSkyVisual=(cloud:number,daylight:boolean,sunshineShare:number):WeatherStripVisual|null=>{
  if(daylight){
    const visualSunshine=sunVisualShare(sunshineShare,cloud);
    const favorSun=visualSunshine>=0.26&&(visualSunshine>=0.58||cloud<58||(visualSunshine>=0.18&&cloud<72));
    if(favorSun){
      const width=sunBandWidth(sunshineShare,cloud);
      return {
        layer:'base',
        color:'#ffc229',
        strokeWidth:width,
        opacity:0.97,
        title:`Sonne/Bewölkung · ${(visualSunshine*100).toFixed(0)} % Sonne · ${cloud.toFixed(0)} % Wolken`,
      };
    }
    const width=cloudBandWidth(cloud,true);
    if(width<=0)return null;
    return {
      layer:'base',
      color:cloud>=82?'#b0b5bb':'#c0c5cb',
      strokeWidth:width,
      opacity:0.94,
      title:`Bewölkung · ${cloud.toFixed(0)} % Wolken${visualSunshine>0.12?` · ${(visualSunshine*100).toFixed(0)} % Sonne`:''}`,
    };
  }

  const width=cloudBandWidth(cloud,false);
  if(width<=0)return null;
  return {
    layer:'base',
    color:'#aeb3b9',
    strokeWidth:width,
    opacity:0.88,
    title:`Bewölkung Nacht · ${cloud.toFixed(0)} %`,
  };
};

const precipitationOverlayVisual=(hour:PrecipSample,intervalSeconds:number,cloud:number,sunshineShare:number):WeatherStripVisual|null=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds));
  const width=precipBandWidth(precipitationRateMmh);
  if(width<=0)return null;
  const intervalMinutes=Math.round(intervalSeconds/60);
  const kind=precipitationKind(hour);
  const hasSunshineBase=!!hour.isDay&&sunVisualShare(sunshineShare,cloud)>=0.18;
  return {
    layer:'precip',
    color:precipBaseColor(kind),
    strokeWidth:width,
    opacity:0.99,
    title:`${precipitationLabel(hour)} · ${precipitationRateMmh.toFixed(precipitationRateMmh>=10?0:1)} mm/h${intervalMinutes<60?` · ${amount.toFixed(amount>=10?0:1)} mm/${intervalMinutes} min`:''}${hasSunshineBase?' · auf sonnigem Grundband':''}`,
  };
};

const weatherStripVisuals=(hour:PrecipSample,intervalSeconds:number)=>{
  const cloud=clamp(Number(hour.cloud??0),0,100);
  const daylight=!!hour.isDay;
  const sunshineShare=daylight?clamp01(Number(hour.sunshineDuration??0)/Math.max(60,intervalSeconds)):0;
  const visuals:WeatherStripVisual[]=[];
  const base=baseSkyVisual(cloud,daylight,sunshineShare);
  if(base)visuals.push(base);
  const precipitation=precipitationOverlayVisual(hour,intervalSeconds,cloud,sunshineShare);
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
