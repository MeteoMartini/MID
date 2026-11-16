import {spawnSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';

describe('MID Design 1.4 – real 14-day React/CSS browser geometry',()=>{
 const onGitHub=process.env.GITHUB_ACTIONS==='true';
 (onGitHub?it:it.skip)('loads actual FourteenDayHorizon and canonical CSS in real Chromium, validates 32 cases including 16 full ForecastCockpit keyboard and text stress and captures evidence',()=>{
  const syntax=spawnSync(process.execPath,['--check','scripts/verify-fourteen-readable-forecast-browser-0985485.mjs'],{cwd:process.cwd(),encoding:'utf8',timeout:10000});
  expect(syntax.status,[syntax.stdout,syntax.stderr,syntax.error?.message].filter(Boolean).join('\n')).toBe(0);
  const r=spawnSync(process.execPath,['scripts/verify-fourteen-readable-forecast-browser-0985485.mjs'],{
   cwd:process.cwd(),encoding:'utf8',timeout:220000,maxBuffer:2*1024*1024,
   env:{...process.env,NODE_ENV:'test',GH_TOKEN:''}
  });
  expect(r.status,[r.stdout,r.stderr,r.error?.message].filter(Boolean).join('\n')).toBe(0);
  expect(r.stdout).toContain('MID DESIGN14 BROWSER QA SUCCESS: 32 real React/CSS viewport/theme contexts');
 },230000);
});
