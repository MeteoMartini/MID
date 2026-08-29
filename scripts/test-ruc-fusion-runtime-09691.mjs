import fs from 'node:fs';
import vm from 'node:vm';
const raw=fs.readFileSync('worker/metar-proxy.js','utf8')
 .replace(/export default\s*\{/,'const __workerDefault={')
 .replace(/^export \{[^\n]+\};?$/gm,'');
const context=vm.createContext({console,URL,URLSearchParams,Headers,Request,Response,AbortController,DOMException,TextDecoder,TextEncoder,crypto,setTimeout,clearTimeout,fetch:async()=>{throw new Error('network not expected')}});
vm.runInContext(raw,context,{timeout:5000,filename:'worker/metar-proxy.js'});
const call=(code)=>vm.runInContext(code,context,{timeout:5000});
const now=new Date();now.setUTCMinutes(0,0,0);const times=Array.from({length:8},(_,i)=>new Date(now.getTime()+i*3600000).toISOString().slice(0,16));
const fields=[
 {name:'temperature_2m',scale:.01,offset:0,value:18.5},{name:'dew_point_2m',scale:.01,offset:0,value:12.25},{name:'relative_humidity_2m',scale:.1,offset:0,value:68},
 {name:'pressure_msl',scale:.1,offset:0,value:1012.4},{name:'wind_speed_10m',scale:.01,offset:0,value:14},{name:'wind_direction_10m',scale:.1,offset:0,value:230},
 {name:'wind_gusts_10m',scale:.01,offset:0,value:24},{name:'precipitation',scale:.01,offset:0,value:1.2},{name:'cloud_cover',scale:.1,offset:0,value:72},
 {name:'cloud_cover_low',scale:.1,offset:0,value:45},{name:'cape',scale:.1,offset:0,value:900},{name:'convective_inhibition',scale:.1,offset:0,value:35}
];
const summaryFields=[
 {name:'precipitation_probability',scale:.1,offset:0,value:75},
 {name:'precipitation_probability_significant',scale:.1,offset:0,value:25},
 {name:'precipitation_mean',scale:.01,offset:0,value:.42},
 {name:'precipitation_q25',scale:.01,offset:0,value:.1},
 {name:'precipitation_q50',scale:.01,offset:0,value:.4},
 {name:'precipitation_q75',scale:.01,offset:0,value:.65}
];
const i16Record=(specs)=>{const b=new ArrayBuffer(times.length*specs.length*2),v=new DataView(b);for(let t=0;t<times.length;t++)for(let f=0;f<specs.length;f++)v.setInt16((t*specs.length+f)*2,Math.round(specs[f].value/specs[f].scale),true);return b};
const det=i16Record(fields),epsSummary=i16Record(summaryFields);
const members=20,eps=new ArrayBuffer(times.length*members*2),ev=new DataView(eps);for(let t=0;t<times.length;t++)for(let m=0;m<members;m++)ev.setUint16((t*members+m)*2,m<15?50:0,true); // 0.50 mm for 75% of members
const lookup=new Uint8Array(4);new DataView(lookup.buffer).setUint32(0,0,true);
const run='x'+now.toISOString().replace(/[^0-9]/g,'').slice(0,10),prefix=`runs/${run}`;
const meta={schema:'mid.dwd.ruc.grid.v2',run:now.toISOString(),times,pointCount:1,grid:{latMin:50,lonMin:7,dx:.025,dy:.025,nx:1,ny:1},lookup:{key:`${prefix}/lookup.bin`},deterministic:{key:`${prefix}/deterministic.bin`,recordBytes:det.byteLength,fields},epsSummary:{key:`${prefix}/eps-summary.bin`,recordBytes:epsSummary.byteLength,fields:summaryFields,thresholdsMm:{wet:.2,significant:5}},eps:{key:`${prefix}/eps-members.bin`,recordBytes:eps.byteLength,memberCount:members,scale:.01}};
const bytes=x=>new Uint8Array(x instanceof ArrayBuffer?x:x.buffer,x.byteOffset??0,x.byteLength??x.length);
context.__reads={latest:0,lookup:0,det:0,summary:0,members:0};
context.__bucket={async get(key,options){let data;if(key==='latest.json'){context.__reads.latest++;data=new TextEncoder().encode(JSON.stringify(meta))}else if(key===`${prefix}/lookup.bin`){context.__reads.lookup++;data=lookup}else if(key.endsWith('deterministic.bin')){context.__reads.det++;data=bytes(det)}else if(key.endsWith('eps-summary.bin')){context.__reads.summary++;data=bytes(epsSummary)}else if(key.endsWith('eps-members.bin')){context.__reads.members++;data=bytes(eps)}else return null;const range=options?.range;if(range)data=data.slice(range.offset,range.offset+range.length);return{text:async()=>new TextDecoder().decode(data),arrayBuffer:async()=>data.buffer.slice(data.byteOffset,data.byteOffset+data.byteLength)}}};
context.__env={MID_DWD_RUC_DATA:context.__bucket};
context.__model={id:'icon_d2_ruc',label:'DWD ICON-D2-RUC',family:'dwd-icon-ruc',maxHours:14,rapidUpdate:true};
context.__p=await call('dwdRucR2PointPayload(50,7,__env)');if(!context.__p)throw new Error('R2 deterministic payload unavailable');
context.__parsed=await call("parseDwdRucPointPayload(__p,__model,'test')");
if(!context.__parsed.successful||context.__parsed.hours.length<6)throw new Error('RUC hourly parser rejected valid R2 data');
const first=context.__parsed.hours[0];for(const key of ['temperature','dewPoint','pressure','wind','gust','direction','precipitation','cloud','lowCloud','humidity','cape','convectiveInhibition'])if(!Number.isFinite(first[key]))throw new Error(`RUC physical field missing: ${key}`);

// Normal forecast path must read the preaggregated EPS summary and must NOT touch native members.
context.__epsState=await call('fetchDwdRucEpsProbabilityAdapter(50,7,undefined,__env)');
if(!context.__epsState.successful||context.__epsState.aggregation!=='preprocessed')throw new Error('Normal RUC-EPS path did not select preprocessed summary');
if(context.__epsState.hours.length!==times.length||Math.abs(context.__epsState.hours[0].probability-75)>.01||context.__epsState.memberCount!==20)throw new Error('Preaggregated RUC-EPS probability contract mismatch');
if(context.__reads.summary!==1||context.__reads.members!==0)throw new Error(`Normal forecast should read summary only, got summary=${context.__reads.summary}, members=${context.__reads.members}`);

// Event/short-range ensemble path may request native members, preserving real ensemble semantics.
context.__eventPayload=await call('dwdRucEpsR2Payload(50,7,__env)');if(!context.__eventPayload)throw new Error('RUC-EPS native event payload unavailable');
context.__eventRows=await call('rucEpsProbabilityRows(__eventPayload)');
if(context.__eventRows.length!==times.length||Math.abs(context.__eventRows[0].probability-75)>.01||context.__eventRows[0].memberCount!==20)throw new Error('Native RUC-EPS event member contract mismatch');
if(context.__reads.members!==1)throw new Error('Event path must be able to read native RUC-EPS members exactly on demand');

// The run-immutable lookup/latest caches avoid repeated metadata/lookup reads within an isolate.
await call('dwdRucR2PointPayload(50,7,__env)');
if(context.__reads.latest!==1||context.__reads.lookup!==1)throw new Error(`RUC metadata/lookup cache ineffective: ${JSON.stringify(context.__reads)}`);

context.__ruc={...context.__parsed,id:'icon_d2_ruc',successful:true};
context.__base=times.map(time=>({time,epoch:Date.parse(time+'Z'),temperature:15,dewPoint:9,pressure:1010,wind:8,gust:13,direction:180,precipitation:.2,rain:.2,showers:0,snowfall:0,probability:20,code:61,cloud:55,lowCloud:25,humidity:60,cape:100,liftedIndex:1,convectiveInhibition:80,sunshineDuration:600,isDay:true,sourceId:'best_match'}));
context.__rapid=await call('applyRucRapidUpdateWeatherHours(__base,[__ruc])');
if(!context.__rapid.some(h=>h.rucApplied))throw new Error('RUC did not calibrate canonical 0–14 h hours');
const updated=context.__rapid.find(h=>h.rucApplied);if(!(updated.temperature>15&&updated.wind>8&&updated.precipitation>.2&&updated.cape>100))throw new Error('RUC physical calibration fields were not applied');
context.__final=await call('applyRucEpsProbabilityHours(__rapid,__epsState)');
if(!context.__final.some(h=>h.rucEpsApplied&&h.probability>20))throw new Error('RUC-EPS did not calibrate precipitation probability');
const demoted=await call('safeRapidThunderCode(61,95,false)');if([95,96,97,99].includes(demoted))throw new Error('RUC may not create thunder without observed lightning');
console.log('RUC fusion runtime contract OK');
