import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [intervals,shortTerm,cockpit,app,sevenDay,ensemble,water,meteogram,fusion,contract,pkgRaw,baselineRaw]=await Promise.all([
 read('src/precipitationIntervals.ts'),read('src/ShortTermForecast.tsx'),read('src/ForecastCockpit.tsx'),read('src/App.tsx'),read('src/SevenDayForecastSummary.tsx'),read('src/EnsemblePanel.tsx'),read('src/WaterSportsPanel.tsx'),read('src/MeteogramPanel.tsx'),read('src/forecastFusion.ts'),read('MID_PRECIPITATION_INTERVAL_CONTRACT.md'),read('package.json'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-precipitation-forward-slot-presentation-097846.mjs';

for(const token of [
 'export function precipitationPresentationHours(hours:Hour[]):Hour[]',
 'const state=sorted[index]!,next=sorted[index+1]',
 'precipitation:Math.max(0,Number(next.precipitation)||0)',
 'probability:Math.max(0,Math.min(100,Number(next.probability)||0))',
 "code:parts.type==='none'?drySkyCode(state):parts.displayCode",
 'export function precipitationPresentationMinutes15(minutes:Minute15[]):Minute15[]',
 'QUARTER_MIN_GAP_MS=10*60000',
 'QUARTER_MAX_GAP_MS=20*60000'
])assert.ok(intervals.includes(token),`Vorwärts-Slot-Helfer unvollständig: ${token}`);
assert.ok(intervals.includes('if(!next||!Number.isFinite(gap)||gap<MIN_GAP_MS||gap>MAX_GAP_MS)')&&intervals.includes('precipitation:0,rain:0,showers:0,snowfall:0,probability:0,code:drySkyCode(state)'), 'Fehlende Anschlussstunden müssen fail-safe trocken dargestellt werden, ohne alten Niederschlag nach vorne umzuhängen.');

for(const token of [
 'let previousIntervalEnd=now',
 'precipitationIntervalStartEpoch=previousIntervalEnd',
 'previousIntervalEnd=target',
 'accumulationBase=trailingAccumulationHour(hours,target)'
])assert.ok(shortTerm.includes(token),`Kurzfrist-Vorwärtsintervall fehlt: ${token}`);

assert.ok(cockpit.includes('precipitationIntervalStartEpoch:start')&&cockpit.includes('precipitationIntervalEndEpoch:end'),'24-h-Profil muss sichtbare Start-/Endgrenzen tragen.');
assert.ok(cockpit.includes('const hourly=precipitationPresentationHours(hours)'),'7d-Kurvenübersicht muss sichtbare Vorwärtsstunden verwenden.');
assert.ok(cockpit.includes('dayPeriodHoursForDate(day.date,hourly)'),'7d-Kurvenkopf/Piktogramm muss denselben vorwärts normalisierten Stundenverlauf verwenden.');
assert.ok(cockpit.includes('displayHours=useMemo(()=>precipitationPresentationHours(hours),[hours])')&&cockpit.includes('displayMinutes15=useMemo(()=>precipitationPresentationMinutes15(minutes15),[minutes15])'),'7d-Tageskacheln müssen Stunden und 15-Minuten-Niederschlag auf Slotbeginn normalisieren.');
assert.ok(cockpit.includes('dayPrecipitationAssessment(day,dayHours,displayMinutes15)'),'7d-Niederschlagsdauer muss die normalisierten 15-Minuten-Slots verwenden.');

assert.ok(app.includes("import {precipitationPresentationHours,precipitationPresentationMinutes15} from './precipitationIntervals';"),'Klassische 7d-/Widgetpfade müssen beide Präsentationshelfer importieren.');
assert.ok(app.includes('precipitationDisplayHours=useMemo(()=>precipitationPresentationHours(hours),[hours]),precipitationDisplayMinutes15=useMemo(()=>precipitationPresentationMinutes15(minutes15),[minutes15])'),'Klassische 7d-Ansicht muss Stunden und 15-Minuten-Slots gemeinsam normalisieren.');
assert.ok(app.includes('dayPrecipitationAssessment(selectedDay,characterHours,precipitationDisplayMinutes15)'),'Tagesdetail-Niederschlagsdauer muss den sichtbaren Slotbeginn verwenden.');
assert.ok(app.includes("function mountainHourlyPrecipitationValue(level:MountainLevelForecast,key:'precipitation'|'rain'|'showers'|'snowfall'|'precipitation_probability',slotIndex:number)")&&app.includes('nextIndex=slotIndex+1'),'Berg-/Wintersport muss endgestempelte Stundenakkumulation auf den sichtbaren Slotbeginn legen.');
assert.ok(app.includes('function mountainHourlyPresentationParts(level:MountainLevelForecast,index:number)')&&app.includes('code:mountainHourlyPresentationParts(level,row.index).displayCode'),'Berg-/Wintersport-Piktogramm und Gewitterdiagnostik müssen zur vorwärts normalisierten Niederschlagsphase passen.');
assert.ok(app.includes("sumPrecip=(key:'precipitation'|'rain'|'showers'|'snowfall')")&&app.includes("precipitation:sumPrecip('precipitation'),probability:maxPrecip('precipitation_probability'),snow:sumPrecip('snowfall')")&&app.includes('time:slotStart.time,epoch:slotStart.epoch'),'Bergwetter-1h/3h-Matrix muss Niederschlag aus Vorwärtsslots aggregieren und die Gruppenzeit am Slotbeginn beschriften.');

assert.ok(sevenDay.includes('const displayHours=precipitationPresentationHours(hours);'),'7d-Zusammenfassung muss mit Vorwärtsstunden arbeiten.');
assert.ok(ensemble.includes('precipitationDisplayHours=useMemo(()=>precipitationPresentationHours(hours),[hours])'),'Ensemble-Best-Match-Fallback muss mit Vorwärtsstunden arbeiten.');
assert.ok(water.includes('displayHours=useMemo(()=>precipitationPresentationHours(hours),[hours])'),'Wassersport-Stundenmatrix muss mit Vorwärtsstunden arbeiten.');
assert.ok(fusion.includes('displayHours=precipitationPresentationHours(hours)'),'Tagesaggregation muss die sichtbare Slot-Tageszuordnung verwenden.');

for(const token of [
 'function forwardHourlySourceIndex(hourly:HourlyRecord,index:number)',
 'return Number.isFinite(current)&&Number.isFinite(next)&&gap>=45*60000&&gap<=75*60000?index+1:-1',
 "forwardHourlyAccumulationValue(hourly,'precipitation',index)",
 "forwardHourlyAccumulationValue(hourly,'snowfall',index)",
 "code=sourceIndex>=0?valueAt(hourly,'weather_code',sourceIndex)??0:0"
])assert.ok(meteogram.includes(token),`Meteogramm-Vorwärtsslot fehlt: ${token}`);

for(const phrase of [
 'sichtbare Prognoseintervalle',
 'Wenn MID bei **08:00 Uhr** Niederschlag anzeigt, bedeutet dies im Stundenraster **08:00–09:00 Uhr**',
 '`Anzeige(S) = Rohwert(S + 60 min)`',
 'Menge, PoP und Niederschlagsart müssen dasselbe Intervall meinen',
 'Meteogramm',
 '15-Minuten',
 'Fehlende Anschlussstunde'
])assert.ok(contract.includes(phrase),`Niederschlags-Intervallvertrag unvollständig: ${phrase}`);

assert.equal(pkg.scripts?.['test:precipitation-forward-slot-presentation'],`node ${test}`,'Package-Testskript fehlt.');
for(const key of ['regressionTests','requiredRegressionTests','requiredFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
console.log(`MID v${pkg.version}: sichtbare Niederschlagszeit = Slotbeginn; Roh-/Nowcast-Rechenkern bleibt endgestempelt.`);
