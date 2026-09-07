import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [warnings,weatherFragment,weather,cockpit,app,timeDisplay,settingsTest,pkgRaw,baselineRaw]=await Promise.all([
  readFile('src/dwdWarnings.ts','utf8'),
  readFile('src/weather-src/30-ensemble-climate-hazards.tsfrag','utf8'),
  readFile('src/weather.ts','utf8'),
  readFile('src/ForecastCockpit.tsx','utf8'),
  readFile('src/App.tsx','utf8'),
  readFile('src/timeDisplay.ts','utf8'),
  readFile('scripts/test-settings-navigation-polish-097917.mjs','utf8'),
  readFile('package.json','utf8'),
  readFile('MID_BASELINE.json','utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);

assert.equal(baseline.releaseVersion,pkg.version);
assert.equal(baseline.version,pkg.version);
assert.ok(!settingsTest.includes("assert.equal(pkg.version,'0.9.79.17')"),'Historischer UI-Test darf keine Patch-Version mehr fest verdrahten.');

assert.ok(warnings.includes('Anfänglich aus ${windDirectionAdjective(early)}, später aus ${windDirectionAdjective(late)} Richtung'),'Windrichtungswechsel muss schon im kanonischen Warnsignal erhalten bleiben.');
for(const token of [
  'function hazardWindDirectionNarrative(signal:DwdWarningSignal,hours:Hour[])',
  'hazardDirectionDifference(early,late)>=67.5',
  "formatDisplayDateTime(Number(transition.epoch),undefined,{hour:'2-digit',minute:'2-digit',hourCycle:'h23'})",
  'Anfänglich aus ${hazardDirectionAdjective(early)}, ${clock?`ab ${clock}`:\'später\'} aus ${hazardDirectionAdjective(late)} Richtung',
  'direction=hazardWindDirectionNarrative(signal,hours)'
]) assert.ok(weatherFragment.includes(token),`Windrichtungs-/Zeitbezug fehlt: ${token}`);
assert.ok(weather.includes('direction=hazardWindDirectionNarrative(signal,hours)'),'Aggregiertes weather.ts muss den kanonischen Windrichtungs-Narrativ enthalten.');

for(const token of [
  'validFrom?:string;validTo?:string',
  'matching.sort((a,b)=>(SHORT_TERM_HAZARD_LEVELS[b.level]??1)-(SHORT_TERM_HAZARD_LEVELS[a.level]??1)',
  'function shortTermImpactWindowLabel(impact:ShortTermImpact,timezone:string)',
  'meta:`Stufe ${maxImpact.level}${maxImpactWindow?` · ${maxImpactWindow}`:\'\'}`',
  '· Stufe ${item.impact.level}${shortTermImpactWindowLabel(item.impact,timezone)?` · Fenster ${shortTermImpactWindowLabel(item.impact,timezone)}`:\'\'}'
]) assert.ok(cockpit.includes(token),`Wetterprofil-Warnfenster/-stufe fehlt: ${token}`);

for(const token of [
  "export function localTimeDisambiguationSuffix(mode:TimeDisplayMode=readTimeDisplayMode()){return mode==='local'?'LT':''}",
  "markConvertedLocal=mode==='local'&&!localTimeZone&&displayOptionsContainClock(options)",
  'return markConvertedLocal?`${text} LT`:text'
]) assert.ok(timeDisplay.includes(token),`Lokale Zeitkennzeichnung fehlt: ${token}`);
assert.ok(app.includes("const localSuffix=localTimeDisambiguationSuffix(),suffix=localSuffix?` ${localSuffix}`:''"),'Automatische Warnfenster müssen die Lokalzeit-Kennzeichnung tragen.');
assert.ok(app.includes('Umgerechnete Quellzeiten tragen in Lokalzeit kompakt „LT“; bereits ortslokale Prognoseachsen bleiben unverändert.'),'Zeitbasis-Einstellung muss die LT-Regel transparent erklären.');
assert.ok(app.includes("const text=formatInZone(d,timezone,{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}),suffix=localTimeDisambiguationSuffix();return suffix?`${text} ${suffix}`:text"),'Amtliche absolute Warnzeiten müssen in Lokalzeit eindeutig gekennzeichnet werden.');

console.log(`MID v${pkg.version}: Windrichtung mit markanter Drehung, kanonische Warnfenster/-stufen im Wetterprofil, LT-Kennzeichnung und CI-Versionstest geprüft.`);
