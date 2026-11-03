import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';

// Run after: node node_modules/vite/bin/vite.js build --manifest
const manifest=JSON.parse(readFileSync('dist/.vite/manifest.json','utf8'));
const root='src/UnifiedWeatherMap.tsx',reachable=new Set();
function visit(key){
 if(reachable.has(key))return;
 assert.ok(manifest[key],'Missing build entry: '+key);
 reachable.add(key);
 for(const dependency of manifest[key].imports??[])visit(dependency);
}
visit(root);
const html=readFileSync('dist/index.html','utf8');
const exports=['cloudWeatherExport','nativeModelMapExport','precipitationTotalsExport'];
const rows=exports.map(name=>{
 const key='src/'+name+'.ts';
 assert.ok(manifest[key]?.isDynamicEntry,'Exporter must have a deferred entry: '+key);
 assert.ok(!reachable.has(key),'Exporter must not be reachable through static map imports: '+key);
 assert.ok(manifest[root].dynamicImports.includes(key),'Map must retain export action: '+key);
 const seen=new Set();
 function offline(dependency){
  if(seen.has(dependency)||reachable.has(dependency))return;seen.add(dependency);
  assert.ok(html.includes('href="./'+manifest[dependency].file+'"'),'Deferred export dependency must remain discoverable by the offline shell: '+dependency);
  for(const child of manifest[dependency].imports??[])offline(child);
 }
 offline(key);
 return {module:name,file:manifest[key].file,bytes:statSync('dist/'+manifest[key].file).size};
});
console.log(JSON.stringify({staticMapDependencyEntries:reachable.size,deferredExportEntryBytes:rows.reduce((sum,row)=>sum+row.bytes,0),exports:rows},null,2));
