// An explicit UTC designator/offset identifies an instant, not a local wall clock.
// undefined means no explicit zone: callers retain their existing IANA/fixed-offset policy.
export function explicitIsoInstant(value:string):number|undefined{
 const source=String(value||'');
 if(!/T.*(?:[zZ]|[+-])/.test(source))return undefined;
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:[zZ]|[+-]\d{2}:?\d{2})$/.test(source))return Number.NaN;
 return Date.parse(source);
}
