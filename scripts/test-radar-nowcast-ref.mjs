import {readFile} from 'node:fs/promises';
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');
const failures=[];
if(!app.includes('anchorRef=useRef<HTMLButtonElement|null>(null)'))failures.push('Der Radar-Nowcast-Anker ist nicht als schreibbares HTMLButtonElement|null-Ref typisiert.');
if(app.includes('anchorRef=useRef<HTMLButtonElement>(null)'))failures.push('Das readonly auslösende useRef<HTMLButtonElement>(null) ist noch vorhanden.');
if(!app.includes('anchorRef.current=event.currentTarget'))failures.push('Der aktive 5-Minuten-Balken wird nicht als Popover-Anker gesetzt.');
if(failures.length){console.error('Radar-Nowcast-Ref-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radar-Nowcast-Ref geprüft: current ist schreibbar und der aktive Balken bleibt Popover-Anker.');
