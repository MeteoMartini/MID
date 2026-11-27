import {test} from 'node:test';
import assert from 'node:assert/strict';
import {ownershipSnapshot,compareCssOwnership} from './compare-design-css-ownership-0985515.mjs';

function snapshot({sourceCount=2,sourceBytes=130,rules=4,important=2,collisions=2,different=2,priority=1}={}){
 const rows=[{file:'a.css',sourceBytes, rules,important,laterExactMatches:collisions,
  laterDifferentValue:different,laterImportanceDifferences:priority}];
 for(let i=1;i<sourceCount;i++)rows.push({file:'sub'+i+'.css',sourceBytes:0,rules:0,important:0,laterExactMatches:0,laterDifferentValue:0,laterImportanceDifferences:0});
 return {schema:'mid.css.ownership.diagnostic.v1',status:'DIAGNOSTIC_ONLY_NO_CSS_MOVE_APPROVAL',
  summary:{sourceCount,sourceBytes,rules,importantDeclarations:important},sources:rows};
}
const base=snapshot();
test('unchanged diagnostic has no cascade growth',()=>{
 const result=compareCssOwnership(base,structuredClone(base));
 assert.equal(result.status,'PASS_NO_CASCADE_SIGNAL_GROWTH');
 assert.ok(result.rows.every(x=>x.delta===0));
});
test('removing overrides and important declarations reduces risk signals',()=>{
 const result=compareCssOwnership(base,snapshot({sourceBytes:110,rules:3,important:1,collisions:1,different:1,priority:0}));
 assert.equal(result.status,'PASS_NO_CASCADE_SIGNAL_GROWTH');
});
test('more important declarations block even if source bytes shrink',()=>{
 const result=compareCssOwnership(base,snapshot({sourceBytes:100,important:3}));
 assert.equal(result.status,'FAIL_CASCADE_SIGNAL_GROWTH');
 assert.equal(result.rows.find(x=>x.key==='importantDeclarations').ok,false);
});
test('more cross-file conflict signals block',()=>{
 const result=compareCssOwnership(base,snapshot({collisions:3,different:3,priority:1}));
 assert.equal(result.status,'FAIL_CASCADE_SIGNAL_GROWTH');
});
test('more CSS manifest source files block',()=>{
 assert.equal(compareCssOwnership(base,snapshot({sourceCount:3})).status,'FAIL_CASCADE_SIGNAL_GROWTH');
});
test('removed audit is not interpreted as zero',()=>{
 assert.throws(()=>ownershipSnapshot(null),/Invalid MID ownership/);
});
test('fake passing status cannot be accepted',()=>{
 const bad=snapshot();bad.status='PASS';
 assert.throws(()=>ownershipSnapshot(bad),/Invalid MID ownership/);
});
test('contradictory rollup is rejected',()=>{
 const bad=snapshot();bad.summary.importantDeclarations++;
 assert.throws(()=>ownershipSnapshot(bad),/Contradictory/);
});
test('duplicate stylesheet owner rows are rejected',()=>{
 const bad=snapshot();bad.sources[1].file='a.css';
 assert.throws(()=>ownershipSnapshot(bad),/duplicate/);
});
test('invalid negative collision counts fail closed',()=>{
 const bad=snapshot();bad.sources[0].laterDifferentValue=-1;
 assert.throws(()=>ownershipSnapshot(bad),/Invalid ownership metric/);
});
test('conflict subset cannot exceed all matches',()=>{
 const bad=snapshot();bad.sources[0].laterDifferentValue=3;
 assert.throws(()=>ownershipSnapshot(bad),/Inconsistent CSS collision/);
});
