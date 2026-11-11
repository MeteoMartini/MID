#!/usr/bin/env node
// Seeded property probes over MID's *actual* release versioning implementation.
import assert from 'node:assert/strict';
import {parseMidVersion,makeProposedVersion} from '../tools/ci/mid-release-version-proposal.mjs';
let seed=0x85_455_111;const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed;};
let tested=0;
for(let i=0;i<512;i++){
  const x=next()%9,y=next()%90,z=next()%900,w=next()%20000;
  const base=[x,y,z,w].join('.');
  assert.deepEqual(parseMidVersion(base),[x,y,z,w]);
  assert.deepEqual(parseMidVersion(makeProposedVersion(base,'maintenance')),[x,y,z,w+1]);
  assert.deepEqual(parseMidVersion(makeProposedVersion(base,'feature')),[x,y,z+1,0]);
  assert.throws(()=>makeProposedVersion(base,'unknown'));
  assert.throws(()=>makeProposedVersion(base,'breaking'));
  tested+=5;
}
for(const malformed of ['0.9.85','0.9.85.-1','0.9.85.01','0.9.85.NaN','0.9.85.9007199254740992','0.9.85.4.1','','v0.9.85.5']){
  assert.throws(()=>parseMidVersion(malformed));tested++;
}
console.log('MID four-part version property invariants: '+tested+' assertions PASS; deterministic seeded probes; no release authorization.');
