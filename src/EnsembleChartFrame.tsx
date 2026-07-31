import {cloneElement,type ReactElement} from 'react';
import {ResponsiveContainer} from 'recharts';

type EnsembleChartFrameProps={
 exporting:boolean;
 height:number;
 exportWidth:number;
 children:ReactElement<any>;
};

/** Keeps responsive on-screen charts and fixed-size PNG exports on one rendering path. */
export function EnsembleChartFrame({exporting,height,exportWidth,children}:EnsembleChartFrameProps){
 return exporting
  ?<div className="ensemble-fixed-chart" style={{width:exportWidth,height}}>{cloneElement(children,{width:exportWidth,height})}</div>
  :<ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={80}>{children}</ResponsiveContainer>;
}
