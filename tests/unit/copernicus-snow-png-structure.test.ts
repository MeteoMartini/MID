import {describe,expect,it,vi,afterEach} from 'vitest';
import {validateCopernicusSnowPngStructure,fetchVerifiedCopernicusSnowPng} from '../../src/copernicusSnowDelivery';
import {COPERNICUS_SNOW_COLLECTIONS} from '../../src/copernicusSnowObservation';

// Structural PNG fixtures only: source COG pixels and actual mask QA are NOT claimed.
const signature=Uint8Array.of(137,80,78,71,13,10,26,10);
function concat(...parts:Uint8Array[]):Uint8Array{
 const result=new Uint8Array(parts.reduce((sum,p)=>sum+p.length,0));let offset=0;
 for(const part of parts){result.set(part,offset);offset+=part.length}
 return result;
}
function chunk(type:string,data:Uint8Array):Uint8Array{
 const result=new Uint8Array(12+data.length),view=new DataView(result.buffer);
 view.setUint32(0,data.length);
 for(let i=0;i<4;i++)result[4+i]=type.charCodeAt(i);
 result.set(data,8);
 let crc=0xffffffff;
 for(let i=4;i<8+data.length;i++){
  crc^=result[i];
  for(let bit=0;bit<8;bit++)crc=(crc>>>1)^(0xedb88320&-(crc&1));
 }
 view.setUint32(8+data.length,(crc^0xffffffff)>>>0);
 return result;
}
function ihdr(width=1,height=1,mode=6,depth=8,interlace=0):Uint8Array{
 const data=new Uint8Array(13),view=new DataView(data.buffer);
 view.setUint32(0,width);view.setUint32(4,height);
 data[8]=depth;data[9]=mode;data[12]=interlace;
 return chunk('IHDR',data);
}
const data=()=>chunk('IDAT',Uint8Array.of(120,156,99,96,0,2,0,0,5,0,1));
const end=()=>chunk('IEND',new Uint8Array());
const png=(width=1,height=1,mode=6,depth=8,interlace=0)=>
 concat(signature,ihdr(width,height,mode,depth,interlace),data(),end());
afterEach(()=>vi.unstubAllGlobals());
describe('Copernicus PNG raster envelope (never a COG/QA approval)',()=>{
 it('admits a bounded, structurally complete non-interlaced RGBA8 envelope',()=>{
  expect(()=>validateCopernicusSnowPngStructure(png())).not.toThrow();
  expect(()=>validateCopernicusSnowPngStructure(png(4096,2048))).not.toThrow();
 });
 it('rejects compressed-to-huge pixel bombs, palette/RGB without alpha and 16-bit/interlaced tiles',()=>{
  for(const candidate of [png(4096,4096),png(4097,1),png(0,1),png(1,1,2),png(1,1,3),png(1,1,6,16),png(1,1,6,8,1)])
   expect(()=>validateCopernicusSnowPngStructure(candidate)).toThrow();
 });
 it('rejects corrupted signature, IHDR CRC, truncated chunks and trailing bytes',()=>{
  const badMagic=png();badMagic[0]=0;
  const badCrc=png();badCrc[29]^=1;
  const badLength=png();badLength[11]=255;
  for(const candidate of [badMagic,badCrc,badLength,png().slice(0,-1),concat(png(),Uint8Array.of(0))])
   expect(()=>validateCopernicusSnowPngStructure(candidate)).toThrow();
 });
 it('rejects animation, unknown critical chunks, duplicate header and split IDAT',()=>{
  const candidates=[
   concat(signature,ihdr(),chunk('acTL',Uint8Array.of(1)),data(),end()),
   concat(signature,ihdr(),chunk('TEST',Uint8Array.of(1)),data(),end()),
   concat(signature,ihdr(),ihdr(),data(),end()),
   concat(signature,ihdr(),data(),chunk('tEXt',Uint8Array.of(1)),data(),end()),
   concat(signature,ihdr(),end()),
  ];
  for(const candidate of candidates)expect(()=>validateCopernicusSnowPngStructure(candidate)).toThrow();
 });
 it('stops an oversized network stream before digest or PNG decoding',async()=>{
  const key='a'.repeat(64);
  const tile={
   schema:'mid.copernicus.alpine-snow-tile.v1',productionApproved:true,
   kind:'GFSC',collectionId:COPERNICUS_SNOW_COLLECTIONS.GFSC,
   productDayUtc:new Date().toISOString().slice(0,10),
   mapProjection:'EPSG:4326',reprojectionMethod:'nearest-neighbor',
   bounds:[[46,10],[47,11]],imagePath:'/snow/validated/'+key+'/tile.png',
   imageSha256:key,compressedBytes:100,sourceCogSha256:key,qaMaskSha256:key,
   qaFlagsDecoded:true,cloudsAndWaterTransparent:true,noDataTransparent:true,
   validZeroColorEncoded:true,maxPixelAcquisitionAgeDays:7,
   citation:'Copernicus Land Monitoring Service'
  } as const;
  const stream=new ReadableStream<Uint8Array>({start(controller){
   controller.enqueue(new Uint8Array(101));controller.close();
  }});
  const digest=vi.fn();
  vi.stubGlobal('crypto',{subtle:{digest}});
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue({
   ok:true,headers:new Headers({'content-type':'image/png'}),body:stream
  }));
  await expect(fetchVerifiedCopernicusSnowPng(tile as never,new AbortController().signal))
   .rejects.toThrow('attested byte budget');
  expect(digest).not.toHaveBeenCalled();
 });
});
