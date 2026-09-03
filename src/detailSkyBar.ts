import {clamp} from './chartMath';
import {type ShortTermForecastPoint} from './ShortTermForecast';
import {precipitationParts} from './precipitation';

export type DetailSkyBarPoint=Pick<ShortTermForecastPoint,'cloud'|'lowCloud'|'midCloud'|'highCloud'|'isDay'|'precipitation'|'rain'|'showers'|'snowfall'|'probability'|'code'|'temperature'|'dewPoint'|'humidity'>;
export type DetailSkyBarSegment={key:string;x1:number;x2:number;y:number;color:string;strokeWidth:number;opacity:number;title:string};

type DetailSkyBarLayerSample={
 signature:string;
 color:string;
 y:number;
 strokeWidth:number;
 opacity:number;
 title:string;
};

const DETAIL_SKY_BAR_SUN='#ffc229';
const DETAIL_SKY_BAR_CLOUD='#aeb3b9';
const DETAIL_SKY_BAR_LEVEL_WIDTH=[0,2.1,3.4,4.9,6.5];
const DETAIL_SKY_BAR_LAYER_OFFSETS={sun:-3.6,cloud:0,precip:4.2} as const;
const DETAIL_SKY_BAR_PRECIP_COLORS={
 rain:'var(--param-precipitation)',
 snow:'#66bce8',
 mixed:'#a769d8',
 freezing:'#a769d8',
 storm:'#7869e8',
} as const;

function detailSkyBarLevel(value:number,start:number,end:number){
 const ratio=clamp((value-start)/Math.max(1,end-start),0,1);
 return Math.min(4,Math.max(1,Math.ceil(ratio*4)));
}

function resolvedCloudCover(point:DetailSkyBarPoint){
 const total=Number(point.cloud);
 if(Number.isFinite(total))return clamp(total,0,100);
 const layers=[Number(point.lowCloud),Number(point.midCloud),Number(point.highCloud)].filter(Number.isFinite);
 return clamp(layers.length?Math.max(...layers):0,0,100);
}

function sunSample(point:DetailSkyBarPoint,centerY:number):DetailSkyBarLayerSample|null{
 const cloud=resolvedCloudCover(point),daylight=point.isDay!==false;
 if(!daylight||cloud>=50)return null;
 const level=detailSkyBarLevel(50-cloud,0,50);
 return{
  signature:`sun-${level}`,
  color:DETAIL_SKY_BAR_SUN,
  y:centerY+DETAIL_SKY_BAR_LAYER_OFFSETS.sun,
  strokeWidth:DETAIL_SKY_BAR_LEVEL_WIDTH[level],
  opacity:.98,
  title:`Sonnenschein/Klarheit · Stufe ${level} von 4`,
 };
}

function cloudSample(point:DetailSkyBarPoint,centerY:number):DetailSkyBarLayerSample|null{
 const cloud=resolvedCloudCover(point),daylight=point.isDay!==false;
 if(daylight&&cloud<50)return null;
 if(!daylight&&cloud<20)return null;
 const level=detailSkyBarLevel(cloud,daylight?50:20,100);
 return{
  signature:`cloud-${level}`,
  color:DETAIL_SKY_BAR_CLOUD,
  y:centerY+DETAIL_SKY_BAR_LAYER_OFFSETS.cloud,
  strokeWidth:DETAIL_SKY_BAR_LEVEL_WIDTH[level],
  opacity:.92,
  title:`Gesamtbewölkung · Stufe ${level} von 4`,
 };
}

