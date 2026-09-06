import {useEffect,useState} from 'react';
import {AppInfoHint} from './AppInfoPopover';
import {AGREEMENT_COLOR,AGREEMENT_LABEL,DATA_QUALITY_LABEL,agreementWindows,assessmentSummary,firstAgreementChange,trailingUnknownCoverageDate,type DayAssessment,type EnsembleParameter} from './ensembleAssessment';

function dateLabel(date:string){return new Date(`${date}T12:00:00Z`).toLocaleDateString('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:'UTC'})}
function windowLabel(window:{start:string;end:string}){return window.start===window.end?dateLabel(window.start):`${dateLabel(window.start)} – ${dateLabel(window.end)}`}
function parameterQualityLabel(quality:'sufficient'|'limited'|'missing'){return quality==='sufficient'?'Datenbasis gut':quality==='limited'?'Datenbasis eingeschränkt':'Datenbasis nicht ausreichend'}

function scoreRangeLabel(window:{start:string;end:string},assessments:DayAssessment[],parameter?:EnsembleParameter){
 const values=assessments.filter(day=>day.date>=window.start&&day.date<=window.end).map(day=>parameter?day.parameters.find(item=>item.key===parameter)?.score:day.confidenceScore).filter((value):value is number=>value!==null&&value!==undefined&&Number.isFinite(value)).map(value=>Math.round(value));
 if(!values.length)return'';const minimum=Math.min(...values),maximum=Math.max(...values);return minimum===maximum?`Index ${minimum}/100`:`Index ${minimum}–${maximum}/100`;
}

export function EnsembleAssessmentDetails({assessment}:{assessment:DayAssessment}){
 return <div className="mid-ensemble-assessment" style={{fontSize:12,lineHeight:1.45,maxHeight:'60vh',overflowY:'auto'}}>
  <strong>{assessmentSummary(assessment)}</strong>
  <p style={{margin:'5px 0 8px'}}>Konfidenz und Datenqualität werden getrennt bewertet. Der Index ist keine Trefferwahrscheinlichkeit und kein Wetterfreigabesignal. In der 14-Tage-Übersicht zeigt die Füllfarbe die Konfidenz; ein zusätzlicher Außenring kennzeichnet nur eine eingeschränkte, schwache oder nicht ausreichende Datenbasis.</p>
  <dl style={{margin:'8px 0'}}>{assessment.parameters.map(parameter=><div key={parameter.key} style={{padding:'6px 0',borderBottom:'1px solid var(--border, #8884)'}}>
   <dt style={{display:'flex',justifyContent:'space-between',gap:8}}><b>{parameter.label}</b><b style={{color:AGREEMENT_COLOR[parameter.agreement]}}>{parameter.agreement==='unknown'?'nicht bewertbar':`${AGREEMENT_LABEL[parameter.agreement]} · Index ${Math.round(parameter.score??0)}/100`}</b></dt>
   <dd style={{margin:0}}>{parameter.detail}<br/>{parameter.coverage?`${parameter.coverage.members}/${parameter.coverage.expectedMembers} vollständige Mitglieder · ${parameter.coverage.families}/${parameter.coverage.expectedFamilies} erwartete Modellgruppen · ${parameterQualityLabel(parameter.quality)}`:'Datenabdeckung unbekannt'}{Math.abs(parameter.calibrationAdjustment)>=.25?` · lokale Skill-Korrektur ${parameter.calibrationAdjustment>0?'+':''}${parameter.calibrationAdjustment.toLocaleString('de-DE',{maximumFractionDigits:1})} Indexpunkte`:''}</dd>
  </div>)}</dl>
  <p>Der meteorologische Teil bewertet vorlaufnormalisierte P10–P90-Spreads robust über Temperatur, Niederschlag und Wind/Böen; Sonnenschein erhält bewusst geringeres Gewicht und kann den ganzen Tag nicht allein auf „gering“ ziehen. Eine Regenwahrscheinlichkeit um 50 % bedeutet einen offenen Ereignisausgang, aber nicht automatisch eine schlechte probabilistische Prognose.</p>
  <details><summary style={{minHeight:32,cursor:'pointer'}}>Methodik, Datenstand und Kalibrierung</summary><p>Basisgrenzen bei kurzem Vorlauf: Temperatur 4/8 K; Niederschlag 3/10 mm pro Tag; Wind 8/16 kt; Böen 12/24 kt; relative Sonne 25/50 Prozentpunkte. Mit wachsendem Vorlauf werden diese Grenzen entsprechend dem typischerweise zunehmenden Ensemble-Spread stufenlos erweitert. Gleichzeitig begrenzt ein Vorlauf-Cap unrealistisch hohe Langfristkonfidenz.</p><p>Die Gesamtbewertung ist eine gewichtete robuste Aggregation: Niederschlag 32 %, Temperatur 28 %, Wind/Böen 28 %, Sonne 12 %. Erst mehrere schwache Kernparameter drücken die Gesamtbewertung deutlich. Fehlende oder ältere Daten verschlechtern primär die separat ausgewiesene Datenqualität; erst eine sehr schwache Datenbasis begrenzt die Gesamtaussage.</p><p>Hohe Datenqualität setzt mindestens zwei unabhängige Modellgruppen, sechs vollständige native Mitglieder, ausreichende erwartete Mitgliederabdeckung und aktuelle beitragende Läufe voraus. Erwartete Modellgruppen werden parameterweise bestimmt; ein Modell, das einen Parameter grundsätzlich nicht liefert, zählt dort nicht als Ausfall.</p>{assessment.calibrationApplied?<p>Lokale Skill-Kalibrierung aktiv: {assessment.calibrationSampleDays} abgeschlossene Rückblickstage. MID nutzt dafür bestehende lokale Fehler- und Brier-Auswertungen nur gedämpft und nur bis etwa 96 Stunden Vorlauf; Langfristtage werden nicht aus Kurzfriststatistik hoch- oder herunterkalibriert.</p>:<p>Lokale Skill-Kalibrierung derzeit nicht oder noch nicht ausreichend belegt. Die Anzeige bleibt dann vollständig ensemble- und vorlaufbasiert.</p>}{assessment.parameters.map(p=><p key={p.key}>{p.label}: {p.coverage?.oldestInitialisation?`ältester beitragender Lauf ${new Date(p.coverage.oldestInitialisation).toLocaleString('de-DE')}`:'Laufzeit nicht belegt'}</p>)}</details>
 </div>;
}

export function ForecastConfidenceOverview({assessments,outlook,advancedMode=false}:{assessments:DayAssessment[];outlook?:{headline:string;detail:string};advancedMode?:boolean}){
 const ordered=[...assessments].sort((a,b)=>a.date.localeCompare(b.date)),windows=agreementWindows(ordered),primaryWindow=windows[0],change=firstAgreementChange(ordered),coverageDate=trailingUnknownCoverageDate(ordered),firstEvaluable=ordered.find(day=>day.agreement!=='unknown'),meteorologicalLimit=change??ordered.find(day=>day.agreement!=='high'&&day.agreement!=='unknown'),dataIssue=ordered.find(day=>day.dataQuality==='poor'||day.dataQuality==='missing');
 const lowest=meteorologicalLimit?.limiting.map(p=>p.label).join(', ')||'',coverageDay=coverageDate?ordered.find(day=>day.date===coverageDate):undefined;
 const primaryText=primaryWindow?`${windowLabel(primaryWindow)} · ${scoreRangeLabel(primaryWindow,ordered)}`:firstEvaluable?`Aktuell ${AGREEMENT_LABEL[firstEvaluable.agreement]} · Index ${Math.round(firstEvaluable.confidenceScore??0)}/100`:'Noch nicht belastbar bewertbar';
 const thirdLabel=change?'Konfidenz nimmt ab':coverageDay?'Datenbasis / Randtag':dataIssue?'Datenbasis':'Konfidenzverlauf';
 const thirdTitle=change?`${dateLabel(change.date)}${lowest?`: ${lowest}`:''}`:coverageDay?`${dateLabel(coverageDay.date)} · nur teilweise belegt`:dataIssue?`${dateLabel(dataIssue.date)} · ${DATA_QUALITY_LABEL[dataIssue.dataQuality]}`:'Kein deutlicher meteorologischer Rückgang erkannt';
 const thirdDetail=change?'Die Ensemblelösungen streuen in mindestens einem Kernbereich stärker oder der Vorlauf begrenzt die Aussage.':coverageDay?'Der letzte Prognosetag liegt am Rand des verfügbaren Ensemblehorizonts. „Nicht bewertbar“ ist hier ein Abdeckungs-, kein meteorologisches Abwertungssignal.':dataIssue?'Die verfügbare Modell-/Memberbasis ist eingeschränkt; die meteorologische Konfidenz wird davon getrennt ausgewiesen.':'Die bewertbaren Kernparameter bleiben innerhalb der vorlaufnormalisierten Konfidenzgrenzen.';
 return <section className="ensemble-forecast-compass cockpit-forecast-compass" aria-label="MID Prognose-Kompass">
  <header><span aria-hidden="true">◎</span><div><small>MID Prognose-Kompass</small><strong>Prognoseentwicklung</strong></div></header>
  <div><span><small>Hohe Prognosekonfidenz</small><b>{primaryText}</b><em>{primaryWindow?'Robuste meteorologische Ensembleübereinstimmung. Datenqualität und Randabdeckung werden separat gekennzeichnet.':'Noch kein zusammenhängender Abschnitt mit hoher meteorologischer Ensembleübereinstimmung.'}</em></span>
   <span><small>Erwartete Entwicklung</small><b>{outlook?.headline??'Tagesprognosen vergleichen'}</b><em>{outlook?.detail??'Auch eine gut vorhersagbare Entwicklung kann ungünstiges Wetter bedeuten.'}</em></span>
   <span><small>{thirdLabel}</small><b>{thirdTitle}</b><em>{thirdDetail}</em></span>
  </div>
  <div style={{display:'flex',justifyContent:'flex-end',marginTop:8}}>
   <AppInfoHint label="Parameter und weitere Zeiträume" width={430} showClose>
    <strong>Parameter und weitere Zeiträume</strong>
    {windows.length>1&&<p>Weitere hohe Konfidenzfenster: {windows.slice(1).map(window=>`${windowLabel(window)} · ${scoreRangeLabel(window,ordered)}`).join(' · ')}</p>}
    {firstEvaluable?.parameters.map(parameter=>{const periods=agreementWindows(ordered,parameter.key);return <p key={parameter.key}><b>{parameter.label}:</b> {periods.length?periods.map(window=>`${windowLabel(window)} · ${scoreRangeLabel(window,ordered,parameter.key)}`).join(' · '):'kein bewertbares Fenster mit hoher Parameterkonfidenz'}</p>})}
    <p>Der 0–100-Wert ist ein Konfidenzindex und bewusst kein Prozentwert: Er beschreibt Ensembleübereinstimmung, Vorlauf und gedämpfte lokale Güte, nicht die Wahrscheinlichkeit, dass eine konkrete Vorhersage „eintrifft“. Datenqualität und unvollständige Randtage werden separat ausgewiesen und dürfen eine meteorologisch hohe Konfidenz nicht künstlich auf „mittel“ setzen.</p>
    {advancedMode&&<p>Die Spreads werden mit dem Vorlauf normalisiert. Wo genügend lokale Rückblicksdaten vorhanden sind, fließen Brier-/Fehlerwerte mit starker Schrumpfung als kleine Skill-Korrektur ein; ein nur teilweise abgedeckter letzter Kalendertag bleibt „nicht bewertbar“, bis genügend vollständige Ensemblewerte vorliegen.</p>}
   </AppInfoHint>
  </div>
 </section>;
}

/** Re-evaluate run freshness in long-lived foreground and resumed PWA views. */
export function useEnsembleAssessmentTime(){const [now,setNow]=useState(Date.now);useEffect(()=>{const refresh=()=>setNow(Date.now()),timer=window.setInterval(refresh,60000);document.addEventListener("visibilitychange",refresh);return()=>{window.clearInterval(timer);document.removeEventListener("visibilitychange",refresh)}},[]);return now}
