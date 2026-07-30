import {readFile} from 'node:fs/promises';

const [radar,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/RadarPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

need('Radar-250-m-Anzeige',radar,'const pxDisplayAvailable=highResolution&&pxFresh;');
need('Radar-250-m-Anzeige',radar,'showPxAtTime=showRadar&&pxDisplayAvailable');
need('Radar-250-m-Anzeige',radar,'<LazyPx250Overlay meta={pxMeta} opacity={radarOpacity/100}');
forbid('TypeScript-Buildfix',radar,'pxFactor=');
forbid('TypeScript-Buildfix',radar,'const pxBlend=');
need('Package-Test',pkg,'test:radar-unused-pxfactor-buildfix');
need('Baseline-Test',baseline,'scripts/test-radar-unused-pxfactor-buildfix-08252.mjs');

if(failures.length){
 console.error('Radar-PX250-Buildfix-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Radar-PX250-TypeScript-Buildfix und weiterhin aktive 250-m-Anzeige geprüft.');
