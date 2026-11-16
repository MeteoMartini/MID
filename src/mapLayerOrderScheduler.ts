/**
 * Coalesces synchronous MapLibre layer registrations into one ordering pass
 * per live map. The caller's flush callback reads the CURRENT full registry,
 * never a stale partial snapshot.
 *
 * Pure browser/Node scheduling utility: no weather state or data mutation.
 */
export function createMapLayerOrderScheduler<MapObject extends object>(){
 const pending=new WeakSet<MapObject>();
 return (map:MapObject,flush:()=>void):void=>{
  if(pending.has(map))return;
  pending.add(map);
  queueMicrotask(()=>{
   pending.delete(map);
   flush();
  });
 };
}
