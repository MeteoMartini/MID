#!/usr/bin/env node
/** Read-only intake; uses trusted installed script, never candidate code. */
import {readFileSync} from 'node:fs';
import {gh,verifyIssue,listIssues,liveBase,git,requireThat} from '../tools/handoff/copilot.mjs';
const t=JSON.parse(readFileSync(new URL('../tools/handoff/ap1b.json',import.meta.url),'utf8'));
try{
 requireThat(git('rev-parse','HEAD').toString().trim()===liveBase(),'intake checkout is not current Stable');
 const issues=listIssues();
 const matches=issues.filter(i=>i.title==='[MID-COPILOT-HANDOFF] '+t.task);
 if(matches.length>1)throw new Error('Duplicate handoffs require independent inspection');
 console.log(JSON.stringify(matches.map(i=>({...verifyIssue(i,t),issue:i.html_url})),null,2));
}catch(e){console.error(e.message);process.exitCode=1;}
