import fs from 'node:fs';
const css=fs.readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const failures=[];
for(const token of [
'/* MID v0.9.84.48 · mobiler Kopfbereich',
'@media (max-width:520px) and (orientation:portrait)',
'.hero.current-compact{\n    grid-template-columns:1fr;',
'grid-template-columns:minmax(0,1fr) 1px minmax(0,1fr)',
'overflow:hidden',
'@media (orientation:landscape) and (max-height:600px) and (max-width:950px)'
]) if(!css.includes(token)) failures.push(token);
if(failures.length){console.error('Mobile current hero contract missing:',failures);process.exit(1)}
console.log('Mobile current hero contract: OK');
