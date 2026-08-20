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
  "label=\"Zeitpfeil\"",
  'radarButtonDetail=',
  'nowcastButtonDetail=`${k3dButtonState} · ${mixButtonState}`'
])need(radar,token,'Kompakte Layerbuttons fehlen');

for(const token of [
  'function motionTrackGraphicIcon(',
  'mid-motion-track-graphic',
  "<Marker pane=\"mid-motion-labels\" position={site} icon={motionTrackGraphicIcon",
  'function konradMarkerIcon(',
  'mid-konrad-marker',
  'function nowcastMixMarkerIcon()',
  'mid-nowcastmix-marker',
  'zIndexOffset={800}',
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
  '.mid-motion-track-graphic{',
  '.mid-konrad-marker{',
  '.mid-nowcastmix-marker{',
  '.radarmap.touch-scroll-mode .maplibregl-map{touch-action:pan-y!important}',
  '.composite-map-interaction{',
  '.composite-card{contain:layout paint style;isolation:isolate}'
])need(styles,token,'Komposit-CSS fehlt');

if(failures.length){
  console.error('Komposit-Sichtbarkeit/Scroll-Regression fehlgeschlagen:\n- '+failures.join('\n- '));
  process.exit(1);
}
console.log('Kompositbild geprüft: kompaktes Layerband, sichtbare K3D-/NowCastMIX-Symbole und einzelner weißer Zeitpfeil sowie touchfreundliches Scrollen sind aktiv.');
