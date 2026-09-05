export type PressureAxisScale={minimum:number;maximum:number;ticks:number[];step:number};

const PRESSURE_AXIS_STEPS=[2,4,5,10,20,25,50] as const;

/**
 * Ruhige Luftdruckachse für MID-Diagramme.
 *
 * - ausschließlich ganzzahlige hPa-Ticks,
 * - identischer Abstand zwischen allen Ticks,
 * - bevorzugt meteorologisch gebräuchliche 2-/4-/5-hPa-Schritte,
 * - mindestens vier sichtbare Tickmarken bei kleinen Spannweiten,
 * - ausreichend Rand ober- und unterhalb der Datenkurve.
 */
export function nicePressureAxis(values:number[],maxIntervals=4):PressureAxisScale{
 const finite=values.map(Number).filter(value=>Number.isFinite(value)&&value>=850&&value<=1100);
 if(!finite.length)return{minimum:990,maximum:1030,ticks:[1030,1020,1010,1000,990],step:10};
 const low=Math.min(...finite),high=Math.max(...finite),rawSpan=Math.max(2,high-low),padding=Math.max(1,rawSpan*.18),paddedLow=low-padding,paddedHigh=high+padding,intervalLimit=Math.max(3,Math.round(maxIntervals));
 let step:number=PRESSURE_AXIS_STEPS[PRESSURE_AXIS_STEPS.length-1];
 for(const candidate of PRESSURE_AXIS_STEPS){
  const minimum=Math.floor(paddedLow/candidate)*candidate,maximum=Math.ceil(paddedHigh/candidate)*candidate,intervals=Math.round((maximum-minimum)/candidate);
  if(intervals<=intervalLimit){step=candidate;break}
 }
 let minimum=Math.floor(paddedLow/step)*step,maximum=Math.ceil(paddedHigh/step)*step,intervals=Math.round((maximum-minimum)/step);
 if(intervals<3){
  const center=(low+high)/2,totalSpan=3*step;
  minimum=Math.floor((center-totalSpan/2)/step)*step;
  maximum=minimum+totalSpan;
  while(low<minimum){minimum-=step;maximum-=step}
  while(high>maximum){minimum+=step;maximum+=step}
  intervals=3;
 }
 const ticks=Array.from({length:intervals+1},(_,index)=>maximum-index*step);
 return{minimum,maximum,ticks,step};
}
