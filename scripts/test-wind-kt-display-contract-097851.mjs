import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const read=path=>readFile(new URL(`../${path}`,import.meta.url),'utf8');
const [app,weather,dwd,travel,thunder,extreme,contract]=await Promise.all([
  read('src/App.tsx'),read('src/weather.ts'),read('src/dwdWarnings.ts'),read('src/TravelPlannerPanel.tsx'),read('src/thunderstorm.ts'),read('src/ExtremeWeatherOutlookPanel.tsx'),read('MID_WARNING_HYBRID_CONTRACT.md')
]);

// Interner Open-Meteo/API-Key darf weiterhin "kn" heißen; sichtbare MID-Ausgabe muss "kt" heißen.
assert.ok(app.includes("['kn','kt','Knoten']"),'Einheitenauswahl muss den internen kn-Key sichtbar als kt beschriften.');
assert.ok(weather.includes("return`${Math.round(v)} kt`"),'Kanonischer wind()-Formatter muss den internen kn-Wert als kt ausgeben.');
assert.ok(dwd.includes("`${rounded(value/KMH_PER_KT)} kt`"),'DWD-Formatter muss Knoten als kt ausgeben.');
assert.ok(travel.includes("unit==='kn'?'kt'"),'Reiseplaner muss kn intern auf kt sichtbar abbilden.');
assert.ok(thunder.includes("unit==='kn')return`${Math.round(kmh/1.852)} kt`"),'Gewittermodul muss Knoten als kt ausgeben.');
assert.ok(extreme.includes("unit==='kn'?'kt':unit"),'Extremwetter muss kn intern auf kt für Warnwerte abbilden.');

// Amtliche Warnung: direkte offizielle Werte dürfen aus kn/kt gelesen werden, die MID-Kurzzeile beschriftet aber kt.
assert.ok(app.includes("(?:kn|kt|knoten)"),'Amtliche Originalwerte in kn/kt müssen weiterhin erkannt werden.');
assert.ok(app.includes("`${Math.round(value)} kt`"),'MID-Kurzzeile muss den übernommenen Knotenwert als kt ausgeben.');
assert.ok(app.includes('<p>{a.description}</p>'),'Amtlicher Originaltext muss unverändert gerendert werden.');
assert.ok(contract.includes('sichtbare Knoten-Abkürzung in MID-generierten Inhalten lautet ausschließlich `kt`'),'kt-Anzeigevertrag fehlt.');
assert.ok(contract.includes('amtliche Originaltexte werden unverändert wiedergegeben'),'Ausnahme für amtliche Originaltexte fehlt.');

console.log('MID: sichtbare Knotenwerte verwenden ausschließlich kt; amtliche Originaltexte bleiben unverändert.');
