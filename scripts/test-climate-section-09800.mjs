import fs from 'node:fs';
const app=fs.readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const modules=fs.readFileSync(new URL('../src/dashboardModules.ts',import.meta.url),'utf8');
const panel=fs.readFileSync(new URL('../src/ClimatePanel.tsx',import.meta.url),'utf8');
const travel=fs.readFileSync(new URL('../src/travelPlanner.ts',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');
const checks=[
 ['Modul ist standardmäßig geschlossen',app.includes('id="climate"')&&app.includes('title="Klima"')&&app.includes('defaultOpen={false}')],
 ['Modul ist konfigurierbar',modules.includes("|'climate'")&&modules.includes("id:'climate'")],
 ['Abruf erfolgt erst beim Mount/Öffnen',panel.includes('if(!active)return')&&panel.includes('fetchTravelClimatology(location,false')],
 ['Jahresübergreifende Auswahl vorhanden',panel.includes('(start-1+index)%12+1')&&panel.includes('Winter Dez–Mär')],
 ['Kernparameter vollständig',panel.includes('Tmax / Mittel / Tmin')&&panel.includes('Niederschlag · Zeitraum')&&panel.includes('Bedeckungsgrad')&&panel.includes('Windrose')],
 ['Ein Tagesabruf mit Windrichtung',travel.includes("'wind_direction_10m_dominant'")&&travel.includes("'wind_speed_10m_mean'")&&travel.includes('circularMean')],
 ['Responsive Layout vorhanden',css.includes('@media(max-width:620px)')&&css.includes('orientation:landscape')&&css.includes('.climate-panel')]
];
for(const[label,ok]of checks){if(!ok)throw new Error(`Klima-Regression fehlgeschlagen: ${label}`);console.log(`✓ ${label}`)}
