// Read-only MID phase timings. Phases are diagnostic, NOT release gates.
// Every duration is seconds; missing timestamps are null, never zero.
// Parallel jobs are unioned for WALL time and summed for RUNNER work.
const PHASES=Object.freeze(['queue','setup','npm','build','core','heavy','bot','package','worker','pages','stable']);
const JOB_PATTERNS=Object.freeze({
 core:/^(?:Source-Kern vollständig prüfen|Core-Regression ·|Release-Core(?:,| |-))/,
 heavy:/^(?:Heavy-Regression ·|Release-Heavy ·)/,
 bot:/^(?:PR mergen, Release-ZIP erzeugen und Installer starten|Bewährten MID-Installer explizit starten)$/,
 package:/^(?:Release-ZIP prüfen und immutable Snapshot vorbereiten|Vollständig geprüften Release sammeln und committen)$/,
 worker:/^Geprüften MID-Worker sicher automatisch veröffentlichen$/,
 pages:/^(?:GitHub-Pages-Artefakt parallel vorbereiten|MID auf GitHub Pages veröffentlichen · Versuch [1-9]\d*)$/,
 stable:/^Erfolgreichen Pages-\/Worker-Release finalisieren$/
});
const STEP_PATTERNS=Object.freeze({
 setup:/^(?:Set up job|Node\.js \d+|Node\.js 22|Qualifizierte Node-Version|Verpflichtende Browserlaufzeiten separat vorbereiten|Python .*einrichten|Setup (?:Node|Python))/i,
 npm:/^(?:Abhängigkeiten reproduzierbar installieren|npm ci(?: |$)|(?:npm-|NPM-)?Abhängigkeiten .*installieren)/i,
 build:/^(?:SHA-identischen Produktionsbuild|Unabhängige Installation und Buildinventur|Produktionsbuild|npm run build(?: |$)|Web-Produktionsbuild)/i
});
const stamp=value=>{
 if(typeof value!=='string'||!value||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(value))return null;
 const num=Date.parse(value);
 return Number.isFinite(num)?num:null;
};
const percentile=(values,p)=>{
 const x=values.filter(Number.isFinite).sort((a,b)=>a-b);
 return x.length?x[Math.max(0,Math.ceil(x.length*p)-1)]:null;
};
const empty=()=>({observed:0,missing:0,wallSeconds:null,spanSeconds:null,runnerSeconds:null});
const windows=intervals=>{
 const list=intervals.slice().sort((a,b)=>a.start-b.start);
 let begin=null,end=null,union=0;
 for(const v of list){
  if(begin===null){begin=v.start;end=v.end;}
  else if(v.start>end){union+=end-begin;begin=v.start;end=v.end;}
  else end=Math.max(end,v.end);
 }
 if(begin!==null)union+=end-begin;
 return {wallSeconds:Math.round(union/1000),
   spanSeconds:list.length?Math.round((Math.max(...list.map(v=>v.end))-list[0].start)/1000):null,
   runnerSeconds:Math.round(list.reduce((sum,v)=>sum+(v.end-v.start),0)/1000)};
};
const records=(run,fromSteps)=>{
 if(!run||!Array.isArray(run.jobs))throw Error('Invalid timing run');
 if(run.previousAttemptJobs!==undefined&&!Array.isArray(run.previousAttemptJobs))
  throw Error('Invalid previous attempt jobs');
 const seen=new Set(),out=[];
 for(const job of [...run.jobs,...(run.previousAttemptJobs||[])]){
  if(!job||typeof job.name!=='string')throw Error('Untrusted timing job');
  if(job.conclusion==='skipped')continue;
  const entries=fromSteps?(Array.isArray(job.steps)?job.steps:[]):[job];
  for(const entry of entries){
   if(!entry||typeof entry.name!=='string')throw Error('Untrusted timing step');
   if(entry.conclusion==='skipped')continue;
   const key=JSON.stringify([job.name,job.started_at,job.completed_at,entry.name,
      entry.started_at,entry.completed_at]);
   if(seen.has(key))continue;
   seen.add(key);
   out.push({name:entry.name,start:stamp(entry.started_at),end:stamp(entry.completed_at)});
  }
 }
 return out;
};
function summarizeSelected(rows,pattern){
 const relevant=rows.filter(row=>pattern.test(row.name));
 if(!relevant.length)return empty();
 const missing=relevant.filter(x=>x.start===null||x.end===null||x.end<x.start).length;
 if(missing)return {observed:relevant.length,missing,...{wallSeconds:null,spanSeconds:null,runnerSeconds:null}};
 return {observed:relevant.length,missing:0,...windows(relevant)};
}
export function analyzeRunPhases(run){
 const jobs=records(run,false),steps=records(run,true),phases={};
 for(const phase of PHASES){
  if(phase==='queue'){
   const created=stamp(run.created_at);
   const starts=jobs.filter(j=>j.start!==null).map(j=>j.start);
   const first=starts.length?Math.min(...starts):null;
   const valid=created!==null&&first!==null&&first>=created;
   phases.queue={observed:valid?1:0,missing:valid?0:1,
      wallSeconds:valid?Math.round((first-created)/1000):null,
      spanSeconds:valid?Math.round((first-created)/1000):null,
      runnerSeconds:null};
  }else{
   const pattern=JOB_PATTERNS[phase]||STEP_PATTERNS[phase];
   phases[phase]=summarizeSelected(JOB_PATTERNS[phase]?jobs:steps,pattern);
  }
 }
 return {runId:run.id??null,conclusion:run.conclusion??null,headSha:run.head_sha??null,phases};
}
export function analyzePhaseCohort(runs){
 if(!Array.isArray(runs))throw Error('Invalid phase cohort');
 const observations=runs.map(analyzeRunPhases),summary={};
 for(const phase of PHASES){
  const accepted=observations.filter(o=>o.conclusion==='success');
  const measured=accepted.map(o=>o.phases[phase]).filter(p=>p.observed>0&&p.missing===0);
  const incomplete=accepted.filter(o=>o.phases[phase].missing>0).length;
  const absent=accepted.filter(o=>o.phases[phase].observed===0&&o.phases[phase].missing===0).length;
  summary[phase]={successfulRuns:accepted.length,measuredRuns:measured.length,
   incompleteRuns:incomplete,absentRuns:absent,
   p50WallSeconds:percentile(measured.map(p=>p.wallSeconds),.5),
   p95WallSeconds:percentile(measured.map(p=>p.wallSeconds),.95),
   p50RunnerSeconds:percentile(measured.map(p=>p.runnerSeconds),.5),
   p95RunnerSeconds:percentile(measured.map(p=>p.runnerSeconds),.95)};
 }
 return {schema:'mid.cicd-stages.v1',releaseAuthorized:false,reuseAuthorized:false,
  observations,summary};
}
const fmt=v=>v===null?'n/a':(v/60).toFixed(2)+' min';
export function renderPhaseMarkdown(byWorkflow){
 let text='## MID – Phase-normalized read-only CI/CD diagnostics\n\n';
 text+='Measured phases are **not additive**: parallel jobs overlap; job-level Core/Heavy include their own setup and builds. ';
 text+='Queue is workflow creation to earliest measured job start, not individual matrix queueing. ';
 text+='Skipped steps are excluded; absence, incomplete timestamps and true measured zero stay distinct. ';
 text+='P50/P95 apply only to **successful runs with observed complete timestamps** within the same workflow; '; 
 text+='no estimate, automated release permission, signed evidence or A/B production equivalence is implied.\n\n';
 text+='| Workflow | Phase | Measured / successes | Missing | Absent | Wall P50 | Wall P95 | Runner P50 | Runner P95 |\n';
 text+='|---|---|---:|---:|---:|---:|---:|---:|---:|\n';
 for(const [workflow,result] of Object.entries(byWorkflow)){
  for(const [phase,p] of Object.entries(result.summary)){
   text+='| '+workflow.replaceAll('|','\\|')+' | '+phase+' | '+p.measuredRuns+'/'+p.successfulRuns+
    ' | '+p.incompleteRuns+' | '+p.absentRuns+' | '+fmt(p.p50WallSeconds)+' | '+fmt(p.p95WallSeconds)+
    ' | '+fmt(p.p50RunnerSeconds)+' | '+fmt(p.p95RunnerSeconds)+' |\n';
  }
 }
 return text;
}
