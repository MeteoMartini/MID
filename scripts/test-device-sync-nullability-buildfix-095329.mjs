import {readFile,writeFile,rm,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createRequire} from 'node:module';

const require=createRequire(import.meta.url);
let ts;
try{ts=require('typescript')}catch{ts=require('/opt/nvm/versions/node/v22.16.0/lib/node_modules/typescript')}

const source=await readFile(new URL('../src/deviceSync.ts',import.meta.url),'utf8');
const failures=[];
const need=(token,message)=>{if(!source.includes(token))failures.push(message)};
need('function favoriteSnapshotInput(primaryRaw:string|undefined|null,shadowRaw:string|undefined|null):string|undefined','favoriteSnapshotInput normalisiert den fehlenden Snapshot nicht mehr an der Sync-Grenze auf undefined.');
need('return shadowRaw??primaryRaw??undefined','Ein vollständig fehlender Primär-/Shadow-Snapshot kann erneut null in den Merge-Pfad tragen.');
need('function mergeFavoriteSnapshots(remoteRaw:string|undefined|null,localRaw:string|undefined|null,','Der Favoriten-Merge akzeptiert fehlende Remote-/Local-Snapshots nicht explizit.');
need('if(!remote&&!local)return{value:remoteRaw??undefined,','Der Merge kann bei vollständig fehlenden Favoritendaten erneut null in SyncSnapshot.values zurückgeben.');
need('mergedFavorites=mergeFavoriteSnapshots(remoteFavorites,localFavorites,','Der zentrale Snapshot-Apply-Pfad verwendet nicht mehr den geschützten Favoriten-Merge.');

const dir=await mkdtemp(join(tmpdir(),'mid-device-sync-nullability-'));
try{
 await writeFile(join(dir,'deviceSync.ts'),source);
 await writeFile(join(dir,'forecastVerification.ts'),`export type ForecastVerificationArchiveStats={locations:number;captures:number;references:number;observations:number;updatedAt:string};\ntype Store={version:number;captures:unknown[];references:unknown[];observations:unknown[]};
export type ForecastVerificationArchiveBundle={schema:'mid-weather-twin-archive';version:1;updatedAt:string;locations:Record<string,Store>;counts:{locations:number;captures:number;references:number;observations:number}};\nexport async function exportForecastVerificationArchive():Promise<ForecastVerificationArchiveBundle>{throw new Error()}\nexport async function importForecastVerificationArchive(_bundle:ForecastVerificationArchiveBundle):Promise<ForecastVerificationArchiveStats>{throw new Error()}\n`);
 await writeFile(join(dir,'workerClient.ts'),`export function buildWorkerUrl(base:string,mode:string){return base+mode}\nexport function workerBaseCandidates(_kind:string):string[]{return[]}\n`);
 await writeFile(join(dir,'portableUserData.ts'),`export function collectPortableUserData():{values:Record<string,string>}{return{values:{}}}\nexport function isPortableUserDataKey(_key:string):boolean{return true}\nexport function replacePortableUserData(_values:Record<string,string>,_storage:Storage,_v2:boolean):boolean{return false}\n`);
 await writeFile(join(dir,'eventFavoriteState.ts'),`export function eventFavoriteRevision(_value:unknown):number{return 0}\n`);
 const options={strict:true,noEmit:true,target:ts.ScriptTarget.ES2023,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,skipLibCheck:true,types:[],lib:['lib.es2023.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts']};
 const program=ts.createProgram([join(dir,'deviceSync.ts')],options);
 const diagnostics=ts.getPreEmitDiagnostics(program).filter(item=>item.file?.fileName.startsWith(dir));
 if(diagnostics.length)failures.push(...diagnostics.map(item=>{const pos=item.file&&item.start!==undefined?item.file.getLineAndCharacterOfPosition(item.start):null;return`TypeScript ${item.code}${pos?` ${item.file.fileName.split('/').at(-1)}:${pos.line+1}:${pos.character+1}`:''}: ${ts.flattenDiagnosticMessageText(item.messageText,' ')}`}));
}finally{await rm(dir,{recursive:true,force:true})}

if(failures.length){console.error('Geräte-Sync-Nullability-Buildfix fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Geräte-Sync-Nullability geprüft: der vollständige deviceSync.ts-Pfad kompiliert im Strict-Modus mit typisierten Schnittstellenstubs; fehlende Favoritensnapshots bleiben verlustfrei und null-sicher.');
