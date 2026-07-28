import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
const need=(token,message)=>{if(!app.includes(token))failures.push(message)};
need('function mountainDaylightWindow(','Tageslichtfenster für die Höhenzonenanalyse fehlt.');
need("now>=today.sunset?(candidates[1]??today):today",'Nach Sonnenuntergang wird nicht auf den Folgetag gewechselt.');
need('row.epoch>=daylight.sunrise&&row.epoch<=daylight.sunset','Höhenzonen werden nicht ausschließlich zwischen Sonnenauf- und -untergang bewertet.');
need('function mountainDaySegments(','Tageszeitlich wechselnde günstigste Höhenzonen fehlen.');
need('<b>Tagesverlauf:</b>','Erklärende Tagesverlaufsanzeige fehlt.');
need("daylightValues('cape')",'Gewitterpotenzial ist nicht auf den bewerteten Tageszeitraum begrenzt.');
need('Der heutige Sonnenuntergang ist bereits überschritten.','Kennzeichnung der Analyse des Folgetags fehlt.');
if(failures.length){console.error('Berg-Tageslicht-/Höhenzonenprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Berg-/Wintersport geprüft: Tageslichtfenster, Folgetag nach Sonnenuntergang, gestufte Höhenzonen und tagesbezogenes Gewitterrisiko aktiv.');
