#!/usr/bin/env node
import {spawnSync} from 'node:child_process';
import {basename, delimiter, join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {parseArgs} from 'node:util';

const SHA=/^[a-f0-9]{40}$/;
const MAP=/^src\/(?:[^/]*(?:Map|Raster|Radar|Synoptic|SeasonalComposite|ScalarAnnotations)[^/]*|styles-src\/[^/]*(?:map|radar)[^/]*)\.(?:[cm]?[jt]sx?|css)$/i;
const MAP_TEST=/^scripts\/(?:test|verify)-[^/]*(?:map|radar)[^/]*\.mjs$/i;
const WORKFLOW=/^(?:\.github\/workflows\/|ci\/github\/workflows\/|scripts\/sync-github-workflows\.mjs$)/;
const RELEASE=/^(?:tools\/ci\/|MID_(?:BASELINE\.json|SOURCE_OF_TRUTH\.md)$|package(?:-lock)?\.json$)/;

export function planDraftRegression(paths, directMatches=[]){
 const tests=new Set(directMatches);
 const map=paths.some(path=>MAP.test(path)||MAP_TEST.test(path));
 if(map){
  tests.add('scripts/test-adaptive-native-maps-0985141.mjs');
  tests.add('scripts/test-unified-map-layers-0985167.mjs');
 }
 if(paths.some(path=>WORKFLOW.test(path))){
  tests.add('scripts/test-github-workflow-bootstrap-08263.mjs');
  tests.add('scripts/test-github-actions-runtime.mjs');
 }
 if(paths.some(path=>RELEASE.test(path)))tests.add('scripts/test-versioning.mjs');
 const selected=[...tests].sort();
 // Some JS regressions call native Python GRIB/ecCodes fixtures. The Draft
 // job must prepare those exact offline dependencies before executing them;
 // a missing decoder is not a weather-code regression or an authorized skip.
 const requiresScientificPython=selected.some(file=>
  file==='scripts/test-ruc-composites-horizons-0985308.mjs'||
  file==='scripts/test-ruc-map-pipeline-0985305.mjs');
 return {
  schema:1,selected,requiresScientificPython,releaseAuthorized:false,
  browserPilot:map?{
   file:'scripts/verify-unified-map-browser-0985167.mjs',
   native:'scripts/verify-native-model-browser-0985141.mjs',
   cases:'390/light/next,320/light/classic,844/light/next'
  }:null,
  coverage:selected.length?'TARGETED_ONLY':'MANUAL_SELECTION_REQUIRED'
 };
}

function git(repo,args,{input,allowNoMatch=false}={}){
 const result=spawnSync('git',['-C',repo,...args],{
  input,encoding:'utf8',maxBuffer:16*1024*1024
 });
 if(result.error||result.status!==0&&!(allowNoMatch&&result.status===1)){
  // Expose the failed Git operation without logging repository contents or credentials.
  const operation=args.slice(0,2).join(' '),status=result.status??'spawn-error';
  const checkOutput=args[0]==='diff'&&args[1]==='--check'?result.stdout.trim().slice(0,1800):'';
  throw Error('Git '+operation+' failed (exit '+status+'): '+(result.error?.message||result.stderr.trim()||checkOutput||'no diagnostic output'));
 }
 return result.stdout;
}

export function inspectDraftRegression(repo,base,head){
 if(!SHA.test(base||'')||!SHA.test(head||''))throw Error('Provide full base and head SHAs');
 for(const sha of [base,head]){
  if(git(repo,['rev-parse','--verify',sha+'^{commit}']).trim()!==sha)
   throw Error('Expected commit SHA could not be verified');
 }
 // Disable rename detection to include both paths of a rename.
 const paths=git(repo,['diff','--name-only','-z','--no-renames',base,head,'--']).split('\0').filter(Boolean);
 const baseline=JSON.parse(git(repo,['show',head+':MID_BASELINE.json']));
 const registered=new Set(baseline.requiredRegressionTests);
 const terms=paths.filter(path=>/^(?:src|tools\/ruc|tools\/ci)\//.test(path)&&
   !/[\r\n]/.test(path)).flatMap(path=>[path,basename(path)]);
 const matches=terms.length?git(repo,['grep','-l','-z','-F','-f','-',head,'--','scripts/test-*.mjs'],{
  input:[...new Set(terms)].join('\n')+'\n',allowNoMatch:true
 }).split('\0').filter(Boolean).map(path=>path.slice(head.length+1)):[];
 const plan=planDraftRegression(paths,[...matches,...paths.filter(path=>registered.has(path))]);
 const files=new Set(git(repo,['ls-tree','-r','--name-only','-z',head,'--','scripts']).split('\0'));
 const unavailable=plan.selected.filter(file=>!registered.has(file)||!files.has(file));
 if(plan.browserPilot)for(const file of [plan.browserPilot.file,plan.browserPilot.native]){
  if(!files.has(file))unavailable.push(file);
 }
 const pythonPaths=paths.filter(file=>file.startsWith('tools/ruc/')&&file.endsWith('.py'));
 const presentPython=pythonPaths.length?new Set(git(repo,['ls-tree','-r','--name-only','-z',head,'--','tools/ruc']).split('\0')):new Set();
 return {base,head,changedPaths:paths.length,...plan,unavailable,
  pythonFiles:pythonPaths.filter(file=>presentPython.has(file))};
}

function runPlan(repo,plan){
 if(plan.unavailable.length)throw Error('Resolve preflight coverage before running');
 if(git(repo,['rev-parse','HEAD']).trim()!==plan.head||
    git(repo,['status','--porcelain','--untracked-files=normal']).trim())
  throw Error('Use a clean checkout of the exact candidate SHA');
 const env={...process.env,PATH:[join(repo,'node_modules','.bin'),process.env.PATH].join(delimiter),
  GITHUB_ACTIONS:'false',CI:'false',MID_BROWSER_QA:'0'};
 const run=(command,args,extra={})=>{
  console.error('MID targeted regression: '+args.join(' '));
  const result=spawnSync(command,args,{cwd:repo,env:{...env,...extra},
   stdio:['ignore',2,2],timeout:8*60*1000});
  if(result.error||result.status!==0)throw Error('Preflight failed: '+args.join(' ')+
   ' ('+(result.error?.code||result.signal||result.status)+')');
 };
 git(repo,['diff','--check',plan.base,plan.head,'--']);
 if(plan.pythonFiles.length)run('python3',['-c',
  'import ast, pathlib, sys; [ast.parse(pathlib.Path(p).read_bytes(), filename=p) for p in sys.argv[1:]]',
  ...plan.pythonFiles]);
 for(const file of plan.selected)run(process.execPath,[file]);
 if(plan.browserPilot){
  run('npm',['run','verify:vite']);
  run(process.execPath,[plan.browserPilot.native]);
  run(process.execPath,[plan.browserPilot.file],{MID_MAP_QA_PILOT_CASE:plan.browserPilot.cases});
 }
}

if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 try{
  const {values}=parseArgs({options:{repo:{type:'string',default:process.cwd()},
   base:{type:'string'},head:{type:'string'},run:{type:'boolean',default:false}}});
  const repo=git(values.repo,['rev-parse','--show-toplevel']).trim();
  const plan=inspectDraftRegression(repo,values.base,values.head);
  console.log(JSON.stringify(plan,null,2));
  if(plan.unavailable.length)throw Error('Candidate regression inventory is incomplete');
  if(values.run){
   runPlan(repo,plan);
   console.error(plan.selected.length||plan.pythonFiles.length?
    'Targeted preflight passed; full Source Gate and Installer are still required.':
    'Diff check passed; no targeted regression inferred. Use domain-specific QA.');
  }
 }catch(error){console.error(error.message);process.exitCode=1}
}
