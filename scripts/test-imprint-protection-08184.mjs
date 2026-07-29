import {readFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';

const root=new URL('..',import.meta.url);
const [app,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 "type SettingsSection='view'|'appearance'|'units'|'notifications'|'favorites'|'twin'|'sync'|'system'|'legal';",
 'className="footer-legal-link"',
 '>Impressum</button>',
 '<ImprintDialog open={imprintOpen}',
 'function ProtectedImprintEmail()',
 'const IMPRESSUM_MAILBOX=[116,116,118,115] as const;',
 'const IMPRESSUM_DOMAIN=[109,117,53,107,108] as const;',
 'const IMPRESSUM_CODE_SHIFT_BASE=5;',
 'function imprintCodeShift()',
 'data-nosnippet',
 'E-Mail-Adresse anzeigen',
 'href={`mailto:${email}`}',
 'Martin Molkentin',
 'Habsburgerstr. 8',
 '53859 Niederkassel',
 'section===\'legal\'',
 "['legal','Rechtliches',<Info size={18}/>,'Impressum und Kontakt']"
])need('Impressum-Integration',app,token);

for(const token of [
 '.app>footer>.footer-legal-link{',
 '.imprint-backdrop{',
 '.imprint-dialog{',
 '.imprint-content{',
 '.protected-imprint-email{',
 '.settings-legal .imprint-content.embedded{'
])need('Impressum-Design',styles,token);

const expected=['mmol','fn.de'].join('@');
const decoded=[116,116,118,115].map(value=>String.fromCharCode(value-7)).join('')+'@'+[109,117,53,107,108].map(value=>String.fromCharCode(value-7)).join('');
if(decoded!==expected)failures.push('Die geschützte Zeichencodierung ergibt nicht die vorgesehene Kontaktadresse.');
async function scan(dir){
 for(const entry of await readdir(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())await scan(path);
  else if(/\.(ts|tsx|js|jsx|html|css)$/.test(entry.name)){
   const text=await readFile(path,'utf8');
   if(text.includes(expected))failures.push(`E-Mail-Adresse liegt im Klartext vor: ${path}`);
  }
 }
}
await scan(new URL('../src',import.meta.url).pathname);
need('Package-Test',pkg,'test:imprint-protection');
need('Baseline-Test',baseline,'scripts/test-imprint-protection-08184.mjs');
if(failures.length){console.error('Impressum-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Impressum geprüft: Footer- und Einstellungszugang, Anbieterangaben, Interaktionsfreigabe und fehlender E-Mail-Klartext im App-Quellcode.');
