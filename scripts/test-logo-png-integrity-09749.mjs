import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {inflateSync} from 'node:zlib';

const root=new URL('../',import.meta.url);
const read=relative=>readFile(new URL(relative,root));
const text=async relative=>(await read(relative)).toString('utf8');
const test='scripts/test-logo-png-integrity-09749.mjs';
const PNG_SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){
    crc^=byte;
    for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^0xffffffff)>>>0;
}

function validatePng(buffer,path,expectedWidth,expectedHeight){
  assert.ok(buffer.length>=33,`${path}: PNG ist zu kurz.`);
  assert.deepEqual(buffer.subarray(0,8),PNG_SIGNATURE,`${path}: PNG-Signatur ist ungültig.`);
  let offset=8,ihdr=null,sawIend=false;
  const idat=[];
  while(offset<buffer.length){
    assert.ok(offset+12<=buffer.length,`${path}: abgeschnittener PNG-Chunk-Header bei Byte ${offset}.`);
    const length=buffer.readUInt32BE(offset);
    const type=buffer.toString('ascii',offset+4,offset+8);
    const dataStart=offset+8,dataEnd=dataStart+length,crcOffset=dataEnd,next=crcOffset+4;
    assert.ok(next<=buffer.length,`${path}: Chunk ${type} ist abgeschnitten.`);
    const data=buffer.subarray(dataStart,dataEnd);
    const storedCrc=buffer.readUInt32BE(crcOffset);
    const actualCrc=crc32(Buffer.concat([Buffer.from(type,'ascii'),data]));
    assert.equal(storedCrc,actualCrc,`${path}: CRC-Fehler in PNG-Chunk ${type}.`);
    if(type==='IHDR'){
      assert.equal(offset,8,`${path}: IHDR muss der erste PNG-Chunk sein.`);
      assert.equal(length,13,`${path}: IHDR-Länge ist ungültig.`);
      ihdr={width:data.readUInt32BE(0),height:data.readUInt32BE(4)};
    }else if(type==='IDAT')idat.push(data);
    else if(type==='IEND'){
      assert.equal(length,0,`${path}: IEND muss leer sein.`);
      sawIend=true;
      assert.equal(next,buffer.length,`${path}: Daten hinter IEND sind nicht zulässig.`);
      offset=next;
      break;
    }
    offset=next;
  }
  assert.ok(ihdr,`${path}: IHDR fehlt.`);
  assert.deepEqual(ihdr,{width:expectedWidth,height:expectedHeight},`${path}: unerwartete Abmessungen.`);
  assert.ok(idat.length>0,`${path}: IDAT fehlt.`);
  assert.ok(sawIend,`${path}: abschließender IEND-Chunk fehlt.`);
  const inflated=inflateSync(Buffer.concat(idat));
  assert.ok(inflated.length>0,`${path}: IDAT lässt sich nicht vollständig dekomprimieren.`);
}

const [splashCatalog,appIconCatalog,pkg,baseline]=await Promise.all([
  text('ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'),
  text('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json'),
  text('package.json'),
  text('MID_BASELINE.json')
]);
const splash=JSON.parse(splashCatalog),appIcons=JSON.parse(appIconCatalog);
const splashFiles=splash.images.map(image=>image.filename).filter(Boolean);
assert.deepEqual([...splashFiles].sort(),[
  'splash-dark-2732x2732-1x.png','splash-light-2732x2732-1x.png'
].sort(),'Native Splash-Katalogbelegung ist unvollständig.');
assert.ok(splash.images.every(image=>image.scale==='1x'),'Splash-Katalog muss je Appearance genau eine volle 2732×2732-Quelle verwenden.');
for(const file of splashFiles)validatePng(await read(`ios/App/App/Assets.xcassets/Splash.imageset/${file}`),file,2732,2732);
for(const file of appIcons.images.map(image=>image.filename).filter(Boolean))validatePng(await read(`ios/App/App/Assets.xcassets/AppIcon.appiconset/${file}`),file,1024,1024);

const packageJson=JSON.parse(pkg),baselineJson=JSON.parse(baseline);
assert.equal(packageJson.version,baselineJson.releaseVersion,'PNG-Integritätsvertrag muss der Baseline-Version folgen.');
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baselineJson[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of splashFiles.map(name=>`ios/App/App/Assets.xcassets/Splash.imageset/${name}`))assert.ok(baselineJson.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);
assert.ok(baselineJson.requiredFiles?.includes('MID_IMPLEMENTATION_0.9.74.9.md'),'Umsetzungsnachweis v0.9.74.9 fehlt in requiredFiles.');
console.log('Native MID-Brand-PNGs geprüft: vollständige Chunk-/CRC-/IEND-/IDAT-Integrität für Light/Dark Splash und AppIcon.');
