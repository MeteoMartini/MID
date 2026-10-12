import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtempSync,rmSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
const dir=mkdtempSync(join(tmpdir(),'mid243-'));
try{
 await build({entryPoints:['src/weatherValueFormat.ts','src/locationComparison.ts','src/precipitation.ts','src/weather.ts'],outdir:dir,bundle:true,platform:'node',format:'esm',logLevel:'silent'});
 const {formatWeatherValue:f,formatVisibility:v,formatTemperatureRange:r}=await import(pathToFileURL(join(dir,'weatherValueFormat.js')));
 for(const x of [null,undefined,NaN,Infinity,'2',false])assert.equal(f(x,'temperature'),'–');
 for(const [x,p,want] of [[0,'precipitation','0'],[.001,'precipitation','<0,1'],[.099,'precipitation','<0,1'],[.26,'precipitation','0,3'],[1.26,'precipitation','1'],[18.67,'precipitation','19'],[.04,'precipitationRate','<0,1'],[3.26,'precipitationRate','3,3'],[12.67,'precipitationRate','13'],[-.01,'temperature','0'],[-1.26,'temperature','-1,3'],[1013.24,'pressure','1013,2'],[76.8,'percent','77'],[358,'windDirection','0'],[-12,'windDirection','350']])assert.equal(f(x,p),want,`${x}/${p}`);
 assert.equal(r(12.1,12.4,'overview'),'12');assert.equal(r(null,12,'overview'),'–');assert.equal(r(-2.2,12.6,'overview'),'-2–13');
 for(const [x,want] of [[0,'<100 m'],[99,'<100 m'],[199,'100 m'],[999,'900 m'],[4999,'4,9 km'],[5000,'5 km'],[5999,'5 km'],[30999,'30 km'],[35999,'35 km'],[70001,'>70 km'],[null,'–']])assert.equal(v(x),want);
 const {compactPrecipitationAmount}=await import(pathToFileURL(join(dir,'precipitation.js')));assert.equal(compactPrecipitationAmount(.003,3),'<0,1');assert.equal(compactPrecipitationAmount(1.26),'1');
 const {wind}=await import(pathToFileURL(join(dir,'weather.js')));assert.equal(wind(12.3,'ms'),'6 m/s');assert.equal(wind(12.3,'kmh'),'23 km/h');assert.equal(wind(NaN,'ms'),'–');
 const {sortPlaceOverview:sort}=await import(pathToFileURL(join(dir,'locationComparison.js')));
 const row=(id,max,extra={})=>({place:{id,label:id},max,min:0,rain:max,gust:max,distance:max,priority:0,stale:false,...extra});
 const a=row('Z',12),b=row('A',12),missing=row('Missing',null),stale=row('Old',50,{stale:true}),c=row('B',2),rows=[a,b,missing,stale,c];
 assert.deepEqual(sort(rows,'settings'),rows);assert.deepEqual(sort(rows,'temperatureDesc').map(r=>r.place.id),['Z','A','B','Missing','Old']);assert.deepEqual(sort(rows,'rain').map(r=>r.place.id),['B','Z','A','Missing','Old']);assert.deepEqual(sort(rows,'name').map(r=>r.place.id),['A','B','Missing','Old','Z']);assert.equal(sort([a,row('Warning',1,{priority:3})],'warnings')[0].place.id,'Warning');assert.equal(rows[0],a,'sorting never mutates input');
 const contract=readFileSync('MID_PARAMETER_DISPLAY_PRECISION_CONTRACT.md','utf8');assert.match(contract,/3590/);assert.match(contract,/4377/);assert.match(contract,/Native source values/);
}finally{rmSync(dir,{recursive:true,force:true})}
console.log('MID243: precision boundary fixtures, traces, units, visibility, range collapse and stable missing-safe sort passed');
