import assert from 'node:assert/strict';
import fs from 'node:fs';
const app=fs.readFileSync('src/App.tsx','utf8');
const pictogram=fs.readFileSync('src/WeatherPictogram.tsx','utf8');
const precip=fs.readFileSync('src/precipitation.ts','utf8');
const css=fs.readFileSync('src/styles.css','utf8');

assert.ok(app.includes('synopticPhenomenonPictogram(currentObservedPhenomenon)'),'Frische Present-Weather-Beobachtung muss Intensität und Piktogramm gemeinsam bestimmen.');
assert.ok(app.includes('intensity={currentPictogramIntensity}')&&app.includes('phenomenon={currentObservedPhenomenon??currentPrecip.phenomenon}'),'Hauptpiktogramm muss dieselbe beobachtete Intensität wie der Wettertext verwenden.');
assert.ok(pictogram.includes("if(has('RA'))return raw.startsWith('-')?'Leichter Regen':raw.startsWith('+')?'Starker Regen':'Mäßiger Regen';"),'RA muss WMO/ICAO-konform als mäßiger Regen, -RA leicht und +RA stark beschrieben werden.');
assert.ok(pictogram.includes("if(has('SH')&&has('RA'))return raw.startsWith('-')?'Leichter Regenschauer':raw.startsWith('+')?'Starker Regenschauer':'Mäßiger Regenschauer';"),'Regenschauer brauchen beobachtete Intensität und grammatisch korrekten Singular.');
assert.ok(app.includes('st?.fieldTemporalResolutionMinutes?.precipitation'),'Stationsniederschlag muss seine tatsächliche zeitliche Auflösung in die Intensitätsberechnung geben.');
assert.ok(precip.includes('Gemeinsame Intensitätsklassifikation für Piktogramme, Texte und Skybar.'),'Zentrale DWD/WMO-Intensitätsklassifikation muss erhalten bleiben.');

assert.ok(app.includes('radarCurrentUsable=Boolean(radarNowcast')&&app.includes('currentPrecipSourceRate=radarCurrentUsable?Math.max(0,Number(radarNowcast!.currentRate))'),'Aktuelles Wetter muss frischen Standort-Radarwert vor Stations-/Modellniederschlag verwenden.');
assert.ok(app.includes('G{wind(displayWindGust,unit)}'),'Kompaktbereich muss Wind und Böen gemeinsam ausgeben.');
assert.ok(app.includes('{Math.round(dew)} °C'),'Kompaktbereich muss den Taupunkt zusammen mit der relativen Feuchte ausgeben.');
for(const token of ['current-weather-facts','Niederschlag</small>','Wind / Böen</small>','Feuchte / Taupunkt</small>','Sicht</small>','Luftdruck</small>'])assert.ok(app.includes(token),`Aktuelles-Wetter-Konzept fehlt: ${token}`);
assert.ok(css.includes('/* MID v0.9.84.51 · Aktuelles Wetter: responsiver Informationsblock nach MID-Konzept */'));
assert.ok(css.includes('@media(max-width:520px) and (orientation:portrait)')&&css.includes('@media(orientation:landscape) and (max-height:600px) and (max-width:950px)'),'Hoch-/Querformat müssen explizit geschützt sein.');
console.log('Current weather intensity/design contract: OK');
