import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const compat=await readFile(new URL('src/MapLibreLegacyCompat.tsx',root),'utf8');
for(const token of [
 "getSouthWest:()=>{lat:number;lng:number}",
 "getNorthEast:()=>{lat:number;lng:number}",
 "getSouthWest:()=>({lat:south,lng:west})",
 "getNorthEast:()=>({lat:north,lng:east})"
]) assert.ok(compat.includes(token),`CompatBounds-Vertrag fehlt: ${token}`);
console.log('MapLibre CompatBounds geprüft: Südwest-/Nordost-Ecken sind typisiert und verfügbar.');
