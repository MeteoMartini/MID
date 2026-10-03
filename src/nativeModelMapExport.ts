import {loadModelMapGeography,type ModelMapGeography} from './modelMapGeography';
import {mercatorY} from './precipitationTotals';
import {nativeAt,nativeMapScale,type NativeField} from './nativeModelFields';
import {modelMapUnit,modelMapValue} from './modelMapUnits';
import {mapScaleSvg,type MapColorScale} from './modelMapColorScale';
import type {WindUnit} from './weather';
type Place={name:string;latitude:number;longitude:number};
const xml=(v:string)=>v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));
export function nativeFieldSvg(data:NativeField,label:string,raster:string,places:Place[],intervalHours:number,unit:WindUnit='kn',scale:MapColorScale=nativeMapScale(data,'absolute'),states:ModelMapGeography['states']=[]){
 const legendY=Math.max(960,250+places.length*30),height=legendY+170,west=data.lons[0],east=data.lons.at(-1)!,south=mercatorY(data.lats[0]),north=mercatorY(data.lats.at(-1)!),x=(lon:number)=>50+(lon-west)/(east-west)*630,y=(lat:number)=>170+(north-mercatorY(lat))/(north-south)*760,date=(v:string)=>v.slice(0,16).replace('T',' ')+' UTC';
 const displayUnit=modelMapUnit(data.kind,data.unit,unit),format=(v:number|null)=>modelMapValue(data.kind,v,data.unit,unit);
 const paths=states.flatMap(s=>s.rings.map(r=>`<path d="${r.map(([lon,lat],i)=>`${i?'L':'M'}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ')}Z"/>`)).join(''),contours=data.isobars.flatMap(c=>c.paths.map(p=>`<path d="${p.map(([lat,lon],i)=>`${i?'L':'M'}${x(lon).toFixed(1)},${y(lat).toFixed(1)}`).join(' ')}"/>`)).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="${height}" viewBox="0 0 1200 ${height}"><rect width="1200" height="${height}" fill="#08131f"/><g font-family="Arial,sans-serif" fill="#e5eff8"><text x="50" y="57" font-size="27" font-weight="bold">MID · ${xml(label)}</text><text x="50" y="90" font-size="18">ICON-D2 · Lauf ${date(data.run)} · gültig ${date(data.time)}</text><text x="50" y="120" font-size="15">${data.kind==='precipitation'?'Niederschlag in der letzten Stunde':data.kind==='gust'?`Maximalböe im ${intervalHours}-h-Modellintervall`:'Momentanwert'} · ${xml(displayUnit)}</text><rect x="50" y="170" width="630" height="760" fill="#112434"/><image href="${raster}" x="50" y="170" width="630" height="760" preserveAspectRatio="none"/><g fill="none" stroke="#192c3f" stroke-width="1">${contours}</g><g fill="none" stroke="#edf5fa" stroke-width="1">${paths}</g><text x="720" y="190" font-size="22">FAVORITEN</text>${places.map((p,i)=>{const v=nativeAt(data,p.latitude,p.longitude);return `<text x="720" y="${230+i*30}" font-size="15">${xml(p.name.slice(0,30))}</text><text x="1140" y="${230+i*30}" text-anchor="end" font-size="15">${xml(format(v))}${v===null?'':' '+xml(displayUnit)}</text>`}).join('')}${mapScaleSvg(scale,v=>format(v),displayUnit,50,legendY)}<text x="50" y="${height-55}" font-size="13">Modellprognose · keine Messwerte · Ortswerte: nächster dargestellter Rasterpunkt</text><text x="50" y="${height-30}" font-size="12">DWD Open Data · CC BY 4.0 · bearbeitet durch MID · Grenzen: Natural Earth (Public Domain)</text></g></svg>`;
}
export async function exportNativeField(data:NativeField,label:string,raster:string,places:Place[],kind:'svg'|'png',intervalHours:number,unit:WindUnit='kn',scale:MapColorScale=nativeMapScale(data,'absolute')){
 const geography=await loadModelMapGeography(),svg=nativeFieldSvg(data,label,raster,places,intervalHours,unit,scale,geography.states);
 let blob=new Blob([svg],{type:'image/svg+xml'});
 if(kind==='png'){
  const url=URL.createObjectURL(blob);
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const context=canvas.getContext('2d');if(!context)throw new Error('Bildexport nicht verfügbar.');context.drawImage(image,0,0);blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG nicht verfügbar.')),'image/png'))}finally{URL.revokeObjectURL(url)}
 }
 const filename=`MID-ICON-D2-${data.kind}-${data.time.slice(0,13).replace(/[^0-9]/g,'')}.${kind}`,file=new File([blob],filename,{type:blob.type}),share={title:'MID · '+label,files:[file]};
 if(typeof navigator.share==='function'&&navigator.canShare?.(share)){await navigator.share(share);return}
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
