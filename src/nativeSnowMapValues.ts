/** Isolated arithmetic for a future optional DWD snow sidecar.
 * Call only after original GRIB header/bitmap/SHA and native-coordinate
 * qualification. The metadata checks below do not verify downloaded bytes.
 * Does not modify or widen the core/RUC product inventories.
 */
export type SnowSourceField={
 model:'icon-d2'|'icon-eu'|'icon';run:string;time:string;startTime:string;
 parameter:'h_snow'|'snow_gsp'|'snow_con';unit:'m'|'kg/m²';
 gridSha256:string;sourceSha256:string;values:Float64Array;
};
function sourceValid(field:SnowSourceField){
 return ['icon-d2','icon-eu','icon'].includes(field.model)&&
  /^[a-f0-9]{64}$/.test(field.gridSha256)&&/^[a-f0-9]{64}$/.test(field.sourceSha256)&&
  field.values instanceof Float64Array&&field.values.length>0&&field.values.length<=12000000&&
  Number.isFinite(Date.parse(field.run))&&Number.isFinite(Date.parse(field.time))&&
  Date.parse(field.time)>=Date.parse(field.run);
}
function checkedSnowValue(value:number){
 if(Number.isNaN(value))return value;
 if(!Number.isFinite(value)||value<0)throw Error('Ungültiger Original-Schneewert.');
 return value;
}
/** Geometric depth only: preserve unrounded centimetres internally. Display
 * rounding belongs to the existing MID snow-depth display contract.
 */
export function geometricSnowDepthCm(field:SnowSourceField){
 if(!sourceValid(field)||field.parameter!=='h_snow'||field.unit!=='m'||field.startTime!==field.time)
  throw Error('Keine verifizierbare geometrische Schneehöhe.');
 const out=new Float64Array(field.values.length);
 for(let i=0;i<out.length;i++){
  const cm=checkedSnowValue(field.values[i])*100;
  if(!Number.isNaN(cm)&&!Number.isFinite(cm))throw Error('Ungültige Schneehöhe.');
  out[i]=cm;
 }
 return out;
}
/** Difference each independent cumulative snowfall component before summing.
 * A negative component cannot be hidden by a growing other component.
 * Missing endpoint/component yields NoData, not zero. No snow-density model.
 */
export function dwdSnowIntervalSwe(gspBefore:SnowSourceField,gspAfter:SnowSourceField,conBefore:SnowSourceField,conAfter:SnowSourceField){
 const fields=[gspBefore,gspAfter,conBefore,conAfter];
 const first=gspBefore,n=first.values.length,start=first.time,end=gspAfter.time;
 if(!fields.every(sourceValid)||new Set(fields.map(f=>f.sourceSha256)).size!==4||
  Date.parse(end)<=Date.parse(start)||gspBefore.parameter!=='snow_gsp'||gspAfter.parameter!=='snow_gsp'||
  conBefore.parameter!=='snow_con'||conAfter.parameter!=='snow_con'||conBefore.time!==start||conAfter.time!==end||
  fields.some(f=>f.model!==first.model||f.run!==first.run||f.startTime!==first.run||
   f.gridSha256!==first.gridSha256||f.unit!=='kg/m²'||f.values.length!==n))
  throw Error('Schneefall: Lauf, Intervall, Originalfeld oder Raster nicht identisch.');
 const values=new Float64Array(n);
 for(let i=0;i<n;i++){
  const a=checkedSnowValue(gspBefore.values[i]),b=checkedSnowValue(gspAfter.values[i]);
  const c=checkedSnowValue(conBefore.values[i]),d=checkedSnowValue(conAfter.values[i]);
  const gsp=b-a,con=d-c;
  if(gsp<0||con<0)throw Error('Schneefall-Akkumulationsreset oder negative Differenz.');
  const total=gsp+con;
  if(!Number.isNaN(total)&&!Number.isFinite(total))throw Error('Ungültige Schneefallsumme.');
  values[i]=total;
 }
 return {model:first.model,run:first.run,start,end,unit:'mm SWE' as const,gridSha256:first.gridSha256,
  sourceSha256:fields.map(f=>f.sourceSha256),values};
}
