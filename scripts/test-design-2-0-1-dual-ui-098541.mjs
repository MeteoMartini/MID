import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8');

assert.ok(!app.includes("type DesignMode='classic'|'mid-next'"),'Legacy-Dual-Designvertrag darf nicht mehr existieren.');
assert.ok(app.includes("const navigationMode:NavigationMode='bottom-tabs';"),'Die neue Bottom-/Workspace-Navigation muss obligatorisch sein.');
assert.ok(app.includes('const forecastCockpitEnabled=true;'),'Das neue Prognose-Cockpit muss obligatorisch sein.');
assert.ok(app.includes("document.documentElement.dataset.midDesign='next'"),'Das neue MID-Design muss dauerhaft aktiv sein.');
assert.ok(app.includes("localStorage.removeItem('mid:designMode:v1')"),'Alte gespeicherte Designauswahl muss migriert werden.');
assert.ok(!app.includes('design-system-settings'),'Der Gesamt-Designumschalter darf in den Einstellungen nicht mehr existieren.');
assert.ok(app.includes('Skybar-Stil')&&app.includes('24 Stundenquadrate'),'Skybar und 24 Stundenquadrate müssen als unabhängige Fachoption erhalten bleiben.');

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
function splitSelectors(header){
 const result=[];let start=0,round=0,square=0,quote='';
 for(let i=0;i<header.length;i++){
  const c=header[i];
  if(quote){if(c==='\\'){i++;continue;}if(c===quote)quote='';continue;}
  if(c==="'"||c==='"'){quote=c;continue;}
  if(c==='(')round++;else if(c===')')round=Math.max(0,round-1);
  else if(c==='[')square++;else if(c===']')square=Math.max(0,square-1);
  else if(c===','&&round===0&&square===0){result.push(header.slice(start,i));start=i+1;}
 }
 result.push(header.slice(start));
 return result;
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
   const selectors=splitSelectors(header).map(value=>value.trim()).filter(Boolean);
   for(const selector of selectors)assert.ok(selector.includes("html[data-mid-design='next']"),`${source}: ungekapselte Designregel: ${selector}`);
  }
  pos=close+1;
 }
}

for(const relative of designCss){
 const css=await readFile(new URL(relative,import.meta.url),'utf8');
 auditRegion(css,relative);
}

console.log('MID Design 2.0.1 ist obligatorisch; Legacy-Umschalter entfernt, Redesign-CSS und Skybar/Quadrat-Option geschützt.');
