import {readFile} from 'node:fs/promises';
const [seasonal,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/seasonalForecast.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/LongRangePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(scope,text,token)=>{if(!text.includes(token))failures.push(`${scope}: fehlt ${token}`)};
for(const token of ["cell_selection:'nearest'",'temperatureAnomalyLow','temperatureAnomalyHigh','precipitationAnomalyPercentLow','precipitationAnomalyPercentHigh','ensembleMembers','nearestC3sGridPoint','gridLabel:\'C3S 1° × 1° · nächster Gitterpunkt\'','ensembleCapable:true'])need('seasonalForecast',seasonal,token);
for(const token of ['temperatureAnomalyColor','precipitationAnomalyColor','ensemble-spread','10–90 % Ensemble','long-range-model-selector','Nächster Punkt','blau = kälter · rot = wärmer','braun = trockener · blau/türkis = feuchter'])need('LongRangePanel',panel,token);
for(const token of ['.long-range-chart .ensemble-spread line{','.long-range-scale.temperature i:first-of-type{','.long-range-scale.precipitation i:first-of-type{','.long-range-model-selector{'])need('styles',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);const parts=value=>String(value).split('.').map(part=>Number(part)||0),atLeast=(value,minimum)=>{const a=parts(value),b=parts(minimum),length=Math.max(a.length,b.length);for(let index=0;index<length;index++){const av=a[index]??0,bv=b[index]??0;if(av>bv)return true;if(av<bv)return false}return true};if(!atLeast(pv,'0.9.33.2'))failures.push(`Version ${pv} liegt vor dem Langfrist-Vertrag 0.9.33.2`);
if(failures.length){console.error('MID Langfrist-Gitter/Ensemble/Farbprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log(`MID ${pv}: nächster Gitterpunkt, Ensemble-Spannen, Multi-Modell-Struktur und divergierende Langfristfarben geprüft.`);
