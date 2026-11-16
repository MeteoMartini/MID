import {describe,it,expect} from 'vitest';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {cssCandidateOwnerEvidence} from '../../scripts/lib/cssCandidateOwnerEvidence.mjs';

const repoRoot=fileURLToPath(new URL('../../',import.meta.url));
const owners={
 'src/App.tsx':'return <div className="navigation-bottom-tabs"/>;',
 'src/MountainWeather.tsx':'return <section className="card mountain-ski"/>;',
 'src/ForecastCockpit.tsx':'<div className="cockpit-fourteen-grid"/><article className={`cockpit-fourteen-card mid-forecast-row`}/>',
};
const css=[
 "html[data-mid-design='next'] .cockpit-fourteen-grid{display:grid!important}",
 "@media(max-width:390px){html[data-mid-design='next'] .navigation-bottom-tabs button{min-width:44px!important}}",
 "@media(max-width:850px){html[data-mid-design='next'] .mountain-ski .mountain-day-toggle{min-height:44px!important}}",
 "html .cockpit-fourteen-card.mid-forecast-row{padding:8px!important}",
].join('\n');

describe('MID CSS candidate: cross-module owner evidence',()=>{
 it('detects component owners and responsive conditions even with zero exact selector collisions',()=>{
  const report=cssCandidateOwnerEvidence(css,owners);
  expect(report.status).toBe('BLOCKED_CROSS_MODULE_OWNERSHIP');
  expect(report.safeToDefer).toBe(false);
  expect(report.blockers).toHaveLength(4);
  expect(report.blockers.map(x=>x.ownerFile)).toContain('src/MountainWeather.tsx');
  const navigation=report.blockers.find(x=>x.id==='app-bottom-navigation');
  expect(navigation?.examples[0].conditions).toContain('@media (max-width:390px)');
  expect(report.blockers.every(x=>x.examples.every(e=>Number.isInteger(e.line)&&e.line!>0))).toBe(true);
 });
 it('does not mistake class-prefix overlaps or comment text for actual selectors',()=>{
  const report=cssCandidateOwnerEvidence('/* .mountain-ski */ .mountain-ski-extra{display:none}',owners);
  expect(report.blockers).toHaveLength(0);
  expect(report.safeToDefer).toBe(false);
  expect(report.status).toBe('UNVERIFIED_REQUIRE_BROWSER_PARITY');
 });
 it('fails closed when source proof is missing or CSS is malformed',()=>{
  expect(()=>cssCandidateOwnerEvidence(css,{...owners,'src/App.tsx':'// missing class'})).toThrow(/Missing reviewed CSS owner marker/);
  expect(()=>cssCandidateOwnerEvidence(css,{})).toThrow(/Missing reviewed CSS owner marker/);
  expect(()=>cssCandidateOwnerEvidence('',owners)).toThrow(/Nonempty CSS/);
  expect(()=>cssCandidateOwnerEvidence('.mountain-ski{color:red',owners)).toThrow();
 });
 it('binds current real CSS to navigation, mountain and ForecastCockpit owners',async()=>{
  const source=await readFile(join(repoRoot,'src/midC18FourteenReplitFluidGrid.css'),'utf8');
  const actual=Object.fromEntries(await Promise.all(Object.keys(owners).map(async file=>[file,await readFile(join(repoRoot,file),'utf8')])));
  const report=cssCandidateOwnerEvidence(source,actual);
  expect(report.schema).toBe('mid.css-candidate-owner-evidence.v1');
  expect(report.blockers.map(row=>row.id)).toEqual([
   'app-bottom-navigation','mountain-controls','fourteen-cockpit-grid','fourteen-cockpit-cards',
  ]);
  expect(report.blockers.every(row=>row.matchedRuleCount>0)).toBe(true);
  expect(report.safeToDefer).toBe(false);
 });
 it('runs the existing read-only CSS audit and does not misreport the 14-day stylesheet as safe',async()=>{
  const temp=await mkdtemp(join(tmpdir(),'mid-css-owner-qa-'));
  try{
   execFileSync(process.execPath,[join(repoRoot,'scripts/audit-css-move-candidates-0985482.mjs'),repoRoot],{
    cwd:temp,stdio:['ignore','pipe','pipe'],encoding:'utf8',
   });
   const file=await readFile(join(temp,'artifacts/css-move-risk-0985482.json'),'utf8');
   const report=JSON.parse(file);
   expect(report.schema).toBe('mid.css-move-risk.v1');
   const candidate=report.candidates.find((row:{file:string})=>row.file==='src/midC18FourteenReplitFluidGrid.css');
   expect(candidate?.sameSelectorPropertyCollisions).toBe(0);
   expect(candidate?.status).toBe('BLOCKED_CROSS_MODULE_OWNERSHIP');
   expect(candidate?.ownerEvidence?.blockers).toHaveLength(4);
   expect(candidate?.ownerEvidence?.safeToDefer).toBe(false);
   expect(report.candidates.find((row:{file:string})=>row.file==='src/midC14MapWorkspace.css')?.status).toBe('BLOCKED_STATIC_COLLISIONS');
  }finally{await rm(temp,{recursive:true,force:true});}
 });
});
