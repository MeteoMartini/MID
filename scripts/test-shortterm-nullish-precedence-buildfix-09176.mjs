import {readFile} from 'node:fs/promises';

let ts;
try{
  ({default:ts}=await import('typescript'));
}catch(localImportError){
  try{
    ({default:ts}=await import('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript/lib/typescript.js'));
  }catch(fallbackImportError){
    console.error('TS5076-Buildfix konnte TypeScript weder aus den Projektabhängigkeiten noch aus dem lokalen CAAS-Fallback laden.');
    console.error(localImportError);
    console.error(fallbackImportError);
    process.exit(1);
  }
}

const source=await readFile(new URL('../src/ForecastCockpit.tsx',import.meta.url),'utf8');
const failures=[];

if(source.includes('chartTickValues[1]??chartTickValues[0]||0'))failures.push('ungültige Mischung von ?? und || weiterhin vorhanden');
if(source.includes('chartTickValues[1]??chartTickValues[0]??0'))failures.push('alte fragile Inline-Fallback-Kette weiterhin vorhanden');
if(!source.includes('chartFirstTick=chartTickValues[0]??0'))failures.push('expliziter erster Tick-Fallback fehlt');
if(!source.includes('chartSecondTick=chartTickValues[1]??chartFirstTick'))failures.push('expliziter zweiter Tick-Fallback fehlt');
if(!source.includes('chartTickStepValue=Math.abs(chartFirstTick-chartSecondTick)||shortTermTickStep(chartTempSpan)'))failures.push('eindeutige Tick-Schritt-Berechnung fehlt');

const result=ts.transpileModule(source,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true,fileName:'src/ForecastCockpit.tsx'});
const diagnostics=(result.diagnostics??[]).filter(item=>item.category===ts.DiagnosticCategory.Error);
for(const diagnostic of diagnostics)failures.push(`TS${diagnostic.code}: ${ts.flattenDiagnosticMessageText(diagnostic.messageText,' ')}`);

if(failures.length){
  console.error('TS5076-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('TS5076-Buildfix für Kurzfrist-Meteogramm portabel und ohne fragile Operatorverkettung geprüft.');
