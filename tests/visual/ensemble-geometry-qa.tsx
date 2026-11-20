/** Deterministic synthetic render of the real production EnsemblePanel.
 * No official weather warning or live forecast is represented by these values. */
import React from 'react';
import {createRoot} from 'react-dom/client';
import EnsemblePanel from '../../src/EnsemblePanel';
import type {Day,EnsembleDay} from '../../src/weather';
import '../../src/styles.css';

const start=Date.UTC(2026,10,20,12),dates=Array.from({length:14},(_,i)=>new Date(start+i*86400000).toISOString().slice(0,10));
const dayFixture:Day[]=dates.map((date,i)=>{
 const min=-3+Math.sin(i*.7)*2,max=8+Math.sin(i*.5)*3;
 return{date,code:i%4===0?2:1,min,max,precipitation:0,precipitationAvailable:true,probability:0,probabilityAvailable:true,wind:8,gust:15,direction:240,uvMax:1,sunshineDuration:(4+i%5)*3600,sunrise:date+'T07:30',sunset:date+'T16:30'};
});
const ensembleFixture:EnsembleDay[]=dates.map((date,i)=>{
 const day=dayFixture[i],width=5+i*.3;
 return{
  date,maxLow:day.max-width,maxHigh:day.max+width,maxMean:day.max,maxQ25:day.max-width*.4,maxQ75:day.max+width*.4,
  minLow:day.min-width,minHigh:day.min+width,minMean:day.min,minQ25:day.min-width*.4,minQ75:day.min+width*.4,
  precipitationMean:0,precipitationLow:0,precipitationHigh:0,precipitationQ25:0,precipitationQ75:0,
  cumulativePrecipitationMean:0,cumulativePrecipitationLow:0,cumulativePrecipitationHigh:0,cumulativePrecipitationQ25:0,cumulativePrecipitationQ75:0,
  precipitationProbability:0,precipitationProbabilitySignificant:0,precipitationProbabilityWindows:[],
  sunshineDurationMean:day.sunshineDuration,sunshineDurationLow:(day.sunshineDuration??0)*.75,sunshineDurationHigh:(day.sunshineDuration??0)*1.1,
  windLow:5,windHigh:12,windMean:8,windQ25:7,windQ75:10,
  gustLow:10,gustHigh:21,gustMean:15,gustQ25:13,gustQ75:17,modelCount:2,memberCount:20
 };
});
const theme=new URLSearchParams(window.location.search).get('theme')==='dark'?'dark':'light';
document.documentElement.dataset.theme=theme;
document.documentElement.classList.toggle('dark',theme==='dark');
document.documentElement.dataset.midSyntheticQa='ensemble-952';
document.body.style.margin='0';
function QAFixture(){
 return <div className="app navigation-bottom-tabs" style={{width:'100%',minWidth:0,padding:0}}>
 <main style={{width:'100%',minWidth:0,maxWidth:'100%',margin:'0 auto'}}>
 <EnsemblePanel data={ensembleFixture} scenarios={[]} models={['QA synthetic ENS A','QA synthetic ENS B']}
 runs={[]} days={dayFixture} hours={[]} elevation={0} unit="kn" climate={[]} climateLoading={false}
 climateError="" loading={false} error="" advancedMode={false} locationKey="mid-952-synthetic"
 locationName="MID synthetic QA — not a forecast" changeRadarEnabled={false} presentation="widget" widgetMetric="temperature"/>
 </main></div>;
}
createRoot(document.getElementById('root')!).render(<QAFixture/>);
