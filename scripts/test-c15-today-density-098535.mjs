import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,styles,dwd,cockpit,shortTerm,pkg,changelog]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC15TodayDensity.css',import.meta.url),'utf8'),
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8')
]);

const c14Index=main.indexOf("import './midC14ViewportFixes.css';");
const c15Index=main.indexOf("import './midC15TodayDensity.css';");
assert.ok(c14Index>=0&&c15Index>c14Index,'C15 muss nach den realen C14-Viewport-Fixes geladen werden.');

for(const token of [
 'export function DwdPrecipitationTypeDisclosure',
 'className="dwd-precip-type-disclosure"',
 'defaultOpen=false',
 'enabled={open}',
 "open?'Bild schließen':'Bild öffnen'",
 'dwdPrecipitationTypeCoverage(location)'
])assert.ok(dwd.includes(token),`C15-DWD-Disclosure fehlt: ${token}`);

for(const [label,text] of [['ForecastCockpit',cockpit],['ShortTermForecast',shortTerm]]){
 assert.ok(text.includes("import {DwdPrecipitationTypeDisclosure} from './DwdPrecipitationTypeRadar';"),`${label} muss den gemeinsamen DWD-Disclosure verwenden.`);
 assert.ok(text.includes('<DwdPrecipitationTypeDisclosure location={location} enabled={showDwdPrecipitationTypeRadar}/>'),`${label} muss das amtliche Originalprodukt progressiv öffnen.`);
 assert.ok(!text.includes('<DwdPrecipitationTypeRadar location={location} enabled={showDwdPrecipitationTypeRadar}/>'),`${label} darf das große DWD-Bild nicht mehr ungefragt direkt rendern.`);
}

for(const token of [
 '.dwd-precip-type-disclosure',
 '.dwd-precip-type-disclosure__body',
 '.cockpit-weather-profile__signals',
 'display:flex!important',
 'overflow-x:auto!important',
 '.cockpit-weather-profile__toolbar',
 '.cockpit-weather-profile__info-card',
 '@media(max-width:430px)',
 '@media(max-width:850px) and (orientation:landscape)',
 'max-width:100%!important'
])assert.ok(styles.includes(token),`C15-Dichte-/Viewport-Regel fehlt: ${token}`);

const version=String(JSON.parse(pkg).version||'');
assert.match(version,/^0\.9\.85\.\d+$/,'C15 bleibt in der 0.9.85-Releasefolge.');
assert.ok(changelog.startsWith(`# MID v${version}`),`Der öffentliche Changelog muss mit MID v${version} beginnen.`);

console.log(`MID-C15: DWD-Originalbild progressiv und 24-h-Profil auf mobilen Viewports verdichtet für v${version}.`);
