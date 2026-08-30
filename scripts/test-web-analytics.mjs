import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [analytics,app,install,deploy]=await Promise.all([
 readFile(path.join(root,'src','webAnalytics.ts'),'utf8'),readFile(path.join(root,'src','App.tsx'),'utf8'),readFile(path.join(root,'workflow-patches','install-mid.yml'),'utf8'),readFile(path.join(root,'workflow-patches','deploy.yml'),'utf8')
]);
const failures=[];
for(const token of ['VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN','static.cloudflareinsights.com/beacon.min.js','mid:web-analytics-status','startWebAnalyticsDiagnostics','getWebAnalyticsStatus'])if(!analytics.includes(token))failures.push(`Analytics-Modul fehlt: ${token}`);
for(const token of ['Nutzungsstatistik','analytics.state','getWebAnalyticsStatus'])if(!app.includes(token))failures.push(`Analytics-Diagnose fehlt: ${token}`);
for(const [name,text] of [['Installer-Patch',install],['Deploy-Patch',deploy]]){for(const token of ['VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN'])if(!text.includes(token))failures.push(`${name}: ${token}`);for(const action of ['actions/checkout@','actions/setup-node@'])if(!text.includes(action))failures.push(`${name}: ${action}<SHA>`) }
if(!install.includes('--checksum')||!install.includes('diff -qr'))failures.push('Installer-Patch schützt die vollständige ZIP-Übernahme nicht.');
if(failures.length){console.error('Web-Analytics-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Web Analytics geprüft: Beacon, SPA-Statusdiagnose und rsync-sichere Workflow-Reparaturdateien sind vorhanden.');
