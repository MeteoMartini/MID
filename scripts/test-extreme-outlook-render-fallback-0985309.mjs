import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript-strada';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const overlay=read('src/ExtremeOutlookAreaOverlay.tsx');
const canvas=read('src/extremeOutlookAreaCanvas.ts');
const core=read('src/MapLibreCore.tsx');
const styles=read('src/styles-src/25-extreme-outlook.css');
const pkg=JSON.parse(read('package.json'));
const baseline=JSON.parse(read('MID_BASELINE.json'));
const worker=read('worker-src/00-core-observations.js');
const path='scripts/test-extreme-outlook-render-fallback-0985309.mjs';
assert.equal(pkg.version,'0.9.85.309');
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
assert.equal(pkg.scripts['test:extreme-outlook-render-fallback'],'node '+path);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])
 assert.ok(baseline[key]?.includes(path),path+' fehlt in '+key);
assert.ok(worker.includes("const WORKER_VERSION='"+pkg.version+"';"));
const sourceCheck=ts.transpileModule(overlay,{fileName:'ExtremeOutlookAreaOverlay.tsx',compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,jsx:ts.JsxEmit.ReactJSX},reportDiagnostics:true});
assert.equal((sourceCheck.diagnostics||[]).filter(row=>row.category===ts.DiagnosticCategory.Error).length,0,'Overlay muss syntaktisch gültiges TSX sein');
for(const token of [
 'buildExtremeOutlookContourSet(data,periodId,hazard)',
 'buildExtremeOutlookContourGeoJson(contours)',
 'map.isSourceLoaded(SOURCE_ID)',
 'map.queryRenderedFeatures({layers:[LAYER_IDS[0]]})',
 "map.on('error',errorHandler)",
 "map.on('idle',verify)",
 'setFallback(!nativeVisible())',
 'setFallback(contours.length>0)',
 'if(contours.length)setFallback(true)',
 'clearTimeout(watchdog)',
 "map.off('idle',verify)",
 "map.off('error',errorHandler)",
 'fallback&&contours.length>0?<CanvasOverlay',
 'render={drawFallback}',
 'role="status"'
]) assert.ok(overlay.includes(token),'Layer- und Fallback-Vertrag fehlt: '+token);
assert.ok(overlay.includes('drawExtremeOutlookContours(activeMap,canvas,contours)'),
 'Fallback muss dieselben vollständigen Original-Konturen verwenden, nicht Ersatz-Zellen/Schwellwerte.');
assert.ok(overlay.includes("zIndex={12}")&&overlay.includes("zIndex={35}"),
 'Fallback unter Gebietsbeschriftungen');
assert.ok(overlay.includes("type:'fill'")&&overlay.includes("type:'line'")&&overlay.includes("'fill-pattern'"),
 'Nativer Layer bleibt der Normalweg');
assert.ok(core.includes('maplibregl.setWorkerUrl(maplibreWorkerUrl)'),'Original-MapLibre-Worker darf nicht weggelassen werden');
assert.ok(canvas.includes("context.fill('evenodd')")&&canvas.includes("context.clip('evenodd')"),
 'Fallback muss Löcher, Inseln und Schraffur erhalten');
assert.ok(styles.includes('.extreme-map-layer-fallback-status')&&styles.includes('pointer-events:none'),
 'Degradationshinweis darf Karteninteraktion nicht überdecken');
console.log('MID 0.9.85.309: native Gefahrenpolygonprüfung mit georeferenziertem, deutlich deklariertem Canvas-Notfallmodus geprüft (Quell-/Konturvertrag, keine Browser-Pixelabnahme).');


