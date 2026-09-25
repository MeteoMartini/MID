import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,astronomy,skybar]=await Promise.all([
 readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/astronomy.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/forecastDaySkyBar.ts',import.meta.url),'utf8'),
]);

assert.ok(astronomy.includes('export function solarTimelineWindow'),'zentrale Solar-Geometrie fehlt');
assert.ok(astronomy.includes("'sunrise'")&&astronomy.includes("'sunset'"),'Sonnenauf-/untergangsgrenzen fehlen');
assert.ok(cockpit.includes('band.fadeIn')&&cockpit.includes('band.fadeOut'),'Sonnenauf-/untergangsgrenzen benötigen Übergangsmarken');
assert.ok(skybar.includes('solarTimelineWindow(startEpoch,endEpoch,location)'),'lokale Tages-Skybars müssen zentrale Solar-Geometrie verwenden');
assert.ok(cockpit.includes('forecastLocalDaySkyBar(displayHours,day.date,location'),'7-Tage-Tageskarten benötigen vollständige lokale Kalendertage');
assert.ok(cockpit.includes('forecastLocalDaySkyBar(displayHours,item.date,location'),'14-Tage-Zeilen benötigen vollständige lokale Kalendertage');
assert.ok(skybar.includes('localCalendarDayWindow(date,timezone)'),'DST-Tagesgrenzen müssen aus lokalen Mitternachten berechnet werden');
assert.ok(!/daySkyBarSource\.slice\(0,24\)|displayHours\.filter\(hour=>hour\.time\.startsWith\(item\.date\)\)\.slice\(0,24\)/.test(cockpit),'7-/14-Tage-Skybars dürfen lokale DST-Tage nicht auf 24 Stunden kürzen');
assert.ok(cockpit.includes('var(--mg-night,#5b667c)'),'Nachtfarbe muss den MID-Vertrag erfüllen');
assert.ok(cockpit.includes('<stop offset="14%"')&&cockpit.includes('<stop offset="86%"'),'Nachtübergang muss weich sein');
assert.ok(cockpit.includes("skybarDisplayMode==='squares'?"),'Squares-Modus fehlt');
assert.ok(cockpit.includes('data-skybar-display={skybarDisplayMode}'),'Band/Squares-Modus muss an beiden Tagesachsen sichtbar bleiben');
assert.ok(cockpit.includes('className="night-band cockpit-day-night-band"')&&cockpit.includes('className="night-band cockpit-fourteen-night-band"'),'7-/14-Tage-Nachtbandflächen fehlen.');
assert.ok(cockpit.includes('nightBands.map(band=>')&&cockpit.includes('dayNightBands.map(band=>'),'Nachtbänder müssen in beiden Tagesachsen vor den Skybar-Segmenten liegen.');
assert.ok(cockpit.includes('SevenDayCurveOverview days={visible} hours={hours}')&&cockpit.includes('location={location}'),'7-Tage-Kurvenübersicht erhält Standortdaten');
assert.equal((skybar.match(/solarTimelineWindow\(/g)||[]).length,1,'Solar-Nachtgeometrie darf nicht dupliziert werden');
console.log('Part C geprüft: 7d/14d, vollständige lokale Tage, Band/Squares, Solargrenzen und weiche Nachtübergänge.');