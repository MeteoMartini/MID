import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const worker=read('../worker/metar-proxy.js'),app=read('../src/App.tsx'),client=read('../src/workerClient.ts'),workflow=read('../.github/workflows/deploy.yml');
const failures=[];
if(/if\(Number\(mapRate\)===0\)return 0/.test(worker)||/Number\.isFinite\(mapRate\).*Number\(mapRate\)===0.*return 0/.test(worker))failures.push('DWD-GetFeatureInfo wird bei Pixelwert 0 weiterhin übersprungen');
if(/if\(center>0\).*dwdPointRate/.test(worker))failures.push('DWD-Punktabfrage ist weiterhin an ein sichtbares Kartenecho gebunden');
if(!worker.includes("source:'feature-info'")||!worker.includes('featureInfoHits')||!worker.includes('analysedFrames'))failures.push('DWD-Punkt-/Fallback-Diagnostik fehlt');
if(!worker.includes('sample.length<=12'))failures.push('DWD-Subrequest-Begrenzung fehlt');
if(!app.includes('ageMinutes>35')||!app.includes('arrival>180')||!app.includes('Radarabgleich aktiv'))failures.push('3-h-/Aktualitätsgrenze des Radarabgleichs fehlt');
if(!app.includes('5*60*1000')||!app.includes("document.addEventListener('visibilitychange',visibility)"))failures.push('periodische Radaraktualisierung fehlt');
if(!client.includes("lastGoodKey(purpose)")||!client.includes('36*60*60*1000'))failures.push('zweckspezifischer Worker-Endpunktcache fehlt');
for(const token of['VITE_RADAR_PROXY_URL','VITE_WORKER_SAME_ORIGIN_PATH','VITE_WORKER_FALLBACK_URLS'])if(!workflow.includes(token))failures.push(`${token} fehlt im Pages-Build`);
if(failures.length){console.error('Radarprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Radarabgleich geprüft: DWD-Punktwert auch bei trocken wirkendem Kartenpixel, Subrequest-Grenze, 3-h-Korrekturfenster, 5-min-Aktualisierung und explizite Worker-Konfiguration vorhanden.');

// Integrationsprüfung des konkreten Fehlers: Die PNG-Farbabtastung meldet 0,
// GetFeatureInfo liefert jedoch 1,2 mm/h. Der Punktwert muss gewinnen.
const originalFetch=globalThis.fetch;
const transparentPng=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAIEAAACBCAYAAADnoNlQAAAAV0lEQVR4nO3BMQEAAADCoPVPbQwfoAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADgbASUAAGQVSZ9AAAAAElFTkSuQmCC','base64');
const base=Math.floor(Date.now()/300000)*300000,times=[-10,-5,0,5,10].map(minutes=>new Date(base+minutes*60000).toISOString()).join(',');
globalThis.fetch=async input=>{
 const url=new URL(typeof input==='string'?input:input.url),request=String(url.searchParams.get('request')||'').toLowerCase();
 if(request==='getcapabilities')return new Response(`<WMS_Capabilities><Capability><Layer><Layer><Name>dwd:Radar_rv_product_1x1km_ger</Name><Dimension name="time">${times}</Dimension></Layer></Layer></Capability></WMS_Capabilities>`,{status:200,headers:{'content-type':'application/xml'}});
 if(request==='getmap')return new Response(transparentPng,{status:200,headers:{'content-type':'image/png'}});
 if(request==='getfeatureinfo')return new Response('Results for FeatureType radar\nGRAY_INDEX = 1.2\n',{status:200,headers:{'content-type':'text/plain'}});
 throw new Error(`Unerwarteter Testabruf: ${url}`);
};
try{
 const module=await import('../worker/metar-proxy.js?radar-test='+Date.now());
 const response=await module.default.fetch(new Request('https://mid.test/?mode=radar-nowcast&lat=50.96&lon=7.65&country=DE'),{}),payload=await response.json();
 if(!response.ok||payload.source!=='dwd'||Number(payload.currentRate)<1.19||Number(payload.diagnostics?.featureInfoHits)<1||Number(payload.diagnostics?.mapFallbacks)!==0){
  console.error('Radar-Integrationstest fehlgeschlagen:',JSON.stringify(payload));process.exit(1);
 }
 console.log(`DWD-Integrationstest bestanden: Kartenpixel 0 mm/h wurde durch ${payload.currentRate} mm/h aus GetFeatureInfo korrigiert.`);
}finally{globalThis.fetch=originalFetch}
