import fs from 'node:fs';

const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=fs.readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const meteogram=fs.readFileSync(new URL('../src/MeteogramPanel.tsx',import.meta.url),'utf8');
const precipitation=fs.readFileSync(new URL('../src/precipitation.ts',import.meta.url),'utf8');
const format=fs.readFileSync(new URL('../src/format.ts',import.meta.url),'utf8');
const styles=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const radar=fs.readFileSync(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8');
const failures=[];

for(const token of ["new Intl.NumberFormat('de-DE'",'formatDecimalFixed','useGrouping:false'])if(!format.includes(token))failures.push(`Zentrale deutsche Zahlenformatierung fehlt: ${token}`);
for(const [name,source,tokens] of [
 ['Dashboard',app,['formatDecimalFixed(precip,1)','formatDecimal(actualCurrentUv,1)','formatDecimal(Number(air.current.pm2_5),1)','formatDecimal(loc.latitude,2,2)']],
 ['Ensemble',ensemble,['formatDecimalFixed(best,1)','formatDecimalFixed(row.minLow,1)','formatDecimal(Number(value),1)']],
 ['Meteogramm',meteogram,['formatDecimalFixed(amount,1)','formatDecimalFixed(depth,1)','formatDecimal(item.values[index]!']],
 ['Niederschlagszusammenfassung',precipitation,['formatDecimalFixed(total,1)','formatDecimalFixed(snowCm,1)']],
 ['Komposit/Radar',radar,['formatDecimal(lightningData.nativeResolutionKm,1)']]
])for(const token of tokens)if(!source.includes(token))failures.push(`${name}: deutsche Dezimaldarstellung fehlt: ${token}`);

for(const token of ['@media(min-width:1101px)','grid-template-columns:repeat(9,minmax(0,1fr))','.metrics article{min-height:86px'])if(!styles.includes(token))failures.push(`Kompakte Ein-Zeilen-Kacheln fehlen: ${token}`);

const formatter=new Intl.NumberFormat('de-DE',{useGrouping:false,minimumFractionDigits:1,maximumFractionDigits:1});
if(formatter.format(1.4)!=='1,4')failures.push('Intl-Regression: 1.4 wird nicht als 1,4 formatiert');
if(formatter.format(24.9)!=='24,9')failures.push('Intl-Regression: 24.9 wird nicht als 24,9 formatiert');

if(failures.length){console.error('Format-/Layoutprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Format und Layout geprüft: sichtbare Dezimalwerte nutzen deutsches Komma; neun aktuelle Parameter bleiben am Desktop in einer kompakten Zeile.');
