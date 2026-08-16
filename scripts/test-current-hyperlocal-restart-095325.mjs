import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
const root=resolve(new URL('..',import.meta.url).pathname),app=readFileSync(resolve(root,'src/App.tsx'),'utf8'),weather=readFileSync(resolve(root,'src/weather.ts'),'utf8'),baseline=JSON.parse(readFileSync(resolve(root,'MID_BASELINE.json'),'utf8'));
function need(source,token,label){if(!source.includes(token)){console.error(`Fehlt (${label}): ${token}`);process.exit(1)}}
function no(source,token,label){if(source.includes(token)){console.error(`Unerwünscht (${label}): ${token}`);process.exit(1)}}
for(const token of [
 'function stationAnalysisRank(',
 'function preferStationResult(',
 'function stationCacheEntryForLocation(',
 "writeAnalysisCache('station-provisional'",
 'if(stationNeedsEnrichment(value)||stationAnalysisRank(value)<4)',
 'else if(cachedStation){runFullStationAnalysis()}',
 'cachedStationAge<=2*60000',
 'warmStation=forceFresh?null:stationCacheEntryForLocation(',
 "warmAir=readAnalysisCache<any>('air-quality'",
 "warmRadar=readAnalysisCache<RadarNowcast>('radar'",
 "warmRadarHistory=readAnalysisCache<RadarHistory>('radar-history'",
 'setSt(warmStation)',
 'setAir(warmAir)',
 'setRadarAnalysis(warmRadar)',
 'setRadarHistoryInfo(warmRadarHistory)',
 "beginRequest('station-startup')",
 'startupStationPromise',
 "if(final&&rank>=2)writeAnalysisCache('station'",
 "'Messwertabgleich'",
 "hyperlocalAnalysis?'Hyperlokale Analyse'"
])need(app,token,'Current/Hyperlokal-Restartvertrag');
for(const token of [
 "const LOCAL_BACKGROUND_STORAGE_PREFIX='mid:hyperlocal-background:v1:'",
 'readStoredLocalBackground(',
 'writeStoredLocalBackground(',
 "const TERRAIN_MORPHOLOGY_STORAGE_PREFIX='mid:terrain-morphology:v1:'",
 'readStoredTerrainMorphology(',
 'writeStoredTerrainMorphology(',
 'TERRAIN_MORPHOLOGY_TTL=14*86400000',
 'if(fast)return direct;',
 'const analysed=await hyperlocalAnalysis(results,lat,lon,elevation,context,signal,false)'
])need(weather,token,'persistenter Hyperlokal-Cache');
no(app,"fresh?(ownStation?'Eigene Wetterstation':st?.analysisMethod?'Hyperlokale Analyse':st?.blended?'Lokales Stationsmittel':'Nächstgeeignete Messstation')",'alter Current-Titelvertrag');
no(app,'<span>{st.analysisMethod}</span>','nullable Stationsanalyse ohne Guard');
no(app,'{st.localContextSource?<small>Kontextquellen: {st.localContextSource}</small>:null}','nullable Kontextquelle ohne Guard');
const test='scripts/test-current-hyperlocal-restart-095325.mjs';
if(!Array.isArray(baseline.requiredRegressionTests)||!baseline.requiredRegressionTests.includes(test)){console.error(`Baseline schützt ${test} nicht`);process.exit(1)}
console.log('Current-/Hyperlokal-Restart v0.9.53.25 geprüft: reiche Analyse wird nicht von Rohstation überschrieben, Warmstartdaten werden sofort wiederverwendet und Modell-/Geländekontext bleibt persistent gecacht.');
