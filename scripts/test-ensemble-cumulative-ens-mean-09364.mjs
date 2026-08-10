import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const [panel,styles,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('src/EnsemblePanel.tsx',root),'utf8'),
 readFile(new URL('src/styles.css',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
need('Tooltip',panel,'{(cumulative||advancedMode)&&<div><dt>ENS-Mittel</dt>');
need('Legende',panel,'<i className="line cumulative-mean"/>ENS-Mittel');
need('Diagramm',panel,'dataKey="precipitationMean" name="precipitationMean" stroke="#71cbe8" strokeWidth={2.1}');
need('Export',panel,'Kumuliert · Best Match · P10–P90 · P25–P75 · ENS-Mittel');
need('Styles',styles,'.rain-legend i.line.cumulative-mean');
if(panel.includes("{advancedMode&&<Line yAxisId=\"mm\" type=\"monotone\" dataKey=\"precipitationMean\""))failures.push('ENS-Mittel ist im kumulierten Diagramm weiterhin an den erweiterten Modus gekoppelt.');
if(pkg.version!==baseline.releaseVersion)failures.push(`Version/Baseline nicht synchron: ${pkg.version}/${baseline.releaseVersion}`);
if(!baseline.regressionTests?.includes('scripts/test-ensemble-cumulative-ens-mean-09364.mjs'))failures.push('Neue ENS-Mittel-Regression fehlt in MID_BASELINE.json.');
if(failures.length){console.error(`MID kumuliertes ENS-Mittel fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: ENS-Mittel ist im kumulierten 14-Tage-Niederschlagsdiagramm in Standard- und erweitertem Modus sichtbar.');
