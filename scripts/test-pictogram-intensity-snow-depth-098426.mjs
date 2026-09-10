import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [pictogram,precipitation,app,meteogram,travelPanel,travel,periodVisual,cockpit,route,event,water,shortTerm,phaseColor,standard,radarPhase,thunderRisk,eventEngine,flightBriefing,ensemble,pkgRaw,baselineRaw]=await Promise.all([
 read('src/WeatherPictogram.tsx'),read('src/precipitation.ts'),read('src/App.tsx'),read('src/MeteogramPanel.tsx'),read('src/TravelPlannerPanel.tsx'),read('src/travelPlanner.ts'),read('src/periodWeatherVisual.ts'),read('src/ForecastCockpit.tsx'),read('src/routeWeather.ts'),read('src/EventPlannerPanel.tsx'),read('src/WaterSportsPanel.tsx'),read('src/ShortTermForecast.tsx'),read('src/precipitationPhaseColor.ts'),read('MID_WEATHER_PICTOGRAM_STANDARD.md'),read('src/RadarModelPrecipTypeOverlay.tsx'),read('src/detailThunderRisk.ts'),read('src/eventWeatherEngine.ts'),read('src/flightRouteBriefing.ts'),read('src/EnsemblePanel.tsx'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-pictogram-intensity-snow-depth-098426.mjs';

// Vier visuelle Niederschlagsstufen; WMO 82 darf durch eine gröbere Stundenmenge nie abgeschwächt werden.
assert.ok(pictogram.includes("export type WeatherPictogramIntensity='none'|'light'|'moderate'|'heavy'|'very-heavy'"));
assert.ok(pictogram.includes("if(c===82)return'very-heavy'"),'WMO 82 muss visuell sehr stark bleiben.');
assert.ok(!pictogram.includes("72,73,77,79,81")&&!pictogram.includes("70,71,78,80"),'WMO 77–79 dürfen ohne eigene Intensitätskodierung nicht künstlich als leicht/mäßig bezeichnet werden.');
assert.ok(pictogram.includes("thunderDust=wmoCode===98&&!phenomenon")&&pictogram.includes("kind==='thunder'?thunderDust?"),'WMO 98 muss als Gewitter mit Staub/Sand ohne erfundenen Regen gerendert werden.');
assert.ok(!precipitation.includes("98:'thunderstorm'")&&!precipitation.includes("[81,95,96,98].includes(code)"),'WMO 98 darf nicht als Niederschlagsart/-intensität in die zentrale Niederschlagslogik eingehen.');
assert.ok(pictogram.includes("thunderRain=Boolean(synopticRaw")&&pictogram.includes("kind==='thunder'?thunderDust?")&&pictogram.includes("thunderRain?<Rain"),'WMO 95/97 dürfen ohne phasenspezifisches SYNOP/METAR-Phänomen keinen erfundenen Regen zeichnen.');
assert.ok(pictogram.includes("kind==='thunder-hail'?<><Lightning")&&!pictogram.includes("kind==='thunder-hail'?<><Rain"),'WMO 96/99 dürfen nicht automatisch Regen zusätzlich zu Graupel/Hagel erfinden.');
assert.ok(thunderRisk.includes('[95,96,97,98,99]')&&eventEngine.includes('[95,96,97,98,99]')&&flightBriefing.includes('[95,96,97,98,99]'),'WMO 98 muss in Gewitter-, Event- und Flugpfaden als aktuelles Gewitter erkannt bleiben.');
assert.ok(radarPhase.includes('explicitGraupel=[87,88]')&&radarPhase.includes('explicitHail=[89,90,96,99]')&&radarPhase.includes('explicitRain=[51,53,55,61,63,65,80,81,82,91,92]')&&!radarPhase.includes('explicitThunder=[95,97,98]'),'Radar-/Modell-Phasenoverlay muss WMO 87–92 unterscheiden und 98 nicht als Niederschlagsbeleg behandeln.');
assert.ok(ensemble.includes("if([87,88].includes(code))return'graupel'")&&ensemble.includes("if([89,90,96,99].includes(code))return'hail'")&&ensemble.includes("if([93,94].includes(code))return'wintry'"),'Ensemble-Wetterband muss Graupel, Hagel und phasenoffenen winterlichen Niederschlag unterscheiden.');
assert.ok(ensemble.includes("row.precipVisualType==='none'&&!row.precipVisualThunder")&&ensemble.includes("type:'none'|'rain'|'snow'|'mixed'|'graupel'|'hail'|'wintry'"),'WMO 98 muss im Ensemble als Gewitter ohne erfundene Niederschlagsphase sichtbar bleiben.');
assert.ok(precipitation.includes("if(type==='snowGrains'&&snowRateCmh<=0)return null"),'Schneegriesel ohne quantitative Menge darf keine erfundene Intensitätsstufe erhalten.');
assert.ok(pictogram.includes("if([87,88].includes(c))return'graupel-showers'")&&pictogram.includes("if([89,90].includes(c))return'hail-showers'"),'Graupel-/Hagelschauer brauchen eigene Piktogramme.');
assert.ok(pictogram.includes("if([91,92].includes(c))return'showers'")&&pictogram.includes("if([93,94].includes(c))return'wintry-after-thunder'"),'WMO 91/92 müssen aktuelle Regenschauer ohne Blitz, WMO 93/94 phasenoffenen winterlichen Niederschlag nach vorausgegangenem Gewitter zeigen.');
assert.ok(pictogram.includes("showCelestial=['mostly-clear','partly-cloudy','showers','sleet-showers','snow-showers','graupel-showers','hail-showers'].includes(kind)"),'Tag/Nacht-Himmelskörper müssen auf echte Schauer-/Auflockerungssymbole begrenzt sein.');
assert.ok(pictogram.includes("if(intensity==='very-heavy')return[12,21,30,39,48,58]")&&pictogram.includes("if(intensity==='heavy')return[15,26,37,48,59]"),'Sehr starke und starke Niederschlagsgeometrie müssen unterscheidbar sein.');
assert.ok(precipitation.includes("const codeFloor:PrecipitationIntensityLevel|0=code===82?4"),'Schauerklassifikation muss WMO 82 als Intensitäts-Mindeststufe schützen.');
assert.ok(precipitation.includes('Untergrenze aus ${minutes} min'),'Längere Schauerakkumulationen dürfen nicht als gemessene 10-min-Intensität ausgegeben werden.');
assert.ok(precipitation.includes("87:'graupelShowers',88:'graupelShowers'")&&precipitation.includes("89:'hailShowers',90:'hailShowers'"));
assert.ok(precipitation.includes("91:'showers',92:'showers'")&&precipitation.includes("93:'wintryAfterThunder',94:'wintryAfterThunder'"));
assert.ok(precipitation.includes("[91,92].includes(Math.round(Number(sourceCode)||0))")&&precipitation.includes("[91,92].includes(effectiveCode)?'showers'"),'WMO 91/92 dürfen bei Repräsentanz oder Plausibilitätskorrektur nicht zu Dauerregen verflachen.');
assert.ok(precipitation.includes("tenMinuteMm<.7?1:tenMinuteMm<2?2"),'Der DWD-Mengenbereich 0,4–<0,7 mm/10 min darf ohne expliziten Intensitätscode nicht künstlich als mäßig überhöht werden.');
assert.ok(precipitation.includes("tenMinute>=.7?81:80")||precipitation.includes("tenMinute>=.7?81"),'Auch die aus Mengen abgeleitete repräsentative Schauer-Codewahl muss die konservative 0,7-mm-Grenze verwenden.');
assert.ok(precipitation.includes("warmPhaseProtected=[87,88,89,90,93,94,96,99].includes(code)"),'Hagel/Graupel und phasenoffene WMO-Codes dürfen nicht durch eine Warmboden-Schneekorrektur in Regen umgedeutet werden.');
assert.ok(phaseColor.includes("type==='graupelShowers'||type==='hailShowers'")&&phaseColor.includes("type==='wintryAfterThunder'"),'Neue festen/gemischten Phasen müssen in der appweiten Niederschlagsfarbe enthalten sein.');

// Perioden-/Detail-Piktogramme dürfen Graupel, Hagel oder WMO 93/94 nicht wegen alter Whitelists verlieren.
for(const [name,source] of [['App',app],['Cockpit',cockpit],['Periodenaggregator',periodVisual]]){
 assert.ok(source.includes('graupel-showers')&&source.includes('hail-showers'),`${name}: Graupel-/Hagelschauer fehlen im Repräsentanzpfad.`);
 assert.ok(source.includes('wintry-after-thunder'),`${name}: WMO 93/94 fehlen im Repräsentanzpfad.`);
}
for(const [name,source] of [['Kurzfrist',shortTerm],['Event',event],['Wasser',water]])assert.ok(/intensity=|pictogramIntensity/.test(source),`${name}: Niederschlagsintensität wird nicht bis zum Piktogramm weitergereicht.`);
assert.ok(route.includes("precipitation.type==='hailShowers'")&&route.includes('Hagelschauer / erhöhte Rutsch- und Sichtgefahr'),'Routenwetter muss Hagel eigenständig behandeln.');

// Schneehöhe / Schneedecke: sichtbare Werte immer ganze cm; interne Rohwerte bleiben präzise.
assert.ok(app.includes('Math.round(level.measuredSnowDepthCm)')&&app.includes('Math.round(level.modelSnowDepthCm)'),'Bergwetter-Schneedecke muss ganzzahlig in cm erscheinen.');
assert.ok(meteogram.includes('Math.round(depth)} cm')&&meteogram.includes('Math.round(value)}</text>'),'Meteogramm-Schneehöhe und Achse müssen ganze cm anzeigen.');
assert.ok(meteogram.includes('step=Math.max(1,niceNumber'),'Schneehöhenachse darf keine Unter-cm-Ticks erzeugen.');
assert.ok(travelPanel.includes('step="1"')&&travelPanel.includes('Math.round(Number(snowDepthLimit))'),'Schneehöhenbedingung muss in ganzen cm erfasst werden.');
assert.ok(travelPanel.includes('number(Number(active.summary.snowDepthMean),0)')&&travelPanel.includes('number(Number(point.snowDepthMean),0)'),'Reiseplaner muss mittlere/tägliche Schneehöhen in ganzen cm anzeigen.');
assert.ok(travel.includes('mittlere Schneehöhe unter ${Math.round(Number(constraints.minSnowDepthCm))} cm')&&travel.includes('Schneehöhe liegt bei rund ${Math.round(Number(summary.snowDepthMean))} cm'),'Reiseplaner-Texte müssen Schneehöhen ganzzahlig formulieren.');
assert.ok(app.includes('Neuschnee −24 h {formatDecimalFixed(level.pastSnow24Cm,1)} cm'),'Neuschneeakkumulation darf als von Schneehöhe getrennte Größe ihre Dezimalpräzision behalten.');
assert.ok(!/snowDepth(?:Mean|Cm)?[^\n]{0,80}(?:toFixed\(|formatDecimalFixed\([^\n]*,1\)|number\([^\n]*,1\))/.test([app,meteogram,travelPanel,travel].join('\n')),'Schneehöhe darf sichtbar nicht mit einer Dezimalstelle formatiert werden.');

// Aggregate ohne belastbare Intervallintensität dürfen keine Scheingenauigkeit erzeugen.
const aggregateWithoutIntensity=[...travelPanel.matchAll(/<WeatherPictogram\b[^>]*>/g),...cockpit.matchAll(/<WeatherPictogram\b[^>]*>/g)];
assert.ok(aggregateWithoutIntensity.length>0);
assert.ok(standard.includes('vier')||standard.includes('sehr stark'),'Piktogrammvertrag muss die erweiterte Intensitätslogik dokumentieren.');
assert.equal(pkg.scripts?.['test:pictogram-intensity-snow-depth'],`node ${test}`,'package.json: neuer Audit-Test fehlt.');
assert.ok(baseline.requiredRegressionTests?.includes(test)&&baseline.regressionTests?.includes(test),'Baseline: neuer Audit-Test fehlt.');
console.log(`MID v${pkg.version}: Niederschlagsintensitäten/Tag-Nacht-Phasen und ganze Schneehöhen-cm appweit statisch geschützt.`);
