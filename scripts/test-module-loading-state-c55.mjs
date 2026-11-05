import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,writeFile,rm,readFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {join} from 'node:path';
// Actual React server rendering, with neutral geometry kept out of the live region text.
const dir=await mkdtemp(join(process.cwd(),'.loading-qa-'));
try{
 const result=await build({stdin:{contents:`import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import{ModuleLoadingState}from'./src/ModuleLoadingState';export const render=(kind)=>renderToStaticMarkup(<ModuleLoadingState label="Wetterdaten werden geladen …" kind={kind}/>);`,resolveDir:process.cwd(),loader:'tsx'},bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',write:false});
 const file=join(dir,'render.mjs');await writeFile(file,result.outputFiles[0].text);
 const {render}=await import(pathToFileURL(file));
 for(const kind of ['chart','map']){
  const html=render(kind);
  assert.match(html,/role="status"/);assert.match(html,/aria-live="polite"/);
  assert.match(html,/aria-hidden="true"/);assert.match(html,/Wetterdaten werden geladen/);
  assert.match(html,/min-width:0/);assert.match(html,/box-sizing:border-box/);
  assert.doesNotMatch(html,/animation:|progressbar|°C|mm\/h|<svg|<canvas/);
 }
 const app=await readFile('src/App.tsx','utf8');
 assert.match(app,/aria-current=\{moreActive\?'page':undefined\}/);
 for(const file of ['src/App.tsx','src/MapWorkspacePanel.tsx','src/LongRangePanel.tsx'])assert.match(await readFile(file,'utf8'),/<ModuleLoadingState/);
 console.log('PASS: rendered chart/map status, neutral geometry, responsive containment, motion-free loading and consumer wiring.');
}finally{await rm(dir,{recursive:true,force:true})}
