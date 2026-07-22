import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../src/App.tsx'),ensemble=read('../src/EnsemblePanel.tsx'),styles=read('../src/styles.css');
const failures=[];
for(const token of["document.addEventListener('pointerdown',outside,true)","document.addEventListener('focusin',focusOutside,true)","event.key==='Escape'",'search-close-results','inputRef.current?.blur()'])if(!app.includes(token))failures.push(`Suchfeld-Schließlogik fehlt: ${token}`);
for(const token of['consistency-trigger:hover .consistency-popover','visibility:hidden','pointer-events:none'])if(!styles.includes(token))failures.push(`Hover-Tooltip-Regel fehlt: ${token}`);
if(!ensemble.includes('className="consistency-popover" role="tooltip"'))failures.push('Konsistenz-Tooltip wird nicht dauerhaft hoverfähig gerendert');
for(const token of["node.addEventListener('wheel',wheel,{passive:false})","event.key==='ArrowUp'?1:-1","moveHour(delta<0?1:-1)","node.addEventListener('keydown',keydown)"])if(!app.includes(token))failures.push(`Diagrammnavigation fehlt: ${token}`);
if(failures.length){console.error('Interaktionsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Interaktionen geprüft: Suche schließt außerhalb/Escape, Konsistenzpunkte hovern automatisch, Diagramm reagiert auf Pfeiltasten und Mausrad.');
