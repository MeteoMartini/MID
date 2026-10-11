import {GeoJsonLayers} from './MapLibreCore';
import type {ModelPressureCenter} from './modelPressureCenterData';
export function ModelPressureCenters({centers=[],opacity=1,id='model-pressure-centers'}:{centers?:ModelPressureCenter[];opacity?:number;id?:string}){
 const data={type:'FeatureCollection' as const,features:centers.map(c=>({type:'Feature' as const,properties:{label:`${c.type}\n${Math.round(c.value)}`,detail:`${c.type==='H'?'Hoch':'Tief'} · ${c.value.toFixed(1)} hPa · MID-Modellzentrum`},geometry:{type:'Point' as const,coordinates:[c.lon,c.lat]}}))};
 return <GeoJsonLayers id={id} data={data} hoverProperty="detail" zIndex={700} layers={[{id:'labels',type:'symbol',layout:{'text-field':['get','label'],'text-size':19,'text-font':['Noto Sans Regular'],'text-allow-overlap':false,'text-line-height':1.05},paint:{'text-color':'#182d43','text-halo-color':'#ffffff','text-halo-width':2,'text-opacity':opacity}}]}/>;
}