function precipitationFamily(type:ReturnType<typeof precipitationParts>['type']){
 if(type==='drizzle'||type==='rain'||type==='showers')return{key:'rain',color:DETAIL_SKY_BAR_PRECIP_COLORS.rain};
 if(type==='snow'||type==='snowShowers'||type==='snowGrains')return{key:'snow',color:DETAIL_SKY_BAR_PRECIP_COLORS.snow};
 if(type==='sleet'||type==='sleetShowers')return{key:'mixed',color:DETAIL_SKY_BAR_PRECIP_COLORS.mixed};
 if(type==='freezingDrizzle'||type==='freezingRain')return{key:'freezing',color:DETAIL_SKY_BAR_PRECIP_COLORS.freezing};
 if(type==='thunderstorm'||type==='thunderstormHail')return{key:'storm',color:DETAIL_SKY_BAR_PRECIP_COLORS.storm};
 return null;
}

function precipitationLevel(amount:number){
 if(!(amount>=.05))return 0;
 if(amount<2.5)return 1;
 if(amount<10)return 2;
 if(amount<50)return 3;
 return 4;
}

function precipitationSample(point:DetailSkyBarPoint,centerY:number):DetailSkyBarLayerSample|null{
 const parts=precipitationParts(point),amount=Math.max(0,Number(parts.total)||0),level=precipitationLevel(amount),family=precipitationFamily(parts.type);
 if(level<=0||!family)return null;
 return{
  signature:`precip-${family.key}-${level}`,
  color:family.color,
  y:centerY+DETAIL_SKY_BAR_LAYER_OFFSETS.precip,
  strokeWidth:DETAIL_SKY_BAR_LEVEL_WIDTH[level],
  opacity:.62+level*.08,
  title:`Niederschlag · ${parts.label} · Stufe ${level} von 4`,
 };
}

function xBounds(points:DetailSkyBarPoint[],left:number,right:number,width:number,xCenters?:number[]){
 const plotWidth=Math.max(1,width-left-right);
 const fallbackCenter=(index:number)=>points.length<=1?left+plotWidth/2:left+(index/Math.max(1,points.length-1))*plotWidth;
 const centerAt=(index:number)=>Number.isFinite(Number(xCenters?.[index]))?Number(xCenters?.[index]):fallbackCenter(index);
 return points.map((point,index)=>{
  const center=centerAt(index),previous=index>0?centerAt(index-1):left,next=index<points.length-1?centerAt(index+1):width-right;
  const start=index===0?left:(previous+center)/2,end=index===points.length-1?width-right:(center+next)/2;
  return{point,start,end};
 });
}

function segmentsForLayer(
 layerKey:string,
 bounds:ReturnType<typeof xBounds>,
 makeSample:(point:DetailSkyBarPoint)=>DetailSkyBarLayerSample|null,
){
 const segments:DetailSkyBarSegment[]=[];
 let activeSample:DetailSkyBarLayerSample|null=null;
 let activeStart=0;
 let activeEnd=0;
 let activeIndex=0;
 const pushActive=()=>{
  if(!activeSample)return;
  segments.push({
   key:`${layerKey}-${activeIndex}-${segments.length}`,
   x1:activeStart,
   x2:activeEnd,
   y:activeSample.y,
   color:activeSample.color,
   strokeWidth:activeSample.strokeWidth,
   opacity:activeSample.opacity,
   title:activeSample.title,
  });
  activeSample=null;
 };
 bounds.forEach(({point,start,end},index)=>{
  const sample=makeSample(point);
  if(!sample){
   pushActive();
   return;
  }
  if(activeSample&&activeSample.signature===sample.signature){
   activeEnd=end;
   return;
  }
  pushActive();
  activeSample=sample;
  activeStart=start;
  activeEnd=end;
  activeIndex=index;
 });
 pushActive();
 return segments;
}

export function detailSkyBarSegments(points:DetailSkyBarPoint[],left:number,right:number,width:number,centerY:number,xCenters?:number[]){
 if(!points.length)return[];
 const bounds=xBounds(points,left,right,width,xCenters);
 return[
  ...segmentsForLayer('sun',bounds,point=>sunSample(point,centerY)),
  ...segmentsForLayer('cloud',bounds,point=>cloudSample(point,centerY)),
  ...segmentsForLayer('precip',bounds,point=>precipitationSample(point,centerY)),
 ];
}
