import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(new URL('..',import.meta.url).pathname);
const source=fs.readFileSync(path.join(root,'src/eventWeatherRefresh.ts'),'utf8');
function assert(condition,message){if(!condition)throw new Error(message)}
assert(!/type\s+EventCenterRecord\b/.test(source.split('\n').slice(0,8).join('\n')),'eventWeatherRefresh.ts darf den unbenutzten Typ EventCenterRecord nicht importieren (TS6133).');
for(const symbol of ['BestMatchModelInfo','runBackgroundNetworkTask','buildEventPlan','EventPlan']){
 const count=(source.match(new RegExp(`\\b${symbol}\\b`,'g'))??[]).length;
 assert(count>1,`Import ${symbol} muss außerhalb der Importdeklaration verwendet werden.`);
}
assert(source.includes('eventCenterEndEpoch(record)>=now'),'Fix darf den v0.9.53.34-Lifecycle-Schutz für abgelaufene Events nicht entfernen.');
console.log('OK MID v0.9.53.35 Event-Refresh TypeScript buildfix');
