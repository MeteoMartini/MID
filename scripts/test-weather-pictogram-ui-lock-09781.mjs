import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [pictogram,features,app,cockpit,ensemble,shortTerm,event,travel,route,water,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/WeatherPictogram.tsx'),read('src/styles-src/10-features.css'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/EnsemblePanel.tsx'),read('src/ShortTermForecast.tsx'),read('src/EventPlannerPanel.tsx'),read('src/TravelPlannerPanel.tsx'),read('src/RouteWeatherPanel.tsx'),read('src/WaterSportsPanel.tsx'),read('MID_WEATHER_PICTOGRAM_STANDARD.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-weather-pictogram-ui-lock-09781.mjs';
assert.ok(pictogram.includes('compact=false,plain=true,phenomenon,intensity'), 'WeatherPictogram muss standalone/plain als Default rendern.');
assert.ok(features.includes('.mid-weather-pictogram .mid-weather-skyplate{display:none!important}'),'Alte integrierte Sky-Plate muss appweit gesperrt sein.');
assert.ok(pictogram.includes("showCelestial=['mostly-clear','partly-cloudy','showers','sleet-showers','snow-showers'].includes(kind),showVeiledCelestial=false,showFogCelestial=false"),'Stratiforme Wetterzustände dürfen nicht durch einen identischen künstlichen Sonnen-/Mondrest verwischt werden.');
assert.ok(pictogram.includes('export function weatherPictogramVisualForm(kind:WeatherPictogramKind)'), 'Weather Icon System 2.0 braucht einen eigenen visuellen Form-Lock.');
assert.ok(pictogram.includes("if(kind==='cloudy')return'generic'"), 'Bedeckt muss als saubere geschlossene Wolke statt als Höhenwolken-/Wellenform erscheinen.');
assert.ok(pictogram.includes("if(['drizzle','freezing-drizzle','rain','freezing-rain','sleet','snow','snow-grains','ice-crystals','ice-pellets','graupel','hail'].includes(kind))return'generic'"), 'Stratiformer Niederschlag muss die einheitliche Niederschlagswolke des Referenzdesigns verwenden.');
assert.ok(pictogram.includes("if(['mist','fog','rime-fog','haze','clear'].includes(kind))return'clear'"), 'Nebel/Dunst dürfen nicht zusätzlich eine alte Wolkenform rendern.');
assert.ok(pictogram.includes('data-visual-form={visualForm}'), 'Visueller Form-Lock muss diagnostizierbar sein.');
assert.ok(!pictogram.includes('<CloudShape form={form}'), 'Diagnostische Wolkenhöhe darf die Hauptwetterglyphen nicht mehr in alte Cirrus-/Stratusvarianten umformen.');
assert.ok(app.includes('function periodDisplayCode(hour:Hour){return precipitationParts(hour).displayCode}'),'Klassische Forecast-Piktogramme müssen die kanonische Niederschlagsphase verwenden.');
assert.ok(cockpit.includes('function cockpitDisplayCode(hour:Hour){return precipitationParts(hour).displayCode}'),'Cockpit-Piktogramme müssen die kanonische Niederschlagsphase verwenden.');
for(const source of [app,cockpit]){
 assert.ok(source.includes('fallbackIsPrecip&&representativeIsSky?fallbackCode:representativeCode'),'Tagescharakter muss eine fälschlich reine Sky-Code-Repräsentation bei Niederschlag übersteuern.');
 assert.ok(!source.includes('plain={false}'),'App darf den alten internen Sky-Plate-Pfad nicht reaktivieren.');
}
for(const [name,source] of [['Ensemble',ensemble],['Kurzfrist',shortTerm],['Event',event],['Reise',travel],['Route',route],['Wasser',water]])assert.ok(source.includes('WeatherPictogram'),`${name}: Wetterzustände müssen über WeatherPictogram laufen.`);
for(const [name,source,tokens] of [
 ['App',app,['<span className="forecast-meta-sun">☀️','<span className="forecast-meta-wind">🌬️','<b>💧 {detailListPrecipLabel','aria-label="Maximale Niederschlagswahrscheinlichkeit">☔']],
 ['Ensemble',ensemble,['>💧 {ensemblePrecipitationProbabilityCompact']],
 ['Kurzfrist',shortTerm,[' · ☀ {sunshineMinutesLabel']],
 ['Event',event,[' · ☀ {eventSunshineLabel',' · ☀ {sunshineMinutesLabel']]
])for(const token of tokens)assert.ok(!source.includes(token),`${name}: sichtbarer Legacy-Wetteremoji-Pfad ist weiterhin aktiv: ${token}`);
assert.ok(app.includes('<Droplets size={12}/>{precipitationAmountLabel(d)}')&&app.includes('<Sun size={12}/>{sunshineHoursLabel(d.sunshineDuration)}')&&app.includes('<Wind size={12}/><WindDirectionArrow'), 'Klassische 7-Tage-Metadaten müssen das Vektor-/Design-2.0-System verwenden.');
assert.ok(ensemble.includes('<Droplets size={12}/>{ensemblePrecipitationProbabilityCompact(x)}'), 'Ensemble-Niederschlagsmetadaten müssen Vektoricons verwenden.');
for(const token of ['Weather Icon System 2.0','standalone','keine eingebaute quadratische','precipitationParts(...).displayCode','Regenschauer','Schneegriesel','visueller Form-Lock','Höhenwolken-Diagnostik'])assert.ok(contract.includes(token),`Piktogrammvertrag unvollständig: ${token}`);
assert.equal(pkg.scripts?.['test:weather-pictogram-ui-lock'],`node ${test}`,'Package-Testeintrag fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Piktogramm-UI-Lock fehlt in Baseline.');
console.log(`MID v${pkg.version}: Weather Icon System 2.0 standalone, appweit und niederschlagsphasenkohärent geschützt.`);
