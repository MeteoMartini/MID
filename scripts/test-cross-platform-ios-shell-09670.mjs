import {access,readFile} from 'node:fs/promises';
import {expectedIosNextMilestone,versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,config,runtime,pwa,install,main,styles,source,contract,roadmap,statusText,baselineText,worker,iosProject,infoPlist,appIconCatalog]=await Promise.all([
 read('package.json'),read('capacitor.config.json'),read('src/runtimePlatform.ts'),read('src/pwa.ts'),read('src/PwaInstallButton.tsx'),read('src/main.tsx'),read('src/styles.css'),read('MID_SOURCE_OF_TRUTH.md'),read('MID_CROSS_PLATFORM_CONTRACT.md'),read('MID_IOS_ROADMAP.md'),read('MID_IOS_STATUS.json'),read('MID_BASELINE.json'),read('worker/metar-proxy.js'),read('ios/App/App.xcodeproj/project.pbxproj'),read('ios/App/App/Info.plist'),read('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json')
]);
const pkg=JSON.parse(pkgText),capacitorConfig=JSON.parse(config),status=JSON.parse(statusText),baseline=JSON.parse(baselineText),failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

if(!versionAtLeast(pkg.version,'0.9.67.0'))failures.push(`Releaseversion ist älter als 0.9.67.0: ${pkg.version}`);
if(!versionAtLeast('0.9.67.0','0.9.66.19')||versionAtLeast('0.9.66.18','0.9.66.19'))failures.push('Semantischer Mindestversionsschutz ist fehlerhaft.');
for(const[name,version]of Object.entries({'@capacitor/core':'8.5.1','@capacitor/ios':'8.5.1','@capacitor/app':'8.1.1','@capacitor/splash-screen':'8.0.2','@capacitor/status-bar':'8.0.3'}))if(pkg.dependencies?.[name]!==version)failures.push(`${name} ist nicht exakt auf ${version} gepinnt.`);
if(pkg.devDependencies?.['@capacitor/cli']!=='8.5.1')failures.push('@capacitor/cli ist nicht exakt auf 8.5.1 gepinnt.');
if(pkg.scripts?.['ios:sync']!=='npm run build && cap sync ios')failures.push('Reproduzierbarer iOS-Sync fehlt.');
for(const [key,value] of Object.entries({appId:'app.midwx.weather',appName:'MID Wetter',webDir:'dist'}))if(capacitorConfig[key]!==value)failures.push(`Capacitor-Konfiguration ${key} != ${value}`);
if('server' in capacitorConfig)failures.push('Die Produktions-App darf keinen entfernten Server statt des gebündelten dist-Builds laden.');
for(const token of ['Capacitor.isNativePlatform()','document.documentElement.dataset.midRuntime=platform',"App.addListener('appStateChange'","App.addListener('appUrlOpen'",'StatusBar.setOverlaysWebView({overlay:false})','SplashScreen.hide()'])need('Native Laufzeitbrücke',runtime,token);
need('PWA-Isolation',pwa,'isMidNativeRuntime()');
need('PWA-Installationsschutz',install,'isMidNativeRuntime()?null:<BrowserPwaInstallButton/>');
for(const token of ['prepareMidRuntimeDocument()','startMidNativeRuntimeBridge()','markMidNativeRuntimeReady()'])need('App-Start',main,token);
for(const token of ['data-mid-runtime=ios','safe-area-inset-top','safe-area-inset-bottom'])need('Native Safe Area',styles,token);
for(const token of ['Browser-/PWA-App und als native iOS-App parallel','keinen separaten iOS-Fachfork','unversionierte Professional-ZIP'])need('Cross-Platform-Vertrag',contract,token);
for(const token of ['Native Plattformadapter','Browser-Produktionsbuild','Apple-Freigabegate'])need('iOS-Roadmap',roadmap,token);
need('Source of Truth',source,'MID_CROSS_PLATFORM_CONTRACT.md');
if(status.browserDevelopmentContinues!==true||status.strategy!=='shared-react-vite-core-with-capacitor-ios-shell')failures.push('Fortsetzungsstatus schützt die parallele Browserentwicklung nicht.');
if(versionAtLeast(pkg.version,'0.9.68.0')){
 if(!status.completed?.includes('native-location-adapter-with-browser-fallback'))failures.push('Der native Standortadapter ist nicht als abgeschlossen dokumentiert.');
 const expectedNext=expectedIosNextMilestone(pkg.version);
 if(versionAtLeast(pkg.version,'0.9.71.0')&&!status.completed?.includes('widgetkit-xcode-structure-with-mid-native-widget-v1-0.9.71.0'))failures.push('Die WidgetKit-Xcode-Struktur ist nicht als abgeschlossen dokumentiert.');
 if(status.nextMilestone!==expectedNext)failures.push('Der nächste autonome iOS-Meilenstein ist nicht eindeutig.');
}else if(status.nextMilestone!=='native-location-adapter-with-browser-fallback')failures.push('Nächster autonomer iOS-Meilenstein ist nicht eindeutig.');
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != Paket ${pkg.version}`);
for(const listName of ['requiredRegressionTests','regressionTests'])if(!baseline[listName]?.includes('scripts/test-cross-platform-ios-shell-09670.mjs'))failures.push(`Baseline-${listName} enthält die Cross-Platform-Regression nicht.`);
for(const listName of ['requiredFiles','protectedFiles'])if(!baseline[listName]?.includes('scripts/version-regression-helper.mjs'))failures.push(`Baseline-${listName} schützt den semantischen Versionsvergleich nicht.`);
for(const file of ['MID_IOS_ROADMAP.md','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-Light-1024.png','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-Dark-1024.png','ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'])if(!baseline.requiredFiles?.includes(file))failures.push(`Baseline-requiredFiles enthält ${file} nicht.`);
if(!baseline.protectedFiles?.includes('MID_IOS_ROADMAP.md'))failures.push('Die iOS-Roadmap ist nicht als geschützter Vertrag registriert.');
if(!worker.includes(`const WORKER_VERSION='${pkg.version}';`))failures.push('Worker und gemeinsamer Release sind nicht versionssynchron.');
for(const token of ['AppIcon-Light-1024.png','AppIcon-Dark-1024.png','"appearance" : "luminosity"','"value" : "dark"'])need('iOS-AppIcon-Katalog',appIconCatalog,token);
for(const relative of ['ios/App/App.xcodeproj/project.pbxproj','ios/App/App/Info.plist','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-Light-1024.png','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-Dark-1024.png','ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'])try{await access(new URL(relative,root))}catch{failures.push(`Generiertes iOS-Projekt fehlt: ${relative}`)}
const versionParts=pkg.version.split('.').map(part=>Number.parseInt(part,10)||0),marketingVersion=versionParts.slice(0,3).join('.'),buildNumber=String(Math.max(1,(versionParts[3]??0)+1));
for(const token of [`MARKETING_VERSION = ${marketingVersion};`,`CURRENT_PROJECT_VERSION = ${buildNumber};`,'PRODUCT_BUNDLE_IDENTIFIER = app.midwx.weather;'])need('Xcode-Versionierung',iosProject,token);
for(const token of ['NSLocationWhenInUseUsageDescription','NSMotionUsageDescription','lokale Wetterdaten, Warnungen und Radarhinweise'])need('iOS-Berechtigungen',infoPlist,token);
if(failures.length){console.error(`Cross-Platform-/iOS-Shell-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log(`MID v${pkg.version}: gemeinsamer Browser-/PWA-Kern und Capacitor-iOS-Shell sind geschützt.`);
