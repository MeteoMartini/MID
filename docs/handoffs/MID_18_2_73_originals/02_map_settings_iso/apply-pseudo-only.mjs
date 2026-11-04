/** Candidate source transform for the obsolete standard-versus-pseudo toggle.
 * Run on a fresh verified .427 checkout ONLY BEFORE apply-cloud-iso-fix or in a
 * new authorized integration branch after a separate, reviewed rebase. Never
 * run on a protected branch. This file does not bump versions or commit.
 */
import {readFileSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {join} from 'node:path';
const BASE='4d3051f80a17a180c3952c83bf5afa51623b1eb3';
const BLOBS={
 'src/cloudWeatherData.ts':'013a2382efcea883c8f101317621e07f4f46616d',
 'src/CloudSignificantWeather.tsx':'6954fbec11967576677050304c3f53c8b58531ef',
 'src/UnifiedWeatherMap.tsx':'fc560fe37c63f0847eb66553affcbccc778bf98e',
 'src/NativeModelMap.tsx':'d03c2dca5d15ac234da501797188e49bafda76c2',
 'src/cloudWeatherExport.ts':'f93ab078db7057a80977acea166ec74f3341cfa8'
};
const single=(s,from,to,where)=>{const matches=s.split(from).length-1;if(matches!==1)throw Error(`Source drift ${where}: ${matches} matching anchors`);return s.replace(from,to)};
export function pseudoOnly(source){const out={...source};
 let s=out['src/cloudWeatherData.ts'];
 s=single(s,"export type CloudWeatherRenderMode='standard'|'pseudo';","export type CloudWeatherRenderMode='pseudo';",'mode discriminant');
 s=single(s,"export const CLOUD_WEATHER_MODE_KEY='mid:cloud-weather-render:v1';\nexport function readCloudWeatherRenderMode():CloudWeatherRenderMode{\n try{return localStorage.getItem(CLOUD_WEATHER_MODE_KEY)==='pseudo'?'pseudo':'standard'}catch{return 'standard'}\n}\nexport function writeCloudWeatherRenderMode(mode:CloudWeatherRenderMode){\n try{localStorage.setItem(CLOUD_WEATHER_MODE_KEY,mode)}catch{/* blocked storage: current view remains usable */}\n}\n",'', 'obsolete mode persistence');
 s=single(s,"export function cloudWeatherPixel(cloud:number|null,weather:number|null,mode:CloudWeatherRenderMode='standard')","export function cloudWeatherPixel(cloud:number|null,weather:number|null,mode:CloudWeatherRenderMode='pseudo')",'pixel default');
 s=single(s,"export function cloudWeatherRaster(data:CloudWeatherData,mode:CloudWeatherRenderMode='standard')","export function cloudWeatherRaster(data:CloudWeatherData,mode:CloudWeatherRenderMode='pseudo')",'raster default');
 if(s.includes("mode:CloudWeatherRenderMode='pseudo'):[number,number,number,number]{")){
  s=single(s,"mode:CloudWeatherRenderMode='pseudo'):[number,number,number,number]{", "mode:CloudWeatherRenderMode='pseudo'):[number,number,number,number]{\n if(mode!=='pseudo')throw new Error('Nur das schematische Modell-Wolkenbild ist freigegeben.');", 'runtime pseudo-only pixel enforcement');
 }

 const alt=" if(mode==='standard'){\n  if(style){const c=[1,3,5].map(j=>parseInt(style.color.slice(j,j+2),16));return [c[0],c[1],c[2],240]}\n  if(cloud!==null&&Number.isFinite(cloud)){const grey=Math.round(255-cloud*1.5);return [grey,grey,grey,215]}\n  return [0,0,0,0];\n }\n";
 s=single(s,alt,'','legacy alternate-paint branch');
 out['src/cloudWeatherData.ts']=s;
 s=out['src/CloudSignificantWeather.tsx'];
 s=single(s,"mode:CloudWeatherRenderMode='standard'","mode:CloudWeatherRenderMode='pseudo'",'cloud hook default');
 const first=s.indexOf('export function CloudWeatherModeControl('),last=s.indexOf('export function CloudWeatherLegend(',first);
 if(first<0||last<=first)throw Error('Source drift: mode control function');
 s=s.slice(0,first)+s.slice(last);
 s=single(s,"className={`cloud-weather-cover${state.mode==='pseudo'?' pseudo':''}`}","className=\"cloud-weather-cover pseudo\"",'legend class');
 const legend="{state.mode==='pseudo'?'Modell-Wolkenbild: helle, transparente Gesamtbewölkung aus dem Modell; Farben darüber sind unveränderte WMO-Wettererscheinungen. Schematische Visualisierung, kein gemessenes oder physikalisch simuliertes Satellitenbild. ':'Graustufen: Gesamtbewölkung. Farbflächen: direktes Modellwetter nach WMO-Code. '}";
 s=single(s,legend,'Modell-Wolkenbild: transparente Gesamtbewölkung und originaler Modell-Wettercode. Schematisch, kein Satellitenbild. ','pseudo-only legend');
 out['src/CloudSignificantWeather.tsx']=s;
 s=out['src/UnifiedWeatherMap.tsx'];
 s=single(s,'CloudWeatherLayers,CloudWeatherLegend,CloudWeatherModeControl','CloudWeatherLayers,CloudWeatherLegend','unified import control');
 s=single(s,'cloudWeatherSources,readCloudWeatherRenderMode,writeCloudWeatherRenderMode,readCloudWeatherIsobars','cloudWeatherSources,readCloudWeatherIsobars','unified mode import');
 s=single(s,',type CloudWeatherRenderMode}', '}', 'unified type import');
 s=single(s,' const [cloudRenderMode,setCloudRenderMode]=useState<CloudWeatherRenderMode>(readCloudWeatherRenderMode);\n','', 'unified state');
 s=single(s,' const chooseCloudRenderMode=(mode:CloudWeatherRenderMode)=>{setCloudRenderMode(mode);writeCloudWeatherRenderMode(mode)};\n','', 'unified handler');
 s=single(s,'synopticCatalog.catalog,cloudRenderMode)','synopticCatalog.catalog)','unified hook mode');
 s=single(s,'places,type,cloudRenderMode,linesActive?','places,type,\'pseudo\',linesActive?','unified export');
 s=single(s,"{isCloudWeather&&modelId!=='gdps'&&<CloudWeatherModeControl mode={cloudRenderMode} onChange={chooseCloudRenderMode}/>}",'','unified UI toggle');
 s=single(s,"cloudContrast:settings.enabled&&isCloudWeather&&cloudRenderMode==='pseudo'&&cloudWeather.ready,sourceLabel:isCloudWeather&&cloudRenderMode==='pseudo'?", "cloudContrast:settings.enabled&&isCloudWeather&&cloudWeather.ready,sourceLabel:isCloudWeather?",'unified base map contrast');
 out['src/UnifiedWeatherMap.tsx']=s;
 s=out['src/NativeModelMap.tsx'];
 s=single(s,'CloudWeatherLegend,CloudWeatherModeControl','CloudWeatherLegend','native import control');
 s=single(s,'readCloudWeatherRenderMode,writeCloudWeatherRenderMode,readCloudWeatherIsobars','readCloudWeatherIsobars','native mode import');
 s=single(s,',type CloudWeatherRenderMode}', '}', 'native type import');
 s=single(s,' const [cloudRenderMode,setCloudRenderMode]=useState<CloudWeatherRenderMode>(readCloudWeatherRenderMode);\n','', 'native state');
 s=single(s,' const chooseCloudRenderMode=(mode:CloudWeatherRenderMode)=>{setCloudRenderMode(mode);writeCloudWeatherRenderMode(mode)};\n','', 'native mode setter');
 s=single(s,'cloudWeatherRaster(combined,cloudRenderMode)','cloudWeatherRaster(combined)','native raster');
 s=single(s,',cloudRenderMode]),rawUnit',']),rawUnit','native raster memo');
 s=single(s,"places,format,cloudRenderMode,cloudContourSelection)","places,format,'pseudo',cloudContourSelection)",'native export');
 s=single(s,"combined&&cloudRenderMode==='pseudo'?","combined?",'native basemap');
 s=single(s,'<CloudWeatherModeControl mode={cloudRenderMode} onChange={chooseCloudRenderMode}/>','', 'native UI toggle');
 s=single(s,'mode:cloudRenderMode','mode:\'pseudo\'','native legend');
 out['src/NativeModelMap.tsx']=s;
 s=out['src/cloudWeatherExport.ts'];
 s=s.replaceAll("mode:CloudWeatherRenderMode='standard'","mode:CloudWeatherRenderMode='pseudo'");
 // Remove every obsolete standard visualization branch in the SVG/PNG exporter.
 // Keep only the user-chosen pseudo-satellite schematic, never an RGB real sat image.
 if(s.includes("const landPaths=pseudo?")){
  s=single(s,"const pseudo=mode==='pseudo',productLabel=pseudo?`${CLOUD_WEATHER_LABEL} · Modell-Wolkenbild (schematisch)`:CLOUD_WEATHER_LABEL;", "const productLabel=`${CLOUD_WEATHER_LABEL} · Modell-Wolkenbild (schematisch)`;",'export mode removed');
  s=single(s,'const landPaths=pseudo?[...countries,','const landPaths=[...countries,','export land always');
  s=single(s,".join(''):'';", ".join('');",'export land branch removed');
  for(const [oldText,nextText] of [
   ["${pseudo?'#e7ebf0':'#fff'}", '#e7ebf0'],
   ["${pseudo?'0':'1'}", '0'],
   ["${pseudo?'#f8fbff':'#696969'}", '#f8fbff'],
   ["${pseudo?'.85':'1'}", '.85'],
   ["${pseudo?'Schematische Modellwolken · kein Satellitenbild · ':''}", 'Schematische Modellwolken · kein Satellitenbild · '],
   ["${pseudo?PSEUDO_SAT_BASEMAP.water:'#f7fafc'}", '${PSEUDO_SAT_BASEMAP.water}'],
   ['${pseudo&&landPaths?', '${landPaths?'],
   ["${mode==='pseudo'?'Modell-Wolkenbild-':''}", 'Modell-Wolkenbild-'],
   ["${mode==='pseudo'?' · Modell-Wolkenbild (schematisch)':''}", ' · Modell-Wolkenbild (schematisch)']
  ])s=single(s,oldText,nextText,'export old standard path');
  if(s.includes('export function cloudWeatherSvg(')){
   s=single(s,"countries:ModelMapGeography['countries']=[]){\n const productLabel=", "countries:ModelMapGeography['countries']=[]){\n if(mode!=='pseudo')throw new Error('Nur schematische Modellwolken sind zulässig.');\n const productLabel=", 'SVG exporter pseudo-only guard');
   s=single(s,"selectedIsoheights:CloudIsoheightLayer|null=null){\n const geography=", "selectedIsoheights:CloudIsoheightLayer|null=null){\n if(mode!=='pseudo')throw new Error('Nur schematische Modellwolken sind zulässig.');\n const geography=", 'PNG exporter pseudo-only guard');
  }
  if(/\bpseudo\b|mode==='standard'/.test(s)){
   // Source also contains the declared pseudo-only mode type, but cannot hold
   // an alternate raster, label or basemap branch.
   if(/\bconst pseudo\b|\bpseudo\s*\?|mode==='standard'/.test(s))throw Error('Export still has alternate-mode code');
  }
 }else{
  // Minimal source fixtures may not contain the full exporter for unit checks.
  s=single(s,"const pseudo=mode==='pseudo',productLabel=", "const pseudo=true,productLabel=",'fixture exporter');
 }
 out['src/cloudWeatherExport.ts']=s;
 for(const [path,data] of Object.entries(out))if(path!=='src/cloudWeatherExport.ts'&&/CloudWeatherModeControl|cloudRenderMode|mode==='standard'|CLOUD_WEATHER_MODE_KEY/.test(data))throw Error('Alternate mode remains in '+path);
 return out;
}
if(process.argv[1]?.endsWith('apply-pseudo-only.mjs')){
 const [mode,dir]=process.argv.slice(2);if(mode!=='--apply'||!dir)throw Error('Usage: node apply-pseudo-only.mjs --apply /path/to/MID');
 const git=(...args)=>execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim();
 const b=git('branch','--show-current');if(!/^(chatgpt|codex)\/v0\.9\.85\.428-[a-z0-9-]+$/.test(b))throw Error('Unsafe integration branch');
 if(git('status','--porcelain'))throw Error('Dirty worktree; do not overwrite other changes');
 for(const ref of ['main','mid-stable','HEAD'])if(git('rev-parse',ref)!==BASE)throw Error('SHA drift: '+ref);
 const old={};for(const [path,want] of Object.entries(BLOBS)){const content=readFileSync(join(dir,path),'utf8');if(createHash('sha1').update(`blob ${Buffer.byteLength(content)}\0`).update(content).digest('hex')!==want)throw Error('Blob drift: '+path);old[path]=content}
 const changed=pseudoOnly(old);for(const [path,content] of Object.entries(changed))writeFileSync(join(dir,path),content);
 console.log('Pseudo-only candidate applied; no version, commit, CI or release. Must run all appropriate TypeScript, renderer and export tests.');
}
