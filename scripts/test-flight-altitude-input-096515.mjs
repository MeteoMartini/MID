import assert from 'node:assert/strict';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const test='scripts/test-flight-altitude-input-096515.mjs';
const [panel,styles,baselineRaw,pkgRaw]=await Promise.all([readFile('src/CrossSectionPanel.tsx','utf8'),readFile('src/styles.css','utf8'),readFile('MID_BASELINE.json','utf8'),readFile('package.json','utf8')]);
const failures=[];const need=(l,t,x)=>{if(!t.includes(x))failures.push(`${l}: ${x}`)},reject=(l,t,x)=>{if(t.includes(x))failures.push(`${l}: Altlogik noch vorhanden: ${x}`)};
for(const token of ["type AltitudeMode='fl'|'agl'","const ALTITUDE_MODE_KEY='mid:flightCrossSection:altitudeMode'",'className="flight-number-field flight-altitude-field"','<option value="fl">FL</option>','<option value="agl">ft AGL</option>',"step={altitudeMode==='agl'?100:10}","max={altitudeMode==='agl'?4900:550}",'onChange={event=>setAltitudeInput(event.target.value)}','onBlur={commitAltitude}','flightLevelFromAltitudeInput(altitudeMode,numeric)','MODELLDIAGNOSTIK AM GEWÄHLTEN FLUGNIVEAU','Bewölkung am Flugniveau'])need('Höheneingabe',panel,token);
for(const token of ['.flight-altitude-field{','.flight-cross-form .flight-altitude-unit{'])need('Höheneingabe-CSS',styles,token);
reject('Höheneingabe',panel,"<b>{flightLevel<50?'ft':'FL'}</b>");reject('Höheneingabe',panel,'onChange={event=>setFlightLevel(normalizeFlightLevel');
const compileDir=await mkdtemp(path.join(tmpdir(),'mid-flight-altitude-'));
try{const compile=spawnSync('tsc',['--pretty','false','--target','ES2022','--module','ESNext','--moduleResolution','Bundler','--strict','--skipLibCheck','--outDir',compileDir,path.resolve('src/flightRouteBriefing.ts')],{encoding:'utf8'});if(compile.status!==0)failures.push(`TypeScript: ${compile.stdout||compile.stderr}`);else{const m=await import(`${pathToFileURL(path.join(compileDir,'flightRouteBriefing.js')).href}?v=${Date.now()}`);assert.equal(m.flightLevelFromAltitudeInput('agl',0),0);assert.equal(m.flightLevelFromAltitudeInput('agl',3500),35);assert.equal(m.flightLevelFromAltitudeInput('agl',4900),49);assert.equal(m.formatSelectedAltitudeLabel(35),'3500 ft AGL');assert.equal(m.flightLevelFromAltitudeInput('fl',380),380);assert.equal(m.flightLevelFromAltitudeInput('fl',385),390);assert.equal(m.flightLevelFromAltitudeInput('fl',560),550);assert.equal(m.normalizeFlightLevel(35),35);assert.equal(m.normalizeFlightLevel(47),47);assert.equal(m.normalizeFlightLevel(54),50)}}finally{await rm(compileDir,{recursive:true,force:true})}
const baseline=JSON.parse(baselineRaw),pkg=JSON.parse(pkgRaw);if(!baseline.requiredRegressionTests?.includes(test))failures.push('Baseline-Pflichtregression fehlt.');if(!baseline.regressionTests?.includes(test))failures.push('Baseline-Regression fehlt.');if(!pkg.scripts?.['test:flight-altitude-input'])failures.push('Package-Testskript fehlt.');
if(failures.length){console.error('Streckenbriefing-Höheneingabe fehlgeschlagen:\n- '+failures.join('\n- '));process.exit(1)}
console.log('Streckenbriefing-Höheneingabe geprüft: explizite FL/ft-AGL-Wahl, freie Mehrzifferneingabe, 100-ft-Präzision unter FL050 und 10-FL-Rundung ab FL050.');
