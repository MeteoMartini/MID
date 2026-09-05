import {readFileSync} from 'node:fs';

const assessment=readFileSync(new URL('../src/ensembleAssessment.ts',import.meta.url),'utf8');
const multi=readFileSync(new URL('./test-ensemble-multiparameter-097865.mjs',import.meta.url),'utf8');
const failures=[];
const need=(condition,message)=>{if(!condition)failures.push(message)};

need(!assessment.includes("if(dataQuality==='poor')score=Math.min(score,68)"),'Alter harter Mittel-Cap für schwache Datenbasis ist noch aktiv.');
need(assessment.includes("if(dataQuality==='poor')score-=4;"),'Weiche Reduktion für schwache Datenbasis fehlt.');
need(assessment.includes("if(dataQuality==='limited')score-=1.5;"),'Weiche Reduktion für eingeschränkte Datenbasis fehlt.');
need(assessment.includes("if(dataQuality==='missing')return null;"),'Nicht ausreichende Datenbasis muss weiterhin fail-closed bleiben.');
need(multi.includes("noRainAssessment.agreement,'high'"),'Mehrparameterregression erwartet für zwei stark übereinstimmende Kernparameter noch nicht hohe meteorologische Konfidenz.');
need(multi.includes("unknownRun.agreement,'high'"),'Lauf-Frische wird im Mehrparametervertrag weiterhin fälschlich als meteorologische Mittel-Konfidenz behandelt.');
need(multi.includes("deficient.agreement,'high'"),'Member-Abdeckung wird im Mehrparametervertrag weiterhin fälschlich als meteorologische Mittel-Konfidenz behandelt.');
need(multi.includes("noRainAssessment.dataQuality,'poor'"),'Schwache Datenbasis muss trotz hoher meteorologischer Konfidenz separat sichtbar bleiben.');
need(multi.includes("assert.equal(assess(noRainWind).agreement,'unknown'"),'Bei weniger als zwei Kernparametern muss die Tageskonfidenz weiterhin nicht bewertbar bleiben.');

if(failures.length){
 console.error('test-ensemble-data-quality-separation-097869 failed');
 for(const failure of failures)console.error(` - ${failure}`);
 process.exit(1);
}
console.log('MID v0.9.78.69: meteorologische Konfidenz und Datenqualität bleiben getrennt; zwei starke Kernparameter können hoch bleiben, fehlende Kernbasis bleibt fail-closed.');
