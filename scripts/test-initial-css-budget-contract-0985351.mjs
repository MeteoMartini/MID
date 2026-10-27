import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initialCssAssetStats} from './lib/initialCssBudget.mjs';

const limits=JSON.parse(readFileSync(new URL('../MID_PERFORMANCE_BASELINE.json',import.meta.url),'utf8')).limits;
for(const name of ['initialCssBytes','initialCssGzipBytes','initialCssBrotliBytes']){
 assert.ok(Number.isInteger(limits[name])&&limits[name]>0,'Startup CSS hard budget is missing: '+name);
}
assert.ok(limits.initialCssGzipBytes<limits.cssGzipBytes,'Initial CSS gzip must be stricter than total CSS');
const assets=[
 {file:'assets/index-a.css',extension:'.css',bytes:100,gzipBytes:45,brotliBytes:30},
 {file:'assets/extra-b.css',extension:'.css',bytes:55,gzipBytes:35,brotliBytes:23},
 {file:'assets/dynamic-c.css',extension:'.css',bytes:1000,gzipBytes:400,brotliBytes:250}
];
const html='<link rel="stylesheet" href="./assets/index-a.css"><link rel="stylesheet" href="./assets/extra-b.css"><link rel="stylesheet" href="./assets/index-a.css">';
const stats=initialCssAssetStats(html,assets);
assert.equal(stats.entries.length,2,'Duplicate entry CSS must be counted only once');
assert.deepEqual([stats.bytes,stats.gzipBytes,stats.brotliBytes],[155,80,53],'All initial assets count, lazy CSS does not');
assert.throws(()=>initialCssAssetStats('<link rel="stylesheet" href="./assets/missing.css">',assets),/fehlt/);
assert.throws(()=>initialCssAssetStats('<link rel="stylesheet" href="https://cdn.example/remote.css">',assets),/Externes/);
assert.throws(()=>initialCssAssetStats('<main>no CSS</main>',assets),/kein auswertbares/);
console.log('Initial CSS budgets: multiple assets, duplicates, lazy exclusion, Missing and external guard checked.');
