import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const cockpit=await readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const tones=await readFile(new URL('../src/temperatureTone.ts',import.meta.url),'utf8');
const css=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');
const modern=await readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');

assert.match(cockpit,/headerPaddingStyle=\{'--seven-day-curve-count':visible\.length,'--seven-day-curve-left-pad':`\$\{left\/width\*100\}%`,'--seven-day-curve-right-pad':`\$\{right\/width\*100\}%`\}/,'7-Tage-Kopf muss dieselben relativen SVG-Plotränder verwenden.');
assert.match(cockpit,/<div className="seven-day-curve-days" style=\{headerPaddingStyle\}>/,'Tageskopf muss die gemeinsame Plotgeometrie erhalten.');
for(const source of [css,modern]){
 assert.match(source,/\.seven-day-curve-days\{[^}]*padding:0 var\(--seven-day-curve-right-pad,10px\) 0 var\(--seven-day-curve-left-pad,42px\)/,'CSS muss die vom SVG abgeleiteten linken/rechten Plotränder verwenden.');
 assert.doesNotMatch(source,/@media\(max-width:620px\)\{[^}]*\.seven-day-curve-days\{padding-left:/,'Mobile CSS darf die deckungsgleiche Plotgeometrie nicht überschreiben.');
}

const sevenDayTemps=cockpit.match(/<span className="cockpit-day-temps">[\s\S]*?<\/span>\n   <span className="cockpit-day-temp-track">/)?.[0]??'';
assert.ok(sevenDayTemps,'7-Tage-Tmin/Tmax-Block nicht gefunden.');
assert.doesNotMatch(sevenDayTemps,/<small>Min<\/small>|<small>Max<\/small>/,'7-Tage-Cockpit darf Min/Max-Zusatzlabels nicht anzeigen.');
const classicSeven=app.match(/<div className="forecast-barwrap">[\s\S]*?<ForecastHazards/)?.[0]??'';
assert.ok(classicSeven,'Klassischer 7-Tage-Tmin/Tmax-Block nicht gefunden.');
assert.doesNotMatch(classicSeven,/<small>Min<\/small>|<small>Max<\/small>/,'Klassische 7-Tage-Liste darf Min/Max-Zusatzlabels nicht anzeigen.');

assert.match(tones,/background:`color-mix\(in srgb,\$\{color\} 10%,transparent\)`/,'7-Tage-ECMWF-Badgehintergrund muss auf 10 % abgeschwächt sein.');
assert.match(tones,/backgroundShare=Math\.round\(5\+bounded\*11\)/,'14-Tage-Klimabadgehintergrund muss abgeschwächt sein.');
assert.ok(cockpit.includes('cockpit-fourteen-temps')&&cockpit.includes('minTone=ecmwfTemperatureTone(item.bestMin),maxTone=ecmwfTemperatureTone(item.bestMax)'),'14-Tage-Tmin/Tmax müssen die ECMWF-Farblogik verwenden.');
assert.match(modern,/\.climate-tone-daily>span\{[^}]*-webkit-text-stroke:\.28px/,'Farbige Temperaturziffern brauchen einen dünnen kontrastierenden Ziffernrahmen.');
assert.match(modern,/\.seven-day-curve-temps \.ecmwf-value-badge\{[^}]*border:1px solid transparent/,'ECMWF-Werte im 7-Tage-Kopf brauchen einen dünnen Badge-Rahmen.');

console.log('7-Tage-Achsen-/Badge-Lock v0.9.78.4 bestanden.');
