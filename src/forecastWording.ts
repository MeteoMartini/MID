function sentenceStart(value:string){const clean=String(value||'').trim();return clean?`${clean.charAt(0).toLocaleUpperCase('de-DE')}${clean.slice(1)}`:''}
export function naturalPossibleEventText(event:string,timing:string){const lead=sentenceStart(timing);return sentenceStart(lead?`${lead} ${event} möglich`:`${event} möglich`)}
export function naturalPossibleEventFallback(event:string,timing:string){const lead=sentenceStart(timing);return sentenceStart(lead?`${lead} ${event}`:`${event} möglich`)}
