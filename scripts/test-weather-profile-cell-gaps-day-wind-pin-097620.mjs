import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [cockpit,radar,app,modern,foundation,styles,pkgRaw,baselineRaw,implementation]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/DwdPrecipitationTypeRadar.tsx'),read('src/App.tsx'),
 read('src/styles-src/30-modern.css'),read('src/styles-src/00-foundation.css'),read('src/styles.css'),
 read('package.json'),read('MID_BASELINE.json'),read('MID_IMPLEMENTATION_0.9.76.21.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-weather-profile-cell-gaps-day-wind-pin-097620.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.76.20'));
assert.equal(baseline.releaseVersion,pkg.version,'Paket- und Baseline-Version müssen synchron sein.');
assert.equal(pkg.scripts?.['test:weather-profile-cell-gaps-day-wind-pin'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);

for(const token of [
 'const profileBandGeometry=',
 'const bandCellGeometry=',
 'const probabilityCellGeometry=',
 'const cloudCellGeometry=',
 'const band=bandCellGeometry(item)',
 'const probabilityBand=probabilityCellGeometry(item)',
 'cloudBand=cloudCellGeometry(item)'
])assert.ok(cockpit.includes(token),`24-h-Zellabstand fehlt: ${token}`);
assert.ok(!cockpit.includes('x={item.columnLeft+.55} y={thermalFeelTop} width={Math.max(0,item.columnWidth-1.1)}'),'Thermisches Empfinden verwendet noch die randberührende Altgeometrie.');
assert.ok(!cockpit.includes('x={item.columnLeft+.7} y={row.y} width={Math.max(0,item.columnWidth-1.4)}'),'Wolkenbänder verwenden noch die randberührende Altgeometrie.');
for(const token of [
 'axisLabelYOffset=3.7',
 'y={y+axisLabelYOffset}>{tick}°',
 'y={y+axisLabelYOffset}>{formatDecimalFixed(tick,tick>=1?0:1)}',
 "y={y+axisLabelYOffset}>{wind(tick,unit).replace",
 'className="profile-scale-label left pressure" textAnchor="end" x={leftScaleLabelX} y={y+axisLabelYOffset}'
])assert.ok(cockpit.includes(token),`Einheitlicher Achsenwert-Abstand fehlt: ${token}`);
assert.ok(modern.includes('.cockpit-weather-profile .temperature-line{stroke-width:3.35}'),'24-h-Temperaturkurve ist nicht auf die dünnere Tagesansicht-Anmutung reduziert.');
assert.ok(styles.includes('.cockpit-weather-profile .temperature-line{stroke-width:3.35}'),'Styles-Aggregat enthält die dünnere 24-h-Temperaturkurve nicht.');

assert.ok(radar.includes('<MapPin size={18} aria-hidden="true"/></button>'),'DWD-Ortsmarker muss nur noch die kompakte Stecknadel enthalten.');
assert.ok(!radar.includes("<MapPin size={22}/><span>{location.name||'Standort'}</span>"),'DWD-Ortsmarker darf keinen Ortsnamen über das Bild legen.');
for(const css of [modern,styles]){
 assert.ok(css.includes('.dwd-precip-type-radar__location-marker{position:absolute;z-index:6;display:grid;place-items:center;width:22px;height:22px'), 'Kompakte 22-px-Stecknadel fehlt.');
 assert.ok(css.includes('.dwd-precip-type-radar__location-marker span{display:none}'),'Markertext muss verborgen bleiben.');
}

assert.ok(app.includes('function WindDirectionArrow({direction,gust,className='),'Appweiter Windrichtungspfeil nimmt keine Böe zur Warnfarbenermittlung an.');
assert.ok(app.includes('warningLevel=windDirectionWarningLevel(gust)'),'Warnstufe wird beim Tages-Windpfeil nicht aus der Böe abgeleitet.');
for(const token of [
 '<WindDirectionArrow direction={d.direction} gust={d.gust}/>',
 '<WindDirectionArrow direction={hour.direction} gust={hour.gust}/>',
 '<WindDirectionArrow direction={currentHour.direction} gust={currentHour.gust}/>'
])assert.ok(app.includes(token),`Tages-/Stundenansicht übergibt die Böe nicht an den Windpfeil: ${token}`);
for(const css of [foundation,styles])for(const token of [
 '.wind-direction-arrow.warning-1{color:#e6c229}',
 '.wind-direction-arrow.warning-2{color:#ef8d32}',
 '.wind-direction-arrow.warning-3{color:#e74a4a}',
 '.wind-direction-arrow.warning-4{color:#9b59c6}'
])assert.ok(css.includes(token),`Warnfarbvertrag für Tages-Windpfeile fehlt: ${token}`);

for(const token of ['Einzelkästchen','Stecknadel','Windpfeile','Warnschwelle'])assert.ok(implementation.includes(token),`Umsetzungsnachweis fehlt: ${token}`);
console.log(`MID v${pkg.version}: getrennte 24-h-Zellen, einheitliche Achsenwerte, dünnere Temperaturkurve, kompakter DWD-Pin und warnfarbige Tages-Windpfeile geprüft.`);
