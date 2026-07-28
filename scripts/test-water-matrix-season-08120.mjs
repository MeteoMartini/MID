import {readFile} from 'node:fs/promises';
const [water,mountain,app,styles]=await Promise.all([
  readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/mountainSports.ts',import.meta.url),'utf8'),
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(text,token,message)=>{if(!text.includes(token))failures.push(message)};
for(const token of ['function WaterForecastMatrix','Wasserwetter-Verlauf','Zeitliche Auflösung','>1 h<','>3 h<','Nächste 3 Tage','Welle / Richtung','Wellenperiode','Wassertemperatur','Strömung','Wasserstand'])need(water,token,`Wasserwetter-Verlauf unvollständig: ${token}`);
need(water,'const[open,setOpen]=useState(false)','Wasserwetter-Verlauf muss standardmäßig eingeklappt sein.');
need(water,'<h2>Wassersport</h2>','Modultitel muss „Wassersport“ lauten.');
if(water.includes('Wassersportmodus')||app.includes('Wassersportmodus'))failures.push('Alte Bezeichnung „Wassersportmodus“ ist noch in der App enthalten.');
need(app,'<summary><Waves size={14}/>Wassersport</summary>','Favoritenprofil muss „Wassersport“ heißen.');
need(styles,'.water-forecast-matrix','Styling für den Wasserwetter-Verlauf fehlt.');
need(styles,'.water-matrix-summary','Einklappbare Zusammenfassung des Wasserwetter-Verlaufs fehlt.');
need(mountain,"return latitude>=0?(month>=11||month<=4):(month>=5&&month<=10)",'Automatische Bergsaison muss außerhalb der klassischen Skisaison Sommer wählen.');
if(/winterMonth\|\|levels\.some/.test(mountain))failures.push('Schneesignale dürfen außerhalb der klassischen Skisaison nicht mehr automatisch Winter erzwingen.');
if(failures.length){console.error('Wassersport-/Saisonprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Wasserwetter-Verlauf, Wassersport-Wording und automatische Sommerwahl außerhalb der Skisaison geprüft.');
