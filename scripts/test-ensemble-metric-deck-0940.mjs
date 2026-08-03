import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const panel=fs.readFileSync(path.join(root,'src/EnsemblePanel.tsx'),'utf8'),app=fs.readFileSync(path.join(root,'src/App.tsx'),'utf8'),cockpit=fs.readFileSync(path.join(root,'src/ForecastCockpit.tsx'),'utf8'),styles=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
for(const token of [
 "EnsembleMetricDeck","Temperatur','Tmin/Tmax + ENS-Band","Niederschlag','Menge blau + Wahrscheinlichkeit türkis","Wind/Böen','Wind grün + Böen bräunlich","activeMetric==='temperature'","activeMetric==='precipitation'","activeMetric==='wind'","presentation='full'","presentation?:EnsemblePresentation",
 'confidenceGradientStops','stopColor={color}','TemperatureValueDot',"presentation==='cockpit'||temperatureOpen","presentation==='cockpit'||rainOpen","presentation==='cockpit'||windOpen",'ensemble-temperature-value','<Cell key={`rain-cell-${row.date}`','uncertaintyOpacity(row'
])assert.ok(panel.includes(token),`Ensemble-Metrikdeck fehlt: ${token}`);
assert.ok(app.includes('presentation="cockpit"'),'Cockpit verwendet nicht die professionellen Ensemble-Diagramme.');
assert.ok(app.includes('cockpitDetails={{'),'Separate kompakte Cockpit-Analyse fehlt.');
assert.ok(cockpit.includes("['wind','Wind/Böen']"),'Cockpit-Vorschau nennt Böen nicht.');
assert.ok(cockpit.includes("active==='seven-day'"),'7-Tage-Horizont blockiert Swipe-Wechsel nicht.');
for(const token of ['.ensemble-metric-deck','.ensemble-metric-mini.wind>em>strong','.ensemble-presentation-cockpit','.ensemble-temperature-value'])assert.ok(styles.includes(token),`Ensemble-CSS fehlt: ${token}`);
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
for(const[file,source]of[['EnsemblePanel.tsx',panel],['ForecastCockpit.tsx',cockpit],['App.tsx',app]]){const result=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},fileName:file,reportDiagnostics:true}),errors=(result.diagnostics||[]).filter(item=>item.category===ts.DiagnosticCategory.Error);assert.equal(errors.length,0,`${file}: ${errors.map(item=>ts.flattenDiagnosticMessageText(item.messageText,' ')).join('\n')}`)}
console.log('MID v0.9.4.0: gemeinsames Temperatur-/Niederschlag-/Wind-Böen-Deck, professionelle Cockpit-Diagramme, Unsicherheitsfade und Temperaturwerte geprüft.');
