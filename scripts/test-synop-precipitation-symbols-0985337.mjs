import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {transform} from 'esbuild';
const path=new URL('../src/synopPrecipitationSymbols.ts',import.meta.url);
const source=readFileSync(path,'utf8');
const js=(await transform(source,{loader:'ts',format:'esm'})).code;
const {synopPrecipitationPhase,synopPrecipitationSymbolSvg}=await import('data:text/javascript;base64,'+Buffer.from(js).toString('base64'));
const golden={56:'freezing',57:'freezing',66:'freezing',67:'freezing',68:'mixed',69:'mixed',71:'snow',73:'snow',75:'snow',77:'snow-grains',78:'snow-stars',79:'ice-pellets',83:'mixed',84:'mixed',85:'snow',86:'snow',87:'graupel',88:'graupel',89:'hail',90:'hail',96:'graupel-hail',99:'graupel-hail'};
for(const [value,phase] of Object.entries(golden)){const code=Number(value);assert.equal(synopPrecipitationPhase(code),phase);const symbol=synopPrecipitationSymbolSvg(code);assert.ok(symbol?.includes('<svg')&&symbol.endsWith('</svg>'))}
for(const unavailable of [null,undefined,NaN,Infinity,-1,100,0,3,45,51,61,63,65,80,81,82,95,97,22,66.2,'66',false]){assert.equal(synopPrecipitationPhase(unavailable),null);assert.equal(synopPrecipitationSymbolSvg(unavailable),null)}
assert.notEqual(synopPrecipitationSymbolSvg(56),synopPrecipitationSymbolSvg(66),'freezing drizzle/rain symbols must differ');
assert.notEqual(synopPrecipitationSymbolSvg(71),synopPrecipitationSymbolSvg(73),'intensity groups must differ');
assert.notEqual(synopPrecipitationSymbolSvg(87),synopPrecipitationSymbolSvg(89),'graupel and hail must remain distinct');
const overlay=readFileSync(new URL('../src/RadarModelPrecipTypeOverlay.tsx',import.meta.url),'utf8');
assert.ok(overlay.includes("synopPrecipitationPhase(rawWw)===typed"));
assert.ok(overlay.includes("item.ww===undefined?precipitationTypeSymbolSvg(item.phase):synopPrecipitationSymbolSvg(item.ww)"));
assert.ok(overlay.includes("if(!echo.covered||!Number.isFinite(echo.maxDbz))continue"));
assert.ok(overlay.includes("if(echo.maxDbz<phaseMinimumDbz(typed))continue"));
assert.ok(overlay.includes("OPERA-CIRRUS-Echomaske fehlt; die Niederschlagsart bleibt aus."));
console.log('SYNOP-inspired radar/model weather glyphs: '+Object.keys(golden).length+' explicit code cases + invalid/dry/missing gate OK');