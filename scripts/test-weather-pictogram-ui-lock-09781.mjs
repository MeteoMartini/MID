import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [pictogram,features,app,cockpit,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/WeatherPictogram.tsx'),read('src/styles-src/10-features.css'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('MID_WEATHER_PICTOGRAM_STANDARD.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-weather-pictogram-ui-lock-09781.mjs';
assert.ok(pictogram.includes('compact=false,plain=true,phenomenon,intensity'), 'WeatherPictogram muss standalone/plain als Default rendern.');
assert.ok(features.includes('.mid-weather-pictogram .mid-weather-skyplate{display:none!important}'),'Alte integrierte Sky-Plate muss appweit gesperrt sein.');
assert.ok(pictogram.includes("showCelestial=['mostly-clear','partly-cloudy','showers','sleet-showers','snow-showers'].includes(kind),showVeiledCelestial=false,showFogCelestial=false"),'Stratiforme Wetterzustände dürfen nicht durch einen identischen künstlichen Sonnen-/Mondrest verwischt werden.');
assert.ok(app.includes('function periodDisplayCode(hour:Hour){return precipitationParts(hour).displayCode}'),'Klassische Forecast-Piktogramme müssen die kanonische Niederschlagsphase verwenden.');
assert.ok(cockpit.includes('function cockpitDisplayCode(hour:Hour){return precipitationParts(hour).displayCode}'),'Cockpit-Piktogramme müssen die kanonische Niederschlagsphase verwenden.');
for(const source of [app,cockpit]){
 assert.ok(source.includes('fallbackIsPrecip&&representativeIsSky?fallbackCode:representativeCode'),'Tagescharakter muss eine fälschlich reine Sky-Code-Repräsentation bei Niederschlag übersteuern.');
 assert.ok(!source.includes('plain={false}'),'App darf den alten internen Sky-Plate-Pfad nicht reaktivieren.');
}
for(const token of ['Weather Icon System 2.0','standalone','keine eingebaute quadratische','precipitationParts(...).displayCode','Regenschauer','Schneegriesel'])assert.ok(contract.includes(token),`Piktogrammvertrag unvollständig: ${token}`);
assert.equal(pkg.scripts?.['test:weather-pictogram-ui-lock'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Piktogramm-UI-Lock fehlt in Baseline.');
console.log(`MID v${pkg.version}: Weather Icon System 2.0 standalone, appweit und niederschlagsphasenkohärent geschützt.`);
