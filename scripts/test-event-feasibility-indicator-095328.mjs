import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [component,app,planner,styles,baseline,uiContract]=await Promise.all([
 readFile(new URL('src/EventFeasibilityDot.tsx',root),'utf8'),
 readFile(new URL('src/App.tsx',root),'utf8'),
 readFile(new URL('src/EventPlannerPanel.tsx',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8').then(JSON.parse),
 readFile(new URL('MID_UI_ARCHITECTURE_CONTRACT.md',root),'utf8')
]);
const test='scripts/test-event-feasibility-indicator-095328.mjs';
assert.match(component,/const tone:EventFeasibilityTone=plan\?\.advice\.status\?\?'unknown'/,'Ampel muss die zentrale EventAdvice-Bewertung verwenden, nicht einen zweiten Wetterscore.');
assert.match(component,/tone==='good'[\s\S]*Gut umsetzbar/,'Grüne Bewertung fehlt.');
assert.match(component,/tone==='watch'[\s\S]*Beeinträchtigungen möglich/,'Gelbe Bewertung fehlt.');
assert.match(component,/tone==='caution'[\s\S]*Deutlich beeinträchtigt/,'Rote Bewertung fehlt.');
assert.match(component,/role="img" aria-label=\{`Wetterbewertung:/,'Bewertung ist nicht barrierearm bezeichnet.');
assert.doesNotMatch(component,/precipitation|gust|temperature|weatherCode|windMax|uvMax/i,'Ampel darf keinen parallelen meteorologischen Schwellenwert-Score aufbauen.');
assert.match(app,/event-center-header-weather-icon[\s\S]{0,400}<EventFeasibilityDot plan=\{record\.plan\}/,'Kompakte Glocken-Eventdarstellung enthält keine Wetter-Ampel.');
assert.match(planner,/event-center-card-weather-visual[\s\S]{0,400}<EventFeasibilityDot plan=\{recordPlan\}/,'Kompakte Event-Center-Karte enthält keine Wetter-Ampel.');
assert.match(planner,/event-status-badge[\s\S]{0,220}<EventFeasibilityDot plan=\{plan\}/,'Detailbewertung verwendet die gleiche Ampel nicht.');
assert.match(styles,/\.event-center-header-weather-icon>\.event-feasibility-dot,\.event-center-card-weather-visual>\.event-feasibility-dot\{position:absolute;/,'Ampel muss platzneutral über dem bestehenden Piktogramm liegen.');
assert.match(styles,/\.event-feasibility-dot\{[^}]*width:7px[^}]*height:7px/,'Ampel ist nicht dezent/kompakt dimensioniert.');
assert.match(styles,/\.event-feasibility-dot\.unknown\{background:transparent/,'Noch nicht analysierte Events brauchen einen neutralen Zustand.');
assert.match(styles,/\.event-feasibility-dot\.caution::after/,'Kritischer Zustand muss zusätzlich zur Farbe visuell unterscheidbar sein.');
assert.match(uiContract,/Event-Wetterbewertung[\s\S]*platzneutral[\s\S]*EventAdvice/,'UI-Vertrag schützt die platzneutrale zentrale Eventbewertung nicht.');
assert.ok(Array.isArray(baseline.requiredRegressionTests)&&baseline.requiredRegressionTests.includes(test),'Event-Ampel ist nicht als Required Regression geschützt.');
console.log('MID v0.9.53.28: platzneutrale Event-Wetterampel aus zentralem EventAdvice-Status geprüft.');
