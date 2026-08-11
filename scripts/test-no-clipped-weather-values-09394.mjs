import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [weather,cockpit,app,ensemble,styles]=await Promise.all([
  readFile(new URL('src/weather.ts',root),'utf8'),
  readFile(new URL('src/ForecastCockpit.tsx',root),'utf8'),
  readFile(new URL('src/App.tsx',root),'utf8'),
  readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
  readFile(new URL('src/styles.css',root),'utf8')
]);

assert.ok(weather.includes('export function precipitationProbabilityWindowCompactLabel'),'Kompakte 6-h-Zeitfensternotation fehlt.');
assert.ok(weather.includes("return `${String(window.startHour).padStart(2,'0')}–${String(window.endHour).padStart(2,'0')}h`"),'6-h-Kompaktnotation verschwendet weiterhin Platz durch abgesetztes „ h“.');
assert.ok(weather.includes('export function precipitationDurationCompactLabel'),'Kompakte Niederschlagsdauer fehlt.');
assert.ok(weather.includes("if(minutes<=0)return''"),'0 Minuten werden in Kompaktkarten weiterhin redundant ausgegeben.');
assert.ok(weather.includes('return `max. Std. ${primary}%`'),'Best-Match-Fallback muss als Stundenmaximum gekennzeichnet bleiben.');

assert.ok(cockpit.includes('className="cockpit-day-pop"'),'Die PoP-Zeile besitzt im 7-Tage-Cockpit keine eigene volle Kartenbreite.');
assert.ok(cockpit.includes("precipitationCompactMeta=[precipitationProbabilityCompact,precipitationDurationCompact].filter(Boolean).join(' · ')"),'Cockpit kombiniert PoP und Dauer nicht platzsparend.');
assert.ok(!cockpit.includes('<span className="cockpit-day-rain" title={`${precipitationAmountLabel(day)} · ${dailyPrecipitationProbabilityTitle(day)} · Dauer ${precipitationDuration}`}><b>{precipitationAmountLabel(day)}</b><small>'),'PoP steckt weiterhin in der halben Niederschlagsspalte.');

assert.ok(app.includes('className="forecast-meta-rain"')&&app.includes('<b>💧 {precipitationAmountLabel(d)}</b><small>'),'Klassische 7-Tage-Zeile ist nicht in Menge und kompakte Zusatzzeile strukturiert.');
assert.ok(app.includes('className="widgetmeta-rain"')&&app.includes('className="widgetmeta-wind"'),'Widget-Metadaten sind nicht in umbrechbare Teilzeilen aufgeteilt.');
assert.ok(ensemble.includes('precipitationProbabilityWindowCompactLabel(peak)'),'Ensemblekarten verwenden nicht dieselbe platzsparende 6-h-Notation.');

const patch=styles.lastIndexOf('/* MID v0.9.39.4');
assert.ok(patch>=0,'Responsiver Nicht-Abschneiden-Patch fehlt.');
const legacy=styles.lastIndexOf('.cockpit-day-rain b,.cockpit-day-rain small,.forecast-meta-rain,.widgetmeta>span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}');
assert.ok(legacy<patch,'Der alte Ellipsis-Patch gewinnt weiterhin in der CSS-Kaskade.');
for(const token of [
  '"rain wind" "pop pop" "hourly hourly"!important',
  '.cockpit-day-pop{',
  '.forecast-meta-rain{',
  '.widgetmeta>span{',
  '.weatherwidget.modern.compact .widgetlabel{',
  '.forecast-hazards .compact-hazard em,',
  '.quickfacts .quickfact.weather>b,',
  '.cockpit-fourteen-weather-label,',
  '.dwd-precip-type-radar>header em,',
  '.weather-maps-meta small,',
  '.mountain-snowline-summary em,'
])assert.ok(styles.slice(patch).includes(token),`Nicht-Abschneiden-Schutz fehlt: ${token}`);
assert.ok(styles.slice(patch).includes('text-overflow:clip!important'),'Wetterwerte werden im finalen Override nicht explizit gegen Ellipsis geschützt.');
assert.ok(styles.slice(patch).includes('white-space:normal!important'),'Enge Wettertexte müssen im finalen Override umbrechen dürfen.');

console.log('Kompaktlayout geprüft: Tages-PoP nutzt volle Breite, 0-min-Dauer entfällt, Widget/klassische Prognose umbrechen und fachliche Wetterwerte werden nicht per Ellipsis abgeschnitten.');
