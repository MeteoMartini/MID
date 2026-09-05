import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [seasonal,panel,comparison,worker,readme,audit,pkgText,baselineText]=await Promise.all([
 read('src/seasonalForecast.ts'),read('src/LongRangePanel.tsx'),read('src/LongRangeModelComparison.tsx'),
 read('worker-src/00-core-observations.js'),read('worker/README.md'),read('MID_SEASONAL_LONG_RANGE_SOURCE_AUDIT_0.9.77.27.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-seasonal-all-model-consensus-097727.mjs';

for(const token of ['modelKey:string','independenceKey:string','sourcePriority:number','preferredIndependentModels','model.independenceKey||model.modelKey||model.family',"SEASONAL_STORAGE_PREFIX='mid:seasonal-bundle:v4:'"])
 assert.ok(seasonal.includes(token),`Kanonischer Saisonmodellvertrag fehlt: ${token}`);

const c3sIds=['ecmwf-51','ukmo-610','meteofrance-9','dwd-22','cmcc-4','ncep-2','jma-4','eccc-4','eccc-5','bom-2'];
for(const id of c3sIds)assert.ok(seasonal.includes(`id:'${id}'`),`C3S-System fehlt im Frontendkatalog: ${id}`);
assert.equal(c3sIds.filter(id=>seasonal.includes(`id:'${id}'`)).length,10,'C3S muss zehn operationelle Systeme getrennt führen.');
assert.ok(seasonal.includes("id:'eccc-4',centreId:'eccc'")&&seasonal.includes("CanESM5.1p1bc · System 4"),'ECCC CanESM5.1p1bc muss ein eigenes C3S-System sein.');
assert.ok(seasonal.includes("id:'eccc-5',centreId:'eccc'")&&seasonal.includes("GEM5.2-NEMO · System 5"),'ECCC GEM5.2-NEMO muss ein eigenes C3S-System sein.');
assert.ok(!worker.includes("systems:['4','5']"),'ECCC-Systeme 4/5 dürfen im Worker nicht mehr in einem Katalogeintrag kollabieren.');
for(const label of ['ECMWF SEAS5','UK Met Office GloSea6-GC5.1','Météo-France System 9','DWD GCFS2.2','CMCC SPS4','NCEP CFSv2','JMA CPS4','ECCC CanESM5.1p1bc','ECCC GEM5.2-NEMO','BOM ACCESS-S2'])
 assert.ok(worker.includes(`label:'${label}'`),`C3S-Worker-System fehlt: ${label}`);

for(const [raw,key] of [['CFSv2','ncep-cfsv2'],['CanESM5','eccc-canesm5-lineage'],['GEM5.2','eccc-gem52-nemo'],['NASA','nasa-geos-s2s2'],['NCAR.*CCSM4','ncar-ccsm4'],['NCAR.*CESM1','ncar-cesm1'],['GFDL.*SPEAR','noaa-gfdl-spear']])
 assert.ok(seasonal.includes(raw)&&seasonal.includes(key),`NMME-Modellidentität fehlt: ${raw} -> ${key}`);
assert.ok(seasonal.includes("independenceKey:'ncep-cfsv2'")&&seasonal.includes("sourcePriority:400")&&seasonal.includes("sourcePriority:300")&&seasonal.includes("sourcePriority:200"),'Quellenpriorität/Dublettenvertrag C3S > NMME > Open-Meteo fehlt.');
assert.ok((seasonal.match(/independenceKey:'eccc-canesm5-lineage'/g)||[]).length>=2,'C3S/NMME CanESM5-Linie muss dieselbe konservative Unabhängigkeits-ID tragen.');
assert.ok((seasonal.match(/independenceKey:'eccc-gem52-nemo'/g)||[]).length>=2,'C3S/NMME GEM5.2-NEMO muss dieselbe Unabhängigkeits-ID tragen.');
assert.ok((seasonal.match(/independenceKey:'ncep-cfsv2'/g)||[]).length>=3,'C3S/NMME/Open-Fallback CFSv2 muss als eine Modelllinie erkannt werden.');

assert.ok(worker.includes("tempFiles=[...html.matchAll")&&worker.includes("const selected=models"),'NMME muss den jeweils aktuellen ENSMEAN-Index dynamisch entdecken statt eine starre Modellliste zu verwenden.');
assert.ok(worker.includes("Range:'bytes=0-262143'")&&worker.includes('parseMultipartByteRanges')&&worker.includes('fetchNetcdfPointRanges'),'NMME Sparse-Byte-Range-Punktentnahme fehlt.');
assert.ok(worker.includes('settleWithConcurrency(selected,3'),'NMME-Originlast muss durch begrenzte Modellparallelität geschützt sein.');
assert.ok(worker.includes('NMME Vollfallback HTTP')&&worker.includes('NMME Multi-Range-Fallback HTTP'),'Bei fehlender Range-Unterstützung muss der numerische Volldownload-Fallback erhalten bleiben.');

const helperMatch=worker.match(/function bytesIndexOf\([\s\S]*?return-1}\nfunction parseMultipartByteRanges\([\s\S]*?return parts}/);
assert.ok(helperMatch,'Multipart-Range-Parser konnte für Logiktest nicht extrahiert werden.');
const parseMultipart=new Function(`${helperMatch[0]};return parseMultipartByteRanges;`)();
const boundary='mid-test-boundary',enc=new TextEncoder();
const head=(start,end)=>enc.encode(`--${boundary}\r\nContent-Type: application/octet-stream\r\nContent-Range: bytes ${start}-${end}/999\r\n\r\n`);
const tail=enc.encode(`\r\n--${boundary}--\r\n`),between=enc.encode(`\r\n--${boundary}\r\nContent-Type: application/octet-stream\r\nContent-Range: bytes 200-202/999\r\n\r\n`);
const first=new Uint8Array([1,2,10]),second=new Uint8Array([13,10,255]);
const all=new Uint8Array(head(100,102).length+first.length+between.length+second.length+tail.length);let offset=0;
for(const part of [head(100,102),first,between,second,tail]){all.set(part,offset);offset+=part.length}
const parsed=parseMultipart(all.buffer,`multipart/byteranges; boundary=${boundary}`);
assert.deepEqual([...parsed.get(100)??[]],[1,2,10],'Binäres LF am Ende eines Range-Bodys darf nicht als MIME-Trenner abgeschnitten werden.');
assert.deepEqual([...parsed.get(200)??[]],[13,10,255],'Binäre CR/LF-Bytes innerhalb des Bodys müssen unverändert bleiben.');

assert.ok(panel.includes('eine Stimme je numerisch verfügbarem unabhängigen Modellsystem')&&panel.includes('buildCombinedMonths(models'), 'Poor-Man’s-Ensemble muss alle deduplizierten numerischen Systeme gleichgewichtet verwenden.');
assert.ok(comparison.includes('MODEL_DASH_CYCLES')&&comparison.includes('Math.floor(index/MODEL_COLORS.length)'),'Einzelmodell-Diagramm muss auch jenseits der Farbpalette unterscheidbare Linienmuster verwenden.');
assert.ok(!panel.includes('C3S-Vergleich')&&!panel.includes('long-range-gateway-status'),'Nicht numerisch geladene Modellkataloge dürfen nicht als zusätzliche UI-Kästchen erscheinen.');

for(const token of ['13 unabhängige Systeme/Modelllinien','WMO Lead Centre','APCC MME','CanSIPSv3','keine dritte kanadische Modellstimme','nicht mathematisch in die monatliche C3S/NMME-Achse'])
 assert.ok(audit.includes(token),`Quellenaudit unvollständig: ${token}`);
assert.ok(readme.includes('10 aktuell operationellen Systeme')&&readme.includes('HTTP Multi-Range'),'Worker-Dokumentation für erweiterten Saisonpool fehlt.');

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen synchron sein.');
assert.equal(pkg.scripts?.['test:seasonal-all-model-consensus'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test),'Neue Saisonquellen-Regression fehlt im Baseline-Pflichtvertrag.');
assert.ok(baseline.regressionTests?.includes(test),'Neue Saisonquellen-Regression fehlt in der Regressionliste.');
console.log(`MID v${pkg.version}: vollständiger C3S/NMME-Saisonpool, kanonische Unabhängigkeits-IDs und sparse NMME-Punktentnahme geschützt.`);
