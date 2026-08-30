import {readFile,mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const [helper,app,pkg]=await Promise.all([
 readFile(new URL('../src/currentConditions.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8')
]);
const failures=[];
for(const token of ["import {hyperlocalSkyCondition} from './currentConditions';","currentPrecip.type==='none'?hyperlocalSkyCondition({","cloudObserved:fieldFresh('cloudCover')&&Number.isFinite(st?.cloudCover)","if(localSky){currentWeatherCode=localSky.code;currentWeatherLabel=localSky.label}"]){if(!app.includes(token))failures.push(`App-Anbindung fehlt: ${token}`)}
if(!pkg.includes('test:current-hyperlocal-sky'))failures.push('Package-Test fehlt.');
const dir=await mkdtemp(join(tmpdir(),'mid-083311-'));
try{
 const out=ts.transpileModule(helper,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022},fileName:'currentConditions.ts',reportDiagnostics:true});
 if(out.diagnostics?.some(item=>item.category===ts.DiagnosticCategory.Error))failures.push(...out.diagnostics.filter(item=>item.category===ts.DiagnosticCategory.Error).map(item=>`Syntax: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`));
 const file=join(dir,'currentConditions.mjs');await writeFile(file,out.outputText);const {hyperlocalSkyCondition}=await import(`${pathToFileURL(file).href}?v=${Date.now()}`);
 const strong=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:7600,humidity:41,temperature:26,cloudObserved:true,visibilityObserved:true});
 if(strong?.code!==3||strong?.label!=='Stark bewölkt'||strong?.cloudOktas!==7)failures.push(`7/8 wird nicht konsistent als stark bewölkt klassifiziert: ${JSON.stringify(strong)}`);
 const overcast=hyperlocalSkyCondition({fallbackCode:2,cloudCover:100,visibility:7600,humidity:80,temperature:20,cloudObserved:true,visibilityObserved:true});
 if(overcast?.label!=='Bedeckt'||overcast?.cloudOktas!==8)failures.push(`8/8 wird nicht als bedeckt klassifiziert: ${JSON.stringify(overcast)}`);
 const fog=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:700,humidity:96,temperature:4,cloudObserved:true,visibilityObserved:true});
 if(fog?.code!==45||fog?.label!=='Nebel')failures.push(`Lokaler Nebel übersteuert Bewölkung nicht korrekt: ${JSON.stringify(fog)}`);
 const fallback=hyperlocalSkyCondition({fallbackCode:3,cloudCover:87.5,visibility:7600,humidity:41,temperature:26,cloudObserved:false,visibilityObserved:false});
 if(fallback!==undefined)failures.push('Ohne frische lokale Beobachtung wird Best Match unerwartet überschrieben.');
}finally{await rm(dir,{recursive:true,force:true})}
if(failures.length){console.error('Hyperlokale aktuelle Himmelszustandsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Aktueller Himmelszustand geprüft: 7/8 = stark bewölkt, 8/8 = bedeckt; frische lokale Bewölkung und Sicht steuern Hauptkarte und Detailkarte konsistent.');
