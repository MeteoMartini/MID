import {weatherMapProductsForModel,weatherMapWmsProxy,type WeatherMapProduct} from './WeatherMapsData';
import {wmsProviderLegendUrl} from './wmsLegendUrl';

export type WmsExportBounds={west:number;south:number;east:number;north:number};
export type WmsOriginalExportInput={product:WeatherMapProduct;style:string;validTime:string;runTime:string;level?:number;bounds:WmsExportBounds;viewportWidth:number;viewportHeight:number};
export type WmsOriginalExportPlan={mapUrl:string;legendUrl:string;width:number;height:number;filename:string;caption:string;source:string;validTime:string;runTime:string};

const MAX_WIDTH=1100,MAX_HEIGHT=900,MAX_PIXELS=990000;
const R=6378137,MAX_LAT=85.05112878;
const mercatorX=(longitude:number)=>R*longitude*Math.PI/180;
const mercatorY=(latitude:number)=>R*Math.log(Math.tan(Math.PI/4+latitude*Math.PI/360));
const utc=(date:string)=>new Date(Date.parse(date)).toISOString().replace('.000Z','Z');
const safeName=(value:string)=>value.replace(/[^A-Za-z0-9-]+/g,'-').slice(0,75);

/**
 * One verified WMS GetMap image for the actual WebMercator map viewport, not a
 * screenshot, not a numerical raster and never an inferred color scale.
 * Source/projection/run/time/level/style must match the displayed WMS tiles.
 */
export function planOriginalWmsExport(input:WmsOriginalExportInput):WmsOriginalExportPlan{
 const {product,style,validTime,runTime,level,bounds,viewportWidth,viewportHeight}=input;
 const allowed=!product.source&&weatherMapProductsForModel(product.modelId).some(item=>item.id===product.id&&item.layer===product.layer&&(item.provider??'dwd')===(product.provider??'dwd')&&!item.source);
 if(!allowed)throw new Error('Der WMS-Layer ist nicht für den Export freigegeben.');
 if(!/^[A-Za-z0-9_:.-]{0,180}$/.test(style))throw new Error('Der Kartenstil ist ungültig.');
 const t=Date.parse(validTime),r=Date.parse(runTime);
 if(!Number.isFinite(t)||!Number.isFinite(r)||t<r)throw new Error('Modelllauf oder Gültigkeitszeit sind nicht bestätigt.');
 if(level!==undefined&&(!Number.isFinite(level)||level<0||level>1200))throw new Error('Die Höhenfläche ist ungültig.');
 const {west,south,east,north}=bounds;
 if(![west,south,east,north].every(Number.isFinite)||west< -180||east>180||east<=west||east-west>170||south< -MAX_LAT||north>MAX_LAT||north<=south)throw new Error('Der Kartenausschnitt liegt außerhalb des unterstützten WMS-Gebiets.');
 if(!Number.isFinite(viewportWidth)||!Number.isFinite(viewportHeight)||viewportWidth<100||viewportHeight<100)throw new Error('Die Kartengröße ist nicht bestätigt.');
 const scale=Math.min(1,MAX_WIDTH/viewportWidth,MAX_HEIGHT/viewportHeight,Math.sqrt(MAX_PIXELS/(viewportWidth*viewportHeight)));
 const width=Math.round(viewportWidth*scale),height=Math.round(viewportHeight*scale);
 if(width<100||height<100)throw new Error('Der Kartenausschnitt ist zu klein.');
 const provider=product.provider??'dwd',base=weatherMapWmsProxy(provider);
 if(!base)throw new Error('Der erlaubte Kartenproxy ist nicht verfügbar.');
 const legendUrl=wmsProviderLegendUrl(product,style);
 if(!legendUrl)throw new Error('Eine Originallegende ist für diese Karte nicht bestätigt.');
 const url=new URL(base);
 for(const [key,value] of Object.entries({
  service:'WMS',request:'GetMap',version:'1.1.1',layers:product.layer,styles:style,
  format:'image/png',transparent:'true',srs:'EPSG:3857',
  bbox:[mercatorX(west),mercatorY(south),mercatorX(east),mercatorY(north)].map(v=>v.toFixed(3)).join(','),
  width:String(width),height:String(height),time:utc(validTime),dim_reference_time:utc(runTime),
  ...(level===undefined?{}:{elevation:String(level)})
 }))url.searchParams.set(key,value);
 const source=provider==='geomet'?'ECCC GeoMet · Open Government Licence – Canada':'DWD · CC BY 4.0';
 const filename=`MID-WMS-${safeName(product.id)}-${utc(validTime).replace(/[^0-9TZ]/g,'')}.png`;
 const caption=`${product.label} | INIT ${utc(runTime)} | gültig ${utc(validTime)}${level===undefined?'':` | Niveau ${level} ${product.levelKind==='height'?'m':'hPa'}`} | Stil ${style||'Standard'}`;
 return {mapUrl:url.toString(),legendUrl,width,height,filename,caption,source,validTime,runTime};
}

