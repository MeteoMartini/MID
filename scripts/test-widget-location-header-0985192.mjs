import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const root=process.cwd(),require=createRequire(path.join(root,'package.json')),{build}=require('esbuild');
const dir=await mkdtemp(path.join(root,'.mid-widget-location-'));
try{
 await build({stdin:{contents:"export {Widget} from './src/WidgetGenerator'; export {WIDGET_URL_LOCATIONS,WIDGET_URL_PROFILES} from './src/widgetUrlExports';",resolveDir:root,loader:'tsx'},bundle:true,platform:'node',format:'esm',packages:'external',outfile:path.join(dir,'render.mjs'),jsx:'automatic',loader:{'.css':'empty'},logLevel:'silent'});
 const {Widget,WIDGET_URL_LOCATIONS,WIDGET_URL_PROFILES}=await import(pathToFileURL(path.join(dir,'render.mjs'))),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
 for(const location of WIDGET_URL_LOCATIONS)for(const theme of ['light','dark']){
  const heads=[];
  for(const profile of WIDGET_URL_PROFILES){const html=renderToStaticMarkup(React.createElement(Widget,{loc:location,days:[],hours:[],minutes15:[],unit:'kn',elevation:123,timezone:'Europe/Berlin',timezoneAbbreviation:'CEST',ensemblePanel:null,onEnsembleRequested:()=>{},urlExport:{location,...profile,theme,temperatureColors:'ecmwf'}}));
   const head=html.match(/class="weatherwidget[^>]*>[\s\S]*?<header>([\s\S]*?)<\/header>/)?.[1];assert.ok(head,'Header must be inside PNG export target');assert.ok(head.includes(location.name));assert.ok(head.includes('123 m ü. NHN'));assert.ok(head.includes('Ortszeit CEST'));assert.ok(head.includes('°N')&&head.includes('°E'));assert.equal((html.match(/<span>MID Widget<\/span>/g)||[]).length,1);heads.push(head.replace(/<b>\d-Tage-Ausblick<\/b>/,''));
  }assert.equal(heads[0],heads[1],'Cards and curves must have identical location metadata');
 }
 const source=await readFile('src/WidgetGenerator.tsx','utf8');assert.ok(source.includes("{view!=='ensemble'&&<header>"));assert.ok(source.includes('toBlob(target,'));assert.ok(source.includes('ref={ref}'));
 console.log('Widget location: both export profiles × three locations × light/dark; identical metadata inside export target.');
}finally{await rm(dir,{recursive:true,force:true});}
if(process.env.GITHUB_ACTIONS==='true')execFileSync(process.execPath,['scripts/verify-widget-location-browser-0985192.mjs'],{stdio:'inherit',timeout:360000});
