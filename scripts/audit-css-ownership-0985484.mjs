#!/usr/bin/env node
/** MID CSS ownership diagnostic: no source writes, no lazy-loading authorization. */
import {resolve} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {loadCssCascade} from './lib/cssCascade.mjs';

const FEATURE_PREFIXES={
 current:/^(current|nowcast|hero|cockpit-short|cockpit-now90)(-|$)/,
 forecast:/^(forecast|cockpit-fourteen|cockpit-day|seven-day|fourteen|mid-forecast)(-|$)/,
 maps:/^(map|maps|synoptic|composite|unified|radar)(-|$)/,
 ensemble:/^(ensemble|ens|meteogram|cockpit-meteogram)(-|$)/,
 mountain:/^(mountain|ski|snow|winter)(-|$)/,
 settings:/^(settings|push|icloud|device|backup|pwa|system)(-|$)/,
 other_features:/^(travel|event|flight|climate|water|widget|weatherwidget|extreme|thunder)(-|$)/,
};
function context(rule){
 const result=[];let complex=false;
 for(let p=rule.parent;p&&p.type!=='root';p=p.parent){
  if(p.type!=='atrule'){complex=true;result.unshift(['nested',p.selector??p.type]);continue}
  result.unshift(['@'+p.name,p.params]);
  if(!['media','supports'].includes(p.name))complex=true;
 }
 return {key:JSON.stringify(result),complex,conditional:result.length>0};
}
function family(selector){
 const classes=[...selector.matchAll(/\.([A-Za-z_][\w-]*)/g)].map(x=>x[1]);
 const matches=Object.entries(FEATURE_PREFIXES).filter(([,re])=>classes.some(c=>re.test(c))).map(([name])=>name);
 return matches.length===1?matches[0]:null;
}
/** entries from MID's canonical loadCssCascade(), or a synthetic PostCSS fixture. */
export function analyzeCssOwnership(entries){
 if(!Array.isArray(entries)||!entries.length||entries.some(e=>typeof e.file!=='string'||!e.tree||typeof e.original!=='string'))
  throw Error('Invalid canonical CSS entry set');
 const seen=new Map(),sources=[],collisions=[];
 let totalRules=0,totalDeclarations=0,totalImportant=0,totalComplex=0;
 for(const entry of entries){
  const row={file:entry.file,sourceBytes:Buffer.byteLength(entry.original),rules:0,declarations:0,important:0,
   complexRules:0,conditionalRules:0,unassignedOrSharedRules:0,possibleOwners:{},laterExactMatches:0,
   laterSameValue:0,laterDifferentValue:0,laterImportanceDifferences:0};
  entry.tree.walkRules(rule=>{
   const ctx=context(rule),owner=family(rule.selector);
   row.rules++;totalRules++;
   if(ctx.complex){row.complexRules++;totalComplex++}
   if(ctx.conditional)row.conditionalRules++;
   if(owner)row.possibleOwners[owner]=(row.possibleOwners[owner]??0)+1;
   else row.unassignedOrSharedRules++;
   for(const declaration of rule.nodes??[]){
    if(declaration.type!=='decl')continue;
    row.declarations++;totalDeclarations++;
    if(declaration.important){row.important++;totalImportant++}
    const key=JSON.stringify([ctx.key,rule.selector,declaration.prop.toLowerCase()]);
    const prev=seen.get(key);
    if(prev&&prev.file!==entry.file){
     prev.row.laterExactMatches++;
     const same=prev.value===declaration.value&&prev.important===Boolean(declaration.important);
     prev.row[same?'laterSameValue':'laterDifferentValue']++;
     if(prev.important!==Boolean(declaration.important))prev.row.laterImportanceDifferences++;
     if(collisions.length<60)collisions.push({previousFile:prev.file,laterFile:entry.file,selector:rule.selector,
      property:declaration.prop,atRuleContext:ctx.key,previousValue:prev.value.slice(0,120),
      laterValue:declaration.value.slice(0,120),sameValueAndPriority:same,importanceDiffers:prev.important!==Boolean(declaration.important)});
    }
    seen.set(key,{file:entry.file,row,value:declaration.value,important:Boolean(declaration.important)});
   }
  });
  sources.push(row);
 }
 const sourceBytes=sources.reduce((sum,s)=>sum+s.sourceBytes,0),largest=[...sources].sort((a,b)=>b.sourceBytes-a.sourceBytes).slice(0,4);
 return {schema:'mid.css.ownership.diagnostic.v1',status:'DIAGNOSTIC_ONLY_NO_CSS_MOVE_APPROVAL',
  methodology:'Exact full selector/property/at-rule context collisions across distinct canonical CSS sources; lower bound only, not calculated-style precedence.',
  summary:{sourceCount:sources.length,sourceBytes,rules:totalRules,declarations:totalDeclarations,importantDeclarations:totalImportant,
   complexRules:totalComplex,largestFourBytes:largest.reduce((sum,s)=>sum+s.sourceBytes,0)},
  largestFour:largest.map(({file,sourceBytes})=>({file,sourceBytes})),sources,collisionExamples:collisions,
  controls:{sourceWrites:false,cssOrderingUnchanged:true,atRuleDifferencesNotAssumedEquivalent:true,
   classPrefixDoesNotProveReactOwnership:true,visualBrowserParityNotChecked:true,WebKitVoiceOverNotChecked:true}};
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length>3)throw Error('Usage: node scripts/audit-css-ownership-0985484.mjs [verified MID checkout]');
 const project=pathToFileURL(resolve(process.argv[2]??'.')+'/');
 console.log(JSON.stringify(analyzeCssOwnership(loadCssCascade(project)),null,2));
}
