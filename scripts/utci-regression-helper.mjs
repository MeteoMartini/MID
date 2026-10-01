// Shared dependency shim for legacy isolated-module regression harnesses.
// These tests exercise unrelated forecast/mountain contracts in synthetic data-URL
// or temporary modules. The scientific UTCI implementation itself is covered by
// dedicated UTCI tests; here we preserve the isolated harness without duplicating
// the full UTCI polynomial in every regression script.
const UTCI_IMPORT="import {utciFromOutdoorState} from './utci';";
const UTCI_STUB="const utciFromOutdoorState=input=>{const t=Number(input?.temperatureC);return Number.isFinite(t)?{utci:t}:null;};";

export function inlineUtciRegressionStub(source){
 if(!source.includes(UTCI_IMPORT))return source;
 return source.replace(UTCI_IMPORT,UTCI_STUB);
}
