import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}
const [panel,styles,pkg,baseline]=await Promise.all([readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8'),readFile(new URL('../src/styles.css',import.meta.url),'utf8'),readFile(new URL('../package.json',import.meta.url),'utf8'),readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')]);
const failures=[];const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
for(const token of ['function EnsembleDateAxisTick(','angle=compact?-52:-38','textAnchor="end"','className="ensemble-date-axis-tick"'])need('Ensemble-Datumsachse',panel,token);
const tickCount=(panel.match(/tick=\{<EnsembleDateAxisTick/g)||[]).length;if(tickCount!==3)failures.push(`Ensemble-Datumsachse: erwartet 3 diagonale X-Achsen, gefunden ${tickCount}`);
const sharedHeightUses=(panel.match(/height=\{sharedXAxisHeight\}/g)||[]).length;if(sharedHeightUses!==2)failures.push(`Ensemble-Datumsachse: erwartet 2 direkte gemeinsame X-Achsenhöhen, gefunden ${sharedHeightUses}`);if(!panel.includes('xAxisHeight={sharedXAxisHeight}'))failures.push('Ensemble-Datumsachse: Temperaturcanvas erhält die gemeinsame X-Achsenhöhe nicht.');
if((panel.match(/sharedXAxisHeight=.*?92:102/g)||[]).length<3)failures.push('Ensemble-Datumsachse: gemeinsame responsive Höhe 92/102 fehlt.');
for(const token of ['.ensemble-date-axis-tick{','fill:var(--muted)','text-rendering:geometricPrecision'])need('Ensemble-Datumsachse CSS',styles,token);
need('Package-Test',pkg,'test:ensemble-diagonal-date-axis');need('Baseline-Test',baseline,'scripts/test-ensemble-diagonal-date-axis-08241.mjs');
const parsed=ts.createSourceFile('EnsemblePanel.tsx',panel,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);if(parsed.parseDiagnostics?.length)failures.push(`EnsemblePanel.tsx: ${parsed.parseDiagnostics.map(item=>item.messageText).join(' | ')}`);
if(failures.length){console.error('Diagonale Ensemble-Datumsachse fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Alle drei Ensemble-Datumsachsen nutzen dieselbe diagonale, responsive Tagesgeometrie.');
