import {detailSkyBarHourCells,detailSkyBarSegments,type SkyBarHourCell,type SkyBarSegment} from './detailSkyBar';
import {localCalendarDayWindow,solarTimelineWindow,type LocalCalendarDayWindow,type SolarDaylightLocation} from './astronomy';
import type {Hour} from './weather';

export type ForecastSolarNightBand={
 key:string;
 gradientId:string;
 x:number;
 width:number;
 fadeIn:boolean;
 fadeOut:boolean;
 startEpoch:number;
 endEpoch:number;
};

export type ForecastDaySkyBar=LocalCalendarDayWindow&{
 hours:Hour[];
 xPositions:number[];
 segments:SkyBarSegment[];
 cells:SkyBarHourCell[];
 nightBands:ForecastSolarNightBand[];
};

export function forecastLocalDaySkyBar(
 allHours:Hour[],
 date:string,
 location:SolarDaylightLocation,
 keyPrefix:string,
 centerY=8,
){
 const timezone=location.timezone||Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC';
 const window=localCalendarDayWindow(date,timezone);
 if(!window)return undefined;
 const {startEpoch,endEpoch}=window,left=1.5,right=1.5,width=100,trackWidth=width-left-right;
 const hours=allHours.filter(hour=>Number.isFinite(Number(hour.epoch))&&hour.epoch>=startEpoch&&hour.epoch<endEpoch).slice().sort((a,b)=>a.epoch-b.epoch);
 const span=endEpoch-startEpoch,xPositions=hours.map(hour=>left+(hour.epoch-startEpoch)/span*trackWidth);
 const segments=detailSkyBarSegments(hours,left,right,width,centerY,xPositions),cells=detailSkyBarHourCells(hours);
 const solar=solarTimelineWindow(startEpoch,endEpoch,location);
 const nightBands=solar.nightBands.map((band,index)=>({
  key:`${keyPrefix}-${index}-${band.startEpoch}`,
  gradientId:`${keyPrefix}-gradient-${index}`,
  x:left+(band.startEpoch-startEpoch)/span*trackWidth,
  width:Math.max(0,(band.endEpoch-band.startEpoch)/span*trackWidth),
  fadeIn:band.fadeIn,
  fadeOut:band.fadeOut,
  startEpoch:band.startEpoch,
  endEpoch:band.endEpoch,
 })).filter(band=>band.width>0);
 return{...window,hours,xPositions,segments,cells,nightBands} satisfies ForecastDaySkyBar;
}