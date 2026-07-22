import fs from 'node:fs';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
const ts=require('typescript');
let source=fs.readFileSync(new URL('../src/workerClient.ts',import.meta.url),'utf8');
source=source.replace("import {MID_VERSION} from './version';","const MID_VERSION='test';");
source=source.replaceAll('import.meta.env','TEST_ENV');
source=`const TEST_ENV={};\n${source}\nexport function __setTestEnv(value){Object.assign(TEST_ENV,value)};`;
const javascript=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const moduleUrl=`data:text/javascript;base64,${Buffer.from(javascript).toString('base64')}`;

const values=new Map();
globalThis.localStorage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
globalThis.location={href:'https://example.github.io/MID/'};
const client=await import(moduleUrl);
client.__setTestEnv({VITE_WORKER_SAME_ORIGIN_PATH:'',VITE_RADAR_PROXY_URL:'',VITE_METAR_PROXY_URL:'',VITE_WORKER_FALLBACK_URLS:''});
if(client.workerBaseCandidates('radar').length)throw new Error('Leere Worker-Konfiguration erzeugt weiterhin einen Scheinendpunkt.');

client.__setTestEnv({VITE_METAR_PROXY_URL:'https://actual-worker.example.workers.dev/'});
let candidates=client.workerBaseCandidates('radar');
if(candidates.length!==1||!candidates[0].includes('actual-worker'))throw new Error('Radar/Meteogramm fällt nicht auf VITE_METAR_PROXY_URL zurück.');

values.set('mid:worker:lastGood',JSON.stringify({url:'https://example.github.io/MID/',at:Date.now()}));
candidates=client.workerBaseCandidates('radar');
if(candidates.some(url=>url==='https://example.github.io/MID/'))throw new Error('Ein alter GitHub-Pages-Scheinendpunkt wird nicht verworfen.');

values.set('mid:worker:lastGood',JSON.stringify({url:'https://html-endpoint.example/',at:Date.now()}));
const calls=[];
globalThis.fetch=async url=>{calls.push(String(url));if(String(url).includes('html-endpoint'))return new Response('<!doctype html>',{status:200,headers:{'content-type':'text/html'}});return new Response(JSON.stringify({radarProbability:42}),{status:200,headers:{'content-type':'application/json; charset=utf-8'}})};
const result=await client.fetchWorkerJson('radar-nowcast',{lat:1,lon:2},{purpose:'radar'});
if(result.radarProbability!==42||calls.length!==2)throw new Error('Nicht-JSON-Antwort löst keinen Endpunktwechsel aus.');
console.log('Worker-Client geprüft: leere Werte, alter Seitenendpunkt, METAR-Rückfall und JSON-Failover funktionieren.');
