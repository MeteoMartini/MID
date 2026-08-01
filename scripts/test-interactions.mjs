import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function RainTooltip(','<Tooltip content={<RainTooltip advancedMode={advancedMode} compact={compactChart}/>','bestPrecipitation','precipitationProbability'])if(!ensemble.includes(token))failures.push(`Niederschlags-Tooltip fehlt: ${token}`);
for(const token of ['function ResponsiveEnsembleTooltip(','ensemble-mobile-tooltip-layer','professionalEnsembleLayout(compact:boolean,exporting=false)'])if(!ensemble.includes(token))failures.push(`Ensemble-Interaktion fehlt: ${token}`);
for(const token of ['type="search"','inputMode="search"','debounceMs=/^\\d{2,8}$/.test(term)?45:80'])if(!app.includes(token))failures.push(`Ortssuche fehlt: ${token}`);
for(const token of ["onPointerUp={event=>{if(event.pointerType!=='mouse')",'onClick={()=>setSelectedId'])if(!shortTerm.includes(token))failures.push(`Kurzfristinteraktion fehlt: ${token}`);
for(const token of ['.ensemble-mobile-tooltip-layer{','.search input,','.short-term-strip>button{'])if(!styles.includes(token))failures.push(`Interaktions-CSS fehlt: ${token}`);
if(failures.length){console.error('Interaktionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ortssuche, Kurzfristkarten und professionelle Ensemble-Tooltips geprüft.');
