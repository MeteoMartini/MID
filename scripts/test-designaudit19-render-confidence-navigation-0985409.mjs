import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {build,transformSync} from 'esbuild';
const root=new URL('../',import.meta.url);
const read=p=>readFileSync(new URL(p,root),'utf8');
const compiled=transformSync(read('src/mapRendererReadiness.ts'),{loader:'ts',format:'esm'}).code;
const {mapRendererReadiness:readiness}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
for(const [ready,hasTimes,status,expectedTone,expectedLabel] of [
 [true,true,'error','unavailable','Karte nicht darstellbar'],
 [true,true,'loading','loading','Daten bereit · Karte startet'],
 [true,true,'ready','ready','Karte und Daten bereit'],
 [false,true,'ready','loading','Kartenebene lädt'],
 [true,false,'ready','unavailable','Keine Kartenzeitstände'],
 [false,false,'error','unavailable','Karte nicht darstellbar']
]){
 const result=readiness(ready,hasTimes,status);
 assert.equal(result.tone,expectedTone);
 assert.equal(result.label,expectedLabel);
 assert(result.detail.length>=12);
}
const core=read('src/MapLibreCore.tsx'),compat=read('src/MapLibreLegacyCompat.tsx'),radar=read('src/RadarPanel.tsx');
assert(core.includes("statusRef.current?.('ready')")&&core.includes("statusRef.current?.('error')"));
assert(core.includes("webglcontextlost")&&core.includes("removeEventListener('webglcontextlost'"));
assert(compat.includes('onStatus={onStatus}'));
assert(radar.includes('mapRendererReadiness(frameReady,frames.length>0,rendererStatus)'));
assert(radar.includes("mapReadiness.tone==='ready'")&&radar.includes('onStatus={setRendererStatus}'));
assert(!radar.includes("'Hauptebene bereit'"));
const fc=read('src/ForecastConfidence.tsx');
assert(fc.includes('Übereinstimmung vorhandener Modelle'));
assert(fc.includes('sourceCoverage.families')&&fc.includes('sourceCoverage.freshFamilies'));
assert(fc.includes('Index ist keine Trefferwahrscheinlichkeit'));
assert(fc.includes('Ensembleübereinstimmung hoch · Datenbasis')&&fc.includes('weakestWindowDataQuality(ordered,primaryWindow)'),'agreement label must explicitly show same-window quality');
const confidenceBundle=await build({entryPoints:['src/ensembleAssessment.ts'],bundle:true,write:false,platform:'node',format:'esm',logLevel:'silent'});
const {weakestWindowDataQuality}=await import('data:text/javascript;base64,'+Buffer.from(confidenceBundle.outputFiles[0].text).toString('base64'));
const evidenceDays=[{date:'2026-11-02',dataQuality:'good'},{date:'2026-11-03',dataQuality:'poor'},{date:'2026-11-04',dataQuality:'limited'},{date:'2026-11-05',dataQuality:'missing'}];
assert.equal(weakestWindowDataQuality(evidenceDays,{start:'2026-11-02',end:'2026-11-04'}),'poor','weakest data basis of the displayed interval');
assert.equal(weakestWindowDataQuality([...evidenceDays].reverse(),{start:'2026-11-02',end:'2026-11-04'}),'poor','input order is irrelevant');
assert.equal(weakestWindowDataQuality(evidenceDays,{start:'2026-11-02',end:'2026-11-02'}),'good','later poor data must not taint an earlier interval');
assert.equal(weakestWindowDataQuality(evidenceDays,{start:'2026-11-05',end:'2026-11-05'}),'missing','no evidence cannot mean good evidence');
assert.equal(weakestWindowDataQuality(evidenceDays,{start:'2026-11-07',end:'2026-11-08'}),null,'no covered days cannot imply good quality');
const app=read('src/App.tsx');
assert(app.includes('aria-label="Einstellungsbereich direkt wählen"'));
assert(app.includes('value={section}')&&app.includes('setSection(event.target.value as SettingsSection)'));
const responsiveCss=read('src/midC18AuditFollowup.css');
assert(responsiveCss.includes('@media(max-width:430px)')&&responsiveCss.includes('.settings-titlebar .settings-section-direct{order:3;flex:0 0 100%'));
console.log('DA19-03/08/15 · renderer truth, original model coverage, accessible settings selector: passed');

assert(app.includes('className="current-nowcard-timebasis" style=')&&app.includes('overflowWrap:"anywhere"'),'near-term PoP reference interval must wrap without altering canonical CSS cascade');
