import {describe,it,expect} from 'vitest';
import {runDesign19CssSamePage,validateDesign19Scenario} from '../../scripts/lib/design19CssSamePageEvidence.mjs';

// Synthetic policy tests only. These NEVER substitute for real Playwright,
 // original dist/HTTP, dynamic views, Safari/iOS or release gates.
const identity=()=>({schema:'mid.web-build-identity.v1',version:'0.9.85.486',
 sourceGitSha:'a'.repeat(40),assetsSha256:'b'.repeat(64),assetCount:3});
const scenario=()=>({caseId:'map-light-390',fixtureSha256:'c'.repeat(64),
 theme:'light',width:390,height:844,readySelector:'main.map',
 targets:[{id:'map-shell',selector:'.map-shell'}]});
const manifest=()=>({schema:'mid.design18.css-dist-manifest.v1',verified:true,
 identity:{sourceGitSha:'a'.repeat(40),assetsSha256:'b'.repeat(64),version:'0.9.85.486'},
 assets:[{role:'shell',path:'assets/index.css',sha256:'d'.repeat(64)}],
 inlineStyleSha256:['e'.repeat(64)]});
const css=()=>({schema:'mid.design18.css-load-readiness.v1',
 status:'DECLARED_CSS_HTTP_AND_CSSOM_OBSERVED_ONLY',
 releaseAuthorized:false,cssSplitSafeProven:false,performanceGainProven:false,
 identity:manifest().identity,orderedStylesheets:[{inlineSha256:'e'.repeat(64)},{path:'assets/index.css'}]});
const capture=()=>({schema:'mid.design18.cssom-case.v1',status:'READ_ONLY_BROWSER_OBSERVATION',
 releaseAuthorized:false,wholeAppParityProven:false,
 identity:manifest().identity,
 environment:{caseId:'map-light-390',fixtureSha256:'c'.repeat(64),theme:'light',actualTheme:'light',
  width:390,height:844,browser:'chromium',browserVersion:'143.0.0.0',devicePixelRatio:2},
 readiness:{readySelectorMatched:1,fontsStatus:'loaded',styleSheetCount:2},
 rootTokens:{'--param-temperature':'#00aaff'},elements:[{id:'map-shell',computed:{color:'rgb(1,2,3)'},rect:{x:1,y:1,width:50,height:80}}]});
