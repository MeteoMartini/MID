import assert from 'node:assert/strict'
import fs from 'node:fs'

const planner=fs.readFileSync(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8')
const eventCenter=fs.readFileSync(new URL('../src/eventCenter.ts',import.meta.url),'utf8')
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'))
const baseline=JSON.parse(fs.readFileSync(new URL('../MID_BASELINE.json',import.meta.url),'utf8'))

assert.equal(baseline.releaseVersion,pkg.version,'Baseline und Paketversion müssen übereinstimmen')
const [major,minor,feature,maintenance=0]=pkg.version.split('.').map(Number)
assert.ok(major>0||minor>9||(minor===9&&(feature>49||(feature===49&&maintenance>=1))),'Event-PoP-Zeitintervallfix darf nicht vor v0.9.49.1 liegen')
assert.ok(eventCenter.includes('periodLabel?:string'),'Event-Zeitleiste benötigt eine eindeutige Intervallbeschriftung')
for(const token of [
 "if(endStamp<=startStamp)endStamp=startStamp+60*60000",
 'intervalStart=intervalEnd-step',
 'overlapStart=Math.max(intervalStart,startStamp)',
 'overlapEnd=Math.min(intervalEnd,endStamp)',
 'if(overlapEnd<=overlapStart)continue',
 'fraction=(overlapEnd-overlapStart)/step',
 'periodLabel:`${clockFromCivilStamp(overlapStart)}–${clockFromCivilStamp(overlapEnd)}`',
 'precipitationProbability:hour.probability',
 'scaled(hour.precipitation)',
 'scaled(hour.rain)',
 'scaled(hour.showers)',
 'scaled(hour.snowfall)'
])assert.ok(planner.includes(token),`Event-Zeitintervallvertrag fehlt: ${token}`)
assert.ok(!planner.includes('row.stamp>=startStamp-30*60000&&row.stamp<=endStamp+30*60000'),'Die alte punktbasierte ±30-Minuten-Auswahl darf Niederschlagsintervalle nicht mehr bestimmen')
assert.ok(!planner.includes('· Zeitraum {formatNumber(eventPrecipProbability(plan.summary))} %'),'Die kompakte Eventdarstellung darf das Wort Zeitraum nicht mehr zusätzlich anzeigen')
assert.ok(planner.includes('<small>Niederschlag</small><strong><span className="event-precip-detail-symbol"'),'Die Niederschlagskachel muss die Zeitraum-PoP platzsparend mit Niederschlagsart-Symbol darstellen')
assert.ok(!planner.includes('{formatClock(plan.startTime)}–{formatClock(plan.endTime)} · {formatNumber(plan.summary.precipitationTotal,1)} mm'),'Die Niederschlagskachel darf den bereits im Kopf sichtbaren Eventzeitraum nicht doppelt anzeigen')
assert.ok(planner.includes('<time>{point.periodLabel||point.time}</time>'),'Stundenkarten müssen ihre tatsächlichen Niederschlagsintervalle anzeigen')
assert.ok(planner.includes('Die große Niederschlagswahrscheinlichkeit gilt für den gesamten Eventzeitraum'),'Infohilfe muss Zeitraum-PoP und Stunden-PoP unterscheiden')
console.log(`${pkg.version}: Event-Zeitraum-PoP und vorangehende Stundenintervalle semantisch ausgerichtet.`)
