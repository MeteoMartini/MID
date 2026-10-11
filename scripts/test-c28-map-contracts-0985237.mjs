import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync,writeFileSync,symlinkSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid-c28-contract-'));
try{
 symlinkSync(join(process.cwd(),'node_modules'),join(dir,'node_modules'),'dir');
 await build({entryPoints:['src/modelPressureCenterData.ts','src/nativeModelFields.ts','src/nativeModelMapExport.ts'],outdir:dir,bundle:true,platform:'node',format:'esm',packages:'external',logLevel:'silent'});
 const centers=await import(pathToFileURL(join(dir,'modelPressureCenterData.js'))),native=await import(pathToFileURL(join(dir,'nativeModelFields.js'))),exports=await import(pathToFileURL(join(dir,'nativeModelMapExport.js')));
 const lats=[47,51.1,55.2],lons=[5.5,10.55,15.6],center={type:'H',lat:51.1,lon:10.55,value:1024,prominence:4};
 assert.ok(centers.validModelPressureCenters([center],lats,lons));
 for(const patch of [{type:'L'},{value:null},{value:1200},{lat:80},{lon:'10'},{prominence:0}])assert.equal(centers.validModelPressureCenters([{...center,...patch}],lats,lons),false);
 const run=new Date(Math.floor(Date.now()/3600000)*3600000).toISOString(),frames=[1,2,3,4,5,6,12,24,48].map(hour=>({hour,time:new Date(Date.parse(run)+hour*3600000).toISOString(),file:`pressure-${String(hour).padStart(3,'0')}.json`,bytes:10,sha256:'a'.repeat(64),intervalHours:0})),index={schema:'mid.icon-d2.fields.v1',run,products:{pressure:{unit:'hPa',frames}}};
 globalThis.fetch=async url=>({ok:true,json:async()=>String(url).includes('latest.json')?{modelFields:{key:'runs/check/model-fields/index.json'}}:index});
 assert.deepEqual((await native.loadNativeIndex(new AbortController().signal)).index.products.pressure.frames.map(f=>f.hour),[1,2,3,4,5,6,12,24,48]);
 const field={schema:'mid.icon-d2.field.v1',run,time:frames[0].time,kind:'pressure',unit:'hPa',scale:.1,lats,lons,values:Array(9).fill(10240),isobars:[],centers:[center]};
 assert.equal(native.validateNativeField(field,index,frames[0],'pressure'),field);
 assert.throws(()=>native.validateNativeField({...field,centers:[{...center,value:null}]},index,frames[0],'pressure'),/Druckzentren/);
 assert.match(exports.nativeFieldSvg(field,'Bodendruck','data:image/png;base64,',[],0),/>H<tspan[^>]*>1024<\/tspan>/);
 delete field.centers;assert.equal(native.validateNativeField(field,index,frames[0],'pressure'),field,'Old immutable snapshots remain readable');
 // A saved selection must survive a missing provider; only user events change it.
 const panel=readFileSync('src/UnifiedWeatherMap.tsx','utf8');assert.ok(!panel.includes('update({modelId:ids[0]'));
 const radar=readFileSync('src/RadarPanel.tsx','utf8');assert.ok(radar.includes('modelLines:unified?initial.modelLines:modelLines'));
}finally{delete globalThis.fetch;rmSync(dir,{recursive:true,force:true})}
console.log('MID-C28 hourly catalogue, pressure-centre validation/export and saved-selection contracts passed.');
