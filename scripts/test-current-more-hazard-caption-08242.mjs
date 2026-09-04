import {readFile} from 'node:fs/promises';

const [app,styles,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/styles.css',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: fehlt ${token}`)};
const forbid=(area,text,token)=>{if(text.includes(token))failures.push(`${area}: unerlaubt ${token}`)};

forbid('Eigene Warnungen',app,'Automatisch aus der kanonischen MID-Ortsprognose abgeleitet.');
need('Eigene Warnungen',app,'MID · PROGNOSEHINWEIS');
forbid('Eigene Warnungen',app,'abgeleitete Indikatoren nach DWD-Kriterien');
forbid('Eigene Warnungen',app,'Keine amtlichen Warnungen.</small>');

for(const token of [
 'className="current-metrics-toggle"',
 "metricsOpen?'weniger':'mehr'",
 "aria-label={metricsOpen?'Weniger aktuelle Wetterdaten anzeigen':'Mehr aktuelle Wetterdaten anzeigen'}",
 '</span></aside><button type="button" className="current-metrics-toggle"'
])need('Aktuelles Wetter',app,token);
forbid('Aktuelles Wetter',app,"metricsOpen?'Kacheln ausblenden':'Kacheln einblenden'");
for(const token of [
 '.hero[data-mid-view="current"]{margin-bottom:18px}',
 '.current-metrics-toggle{position:absolute;',
 'right:18px;bottom:-13px;',
 'z-index:5;',
 '@media(max-width:520px){.hero[data-mid-view="current"]{margin-bottom:17px}'
])need('Schaltflächenlayout',styles,token);
need('Package-Test',pkg,'test:current-more-hazard-caption');
need('Baseline-Test',baseline,'scripts/test-current-more-hazard-caption-08242.mjs');

if(failures.length){
 console.error('Aktuell-Wetter-Mehr-Schaltfläche/Warnhinweis fehlgeschlagen\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Kompakte Mehr-Schaltfläche am Modulrand und gekürzter Warnhinweis geprüft.');
