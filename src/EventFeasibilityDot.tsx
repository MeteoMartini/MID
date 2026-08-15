import type {EventPlan,EventStatus} from './eventCenter'

export type EventFeasibilityTone=EventStatus|'unknown'

export function eventFeasibilityAssessment(plan:EventPlan|null|undefined){
 const tone:EventFeasibilityTone=plan?.advice.status??'unknown'
 if(tone==='good')return{tone,label:'Gut umsetzbar',detail:'Nach aktuellem Stand keine markanten wetterbedingten Einschränkungen.'}
 if(tone==='watch')return{tone,label:'Beeinträchtigungen möglich',detail:'Einzelne Wetterfaktoren können das Event beeinflussen und sollten beachtet werden.'}
 if(tone==='caution')return{tone,label:'Deutlich beeinträchtigt',detail:'Markante Wetterfaktoren können die Durchführung erheblich beeinträchtigen.'}
 return{tone,label:'Noch nicht bewertet',detail:'Für dieses Event liegt noch keine Wetteranalyse vor.'}
}

export function EventFeasibilityDot({plan,className=''}:{plan:EventPlan|null|undefined;className?:string}){
 const assessment=eventFeasibilityAssessment(plan)
 return <span className={`event-feasibility-dot ${assessment.tone}${className?` ${className}`:''}`} role="img" aria-label={`Wetterbewertung: ${assessment.label}`} title={`${assessment.label} · ${assessment.detail}`}/>
}
