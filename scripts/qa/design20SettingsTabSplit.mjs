#!/usr/bin/env node
/**
 * MID Design20: SHA-bound, owner-run SettingsManager tab entanglement refactor.
 * Read-only unless --apply is explicitly passed on an authorized .497 agent branch.
 * No weather model, persistence, CSS, release, or canonical branch writes.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

const BASE_APP_BLOB='d5fd0cee5c6cf8df187f3493c864d136ab11bcd9';
const SETTINGS_START='function SettingsManager(';
const SETTINGS_END='function Header(';
const file=new URL('../../src/App.tsx',import.meta.url);
const command=process.argv[2]||'--preview';
const gitBlob=value=>createHash('sha1').update('blob '+Buffer.byteLength(value)+'\0'+value).digest('hex');
const count=(body,needle)=>body.split(needle).length-1;
function assertSingle(body,needle){if(count(body,needle)!==1)throw new Error('fail-closed: ambiguous source marker '+needle)}
const plan=[
 ['<div className="settings-choice-grid layout-mode-settings-grid">','view'],
 ['<div className="ui-density-settings">','view'],
 ['<div className="confidence-display-settings">','weather'],
 ['<div className="skybar-display-settings">','weather'],
 ['<div className="favorite-strip-display-settings">','view'],
 ['<div className="settings-option-list">','weather'],
 ['<section className="settings-section settings-primary-options">','viewWeather'],
 ['<section className="settings-section settings-theme-section">','view'],
 ['<section className="settings-section settings-branding-section">','view'],
 ['<section className="settings-section time-display-settings">','units'],
 ['<section className="settings-section settings-units-section">','units']
];
const advanced="{layoutMode==='advanced'&&<div className=\"advanced-feature-settings\">";
const advancedGated="{section==='weather'&&layoutMode==='advanced'&&<div className=\"advanced-feature-settings\">";
const moduleTag="<DashboardModuleSettingsPanel settings={dashboardModuleSettings} onChange={setDashboardModuleSettings} advancedMode={layoutMode==='advanced'}/>";
function headerFor(section){return section==='viewWeather'?"(section==='view'||section==='weather')":"section==='"+section+"'";}
function wrap(body,opening,owner){
 assertSingle(body,opening);
 const start=body.indexOf(opening),tag=opening.match(/^<([A-Za-z]+)/)?.[1];
 if(!tag)throw new Error('fail-closed: expected JSX element');
 const matcher=new RegExp('<'+tag+'(?=[\\s>])[^>]*>|</'+tag+'\\s*>','g');
 matcher.lastIndex=start;
 let depth=0,stop=-1,match;
 while((match=matcher.exec(body))!==null){
  depth+=match[0].startsWith('</')?-1:1;
  if(depth===0){stop=matcher.lastIndex;break;}
 }
 if(stop<0)throw new Error('fail-closed: unbalanced JSX element '+opening);
 return body.slice(0,start)+'{'+headerFor(owner)+'&&'+body.slice(start,stop)+'}'+body.slice(stop);
}
function splitSettings(source){
 assertSingle(source,SETTINGS_START);
 const start=source.indexOf(SETTINGS_START),stop=source.indexOf(SETTINGS_END,start);
 if(stop<=start)throw new Error('fail-closed: SettingsManager/Header boundary changed');
 let body=source.slice(start,stop);
 for(const [opening,owner] of plan)body=wrap(body,opening,owner);
 assertSingle(body,advanced);
 assertSingle(body,moduleTag);
 body=body.replace(advanced,advancedGated);
 body=body.replace(moduleTag,"{section==='navigation'&&"+moduleTag+'}');
 return source.slice(0,start)+body+source.slice(stop);
}
function inspect(source,after){
 const start=source.indexOf(SETTINGS_START),stop=source.indexOf(SETTINGS_END,start);
 if(start<0||stop<=start)throw new Error('fail-closed: missing SettingsManager');
 const body=source.slice(start,stop);
 for(const [opening,owner] of plan){
  const prefix='{'+headerFor(owner)+'&&'+opening;
  assertSingle(body,after?prefix:opening);
 }
 assertSingle(body,after?advancedGated:advanced);
 assertSingle(body,after?"{section==='navigation'&&"+moduleTag:moduleTag);
 for(const token of ["onClick={()=>setLayoutMode('standard')}","onClick={()=>setLayoutMode('advanced')}","onClick={()=>setUiDensityPreference('comfortable')}","onClick={()=>setForecastDisplaySettings(current=>({...current,skybarDisplayMode:'squares'}))}","onClick={()=>setTimeDisplayMode('zulu')}","<DashboardModuleSettingsPanel settings={dashboardModuleSettings}"]){
  if(!body.includes(token))throw new Error('fail-closed: existing control missing '+token);
 }
 const itemStart=body.indexOf('const items:[SettingsSection'),itemEnd=body.indexOf('];',itemStart);
 const nav=body.slice(itemStart,itemEnd);
 for(const id of ["view","weather","navigation","units","favorites","notifications","quality","sync","system"]){
  if(!nav.includes("['"+id+"','"))throw new Error('fail-closed: settings tab missing '+id);
 }
 return {groups:plan.length,items:9};
}
const original=readFileSync(file,'utf8'),sha=gitBlob(original);
if(command==='--check-after'){
 const checks=inspect(original,true);
 console.log(JSON.stringify({result:'PASS-after',sha,checks}));
 process.exit(0);
}
if(sha!==BASE_APP_BLOB)throw new Error('fail-closed: App.tsx blob drift: '+sha+' expected '+BASE_APP_BLOB);
inspect(original,false);
const next=splitSettings(original);
inspect(next,true);
if(next===original||next.length-original.length<200||next.length-original.length>500)throw new Error('fail-closed: unexpected change size');
if(command==='--preview'||command==='--selftest'){
 console.log(JSON.stringify({result:'PASS-dry-run',baseBlob:sha,proposedBlob:gitBlob(next),deltaBytes:next.length-original.length,tabOwnerGroups:13,writes:0}));
 process.exit(0);
}
if(command!=='--apply')throw new Error('usage: --preview | --selftest | --apply | --check-after');
const branch=execFileSync('git',['symbolic-ref','--quiet','--short','HEAD'],{encoding:'utf8'}).trim();
if(!/^(chatgpt|codex)\/v0\.9\.85\.497-[a-z0-9-]+$/.test(branch))throw new Error('fail-closed: unauthorized agent branch '+branch);
const dirty=execFileSync('git',['status','--porcelain','--','src/App.tsx'],{encoding:'utf8'}).trim();
if(dirty)throw new Error('fail-closed: App.tsx has uncommitted changes');
writeFileSync(file,next,'utf8');
console.log(JSON.stringify({result:'APPLIED-on-authorized-agent-branch',branch,baseBlob:sha,proposedBlob:gitBlob(next),tabOwnerGroups:13}));
