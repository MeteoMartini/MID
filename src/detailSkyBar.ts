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
  underlayColor?:string;
  underlayStrokeWidth?:number;
  underlayOpacity?:number;
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

const skyColor=(cloudCover:number,daylight:boolean,sunshineShare:number)=>{
  if(!daylight)return '#aeb3b9';
  const cloud=clamp(cloudCover,0,100);
  if(cloud>=88)return '#b4b8bd';
  if(cloud>=68)return blendHex('#c7b24a','#aeb3b9',0.58);
  if(cloud>=42)return blendHex('#ffc229','#aeb3b9',0.32);
  if(sunshineShare>=0.66)return '#ffc229';
  if(sunshineShare>=0.34)return blendHex('#ffd869','#ffc229',0.44);
  return blendHex('#ffd869','#aeb3b9',0.22);
};

const precipBaseColor=(kind:'rain'|'snow'|'mixed'|'storm')=>({
  rain:'var(--param-precipitation)',
  snow:'#66bce8',
  mixed:'#a769d8',
  storm:'#7869e8',
}[kind]);

const precipSunOverlay=(daylight:boolean,sunshineShare:number,cloud:number)=>{
  if(!daylight||sunshineShare<=0.18)return null;
  return skyColor(Math.max(0,Math.min(60,cloud)),true,Math.max(sunshineShare,0.28));
};

const SKYBAR_THICKNESS_STEPS=[2.7,3.8,4.9,6.1] as const;
const skybarThickness=(level:number)=>SKYBAR_THICKNESS_STEPS[Math.max(0,Math.min(SKYBAR_THICKNESS_STEPS.length-1,Math.round(level)))]!;

const cloudBandWidth=(cloud:number,daylight:boolean)=>{
  if(!daylight&&cloud<20)return 0;
  if(cloud<25)return daylight?skybarThickness(0):0;
  if(cloud<50)return skybarThickness(1);
  if(cloud<75)return skybarThickness(2);
  return skybarThickness(3);
};

const sunBandWidth=(sunshineShare:number,cloud:number)=>{
  if(sunshineShare>=0.78||cloud<18)return skybarThickness(3);
  if(sunshineShare>=0.52||cloud<35)return skybarThickness(2);
  if(sunshineShare>=0.24||cloud<55)return skybarThickness(1);
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

const weatherStripVisual=(hour:PrecipSample)=>{
  const amount=Math.max(0,Number(hour.precipitation??0));
  const cloud=clamp(Number(hour.cloud??0),0,100);
  const daylight=!!hour.isDay;
  const sunshineShare=daylight?clamp01(Number(hour.sunshineDuration ?? 0)/60):0;
  const precipWidth=precipBandWidth(amount);

  if(precipWidth>0){
    const kind=precipitationKind(hour);
    const highlight=daylight&&sunshineShare>0.18?' · mit Sonnenanteilen':'';
    const underlayColor=precipSunOverlay(daylight,sunshineShare,cloud);
    return {
      color:precipBaseColor(kind),
      strokeWidth:underlayColor?Math.max(3.2,precipWidth-2.2):precipWidth,
      opacity:0.98,
      title:`${precipitationLabel(hour)} · ${amount.toFixed(amount>=10?0:1)} mm/h${highlight}`,
      underlayColor:underlayColor??undefined,
      underlayStrokeWidth:underlayColor?Math.min(7.4,precipWidth+1.25):undefined,
      underlayOpacity:underlayColor?0.92:undefined,
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
      const visual=weatherStripVisual(hour);
      if(!visual)return;
      const x=positions[index]??leftEdge;
      const prev=index>0?(positions[index-1]??leftEdge):leftEdge;
      const next=index<positions.length-1?(positions[index+1]??rightEdge):rightEdge;
      const rawX0=index===0?leftEdge:(prev+x)*0.5;
      const rawX1=index===positions.length-1?rightEdge:(x+next)*0.5;
      const gap=Math.min(Math.max((rawX1-rawX0)*0.1,0.35),3.5);
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
        underlayColor:visual.underlayColor,
        underlayStrokeWidth:visual.underlayStrokeWidth,
        underlayOpacity:visual.underlayOpacity,
      });
    });
    return segments;
  }

  const p=hours.slice(left,right+1);
  if(!p.length)return [];
  const segmentWidth=chartW/p.length;
  const gap=Math.min(Math.max(segmentWidth*0.08,0.4),4);
  const segments:SkyBarSegment[]=[];

  p.forEach((hour,index)=>{
    const visual=weatherStripVisual(hour);
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
      underlayColor:visual.underlayColor,
      underlayStrokeWidth:visual.underlayStrokeWidth,
      underlayOpacity:visual.underlayOpacity,
    });
  });

  return segments;
}
