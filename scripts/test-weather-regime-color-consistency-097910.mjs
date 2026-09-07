import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";

const root=new URL("../",import.meta.url);
const read=path=>readFile(new URL(path,root),"utf8");
const [foundation,ensembleCss,modernCss,builtCss,pkgRaw,baselineRaw,contract]=await Promise.all([
 read("src/styles-src/00-foundation.css"),
 read("src/styles-src/20-ensemble-composite.css"),
 read("src/styles-src/30-modern.css"),
 read("src/styles.css"),
 read("package.json"),
 read("MID_BASELINE.json"),
 read("MID_WEATHER_REGIME_COLOR_CONTRACT.md")
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),test="scripts/test-weather-regime-color-consistency-097910.mjs";

for(const token of ["--weather-regime-wet:","--weather-regime-showery:","--weather-regime-sunny:","--weather-regime-windy:","--weather-regime-warm:","--weather-regime-quiet:"])assert.ok(foundation.includes(token),`Root-Farbvariable fehlt: ${token}`);
for(const css of [ensembleCss,modernCss,builtCss]){
 assert.ok(css.includes('.cockpit-day,.cockpit-fourteen-card{--mid-weather-regime-accent:var(--weather-regime-quiet)}'),'Zentrale Regime-Akzentableitung fehlt.');
 for(const regime of ["wet","showery","sunny","windy","warm","quiet"])assert.ok(css.includes(`.cockpit-day.regime-${regime},.cockpit-fourteen-card.regime-${regime}{--mid-weather-regime-accent:var(--weather-regime-${regime})}`),`Regime ${regime} ist nicht zentral verdrahtet.`);
}
for(const css of [ensembleCss,builtCss]){
 assert.ok(css.includes('.cockpit-day.regime-wet,.cockpit-day.regime-showery,.cockpit-day.regime-sunny,.cockpit-day.regime-windy,.cockpit-day.regime-warm,.cockpit-day.regime-quiet{background:color-mix(in srgb,var(--mid-weather-regime-accent,var(--weather-regime-quiet)) 14%,var(--surface));box-shadow:inset 0 3px 0 var(--mid-weather-regime-accent,var(--weather-regime-quiet))}'),'Mobile Kartenhintergründe müssen denselben Regime-Akzent inklusive showery nutzen.');
 assert.ok(css.includes('.cockpit-mini-ribbon.seven i.showery{height:94%;background:var(--weather-regime-showery)}'),'Showery fehlt im 7-Tage-Mini-Ribbon.');
 assert.ok(css.includes('.cockpit-mini-ribbon.short.informative>span.showery{border-color:color-mix(in srgb,var(--weather-regime-showery) 34%,var(--border));background:color-mix(in srgb,var(--weather-regime-showery) 8%,var(--surface))}'),'Showery fehlt in der informativen Kurzfrist-Ribbon-Färbung.');
 assert.ok(css.includes('.cockpit-seven-legend .showery::before{background:var(--weather-regime-showery)}'),'Showery fehlt in der 7-Tage-Legende.');
}
assert.ok(contract.includes('--mid-weather-regime-accent')&&contract.includes('showery'),'Vertrag dokumentiert zentrale Ableitung oder Showery-Guard nicht.');
assert.equal(baseline.releaseVersion,pkg.version,'Package/Baseline müssen synchron sein.');
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','activeRegressionSuite'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes(test),'Regime-Farbtest fehlt in requiredFiles.');
assert.ok(baseline.requiredFiles?.includes('MID_WEATHER_REGIME_COLOR_CONTRACT.md'),'Regime-Farbvertrag fehlt in requiredFiles.');

console.log(`MID v${pkg.version}: Wetterregime-Farben sind appweit zentralisiert und inklusive Schauer-Regime abgesichert.`);
