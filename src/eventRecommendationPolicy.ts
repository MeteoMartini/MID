import type {EventActivity,EventEnvironment,EventSummary} from './eventCenter'

function finite(value:number|null|undefined):number|null{return value!=null&&Number.isFinite(Number(value))?Number(value):null}
function joinParts(parts:(string|null|undefined|false)[]){return parts.filter((part):part is string=>Boolean(part)).join(' · ')}

export function eventPrecipitationProbability(summary:EventSummary){return summary.precipitationProbabilitySource==='unavailable'?null:finite(summary.precipitationProbabilityRelevant)}
export function eventThermalReference(summary:EventSummary){return finite(summary.apparentAvg)??finite(summary.temperatureAvg)??finite(summary.temperatureMax)??finite(summary.temperatureMin)}
function eventThermalPeak(summary:EventSummary){const values=[finite(summary.temperatureMax),finite(summary.apparentAvg),finite(summary.temperatureAvg)].filter((value):value is number=>value!=null);return values.length?Math.max(...values):null}
function eventThermalMinimum(summary:EventSummary){const values=[finite(summary.temperatureMin),finite(summary.apparentAvg),finite(summary.temperatureAvg)].filter((value):value is number=>value!=null);return values.length?Math.min(...values):null}

const ACTIVE_SPORTS=new Set<EventActivity>(['running','football','tennis'])
const EXPOSED_SPORTS=new Set<EventActivity>(['cycling','hiking','climbing','golf'])

export function buildEventOutfitHint(summary:EventSummary,environment:EventEnvironment,activity:EventActivity){
 if(activity==='flight')return''
 const t=eventThermalReference(summary),tMin=finite(summary.temperatureMin)??t,rain=(eventPrecipitationProbability(summary)??-1)>=40||(finite(summary.precipitationTotal)??0)>=1,windy=(finite(summary.windMax)??0)>=16||(finite(summary.gustMax)??0)>=24,uv=(finite(summary.uvMax)??0)>=6
 if(environment==='indoor'){
  const base=ACTIVE_SPORTS.has(activity)||['cycling','gym','yoga'].includes(activity)?'leichte, atmungsaktive Sportkleidung für den Innenraum':'Kleidung nach Innenraum; Wetter vor allem für An- und Abreise'
  return joinParts([base,rain?'Regenschutz für An- und Abreise':null])
 }
 if(activity==='skiing')return joinParts(['mehrlagige Ski-/Winterbekleidung',windy?'winddichte Außenschicht':null,rain?'Nässe-/Schneeschutz':null,uv?'Sonnenschutz':null])
 if(activity==='watersports')return joinParts(['sportartspezifische Funktionskleidung; Wassertemperatur/Neopren separat prüfen',windy?'Wind- und Auskühlungsrisiko beachten':null,uv?'Sonnenschutz':null])
 let base='wetterangepasste Kleidung'
 if(ACTIVE_SPORTS.has(activity)){
  if(t==null)base='leichte Sportkleidung nach Belastung und aktuellem Gefühl'
  else if(t>=18)base='leichte, atmungsaktive Sportkleidung'
  else if(t>=12)base='leichte Sportkleidung; dünne Schicht für Pausen'
  else if(t>=6)base='Funktionsschichten; warmes Oberteil für Pausen'
  else base='wärmere Funktionsschichten; Wind-/Kälteschutz'
 }else if(activity==='cycling'){
  if(t==null)base='Funktionskleidung mit anpassbarer Windschicht'
  else if(t>=20)base='leichte Rad-/Funktionskleidung'
  else if(t>=13)base='leichte Funktionskleidung; dünner Windschutz'
  else if(t>=7)base='Funktionsschichten; Windschutz'
  else base='wärmere Funktionsschichten; winddichte Außenschicht'
 }else if(activity==='hiking'||activity==='climbing'){
  if(t==null)base='mehrlagige Funktionskleidung'
  else if(t>=22)base='leichte, atmungsaktive Funktionskleidung'
  else if(t>=14)base='leichte Funktionskleidung; dünne Reserve-Schicht'
  else if(t>=7)base='mehrlagige Funktionskleidung'
  else base='wärmere Funktionsschichten; Wind-/Kälteschutz'
 }else if(activity==='golf'){
  if(t==null)base='bewegungsfreundliche Funktionskleidung'
  else if(t>=22)base='leichte, atmungsaktive Funktionskleidung'
  else if(t>=15)base='leichte Funktionskleidung; dünne Schicht nach Bedarf'
  else if(t>=8)base='Übergangs-/Funktionskleidung'
  else base='wärmere Funktionsschichten'
 }else if(activity==='gym'||activity==='yoga'){
  if(t==null)base='leichte Sportkleidung mit optionaler Zusatzschicht'
  else if(t>=20)base='leichte, atmungsaktive Sportkleidung'
  else if(t>=13)base='leichte Sportkleidung; dünne Zusatzschicht'
  else base='wärmere Funktionsschichten'
 }else{
  if(t==null)base='wetterangepasste Kleidung'
  else if(t>=24)base='leichte Sommerkleidung'
  else if(t>=19)base=tMin!=null&&tMin<16?'leichte Kleidung; dünne Schicht für später':'leichte Kleidung'
  else if(t>=12)base='Übergangskleidung'
  else base='wärmere Kleidung'
 }
 const rainPart=rain?(ACTIVE_SPORTS.has(activity)?'trockene Wechsel-/Pausenschicht':EXPOSED_SPORTS.has(activity)?'leichter Regenschutz':'Regenschutz'):null
 const windPart=windy?(ACTIVE_SPORTS.has(activity)?'leichter Windschutz für Pausen':activity==='cycling'||activity==='hiking'||activity==='climbing'||activity==='golf'?'leichter Windschutz':'Windschutz'):null
 return joinParts([base,rainPart,windPart,uv?'Sonnenschutz':null])
}

