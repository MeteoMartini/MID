import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [fetcher,builder,worker,weather,cockpit]=await Promise.all([
 readFile(new URL('../tools/ruc/fetch_and_build_ruc.py',import.meta.url),'utf8'),
 readFile(new URL('../tools/ruc/build_ruc_bundle.py',import.meta.url),'utf8'),
 readFile(new URL('../worker-src/00-core-observations.js',import.meta.url),'utf8'),
 readFile(new URL('../src/weather-src/00-types-models-search.tsfrag',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8')
]);

assert.ok(fetcher.includes("mode='hourly'"),'Der gemeinsame deterministische Zustandskern muss stündlich gestaged werden.');
assert.ok(fetcher.includes("mode=='rapid-precip'")&&fetcher.includes("lead<=rapid_limit and lead%5==0"),'Native 5-min-Niederschlagsleads bis +6 h müssen erhalten bleiben.');
assert.ok(fetcher.includes("mode=='rapid15'")&&fetcher.includes("lead<=rapid_limit and lead%15==0"),'15-min-Konvektionsleads bis +6 h müssen erhalten bleiben.');
assert.ok(builder.includes('def hourly_targets(run:str,hours:int):'),'Builder muss eine gemeinsame stündliche Zielachse verwenden.');
assert.ok(builder.includes('targets=[base+timedelta(hours=h)'),'Stundenachse 0..+14 h fehlt.');
assert.ok(!builder.includes('range(0,rapid_limit+1,15)'),'Der gemeinsame Mehrvariablenkern darf keine nicht gemeinsam verfügbaren 15-min-Ziele erzwingen.');
assert.ok(worker.includes('temporalResolutionSeconds:300'),'RUC-Modellmetadaten müssen die feinste produktiv genutzte native RUC-Auflösung ausweisen.');
assert.ok(cockpit.includes('Zustandskern 1 h bis +14 h')&&cockpit.includes('Niederschlag 5 min bis +6 h')&&cockpit.includes('Konvektion/Reflektivität 15 min bis +6 h'),'UI muss den parameterabhängigen RUC-Zeitvertrag korrekt benennen.');
assert.ok(weather.includes('fehlende Temperatur-, Wind-, Druck- oder Wolkenzwischenwerte werden nicht interpoliert'),'UI/Vertrag muss künstliche 15-min-Interpolation ausdrücklich ausschließen.');
console.log('RUC parameter-native cadence regression passed: hourly state core plus native 5/15-minute rapid products.');
