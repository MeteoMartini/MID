import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url),ts=require('typescript');
const [thunder,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/thunderstorm.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

need('Buildfix',thunder,"function threatHeadline(nearNow:boolean,atSite:boolean,approaching:boolean,movingAway:boolean,withLightning:boolean)");
need('Buildfix',thunder,'legacyHeadline=threatHeadline(nearNow,atSite,approaching,movingAway,withLightning)');
if(/function threatHeadline\(\s*_?cell\b/.test(thunder))failures.push('threatHeadline enthält weiterhin den ungenutzten Parameter cell.');
if(/threatHeadline\(cell,nearNow/.test(thunder))failures.push('Der alte Aufruf mit cell ist weiterhin vorhanden.');
need('Package-Test',pkg,'test:thunder-buildfix');
need('Baseline-Test',baseline,'scripts/test-thunder-unused-parameter-buildfix-081911.mjs');

const source=ts.createSourceFile('thunderstorm.ts',thunder,ts.ScriptTarget.ES2022,true,ts.ScriptKind.TS);
if(source.parseDiagnostics.length)failures.push('thunderstorm.ts enthält Syntaxfehler.');
let helper=null;
source.forEachChild(node=>{if(ts.isFunctionDeclaration(node)&&node.name?.text==='threatHeadline')helper=node});
if(!helper)failures.push('threatHeadline wurde nicht gefunden.');
else{
 const names=helper.parameters.map(parameter=>parameter.name.getText(source));
 if(names.join(',')!=='nearNow,atSite,approaching,movingAway,withLightning')failures.push(`Unerwartete Parameter: ${names.join(',')}`);
}

if(failures.length){console.error('Gewitter-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Zellbezeichnungs-Buildfix geprüft: ungenutzter cell-Parameter bleibt entfernt; der Blitzstatus steuert Gewitter-/Schauerzelle.');
