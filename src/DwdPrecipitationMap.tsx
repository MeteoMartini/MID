import {useEffect,useMemo} from 'react';
import {divIcon} from 'leaflet';
import {MapContainer,Marker,TileLayer,WMSTileLayer,useMap,useMapEvents} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import HymecNgOverlay,{type HymecNgOverlayStatus} from './HymecNgOverlay';
import type {HymecNgMeta} from './HymecNgSource';

const DWD_WMS='https://maps.dwd.de/geoserver/wms';
const DWD_SATELLITE_LAYER='dwd:Satellite_meteosat_1km_euat_rgb_clouds_day_and_night';

function locationIcon(){return divIcon({className:'mid-dwd-location-pin',iconSize:[26,34],iconAnchor:[13,32],html:'<svg viewBox="0 0 24 30" aria-hidden="true"><path d="M12 28C8.1 22.6 3.5 17.7 3.5 11.7A8.5 8.5 0 0 1 12 3.2a8.5 8.5 0 0 1 8.5 8.5c0 6-4.6 10.9-8.5 16.3Z"/><circle cx="12" cy="11.7" r="3.1"/></svg>'})}
function SyncView({latitude,longitude}:{latitude:number;longitude:number}){const map=useMap();useEffect(()=>{map.setView([latitude,longitude],map.getZoom(),{animate:false})},[map,latitude,longitude]);return null}
function PointPicker({onPoint}:{onPoint:(latitude:number,longitude:number)=>void}){useMapEvents({click:event=>onPoint(event.latlng.lat,event.latlng.lng)});return null}

export default function DwdPrecipitationMap({latitude,longitude,satelliteAt,hymecMeta,markerVisible,onPoint,onHymecStatus}:{latitude:number;longitude:number;satelliteAt?:string;hymecMeta:HymecNgMeta|null;markerVisible:boolean;onPoint:(latitude:number,longitude:number)=>void;onHymecStatus?:(status:HymecNgOverlayStatus,message?:string)=>void}){
 const markerIcon=useMemo(()=>locationIcon(),[]),satelliteParams=useMemo(()=>({layers:DWD_SATELLITE_LAYER,styles:'',format:'image/png',transparent:true,version:'1.1.1',...(satelliteAt?{time:satelliteAt}:{}),tiled:true} as any),[satelliteAt]);
 return <MapContainer className="dwd-precip-type-radar__leaflet" center={[latitude,longitude]} zoom={7} minZoom={5} maxZoom={12} zoomControl={false} attributionControl={false} scrollWheelZoom={false} doubleClickZoom={true} touchZoom={true} dragging={true} preferCanvas>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" opacity={1} maxZoom={19}/>
  <WMSTileLayer key={`dwd-sat:${satelliteAt||'latest'}`} url={DWD_WMS} opacity={.56} zIndex={320} params={satelliteParams}/>
  {hymecMeta?.available&&hymecMeta.fileUrl?<HymecNgOverlay key={hymecMeta.fileUrl} meta={hymecMeta} opacity={.92} onStatus={onHymecStatus}/>:null}
  <SyncView latitude={latitude} longitude={longitude}/>
  <PointPicker onPoint={onPoint}/>
  {markerVisible?<Marker position={[latitude,longitude]} icon={markerIcon} zIndexOffset={900}/>:null}
 </MapContainer>;
}
