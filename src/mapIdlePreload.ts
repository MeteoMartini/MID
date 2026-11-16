/** Browser-idle module warmup only. Never fetch weather data or touch user preferences. */
export type MapIdlePreloadContext={
 weatherReady:boolean;
 mapAvailable:boolean;
 /** Only speculative warmup after a recorded user visit to the map area. */
 priorMapIntent:boolean;
 mapActive:boolean;
 searchOpen:boolean;
 drawerOpen:boolean;
 documentVisible:boolean;
 online:boolean;
 saveData:boolean;
 effectiveType?:string|null;
};
export function mayWarmMapDuringIdle(value:MapIdlePreloadContext):boolean{
 const network=String(value.effectiveType??'').trim().toLowerCase();
 return Boolean(value.weatherReady&&value.mapAvailable&&value.priorMapIntent&&!value.mapActive&&!value.searchOpen&&!value.drawerOpen&&value.documentVisible&&value.online&&!value.saveData&&network!=='slow-2g'&&network!=='2g');
}
