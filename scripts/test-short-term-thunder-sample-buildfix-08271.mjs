import {readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
function versionAtLeast(value,minimum){const a=String(value).split('.').map(Number),b=String(minimum).split('.').map(Number);for(let i=0;i<Math.max(a.length,b.length,4);i++){const av=Number.isFinite(a[i])?a[i]:0,bv=Number.isFinite(b[i])?b[i]:0;if(av!==bv)return av>bv}return true}
const require=createRequire(import.meta.url);const ts=require('typescript-strada')
const [shortTerm,risk,pkgText,baselineText]=await Promise.all([
 readFile(new URL('../src/ShortTermForecast.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/detailThunderRisk.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[],need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)};
const shortSource=ts.createSourceFile('ShortTermForecast.tsx',shortTerm,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TSX),riskSource=ts.createSourceFile('detailThunderRisk.ts',risk,ts.ScriptTarget.ESNext,true,ts.ScriptKind.TS);
if(shortSource.parseDiagnostics.length)failures.push(...shortSource.parseDiagnostics.map(item=>`ShortTermForecast.tsx: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`));
if(riskSource.parseDiagnostics.length)failures.push(...riskSource.parseDiagnostics.map(item=>`detailThunderRisk.ts: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`));
let sampleType,callArgument;
function visitRisk(node){if(ts.isTypeAliasDeclaration(node)&&node.name.text==='DetailThunderRiskSample')sampleType=node.type;ts.forEachChild(node,visitRisk)}
function visitShort(node){if(ts.isCallExpression(node)&&ts.isIdentifier(node.expression)&&node.expression.text==='significantHourlyThunderRisk')callArgument=node.arguments[0];ts.forEachChild(node,visitShort)}
visitRisk(riskSource);visitShort(shortSource);
if(!sampleType||!ts.isTypeLiteralNode(sampleType))failures.push('DetailThunderRiskSample-Typ konnte nicht gelesen werden.');
if(!callArgument||!ts.isObjectLiteralExpression(callArgument))failures.push('Gewitterprobe ist kein explizites Objektliteral.');
if(sampleType&&ts.isTypeLiteralNode(sampleType)&&callArgument&&ts.isObjectLiteralExpression(callArgument)){
 const allowed=new Set(sampleType.members.filter(ts.isPropertySignature).map(member=>member.name&&ts.isIdentifier(member.name)?member.name.text:member.name?.getText(riskSource)).filter(Boolean));
 const supplied=[];
 for(const property of callArgument.properties){
  if(ts.isSpreadAssignment(property)){failures.push('Gewitterprobe darf kein vollständiges Stundenobjekt per Spread übernehmen.');continue}
  const name=property.name&&(ts.isIdentifier(property.name)||ts.isStringLiteral(property.name))?property.name.text:property.name?.getText(shortSource);
  if(name)supplied.push(name);
 }
 const unsupported=supplied.filter(name=>!allowed.has(name));if(unsupported.length)failures.push(`Nicht unterstützte Felder: ${unsupported.join(', ')}`);
 for(const required of ['code','cape','liftedIndex','convectiveInhibition','columnWaterVapour','temperature','dewPoint','humidity','precipitation','rain','showers','probability'])if(!supplied.includes(required))failures.push(`Benötigtes Feld fehlt: ${required}`);
}
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText);if(!versionAtLeast(pkg.version,'0.8.27.1'))failures.push(`Version: ${pkg.version}`);if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline: ${baseline.releaseVersion}`);need('Package-Test',pkgText,'test:short-term-thunder-sample-buildfix');need('Baseline-Test',baselineText,'scripts/test-short-term-thunder-sample-buildfix-08271.mjs');
if(failures.length){console.error('Kurzfrist-Gewitterprobe-Buildfix v0.8.27.1 fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Kurzfrist-Gewitterprobe verwendet ausschließlich den typsicheren DetailThunderRiskSample-Vertrag.');
