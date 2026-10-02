/** Lossless maps retain all grid cells; output limits apply during inflation. */
export async function decodeNativeMapGzip(bytes:ArrayBuffer,expected:number){
 if(!Number.isInteger(expected)||expected<1||expected>12000000)throw new Error('Ungültige entpackte Rastergröße.');
 const chunks:Uint8Array[]=[];let size=0;
 const accept=(chunk:Uint8Array)=>{size+=chunk.byteLength;if(size>expected)throw new Error('Entpacktes Modellfeld überschreitet die geprüfte Größe.');chunks.push(chunk)};
 if(typeof DecompressionStream==='function'){
  const reader=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
  try{while(true){const next=await reader.read();if(next.done)break;accept(next.value)}}catch(error){await reader.cancel().catch(()=>undefined);throw error}finally{reader.releaseLock()}
 }else{
  // Existing pinned decoder, loaded only on older Safari/WebViews.
  const {Inflate}=await import('pako'),inflater=new Inflate({chunkSize:65536});inflater.onData=accept;inflater.push(new Uint8Array(bytes),true);
  if(inflater.err||!inflater.ended)throw new Error('Komprimiertes Modellfeld konnte nicht entpackt werden.');
 }
 if(size!==expected)throw new Error('Entpacktes Modellfeld ist unvollständig.');
 const result=new Uint8Array(size);let offset=0;for(const chunk of chunks){result.set(chunk,offset);offset+=chunk.byteLength}return new TextDecoder().decode(result);
}
