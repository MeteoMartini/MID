/** Same 60-min past / 15-min future contract as the PX metadata admission gate. */
export function px250FreshForLocation(available:boolean,observedMs:number,metadataLocation:string,currentLocation:string,referenceMs:number){
 return metadataLocation===currentLocation&&available&&Number.isFinite(observedMs)&&Number.isFinite(referenceMs)&&observedMs>=referenceMs-60*60000&&observedMs<=referenceMs+15*60000;
}
