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
 "return'Aktuell: keine Warnlage'",
 'return`Aktuell: ${state}`',
 "if(item.kind==='heat')return/^Extreme\\b/i.test(title)?'extrem':/^Starke\\b/i.test(title)?'stark':'erhöht'"
])assert.ok(app.includes(token),`Aktueller Warnzustandsvertrag fehlt: ${token}`);
assert.ok(!app.includes("'Nächstes Signal'"),'Die kompakte Warnkarte darf keinen zukünftigen Zustand als aktuellen Zustand ausgeben.');
assert.ok(!app.includes("<em>{data.length} {data.length===1?'Zeitfenster':'Zeitfenster'}</em>"),'Zeitfensteranzahl darf im geschlossenen Warnkopf nicht mehr erscheinen.');

// Erst nach dem Aufklappen erscheinen Tages-/Zeitfensterkarten und Erläuterung.
for(const token of [
 '{expanded&&<><div className="hazard-day-grid">',
 'className="hazard-day-group"',
 'itemExpanded=open===id',
 'itemExpanded&&<div className="hazard-body"',
 'Automatisch aus der kanonischen MID-Ortsprognose abgeleitet.',
 'amtliche Meldungen siehe direkt anschließend'
])assert.ok(app.includes(token),`Disclosure-/Detailvertrag fehlt: ${token}`);

// Die stärkste aktuell aktive Stufe färbt den kompakten Kopf; ohne aktuelle Lage bleibt er grün/neutral.
for(const token of [
 '.hazards-current-clear{--hazard-current-color:#48a96f',
 '.hazards-current-yellow{--hazard-current-color:#d4a80f',
 '.hazards-current-orange{--hazard-current-color:#dc7928',
 '.hazards-current-red{--hazard-current-color:#d94b4b',
 '.hazards-current-purple{--hazard-current-color:#9256bf',
 'box-shadow:inset 4px 0 0 color-mix(in srgb,var(--hazard-current-color) 88%,transparent)',
 '.hazards-responsive-head>div>span{margin:0;color:var(--hazard-current-color)'
]){
 assert.ok(styleSource.includes(token),`Warnstufenfarbe fehlt in modularer CSS-Quelle: ${token}`);
 assert.ok(styles.includes(token),`Warnstufenfarbe fehlt im aggregierten CSS: ${token}`);
}

// Amtliche CAP-Warnungen bleiben unmittelbar darunter und unverändert vollständig.
assert.ok(app.includes('<section className="warnings-responsive-shell"><MemoHazards'), 'Automatische und amtliche Warnungen müssen in derselben Warn-Shell bleiben.');
assert.ok(app.includes('<MemoOfficialWarnings alerts={official}'), 'Amtliche Warnungen müssen direkt nach der automatischen Lage folgen.');
for(const token of ['<p>{a.description}</p>','a.instruction&&<p className="instruction">'])assert.ok(app.includes(token),`Amtlicher Warninhalt fehlt: ${token}`);

const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test='scripts/test-warning-current-summary-disclosure-09657.mjs';
assert.equal(pkg.version,baseline.releaseVersion,'Paket- und Baseline-Version müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
console.log(`MID v${pkg.version}: aktueller Warnzustand, Warnstufenfarbe, Disclosure und amtliche Folgewarnungen geprüft.`);
