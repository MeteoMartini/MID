import type {ForecastFusionResult,ForecastFusionWeightContributor} from './forecastFusion';
import {weatherRegimeLabel,type ForecastVerificationReport,type WeatherRegime} from './forecastVerification';

type Props={fusion?:ForecastFusionResult|null;twinReport?:ForecastVerificationReport|null;date?:string;canonicalNowcast:boolean};

function factorText(row:ForecastFusionWeightContributor){
 const f=row.factors,parts=[`Horizont ×${f.horizonFactor.toFixed(2)}`,`Region ×${f.regionalFactor.toFixed(2)}`,`Lage ×${f.regimeFactor.toFixed(2)}`,`Frische ×${f.freshnessFactor.toFixed(2)}`];
 if(row.rapidUpdate)parts.push(`Rapid Cycle ×${f.rapidFactor.toFixed(2)}`);
 return parts.join(' · ');
}

function regimeLabel(value:string){try{return weatherRegimeLabel(value as WeatherRegime)||value}catch{return value}}

/** Collapsed by default: detailed provenance without crowding the operative forecast. */
export function ForecastSourceDiagnostics({fusion,twinReport,date,canonicalNowcast}:Props){
 const serverRows=fusion?.diagnostics?.weightingByDate??[],server=serverRows.find(row=>row.date===date)??serverRows[0],local=twinReport?.currentForecasts.find(row=>row.date===(date??server?.date))??twinReport?.currentForecasts[0];
 if(!server&&!local)return null;
 return <details className="forecast-source-diagnostics">
  <summary>Quellen &amp; Gewichtung</summary>
  <div className="forecast-source-diagnostics-body">
   <p><b>Kanonischer Ablauf:</b> kohärentes Best-Match-Wetterbündel → unabhängiger Modellvergleich → optional MOSMIX → belegte lokale Güte-/Bias-Korrektur → Beobachtung, Radar und Nowcast → <code>displayHours</code> / <code>displayMinutes15</code>.</p>
   {server&&<section><header><strong>{server.date} · {regimeLabel(server.regime)} · +{server.horizonDays} Tag{server.horizonDays===1?'':'e'}</strong><small>{server.independentFamilies} unabhängige Familien · Varianten einer Familie teilen genau ein Budget</small></header><div className="forecast-source-weight-list">{server.contributors.slice(0,8).map(row=><article key={`${server.date}:${row.id}`}><span><b>{row.label}</b>{row.rapidUpdate&&<em>RUC</em>}</span><strong>{Math.round(row.normalizedWeight)} %</strong><small>{factorText(row)} · Gruppe {row.independenceGroup}</small></article>)}</div></section>}
   {local&&<section><header><strong>Lokale tatsächliche Prognosegüte</strong><small>{local.ready?`${regimeLabel(local.regime)} · +${local.horizon} h · ${local.confidence==='high'?'hohes':local.confidence==='medium'?'mittleres':'vorläufiges'} Vertrauen`:local.reason}</small></header>{local.weights.length?<div className="forecast-source-weight-list local">{local.weights.slice(0,6).map(row=><article key={`${local.date}:${row.id}`}><span><b>{row.label}</b></span><strong>{Math.round(row.weight)} %</strong><small>{row.days} Vergleichstage · Obergrenze {Math.round(row.maxWeight)} % · Gruppe {row.independenceGroup}</small></article>)}</div>:<small>Noch keine freigegebene lokale Gewichtung; Best Match bleibt Kontroll- und Hauptpfad.</small>}</section>}
   <small className="forecast-source-contract">{canonicalNowcast?'Beobachtungs-, Radar- und Nowcast-Korrekturen sind in der angezeigten kanonischen Zeitreihe enthalten.':'Die Quellenstufen werden diagnostiziert; aktuell war keine operative Nowcast-Korrektur erforderlich.'} Niederschlagsmenge, -art, Wahrscheinlichkeit, Wettercode, Bewölkung und Sonnenschein werden nicht aus widersprüchlichen Einzelmodellen zusammengesetzt.</small>
  </div>
 </details>;
}
