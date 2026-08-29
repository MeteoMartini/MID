import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [foundation,modern,styles,indexHtml,runtime,pkgRaw,baselineRaw,statusRaw,implementation,workerCore,iosProject]=await Promise.all([
 readFile('src/styles-src/00-foundation.css','utf8'),
 readFile('src/styles-src/30-modern.css','utf8'),
 readFile('src/styles.css','utf8'),
 readFile('index.html','utf8'),
 readFile('src/runtimePlatform.ts','utf8'),
 readFile('package.json','utf8'),
 readFile('MID_BASELINE.json','utf8'),
 readFile('MID_IOS_STATUS.json','utf8'),
 readFile('MID_IMPLEMENTATION_0.9.67.1.md','utf8'),
 readFile('worker-src/00-core-observations.js','utf8'),
 readFile('ios/App/App.xcodeproj/project.pbxproj','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw),status=JSON.parse(statusRaw),test='scripts/test-ios-safe-area-header-096671.mjs';
const versionAtLeast=(value,minimum)=>{const left=String(value).split('.').map(Number),right=String(minimum).split('.').map(Number),length=Math.max(left.length,right.length);for(let index=0;index<length;index++){const delta=(left[index]||0)-(right[index]||0);if(delta)return delta>0}return true};
assert.ok(versionAtLeast(pkg.version,'0.9.67.1'));
assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(status.releaseVersion,pkg.version);
assert.equal(pkg.scripts?.['test:ios-safe-area-header'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles','protectedFiles'])assert.ok(baseline[key].includes(test),`${test} fehlt in ${key}.`);
assert.ok(baseline.requiredFiles.includes('MID_IMPLEMENTATION_0.9.67.1.md'));
assert.ok(indexHtml.includes('name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"'));
assert.ok(indexHtml.includes('name="apple-mobile-web-app-status-bar-style" content="default"'));
assert.ok(!indexHtml.includes('apple-mobile-web-app-status-bar-style" content="black-translucent"'));
for(const token of [
 '--mid-safe-top:env(safe-area-inset-top,0px)',
 '.app{padding:max(16px,calc(var(--mid-safe-top) + 10px))',
 '.top{top:calc(var(--mid-safe-top) + 10px)}',
 '.top{top:auto}',
 '.settings-dialog{padding:var(--mid-safe-top) var(--mid-safe-right) var(--mid-safe-bottom) var(--mid-safe-left)}'
])assert.ok(foundation.includes(token),`Appweiter Safe-Area-Vertrag fehlt: ${token}`);
for(const token of [
 '.dashboard-section-quick{top:calc(var(--mid-safe-top) + 6px)}',
 '.dashboard-section-anchor{scroll-margin-top:calc(var(--mid-safe-top) + 58px)}',
 '.dashboard-section-drawer{height:100dvh;padding:var(--mid-safe-top) var(--mid-safe-right) var(--mid-safe-bottom) var(--mid-safe-left)}'
])assert.ok(modern.includes(token),`Mobile Kopfzeilen-/Drawer-Safe-Area fehlt: ${token}`);
assert.ok(runtime.includes('StatusBar.setOverlaysWebView({overlay:false})'),'Der native Container muss die WebView zusätzlich unter der Statusleiste halten.');
assert.ok(workerCore.includes(`const WORKER_VERSION='${pkg.version}';`),'Professional- und Worker-Version sind nicht gekoppelt.');
const versionParts=pkg.version.split('.').map(Number),marketingVersion=versionParts.slice(0,3).join('.'),buildNumber=String(Math.max(1,(versionParts[3]||0)+1));
assert.ok(iosProject.includes(`MARKETING_VERSION = ${marketingVersion};`)&&iosProject.includes(`CURRENT_PROJECT_VERSION = ${buildNumber};`),`Xcode-Version ${marketingVersion} (Build ${buildNumber}) fehlt.`);
assert.equal(status.browserDevelopmentContinues,true);
assert.equal(status.nextMilestone,versionAtLeast(pkg.version,'0.9.70.1')?'widgetkit-xcode-structure-with-mid-native-widget-v1':versionAtLeast(pkg.version,'0.9.68.2')?'lifecycle-offline-resume-without-local-data-loss':versionAtLeast(pkg.version,'0.9.68.1')?'native-share-import-export-with-browser-fallback':versionAtLeast(pkg.version,'0.9.68.0')?'native-external-navigation-with-deep-link-return':'native-location-adapter-with-browser-fallback');
assert.ok(implementation.includes('Hauptkopfzeile')&&implementation.includes('haftende Sektionsnavigation'));
assert.equal(styles,await ['src/styles-src/00-foundation.css','src/styles-src/10-features.css','src/styles-src/20-ensemble-composite.css','src/styles-src/25-extreme-outlook.css','src/styles-src/30-modern.css'].reduce(async(acc,path)=>(await acc)+await readFile(path,'utf8'),Promise.resolve('')),'styles.css ist nicht mit den kanonischen Modulen synchron.');
console.log(`MID v${pkg.version}: Hauptkopfzeile, Sticky-Navigation und Vollbilddialoge bleiben unter der iOS-Statusleiste bedienbar.`);
