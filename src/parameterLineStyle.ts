import type {CSSProperties} from 'react';

export type ParameterLineRole='temperature'|'apparent'|'dewpoint'|'pressure'|'probability'|'wind'|'gust';
// One rendered contract for the 24h profile and every expanded daily chart.
const roles:Record<ParameterLineRole,{color:string;width:number;dash?:string;opacity?:number}>={
 temperature:{color:'var(--param-temperature)',width:2.75},
 apparent:{color:'var(--apparent-line)',width:1.9,dash:'5 4',opacity:.98},
 dewpoint:{color:'var(--param-dewpoint)',width:2,dash:'2 5',opacity:.96},
 pressure:{color:'var(--param-pressure)',width:1.55,opacity:.98},
 probability:{color:'var(--param-precipitation)',width:2,dash:'4 3'},
 wind:{color:'var(--param-wind)',width:2.5},
 gust:{color:'var(--param-gust)',width:2,dash:'5 4',opacity:.96},
};
export function parameterLineStyle(role:ParameterLineRole):CSSProperties{
 const spec=roles[role];
 return{fill:'none',stroke:spec.color,strokeWidth:spec.width,strokeDasharray:spec.dash??'none',strokeLinecap:'round',strokeLinejoin:'round',opacity:spec.opacity??1,vectorEffect:'non-scaling-stroke',filter:'none'};
}
