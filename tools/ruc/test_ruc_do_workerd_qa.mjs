/** Local Miniflare/workerd integration smoke: no remote resources or Cloudflare account. */
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
import {Miniflare} from "miniflare";
const entry=fileURLToPath(new URL("./ruc_do_workerd_entry_qa.mjs",import.meta.url));
const mf=new Miniflare({
  modules:true,scriptPath:entry,compatibilityDate:"2026-07-30",
  bindings:{MID_RUC_DO_QA_LOCAL_ONLY:"MID-RUC-LOCAL-ONLY-NO-PRODUCTION"},
  durableObjects:{
    RUNS:{className:"RucRunQa",useSQLite:true},
    COORD:{className:"RucCoordQa",useSQLite:true},
  },
});
try{
  const initial=await mf.dispatchFetch("http://localhost/qa/status");
  assert.equal(initial.status,200,"initial DO pointer lookup failed");
  assert.equal((await initial.json()).pointer.generation,0);
  const response=await mf.dispatchFetch("http://localhost/qa/demo",{method:"POST"});
  if(response.status!==200)throw Error("workerd local failure: "+await response.text());
  const result=await response.json();
  assert.equal(result.pointBytesIdentical,true);
  assert.equal(result.horizonHours,27);
  assert.equal(result.epsMemberCount,20);
  assert.equal(result.pointerGeneration,1);
  assert.equal(result.pointerRun,"2026-11-09T14:00");
  assert.equal(result.productionApproved,false);
  assert.equal(result.activationAuthorized,false);
  const stale=await mf.dispatchFetch("http://localhost/qa/stale",{method:"POST"});
  assert.equal(stale.status,200);
  assert.equal((await stale.json()).staleWriterRejected,true);
  const after=await mf.dispatchFetch("http://localhost/qa/status");
  assert.equal((await after.json()).pointer.generation,1);
  console.log(JSON.stringify({schema:"mid.ruc.do.workerd-local-qa.v1",
    workerdLocal:true,sourceSynthetic:true,realOriginalDwdBytes:false,
    timeCount:28,epsMemberCount:20,pointByteParity:true,lastGoodCas:true,
    staleWriterRejected:true,cloudflareAccountTouched:false,
    productionApproved:false,activationAuthorized:false}));
}finally{await mf.dispose();}