import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../src/App.tsx'),ensemble=read('../src/EnsemblePanel.tsx'),styles=read('../src/styles.css'),weather=read('../src/weather.ts');
const failures=[];
for(const token of["document.addEventListener('pointerdown',outside,true)","document.addEventListener('focusin',focusOutside,true)","event.key==='Escape'",'search-close-results','inputRef.current?.blur()'])if(!app.includes(token))failures.push(`Suchfeld-Schließlogik fehlt: ${token}`);
for(const token of['createPortal','getBoundingClientRect()','window.innerWidth-width-8',"window.addEventListener('scroll',update,true)","matchMedia('(hover: hover) and (pointer: fine)')",'onMouseEnter={()=>{if(fineHover())onOpen()}}','onMouseLeave={()=>{if(fineHover())onClose()}}','consistency-popover-portal'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Randfester Hover-Tooltip fehlt: ${token}`);
if(!styles.includes('position:fixed!important')||!styles.includes('z-index:4200!important')||!styles.includes('max-width:calc(100vw - 16px)'))failures.push('Portal-Tooltip ist nicht viewportfest und randbegrenzt');
for(const token of['function RainTooltip(','<Tooltip content={<RainTooltip/>}/>','bestPrecipitation','precipitationProbability'])if(!ensemble.includes(token))failures.push(`Niederschlags-Tooltip fehlt oder ist nicht eingebunden: ${token}`);
for(const token of['ReferenceArea','yAxisId="sky"','x1={row.x-.46}','y2={6.5}','skyBandColor','sunshineShare:sunShare','ensemble-sky-strip'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Bewölkungsband fehlt: ${token}`);
if(!ensemble.includes('margin={{top:14,right:18,left:12,bottom:36}}')||!styles.includes('.trend-combined{height:350px}'))failures.push('Außenmaße des Temperaturdiagramms wurden verändert');
for(const token of['domain={[-.5,Math.max(.5,maxDayIndex+.5)]}','domain={[-.5,Math.max(.5,d.length-.5)]}'])if(!ensemble.includes(token))failures.push(`Diagrammachsen umschließen die Tageswerte nicht symmetrisch: ${token}`);
if((ensemble.match(/tickMargin=\{10\}/g)||[]).length<2)failures.push('Temperatur- und Niederschlagsdiagramm verwenden nicht denselben Abstand der Tagesachse');
for(const token of['windSpeedKmh===undefined?undefined:windSpeedKmh/1.852','windGustKmh===undefined?undefined:windGustKmh/1.852','function normalizeStationWindUnit','if(station.windUnit!==\'kmh\')return station','windUnit:\'kt\''])if(!weather.includes(token))failures.push(`Hyperlokale Wind-Einheitennormalisierung fehlt: ${token}`);
for(const token of["detailPlotRef=useRef<SVGSVGElement>(null)","plot.addEventListener('wheel',wheel,{passive:false})","plot.removeEventListener('wheel',wheel)","event.key==='ArrowUp'?1:-1","moveHour(delta<0?1:-1)","node.addEventListener('keydown',keydown)",'requestedClockHourRef.current=Number.isFinite(clockHour)?clockHour:12',"p.findIndex(x=>Number(x.time.slice(11,13))===requested)"])if(!app.includes(token))failures.push(`Diagrammnavigation fehlt: ${token}`);
if(app.includes("node.addEventListener('wheel',wheel,{passive:false})"))failures.push('Mausrad-Handler hängt weiterhin am gesamten Diagrammcontainer statt ausschließlich am SVG-Plot');
for(const token of[':root[data-theme=dark] select{color-scheme:dark}',':root[data-theme=dark] select option',':root[data-theme=light] select option'])if(!styles.includes(token))failures.push(`Dropdown-Kontrastregel fehlt: ${token}`);


for(const token of ['allowEscapeViewBox={{x:false,y:true}}',"maxWidth:'calc(100vw - 16px)'"])if(!ensemble.includes(token))failures.push(`Trend-Tooltip ist horizontal nicht begrenzt: ${token}`);
if(ensemble.includes('allowEscapeViewBox={{x:true,y:true}}'))failures.push('Trend-Tooltip darf horizontal nicht mehr aus der Diagramm- bzw. Bildschirmfläche entweichen');
for(const token of ['meteogram-day-jump','Vorheriger Tag:','Nächster Tag:','moveDay(-1)','moveDay(1)'])if(!app.includes(token)&&!styles.includes(token))failures.push(`Mobile Tagesnavigation fehlt: ${token}`);
if(ensemble.includes('onFocus={onOpen}'))failures.push('Konsistenzpunkt öffnet auf Touch weiterhin bereits über Fokus und benötigt dadurch zwei Taps');
for(const token of['sunshine_duration','sunshineDurationLow','sunshineDurationHigh','bestSunshineHours','Sonnenscheindauer:</b>','P10–P90:','sunshine-scale-legend'])if(!ensemble.includes(token)&&!styles.includes(token)&&!read('../src/weather.ts').includes(token))failures.push(`Sonnenscheindauer-Auswertung fehlt: ${token}`);
if(!ensemble.includes('sanitizeSunshineSeconds(day,day.sunshineDuration,0)'))failures.push('Bewölkungsband nutzt nicht ausdrücklich den Best-Match-Wert');
if(failures.length){console.error('Interaktionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Interaktionen geprüft: Tooltips bleiben horizontal im sichtbaren Bereich, der Konsistenzpunkt öffnet mobil mit einem Tap, die mobile Detailansicht kann tageweise springen und das Mausrad bleibt auf den SVG-Plot begrenzt.');
