import {useEffect,useMemo,useState} from 'react';
import {BadgeCheck,RefreshCw,TriangleAlert,WifiOff} from 'lucide-react';
import {configuredWorkerBase,fetchWorkerJson,productiveMidWebRuntime} from './workerClient';

type LocationLike={latitude:number;longitude:number;name?:string;country?:string;region?:string;district?:string}|null;
type ProbeState='idle'|'loading'|'ok'|'warning'|'error'|'skipped';
type Probe={id:string;label:string;state:ProbeState;detail:string};
const EMPTY:Probe[]=[
 {id:'service',label:'MID-Datendienst',state:'idle',detail:'noch nicht geprüft'},
 {id:'warnings',label:'Amtliche Warnungen',state:'idle',detail:'noch nicht geprüft'},
 {id:'ruc',label:'ICON-D2-RUC',state:'idle',detail:'noch nicht geprüft'},
 {id:'run',label:'RUC-Modelllauf',state:'idle',detail:'noch nicht geprüft'},
 {id:'map',label:'Radar / Satellit',state:'idle',detail:'noch nicht geprüft'}
];
function message(error:unknown){const raw=error instanceof Error?error.message:String(error||'Unbekannter Verbindungsfehler'),lower=raw.toLowerCase();if(/403|blocked|blockiert|forbidden|inhaltsfilter|content.?filter/.test(lower))return 'Netzwerkfilter/HTTP 403 blockiert den Datenpfad.';if(/timeout|zeitüberschreitung|erreichbar/.test(lower))return 'MID-Datendienst nicht erreichbar oder Zeitüberschreitung.';return raw}
function endpointLabel(){const base=configuredWorkerBase('general');if(!base)return'kein Endpunkt';try{const url=new URL(base,location.href);return url.origin===location.origin?url.pathname+' · gleiche Domain':url.host}catch{return base}}
export function DataConnectionDiagnostics({location:place}:{location:LocationLike}){
 const[rows,setRows]=useState<Probe[]>(EMPTY),[busy,setBusy]=useState(false),[checkedAt,setCheckedAt]=useState('');
 const locationKey=useMemo(()=>place?place.latitude.toFixed(3)+':'+place.longitude.toFixed(3)+':'+String(place.country||''):'none',[place?.latitude,place?.longitude,place?.country]);
 const run=async()=>{setBusy(true);setRows(EMPTY.map(row=>({...row,state:'loading',detail:'wird geprüft …'})));const update=(id:string,state:ProbeState,detail:string)=>setRows(current=>current.map(row=>row.id===id?{...row,state,detail}:row));
  const perform=async(id:string,task:()=>Promise<{state?:ProbeState;detail:string}>)=>{try{const result=await task();update(id,result.state||'ok',result.detail)}catch(error){update(id,'error',message(error))}};
  await Promise.all([
   perform('service',async()=>{const data=await fetchWorkerJson<{error?:string;ok?:boolean;version?:string}>('health',{}, {purpose:'general',timeoutMs:7000,cache:'no-store'});if(data.ok!==true)throw new Error('Health-Antwort ist unvollständig.');return{detail:'erreichbar · Worker v'+String(data.version||'?')}}),
   place?perform('warnings',async()=>{const data=await fetchWorkerJson<{error?:string;alerts?:unknown[]}>('alerts',{lat:place.latitude,lon:place.longitude,country:place.country||'',language:'de',name:place.name||'',region:place.region||'',district:place.district||''},{purpose:'alerts',timeoutMs:9000,cache:'no-store'});return{detail:'Warnpfad erreichbar · '+String(data.alerts?.length||0)+' aktive Meldung(en)'}}):Promise.resolve(update('warnings','skipped','Standort erforderlich')),
   perform('ruc',async()=>{const data=await fetchWorkerJson<{error?:string;configured?:boolean;ready?:boolean;fresh?:boolean;run?:string;reason?:string}>('ruc-health',{}, {purpose:'general',timeoutMs:8000,cache:'no-store'});const good=data.configured===true&&data.ready===true&&data.fresh===true;return{state:good?'ok':'warning',detail:good?'frisch · Lauf '+String(data.run||'bestätigt'):String(data.reason||'RUC ist derzeit nicht frisch/bereit')}}),
   perform('run',async()=>{const data=await fetchWorkerJson<{error?:string;last_run_initialisation_time?:string}>('rapid-model-meta',{model:'icon-d2-ruc'},{purpose:'general',timeoutMs:8000,cache:'no-store'});return{detail:'Laufmetadaten erreichbar'+(data.last_run_initialisation_time?' · '+new Date(data.last_run_initialisation_time).toLocaleString('de-DE'):'')}}),
   place?perform('map',async()=>{const data=await fetchWorkerJson<{error?:string;dwdRadar?:unknown[];satelliteDay?:unknown[];satelliteIr?:unknown[]}>('composite-times',{lat:place.latitude,lon:place.longitude},{purpose:'radar',timeoutMs:9000,cache:'no-store'});const radar=Number(data.dwdRadar?.length||0),sat=Number(data.satelliteDay?.length||0)+Number(data.satelliteIr?.length||0);return{detail:'Produktkatalog erreichbar · Radar '+radar+' · Satellit '+sat}}):Promise.resolve(update('map','skipped','Standort erforderlich'))
  ]);setCheckedAt(new Date().toLocaleTimeString('de-DE',{hour:'2-digit',minute:'2-digit'}));setBusy(false)};
 useEffect(()=>{void run()},[locationKey]);
 return <section className="settings-section data-connection-diagnostics" aria-live="polite"><header><span>Netzwerk & Datenpfad</span><h3>Verbindungsdiagnose</h3><p>Prüft Warnungen, ICON-D2-RUC und Karten über den MID-Datendienst. Auf www.midwx.app ist der produktive Webpfad auf dieselbe Domain beschränkt.</p></header><div className="system-version-grid">{rows.map(row=><article key={row.id} data-state={row.state}><small>{row.label}</small><strong>{row.state==='loading'?'Prüfung …':row.state==='ok'?'Erreichbar':row.state==='warning'?'Eingeschränkt':row.state==='skipped'?'Nicht geprüft':'Blockiert/Fehler'}</strong><span>{row.state==='ok'?<BadgeCheck size={14}/>:row.state==='loading'?<RefreshCw size={14} className="spin"/>:row.state==='error'?<WifiOff size={14}/>:<TriangleAlert size={14}/>} {row.detail}</span></article>)}</div><div className="system-update-actions"><button type="button" className="primary" onClick={()=>void run()} disabled={busy}><RefreshCw size={16} className={busy?'spin':''}/><span>Verbindung erneut prüfen</span></button></div><small className="settings-inline-note">Datenendpunkt: {endpointLabel()} · Modus: {productiveMidWebRuntime()?'Same-Origin geschützt':'konfigurierter Plattformpfad'}{checkedAt?' · geprüft '+checkedAt:''}</small></section>
}
