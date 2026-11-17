import {describe,expect,it} from 'vitest';
import {readFileSync} from 'node:fs';
import {chooseSurroundingsCities} from '../../src/surroundingsCitySelection';
import {surroundingsTemperatureUrl,extractSurroundingsTemperatures} from '../../src/currentSurroundingsTemperature';

const selected={lat:50,lon:7},bounds={west:5.6,east:8.4,south:49.35,north:50.65};
const named=['Bergdorf','Weststadt','Hohenstadt','Süddorf','Mitte-West','Mitte-Ost'].map((name,index)=>({
 name,lat:index<3?50.45:49.75,lon:6.1+index%3*.9,population:30000-index*300,origin:'natural-earth' as const
}));
const now=Date.parse('2026-11-17T12:10:00.000Z'),valid=Date.parse('2026-11-17T12:00:00Z')/1000;

describe('MID wider surroundings: real settlement temperatures with NoData and readable placement',()=>{
 it('admits up to six named candidates on a genuinely spacious map and never synthetic corners',()=>{
  const cities=chooseSurroundingsCities(named,selected,bounds,6,{width:1024,height:400});
  expect(cities.length).toBe(6);
  expect(new Set(cities.map(p=>p.id)).size).toBe(6);
  expect(cities.every(p=>named.some(n=>p.name===n.name))).toBe(true);
  expect(cities.every(p=>p.origin==='natural-earth')).toBe(true);
 });
 it('preserves the four-place cap on compact maps and zero on invalid viewport',()=>{
  expect(chooseSurroundingsCities(named,selected,bounds,4,{width:390,height:285}).length).toBeLessThanOrEqual(4);
  expect(chooseSurroundingsCities(named,selected,bounds,6,{width:0,height:285})).toEqual([]);
 });
 it('uses one bounded API URL for six REAL cities and selected site',()=>{
  const cities=chooseSurroundingsCities(named,selected,bounds,6,{width:1024,height:400});
  const places=[...cities.map(p=>({id:p.id,lat:p.lat,lon:p.lon})),{id:'selected',...selected}];
  expect(places).toHaveLength(7);
  const url=surroundingsTemperatureUrl(places);
  expect(url).toBeDefined();
  const parsed=new URL(url!);
  expect(parsed.hostname).toBe('api.open-meteo.com');
  expect(parsed.searchParams.get('latitude')?.split(',')).toHaveLength(7);
  expect(parsed.searchParams.get('hourly')).toBe('temperature_2m');
  expect(parsed.searchParams.get('timeformat')).toBe('unixtime');
  expect(surroundingsTemperatureUrl([...places,places[0]])).toBeUndefined();
 });
 it('rejects missing cells and wrong positions, without substituting zeros',()=>{
  const places=[...named.map((p,i)=>({id:'place:'+i,lat:p.lat,lon:p.lon})),{id:'selected',...selected}];
  const response=places.map((p,i)=>({
   latitude:p.lat,longitude:p.lon,utc_offset_seconds:0,hourly_units:{temperature_2m:'°C'},
   hourly:{time:[valid],temperature_2m:[i===3?null:i-3]}
  }));
  const result=extractSurroundingsTemperatures(response,places,now,now);
  expect(result?.requested).toBe(7);
  expect(result?.available).toBe(6);
  expect(result?.values['place:0']).toBe(-3);
  expect(Object.hasOwn(result?.values??{},'place:3')).toBe(false);
  expect(result?.modelLabel).toBe('Best Match');
  expect(result?.temporalMethod).toBe('original');
 });
 it('keeps source details, contour and renderer priorities in place',()=>{
  const component=readFileSync('src/CurrentSurroundings.tsx','utf8');
  const css=readFileSync('src/CurrentSurroundings.css','utf8');
  expect(component).toContain('mapViewport.width>=660&&mapViewport.height>=220?6:4');
  expect(component).toContain('ecmwfTemperatureColor(value)');
  expect(component).toContain('loaded');
  expect(css).toContain('-webkit-text-stroke:1.45px rgba(6,13,22,.97)');
  expect(css).toContain('paint-order:stroke fill');
  expect(css).toContain('background:transparent!important');
  expect(component).not.toContain('temperaturePoints=[');
 });
});
