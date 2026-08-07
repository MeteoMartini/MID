import {useEffect,useMemo} from 'react';
import {divIcon} from 'leaflet';
import {MapContainer,Marker,TileLayer,WMSTileLayer,useMap,useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HymecNgOverlay,{type HymecNgOverlayStatus} from './HymecNgOverlay';
import type {HymecNgMeta} from './HymecNgSource';
import {compositeWmsProxy,type CompositeProduct} from './CompositeData';

function locationIcon(){return divIcon({className:'mid-dwd-location-pin',iconSize:[26,34],iconAnchor:[13,32],html:'<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 28C8.1 22.6 3.5 17.7 3.5 11.7A8.5 8.5 0 0 1 12 3.2a8.5 8.5 0 0 1 8.5 8.5c0 6-4.6 10.9-8.5 16.3Z"/><circle cx="12" cy="11.7" r="3.1"/></svg>'})}
function SyncView({latitude,longitude}:{latitude:number;longitude:number}){const map=useMap();useEffect(()=>{map.setView([latitude,longitude],map.getZoom(),{animate:false})},[map,latitude,longitude]);return null}
function PointPicker({onPoint}:{onPoint:(latitude:number,longitude:number)=>void}){useMapEvents({click:event=>onPoint(event.latlng.lat,event.latlng.lng)});return null}
function closestProductTime(product:CompositeProduct|null|undefined,target?:string){if(!product)return'';const targetMs=Date.parse(target||''),times=(product.times||[]).map(value=>typeof value==='number'?value:Date.parse(String(value))).filter(Number.isFinite) as number[];if(times.length&&Number.isFinite(targetMs)){let best=times[0],distance=Math.abs(best-targetMs);for(const value of times){const next=Math.abs(value-targetMs);if(next<distance){best=value;distance=next}}if(distance<=45*60000)return new Date(best).toISOString();return''}const latest=typeof product.latestTime==='number'?product.latestTime:Date.parse(String(product.latestTime||''));if(Number.isFinite(latest))return new Date(latest).toISOString();if(times.length)return new Date(times.at(-1)!).toISOString();return''}

export default function DwdPrecipitationMap({latitude,longitude,satelliteAt,satelliteProduct,hymecMeta,markerVisible,onPoint,onHymecStatus,onSatelliteStatus}:{latitude:number;longitude:number;satelliteAt?:string;satelliteProduct?:CompositeProduct|null;hymecMeta:HymecNgMeta|null;markerVisible:boolean;onPoint:(latitude:number,longitude:number)=>void;onHymecStatus?:(status:HymecNgOverlayStatus,message?:string)=>void;onSatelliteStatus?:(status:'idle'|'loading'|'ready'|'error',message?:string)=>void}){
 const markerIcon=useMemo(()=>locationIcon(),[]),satelliteProxy=satelliteProduct?compositeWmsProxy(satelliteProduct.provider):'',satelliteTime=closestProductTime(satelliteProduct,satelliteAt),satelliteParams=useMemo(()=>({layers:satelliteProduct?.layer||'',styles:'',format:'image/png',transparent:true,version:satelliteProduct?.provider==='eumetsat'?'1.3.0':'1.1.1',...(satelliteTime&&!satelliteProduct?.latestOnly?{time:satelliteTime}:{}),tiled:true} as any),[satelliteProduct?.layer,satelliteProduct?.provider,satelliteProduct?.latestOnly,satelliteTime]);
 useEffect(()=>{if(!satelliteProduct||!satelliteProxy){onSatelliteStatus?.('error','Kein aktuelles Satellitenprodukt verfügbar.');return}if(satelliteAt&&!satelliteTime&&!satelliteProduct.latestOnly){onSatelliteStatus?.('error','Kein Satellitenbild nahe dem verbindlichen DWD-Zeitstand verfügbar.');return}onSatelliteStatus?.('loading')},[satelliteProduct,satelliteProxy,satelliteAt,satelliteTime,onSatelliteStatus]);
 const canShowSatellite=Boolean(satelliteProduct&&satelliteProxy&&(satelliteTime||satelliteProduct?.latestOnly));
 return <MapContainer className="dwd-precip-type-radar__leaflet" center={[latitude,longitude]} zoom={8} minZoom={5} maxZoom={12} zoomControl={false} attributionControl={false} scrollWheelZoom={false} doubleClickZoom touchZoom dragging preferCanvas>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={canShowSatellite?.46:.84} maxZoom={19}/>
  {canShowSatellite?<WMSTileLayer key={`sat:${satelliteProduct!.provider}:${satelliteProduct!.layer}:${satelliteTime||'latest'}`} url={satelliteProxy} opacity={.78} zIndex={320} params={satelliteParams} eventHandlers={{load:()=>onSatelliteStatus?.('ready',`${satelliteProduct!.label}${satelliteTime?` · ${satelliteTime.slice(11,16)} UTC`:''}`),tileerror:()=>onSatelliteStatus?.('error','Das aktuelle Satellitenbild konnte nicht geladen werden.')}} attribution={satelliteProduct!.provider==='dwd'?'Satellit &copy; DWD':'Satellit &copy; EUMETSAT'}/>:null}
  {hymecMeta?.available&&hymecMeta.fileUrl?<HymecNgOverlay key={hymecMeta.fileUrl} meta={hymecMeta} opacity={.9} onStatus={onHymecStatus}/>:null}
  <SyncView latitude={latitude} longitude={longitude}/><PointPicker onPoint={onPoint}/>{markerVisible?<Marker position={[latitude,longitude]} icon={markerIcon} zIndexOffset={900}/>:null}
 </MapContainer>;
}
