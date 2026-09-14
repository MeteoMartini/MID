import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../src/App.tsx',import.meta.url),'utf8');
assert.ok(app.includes("ceilingCompactDetail=Number.isFinite(observedCeilingHft)?`Ceiling ${observedCeilingHft} hft`:ceilingFromModel?`Modell-Ceiling ~${modelCeilingHft} hft`"),'Aktuell muss beobachtetes Ceiling vor Modell-Ceiling priorisieren.');
assert.ok(app.includes("cloudVisibleDetail=[cloudCompactDetail,ceilingCompactDetail].filter(Boolean).join(' · ')"),'Bewölkungszustand und Ceiling müssen in der sichtbaren Kachel kombiniert werden.');
assert.ok(app.includes("label:'Bewölkung',value:`${cloudOktasValue}/8`,detail:cloudVisibleDetail"),'Die sichtbare Bewölkungskarte muss das Ceiling direkt ausgeben.');
assert.ok(app.includes("ceilingSourceLabel||'DWD ICON-D2-RUC · CEILING'"),'Modell-Ceiling muss die DWD-RUC-Provenienz behalten.');
console.log('Aktuell-Ceiling sichtbar: Beobachtung vor DWD-RUC-Modellwert, direkte Kachelausgabe: OK');
