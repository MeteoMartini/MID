import fs from 'node:fs';

const importLine="import {boundedSunshineSeconds,canonicalSunshineDaySeconds,daylightSecondsFromLocalTimes} from './sunshineDuration';";
const contractSource=fs.readFileSync(new URL('../src/sunshineDuration.ts',import.meta.url),'utf8');

/**
 * Ältere isolierte forecastFusion-Regressionen transpilierten bislang genau eine
 * TS-Datei. Der Sunshine-Contract ist jetzt ein eigenes kanonisches Modul; für
 * diese kleinen Testmodule wird dessen echte Quelle inline mittranspiliert.
 */
export function inlineSunshineDurationContract(source){
 if(!source.includes(importLine))throw new Error('Sunshine-Duration-Import fehlt in forecastFusion.ts.');
 return source.replace(importLine,contractSource);
}
