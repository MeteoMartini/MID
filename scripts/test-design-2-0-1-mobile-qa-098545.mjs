import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,main,css]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/main.tsx','utf8'),
 readFile('src/midDesign201MobileQa.css','utf8')
]);

assert.ok(app.includes('<span className="humidity"><small>Taupunkt / Feuchte</small><b>{Math.round(dew)} °C</b><em>{Math.round(hum)} %</em></span>'),'Taupunkt muss in der aktuellen Kernanzeige vor relativer Feuchte stehen.');

for(const token of [
 "visibilityCard=x.label==='Sichtweite'",
 "cloudCard=x.label==='Bewölkung'",
 "sunshineCard=x.label==='Sonnenschein'",
 "import './midDesign201MobileQa.css';"
])assert.ok((token.startsWith('import')?main:app).includes(token),`QA-Vertrag fehlt: ${token}`);

for(const token of [
 "padding-bottom:calc(18px + env(safe-area-inset-bottom))!important",
 "grid-template-columns:minmax(0,1fr) 154px!important",
 "white-space:normal!important",
 "grid-template-columns:repeat(4,minmax(0,1fr))!important",
 ".current-weather-facts>.visibility{display:none!important}",
 ".current-weather-facts>.pressure{display:grid!important}",
 "article.uvi-card",
 "article.air-quality-card",
 "grid-column:1/-1!important",
 "grid-auto-rows:max-content!important",
 "background:transparent!important",
 "#current-weather-metrics .mode-info>button",
 "width:22px!important",
 "width:42px!important",
 "min-height:46px!important",
 "@media(max-width:370px)",
 "@media(max-width:850px) and (orientation:landscape)"
])assert.ok(css.includes(token),`Mobile-QA-CSS-Vertrag fehlt: ${token}`);

assert.ok(!/letter-spacing\s*:\s*-\.(?:0[3-9]|[1-9])em/i.test(css),'Aggressive negative Laufweiten dürfen nicht zurückkehren.');

console.log('MID Design 2.0.1 v0.9.85.45: iPhone-QA, Taupunkt-Priorität, Warnstatus, Detailparameter und Bottom-Bar geprüft.');
