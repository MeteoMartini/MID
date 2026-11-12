import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const versionAtLeast=(value,target)=>{const a=String(value).split('.').map(Number),b=String(target).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length);i++){if((a[i]||0)!==(b[i]||0))return(a[i]||0)>(b[i]||0)}return true};

const [pollen,css,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/PollenForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/midPollen.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-pollen-compact-dwd-levels-0985129.mjs';
assert.ok(versionAtLeast(pkg.version,'0.9.85.129'),'Der v0.9.85.129-Pollenvertrag muss in späteren Wartungsständen fortgelten.');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
for(const key of ['requiredRegressionTests','regressionTests'])assert.ok(baseline[key]?.includes(self),self+' fehlt in '+key);

for(const code of ["'0':'keine'","'0-1':'keine bis gering'","'1':'gering'","'1-2':'gering bis mittel'","'2':'mittel'","'2-3':'mittel bis hoch'","'3':'hoch'"])assert.ok(pollen.includes(code),'DWD-Zwischenstufe fehlt: '+code);
assert.ok(pollen.includes("raw==='0-1'||raw.includes('keine bis gering'))return.5"),'0–1 darf nicht als keine Belastung klassifiziert werden.');
assert.ok(pollen.includes("raw==='1-2'||raw.includes('gering bis mittel')"),'1–2-Zwischenstufe fehlt.');
assert.ok(pollen.includes("raw==='2-3'||raw.includes('mittel bis hoch')"),'2–3-Zwischenstufe fehlt.');
assert.ok(pollen.includes('severity:pollenSeverity(item.entry)')&&pollen.includes('.filter(item=>item.severity>0)'),'Heutige Relevanz muss die siebenstufige DWD-Auswertung verwenden.');
assert.ok(pollen.includes('relevantTypes=sortedTypes.filter')&&pollen.includes('maxTypeSeverity(type)>0'),'Der 3-Tage-Ausblick muss zunächst nur relevante Pollenarten zeigen.');
assert.ok(pollen.includes('primaryTypes=relevantTypes.slice(0,4)'),'Die erste Detailstufe darf höchstens vier relevante Pollenarten zeigen.');
assert.ok(pollen.includes("detailTypes=showAll?sortedTypes:primaryTypes")&&pollen.includes('Alle 8 Pollenarten anzeigen'),'Alle acht Pollenarten dürfen erst in der expliziten zweiten Detailstufe erscheinen.');
assert.ok(pollen.includes("'DWD · Produktstand':'DWD · Abruf'")&&pollen.includes('pollen-region'),'Region, Quelle und fachlicher Produkt-/Abrufstand müssen kompakt erhalten bleiben.');
assert.ok(!pollen.includes('forecast-entry-head-pollen'),'Der alte mehrspaltige Forecast-Kopf darf die Pollendarstellung nicht mehr aufbrechen.');
assert.ok(css.includes('grid-template-columns:minmax(0,1fr) auto auto'),'Der kompakte Kopf braucht eine kontrollierte Rasterhierarchie.');
assert.ok(css.includes('min-height:44px'),'Das Haupt-Disclosure muss mindestens 44 px hoch bleiben.');
assert.ok(css.includes('.pollen-all-toggle{justify-self:start;min-height:44px'),'Auch die zweite Detailstufe braucht ein 44-px-Touchziel.');
assert.ok(css.includes('grid-template-columns:minmax(76px,1.12fr) repeat(var(--pollen-days,3),minmax(0,1fr))'),'Die 3-Tage-Tabelle muss ohne künstliche 420-px-Mindestbreite in mobile Karten passen.');
assert.ok(!css.includes('min-width:420px'),'Die mobile Pollenmatrix darf keine horizontale Mindestbreite erzwingen.');
assert.ok(css.includes('scroll-margin-bottom:calc(5.5rem + env(safe-area-inset-bottom))'),'Geöffnete Pollendetails brauchen Abstand zur festen Bottom-Bar.');
// Run the actual TypeScript severity and coverage helpers against DWD boundary codes.
const start=pollen.indexOf('function pollenSeverity('),end=pollen.indexOf('function pollenLabel(');
assert.ok(start>=0&&end>start,'Original pollen functions not found');
const compiled=pollen.slice(start,end)
 .replace('function pollenSeverity(entry:PollenForecastEntry|undefined):number','function pollenSeverity(entry)')
 .replace('function pollenHasMissing(date:string,types:string[],byType:Map<string,PollenForecastEntry[]>):boolean','function pollenHasMissing(date,types,byType)');
assert.ok(!compiled.includes('PollenForecastEntry')&&!compiled.includes('Map<string'),'QA must remove only the two original TypeScript signatures');
const {pollenSeverity,pollenHasMissing}=new Function(compiled+';return {pollenSeverity,pollenHasMissing}')();
const item=(value,integer,date='2026-11-10')=>({pollenValue:value,pollenInt:integer,forecastDate:date});
for(const [value,integer,expected] of [['0',-1,0],['0-1',0,0.5],['1-2',0,1.5],['2-3',0,2.5],['3',3,3],['-1',0,-1],['',undefined,-1],['',null,-1],['unbekannt',undefined,-1],['',0,-1],['unbekannt',0,-1],[' ',0,-1]])
 assert.equal(pollenSeverity(item(value,integer)),expected,'DWD pollen level '+String(value)+' / '+String(integer));
const map=new Map([['Hasel',[item('0',0)]],['Erle',[item('-1',0)]]]);
assert.equal(pollenHasMissing('2026-11-10',['Hasel'],map),false,'Valid 0 is genuine no burden');
assert.equal(pollenHasMissing('2026-11-10',['Hasel','Erle'],map),true,'Missing -1 remains unknown');
assert.equal(pollenHasMissing('2026-11-11',['Hasel','Erle'],map),true,'Missing entire day remains unknown');
assert.equal(pollenHasMissing('2026-11-10',[],map),true,'Missing pollen inventory remains unknown');
assert.ok(pollen.includes("todayHasMissing?'DWD-Angaben unvollständig':'keine Belastung'"));
assert.ok(pollen.includes("forecastHasMissing?'Pollenangaben teilweise nicht verfügbar.'"));
assert.ok(pollen.includes('pollenForecastDetailStatus(relevantTypes.length,primaryTypes.length,forecastHasMissing)'),'The visible 3-day header must retain the independent missing-data status');
const detailStart=pollen.indexOf('function pollenForecastDetailStatus('),detailEnd=pollen.indexOf('function pointInPolygon(',detailStart);
assert.ok(detailStart>=0&&detailEnd>detailStart,'DWD detail status helper is missing');
const detailSource=pollen.slice(detailStart,detailEnd)
 .replace('function pollenForecastDetailStatus(relevantCount:number,displayedCount:number,hasMissing:boolean):string',
          'function pollenForecastDetailStatus(relevantCount,displayedCount,hasMissing)');
const detailStatus=new Function(detailSource+';return pollenForecastDetailStatus')();
for(const [relevant,shown,missing,expected] of [
 [0,0,true,'DWD-Angaben unvollständig'],
 [0,0,false,'keine Belastung'],
 [1,1,true,'DWD-Angaben unvollständig · 1 relevante Pollenart'],
 [1,1,false,'1 relevante Pollenart'],
 [3,3,true,'DWD-Angaben unvollständig · 3 relevante Pollenarten'],
 [5,4,true,'DWD-Angaben unvollständig · 5 relevant · 4 angezeigt'],
 [5,4,false,'5 relevant · 4 angezeigt']
])assert.equal(detailStatus(relevant,shown,missing),expected,'DWD 3-day partial-coverage summary');

assert.ok(pollen.includes("entry&&pollenSeverity(entry)>=0?<span"),'DWD -1 grid cell must not inherit green level 0');
console.log(`MID v${pkg.version}: kompakte Pollenhierarchie und siebenstufige DWD-Zwischenwerte ab v0.9.85.129 geschützt.`);
