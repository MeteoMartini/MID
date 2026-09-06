import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {stripTypeScriptTypes} from 'node:module';
const confidenceSource=readFileSync(new URL('../src/ensembleAssessment.ts',import.meta.url),'utf8');
const compiled=stripTypeScriptTypes(confidenceSource,{mode:'transform'});
const confidence=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
const day=(date,agreement='high',score=92,dataQuality='good')=>({date,agreement,confidenceScore:score,dataQuality,parameters:[],limiting:[],complete:dataQuality==='good',leadHours:24,leadFactor:1,calibrationApplied:false,calibrationSampleDays:0});
const highPoor=day('2026-09-05','high',93,'poor'),highGood=day('2026-09-06','high',91,'good'),unknown=day('2026-09-07','unknown',null,'missing');
assert.deepEqual(confidence.agreementWindows([highPoor,highGood]),[{start:'2026-09-05',end:'2026-09-06',days:2}], 'Datenqualität darf hohe meteorologische Konfidenz nicht aus dem Fenster werfen.');
assert.equal(confidence.firstAgreementChange([highGood,unknown]),null,'Nicht bewertbarer Randtag ist kein meteorologischer Konfidenzabfall.');
assert.equal(confidence.trailingUnknownCoverageDate([highPoor,highGood,unknown]),'2026-09-07');
assert.equal(confidence.trailingUnknownCoverageDate([day('2026-09-04','unknown',null,'missing'),highGood]),null,'Nur rein nachlaufende unbekannte Tage sind Randabdeckung.');

const forecast=readFileSync(new URL('../src/ForecastConfidence.tsx',import.meta.url),'utf8');
for(const token of ['Hohe Prognosekonfidenz','Index ${minimum}–${maximum}/100','Datenbasis / Randtag','kein Prozentwert','Abdeckungs-, kein meteorologisches Abwertungssignal'])assert.ok(forecast.includes(token),`Konfidenz-UI fehlt: ${token}`);
assert.ok(!forecast.includes('Noch kein durchgehend hohes Konfidenzfenster'));

const cockpit=readFileSync(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
for(const token of ['<ConfidenceDisplay assessment={assessment} mode={mode} partialBoundary={partialBoundary} compact/>','trailingUnknownCoverageDate','className="sr-only">Temperaturabweichung','className="sr-only">Niederschlag','className="sr-only">Wind und Böen'])assert.ok(cockpit.includes(token),`14d-Kompaktvertrag fehlt: ${token}`);

const event=readFileSync(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8');
for(const token of ['eventIntervalHasPrecipitation','intervalCode=hasIntervalPrecipitation?hour.code:eventIntervalSkyCode','weather_code is instantaneous at the timestamp','Accumulations lead'])assert.ok(event.includes(token),`Event-Intervallsemantik fehlt: ${token}`);
const semanticsSource=readFileSync(new URL('../src/eventIntervalSemantics.ts',import.meta.url),'utf8'),semanticsCode=stripTypeScriptTypes(semanticsSource,{mode:'transform'}),semantics=await import('data:text/javascript;base64,'+Buffer.from(semanticsCode).toString('base64'));
assert.equal(semantics.eventIntervalHasPrecipitation(0,0,0,0),false);
assert.equal(semantics.eventIntervalHasPrecipitation(.02,0,0,0),true);
assert.equal(semantics.eventIntervalSkyCode({cloud:8,code:61,isDay:true},3600,3600),0,'Voller Sonnenschein + trockene Intervallsumme darf nicht durch einen Regen-Code am Intervallende rückwirkend als Regen erscheinen.');
assert.equal(semantics.eventIntervalSkyCode({cloud:96,code:61,isDay:true},0,3600),3);

const eventUi=readFileSync(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8');
assert.ok(eventUi.includes('className="event-timeline-compact-metrics"'));
assert.ok(eventUi.includes('title="Sonnenscheindauer"'));
assert.ok(!eventUi.includes('· Sonnenschein {sunshineMinutesLabel(point.sunshineDuration'));
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.ok(app.includes('className="widgetmeta-sun"'));
assert.ok(!app.includes('<small>Sonnenscheindauer</small>'),'Redundantes Widget-Wort soll durch eindeutiges Sonnensymbol entfallen.');

console.log('MID v0.9.78.70: Konfidenz-Randtag, Event-Stundenintervall und kompakte Symbolik geprüft.');
