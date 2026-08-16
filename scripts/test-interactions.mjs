import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const ensemble=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of ['function RainTooltip(','<RainTooltip advancedMode={advancedMode} compact={compactChart} onActive={rainTooltip.markActive} onDismiss={rainTooltip.dismiss}/>','bestPrecipitation','precipitationProbability'])if(!ensemble.includes(token))failures.push(`Niederschlags-Tooltip fehlt: ${token}`);
for(const token of ['function ResponsiveEnsembleTooltip(','ensemble-mobile-tooltip-layer','professionalEnsembleLayout(compact:boolean,exporting=false)'])if(!ensemble.includes(token))failures.push(`Ensemble-Interaktion fehlt: ${token}`);
for(const token of ['type="search"','inputMode="search"'])if(!app.includes(token))failures.push(`Ortssuche fehlt: ${token}`);
const searchDebounce=app.match(/debounceMs=\/\^\\d\{2,8\}\$\/\.test\(term\)\?(\d+):(\d+)/);
if(!searchDebounce)failures.push('Ortssuche fehlt: kurzer PLZ-/Text-Debounce');
else{const postal=Number(searchDebounce[1]),text=Number(searchDebounce[2]);if(!(postal>0&&postal<=text&&text<=80))failures.push(`Ortssuche-Debounce nicht responsiv genug: ${postal}:${text} ms`)};
for(const token of ["selectPoint=(pointId:string)=>setSelectedId(current=>current===pointId?'':pointId)",'onClick={()=>selectPoint(point.id)}','id="short-term-selected-detail"','aria-controls="short-term-selected-detail"'])if(!shortTerm.includes(token))failures.push(`Kurzfristinteraktion fehlt: ${token}`);
if(shortTerm.includes('onPointerUp={event=>'))failures.push('Kurzfristinteraktion enthält noch die doppelte PointerUp-/Click-Auslösung.');
for(const token of ['.ensemble-mobile-tooltip-layer{','.search input,','.short-term-strip>button{'])if(!styles.includes(token))failures.push(`Interaktions-CSS fehlt: ${token}`);
if(failures.length){console.error('Interaktionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ortssuche, Kurzfristkarten und professionelle Ensemble-Tooltips geprüft.');
