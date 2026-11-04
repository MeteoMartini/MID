import assert from 'node:assert/strict';
import {test} from 'node:test';
import {updateSources} from './apply-cloud-iso-fix.mjs';
const src={
 'src/cloudWeatherData.ts':`import type {NativeField,NativeIndex} from './nativeModelFields';\nreturn localStorage.getItem(CLOUD_WEATHER_ISOBARS_KEY);localStorage.setItem(CLOUD_WEATHER_ISOBARS_KEY,String(enabled));localStorage.getItem(CLOUD_WEATHER_ISOHEIGHTS_KEY);localStorage.setItem(CLOUD_WEATHER_ISOHEIGHTS_KEY,String(enabled));`,
 'src/cloudWeatherIsobars.ts':`if(field.modelId!==undefined||field.run!==data.run)return null`,
 'src/UnifiedWeatherMap.tsx':`const needsSynopticCloud=cloudIsoheights||(showIsobars&&(!cloudPressureTime||!catalog?.index.products.pressure?.frames.some(f=>f.time===cloudPressureTime)));\n{isCloudWeather&&eligibleCloudIsobarModel(modelId)&&<><label className="unified-check"><input type="checkbox" checked={cloudIsobars} onChange={e=>chooseCloudIsobars(e.target.checked)}/>Isobaren · {modelLabel} · gleicher Lauf und Termin</label><label className="unified-check"><input type="checkbox" checked={cloudIsoheights} onChange={e=>chooseCloudIsoheights(e.target.checked)}/>Isohypsen · gleicher Lauf und Termin</label></>}`,
 'src/NativeModelMap.tsx':`<GeoJsonLayers data={isobars} layers={adaptiveContourLayers('pressure')}/>`
};
test('source changes explicit and only expected anchors',()=>{
 const v=updateSources(src);
 assert.match(v['src/cloudWeatherData.ts'],/writeDurableStorageValue\(CLOUD_WEATHER_ISOBARS_KEY/);
 assert.match(v['src/cloudWeatherData.ts'],/writeDurableStorageValue\(CLOUD_WEATHER_ISOHEIGHTS_KEY/);
 assert.match(v['src/cloudWeatherIsobars.ts'],/field.modelId!=='icon-d2'/);
 assert.match(v['src/UnifiedWeatherMap.tsx'],/nativePressureMissing/);
 assert.match(v['src/UnifiedWeatherMap.tsx'],/Isohypsen eingeschaltet/);
 assert.match(v['src/NativeModelMap.tsx'],/nativeIsobarFeatures\(cloudContours\)/);
 assert.throws(()=>updateSources(v),'must not apply twice');
});