export type EventThermalGuidance={severityDelta:1|2;tip:string;behavior:string}
export function eventHeatGuidance(summary:EventSummary,environment:EventEnvironment,activity:EventActivity):EventThermalGuidance|null{
 if(environment==='indoor')return null
 const peak=eventThermalPeak(summary);if(peak==null)return null
 const active=ACTIVE_SPORTS.has(activity)||activity==='cycling',moderate=activity==='hiking'||activity==='climbing'||activity==='golf',watch=active?27:moderate?28:29,high=watch+3
 if(peak<watch)return null
 if(active)return{severityDelta:peak>=high?2:1,tip:peak>=high?'Bei intensiver Aktivität ist eine deutliche Wärmebelastung möglich.':'Bei intensiver Aktivität ist eine erhöhte Wärmebelastung möglich.',behavior:'Trinkwasserversorgung und regelmäßige Erholungspausen sicherstellen; Belastung der Wärme anpassen.'}
 return{severityDelta:peak>=high?2:1,tip:peak>=high?'Eine deutliche Wärmebelastung ist möglich.':'Eine erhöhte Wärmebelastung ist möglich.',behavior:'Ausreichende Trinkwasserversorgung sicherstellen, Erholungspausen vorsehen und längere direkte Sonnenexposition nach Möglichkeit vermeiden.'}
}

export function eventColdGuidance(summary:EventSummary,environment:EventEnvironment,activity:EventActivity):EventThermalGuidance|null{
 if(environment==='indoor'||activity==='watersports')return null
 const low=eventThermalMinimum(summary);if(low==null)return null
 const threshold=activity==='cycling'?5:activity==='skiing'?-8:ACTIVE_SPORTS.has(activity)?2:4
 if(low>threshold)return null
 return{severityDelta:low<=threshold-5?2:1,tip:'Niedrige Temperaturen können zu Kältebelastung führen.',behavior:activity==='skiing'?'Mehrlagigen Kälte- und Windschutz sowie Aufwärmphasen vorsehen.':'Geeigneten Kälteschutz und ausreichende Aufwärmphasen vorsehen.'}
}
