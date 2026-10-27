// Pass dynamic values through CDP CallArgument; never splice them into source.
// The caller supplies a static function declaration. CDP replies include their
// JSON-RPC envelope, matching the existing browser-fixture transport.
export async function callCdpFunction(cdp,functionDeclaration,values=[]){
 const target=await cdp('Runtime.evaluate',{expression:'window'});
 if(target.result?.exceptionDetails)throw new Error(JSON.stringify(target.result.exceptionDetails));
 const objectId=target.result?.result?.objectId;
 if(!objectId)throw new Error('CDP window object unavailable');
 try{
  const reply=await cdp('Runtime.callFunctionOn',{objectId,functionDeclaration,arguments:values.map(value=>({value})),returnByValue:true,awaitPromise:true});
  if(reply.result?.exceptionDetails)throw new Error(JSON.stringify(reply.result.exceptionDetails));
  return reply.result?.result?.value;
 }finally{await cdp('Runtime.releaseObject',{objectId})}
}
