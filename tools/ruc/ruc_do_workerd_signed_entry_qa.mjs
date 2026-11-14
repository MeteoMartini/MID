/**
 * Local workerd ONLY: independent signed-upload gate, immutable run and
 * coordinator Durable Objects. No production Worker routes or billable APIs.
 */
import {DurableObject} from "cloudflare:workers";
import {RucRunCoreQa,RucCoordinatorCoreQa} from "./ruc_do_worker_core_qa.mjs";
import {verifySignedManifestQa} from "./ruc_do_attestation_qa.mjs";
const LOCAL_ONLY="MID-DO-SIGNED-LOCAL-QA-ONLY";
const RUN=/^20\d\d-\d\d-\d\dT\d\d:00$/;
function fail(reason){throw Error("ATT-QA BLOCKED: "+reason);}
function b64(s) {
  if(typeof s!=="string"||s.length>600000||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))
    fail("bad base64 payload");
  const v=atob(s);return Uint8Array.from(v,x=>x.charCodeAt(0));
}
export class RucAttestedRunQa extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.env=env;this.core=new RucRunCoreQa(ctx);}
  async beginAttestedQa(manifest,signature){
    // REQUIRED: no caller-supplied SHA metadata alone may admit a run.
    const verified=await verifySignedManifestQa(manifest,signature,this.env.TRUSTED_QA_ED25519_PUBLIC_KEY);
    const r=this.core.beginQa(manifest);
    return {...r,verifiedSignerForQa:verified.verified,productionApproved:false};
  }
  putSegmentQa(name,index,data){return this.core.putSegmentQa(name,index,data);}
  sealQa(){return this.core.sealQa();}
  getSealReceiptQa(){return this.core.getSealReceiptQa();}
  readCellsQa(cell,fields){return this.core.readCellsQa(cell,fields);}
}
export class RucAttestedCoordinatorQa extends DurableObject {
  constructor(ctx,env){super(ctx,env);this.core=new RucCoordinatorCoreQa(ctx,env);}
  activeQa(){return this.core.activeQa();}
  promoteQa(run,generation,proof){return this.core.promoteQa(run,generation,proof);}
}
export default {
  async fetch(request,env){
    if(env.MID_DO_SIGNED_QA_LOCAL_ONLY!==LOCAL_ONLY)return new Response("Forbidden",{status:403});
    const url=new URL(request.url);
    const coordinator=env.COORD.get(env.COORD.idFromName("qa-only-coordinator"));
    if(url.pathname==="/qa/status"&&request.method==="GET")
      return Response.json({active:await coordinator.activeQa(),productionApproved:false,activationAuthorized:false});
    if(url.pathname==="/qa/ingest"&&request.method==="POST"){
      try{
        const size=Number(request.headers.get("content-length")||0);
        if(size>120000||size<0)fail("body size bound");
        const packet=await request.json();
        const m=packet?.manifest;
        if(!m||typeof m.run!=="string"||!RUN.test(m.run))fail("bad model run");
        if(!Array.isArray(packet.segments)||packet.segments.length>1200)fail("bad segment count");
        const run=env.RUNS.get(env.RUNS.idFromName(m.run));
        await run.beginAttestedQa(m,packet.signature);
        for(const item of packet.segments){
          if(typeof item?.name!=="string"||!Number.isSafeInteger(item.index))fail("bad segment key");
          await run.putSegmentQa(item.name,item.index,b64(item.data));
        }
        const receipt=await run.sealQa();
        const old=await coordinator.activeQa();
        const active=await coordinator.promoteQa(m.run,old.generation,receipt.proof);
        return Response.json({active,qaOnly:true,sourceSynthetic:true,
          productionApproved:false,activationAuthorized:false});
      }catch(err){
        return Response.json({rejected:true,reason:String(err.message||err).slice(0,180),
          productionApproved:false,activationAuthorized:false},{status:422});
      }
    }
    if(url.pathname==="/qa/cell"&&request.method==="GET"){
      try{
        const active=await coordinator.activeQa();if(!active.run)fail("no last-good");
        const cell=Number(url.searchParams.get("cell"));
        if(!Number.isSafeInteger(cell)||cell<0)fail("invalid cell");
        const run=env.RUNS.get(env.RUNS.idFromName(active.run));
        const result=await run.readCellsQa(cell);
        return Response.json(result);
      }catch(err){
        return Response.json({rejected:true,reason:String(err.message||err).slice(0,150),
          productionApproved:false},{status:422});
      }
    }
    return new Response("No QA route",{status:404});
  }
};