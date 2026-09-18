import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [main,profileFix,c15Styles,cockpit,dwd,pkg,changelog]=await Promise.all([
 readFile(new URL('../src/main.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midC16TodayProfileFix.css',import.meta.url),'utf8'),
 readFile(new URL('../src/midC15TodayDensity.css',import.meta.url),'utf8'),
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../public/CHANGELOG.md',import.meta.url),'utf8')
]);

const c15Index=main.indexOf("import './midC15TodayDensity.css';");
const c16Index=main.indexOf("import './midC16TodayProfileFix.css';");
assert.ok(c15Index>=0&&c16Index>c15Index,'C16 muss nach der C15-Heute-Dichte geladen werden.');

for(const token of [
 'profileYScale=compactProfile?.72:mediumProfile?.86:1',
 'profileY=(value:number)=>Math.round(value*profileYScale*10)/10',
 'chartHeight=profileY(632)',
 'profileTimeAxisY=profileY(47)',
 'profileSolarLabelY=profileY(77)',
 'profileWeatherIconY=profileY(78)',
 'tempTop=profileY(150)',
 'precipTop=profileY(321)',
 'windTop=profileY(406)',
 'pressureTop=profileY(498)',
 'impactTop=profileY(583)'
])assert.ok(cockpit.includes(token),`Responsive 24-h-Geometrie fehlt: ${token}`);

assert.ok(!cockpit.includes('chartHeight=632,chartWidth='),'Die Desktop-Y-Geometrie darf auf Mobilgeräten nicht mehr ungefiltert übernommen werden.');
assert.ok(!cockpit.includes('y1={47}'),'Die obere Zeitachse muss der responsiven Y-Geometrie folgen.');
assert.ok(!cockpit.includes('y={78} title='),'Wetterpiktogramme müssen der responsiven Y-Geometrie folgen.');

for(const token of [
 'className="dwd-precip-type-disclosure__toggle"',
 'onClick={()=>setOpen(value=>!value)}',
 'aria-expanded={open}',
 '{open?<div className="dwd-precip-type-disclosure__body"',
 'defaultOpen=false'
])assert.ok(dwd.includes(token),`Expliziter DWD-Disclosure fehlt: ${token}`);
assert.ok(!dwd.includes('<details className="dwd-precip-type-disclosure"'),'Native Details-Zustandswiederherstellung darf das große DWD-Bild nicht ungefragt wieder öffnen.');
assert.ok(c15Styles.includes('background:color-mix(in srgb,var(--surface) 94%,var(--s2) 6%)'),'DWD-Disclosure muss im Dark Mode aus den aktiven MID-Flächenfarben aufgebaut sein.');
assert.ok(!c15Styles.includes('var(--card,#fff)'),'Der nicht definierte helle --card-Fallback darf den Dark Mode nicht auswaschen.');

for(const token of [
 '.cockpit-short-term .cockpit-brief-with-tools>span:first-child>strong',
 'white-space:normal!important',
 '.cockpit-now90>header',
 '@media(max-width:430px)',
 '.cockpit-now90>header>small',
 'display:none!important',
 '.cockpit-weather-profile .cockpit-meteogram-pro__stage'
])assert.ok(profileFix.includes(token),`C16-Viewport-/Textflussregel fehlt: ${token}`);

const compactHeight=632*.72,tabletHeight=632*.86;
assert.ok(compactHeight<460&&tabletHeight<550,'C16 muss die 24-h-Grafik auf Smartphone und Tablet sichtbar verkürzen.');

const version=String(JSON.parse(pkg).version||'');
assert.equal(version,'0.9.85.36','C16 muss als v0.9.85.36 in das Source-Gate gehen.');
assert.ok(changelog.startsWith('# MID v0.9.85.36'),'Der öffentliche Changelog muss mit v0.9.85.36 beginnen.');

console.log('MID-C16: mobile 24-h-Profilgeometrie, Textfluss und explizit geschlossene DWD-Ansicht geschützt.');
