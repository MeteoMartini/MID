/** QA ONLY. An IR10.8/GSP private preview cannot authorize a public MID product. */
export type Slot = {targetUtc:string;shadowPairDeclared:boolean;irTime:string|null;gspTime:string|null;nativeClct:false;originalWmoSigwx:false};
const STEP=900_000, SHA=/^[a-f0-9]{64}$/, UTC=/^20\d\d-\d\d-\d\dT\d\d:(?:00|15|30|45):00Z$/;
type Obj=Record<string,unknown>;
function obj(x:unknown):x is Obj{return !!x&&typeof x==='object'&&!Array.isArray(x)}
function check(ok:unknown,reason:string):asserts ok{if(!ok)throw Error('15min QA: '+reason)}
function time(x:unknown){check(typeof x==='string'&&UTC.test(x),'non-canonical UTC');const t=Date.parse(x);check(Number.isFinite(t)&&new Date(t).toISOString().replace('.000Z','Z')===x,'invalid date');return t}
function asset(x:unknown,kind:'IR'|'GSP',i:number){
 check(obj(x),kind+' missing');
 check(x.file===(kind==='IR'?'ir108':'gsp-phase')+'-'+String(i).padStart(2,'0')+'.'+(kind==='IR'?'png':'bin'),'asset name');
 check(typeof x.sha256==='string'&&SHA.test(x.sha256),'asset SHA');
 check(Number.isSafeInteger(x.bytes)&&Number(x.bytes)>0&&Number(x.bytes)<=14*1024*1024,'asset size');
 check(x.encoding===(kind==='IR'?'png-rgba8-north-up':'zlib-uint8-phase-id-north-up'),'asset encoding');
}
/** Reports only declared metadata; real ecCodes / CRC / private-asset readback remain separate gates. */
export function inspectSurroundings15minShadowCoverage(preview:unknown,receipt:unknown,now:number){
 check(Number.isFinite(now),'invalid current time');
 check(obj(preview)&&preview.schema==='mid.ir108-gsp.original-native-preview.shadow.v1','foreign preview');
 check(preview.model==='DWD ICON-D2-RUC'&&preview.isObservation===false&&
  preview.isOfficialWmoWeatherCode===false&&preview.activationAuthorized===false&&
  preview.productionApproved===false,'unauthorized weather/production claim');
 const run=time(preview.run);check(run%3_600_000===0,'run not hourly');
 check(preview.nativeCellCount===542040,'wrong grid');
 check(preview.phaseNoDataId===255&&preview.phaseNoGspSignalId===0,'NoData cannot be dry');
 check(typeof preview.sourceLookupSha256==='string'&&SHA.test(preview.sourceLookupSha256),'lookup SHA');
 check(typeof preview.sourceRucManifestSha256==='string'&&SHA.test(preview.sourceRucManifestSha256),'RUC SHA');
 check(obj(preview.originalManifestsSha256)&&Object.keys(preview.originalManifestsSha256).length===2&&
  Object.values(preview.originalManifestsSha256).every(v=>typeof v==='string'&&SHA.test(v)),'original SHAs');
 check(Array.isArray(preview.times)&&preview.times.length===10,'10 originals required');
 const valid:number[]=[];
 preview.times.forEach((item:unknown,i:number)=>{
  check(obj(item),'missing frame');const t=time(item.validTime);
  check(t>=run&&t-run<=14*3_600_000,'horizon/run mismatch');
  if(i)check(t===valid[i-1]+STEP,'missing or duplicate quarter-hour');
  valid.push(t);asset(item.IR,'IR',i);asset(item.GSP,'GSP',i);
  check(Number.isSafeInteger(item.validIrPixels)&&Number(item.validIrPixels)>0&&
   Number.isSafeInteger(item.missingIrPixels)&&Number(item.missingIrPixels)>=0,'IR count');
 });
 check(obj(receipt)&&receipt.schema==='mid.ir108-gsp.pair-readback.shadow-qa.v1','foreign readback');
 check(receipt.run===preview.run&&receipt.frames===10&&receipt.assetPairs===10&&
  receipt.validFrom===(preview.times[0] as Obj).validTime&&receipt.validTo===(preview.times[9] as Obj).validTime&&
  receipt.allAssetDigestsChecked===true&&receipt.allPixelMasksChecked===true&&
  receipt.activationAuthorized===false&&receipt.releaseAuthorized===false,'readback mismatch');
 const present=new Set(valid),start=Math.floor(now/STEP)*STEP;
 const slots:Slot[]=Array.from({length:10},(_,i)=>{
  const targetUtc=new Date(start+i*STEP).toISOString().replace('.000Z','Z'),declared=present.has(start+i*STEP);
  return {targetUtc,shadowPairDeclared:declared,irTime:declared?targetUtc:null,gspTime:declared?targetUtc:null,
   nativeClct:false,originalWmoSigwx:false};
 });
 return {schema:'mid.surroundings.15min-shadow-coverage-qa.v1' as const,candidateRun:preview.run as string,
  slots,allSelectedSlotsDeclared:slots.every(x=>x.shadowPairDeclared),
  independentlyVerified:false as const,liveDataDelivered:false as const,
  activationAuthorized:false as const,releaseAuthorized:false as const};
}
