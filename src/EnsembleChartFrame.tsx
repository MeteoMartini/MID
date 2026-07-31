import {cloneElement,useLayoutEffect,useRef,useState,type CSSProperties,type ReactElement} from 'react';

type EnsembleChartFrameProps={
 exporting:boolean;
 height:number;
 exportWidth:number;
 children:ReactElement<any>;
};

/**
 * Recharts 3 receives a stable chart height and only the actual container width.
 * Vertical scroll and browser-toolbar changes therefore cannot trigger redundant
 * height state updates. ResizeObserver reads the width without forced layout.
 */
export function EnsembleChartFrame({exporting,height,exportWidth,children}:EnsembleChartFrameProps){
 const hostRef=useRef<HTMLDivElement>(null),[width,setWidth]=useState(0),minHeight=Math.max(180,Math.min(240,height-42));
 useLayoutEffect(()=>{
  if(exporting)return;
  const host=hostRef.current;
  if(!host)return;
  let frame=0;
  const commit=(value:number)=>{
   const next=Math.max(0,Math.floor(value));
   if(!next)return;
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>setWidth(current=>current===next?current:next));
  };
  commit(host.getBoundingClientRect().width);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{const entry=entries[0];if(entry)commit(entry.contentRect.width)}):null;
  observer?.observe(host);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect()};
 },[exporting]);
 if(exporting)return <div className="ensemble-fixed-chart" style={{width:exportWidth,height}}>{cloneElement(children,{width:exportWidth,height,responsive:false})}</div>;
 const chartStyle:CSSProperties={...(children.props.style??{}),width,height,minWidth:0};
 return <div ref={hostRef} className="ensemble-responsive-chart" style={{height,minHeight}}>{width>0?cloneElement(children,{width,height,responsive:false,style:chartStyle}):<span className="ensemble-chart-measuring" aria-hidden="true"/>}</div>;
}
