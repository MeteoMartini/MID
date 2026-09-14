import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const css=readFileSync(new URL('../src/styles-src/30-modern.css', import.meta.url),'utf8');
const radar=readFileSync(new URL('../src/RadarPanel.tsx', import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx', import.meta.url),'utf8');

assert.ok(css.includes('transform:translate3d(0,calc(100% - 26px),0)!important;'), 'Die minimierte Bottom-Bar muss sichtbar bleiben und darf nicht fast vollständig am unteren Bildrand verschwinden.');
assert.ok(css.includes('bottom:max(14px,calc(var(--mid-safe-bottom) + 2px))!important;'), 'Die Bottom-Bar braucht auf mobilen Viewports wieder einen sicheren Abstand über dem unteren Rand.');
assert.ok(css.includes('bottom:max(12px,calc(var(--mid-safe-bottom) + 1px))!important;'), 'Auch auf sehr schmalen iPhones muss die Bottom-Bar oberhalb des unteren Randes bleiben.');

assert.ok(radar.includes("hasRenderableSynopticFrame=Boolean(dominantModelFrame||vectorIsoheightFrame||hasRenderablePressureCenters)"), 'Die Synoptik muss auch dann als renderbar gelten, wenn Isohypsen aus dem Grid-Frame vorliegen.');
assert.ok(radar.includes("synopticReady=modelLines==='off'?true:modelLines==='isobars'?(hasRenderableSynopticFrame&&hasRenderableIsobars):modelLines==='isoheights'?Boolean(vectorIsoheightFrame&&hasGridIsoheights):Boolean((hasRenderableSynopticFrame&&hasRenderableIsobars)&&(vectorIsoheightFrame&&hasGridIsoheights))"), 'Die Bereitschaftslogik für Synoptik/Isohypsen muss getrennt nach Linienmodus bewertet werden.');
assert.ok(radar.includes("{modelLines!=='off'&&(dominantModelFrame||vectorIsoheightFrame||hasGridCenters)&&<Pane name=\"mid-model-lines\""), 'Das Modelllinien-Pane muss auch bei reinen Grid-Isohypsen gerendert werden.');

assert.ok(app.includes("const tempPath=showTemperature?monotoneSvgPath(temperatureCurvePoints):'';"), 'Die Temperaturkurve der Tagesansicht muss geglättet werden.');
assert.ok(app.includes("const pressurePath=showPressure?monotoneSvgPath(pressureCurvePoints):'';"), 'Auch die Luftdruckkurve der Tagesansicht muss geglättet werden.');
assert.ok(app.includes("const windPath=showWind?monotoneSvgPath(windCurvePoints):'';"), 'Die Windkurve der Tagesansicht muss geglättet werden.');
assert.ok(app.includes("const gustPath=showGust?monotoneSvgPath(gustCurvePoints):'';"), 'Die Böenkurve der Tagesansicht muss geglättet werden.');
assert.ok(app.includes('const areaPath=showTemperature&&temperatureCurvePoints.length?`${tempPath} L ${temperatureCurvePoints[temperatureCurvePoints.length-1].x} ${tempBottom} L ${temperatureCurvePoints[0].x} ${tempBottom} Z`:\'\';'), 'Die Temperaturfläche muss der geglätteten Kurve folgen.');

console.log('Ansichts-Simulation: Bottom-Bar sichtbar, Isohypsen renderbar, Tagesansicht geglättet: OK');
