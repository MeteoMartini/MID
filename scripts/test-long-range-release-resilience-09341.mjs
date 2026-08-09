import {readFile} from 'node:fs/promises';
const [grid,seasonal,types,app,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('./test-long-range-grid-ensemble-colors-09332.mjs',import.meta.url),'utf8'),
 readFile(new URL('./test-long-range-seasonal-09330.mjs',import.meta.url),'utf8'),
 readFile(new URL('./test-long-range-types-09331.mjs',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const [name,text] of [['grid',grid],['seasonal',seasonal],['types',types]]){
 if(!text.includes("atLeast(pv,'0.9.33.2')"))failures.push(`${name}: Langfristvertrag verwendet keine Mindestversion`);
 if(text.includes("pv!=='0.9.33.2'"))failures.push(`${name}: alte exakte Versionssperre weiterhin vorhanden`);
}
for(const token of ['Multi-Modell-Gesamtbild','anomaly-plume','pointX(index:number,count:number,left:number,width:number,padding=26)'])if(!panel.includes(token))failures.push(`LongRangePanel fehlt ${token}`);
for(const token of ['MountainSnowLineTrend','mountainSnowLineTrend(data)','<MountainSnowLineTrend data={data}/>'])if(!app.includes(token))failures.push(`App fehlt ${token}`);
for(const token of ['.mountain-snowline-trend{','.mountain-snowline-band{','.mountain-snowline-level{'])if(!styles.includes(token))failures.push(`Styles fehlen ${token}`);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;
if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID v${pv} Langfrist-/Schneefallgrenzen-Releaseprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`MID v${pv}: Langfristverträge releasefest, Multi-Modell-Rauchfahne und Schneefallgrenzen-Schnellübersicht geprüft.`);
