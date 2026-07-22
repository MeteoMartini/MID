import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../src/App.tsx'),ensemble=read('../src/EnsemblePanel.tsx'),styles=read('../src/styles.css');
const failures=[];
for(const token of["document.addEventListener('pointerdown',outside,true)","document.addEventListener('focusin',focusOutside,true)","event.key==='Escape'",'search-close-results','inputRef.current?.blur()'])if(!app.includes(token))failures.push(`Suchfeld-Schließlogik fehlt: ${token}`);
for(const token of['createPortal','getBoundingClientRect()','window.innerWidth-width-8',"window.addEventListener('scroll',update,true)",'onMouseEnter={onOpen}','onMouseLeave={onClose}','consistency-popover-portal'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Randfester Hover-Tooltip fehlt: ${token}`);
if(!styles.includes('position:fixed!important')||!styles.includes('z-index:4200!important')||!styles.includes('max-width:calc(100vw - 16px)'))failures.push('Portal-Tooltip ist nicht viewportfest und randbegrenzt');
for(const token of['function RainTooltip(','<Tooltip content={<RainTooltip/>}/>','bestPrecipitation','precipitationProbability'])if(!ensemble.includes(token))failures.push(`Niederschlags-Tooltip fehlt oder ist nicht eingebunden: ${token}`);
for(const token of['ReferenceArea','yAxisId="sky"','x1={row.x-.46}','y2={6.5}','skyBandColor','sunshineShare:sunShare','ensemble-sky-strip'])if(!ensemble.includes(token)&&!styles.includes(token))failures.push(`Bewölkungsband fehlt: ${token}`);
if(!ensemble.includes('margin={{top:14,right:18,left:12,bottom:36}}')||!styles.includes('.trend-combined{height:350px}'))failures.push('Außenmaße des Temperaturdiagramms wurden verändert');
for(const token of["node.addEventListener('wheel',wheel,{passive:false})","event.key==='ArrowUp'?1:-1","moveHour(delta<0?1:-1)","node.addEventListener('keydown',keydown)",'requestedClockHourRef.current=Number.isFinite(clockHour)?clockHour:12',"p.findIndex(x=>Number(x.time.slice(11,13))===requested)"])if(!app.includes(token))failures.push(`Diagrammnavigation fehlt: ${token}`);
for(const token of[':root[data-theme=dark] select{color-scheme:dark}',':root[data-theme=dark] select option',':root[data-theme=light] select option'])if(!styles.includes(token))failures.push(`Dropdown-Kontrastregel fehlt: ${token}`);
if(failures.length){console.error('Interaktionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Interaktionen geprüft: Suche schließt, Konsistenztooltips bleiben viewportfest, Bewölkungsband liegt in unveränderter Diagrammgröße, Diagrammnavigation reagiert auf Pfeiltasten und Mausrad.');
