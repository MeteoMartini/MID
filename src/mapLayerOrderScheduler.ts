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

/** True only when the full live style already has the desired managed suffix.
 * The legacy moveLayer(id) loop appends every managed layer to the top.
 * Never skip based on managed relative order alone: unmanaged layers matter.
 */
export function hasManagedLayerSuffix(current:readonly string[],ordered:readonly (readonly [string,number])[]):boolean{
 if(ordered.length>current.length)return false;
 const offset=current.length-ordered.length;
 for(let i=0;i<ordered.length;i++)if(current[offset+i]!==ordered[i][0])return false;
 return true;
}
