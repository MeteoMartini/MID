import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';

const root=new URL('../',import.meta.url);
const bundled=await build({
 entryPoints:[new URL('src/shortTermFogRisk.ts',root).pathname],
 bundle:true,platform:'node',format:'esm',target:'node22',write:false,logLevel:'silent'
});
const moduleUrl='data:text/javascript;base64,'+Buffer.from(bundled.outputFiles[0].text).toString('base64');
const {shortTermFogRisk:risk}=await import(moduleUrl);

const augustMorning={code:3,visibility:8000,temperature:18,dewPoint:16,humidity:92,wind:5,cloud:100,lowCloud:97,isDay:true,epoch:Date.UTC(2026,7,18,8),precipitation:2.6};
const humidHaze=risk(augustMorning);
assert.equal(humidHaze.kind,'mist','8 km Sicht bei feuchter Luft ist DWD-konform feuchter Dunst, nicht Nebel.');
assert.equal(humidHaze.reason,'Feuchter Dunst');
assert.ok(humidHaze.score>=20&&humidHaze.score<38,'Feuchter Dunst darf nicht als hohes Nebelrisiko erscheinen.');

const denseFog={...augustMorning,code:45,visibility:700,humidity:98,temperature:12,dewPoint:11.5,wind:2,isDay:false,epoch:Date.UTC(2026,9,18,4)};
const fog=risk(denseFog);
assert.equal(fog.kind,'fog');
assert.equal(fog.reason,'Nebel');
assert.ok(fog.score>=60,'Expliziter Nebel mit Sicht <1 km muss hohe Einschränkung bleiben.');

const dryHaze=risk({...augustMorning,code:45,visibility:4000,humidity:65,temperature:14,dewPoint:7,wind:5});
assert.equal(dryHaze.kind,'haze');
assert.equal(dryHaze.reason,'Trockener Dunst');

const calmNight={...augustMorning,code:2,visibility:9000,humidity:98,temperature:13,dewPoint:12.3,wind:2,isDay:false,epoch:Date.UTC(2026,7,18,2),cloud:25,lowCloud:10};
const riskOnly=risk(calmNight);
assert.equal(riskOnly.kind,'fog-risk','Nahe Sättigung ohne Sichttrübung darf nur ein Nebelrisiko, keinen vorhandenen Nebel erzeugen.');
assert.equal(riskOnly.reason,'Nebelrisiko');
assert.ok(riskOnly.score>=20,'Nahe Sättigung in schwachwindiger Nacht muss als mögliches Nebelrisiko erhalten bleiben.');

const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8')),baseline=JSON.parse(await readFile(new URL('MID_BASELINE.json',root),'utf8')),test='scripts/test-short-term-fog-risk-09581.mjs';
assert.equal(pkg.scripts?.['test:short-term-fog-risk'],'node '+test);
assert.ok(baseline.requiredRegressionTests?.includes(test));
assert.ok(baseline.regressionTests?.includes(test));
console.log('Kurzfrist-Sichttrübung geprüft: WMO-Nebel <1 km, DWD-Dunstklassen und getrenntes zukünftiges Nebelrisiko bleiben wirksam.');
