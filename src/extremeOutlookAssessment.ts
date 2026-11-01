import {extremeSignalForCell,extremeSignalVisible,type ExtremeHazardId,type ExtremeHazardKind,type ExtremeWeatherOutlook} from './extremeWeatherOutlook';

/**
 * One grid traversal for the read-only extreme-outlook status. Coverage is
 * independent of the number of above-threshold signals: a real zero is
 * available evidence, while an absent probability field is not an all-clear.
 * This deliberately preserves the existing 65% extended-product admission
 * threshold and never changes the modeled hazard/contour calculation.
 */
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
  if(fields&&(hazard==='overall'?Object.keys(fields).length>0:Boolean(fields[hazard])))assessedCells++;
  if(extended&&fields){
   if(fields.rain)rainCells++;
   if(fields.wind)windCells++;
   if(fields.snow)snowCells++;
  }
  if(extremeSignalVisible(extremeSignalForCell(cell,periodId,hazard),hazard,data.thresholds))visibleCount++;
 }
 const minimum=data.grid.pointCount*.65;
 const unavailableKinds:ExtremeHazardKind[]=[];
 if(extended){
  if(rainCells<minimum)unavailableKinds.push('rain');
  if(windCells<minimum)unavailableKinds.push('wind');
  if(snowCells<minimum)unavailableKinds.push('snow');
 }
 return {
  visibleCount,
  assessedCells,
  assessmentAvailable:!extended||assessedCells>=minimum,
  unavailableKinds,
 };
}
