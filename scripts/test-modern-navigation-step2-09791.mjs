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
 "{id:'90m',label:'90 min',module:'short-term'}",
 "{id:'24h',label:'24 h',module:'short-term'}",
 "{id:'7d',label:'7 T',module:'forecast'}",
 "{id:'14d',label:'14 T',module:'ensemble'}",
 "{id:'46d',label:'46 T',module:'long-range'}",
 "{id:'season',label:'Saison',module:'long-range'}",
 "navigationMode==='bottom-tabs'&&id===forecastWorkspaceAnchor",
 "shortTermFocusWindow={navigationMode==='bottom-tabs'",
 "focusWindow={navigationMode==='bottom-tabs'",
 "initialHorizon={navigationMode==='bottom-tabs'"
])assert.ok(app.includes(token),`App-Horizontvertrag fehlt: ${token}`);

for(const token of [
 "shortTermFocusWindow?:'90m'|'24h'",
 "focusWindow?:'90m'|'24h'",
 "focusWindow==='24h'?profileRef.current:now90Ref.current",
 'ref={now90Ref} className="cockpit-now90"',
 'ref={profileRef} className="cockpit-meteogram-pro cockpit-weather-profile"'
])assert.ok(cockpit.includes(token),`Cockpit-Fokusvertrag fehlt: ${token}`);

for(const token of [
 "focusWindow?:'90m'|'24h'",
 "focusWindow==='24h'?Math.max(0,points.findIndex(point=>point.source==='hourly')):0",
 'data-focus-window={focusWindow}'
])assert.ok(shortTerm.includes(token),`Classic-Kurzfrist-Fokusvertrag fehlt: ${token}`);

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
console.log('Optionales Bedienkonzept Schritt 2: Mobilkopf, 90m/24h/7T/14T/46T/Saison-Fokus, Touchziele und Radar-Isolation geprüft.');
