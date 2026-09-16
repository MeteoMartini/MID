import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';

const styles=await readFile(new URL('../src/midC7Redesign.css',import.meta.url),'utf8');

const viewports=[
  {name:'iPhone SE',width:320,height:568,mode:'phone'},
  {name:'Android schmal',width:360,height:800,mode:'phone'},
  {name:'iPhone Standard',width:390,height:844,mode:'phone'},
  {name:'iPhone groß',width:430,height:932,mode:'phone'},
  {name:'Phone quer',width:844,height:390,mode:'phone'},
  {name:'Tablet klein',width:600,height:1024,mode:'phone'},
  {name:'Tablet',width:768,height:1024,mode:'phone'},
  {name:'iPad hoch',width:834,height:1194,mode:'phone'},
  {name:'iPad groß',width:1024,height:1366,mode:'rail-compact'},
  {name:'Desktop',width:1366,height:768,mode:'rail'},
  {name:'Desktop breit',width:1440,height:900,mode:'rail'},
  {name:'Desktop sehr breit',width:1920,height:1080,mode:'rail'}
];

for(const token of [
  '@media (min-width:851px)',
  'left:max(12px,calc((100vw - 1540px)/2 + 12px))!important',
  'transform:none!important',
  '@media (min-width:851px) and (max-width:1120px)',
  'width:72px!important',
  '@media (max-width:850px)',
  'left:max(8px,var(--mid-safe-left))!important',
  'right:max(8px,var(--mid-safe-right))!important',
  'bottom:calc(8px + var(--mid-safe-bottom))!important',
  'transform:translate3d(0,0,0)!important',
  'overflow-x:auto',
  '@media (max-width:620px)',
  'prefers-reduced-motion:reduce'
]) assert.ok(styles.includes(token),`C7-Viewportvertrag fehlt: ${token}`);

for(const viewport of viewports){
  const expected=viewport.width<=850 ? 'phone' : viewport.width<=1120 ? 'rail-compact' : 'rail';
  assert.equal(viewport.mode,expected,`${viewport.name}: falscher C7-Modus in der Referenzmatrix`);
  if(expected==='rail'){
    const left=Math.max(12,(viewport.width-1540)/2+12);
    assert.ok(left>=12,`${viewport.name}: Desktop-Rail darf nicht links aus dem Viewport laufen`);
  }
}

console.log(`MID-C7 Viewport-Matrix: ${viewports.length} Referenzgrößen für Phone, Tablet und Desktop geprüft.`);
