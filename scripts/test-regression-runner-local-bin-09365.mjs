import {readFile} from 'node:fs/promises';
const [runner,pkgText,baselineText,workflowSource,installerSource]=await Promise.all([
 readFile(new URL('./run-regressions.mjs',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8'),
 readFile(new URL('../ci/github/workflows/dependency-audit.yml',import.meta.url),'utf8'),
 readFile(new URL('../ci/github/workflows/install-mid.yml',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgText),baseline=JSON.parse(baselineText),failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};
for(const token of [
 "const localBin=path.join(root,'node_modules','.bin')",
 "PATH:[localBin,process.env.PATH??''].filter(Boolean).join(path.delimiter)",
 'env:childEnv'
])need('Regression-Runner',runner,token);
if(pkg.scripts?.['test:regressions']!=='node scripts/run-regressions.mjs')failures.push('package.json: test:regressions fehlt oder ist falsch.');
if(!String(pkg.scripts?.verify??'').includes('npm run test:regressions'))failures.push('package.json: verify muss die Regressionen über npm starten.');
need('Workflow-Quelle',workflowSource,'npm run test:regressions');
if(workflowSource.includes('          node scripts/run-regressions.mjs'))failures.push('Workflow-Quelle: direkter Runner-Aufruf umgeht weiterhin den npm-Einstieg.');
need('Installer-Vertrag',installerSource,"--exclude='.github/'");
if(pkg.version!==baseline.releaseVersion)failures.push(`Version/Baseline nicht synchron: ${pkg.version}/${baseline.releaseVersion}`);
if(!baseline.regressionTests?.includes('scripts/test-regression-runner-local-bin-09365.mjs'))failures.push('Baseline registriert den Runner-Schutztest nicht.');
if(failures.length){console.error(`MID Regression-Runner-PATH-Schutz fehlgeschlagen:
- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID: Regression-Runner priorisiert projektlokale node_modules/.bin-Werkzeuge; verify und die kanonische Dependency-Audit-Quelle starten die Suite über npm, ohne die installer-geschützte aktive .github-Konfiguration vorauszusetzen.');
