import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,styles,pkgRaw,baselineRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/midC18ResponsiveCorrections.css'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
const testPath='scripts/test-mid-18-2-5-today-viewport-098586.mjs';

assert.equal(pkg.version,'0.9.85.86','Heute-/24-h-Viewport-Fix muss MID v0.9.85.86 sein.');
assert.ok(cockpit.includes('aria-label="24-Stunden-Wetterprofil"'),'24-h-Wetterprofil muss erhalten bleiben.');
assert.ok(cockpit.includes('profileDisplayPoints=profileHourlyPoints'),'24-h-Profil muss weiter die kanonische stündliche Reihe verwenden.');
assert.ok(cockpit.includes('data-mid-profile-axis="shared-24h"')&&cockpit.includes('data-mid-profile-track="shared-24h"'),'Gemeinsame 24-h-Achse und Track-Vertrag müssen erhalten bleiben.');
assert.ok(cockpit.includes('profile-time-axis bottom')&&cockpit.includes('profile-bottom-time'),'Untere Zeitachse samt Beschriftung muss vorhanden bleiben.');

for(const token of [
 '.modern-forecast-section',
 "--mid-d-profile-track-min:100%!important",
 ".cockpit-meteogram-pro__stage[data-mid-profile-axis='shared-24h']",
 'overflow-x:clip!important',
 'overflow-y:visible!important',
 "[data-mid-profile-track='shared-24h']",
 'padding-bottom:24px!important',
 '.profile-bottom-time',
 '@media(max-width:720px) and (orientation:portrait)',
 '@media(max-width:850px) and (orientation:landscape)'
]) assert.ok(styles.includes(token),`Viewport-/Achsenvertrag fehlt: ${token}`);

assert.ok(!styles.includes('min-width:640px!important'),'Smartphone-Profil darf nicht mehr auf 640 px Mindestbreite gezwungen werden.');
assert.ok(!styles.includes('--mid-d-profile-track-min:600px'),'Alter 600-px-Scrollvertrag darf im finalen Korrekturlayer nicht wieder eingeführt werden.');
assert.ok(styles.includes("touch-action:pan-y!important"),'24-h-Profil muss vertikale Seitennavigation erlauben, ohne horizontalen Profilscroll zu erzwingen.');
assert.ok(styles.includes('.cockpit-now90-track')&&styles.includes('.cockpit-now90{overflow:hidden!important}'),'90-Minuten-Inhalt darf keinen äußeren Heute-Overflow erzeugen.');

for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite']){
 assert.ok((baseline[key]||[]).includes(testPath),`${testPath} fehlt in ${key}`);
}
assert.ok((baseline.requiredFiles||[]).includes(testPath),'Viewport-Regression muss als requiredFile geschützt sein.');
assert.ok((baseline.protectedFiles||[]).includes('src/midC18ResponsiveCorrections.css'),'Responsive-Korrekturlayer muss geschützt bleiben.');

console.log('MID v0.9.85.86: Heute ohne äußeren Horizontal-Scroll; 24-h-Profil viewportfüllend mit vollständig sichtbarer unterer Zeitachse geschützt.');
