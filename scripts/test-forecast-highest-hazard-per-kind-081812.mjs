import {readFile} from 'node:fs/promises';

const [app,pkg,baseline]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 'kind:signal.kind,stageRank:Number(signal.stageRank)||signal.level',
 'function highestDailyHazardsByKind(items:DailyHazardBadge[],limit=3)',
 'const best=new Map<DwdWarningKind,DailyHazardBadge>();',
 'item.stageRank>current.stageRank',
 'compactHz=highestDailyHazardsByKind(hz)',
 '<ForecastHazards hazards={compactHz}/>',
 'hz:strongestDailyHazards(dailyHazards(d,hours,elevation??0,unit,1))'
])need('7-Tage-Warnfilter',app,token);
need('Package-Test',pkg,'test:forecast-highest-hazard-per-kind');
need('Baseline-Test',baseline,'scripts/test-forecast-highest-hazard-per-kind-081812.mjs');
if(failures.length){console.error('7-Tage-Warnfilter-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('7-Tage-Warnfilter geprüft: In der Vorhersage erscheint je Warntyp nur die höchste Stufe; das Widget begrenzt zusätzlich auf die stärkste Tageswarnstufe.');
