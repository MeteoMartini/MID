import assert from 'node:assert/strict';

/** Only two *real* engine launches + DOM checks can replace apt. Browser QA
 * later runs unchanged; a failure here is always fatal unless it is purely
 * missing OS dependencies, in which case signed apt setup is still required.
 */
export async function verifyMidBrowserEngines(playwright){
 if(!playwright||typeof playwright!=='object')throw Error('MID_BROWSER_API_UNAVAILABLE');
 for(const name of ['chromium','webkit']){
  const engine=playwright[name];
  if(typeof engine?.launch!=='function')throw Error('MID_BROWSER_ENGINE_UNAVAILABLE');
  let browser;
  try{
   browser=await engine.launch({headless:true,timeout:15000});
   assert.equal(typeof browser?.newPage,'function','MID_BROWSER_PAGE_UNAVAILABLE');
   const page=await browser.newPage();
   await page.goto('data:text/html,%3Cmain%20id%3D%22mid-runtime-smoke%22%3EMID%20browser%20ready%3C%2Fmain%3E',
    {waitUntil:'load',timeout:15000});
   assert.equal(await page.locator('#mid-runtime-smoke').textContent(),'MID browser ready',
    'MID_BROWSER_DOM_SMOKE_FAILED');
  }finally{if(browser)await browser.close()}
 }
 return true;
}

export function midBrowserNeedsHostDependencies(error){
 const message=typeof error?.message==='string'?error.message:'';
 return /host system is missing dependencies to run browsers/i.test(message)||
  /error while loading shared libraries:\s*lib[\w.+-]+\.so/i.test(message)||
  /lib[\w.+-]+\.so(?:\.\d+)*:\s*cannot open shared object file/i.test(message);
}
