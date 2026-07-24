import type {PrecipitationParts,PrecipType} from './precipitation';
export type DetailPictogramHour={code:number;probability:number;isDay?:boolean};

export type DetailPictogramPoint={
 index:number;
 sourceIndex:number;
 displayCode:number;
};

const PRECIP_PRIORITY:Record<PrecipType,number>={
 none:0,
 drizzle:20,
 freezingDrizzle:35,
 rain:30,
 freezingRain:45,
 showers:40,
 snow:50,
 snowGrains:42,
 snowShowers:55,
 sleet:48,
 sleetShowers:58,
 thunderstorm:70,
 thunderstormHail:80
};

function rawWeatherPriority(code:number){
 if([95,96,97,99].includes(code))return 700;
 if([68,69,71,73,75,77,83,84,85,86].includes(code))return 500;
 if([51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code))return 400;
 if([45,48].includes(code))return 250;
 if(code===3)return 180;
 if(code===2)return 140;
 if(code===1)return 100;
 return 80;
}

function pictogramScore(hour:DetailPictogramHour,parts:PrecipitationParts){
 if(parts.type!=='none'){
  const amountBonus=Math.min(99,Math.max(0,parts.total)*6);
  const probabilityBonus=Math.min(20,Math.max(0,Number(hour.probability)||0)/5);
  return 1000+PRECIP_PRIORITY[parts.type]*10+amountBonus+probabilityBonus;
 }
 return rawWeatherPriority(Math.round(Number(hour.code)||0));
}

export function detailPictogramDisplayCode(hour:DetailPictogramHour,parts:PrecipitationParts){
 return parts.type==='none'?hour.code:parts.displayCode;
}

/**
 * Reduces hourly weather to the number of pictograms that physically fit.
 * Every displayed slot represents the interval around its original position.
 * A measurable precipitation hour inside that interval outranks a dry instant,
 * so short rain/snow events cannot disappear between sparse chart icons.
 */
export function representativeDetailPictograms(
 baseIndices:number[],
 hours:DetailPictogramHour[],
 precipitation:PrecipitationParts[]
):DetailPictogramPoint[]{
 if(!hours.length||!baseIndices.length)return[];
 const last=hours.length-1;
 const normalized=[...new Set(baseIndices.map(index=>Math.max(0,Math.min(last,Math.round(index)))))]
  .sort((a,b)=>a-b);

 const points=normalized.map((base,slot)=>{
  const previous=slot>0?normalized[slot-1]:0;
  const next=slot<normalized.length-1?normalized[slot+1]:last;
  const left=slot===0?0:Math.floor((previous+base)/2)+1;
  const right=slot===normalized.length-1?last:Math.floor((base+next)/2);
  let best=base;
  let bestScore=Number.NEGATIVE_INFINITY;
  let bestDistance=Number.POSITIVE_INFINITY;
  for(let index=left;index<=right;index++){
   const hour=hours[index];
   const parts=precipitation[index];
   if(!hour||!parts)continue;
   const score=pictogramScore(hour,parts);
   const distance=Math.abs(index-base);
   if(score>bestScore||(score===bestScore&&distance<bestDistance)){
    best=index;
    bestScore=score;
    bestDistance=distance;
   }
  }
  const hour=hours[best]??hours[base];
  const parts=precipitation[best]??precipitation[base];
  return{index:base,sourceIndex:best,displayCode:detailPictogramDisplayCode(hour,parts)};
 });

 return points;
}
