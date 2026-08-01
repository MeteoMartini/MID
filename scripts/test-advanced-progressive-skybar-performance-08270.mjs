import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [app,ensemble,enhancer,styles,pkgText,baselineText]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/v078.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[],need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)},forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: veraltet ${token}`)};
for(const token of ['function detailSkyBarSample(hour:Hour)','function detailSkyBarSegments(hours:Hour[]','detailSkyBarSegments(p,left,right,W,skyBarY)','data-mid-skybar="react"','data-mid-sky-legend="react"'])need('Tagesdetail-Skybar',app,token);
for(const token of ['__MID_FORECAST__','enhanceSkyBars','mid:forecast-updated','svg.dataset.skybarY','svg.viewBox.baseVal'])forbid('Imperative Skybar',enhancer,token);
need('Observer-Budget',enhancer,"const ENHANCEMENT_SELECTOR='.trend-legend,.rain-legend,.widget-controls,.weatherwidget,.brand-version,.official-warnings.unavailable,.app>footer'");
for(const token of ['ENSEMBLE_ADVANCED_DISCLOSURE_PREFIX','storedAdvancedDisclosure(\'change-radar\')','storedAdvancedDisclosure(\'scenario-clusters\')','advancedMode&&changeRadarEnabled&&<ModelRunChangeRadar','advancedMode&&<EnsembleScenarioClusters scenarios={scenarios} open={scenarioOpen}','aria-expanded={open}','ensemble-advanced-toggle'])need('Erweiterte Offenlegung',ensemble,token);
for(const token of ['<ModelRunDetails runs={runs}/>','<div className="chips">','<div className="ens-summary">','<ConsistencyControl date={x.date}','advancedMode&&showQuartiles','advancedMode&&showEnsMean','advancedMode&&showClimatology'])need('Technische Inhalte im erweiterten Modus',ensemble,token);
for(const token of ['function EnsembleForecastCompass','MID Prognose-Kompass','Orientierung ohne Modelljargon','const d=useMemo<TrendRow[]>','hoursByDate=new Map<string,Hour[]>','requestIdleCallback','setStyle(current=>current.left===next.left'])need('Prognose-Kompass/Performance',ensemble,token);
for(const token of ['.ensemble-advanced-toggle{','.ensemble-forecast-compass{','content-visibility:auto','contain-intrinsic-size:auto 320px'])need('Darstellung/Rendering-Budget',styles,token);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);if(!/^0\.8\.(?:27\.\d+|28\.\d+|29\.\d+|30\.\d+)$/.test(pkg.version))failures.push(`Version: package.json ${pkg.version}`);if(baseline.releaseVersion!==pkg.version)failures.push(`Version: Baseline ${baseline.releaseVersion} statt ${pkg.version}`);
for(const [name,source,kind] of [['App.tsx',app,ts.ScriptKind.TSX],['EnsemblePanel.tsx',ensemble,ts.ScriptKind.TSX],['v078.ts',enhancer,ts.ScriptKind.TS]]){const file=ts.createSourceFile(name,source,ts.ScriptTarget.ESNext,true,kind);if(file.parseDiagnostics.length)failures.push(...file.parseDiagnostics.map(item=>`${name}: ${item.messageText}`))}
if(failures.length){console.error('Progressive-Offenlegung/Skybar/Performance v0.8.27.0 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Erweiterter Modus, einklappbare Analysebereiche, reaktive Tagesdetail-Skybar, Prognose-Kompass und Rendering-Budget geprüft.');
