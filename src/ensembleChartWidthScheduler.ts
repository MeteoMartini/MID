/**
 * One outstanding RAF per chart instance; the most recent valid width wins.
 * No DOM reads or scheduling on missing/non-finite/zero measurements.
 * This is only a rendering scheduler, not a weather-data transformation.
 */
export function createEnsembleChartWidthScheduler(
 requestFrame:(callback:()=>void)=>number,
 cancelFrame:(id:number)=>void,
 publish:(width:number)=>void,
){
 let frame:number|null=null;
 let pending:number|null=null;
 let disposed=false;
 return {
  push(value:number){
   if(disposed||!Number.isFinite(value))return;
   const width=Math.max(0,Math.floor(value));
   if(!width)return;
   pending=width;
   if(frame!==null)return;
   frame=requestFrame(()=>{
    frame=null;
    if(disposed||pending===null)return;
    const next=pending;
    pending=null;
    publish(next);
   });
  },
  dispose(){
   if(disposed)return;
   disposed=true;
   pending=null;
   if(frame!==null){cancelFrame(frame);frame=null;}
  },
 };
}
