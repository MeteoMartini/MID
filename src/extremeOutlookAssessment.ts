import {extremeSignalForCell,extremeSignalVisible,type ExtremeHazardId,type ExtremeHazardKind,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

/**
 * One grid traversal for the read-only extreme-outlook status. Coverage is
 * independent of the number of above-threshold signals: a real zero is
 * available evidence, while an absent probability field is not an all-clear.
 * This deliberately preserves the existing 65% extended-product admission
 * threshold and never changes the modeled hazard/contour calculation.
 */
/** A present but invalid 4-level field is missing evidence, never an all-clear. */
function completeProbabilityLevels(value:unknown):boolean{
 return Array.isArray(value)&&value.length===4&&value.every(level=>typeof level==='number'&&Number.isFinite(level)&&level>=0&&level<=100);
}

export function assessExtremeOutlookPeriod(
 data:ExtremeWeatherOutlook,
 periodId:string,
 hazard:ExtremeHazardId,
 range:'short'|'extended',
){
 let visibleCount=0,assessedCells=0,rainCells=0,windCells=0,snowCells=0;
 const extended=range==='extended';
 for(const cell of data.cells){
  const fields=cell.periods[periodId]?.probabilityFields;
  if(fields&&(hazard==='overall'?Object.values(fields).some(completeProbabilityLevels):completeProbabilityLevels(fields[hazard])))assessedCells++;
  if(extended&&fields){
   if(completeProbabilityLevels(fields.rain))rainCells++;
   if(completeProbabilityLevels(fields.wind))windCells++;
   if(completeProbabilityLevels(fields.snow))snowCells++;
  }
  if(extremeSignalVisible(extremeSignalForCell(cell,periodId,hazard),hazard,data.thresholds))visibleCount++;
 }
 const validGrid=Number.isInteger(data.grid.pointCount)&&data.grid.pointCount>0;
 const minimum=validGrid?data.grid.pointCount*.65:Number.POSITIVE_INFINITY;
 const unavailableKinds:ExtremeHazardKind[]=[];
 if(extended){
  if(rainCells<minimum)unavailableKinds.push('rain');
  if(windCells<minimum)unavailableKinds.push('wind');
  if(snowCells<minimum)unavailableKinds.push('snow');
 }
 return {
  visibleCount,
  assessedCells,
  assessmentAvailable:!extended||(validGrid&&assessedCells>=minimum),
  unavailableKinds,
 };
}
