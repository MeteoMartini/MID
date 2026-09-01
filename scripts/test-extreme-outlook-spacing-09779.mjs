import fs from 'node:fs';
import path from 'node:path';
const css=fs.readFileSync(path.join(process.cwd(),'src','styles-src','25-extreme-outlook.css'),'utf8');
const checks=[
  ['extreme outlook has bottom module spacing',css.includes('.card.module-shell[data-mid-view="extreme-outlook"]{margin-bottom:22px}')],
  ['mobile extreme outlook has slightly larger bottom spacing',css.includes('@media(max-width:720px){.card.module-shell[data-mid-view="extreme-outlook"]{margin-bottom:26px}}')]
];
const failed=checks.filter(([,ok])=>!ok);
if(failed.length){console.error('Extreme outlook spacing regression failed:');failed.forEach(([label])=>console.error(` - ${label}`));process.exit(1)}
console.log('Extreme outlook spacing regression passed with',checks.length,'checks.');
