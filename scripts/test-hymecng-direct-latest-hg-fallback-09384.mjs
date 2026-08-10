import {readFile} from 'node:fs/promises';
const [source,overlay,worker,baseline]=await Promise.all([
 readFile(new URL('../src/CompositeHymecNgSource.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/CompositeHymecNgOverlay.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(where,text,token)=>{if(!text.includes(token))failures.push(`${where}: fehlt ${token}`)},reject=(where,text,token)=>{if(text.includes(token))failures.push(`${where}: unerwünscht ${token}`)};
for(const token of [
 "const DWD_HYMECNG_LATEST='composite_HymecNG_LATEST_000-hd5'",
 "const DWD_HG_LATEST='HG_LATEST_000.bz2'",
 'dwdStableRadarFileProbe',
 'method:"HEAD"',
 "Range:'bytes=0-0'",
 "sourceMode:'latest-hdf5'",
 "legacyHgAvailable",
 'filename===DWD_HYMECNG_LATEST'
])need('Worker-HymecNG',worker,token);
for(const token of [
 'hdf5ObservedAt',
 'detectHymecNgClassEncoding',
 "'dry-zero'|'listed-order'",
 'HYMEC_NG_LISTED_ORDER_CLASSES',
 'Math.round(raw*raster.gain+raster.offset)',
 'möglicher DWD-/Proxy-Cache'
])need('HymecNG-HDF5',source,token);
need('HymecNG-HDF5',source,'classEncoding');
need('Overlay',overlay,'hymecNgClassForRaw');
reject('Overlay',overlay,'bounds:raster.bounds');
need('Baseline',baseline,'scripts/test-hymecng-direct-latest-hg-fallback-09384.mjs');

// Funktional: LATEST muss unabhängig vom HTML-Index den frischeren offiziellen Root wählen.
const realFetch=globalThis.fetch,now=Date.now();
globalThis.fetch=async(input,init={})=>{const url=new URL(typeof input==='string'?input:input.url),method=String(init.method||'GET').toUpperCase();
 if(url.pathname.endsWith('/composite_HymecNG_LATEST_000-hd5')){const secondary=url.hostname==='opendatao.dwd.de',last=new Date(now-(secondary?4:18)*60000).toUTCString();return new Response(method==='HEAD'?null:new Uint8Array([1]),{status:200,headers:{'last-modified':last,'content-length':'46000','etag':secondary?'"fresh"':'"old"'}})}
 if(url.pathname.endsWith('/HG_LATEST_000.bz2'))return new Response(null,{status:404});
 throw new Error(`Index darf bei frischem LATEST nicht benötigt werden: ${url}`)
};
try{const module=await import('../worker/metar-proxy.js?latest-hymec-test='+Date.now()),response=await module.default.fetch(new Request('https://mid.test/?mode=dwd-hymecng-meta'),{}),data=await response.json();
 if(!response.ok||!data.available||data.sourceMode!=='latest-hdf5'||data.filename!=='composite_HymecNG_LATEST_000-hd5'||!String(data.sourceRoot||'').includes('opendatao.dwd.de')||!String(data.fileUrl||'').includes('rev='))failures.push(`Direkter HymecNG-LATEST-Pfad fehlerhaft: ${JSON.stringify(data)}`)
}finally{globalThis.fetch=realFetch}

if(failures.length){console.error('HymecNG LATEST/HG-Fallback-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Direkter DWD-HymecNG-LATEST-HDF5-Pfad, Legacy-HG-Diagnose, interne HDF5-Zeit und bounds-freies natives Tile-Rendering geprüft.');
