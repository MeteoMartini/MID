#!/usr/bin/env node
import assert from 'node:assert/strict';
import {renderMidAiConsentPage,validateMidAiConsentScopes} from '../router/cloudflare/consent-page.mjs';
const render=(d,h)=>renderMidAiConsentPage(d,h,'A'.repeat(95)+'.'+'B'.repeat(43));
let scenarios=0;const check=fn=>{fn();scenarios++};
const details={clientName:'Trusted Client',clientDomain:'client.example',
 redirectHost:'client.example',redirectIsLoopback:false,scope:['mid-ai:read']};
check(()=>{const page=render(details,'handle123');
 assert.match(page,/client\.example/);assert.match(page,/Verifizierte Client-Domain/);
 assert.match(page,/mid-ai:read/);assert.doesNotMatch(page,/value="mid-ai:infer-public"/);});
check(()=>{const page=render({...details,scope:['mid-ai:read','mid-ai:infer-public']},'handle123');
 assert.match(page,/value="mid-ai:infer-public"/);});
check(()=>{const page=render({...details,clientDomain:null},'handle123');
 assert.match(page,/kein verifizierter Herausgebernachweis/);});
check(()=>{const page=render({...details,redirectHost:'localhost:4153',redirectIsLoopback:true},'handle123');
 assert.match(page,/Lokales Ziel/);});
check(()=>{const page=render({...details,redirectHost:'127.0.0.1'},'handle123');
 assert.match(page,/Lokales Ziel/);});
check(()=>{const page=render({...details,
 clientName:'<img src=x onerror=alert(1)>',clientDomain:'<script>',redirectHost:'x.example"><img>',
 },'"><script>');
 assert.doesNotMatch(page,/<img|<script>/);assert.match(page,/&lt;script&gt;/);});
check(()=>assert.throws(()=>render({...details,redirectHost:''},'123'),
 e=>e.reason==='INVALID_CONSENT_DESCRIPTION'));
check(()=>assert.throws(()=>render({...details,scope:['mid-ai:infer-public']},'123'),
 e=>e.reason==='INVALID_CONSENT_DESCRIPTION'));
check(()=>assert.deepEqual(validateMidAiConsentScopes(['mid-ai:read'],['mid-ai:read']),['mid-ai:read']));
check(()=>assert.deepEqual(validateMidAiConsentScopes(['mid-ai:read','mid-ai:infer-public'],['mid-ai:read','mid-ai:infer-public']),['mid-ai:read','mid-ai:infer-public']));
check(()=>assert.throws(()=>validateMidAiConsentScopes(['mid-ai:read'],['mid-ai:read','mid-ai:infer-public']),e=>e.reason==='UNREQUESTED_OR_INVALID_SCOPE'));
check(()=>assert.throws(()=>validateMidAiConsentScopes(['mid-ai:read','mid-ai:infer-public'],['mid-ai:infer-public']),e=>e.reason==='UNREQUESTED_OR_INVALID_SCOPE'));
check(()=>assert.throws(()=>validateMidAiConsentScopes(['mid-ai:read'],['mid-ai:read','mid-ai:read']),e=>e.reason==='UNREQUESTED_OR_INVALID_SCOPE'));
check(()=>assert.throws(()=>validateMidAiConsentScopes(['mid-ai:read'],['mid-ai:read','other']),e=>e.reason==='UNREQUESTED_OR_INVALID_SCOPE'));
console.log('MID AI Router OAuth consent offline QA OK; scenarios='+scenarios+'; no network, tokens or deployment.');
