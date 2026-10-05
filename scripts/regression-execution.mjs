import {readFile} from 'node:fs/promises';
import path from 'node:path';

const riskRules=[
 ['filesystem-write',/\b(?:writeFile|writeFileSync|appendFile|appendFileSync|rm|rmSync|unlink|unlinkSync|rename|renameSync|mkdir|mkdirSync|mkdtemp|mkdtempSync|cp|cpSync|copyFile|copyFileSync|chmod|chmodSync|chown|chownSync|symlink|symlinkSync|link|linkSync|truncate|truncateSync|createWriteStream|openSync)\b/],
 ['child-process',/(?:node:child_process|from\s+['"]child_process['"]|\b(?:spawn|spawnSync|exec|execSync|execFile|execFileSync|fork)\s*\()/],
 ['server-listener',/(?:node:(?:http|https|net|tls)|\bcreateServer\s*\(|\.listen\s*\()/],
 ['browser-automation',/(?:playwright|puppeteer|chrom(?:e|ium)|remote-debugging-port|Page\.captureScreenshot|\bWebSocket\b)/i],
 ['network-fetch',/(?:\bfetch\s*\(|globalThis\.fetch|XMLHttpRequest)/],
 ['process-global-mutation',/(?:process\.chdir\s*\(|process\.env(?:\.[A-Za-z0-9_]+|\[[^\]]+\])\s*=|delete\s+process\.env)/],
 ['dynamic-loader',/(?:createRequire\s*\(|import\s*\(\s*[^'"])/]
];

export function regressionRiskReasons(source){
 return riskRules.filter(([,pattern])=>pattern.test(source)).map(([name])=>name);
}
function localSpecifiers(source){
 const specs=new Set(),patterns=[/(?:import|export)\s+(?:[^'"]*?\s+from\s+)?['"]([^'"]+)['"]/g,/import\s*\(\s*['"]([^'"]+)['"]\s*\)/g];
 for(const pattern of patterns)for(const match of source.matchAll(pattern))if(match[1]?.startsWith('.'))specs.add(match[1]);
 return [...specs];
}
async function resolveLocalModule(fromFile,specifier){
 const base=path.resolve(path.dirname(fromFile),specifier),candidates=path.extname(base)?[base]:[base,base+'.mjs',base+'.js',base+'.cjs'];
 for(const candidate of candidates){try{await readFile(candidate,'utf8');return candidate}catch(error){if(error?.code!=='ENOENT')throw error}}
 return null;
}
async function scanModule(file,seen,reasons){
 const absolute=path.resolve(file);if(seen.has(absolute))return;seen.add(absolute);
 let source;try{source=await readFile(absolute,'utf8')}catch{reasons.add('unreadable-local-module');return}
 for(const reason of regressionRiskReasons(source))reasons.add(reason);
 for(const specifier of localSpecifiers(source)){const resolved=await resolveLocalModule(absolute,specifier);if(resolved)await scanModule(resolved,seen,reasons)}
}
export async function classifyRegression(root,name){
 const reasons=new Set(),seen=new Set();await scanModule(path.join(root,'scripts',name),seen,reasons);
 return{parallelSafe:reasons.size===0,reasons:[...reasons].sort(),scannedModules:seen.size};
}
export async function regressionExecutionPlan(root,tests){
 const parallel=[],serial=[],details=new Map();
 for(const name of tests){const classification=await classifyRegression(root,name);details.set(name,classification);(classification.parallelSafe?parallel:serial).push(name)}
 const all=[...parallel,...serial],unique=new Set(all);
 if(all.length!==tests.length||unique.size!==tests.length||tests.some(name=>!unique.has(name)))throw new Error('Regression execution plan is not a lossless one-to-one partition.');
 return{parallel,serial,details};
}
