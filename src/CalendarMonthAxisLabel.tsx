import {calendarMonthLabel} from './chartScale';
/** Keep every calendar month readable in the available plot width. */
export function CalendarMonthAxisLabel({date,x,y,slotWidth}:{date:string;x:number;y:number;slotWidth:number}){
 const stacked=slotWidth<48;
 return <text className="month-label" x={x} y={y} textAnchor="middle" aria-label={date.slice(0,7)}><title>{calendarMonthLabel(date,false)}</title>{stacked?<><tspan x={x}>{date.slice(5,7)}</tspan><tspan x={x} dy={14}>{date.slice(2,4)}</tspan></>:calendarMonthLabel(date,slotWidth<85)}</text>;
}
