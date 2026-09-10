import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [app,cockpit,foundation,pkgText,baselineText]=await Promise.all([
 read('src/App.tsx'),
 read('src/ForecastCockpit.tsx'),
 read('src/styles-src/00-foundation.css'),
 read('package.json'),
 read('MID_BASELINE.json'),
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),test='scripts/test-widget-curve-overview-09845.mjs';
const need=(label,text,token)=>assert.ok(text.includes(token),`${label}: ${token}`);

need('Widget speichert die unabhängige Auswahl',app,"type WidgetView='cards'|'curve'|'ensemble'");
need('Widget bietet 3 bis 7 Tage',app,'WIDGET_DAY_OPTIONS=[3,4,5,6,7] as const');
need('Widget rendert alle gewählten Tage',app,'WIDGET_DAY_OPTIONS.map(x=><option key={x}>{x}</option>)');
need('Widget nutzt die kanonische Kurvenübersicht',app,'<SevenDayCurveOverview days={previewDays} hours={precipitationDisplayHours} presentationReady');
need('Kurvenansicht steuert Niederschlag',app,'showRain={showRain}');
need('Kurvenansicht steuert Sonnenschein',app,'showSunshine={showSunshine}');
need('Kurvenansicht steuert Wind',app,'showWind={showWind}');
need('Kurvenansicht steuert optionale ECMWF-Temperaturfarben',app,'ecmwfTemperatureColors={ecmwfTemperatureColors}');
need('Alte Widgetstände aktivieren Niederschlag einmalig',app,"(parsed.schema===2||parsed.schema===3)&&typeof parsed.showRain==='boolean'?parsed.showRain:true");
assert.ok(!app.includes('function WidgetCurve('),'Der alte parallele Widget-Kurvenrenderer ist noch vorhanden.');
need('Kurvenoption ist eigenständig',app,"view==='ensemble'?ensemblePanel:view==='curve'?<SevenDayCurveOverview");
need('Kurvenkomponente ist wiederverwendbar',cockpit,'export function SevenDayCurveOverview');
need('Kurvenkopf passt sich der Tageszahl an',cockpit,'dayCountLabel=visible.length===1?');
need('Kurvenansicht trägt Tageskopf und Piktogramme',cockpit,'seven-day-curve-days');
need('Kurvenansicht trägt Temperaturwerte',cockpit,'ecmwfTemperatureTone(day.min)');
need('Kurvenansicht trägt Skybar',cockpit,'SkyBarSegmentsSvg segments={skyBarSegments}');
need('Kurvenansicht trägt Niederschlagssäulen',cockpit,'showRain&&rainItems.map');
need('Kurvenansicht trägt kompakte Tageswerte für Wind und Böen',cockpit,'className="seven-day-curve-wind-row"');
need('Kurvenansicht trägt tägliche Hazards',cockpit,'className="seven-day-curve-hazard-row"');
need('Kurvenansicht übernimmt normalisierte Widgetstunden verlustfrei',cockpit,'presentationReady?hours:precipitationPresentationHours(hours)');
need('Niederschlagsmenge hat robusten Komponentenfallback',cockpit,'Math.max(parts.total,direct,components)');
need('Widget-Kurvenansicht folgt dem Referenzdesign',foundation,'.weatherwidget.modern.compact.widget-view-curve');
need('Widget-Kurvenansicht nutzt die dunkle Referenzfläche',foundation,'background:#081a2b');
need('Widget-Kurvenansicht bleibt responsiv',foundation,'@media(max-width:760px){.weatherwidget.modern.compact.widget-view-curve');
need('Kurven-SVG erzeugt keinen künstlichen Leerraum',foundation,'min-height:0!important;aspect-ratio:700/224');
need('Widgetmenü hält Auswahlfelder stabil',foundation,'.widget-control-grid{display:grid;gap:5px;min-width:0}');
need('Widgetmenü verhindert Checkbox- und Textumbruch',foundation,'white-space:nowrap!important;-webkit-line-clamp:unset');
need('Helle gelbe Windwarnstufe bleibt lesbar',foundation,'.weatherwidget.modern.light .widgetmeta-wind.warning-1{color:#654b00');
need('Heller Windpfeil hat einen kontrastreichen Kreis',foundation,'.widget-view-curve.light .seven-day-curve-wind .cockpit-inline-wind-arrow');
assert.equal(pkg.scripts?.['test:widget-curve-overview'],'node scripts/test-widget-curve-overview-09845.mjs','Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Baseline schützt den Widget-Kurvenvertrag nicht.');
console.log(`MID v${pkg.version}: eigenständige 3-/4-/5-/6-/7-Tage-Widget-Kurvenübersicht mit Tageskopf, Piktogrammen, Skybar, Temperaturkurve und Niederschlagssäulen geprüft.`);
