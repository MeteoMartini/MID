import {readFile} from 'node:fs/promises';

const [ensemble,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
 "type DwdWarningKind,type DwdWarningSignal",
 "type EnsembleHazardMarker={kind:DwdWarningKind;stageRank:number;",
 "function highestEnsembleWarningsByKind(signals:DwdWarningSignal[])",
 "const best=new Map<DwdWarningKind,DwdWarningSignal>();",
 "rank>currentRank",
 "return signals.filter(signal=>best.get(signal.kind)===signal);",
 "hazards=highestEnsembleWarningsByKind(summarizeDwdWarningsForDay(hours,x.date,elevation).filter(signal=>signal.level>=2)).map",
 "kind:signal.kind,stageRank:Number(signal.stageRank)||signal.level",
 "key={`${hazard.kind}:${hazard.stageRank}:${hazard.title}:${hazard.value??''}`}"
])need('Ensemble-Warnfilter',ensemble,token);

if(ensemble.includes(".filter(signal=>signal.level>=2).slice(0,2).map"))failures.push('Ensemble-Daten werden weiterhin vor der Warntyp-Gruppierung auf zwei Warnstufen gekürzt.');
need('Package-Test',pkg,'test:ensemble-highest-hazard-per-kind');
need('Baseline-Test',baseline,'scripts/test-ensemble-highest-hazard-per-kind-081813.mjs');

if(failures.length){console.error('Ensemble-Warnfilter-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Ensemble-Warnfilter geprüft: Diagrammmarker und Tooltip erhalten je Warntyp ausschließlich die höchste Stufe; unterschiedliche Warntypen bleiben erhalten.');
