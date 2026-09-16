import {readFileSync} from 'node:fs';

const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const modern=readFileSync(new URL('../src/styles-src/30-modern.css',import.meta.url),'utf8');
const design=readFileSync(new URL('../src/midDesign.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const expect=(condition,message)=>{if(!condition)throw new Error(message)};

expect(shortTerm.includes("import {MidWeatherThread} from './MidDesign';"),'Der gemeinsame Wetterfaden muss die MID-Komponente verwenden.');
expect(shortTerm.includes('className="short-term-signature"'),'Aktuell/Heute benötigen eine sichtbare Wetterfaden-Signatur.');
expect(shortTerm.includes('points={points.map(point=>point.temperature)}'),'Der Wetterfaden muss den Temperaturverlauf der Zeit-Lupe abbilden.');
expect(shortTerm.includes("className={selectedId===point.id?'active':''}"),'Nur der aktiv gewählte Zeitschritt darf als Detailfokus markiert sein.');
expect(shortTerm.includes('aria-controls="short-term-selected-detail"'),'Die Zeit-Lupe muss ihr Detail eindeutig verknüpfen.');
expect(modern.includes('.current-weather-facts>.pressure{display:none}'),'Die Atmosphärenkarte muss auf vier Schlüsselwerte fokussieren.');
expect(modern.includes('.short-term-signature .mid-weather-thread'),'Der Wetterfaden braucht eine eigene ruhige Flächenbehandlung.');
expect(design.includes('.mid-weather-thread'),'Die gemeinsame Wetterfaden-Grundkomponente muss weiter verfügbar sein.');
expect(app.includes('data-mid-skybar="react"'),'Das Tagesprofil muss die synchronisierte Skybar beibehalten.');
console.log('MID-C3 Schritt 3 current/today/profile contract passed.');
