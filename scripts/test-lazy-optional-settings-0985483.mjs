import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const panels=[
 {file:'ICloudBackupSettings',name:'ICloudBackupSettings',named:'ICloudBackupSettings',fallback:'iCloud-Sicherung wird geladen …',eager:"import {ICloudBackupSettings} from './ICloudBackupSettings';"},
 {file:'WeatherTwinSettings',name:'WeatherTwinSettingsPanel',named:'WeatherTwinSettings',fallback:'Wetterzwilling-Einstellungen werden geladen …',eager:"import {WeatherTwinSettings as WeatherTwinSettingsPanel} from './WeatherTwinSettings';"},
 {file:'DataConnectionDiagnostics',name:'DataConnectionDiagnostics',named:'DataConnectionDiagnostics',fallback:'Verbindungsdiagnose wird geladen …',eager:"import {DataConnectionDiagnostics} from './DataConnectionDiagnostics';"},
];
for(const p of panels){
 const panel=await readFile(new URL(`../src/${p.file}.tsx`,import.meta.url),'utf8');
 const lazy=`const Lazy${p.name}=lazy(()=>import('./${p.file}').then(module=>({default:module.${p.named}})));`;
 assert.ok(app.includes(lazy),'Lazy import missing: '+p.name);
 assert.ok(!app.includes(p.eager),'Eager UI import must not remain: '+p.name);
 assert.equal(app.split(lazy).length-1,1,'Exactly one async boundary: '+p.name);
 assert.ok(app.includes(`function ${p.name}(props:Parameters<typeof import('./${p.file}').${p.named}>[0])`),'Original prop contract retained: '+p.name);
 assert.ok(app.includes(`<Lazy${p.name} {...props}/>`),'All props forwarded: '+p.name);
 assert.ok(app.includes(`role="status" aria-live="polite">${p.fallback}`),'Accessible fallback missing: '+p.name);
 assert.ok(panel.includes(`export function ${p.named}(`),'Original named export unchanged: '+p.name);
}
assert.ok(app.includes("section==='quality'&&<div className=\"settings-section-stack\""),'Quality section remains gated');
assert.ok(app.includes("section==='sync'&&<div className=\"settings-section-stack\""),'Sync section remains gated');
for(const call of ["<ICloudBackupSettings advancedMode={layoutMode==='advanced'}/>","<WeatherTwinSettingsPanel advancedMode={layoutMode==='advanced'}/>","<DataConnectionDiagnostics location={currentLocation}/>"])assert.ok(app.includes(call),'Existing settings render path changed: '+call);
assert.ok(app.includes("import {DeviceSyncSettings} from './DeviceSyncSettings';"),'Critical device pairing UI must remain eager');
console.log('Optional settings modules: lazy import, preserved props/section gates, and accessible fallback PASS');
