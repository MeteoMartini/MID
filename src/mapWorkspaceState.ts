export type MapWorkspaceView='radar'|'models';

export const MAP_WORKSPACE_VIEW_KEY='mid:map-workspace-view:v1';

export function readMapWorkspaceView():MapWorkspaceView{
 try{
  const value=localStorage.getItem(MAP_WORKSPACE_VIEW_KEY);
  if(value==='totals'){saveMapWorkspaceView('totals');return'models'}
  return value==='models'||value==='radar'?value:'radar';
 }catch{return'radar'}
}

export function saveMapWorkspaceView(value:MapWorkspaceView|'totals'){
 try{if(value==='totals'){let settings={};try{settings=JSON.parse(localStorage.getItem('mid:weather-maps:v2')||'{}')}catch{}localStorage.setItem('mid:weather-maps:v2',JSON.stringify({...settings,modelId:'icon-d2',productId:'icon-d2-precipitation-totals'}))}localStorage.setItem(MAP_WORKSPACE_VIEW_KEY,value==='totals'?'models':value)}catch{}
}