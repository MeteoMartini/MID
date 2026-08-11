export type UiDensityPreference='auto'|'compact'|'comfortable';
export type ResolvedUiDensity='compact'|'comfortable';

export const UI_DENSITY_STORAGE_KEY='mid:ui-density';

export function readUiDensityPreference():UiDensityPreference{
 try{const value=localStorage.getItem(UI_DENSITY_STORAGE_KEY);return value==='compact'||value==='comfortable'||value==='auto'?value:'auto'}catch{return'auto'}
}

export function resolveUiDensity(preference:UiDensityPreference,width=typeof window!=='undefined'?window.innerWidth:1280,height=typeof window!=='undefined'?window.innerHeight:800):ResolvedUiDensity{
 if(preference==='compact'||preference==='comfortable')return preference;
 const landscape=width>height;
 // Auto: Smartphones and narrow/squat windows remain compact; tablets/desktops get breathing room.
 return width<=900||(landscape&&height<=620&&width<=1180)?'compact':'comfortable';
}

export function writeUiDensityPreference(preference:UiDensityPreference){
 try{localStorage.setItem(UI_DENSITY_STORAGE_KEY,preference)}catch{}
}

export function applyUiDensity(preference:UiDensityPreference){
 const resolved=resolveUiDensity(preference);
 if(typeof document!=='undefined'){
  document.documentElement.dataset.midDensityPreference=preference;
  document.documentElement.dataset.midDensity=resolved;
 }
 return resolved;
}
