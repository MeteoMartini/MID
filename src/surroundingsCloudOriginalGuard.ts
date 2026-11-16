/** Pure, synchronous provenance check: React may render a changed target/location
 * before a previous async effect is torn down. An old original MUST NOT be shown
 * even for one paint as if it represented the new 15-minute slot or map center.
 * No interpolation, temporal nearest-neighbor or missing-value substitution.
 */
export type SurroundingsCloudRequestIdentity={
 validTime:string;
 requestLatitude?:number;
 requestLongitude?:number;
};
export function matchesSurroundingsCloudRequest(
 image:SurroundingsCloudRequestIdentity,
 latitude:number,longitude:number,targetUtcMs:number
):boolean{
 return Number.isFinite(latitude)&&Number.isFinite(longitude)&&Number.isFinite(targetUtcMs)&&
  Number.isFinite(Date.parse(image.validTime))&&Date.parse(image.validTime)===targetUtcMs&&
  image.requestLatitude===latitude&&image.requestLongitude===longitude;
}

/** A distinct reference preview, NEVER an original for the selected target.
 * The UTC target and exact coordinates are bound at request creation. An older
 * frame may be viewed only as a visibly labelled reference (up to 45 minutes),
 * not as a computed 15-minute SigWx product. No stale cross-target reuse.
 */
export type SurroundingsCloudReferenceIdentity=SurroundingsCloudRequestIdentity&{
 requestTargetTime?:string;
};
export const MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS=45*60_000;
export function matchesSurroundingsCloudReference(
 reference:SurroundingsCloudReferenceIdentity,
 latitude:number,longitude:number,targetUtcMs:number
):boolean{
 const source=Date.parse(reference.validTime);
 return Number.isFinite(latitude)&&Number.isFinite(longitude)&&Number.isFinite(targetUtcMs)&&
  Number.isFinite(source)&&
  Number.isFinite(Date.parse(reference.requestTargetTime??''))&&
  Date.parse(reference.requestTargetTime??'')===targetUtcMs&&
  source<targetUtcMs&&targetUtcMs-source<=MAX_SURROUNDINGS_CLOUD_REFERENCE_LAG_MS&&
  reference.requestLatitude===latitude&&reference.requestLongitude===longitude;
}
