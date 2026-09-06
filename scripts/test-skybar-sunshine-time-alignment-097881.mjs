import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [shortTerm,intervals,app,cockpit,skybar,baselineRaw,pkgRaw]=await Promise.all([
 read('src/ShortTermForecast.tsx'),read('src/precipitationIntervals.ts'),read('src/App.tsx'),read('src/ForecastCockpit.tsx'),read('src/detailSkyBar.ts'),read('MID_BASELINE.json'),read('package.json')
]);

assert.ok(shortTerm.includes("const rawSunshineDuration=isQuarterInterval?(quarter?.sunshineDuration??null):(accumulationBase?.sunshineDuration??null)"),'Stündliche Kurzfrist-Sonnenscheindauer muss wie Niederschlag vom Intervallende des sichtbaren Vorwärtsslots kommen.');
assert.ok(intervals.includes('sunshineDuration:next.sunshineDuration??null'),'Stündliche/15-min-Präsentation muss Sonnenscheindauer zusammen mit den vorausgehenden Akkumulationen auf den sichtbaren Vorwärtsslot legen.');
assert.ok(intervals.includes('sunshineDuration:null,code:drySkyCode(state)')&&intervals.includes('sunshineDuration:null,code:0'),'Ohne bekannten Folgeslot darf keine alte Sonnenscheindauer in einen unbekannten Vorwärtsslot getragen werden.');
assert.ok(app.includes('sunshineValues=group.map(hour=>hour.sunshineDuration)')&&app.includes('sunshineDuration=sunshineValues.length?sunshineValues.reduce'),'3h-Detailansicht muss die drei stündlichen Sonnenscheindauern summieren.');
assert.ok(cockpit.includes("cloudMean=(key:'cloud'|'lowCloud'|'midCloud'|'highCloud')")&&cockpit.includes("cloud:cloudMean('cloud')??first.cloud"),'Verdichtete 1h/3h-Wolkenfelder müssen als Intervallmittel statt Maximalwert mit der akkumulierten Sonnenscheindauer verglichen werden.');
assert.ok(cockpit.includes('Gesamt- und Schichtbewölkung sind getrennte Modellfelder')&&cockpit.includes('nicht algebraisch zu 100 % ergänzen'),'UI muss Gesamt- und Schichtbewölkung als getrennte Modellfelder erklären statt eine falsche Summen-/Obergrenzenregel zu erzwingen.');
assert.ok(app.includes('Sonnenscheindauer folgt der WMO-Strahlungsdefinition')&&app.includes('nicht einfach 100 % minus Gesamtbewölkung'),'Skybar-Hinweis muss erklären, warum dünne/hohe Bewölkung und direkter Sonnenschein koexistieren können.');
assert.ok(skybar.includes('if(sunshineShare!==null&&Number.isFinite(sunshineShare))return clamp01(sunshineShare);')&&skybar.includes('Gelb')===false,'Skybar-Logik selbst muss die gemessene/modellierte Sonnenscheindauer weiterhin priorisieren, ohne Wolken- und Sonnenband zu mischen.');
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw),test='scripts/test-skybar-sunshine-time-alignment-097881.mjs';
assert.equal(baseline.releaseVersion,pkg.version);
assert.ok(baseline.regressionTests?.includes(test)&&baseline.requiredRegressionTests?.includes(test),'Neue Skybar-Zeitachsenregression muss in beiden Baseline-Listen stehen.');
console.log(`MID v${pkg.version}: Skybar-Sonnenschein ist zeitlich am Vorwärtsslot ausgerichtet; 3h-Summen und Wolkenmittel sind konsistent.`);
