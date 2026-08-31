import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('../',import.meta.url);
const read=file=>fs.readFileSync(new URL(file,root),'utf8');

const app=read('src/App.tsx');
const cockpit=read('src/ForecastCockpit.tsx');
const styles=read('src/styles.css');
const pkg=JSON.parse(read('package.json'));
const baseline=JSON.parse(read('MID_BASELINE.json'));
const changelog=read('CHANGELOG.md');
const implementation=read('MID_IMPLEMENTATION_0.9.76.33.md');

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron bleiben.');
assert.ok(changelog.includes('# v0.9.76.33'),'Changelog-Eintrag v0.9.76.33 fehlt.');
assert.ok(implementation.includes('23:00 beim Weiterklicken korrekt auf **00:00 des Folgetags**'),'Implementierungsnachweis für den Stundenwechsel fehlt.');
assert.ok(implementation.includes('Wolkenbänder direkt unter die Wetter-Piktogramme'),'Implementierungsnachweis für die Wolkenumlagerung fehlt.');
assert.ok(app.includes('requestedClockSelectionRef=useRef<{date:string;hour:number}|null>(null)'),'Tagesübergreifende Uhrzeitselektion wird nicht mehr über Datum+Stunde gepuffert.');
assert.ok(app.includes('if(requestedSelection&&requestedSelection.date===selected){'),'Vorgemerkte Zieluhrzeit wird beim Tageswechsel nicht explizit priorisiert.');
assert.ok(app.includes('if(selectedHour===nearest)requestedClockSelectionRef.current=null;'),'Vorgemerkte Zieluhrzeit wird nicht erst nach erfolgreicher Auswahl gelöscht.');
assert.ok(app.includes('queueRequestedClockHour(targetDay.date,delta>0?0:23);'),'Stundenweiser Tageswechsel springt nicht explizit auf 00/23 Uhr.');
assert.ok(cockpit.includes('skyBandTop=50,cloudTop=101'),'Wolkenbereich wurde nicht in den oberen Profilkopf verlegt.');
assert.ok(cockpit.includes('tempTop=150,tempBottom=274'),'Temperaturbereich wurde nicht unter die Wolkenbänder verschoben.');
assert.ok(cockpit.includes('height={cloudBottom-skyBandTop+18}'),'Wetterkopf-Hintergrund um Wolkenbänder wurde nicht mitgezogen.');
assert.ok(cockpit.includes('y={78}'),'Wetterpiktogramme wurden für den neuen Wolkenkopf nicht nachverdichtet.');
assert.ok(styles.includes('.cockpit-weather-profile .temperature-line{stroke-width:2.75}'),'Temperaturkurve ist nicht dünner ausgelegt.');
assert.ok(styles.includes('.cockpit-weather-profile .apparent-line{stroke-width:1.9}'),'Gefühlte Temperaturkurve ist nicht dünner ausgelegt.');

console.log('24-h-Wetterprofil: stundengenauer Tageswechsel, obere Wolkenbänder und dünnere Temperaturkurven geprüft.');