const origin='http://127.0.0.1:4100';
function harness(config?:{
 manifest?:ReturnType<typeof manifest>,result?:ReturnType<typeof css>,
 first?:ReturnType<typeof capture>,second?:ReturnType<typeof capture>,
 origin?:string,viewport?:{width:number,height:number},
 viewUrl?:string, failAt?:string, navigationStatus?:number,
 redirectEntryTo?:string, serviceWorkerEntry?:boolean, missingNavigationResponse?:boolean,
}){
 const log:string[]=[],ready={manifest:config?.manifest??manifest(),css:config?.result??css(),
 first:config?.first??capture(),second:config?.second??capture()};
 let current='about:blank',n=0;
 const page={
  url:()=>current,viewportSize:()=>config?.viewport??{width:390,height:844},
  context:()=>({}),
  addInitScript:async()=>{log.push('theme-init')},
  goto:async(url:string)=>{
   log.push('navigate');
   if(config?.failAt==='goto')throw Error('admin browser navigation blocked');
   current=config?.redirectEntryTo??url;
   if(config?.missingNavigationResponse)return null;
   return {status:()=>config?.navigationStatus??200,
    url:()=>config?.redirectEntryTo??url,
    fromServiceWorker:()=>config?.serviceWorkerEntry??false};
  },
 };
 const helpers={
  verifyCssManifestAgainstDist:async()=>{log.push('verify-dist');if(config?.failAt==='dist')throw Error('bad dist');return ready.manifest},
  observeCssResponses:()=>{
   log.push('observer-start');
   return {
    finish:async()=>{log.push('observer-finish');if(config?.failAt==='css')throw Error('unreadable CSS');return ready.css},
    cancel:()=>{log.push('observer-cancel')},
   };
  },
  captureCssomCase:async()=>{n++;log.push('cssom-'+n);return n===1?ready.first:ready.second},
  validateCssomCase:(row:any)=>{log.push('validate-cssom');return row},
 };
 const openView=async()=>{log.push('open-view');if(config?.failAt==='view')throw Error('view not ready');
  if(config?.viewUrl)current=config.viewUrl;
 };
 const input=()=>({page,distRoot:'/verified-dist',buildIdentity:identity(),
  expectedCssAssets:manifest().assets,origin:config?.origin??origin,
  scenario:scenario(),openView,helpers});
 return {input,log,ready,page};
}
describe('MID Design19 – same-page CSS HTTP/computed browser evidence bridge (synthetic)',()=>{
 it('observes exact dist first, CSS listener before navigation, same Page before/after, never approves',async()=>{
  const h=harness(),result=await runDesign19CssSamePage(h.input());
  expect(h.log).toEqual(['verify-dist','observer-start','theme-init','navigate','open-view',
   'cssom-1','validate-cssom','observer-finish','cssom-2','validate-cssom','observer-cancel']);
  expect(result.status).toBe('ONE_PAGE_ONE_WINDOW_DESCRIPTIVE_ONLY');
  expect(result.releaseAuthorized).toBe(false);
  expect(result.cssSplitSafeProven).toBe(false);
  expect(result.performanceGainProven).toBe(false);
  expect(result.browserAcceptanceProven).toBe(false);
  expect(result.cssom.environment.browserVersion).toBe('143.0.0.0');
 });
 it('rejects invalid and over-specified scenarios, including no explicit fixture',()=>{
  expect(()=>validateDesign19Scenario({...scenario(),fixtureSha256:''})).toThrow(/fixture/);
  expect(()=>validateDesign19Scenario({...scenario(),theme:'auto'})).toThrow(/theme/);
  expect(()=>validateDesign19Scenario({...scenario(),width:0})).toThrow(/dimensions/);
  expect(()=>validateDesign19Scenario({...scenario(),additionalToken:'secret'})).toThrow(/unexpected/);
  expect(()=>validateDesign19Scenario({...scenario(),targets:[scenario().targets[0],scenario().targets[0]]})).toThrow(/duplicate/);
 });
 it('rejects incorrect actual viewport before a browser is touched',async()=>{
  const h=harness({viewport:{width:440,height:844}});
  await expect(runDesign19CssSamePage(h.input())).rejects.toThrow(/viewport/);
  expect(h.log).toEqual([]);
 });
 it('rejects external or nonexact origin before navigation',async()=>{
  for(const invalid of ['https://example.org','http://127.0.0.1:4100/other','http://127.0.0.1:4100/?debug=1']){
   const h=harness({origin:invalid});
   await expect(runDesign19CssSamePage(h.input())).rejects.toThrow(/local server origin/);
   expect(h.log).toEqual([]);
  }
 });
 it('rejects malformed build identity and forged verified manifest',async()=>{
  const h=harness();
  await expect(runDesign19CssSamePage({...h.input(),buildIdentity:{...identity(),assetsSha256:''}}))
   .rejects.toThrow(/fingerprints/);
  const bad=harness({manifest:{...manifest(),identity:{...manifest().identity,assetsSha256:'f'.repeat(64)}}});
  await expect(runDesign19CssSamePage(bad.input())).rejects.toThrow(/dist.manifest.identity/);
 });
 it('rejects HTTP 404/500 even when Playwright goto resolves normally',async()=>{
  for(const navigationStatus of [301,302,404,500]){
   const h=harness({navigationStatus});
   await expect(runDesign19CssSamePage(h.input()))
    .rejects.toThrow(/index.html navigation requires original HTTP 200/);
   expect(h.log).toContain('navigate');
   expect(h.log).not.toContain('open-view');
   expect(h.log.at(-1)).toBe('observer-cancel');
  }
 });
 it('rejects same-origin redirects, absent index responses and Service Worker substitutions',async()=>{
  for(const config of [
   {redirectEntryTo:origin+'/other.html'},
   {missingNavigationResponse:true},
   {serviceWorkerEntry:true},
  ]){
   const h=harness(config);
   await expect(runDesign19CssSamePage(h.input()))
    .rejects.toThrow(/index.html navigation requires original HTTP 200/);
   expect(h.log).not.toContain('open-view');
   expect(h.log.at(-1)).toBe('observer-cancel');
  }
 });
 it('refuses CSS HTTP observations with missing or permissive statuses',async()=>{
  for(const badCss of [
   {...css(),status:'DONE'}, {...css(),cssSplitSafeProven:true},
   {...css(),releaseAuthorized:true}, {...css(),performanceGainProven:true},
   {...css(),identity:{...css().identity,version:'0.9.85.123'}},
  ]){
   const h=harness({result:badCss});
   await expect(runDesign19CssSamePage(h.input())).rejects.toThrow(/CSS load|CSS HTTP|identity/);
   expect(h.log.at(-1)).toBe('observer-cancel');
  }
 });
 it('rejects missing CSSOM sheets or late sheet count drift',async()=>{
  const a=harness({result:{...css(),orderedStylesheets:[]}});
  await expect(runDesign19CssSamePage(a.input())).rejects.toThrow(/count/);
  const other=capture();other.readiness={...other.readiness,styleSheetCount:3};
  const b=harness({second:other});
  await expect(runDesign19CssSamePage(b.input())).rejects.toThrow(/inventory drift/);
 });
 it('fails closed on within-session actual CSS computed value drift, same rule count',async()=>{
  const second=capture();second.elements=[{...second.elements[0],computed:{color:'rgb(9,9,9)'}}];
  const h=harness({second});
  await expect(runDesign19CssSamePage(h.input())).rejects.toThrow(/computed style or geometry drift/);
  expect(h.log.at(-1)).toBe('observer-cancel');
 });
 it('rejects cross-viewport, theme, fixture, source SHA and browser-version swaps',async()=>{
  for(const changed of [
   {environment:{...capture().environment,browserVersion:'144.0.0.0'}},
   {environment:{...capture().environment,fixtureSha256:'f'.repeat(64)}},
   {environment:{...capture().environment,theme:'dark',actualTheme:'dark'}},
   {environment:{...capture().environment,width:1024}},
   {identity:{...capture().identity,sourceGitSha:'f'.repeat(40)}},
  ]){
   const h=harness({second:{...capture(),...changed}});
   await expect(runDesign19CssSamePage(h.input())).rejects.toThrow(/drift|mismatch/);
  }
 });
 it('refuses a fixture that navigates away from the verified origin',async()=>{
  const h=harness({viewUrl:'https://other.example/'});
  await expect(runDesign19CssSamePage(h.input())).rejects.toThrow(/left local verified origin/);
  expect(h.log.at(-1)).toBe('observer-cancel');
 });
 it('cancels CSS network observers on browser, view and CSS failures',async()=>{
  for(const failAt of ['goto','view','css']){
   const h=harness({failAt});
   await expect(runDesign19CssSamePage(h.input())).rejects.toThrow();
   expect(h.log.at(-1)).toBe('observer-cancel');
  }
 });
 it('requires all original versioned Design18 helpers, never accepts inert controls',async()=>{
  const h=harness(),input=h.input();
  await expect(runDesign19CssSamePage({...input,helpers:{...input.helpers,captureCssomCase:undefined}}))
   .rejects.toThrow(/helper unavailable/);
  const h2=harness();await expect(runDesign19CssSamePage({...h2.input(),openView:null}))
   .rejects.toThrow(/view action/);
 });
});
