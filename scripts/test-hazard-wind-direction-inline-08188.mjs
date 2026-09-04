import {readFile} from 'node:fs/promises';

const [warnings,weather,app,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/dwdWarnings.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "export function formatDwdWarningDetailWithDirection(signal:DwdWarningSignal",
 "return direction.startsWith('Anfangs')?`${detail}; ${inlineDirection}.`:`${detail} ${inlineDirection}.`;"
])need('Inline-Textbildung',warnings,token);
for(const token of [
 'formatDwdWarningDetailWithDirection',
 'text:`${formatDwdWarningDetailWithDirection(signal,unit)} Automatisch aus dem Open-Meteo-Best-Match abgeleitet; keine amtliche Warnung.`'
])need('Warnkarten-Daten',weather,token);
need('Warnkarten-Rendering',app,'<span>{x.displayText||x.text}</span>');
for(const forbidden of ['x.windDirectionText','className="hazard-wind-direction"','Modellierte Windrichtung im Warnzeitraum'])if(app.includes(forbidden))failures.push(`Separate Richtungsdarstellung nicht entfernt: ${forbidden}`);
if(styles.includes('.hazard-wind-direction'))failures.push('CSS der separaten Richtungs-Kapsel ist noch vorhanden.');
need('Package-Test',pkg,'test:hazard-wind-direction-inline');
need('Baseline-Test',baseline,'scripts/test-hazard-wind-direction-inline-08188.mjs');
if(failures.length){console.error('Inline-Windrichtungsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Inline-Windrichtungsprüfung bestanden: Richtung steht im Warntext und nicht in einer separaten Kapsel.');
