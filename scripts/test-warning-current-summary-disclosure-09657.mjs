import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,styleSource,styles,pkgRaw,baselineRaw]=await Promise.all([
 read('src/App.tsx'),
 read('src/styles-src/30-modern.css'),
 read('src/styles.css'),
 read('package.json'),
 read('MID_BASELINE.json')
]);

// Geschlossen wird ausschließlich der aktuelle automatische Warnzustand gezeigt.
for(const token of [
 "const[open,setOpen]=useState<string>(''),[expanded,setExpanded]=useState(false)",
 'hazardCurrentItems(sortedData)',
 'hazardCurrentLevel(current)',
 'summaryData=current.length?current:sortedData',
 'className="hazards-responsive-head hazards-responsive-summary"',
 'onClick={()=>setExpanded(value=>!value)}',
 'aria-expanded={expanded}',
 "return'Derzeit kein MID-Hinweis aktiv'",
 'return`Aktuell: ${state}`',
 "if(item.kind==='heat')return/^Extreme\\b/i.test(title)?'extrem':/^Starke\\b/i.test(title)?'stark':'erhöht'"
])assert.ok(app.includes(token),`Aktueller Warnzustandsvertrag fehlt: ${token}`);
assert.ok(!app.includes("'Nächstes Signal'"),'Die kompakte Warnkarte darf keinen zukünftigen Zustand als aktuellen Zustand ausgeben.');
assert.ok(!app.includes("<em>{data.length} {data.length===1?'Zeitfenster':'Zeitfenster'}</em>"),'Zeitfensteranzahl darf im geschlossenen Warnkopf nicht mehr erscheinen.');

// Erst nach dem Aufklappen erscheinen Tages-/Zeitfensterkarten und Erläuterung.
for(const token of [
 '{expanded&&<div className="hazard-day-grid">',
 'className="hazard-day-group"',
 'itemExpanded=open===id',
 'itemExpanded&&<div className="hazard-body"',
 'className={`hazard-origin-badge${supplement?\' supplement\':\'\'}`}',
 'MID · PROGNOSEHINWEIS'
])assert.ok(app.includes(token),`Disclosure-/Detailvertrag fehlt: ${token}`);

assert.ok(!app.includes('Automatisch aus der kanonischen MID-Ortsprognose abgeleitet.'),'Entfernter Hilfstext darf nicht in die Warnkarte zurückkehren.');
assert.ok(!app.includes('Amtliche Warnungen bleiben autoritativ und werden separat gekennzeichnet.'),'Entfernter Warnkarten-Fußtext darf nicht zurückkehren.');

// Amtliche Stufenfarben bleiben exklusiv bei amtlichen Karten; MID-Hinweise nutzen Parameterfarben.
for(const token of [
 '.official-alert.yellow{--official-level:#e0b92e',
 '.official-alert.orange{--official-level:#ef8d32',
 '.official-alert.red{--official-level:#e74a4a',
 '.official-alert.purple{--official-level:#a866df',
 'article[data-kind=wind]{--mid-hazard-color:var(--param-wind)}',
 'article[data-kind=heavyRain]',
 'background:var(--mid-hazard-color)'
]){
 assert.ok(styleSource.includes(token),`Hybrid-Farbvertrag fehlt in modularer CSS-Quelle: ${token}`);
 assert.ok(styles.includes(token),`Hybrid-Farbvertrag fehlt im aggregierten CSS: ${token}`);
}

// Amtliche CAP-Warnungen stehen im Hybrid-Zentrum zuerst und bleiben unverändert vollständig.
assert.ok(app.includes('function WarningCenter('), 'Gemeinsames Hybrid-Warnzentrum fehlt.');
assert.ok(app.includes('<MemoOfficialWarnings alerts={alerts}'), 'Amtliche Warnungen müssen im Hybrid-Zentrum zuerst erscheinen.');
assert.ok(app.includes('<MemoHazards data={automatic}'), 'MID-Hinweise müssen nach den amtlichen Warnungen folgen.');
for(const token of ['<p>{a.description}</p>','a.instruction&&<p className="instruction">'])assert.ok(app.includes(token),`Amtlicher Warninhalt fehlt: ${token}`);

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-warning-current-summary-disclosure-09657.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: aktueller Warnzustand, Warnstufenfarbe, Disclosure und amtliche Folgewarnungen geprüft.`);
