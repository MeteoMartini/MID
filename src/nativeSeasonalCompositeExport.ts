/**
 * Lossless pairing of existing DWD ICON-D2 product fields for SVG/PNG export.
 * Weather field and companion isolines share the EXACT validated native grid,
 * model run, valid time and NoData intersection. Never export an unpaired field.
 */
import {nativeFieldSvg} from './nativeModelMapExport';
import {nativeAnnotationSvg} from './nativeScalarAnnotations';
import {nativeAt,nativeMapScale,type NativeField} from './nativeModelFields';
import {modelMapUnit,modelMapValue} from './modelMapUnits';
import {mercatorY} from './precipitationTotals';
import {loadModelMapGeography} from './modelMapGeography';
import {seasonalPairValid,type SeasonalMapId} from './nativeSeasonalComposite';
import type {MapColorScale} from './modelMapColorScale';
import type {WindUnit} from './weather';

type Place={name:string;latitude:number;longitude:number};
const xml=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]!));

export function nativeSeasonalSvg(
 id:SeasonalMapId,precip:NativeField,companion:NativeField,raster:string,
 places:Place[],unit:WindUnit='kn',scale:MapColorScale=nativeMapScale(precip,'absolute',unit),
 states:Awaited<ReturnType<typeof loadModelMapGeography>>['states']=[],
 gustIntervalHours:number=0,
):string{
 if(!seasonalPairValid(id,precip,companion)||!Number.isInteger(gustIntervalHours)||
   gustIntervalHours<0||gustIntervalHours>48||
   typeof raster!=='string'||!/^data:image\/png;base64,[A-Za-z0-9+/=]+$/.test(raster)||
   precip.values.some((value,i)=>Number.isFinite(value)!==Number.isFinite(companion.values[i])))
  throw new Error('Saisonkartenexport: kein gemeinsamer, geprüfter Originaldatenstand.');
 const label=id==='winter-berge'?'Winter & Berge · Niederschlag / 2-m-Isothermen':'Sommer · Niederschlag / Böen-Isolinien';
 const base=nativeFieldSvg(precip,label,raster,places,1,unit,scale,states,
  {fill:true,lines:false,extremes:false});
 const west=precip.lons[0],east=precip.lons.at(-1)!;
 const south=mercatorY(precip.lats[0]),north=mercatorY(precip.lats.at(-1)!);
 const x=(lon:number)=>50+(lon-west)/(east-west)*630;
 const y=(lat:number)=>170+(north-mercatorY(lat))/(north-south)*760;
 const isolines=nativeAnnotationSvg(companion,unit,{lines:true,extremes:false},x,y);
 const secondUnit=modelMapUnit(companion.kind,companion.unit,unit);
 const caption=id==='winter-berge'
  ?'Niederschlag: letzte Stunde · Linien: 2-m-Temperatur · keine Aussage zur Niederschlagsphase'
  :gustIntervalHours>0
    ?`Niederschlag: letzte Stunde · Linien: Böenmaximum in 10 m Höhe im ${gustIntervalHours}-h-Intervall · keine Gewitterwarnung`
    :'Niederschlag: letzte Stunde · Linien: Böenwert in 10 m Höhe, Quellintervall nicht ausgewiesen · keine Gewitterwarnung';
 const details=places.map((p,i)=>{
  const val=nativeAt(companion,p.latitude,p.longitude),v=val===null?'–':modelMapValue(companion.kind,val,companion.unit,unit)+' '+secondUnit;
  return `<text x="720" y="${245+i*30}" font-family="Arial,sans-serif" font-size="11" fill="#dce9f4">${xml(companion.kind==='temperature'?'2 m: ':'Böen: ')}${xml(v)}</text>`;
 }).join('');
 const boundary='<g fill="none" stroke="#edf5fa" stroke-width="1">';
 if(!base.includes(boundary)||base.split(boundary).length!==2)
  throw new Error('Saisonkartenexport: unverifizierte SVG-Struktur.');
 return base.replace(boundary,`<text x="50" y="145" font-family="Arial,sans-serif" font-size="13" fill="#dce9f4">${xml(caption)}</text>${isolines}${details}${boundary}`);
}

export async function exportNativeSeasonal(
 id:SeasonalMapId,precip:NativeField,companion:NativeField,raster:string,
 places:Place[],kind:'svg'|'png',unit:WindUnit='kn',
 scale:MapColorScale=nativeMapScale(precip,'absolute',unit),gustIntervalHours:number=0,
):Promise<void>{
 const geography=await loadModelMapGeography();
 const svg=nativeSeasonalSvg(id,precip,companion,raster,places,unit,scale,geography.states,gustIntervalHours);
 let blob=new Blob([svg],{type:'image/svg+xml'});
 if(kind==='png'){
  const url=URL.createObjectURL(blob);
  try{
   const image=new Image();image.src=url;await image.decode();
   const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
   const ctx=canvas.getContext('2d');if(!ctx)throw new Error('Saisonkartenexport: Canvas nicht verfügbar.');
   ctx.drawImage(image,0,0);
   blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG nicht verfügbar.')),'image/png'));
  }finally{URL.revokeObjectURL(url)}
 }
 const filename=`MID-ICON-D2-${id}-${precip.time.slice(0,13).replace(/[^0-9]/g,'')}.${kind}`;
 const file=new File([blob],filename,{type:blob.type}),share={title:'MID · DWD-Saisonkarte',files:[file]};
 if(typeof navigator.share==='function'&&navigator.canShare?.(share)){await navigator.share(share);return}
 const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=filename;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
