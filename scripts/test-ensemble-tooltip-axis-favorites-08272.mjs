import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [app,panel,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)},forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};
for(const token of [
 'tapPointer=useRef<{id:string;pointerId:number;x:number;y:number;moved:boolean}|null>(null)',
 'onPointerUp={event=>tapEnd(event,item)}',
 'Date.now()-lastPointerSelection.current<500',
 'const pointerStart=(event:ReactPointerEvent<HTMLSpanElement>,id:string)=>{event.preventDefault()',
 'pauseForInteraction=()=>{runController?.abort()',
 "scheduling?.isInputPending?.({includeContinuous:true})"
])need('Favoritenreaktion',app,token);
forbid('Favoritenreaktion',app,'data-quick-favorite-id={item.id} draggable');
for(const token of [
 'height={exporting?270:292}',
 'tickMargin={compact?10:11} height={compact?54:58}',
 '<span className="ensemble-wind-axis-title ensemble-wind-axis-title-bottom">Vorhersagetag</span>'
])need('Windachse',panel,token);
for(const token of [
 '.compact-trend-tooltip .tooltip-meta-line>span{',
 'white-space:nowrap;',
 '.compact-trend-tooltip .tooltip-meta-block>span{',
 '.chart.wind-trend{',
 'height:auto!important;',
 '.ensemble-wind-chart-core{',
 'grid-template-rows:auto 34px;',
 '.header-favorites .favorite-bubbles>button{',
 'touch-action:pan-x;'
])need('CSS',styles,token);
const packageJson=JSON.parse(pkg),baselineJson=JSON.parse(baseline);if(packageJson.version!=='0.8.27.2')failures.push(`Version package.json: ${packageJson.version}`);if(baselineJson.releaseVersion!=='0.8.27.2')failures.push(`Baseline: ${baselineJson.releaseVersion}`);
for(const [name,text,kind] of [['App.tsx',app,ts.ScriptKind.TSX],['EnsemblePanel.tsx',panel,ts.ScriptKind.TSX]]){const source=ts.createSourceFile(name,text,ts.ScriptTarget.ESNext,true,kind);if(source.parseDiagnostics.length)failures.push(...source.parseDiagnostics.map(item=>`${name}: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`))}
if(failures.length){console.error('MID v0.8.27.2 Regression fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MID v0.8.27.2 Tooltip-, Achsen- und Favoritenregression bestanden.');
