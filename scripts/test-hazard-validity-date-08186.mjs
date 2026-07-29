import {readFile} from 'node:fs/promises';

const [app,pkg,baseline]=await Promise.all([
  readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
  readFile(new URL('../package.json',import.meta.url),'utf8'),
  readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

for(const token of [
  "dateKey=(value:number)=>formatInZone(value,timezone,{year:'numeric',month:'2-digit',day:'2-digit'})",
  "tomorrow=dateKey(now+24*60*60*1000)",
  "startDate===tomorrow?`Morgen, ${date(start)} · `",
  "`${date(start)} · `",
  "if(!sameDate)return`${date(start)}, ${active?'jetzt':time(start)} – ${date(end)}, ${time(end)} Uhr`"
])need('Datumsdarstellung',app,token);
need('Package-Test',pkg,'test:hazard-validity-date');
need('Baseline-Test',baseline,'scripts/test-hazard-validity-date-08186.mjs');

const match=app.match(/function hazardValidityLabel\([\s\S]*?\n}\nfunction Hazards/);
if(!match)failures.push('hazardValidityLabel konnte nicht extrahiert werden.');
else{
  const source=match[0].replace(/\nfunction Hazards[\s\S]*$/,'').replace(/validFrom:string\|undefined/g,'validFrom').replace(/validTo:string\|undefined/g,'validTo').replace(/timezone\?:string/g,'timezone').replace(/value:number/g,'value');
  const formatInZone=(value,timeZone,options)=>new Intl.DateTimeFormat('de-DE',{...options,timeZone:timeZone||undefined}).format(new Date(value));
  const label=new Function('formatInZone',`${source};return hazardValidityLabel;`)(formatInZone);
  const originalNow=Date.now;
  try{
    Date.now=()=>Date.parse('2026-07-29T12:00:00Z');
    const tomorrow=label('2026-07-30T06:00:00Z','2026-07-30T10:00:00Z','Europe/Berlin');
    const later=label('2026-07-31T06:00:00Z','2026-07-31T10:00:00Z','Europe/Berlin');
    const today=label('2026-07-29T15:00:00Z','2026-07-29T18:00:00Z','Europe/Berlin');
    const overnight=label('2026-07-29T20:00:00Z','2026-07-30T02:00:00Z','Europe/Berlin');
    if(tomorrow!=='Morgen, 30.07. · 08:00–12:00 Uhr')failures.push(`Morgen-Darstellung falsch: ${tomorrow}`);
    if(later!=='31.07. · 08:00–12:00 Uhr')failures.push(`Späteres Datum falsch: ${later}`);
    if(today!=='17:00–20:00 Uhr')failures.push(`Heutige kompakte Darstellung falsch: ${today}`);
    if(overnight!=='29.07., 22:00 – 30.07., 04:00 Uhr')failures.push(`Datumswechsel falsch: ${overnight}`);
  }finally{Date.now=originalNow}
}

if(failures.length){console.error('Warnzeit-Datumsprüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Warnzeit-Datum geprüft: Warnungen ab morgen tragen Datum; heutige Warnungen bleiben kompakt, Datumswechsel vollständig.');
