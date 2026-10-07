import {memo,useCallback,useEffect} from 'react';
import {CanvasOverlay,useMidMap,type MidMap} from './MapLibreCore';
import {getModelMapGeography,loadModelMapGeography} from './modelMapGeography';
import germany from './precipitationGermany.json';

export const MODEL_MAP_CONTEXT_ZOOMS={states:4.8,places:5.7};
export function drawModelMapContext(map:Pick<MidMap,'getCanvas'|'project'|'getZoom'|'getCenter'>,canvas:HTMLCanvasElement,labels=true){
 const base=map.getCanvas(),width=base.clientWidth,height=base.clientHeight;if(!width||!height)return;
 const ratio=Math.max(1,Math.min(2,globalThis.devicePixelRatio||1));
 const w=Math.round(width*ratio),h=Math.round(height*ratio);if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;canvas.style.width=`${width}px`;canvas.style.height=`${height}px`}
 const context=canvas.getContext('2d');if(!context)return;
 context.setTransform(ratio,0,0,ratio,0,0);context.clearRect(0,0,width,height);context.lineJoin='round';context.lineCap='round';
 const geography=getModelMapGeography(),zoom=map.getZoom(),offset=Math.round(map.getCenter().lng/360)*360;
 const drawRings=(rings:number[][][],line:number,dash:number[])=>{
  context.beginPath();for(const ring of rings){const points=ring.map(([lon,lat])=>map.project([lon+offset,lat]));if(!points.some((point,index)=>{const next=points[(index+1)%points.length];return Math.max(point.x,next.x)>-100&&Math.min(point.x,next.x)<width+100&&Math.max(point.y,next.y)>-100&&Math.min(point.y,next.y)<height+100}))continue;points.forEach((point,index)=>{if(index)context.lineTo(point.x,point.y);else context.moveTo(point.x,point.y)});context.closePath()}
  // Administrative boundaries stay subordinate to meteorological contours.
  const dark=typeof document!=='undefined'&&document.documentElement.dataset.theme==='dark';
  context.strokeStyle=dark?'rgba(165,181,193,.58)':'rgba(62,83,99,.52)';context.lineWidth=line;context.setLineDash(dash);context.stroke();context.setLineDash([]);
 };
 if(geography)drawRings(geography.countries,zoom>=5?1.1:.8,[3,2]);
 if(!geography)drawRings(germany.geometry.coordinates.flat(),1.15,[3,2]);
 if(geography&&zoom>=MODEL_MAP_CONTEXT_ZOOMS.states)for(const state of geography.states)drawRings(state.rings,.75,[1,2]);
 if(!labels||!geography||zoom<MODEL_MAP_CONTEXT_ZOOMS.places)return;
 context.font=`600 ${zoom>=7?12:11}px system-ui,sans-serif`;context.textBaseline='middle';
 const boxes:Array<{x:number;y:number;width:number}>=[];
 for(const place of geography.places){if(zoom<place.minZoom)continue;const point=map.project([place.lon+offset,place.lat]),textWidth=context.measureText(place.name).width+10,x=point.x+5,y=point.y;
  if(x<8||x+textWidth>width-8||y<12||y>height-12||boxes.some(box=>Math.abs(box.y-y)<18&&x<box.x+box.width&&x+textWidth>box.x))continue;
  boxes.push({x,y,width:textWidth});context.strokeStyle='rgba(255,255,255,.96)';context.lineWidth=3.5;context.strokeText(place.name,x,y);context.fillStyle='#172b40';context.fillText(place.name,x,y);
  context.beginPath();context.arc(point.x,point.y,1.7,0,Math.PI*2);context.fill();
 }
}
function ModelMapContextOverlay({labels=true}:{labels?:boolean}){const map=useMidMap();const render=useCallback((map:MidMap,canvas:HTMLCanvasElement)=>drawModelMapContext(map,canvas,labels),[labels]);useEffect(()=>{if(!map)return;let active=true;void loadModelMapGeography().then(()=>{if(active)map.triggerRepaint()}).catch(()=>{});return()=>{active=false}},[map]);return <CanvasOverlay id="model-map-context" zIndex={1} render={render} events={['render','resize']}/>}
export default memo(ModelMapContextOverlay);
