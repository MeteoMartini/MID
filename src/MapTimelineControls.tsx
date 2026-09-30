import {Pause,Play,SkipBack,SkipForward} from 'lucide-react';
import type {ReactNode} from 'react';

export type MapTimelineMarker={
 key:string;
 phase?:'observation'|'nowcast'|'forecast'|string;
};

type PlaybackSpeed={value:number;label:string};
const PLAYBACK_SPEEDS:readonly PlaybackSpeed[]=[
 {value:4.8,label:'Langsam · 4,8 s'},
 {value:2.4,label:'Normal · 2,4 s'},
 {value:1.2,label:'Schnell · 1,2 s'}
];

type MapTimelineTransportProps={
 className:string;
 stepButtonClassName:string;
 playButtonClassName:string;
 index:number;
 count:number;
 playing:boolean;
 canAnimate:boolean;
 onPrevious:()=>void;
 onToggle:()=>void;
 onNext:()=>void;
 playLabel:string;
 pauseLabel:string;
 children?:ReactNode;
};

export function MapTimelineTransport({
 className,stepButtonClassName,playButtonClassName,index,count,playing,canAnimate,onPrevious,onToggle,onNext,playLabel,pauseLabel,children
}:MapTimelineTransportProps){
 const lastIndex=Math.max(0,count-1),selectedIndex=Math.min(index,lastIndex);
 return <div className={className} role="group" aria-label="Animationssteuerung">
  {children??<>
   <button type="button" className={stepButtonClassName} disabled={!canAnimate||selectedIndex<=0} onClick={onPrevious} title="Vorheriger verfügbarer Zeitschritt" aria-label="Vorheriger verfügbarer Zeitschritt"><SkipBack size={17}/></button>
   <button type="button" className={playButtonClassName} disabled={!canAnimate} onClick={onToggle} title={playing?pauseLabel:playLabel} aria-label={playing?pauseLabel:playLabel}>{playing?<Pause size={18}/>:<Play size={18}/>}</button>
   <button type="button" className={stepButtonClassName} disabled={!canAnimate||selectedIndex>=lastIndex} onClick={onNext} title="Nächster verfügbarer Zeitschritt" aria-label="Nächster verfügbarer Zeitschritt"><SkipForward size={17}/></button>
  </>}
 </div>;
}

type MapTimelineSpeedControlProps={
 className:string;
 playbackSeconds:number;
 onPlaybackSecondsChange:(seconds:number)=>void;
 options?:readonly PlaybackSpeed[];
};

export function MapTimelineSpeedControl({className,playbackSeconds,onPlaybackSecondsChange,options=PLAYBACK_SPEEDS}:MapTimelineSpeedControlProps){
 return <label className={`map-timeline-speed ${className}`}><span>Tempo</span><select aria-label="Anzeigedauer je Bild" value={playbackSeconds} onChange={event=>onPlaybackSecondsChange(Number(event.target.value))}>{options.map(speed=><option key={speed.value} value={speed.value}>{speed.label}</option>)}</select></label>;
}

type MapTimelineRangeProps={
 className:string;
 markerClassName:string;
 index:number;
 count:number;
 canAnimate:boolean;
 onSeek:(index:number)=>void;
 rangeLabel:string;
 countLabel?:ReactNode;
 markers?:readonly MapTimelineMarker[];
 children?:ReactNode;
};

export function MapTimelineRange({className,markerClassName,index,count,canAnimate,onSeek,rangeLabel,countLabel,markers=[],children}:MapTimelineRangeProps){
 const lastIndex=Math.max(0,count-1),selectedIndex=Math.min(index,lastIndex);
 return <label className={`map-timeline-range ${className}`} style={{position:'relative'}}>
  {countLabel!==undefined&&countLabel!==null&&<span className="map-timeline-count">{countLabel}</span>}
  {markers.length>0&&<div className={`map-timeline-markers ${markerClassName}`} aria-hidden="true">{markers.map((marker,markerIndex)=><i key={marker.key} className={`${marker.phase||'available'}${markerIndex===selectedIndex?' active':''}`}/>)}</div>}
  <input type="range" min={0} max={lastIndex} value={selectedIndex} disabled={!canAnimate} onChange={event=>onSeek(Number(event.target.value))} aria-label={rangeLabel}/>
  {children}
 </label>;
}

type MapTimelineLiveButtonProps={
 className:string;
 active?:boolean;
 disabled?:boolean;
 onClick:()=>void;
 label:string;
};

export function MapTimelineLiveButton({className,active=false,disabled=false,onClick,label}:MapTimelineLiveButtonProps){
 const activeClass=active&&!className.split(/\s+/).includes('active')?' active':'';
 return <button type="button" className={`map-timeline-live ${className}${activeClass}`} onClick={onClick} disabled={disabled}>{label}</button>;
}

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
 transportControl?:ReactNode;
 speedControl?:ReactNode;
 rangeControl?:ReactNode;
 timeControl?:ReactNode;
 liveControl?:ReactNode;
};

export default function MapTimelineControls({
 className,transportClassName,stepButtonClassName,playButtonClassName,speedClassName,rangeClassName,markerClassName,timeClassName,liveButtonClassName,
 index,count,playing,canAnimate,liveActive,liveDisabled=false,playbackSeconds,onPlaybackSecondsChange,onPrevious,onToggle,onNext,onSeek,onLive,
 rangeLabel,countLabel,valueLabel,detailLabel,liveLabel='Jetzt',playLabel='Animation starten',pauseLabel='Animation pausieren',markers=[],future=false,children,
 transportControl,speedControl,rangeControl,timeControl,liveControl
}:MapTimelineControlsProps){
 return <div className={`map-timeline-controls ${className}`}>
  {transportControl??<MapTimelineTransport className={transportClassName} stepButtonClassName={stepButtonClassName} playButtonClassName={playButtonClassName} index={index} count={count} playing={playing} canAnimate={canAnimate} onPrevious={onPrevious} onToggle={onToggle} onNext={onNext} playLabel={playLabel} pauseLabel={pauseLabel}>{children}</MapTimelineTransport>}
  {speedControl??<MapTimelineSpeedControl className={speedClassName} playbackSeconds={playbackSeconds} onPlaybackSecondsChange={onPlaybackSecondsChange}/>}
  {rangeControl??<MapTimelineRange className={rangeClassName} markerClassName={markerClassName} index={index} count={count} canAnimate={canAnimate} onSeek={onSeek} rangeLabel={rangeLabel} countLabel={countLabel} markers={markers}/>}
  {timeControl===undefined?<time className={`map-timeline-time ${timeClassName}${future?' future':''}`}><span>{valueLabel}</span>{detailLabel!==undefined&&<small>{detailLabel}</small>}</time>:timeControl}
  {liveControl??<MapTimelineLiveButton className={`${liveButtonClassName}${liveActive?' active':''}`} active={liveActive} onClick={onLive} disabled={liveDisabled} label={liveLabel}/>}
 </div>;
}