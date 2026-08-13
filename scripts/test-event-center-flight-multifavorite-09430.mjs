import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const [panel,center,aviation,app,css]=await Promise.all([
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventAviation.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
assert.match(center,/\|'flight'/,'Flug fehlt als Event-Aktivität');
assert.match(panel,/id:'flight',label:'Flug'/,'Flugauswahl fehlt im Eventplaner');
assert.match(panel,/loadEventFlightHazards/,'Flugwetter-Hazardanalyse ist nicht verdrahtet');
for(const term of ['Vereisung','Turbulenz','CAT','Wolkenuntergrenze','Sicht'])assert.match(aviation,new RegExp(term),`Flugwetter-Hazard fehlt: ${term}`);
assert.match(aviation,/Richardson|ri=/i,'Turbulenzdiagnose nutzt keine Scherungs-/Stabilitätsbewertung');
assert.match(panel,/targets=favoritesOnly\?active\.filter\(item=>item\.isFavorite\):active\.slice\(0,20\)/,'Mehrere Favoriten werden nicht vollständig gemeinsam geprüft; die Begrenzung darf nur den Nicht-Favoriten-Lauf betreffen');
assert.match(panel,/selectedRecord\?\.id===currentEventId\?selectedRecord:null/,'Ein geladenes Event kann weiterhin neue Favoriten überschreiben');
assert.match(panel,/formatUvi\(plan\.summary\.uvMax/,'UVI ist im Eventplaner nicht appweit ganzzahlig formatiert');
assert.doesNotMatch(panel,/summary\.uvMax,1/,'Veraltete UVI-Nachkommastelle ist noch aktiv');
assert.match(panel,/wind\(plan\.summary\.windMax.*unit\)/,'Windeinheit wird nicht appweit übernommen');
assert.match(app,/MemoLazyEventPlanner[^>]+unit=\{unit\}/,'App-Windeinheit wird nicht an Eventplaner übergeben');
assert.match(panel,/AppInfoHint/,'Hintergrundinformationen sind nicht hinter appweiten Info-Bedienelementen gebündelt');

assert.match(panel,/currentSavedRecord\?void analyseEvent\(undefined,true\):saveCurrentPlan\(false\)/,'„Event aktualisieren“ berechnet das Event nicht wirklich neu');
assert.match(panel,/editingRecordIdRef=useRef\(editingRecordId\)/,'Aktives Event besitzt keinen stabilen Refresh-Ref');
assert.match(panel,/if\(active\?\.plan\)setPlan\(current=>/,'Extern aktualisierte Eventdaten werden nicht in die geöffnete Detailansicht übernommen');
assert.match(css,/:root\[data-theme=light\] \.event-plan-result/,'Helles Eventplaner-Design ist nicht explizit optimiert');
assert.match(css,/--event-danger:/,'Theme-adaptive Event-Signalfarben fehlen');
assert.doesNotMatch(center,/Tendenz neu/,'Unprofessioneller alter Änderungsbadge ist noch aktiv');
console.log('MID v0.9.43.0: Event-Center Mehrfachfavoriten, Theme-Optimierung, kompakte Texte, appweite Parameterformate und Flugwetter-Hazards geprüft.');
