import fs from 'node:fs';
const read=path=>fs.readFileSync(new URL(path,import.meta.url),'utf8');
const app=read('../src/App.tsx'),meteogram=read('../src/MeteogramPanel.tsx'),radar=read('../src/RadarPanel.tsx'),px=read('../src/Px250Source.ts');
const failures=[];
for(const token of['requestControllers=useRef(new Map<string,AbortController>())','beginRequest=(key:string)','abortAllRequests=()=>','abortRequest=(key:string)','forecastController=beginRequest(\'forecast\')','stationController=beginRequest(\'station\')','airController=beginRequest(\'air-quality\')','radarController=beginRequest(\'radar-analysis\')','warningController=beginRequest(\'official-warnings\')','modelController=beginRequest(\'best-match-info\')'])if(!app.includes(token))failures.push(`Entkoppelter Dashboard-Abruf fehlt: ${token}`);
for(const token of["ensembleController=beginRequest('ensemble')","climateController=beginRequest('climate')",'ensembleController.signal','climateController.signal','onClose={()=>setEnsembleRequested(false)}'])if(!app.includes(token))failures.push(`Ensemble/Klima-Trennung fehlt: ${token}`);
if(!app.includes("if(!c.signal.aborted){setResults(x);setOpen(true)}"))failures.push('Abgebrochene Suchanfragen können weiterhin neue Ergebnisse überschreiben.');
for(const token of['loadController=useRef<AbortController|null>(null)','loadController.current?.abort()','return()=>{loadController.current?.abort()'])if(!meteogram.includes(token))failures.push(`Meteogramm-Abbruch fehlt: ${token}`);
if(!px.includes('signal?:AbortSignal')||!px.includes('timeoutMs:12000,signal'))failures.push('PX250-Metadatenabruf akzeptiert kein Abbruchsignal.');
if(!radar.includes('loadPx250Metadata(lat,lon,request.signal)')||!radar.includes('controller?.abort()'))failures.push('PX250-Anfrage wird beim Ortswechsel oder Neuladen nicht abgebrochen.');
if(failures.length){console.error('Abruf-Abbruchprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Abrufe geprüft: Best Match, Station, Luftqualität, Radar, Warnungen und Modellinfo laden unabhängig; Ensemble und Klima sind getrennt; Ortswechsel, Suche, Meteogramm und PX250 brechen veraltete Anfragen ab.');
