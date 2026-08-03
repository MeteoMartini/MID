import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [component,css,app]=await Promise.all([
 readFile(path.join(root,'src/ForecastCockpit.tsx'),'utf8'),
 readFile(path.join(root,'src/styles.css'),'utf8'),
 readFile(path.join(root,'src/App.tsx'),'utf8')
]);
const failures=[];
const need=(label,source,token)=>{if(!source.includes(token))failures.push(`${label}: ${token}`)};
for(const token of ['className="cockpit-tab-icon"','className="cockpit-tab-copy"','title={`${horizonTitle(horizon)}: ${summary}`}'])need('Semantische Registerstruktur',component,token);
for(const token of ['.cockpit-tabs.tabs-1','both']){}
for(const token of ['.cockpit-tabs.tabs-1','.cockpit-tabs.tabs-2','.cockpit-tabs.tabs-3','grid-template-areas:"icon copy" "ribbon ribbon"','.cockpit-tabs>button>.cockpit-tab-copy>b','white-space:nowrap','.cockpit-tabs>button>.cockpit-mini-ribbon','grid-area:ribbon','@media (min-width:681px) and (max-width:980px)','@media (max-width:680px)','overflow-x:auto'])need('Responsive CSS-Vertrag',css,token);
need('Klassische Ansicht bleibt verfügbar',component,"export type ForecastPresentationMode='classic'|'cockpit-tabs'|'cockpit-ribbons'");
need('Cockpit nur optional',app,"forecastPresentationMode==='classic'");
const overrideIndex=css.lastIndexOf('MID v0.9.9.0 · Prognose-Cockpit responsive register repair');
const legacyIndex=css.indexOf('.cockpit-tabs>button{');
if(overrideIndex<0||overrideIndex<=legacyIndex)failures.push('Responsive Reparatur muss nach älteren Cockpit-Regeln stehen.');
if(failures.length){console.error(failures.join('\n'));process.exit(1)}
console.log('MID v0.9.9.0 Cockpit-Register auf Desktop, Tablet und Smartphone geschützt.');
