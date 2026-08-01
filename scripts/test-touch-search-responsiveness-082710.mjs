import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const fails=[];
for(const token of ['type="search"','inputMode="search"','enterKeyHint="search"','autoCapitalize="none"','autoCorrect="off"','spellCheck={false}','debounceMs=/^\\d{2,8}$/.test(term)?120:180']) if(!app.includes(token)) fails.push(`App fehlt: ${token}`);
for(const token of ['.search input,','.search>div button,','.search>section button,','.short-term-strip>button,','.short-term-detail>header>button{','touch-action:manipulation;','.short-term-strip>button:active{transform:scale(.988)}']) if(!css.includes(token)) fails.push(`CSS fehlt: ${token}`);
if(fails.length){console.error('Touch-/Such-Responsiveness-Prüfung fehlgeschlagen:\n- '+fails.join('\n- '));process.exit(1)}
console.log('Schnellere Ortssuche und direktere Kurzfrist-Touch-Bedienung geprüft.');
