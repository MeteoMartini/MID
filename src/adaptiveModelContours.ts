import type {MidGeoLayer} from './MapLibreCore';

// Display thinning only: keep the published 4 hPa / 4 dam contours unchanged.
export function contourInterval(zoom:number){return zoom<5?16:zoom<7?8:4}
export function contourVisible(level:number,zoom:number){return Number.isFinite(level)&&level%contourInterval(zoom)===0}
export function adaptiveContourLayers(kind:'pressure'|'height',color:string,opacity:number,{width=1.3,halo,labels=true,haloColor='#e4e8e3'}:{width?:number;halo?:string;labels?:boolean;haloColor?:string}={}):MidGeoLayer[]{
 const layers:MidGeoLayer[]=[];
 const variants=kind==='pressure'?[{id:'',filter:['>=',['get','level'],1013],dash:false},{id:'-dashed',filter:['<',['get','level'],1013],dash:true}]:[{id:'',filter:undefined,dash:false}];
 // Separate zoom bands also remove hidden labels from collision/hit testing.
 for(const band of [{suffix:'-coarse',interval:16,maxzoom:5,minzoom:0},{suffix:'-medium',interval:8,minzoom:5,maxzoom:7},{suffix:'',interval:4,minzoom:7,maxzoom:24}]){
  const density=['==',['%',['get','level'],band.interval],0],range={minzoom:band.minzoom,maxzoom:band.maxzoom};
  const filter=(threshold:unknown)=>threshold?['all',density,threshold]:density;
  if(halo)for(const v of variants)layers.push({id:`casing${v.id}${band.suffix}`,type:'line',...range,filter:filter(v.filter),paint:{'line-color':halo,'line-width':width+1.7,'line-opacity':opacity,...(v.dash?{'line-dasharray':[3,2]}:{})}});
  for(const v of variants)layers.push({id:`line${v.id}${band.suffix}`,type:'line',...range,filter:filter(v.filter),paint:{'line-color':color,'line-width':width,'line-opacity':opacity,...(v.dash?{'line-dasharray':[3,2]}:{})}});
  if(labels)layers.push({id:`label${band.suffix}`,type:'symbol',...range,filter:density,layout:{'symbol-placement':'line','symbol-spacing':180,'text-field':['get','label'],'text-size':10,'text-font':['Noto Sans Regular']},paint:{'text-color':color,'text-halo-color':haloColor,'text-halo-width':1,'text-opacity':opacity}});
 }
 return layers;
}
