import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const shortTerm=readFileSync(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const versionParts=String(pkg.version).split('.').map(Number),minimum=[0,8,30,1],atLeastMinimum=versionParts.some((value,index)=>value>minimum[index]&&versionParts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]))||versionParts.every((value,index)=>value===minimum[index]);
if(!atLeastMinimum)failures.push(`Paketversion ${pkg.version} liegt vor 0.8.30.1`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zum Paket ${pkg.version}`);
for(const token of ['cellX=slotIndex===0?plotLeft:plotLeft+slotIndex*cellSlotWidth','cellRight=slotIndex===dayCount-1?plotRight:plotLeft+(slotIndex+1)*cellSlotWidth','centerX=(cellX+cellRight)/2','stroke="none"','ensemble-sky-strip-separator','ensemble-sky-strip-outline'])if(!panel.includes(token))failures.push(`Achsgebundene Wetterleiste fehlt: ${token}`);
for(const token of ["[selectedId,setSelectedId]=useState('')","selected=points.find(point=>point.id===selectedId)","selectPoint=(pointId:string)=>setSelectedId(current=>current===pointId?'':pointId)",'onClick={()=>selectPoint(point.id)}','id="short-term-selected-detail"','aria-controls="short-term-selected-detail"'])if(!shortTerm.includes(token))failures.push(`Exklusive Kurzfristdetailauswahl fehlt: ${token}`);
if(shortTerm.includes('onPointerUp={event=>'))failures.push('Doppelte PointerUp-/Click-Auslösung ist noch vorhanden.');
if((shortTerm.match(/className="short-term-detail"/g)||[]).length!==1)failures.push('Kurzfristdetailbereich ist nicht eindeutig einzeln definiert.');
for(const token of ['.ensemble-temperature-weather-overlay .ensemble-sky-strip-separator{','.ensemble-temperature-weather-overlay .ensemble-sky-strip-outline{'])if(!css.includes(token))failures.push(`Wetterleisten-CSS fehlt: ${token}`);
if(failures.length){console.error('MID Wetterleisten-/Kurzfristprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Exakt achsgebundene Wetterleiste und exklusive Kurzfristdetailauswahl geprüft.');
