async function dwdRucDualReadHealth(base,meta,env){
 const spec=meta.deterministic,page=spec?.pages,descriptor=page?.losslessV1;
 if(!descriptor)return {advertised:false};
 const keys=Object.keys(descriptor.chunks||{}),enabled=env?.MID_DWD_RUC_LOSSLESS_READ!=='disabled'&&descriptor.active===true;
 if(keys.length!==1||!/^\d+$/.test(keys[0])||Number(keys[0])>=page.chunkCount)return {advertised:true,verified:false,reason:'descriptor-invalid'};
 const index=Number(keys[0]),record=await dwdRucStaticRecord(base,spec,index*page.chunkRecords,enabled);
 return {advertised:true,readEnabled:enabled,verified:record?.midRucTransport==='byteplanes-gzip',transport:record?.midRucTransport||'unavailable',reason:record?.midRucCodecReason,chunkIndex:index,rawRetained:meta.pages?.losslessTransport?.rawRetained===true};
}
