/**
 * Gemeinsame Darstellungshelfer für den Übergang von Current zur Kurzfrist.
 * Diese Funktionen verändern keine Modell-/Messdatenquelle und erzeugen keine Requests.
 */
export function bridgeObservedTemperature(current:number|undefined,forecast:number,offsetMinutes:number,horizonMinutes=90,holdMinutes=15){
 const anchor=Number(current),target=Number(forecast);if(!Number.isFinite(anchor)||!Number.isFinite(target))return target;
 const horizon=Math.max(1,Number(horizonMinutes)||90),hold=Math.min(horizon-1,Math.max(0,Number(holdMinutes)||0)),offset=Math.max(0,Number(offsetMinutes)||0),progress=offset<=hold?0:Math.min(1,Math.max(0,(offset-hold)/Math.max(1,horizon-hold)));
 return anchor+(target-anchor)*progress;
}

function dateKey(epoch:number,timezone:string){
 try{const parts=new Intl.DateTimeFormat('en-CA',{year:'numeric',month:'2-digit',day:'2-digit',timeZone:timezone}).formatToParts(new Date(epoch)),read=(type:string)=>parts.find(part=>part.type===type)?.value;return`${read('year')}-${read('month')}-${read('day')}`}catch{return new Date(epoch).toISOString().slice(0,10)}
}
function clock(epoch:number,timezone:string){try{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',timeZone:timezone,hourCycle:'h23'}).format(new Date(epoch))}catch{return new Intl.DateTimeFormat('de-DE',{hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(epoch))}}
function dayDistance(target:string,today:string){const a=Date.parse(`${target}T12:00:00Z`),b=Date.parse(`${today}T12:00:00Z`);return Number.isFinite(a)&&Number.isFinite(b)?Math.round((a-b)/86400000):0}

/** Eine Uhrzeit ohne Tagesbezug wird nur für denselben Ortstag ausgegeben. */
export function relativeForecastTimeLabel(epoch:number,timezone:string,now=Date.now()){
 const time=clock(epoch,timezone),target=dateKey(epoch,timezone),today=dateKey(now,timezone),delta=dayDistance(target,today);
 if(delta===0)return time;
 if(delta===1)return`morgen ${time}`;
 if(delta===2)return`übermorgen ${time}`;
 try{return`${new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:timezone}).format(new Date(epoch))} ${time}`}catch{return`${target} ${time}`}
}

export type RelativeForecastTimeRelation='at'|'from';
/** Satzgrammatisch vollständige deutsche Zeitphrase für dynamische Prognosetexte. */
export function relativeForecastTimePhrase(epoch:number,timezone:string,relation:RelativeForecastTimeRelation,now=Date.now()){
 const time=`${clock(epoch,timezone)} Uhr`,target=dateKey(epoch,timezone),today=dateKey(now,timezone),delta=dayDistance(target,today),preposition=relation==='from'?'ab':'um';
 if(delta===0)return`${preposition} ${time}`;
 if(delta===1)return`morgen ${preposition} ${time}`;
 if(delta===2)return`übermorgen ${preposition} ${time}`;
 try{const date=new Intl.DateTimeFormat('de-DE',{weekday:'short',day:'2-digit',month:'2-digit',timeZone:timezone}).format(new Date(epoch));return`am ${date} ${preposition} ${time}`}catch{return`am ${target} ${preposition} ${time}`}
}
