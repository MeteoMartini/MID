import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const css=await readFile(new URL('../src/midC14ViewportFixes.css',import.meta.url),'utf8');
const main=await readFile(new URL('../src/main.tsx',import.meta.url),'utf8');

assert.ok(main.indexOf("import './v078';")<main.indexOf("import './midC7Redesign.css';"),'Legacy-CSS muss vor dem sichtbaren Redesign liegen.');
for(const token of [
 'width:calc(100% - 4px)!important',
 'width:32px!important',
 'height:34px!important',
 'min-height:28px!important',
 'grid-template-columns:62px minmax(0,1fr)!important',
 'font-size:46px!important',
 'min-height:42px!important',
 'max-height:calc(100dvh',
 'overflow-y:auto!important',
 'contain:layout paint!important',
 'overflow-x:hidden'
])assert.ok(css.includes(token),`Screenshot-Vertrag fehlt: ${token}`);

console.log('MID-C14: reale Smartphone-Screenshotkorrekturen sind gegen spätere CSS-Rückfälle geschützt.');
