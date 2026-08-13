import {readFile} from 'node:fs/promises';
const [app,cockpit,styles]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: ${token}`)};
need('Module verwenden nativen Einzel-Click',app,'className="module-shell-toggle" onClick={toggle}');
forbid('Alte Modul-Touch-Doppelaktivierung entfernt',app,'lastTouchToggle=useRef(0)');
forbid('Alte Modul-Gestenerkennung entfernt',app,'touchGesture=useRef');
need('Ortssuche bleibt bis echtem Außenklick stabil',app,"document.addEventListener('pointerdown',outside,true)");
forbid('Input-Blur darf Treffer nicht vor Click aushängen',app,"onBlur={()=>window.requestAnimationFrame(()=>{if(!searchRef.current?.contains(document.activeElement))closeSearch(false)})}");
need('Cockpit-Punkte aktivieren nur einmal',cockpit,'onClick={()=>activatePoint(item.point)}');
forbid('Cockpit-Pointerdown-Doppelaktivierung entfernt',cockpit,'onPointerDown={()=>activatePoint(item.point)}');
forbid('Cockpit-Touchstart-Doppelaktivierung entfernt',cockpit,'onTouchStart={()=>activatePoint(item.point)}');
for(const token of [
  'button,[role="button"],summary{',
  'touch-action:manipulation;',
  '-webkit-tap-highlight-color:transparent;',
  '@media(hover:none),(pointer:coarse){',
  'min-width:36px!important;',
  'min-height:36px!important;',
  'button>svg,',
  'pointer-events:none;'
])need('Appweiter Touchvertrag',styles,token);
if(failures.length){console.error('Appweiter Touch-/Responsivitäts-Cleanup fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Appweiter Touch-/Responsivitäts-Cleanup geprüft: keine Mehrfachaktivierung in Modulen/Cockpit, stabile Suchtreffer und vergrößerte Touchflächen auf groben Zeigern.');
