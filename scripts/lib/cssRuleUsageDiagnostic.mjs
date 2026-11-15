/** Read-only Chromium CSS rule usage diagnostics. Byte counts are raw source slices, not transfer size. */
export async function startCssRuleUsageTracking(context,page){
 const cdp=await context.newCDPSession(page),headers=new Map();
 const textSnapshots=new Map(),pendingTextReads=new Set(),removedIds=new Set(),changedIds=new Set();
 const snapshotSheet=id=>{
  // CDP may discard a sheet before the final readout when Vite swaps CSS.
  // Capture the original text while the sheet is still attached; never invent it.
  let pending;
  pending=cdp.send('CSS.getStyleSheetText',{styleSheetId:id})
   .then(result=>{if(typeof result?.text==='string')textSnapshots.set(id,result.text)})
   .catch(()=>{}).finally(()=>pendingTextReads.delete(pending));
  pendingTextReads.add(pending);
 };
 cdp.on('CSS.styleSheetAdded',event=>{
  const id=event.header.styleSheetId;
  headers.set(id,event.header);snapshotSheet(id);
 });
 cdp.on('CSS.styleSheetRemoved',event=>removedIds.add(event.styleSheetId));
 cdp.on('CSS.styleSheetChanged',event=>changedIds.add(event.styleSheetId));
 await cdp.send('DOM.enable');
 await cdp.send('CSS.enable');
 await cdp.send('Performance.enable');
 await cdp.send('CSS.startRuleUsageTracking');
 return{cdp,headers,textSnapshots,pendingTextReads,removedIds,changedIds};
}

function usedCssBytes(source,ranges){
 // CDP offsets refer to UTF-16 source positions, while metrics count UTF-8 bytes.
 // Invalid or stale offsets must not be silently clamped and reported as complete.
 const spans=[];let invalidRanges=0;
 for(const row of ranges){
  if(!Number.isSafeInteger(row.startOffset)||!Number.isSafeInteger(row.endOffset)||
     row.startOffset<0||row.endOffset<row.startOffset||row.endOffset>source.length||typeof row.used!=='boolean'){
   invalidRanges++;continue;
  }
  if(row.used&&row.endOffset>row.startOffset)spans.push([row.startOffset,row.endOffset]);
 }
 spans.sort((a,b)=>a[0]-b[0]);
 let total=0,start=-1,end=-1;
 for(const [nextStart,nextEnd]of spans){
  if(start<0){start=nextStart;end=nextEnd}
  else if(nextStart<=end)end=Math.max(end,nextEnd);
  else{total+=Buffer.byteLength(source.slice(start,end));start=nextStart;end=nextEnd}
 }
 if(start>=0)total+=Buffer.byteLength(source.slice(start,end));
 return{usedBytes:total,invalidRanges};
}

