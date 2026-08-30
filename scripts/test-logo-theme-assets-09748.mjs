import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';

const root=new URL('../',import.meta.url);
const read=relative=>readFile(new URL(relative,root));
const text=async relative=>(await read(relative)).toString('utf8');
const dimensions=buffer=>({width:buffer.readUInt32BE(16),height:buffer.readUInt32BE(20)});
const digest=buffer=>createHash('sha256').update(buffer).digest('hex');
const test='scripts/test-logo-theme-assets-09748.mjs';

const [app,index,manifest,sw,legacySw,appIconCatalog,splashCatalog,pkg,baseline]=await Promise.all([
  text('src/App.tsx'),text('index.html'),text('public/manifest.webmanifest'),text('public/sw.js'),text('public/service-worker.js'),
  text('ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json'),text('ios/App/App/Assets.xcassets/Splash.imageset/Contents.json'),
  text('package.json'),text('MID_BASELINE.json')
]);

assert.ok(app.includes("const LIGHT_LOGO_PATH='./mid-logo-light-compact.png';"));
assert.ok(app.includes("const DARK_LOGO_PATH='./mid-logo-dark-compact.png';"));
assert.ok(app.includes("variant==='auto'?(dark?'dark':'light'):variant"),'Auto muss Theme und Logo gleichnamig auflösen.');
assert.ok(app.includes('localStorage.setItem(BRAND_LOGO_STORAGE_KEY,brandLogoVariant)'),'Logoauswahl muss persistent bleiben.');
assert.ok(app.includes('brand-logo-preview'),'Einstellungen müssen die echten Logos zeigen.');

for(const token of ['./mid-logo-light-horizontal.png','./mid-logo-dark-horizontal.png','./mid-favicon-light-64.png','./mid-favicon-dark-64.png','id="mid-apple-touch-icon"'])assert.ok(index.includes(token),`Boot-/Dokument-Asset fehlt: ${token}`);
assert.ok(index.includes('https://www.midwx.app/mid-social-card.png'));

const parsedManifest=JSON.parse(manifest);
assert.deepEqual(parsedManifest.icons.map(icon=>[icon.src,icon.sizes]),[['./mid-icon-dark-192.png','192x192'],['./mid-icon-dark-512.png','512x512']]);
for(const source of [sw,legacySw])for(const token of ['mid-logo-dark-compact.png','mid-logo-light-compact.png','mid-logo-dark-horizontal.png','mid-logo-light-horizontal.png','mid-icon-dark-512.png','mid-icon-light-512.png'])assert.ok(source.includes(token),`Offline-Cache fehlt: ${token}`);

const assets={
  'public/mid-app-icon-light-1024.png':[1024,1024],
  'public/mid-app-icon-dark-1024.png':[1024,1024],
  'public/mid-icon-light-192.png':[192,192],
  'public/mid-icon-dark-192.png':[192,192],
  'public/mid-icon-light-512.png':[512,512],
  'public/mid-icon-dark-512.png':[512,512],
  'public/mid-icon-light-180.png':[180,180],
  'public/mid-icon-dark-180.png':[180,180],
  'public/mid-logo-light-compact.png':[512,512],
  'public/mid-logo-dark-compact.png':[512,512],
  'public/mid-social-card.png':[1200,630],
  'ios/App/App/Assets.xcassets/Splash.imageset/splash-light-2732x2732-1x.png':[2732,2732],
  'ios/App/App/Assets.xcassets/Splash.imageset/splash-dark-2732x2732-1x.png':[2732,2732]
};
for(const [path,[width,height]] of Object.entries(assets)){const image=await read(path);assert.deepEqual(dimensions(image),{width,height},path);}
assert.notEqual(digest(await read('public/mid-app-icon-light-1024.png')),digest(await read('public/mid-app-icon-dark-1024.png')),'Light und Dark App-Icon müssen verschieden sein.');

const parsedAppIcons=JSON.parse(appIconCatalog),parsedSplash=JSON.parse(splashCatalog);
assert.ok(parsedAppIcons.images.some(image=>image.filename==='AppIcon-Light-1024.png'));
assert.ok(parsedAppIcons.images.some(image=>image.filename==='AppIcon-Dark-1024.png'&&image.appearances?.some(item=>item.value==='dark')));
assert.equal(parsedSplash.images.filter(image=>image.filename?.startsWith('splash-light-')&&image.scale==='1x').length,1);
assert.equal(parsedSplash.images.filter(image=>image.filename?.startsWith('splash-dark-')&&image.scale==='1x'&&image.appearances?.some(item=>item.value==='dark')).length,1);

const packageJson=JSON.parse(pkg),baselineJson=JSON.parse(baseline);
assert.equal(packageJson.version,baselineJson.releaseVersion);
assert.equal(packageJson.scripts?.['test:logo-theme-assets'],`node ${test}`);
for(const key of ['requiredRegressionTests','regressionTests','requiredFiles'])assert.ok(baselineJson[key]?.includes(test),`${test} fehlt in ${key}.`);
console.log('Verbindliche MID-Light-/Dark-Logo-Sets für Header, Boot, PWA/Favicon und iOS geprüft.');
