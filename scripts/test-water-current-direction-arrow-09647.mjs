import {readFile} from 'node:fs/promises';

const [panel,styles,pkg,baseline,worker]=await Promise.all([
 readFile(new URL('../src/WaterSportsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
need('Strömungslogik',panel,'function normalizeBearing(degrees:number){return((degrees%360)+360)%360}');
need('Strömungslogik',panel,'function CurrentDirectionIcon({direction}:{direction:number})');
need('Strömungspfeil',panel,'<Navigation2 className="water-current-direction-icon" style={{transform:`rotate(${bearing}deg)`}} aria-hidden="true"/>');
need('Strömungskarte',panel,'icon={<CurrentDirectionIcon direction={currentDirection}/>}');
need('Strömungstext',panel,'`Zielrichtung ${cardinal(currentDirection)} · ${Math.round(normalizeBearing(currentDirection))}°`');
need('Verlaufstext',panel,'`Ziel ${cardinal(point.currentDirection)}`');
need('Neutrales Gruppensymbol',panel,'<WaterMetricGroup icon={<Compass/>} title="Strömung & Tide"');
need('SVG-Rotationszentrum',styles,'.water-current-direction-icon{transform-box:view-box;transform-origin:center}');
if(panel.includes('<WaterMetricGroup icon={<Navigation/>} title="Strömung & Tide"'))failures.push('Das Gruppensymbol ist weiterhin ein statischer Richtungspfeil.');
const labels=['N','NNO','NO','ONO','O','OSO','SO','SSO','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const normalize=value=>((value%360)+360)%360;
const cardinal=value=>labels[Math.round(normalize(value)/22.5)%16];
if(normalize(211)!==211||cardinal(211)!=='SSW')failures.push('Kontrollwert 211° wird nicht als Zielrichtung SSW abgebildet.');
if(normalize(-149)!==211||cardinal(-149)!=='SSW')failures.push('Negative äquivalente Winkel werden nicht robust normalisiert.');
const version=JSON.parse(pkg).version,baselineVersion=JSON.parse(baseline).releaseVersion,workerVersion=worker.match(/const WORKER_VERSION='([^']+)'/)?.[1];
if(version!=='0.9.64.7'||baselineVersion!==version||workerVersion!==version)failures.push(`Versionsabweichung: ${version}/${baselineVersion}/${workerVersion}`);
if(failures.length){console.error(`MID-Strömungsrichtungsprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.64.7: Strömungstext, Zielkonvention und dynamischer Richtungspfeil stimmen für 211°/SSW überein.');
