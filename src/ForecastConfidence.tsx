import {useEffect,useState} from 'react';
import {AGREEMENT_COLOR,AGREEMENT_LABEL,agreementWindows,assessmentSummary,firstAgreementChange,type DayAssessment} from './ensembleAssessment';

function dateLabel(date:string){return new Date(`${date}T12:00:00Z`).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'})}
function windowLabel(window:{start:string;end:string}){return window.start===window.end?dateLabel(window.start):`${dateLabel(window.start)} – ${dateLabel(window.end)}`}

export function EnsembleAssessmentDetails({assessment}:{assessment:DayAssessment}){
 return <div className="mid-ensemble-assessment" style={{fontSize:12,lineHeight:1.45,maxHeight:'60vh',overflowY:'auto'}}>
  <strong>{assessmentSummary(assessment)}</strong>
  <dl style={{margin:'8px 0'}}>{assessment.parameters.map(parameter=><div key={parameter.key} style={{padding:'6px 0',borderBottom:'1px solid var(--border, #8884)'}}>
   <dt style={{display:'flex',justifyContent:'space-between',gap:8}}><b>{parameter.label}</b><b style={{color:AGREEMENT_COLOR[parameter.agreement]}}>{AGREEMENT_LABEL[parameter.agreement]}</b></dt>
   <dd style={{margin:0}}>{parameter.detail}<br/>{parameter.coverage?`${parameter.coverage.members}/${parameter.coverage.expectedMembers} vollständige Mitglieder · ${parameter.coverage.families}/${parameter.coverage.expectedFamilies} geladene Modellgruppen`:'Datenabdeckung unbekannt'}{parameter.quality==='limited'?' · Datenbasis eingeschränkt':parameter.quality==='missing'?' · keine ausreichende Datenbasis':''}</dd>
  </div>)}</dl>
  <p>Übereinstimmung der Modelllösungen, keine kalibrierte Trefferwahrscheinlichkeit. Hohe Übereinstimmung kann auch für ungünstiges Wetter gelten.</p>
  <details><summary style={{minHeight:32,cursor:'pointer'}}>Bewertungsgrenzen und Datenstand</summary><p>Transparente Anzeigegrenzen für die P10–P90-Breite, hoch/mittel: Temperatur 4/8 K; Niederschlag 3/10 mm pro Tag; Wind 8/16 kt; Böen 12/24 kt; relative Sonne 25/50 Prozentpunkte. Beim Regen begrenzt ein offener Trocken-/Nass-Ausgang zusätzlich die Übereinstimmung. Diese Grenzen sind nicht als Vorhersagegüte kalibriert.</p><p>Hohe Bewertung erfordert mindestens zwei getrennte Modellgruppen, sechs vollständige native Mitglieder, mindestens 80 % Mitgliederabdeckung und aktuelle Laufzeiten aller beitragenden Gruppen. Fehlende Parameter werden nicht durch andere ersetzt.</p>{assessment.parameters.map(p=><p key={p.key}>{p.label}: {p.coverage?.oldestInitialisation?`ältester beitragender Lauf ${new Date(p.coverage.oldestInitialisation).toLocaleString('de-DE')}`:'Laufzeit nicht belegt'}</p>)}</details>
 </div>;
}

export function ForecastConfidenceOverview({assessments,outlook,advancedMode=false}:{assessments:DayAssessment[];outlook?:{headline:string;detail:string};advancedMode?:boolean}){
 const windows=agreementWindows(assessments),change=firstAgreementChange(assessments),first=assessments[0],limited=change??assessments.find(d=>d.agreement!=='high');
 return <section className="ensemble-forecast-compass cockpit-forecast-compass" aria-label="MID Prognose-Kompass">
  <header><span aria-hidden="true">◎</span><div><small>MID Prognose-Kompass</small><strong>Prognoseentwicklung</strong></div></header>
  <div><span><small>Gemeinsam konsistente Zeiträume</small><b>{windows.length?windowLabel(windows[0]):'Kein durchgehend gut belegtes Fenster'}</b><em>{windows.length?'Temperatur, Niederschlag, Wind/Böen und Sonne gemeinsam.':'Mindestens ein Bereich ist unsicher oder unzureichend belegt.'}</em></span>
   <span><small>Erwartete Entwicklung</small><b>{outlook?.headline??'Tagesprognosen vergleichen'}</b><em>{outlook?.detail??'Auch eine klare Wetterentwicklung kann ungünstiges Wetter bedeuten.'}</em></span>
   <span><small>{change?'Bewertung verschlechtert sich':'Begrenzender Bereich'}</small><b>{limited?`${dateLabel(limited.date)}: ${limited.limiting.map(p=>p.label).join(', ')}`:'Kein begrenzender Bereich erkannt'}</b><em>{limited?.parameters.some(p=>p.quality!=='sufficient')?'Datenbasis unvollständig; keine belastbare Gesamtaussage.':limited?'Modelllösungen weichen in diesem Bereich stärker voneinander ab.':'Die verfügbaren Parameter liegen innerhalb der Anzeigegrenzen.'}</em></span>
  </div>
  <details style={{marginTop:8,fontSize:13}}><summary style={{minHeight:40,cursor:'pointer'}}>Parameter und weitere Zeiträume</summary>
   {windows.length>1&&<p>Weitere gemeinsame Fenster: {windows.slice(1).map(windowLabel).join(' · ')}</p>}
   {first?.parameters.map(parameter=>{const periods=agreementWindows(assessments,parameter.key);return <p key={parameter.key}><b>{parameter.label}:</b> {periods.length?periods.map(windowLabel).join(' · '):'kein ausreichend belegtes Fenster mit hoher Übereinstimmung'}</p>})}
   <p>Fenster zeigen hohe Modellübereinstimmung für jeden enthaltenen Tag. Sie sind keine gemeinsame Eintrittswahrscheinlichkeit, keine Wetterfreigabe und keine Garantie. Datenlücken unterbrechen jedes Fenster.</p>
   {advancedMode&&<p>Schwellen sind nachvollziehbare Darstellungstoleranzen. Eine empirische Verifikation nach Parameter und Vorlauf bleibt erforderlich.</p>}
  </details>
 </section>;
}

/** Re-evaluate run freshness in long-lived foreground and resumed PWA views. */
export function useEnsembleAssessmentTime(){const [now,setNow]=useState(Date.now);useEffect(()=>{const refresh=()=>setNow(Date.now()),timer=window.setInterval(refresh,60000);document.addEventListener("visibilitychange",refresh);return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh)}},[]);return now}
