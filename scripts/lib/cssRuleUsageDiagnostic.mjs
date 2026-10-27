/** Read-only Chromium CSS rule usage diagnostics. Byte counts are raw source slices, not transfer size. */
export async function startCssRuleUsageTracking(context,page){
 const cdp=await context.newCDPSession(page),headers=new Map();
 cdp.on('CSS.styleSheetAdded',event=>headers.set(event.header.styleSheetId,event.header));
 await cdp.send('DOM.enable');
 await cdp.send('CSS.enable');
 await cdp.send('Performance.enable');
 await cdp.send('CSS.startRuleUsageTracking');
 return{cdp,headers};
}

function usedCssBytes(source,ranges){
 const spans=ranges.filter(row=>row.used).map(row=>[Math.max(0,row.startOffset),Math.min(source.length,row.endOffset)]).filter(([start,end])=>end>start).sort((a,b)=>a[0]-b[0]);
 let total=0,start=-1,end=-1;
 for(const [nextStart,nextEnd]of spans){
  if(start<0){start=nextStart;end=nextEnd}
  else if(nextStart<=end)end=Math.max(end,nextEnd);
  else{total+=Buffer.byteLength(source.slice(start,end));start=nextStart;end=nextEnd}
 }
 if(start>=0)total+=Buffer.byteLength(source.slice(start,end));
 return total;
}

export async function collectCssRuleUsage(session,{viewport,theme,scope,views=[]}){
 const usage=await session.cdp.send('CSS.stopRuleUsageTracking'),bySheet=new Map();
 for(const rule of usage.ruleUsage||[]){const rows=bySheet.get(rule.styleSheetId)||[];rows.push(rule);bySheet.set(rule.styleSheetId,rows)}
 const sheets=[];
 for(const [id,header]of session.headers){
  let source;try{source=(await session.cdp.send('CSS.getStyleSheetText',{styleSheetId:id})).text}catch{continue}
  if(!source||!source.trim())continue;
  const rawBytes=Buffer.byteLength(source),usedBytes=usedCssBytes(source,bySheet.get(id)||[]);
  sheets.push({source:header.sourceURL||header.origin||'(inline)',rawBytes,usedBytes,unusedBytes:Math.max(0,rawBytes-usedBytes)});
 }
 const metrics=(await session.cdp.send('Performance.getMetrics')).metrics||[];
 const selected=Object.fromEntries(metrics.filter(x=>['RecalcStyleDuration','LayoutDuration','ScriptDuration','TaskDuration','RecalcStyleCount','LayoutCount','JSHeapUsedSize'].includes(x.name)).map(x=>[x.name,x.value]));
 return{viewport,theme,scope,views,sheets,metrics:selected};
}
