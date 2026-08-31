import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
const [install,deploy,baselineText,pkgText,gitignore]=await Promise.all([
 readFile(new URL('ci/github/workflows/install-mid.yml',root),'utf8'),
 readFile(new URL('ci/github/workflows/deploy.yml',root),'utf8'),
 readFile(new URL('MID_BASELINE.json',root),'utf8'),
 readFile(new URL('package.json',root),'utf8'),
 readFile(new URL('.gitignore',root),'utf8')
]);
const failures=[];
const need=(area,text,token)=>{if(!text.includes(token))failures.push(`${area}: ${token}`)};
for(const [area,text] of [['Installer',install],['Manueller Deploy',deploy]]){
 if(text.includes('actions/configure-pages@'))failures.push(`${area}: configure-pages darf nicht mehr als zusätzlicher Codeload-Download aktiv sein.`);
 for(const token of ['deploy_pages_1:','pages_cooldown_1:','deploy_pages_2:','pages_cooldown_2:','deploy_pages_3:','sleep 75','sleep 180'])need(area,text,token);
 for(const attempt of [1,2,3]){
  need(area,text,`github-pages-${'${{ github.run_id }}'}-${attempt}`);
  need(area,text,`artifact_name: github-pages-${'${{ github.run_id }}'}-${attempt}`);
 }
}
const buildPart=install.split('  deploy_pages_1:')[0];
if(/^dist\/?$/m.test(gitignore))failures.push('dist ist wieder gitignored; die vom Build erzeugten Pages-Dateien könnten den entkoppelten Deploy-Jobs fehlen.');
for(const token of ["git add -A -- . ':(exclude).github/**'",'test -f dist/index.html'])need('Release-Artefakt-Übergabe',install,token);
if(buildPart.includes('actions/upload-pages-artifact@')||buildPart.includes('actions/deploy-pages@')||buildPart.includes('actions/configure-pages@'))failures.push('Installer-Buildjob lädt weiterhin Pages-Actions beim Job-Setup; Codeload-429 könnte den geprüften Release vor dem Commit abbrechen.');
for(const token of ["needs.deploy_pages_1.outputs.deployed == 'true'","needs.deploy_pages_2.outputs.deployed == 'true'","needs.deploy_pages_3.outputs.deployed == 'true'",'continue-on-error: true','finalize_release:',"context': 'MID / release-candidate-quality'",'git merge-base --is-ancestor "$stable_before" "$release_sha"','push origin "${release_sha}:refs/heads/mid-stable"'])need('Installer-Finalisierung',install,token);
if(install.includes('push --force origin HEAD:refs/heads/mid-stable'))failures.push('Installer-Finalisierung darf Stable nicht mehr per Force-Push überschreiben.');
const baseline=JSON.parse(baselineText),pkg=JSON.parse(pkgText),test='scripts/test-pages-codeload-resilience-09580.mjs';
if(!baseline.requiredRegressionTests?.includes(test)||!baseline.regressionTests?.includes(test))failures.push('Pages-Codeload-Pflichtregression fehlt im Baseline-Vertrag.');
if(pkg.scripts?.['test:pages-codeload-resilience']!==`node ${test}`)failures.push('Pages-Codeload-Testscript fehlt in package.json.');
if(failures.length){console.error('Pages-Codeload-Resilienz fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Pages-Codeload-Resilienz geprüft: configure-pages entfernt, Release-Build entkoppelt und Pages-Deployment mit frischen Runnern + 75/180-s-Backoff dreifach abgesichert.');
