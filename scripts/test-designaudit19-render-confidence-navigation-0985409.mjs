import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transformSync} from 'esbuild';
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
const app=read('src/App.tsx');
assert(app.includes('aria-label="Einstellungsbereich direkt wählen"'));
assert(app.includes('value={section}')&&app.includes('setSection(event.target.value as SettingsSection)'));
console.log('DA19-03/08/15 · renderer truth, original model coverage, accessible settings selector: passed');
