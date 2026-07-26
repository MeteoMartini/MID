import {readFile} from 'node:fs/promises';

const [radar,styles]=await Promise.all([
  readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
  readFile(new URL('../src/styles.css',import.meta.url),'utf8')
]);
const failures=[];
const need=(source,token,label)=>{if(!source.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  "label=\"Radar · 1 km\"",
  "label=\"K3D / MIX\"",
  "label=\"Zugpfeile\"",
  'radarButtonDetail=',
  'nowcastButtonDetail=`${k3dButtonState} · ${mixButtonState}`'
])need(radar,token,'Kompakte Layerbuttons fehlen');

for(const token of [
  'function motionArrowIcon(',
  'mid-motion-arrow-marker',
  'zIndexOffset={800}',
  'function konradMarkerIcon(',
  'mid-konrad-marker',
  'function nowcastMixMarkerIcon()',
  'mid-nowcastmix-marker',
  'zIndexOffset={700}',
  'zIndexOffset={600}'
])need(radar,token,'Sichtbare Kartenobjekte fehlen');

for(const token of [
  'function spatiallyThin',
  'touchDevice?70:120',
  'touchDevice?36:70',
  'function MapInteractionController(',
  'touch-scroll-mode',
  'composite-map-interaction',
  "window.addEventListener('scroll',stop,{passive:true,once:true})"
])need(radar,token,'Scroll-/Vektorentlastung fehlt');

if(radar.includes('radar-motion-chip')||radar.includes('radar-site-motion-label'))failures.push('Das entfernte textliche Zugrichtungs-Overlay ist wieder enthalten.');

for(const token of [
  '.composite-switch.compact{',
  '.mid-motion-arrow-marker{',
  '.mid-konrad-marker{',
  '.mid-nowcastmix-marker{',
  '.radarmap.touch-scroll-mode .leaflet-container{touch-action:pan-y!important}',
  '.composite-map-interaction{',
  '.composite-card{contain:layout paint style;isolation:isolate}'
])need(styles,token,'Komposit-CSS fehlt');

if(failures.length){
  console.error('Komposit-Sichtbarkeit/Scroll-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Kompositbild geprüft: kompaktes Layerband, sichtbare K3D-/NowCastMIX-Symbole und weiße Zugpfeile sowie touchfreundliches Scrollen sind aktiv.');
