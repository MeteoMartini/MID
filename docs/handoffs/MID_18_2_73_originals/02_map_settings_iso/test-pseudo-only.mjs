import assert from 'node:assert/strict';
import {test} from 'node:test';
import {pseudoOnly} from './apply-pseudo-only.mjs';
const data=`export type CloudWeatherRenderMode='standard'|'pseudo';
export const CLOUD_WEATHER_MODE_KEY='mid:cloud-weather-render:v1';
export function readCloudWeatherRenderMode():CloudWeatherRenderMode{
 try{return localStorage.getItem(CLOUD_WEATHER_MODE_KEY)==='pseudo'?'pseudo':'standard'}catch{return 'standard'}
}
export function writeCloudWeatherRenderMode(mode:CloudWeatherRenderMode){
 try{localStorage.setItem(CLOUD_WEATHER_MODE_KEY,mode)}catch{/* blocked storage: current view remains usable */}
}
export function cloudWeatherPixel(cloud:number|null,weather:number|null,mode:CloudWeatherRenderMode='standard'){}
 if(mode==='standard'){
  if(style){const c=[1,3,5].map(j=>parseInt(style.color.slice(j,j+2),16));return [c[0],c[1],c[2],240]}
  if(cloud!==null&&Number.isFinite(cloud)){const grey=Math.round(255-cloud*1.5);return [grey,grey,grey,215]}
  return [0,0,0,0];
 }
export function cloudWeatherRaster(data:CloudWeatherData,mode:CloudWeatherRenderMode='standard'){}
`;
const native=`import {CloudWeatherLegend,CloudWeatherModeControl} from './CloudSignificantWeather';
import {readCloudWeatherRenderMode,writeCloudWeatherRenderMode,readCloudWeatherIsobars,type CloudWeatherRenderMode} from './cloudWeatherData';
 const [cloudRenderMode,setCloudRenderMode]=useState<CloudWeatherRenderMode>(readCloudWeatherRenderMode);
 const chooseCloudRenderMode=(mode:CloudWeatherRenderMode)=>{setCloudRenderMode(mode);writeCloudWeatherRenderMode(mode)};
cloudWeatherRaster(combined,cloudRenderMode)
,colorScale,cloudRenderMode]),rawUnit
places,format,cloudRenderMode,cloudContourSelection)
combined&&cloudRenderMode==='pseudo'?
<CloudWeatherModeControl mode={cloudRenderMode} onChange={chooseCloudRenderMode}/>
mode:cloudRenderMode`;
const u=`import {CloudWeatherLayers,CloudWeatherLegend,CloudWeatherModeControl} from './CloudSignificantWeather';
import {cloudWeatherSources,readCloudWeatherRenderMode,writeCloudWeatherRenderMode,readCloudWeatherIsobars,type CloudWeatherRenderMode} from './cloudWeatherData';
 const [cloudRenderMode,setCloudRenderMode]=useState<CloudWeatherRenderMode>(readCloudWeatherRenderMode);
 const chooseCloudRenderMode=(mode:CloudWeatherRenderMode)=>{setCloudRenderMode(mode);writeCloudWeatherRenderMode(mode)};
synopticCatalog.catalog,cloudRenderMode)
places,type,cloudRenderMode,linesActive?
{isCloudWeather&&modelId!=='gdps'&&<CloudWeatherModeControl mode={cloudRenderMode} onChange={chooseCloudRenderMode}/>}
cloudContrast:settings.enabled&&isCloudWeather&&cloudRenderMode==='pseudo'&&cloudWeather.ready,sourceLabel:isCloudWeather&&cloudRenderMode==='pseudo'?`;
const control=`mode:CloudWeatherRenderMode='standard'
export function CloudWeatherModeControl({mode,onChange}:{mode:CloudWeatherRenderMode;onChange:(next:CloudWeatherRenderMode)=>void}){ return 'mode' }
export function CloudWeatherLegend({state}){
 return <div className={\`cloud-weather-cover\${state.mode==='pseudo'?' pseudo':''}\`}>{state.mode==='pseudo'?'Modell-Wolkenbild: helle, transparente Gesamtbewölkung aus dem Modell; Farben darüber sind unveränderte WMO-Wettererscheinungen. Schematische Visualisierung, kein gemessenes oder physikalisch simuliertes Satellitenbild. ':'Graustufen: Gesamtbewölkung. Farbflächen: direktes Modellwetter nach WMO-Code. '}</div>
}`;
const exportSource=`mode:CloudWeatherRenderMode='standard';
const pseudo=mode==='pseudo',productLabel=`;
const code={'src/cloudWeatherData.ts':data,'src/CloudSignificantWeather.tsx':control,'src/UnifiedWeatherMap.tsx':u,'src/NativeModelMap.tsx':native,'src/cloudWeatherExport.ts':exportSource};
test('single pseudo render contract and no selection control after transform',()=>{
 const a=pseudoOnly(code);assert.match(a['src/cloudWeatherData.ts'],/CloudWeatherRenderMode='pseudo'/);
 assert.doesNotMatch(a['src/cloudWeatherData.ts'],/if\(mode==='standard'\)|CLOUD_WEATHER_MODE_KEY/);
 assert.doesNotMatch(a['src/CloudSignificantWeather.tsx'],/export function CloudWeatherModeControl/);
 assert.doesNotMatch(a['src/UnifiedWeatherMap.tsx'],/CloudWeatherModeControl/);
 assert.doesNotMatch(a['src/NativeModelMap.tsx'],/CloudWeatherModeControl/);
 assert.throws(()=>pseudoOnly(a));
});

test('full pseudo-only exporter has no dead alternate visualization branch',()=>{
 const fullExport=[
  "mode:CloudWeatherRenderMode='standard'",
  "const pseudo=mode==='pseudo',productLabel=pseudo?`${CLOUD_WEATHER_LABEL} · Modell-Wolkenbild (schematisch)`:CLOUD_WEATHER_LABEL;",
  "const landPaths=pseudo?[...countries,...states.flatMap(s=>s.rings)].filter(x=>true).map(x=>x).join(''):'';",
  "${pseudo?'#e7ebf0':'#fff'}",
  "${pseudo?'0':'1'}",
  "${pseudo?'#f8fbff':'#696969'}",
  "${pseudo?'.85':'1'}",
  "${pseudo?'Schematische Modellwolken · kein Satellitenbild · ':''}",
  "${pseudo?PSEUDO_SAT_BASEMAP.water:'#f7fafc'}",
  '${pseudo&&landPaths?',
  "${mode==='pseudo'?'Modell-Wolkenbild-':''}",
  "${mode==='pseudo'?' · Modell-Wolkenbild (schematisch)':''}"
 ].join('\n');
 const transformed=pseudoOnly({...code,'src/cloudWeatherExport.ts':fullExport});
 assert.doesNotMatch(transformed['src/cloudWeatherExport.ts'],/const pseudo|pseudo&&|pseudo\?|mode==='standard'|mode==='pseudo'\?/);
 assert.match(transformed['src/cloudWeatherExport.ts'],/const productLabel=/);
 assert.match(transformed['src/cloudWeatherExport.ts'],/Schematische Modellwolken · kein Satellitenbild/);
});
