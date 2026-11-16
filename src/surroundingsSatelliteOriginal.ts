import type {CompositeProduct,CompositeProductTimes} from './CompositeData';
import {nearestVerifiedOriginal} from './surroundingsRadarTimeline';

export type SurroundingsSatelliteOriginal={
 product:CompositeProduct;
 time:number;
 spectrum:'RGB'|'IR';
};

/** Prefer a verified colour source only when it has a real compatible original.
 * A listed but temporally unavailable RGB product must never suppress a valid
 * IR observation. The fallback is between actual source products, not between
 * fabricated target timestamps or interpolated satellite pictures.
 *
 * Future steps deliberately have no satellite observation; a radar nowcast is
 * not a satellite nowcast. Do not use stale/unverified source catalog entries.
 */
export function selectSurroundingsSatelliteOriginal(
 catalog:Pick<CompositeProductTimes,'satelliteRgbProduct'|'satelliteIrProduct'>|undefined,
 target:number,now:number,step:number
):SurroundingsSatelliteOriginal|undefined{
 if(!catalog||!Number.isFinite(target)||!Number.isFinite(now)||
   !Number.isInteger(step)||step>0)return undefined;
 const products:[SurroundingsSatelliteOriginal['spectrum'],CompositeProduct|undefined][]=[
  ['RGB',catalog.satelliteRgbProduct],
  ['IR',catalog.satelliteIrProduct]
 ];
 for(const [spectrum,product] of products){
  if(!product||product.fresh===false||product.timeVerified===false||
    !['dwd','eumetsat'].includes(product.provider)||
    typeof product.layer!=='string'||!product.layer.trim())continue;
  const time=nearestVerifiedOriginal(product.times,target,now);
  if(time===undefined)continue;
  return {product,time,spectrum};
 }
 return undefined;
}
