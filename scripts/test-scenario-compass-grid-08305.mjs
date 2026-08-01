import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const weather=readFileSync(new URL('../src/weather.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
if(pkg.version!=='0.8.30.5')failures.push(`Unerwartete Version: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}`);
for(const token of [
 "function scenarioTemperatureRange(minimum:number,maximum:number){return String(Math.round(minimum))+'–'+String(Math.round(maximum))+'\\u00a0\\u00b0C'}",
 '{scenarioTemperatureRange(minimum,maximum)}',
 '{scenarioTemperatureRange(point.min,point.max)}',
 'function forecastLeadDays(',
 'secureLeadDays=forecastLeadDays(data[0]?.date,secureLast?.date)',
 "`${secureLeadDays} ${secureLeadDays===1?'Tag':'Tage'} im Voraus mit guter Modellübereinstimmung`",
 '<ReferenceLine key={`temperature-vertical-${row.date}`} x={row.x}',
 '<ReferenceLine key={`temperature-horizontal-${value}`} yAxisId="t" y={value}',
 '<ReferenceLine key={`rain-horizontal-${value}`} yAxisId="mm" y={value}',
 '<ReferenceLine key={`wind-horizontal-${value}`} yAxisId="wind" y={value}'
])if(!panel.includes(token))failures.push(`EnsemblePanel fehlt: ${token}`);
if(!weather.includes("temperatureRange=String(Math.round(minimum))+' bis '+String(Math.round(peak))+'\\u00a0\\u00b0C'"))failures.push('Szenario-Zusammenfassung verwendet kein robustes Temperaturformat.');
if(panel.includes('className="ensemble-weather-day-guide"'))failures.push('Versetzte manuelle Tageshilfslinie ist noch vorhanden.');
for(const token of ['MID v0.8.30.5 · achsgenaue Ensemble-Rasterlinien und robuste Szenario-/Kompasswerte','.ensemble-major-grid-line.horizontal{','.ensemble-major-grid-line.vertical{'])if(!css.includes(token))failures.push(`CSS fehlt: ${token}`);
if(failures.length){console.error('MID v0.8.30.5 Szenario-/Kompass-/Rasterprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Szenario-Temperaturen, Prognose-Vorlaufzählung und achsgenaue Haupt-Rasterlinien geprüft.');
