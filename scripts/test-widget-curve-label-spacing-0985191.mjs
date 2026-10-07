import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
const source=await readFile('src/ForecastCockpit.tsx','utf8');
assert.ok(!source.includes('Ein einzelner, verbundener Wetterstreifen mit gerundeten Segmenten ohne Farbmischung; Nachtstunden werden wieder separat hinterlegt.'),'Remove the requested redundant explanation from the shared app/export renderer');
assert.ok(source.includes('<b>{wind(day.wind,unit)}</b><small>{compactGustLabel(day.gust,unit)}</small>'),'Wind and gust values remain separate and unit-aware');
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-widget-curve-spacing-browser-0985191.mjs'],{stdio:'inherit',timeout:300000});
console.log('Shared curve widget: explanation removed; separate wind/gust values preserved.');
