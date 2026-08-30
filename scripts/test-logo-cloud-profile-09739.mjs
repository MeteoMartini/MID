import fs from 'node:fs';

const appSource=fs.readFileSync('src/App.tsx','utf8');
const cockpitSource=fs.readFileSync('src/ForecastCockpit.tsx','utf8');
const stylesSource=fs.readFileSync('src/styles.css','utf8');
const indexSource=fs.readFileSync('index.html','utf8');
const serviceWorkerSource=fs.readFileSync('public/service-worker.js','utf8');
const legacyServiceWorkerSource=fs.readFileSync('public/sw.js','utf8');

const checks=[
  ['brand logo storage key',appSource.includes("const BRAND_LOGO_STORAGE_KEY='mid:brandLogoVariant';")],
  ['brand logo selector type',appSource.includes("type BrandLogoVariant='auto'|'dark'|'light';")],
  ['settings logo chooser section',appSource.includes('<h3>MID-Logo</h3>')&&appSource.includes('Dunkles Logo')&&appSource.includes('Helles Logo')],
  ['header receives dynamic brand logo path',appSource.includes('brandLogoPath:string')&&appSource.includes('src={brandLogoPath}')],
  ['boot shell uses dynamic logo preload',indexSource.includes('id="mid-logo-preload"')&&indexSource.includes('window.__MID_BOOT_LOGO_PATH__=logoPath')],
  ['service workers cache both logo variants',serviceWorkerSource.includes("'./mid-logo-dark.png'")&&serviceWorkerSource.includes("'./mid-logo-light.png'")&&legacyServiceWorkerSource.includes("'./mid-logo-dark.png'")&&legacyServiceWorkerSource.includes("'./mid-logo-light.png'")],
  ['cloud row uses continuous opacity bands',cockpitSource.includes('cloud-opacity-band')&&cockpitSource.includes('width={item.columnWidth+.25}')],
  ['cloud row styling updated',stylesSource.includes('.cockpit-weather-profile .cloud-opacity-band{')&&!stylesSource.includes('.cockpit-weather-profile .cloud-cell-frame')],
];

const failed=checks.filter(([,passed])=>!passed);
if(failed.length){
  console.error('Regression failed:');
  for(const [label] of failed)console.error(` - ${label}`);
  process.exit(1);
}
console.log('Logo selection and cloud profile regression passed.');
