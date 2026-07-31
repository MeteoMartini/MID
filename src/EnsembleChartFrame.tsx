import {cloneElement,useLayoutEffect,useRef,useState,type CSSProperties,type ReactElement} from 'react';

type EnsembleChartFrameProps={
 exporting:boolean;
 height:number;
 exportWidth:number;
 children:ReactElement<any>;
};

type ChartSize={width:number;height:number};

/**
 * Recharts 3 receives stable pixel dimensions without reading layout during scroll.
 * ResizeObserver contentRect is used directly; updates occur only when dimensions
 * actually change. This keeps live tooltips intact and avoids scroll jank.
 */
export function EnsembleChartFrame({exporting,height,exportWidth,children}:EnsembleChartFrameProps){
 const hostRef=useRef<HTMLDivElement>(null);
 const minHeight=Math.max(180,Math.min(240,height-42));
 const[size,setSize]=useState<ChartSize>({width:0,height:minHeight});
 useLayoutEffect(()=>{
  if(exporting)return;
  const host=hostRef.current;
  if(!host)return;
  let frame=0;
  const commit=(width:number,nextHeight:number)=>{
   const next={width:Math.max(0,Math.floor(width)),height:Math.max(minHeight,Math.floor(nextHeight)||minHeight)};
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>setSize(current=>current.width===next.width&&current.height===next.height?current:next));
  };
  const initial=host.getBoundingClientRect();
  commit(initial.width,initial.height);
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(entries=>{
   const entry=entries[0];
   if(entry)commit(entry.contentRect.width,entry.contentRect.height);
  }):null;
  observer?.observe(host);
  return()=>{cancelAnimationFrame(frame);observer?.disconnect()};
 },[exporting,minHeight]);
 if(exporting)return <div className="ensemble-fixed-chart" style={{width:exportWidth,height}}>{cloneElement(children,{width:exportWidth,height,responsive:false})}</div>;
 const chartStyle:CSSProperties={...(children.props.style??{}),width:size.width,height:size.height,minWidth:0};
 return <div ref={hostRef} className="ensemble-responsive-chart" style={{height:'100%',minHeight}}>{size.width>0?cloneElement(children,{width:size.width,height:size.height,responsive:false,style:chartStyle}):<span className="ensemble-chart-measuring" aria-hidden="true"/>}</div>;
}
