import {readFileSync} from 'node:fs';
const fail=[];
const pkg=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const baseline=JSON.parse(readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'));
const vite=readFileSync(new URL('../vite.config.ts',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/styles.css',import.meta.url),'utf8');
const versionParts=String(pkg.version).split('.').map(Number),minimum=[0,8,27,4],atLeastMinimum=versionParts.every((value,index)=>value===minimum[index])||versionParts.some((value,index)=>value>minimum[index]&&versionParts.slice(0,index).every((part,partIndex)=>part===minimum[partIndex]));
if(!atLeastMinimum)fail.push(`package.json liegt vor 0.8.27.4: ${pkg.version}`);
if(baseline.releaseVersion!==pkg.version)fail.push(`MID_BASELINE.json ${baseline.releaseVersion} passt nicht zu package.json ${pkg.version}`);
if(pkg.scripts?.['build:vite']!=='node --max-old-space-size=4096 node_modules/vite/bin/vite.js build')fail.push('Speicherschonender Vite-Start fehlt.');
for(const token of ["minify:'esbuild'","cssMinify:'esbuild'","reportCompressedSize:false"])if(!vite.includes(token))fail.push(`Vite-Konfiguration fehlt: ${token}`);
if(vite.includes('manualChunks'))fail.push('Riskante manuelle Vendor-Chunk-Aufteilung ist aktiv.');
if(css.includes('.chart.trend-combined:has('))fail.push('Dynamischer Tooltip-:has()-Selektor ist noch enthalten.');
if(!css.includes('z-index:90;'))fail.push('Statische Tooltip-Ebene fehlt.');
if(fail.length){console.error('MID Buildstabilitätsregression ab v0.8.27.4 fehlgeschlagen:\n- '+fail.join('\n- '));process.exit(1)}
console.log('MID Buildstabilitätsregression ab v0.8.27.4 bestanden.');
