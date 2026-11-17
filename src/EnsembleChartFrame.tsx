import {cloneElement,useLayoutEffect,useRef,useState,type CSSProperties,type ReactElement} from 'react';
import {createEnsembleChartWidthScheduler} from './ensembleChartWidthScheduler';

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
  const scheduler=createEnsembleChartWidthScheduler(
   callback=>requestAnimationFrame(callback),
   frame=>cancelAnimationFrame(frame),
   next=>setWidth(current=>current===next?current:next),
  );
  scheduler.push(host.getBoundingClientRect().width);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{const entry=entries[0];if(entry)scheduler.push(entry.contentRect.width)}):null;
  observer?.observe(host);
  return()=>{scheduler.dispose();observer?.disconnect()};
 },[exporting]);
 if(exporting)return <div className="ensemble-fixed-chart" style={{width:exportWidth,height}}>{cloneElement(children,{width:exportWidth,height,responsive:false})}</div>;
 const chartStyle:CSSProperties={...(children.props.style??{}),width,height,minWidth:0};
 return <div ref={hostRef} className="ensemble-responsive-chart" style={{height,minHeight}}>{width>0?cloneElement(children,{width,height,responsive:false,style:chartStyle}):<span className="ensemble-chart-measuring" aria-hidden="true"/>}</div>;
}