export async function collectCssRuleUsage(session,{viewport,theme,scope,views=[]}){
 const usage=await session.cdp.send('CSS.stopRuleUsageTracking');
 if(!usage||!Array.isArray(usage.ruleUsage))throw Error('CSS rule coverage missing: no CDP ruleUsage array');
 const bySheet=new Map();
 for(const rule of usage.ruleUsage){const rows=bySheet.get(rule.styleSheetId)||[];rows.push(rule);bySheet.set(rule.styleSheetId,rows)}
 // Wait for the event-time reads before consulting a removed sheet's original text.
 if(session.pendingTextReads)await Promise.allSettled([...session.pendingTextReads]);
 const sheets=[],unreadableStyleSheetIds=[],emptyStyleSheetIds=[];
 let invalidRuleRanges=0,cachedRemovedStyleSheetCount=0;
 for(const [id,header]of session.headers){
  let source;
  try{source=(await session.cdp.send('CSS.getStyleSheetText',{styleSheetId:id})).text}
  catch{}
  if(typeof source!=='string'&&session.removedIds?.has(id)&&!session.changedIds?.has(id)){
   const snapshot=session.textSnapshots?.get(id);
   if(typeof snapshot==='string'){source=snapshot;cachedRemovedStyleSheetCount++}
  }
  if(typeof source!=='string'){unreadableStyleSheetIds.push(id);continue}
  if(!source.trim()){emptyStyleSheetIds.push(id);continue}
  const rawBytes=Buffer.byteLength(source),read=usedCssBytes(source,bySheet.get(id)||[]);
  invalidRuleRanges+=read.invalidRanges;
  sheets.push({source:header.sourceURL||header.origin||'(inline)',rawBytes,usedBytes:read.usedBytes,
   unusedBytes:Math.max(0,rawBytes-read.usedBytes)});
 }
 const unknownUsageStyleSheetIds=[...bySheet.keys()].filter(id=>!session.headers.has(id));
 const changedStyleSheetIds=[...(session.changedIds??[])];
 const incomplete=unreadableStyleSheetIds.length>0||unknownUsageStyleSheetIds.length>0||
  changedStyleSheetIds.length>0||invalidRuleRanges>0||sheets.length===0;
 const integrity={status:incomplete?'INCOMPLETE_EVIDENCE':'TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL',
  trackedStyleSheetCount:session.headers.size,readableStyleSheetCount:sheets.length,
  unreadableStyleSheetIds,unknownUsageStyleSheetIds,emptyStyleSheetIds,invalidRuleRanges,
  removedStyleSheetCount:session.removedIds?.size??0,cachedRemovedStyleSheetCount,changedStyleSheetIds,
  fullUiStateCoverageProven:false,cssRemovalAuthorized:false};
 const metrics=(await session.cdp.send('Performance.getMetrics')).metrics||[];
 const selected=Object.fromEntries(metrics.filter(x=>['RecalcStyleDuration','LayoutDuration','ScriptDuration','TaskDuration','RecalcStyleCount','LayoutCount','JSHeapUsedSize'].includes(x.name)).map(x=>[x.name,x.value]));
 return{viewport,theme,scope,views,sheets,metrics:selected,integrity};
}

/**
 * Browser QA admission, not permission to remove CSS.
 * The reporting API stays diagnostic-only; consumers of coverage evidence
 * must explicitly reject incomplete captures before reporting a passing case.
 */
export function assertCssRuleUsageComplete(result,label='CSS rule usage'){
 const integrity=result?.integrity;
 const sheets=result?.sheets;
 if(integrity?.status!=='TRACKED_SHEETS_RECORDED_NO_REMOVAL_APPROVAL'||
    !Array.isArray(sheets)||!sheets.length||
    sheets.length!==integrity.readableStyleSheetCount||
    integrity.cssRemovalAuthorized!==false||
    integrity.fullUiStateCoverageProven!==false||
    !Array.isArray(integrity.unreadableStyleSheetIds)||integrity.unreadableStyleSheetIds.length||
    !Array.isArray(integrity.unknownUsageStyleSheetIds)||integrity.unknownUsageStyleSheetIds.length||
    !Array.isArray(integrity.changedStyleSheetIds)||integrity.changedStyleSheetIds.length||
    integrity.invalidRuleRanges!==0||
    sheets.some(s=>!Number.isSafeInteger(s.rawBytes)||s.rawBytes<=0||
      !Number.isSafeInteger(s.usedBytes)||s.usedBytes<0||s.usedBytes>s.rawBytes||
      s.unusedBytes!==s.rawBytes-s.usedBytes)){
  const status=integrity?.status??'MISSING_INTEGRITY';
  // Counts only: never print CSS source text, URLs, or untrusted stylesheet content in CI logs.
  const details={tracked:integrity?.trackedStyleSheetCount??null,
   readable:integrity?.readableStyleSheetCount??null,
   returnedSheets:Array.isArray(sheets)?sheets.length:null,
   unreadable:integrity?.unreadableStyleSheetIds?.length??null,
   unknown:integrity?.unknownUsageStyleSheetIds?.length??null,
   empty:integrity?.emptyStyleSheetIds?.length??null,
   invalidRanges:integrity?.invalidRuleRanges??null,
   removed:integrity?.removedStyleSheetCount??null,
   cachedRemoved:integrity?.cachedRemovedStyleSheetCount??null,
   changed:integrity?.changedStyleSheetIds?.length??null};
  throw Error(label+': incomplete CSS rule usage evidence ('+status+', counts='+JSON.stringify(details)+'); browser coverage QA must not pass');
 }
 return result;
}
