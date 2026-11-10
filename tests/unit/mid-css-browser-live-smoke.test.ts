import {spawnSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';

describe('MID #344: REAL preinstalled Chrome / pinned Playwright launch compatibility',()=>{
 const onGitHub=process.env.GITHUB_ACTIONS==='true';
 (onGitHub?it:it.skip)('launches the real runner browser; no pixel-parity pass implied',()=>{
  const code=[
   "import {realpathSync} from 'node:fs';",
   "import {execFileSync} from 'node:child_process';",
   "import {createRequire} from 'node:module';",
   "import {dirname,join} from 'node:path';",
   "import {midCssQaBrowserExecutable} from './scripts/lib/cssQaBrowserExecutable.mjs';",
   "const path=midCssQaBrowserExecutable();",
   "if(!path)throw Error('No executable real Chromium/Chrome in this GitHub runner');",
   "const cli=realpathSync(execFileSync('npm',['exec','--yes','--package=playwright@1.56.1','--','which','playwright'],{encoding:'utf8',timeout:25000}).trim());",
   "const {chromium}=createRequire(import.meta.url)(join(dirname(dirname(cli)),'playwright'));",
   "const browser=await chromium.launch({executablePath:path,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});",
   "try{const page=await browser.newPage({viewport:{width:390,height:844}});",
   "await page.setContent('<div class=\"qa-css-browser\" style=\"width:44px;height:44px\">QA</div>');",
   "const size=await page.locator('.qa-css-browser').evaluate(node=>{const r=node.getBoundingClientRect();return[r.width,r.height]});",
   "if(size[0]!==44||size[1]!==44)throw Error('Real browser computed geometry mismatch');",
   "console.log('MID Chromium version='+browser.version()+' real binary='+path+' · launch smoke PASS; NO app pixel parity claimed.');",
   "}finally{await browser.close();}"
  ].join('\n');
  const result=spawnSync(process.execPath,['--input-type=module','-e',code],{
   encoding:'utf8',timeout:70000,maxBuffer:1024*1024,
   env:{...process.env,NODE_ENV:'production',GH_TOKEN:''}
  });
  expect(result.status,[result.stdout,result.stderr,result.error?.message].filter(Boolean).join('\n')).toBe(0);
  expect(result.stdout).toContain('launch smoke PASS');
 },80000);
});
