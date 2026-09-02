import {readFile,stat} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {createMidEccodesPointDecoder} from './adapter.mjs';

const [modulePath,gribPath,latRaw,lonRaw]=process.argv.slice(2);
if(!modulePath||!gribPath||latRaw==null||lonRaw==null)throw new Error('Usage: node benchmark.mjs <mid_eccodes.js> <sample.grib1> <lat> <lon>');
const createModule=(await import(new URL(modulePath,`file://${process.cwd()}/`))).default;
const wasmUrl=new URL('./mid_eccodes.wasm',new URL(modulePath,`file://${process.cwd()}/`));
const initStart=performance.now();
const module=await createModule({locateFile:name=>name.endsWith('.wasm')?wasmUrl.pathname:name});
const initMs=performance.now()-initStart,decoder=createMidEccodesPointDecoder(module),data=new Uint8Array(await readFile(gribPath));
const before=process.memoryUsage().rss,decodeStart=performance.now(),rows=decoder.decodeBuffer(data,Number(latRaw),Number(lonRaw)),decodeMs=performance.now()-decodeStart,after=process.memoryUsage().rss;
console.log(JSON.stringify({schema:'mid.knmi.harmonie-eps.wasm-benchmark.v1',sampleBytes:(await stat(gribPath)).size,messageCount:rows.length,initMs:Number(initMs.toFixed(3)),decodeMs:Number(decodeMs.toFixed(3)),rssDeltaBytes:after-before,first:rows[0]??null},null,2));
