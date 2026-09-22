import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [cockpit,styles,pkgRaw]=await Promise.all([
 read('src/ForecastCockpit.tsx'),read('src/midC18ResponsiveCorrections.css'),read('package.json')
]);
const pkg=JSON.parse(pkgRaw);

assert.ok(/^0\.9\.85\.(?:8[6-9]|9\d|\d{3,})$/.test(pkg.version),'Heute-/24-h-Viewport-Fix muss MID v0.9.85.86 oder neuer sein.');
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

console.log(`MID v${pkg.version}: Heute ohne äußeren Horizontal-Scroll; 24-h-Profil viewportfüllend mit vollständig sichtbarer unterer Zeitachse geschützt.`);
