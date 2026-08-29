import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath,pathToFileURL} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const source=fs.readFileSync(path.join(root,'src','sunshineDuration.ts'),'utf8');
const require=createRequire(import.meta.url),ts=require('typescript');
const output=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'sunshineDuration.ts',reportDiagnostics:true});
const errors=(output.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
assert.equal(errors.length,0,errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n'));

const tempDir=fs.mkdtempSync(path.join(os.tmpdir(),'mid-sunshine-contract-'));
try{
 const modulePath=path.join(tempDir,'sunshineDuration.mjs');fs.writeFileSync(modulePath,output.outputText);
 const sunshine=await import(`${pathToFileURL(modulePath).href}?v=${Date.now()}`);

 assert.equal(sunshine.canonicalSunshineHourSeconds(null),null,'fehlende Stundenwerte dürfen nicht zu 0 werden');
 assert.equal(sunshine.canonicalSunshineHourSeconds(5000),3600,'Stundenwerte müssen auf 3600 s begrenzt werden');
 assert.equal(sunshine.canonicalSunshineHourSeconds(1200,[900,900,900,900]),3600,'vier vollständige 15-min-Werte müssen Vorrang haben');
 assert.equal(sunshine.canonicalSunshineHourSeconds(2400,[900,null,900,900]),2400,'unvollständige Viertelstunden müssen auf den Stundenwert zurückfallen');
 assert.equal(sunshine.canonicalSunshineHourSeconds(0,[1200,-60,600,900]),2400,'Viertelstunden müssen einzeln auf 0 bis 900 s begrenzt werden');

 const capped=sunshine.canonicalSunshineDaySeconds({hourValues:Array(24).fill(3600),dailyValue:46800,daylightSeconds:43200});
 assert.equal(capped.valueSeconds,43200,'Tagessumme darf die astronomische Tageslänge nicht überschreiten');
 assert.equal(capped.source,'hourly','vollständige lokale Stunden sind die kanonische Tagesquelle');

 const deviating=sunshine.canonicalSunshineDaySeconds({hourValues:[...Array(12).fill(3600),...Array(12).fill(0)],dailyValue:18000,daylightSeconds:54000});
 assert.equal(deviating.valueSeconds,43200);
 assert.equal(deviating.quality,'deviating','große Abweichungen zur Daily-Referenz müssen diagnostiziert werden');

 const fallback=sunshine.canonicalSunshineDaySeconds({hourValues:Array(12).fill(3600),dailyValue:46800,daylightSeconds:54000});
 assert.equal(fallback.valueSeconds,46800,'Daily ist bei unvollständiger Stundenabdeckung der Fallback');
 assert.equal(fallback.source,'daily-fallback');

 const missing=sunshine.canonicalSunshineDaySeconds({hourValues:Array(24).fill(null),dailyValue:null,daylightSeconds:43200});
 assert.equal(missing.valueSeconds,null,'fehlende Providerwerte bleiben fehlend');
 assert.equal(missing.quality,'missing');

 assert.equal(sunshine.sunshineMinutesLabel(900,15),'15 min');
 assert.equal(sunshine.sunshineMinutesLabel(null),'–');
 assert.equal(sunshine.sunshineHoursLabel(1800),'0,5 h');
 assert.equal(sunshine.sunshineHoursLabel(0),'0 h');
 assert.equal(sunshine.sunshineHoursLabel(null),'–');
}finally{fs.rmSync(tempDir,{recursive:true,force:true})}

const contracts=[
 ['src/weather-src/20-mapping-day-character.tsfrag',['canonicalSunshineHourSeconds','canonicalSunshineDaySeconds','weatherDaylightSeconds']],
 ['src/forecastFusion.ts',['vollständigen finalen Stundenreihe','dailySunshineReference','sunshineDurationMeta']],
 ['src/ShortTermForecast.tsx',['sunshineMinutesLabel','Bewölkung / Sicht / Sonnenscheindauer']],
 ['src/ForecastCockpit.tsx',['cockpit-fourteen-sunshine','P10–P90','sunshineHoursLabel','bestSunshineDuration=bestDay?.sunshineDuration!=null']],
 ['src/EnsemblePanel.tsx',['Sonnenscheindauer','formatSunshineHours']],
 ['src/EventPlannerPanel.tsx',['eventSunshineLabel','Sonnenscheindauer']],
 ['src/App.tsx',['showSunshine','widgetmeta-sun','sunshineHoursLabel']],
 ['src/nativeWidget.ts',['sunshineDurationSeconds','sunshineDuration']],
 ['ios/App/MIDWidgets/MIDWidgetSnapshot.swift',['sunshineDurationSeconds']],
 ['ios/App/MIDWidgets/MIDWidget.swift',['sunshineMinutes','sunshineHours']],
 ['worker-src/00-core-observations.js',['widgetSunshineSeconds','sunshineDurationSeconds','sunshineDuration:\'s\'']]
];
for(const [file,tokens] of contracts){const text=fs.readFileSync(path.join(root,file),'utf8');for(const token of tokens)assert.ok(text.includes(token),`${file}: Sunshine-Contract fehlt: ${token}`)}

console.log('0.9.65.5: appweiter Sunshine-Duration-Contract von 15 min über Stunde/Tag bis Ensemble, Events und Widgets geprüft.');
