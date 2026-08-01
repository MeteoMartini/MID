import {exportForecastVerificationArchive,importForecastVerificationArchive,type ForecastVerificationArchiveBundle,type ForecastVerificationArchiveStats} from './forecastVerification';
import {createDeviceSyncConfig,formatDeviceSyncCode,pushDeviceSync,pushWeatherTwinArchive,readDeviceSyncConfig,useDeviceSyncCode,type DeviceSyncConfig} from './deviceSync';
import {persistStateNow} from './persistence';
import {MID_VERSION} from './version';

const BACKUP_SCHEMA='mid-icloud-drive-backup';
const BACKUP_VERSION=2;
const LAST_BACKUP_KEY='mid:icloud-backup:last:v1';
const encoder=new TextEncoder();
const TRANSIENT_PREFIXES=['mid:analysis-cache:','mid:ensemble:','mid:worker:lastGood','mid:update','mid:runtime','mid:state-restored','mid:twin-background-'];
const SENSITIVE_PREFIXES=['mid:device-sync:','mid:connected-station:','mid:push-subscription','mid:web-push'];

export type ICloudBackupSummary={createdAt:string;appVersion:string;localEntries:number;weatherTwinLocations:number;captures:number;references:number;observations:number;bytes:number;syncIncluded?:boolean};
export type BackupSyncRecovery={enabled:true;syncKey:string};
export type MidICloudBackup={
 schema:typeof BACKUP_SCHEMA;
 version:1|2;
 createdAt:string;
 appVersion:string;
 platform:string;
 localState:{values:Record<string,string>};
 weatherTwin:ForecastVerificationArchiveBundle;
 syncRecovery?:BackupSyncRecovery;
 summary:Omit<ICloudBackupSummary,'bytes'>;
 integrity:string;
};
export type ICloudRestoreResult={summary:ICloudBackupSummary;weatherTwin:ForecastVerificationArchiveStats;sync:{enabled:boolean;code?:string;formattedCode?:string;uploaded:boolean;error?:string}};

function isDurableKey(key:string){
 if(!key)return false;
 if(!(['theme','windUnit'].includes(key)||key.startsWith('mid:')))return false;
 if(TRANSIENT_PREFIXES.some(prefix=>key.startsWith(prefix))||SENSITIVE_PREFIXES.some(prefix=>key.startsWith(prefix)))return false;
 return true;
}
function collectLocalState(){const values:Record<string,string>={};for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(!key||!isDurableKey(key))continue;const value=localStorage.getItem(key);if(value!==null)values[key]=value}return values}
function stablePayload(value:Omit<MidICloudBackup,'integrity'>){return JSON.stringify(value)}
async function digest(value:string){const hash=await crypto.subtle.digest('SHA-256',encoder.encode(value));return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('')}
function filename(createdAt:string){const safe=createdAt.replace(/[:.]/g,'-').replace('T','_').replace('Z','');return`MID-Sicherung_${safe}.midbackup`}
function platformLabel(){const nav=navigator as Navigator&{userAgentData?:{platform?:string}};return nav.userAgentData?.platform||navigator.platform||'Web'}
function backupMeta(summary:ICloudBackupSummary){try{localStorage.setItem(LAST_BACKUP_KEY,JSON.stringify(summary))}catch{}}
export function readLastICloudBackup():ICloudBackupSummary|null{try{const parsed=JSON.parse(localStorage.getItem(LAST_BACKUP_KEY)||'null') as ICloudBackupSummary|null;return parsed&&typeof parsed.createdAt==='string'?parsed:null}catch{return null}}
function syncRecoveryFromConfig(config:DeviceSyncConfig):BackupSyncRecovery|undefined{return config.enabled&&config.syncKey.length>=32?{enabled:true,syncKey:config.syncKey}:undefined}

export async function buildICloudBackup(){
 await persistStateNow();
 const weatherTwin=await exportForecastVerificationArchive(),createdAt=new Date().toISOString(),localState=collectLocalState(),syncRecovery=syncRecoveryFromConfig(readDeviceSyncConfig());
 const base:Omit<MidICloudBackup,'integrity'>={schema:BACKUP_SCHEMA,version:BACKUP_VERSION,createdAt,appVersion:MID_VERSION,platform:platformLabel(),localState:{values:localState},weatherTwin,...(syncRecovery?{syncRecovery}:{}),summary:{createdAt,appVersion:MID_VERSION,localEntries:Object.keys(localState).length,weatherTwinLocations:weatherTwin.counts.locations,captures:weatherTwin.counts.captures,references:weatherTwin.counts.references,observations:weatherTwin.counts.observations,syncIncluded:Boolean(syncRecovery)}};
 const integrity=await digest(stablePayload(base)),bundle:MidICloudBackup={...base,integrity},text=JSON.stringify(bundle),blob=new Blob([text],{type:'application/json'}),file=new File([blob],filename(createdAt),{type:'application/json',lastModified:Date.now()}),summary:ICloudBackupSummary={...base.summary,bytes:blob.size};
 return{bundle,file,summary};
}

