import {describe,expect,it} from 'vitest';
import {currentMidReleaseSection,prependMidCurrentRelease} from '../../scripts/lib/changelogCurrentRelease.mjs';

const notes=[
 '# MID v0.9.85.487',
 '',
 '- A new, verified maintenance change.',
 '',
 '# MID v0.9.85.486',
 '',
 '- Former rolling note; NEVER duplicate in the historic changelog.',
 '',
 '# MID v0.9.85.485',
 '',
 '- Older rolling note.'
].join('\n');
const history=[
 '# MID v0.9.85.486',
 '',
 '- Existing immutable historical text.',
 '',
 '# MID v0.9.85.485',
 '',
 '- Details not present in RELEASE_NOTES.md.'
].join('\n');

describe('MID changelog: bounded latest-release prepend (no GitHub release authority)',()=>{
 it('extracts ONLY the current version from rolling release notes',()=>{
  expect(currentMidReleaseSection(notes,'0.9.85.487')).toBe(
   '# MID v0.9.85.487\n\n- A new, verified maintenance change.');
 });
 it('preserves old notes byte-for-byte and never inserts older rolling sections',()=>{
  const result=prependMidCurrentRelease(history,notes,'0.9.85.487');
  expect(result).toBe('# MID v0.9.85.487\n\n- A new, verified maintenance change.\n\n'+history);
  expect(result.match(/^# MID v0\.9\.85\.486$/gm)).toHaveLength(1);
  expect(result).not.toContain('Former rolling note; NEVER duplicate');
  expect(result).toContain('Details not present in RELEASE_NOTES.md.');
 });
 it('is idempotent and does not change an already-current changelog',()=>{
  const once=prependMidCurrentRelease(history,notes,'0.9.85.487');
  expect(prependMidCurrentRelease(once,notes,'0.9.85.487')).toBe(once);
 });
 it('fails closed on a current heading buried in existing history',()=>{
  const misplaced=history+'\n\n# MID v0.9.85.487\n- historical duplicate';
  expect(()=>prependMidCurrentRelease(misplaced,notes,'0.9.85.487')).toThrow(/already exists/);
 });
 it('rejects wrong/fifth-component, missing and empty release source',()=>{
  for(const version of ['0.9.85.486','0.9.85.487.1','0.9.85.487-anything']){
   expect(()=>currentMidReleaseSection(notes,version)).toThrow();
  }
  expect(()=>currentMidReleaseSection('# MID v0.9.85.487\n\n', '0.9.85.487')).toThrow(/empty/);
  expect(()=>prependMidCurrentRelease('',notes,'0.9.85.487')).toThrow(/historic source is empty/);
 });
 it('accepts three-component functional release without importing prior notes',()=>{
  const next='# MID v0.9.86\n\n- New independently approved capability.\n\n# MID v0.9.85.487\n- Prior.';
  const result=prependMidCurrentRelease(history,next,'0.9.86');
  expect(result.startsWith('# MID v0.9.86\n\n- New independently approved capability.')).toBe(true);
  expect(result).not.toContain('- Prior.');
 });
 it('detects duplicate current versions in H2–H4 historical headings, including suffixed titles',()=>{
  for(const entry of ['## MID v0.9.85.487 — earlier draft','### MID v0.9.85.487: earlier note','#### v0.9.85.487 · older report']){
   expect(()=>prependMidCurrentRelease(history+'\n\n'+entry+'\n- existing',notes,'0.9.85.487')).toThrow(/already exists/);
  }
 });
 it('preserves an existing current-release H2 heading and all adjacent historical bytes',()=>{
  const existing='  \n## MID v0.9.85.487 — approved wording\n\n- A new, verified maintenance change.\n\n'+history;
  expect(prependMidCurrentRelease(existing,notes,'0.9.85.487')).toBe(existing);
 });
 it('fails closed when current release is the first heading but duplicated deeper in history',()=>{
  for(const duplicate of ['# MID v0.9.85.487','## MID v0.9.85.487 — extra','#### v0.9.85.487: repeated']){
   const current='# MID v0.9.85.487\n\n- original current\n\n'+history+'\n\n'+duplicate+'\n\n- another copy';
   expect(()=>prependMidCurrentRelease(current,notes,'0.9.85.487')).toThrow(/already exists/);
  }
 });
 it('does not erase leading whitespace from a historical source or confuse 487 with 4870',()=>{
  const original='\n \n## MID v0.9.85.4870 — a different version\n\n'+history;
  expect(prependMidCurrentRelease(original,notes,'0.9.85.487')).toBe('# MID v0.9.85.487\n\n- A new, verified maintenance change.\n\n'+original);
 });

});

it('bounds rolling mixed headings, rejects duplicate/stale bodies, and supports package suffixes',()=>{
 const current='# MID v0.9.85.487\n\n- Current.';
 for(const heading of ['## MID v0.9.85.486 — old','#### v0.9.85.486: old'])
  expect(currentMidReleaseSection(current+'\n\n'+heading+'\n- Old.', '0.9.85.487')).toBe(current);
 expect(()=>currentMidReleaseSection(current+'\n\n'+current,'0.9.85.487')).toThrow(/duplicate/);
 expect(()=>prependMidCurrentRelease(current.replace('Current.','Stale.')+'\n\n'+history,current,'0.9.85.487')).toThrow(/body differs/);
 for(const suffix of ['-rc.1','+build.2']){
  const version='0.9.85.487'+suffix;
  expect(currentMidReleaseSection('# MID v'+version+'\n- Current.',version)).toContain(version);
 }
});

it('validates both changelog mirrors before writing the first',async()=>{
 const {mkdtempSync,mkdirSync,readFileSync,writeFileSync,rmSync}=await import('node:fs');
 const {tmpdir}=await import('node:os');
 const {join}=await import('node:path');
 const {spawnSync}=await import('node:child_process');
 const root=mkdtempSync(join(tmpdir(),'MID-changelog-pair-'));
 try{
  mkdirSync(join(root,'scripts/lib'),{recursive:true});mkdirSync(join(root,'public'));
  for(const file of ['scripts/sync-version.mjs','scripts/lib/changelogCurrentRelease.mjs'])
   writeFileSync(join(root,file),readFileSync(new URL('../../'+file,import.meta.url)));
  writeFileSync(join(root,'package.json'),JSON.stringify({version:'0.9.85.487',scripts:{'test:regressions':'node scripts/run-regressions.mjs'}}));
  writeFileSync(join(root,'RELEASE_NOTES.md'),notes);
  writeFileSync(join(root,'CHANGELOG.md'),history);
  writeFileSync(join(root,'public/CHANGELOG.md'),history+'\n\n# MID v0.9.85.487\n- Duplicate');
  const run=spawnSync(process.execPath,['scripts/sync-version.mjs'],{cwd:root,encoding:'utf8'});
  expect(run.status).not.toBe(0);
  expect(run.stderr).toContain('already exists');
  expect(readFileSync(join(root,'CHANGELOG.md'),'utf8')).toBe(history);
 }finally{rmSync(root,{recursive:true,force:true})}
});
