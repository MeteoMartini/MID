const url=new URL('./modelMapGeography.json',import.meta.url).href;
import type shape from './modelMapGeography.json';
export type ModelMapGeography=typeof shape;
let data:ModelMapGeography|undefined,inflight:Promise<ModelMapGeography>|undefined;
export function getModelMapGeography(){return data}
export function loadModelMapGeography(){
 if(data)return Promise.resolve(data);
 return inflight??=fetch(url).then(response=>{if(!response.ok)throw new Error('Kartengrenzen nicht verfügbar');return response.json() as Promise<ModelMapGeography>}).then(value=>{data=value;return value}).finally(()=>{inflight=undefined});
}
