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

const clamp=(value:number,min:number,max:number)=>Math.min(max,Math.max(min,value));
const clamp01=(value:number)=>clamp(value,0,1);

const toRgb=(value:string)=>{
  const hex=value.replace('#','').trim();
  if(hex.length!==6)return null;
  const numeric=Number.parseInt(hex,16);
  if(Number.isNaN(numeric))return null;
  return {
    r:(numeric>>16)&255,
    g:(numeric>>8)&255,
    b:numeric&255,
  };
};

const blendHex=(from:string,to:string,ratio:number)=>{
  const a=toRgb(from);
  const b=toRgb(to);
  const t=clamp01(ratio);
  if(!a||!b)return from;
  const mix=(x:number,y:number)=>Math.round(x+(y-x)*t).toString(16).padStart(2,'0');
  return `#${mix(a.r,b.r)}${mix(a.g,b.g)}${mix(a.b,b.b)}`;
};

const sunVisualShare=(sunshineShare:number,cloudCover:number)=>clamp01(sunshineShare*0.82+(1-clamp(Number.isFinite(cloudCover)?cloudCover:100,0,100)/100)*0.18);

const skyColor=(cloudCover:number,daylight:boolean,sunshineShare:number)=>{
  if(!daylight)return '#aeb3b9';
  const cloud=clamp(cloudCover,0,100);
  const sunshine=sunVisualShare(sunshineShare,cloud);
  if(cloud>=92&&sunshine<0.18)return '#b4b8bd';
  if(sunshine>=0.82)return '#ffc229';
  if(sunshine>=0.62)return blendHex('#ffe07d','#ffc229',0.56);
  if(sunshine>=0.4)return blendHex('#efe0a0','#ffc229',0.32);
  if(sunshine>=0.2)return blendHex('#dccca2','#aeb3b9',0.26);
  return blendHex('#d6d2c9','#aeb3b9',0.38);
};

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

const precipSunColor=(kind:'rain'|'snow'|'mixed'|'storm',sunshineShare:number)=>{
  const base=precipBaseColor(kind),share=clamp01((sunshineShare-.18)/.82);
  if(share<=0)return base;
  const basePercent=Math.round(92-share*38);
  return `color-mix(in srgb, ${base} ${basePercent}%, #ffc229)`;
};

const weatherStripVisual=(hour:PrecipSample,intervalSeconds:number)=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const cloud=clamp(Number(hour.cloud??0),0,100);
  const daylight=!!hour.isDay;
  const sunshineShare=daylight?clamp01(Number(hour.sunshineDuration ?? 0)/Math.max(60,intervalSeconds)):0;
  const precipitationRateMmh=amount*(3600/Math.max(60,intervalSeconds));
  const precipWidth=precipBandWidth(precipitationRateMmh);

  if(precipWidth>0){
    const kind=precipitationKind(hour);
    const highlight=daylight&&sunshineShare>0.18?' · mit Sonnenanteilen':'';
    const intervalMinutes=Math.round(intervalSeconds/60);
    return {
      color:precipSunColor(kind,daylight?sunVisualShare(sunshineShare,cloud):0),
      strokeWidth:precipWidth,
      opacity:0.98,
      title:`${precipitationLabel(hour)} · ${precipitationRateMmh.toFixed(precipitationRateMmh>=10?0:1)} mm/h${intervalMinutes<60?` · ${amount.toFixed(amount>=10?0:1)} mm/${intervalMinutes} min`:''}${highlight}`,
    };
  }

  if(daylight){
    const sunWidth=sunBandWidth(sunshineShare,cloud);
    return {
      color:skyColor(cloud,true,sunshineShare),
      strokeWidth:sunWidth,
      opacity:0.96,
      title:`Sonne/Bewölkung · ${(sunshineShare*100).toFixed(0)} % Sonne · ${cloud.toFixed(0)} % Wolken`,
    };
  }

  const width=cloudBandWidth(cloud,false);
  if(width<=0)return null;
  return {
    color:skyColor(cloud,false,0),
    strokeWidth:width,
    opacity:0.88,
    title:`Bewölkung Nacht · ${cloud.toFixed(0)} %`,
  };
};

export function detailSkyBarSegments(
  hours:PrecipSample[],
  left:number,
  right:number,
  chartW:number,
  centerY:number,
  xPositions?:number[],
):SkyBarSegment[]{
  if(!hours.length||chartW<=0)return [];

  if(Array.isArray(xPositions)&&xPositions.length){
    const leftEdge=left;
    const rightEdge=Math.max(leftEdge,chartW-right);
    const positions=xPositions.slice(0,hours.length);
    const segments:SkyBarSegment[]=[];
    hours.forEach((hour,index)=>{
      const visual=weatherStripVisual(hour,sampleIntervalSeconds(hours,index));
      if(!visual)return;
      const x=positions[index]??leftEdge;
      const prev=index>0?(positions[index-1]??leftEdge):leftEdge;
      const next=index<positions.length-1?(positions[index+1]??rightEdge):rightEdge;
      const rawX0=index===0?leftEdge:(prev+x)*0.5;
      const rawX1=index===positions.length-1?rightEdge:(x+next)*0.5;
      const gap=Math.min(Math.max((rawX1-rawX0)*0.14,0.7),4.4);
      const x0=Math.max(leftEdge,rawX0+gap*0.5);
      const x1=Math.min(rightEdge,rawX1-gap*0.5);
      if(x1<=x0)return;
      segments.push({
        key:`wx-${index}`,
        x1:x0,
        x2:x1,
        y:centerY,
        color:visual.color,
        strokeWidth:visual.strokeWidth,
        opacity:visual.opacity,
        title:visual.title,
      });
    });
    return segments;
  }

  const p=hours.slice(left,right+1);
  if(!p.length)return [];
  const segmentWidth=chartW/p.length;
  const gap=Math.min(Math.max(segmentWidth*0.12,0.6),4.6);
  const segments:SkyBarSegment[]=[];

  p.forEach((hour,index)=>{
    const visual=weatherStripVisual(hour,sampleIntervalSeconds(p,index));
    if(!visual)return;
    const segmentLeft=index*segmentWidth;
    const segmentRight=(index+1)*segmentWidth;
    const x0=Math.max(0,segmentLeft+gap*0.5);
    const x1=Math.min(chartW,segmentRight-gap*0.5);
    if(x1<=x0)return;
    segments.push({
      key:`wx-${index}`,
      x1:x0,
      x2:x1,
      y:centerY,
      color:visual.color,
      strokeWidth:visual.strokeWidth,
      opacity:visual.opacity,
      title:visual.title,
    });
  });

  return segments;
}
