/** Read-only user-intent policy for optional, heavy visual module warmup.
 * No changes to forecast/ensemble data requests, source identity or user state.
 */
export type EnsembleVisualPreloadIntent={
 presentationMode?:unknown;
 activeHorizon?:unknown;
 ensembleModuleOpen?:unknown;
};
export function shouldPreloadEnsembleVisual(value:EnsembleVisualPreloadIntent):boolean{
 return value.presentationMode==='cockpit-tabs'||value.presentationMode==='cockpit-ribbons'||
  value.activeHorizon==='fourteen-day'||value.ensembleModuleOpen==='1';
}
export function isMapRevisitIntent(section:unknown):boolean{
 return section==='composite'||section==='weather-maps';
}
