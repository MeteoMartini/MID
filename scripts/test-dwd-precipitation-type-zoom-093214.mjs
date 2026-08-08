import {readFile} from 'node:fs/promises';
const [radar,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/DwdPrecipitationTypeRadar.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)};const reject=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: Altvertrag ${token}`)};
for(const token of ['Math.min(5,Math.round(next))','changeZoom(zoom-1)','changeZoom(zoom+1)','disabled={zoom>=5}','dwd-precip-type-radar__viewport-shell','dwd-precip-type-radar__zoom-escape','Zoom auf 100 Prozent zurücksetzen','<span>100 %</span>'])need('Zoom 100–500 %',radar,token);
for(const token of ['changeZoom(zoom-.5)','changeZoom(zoom+.5)','Math.min(3,next)','disabled={zoom>=3}'])reject('Alte Zoomschritte',radar,token);
for(const token of ['.dwd-precip-type-radar__viewport-shell{position:relative;min-width:0}','overscroll-behavior-y:auto','touch-action:pan-x pan-y','.dwd-precip-type-radar__zoom-escape{position:absolute'])need('Zoom-Ausgang',styles,token);
const pv=JSON.parse(pkg).version,bv=JSON.parse(baseline).releaseVersion;if(pv!==bv)failures.push(`Versionen nicht synchron: ${pv}/${bv}`);
if(failures.length){console.error(`MID DWD-Zoomprüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('DWD-Originalbild: 100–500 % in 100-%-Schritten, permanenter 100-%-Reset und App-Scroll-Ausgang geprüft.');
