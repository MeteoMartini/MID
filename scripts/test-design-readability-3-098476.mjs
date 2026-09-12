import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const css=await readFile(path.join(root,'src/styles-src/30-modern.css'),'utf8');
const failures=[];const need=(token,msg)=>{if(!css.includes(token))failures.push(msg)};
need('MID v0.9.84.76 · Design-Audit 3','Design-Audit-Block 3 fehlt.');
need('MID v0.9.84.76 · Design-Audit 4','Design-Audit-Block 4 fehlt.');
for(const selector of ['.dashboard-section-quick button span','.event-center-header-metrics','.event-center-header-entry-top strong','.astronomy-eclipse-safety','.flight-data-note','.radar-nowcast-title .radar-nowcast-total','.warnings-responsive-shell .hazards.compact-list .hazard-validity','.climate-cloud-legend span','.thunder-place-section.compact>header small','.cockpit-weather-profile .wind-warning-threshold-label'])need(selector,`Lesbarkeits-Override fehlt: ${selector}`);
for(const token of ['font-size:var(--mid-text-micro)!important','font-size:var(--mid-text-xs)!important','white-space:normal!important','overflow-wrap:anywhere','min-height:44px!important'])need(token,`Responsive Lesbarkeitsregel fehlt: ${token}`);
if(failures.length){console.error('Design-Lesbarkeit v0.9.84.76 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Design-Audit 3/4 geprüft: sichtbare Mikrotexte, Event-/Gewitter-Wrapping, Legenden und Touch-Höhen sind abgesichert.');
