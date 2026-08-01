import {readFileSync} from 'node:fs';
const panel=readFileSync(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
if(pkg.version!=='0.8.33.1')failures.push(`falsche Paketversion: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} passt nicht zu ${pkg.version}`);
for(const token of ['sunshine-tooltip-line single-value','precipitation-tooltip-line single-value','className="tooltip-meta-value"','P10–P90 ${formatSunshineHours(row.sunshineLowHours)}–${formatSunshineHours(row.sunshineHighHours)} h','` · ${Math.round(row.bestPrecipitationProbability)} %`'])if(!panel.includes(token))failures.push(`Tooltip fehlt: ${token}`);
for(const token of ['className="search-input-shell"','inputRef.current?.focus({preventScroll:true})','onPointerDown={()=>setOpen(true)}','lastTrackedPointerSelection=useRef(0)','Math.hypot(event.clientX-tap.x,event.clientY-tap.y)>18','favoriteTogglePointerAt=useRef(0)'])if(!app.includes(token))failures.push(`Interaktion fehlt: ${token}`);
for(const token of ['MID v0.8.33.1 · kompakte Tooltip-Metazeilen und zuverlässige Erstberührung','.tooltip-meta-line.single-value','.search-input-shell,.search-input-shell input,.favorite-toggle,.favorite-strip button{touch-action:manipulation'])if(!css.includes(token))failures.push(`CSS fehlt: ${token}`);
if(failures.length){console.error('MID v0.8.33.1 Tooltip-/Ersttap-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.8.33.1 geprüft: bündige Tooltip-Zeilen sowie erster Tap für Suche und Favoriten.');
