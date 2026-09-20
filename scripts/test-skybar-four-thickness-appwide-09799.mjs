import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [skybar,precipitation,renderer,app,cockpit,styles,polish,axisFix,favoriteLogoSquares,currentMoreTrend,main,midDesign,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/detailSkyBar.ts'),read('src/precipitation.ts'),read('src/SkyBarSegments.tsx'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/styles-src/30-modern.css'),read('src/midC18NowcastSkybarPolish.css'),read('src/midC18AxisLayoutFix.css'),read('src/midC18FavoriteLogoSkySquaresFix.css'),read('src/midC18CurrentMoreTrendPolish.css'),read('src/main.tsx'),read('src/MidDesign.tsx'),read('MID_24H_PROFILE_STORY_AXIS_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-skybar-four-thickness-appwide-09799.mjs';

assert.ok(skybar.includes('const SKYBAR_THICKNESS_STEPS=[2.4,3.6,4.8,6.0] as const'),'Vier klar getrennte Skybar-Dicken fehlen.');
for(const threshold of ['if(value<.625)return 0;','if(value<.75)return 1;','if(value<.875)return 2;','return 3;'])assert.ok(skybar.includes(threshold),`50–100-%-Vierstufen-Schwelle fehlt: ${threshold}`);
assert.ok(skybar.includes('thicknessLevel:1|2|3|4;')&&skybar.includes('thicknessLevel:skybarThicknessLevel(level)'),'Skybar-Segmente müssen ihre tatsächlich verwendete Stufe 1–4 mitführen.');
assert.ok(skybar.includes('precipitationIntensityDescriptor')&&precipitation.includes("if(rateMmh<=.5)return result(1,'leicht'")&&precipitation.includes("if(rateMmh<=4)return result(2,'mäßig'")&&precipitation.includes("return result(3,'stark'")&&precipitation.includes('tenMinuteMm=rateMmh/6')&&precipitation.includes("level>=4?'sehr stark'"),'Niederschlag muss typabhängig die amtlich vorhandenen DWD-Intensitätsstufen nutzen; Stufe 4 ist für sehr starke Schauer verfügbar.');
assert.ok(!precipitation.includes('amount<15')&&!precipitation.includes('amount>=15')&&!precipitation.includes('rateMmh>=15'),'Dauerregen darf keine künstliche vierte Intensitätsklasse erhalten.');
assert.ok(renderer.includes('data-skybar-level={segment.thicknessLevel}'),'Renderer muss die wirksame Dickenstufe für DOM-/Screenshot-Diagnose ausgeben.');
assert.ok(skybar.includes('export function detailSkyBarHourCells(hours:PrecipSample[]):SkyBarHourCell[]'),'Optionale Stundenquadrate müssen direkt aus derselben kanonischen Skybar-Logik abgeleitet werden.');
assert.ok(skybar.includes("const visuals=weatherStripVisuals(hour,intervalSeconds)"),'Stundenquadrate dürfen keine zweite Wetterklassifikation erfinden.');
assert.ok(renderer.includes('export function SkyBarHourCellsSvg')&&renderer.includes('data-mid-skybar-cells="24h"'),'24-Stundenquadrate brauchen einen eigenen zentralen Renderer.');
assert.ok(app.includes("type SkybarDisplayMode='band'|'squares'")&&app.includes("skybarDisplayMode:'band'"),'Skybar muss Standard bleiben und Quadratmodus explizit typisiert sein.');
assert.ok(app.includes("allDayHours.slice(0,24)")&&app.includes('detailSkyBarHourCells'),'Quadratmodus muss die unveränderte Einzelstundenfolge und maximal 24 reale Stundenpositionen verwenden.');
assert.ok(app.includes('24 Stundenquadrate')&&app.includes('Eine gleich große Zelle je Einzelstunde'),'Persistente Einstellungsoption für die Stundenquadrate fehlt.');
assert.ok(app.includes('data-skybar-display={skybarDisplayMode}')&&app.includes('data-mid-skybar="squares"'),'Forecast muss den gewählten Darstellungsmodus sichtbar rendern.');
assert.ok(polish.includes("[data-skybar-display='squares'] .mid-skybar-note")&&polish.includes('.settings-skybar-preview.squares'),'Quadratmodus braucht passende Legenden-/Einstellungspolitur.');
assert.ok(cockpit.includes('shortTermNinetyMinutePoints(adjusted,profileNow)')&&cockpit.includes('now90SkyCells=detailSkyBarHourCells(now90)'),'90-Minuten-Kurzfrist muss dieselbe Wetterzustandslogik in sechs 15-Minuten-Zellen verwenden.');
assert.ok(cockpit.includes('data-skybar-display={skybarDisplayMode}')&&cockpit.includes('profileSkyBarHourCells=detailSkyBarHourCells')&&cockpit.includes('daySkyBarHourCells=detailSkyBarHourCells')&&cockpit.includes('skyBarHourCells=detailSkyBarHourCells(skyBarHours)'),'Quadratmodus muss Profil, Tageskarten und 7-Tage-Wetterstreifen aus derselben Skybar-Logik ableiten.');
assert.ok(app.includes('currentThreadSkyCells=detailSkyBarHourCells(currentThreadSkyHours)')&&app.includes('Stündliche Wetterquadrate der nächsten zwölf Stunden'),'Aktuell muss die gewählte Stundenanzeige auch im 12-h-Trend verwenden.');
assert.ok(app.includes('skybarDisplayMode={forecastDisplaySettings.skybarDisplayMode}'),'Globale Einstellung muss an das Prognose-Cockpit weitergereicht werden.');
assert.ok(polish.includes('.current-weather-thread-sky')&&polish.includes('.cockpit-now90-sky')&&polish.includes("@media(max-width:430px)"),'Reduzierte 12-h-/90-min-Wetterzustandsleisten müssen auf schmalen Smartphones kompakt und viewportfest bleiben.');
assert.ok(main.includes("import './midC18NowcastSkybarPolish.css';"),'Nowcast-/Skybar-Polish fehlt im Produktionsentry.');
assert.ok(main.includes("import './midC18AxisLayoutFix.css';"),'Zeitachsen-/7-Tage-Fix muss zuletzt im Produktionsentry geladen werden.');
assert.ok(main.includes("import './midC18FavoriteLogoSkySquaresFix.css';"),'Favoriten-/Logo-/Wetterquadrat-Polish muss im Produktionsentry geladen werden.');
assert.ok(main.includes("import './midC18CurrentMoreTrendPolish.css';"),'Aktuell-Trend-/Mehrbereich-Polish muss im Produktionsentry geladen werden.');
assert.ok(app.includes('verticalGridDivisions={Math.max(1,currentThreadHorizon)}'),'12-h-Temperaturtrend muss je Stunde eine vertikale Hilfslinie erhalten.');
assert.ok(app.includes('index%3===0||index===currentThreadSeries.length-1'),'12-h-Zeitachse muss mindestens alle drei Stunden beschriftet sein.');
assert.ok(app.includes('currentThreadDeltaRounded=Number.isFinite(currentThreadDelta)?Math.round(currentThreadDelta)'),'Temperaturtrend darf in der sichtbaren Trendangabe nur ganzzahlig erscheinen.');
assert.ok(app.includes("label:'Ab jetzt',module:'short-term'")&&app.includes("'Ab jetzt: 90 Minuten und 24 Stunden'"),'Kurzfrist-Untertab muss gegenüber dem Bottom-Bar-Ziel Heute eindeutig als Ab-jetzt-Horizont bezeichnet sein.');
assert.ok(app.includes('className="metrics current-more-metrics"')&&app.includes('Weitere aktuelle Werte')&&app.includes('Atmosphäre, Umwelt & Astronomie'),'Aktuell-Mehrbereich braucht eine klare visuelle Informationshierarchie.');
assert.ok(currentMoreTrend.includes('#current-weather-metrics.current-more-metrics')&&currentMoreTrend.includes('.current-more-head')&&currentMoreTrend.includes('grid-template-columns:repeat(2,minmax(0,1fr))'),'Aktuell-Mehrbereich muss als kompakter responsiver Informationsbereich gestaltet sein.');
assert.ok(app.includes('quickTapStart')&&app.includes('quickTapEnd')&&app.includes('einmal tippen zum Auswählen'),'Favoritenleiste muss Touch-Taps getrennt von Scroll-/Drag-Gesten zuverlässig behandeln.');
assert.ok(favoriteLogoSquares.includes('min-height:44px!important')&&favoriteLogoSquares.includes('touch-action:pan-x!important'),'Favoritenkarten brauchen ein vollwertiges Touchziel und horizontales Scrollen ohne Tap-Verlust.');
assert.ok(favoriteLogoSquares.includes('background:transparent!important')&&favoriteLogoSquares.includes('object-fit:contain!important'),'MID-Logo muss transparent und unverzerrt eingebettet bleiben.');
assert.ok(renderer.includes("SUN_CELL_SHADES")&&renderer.includes("CLOUD_CELL_SHADES"),'Wetterquadrate brauchen erkennbare Sonnen-/Bewölkungsabstufungen aus derselben Skybar-Stufe.');
assert.ok(!renderer.includes("cell.state==='clear-night'&&!base&&!precip?<circle"),'Unklare Punktkodierung für klare Nacht darf nicht mehr gerendert werden.');
assert.ok(renderer.includes("cell.state==='clear-night'&&!base&&!precip?<rect"),'Klare Nacht muss als ruhige Flächenzelle statt als rätselhafter Punkt erscheinen.');
assert.ok(favoriteLogoSquares.includes("current-weather-thread-sky[data-skybar-display='squares']")&&favoriteLogoSquares.includes("cockpit-now90-sky[data-skybar-display='squares']"),'12-h- und 90-min-Wetterquadrate müssen visuell groß genug bleiben.');
assert.ok(midDesign.includes('className="mid-weather-thread-grid"')&&midDesign.includes('gridY=[8,50,92]')&&midDesign.includes('verticalGridDivisions=2')&&midDesign.includes('safeVerticalDivisions'),'Temperaturfaden braucht konfigurierbare vertikale Hilfslinien.');
assert.ok(app.includes('data-mid-time-axis="current-12h"')&&app.indexOf('data-mid-time-axis="current-12h"')<app.indexOf('className="current-weather-thread-sky"'),'12-h-Zeitachse muss direkt der Temperaturkurve folgen und vor dem Wetterstreifen liegen.');
assert.ok(cockpit.includes('className="cockpit-now90-track" data-cockpit-horizontal-scroll="true"')&&cockpit.includes('data-mid-time-axis="now90"')&&cockpit.includes("'--now90-count':Math.max(1,now90.length)"),'90-Minuten-Wetterstreifen, Zeitachse und Karten müssen einen gemeinsamen horizontalen Raster-/Scrollraum verwenden.');
for(const token of ['grid-template-columns:repeat(var(--now90-count),minmax(0,1fr))!important','min-width:max(100%,calc(var(--now90-count) * var(--now90-slot-width)))!important','grid-template-columns:minmax(0,1fr)!important','overflow-x:hidden!important'])assert.ok(axisFix.includes(token),`Zeitachsen-/7-Tage-Layoutvertrag fehlt: ${token}`);

for(const token of ['data-mid-skybar="react"','data-mid-skybar="profile"','data-mid-skybar="seven-day"','data-mid-skybar="day-card"'])assert.ok((app+cockpit).includes(token),`Appweite Skybar-Einbindung fehlt: ${token}`);
assert.ok((app.match(/<SkyBarSegmentsSvg/g)||[]).length>=1&&(cockpit.match(/<SkyBarSegmentsSvg/g)||[]).length>=3,'Alle sichtbaren Skybars müssen denselben zentralen Renderer nutzen.');
assert.ok(cockpit.includes('y="7.4" width="98" height="1.2" rx="0.6"')&&styles.includes('.cockpit-day-skybar-rail{fill:color-mix(in srgb,var(--text) 7%,transparent)}'),'7-Tage-Tageskarte darf die vier Dickenstufen nicht durch eine dicke Grundschiene optisch nivellieren.');
assert.ok(contract.includes('`2.4 / 3.6 / 4.8 / 6.0` SVG-Einheiten'),'Dokumentierter Dickenvertrag ist nicht auf dem aktuellen Stand.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'Skybar-Vierstufenregression fehlt in requiredFiles.');

console.log(`MID v${pkg.version}: Skybar-Vierstufen und optionale 24 echte Stundenquadrate sind zentral, persistent und ohne Normalisierung geschützt.`);
