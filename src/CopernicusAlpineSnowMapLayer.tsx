import {useEffect,useMemo,useState} from 'react';
import {ImageQuadLayer,useMidMap} from './MapLibreCore';
import {copernicusSnowTileIdentity,fetchVerifiedCopernicusSnowPng,validateCopernicusSnowTile,type CopernicusSnowTile} from './copernicusSnowDelivery';

/** Pixel-size and source metadata remain owned by the immutable original tile. */
function VerifiedAlpineSnowTile({tile,opacity,onError}:{tile:CopernicusSnowTile;opacity:number;onError?:(error:string)=>void}){
 const identity=copernicusSnowTileIdentity(tile);
 const [verified,setVerified]=useState<{identity:string;url:string}|null>(null);
 useEffect(()=>{
  const controller=new AbortController();let alive=true,ownedUrl='';
  setVerified(null);
  try{
   validateCopernicusSnowTile(tile);
   void fetchVerifiedCopernicusSnowPng(tile,controller.signal).then(blob=>{
    if(!alive)return;
    ownedUrl=URL.createObjectURL(blob);
    setVerified({identity,url:ownedUrl});
   }).catch(error=>{if(alive&&!controller.signal.aborted)onError?.(error instanceof Error?error.message:String(error))});
  }catch(error){onError?.(error instanceof Error?error.message:String(error))}
  return()=>{alive=false;controller.abort();if(ownedUrl)URL.revokeObjectURL(ownedUrl)};
 },[identity]);
 return verified?.identity===identity?
  <ImageQuadLayer id={'clms-snow-'+tile.imageSha256.slice(0,24)}
   url={verified.url} bounds={tile.bounds} opacity={opacity}
   resampling="nearest" zIndex={655} onError={onError}/>:null;
}
const visibleTile=(tile:CopernicusSnowTile,sw:{lat:number;lng:number},ne:{lat:number;lng:number})=>
 tile.bounds[1][0]>=sw.lat&&tile.bounds[0][0]<=ne.lat
 &&tile.bounds[1][1]>=sw.lng&&tile.bounds[0][1]<=ne.lng;

/**
 * Bridge from SHA-attested source thumbnails to MapLibre, no browser BYOC token.
 * Missing coverage is transparent, never a fake dry/snow-free cell.
 * Actual production use is blocked until independently verified original COGs,
 * QAFLAGS and a valid immutable bundle have been promoted via MID release gates.
 */
export function CopernicusAlpineSnowMapLayer({tiles,enabled,opacity=0.82,onError}:
 {tiles:readonly CopernicusSnowTile[];enabled:boolean;opacity?:number;onError?:(error:string)=>void}){
 const map=useMidMap(),[viewRevision,setViewRevision]=useState(0);
 useEffect(()=>{
  if(!map||!enabled)return;
  const update=()=>setViewRevision(value=>value+1);
  map.on('moveend',update);map.on('zoomend',update);map.on('resize',update);
  return()=>{map.off('moveend',update);map.off('zoomend',update);map.off('resize',update)};
 },[map,enabled]);
 const visible=useMemo(()=>{
  if(!map||!enabled)return[];
  const bounds=map.getBounds(),sw=bounds.getSouthWest(),ne=bounds.getNorthEast();
  return tiles.filter(t=>visibleTile(t,sw,ne));
 },[map,tiles,enabled,viewRevision]);
 // If the view would need unbounded concurrent images, fail closed with no
 // misrepresentative partial raster; zoom to a smaller area first.
 useEffect(()=>{if(enabled&&visible.length>8)onError?.('Satelliten-Schneekarte: zu großer Ausschnitt für einen sicheren Rasterabruf. Bitte näher zoomen.')},[enabled,visible.length,onError]);
 if(!enabled||visible.length>8)return null;
 return <>{visible.map(tile=><VerifiedAlpineSnowTile key={copernicusSnowTileIdentity(tile)} tile={tile}
  opacity={opacity} onError={onError}/>)}</>;
}
