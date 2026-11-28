/** Local workerd QA only: no production routes, account bindings, paid services, or deploy. */
import { DurableObject } from "cloudflare:workers";
import { RucRunCoreQa,RucCoordinatorCoreQa,sha256 } from "./ruc_do_worker_core_qa.mjs";
const ONLY="MID-RUC-LOCAL-ONLY-NO-PRODUCTION",RUN="2026-11-09T14:00";
const SOURCE="a".repeat(40),PROOF="b".repeat(64);
export class RucRunQa extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.core=new RucRunCoreQa(ctx);}
  beginQa(m){return this.core.beginQa(m);}
  putSegmentQa(key,part,body){return this.core.putSegmentQa(key,part,body);}
  sealQa(){return this.core.sealQa();}
  getSealReceiptQa(){return this.core.getSealReceiptQa();}
  readCellsQa(cell,fields){return this.core.readCellsQa(cell,fields);}
}
export class RucCoordQa extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.core=new RucCoordinatorCoreQa(ctx,env);}
  activeQa(){return this.core.activeQa();}
  promoteQa(run,generation,proof){return this.core.promoteQa(run,generation,proof);}
}
async function deflate(bytes){
  const stream=new Blob([bytes]).stream().pipeThrough(new CompressionStream("deflate"));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
function raw(total,seed){
  const a=new Uint8Array(total);
  for(let i=0;i<total;i+=2){
    let value=(i/2+seed)%65535;
    if(i===0)value=0;else if(i===2)value=65535;
    a[i]=value&255;a[i+1]=value>>8;
  }
  return a;
}
async function fixture(){
  const pointCount=16,objects=[],compressed=new Map(),source=new Map();
  for(const [name,recordBytes,seed] of [
    ["deterministic.bin.zlib",56,1],["eps-summary.bin.zlib",56,17],["eps-members.bin.zlib",1120,39]]){
    const input=raw(recordBytes*pointCount,seed),parts=[],chunks=[];
    let offset=0;
    for(let cell=0;cell<pointCount;cell++){
      const cellBytes=input.slice(cell*recordBytes,(cell+1)*recordBytes);
      const part=await deflate(cellBytes);
      chunks.push({offset,bytes:part.length,rawBytes:cellBytes.length,
        sha256:await sha256(part),rawSha256:await sha256(cellBytes)});
      parts.push(part);offset+=part.length;
    }
    const packed=new Uint8Array(offset);let pos=0;
    for(const p of parts){packed.set(p,pos);pos+=p.length;}
    compressed.set(name,packed);source.set(name,input);
    objects.push({key:name,recordBytes,bytes:packed.length,sha256:await sha256(packed),
      chunks,segments:[{bytes:packed.length,sha256:await sha256(packed)}]});
  }
  return {manifest:{schema:"mid.ruc.do-offline-manifest.v1",run:RUN,
    sourceSha:SOURCE,sourceProofSha256:PROOF,horizonHours:27,timeCount:28,
    epsMemberCount:20,nativeEpsIncluded:true,pointCount,objects},compressed,source};
}
export default {
  async fetch(request,env){
    // Without this *local-only test binding*, all HTTP routes are forbidden.
    if(env.MID_RUC_DO_QA_LOCAL_ONLY!==ONLY)return new Response("NO QA access",{status:403});
    const path=new URL(request.url).pathname;
    const run=env.RUNS.get(env.RUNS.idFromName(RUN));
    const coordinator=env.COORD.get(env.COORD.idFromName("mid-ruc-qa-coordinator"));
    if(path==="/qa/status"&&request.method==="GET")
      return Response.json({pointer:await coordinator.activeQa(),productionApproved:false,activationAuthorized:false});
    if(path==="/qa/demo"&&request.method==="POST"){
      const f=await fixture();await run.beginQa(f.manifest);
      for(const [key,bytes] of f.compressed)await run.putSegmentQa(key,0,bytes);
      const receipt=await run.sealQa();
      const promoted=await coordinator.promoteQa(RUN,0,receipt.proof);
      const cell=7,point=await run.readCellsQa(cell);
      let exact=true;
      for(const o of f.manifest.objects){
        const input=f.source.get(o.key).slice(cell*o.recordBytes,(cell+1)*o.recordBytes);
        const output=point.products[o.key];
        exact=exact&&output.length===input.length&&output.every((b,i)=>b===input[i]);
      }
      return Response.json({sourceSynthetic:true,sourceBytesAreOriginalDwd:false,pointCount:16,
        horizonHours:27,epsMemberCount:20,hasRealZeroAndNoDataSentinel:true,
        pointerGeneration:promoted.generation,pointerRun:promoted.run,
        pointBytesIdentical:exact,productionApproved:false,activationAuthorized:false});
    }
    if(path==="/qa/stale"&&request.method==="POST"){
      const receipt=await run.getSealReceiptQa();
      try{
        await coordinator.promoteQa(RUN,0,receipt.proof);
        return Response.json({staleWriterRejected:false},{status:500});
      }catch(e){
        return Response.json({staleWriterRejected:/stale pointer writer/.test(e.message),productionApproved:false});
      }
    }
    return new Response("local QA route not found",{status:404});
  }
};