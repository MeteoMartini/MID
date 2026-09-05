import assert from 'node:assert/strict';
import {mkdtemp,readFile,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript-strada');

const root=new URL('../',import.meta.url);
const[panel,timeline,settings,styles]=await Promise.all(['src/RadarPanel.tsx','src/CompositeTimeline.ts','src/compositeSettings.ts','src/styles.css'].map(path=>readFile(new URL(path,root),'utf8')));

for(const token of [
 'buildAvailableCompositeTimeline(referenceSeconds,timelineContract)',
 "showPxAtTime=showRadar&&pxDisplayAvailable&&liveFollow&&viewMode==='radar'",
 'showWarningsAtTime=showWarnings&&liveFollow',
 'targetSeconds>referenceSeconds+90?[]:satelliteUntimed?',
 'targetMs>referenceMs+90*1000)return false',
 'requestedDwdFrame&&loadedRadarFrames.has(requestedDwdFrame.time)',
 'stableRadarTime',
 'radarTileFailures.current.get(time)',
 'failures>=3',
 'className="composite-view-tabs"',
 'className="composite-timeline-card"',
 'className="composite-site-summary"',
 'label="Zugspuren"'
])assert.ok(panel.includes(token),`Komposit-Zeitvertrag fehlt: ${token}`);
assert.ok(!panel.includes('buildCompositeTimeline(referenceSeconds)'),'Die UI darf keine erfundenen pauschalen Fünf-Minuten-Frames mehr erzeugen.');
assert.ok(!panel.includes('lateGraceSeconds:190*60'),'Satellitenbeobachtungen dürfen nicht in die Zukunft fortgeschrieben werden.');

for(const token of [
 'if(radarValid)return{direction:normalizeBearing(radarDirection)',
 'analysis.motionAnchors??[]',
 "confidence!=='high'&&confidence!=='medium'",
 'item.cross<=item.width',
 'resolveEchoApproachTrack([lat,lon],analysis,targetMs)',
 'mid-echo-approach-corridor',
 'Kein erkanntes Echo auf Standortkurs'
])assert.ok(panel.includes(token),`Echogebundene Zugspur fehlt: ${token}`);
assert.ok(!panel.includes('label="Zeitpfeil"'),'Der irreführende Zeitpfeil-Schalter darf nicht zurückkehren.');
assert.ok(settings.includes("export type CompositeViewMode='radar'|'satellite'|'synoptic'"),'Persistierter Darstellungsmodus fehlt.');
for(const token of ['.composite-view-tabs','.composite-layer-switches{display:grid!important','.composite-timeline-card','.composite-site-summary','.mid-approach-eta'])assert.ok(styles.includes(token),`Modernes Komposit-Layout fehlt: ${token}`);

const directory=await mkdtemp(join(tmpdir(),'mid-composite-timeline-'));
try{
 const output=ts.transpileModule(timeline,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ES2022}}).outputText,file=join(directory,'CompositeTimeline.mjs');
 await writeFile(file,output);
 const mod=await import(`${pathToFileURL(file).href}?v=${Date.now()}`),reference=1_000_000;
 const frames=mod.buildAvailableCompositeTimeline(reference,{source:'Test',observations:[reference-7200,reference-3600,reference-300],nowcasts:[reference+300,reference+7200,reference+9000]});
 assert.deepEqual(frames.map(frame=>frame.time),[reference-3600,reference-300,reference+300,reference+7200],'Nur echte Zeitstände innerhalb −1 h/+2 h dürfen enthalten sein.');
 assert.equal(frames.find(frame=>frame.live)?.time,reference-300,'Der jüngste reale Beobachtungsstand muss der Live-Anker sein.');
 assert.equal(frames.at(-1)?.phase,'nowcast','Zukünftige Radarframes müssen als Nowcast gekennzeichnet sein.');
 assert.equal(mod.nearestAvailableFrameIndex(frames,reference+240),2,'Die Auswahl muss auf den nächsten echten Produktstand springen.');
}finally{await rm(directory,{recursive:true,force:true})}

console.log('Kompositbild geprüft: zeitechte Layerframes, Live-Follow, gepufferte Rasterwechsel, moderne Modi und echogebundene Zugspuren.');
