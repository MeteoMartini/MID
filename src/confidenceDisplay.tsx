import type {CSSProperties} from 'react';
import {AGREEMENT_LABEL,type Agreement,type DayAssessment} from './ensembleAssessment';

export type ConfidenceDisplayMode='signal'|'traffic-light'|'text';

export function normalizeConfidenceDisplayMode(value:unknown):ConfidenceDisplayMode{
 return value==='traffic-light'||value==='text'||value==='signal'?value:'signal';
}

function scoreValue(assessment:DayAssessment){return assessment.confidenceScore===null||!Number.isFinite(Number(assessment.confidenceScore))?null:Math.round(Number(assessment.confidenceScore))}
function signalBars(assessment:DayAssessment){const score=scoreValue(assessment);if(score===null||assessment.agreement==='unknown')return 0;return Math.max(1,Math.min(5,Math.ceil(score/20)))}
const SCORE_COLOR_STOPS=[{score:0,rgb:[198,79,72]},{score:35,rgb:[197,93,60]},{score:50,rgb:[190,132,43]},{score:62,rgb:[166,154,46]},{score:72,rgb:[112,158,70]},{score:82,rgb:[70,153,92]},{score:100,rgb:[45,143,91]}] as const;
function mixRgb(left:readonly[number,number,number],right:readonly[number,number,number],ratio:number){const rgb=left.map((value,index)=>Math.round(value+(right[index]-value)*ratio));return`rgb(${rgb[0]} ${rgb[1]} ${rgb[2]})`}
export function confidenceScoreColor(score:number|null,agreement:Agreement){if(score===null||agreement==='unknown')return'#7c8795';const value=Math.max(0,Math.min(100,score));for(let index=1;index<SCORE_COLOR_STOPS.length;index+=1){const right=SCORE_COLOR_STOPS[index],left=SCORE_COLOR_STOPS[index-1];if(value<=right.score)return mixRgb(left.rgb,right.rgb,(value-left.score)/Math.max(1,right.score-left.score))}return'rgb(45 143 91)'}

export function ConfidenceDisplay({assessment,mode,partialBoundary=false,compact=false}:{assessment:DayAssessment;mode:ConfidenceDisplayMode;partialBoundary?:boolean;compact?:boolean}){
 const score=scoreValue(assessment),label=assessment.agreement==='unknown'?'offen':AGREEMENT_LABEL[assessment.agreement],style={'--confidence-color':confidenceScoreColor(score,assessment.agreement)} as CSSProperties;
 if(partialBoundary)return <span className="confidence-display confidence-display-boundary" aria-hidden="true"><b>teilw.</b></span>;
 if(mode==='traffic-light')return <span className={`confidence-display confidence-display-traffic agreement-${assessment.agreement}${compact?' compact':''}`} style={style} aria-hidden="true"><span className="confidence-traffic-dots"><i className={assessment.agreement==='low'?'active':''}/><i className={assessment.agreement==='medium'?'active':''}/><i className={assessment.agreement==='high'?'active':''}/></span>{score!==null?<small>{score}</small>:null}</span>;
 if(mode==='signal'){const active=signalBars(assessment);return <span className={`confidence-display confidence-display-signal agreement-${assessment.agreement}${compact?' compact':''}`} style={style} aria-hidden="true"><span className="confidence-signal-bars">{[1,2,3,4,5].map(index=><i key={index} className={index<=active?'active':''}/>)}</span>{score!==null?<small>{score}</small>:null}</span>}
 return <span className={`confidence-display confidence-display-text agreement-${assessment.agreement}${compact?' compact':''}`} style={style} aria-hidden="true"><b>{label}</b>{score!==null?<small>{score}</small>:null}</span>;
}
