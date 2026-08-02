import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const parts=String(pkg.version).split('.').map(Number),minimum=[0,8,33,15];let atLeast=true;for(let index=0;index<minimum.length;index++){if((parts[index]??0)>minimum[index])break;if((parts[index]??0)<minimum[index]){atLeast=false;break}}if(!atLeast)failures.push(`package.json liegt vor 0.8.33.15: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != ${pkg.version}`);
for(const token of [
 "selectedDateRef=useRef('')",
 'const setForecastSelected=useCallback',
 'selected={selectedSeed} setSelected={setForecastSelected}',
 'selected:selectedSeed,setSelected:onSelectedChange',
 'const [selected,setSelectedState]=useState',
 'const setSelected=useCallback',
 'const forecastRowContents=useMemo',
 'searchTouchRef=useRef',
 'const focusSearchInput=',
 'onTouchStartCapture={beginSearchTouch}',
 'onTouchEndCapture={endSearchTouch}',
 'dayJumpTouchRef=useRef',
 'function beginDayJumpTouch',
 'function endDayJumpTouch',
 'onTouchEnd={event=>endDayJumpTouch(event,1)}'
])need('App-Interaktionspfad',app,token);
const forecastRowsStart=app.indexOf('const forecastRowContents=useMemo');
const forecastRowsEnd=app.indexOf('\n useEffect(()=>{if(!p.length)',forecastRowsStart);
const forecastRows=app.slice(forecastRowsStart,forecastRowsEnd);
if(/\[forecastDays,hours,selected,/.test(forecastRows))failures.push('Tageszeilen hängen weiterhin von der aktiven Auswahl ab.');
if(app.includes("root.classList.add('mid-fast-scroll')")||app.includes('requestAnimationFrame(settle)'))failures.push('Veraltete globale Fast-Scroll-Umschaltung ist weiterhin aktiv.');
if(app.includes("onPointerDown={event=>{if((event.target as HTMLElement).closest('button'))return;setOpen(true);if(document.activeElement!==inputRef.current)"))failures.push('Suchfeld verwendet weiterhin nur den alten Pointer-down-Fokuspfad.');
for(const token of [
 'MID v0.8.33.15 · zuverlässige Aktivierung nach Momentum-Scroll',
 '.search-input-shell{',
 'min-height:48px;',
 '.meteogram-day-jump>button{',
 'width:44px!important;',
 'min-height:44px!important;'
])need('Mobile Trefferflächen',css,token);
if(failures.length){console.error('MID v0.8.33.15 Scroll-/Tap-Performanceprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.8.33.15 geprüft: Suchfeld und Tagesnavigation reagieren über Touch-end nach Momentum-Scroll; Tagesauswahl bleibt lokal und statische Tageszeilen werden nicht neu berechnet.');
