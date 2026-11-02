import test from 'node:test';
import assert from 'node:assert/strict';
import {FAST_POINTER_SCHEMA,validRun,makeNextPointer,casFastPointer,casRollbackFastPointer} from './ruc_fast_cas.mjs';
const a='a'.repeat(64),b='b'.repeat(64),c='c'.repeat(64),s='d'.repeat(40);
const grant=async()=>true;
const row=(fast='2026-11-02T08:00',full='2026-11-02T07:00')=>({schema:FAST_POINTER_SCHEMA,stableSha:s,siteSha256:a,primaryManifestSha256:b,fastManifestSha256:c,primaryRun:full,fastRun:fast,horizonHours:6,epsAvailable:false,mode:'shadow',rootPrimaryNeverChanged:true,fullEps20Readmission:true});
class Bucket {
  constructor(){this.current=null;this.revision=0;this.races=[];}
  async get(){if(!this.current)return null;let snapshot={...this.current};return{etag:snapshot.etag,text:async()=>snapshot.text};}
  async put(key,body,opts){const condition=opts.onlyIf;let matches=this.current?condition.etagMatches===this.current.etag:condition.etagDoesNotMatch==='*';if(!matches)return null;this.revision++;const etag=String(this.revision);this.current={etag,text:body};return{etag};}
}
test('invalid UTC/nonexistent dates rejected',()=>{for(const run of ['2026-02-30T00:00','2026-11-02T08:30','2026-11-02T08:00Z','2026-11-02T08:00:00'])assert.throws(()=>validRun(run));});
test('unverified grant and fake EPS never publish',async()=>{const store=new Bucket();await assert.rejects(casFastPointer(store,row(),{}),/authorization/);await assert.rejects(casFastPointer(store,{...row(),epsAvailable:true},{verifyGrant:grant}),/EPS/);assert.equal(store.current,null);});
test('new pointer strictly verifies full+fast UTC and SHA',()=>{assert.throws(()=>makeNextPointer(null,{...row(),fastManifestSha256:''}),/digest/);assert.throws(()=>makeNextPointer(null,row('2026-11-02T06:00')),/downgrade/);assert.equal(makeNextPointer(null,row()).generation,1)});
test('first shadow CAS and same hash readback succeed',async()=>{const store=new Bucket();const p=await casFastPointer(store,row(),{verifyGrant:grant});assert.equal(p.committed,true);assert.equal(p.current.generation,1);});
test('first active Fast publish fails closed before any R2 write, preserving rollback target',async()=>{
 const store=new Bucket();
 await assert.rejects(casFastPointer(store,{...row(),mode:'active'},{verifyGrant:grant}),/first Fast pointer must be shadow/);
 assert.equal(store.current,null);
 const shadow=await casFastPointer(store,row(),{verifyGrant:grant});
 assert.equal(shadow.current.mode,'shadow');
 const active=await casFastPointer(store,{...row(),mode:'active'},{verifyGrant:grant});
 assert.equal(active.current.mode,'active');
 const reverted=await casRollbackFastPointer(store,active,{verifyGrant:grant});
 assert.equal(reverted.rolledBack,true);
 assert.equal(reverted.pointer.mode,'shadow');
 assert.equal(reverted.pointer.generation,3);
});
test('stale fast candidate cannot replace newer',async()=>{const store=new Bucket();await casFastPointer(store,row(),{verifyGrant:grant});await assert.rejects(casFastPointer(store,row('2026-11-02T07:00'),{verifyGrant:grant}),/stale/);});
test('simulated concurrent conflicting conditional write loses',async()=>{const store=new Bucket();const saved=store.put.bind(store);let inject=true;store.put=async(k,v,o)=>{if(inject){inject=false;await saved(k,JSON.stringify(makeNextPointer(null,row('2026-11-02T09:00'))),{onlyIf:{etagDoesNotMatch:'*'}});}return saved(k,v,o)};const result=await casFastPointer(store,row(),{verifyGrant:grant});assert.equal(result.committed,false);assert.equal(result.reason,'lost-atomic-CAS');});
test('rollback requires exact ETag and preserves monotonic generation',async()=>{const store=new Bucket();await casFastPointer(store,row(),{verifyGrant:grant});const change=await casFastPointer(store,row('2026-11-02T09:00'),{verifyGrant:grant});const reverted=await casRollbackFastPointer(store,change,{verifyGrant:grant});assert.equal(reverted.rolledBack,true);assert.equal(reverted.pointer.generation,3);assert.equal(reverted.pointer.fastRun,'2026-11-02T08:00');});
test('stale rollback refuses newer writer',async()=>{const store=new Bucket();await casFastPointer(store,row(),{verifyGrant:grant});const change=await casFastPointer(store,row('2026-11-02T09:00'),{verifyGrant:grant});await casFastPointer(store,row('2026-11-02T10:00'),{verifyGrant:grant});const revert=await casRollbackFastPointer(store,change,{verifyGrant:grant});assert.equal(revert.rolledBack,false);assert.match(revert.reason,/newer/);});
test('first pointer cannot fabricate rollback target',async()=>{const store=new Bucket();const p=await casFastPointer(store,row(),{verifyGrant:grant});await assert.rejects(casRollbackFastPointer(store,p,{verifyGrant:grant}),/no safe older/);});
