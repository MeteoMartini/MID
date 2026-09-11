import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const [app,phase,foundation,modern,generated]=await Promise.all([
  read('src/App.tsx'),
  read('src/precipitationPhaseColor.ts'),
  read('src/styles-src/00-foundation.css'),
  read('src/styles-src/30-modern.css'),
  read('src/styles.css')
]);

const checks=[
  [foundation.includes('--param-precipitation-snow:#66bce8')&&foundation.includes('--param-precipitation-mixed:#a769d8')&&foundation.includes('--param-precipitation-storm:#7869e8'),'Kanonische Niederschlags-Phasenfarben fehlen im Dark-Theme.'],
  [foundation.includes('--param-precipitation-snow:#4f9fc9')&&foundation.includes('--param-precipitation-mixed:#8c58bd')&&foundation.includes('--param-precipitation-storm:#6558d4'),'Kanonische Niederschlags-Phasenfarben fehlen im Light-Theme.'],
  [phase.includes("snow:'var(--param-precipitation-snow)'")&&phase.includes("mixed:'var(--param-precipitation-mixed)'")&&phase.includes("storm:'var(--param-precipitation-storm)'"),'TypeScript-Phasenpalette nutzt nicht die zentralen CSS-Parameterfarben.'],
  [phase.includes("if(type==='hailShowers'||type==='thunderstorm'||type==='thunderstormHail')return'storm'"),'Hagel ist nicht eindeutig der Purpur-/Sturmfamilie zugeordnet.'],
  [phase.includes("if(kind==='snow')return'Schnee/Graupel · hellblau'")&&phase.includes("if(kind==='storm')return'Gewitter/Graupel/Hagel · purpur'"),'Phasenlegendentexte stimmen nicht mit dem Farbvertrag überein.'],
  [app.includes("showers:{label:'Regenschauer',legendClass:'showers',fill:'url(#showersPattern)'}")&&app.includes('id="showersPattern"')&&app.includes('fill="var(--param-precipitation)"'),'Regenschauer verwenden nicht die Regen-Blau-Familie.'],
  [app.includes('id="freezingRainPattern"')&&app.includes('fill="var(--param-precipitation-mixed)"'),'Gefrierender Regen verwendet nicht die Misch-/Gefrier-Violettfamilie.'],
  [app.includes('id="sleetPattern"')&&app.includes('fill="var(--param-precipitation-mixed)"'),'Schneeregen verwendet nicht die Misch-/Gefrier-Violettfamilie.'],
  [app.includes("graupelShowers:{label:'Graupelschauer',legendClass:'graupel-showers',fill:'url(#graupelShowersPattern)'}")&&app.includes('id="graupelShowersPattern"'),'Graupel besitzt keine eigene hellblaue Balken-/Legendenform.'],
  [app.includes("hailShowers:{label:'Hagelschauer',legendClass:'hail-showers',fill:'url(#hailShowersPattern)'}")&&app.includes('id="hailShowersPattern"')&&app.includes('fill="var(--param-precipitation-storm)"'),'Hagel besitzt keine eigene purpurne Balken-/Legendenform.'],
  [modern.includes('var(--param-precipitation-snow) 25% 50%')&&modern.includes('var(--param-precipitation-mixed) 50% 75%')&&modern.includes('var(--param-precipitation-storm) 75% 100%'),'Gemeinsame Niederschlagslegende nutzt nicht die zentrale Phasenpalette.'],
  [generated.includes('--param-precipitation-mixed:#a769d8')&&generated.includes('.detaillegend i.hail-showers'),'Generiertes styles.css enthält den kanonischen Farbvertrag nicht.']
];
const failures=checks.filter(([ok])=>!ok).map(([,message])=>message);
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('Tagesansicht-Niederschlagsfarben: zentrale Palette, Phasenfamilien und Graupel/Hagel-Unterscheidung sind geschützt.');
