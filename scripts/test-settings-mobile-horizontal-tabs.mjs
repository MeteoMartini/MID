import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,styles,main]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/midC18I7ResponsiveFixes.css',import.meta.url),'utf8'),
  readFile(new URL('../src/main.tsx',import.meta.url),'utf8')
]);

for(const viewport of [[360,800],[390,844]]){
  assert.ok(viewport[0]<=700&&viewport[1]>viewport[0],`Mobile portrait breakpoint must cover ${viewport[0]}×${viewport[1]}.`);
}
for(const token of [
  "nav.querySelector<HTMLElement>('button[aria-current=\"page\"]')",
  'const centered=nav.scrollLeft+activeRect.left-navRect.left-(nav.clientWidth-activeRect.width)/2',
  "nav.scrollTo({left:target,behavior:reduceMotion?'auto':'smooth'})",
  'nav.dataset.scrollLeft=String(nav.scrollLeft>1)',
  'nav.dataset.scrollRight=String(nav.scrollLeft<maxScroll-1)',
  'new ResizeObserver(onResize)',
  'window.addEventListener(\'resize\',onResize)'
])assert.ok(app.includes(token),`Active settings tab visibility contract missing: ${token}`);

for(const token of [
  '@media(max-width:700px)',
  'flex-flow:row nowrap!important',
  'overflow-x:auto!important',
  'scrollbar-width:none!important',
  '.settings-nav::-webkit-scrollbar{display:none!important}',
  'min-height:44px!important;height:44px!important',
  'white-space:nowrap!important;overflow:visible!important;text-overflow:clip!important',
  'touch-action:pan-x!important',
  'env(safe-area-inset-left,0px)',
  'env(safe-area-inset-right,0px)',
  '.settings-layout:has(.settings-nav[data-scroll-left="true"])::before',
  '.settings-layout:has(.settings-nav[data-scroll-right="true"])::after',
  '@media(prefers-reduced-motion:reduce)'
])assert.ok(styles.includes(token),`Mobile settings navigation style contract missing: ${token}`);

assert.ok(main.indexOf('midC18I7ResponsiveFixes.css')>main.indexOf('midC18WorkPackageI.css'),'Mobile settings fixes must load after the earlier responsive settings rules.');
console.log('Mobile Settings-Tabs geprüft: 360×800/390×844, vollständiger aktiver Tab, horizontales Scrollen, Light/Dark-Variablen, Safe Areas und Touchziele.');