// Real component-effect execution with a deterministic MapLibre event/source mock.
// This is an executable state-machine test, not a substitute for browser pixels.
const js=ts.transpileModule(overlay,{fileName:'ExtremeOutlookAreaOverlay.tsx',compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
const sampleContours=[{intensity:2,color:'#ef8a24',opacity:.6,probability:70,rings:[[{lon:7,lat:51},{lon:8,lat:51},{lon:8,lat:50},{lon:7,lat:50}]]}];
const sampleAreas=[{id:'region1',latitude:50.5,longitude:7.5,intensity:2,probability:70,region:'Messregion',signal:{hazard:'rain'}}];
function executeOverlayCase({contours=sampleContours,areas=sampleAreas,sourceLoaded=true,rendered=1,throwQuery=false,fillOpacity=.45,fillVisibility='visible'}={}){
 let fallback=false,cleanup,firstRender=true,drawnContours,drawCalls=0,loaded=sourceLoaded;
 const changes=[],sources=new Map(),layers=new Map(),images=new Set(),events=new Map();
 const contourSet={contours,hatchContours:contours.filter(row=>row.probability<60),areas};
 const map={
  hasImage:id=>images.has(id),addImage:id=>images.add(id),
  getSource:id=>sources.get(id),addSource:(id,data)=>sources.set(id,{setData(next){this.data=next},data}),
  removeSource:id=>sources.delete(id),
  getLayer:id=>layers.get(id),addLayer:layer=>layers.set(layer.id,layer),removeLayer:id=>layers.delete(id),
  getPaintProperty:(_id,property)=>property==='fill-opacity'?fillOpacity:undefined,
  getLayoutProperty:(_id,property)=>property==='visibility'?fillVisibility:undefined,
  isSourceLoaded:()=>loaded,
  getCanvas:()=>({clientWidth:390,clientHeight:500}),
  project:()=>({x:150,y:180}),
  queryRenderedFeatures(){if(throwQuery)throw new Error('query failed');return Array.from({length:rendered},()=>({properties:{}}))},
  on(name,listener){if(!events.has(name))events.set(name,new Set());events.get(name).add(listener)},
  off(name,listener){events.get(name)?.delete(listener)}
 };
 const CanvasOverlay=function TestCanvasOverlay(){};
 const HtmlMarker=function TestHtmlMarker(){};
 const jsx=(type,props)=>({type,props});
 const hooks={
  memo:fn=>fn,useCallback:fn=>fn,useMemo:fn=>fn(),
  useState:()=>[fallback,value=>{fallback=typeof value==='function'?value(fallback):value;changes.push(fallback)}],
  useEffect:callback=>{if(firstRender)cleanup=callback()}
 };
 const modules={
  react:hooks,'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},
  './MapLibreCore':{CanvasOverlay,HtmlMarker,useMidMap:()=>map,registerMapLayerOrder(){},unregisterMapLayerOrder(){}},
  './extremeOutlookAreaCanvas':{drawExtremeOutlookContours:(_map,_canvas,values)=>{drawnContours=values;drawCalls++}},
  './extremeOutlookAreaGeoJson':{buildExtremeOutlookContourGeoJson:values=>({type:'FeatureCollection',features:values.map(row=>({type:'Feature',geometry:{type:'MultiPolygon',coordinates:row.rings.length?[[row.rings.map(ring=>ring.map(point=>[point.lon,point.lat]))[0]]]:[]}}))})},
  './extremeOutlookModelledAreas':{buildExtremeOutlookContourSet:()=>contourSet},
  './extremeWeatherOutlook':{EXTREME_HAZARDS:[],EXTREME_INTENSITY_COLORS:{1:'#fff',2:'#ef8a24',3:'#d9363e',4:'#8f174f'}}
 };
 const module={exports:{}};
 new Function('require','module','exports',js)(id=>{if(!(id in modules))throw Error('Unexpected dependency: '+id);return modules[id]},module,module.exports);
 const Component=module.exports.default;
 const props={data:{},periodId:'period',hazard:'overall'};
 Component(props);
 firstRender=false;
 const emit=(event,payload={})=>{for(const callback of events.get(event)||[])callback(payload)};
 const canvasNode=()=>{const tree=Component(props);return [tree.props.children].flat().find(node=>node&&node.type===CanvasOverlay)};
 const stop=()=>{cleanup?.();return [...events.values()].reduce((count,set)=>count+set.size,0)};
 return{emit,canvasNode,stop,map,layers,sources,changes,setSourceLoaded:value=>{loaded=value},get fallback(){return fallback},get renderedContours(){return drawnContours},get draws(){return drawCalls}};
}
{
 const ok=executeOverlayCase();
 ok.emit('idle');
 assert.equal(ok.fallback,false,'Vollständig geladene native GeoJSON-Fläche bleibt der bevorzugte Renderer.');
 assert.equal(ok.canvasNode(),undefined,'Kein zusätzlicher Canvas auf gesundem nativen Layer.');
 ok.emit('error',{sourceId:'extreme-outlook-contours-source',error:new Error('worker failure')});
 assert.equal(ok.fallback,true,'Quellbezogener Workerfehler muss auf georeferenzierten Ersatz umschalten.');
 const substitute=ok.canvasNode();
 assert.ok(substitute,'Notfallmodus muss die Canvas-Komponente wirklich mounten.');
 substitute.props.render(ok.map,{});
 assert.strictEqual(ok.renderedContours,sampleContours,'Derselbe ungekürzte Gefahrenkontur-Array muss im Fallback ankommen.');
 ok.emit('idle');
 assert.equal(ok.fallback,true,'Idle mit alten Quellfeatures darf nach Workerfehler nicht als Recovery gelten.');
 ok.setSourceLoaded(false);
 ok.emit('sourcedata',{sourceId:'extreme-outlook-contours-source'});
 assert.equal(ok.fallback,true,'Entladener Source ist noch nicht wiederhergestellt.');
 ok.setSourceLoaded(true);
 ok.emit('sourcedata',{sourceId:'extreme-outlook-contours-source'});
 assert.equal(ok.fallback,false,'Nur beobachtete Neu-Ladung darf nativen Renderer reaktivieren.');
 assert.equal(ok.stop(),0,'Alle Kartenlistener bei Unmount entfernen.');
}
{
 const missing=executeOverlayCase({rendered:0});
 missing.emit('idle');
 assert.equal(missing.fallback,true,'Leeres natives Paint-Ergebnis darf nicht zu alleinstehenden Labels führen.');
 assert.ok(missing.canvasNode(),'Fehlender Layer-Paint braucht sichtbaren Ersatz.');
 missing.stop();
}
{
 const unavailable=executeOverlayCase({sourceLoaded:false});
 unavailable.emit('idle');
 assert.equal(unavailable.fallback,true,'Nicht fertig geladene GeoJSON-Quelle bleibt nicht unmarkiert.');
 unavailable.stop();
}
{
 const invalid=executeOverlayCase({throwQuery:true});
 invalid.emit('idle');
 assert.equal(invalid.fallback,true,'Ausfall des nativen Query-Pfades muss den Ersatz aktivieren.');
 invalid.stop();
}
{
 const noHazards=executeOverlayCase({contours:[],areas:[],rendered:0});
 noHazards.emit('idle');
 assert.equal(noHazards.fallback,false,'Keine modellierten Gefahren bedeuten keine erfundenen Ersatzpolygone.');
 assert.equal(noHazards.canvasNode(),undefined);
 noHazards.stop();
}

{
 const transparent=executeOverlayCase({fillOpacity:0,rendered:2});
 transparent.emit('idle');
 assert.equal(transparent.fallback,true,'Vollständig transparente native Gefahrenflächen dürfen trotz Featureabfrage nicht als sichtbar gelten.');
 assert.ok(transparent.canvasNode(),'Transparente native Flächen müssen auf den degradierten Zeichner wechseln.');
 transparent.stop();
 const hidden=executeOverlayCase({fillVisibility:'none',rendered:2});
 hidden.emit('idle');
 assert.equal(hidden.fallback,true,'Unsichtbare native Fill-Layer dürfen trotz Featureabfrage keine Entwarnung auslösen.');
 hidden.stop();
}
