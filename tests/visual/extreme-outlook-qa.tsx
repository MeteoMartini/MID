import React,{useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MidMapLibre,useMidMap} from '../../src/MapLibreCore';
import ExtremeOutlookAreaOverlay from '../../src/ExtremeOutlookAreaOverlay';
import '../../src/styles.css';
import type {ExtremeWeatherOutlook} from '../../src/extremeWeatherOutlook';

const rows=12,cols=16,bounds={north:52.5,south:49.5,west:6,east:10.32};
const signal={intensity:2 as const,intensityLabel:'markante Wettergefahr',probability:76,probabilityBand:'P3' as const,drivers:['Synthetischer QA-Fall'],subhazards:[],metrics:{rainMm:42,windowHours:6}};
const cells=Array.from({length:rows*cols},(_,i)=>{
 const row=Math.floor(i/cols),col=i%cols,active=row>=2&&row<=9&&col>=3&&col<=12,inner=row>=4&&row<=7&&col>=6&&col<=9;
 const values:[number,number,number,number]=inner?[88,78,64,18]:active?[76,64,0,0]:[0,0,0,0];
 return{id:'qa-'+row+'-'+col,row,col,lat:bounds.north-row*.25,lon:bounds.west+col*.27,region:'Synthetische Testregion',elevationM:50,periods:{qa:{hazards:active?{rain:signal}:{},probabilityFields:{rain:values}}}};
});
const thresholds:ExtremeWeatherOutlook['thresholds']={probability:{overviewMin:35,hazardMin:35,extremeExceptionMin:10,bands:[]},intensity:{levels:[]},rain:{unit:'mm',windows:[6],levels:[20,30,40,50].map((n,i)=>({intensity:i+1,values:{'6':n}}))},wind:{unit:'km/h',terrainBands:[]},snow:{unit:'cm',windows:[],terrainMultipliers:{},levels:[]},ice:{unit:'mm',levels:[]},thunderstorm:{capeJkg:[],lapseRateKkm:[],shearMs:[],hailCm:[],note:''}};
const data:ExtremeWeatherOutlook={scope:'Mitteleuropa',provider:'MID QA, synthetische Modellfelder',model:'QA',checkedAt:'2026-10-22T06:00:00Z',officialWarning:false,periods:[{id:'qa',label:'QA-Zeitfenster',startHour:0,endHour:6,start:'2026-10-22T06:00:00Z',end:'2026-10-22T12:00:00Z'}],cells,grid:{rows,cols,latStep:.25,lonStep:.27,pointCount:rows*cols,bounds},thresholds,quality:{ensembleMembers:20,probabilityMethod:'Synthetisch, keine Prognose',modelResolution:'QA-Raster',displayGrid:'Test',diagnosticCoveragePct:100,limitations:[]}};
const empty:ExtremeWeatherOutlook={...data,cells:cells.map(cell=>({...cell,periods:{qa:{hazards:{},probabilityFields:{rain:[0,0,0,0] as [number,number,number,number]}}}}))};
declare global {interface Window {__midPolygonQaMap?:ReturnType<typeof useMidMap>;__midPolygonQaReset?:()=>void;__midPolygonQaSetValid?:(valid:boolean)=>void}}
function Probe(){const map=useMidMap();useEffect(()=>{window.__midPolygonQaMap=map;return()=>{window.__midPolygonQaMap=null}},[map]);return null}
function Fixture(){
 const[valid,setValid]=useState(true),[revision,setRevision]=useState(0);
 window.__midPolygonQaReset=()=>setRevision(n=>n+1);
 window.__midPolygonQaSetValid=setValid;
 return <div className="qa-shell"><header>Extremwetterausblick · synthetischer Abnahmefall</header><div className="qa-map"><MidMapLibre center={[51.1,8.25]} zoom={6.2} minZoom={4} maxZoom={8} className="qa-maplibre" navigationControl={false} attributionControl={false}><Probe/><ExtremeOutlookAreaOverlay key={revision} data={valid?data:empty} periodId="qa" hazard="rain"/></MidMapLibre></div><footer>Modellierte Testkonturen, keine amtliche Warnung · keine Daten aus der Produktionspipeline verändert</footer></div>;
}
document.documentElement.dataset.theme=new URLSearchParams(location.search).get('theme')||'light';
createRoot(document.getElementById('root')!).render(<Fixture/>);
