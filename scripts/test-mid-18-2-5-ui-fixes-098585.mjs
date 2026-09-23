import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,cockpit,styles,main,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/midC18ResponsiveCorrections.css'),read('src/main.tsx'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-5-ui-fixes-098585.mjs';
const patch=Number(String(pkg.version).split('.').at(-1));
assert.ok(Number.isFinite(patch)&&patch>=85,'Gesammelter UI-Einschub muss ab MID v0.9.85.85 erhalten bleiben.');

assert.ok(app.includes('className="current-wind-inline"')&&app.includes('<WindDirectionArrow direction={windDirection} gust={displayWindGust}/>'),'Aktuell/Wind muss denselben Windrichtungspfeil wie „Mehr“ verwenden.');
assert.ok(app.includes('className="current-weather-thread-title"')&&app.includes('className="current-weather-thread-delta"'),'Der +12-h-Header braucht getrennte Titel- und Delta-Bereiche.');
assert.ok(app.includes("data-active={active===item.id?'true':'false'}"),'7-T/14-T-Horizont muss einen robusten aktiven Darstellungsvertrag besitzen.');

assert.ok(!cockpit.includes("const PROFILE_RESOLUTION_KEY='mid:forecastCockpit:profileResolution'"),'Die separate 3-h-Profilauflösung muss vollständig entfernt sein.');
assert.ok(!cockpit.includes('profileResolution')&&!cockpit.includes('setProfileResolution'),'24-h-Wetterprofil darf keinen 1h/3h-Umschalter mehr führen.');
assert.ok(!cockpit.includes('cockpit-weather-profile__resolution'),'Auflösungs-Schalter im 24-h-Profil muss entfernt sein.');
assert.ok(cockpit.includes('24 Stunden · 1-stündlich'),'Einzeldaten müssen den verbleibenden stündlichen Profilvertrag ausweisen.');
assert.ok(cockpit.includes('profileDisplayPoints=profileHourlyPoints'),'24-h-Profil muss die kanonische stündliche Reihe direkt verwenden.');

assert.ok(!cockpit.includes('<small>24-Stunden-Wetter</small>'),'Gedoppelte 14-Tage-Zeile „24-Stunden-Wetter“ muss entfernt sein.');
assert.ok(cockpit.includes('className="cockpit-fourteen-detail-skybar"')&&cockpit.includes('Skybar · 24 Einzelstunden')&&cockpit.includes('00–23 Lokalzeit'),'14-Tage-Detail muss ab v0.9.85.93 die Replit-24-h-Einzelstunden-Skybar zusätzlich zur kompakten Tages-Skybar führen.');
assert.ok(cockpit.includes('sunshineWholeHoursLabel(item.bestSunshineDuration)'),'Hauptwert der Sonnenstunden muss ganzzahlig formatiert werden.');
assert.ok(cockpit.includes('sunshineHoursLabel(item.sunshineDurationLow)')&&cockpit.includes('sunshineHoursLabel(item.sunshineDurationHigh)'),'P10/P90-Spannen dürfen ihre Dezimaldarstellung behalten.');

for(const token of [
 '.modern-forecast-horizons button[data-active=\'true\']',
 '.cockpit-seven-grid>.cockpit-day.mid-forecast-row',
 '.cockpit-consistency-pill',
 '.cockpit-meteogram-pro__canvas',
 '.current-weather-thread-delta'
])assert.ok(styles.includes(token),`Responsive Korrektur fehlt: ${token}`);
assert.ok(styles.includes('@media(min-width:1101px)')&&styles.includes('@media(max-width:720px) and (orientation:portrait)'),'Desktop- und Smartphone-Hochformatverträge fehlen.');
assert.ok(!styles.includes('min-width:640px!important'),'Der alte erzwungene 640-px-Profilscroll darf nicht zurückkehren.');
assert.ok(styles.includes("--mid-d-profile-track-min:100%!important")&&styles.includes('overflow-x:clip!important'),'Der neue viewport-füllende Profilvertrag muss erhalten bleiben.');
assert.ok(main.includes("import './midC18ResponsiveCorrections.css';"),'Responsive Korrekturschicht muss geladen werden.');
assert.ok(main.indexOf("import './midC18ResponsiveCorrections.css';")>main.indexOf("import './midC18MapFirstWorkspace.css';"),'Gesammelter Korrekturlayer muss nach Arbeitspaket F geladen werden.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
 assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
for(const file of [testPath,'src/midC18ResponsiveCorrections.css','MID_RELEASE_NOTES_0.9.85.85.json']){
 assert.ok((baseline.requiredFiles||[]).includes(file),`${file} fehlt in requiredFiles`);
}

console.log(`${pkg.version}: Windpfeil, +12-h-Layout, stündliches 24-h-Profil, Replit-14d-Detail-Skybar sowie 7-/14-Tage-Responsive-Fixes geschützt.`);
