import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['install-mid.yml','deploy.yml'];
const token='VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN: ${{ vars.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN }}';
const failures=[];
for(const name of files){
 const text=await readFile(path.join(root,'workflow-patches',name),'utf8');
 if(!text.includes(token))failures.push(`${name}: Analytics-Buildvariable fehlt.`);
 if(!text.includes('npm run verify'))failures.push(`${name}: MID-Verifikation fehlt.`);
}
const installer=await readFile(path.join(root,'workflow-patches','install-mid.yml'),'utf8');
for(const marker of ['needs: install_build','actions/upload-pages-artifact@v5','actions/deploy-pages@v5'])if(!installer.includes(marker))failures.push(`Installations- und Pages-Ablauf unvollständig: ${marker}`);
if(failures.length){
 console.error('Workflow-Reparaturpaket fehlerhaft:\n- '+failures.join('\n- '));
 process.exit(1);
}
console.log('Workflow-Reparaturpaket geprüft: rsync-sichere Pfade, Analytics-Variable und ursprünglicher Install→Test→Commit→Pages-Ablauf sind enthalten.');
