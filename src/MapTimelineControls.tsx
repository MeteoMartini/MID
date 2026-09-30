import {Pause,Play,SkipBack,SkipForward} from 'lucide-react';
import type {ReactNode} from 'react';

export type MapTimelineMarker={
 key:string;
 phase?:'observation'|'nowcast'|'forecast'|string;
};

type MapTimelineControlsProps={
 className:string;
 transportClassName:string;
 stepButtonClassName:string;
 playButtonClassName:string;
 speedClassName:string;
 rangeClassName:string;
 markerClassName:string;
 timeClassName:string;
 liveButtonClassName:string;
 index:number;
 count:number;
 playing:boolean;
 canAnimate:boolean;
 liveActive:boolean;
 liveDisabled?:boolean;
 playbackSeconds:number;
 onPlaybackSecondsChange:(seconds:number)=>void;
 onPrevious:()=>void;
 onToggle:()=>void;
 onNext:()=>void;
 onSeek:(index:number)=>void;
 onLive:()=>void;
 rangeLabel:string;
 countLabel:ReactNode;
 valueLabel:ReactNode;
 detailLabel?:ReactNode;
 liveLabel?:string;
 playLabel:string;
 pauseLabel:string;
 markers?:readonly MapTimelineMarker[];
 future?:boolean;
 children?:ReactNode;
};

const PLAYBACK_SPEEDS=[{value:4.8,label:'Langsam · 4,8 s'},{value:2.4,label:'Normal · 2,4 s'},{value:1.2,label:'Schnell · 1,2 s'}] as const;

export default function MapTimelineControls({
 className,transportClassName,stepButtonClassName,playButtonClassName,speedClassName,rangeClassName,markerClassName,timeClassName,liveButtonClassName,
 index,count,playing,canAnimate,liveActive,liveDisabled=false,playbackSeconds,onPlaybackSecondsChange,onPrevious,onToggle,onNext,onSeek,onLive,
 rangeLabel,countLabel,valueLabel,detailLabel,liveLabel='Jetzt',playLabel='Animation starten',pauseLabel='Animation pausieren',markers=[],future=false,children
}:MapTimelineControlsProps){
 const lastIndex=Math.max(0,count-1),selectedIndex=Math.min(index,lastIndex);
 return <div className={`map-timeline-controls ${className}`}>
  <div className={transportClassName} role="group" aria-label="Animationssteuerung">
   {children||<>
    <button type="button" className={stepButtonClassName} disabled={!canAnimate||selectedIndex<=0} onClick={onPrevious} title="Vorheriger verfügbarer Zeitschritt" aria-label="Vorheriger verfügbarer Zeitschritt"><SkipBack size={17}/></button>
    <button type="button" className={playButtonClassName} disabled={!canAnimate} onClick={onToggle} title={playing?pauseLabel:playLabel} aria-label={playing?pauseLabel:playLabel}>{playing?<Pause size={18}/>:<Play size={18}/>}</button>
    <button type="button" className={stepButtonClassName} disabled={!canAnimate||selectedIndex>=lastIndex} onClick={onNext} title="Nächster verfügbarer Zeitschritt" aria-label="Nächster verfügbarer Zeitschritt"><SkipForward size={17}/></button>
   </>}
  </div>
  <label className={`map-timeline-speed ${speedClassName}`}><span>Tempo</span><select aria-label="Anzeigedauer je Bild" value={playbackSeconds} onChange={event=>onPlaybackSecondsChange(Number(event.target.value))}>{PLAYBACK_SPEEDS.map(speed=><option key={speed.value} value={speed.value}>{speed.label}</option>)}</select></label>
  <label className={`map-timeline-range ${rangeClassName}`}>
   <span className="map-timeline-count">{countLabel}</span>
   <div className="map-timeline-track">
    {markers.length>0&&<div className={`map-timeline-markers ${markerClassName}`} aria-hidden="true">{markers.map((marker,markerIndex)=><i key={marker.key} className={`${marker.phase||'available'}${markerIndex===selectedIndex?' active':''}`}/>)}</div>}
    <input type="range" min={0} max={lastIndex} value={selectedIndex} disabled={!canAnimate} onChange={event=>onSeek(Number(event.target.value))} aria-label={rangeLabel}/>
   </div>
  </label>
  <time className={`map-timeline-time ${timeClassName}${future?' future':''}`}><span>{valueLabel}</span>{detailLabel!==undefined&&<small>{detailLabel}</small>}</time>
  <button type="button" className={`map-timeline-live ${liveButtonClassName}${liveActive?' active':''}`} onClick={onLive} disabled={liveDisabled}>{liveLabel}</button>
 </div>;
}