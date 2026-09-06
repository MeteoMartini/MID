import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,modernStyles,styles,radarColors,contract,baseline]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('src/radarColorTables.ts','utf8'),
 readFile('MID_NAVIGATION_BOTTOM_BAR_CONTRACT.md','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);

for(const token of [
 'function ModernTodayOverview',
 'className="modern-today-overview"',
 'MID · HEUTE RELEVANT',
 '7-Tage-Kurzblick',
 'Stündlich',
 "if(navigationMode!=='bottom-tabs')return currentDetails",
 'ModernTodayOverview hours={precipitationUiHours}',
 'hours={precipitationUiHours}',
 'days={displayDays}',
 'summary={cockpitSevenDaySummary}',
 'officialAlerts={official}',
 "onHours={()=>navigateModernForecastHorizon('24h')}",
 "onDays={()=>navigateModernForecastHorizon('7d')}",
 "onWarnings={()=>navigateToDashboardSection('warnings')}",
 '<MemoCurrent w={w!}'
])assert.ok(app.includes(token),`Heute-Übersichtsvertrag fehlt: ${token}`);

for(const token of [
 '/* MID v0.9.79.3 · optionales Bedienkonzept: kompakte Heute-Übersicht */',
 '.modern-today-overview{display:none}',
 '.navigation-bottom-tabs .modern-today-overview{',
 '.navigation-bottom-tabs .place-nowcards{display:none!important}',
 'min-height:44px',
 '.navigation-bottom-tabs .modern-today-hours',
 '.navigation-bottom-tabs .modern-today-days',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(modernStyles.includes(token),`Heute-CSS-Vertrag fehlt: ${token}`);
assert.ok(styles.includes('/* MID v0.9.79.3 · optionales Bedienkonzept: kompakte Heute-Übersicht */'),'Styles-Aggregat enthält die Heute-Übersicht nicht');

assert.equal((radarColors.match(/id:'dwd-standard'/g)||[]).length,1,'Radarstandard muss weiterhin genau eine Farbtabellen-ID besitzen');
assert.ok(radarColors.includes("export type RadarColorTableId='dwd-standard';"),'Radarfarbvertrag wurde verändert');
assert.ok(!radarColors.includes('modern-today-overview'),'Heute-UI darf Radarfarbtabellen nicht berühren');
assert.ok(contract.includes('Heute-Übersicht'),'Bedienvertrag dokumentiert Schritt 4 nicht');
assert.ok(contract.includes('bestehenden kanonischen Stunden- und Tagesreihen'),'Heute-Übersicht muss die bestehende Prognose wiederverwenden');

const parsed=JSON.parse(baseline);
assert.ok(parsed.requiredRegressionTests.includes('scripts/test-modern-today-overview-09793.mjs'),'Baseline-Regression für Schritt 4 fehlt');
console.log('Optionales Bedienkonzept Schritt 4: Heute-Übersicht, vorhandene Datenpfade, klassische Detailansicht, iOS-Touchziele und Radar-Isolation geprüft.');
