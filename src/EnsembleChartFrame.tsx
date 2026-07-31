import {cloneElement,type CSSProperties,type ReactElement} from 'react';

type EnsembleChartFrameProps={
 exporting:boolean;
 height:number;
 exportWidth:number;
 children:ReactElement<any>;
};

/**
 * Recharts 3 uses the chart's native `responsive` mode for the live view.
 * A real wrapper height and a conservative minimum height prevent the chart
 * from collapsing to 0 px while CSS grid/flex containers are being measured.
 * PNG exports continue to use deterministic fixed pixel dimensions.
 */
export function EnsembleChartFrame({exporting,height,exportWidth,children}:EnsembleChartFrameProps){
 if(exporting)return <div className="ensemble-fixed-chart" style={{width:exportWidth,height}}>{cloneElement(children,{width:exportWidth,height,responsive:false})}</div>;
 const minHeight=Math.max(180,Math.min(240,height-42));
 const chartStyle:CSSProperties={...(children.props.style??{}),width:'100%',height:'100%',minWidth:0,minHeight};
 return <div className="ensemble-responsive-chart" style={{height:'100%',minHeight}}>{cloneElement(children,{responsive:true,width:'100%',height:'100%',style:chartStyle})}</div>;
}
