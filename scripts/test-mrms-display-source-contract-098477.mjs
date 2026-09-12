import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=rel=>readFile(path.join(root,rel),'utf8');
const [radarPanel,compositeData,radarWorker]=await Promise.all([
  read('src/RadarPanel.tsx'),
  read('src/CompositeData.ts'),
  read('worker-src/10-radar-nowcast.js'),
]);
const failures=[];
const need=(text,token,msg)=>{if(!text.includes(token))failures.push(msg)};

// MRMS is currently an official site/nowcast analysis adapter, not a rendered map-raster source.
need(radarWorker,"source:'mrms'",'MRMS worker source is missing.');
need(radarWorker,'MID_NOAA_MRMS_POINT_ENDPOINT','MRMS point/nowcast adapter is missing.');
need(radarPanel,"if(analysisSource==='mrms'||expected.includes('mrms'))return'rainviewer'",'MRMS analysis must use the explicit RainViewer raster fallback until an MRMS raster renderer exists.');
need(radarPanel,"analysis?.source==='mrms'",'MRMS analysis is not surfaced separately in the composite data information.');
need(radarPanel,"label:'Standortanalyse'",'Composite information does not distinguish MRMS site analysis from the displayed radar raster.');
need(radarPanel,"NOAA / NSSL MRMS",'MRMS provider label is missing from the composite information.');

// CompositeSource intentionally describes sources that RadarPanel can actually render as a radar layer.
if(/export type CompositeSource=[^\n]*'mrms'/.test(compositeData))failures.push('CompositeSource must not claim MRMS raster rendering before an MRMS raster renderer exists.');
if(/activeSource==='mrms'/.test(radarPanel))failures.push('RadarPanel must not select an unimplemented MRMS raster layer.');

if(failures.length){console.error('MRMS display-source contract v0.9.84.77 failed:\n- '+failures.join('\n- '));process.exit(1)}
console.log('MRMS contract checked: official MRMS site analysis remains primary in the US, while the visible radar raster falls back explicitly to RainViewer until a dedicated MRMS raster renderer is available.');
