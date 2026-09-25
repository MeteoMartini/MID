import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL('../'+path,import.meta.url),'utf8');
const [app,pwa,cockpit,astronomy]=await Promise.all([
  read('src/App.tsx'),
  read('src/PwaInstallButton.tsx'),
  read('src/ForecastCockpit.tsx'),
  read('src/astronomy.ts')
]);

// A: Der automatische Install-Hinweis darf Karten/Komposit nicht überlagern.
assert.ok(pwa.includes('suppressTransientHint=false'),'PWA-Button braucht einen nicht-persistenten Unterdrückungsvertrag.');
assert.ok(pwa.includes('!suppressTransientHint&&<aside className="pwa-install-hint"'),'Nur der transiente Install-Hinweis muss unterdrückbar sein.');
assert.ok(app.includes('suppressPwaInstallHint={MODERN_MAP_MODULES.includes(activeNavSection as DashboardModuleId)}'),'Kartenmodule müssen den transienten Install-Hinweis über den Appzustand unterdrücken.');
assert.ok(app.includes('<PwaInstallButton suppressTransientHint={suppressPwaInstallHint}/>'),'Der manuelle App-Button bleibt bestehen und erhält nur den Hinweis-Unterdrückungsstatus.');

// B: SYNOP ww und Bewölkungsdarstellung dürfen nicht verschiedene Codetabellen/Quellen vermischen.
assert.ok(app.includes('currentObservedDrySynopCode=currentObservedNumericCode!==undefined&&currentObservedNumericCode>=0&&currentObservedNumericCode<=3'),'SYNOP ww 0–3 müssen explizit als trockene SYNOP-Codes erkannt werden.');
assert.ok(app.includes('currentObservedWeatherCode=currentObservedNumericCode!==undefined&&!currentObservedDrySynopCode?currentObservedNumericCode:undefined'),'SYNOP ww 0–3 dürfen nicht als Open-Meteo weather_code 0–3 übernommen werden.');
assert.ok(app.includes('currentObservedPhenomenon=currentObservedRaw&&!currentVisibilityReport&&currentObservedNumericCode===undefined?currentObservedRaw:undefined'),'Numerische SYNOP-Codes dürfen nicht als textuelles METAR/SYNOP-Phänomen behandelt werden.');
assert.ok(app.includes("currentCloudObserved=fieldFresh('cloudCover')&&Number.isFinite(st?.cloudCover)"),'Aktuelle beobachtete Gesamtbewölkung braucht einen eigenen Freshness-Entscheid.');
assert.ok(app.includes('currentSkyCloud=currentCloudObserved?cloud:Number(c.cloud_cover)'),'Text und Piktogramm müssen dieselbe Gesamtbewölkungsquelle verwenden.');
assert.ok(app.includes('currentSkyLowCloud=currentCloudObserved?undefined:Number(c.cloud_cover_low)'),'Bei beobachteter Gesamtbewölkung dürfen modellierte Low-Cloud-Schichten das Piktogramm nicht verfälschen.');
assert.ok(app.includes('cloud={currentSkyCloud} lowCloud={currentSkyLowCloud} midCloud={currentSkyMidCloud} highCloud={currentSkyHighCloud}'),'Das Hauptpiktogramm muss den kanonischen aktuellen Sky-Visual-Vertrag verwenden.');
assert.ok(app.includes('cloudObservationTrace')&&app.includes('Alter ${cloudAgeMinutes} min · aktuell verwendet'),'Die verwendete Bewölkungsquelle muss mit Zeit/Alter nachvollziehbar sein.');
assert.ok(app.includes('Modellfallback'),'Ohne aktuelle Beobachtung muss der Modellfallback transparent ausgewiesen werden.');

// C: Nachtstunden gehören hinter alle zeitlich aufgelösten Tages-Skybars.
assert.ok(astronomy.includes('export function solarTimelineWindow'),'Zentrale astronomische Nachtgeometrie fehlt.');
assert.ok(cockpit.includes('function cockpitDaySkybarNightBands'),'Wiederverwendbarer Tages-Skybar-Nachtvertrag fehlt.');
assert.ok(cockpit.includes('solarTimelineWindow(start,end,{latitude:location.latitude,longitude:location.longitude,elevation:location.elevation,timezone}'),'Tages-Skybar muss die zentrale Solar-Geometrie und den Standort verwenden.');
assert.ok(cockpit.includes('function CockpitSkybarNightBandsSvg'),'Gemeinsamer SVG-Nachtlayer für Band/Squares fehlt.');
assert.ok(cockpit.includes('stopColor="var(--mg-night,#5b667c)"')&&cockpit.includes('<stop offset="14%"')&&cockpit.includes('<stop offset="86%"'),'Nachtlayer muss den MID-Nachtfarbvertrag mit weichen Übergängen verwenden.');
assert.ok(cockpit.includes('daySkyBarNightBands=cockpitDaySkybarNightBands(daySkyBarSource.slice(0,24),location,timezone,`seven-${day.date}`)'),'7-Tage-Tageskarten müssen astronomische Nachtbänder erhalten.');
assert.ok(cockpit.includes('daySkyBarNightBands=cockpitDaySkybarNightBands(dayHours,location,timezone,`fourteen-${item.date}`)'),'14-Tage-Zeilen müssen astronomische Nachtbänder erhalten.');
assert.ok(cockpit.includes('<CockpitSkybarNightBandsSvg bands={daySkyBarNightBands} height={16}/>'),'7-Tage-Skybar muss den Nachtlayer rendern.');
assert.ok(cockpit.includes('<CockpitSkybarNightBandsSvg bands={daySkyBarNightBands} height={14}/>'),'14-Tage-Skybar muss den Nachtlayer rendern.');
assert.ok(cockpit.includes("skybarDisplayMode==='squares'?<SkyBarHourCellsSvg"),'Band/Squares müssen dieselbe Nachtgeometrie teilen.');
assert.equal((cockpit.match(/data-mid-skybar="day-card"/g)||[]).length,1,'7d day-card Skybar-Vertrag darf nicht dupliziert werden.');
assert.equal((cockpit.match(/data-mid-skybar="fourteen-row"/g)||[]).length,1,'14d Skybar-Vertrag darf nicht dupliziert werden.');

console.log('MID 18.2.13: PWA-Map-Fokus, aktueller Sky/SYNOP-Vertrag und astronomische Nacht-Skybars geschützt.');
