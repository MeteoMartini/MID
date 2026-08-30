import {readFileSync} from 'node:fs';

const worker=readFileSync(new URL('../worker/metar-proxy.js',import.meta.url),'utf8');
const deviceSync=readFileSync(new URL('../src/deviceSync.ts',import.meta.url),'utf8');
const failures=[];

for(const token of [
  "const PUSH_DEFAULT_ORIGINS=['https://meteomartini.github.io','https://midwx.app','https://www.midwx.app'];",
  "function pushNormaliseOrigin(value)",
  "return[...new Set([...PUSH_DEFAULT_ORIGINS,...configured].map(pushNormaliseOrigin).filter(Boolean))]",
  "const origin=pushNormaliseOrigin(request.headers.get('origin'))"
])if(!worker.includes(token))failures.push(`Worker fehlt: ${token}`);

if(!deviceSync.includes("Synchronisationsdienst ist nicht erreichbar."))failures.push('Nutzerverständliche Frontend-Diagnose für einen nicht erreichbaren Synchronisationsdienst fehlt.');

const start=worker.indexOf("const PUSH_DEFAULT_ORIGINS=");
const end=worker.indexOf("function pushB64Decode",start);
if(start<0||end<0)failures.push('Origin-Funktionsblock konnte nicht extrahiert werden.');
else{
  const block=worker.slice(start,end);
  try{
    const factory=new Function(`${block};return {pushOrigins,pushOriginAllowed};`);
    const {pushOrigins,pushOriginAllowed}=factory();
    const defaults=pushOrigins({});
    for(const origin of ['https://midwx.app','https://www.midwx.app','https://meteomartini.github.io'])if(!defaults.includes(origin))failures.push(`Standard-Origin fehlt: ${origin}`);
    const configured=pushOrigins({MID_ALLOWED_ORIGINS:'https://example.test/'});
    if(!configured.includes('https://example.test'))failures.push('Konfigurierter Origin wird nicht normalisiert übernommen.');
    if(!configured.includes('https://midwx.app'))failures.push('Konfiguration verdrängt den eingebauten midwx.app-Origin.');
    const request={headers:{get:(name)=>name.toLowerCase()==='origin'?'https://midwx.app':null}};
    if(!pushOriginAllowed(request,{MID_ALLOWED_ORIGINS:'https://example.test'}))failures.push('midwx.app wird trotz zusätzlicher Konfiguration abgewiesen.');
  }catch(error){failures.push(`Origin-Funktionstest fehlgeschlagen: ${error instanceof Error?error.message:String(error)}`)}
}

if(failures.length){console.error('MID-Synchronisations-Origin-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('midwx.app und www.midwx.app sind im Synchronisations-Worker dauerhaft freigegeben; zusätzliche Origins werden ergänzt statt ersetzt.');
