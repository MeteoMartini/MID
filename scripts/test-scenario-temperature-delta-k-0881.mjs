import {readFile} from 'node:fs/promises';
const ensemble=await readFile(new URL('../src/EnsemblePanel.tsx',import.meta.url),'utf8');
const failures=[];
if(!ensemble.includes("items.push(`Temperatur ${signedScenarioValue(temp,1,' K')}`)"))failures.push('Temperaturabweichungen der Szenariocluster werden nicht in Kelvin ausgegeben.');
if(ensemble.includes("items.push(`Temperatur ${signedScenarioValue(temp,1,'°')}`)"))failures.push('Alte Grad-Schreibweise für Temperaturdifferenzen ist noch aktiv.');
if(!ensemble.includes('Temperaturspanne')||!ensemble.includes('°C'))failures.push('Absolute Temperaturwerte müssen weiterhin in Grad Celsius angezeigt werden.');
if(failures.length){console.error('Szenario-Temperaturdifferenz-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Szenariocluster geprüft: absolute Temperaturen in °C, Temperaturdifferenzen in K.');
