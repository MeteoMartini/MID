import assert from 'node:assert/strict';
import fs from 'node:fs';

const travel=fs.readFileSync('src/TravelPlannerPanel.tsx','utf8');
const radar=fs.readFileSync('src/RadarPanel.tsx','utf8');
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const baseline=JSON.parse(fs.readFileSync('MID_BASELINE.json','utf8'));

assert.ok(travel.includes("useState<Location>(initialLocation)"),'Reiseplaner muss mit dem aktuell ausgewählten MID-Ort starten.');
assert.ok(travel.includes("useState<'current'|'custom'>('current')"),'Reiseplaner muss den Ursprung des Zielorts explizit unterscheiden.');
assert.ok(travel.includes("if(destinationSource==='current')setDestination(initialLocation)"),'Aktuelles MID-Ziel muss synchron bleiben, solange kein alternatives Reiseziel gewählt wurde.');
assert.ok(travel.includes("chooseLocation(initialLocation,'current')"),'Button „Aktueller MID-Ort“ muss explizit auf den aktuellen MID-Ort zurücksetzen.');
assert.ok(travel.includes("destinationSource==='current'?'Aktuell ausgewählter MID-Ort':'Ausgewähltes Reiseziel'"),'Zielkarten-Beschriftung muss aktuellen MID-Ort und eigenes Reiseziel unterscheiden.');
assert.ok(!travel.includes("mid:travel-planner:location"),'Ein altes persistent gespeichertes Reiseziel darf den Startzustand nicht mehr überschreiben.');
assert.ok(!travel.includes('function storedLocation('),'Alte Travel-Location-Initialisierung darf nicht mehr aktiv sein.');

assert.ok(radar.includes("id:'boundary-fallback'"),'Komposit-Referenzlayer braucht einen allgemeinen Boundary-Fallback.');
assert.ok(radar.includes("adminLevel=(level:number)=>['any',['==',['get','admin_level'],level],['==',['get','admin_level'],String(level)]]"),'admin_level muss numerisch und als String akzeptiert werden.');
assert.ok(radar.includes("['!',['has','maritime']]"),'Grenzen ohne maritime-Eigenschaft dürfen nicht herausgefiltert werden.');
assert.ok(radar.includes("['==',['get','maritime'],'0']")&&radar.includes("['==',['get','maritime'],'false']"),'maritime muss auch stringbasiert robust ausgewertet werden.');
assert.ok(radar.includes("sourceLayer:'boundary'")&&radar.includes("sourceLayer:'place'"),'Oberer Kompositlayer muss Grenzen und Städte gemeinsam bereitstellen.');

assert.equal(pkg.version,baseline.releaseVersion,'Releaseversion und Baseline müssen synchron sein.');
const self='scripts/test-travel-current-composite-boundaries-097632.mjs';
assert.ok(baseline.requiredRegressionTests?.includes(self),'Neuer Test fehlt in requiredRegressionTests.');
assert.ok(baseline.regressionTests?.includes(self),'Neuer Test fehlt in regressionTests.');

console.log(`MID v${pkg.version}: Reiseplaner-Defaultziel und Komposit-Grenzoverlay geschützt.`);
