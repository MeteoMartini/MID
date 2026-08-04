import {readFile} from 'node:fs/promises';

const [app,precipitation,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/precipitation.ts',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
const forbid=(label,text,token)=>{if(text.includes(token))failures.push(`${label}: verbotener Altstand ${token}`)};

need('Niederschlagstyp-Export',precipitation,'export type PrecipitationParts={');
need('App-Typimport',app,"type PrecipitationParts,type PrecipSample,type PrecipType");
need('Detailhelfer',app,"function detailListWeatherLabel(parts:PrecipitationParts){return parts.type==='none'?label(parts.displayCode):parts.weatherLabel}");
need('Parts-Aufruf',app,'weatherLabel:detailListWeatherLabel(parts)');
forbid('Detailhelfer',app,'function detailListWeatherLabel(parts:PrecipSample)');
need('Package-Test',pkg,'test:forecast-inline-precip-types');
need('Baseline-Test',baseline,'scripts/test-forecast-inline-precip-types-09132.mjs');

if(failures.length){
 console.error('Forecast-Inline-Niederschlagstypen fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Forecast-Inline-Niederschlagstypen und Buildfixvertrag geprüft.');
