const OUT_DOUBLE_COUNT=4;
const OUT_INT_COUNT=6;

function finiteCoordinate(value,min,max,label){
 const number=Number(value);
 if(!Number.isFinite(number)||number<min||number>max)throw new RangeError(`${label} liegt außerhalb des gültigen Bereichs.`);
 return number;
}

export function splitGrib1Messages(input){
 const data=input instanceof Uint8Array?input:new Uint8Array(input);
 const messages=[];
 for(let cursor=0;cursor+12<=data.byteLength;){
  let start=-1;
  for(let index=cursor;index+4<=data.byteLength;index++)if(data[index]===0x47&&data[index+1]===0x52&&data[index+2]===0x49&&data[index+3]===0x42){start=index;break}
  if(start<0)break;
  if(start+8>data.byteLength)throw new Error('Abgeschnittene GRIB-Kennung.');
  if(data[start+7]!==1)throw new Error('KNMI-P4a-Prototyp akzeptiert ausschließlich GRIB1.');
  const length=(data[start+4]<<16)|(data[start+5]<<8)|data[start+6];
  if(length<12||start+length>data.byteLength)throw new Error('Ungültige GRIB1-Nachrichtenlänge.');
  const end=start+length;
  if(data[end-4]!==0x37||data[end-3]!==0x37||data[end-2]!==0x37||data[end-1]!==0x37)throw new Error('GRIB1-Nachricht besitzt keinen 7777-Abschluss.');
  messages.push(data.slice(start,end));
  cursor=end;
 }
 if(!messages.length)throw new Error('Keine GRIB1-Nachricht gefunden.');
 return messages;
}

export function createMidEccodesPointDecoder(module){
 if(!module||typeof module._malloc!=='function'||typeof module._free!=='function'||typeof module._mid_grib1_nearest!=='function')throw new Error('Ungültiges MID-ecCodes-Wasm-Modul.');
 const decodeMessage=(message,latitude,longitude)=>{
  const data=message instanceof Uint8Array?message:new Uint8Array(message),lat=finiteCoordinate(latitude,-90,90,'latitude'),lon=finiteCoordinate(longitude,-180,180,'longitude');
  const messagePtr=module._malloc(data.byteLength),doublePtr=module._malloc(OUT_DOUBLE_COUNT*8),intPtr=module._malloc(OUT_INT_COUNT*4);
  try{
   module.HEAPU8.set(data,messagePtr);
   const rc=module._mid_grib1_nearest(messagePtr,data.byteLength,lat,lon,doublePtr,doublePtr+8,doublePtr+16,doublePtr+24,intPtr,intPtr+4,intPtr+8,intPtr+12,intPtr+16,intPtr+20);
   if(rc!==0)throw new Error(`ecCodes-Wasm nearest-point decode scheiterte (${rc}).`);
   const d=doublePtr>>3,i=intPtr>>2;
   return{value:module.HEAPF64[d],latitude:module.HEAPF64[d+1],longitude:module.HEAPF64[d+2],distanceKm:module.HEAPF64[d+3],index:module.HEAP32[i],indicatorOfParameter:module.HEAP32[i+1],indicatorOfTypeOfLevel:module.HEAP32[i+2],level:module.HEAP32[i+3],timeRangeIndicator:module.HEAP32[i+4],member:module.HEAP32[i+5]};
  }finally{module._free(intPtr);module._free(doublePtr);module._free(messagePtr)}
 };
 return{decodeMessage,decodeBuffer(input,latitude,longitude){return splitGrib1Messages(input).map(message=>decodeMessage(message,latitude,longitude))}};
}
