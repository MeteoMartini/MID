import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const eventCenter=await readFile(new URL('../src/eventCenter.ts',import.meta.url),'utf8');
const planner=await readFile(new URL('../src/EventPlannerPanel.tsx',import.meta.url),'utf8');
const styles=await readFile(new URL('../src/styles.css',import.meta.url),'utf8');

assert.match(eventCenter,/export function sortEventCenterRecords\([\s\S]*?aDate-bDate/,'Event-Center muss standardmäßig chronologisch sortieren.');
assert.doesNotMatch(eventCenter,/sortEventCenterRecords\([\s\S]{0,260}a\.isFavorite!==b\.isFavorite/,'Favoriten dürfen die Standardsortierung nicht mehr erzwingen.');
assert.match(planner,/type EventSortMode='chronological'\|'favorites'\|'updated'\|'title'/,'Sortiermodi fehlen.');
assert.match(planner,/<option value="chronological">Chronologisch<\/option>/,'Chronologische Standardsortierung fehlt in der Auswahl.');
assert.match(planner,/<option value="favorites">Favoriten zuerst<\/option>/,'Favoritensortierung fehlt.');
assert.match(planner,/<option value="updated">Zuletzt geändert<\/option>/,'Änderungssortierung fehlt.');
assert.match(planner,/<option value="title">Titel A–Z<\/option>/,'Titelsortierung fehlt.');
assert.match(planner,/const \[sortMode,setSortMode\]=useState<EventSortMode>\(\(\)=>storedSortMode\(\)\)/,'Persistente Sortierauswahl fehlt.');
assert.match(styles,/\.event-center-sort\{/,'Sortiersteuerung ist nicht gestaltet.');

assert.match(planner,/const \[editingRecordId,setEditingRecordId\]=useState\(''\)/,'Bearbeitungszustand fehlt.');
assert.match(planner,/const id=editingRecordId\|\|currentSavedRecord\?\.id\|\|buildEventCenterId/,'Bearbeitete Events müssen ihre bestehende ID behalten.');
assert.match(planner,/setEditingRecordId\(record\.id\)/,'Geladenes Event wird nicht in den Bearbeitungsmodus übernommen.');
assert.match(planner,/<Pencil size=\{15\}\/> Bearbeiten/,'Explizite Bearbeiten-Aktion fehlt.');
assert.match(planner,/editingRecordId\?'Änderungen prüfen':'Wetter prüfen'/,'Bearbeitungs-CTA fehlt.');

assert.match(planner,/compactPrecipitationTypeLabel/,'Appweite Niederschlagsart-Beschriftung wird nicht verwendet.');
assert.match(planner,/const probabilityWinner=\[\.\.\.wet\]\.sort\(\(a,b\)=>\(b\.point\.precipitationProbability/,'Die angezeigte Niederschlagsart muss aus der höchsten plausiblen Wahrscheinlichkeit des Event-Zeitfensters stammen.');
assert.match(eventCenter,/precipitationProbabilityRelevant\?:number\|null/,'Relevante Niederschlagswahrscheinlichkeit fehlt im EventSummary.');
assert.match(eventCenter,/precipitationTypeLabel\?:string/,'Niederschlagsart-Label fehlt im EventSummary.');
assert.match(planner,/eventPrecipLabel\(plan\.summary\).*eventPrecipProbability\(plan\.summary\).*%/s,'Niederschlagsart und passende Wahrscheinlichkeit werden nicht gemeinsam ausgegeben.');

assert.match(planner,/Wind \$\{wind\(plan\.summary\.windMax[\s\S]*?· G \$\{wind\(plan\.summary\.gustMax/,'Event-Kompaktzeile muss Wind und Böen gemeinsam mit G-Kennzeichnung nennen.');
assert.match(planner,/Wind \{wind\(point\.wind[\s\S]*?· G \{wind\(point\.gust/,'Stündlicher Eventverlauf muss Wind und Böen gemeinsam mit G-Kennzeichnung nennen.');
assert.match(eventCenter,/rounded\(summary\.gustMax\)/,'Böen fehlen im Änderungs-Signaturvertrag.');
assert.match(eventCenter,/gustDelta/,'Böenänderungen werden im Event-Center nicht bewertet.');

console.log('MID v0.9.44.0: chronologische und wählbare Eventsortierung, echte Bearbeitung sowie gekoppelte Niederschlagsart/-wahrscheinlichkeit und Wind+Böen geprüft.');
