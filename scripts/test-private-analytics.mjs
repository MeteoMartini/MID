import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(path,import.meta.url),'utf8');
const [analytics,main,pkg,config,documentation]=await Promise.all([
 read('../src/analytics.ts'),
 read('../src/main.tsx'),
 read('../package.json'),
 read('../public/analytics-config.json'),
 read('../docs/private-analytics.md')
]);
const failures=[];
for(const token of [
 'https://static.cloudflareinsights.com/beacon.min.js',
 "const CONFIG_FILE='analytics-config.json'",
 "const INTERNAL_DEVICE_KEY='mid.analytics.internal-device'",
 "const CONTROL_PARAMETER='mid-analytics'",
 "fetch(configUrl,{cache:'no-store',credentials:'same-origin'})",
 "script.type='module'",
 "JSON.stringify({token,spa:true})",
 "window.history.replaceState",
 "if(!import.meta.env.PROD)",
 "reason:'missing-token'"
]){
 if(!analytics.includes(token))failures.push(`Analytics-Integration unvollständig: ${token}`);
}
if(!main.includes("import {initPrivateWebAnalytics} from './analytics';"))failures.push('Analytics-Initialisierung ist nicht in main.tsx importiert');
const initIndex=main.indexOf('void initPrivateWebAnalytics();');
const restoreIndex=main.indexOf('await restorePersistentState();');
if(initIndex<0||restoreIndex<0||initIndex>restoreIndex)failures.push('Analytics-Kontrolle läuft nicht vor der Wiederherstellung des App-Zustands');
const packageJson=JSON.parse(pkg);
if(packageJson.scripts?.['test:private-analytics']!=='node scripts/test-private-analytics.mjs')failures.push('Analytics-Regressionstest fehlt in package.json');
if(!String(packageJson.scripts?.verify||'').includes('npm run test:private-analytics'))failures.push('Analytics-Regressionstest fehlt in der Gesamtprüfung');
let configJson;
try{configJson=JSON.parse(config)}catch{failures.push('analytics-config.json ist kein gültiges JSON')}
const configuredToken=String(configJson?.token||'').trim();
if(configuredToken&&!/^[A-Za-z0-9_-]{20,128}$/.test(configuredToken))failures.push('Analytics-Site-Token hat ein ungültiges Format');
for(const token of ['Cloudflare-Einfügung deaktivieren','?mid-analytics=internal','?mid-analytics=external','analytics-config.json']){
 if(!documentation.includes(token))failures.push(`Analytics-Dokumentation unvollständig: ${token}`);
}
if(failures.length){
 console.error(`Private-Analytics-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);
 process.exit(1);
}
console.log('Private Zugriffsauswertung geprüft: Laufzeitkonfiguration, lokale Geräteausnahme, Cloudflare-Beacon und Dokumentation sind vorhanden.');