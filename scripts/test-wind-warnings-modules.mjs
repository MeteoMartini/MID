import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const meteogram=await readFile(path.join(root,'src','MeteogramPanel.tsx'),'utf8');
const failures=[];

for(const token of ['WIND_WARNING_BANDS','wind-warning-yellow','wind-warning-orange','wind-warning-red','wind-warning-purple','windWarningBands','fill={`url(#${band.id})`}']){
  if(!app.includes(token))failures.push(`Windwarnflächen fehlen: ${token}`);
}
if(!app.includes('50/KMH_PER_KT')||!app.includes('75/KMH_PER_KT')||!app.includes('89/KMH_PER_KT')||!app.includes('103/KMH_PER_KT'))failures.push('Die vorhandenen DWD/Meteoalarm-Windwarnschwellen werden nicht verwendet.');
if(!app.includes('if(windMaxScale<=band.lowerKt)return[]'))failures.push('Warnflächen werden nicht auf den sichtbaren Windbereich begrenzt.');
if(app.includes('widget-collapse-toggle')||app.includes('forceOpen'))failures.push('Der Widget-/PNG-Generator besitzt weiterhin eine zweite Ein-/Ausklappsteuerung.');
if(meteogram.includes('meteogram-collapse-toggle')||meteogram.includes('setOpen(')||meteogram.includes('open,setOpen'))failures.push('Das Meteogramm besitzt weiterhin eine zweite Ein-/Ausklappsteuerung.');
if(!app.includes('id="widget" title="Widget- und PNG-Generator"')||!app.includes('id="meteogram" title="Meteogramm"'))failures.push('Die äußeren Modulschalter für Widget und Meteogramm fehlen.');

if(failures.length){console.error('Windwarn-/Modulprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Windpart und Module geprüft: Warnstufen werden dezent schraffiert; Widget-/PNG-Generator und Meteogramm besitzen jeweils nur noch den äußeren Modulschalter.');
