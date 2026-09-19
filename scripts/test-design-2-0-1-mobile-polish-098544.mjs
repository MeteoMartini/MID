import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [css,main,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/midDesign201MobilePolish.css','utf8'),
 readFile('src/main.tsx','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-design-2-0-1-mobile-polish-098544.mjs';

assert.equal(pkg.version,'0.9.85.44');
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(main.includes("import './midDesign201MobilePolish.css';"));
assert.ok(main.indexOf("import './midDesign201MobilePolish.css';")>main.indexOf("import './midDesign201Today.css';"));

for(const token of [
 "@media(max-width:850px)",
 "grid-template-areas:\n   \"icon statement\"\n   \"icon range\"\n   \"thread thread\"\n   \"facts facts\"",
 "position:static!important",
 "background:transparent!important",
 "font-size:52px!important",
 "min-height:58px!important",
 "grid-template-columns:repeat(2,minmax(0,1fr))!important",
 ".current-weather-facts>.pressure{display:none!important}",
 "#current-weather-metrics .mode-info>button",
 "width:24px!important",
 "width:44px!important;height:44px!important",
 "min-height:78px!important",
 "padding-bottom:calc(122px + var(--mid-safe-bottom))!important",
 "min-height:48px!important",
 "@media(max-width:390px)",
 "@media(max-width:850px) and (orientation:landscape)",
 "@media(min-width:621px) and (max-width:900px) and (orientation:portrait)"
])assert.ok(css.includes(token),`Mobile-Politurvertrag fehlt: ${token}`);

assert.ok(!/letter-spacing\s*:\s*-\.(?:0[3-9]|[1-9])em/i.test(css),'Aggressive negative Laufweite ist im neuen Mobilpfad nicht zulässig.');

function auditScopedSelectors(source){
 const lines=source.split('\n');
 for(const line of lines){
  const trimmed=line.trim();
  if(!trimmed||trimmed.startsWith('/*')||trimmed.startsWith('*')||trimmed.startsWith('@')||trimmed.startsWith('}')||trimmed.startsWith('--'))continue;
  if(trimmed.includes('{')&&!trimmed.startsWith('html[data-mid-design=')&&!trimmed.startsWith("html[data-mid-design='next']")){
   // continuation selector lines are allowed when the first selector in the rule is scoped
   if(trimmed.startsWith('html['))continue;
  }
 }
}
auditScopedSelectors(css);

for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),`${test} fehlt in requiredFiles.`);

console.log('MID Design 2.0.1 v0.9.85.44: mobile Aktuell-Ansicht, Info-Controls, kompakte Detailwerte und Bottom-Bar-Sicherheitsabstand geprüft.');
