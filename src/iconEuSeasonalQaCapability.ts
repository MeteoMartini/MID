/**
 * Read-only candidate capability matrix for independently qualified DWD
 * ICON-EU original GRIB reports. This is NOT a production raster loader.
 *
 * In particular: no aliasing to the existing ICON-D2 NativeField schema,
 * no forecast fallback, no synthetic 1-hour frames after T+78, no permission
 * to render/publish an unverified or externally supplied QA report.
 */
export type IconEuQaFieldEvidence={
 sha256:string;units:string;stepType:string;startStep:number;endStep:number;
};
export type IconEuQaPeriod='winter-berge'|'sommer-gewitter';
export type IconEuQaCandidateFrame={
 modelId:'icon-eu';runUTC:string;validTimeUTC:string;leadHours:number;
 gridSha256:string;gridCellCount:number;precipitationIntervalHours:1|3;
 gustIntervalHours:number;validCells:number;sourceFileSha256:Readonly<Record<string,string>>;
 winter:{kind:'winter-berge';candidate:true;validCells:number;label:string};
 summer:{kind:'sommer-gewitter';candidate:boolean;validCells:number;reason:'matching-period'|'gust-period-mismatch'};
 renderable:false;productionApproved:false;
};
export type IconEuQaCandidateMatrix={
 schema:'mid.icon-eu.seasonal.qa-capability.v1';modelId:'icon-eu';
 source:'DWD ICON-EU GRIB2 originals';evidenceOnly:true;
 releaseApproved:false;productionApproved:false;renderable:false;
 runUTC:string;frames:IconEuQaCandidateFrame[];
};

type RecordLike=Record<string,unknown>;
const HASH=/^[0-9a-f]{64}$/;
function rec(v:unknown):RecordLike{
 if(!v||typeof v!=='object'||Array.isArray(v))throw new Error('ICON-EU QA object missing');
 return v as RecordLike;
}
function integer(v:unknown,min:number,max:number):number{
 if(typeof v!=='number'||!Number.isInteger(v)||v<min||v>max)throw new Error('ICON-EU QA integer/limit invalid');
 return v;
}
function sha(v:unknown):string{
 if(typeof v!=='string'||!HASH.test(v))throw new Error('ICON-EU QA source/grid SHA invalid');
 return v;
}
function field(v:unknown,stepType:string,start:number,end:number,units:readonly string[]):IconEuQaFieldEvidence{
 const x=rec(v);
 if(x.stepType!==stepType||x.startStep!==start||x.endStep!==end||!units.includes(x.units as string))
  throw new Error('ICON-EU QA GRIB field/statistics mismatch');
 return {sha256:sha(x.sha256),stepType,startStep:start,endStep:end,units:x.units as string};
}
/** This is DWD's *observed* publication cadence for the qualified cycle, not GRIB semantics. */
export function iconEuQaExpectedPrecipHours(lead:number):1|3{
 integer(lead,1,120);
 if(lead<=78)return 1;
 if(lead>=81&&lead%3===0)return 3;
 throw new Error('ICON-EU QA original lead not published');
}
function parseRun(run:unknown):Date{
 if(typeof run!=='string'||!/^20\d{8}$/.test(run))throw new Error('ICON-EU QA run invalid');
 const d=new Date(run.slice(0,4)+'-'+run.slice(4,6)+'-'+run.slice(6,8)+'T'+run.slice(8,10)+':00:00Z');
 if(Number.isNaN(d.valueOf())||d.toISOString().replace(/[-:TZ.]/g,'').slice(0,10)!==run)
  throw new Error('ICON-EU QA run not a real UTC timestamp');
 return d;
}
/**
 * Qualifies only the **shape and self-consistency** of a machine-produced QA
 * report. A malicious invented report is still untrusted; independent
 * authenticated workflow/transport provenance and original byte checks are
 * mandatory before any future renderer consumes related map frames.
 */
