import {test} from 'node:test';import assert from 'node:assert/strict';
import {addSynopWiring} from './synopWiring.mjs';
test('SYNOP map wiring preserves native map and targets the verified cloud/WW layer',()=>{
 const source={'src/UnifiedWeatherMap.tsx':'const forecastOverlay=isCloudWeather&&settings.enabled?<><CloudWeatherLayers state={cloudWeather} opacity={settings.opacity} modelLabel={modelLabel}/></>:null;', 'src/NativeModelMap.tsx':'return <><ModelMapContextOverlay/></>'};
 const native=source['src/NativeModelMap.tsx'].replace('<ModelMapContextOverlay/>','   <ModelMapContextOverlay/>');
 const output=addSynopWiring({...source,'src/NativeModelMap.tsx':native});
 assert.match(output['src/UnifiedWeatherMap.tsx'],/CloudWwMarkers data=\{cloudWeather.ready\?cloudWeather.data:null\}/);
 assert.match(output['src/NativeModelMap.tsx'],/CloudWwMarkers data=\{combined\}/);
 assert.throws(()=>addSynopWiring(output),/SYNOP drift/);
});
