import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [shortTerm,skybar,cockpit,rucFetch,pkgRaw,baselineRaw]=await Promise.all([
 read('src/ShortTermForecast.tsx'),
 read('src/detailSkyBar.ts'),
 read('src/ForecastCockpit.tsx'),
 read('tools/ruc/fetch_and_build_ruc.py'),
 read('package.json'),
 read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),self='scripts/test-mid-18-2-1-skybar-cloud-coherence-098572.mjs';

assert.ok(shortTerm.includes('cover=Number.isFinite(total)?total:low'),'Trockene Himmelsklassifikation muss Gesamtbewölkung priorisieren; tiefe Bewölkung ist nur Fallback.');
assert.ok(!shortTerm.includes('covers.length?Math.max(...covers):Number.NaN'),'Tiefe Bewölkung darf Gesamtbewölkung nicht künstlich zu „Bedeckt“ hochstufen.');
assert.ok(!shortTerm.includes('if(localAdjustment<=0)return raw;'),'Trockene 15-min-/Stunden-Texte dürfen keinen veralteten Roh-Wettercode an interpolierter Gesamtbewölkung vorbeiführen.');
assert.ok(shortTerm.includes('return observedSkyCode(Number.isFinite(observed)?observed:raw,cloud,lowCloud,visibility,humidity,temperature);'),'Trockene Wettercodes müssen aus derselben Wolken-/Sichtlage kohärentisiert werden.');
assert.ok(skybar.includes('const cloud=hour.cloud===null||hour.cloud===undefined?NaN:clamp(Number(hour.cloud),0,100);')&&skybar.includes('if(cloudKnown){'),'Skybar muss weiterhin dieselbe Gesamtbewölkung als primären Himmelswert nutzen.');
assert.ok(skybar.includes('if(cover>=87.5)return 3')===false,'Skybar darf keine getrennte Textklassifikation enthalten; Schwellen bleiben im Kurzfristcode.');
assert.ok(cockpit.includes('now90SkyCells=detailSkyBarHourCells(now90)')&&cockpit.includes('now90SkySegments=detailSkyBarSegments(now90,2,2,120,8)'),'90-min-Skybar muss direkt aus derselben finalisierten Kurzfristreihe stammen.');
assert.ok(cockpit.includes('<span className="cockpit-now90-weather">{item.weatherLabel}</span>'),'90-min-Wettertext muss aus demselben Kurzfristpunkt stammen wie die Skybar.');
assert.ok(rucFetch.includes("FORECAST_REQUIRED=('T_2M','TD_2M','RELHUM_2M','PMSL','U_10M','V_10M','VMAX_10M','TOT_PREC','CLCT','CLCL'"),'RUC CLCT/CLCL müssen weiter im kanonischen Forecastkern liegen.');
assert.ok(rucFetch.includes("for param in FORECAST_REQUIRED:")&&rucFetch.includes("mode='hourly'"),'Der robuste stündliche RUC-Fallback muss erhalten bleiben.');
assert.ok(rucFetch.includes("RAPID_STATE_OPTIONAL_15=('VIS','CEILING')"),'Native 15-min-Zustandsfelder müssen auf tatsächlich hochfrequente Sicht/Ceiling-Felder begrenzt bleiben.');
assert.ok(!rucFetch.match(/RAPID_STATE_OPTIONAL_15=.*CLCT/),'CLCT darf nicht als native 15-min-Kadenz behauptet werden, solange der operative DWD-RUC-Feed nur Stundenwerte liefert.');
assert.match(pkg.version,/^0\.9\.85\.(?:7[3-9]|[89]\d|\d{3,})$/);
assert.equal(baseline.releaseVersion,pkg.version);
for(const key of ['requiredTests','regressionTests'])assert.ok(baseline[key]?.includes(self),`${self} fehlt in ${key}`);

console.log(`MID v${pkg.version}: Skybar, Wettertext und Piktogramm verwenden denselben Gesamtbewölkungszustand; RUC-CLCT bleibt ehrlich stündlich und wird für 15-min-Anzeige nur interpoliert.`);
