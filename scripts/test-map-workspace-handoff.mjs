import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const [app,workspace,state,totals,radar,styles,weatherMaps]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/MapWorkspacePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/mapWorkspaceState.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/PrecipitationTotalsMap.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/MapWorkspace.css',import.meta.url),'utf8'),
 readFile(new URL('../src/WeatherMapsPanel.tsx',import.meta.url),'utf8')
]);

assert.ok(workspace.includes('MemoLazyUnifiedWeatherMap')&&!workspace.includes('map-workspace-tabs'),'Alle Kartenlayer müssen dieselbe lazy/memoisierte Karteninstanz verwenden.');
assert.ok(workspace.includes('mid:map-workspace-view')&&workspace.includes('requestedProductId'),'Historische Summen-/Modelleinstiege müssen erhalten bleiben.');
assert.ok(weatherMaps.includes('<PrecipitationTotalsMap')&&weatherMaps.includes('isTotals?'),'Summenkarten müssen innerhalb der Modellkartenauswahl dargestellt werden.');
assert.ok(state.includes("mid:map-workspace-view:v1")&&state.includes('readMapWorkspaceView')&&state.includes('saveMapWorkspaceView'),'Die Auswahl muss sitzungsübergreifend gespeichert werden.');
assert.ok(app.includes("function dashboardSectionAlias(id:DashboardModuleId):DashboardModuleId{return id==='weather-maps'?'composite':id}"),'Der alte Wetterkarten-Einstieg muss als Alias zur gemeinsamen Kartenansicht funktionieren.');
assert.ok(app.includes("if(id==='weather-maps'){saveMapWorkspaceView('models')"),'Der alte Einstieg muss Modellkarten direkt öffnen.');
assert.ok(app.includes("case'weather-maps':return null;"),'Der alte Modulpfad darf keine zweite Kartenoberfläche rendern.');
assert.ok(weatherMaps.includes('WEATHER_MAP_BASEMAPS'),'Die Modellkarten müssen dieselbe Kartenbasis-Konfiguration verwenden.');

assert.ok(totals.includes('data-product-status="unavailable"'),'Fehlende Summendaten müssen sichtbar als nicht verfügbar markiert werden.');
assert.ok(totals.includes('[6,12,24,48]')&&totals.includes('type="button" disabled'),'Niederschlagsfenster dürfen ohne verifizierte Abdeckung nicht auswählbar sein.');
assert.ok(totals.includes('PNG herunterladen')&&totals.includes('SVG herunterladen')&&totals.includes('disabled={!frame||exporting}'),'Exporte müssen ohne vollständiges Produkt gesperrt bleiben.');
assert.ok(totals.includes('sortedFavorites.map')&&totals.includes('selectedFavoriteId'),'Gespeicherte Orte müssen auf der Karte auswählbar sein.');
assert.ok(!totals.includes('loadWeatherMapGrid')&&!totals.includes('weatherMapGridData'),'Die Summenansicht darf keine nicht passenden Punkt-/Modellkartenwerte als Summen darstellen.');

assert.ok(!radar.includes('className="composite-site-summary"'),'Die redundante Standort-Zusammenfassung muss aus dem Renderpfad entfernt sein.');
assert.ok(radar.includes('function approachEtaIcon')&&radar.includes('class="mid-approach-eta"'),'Die Radar-Echo-/ETA-Markierung muss erhalten bleiben.');
assert.ok(radar.includes('className="composite-timeline-card"')&&radar.includes('buildAvailableCompositeTimeline'),'Die bestehende Radartimeline muss erhalten bleiben.');
console.log('Gemeinsamer Kartenbereich, fail-closed Niederschlagssummen, Favoriten, alter Navigationsalias und Radar-Echo/ETA-Verträge geprüft.');
