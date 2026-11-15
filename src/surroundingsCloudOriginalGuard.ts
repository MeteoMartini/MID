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
