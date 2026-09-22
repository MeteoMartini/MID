import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const styles=readFileSync('src/midC18FourteenConfidenceLayout.css','utf8');
const responsive=readFileSync('src/midC18ResponsiveCorrections.css','utf8');
const cockpit=readFileSync('src/ForecastCockpit.tsx','utf8');

assert.ok(responsive.startsWith("@import './midC18FourteenConfidenceLayout.css';"),'14-Tage-Responsive-Layer muss nachgeladen werden.');
for(const token of [
 "grid-template-columns:minmax(0,1fr) minmax(132px,max-content)!important",
 '"heading confidence"',
 '"regime confidence"',
 '"temps temps"',
 'min-width:132px!important',
 'min-width:108px!important',
 'white-space:normal!important',
 'text-overflow:clip!important',
 'overflow-wrap:anywhere!important',
 'overflow-x:clip!important',
 '@media(max-width:390px)',
 '@media(max-width:850px) and (orientation:landscape)'
])assert.ok(styles.includes(token),`14-Tage-Layoutvertrag fehlt: ${token}`);

for(const token of [
 'className="cockpit-fourteen-heading"',
 'className="cockpit-fourteen-heading-copy"',
 'className="cockpit-fourteen-weather-label"',
 '<CockpitConsistencyPill date={item.date}',
 'className="cockpit-fourteen-skybar"'
])assert.ok(cockpit.includes(token),`Bestehender 14-Tage-Fach-/Strukturvertrag fehlt: ${token}`);

assert.ok(!styles.includes('display:none!important')&&!styles.includes('visibility:hidden!important'),'Wetter- oder Konfidenzinformationen dürfen nicht zur Platzgewinnung versteckt werden.');
console.log('MID v0.9.85.87: 14-Tage-Tag/Datum/Wetter und Konfidenzpille sind responsiv entkoppelt, ohne horizontales Overflow.');
