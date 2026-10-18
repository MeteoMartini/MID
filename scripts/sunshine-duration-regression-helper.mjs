import fs from 'node:fs';
import {buildSync} from 'esbuild';
import {fileURLToPath} from 'node:url';

const importPattern=/import \{([^}]+)\} from '\.\/sunshineDuration';/;
const contractSource=fs.readFileSync(new URL('../src/sunshineDuration.ts',import.meta.url),'utf8');

/**
 * Ältere isolierte forecastFusion-Regressionen transpilierten bislang genau eine
 * TS-Datei. Der Sunshine-Contract ist jetzt ein eigenes kanonisches Modul; für
 * diese kleinen Testmodule wird dessen echte Quelle inline mittranspiliert.
 */
export function inlineSunshineDurationContract(source){
 const match=source.match(importPattern),imports=match?.[1]??'';
 if(!match||!imports.includes('boundedSunshineSeconds')||!imports.includes('canonicalSunshineDaySeconds')||!imports.includes('daylightSecondsFromLocalTimes'))throw new Error('Sunshine-Duration-Import fehlt in forecastFusion.ts.');
 // Bundle the real calendar dependency graph in its own scope; never stub
 // coverage in the older single-module fixtures.
 const calendarImport="import {fullCalendarDayHourlyPrecipitationCoverage} from './fullCalendarForecastDay';";
 let executable=source.replace(importPattern,contractSource);
 if(executable.includes(calendarImport)){
  const bundled=buildSync({entryPoints:[fileURLToPath(new URL('../src/fullCalendarForecastDay.ts',import.meta.url))],bundle:true,platform:'node',format:'iife',globalName:'calendarCoverageRegression',write:false,logLevel:'silent'}).outputFiles[0].text;
  executable=executable.replace(calendarImport,`${bundled}\nconst {fullCalendarDayHourlyPrecipitationCoverage}=calendarCoverageRegression;`);
 }
 return executable;
}
