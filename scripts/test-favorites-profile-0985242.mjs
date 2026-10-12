import assert from 'node:assert/strict';
import {build,transform} from 'esbuild';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'mid-favorites242-'));
try{
 await build({entryPoints:['src/dashboardModules.ts'],outdir:dir,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const modules=await import(pathToFileURL(join(dir,'dashboardModules.js')));
 const defaults=modules.defaultDashboardModuleSettings();assert.equal(defaults.order[0],'current');assert.equal(defaults.enabled.favorites,true);
 const migrated=modules.normalizeDashboardModuleSettings({order:['forecast','current','current','unknown'],enabled:{current:false,favorites:false,climate:false}});
 assert.equal(migrated.enabled.favorites,true);assert.equal(migrated.enabled.current,true);assert.equal(migrated.enabled.climate,false);assert.equal(migrated.order[0],'forecast');assert.equal(new Set(migrated.order).size,migrated.order.length);assert.equal(migrated.order.filter(id=>id==='favorites').length,1);
 const source=readFileSync('src/EventPlannerPanel.tsx','utf8'),helper=source.slice(source.indexOf('function localToday('),source.indexOf('function addDays('));
 const code=(await transform(helper+'\nexport{localToday}',{loader:'ts',format:'esm'})).code,{localToday}=await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'));
 const RealDate=globalThis.Date,oldTimezone=process.env.TZ;process.env.TZ='America/Los_Angeles';
 try{for(const [instant,berlin,losAngeles] of [['2026-10-12T00:30Z','2026-10-12','2026-10-11'],['2026-10-12T23:30Z','2026-10-13','2026-10-12'],['2026-10-25T01:30Z','2026-10-25','2026-10-24']]){globalThis.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[instant]))}};assert.equal(localToday('Europe/Berlin'),berlin);assert.equal(localToday('America/Los_Angeles'),losAngeles)}}finally{globalThis.Date=RealDate;if(oldTimezone===undefined)delete process.env.TZ;else process.env.TZ=oldTimezone}
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('MID242: existing preferences migrate to a unique enabled favorites page; planner dates follow destination timezone across midnight and DST.');
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-favorites-app-browser-0985242.mjs'],{stdio:'inherit',timeout:360000});
