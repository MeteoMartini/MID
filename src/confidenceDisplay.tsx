import type {CSSProperties} from 'react';
import {AGREEMENT_COLOR,AGREEMENT_LABEL,type DayAssessment} from './ensembleAssessment';

export type ConfidenceDisplayMode='signal'|'traffic-light'|'text';

export function normalizeConfidenceDisplayMode(value:unknown):ConfidenceDisplayMode{
 return value==='traffic-light'||value==='text'||value==='signal'?value:'signal';
}

function scoreValue(assessment:DayAssessment){return assessment.confidenceScore===null||!Number.isFinite(Number(assessment.confidenceScore))?null:Math.round(Number(assessment.confidenceScore))}
function signalBars(assessment:DayAssessment){const score=scoreValue(assessment);if(score===null||assessment.agreement==='unknown')return 0;if(score>=72)return 4;if(score>=58)return 3;if(score>=44)return 2;return 1}

export function ConfidenceDisplay({assessment,mode,partialBoundary=false,compact=false}:{assessment:DayAssessment;mode:ConfidenceDisplayMode;partialBoundary?:boolean;compact?:boolean}){
 const score=scoreValue(assessment),label=assessment.agreement==='unknown'?'offen':AGREEMENT_LABEL[assessment.agreement],style={'--confidence-color':AGREEMENT_COLOR[assessment.agreement]} as CSSProperties;
 if(partialBoundary)return <span className="confidence-display confidence-display-boundary" aria-hidden="true"><b>teilw.</b></span>;
 if(mode==='traffic-light')return <span className={`confidence-display confidence-display-traffic agreement-${assessment.agreement}${compact?' compact':''}`} style={style} aria-hidden="true"><span className="confidence-traffic-dots"><i className={assessment.agreement==='low'?'active':''}/><i className={assessment.agreement==='medium'?'active':''}/><i className={assessment.agreement==='high'?'active':''}/></span>{score!==null?<small>{score}</small>:null}</span>;
 if(mode==='signal'){const active=signalBars(assessment);return <span className={`confidence-display confidence-display-signal agreement-${assessment.agreement}${compact?' compact':''}`} style={style} aria-hidden="true"><span className="confidence-signal-bars">{[1,2,3,4].map(index=><i key={index} className={index<=active?'active':''}/>)}</span>{score!==null?<small>{score}</small>:null}</span>}
 return <span className={`confidence-display confidence-display-text agreement-${assessment.agreement}${compact?' compact':''}`} style={style} aria-hidden="true"><b>{label}</b>{score!==null?<small>{score}</small>:null}</span>;
}
