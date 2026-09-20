import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,main,css,c10]=await Promise.all([
 readFile('src/App.tsx','utf8'),
 readFile('src/main.tsx','utf8'),
 readFile('src/midDesign201Current.css','utf8'),
 readFile('src/midC10CurrentRedesign.css','utf8')
]);

assert.ok(app.includes("import {MidWeatherThread} from './MidDesign';"),'MID-Wetterfaden muss die gemeinsame Designprimitive verwenden.');
assert.ok(app.includes("currentThreadSeries=hours.slice(Math.max(0,currentHourIndex),Math.max(0,currentHourIndex)+13)")&&app.includes("currentThreadTemperatures=currentThreadSeries.map((hour,index)=>index===0&&Number.isFinite(temp)?temp:Number(hour.temperature))"),'Aktuell-Wetterfaden muss 13 feste Stundenpositionen behalten und am angezeigten Jetzt-Wert verankert sein.');
assert.ok(app.includes('<MidWeatherThread points={currentThreadTemperatures} minimumSpan={4} verticalGridDivisions={Math.max(1,currentThreadHorizon)} label={\`Temperaturtrend von jetzt bis plus \${currentThreadHorizon} Stunden\`}/>'),'Skalentreuer 12-h-Wetterfaden mit stündlicher Hilfsrasterung fehlt in Aktuell.');
assert.ok(app.includes("horizontalBrandLogoPath=brandLogoPath.replace('-compact','-horizontal')"),'Breite Ansichten müssen die Original-Horizontalwortmarke ableiten.');
assert.ok(app.includes('designMode===\'mid-next\'?<picture className="brand-picture">'),'Responsive Logoauswahl muss ausschließlich im Design-2.0.1-Pfad liegen.');
assert.ok(app.includes('media="(max-width: 620px)" srcSet={brandLogoPath}'),'Schmale Ansichten müssen das Original-Compact-Logo verwenden.');
assert.ok(app.includes('src={horizontalBrandLogoPath} alt="MID Logo"'),'Breite Ansichten müssen das Original-Horizontal-Logo verwenden.');
assert.ok(app.includes('brandLogoPath={brandLogoPath} designMode={designMode} unit={unit}'),'Header muss den aktiven Designmodus erhalten.');

assert.ok(main.includes("import './midDesign201Current.css';"),'Design-2.0.1-Aktuell-CSS fehlt im Produktionsentry.');
assert.ok(main.indexOf("import './midDesign201Current.css';")>main.indexOf("import './midC19WorkspacePolish.css';"),'Aktuell-Komposition muss als gezielter finaler Redesign-Override geladen werden.');

for(const token of [
 "html[data-mid-design='next'] .top.settings-header",
 "grid-template-areas:",
 "html[data-mid-design='next'] .header-favorites",
 "html[data-mid-design='next'] .hero.current-compact",
 "html[data-mid-design='next'] .hero.current-compact .current-weather-thread",
 "grid-template-areas:\n  \"icon statement thread facts\"",
 "html[data-mid-design='next'] .hero.current-compact .current-weather-facts",
 "grid-template-columns:repeat(2,minmax(0,1fr))",
 "@media(min-width:621px) and (max-width:900px)",
 "@media(max-width:620px)",
 "@media(max-width:390px)",
 "@media(max-width:850px) and (orientation:landscape)"
])assert.ok(css.includes(token),`Design-2.0.1-Aktuell-Vertrag fehlt: ${token}`);

assert.ok(!css.includes('-.07em')&&!css.includes('-.14em'),'Extreme negative Laufweiten dürfen nicht zurückkehren.');
assert.ok(css.includes('letter-spacing:-.008em')&&css.includes('letter-spacing:-.015em'),'Nur leichte, lesbare Display-Laufweiten sind erlaubt.');
assert.ok(c10.includes(".current-weather-facts>.visibility")&&c10.includes("display:none!important"),'Vier Kernwerte müssen weiterhin den Leadbereich begrenzen.');

function nextBrace(text,start){
 let quote='',comment=false;
 for(let i=start;i<text.length;i++){
  const c=text[i],n=text[i+1];
  if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue}
  if(!quote&&c==='/'&&n==='*'){comment=true;i++;continue}
  if(quote){if(c==='\\'){i++;continue}if(c===quote)quote='';continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(c==='{')return i;
 }
 return -1;
}
function closeBrace(text,open){
 let depth=1,quote='',comment=false;
 for(let i=open+1;i<text.length;i++){
  const c=text[i],n=text[i+1];
  if(comment){if(c==='*'&&n==='/'){comment=false;i++;}continue}
  if(!quote&&c==='/'&&n==='*'){comment=true;i++;continue}
  if(quote){if(c==='\\'){i++;continue}if(c===quote)quote='';continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(c==='{')depth++;
  else if(c==='}'&&--depth===0)return i;
 }
 return -1;
}
function leadingHeader(value){
 let rest=value;
 while(true){
  rest=rest.replace(/^\s+/,'');
  if(!rest.startsWith('/*'))return rest.trim();
  const end=rest.indexOf('*/'); if(end<0)return '';
  rest=rest.slice(end+2);
 }
}
function audit(text,insideKeyframes=false){
 let pos=0;
 while(pos<text.length){
  const open=nextBrace(text,pos); if(open<0)return;
  const close=closeBrace(text,open); assert.notEqual(close,-1,'CSS-Klammern müssen ausgeglichen sein.');
  const head=leadingHeader(text.slice(pos,open)),body=text.slice(open+1,close);
  if(/^@(media|supports|container|layer|document)\b/i.test(head))audit(body,false);
  else if(/^@(-webkit-)?keyframes\b/i.test(head))audit(body,true);
  else if(head&&!head.startsWith('@')&&!insideKeyframes)assert.ok(head.split(',').every(selector=>selector.includes("html[data-mid-design='next']")),`Ungekapselte Designregel: ${head}`);
  pos=close+1;
 }
}
audit(css);

console.log('MID Design 2.0.1 · Aktuell/Kopf/Favoriten: Logo, Wetterfaden, Hierarchie, Lesbarkeit, Responsive- und Classic-Isolation geprüft.');