function loadImage(blob:Blob,signal?:AbortSignal):Promise<HTMLImageElement>{
 return new Promise((resolve,reject)=>{
  const url=URL.createObjectURL(blob),image=new Image();let settled=false;
  const finish=(error?:Error)=>{if(settled)return;settled=true;image.onload=null;image.onerror=null;signal?.removeEventListener('abort',abort);URL.revokeObjectURL(url);error?reject(error):resolve(image)};
  const abort=()=>finish(new DOMException('Abgebrochen','AbortError'));
  signal?.addEventListener('abort',abort,{once:true});
  image.onload=()=>finish();
  image.onerror=()=>finish(new Error('Das Anbieterbild kann nicht dekodiert werden.'));
  if(signal?.aborted){abort();return}
  image.src=url;
 });
}

async function fetchPng(url:string,signal?:AbortSignal){
 const response=await fetch(url,{signal,cache:'no-store'});
 if(!response.ok||!(response.headers.get('content-type')||'').toLowerCase().startsWith('image/png'))throw new Error('Der Anbieter liefert derzeit kein bestätigtes PNG.');
 const size=Number(response.headers.get('content-length')||0);
 if(size>12_000_000)throw new Error('Die Anbieterdatei ist zu groß.');
 const blob=await response.blob();
 if(blob.size<50||blob.size>12_000_000)throw new Error('Die Anbieterdatei ist leer oder zu groß.');
 return blob;
}

/** Downloads the provider-original map image plus its provider-original legend.
 * No radar/satellite, basemap, interpolated numbers or unsupported vector claims.
 */
export async function downloadOriginalWmsPng(plan:WmsOriginalExportPlan,signal?:AbortSignal):Promise<void>{
 const [mapBlob,legendBlob]=await Promise.all([fetchPng(plan.mapUrl,signal),fetchPng(plan.legendUrl,signal)]);
 const [mapImage,legendImage]=await Promise.all([loadImage(mapBlob,signal),loadImage(legendBlob,signal)]);
 if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 if(mapImage.naturalWidth!==plan.width||mapImage.naturalHeight!==plan.height)throw new Error('Das WMS-Bild besitzt nicht die bestätigte Kartengeometrie.');
 const legendWidth=260,gutter=20,head=74,foot=86;
 const legendScale=Math.min(1,legendWidth/legendImage.naturalWidth,Math.max(100,plan.height)/legendImage.naturalHeight);
 const legendHeight=Math.max(1,Math.round(legendImage.naturalHeight*legendScale));
 const width=plan.width+legendWidth+gutter*3,height=head+Math.max(plan.height,legendHeight)+foot;
 if(width*height>2_500_000)throw new Error('Der Export würde die Speichergrenze überschreiten.');
 const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');
 if(!ctx)throw new Error('Die Bildausgabe wird auf diesem Gerät nicht unterstützt.');
 ctx.fillStyle='#ffffff';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#142338';ctx.font='bold 22px Arial,sans-serif';ctx.fillText('MID · Original-WMS-Wetterfläche',gutter,32,width-2*gutter);
 ctx.font='13px Arial,sans-serif';ctx.fillText('Originaldarstellung ohne Basiskarte, Radar oder Satellit',gutter,53,width-2*gutter);
 ctx.drawImage(mapImage,gutter,head,plan.width,plan.height);
 ctx.fillStyle='#eef2f6';ctx.fillRect(plan.width+2*gutter,head,legendWidth,Math.max(plan.height,legendHeight));
 ctx.drawImage(legendImage,plan.width+2*gutter,head,Math.round(legendImage.naturalWidth*legendScale),legendHeight);
 ctx.font='12px Arial,sans-serif';ctx.fillStyle='#142338';
 ctx.fillText('Anbieter-Originallegende',plan.width+2*gutter,head+Math.max(plan.height,legendHeight)+19,legendWidth);
 ctx.fillText(plan.caption.slice(0,145),gutter,height-48,width-2*gutter);
 ctx.fillText(plan.source+' · WMS GetMap / GetLegendGraphic · EPSG:3857',gutter,height-28,width-2*gutter);
 const output=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(result=>result?resolve(result):reject(new Error('PNG-Kodierung fehlgeschlagen.')),'image/png'));
 if(signal?.aborted)throw new DOMException('Abgebrochen','AbortError');
 const url=URL.createObjectURL(output),anchor=document.createElement('a');
 try{anchor.href=url;anchor.download=plan.filename;document.body.appendChild(anchor);anchor.click();}finally{anchor.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
}
