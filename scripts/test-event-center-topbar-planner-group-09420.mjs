import fs from 'node:fs';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {transformSync} from 'esbuild';
const app=fs.readFileSync('src/App.tsx','utf8');
const center=fs.readFileSync('src/eventCenter.ts','utf8');
const modules=fs.readFileSync('src/dashboardModules.ts','utf8');
const settings=fs.readFileSync('src/DashboardModuleSettings.tsx','utf8');
const styles=fs.readFileSync('src/styles.css','utf8');
const failures=[];
const need=(source,label,token)=>{if(!source.includes(token))failures.push(`${label} fehlt: ${token}`)};
for(const token of [
 'function EventCenterHeaderButton(',
 'className={`event-center-header-button${hasUpdate?',
 "{id:'planning',label:'Planen & Profile',modules:['event-planner','travel-planner','mountain','water']}",
 '<EventCenterHeaderButton onOpenPlanner={onOpenEventPlanner} unit={unit}/>',
 "navigateToDashboardSection('event-planner')"
])need(app,'App',token);
if(app.includes('DashboardEventCenterTeaser'))failures.push('Großer Dashboard-Event-Center-Teaser ist noch aktiv.');
for(const token of [
 "{id:'event-planner',label:'Eventplaner'",
 "{id:'travel-planner',label:'Reiseplaner'"
])need(modules,'Dashboardmodule',token);
need(settings,'Einstellungen','checked={settings.enabled[id]}');
for(const token of [
 'function statusChangeSummary(previous:EventStatus,next:EventStatus)',
 'Bewertung ${direction}: jetzt „${statusLabel(next)}“ (zuvor „${statusLabel(previous)}“).',
 'function normalizeLegacyChangeSummary(summary:string)',
 'const normalizedSummary=rawChange?normalizeLegacyChangeSummary'
])need(center,'Event-Center-Text',token);
for(const token of [
 '.event-center-header-button.has-update{',
 '.event-center-header-popover{',
 '.event-center-header-button>i{'
])need(styles,'Styles',token);

const extract=(name)=>{
 const start=app.indexOf('function '+name+'(');
 assert.ok(start>=0,'Source function missing: '+name);
 const end=app.indexOf('\n}',start);
 assert.ok(end>start,'Source function boundary missing: '+name);
 return app.slice(start,end+2);
};
const source=[extract('finiteProvidedNumber'),extract('eventCenterMetricNumber'),extract('normalizeWaterConfig'),'globalThis.__audit={finiteProvidedNumber,eventCenterMetricNumber,normalizeWaterConfig};'].join('\n');
const sandbox={
 formatDecimal:(value,digits)=>Number(value).toFixed(digits),
 defaultWaterConfig:()=>({enabled:false,waterType:'auto',activity:'general',maxWaveHeight:2,maxGustKt:35,minWaterTemperature:12}),
};
vm.runInNewContext(transformSync(source,{loader:'ts',format:'iife',target:'es2022'}).code,sandbox);
const {finiteProvidedNumber,eventCenterMetricNumber,normalizeWaterConfig}=sandbox.__audit;
for(const value of [null,undefined,'', '   ',false,Number.NaN,Number.POSITIVE_INFINITY]){
 assert.equal(finiteProvidedNumber(value),null,'Missing/invalid preference must not become zero');
 assert.equal(eventCenterMetricNumber(value),'–','Missing event value must have an explicit unavailable marker');
}
assert.equal(eventCenterMetricNumber(0),'0','Real zero is still a measured/modelled value');
assert.equal(eventCenterMetricNumber(12.34,1),'12.3');
assert.equal(finiteProvidedNumber('0'),0,'Legacy numeric string zero is intentional');
const water=normalizeWaterConfig({enabled:true,maxWaveHeight:null,maxGustKt:'',minWaterTemperature:false});
assert.equal(water.maxWaveHeight,2,'Missing persisted wave threshold uses default, never minimum');
assert.equal(water.maxGustKt,35,'Empty persisted wind threshold uses default, never minimum');
assert.equal(water.minWaterTemperature,12,'Invalid boolean stored temperature uses default');
assert.equal(normalizeWaterConfig({maxWaveHeight:0,maxGustKt:0}).maxWaveHeight,.1,'Explicit real zero still follows the documented lower safety bound');
assert.ok(app.includes('finiteProvidedNumber(summary.uvMax)!==null'),'Missing UV index must not become UVI 0 in the header');
assert.ok(app.includes('role="heading" aria-level={2}'),'Drawer heading must announce correct section hierarchy');

if(failures.length){console.error('MID v0.9.42.0 Event-Center-/Planer-Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Event-Center geprüft: kompakt in der Top-Leiste; Event-, Reise-, Berg- und Wasserplanung sind unter „Planen & Profile“ gebündelt und funktional geschützt.');
