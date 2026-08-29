import {isMidNativeRuntime} from './runtimePlatform';

export type MidFileTransferMode='native-share'|'web-share'|'download';
export type MidFilePickerMode='native-document-picker'|'browser-file-picker';
export type MidShareFileOptions={file:File;title:string;text?:string};

function downloadFile(file:File){
 const url=URL.createObjectURL(file),anchor=document.createElement('a');
 anchor.href=url;anchor.download=file.name;anchor.rel='noopener';document.body.append(anchor);anchor.click();anchor.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),5000);
}
function pluginFallbackAllowed(reason:unknown){const code=typeof reason==='object'&&reason!==null&&'code'in reason?String((reason as{code?:unknown}).code).toUpperCase():'';return code.includes('UNIMPLEMENTED')||code.includes('UNAVAILABLE')}
function filePathPart(value:string){return value.normalize('NFKD').replace(/[^A-Za-z0-9._-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,120)||'mid-export'}
function bytesToBase64(bytes:Uint8Array){let result='';for(let offset=0;offset<bytes.length;offset+=0x8000)result+=String.fromCharCode(...bytes.subarray(offset,offset+0x8000));return btoa(result)}

async function nativeShareFile({file,title,text}:MidShareFileOptions):Promise<MidFileTransferMode>{
 const[{Filesystem,Directory},{Share}]=await Promise.all([import('@capacitor/filesystem'),import('@capacitor/share')]),path=`mid-share/${Date.now()}-${filePathPart(file.name)}`;
 await Filesystem.writeFile({directory:Directory.Cache,path,data:bytesToBase64(new Uint8Array(await file.arrayBuffer())),recursive:true});
 try{const{uri}=await Filesystem.getUri({directory:Directory.Cache,path});await Share.share({title,text,files:[uri],dialogTitle:title});return'native-share'}
 finally{await Filesystem.deleteFile({directory:Directory.Cache,path}).catch(()=>undefined)}
}
async function browserShareOrDownload({file,title,text}:MidShareFileOptions):Promise<MidFileTransferMode>{
 const shareNavigator=navigator as Navigator&{canShare?:(data:ShareData)=>boolean;share?:(data:ShareData)=>Promise<void>},shareData:ShareData={title,text,files:[file]};
 if(shareNavigator.share&&(!shareNavigator.canShare||shareNavigator.canShare(shareData))){await shareNavigator.share(shareData);return'web-share'}
 downloadFile(file);return'download';
}

/** Shares content unchanged through an ephemeral native cache file or the existing browser/PWA fallbacks. */
export async function shareOrExportMidFile(options:MidShareFileOptions):Promise<MidFileTransferMode>{
 if(isMidNativeRuntime()){try{return await nativeShareFile(options)}catch(reason){if(!pluginFallbackAllowed(reason))throw reason}}
 return browserShareOrDownload(options);
}

/** WKWebView maps the file input to the native iOS document picker; browsers keep their regular chooser. */
export function openMidFilePicker(input:HTMLInputElement|null):MidFilePickerMode{
 if(!input)throw new Error('Dateiauswahl ist derzeit nicht verfügbar.');
 input.click();return isMidNativeRuntime()?'native-document-picker':'browser-file-picker';
}
