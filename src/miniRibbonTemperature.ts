/** Keep missing forecast temperatures as disjoint SVG path segments; never join across gaps. */
export type MiniRibbonTemperaturePoint={x:number;y:number|null};
export function miniRibbonTemperaturePath(points:readonly MiniRibbonTemperaturePoint[]):string{
 let path='',connected=false;
 for(const point of points){
  if(!Number.isFinite(point.x)||typeof point.y!=='number'||!Number.isFinite(point.y)){connected=false;continue}
  path+=`${connected?' L':'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  connected=true;
 }
 return path;
}
export function miniRibbonTemperatureLabel(value:number):string{
 return Number.isFinite(value)?`${Math.round(value)} °C`:'Temperatur nicht verfügbar';
}
