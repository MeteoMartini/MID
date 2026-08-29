import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url),read=path=>readFile(new URL(path,root),'utf8');
const[adapter,backup,backupUi,app,pkgRaw,baselineRaw,statusRaw,roadmap,implementation]=await Promise.all([
 read('src/filePlatform.ts'),read('src/iCloudBackup.ts'),read('src/ICloudBackupSettings.tsx'),read('src/App.tsx'),read('package.json'),read('MID_BASELINE.json'),read('MID_IOS_STATUS.json'),read('MID_IOS_ROADMAP.md'),read('MID_IMPLEMENTATION_0.9.68.2.md')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),status=JSON.parse(statusRaw),test='scripts/test-native-share-import-export-096682.mjs';

assert.ok(versionAtLeast(pkg.version,'0.9.68.2'));
assert.equal(pkg.dependencies?.['@capacitor/share'],'8.0.1');
assert.equal(pkg.dependencies?.['@capacitor/filesystem'],'8.1.3');
assert.equal(pkg.scripts?.['test:native-share-import-export'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredTests','requiredFiles','protectedFiles'])assert.ok(baseline[key]?.includes(test),`${test} fehlt in ${key}.`);
for(const file of ['src/filePlatform.ts','MID_IMPLEMENTATION_0.9.68.2.md'])assert.ok(baseline.requiredFiles?.includes(file),`${file} fehlt in requiredFiles.`);

assert.ok(adapter.includes("import('@capacitor/filesystem')")&&adapter.includes("import('@capacitor/share')"),'Native Datei-/Share-Plugins fehlen.');
assert.ok(adapter.includes('Directory.Cache')&&adapter.includes('Filesystem.writeFile(')&&adapter.includes('Filesystem.getUri('),'Native temporäre Datei fehlt.');
assert.ok(adapter.includes('Share.share(')&&adapter.includes('files:[uri]'),'Native Systemfreigabe fehlt.');
assert.ok(adapter.includes('Filesystem.deleteFile(')&&adapter.includes('finally'),'Temporäre Exportdatei wird nicht zuverlässig entfernt.');
assert.ok(adapter.includes('navigator as Navigator')&&adapter.includes('URL.createObjectURL(file)'),'Web-Share- und Downloadfallback fehlen.');
assert.ok(adapter.includes("'native-document-picker':'browser-file-picker'"),'Dokumentwählerpfade fehlen.');
assert.ok(!adapter.includes('localStorage')&&!adapter.includes('sessionStorage'),'Dateiadapter darf keine Fachdaten persistieren.');

assert.ok(backup.includes("import {shareOrExportMidFile} from './filePlatform';")&&backup.includes('await shareOrExportMidFile({file'),'Vollsicherung nutzt den Adapter nicht.');
assert.ok(app.includes("import {shareOrExportMidFile} from './filePlatform';")&&app.includes("new File([JSON.stringify(payload,null,2)],'mid-favoriten.json'")&&app.includes('await shareOrExportMidFile({file'),'Favoritenexport nutzt den Adapter nicht.');
assert.ok(backupUi.includes('type="file" accept=".midbackup,application/json"'),'Sicherungsimport verliert den gefilterten nativen Dokumentwähler.');
assert.ok(app.includes('type="file" accept="application/json,.json"'),'Favoritenimport verliert den gefilterten nativen Dokumentwähler.');

assert.ok(status.completed?.includes('native-share-import-export-with-browser-fallback'));
assert.equal(status.nextMilestone,'lifecycle-offline-resume-without-local-data-loss');
assert.ok(roadmap.includes('Teilen/Import/Export über native Systemdialoge – abgeschlossen in v0.9.68.2'));
assert.ok(implementation.includes('temporären Cache')&&implementation.includes('Dokumentwähler'));

console.log('MID 0.9.68.2: native Dateiübergabe, Dokumentwähler sowie Browser-/PWA-Fallbacks geprüft.');
