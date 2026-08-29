import {exportForecastVerificationArchive,importForecastVerificationArchive,type ForecastVerificationArchiveBundle,type ForecastVerificationArchiveStats} from './forecastVerification';
import {createDeviceSyncConfig,formatDeviceSyncCode,pushDeviceSync,pushWeatherTwinArchive,readDeviceSyncConfig,useDeviceSyncCode,type DeviceSyncConfig} from './deviceSync';
import {persistStateNow} from './persistence';
import {MID_VERSION} from './version';
import {collectPortableUserData,replacePortableUserData} from './portableUserData';
import {shareOrExportMidFile} from './filePlatform';

const BACKUP_SCHEMA='mid-icloud-drive-backup';
const BACKUP_VERSION=3;
const LAST_BACKUP_KEY='mid:icloud-backup:last:v1';
const encoder=new TextEncoder();

export type ICloudBackupSummary={createdAt:string;appVersion:string;localEntries:number;weatherTwinLocations:number;captures:number;references:number;observations:number;bytes:number;syncIncluded?:boolean};
export type BackupSyncRecovery={enabled:boolean;syncKey:string};
export type MidICloudBackup={
 schema:typeof BACKUP_SCHEMA;
 version:1|2|3;
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

function collectLocalState(){return collectPortableUserData().values}
function stablePayload(value:Omit<MidICloudBackup,'integrity'>){return JSON.stringify(value)}
async function digest(value:string){const hash=await crypto.subtle.digest('SHA-256',encoder.encode(value));return Array.from(new Uint8Array(hash),byte=>byte.toString(16).padStart(2,'0')).join('')}
function filename(createdAt:string){const safe=createdAt.replace(/[:.]/g,'-').replace('T','_').replace('Z','');return`MID-Sicherung_${safe}.midbackup`}
function platformLabel(){const nav=navigator as Navigator&{userAgentData?:{platform?:string}};return nav.userAgentData?.platform||navigator.platform||'Web'}
function backupMeta(summary:ICloudBackupSummary){try{localStorage.setItem(LAST_BACKUP_KEY,JSON.stringify(summary))}catch{}}
export function readLastICloudBackup():ICloudBackupSummary|null{try{const parsed=JSON.parse(localStorage.getItem(LAST_BACKUP_KEY)||'null') as ICloudBackupSummary|null;return parsed&&typeof parsed.createdAt==='string'?parsed:null}catch{return null}}
function syncRecoveryFromConfig(config:DeviceSyncConfig):BackupSyncRecovery|undefined{return config.syncKey.length>=32?{enabled:config.enabled,syncKey:config.syncKey}:undefined}

export async function buildICloudBackup(){
 await persistStateNow();
 const weatherTwin=await exportForecastVerificationArchive(),createdAt=new Date().toISOString(),localState=collectLocalState(),syncRecovery=syncRecoveryFromConfig(readDeviceSyncConfig());
 const base:Omit<MidICloudBackup,'integrity'>={schema:BACKUP_SCHEMA,version:BACKUP_VERSION,createdAt,appVersion:MID_VERSION,platform:platformLabel(),localState:{values:localState},weatherTwin,...(syncRecovery?{syncRecovery}:{}),summary:{createdAt,appVersion:MID_VERSION,localEntries:Object.keys(localState).length,weatherTwinLocations:weatherTwin.counts.locations,captures:weatherTwin.counts.captures,references:weatherTwin.counts.references,observations:weatherTwin.counts.observations,syncIncluded:Boolean(syncRecovery)}};
 const integrity=await digest(stablePayload(base)),bundle:MidICloudBackup={...base,integrity},text=JSON.stringify(bundle),blob=new Blob([text],{type:'application/json'}),file=new File([blob],filename(createdAt),{type:'application/json',lastModified:Date.now()}),summary:ICloudBackupSummary={...base.summary,bytes:blob.size};
 return{bundle,file,summary};
}

export async function saveICloudBackup(){
 const{file,summary}=await buildICloudBackup();
 const transferMode=await shareOrExportMidFile({file,title:'MID-Sicherung',text:'MID-Datensicherung – in „Dateien“ und anschließend in iCloud Drive sichern.'});
 backupMeta(summary);return{mode:transferMode==='download'?'download' as const:'share' as const,transferMode,summary};
}

function validateBundle(value:unknown):value is MidICloudBackup{const row=value as Partial<MidICloudBackup>|null;return Boolean(row&&row.schema===BACKUP_SCHEMA&&(row.version===1||row.version===2||row.version===3)&&typeof row.createdAt==='string'&&row.localState?.values&&typeof row.localState.values==='object'&&row.weatherTwin&&typeof row.integrity==='string')}
async function verifyBundle(bundle:MidICloudBackup){const{integrity,...base}=bundle,actual=await digest(stablePayload(base));if(actual!==integrity)throw new Error('Die Sicherungsdatei ist beschädigt oder unvollständig.');return bundle}
function recoveryConfig(bundle:MidICloudBackup,prepareSync:boolean){if(!prepareSync)return null;const bundled=bundle.version>=2&&bundle.syncRecovery?.syncKey?bundle.syncRecovery.syncKey:'';if(bundled.length>=32)return useDeviceSyncCode(bundled);const current=readDeviceSyncConfig();if(current.syncKey.length>=32)return useDeviceSyncCode(current.syncKey);return createDeviceSyncConfig()}

export async function restoreICloudBackup(file:File,options:{prepareDeviceSync?:boolean}={}):Promise<ICloudRestoreResult>{
 if(file.size>80*1024*1024)throw new Error('Die Sicherungsdatei ist größer als 80 MB und wird aus Sicherheitsgründen nicht importiert.');
 let parsed:unknown;try{parsed=JSON.parse(await file.text())}catch{throw new Error('Die Datei enthält keine gültige MID-Sicherung.')}if(!validateBundle(parsed))throw new Error('Diese Datei besitzt kein unterstütztes MID-Sicherungsformat.');const bundle=await verifyBundle(parsed);
 await persistStateNow();replacePortableUserData(bundle.localState.values);const weatherTwin=await importForecastVerificationArchive(bundle.weatherTwin);const config=recoveryConfig(bundle,options.prepareDeviceSync!==false);let uploaded=false,syncError='';if(config){try{await pushDeviceSync(config);await pushWeatherTwinArchive(readDeviceSyncConfig(),true);uploaded=true}catch(error){syncError=error instanceof Error?error.message:String(error)}}await persistStateNow();
 const summary:ICloudBackupSummary={...bundle.summary,bytes:file.size};try{localStorage.setItem(LAST_BACKUP_KEY,JSON.stringify({...summary,restoredAt:new Date().toISOString()}))}catch{}const code=config?.syncKey;
 try{window.dispatchEvent(new CustomEvent('mid:backup-restored',{detail:{summary,weatherTwin,syncEnabled:Boolean(config),syncUploaded:uploaded}}))}catch{}
 return{summary,weatherTwin,sync:{enabled:Boolean(config),code,formattedCode:code?formatDeviceSyncCode(code):undefined,uploaded,error:syncError||undefined}};
}
