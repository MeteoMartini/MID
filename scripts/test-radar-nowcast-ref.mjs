import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
if(!app.includes('anchorRef=useRef<HTMLSpanElement|null>(null)'))failures.push('Der Radar-Nowcast-Anker ist nicht als schreibbares HTMLSpanElement|null-Ref typisiert.');
if(app.includes('anchorRef=useRef<HTMLSpanElement>(null)'))failures.push('Das readonly auslösende useRef<HTMLSpanElement>(null) ist noch vorhanden.');
if(!app.includes('<span ref={anchorRef}')||!app.includes('(selected.left+selected.right)/2'))failures.push('Der separate unsichtbare Anker folgt nicht dem ausgewählten Zeitschritt.');
if(!app.includes('onPointerUp={pointerEnd}')||!app.includes('onKeyDown={keyDown}'))failures.push('Gemeinsamer Touch-/Tastatur-Scrubber fehlt.');
if(failures.length){console.error('Radar-Nowcast-Ref-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Nowcast-Ref geprüft: current ist schreibbar und der ausgewählte Zeitschritt bleibt über einen separaten unsichtbaren Anker erreichbar.');
