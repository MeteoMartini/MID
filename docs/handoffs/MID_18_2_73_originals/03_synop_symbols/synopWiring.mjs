/** Pure MID-specific wiring transform, NOT a git writer or release tool.
 * The integration coordinator must verify current source blobs/branch,
 * combine other same-file patches, and execute all MID build/gates.
 */
const one=(source,from,to,desc)=>{const count=source.split(from).length-1;if(count!==1)throw Error(`SYNOP drift: ${desc} (anchors: ${count})`);return source.replace(from,to)};
export function addSynopWiring(sources){
 const target={...sources};
 let u=target['src/UnifiedWeatherMap.tsx'];
 if(typeof u!=='string')throw Error('Missing UnifiedWeatherMap.tsx');
 if(u.includes("import CloudWwMarkers from './CloudWwMarkers';"))throw Error('SYNOP drift: already wired');
 u="import CloudWwMarkers from './CloudWwMarkers';\n"+u;
 u=one(u,'const forecastOverlay=isCloudWeather&&settings.enabled?<><CloudWeatherLayers state={cloudWeather} opacity={settings.opacity} modelLabel={modelLabel}/>','const forecastOverlay=isCloudWeather&&settings.enabled?<><CloudWeatherLayers state={cloudWeather} opacity={settings.opacity} modelLabel={modelLabel}/><CloudWwMarkers data={cloudWeather.ready?cloudWeather.data:null} visible={cloudWeather.ready} radarVisible={observationLayers}/>','unified forecast overlay');
 target['src/UnifiedWeatherMap.tsx']=u;
 let n=target['src/NativeModelMap.tsx'];
 if(typeof n!=='string')throw Error('Missing NativeModelMap.tsx');
 n="import CloudWwMarkers from './CloudWwMarkers';\n"+n;
 n=one(n,'   <ModelMapContextOverlay/>','   <CloudWwMarkers data={combined} visible={Boolean(combined)} radarVisible={false}/>\n   <ModelMapContextOverlay/>','native sigwx overlay');
 target['src/NativeModelMap.tsx']=n;
 return target;
}
