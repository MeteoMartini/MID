import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync('public/service-worker.js','utf8'),declaration=source.split('\n').find(line=>line.startsWith('async function navigateClientsForUpdate()'));
assert.ok(declaration);const urls=[];
const navigate=new Function('self','VERSION',declaration+';return navigateClientsForUpdate')({clients:{matchAll:async()=>[{url:'https://mid.test/app/?keep=1',navigate:url=>{urls.push(url);return new Promise(()=>{})}},{url:'https://mid.test/app/second',navigate:()=>Promise.reject(Error('closed client'))}]}},JSON.parse(readFileSync('package.json')).version);
let timer;try{await Promise.race([navigate(),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('activate deadlocked on pending navigation')),1000))])}finally{clearTimeout(timer)}
assert.equal(urls.length,1);assert.equal(new URL(urls[0]).searchParams.get('keep'),'1');assert.ok(new URL(urls[0]).searchParams.has('mid-retry'));
assert.equal(readFileSync('public/sw.js','utf8'),source);
console.log('PASS actual activation navigation submits requests without awaiting controlled fetch responses; rejected/closed clients isolated; worker mirrors equal');
