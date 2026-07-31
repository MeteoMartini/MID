import {cloneElement,useLayoutEffect,useRef,useState,type CSSProperties,type ReactElement} from 'react';

type EnsembleChartFrameProps={
 exporting:boolean;
 height:number;
 exportWidth:number;
 children:ReactElement<any>;
};

type ChartSize={width:number;height:number};

/**
 * Recharts 3 receives explicit pixel dimensions in both live and export mode.
 * This preserves the pre-audit interaction model (tooltips, reference layers,
 * weather strips and precise hit testing) while avoiding a 0-pixel chart when
 * nested grid/flex containers are measured during layout.
 */
export function EnsembleChartFrame({exporting,height,exportWidth,children}:EnsembleChartFrameProps){
 const hostRef=useRef<HTMLDivElement>(null);
 const[size,setSize]=useState<ChartSize>({width:0,height:0});
 const minHeight=Math.max(180,Math.min(240,height-42));
 useLayoutEffect(()=>{
  if(exporting)return;
  const host=hostRef.current;
  if(!host)return;
  let frame=0;
  const measure=()=>{
   cancelAnimationFrame(frame);
   frame=requestAnimationFrame(()=>{
    const bounds=host.getBoundingClientRect();
    const next={width:Math.max(0,Math.floor(bounds.width)),height:Math.max(minHeight,Math.floor(bounds.height)||minHeight)};
    setSize(current=>current.width===next.width&&current.height===next.height?current:next);
   });
  };
  measure();
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(measure):null;
  observer?.observe(host);
  window.addEventListener('orientationchange',measure,{passive:true});
  return()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('orientationchange',measure)};
 },[exporting,minHeight]);
 if(exporting)return <div className="ensemble-fixed-chart" style={{width:exportWidth,height}}>{cloneElement(children,{width:exportWidth,height,responsive:false})}</div>;
 const chartStyle:CSSProperties={...(children.props.style??{}),width:size.width,height:size.height,minWidth:0};
 return <div ref={hostRef} className="ensemble-responsive-chart" style={{height:'100%',minHeight}}>{size.width>0?cloneElement(children,{width:size.width,height:size.height,responsive:false,style:chartStyle}):<span className="ensemble-chart-measuring" aria-hidden="true"/>}</div>;
}
