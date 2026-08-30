import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const [panel,frame,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/EnsembleChartFrame.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(a,t,x)=>{if(!t.includes(x))failures.push(`${a}: ${x}`)},forbid=(a,t,x)=>{if(t.includes(x))failures.push(`${a}: unerlaubt ${x}`)};
for(const token of ['function EnsembleTemperatureCanvas','function EnsembleTemperatureWeatherOverlay','function useTemperatureAxisCenters','function resolvedEnsembleDayCenters','cellRight=index===dayCount-1?bandRight:(centerX+centers[index+1])/2','layer="weather"','layer="hazards"'])need('Wetterband',panel,token);
for(const token of ['useCartesianScale','ZIndexLayer','accessibilityLayer','<ReferenceArea','<ReferenceDot'])forbid('Wetterband',panel,token);
for(const token of ['touch-action:pan-y;','.ensemble-temperature-canvas{position:relative;','.ensemble-temperature-weather-overlay{position:absolute;'])need('Darstellung/Performance',styles,token);
if(styles.includes('.ensemble-chart-export{content-visibility:auto'))failures.push('Unerlaubtes Ensemble-content-visibility.');
for(const token of ['ResizeObserver(entries=>','entry.contentRect.width','cloneElement(children,{width,height,responsive:false'])need('Resize-Performance',frame,token);
forbid('Resize-Performance',frame,'entry.contentRect.height');forbid('Resize-Performance',frame,"window.addEventListener('orientationchange'");
const source=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(i=>`Parser: ${i.messageText}`));
const p=JSON.parse(pkg),b=JSON.parse(baseline);if(!p.scripts?.['test:ensemble-visual-scroll'])failures.push('Package-Testskript fehlt.');if(!b.regressionTests?.includes('scripts/test-ensemble-visual-scroll-regression-082610.mjs'))failures.push('Baseline-Regression fehlt.');
if(failures.length){console.error('Ensemble-Darstellungs-/Scrollprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Achsengebundenes zusammenhängendes Ensemble-Wetterband und scrollschonender Liveframe geprüft.');
