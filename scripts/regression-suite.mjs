import {readdir,readFile} from 'node:fs/promises';
import path from 'node:path';

// One complete inventory protects discovery, required checks and reporting.
export async function regressionSuite(root){
 const tests=(await readdir(path.join(root,'scripts'))).filter(name=>/^test-.*\.mjs$/i.test(name)).sort();
 const baseline=JSON.parse(await readFile(path.join(root,'MID_BASELINE.json'),'utf8'));
 const paths=tests.map(name=>`scripts/${name}`);
 for(const key of ['requiredRegressionTests','regressionTests']){
  const listed=baseline[key]??[],missing=paths.filter(name=>!listed.includes(name)),stale=listed.filter(name=>!paths.includes(name));
  if(new Set(listed).size!==listed.length||missing.length||stale.length)throw new Error(`${key}: Regression inventory differs (missing: ${missing.join(', ')}, stale: ${stale.join(', ')}).`);
 }
 return tests;
}
