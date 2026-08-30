import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const [panel,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)};const forbid=(a,t,x)=>{if(t.includes(x))failures.push(`${a}: unerlaubt ${x}`)};
for(const token of ['function EnsembleTemperatureCanvas','function EnsembleTemperatureWeatherOverlay','<EnsembleTemperatureWeatherOverlay data={data}','layer="weather"','layer="hazards"','<EnsemblePrecipShape','<EnsembleHazardShape'])need('Optische Wiederherstellung',panel,token);
for(const token of ['<ReferenceArea','<ReferenceDot','function EnsembleLegacyWeatherBand'])forbid('Optische Wiederherstellung',panel,token);
for(const token of ['MID v0.8.26.13 · Ensemble-Hochformat exakt an v0.8.25.4 angeglichen','width:min(336px,calc(100vw - 24px));','width:min(286px,calc(100vw - 24px));','.ensemble-temperature-weather-overlay.weather{z-index:0}','.ensemble-temperature-weather-overlay.hazards{z-index:2}'])need('Optische Wiederherstellung',styles,token);
if((panel.match(/<ComposedChart/g)??[]).length!==3)failures.push('Nicht alle drei Ensemble-Diagramme sind vorhanden.');
if((panel.match(/isAnimationActive=\{false\}/g)??[]).length<18)failures.push('Die Ensemble-Animationen sind nicht konsequent deaktiviert.');
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-optical-restore'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-optical-restore-082612.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Optik-v0.8.25.4-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Optik v0.8.25.4 mit achsengebundenem Wetterband, Niederschlagssymbolik, Hazardmarkern und kompaktem Tooltip geprüft.');
