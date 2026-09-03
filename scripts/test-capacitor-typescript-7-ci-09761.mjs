import assert from 'node:assert/strict';
import {access,readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,configText,installWorkflow,contract,baselineText]=await Promise.all([
 read('package.json'),read('capacitor.config.json'),read('ci/github/workflows/install-mid.yml'),read('MID_TYPESCRIPT_7_COMPATIBILITY_CONTRACT.md'),read('MID_BASELINE.json')
]);
const pkg=JSON.parse(pkgText),config=JSON.parse(configText),baseline=JSON.parse(baselineText),test='scripts/test-capacitor-typescript-7-ci-09761.mjs';
assert.equal(pkg.devDependencies?.typescript,'7.0.2');
assert.equal(pkg.devDependencies?.['@capacitor/cli'],'8.5.1');
assert.deepEqual(config,{appId:'app.midwx.weather',appName:'MID Wetter',webDir:'dist'});
await assert.rejects(access(new URL('capacitor.config.ts',root)),/ENOENT/,'TS-Konfigurationsdatei darf im Release nicht parallel liegen.');
assert.ok(installWorkflow.includes('./node_modules/.bin/cap copy ios'),'Installer muss weiterhin den geprüften Web-Build in die iOS-Hülle kopieren.');
for(const token of ['capacitor.config.json','TypeScript 7.0.2','Node 22.16','Compiler-API'])assert.ok(contract.includes(token),`TS7/Capacitor-Vertrag fehlt: ${token}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles?.includes('capacitor.config.json')&&baseline.protectedFiles?.includes('capacitor.config.json'),'JSON-Capacitor-Konfiguration ist nicht geschützt.');
assert.ok(!baseline.requiredFiles?.includes('capacitor.config.ts')&&!baseline.protectedFiles?.includes('capacitor.config.ts'),'Alte TS-Capacitor-Konfiguration ist noch im Baselinevertrag.');
console.log(`MID v${pkg.version}: Capacitor-Konfiguration ist TypeScript-7-unabhängig und funktioniert auch im bestehenden Node-22.16-Installerpfad.`);
