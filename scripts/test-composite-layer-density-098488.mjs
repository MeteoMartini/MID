import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const radar=readFileSync(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const modern=readFileSync(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');
for(const short of ['keine Misch-/Festphase','DWD · kein Stand','keine Zellen','keine Zugspur','DWD · aktuell']) assert.ok(radar.includes(short),`Kompakter Layerstatus fehlt: ${short}`);
assert.ok(!radar.includes('aktuell keine festen/gemischten Niederschlagsarten im sichtbaren Ausschnitt'),'Der ausufernde Phasentext darf nicht mehr als Karten-Primärtext verwendet werden.');
assert.ok(modern.includes('.composite-switch.compact{')&&modern.includes('min-height:56px!important'),'Layerkarten brauchen eine kompakte, aber touchfähige Mindesthöhe.');
assert.ok(modern.includes('white-space:nowrap!important')&&modern.includes('text-overflow:ellipsis!important'),'Sekundärtext der Layerkarten muss einzeilig und kontrolliert gekürzt werden.');
const viewports=[[320,568],[360,800],[390,844],[430,932],[844,390],[600,1024],[768,1024],[834,1194],[1024,1366],[1366,768],[1440,900],[1920,1080]];for(const [width,height] of viewports){const panelWidth=Math.min(width-24,900),inner=panelWidth-32,gap=7,column=(inner-gap)/2;assert.ok(column>=138||width<=320,`Zwei Layerkarten sind bei ${width}×${height}px zu schmal: ${column.toFixed(1)}px`);assert.ok(54<=Math.max(54,Math.min(56,height*.08)),`Touchhöhe bei ${width}×${height}px unterschritten`)}
console.log('Komposit-Layerdichte und schmale Viewports geprüft.');
