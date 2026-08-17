import {readFile} from 'node:fs/promises';
const [app,push,panel,worker]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/pushNotifications.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/PushSettingsPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../worker/metar-proxy.js',import.meta.url),'utf8')
]);
const fail=[];const need=(name,text,needle)=>{if(!text.includes(needle))fail.push(`${name}: ${needle}`)};
need('Push-Typ',push,'PushPrecipitationLeadMinutes=15|30|45|60|90|120');
need('Push-Typ',push,'PushPrecipitationThresholdMm=.1|.2|.5|1|2|5');
need('Subscription',push,'precipitationAlert');
need('Einstellungen',panel,'Niederschlags-Vorwarnung');
need('Einstellungen',panel,'45 Minuten vorher');
need('Einstellungen',panel,'ab 0,5 mm');
need('Persistenz',app,"mid:pushPrecipitationAlert:v1");
need('2h-Fortsetzung',app,'Über das +2-h-Fenster hinaus ist weiterer Niederschlag');
need('2h-Neubeginn',app,'Nach dem +2-h-Fenster ist ab etwa');
need('Worker-Vorlauf',worker,'PUSH_PRECIPITATION_LEADS=[15,30,45,60,90,120]');
need('Worker-Mengen',worker,'PUSH_PRECIPITATION_AMOUNTS=[.1,.2,.5,1,2,5]');
need('Worker-Horizont',worker,"forecast_minutely_15','24'");
need('Worker-Pause',worker,'trigger&&canNotify()');
if(worker.includes('triggerActive=result.active'))fail.push('Worker: verspätete Aktivwarnung ist noch aktiv.');
if(!worker.includes('triggerUpcoming=!result.active'))fail.push('Worker: Vorwarnung ist nicht ausdrücklich auf noch nicht begonnenen Niederschlag begrenzt.');
if(fail.length){console.error(fail.join('\n'));process.exit(1)}
console.log('Niederschlags-Vorwarnung, Mindestmenge, Meldungspause und +2-h-Fortsetzung geprüft.');