export function iconEuSeasonalQaCapability(input:unknown):IconEuQaCandidateMatrix{
 const raw=rec(input);
 if(raw.schema!=='mid.icon-eu.seasonal.original-qa.v1'||
    raw.source!=='DWD ICON-EU GRIB2 originals'||raw.releaseApproved!==false)
  throw new Error('ICON-EU QA report schema/source/release-state invalid');
 const start=parseRun(raw.run);
 if(!Array.isArray(raw.entries)||raw.entries.length<1||raw.entries.length>120)
  throw new Error('ICON-EU QA no bounded original frames');
 const seen=new Set<number>();
 let commonGrid:string|null=null;
 const frames=raw.entries.map((item:unknown)=>{
  const e=rec(item),lead=integer(e.lead,1,120),hours=iconEuQaExpectedPrecipHours(lead);
  if(seen.has(lead))throw new Error('ICON-EU QA duplicate forecast lead');
  seen.add(lead);
  const expectedTime=new Date(start.getTime()+lead*3600000).toISOString().replace('.000Z','Z');
  if(e.validTimeUTC!==expectedTime||e.intervalHours!==hours||
     e.precipitationIntervalHours!==hours)
   throw new Error('ICON-EU QA run/validTime/accumulation mismatch');
  const gridSha256=sha(e.gridSha256);
  if(commonGrid!==null&&commonGrid!==gridSha256)
   throw new Error('ICON-EU QA unapproved inter-frame grid change');
  commonGrid=gridSha256;
  const gridCellCount=integer(e.totalCells,4,2_000_000);
  const winterCells=integer(e.validWinter,1,gridCellCount);
  const summerCells=integer(e.validSummer,0,gridCellCount);
  const gustHours=integer(e.gustIntervalHours,1,lead);
  const gustMatches=gustHours===hours;
  const winterExpected='grib-pair-qualified',summerExpected=gustMatches?'grib-pair-qualified':'blocked-gust-interval';
  if(e.winterPairStatus!==winterExpected||e.summerPairStatus!==summerExpected||
     (gustMatches&&summerCells===0)||(!gustMatches&&summerCells!==0))
   throw new Error('ICON-EU QA unsafe/wrong seasonal availability');
  if(typeof e.minPrecipitationMm!=='number'||typeof e.maxPrecipitationMm!=='number'||
     !Number.isFinite(e.minPrecipitationMm)||!Number.isFinite(e.maxPrecipitationMm)||
     e.minPrecipitationMm<0||e.minPrecipitationMm>e.maxPrecipitationMm||e.maxPrecipitationMm>6500)
   throw new Error('ICON-EU QA invalid precipitation physical values');
  const fileNames=['tot_prec:'+(lead-hours),'tot_prec:'+lead,'t_2m:'+lead,'vmax_10m:'+lead];
  const fileMap=rec(e.files);
  if(Object.keys(fileMap).length!==4||fileNames.some(k=>!Object.hasOwn(fileMap,k)))
   throw new Error('ICON-EU QA original field pairing not complete');
  const prev=field(fileMap[fileNames[0]],'accum',0,lead-hours,['kg m**-2','kg m-2','mm']);
  const next=field(fileMap[fileNames[1]],'accum',0,lead,['kg m**-2','kg m-2','mm']);
  if(prev.units!==next.units)throw new Error('ICON-EU QA cumulative units differ');
  field(fileMap[fileNames[2]],'instant',lead,lead,['K']);
  field(fileMap[fileNames[3]],'max',lead-gustHours,lead,['m s-1','m s**-1']);
  const hashes=Object.fromEntries(fileNames.map(k=>[k,sha(rec(fileMap[k]).sha256)]));
  return {
   modelId:'icon-eu' as const,runUTC:start.toISOString().replace('.000Z','Z'),
   validTimeUTC:expectedTime,leadHours:lead,gridSha256,gridCellCount,
   precipitationIntervalHours:hours,gustIntervalHours:gustHours,validCells:winterCells,
   sourceFileSha256:hashes,
   winter:{kind:'winter-berge' as const,candidate:true as const,validCells:winterCells,
           label:hours===1?'Gesamtniederschlag · letzte 1 h + 2-m-Temperatur'
             :'Gesamtniederschlag · letzte 3 h + 2-m-Temperatur'},
   summer:{kind:'sommer-gewitter' as const,candidate:gustMatches,
           validCells:gustMatches?summerCells:0,
           reason:gustMatches?'matching-period' as const:'gust-period-mismatch' as const},
   renderable:false as const,productionApproved:false as const,
  };
 }).sort((a,b)=>a.leadHours-b.leadHours);
 return {schema:'mid.icon-eu.seasonal.qa-capability.v1',modelId:'icon-eu',
  source:'DWD ICON-EU GRIB2 originals',evidenceOnly:true,releaseApproved:false,
  productionApproved:false,renderable:false,
  runUTC:start.toISOString().replace('.000Z','Z'),frames};
}
