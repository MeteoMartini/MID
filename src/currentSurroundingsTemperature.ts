// #795: Temperature is a separately time- and run-qualified model field.
// Precipitation-phase provenance must never admit or suppress a temperature.
export type SurroundingsTemperaturePlace={id:string;lat:number;lon:number};
export type SurroundingsTemperatureSnapshot={
 modelId:string;modelLabel:string;validTime:number;runTime:number;values:Record<string,number>;
};
type TemperatureGrid={
 error?:string;stale?:boolean;modelAgeHours?:number|null;
 modelId?:string;modelLabel?:string;referenceTime?:string;
 lats?:number[];lons?:number[];
 frame?:{time?:string;temperature2m?:Array<number|null|undefined>};
};
const minute=60000;

function axisValid(axis:readonly number[]|undefined):axis is number[]{
 if(!Array.isArray(axis)||axis.length<2||axis.length>10000||axis.some(value=>!Number.isFinite(value)))return false;
 const sign=Math.sign(axis[1]-axis[0]);
 if(!sign)return false;
 for(let index=2;index<axis.length;index++)if(Math.sign(axis[index]-axis[index-1])!==sign)return false;
 return true;
}

function nearestCell(axis:readonly number[],coordinate:number):number{
 if(!Number.isFinite(coordinate))return -1;
 let best=-1,distance=Infinity;
 for(let index=0;index<axis.length;index++){
  const delta=Math.abs(axis[index]-coordinate);
  if(delta<distance){distance=delta;best=index;}
 }
 if(best<0)return -1;
 const before=best>0?Math.abs(axis[best]-axis[best-1]):0;
 const after=best+1<axis.length?Math.abs(axis[best+1]-axis[best]):0;
 const halfCell=Math.max(before,after)/2;
 return distance<=halfCell+1e-9?best:-1;
}

export function extractSurroundingsTemperatures(
 grid:TemperatureGrid|null|undefined,places:readonly SurroundingsTemperaturePlace[],targetTime:number
):SurroundingsTemperatureSnapshot|undefined{
 if(!grid||grid.error||grid.stale||!Number.isFinite(targetTime))return;
 if(!grid.modelId?.trim()||!grid.modelLabel?.trim()||!grid.referenceTime)return;
 const validTime=Date.parse(grid.frame?.time??'');
 const runTime=Date.parse(grid.referenceTime);
 // The grid's own valid time and run time apply to temperature, never phaseValidTimeByCell.
 if(!Number.isFinite(validTime)||!Number.isFinite(runTime)||runTime>validTime)return;
 if(Math.abs(validTime-targetTime)>20*minute||runTime>targetTime||targetTime-runTime>16*60*minute)return;
 if(grid.modelAgeHours!=null&&(!Number.isFinite(grid.modelAgeHours)||grid.modelAgeHours<0||grid.modelAgeHours>16))return;
 if(!axisValid(grid.lats)||!axisValid(grid.lons))return;
 const cells=grid.frame?.temperature2m;
 if(!Array.isArray(cells)||cells.length!==grid.lats.length*grid.lons.length)return;
 const values:Record<string,number>=Object.create(null);
 for(const place of places){
  if(!place.id||!Number.isFinite(place.lat)||!Number.isFinite(place.lon))continue;
  const row=nearestCell(grid.lats,place.lat),col=nearestCell(grid.lons,place.lon);
  if(row<0||col<0)continue; // Out of original grid coverage, not 0 C.
  const value=cells[row*grid.lons.length+col];
  if(typeof value==='number'&&Number.isFinite(value))values[place.id]=value;
 }
 if(!Object.keys(values).length)return;
 return{modelId:grid.modelId,modelLabel:grid.modelLabel,validTime,runTime,values};
}