export async function saveICloudBackup(){
 const{file,summary}=await buildICloudBackup();
 const shareNavigator=navigator as Navigator&{canShare?:(data:ShareData)=>boolean;share?:(data:ShareData)=>Promise<void>};
 if(shareNavigator.share&&(!shareNavigator.canShare||shareNavigator.canShare({files:[file]}))){
  await shareNavigator.share({title:'MID-Sicherung',text:'MID-Datensicherung – in „Dateien“ und anschließend in iCloud Drive sichern.',files:[file]});backupMeta(summary);return{mode:'share' as const,summary};
 }
 const url=URL.createObjectURL(file),anchor=document.createElement('a');anchor.href=url;anchor.download=file.name;anchor.rel='noopener';document.body.append(anchor);anchor.click();anchor.remove();window.setTimeout(()=>URL.revokeObjectURL(url),5000);backupMeta(summary);return{mode:'download' as const,summary};
}

function validateBundle(value:unknown):value is MidICloudBackup{const row=value as Partial<MidICloudBackup>|null;return Boolean(row&&row.schema===BACKUP_SCHEMA&&(row.version===1||row.version===2)&&typeof row.createdAt==='string'&&row.localState?.values&&typeof row.localState.values==='object'&&row.weatherTwin&&typeof row.integrity==='string')}
async function verifyBundle(bundle:MidICloudBackup){const{integrity,...base}=bundle,actual=await digest(stablePayload(base));if(actual!==integrity)throw new Error('Die Sicherungsdatei ist beschädigt oder unvollständig.');return bundle}
function replaceLocalState(values:Record<string,string>){const remove:string[]=[];for(let index=0;index<localStorage.length;index++){const key=localStorage.key(index);if(key&&isDurableKey(key)&&!(key in values))remove.push(key)}for(const key of remove)localStorage.removeItem(key);for(const[key,value]of Object.entries(values)){if(!isDurableKey(key)||typeof value!=='string')continue;localStorage.setItem(key,value)}}
function recoveryConfig(bundle:MidICloudBackup,prepareSync:boolean){if(!prepareSync)return null;const bundled=bundle.version>=2&&bundle.syncRecovery?.syncKey?bundle.syncRecovery.syncKey:'';if(bundled.length>=32)return useDeviceSyncCode(bundled);const current=readDeviceSyncConfig();if(current.enabled&&current.syncKey.length>=32)return current;return createDeviceSyncConfig()}

export async function restoreICloudBackup(file:File,options:{prepareDeviceSync?:boolean}={}):Promise<ICloudRestoreResult>{
 if(file.size>80*1024*1024)throw new Error('Die Sicherungsdatei ist größer als 80 MB und wird aus Sicherheitsgründen nicht importiert.');
 let parsed:unknown;try{parsed=JSON.parse(await file.text())}catch{throw new Error('Die Datei enthält keine gültige MID-Sicherung.')}if(!validateBundle(parsed))throw new Error('Diese Datei besitzt kein unterstütztes MID-Sicherungsformat.');const bundle=await verifyBundle(parsed);
 await persistStateNow();replaceLocalState(bundle.localState.values);const weatherTwin=await importForecastVerificationArchive(bundle.weatherTwin);const config=recoveryConfig(bundle,options.prepareDeviceSync!==false);let uploaded=false,syncError='';if(config){try{await pushDeviceSync(config);await pushWeatherTwinArchive(readDeviceSyncConfig(),true);uploaded=true}catch(error){syncError=error instanceof Error?error.message:String(error)}}await persistStateNow();
 const summary:ICloudBackupSummary={...bundle.summary,bytes:file.size};try{localStorage.setItem(LAST_BACKUP_KEY,JSON.stringify({...summary,restoredAt:new Date().toISOString()}))}catch{}const code=config?.syncKey;
 try{window.dispatchEvent(new CustomEvent('mid:backup-restored',{detail:{summary,weatherTwin,syncEnabled:Boolean(config),syncUploaded:uploaded}}))}catch{}
 return{summary,weatherTwin,sync:{enabled:Boolean(config),code,formattedCode:code?formatDeviceSyncCode(code):undefined,uploaded,error:syncError||undefined}};
}
