import {describe,expect,it} from 'vitest';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {groupedMapModelOptions,mapModelDisplayLabel} from '../../src/mapModelPresentation';
import {WEATHER_MAP_MODELS} from '../../src/WeatherMapsData';
import {cloudWeatherSources} from '../../src/cloudWeatherData';
import type {SynopticIndex} from '../../src/nativeSynopticFields';

const flatten=(choices:ReadonlyArray<{id:string;label:string;resolutionKm?:number}>)=>
 groupedMapModelOptions(choices).flatMap(group=>group.models.map(model=>model.id));

describe('MID map model identity: flag, family and fine-to-coarse ordering',()=>{
 it('keeps every actually offered model ID exactly once, without manufacturing extra data sources',()=>{
  const groups=groupedMapModelOptions(WEATHER_MAP_MODELS);
  const ids=groups.flatMap(x=>x.models.map(m=>m.id));
  expect(ids).toHaveLength(WEATHER_MAP_MODELS.length);
  expect(new Set(ids).size).toBe(ids.length);
  expect(new Set(ids)).toEqual(new Set(WEATHER_MAP_MODELS.map(x=>x.id)));
  expect(groups.every(x=>x.models.length>0)).toBe(true);
 });
 it('sorts the native DWD ICON family by source-grid resolution before model spelling',()=>{
  const input=[
   {id:'icon-eps',label:'DWD ICON-EPS'},
   {id:'icon',label:'DWD ICON Global'},
   {id:'icon-eu',label:'DWD ICON-EU'},
   {id:'icon-d2',label:'DWD ICON-D2'},
   {id:'icon-d2-ruc',label:'DWD ICON-D2-RUC'},
  ];
  expect(flatten(input)).toEqual(['icon-d2-ruc','icon-d2','icon-eu','icon','icon-eps']);
  expect(input[0].id).toBe('icon-eps'); // original choices immutable
  expect(groupedMapModelOptions(input)[0].label).toBe('DWD · ICON');
 });
 it('groups models by real provider/model family without mixing analysis/forecast',()=>{
  const list=[
   {id:'gfs',label:'NOAA GFS'},
   {id:'observations',label:'DWD RADOLAN'},
   {id:'ifs',label:'ECMWF IFS'},
   {id:'icon-eu',label:'DWD ICON-EU'},
   {id:'aicon',label:'DWD AICON'},
   {id:'gdps',label:'ECCC GDPS Global'},
   {id:'nowcastmix',label:'DWD NowCastMIX'},
  ];
  expect(groupedMapModelOptions(list).map(x=>x.label)).toEqual([
   'DWD · ICON','DWD · AICON','ECMWF · IFS','NOAA · GFS',
   'ECCC · GDPS','DWD · Messdaten','DWD · Nowcasting',
  ]);
  expect(flatten(list)).toEqual(['icon-eu','aicon','ifs','gfs','gdps','observations','nowcastmix']);
 });
 it('prepends the appropriate country or European flag immediately to each existing model name',()=>{
  const examples=[
   ['icon-d2','🇩🇪'],['icon-d2-ruc','🇩🇪'],['icon-eu','🇩🇪'],
   ['icon','🇩🇪'],['icon-eps','🇩🇪'],['aicon','🇩🇪'],
   ['observations','🇩🇪'],['radolan','🇩🇪'],['nowcastmix','🇩🇪'],
   ['ifs','🇪🇺'],['gfs','🇺🇸'],['gdps','🇨🇦'],
  ];
  for(const [id,flag] of examples){
   const label='Original-'+id;
   expect(mapModelDisplayLabel({id,label}).startsWith(flag+' '+label)).toBe(true);
  }
  expect(mapModelDisplayLabel({id:'mystery-x',label:'Unbestätigtes Modell'})).toBe('Unbestätigtes Modell');
 });
 it('labels WMS regrids explicitly instead of claiming native physical resolution',()=>{
  expect(mapModelDisplayLabel({id:'icon-eu',label:'DWD ICON-EU'})).toContain('0,0625° Kartenraster');
  expect(mapModelDisplayLabel({id:'icon',label:'DWD ICON Global'})).toContain('0,25° Kartenraster');
  expect(mapModelDisplayLabel({id:'icon-eps',label:'DWD ICON-EPS'})).toContain('0,25° Kartenraster');
  expect(mapModelDisplayLabel({id:'gdps',label:'ECCC GDPS'})).toContain('ca. 15 km');
 });
 it('uses verified synoptic-index raster spacing when known, and rejects implausible resolution metadata',()=>{
  expect(mapModelDisplayLabel({id:'ifs',label:'ECMWF IFS',resolutionKm:9.5}))
   .toContain('9,5 km Raster');
  expect(mapModelDisplayLabel({id:'gfs',label:'NOAA GFS',resolutionKm:27}))
   .toContain('27 km Raster');
  expect(mapModelDisplayLabel({id:'ifs',label:'ECMWF IFS',resolutionKm:Number.NaN}))
   .toBe('🇪🇺 ECMWF IFS');
  expect(mapModelDisplayLabel({id:'ifs',label:'ECMWF IFS',resolutionKm:-1}))
   .toBe('🇪🇺 ECMWF IFS');
 });
 it('uses a verified native cloud/WW grid rather than mislabelling it as DWD WMS 0,0625°',()=>{
  const index={models:{
   'icon-eu':{label:'DWD ICON-EU',resolutionKm:14,cloudWeatherFrames:[{hour:3}],frames:[]},
   'icon':{label:'DWD ICON Global',resolutionKm:28,cloudWeatherFrames:[{hour:3}],frames:[]},
  }} as unknown as SynopticIndex;
  const choices=cloudWeatherSources(null,index);
  const eu=choices.find(x=>x.id==='icon-eu')!;
  const global=choices.find(x=>x.id==='icon')!;
  expect(eu).toMatchObject({sourceGrid:'native',resolutionKm:14});
  expect(mapModelDisplayLabel(eu)).toBe('🇩🇪 DWD ICON-EU · 14 km Raster');
  expect(mapModelDisplayLabel(eu)).not.toContain('0,0625° Kartenraster');
  expect(mapModelDisplayLabel(global)).toBe('🇩🇪 DWD ICON Global · 28 km Raster');
  expect(choices.find(x=>x.id==='gdps')).toMatchObject({sourceGrid:'wms'});
 });
 it('never claims the WMS raster for a native or mixed/unknown source grid',()=>{
  expect(mapModelDisplayLabel({id:'icon-eu',label:'DWD ICON-EU',sourceGrid:'native'}))
   .toBe('🇩🇪 DWD ICON-EU');
  expect(mapModelDisplayLabel({id:'icon',label:'DWD ICON Global',sourceGrid:'native'}))
   .toBe('🇩🇪 DWD ICON Global');
  expect(mapModelDisplayLabel({id:'icon-eu',label:'DWD ICON-EU',sourceGrid:'mixed',resolutionKm:14}))
   .toBe('🇩🇪 DWD ICON-EU');
  expect(mapModelDisplayLabel({id:'icon-d2',label:'DWD ICON-D2',sourceGrid:'native'}))
   .toBe('🇩🇪 DWD ICON-D2 · ca. 2 km');
  expect(mapModelDisplayLabel({id:'icon-eu',label:'DWD ICON-EU',sourceGrid:'wms'}))
   .toContain('0,0625° Kartenraster');
  expect(mapModelDisplayLabel({id:'ifs',label:'ECMWF IFS',sourceGrid:'mixed',resolutionKm:9}))
   .toBe('🇪🇺 ECMWF IFS');
 });
 it('keeps unknown model identities transparent, sorted after verified sources',()=>{
  const list=[{id:'unlisted-a',label:'Zeta'},{id:'ifs',label:'ECMWF IFS'},
   {id:'unlisted-b',label:'Alpha'}];
  expect(groupedMapModelOptions(list).map(g=>g.id)).toEqual(['ECMWF · IFS','Weitere Modelle']);
  expect(flatten(list)).toEqual(['ifs','unlisted-b','unlisted-a']);
  expect(mapModelDisplayLabel(list[0])).toBe('Zeta');
 });
 it('executes the established MID230 model/parameter/catalog regression on this exact PR code',()=>{
  const root=fileURLToPath(new URL('../../',import.meta.url));
  const output=execFileSync(process.execPath,['scripts/test-map-option-ordering-0985230.mjs'],{
   cwd:root,encoding:'utf8',timeout:90_000,maxBuffer:2*1024*1024,
  });
  expect(output).toContain('MID230 maps: model family + fine-to-coarse grids');
 },95_000);
 it('preserves model IDs for both existing selector surfaces and retains verified-only catalog eligibility',()=>{
  const map=readFileSync(fileURLToPath(new URL('../../src/UnifiedWeatherMap.tsx',import.meta.url)),'utf8');
  const panel=readFileSync(fileURLToPath(new URL('../../src/WeatherMapsPanel.tsx',import.meta.url)),'utf8');
  expect(map).toContain('groupedMapModelOptions(');
  expect(panel).toContain('groupedMapModelOptions(modelOptions)');
  expect(map).toContain('value={c.id}>{c.displayLabel}');
  expect(panel).toContain('value={item.id}>{item.displayLabel}');
  expect(map).toContain('unifiedSources(');
  expect(panel).toContain('weatherMapCatalogExcludes(');
  expect(map).toContain('Katalog wird geprüft / nicht verfügbar');
  expect(panel).toContain('derzeit nicht verfügbar');
 });
});
