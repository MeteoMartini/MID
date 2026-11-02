/** Immutable native DWD ICON-D2 full-region transport admission.
 * This is a SHADOW contract until the attested RUC/Pages publisher exposes
 * modelFieldsNative.productionApproved=true; never accepts pilot-only data.
 * Original 542040-cell source, frame SHA and NoData semantics are compulsory.
 */
import type {NativeField,NativeFieldKind,NativeFrameRef,NativeIndex} from './nativeModelFields';

export const D2_FULL_DOMAIN_LEADS=[1,2,3,4,5,6,12,24,48] as const;
export const D2_FULL_DOMAIN_KINDS:NativeFieldKind[]=['temperature','pressure','wind','gust','cloud','thetae','sigwx','precipitation'];
export const D2_FULL_DOMAIN_SOURCE_CELLS=542040;
const sha=(x:unknown):x is string=>typeof x==='string'&&/^[a-f0-9]{64}$/.test(x);
const units:Record<NativeFieldKind,string>={temperature:'°C',pressure:'hPa',wind:'km/h',gust:'km/h',cloud:'%',thetae:'K',sigwx:'WMO',precipitation:'mm/1 h'};
const bounds:Record<NativeFieldKind,[number,number]>={temperature:[-100,70],pressure:[800,1100],wind:[0,600],gust:[0,600],cloud:[0,100.01],thetae:[150,500],sigwx:[0,99],precipitation:[0,6500]};
type FullIndex=NativeIndex&{schema:'mid.icon-d2.native-fields.v2';productionApproved:true;sourceInventorySha256:string;nativePoints:542040;modelId:'icon-d2';sampling:'nearest-native-cell'};
export function validateD2FullDomainIndex(raw:unknown,nowMs=Date.now()):FullIndex{
 if(!raw||typeof raw!=='object')throw Error('Missing DWD native full-region index');
 const x=raw as Partial<FullIndex>;
 if(x.schema!=='mid.icon-d2.native-fields.v2'||x.productionApproved!==true||
    x.modelId!=='icon-d2'||x.sampling!=='nearest-native-cell'||
    x.nativePoints!==D2_FULL_DOMAIN_SOURCE_CELLS||!sha(x.sourceInventorySha256))
  throw Error('DWD full-domain source was not approved by a real SHA/geometry gate');
 const stamp=Date.parse(x.run||'');
 if(!Number.isFinite(stamp)||!Number.isFinite(nowMs)||stamp>nowMs+3600000||nowMs-stamp>24*3600000)
  throw Error('DWD full-domain original run stale/invalid');
 const products=x.products;
 if(!products||Object.keys(products).length!==8||D2_FULL_DOMAIN_KINDS.some(k=>!products[k]))
  throw Error('Native full-domain eight-parameter matrix incomplete');
 let budget=0;
 for(const k of D2_FULL_DOMAIN_KINDS){
  const product=products[k];
  if(product?.unit!==units[k]||!Array.isArray(product.frames)||product.frames.length!==9)
   throw Error('Native full-domain unit/forecast axis incomplete');
  const leads=new Set<number>();
  for(const f of product.frames){
   if(!f||!D2_FULL_DOMAIN_LEADS.includes(f.hour as typeof D2_FULL_DOMAIN_LEADS[number])||
      leads.has(f.hour)||Date.parse(f.time)!==stamp+f.hour*3600000||
      f.file!==`${k}-${String(f.hour).padStart(3,'0')}.bin`||
      f.encoding!=='gzip-json'||!sha(f.sha256)||!Number.isInteger(f.bytes)||
      f.bytes<1||f.bytes>12_000_000||!Number.isInteger(f.decodedBytes)||
      f.decodedBytes!<1||f.decodedBytes!>12_000_000||
      f.intervalHours!==(k==='precipitation'?1:0))
    throw Error('Native DWD original frame/cadence/SHA invalid');
   leads.add(f.hour);budget+=f.bytes;
  }
  if(leads.size!==9)throw Error('DWD native forecast leads incomplete');
 }
 if(budget>=350_000_000)throw Error('Full-domain DWD storage budget exceeded');
 return x as FullIndex;
}
const axis=(a:unknown):a is number[]=>{
 if(!Array.isArray(a)||a.length<3||a.length>1600||!a.every(x=>typeof x==='number'&&Number.isFinite(x)))return false;
 const step=a[1]-a[0];
 return step>.024&&step<.026&&a.every((x,i)=>i===0||Math.abs(x-a[0]-i*step)<1e-4);
};
export function validateD2FullDomainField(raw:unknown,index:FullIndex,ref:NativeFrameRef,kind:NativeFieldKind):NativeField{
 if(!raw||typeof raw!=='object')throw Error('Missing native DWD full-domain field');
 const d=raw as Record<string,unknown>,date=Date.parse(index.run);
 if(d.schema!=='mid.icon-d2.native-field.v2'||d.productionApproved!==true
    ||d.modelId!=='icon-d2'||d.sampling!=='nearest-native-cell'
    ||d.sourceInventorySha256!==index.sourceInventorySha256
    ||d.nativePoints!==D2_FULL_DOMAIN_SOURCE_CELLS
    ||d.run!==index.run||d.time!==ref.time||d.leadHours!==ref.hour
    ||d.kind!==kind||d.unit!==units[kind]||d.scale!==.1
    ||Date.parse(String(d.time))!==date+ref.hour*3600000)
  throw Error('Full-region DWD field not release-qualified');
 if(!axis(d.lats)||!axis(d.lons))throw Error('DWD full-area grid spacing invalid');
 const lats=d.lats,lons=d.lons;
 if(!(lats[0]<47&&lats.at(-1)!>55.2&&lons[0]<5.5&&lons.at(-1)!>15.6))
  throw Error('Only a Germany cropped raster, not original full ICON-D2 domain');
 if(!Array.isArray(d.values)||d.values.length!==lats.length*lons.length)
  throw Error('Full-region DWD image grid incomplete');
 let hasValid=false,missing=0;
 const [low,high]=bounds[kind];
 for(const v of d.values){
  if(v===null){missing++;continue}
  if(typeof v!=='number'||!Number.isInteger(v)||v<low*10-1e-6||v>high*10+1e-6||
      (kind==='sigwx'&&v%10!==0))
   throw Error('Physical native DWD field invalid (extreme not clipped)');
  hasValid=true;
 }
 if(!hasValid)throw Error('Full-domain DWD frame entirely missing');
 const uncertainty=d.negativePackingUncertainNoDataCells;
 if(!Number.isInteger(uncertainty)||Number(uncertainty)<0||
    Number(uncertainty)>Math.min(missing,Math.floor(D2_FULL_DOMAIN_SOURCE_CELLS*.15))||
    (kind!=='precipitation'&&uncertainty!==0))
  throw Error('Original packing-uncertainty NoData provenance invalid');
 if(!Array.isArray(d.isobars)||!Array.isArray(d.centers))
  throw Error('Missing original contour/pressure-center metadata');
 // The real Pages admission also requires nonempty native pressure contours.
 // A display must not silently replace missing original isobars with fabricated lines.
 if(kind==='pressure'&&d.isobars.length===0)
  throw Error('Original full-domain pressure isobars missing');
 return {...d,values:(d.values as (number|null)[]).map(v=>v===null?NaN:v)} as unknown as NativeField;
}
