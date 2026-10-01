export type MapWorkspaceView='radar'|'models'|'totals';

export const MAP_WORKSPACE_VIEW_KEY='mid:map-workspace-view:v1';

export function readMapWorkspaceView():MapWorkspaceView{
 try{
  const value=localStorage.getItem(MAP_WORKSPACE_VIEW_KEY);
  return value==='models'||value==='totals'||value==='radar'?value:'radar';
 }catch{return'radar'}
}

export function saveMapWorkspaceView(value:MapWorkspaceView){
 try{localStorage.setItem(MAP_WORKSPACE_VIEW_KEY,value)}catch{}
}