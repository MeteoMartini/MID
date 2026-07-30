/**
 * Compact QR encoder for MID synchronization links.
 * Fixed QR version 8-L (49×49 modules, 194 data bytes) keeps the implementation
 * small and avoids sending the synchronization secret to an external QR service.
 */
const VERSION=8;
const SIZE=VERSION*4+17;
const DATA_CODEWORDS=194;
const BLOCK_DATA=97;
const EC_CODEWORDS=24;
const PAD0=0xec;
const PAD1=0x11;
const ALIGNMENT=[6,24,42];

type Cell=boolean|null;

class Bits{
 private values:number[]=[];
 push(value:number,length:number){for(let shift=length-1;shift>=0;shift--)this.values.push((value>>>shift)&1)}
 get length(){return this.values.length}
 toBytes(){const bytes=new Uint8Array(Math.ceil(this.values.length/8));for(let index=0;index<this.values.length;index++)if(this.values[index])bytes[index>>>3]|=0x80>>>(index&7);return bytes}
}

const EXP=new Uint8Array(512),LOG=new Uint8Array(256);
let value=1;
for(let index=0;index<255;index++){EXP[index]=value;LOG[value]=index;value<<=1;if(value&0x100)value^=0x11d}
for(let index=255;index<512;index++)EXP[index]=EXP[index-255];
function multiply(a:number,b:number){return a&&b?EXP[LOG[a]+LOG[b]]:0}
function generator(degree:number){let poly=[1];for(let index=0;index<degree;index++){const next=new Array(poly.length+1).fill(0);for(let j=0;j<poly.length;j++){next[j]^=poly[j];next[j+1]^=multiply(poly[j],EXP[index])}poly=next}return poly}
function errorCorrection(data:Uint8Array,degree:number){const gen=generator(degree),result=new Uint8Array(degree);for(const byte of data){const factor=byte^result[0];result.copyWithin(0,1);result[degree-1]=0;if(factor)for(let index=0;index<degree;index++)result[index]^=multiply(gen[index+1],factor)}return result}
function bch(value:number,poly:number){let shifted=value;const digit=(input:number)=>{let count=0;while(input){count++;input>>>=1}return count};while(digit(shifted)>=digit(poly))shifted^=poly<<(digit(shifted)-digit(poly));return shifted}
function formatBits(mask:number){const raw=(1<<3)|mask;return((raw<<10)|bch(raw<<10,0x537))^0x5412}
function versionBits(){return(VERSION<<12)|bch(VERSION<<12,0x1f25)}

function dataCodewords(text:string){const payload=new TextEncoder().encode(text);if(payload.length>190)throw new Error('Der Synchronisationslink ist für den lokalen QR-Code zu lang.');const bits=new Bits();bits.push(0b0100,4);bits.push(payload.length,8);for(const byte of payload)bits.push(byte,8);const capacity=DATA_CODEWORDS*8;bits.push(0,Math.min(4,capacity-bits.length));while(bits.length%8)bits.push(0,1);const bytes=Array.from(bits.toBytes());let pad=0;while(bytes.length<DATA_CODEWORDS)bytes.push(pad++%2?PAD1:PAD0);return Uint8Array.from(bytes)}
function interleavedCodewords(text:string){const data=dataCodewords(text),blocks=[data.slice(0,BLOCK_DATA),data.slice(BLOCK_DATA)],ec=blocks.map(block=>errorCorrection(block,EC_CODEWORDS)),output:number[]=[];for(let index=0;index<BLOCK_DATA;index++)for(const block of blocks)output.push(block[index]);for(let index=0;index<EC_CODEWORDS;index++)for(const block of ec)output.push(block[index]);return Uint8Array.from(output)}

function matrix(text:string){const modules:Cell[][]=Array.from({length:SIZE},()=>Array<Cell>(SIZE).fill(null));
 const set=(row:number,col:number,dark:boolean)=>{if(row>=0&&row<SIZE&&col>=0&&col<SIZE)modules[row][col]=dark};
 const finder=(row:number,col:number)=>{for(let r=-1;r<=7;r++)for(let c=-1;c<=7;c++){const inside=r>=0&&r<=6&&c>=0&&c<=6,dark=inside&&(r===0||r===6||c===0||c===6||(r>=2&&r<=4&&c>=2&&c<=4));set(row+r,col+c,dark)}};
 finder(0,0);finder(SIZE-7,0);finder(0,SIZE-7);
 for(const row of ALIGNMENT)for(const col of ALIGNMENT){if(modules[row][col]!==null)continue;for(let r=-2;r<=2;r++)for(let c=-2;c<=2;c++)set(row+r,col+c,Math.max(Math.abs(r),Math.abs(c))!==1)}
 for(let index=8;index<SIZE-8;index++){if(modules[index][6]===null)set(index,6,index%2===0);if(modules[6][index]===null)set(6,index,index%2===0)}
 const version=versionBits();for(let index=0;index<18;index++){const dark=((version>>>index)&1)===1;set(Math.floor(index/3),index%3+SIZE-11,dark);set(index%3+SIZE-11,Math.floor(index/3),dark)}
 const format=formatBits(0);for(let index=0;index<15;index++){const dark=((format>>>index)&1)===1;if(index<6)set(index,8,dark);else if(index<8)set(index+1,8,dark);else set(SIZE-15+index,8,dark);if(index<8)set(8,SIZE-index-1,dark);else if(index<9)set(8,15-index,dark);else set(8,15-index-1,dark)}set(SIZE-8,8,true);
 const code=interleavedCodewords(text);let byteIndex=0,bitIndex=7,row=SIZE-1,direction=-1;for(let col=SIZE-1;col>0;col-=2){if(col===6)col--;while(true){for(let offset=0;offset<2;offset++){const currentCol=col-offset;if(modules[row][currentCol]!==null)continue;let dark=false;if(byteIndex<code.length)dark=((code[byteIndex]>>>bitIndex)&1)===1;const masked=((row+currentCol)&1)===0;modules[row][currentCol]=masked?!dark:dark;if(--bitIndex<0){byteIndex++;bitIndex=7}}row+=direction;if(row<0||row>=SIZE){row-=direction;direction=-direction;break}}}
 return modules as boolean[][];
}

function escapeAttribute(value:string){return value.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]||char))}
export function createQrSvg(text:string,title='MID-Synchronisation'){const modules=matrix(text),margin=4,size=SIZE+margin*2,path:string[]=[];for(let row=0;row<SIZE;row++)for(let col=0;col<SIZE;col++)if(modules[row][col])path.push(`M${col+margin} ${row+margin}h1v1h-1z`);return`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" role="img" aria-label="${escapeAttribute(title)}" shape-rendering="crispEdges"><title>${escapeAttribute(title)}</title><rect width="100%" height="100%" fill="#fff"/><path d="${path.join('')}" fill="#000"/></svg>`}
export function createQrMatrix(text:string){return matrix(text)}
