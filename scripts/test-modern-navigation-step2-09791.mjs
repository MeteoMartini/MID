import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,cockpit,shortTerm,longRange,modernStyles,styles,radarColors,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/ForecastCockpit.tsx','utf8'),
 readFile('src/ShortTermForecast.tsx','utf8'),
 readFile('src/LongRangePanel.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

for(const token of [
 "type ModernForecastHorizon='90m'|'24h'|'7d'|'14d'|'46d'|'season'",
 'function ForecastHorizonNavigation',
 "{id:'90m',label:'Ab jetzt',module:'short-term'}",
 "{id:'7d',label:'7 T',module:'forecast'}",
 "{id:'14d',label:'14 T',module:'ensemble'}",
 "{id:'46d',label:'46 T',module:'long-range'}",
 "{id:'season',label:'Saison',module:'long-range'}",
 "navigationMode==='bottom-tabs'&&id===forecastWorkspaceAnchor",
 "aria-label={item.id==='90m'?'Ab jetzt: 90 Minuten und 24 Stunden':undefined}",
 "initialHorizon={navigationMode==='bottom-tabs'"
])assert.ok(app.includes(token),`App-Horizontvertrag fehlt: ${token}`);

for(const token of [
 'ref={now90Ref} className="cockpit-now90"',
 'Nächste 90 Minuten',
 'ref={profileRef} className="cockpit-meteogram-pro cockpit-weather-profile"',
 '24-h-Wetterprofil'
])assert.ok(cockpit.includes(token),`Gemeinsamer Kurzfristvertrag fehlt: ${token}`);

for(const token of [
 'Die nächsten 24 Stunden',
 "source:isQuarterInterval?'15-min':'hourly'"
])assert.ok(shortTerm.includes(token),`Classic-Kurzfrist-Gesamtvertrag fehlt: ${token}`);

for(const token of [
 "initialHorizon?:'46d'|'season'",
 "initialHorizon==='season'?seasonalRef.current:weatherTrendRef.current",
 'ref={weatherTrendRef} className="long-range-subsection weather-trend-subsection"',
 'ref={seasonalRef} className="long-range-subsection seasonal-forecast-subsection"'
])assert.ok(longRange.includes(token),`Langfrist-Fokusvertrag fehlt: ${token}`);

for(const token of [
 '/* MID v0.9.79.1 · optionales Bedienkonzept: kompakter Mobilkopf + durchgehende Prognose-Horizonte */',
 '.modern-forecast-horizons{',
 'min-height:44px',
 '.navigation-bottom-tabs>.top.settings-header{',
 ".navigation-bottom-tabs .settings-header .brand-expanded{display:none!important}",
 'width:44px!important;min-width:44px!important;height:44px!important;min-height:44px!important',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(modernStyles.includes(token),`Modern-UI-CSS-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('.modern-forecast-horizons{'),'Styles-Aggregat enthält die neue Horizontleiste nicht');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radar bleibt auf DWD-/Produktstandard gesperrt');
assert.ok(!radarColors.includes('modern-forecast-horizons'),'Navigation darf Radarfarben nicht berühren');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-navigation-step2-09791.mjs'),'Baseline-Regression für Schritt 2 fehlt');
assert.ok(!app.includes("{id:'24h',label:'24 h',module:'short-term'}"),'90 min und 24 h dürfen im modernen Horizont nicht mehr getrennt erscheinen.');
assert.ok(app.includes("return value==='24h'?'90m'"),'Persistierte alte 24-h-Auswahl muss auf den gemeinsamen Kurzfrist-Horizont migrieren.');
console.log('Optionales Bedienkonzept Schritt 2: gemeinsamer Kurzfrist-Horizont (90 min + 24 h), 7T/14T/46T/Saison, Touchziele und Radar-Isolation geprüft.');
