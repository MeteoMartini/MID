import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [source,aggregate,worker]=await Promise.all([
 read('src/weather-src/10-observations-specialized.tsfrag'),
 read('src/weather.ts'),
 read('worker-src/00-core-observations.js')
]);

const report='METAR EDDG 232050Z AUTO 27005KT 230V290 9999 BKN036 BKN046 17/12 Q1020 TEMPO SHRA BKN025TCU';
const observationCore=report.split(/\s(?=(?:TEMPO|BECMG|NOSIG|INTER|PROB(?:30|40)|FM\d{4,6}|RMK)(?:\s|$))/i)[0];
assert.equal(observationCore,'METAR EDDG 232050Z AUTO 27005KT 230V290 9999 BKN036 BKN046 17/12 Q1020','Konkreter EDDG-Fall muss am TEMPO-Trend enden.');
assert.ok(!/\bSHRA\b/.test(observationCore),'SHRA aus TEMPO darf nicht als aktuelle Beobachtung gelten.');
assert.ok(!/\bBKN025TCU\b/.test(observationCore),'Trendbewölkung BKN025TCU darf nicht als aktuelle Beobachtung gelten.');

for(const text of [source,aggregate]){
 assert.ok(text.includes('function metarObservationCoreText'),'METAR-Beobachtungskern fehlt.');
 for(const marker of ['TEMPO','BECMG','NOSIG','INTER','PROB(?:30|40)','FM\\d{4,6}','RMK'])assert.ok(text.includes(marker),`METAR-Trendmarker fehlt: ${marker}`);
 assert.ok(text.includes("const text=metarObservationCoreText(typeof row.clouds==='string'?row.clouds:'',row.rawOb,row.raw_text,row.rawText,row.metar)"),'Cloud-Fallback muss auf den Beobachtungskern begrenzt sein.');
 assert.ok(text.includes('const raw=metarObservationCoreText(row?.rawOb,row?.raw_text,row?.rawText,row?.metar);'),'Cloud-Observation darf Trendtext nicht auswerten.');
 assert.ok(text.includes('const raw=metarObservationCoreText(direct,row?.rawOb,row?.raw_text,row?.rawText,row?.metar);'),'Present Weather darf Trendtext nicht auswerten.');
}

assert.ok(worker.includes('rawOb:r.rawOb??r.raw_text'),'Worker darf den Roh-METAR weiterhin unverändert transportieren; die semantische Trennung erfolgt im kanonischen Beobachtungsparser.');

console.log('MID 18.2.9: METAR-TREND wird von der aktuellen Beobachtung getrennt; EDDG TEMPO SHRA/BKN025TCU beeinflusst Current Weather nicht.');
