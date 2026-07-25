import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=relative=>readFile(path.join(root,relative),'utf8');
const readOptional=async relative=>{try{return await read(relative)}catch(error){if(error?.code==='ENOENT')return'';throw error}};
const [vite,main,module,app,styles,env,install,deploy,patchInstall,patchDeploy]=await Promise.all([
 read('vite.config.ts'),read('src/main.tsx'),read('src/webAnalytics.ts'),read('src/App.tsx'),read('src/styles.css'),read('.env.example'),
 readOptional('.github/workflows/install-mid.yml'),readOptional('.github/workflows/deploy.yml'),
 read('workflow-patches/install-mid.yml'),read('workflow-patches/deploy.yml')
]);
const failures=[];
for(const token of ['static.cloudflareinsights.com/beacon.min.js','VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN',"'data-cf-beacon':JSON.stringify({token,spa:true})", "type:'module'"])if(!vite.includes(token))failures.push(`Vite-Beacon-Injektion fehlt: ${token}`);
for(const token of ["import {startWebAnalyticsDiagnostics} from './webAnalytics';",'startWebAnalyticsDiagnostics();'])if(!main.includes(token))failures.push(`Analytics-Start fehlt: ${token}`);
for(const token of ['missing-token','missing-snippet','blocked','mid:web-analytics-status','performance.getEntriesByName'])if(!module.includes(token))failures.push(`Analytics-Diagnose fehlt: ${token}`);
for(const token of ['Cloudflare Web Analytics','system-analytics-card','Beacon aktiv','Token fehlt','Beacon blockiert'])if(!app.includes(token))failures.push(`Analytics-Systemstatus fehlt: ${token}`);
if(!styles.includes('.system-analytics-card'))failures.push('Analytics-Systemstatus-CSS fehlt.');
if(!env.includes('VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN'))failures.push('Analytics-Variable fehlt in .env.example.');
const workflowToken='VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN: ${{ vars.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN }}';
for(const [name,text] of [['workflow-patches/install-mid.yml',patchInstall],['workflow-patches/deploy.yml',patchDeploy]])if(!text.includes(workflowToken))failures.push(`${name}: Analytics-Buildvariable fehlt.`);
const stale=[['install-mid.yml',install],['deploy.yml',deploy]].filter(([,text])=>text&&!text.includes(workflowToken)).map(([name])=>name);
if(stale.length)console.warn(`Hinweis: Aktive Repository-Workflows noch ohne Analytics-Buildvariable: ${stale.join(', ')}. Korrigierte Dateien liegen direkt unter workflow-patches/.`);
if(!install||!deploy)console.warn('Hinweis: Aktive Repository-Workflows sind im Release-Arbeitsbaum nicht vollständig sichtbar; die mitgelieferten Reparaturdateien wurden dennoch geprüft.');
if(failures.length){console.error('Cloudflare-Web-Analytics-Prüfung fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Cloudflare Web Analytics geprüft: Beacon, SPA-Modus, Buildvariable, Laufzeitdiagnose und rsync-sichere Workflow-Reparaturdateien sind vorhanden.');
