import assert from 'node:assert/strict';import {readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);const [radar,styles,baselineText]=await Promise.all(['src/RadarPanel.tsx','src/styles.css','MID_BASELINE.json'].map(p=>readFile(new URL(p,root),'utf8')));
for(const token of ['referenceUrl','light_only_labels','dark_only_labels','mapOverlayOpacity','Karte oben','zIndex={790}','name="mid-motion-track"','zIndex:850','function PrecipitationMotionTrack','viewportDiagonalKm=Math.max(12,segmentKm(southWest,northEast))','(resolved.direction+180)%360','trackStart=destinationPoint(site,upstreamBearing,shaftKm)','<Marker pane="mid-motion-labels" position={site} icon={motionTrackArrowheadIcon'])assert.ok(radar.includes(token),`Kompositvertrag fehlt: ${token}`);
assert.equal((radar.match(/<MemoPrecipitationMotionTrack/g)||[]).length,1,'Es darf nur eine Zugspur gerendert werden.');
assert.equal((radar.match(/<MemoPrecipitationMotionArrows/g)||[]).length,0,'Altes Mehrpfeilfeld darf nicht gerendert werden.');
assert.ok(styles.includes('.mid-motion-track-arrowhead'),'Zugspur-Pfeilspitze fehlt im CSS.');
const baseline=JSON.parse(baselineText);assert.ok(baseline.requiredRegressionTests.includes('scripts/test-composite-top-reference-motion-track-09550.mjs'));
console.log('Komposit geprüft: oberste Referenzkarte mit Deckkraft und einen langen Zeitpfeil mit Pfeilspitze am Ort und upstream-Zeitlabels.');
