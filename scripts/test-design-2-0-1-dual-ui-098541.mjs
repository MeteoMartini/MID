import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');

assert.match(app,/type DesignMode='classic'\|'mid-next'/,'Design-Modi müssen klassisch und Design 2.0.1 getrennt bleiben.');
assert.match(app,/type NavigationMode='section-rail'\|'bottom-tabs'/,'Klassische und neue Navigation brauchen getrennte Modi.');
assert.match(app,/localStorage\.getItem\(DESIGN_MODE_STORAGE_KEY\)==='mid-next'\?'mid-next':'classic'/,'Ohne explizite Auswahl muss Klassisch der sichere Standard bleiben.');
assert.match(app,/const navigationMode:NavigationMode=designMode==='mid-next'\?'bottom-tabs':'section-rail'/,'Die Navigation muss vom Designmodus abhängen.');
assert.match(app,/const forecastCockpitEnabled=designMode==='mid-next'/,'Das neue Prognose-Cockpit darf nicht automatisch in Klassisch aktiv sein.');
assert.match(app,/>Design 2\.0\.1</,'Die neue Oberfläche muss in den Einstellungen eindeutig benannt sein.');
assert.match(app,/Bisherige Dashboard-Struktur und Navigation unverändert beibehalten/,'Klassisch muss als echte Rückfalloberfläche beschrieben sein.');

const designCss=[
  '../src/midDesign.css',
  '../src/midC8VisibleRedesign.css',
  '../src/midC14MapWorkspace.css',
  '../src/midC14ViewportFixes.css',
  '../src/midC15TodayDensity.css',
  '../src/midC18ResponsivePolish.css',
  '../src/midC19WorkspacePolish.css'
];

function nextBrace(text,start){
 let quote='',comment=false;
 for(let i=start;i<text.length;i++){
  const c=text[i],n=text[i+1];
  if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}
  if(!quote&&c==='/'&&n==='*'){comment=true;i++;continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==="'"||c==='"'){quote=c;continue;}
  if(c==='{')return i;
 }
 return -1;
}
function closeBrace(text,open){
 let depth=1,quote='',comment=false;
 for(let i=open+1;i<text.length;i++){
  const c=text[i],n=text[i+1];
  if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue;}
  if(!quote&&c==='/'&&n==='*'){comment=true;i++;continue;}
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==="'"||c==='"'){quote=c;continue;}
  if(c==='{')depth++;
  else if(c==='}'&&--depth===0)return i;
 }
 return -1;
}
function stripLeadingComments(value){
 let rest=value;
 while(true){
  const next=rest.replace(/^\s+/,'');
  if(!next.startsWith('/*'))return next;
  const end=next.indexOf('*/');
  if(end<0)return '';
  rest=next.slice(end+2);
 }
}
function auditRegion(text,source,insideKeyframes=false){
 let pos=0;
 while(pos<text.length){
  const open=nextBrace(text,pos);
  if(open<0)return;
  const close=closeBrace(text,open);
  assert.notEqual(close,-1,`${source}: unausgeglichene CSS-Klammern`);
  const header=stripLeadingComments(text.slice(pos,open)).trim();
  const body=text.slice(open+1,close);
  if(/^@(media|supports|container|layer|document)\b/i.test(header))auditRegion(body,source,false);
  else if(/^@(-webkit-)?keyframes\b/i.test(header))auditRegion(body,source,true);
  else if(header&&!header.startsWith('@')&&!insideKeyframes){
   const selectors=header.split(',').map(value=>value.trim()).filter(Boolean);
   for(const selector of selectors)assert.ok(selector.includes("html[data-mid-design='next']"),`${source}: ungekapselte Designregel: ${selector}`);
  }
  pos=close+1;
 }
}

for(const relative of designCss){
 const css=await readFile(new URL(relative,import.meta.url),'utf8');
 auditRegion(css,relative);
}

console.log('Design 2.0.1 und Klassisch sind strukturell getrennt; Redesign-CSS bleibt im Next-Scope.');
