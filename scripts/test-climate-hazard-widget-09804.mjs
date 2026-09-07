import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const [app,climate,travel,dwd,sun,foundation,modern,pkgText,baselineText]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ClimatePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/travelPlanner.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/dwdWarnings.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/sunshineDuration.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/00-foundation.css',import.meta.url),'utf8'),
 readFile(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);
const need=(label,text,token)=>assert.ok(text.includes(token),`${label}: ${token}`);
need('Kanonischer DWD-Grenzvertrag',dwd,"export function dwdWindThresholdExceededKmh(kmh:number,threshold:number){return threshold===50||threshold===140?kmh>threshold:kmh>=threshold}");
need('Kanonische Böenstufe',dwd,'export function dwdWindWarningLevelKt');
need('App nutzt zentrale Böenstufe',app,'function windDirectionWarningLevel(gust?:number){return dwdWindWarningLevelKt(Number(gust))}');
need('Bergwetter nutzt zentrale Schwellen',app,'dwdWindThresholdExceededKmh(kmh,item.threshold)');
need('Widget nutzt automatische MID-Hinweise',app,'automaticWidgetHazards=useMemo(()=>hazards(hours,undefined,elevation??0,unit)');
need('Widget ordnet Zeitfenster tagesbezogen zu',app,'widgetAutomaticHazardsForDay(d.date,automaticWidgetHazards,timezone)');
need('Widget-Hazardtage verwenden ISO-Lokaldate',app,'const first=localDateInZone(timezone,start),last=localDateInZone(timezone,end-1)');
assert.ok(!app.includes('hz:strongestDailyHazards(dailyHazards(d,hours,elevation??0,unit,1))'),'Widget fällt auf den alten separaten Tageswarnpfad zurück.');
need('Widget Sonnenschein ganzstündig',sun,'export function sunshineWholeHoursLabel');
need('Widget verwendet Ganzstunden',app,'sunshineWholeHoursLabel(d.sunshineDuration)');
need('Widget Böenfarbe folgt Warnstufe',app,'widgetmeta-wind warning-${dwdWindWarningLevelKt(d.gust)}');
need('Winter Dezember bis Februar',climate,'Winter Dez–Feb');
need('Bedeckungsklassen 1/8-nah',climate,"label:'Mittel · 4–5/8',max:62.5");
need('Bedeckung 8/8 separat',climate,"label:'Bedeckt · 8/8',max:Infinity");
need('Schneefalltage aus Tagesreihe',travel,'snowProbability:bucket.snowfall.length?bucket.snow/bucket.snowfall.length*100:NaN');
need('Schneefalltag-Schwelle transparent',travel,'snowfall>=.1');
need('Klima-Cache wegen Schemaänderung erneuert',travel,"mid:travel-climate:1991-2020:v6:");
need('Windrose benennt Tagesbasis',climate,'Tagesbasis · Armlänge = Richtungshäufigkeit');
need('Windrose behauptet keine Stundenstatistik',climate,'keine stündliche Häufigkeitsverteilung');
need('Tmax-Klimafarbe separat',foundation,'--param-temperature-max-climate:');
need('Mittel-Klimafarbe separat',foundation,'--param-temperature-mean-climate:');
need('Tmin-Klimafarbe separat',foundation,'--param-temperature-min-climate:');
need('Diagramm nutzt Tmax-Klimafarbe',modern,'climate-temp-max{stroke:var(--param-temperature-max-climate');
need('Diagramm nutzt Mittel-Klimafarbe',modern,'climate-temp-mean{stroke:var(--param-temperature-mean-climate');
need('Diagramm nutzt Tmin-Klimafarbe',modern,'climate-temp-min{stroke:var(--param-temperature-min-climate');

need('Widget Sonne vertikal zentriert',modern,'.weatherwidget.modern.compact .widgetmeta-sun{display:flex!important;align-items:center;justify-content:center');
need('Widget Sonne/Wert mit Abstand',modern,'.weatherwidget.modern.compact .widgetmeta-sun>b{display:inline-flex;align-items:center;justify-content:center;gap:5px');
need('Bedeckungsboxen haben lesbaren Vordergrund',modern,'.climate-cloud-legend span{min-height:44px');
need('Bedeckungsboxen nutzen Textfarbe',modern,'color:var(--text)!important;line-height:1.18');
need('Mitteltemperatur in Hellansicht schwarz',foundation,'--param-temperature-mean-climate:#111827');
need('Tmin in Hellansicht dunkelblau',foundation,'--param-temperature-min-climate:#174f9e');
need('Klima-Tooltip verbreitert',climate,'const overlayWidth=226');
for(const token of ['className="max"','className="mean"','className="min"','className="rain"'])need('Klima-Tooltip trennt Werte',climate,token);
need('Klima-Tooltip mit deckendem Hintergrund',modern,'.climate-value-overlay>rect{fill:var(--surface);fill-opacity:.985');
assert.ok(pkg.scripts?.['test:climate-hazard-widget']==='node scripts/test-climate-hazard-widget-09804.mjs','Package-Testeintrag fehlt.');
assert.ok(JSON.stringify(baseline).includes('scripts/test-climate-hazard-widget-09804.mjs'),'Baseline schützt die v0.9.80.4-Regression nicht.');
console.log(`MID v${pkg.version} Klima-/Hazard-/Widget-Vertrag inklusive v0.9.80.6-Lesbarkeit geprüft.`);
