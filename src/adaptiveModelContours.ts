import type {MidGeoLayer} from './MapLibreCore';

// Visibility adapts to zoom; 1-hPa geometry is generated from numerical pressure.
export function contourInterval(zoom:number,kind:'height'|'pressure'='height',_spacingKm=Infinity){
 if(kind==='height')return zoom<7?8:4;
 return zoom<5?5:zoom<7?2:1;
}
export function contourVisible(level:number,zoom:number,kind:'height'|'pressure'='height',spacingKm=Infinity){return Number.isFinite(level)&&level%contourInterval(zoom,kind,spacingKm)===0}
export function adaptiveContourLayers(kind:'pressure'|'height',color:string,opacity:number,{width=1.3,halo,labels=true,haloColor='#e4e8e3'}:{width?:number;halo?:string;labels?:boolean;haloColor?:string}={}):MidGeoLayer[]{
 const layers:MidGeoLayer[]=[];
 const variants=kind==='pressure'?[{id:'',filter:['>=',['get','level'],1013],dash:false},{id:'-dashed',filter:['<',['get','level'],1013],dash:true}]:[{id:'',filter:undefined,dash:false}];
 // Separate zoom bands also remove hidden labels from collision/hit testing.
 for(const band of [{suffix:'-coarse',interval:kind==='height'?8:5,maxzoom:5,minzoom:0},{suffix:'-medium',interval:kind==='height'?8:2,minzoom:5,maxzoom:7},{suffix:'',interval:kind==='height'?4:1,minzoom:7,maxzoom:24}]){
  const modulo=(n:number)=>['==',['%',['get','level'],n],0];
  // One arithmetic level sequence for every feature in this zoom band.
  const density=modulo(band.interval),range={minzoom:band.minzoom,maxzoom:band.maxzoom};
  const filter=(threshold:unknown)=>threshold?['all',density,threshold]:density;
  if(halo)for(const v of variants)layers.push({id:`casing${v.id}${band.suffix}`,type:'line',...range,filter:filter(v.filter),paint:{'line-color':halo,'line-width':width+1.7,'line-opacity':opacity,...(v.dash?{'line-dasharray':[3,2]}:{})}});
  for(const v of variants)layers.push({id:`line${v.id}${band.suffix}`,type:'line',...range,filter:filter(v.filter),paint:{'line-color':color,'line-width':width,'line-opacity':opacity,...(v.dash?{'line-dasharray':[3,2]}:{})}});
  if(labels)layers.push({id:`label${band.suffix}`,type:'symbol',...range,filter:density,layout:{'symbol-placement':'line','symbol-spacing':180,'text-field':['to-string',['get','level']],'text-size':10,'text-font':['Noto Sans Regular']},paint:{'text-color':color,'text-halo-color':haloColor,'text-halo-width':1,'text-opacity':opacity}});
 }
 return layers;
}
