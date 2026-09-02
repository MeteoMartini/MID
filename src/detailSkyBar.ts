import {clamp} from './chartMath';

export type DetailSkyBarLevel=0|1|2|3|4;
export type DetailSkyBarSample={color:'sun'|'cloud'|'none';level:DetailSkyBarLevel;cloud:number;isDay:boolean};
export type DetailSkyBarSegment={key:string;x1:number;x2:number;y:number;color:string;strokeWidth:number;opacity:number;title:string};
export type DetailSkyBarPoint={cloud?:number|null;isDay?:boolean|null};

export function detailSkyBarLevel(value:number,min:number,max:number):1|2|3|4{
 const ratio=clamp((value-min)/Math.max(1,max-min),0,1);
 return Math.min(4,Math.max(1,Math.ceil(ratio*4))) as 1|2|3|4;
}

export function detailSkyBarSample(hour:DetailSkyBarPoint):DetailSkyBarSample{
 const cloud=clamp(Number.isFinite(Number(hour.cloud))?Number(hour.cloud):0,0,100),isDay=Boolean(hour.isDay);
 if(!isDay)return cloud<20?{cloud,isDay,color:'none',level:0}:{cloud,isDay,color:'cloud',level:detailSkyBarLevel(cloud,20,100)};
 return cloud<50?{cloud,isDay,color:'sun',level:detailSkyBarLevel(50-cloud,0,50)}:{cloud,isDay,color:'cloud',level:detailSkyBarLevel(cloud,50,100)};
}

/**
 * Kanonische Sonne-/Gesamtbewölkungsleiste der Tagesansicht.
 * Optional können bereits exakt auf eine gemeinsame Zeitachse projizierte
 * X-Positionen übergeben werden; die Farblogik und Stärken bleiben identisch.
 */
export function detailSkyBarSegments(hours:DetailSkyBarPoint[],left:number,right:number,width:number,centerY:number,xPositions?:number[]):DetailSkyBarSegment[]{
 if(hours.length<2)return[];
 const samples=hours.map(detailSkyBarSample),plotWidth=Math.max(1,width-left-right),fallbackX=(index:number)=>left+(index/Math.max(1,samples.length-1))*plotWidth,xAt=(index:number)=>Number.isFinite(Number(xPositions?.[index]))?Number(xPositions?.[index]):fallbackX(index),before=(index:number)=>index<=0?left:(xAt(index-1)+xAt(index))/2,after=(index:number)=>index>=samples.length-1?width-right:(xAt(index)+xAt(index+1))/2,strokeWidth=(level:DetailSkyBarLevel)=>[0,2.1,3.4,4.9,6.5][level],segments:DetailSkyBarSegment[]=[];
 let runStart=0;
 for(let index=1;index<=samples.length;index++){
  const previous=samples[index-1],current=samples[index];
  if(index<samples.length&&current.color===previous.color&&current.level===previous.level)continue;
  if(previous.color!=='none'){
   let x1=before(runStart),x2=after(index-1);const gap=Math.min(.72,Math.max(0,(x2-x1)*.12));x1+=gap;x2-=gap;
   if(x2<=x1){const middle=(x1+x2)/2;x1=middle-.18;x2=middle+.18}
   segments.push({key:`${runStart}-${index-1}-${previous.color}-${previous.level}`,x1,x2,y:centerY,color:previous.color==='sun'?'#ffc229':'#aeb3b9',strokeWidth:strokeWidth(previous.level),opacity:previous.color==='sun'?.98:.92,title:previous.color==='sun'?`Sonnenschein/Klarheit · Stufe ${previous.level} von 4`:`Gesamtbewölkung · Stufe ${previous.level} von 4`});
  }
  runStart=index;
 }
 return segments;
}
