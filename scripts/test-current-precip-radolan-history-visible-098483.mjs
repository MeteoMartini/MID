import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const history=readFileSync(new URL('../src/radarHistory.ts',import.meta.url),'utf8');
const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
for(const token of [
 "historyVisibleParts.push(`1 h ${value} mm`)",
 "historyVisibleParts.push(`24 h ${value} mm`)",
 "const precipitationCompactDetail=historyVisibleParts.length?`RADOLAN · ${historyVisibleParts.join(' · ')}`:''",
 "product=radarHistory?.hourProduct||'RADOLAN'",
 "product=radarHistory?.dayProduct||'SF'",
 "radarHistory?.hourAdjusted?' angeeicht':' nicht angeeicht'",
 "radarHistory?.dayAdjusted?' angeeicht':' nicht angeeicht'"
])assert.ok(app.includes(token),`Sichtbare RADOLAN-Rückschau fehlt: ${token}`);
for(const token of ['lastHourMm?:number','last24hMm?:number','hourAdjusted?:boolean','dayAdjusted?:boolean'])assert.ok(history.includes(token),`RADOLAN-Historienfeld fehlt: ${token}`);
for(const token of ["product:'RW',adjusted:true", "product:'RY',adjusted:false", "product:'SF',adjusted:true"])assert.ok(worker.includes(token),`RADOLAN-Produktvertrag fehlt: ${token}`);
assert.ok(worker.includes("rwAge<=55"),'RW muss als frische angeeichte 1-h-Summe priorisiert bleiben.');
assert.ok(worker.includes("sfAge<=150"),'SF muss als frische angeeichte 24-h-Summe priorisiert bleiben.');
console.log('Aktuelles Wetter: sichtbare RADOLAN-Mengen 1 h / 24 h und Angeeicht-Status geprüft.');
