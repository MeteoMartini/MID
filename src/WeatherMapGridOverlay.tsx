import {Fragment,memo,useMemo} from 'react';
import {Polyline,Rectangle,Tooltip} from 'react-leaflet';
import type {WeatherMapGridData,WeatherMapGridFrame,WeatherMapGridKind} from './WeatherMapsData';

function thetaEColor(value:number){if(!Number.isFinite(value))return'transparent';if(value<298)return'#315fa8';if(value<304)return'#3187bd';if(value<310)return'#36a6a2';if(value<316)return'#55b86a';if(value<322)return'#a8c94b';if(value<328)return'#e4bd3f';if(value<334)return'#e98a35';if(value<340)return'#db4a42';return'#aa3f86'}
function sigwxColor(code:number){const value=Math.round(Number(code)||0);if(value>=95)return'#8d4bc7';if([66,67,56,57].includes(value))return'#cf4cb4';if([71,73,75,77,85,86].includes(value))return'#4f9ed9';if([80,81,82].includes(value))return'#2bb8b1';if(value>=51&&value<=65)return'#38a76d';if([45,48].includes(value))return'#8f99a6';if(value===3)return'#b4bac4';return'transparent'}
function precipColor(value:number){if(!Number.isFinite(value)||value<.05)return'transparent';if(value<.2)return'#9bd6ef';if(value<.8)return'#4fbce2';if(value<2)return'#248dc8';if(value<5)return'#4167c7';return'#7a4bb7'}
function sigwxLabel(code:number){const value=Math.round(Number(code)||0);if(value>=95)return'Gewitter';if([66,67,56,57].includes(value))return'gefrierender Niederschlag';if([71,73,75,77,85,86].includes(value))return'Schnee / Schneeschauer';if([80,81,82].includes(value))return'Schauer';if(value>=51&&value<=65)return'Regen / Sprühregen';if([45,48].includes(value))return'Nebel';if(value===3)return'bedeckt';return'kein markantes Signal'}

type GridCellRender={index:number;bounds:[[number,number],[number,number]];value:number;color:string;label:string};

function WeatherMapGridOverlay({data,frame,kind,opacity}:{data:WeatherMapGridData;frame:WeatherMapGridFrame;kind:WeatherMapGridKind;opacity:number}){
 const cells=useMemo(()=>{
  const latStep=data.lats.length>1?Math.abs(data.lats[1]-data.lats[0]):.25,lonStep=data.lons.length>1?Math.abs(data.lons[1]-data.lons[0]):.35,result:GridCellRender[]=[];
  for(let row=0;row<data.lats.length;row++)for(let col=0;col<data.lons.length;col++){
   const index=row*data.lons.length+col,lat=data.lats[row],lon=data.lons[col],bounds:[[number,number],[number,number]]=[[lat-latStep/2,lon-lonStep/2],[lat+latStep/2,lon+lonStep/2]];
   if(kind==='pressure-thetae'){const value=frame.thetaE[index],color=thetaEColor(value);if(color!=='transparent')result.push({index,bounds,value,color,label:`ThetaE 850 hPa ${Number.isFinite(value)?value.toFixed(1):'–'} K`})}
   else if(kind==='pressure-sigwx'){const value=frame.weatherCode[index],color=sigwxColor(value);if(color!=='transparent')result.push({index,bounds,value,color,label:`SIGWX: ${sigwxLabel(value)} · WMO ${Math.round(value)}`})}
   else{const value=frame.precipitation[index],color=precipColor(value);if(color!=='transparent')result.push({index,bounds,value,color,label:`Niederschlag ${Number.isFinite(value)?value.toFixed(1):'–'} mm/h`})}
  }
  return result
 },[data.lats,data.lons,frame,kind]);
 return <>
  {cells.map(cell=><Rectangle key={`grid-${cell.index}`} bounds={cell.bounds} pathOptions={{stroke:false,fill:true,fillColor:cell.color,fillOpacity:Math.max(.16,Math.min(.62,opacity*.58))}}><Tooltip sticky>{cell.label}</Tooltip></Rectangle>)}
  {frame.isobars.map(contour=><Fragment key={`p-${contour.level}`}>{contour.paths.map((path,index)=><Polyline key={`p-${contour.level}-${index}`} positions={path} pathOptions={{color:'#203c64',weight:contour.level%4===0?1.8:1.15,opacity:.82}} interactive={false}/>)}</Fragment>)}
 </>
}
export default memo(WeatherMapGridOverlay);
