import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const [app,weather,eventEngine,eventCenter,eventPanel,pkgRaw,baselineRaw]=await Promise.all([
 readFile(new URL('../src/App.tsx',import.meta.url),'utf8'),
 readFile(new URL('../src/weather.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventWeatherEngine.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8'),
 readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8'),
 readFile(new URL('../package.json',import.meta.url),'utf8'),
 readFile(new URL('../MID_BASELINE.json',import.meta.url),'utf8')
]);
const pkg=JSON.parse(pkgRaw),baseline=JSON.parse(baselineRaw);
assert.equal(pkg.version,baseline.releaseVersion,'Release und Baseline müssen synchron sein.');

assert.match(app,/mid:module-open-contract:v5/,'Modulzustandsmigration v5 fehlt.');
assert.match(app,/MODULES_DEFAULT_CLOSED=\['mountain','water','composite','ensemble','long-range'/,'Langfrist muss Teil des einheitlich standardmäßig geschlossenen Hauptmodulvertrags sein.');
assert.match(app,/id="long-range"[\s\S]{0,180}defaultOpen=\{false\}/,'Langfrist muss standardmäßig geschlossen sein.');

assert.ok(!eventPanel.includes('Pausen und Wasserstellen einplanen'),'Umgangssprachlicher Hitzeratschlag darf nicht mehr erscheinen.');
for(const token of ['Trinkwasserversorgung und regelmäßige Erholungspausen sicherstellen','Wetterbedingte Hinweise und Maßnahmen','Lagehinweise','Empfohlene Maßnahmen'])assert.ok(eventPanel.includes(token),`Seriöser Eventhinweis fehlt: ${token}`);
assert.ok(eventEngine.includes('Ausreichende Trinkwasserversorgung sicherstellen'),'Seriöse Hitzemaßnahme fehlt im Event-Engine-Vertrag.');

assert.match(weather,/dailyWindowMean=values\.reduce/,'DWD-Zeitfenster müssen gegen das Tagesfenster-Mittel bewertet werden.');
assert.match(weather,/highest-second>=10&&highest-dailyWindowMean>=15/,'Zeitfenster darf nur bei deutlich abweichender Wahrscheinlichkeit hervorgehoben werden.');
assert.match(weather,/if\(primary<=0\)return'0%'/,'0 % darf kein künstliches Zeitfenster tragen.');

assert.match(eventEngine,/durationMinutes:Math\.max\(1,Math\.round\(\(overlapEnd-overlapStart\)\/60000\)\)/,'Eventzeitraum muss anteilige Zeitabdeckung speichern.');
assert.match(eventEngine,/windowAverageProbability=coveredMinutes>0\?probabilityRows\.reduce/,'Fallback-PoP muss den gesamten Eventzeitraum gewichten.');
assert.match(eventEngine,/precipitationProbabilityRelevant=eventProbability\?\.probability\?\?windowAverageProbability/,'Event-PoP darf nicht auf die höchste Einzelstunde zurückfallen.');
assert.ok(eventCenter.includes("'hourly-window-average-fallback'"),'EventSummary muss den Zeitraum-Fallback transparent kennzeichnen.');

for(const token of ['DWD ICON-D2 · 2 km','ΔT ','Gelände-/Oberflächenkorrektur','°','±','ü. NHN'])assert.ok(app.includes(token)||weather.includes(token),`Aktuelle Wetterdarstellung/Unicode-Vertrag fehlt: ${token}`);
assert.ok(app.includes('Temp./Wind nahe Modell'),'Marginale Hyperlokalkorrekturen sollen wieder kompakt als Modellnähe zusammengefasst werden.');
for(const token of ['<strong>Datenbasis</strong>','<b>Modellhintergrund</b>','Messwertquellen','Kontext: {st.localContextSource}'])assert.ok(app.includes(token),`Detaillierte Datenbasisinformation fehlt: ${token}`);

console.log(`MID v${pkg.version}: Modulzustand, Eventhinweise, DWD-PoP-Zeitfenster, Event-Zeitraum-PoP und aktuelle Hyperlokalkacheln geprüft.`);
