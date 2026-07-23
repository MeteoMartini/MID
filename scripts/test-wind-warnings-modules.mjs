import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const app=await readFile(path.join(root,'src','App.tsx'),'utf8');
const warnings=await readFile(path.join(root,'src','dwdWarnings.ts'),'utf8');
const meteogram=await readFile(path.join(root,'src','MeteogramPanel.tsx'),'utf8');
const failures=[];

for(const token of ['WIND_WARNING_BANDS','wind-warning-yellow','wind-warning-orange','wind-warning-orange-heavy','wind-warning-red','wind-warning-red-orkan','wind-warning-purple','windWarningBands','fill={`url(#${band.id})`}']){
  if(!app.includes(token))failures.push(`Windwarnflächen fehlen: ${token}`);
}
for(const threshold of ['threshold:50','threshold:65','threshold:90','threshold:105','threshold:120','threshold:140'])if(!warnings.includes(threshold))failures.push(`DWD-Windwarnschwelle fehlt: ${threshold.replace('threshold:','')} km/h`);
if(!app.includes('windWarningThresholds')||!app.includes('wind-threshold-${item.threshold}'))failures.push('Horizontale Trennlinien an den DWD-Windwarnschwellen fehlen.');
if(!app.includes('if(windMaxScale<=band.lowerKt)return[]'))failures.push('Warnflächen werden nicht auf den sichtbaren Windbereich begrenzt.');
if(app.includes('widget-collapse-toggle')||app.includes('forceOpen'))failures.push('Der Widget-/PNG-Generator besitzt weiterhin eine zweite Ein-/Ausklappsteuerung.');
if(meteogram.includes('meteogram-collapse-toggle')||meteogram.includes('setOpen(')||meteogram.includes('open,setOpen'))failures.push('Das Meteogramm besitzt weiterhin eine zweite Ein-/Ausklappsteuerung.');
if(!app.includes('id="widget" title="Widget- und PNG-Generator"')||!app.includes('id="meteogram" title="Meteogramm"'))failures.push('Die äußeren Modulschalter für Widget und Meteogramm fehlen.');

if(failures.length){console.error('Windwarn-/Modulprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Windpart und Module geprüft: DWD-Schwellen 50/65/90/105/120/140 km/h, Schraffuren und dezente Trennlinien sind vorhanden; Widget-/PNG-Generator und Meteogramm besitzen jeweils nur den äußeren Modulschalter.');
