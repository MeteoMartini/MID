import {readFile} from 'node:fs/promises';
const [app,weather,astronomy,styles]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/astronomy.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
need(weather,"if(c===2)return day?'⛅':'☁️🌙'",'Bewölktes Wetter braucht ein eigenes Nachtpiktogramm ohne Sonne.');
need(weather,"return day?'🌦️':'🌧️🌙'",'Sprühregen/Schauer brauchen nachts ein sonnenfreies Piktogramm.');
need(app,"icon(point.code,point.isDay)",'Der Höhenwetter-Verlauf muss Tages-/Nachtpiktogramme verwenden.');
need(app,"isDay:value('is_day')>=.5",'Der Höhenwetter-Verlauf muss den Tagesstatus je Zeitpunkt übernehmen.');
need(astronomy,'civilDawn?:Date','Bürgerliche Dämmerung fehlt im Astronomiekern.');
need(astronomy,'blueHourMorningStart?:Date','Blaue Stunde fehlt im Astronomiekern.');
need(astronomy,'goldenHourEveningStart?:Date','Goldene Stunde fehlt im Astronomiekern.');
need(astronomy,'daysUntilNewMoon:number','Countdown zum Neumond fehlt.');
need(astronomy,'daysUntilFullMoon:number','Countdown zum Vollmond fehlt.');
need(app,'function AstronomyExplanation','Astronomie-Infopopover fehlt.');
need(app,'Sonnenaufgang · Goldene Stunde beginnt','Astronomie-Infopopover muss weitergehende Sonnenzeiten enthalten.');
need(app,"label={`${x.label} – weitere Informationen`}",'Sonne/Mond-Kachel braucht einen schließbaren Infohinweis.');
need(app,'nextMoonPhaseSummary(astronomy,true)','Mondphase und nächstes Hauptmondereignis müssen kompakt sichtbar sein.');
need(styles,'.astronomy-event-list','Styling der astronomischen Ereignisliste fehlt.');
need(styles,'.metrics .sun-moon-card header>.mode-info','Info-Button der Sonne/Mond-Kachel ist nicht kompakt positioniert.');
if(failures.length){console.error('Tag-/Nachtpiktogramme und Sonne/Mond-Informationen fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Tag-/Nachtpiktogramme, kompakte Mondphase und schließbare Astronomie-Detailinformationen sind geprüft.');
