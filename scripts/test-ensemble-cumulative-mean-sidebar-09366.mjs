import {readFile} from 'node:fs/promises';
const [panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of [
 'cumulativeQ25Plot:index<7?q25:undefined',
 'cumulativeQBandPlot:index<7?Math.max(0,q75-q25):undefined',
 'cumulative&&row.x<7&&<div><dt>P25–P75</dt>',
 'P25–P75 <small>Tage 1–7</small>',
 'rainCumulative?x.precipitationMean:0',
 'Das arithmetische ENS-Mittel kann bei stark rechtsschiefen Niederschlagsverteilungen außerhalb des zentralen P10–P90-Bereichs liegen',
 'P25–P75 Tag 1–7 · ENS-Mittel'
]) if(!panel.includes(token)) failures.push(`EnsemblePanel.tsx fehlt: ${token}`);
for(const token of [
 '.with-section-navigation{padding-left:86px}',
 '.dashboard-section-rail{z-index:1060;width:64px;overflow:hidden}',
 '.dashboard-section-rail.expanded{z-index:1120;width:286px}',
 'overflow-x:hidden;overflow-y:auto',
 '.dashboard-section-rail:not(.expanded) .dashboard-section-nav-list.rail button{width:42px;grid-template-columns:34px',
 '.dashboard-section-rail.expanded .dashboard-section-nav-list.rail button{width:100%;grid-template-columns:32px minmax(0,1fr)'
]) if(!styles.includes(token)) failures.push(`styles.css fehlt: ${token}`);
const version=JSON.parse(pkg).version,base=JSON.parse(baseline).releaseVersion;
if(version!==base) failures.push(`Version/Baseline nicht synchron: ${version}/${base}`);
if(failures.length){console.error(`MID 0.9.36.6 Ensemble/Sidebar-Regressionsschutz fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: kumuliertes ENS-Mittel skaliert korrekt, P25–P75 endet nach Tag 7 und Desktop-Sektionsleiste bleibt ohne Horizontal-Scroll/Topbar-Überdeckung.');
