import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const source=await readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
assert.match(source,/type ResolvedKonradTrackPoint=\{[^}]*derived\?:boolean/,'ResolvedKonradTrackPoint must allow derived');
assert.match(source,/deduped:ResolvedKonradTrackPoint\[\]=explicit/,'mutable K3D track list must be explicitly typed');
assert.match(source,/uncertaintyOrientationDeg:point\.uncertaintyOrientationDeg,derived:false/,'official K3D points should be explicitly marked non-derived');
assert.match(source,/derived:true/,'synthetic K3D track points must remain marked derived');
console.log('MID v0.9.15.7 KONRAD3D derived-point TypeScript buildfix regression passed.');
