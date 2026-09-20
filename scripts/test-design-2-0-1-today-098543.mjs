import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [cockpit,main,css,pkgRaw,baselineRaw]=await Promise.all([
 readFile('src/ForecastCockpit.tsx','utf8'),
 readFile('src/main.tsx','utf8'),
 readFile('src/midDesign201Today.css','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);

for(const token of [
 'const PROFILE_WINDOW_MS=24*HOUR_MS',
 'const chartStartEpoch=profileNow,chartEndEpoch=profileNow+PROFILE_WINDOW_MS',
 "const profileSkyBarPoints=profileStateSource.filter(point=>point.epoch>=chartStartEpoch&&point.epoch<chartEndEpoch)",
 'profileSkyBarXPositions=profileSkyBarPoints.map(point=>profileXForEpoch(point.epoch))',
 'const profileSkyBarSegments=detailSkyBarSegments(profileSkyBarPoints,chartDataLeft,chartWidth-(chartDataLeft+chartDataWidth),chartWidth,profileSkyBarY,profileSkyBarXPositions)',
 '3 h verdichtet ausschließlich Kurven, Marker und Beschriftungen.',
 "skybarDisplayMode==='squares'?'Die Stundenquadrate bleiben in beiden Ansichten unverändert stündlich aufgelöst.':'Die Skybar bleibt in beiden Ansichten unverändert stündlich aufgelöst.'",
 'data-mid-skybar="profile"',
 "skybarDisplayMode==='squares'?<SkyBarHourCellsSvg cells={profileSkyBarHourCells}",
 '<SkyBarSegmentsSvg segments={profileSkyBarSegments} keyPrefix="profile"/>'
])assert.ok(cockpit.includes(token),`Design-2.0.1-24h-Vertrag fehlt: ${token}`);

assert.ok(!cockpit.includes('const profileSkyBarSegments=detailSkyBarSegments(chartPoints.map(item=>item.point)'),'Die Skybar darf niemals aus der 1h/3h-Anzeigeausdünnung gespeist werden.');
assert.ok(cockpit.includes('profileDisplayPoints=useMemo(()=>selectShortTermPoints(profileHourlyPoints,profileResolution)'),'1h/3h darf weiterhin ausschließlich als graphische Darstellungsdichte verfügbar sein.');
assert.ok(cockpit.includes('profileTemperatureSource=profileHourlyPoints.filter(point=>point.epoch>=profileNow&&point.epoch<=profileNow+PROFILE_WINDOW_MS)'),'Kanonische stündliche 24-h-Quelle fehlt.');

assert.ok(main.includes("import './midDesign201Today.css';"),'Design-2.0.1-Heute-CSS fehlt im Produktionsentry.');
assert.ok(main.indexOf("import './midDesign201Today.css';")>main.indexOf("import './midDesign201Current.css';"),'Heute-Politur muss nach der Aktuell-Politur geladen werden.');

for(const token of [
 "html[data-mid-design='next'] .forecast-cockpit .cockpit-weather-profile",
 "html[data-mid-design='next'] .forecast-cockpit .cockpit-now90",
 "html[data-mid-design='next'] .forecast-cockpit .cockpit-meteogram-pro__stage",
 "html[data-mid-design='next'] .forecast-cockpit .cockpit-meteogram-pro__datafield",
 '@media(min-width:621px) and (max-width:900px)',
 '@media(max-width:620px)',
 '@media(max-width:390px)',
 '@media(max-width:1024px) and (orientation:landscape)',
 '@media(min-width:1200px)'
])assert.ok(css.includes(token),`Responsive Design-2.0.1-Heute-Regel fehlt: ${token}`);

assert.ok(!/letter-spacing\s*:\s*-\.(?:0[3-9]|[1-9])em/i.test(css),'Zu stark negatives Tracking darf im neuen Wetterprofil nicht eingeführt werden.');

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
function stripLeadingComments(value){
 let rest=value;
 while(true){
  rest=rest.replace(/^\s+/,'');
  if(!rest.startsWith('/*'))return rest.trim();
  const end=rest.indexOf('*/');if(end<0)return'';
  rest=rest.slice(end+2);
 }
}
function splitSelectors(header){
 const result=[];let start=0,round=0,square=0,quote='';
 for(let i=0;i<header.length;i++){
  const c=header[i];
  if(quote){if(c==='\\'){i++;continue}if(c===quote)quote='';continue}
  if(c==="'"||c==='"'){quote=c;continue}
  if(c==='(')round++;else if(c===')')round=Math.max(0,round-1);
  else if(c==='[')square++;else if(c===']')square=Math.max(0,square-1);
  else if(c===','&&round===0&&square===0){result.push(header.slice(start,i));start=i+1}
 }
 result.push(header.slice(start));return result;
}
function auditRegion(text,insideKeyframes=false){
 let pos=0;
 while(pos<text.length){
  const open=nextBrace(text,pos);if(open<0)return;
  const close=closeBrace(text,open);assert.notEqual(close,-1,'CSS-Klammern müssen ausgeglichen sein.');
  const header=stripLeadingComments(text.slice(pos,open)),body=text.slice(open+1,close);
  if(/^@(media|supports|container|layer|document)\b/i.test(header))auditRegion(body,false);
  else if(/^@(-webkit-)?keyframes\b/i.test(header))auditRegion(body,true);
  else if(header&&!header.startsWith('@')&&!insideKeyframes){
   for(const selector of splitSelectors(header).map(value=>value.trim()).filter(Boolean))assert.ok(selector.includes("html[data-mid-design='next']"),`Ungekapselte Heute-Regel: ${selector}`);
  }
  pos=close+1;
 }
}
auditRegion(css);

assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron bleiben.');
console.log('MID Design 2.0.1 · Heute/24 h: rolling 24 h, stündliche Skybar unabhängig von 1h/3h-Dichte, responsive Instrumentfläche und Classic-Isolation geprüft.');
