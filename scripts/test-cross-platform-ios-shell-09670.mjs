import {access,readFile} from 'node:fs/promises';
import {versionAtLeast} from './version-regression-helper.mjs';

const root=new URL('../',import.meta.url);
const read=path=>readFile(new URL(path,root),'utf8');
const [pkgText,config,runtime,pwa,install,main,styles,source,contract,roadmap,statusText,baselineText,worker,iosProject,infoPlist]=await Promise.all([
 read('package.json'),read('capacitor.config.ts'),read('src/runtimePlatform.ts'),read('src/pwa.ts'),read('src/PwaInstallButton.tsx'),read('src/main.tsx'),read('src/styles.css'),read('MID_SOURCE_OF_TRUTH.md'),read('MID_CROSS_PLATFORM_CONTRACT.md'),read('MID_IOS_ROADMAP.md'),read('MID_IOS_STATUS.json'),read('MID_BASELINE.json'),read('worker/metar-proxy.js'),read('ios/App/App.xcodeproj/project.pbxproj'),read('ios/App/App/Info.plist')
]);
const pkg=JSON.parse(pkgText),status=JSON.parse(statusText),baseline=JSON.parse(baselineText),failures=[];
const need=(label,text,token)=>{if(!text.includes(token))failures.push(`${label}: ${token}`)};

if(pkg.version!=='0.9.67.0')failures.push(`Releaseversion ist nicht 0.9.67.0: ${pkg.version}`);
if(!versionAtLeast('0.9.67.0','0.9.66.19')||versionAtLeast('0.9.66.18','0.9.66.19'))failures.push('Semantischer Mindestversionsschutz ist fehlerhaft.');
for(const[name,version]of Object.entries({'@capacitor/core':'8.5.0','@capacitor/ios':'8.5.0','@capacitor/app':'8.1.1','@capacitor/splash-screen':'8.0.2','@capacitor/status-bar':'8.0.3'}))if(pkg.dependencies?.[name]!==version)failures.push(`${name} ist nicht exakt auf ${version} gepinnt.`);
if(pkg.devDependencies?.['@capacitor/cli']!=='8.5.0')failures.push('@capacitor/cli ist nicht exakt auf 8.5.0 gepinnt.');
if(pkg.scripts?.['ios:sync']!=='npm run build && cap sync ios')failures.push('Reproduzierbarer iOS-Sync fehlt.');
for(const token of ["appId:'app.midwx.weather'","appName:'MID Wetter'","webDir:'dist'"])need('Capacitor-Konfiguration',config,token);
if(config.includes('server:')||config.includes('server.url'))failures.push('Die Produktions-App darf keinen entfernten Server statt des gebündelten dist-Builds laden.');
for(const token of ['Capacitor.isNativePlatform()','document.documentElement.dataset.midRuntime=platform',"App.addListener('appStateChange'","App.addListener('appUrlOpen'",'StatusBar.setOverlaysWebView({overlay:false})','SplashScreen.hide()'])need('Native Laufzeitbrücke',runtime,token);
need('PWA-Isolation',pwa,'isMidNativeRuntime()');
need('PWA-Installationsschutz',install,'isMidNativeRuntime()?null:<BrowserPwaInstallButton/>');
for(const token of ['prepareMidRuntimeDocument()','startMidNativeRuntimeBridge()','markMidNativeRuntimeReady()'])need('App-Start',main,token);
for(const token of ['data-mid-runtime=ios','safe-area-inset-top','safe-area-inset-bottom'])need('Native Safe Area',styles,token);
for(const token of ['Browser-/PWA-App und als native iOS-App parallel','keinen separaten iOS-Fachfork','unversionierte Professional-ZIP'])need('Cross-Platform-Vertrag',contract,token);
for(const token of ['Native Plattformadapter – nächste autonome Etappe','Browser-Produktionsbuild','Apple-Freigabegate'])need('iOS-Roadmap',roadmap,token);
need('Source of Truth',source,'MID_CROSS_PLATFORM_CONTRACT.md');
if(status.browserDevelopmentContinues!==true||status.strategy!=='shared-react-vite-core-with-capacitor-ios-shell')failures.push('Fortsetzungsstatus schützt die parallele Browserentwicklung nicht.');
if(status.nextMilestone!=='native-location-adapter-with-browser-fallback')failures.push('Nächster autonomer iOS-Meilenstein ist nicht eindeutig.');
if(baseline.releaseVersion!==pkg.version)failures.push(`Baseline ${baseline.releaseVersion} != Paket ${pkg.version}`);
for(const listName of ['requiredRegressionTests','regressionTests'])if(!baseline[listName]?.includes('scripts/test-cross-platform-ios-shell-09670.mjs'))failures.push(`Baseline-${listName} enthält die Cross-Platform-Regression nicht.`);
for(const listName of ['requiredFiles','protectedFiles'])if(!baseline[listName]?.includes('scripts/version-regression-helper.mjs'))failures.push(`Baseline-${listName} schützt den semantischen Versionsvergleich nicht.`);
for(const file of ['MID_IOS_ROADMAP.md','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png','ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'])if(!baseline.requiredFiles?.includes(file))failures.push(`Baseline-requiredFiles enthält ${file} nicht.`);
if(!baseline.protectedFiles?.includes('MID_IOS_ROADMAP.md'))failures.push('Die iOS-Roadmap ist nicht als geschützter Vertrag registriert.');
if(!worker.includes(`const WORKER_VERSION='${pkg.version}';`))failures.push('Worker und gemeinsamer Release sind nicht versionssynchron.');
for(const relative of ['ios/App/App.xcodeproj/project.pbxproj','ios/App/App/Info.plist','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png','ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'])try{await access(new URL(relative,root))}catch{failures.push(`Generiertes iOS-Projekt fehlt: ${relative}`)}
for(const token of ['MARKETING_VERSION = 0.9.67;','CURRENT_PROJECT_VERSION = 1;','PRODUCT_BUNDLE_IDENTIFIER = app.midwx.weather;'])need('Xcode-Versionierung',iosProject,token);
for(const token of ['NSLocationWhenInUseUsageDescription','NSMotionUsageDescription','lokale Wetterdaten, Warnungen und Radarhinweise'])need('iOS-Berechtigungen',infoPlist,token);
if(failures.length){console.error(`Cross-Platform-/iOS-Shell-Prüfung fehlgeschlagen:\n- ${failures.join('\n- ')}`);process.exit(1)}
console.log('MID v0.9.67.0: gemeinsamer Browser-/PWA-Kern und Capacitor-iOS-Shell sind geschützt.');
