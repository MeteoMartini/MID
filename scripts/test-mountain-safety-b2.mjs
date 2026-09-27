import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const [app,styles,entry]=await Promise.all([
 readFile(path.join(root,'src/App.tsx'),'utf8'),
 readFile(path.join(root,'src/midC18WorkPackageB2MountainSafety.css'),'utf8'),
 readFile(path.join(root,'src/main.tsx'),'utf8'),
]);

const start=app.indexOf('function MountainWinterGuidance(');
const end=app.indexOf('function MountainRapidDataNotice(',start);
assert.ok(start>=0&&end>start,'Die aktive Schnee- und Eis-Hinweisfläche muss vorhanden sein.');
const guidance=app.slice(start,end);
assert.match(guidance,/officialAlertKind\(alert\)/,'Die amtliche Warnfilterung muss dieselbe etablierte Warnart-Erkennung nutzen.');
assert.match(guidance,/officialAlertIsRelevant\(alert\)/,'Die bestehende Relevanzfilterung amtlicher Warnungen muss erhalten bleiben.');
assert.match(guidance,/automaticHazardIsRelevant\(item\)/,'Die bestehende Relevanzfilterung automatischer Hinweise muss erhalten bleiben.');
assert.match(guidance,/AMTLICHE QUELLE/,'Der amtliche Warnquellenstatus muss sichtbar sein.');
assert.match(guidance,/mountainOfficialWarningType\(alert\)/,'Amtliche Warnart muss in der Statuszeile stehen.');
assert.match(guidance,/mountainOfficialLevelLabel\(alert\.level\)/,'Die amtlich gelieferte Warnstufe muss unmittelbar sichtbar sein.');
assert.match(guidance,/officialAlertValidity\(alert,timezone\)/,'Der amtliche Gültigkeitszeitraum muss sichtbar bleiben.');
assert.match(guidance,/alert\.source/,'Der konkrete Warnquellenname muss je Meldung erhalten bleiben.');
assert.match(guidance,/Meldungstext und Verhalten/,'Amtliche Langtexte müssen aufklappbar verfügbar bleiben.');
assert.match(guidance,/<details className="mountain-warning-details"/,'Warntexte dürfen nur in geschlossenen Details inline verborgen sein.');
assert.doesNotMatch(guidance,/alert\.description&&<p className="mountain-warning-inline"/,'Amtliche Beschreibungen dürfen nicht dauerhaft inline stehen.');
assert.match(guidance,/MID · MODELLBASIERT/,'Automatische MID-Prognosen müssen klar als modellbasiert gekennzeichnet sein.');
assert.match(guidance,/Prognosehinweis im Detail/,'Der vollständige automatische Prognosetext muss aufklappbar bleiben.');
assert.match(guidance,/loading\?'Abfrage läuft':error\?'Nicht verfügbar':'Abruf erfolgreich'/,'Der offizielle Verfügbarkeitsstatus muss Lade-, Fehler- und Erfolgszustände abbilden.');

const avalancheStart=app.indexOf('function MountainAvalancheStatus(');
const avalancheEnd=app.indexOf('function MountainRapidDataNotice(',avalancheStart);
assert.ok(avalancheStart>=0&&avalancheEnd>avalancheStart,'Ein eigener Lawinenstatusblock muss vorhanden sein.');
const avalanche=app.slice(avalancheStart,avalancheEnd);
assert.match(avalanche,/mountainAvalancheUrl\(loc\)/,'Der bestehende ortsabhängige amtliche Link muss weiterverwendet werden.');
assert.match(avalanche,/mountainAvalancheSourceName\(url\)/,'Die konkrete externe Lawinenquelle muss benannt werden.');
assert.match(avalanche,/Stand \/ Aktualität/,'Der Hinweis auf den Stand im amtlichen Lagebericht muss sichtbar sein.');
assert.match(avalanche,/Abruf nicht lokal geprüft; Direktlink verfügbar/,'Eine nicht vorhandene lokale Liveprüfung darf nicht vorgetäuscht werden.');
assert.match(avalanche,/Amtlichen Lawinenlagebericht öffnen/,'Der separate Link zur amtlichen Lawinenlage muss klar beschriftet sein.');
assert.doesNotMatch(avalanche,/Lawinenstufe|Gefahrenstufe|Avalanche Level/i,'Ohne Datenquelle darf keine Lawinenstufe angezeigt werden.');

const methodologyStart=app.indexOf('function MountainMethodologyDisclosure(');
const methodologyEnd=app.indexOf('function MountainSki(',methodologyStart);
const methodology=app.slice(methodologyStart,methodologyEnd);
assert.match(methodology,/mountain-methodology-rows/,'Methodik und Sicherheit müssen in kurze Zeilen gegliedert sein.');
for(const label of ['Schneefallgrenze','Wolkenuntergrenze','Tageslicht','Betrieb &amp; Sicherheit'])assert.ok(methodology.includes(label),`Methodik-Zeile fehlt: ${label}`);
assert.doesNotMatch(methodology,/<p>/,'Die Methodik darf nicht wieder als einzelner langer Absatz erscheinen.');
assert.match(app,/\{winter&&<MountainWinterGuidance[\s\S]*?<MountainAvalancheStatus loc=\{loc\}/,'Warnungen und Lawinenstatus müssen im aktiven Bergprofil erscheinen.');

assert.match(entry,/midC18WorkPackageB2MountainSafety\.css/,'Die B2-Oberflächenregeln müssen tatsächlich geladen werden.');
assert.match(styles,/\.mountain-ski \.mountain-winter-source li\.mountain-warning-row/,'Warnmeldungen müssen kompakt in neutralen Statuszeilen liegen.');
assert.match(styles,/\.mountain-warning-level\[data-level="red"\]/,'Die Warnstufenfarbe muss an die amtliche Warnstufe gebunden sein.');
assert.match(styles,/@media \(max-width: 620px\)/,'Die aktiven Warnungs- und Lawinenflächen müssen auf schmalen Viewports umfließen.');
assert.doesNotMatch(`${guidance}${avalanche}${methodology}`,/ChatGPT|Prompt|Debug|Agent/i,'Interne Arbeitsbegriffe dürfen nicht in den aktiven Oberflächen stehen.');

console.log('MID 18.2.15 B2: kompakte Warnungszeilen, transparenter Lawinenstatus und gegliederte Methodik geprüft.');